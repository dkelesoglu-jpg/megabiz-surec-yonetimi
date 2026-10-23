import { ForbiddenError, ValidationError, type AdminApi } from './api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, createDemoState, demoMessagesPerDay, type DemoState } from './demoData';
import { can, canEnterPanel, type Permission } from './permissions';
import { addDays, channelHasValidRights, todayIso } from './rights';
import type {
  AdPlacementInput,
  AdminUser,
  AnnouncementInput,
  AppSettings,
  AuditEntry,
  Category,
  ChannelInput,
  ModerationAction,
  ReportStatus,
  RightInput,
  Role,
} from './types';
import { validateAdPlacement, validateAnnouncement, validateChannel, validateRight, validateVersion } from './validation';

/**
 * Bellekte çalışan demo sunucu. Gerçek sunucudaki kuralların aynısını uygular:
 * her işlemde izin kontrolü (RLS / RPC karşılığı), profil korumaları
 * (guard_profile_update karşılığı) ve değiştirilemez denetim kaydı (audit_row_change karşılığı).
 * Arayüz bir düğmeyi gizlemeyi unutsa bile işlem burada reddedilir.
 */
export class DemoAdminApi implements AdminApi {
  readonly mode = 'demo' as const;
  private state: DemoState;
  private audit: AuditEntry[] = [];
  private session: AdminUser | null = null;
  private seq = 0;
  private readonly now: () => Date;

  constructor(options: { now?: () => Date; state?: DemoState } = {}) {
    this.now = options.now ?? (() => new Date());
    this.state = options.state ?? createDemoState(this.now());
  }

  // --- Oturum -------------------------------------------------------------
  async signIn(email: string, password: string): Promise<AdminUser> {
    const account = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
    if (!account || password !== DEMO_PASSWORD) throw new ValidationError('E-posta veya şifre hatalı.');
    const profile = this.state.profiles.find((p) => p.id === account.id);
    if (!profile || profile.isBanned) throw new ForbiddenError('Hesap kullanıma kapalı.');
    if (!canEnterPanel(profile.role)) throw new ForbiddenError('Bu hesabın yönetim paneline erişim yetkisi yok.');
    this.session = { id: profile.id, email: profile.email, username: profile.username, role: profile.role };
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  async currentUser(): Promise<AdminUser | null> {
    return this.session;
  }

  /** Testler ve sayfa yenilemede oturumu geri yüklemek için. */
  restoreSession(userId: string): AdminUser | null {
    const p = this.state.profiles.find((x) => x.id === userId);
    if (!p || p.isBanned || !canEnterPanel(p.role)) return null;
    this.session = { id: p.id, email: p.email, username: p.username, role: p.role };
    return this.session;
  }

  // --- Yardımcılar ----------------------------------------------------------
  private require(permission: Permission): AdminUser {
    const actor = this.session;
    // Rol her işlemde güncel profilden okunur (oturum açıkken rolü düşürülen kullanıcı da durdurulur).
    const role = actor ? this.state.profiles.find((p) => p.id === actor.id)?.role : undefined;
    if (!actor || !can(role, permission)) throw new ForbiddenError();
    return actor;
  }

  private id(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${Date.now().toString(36)}-${this.seq}`;
  }

  private log(action: AuditEntry['action'], entity: string, entityId: string | null, summary: string): void {
    this.audit.unshift({
      id: this.id('audit'),
      actorName: this.session?.username ?? null,
      action,
      entity,
      entityId,
      summary,
      createdAt: this.now().toISOString(),
    });
  }

  private clone<T>(value: T): T {
    return structuredClone(value);
  }

  // --- Pano -----------------------------------------------------------------
  async dashboardStats() {
    this.require('dashboard.read');
    const now = this.now();
    const today = todayIso(now);
    const s = this.state;
    const dayAgo = now.getTime() - 86_400_000;
    const weekAgo = now.getTime() - 7 * 86_400_000;
    return {
      usersTotal: s.profiles.length,
      usersBanned: s.profiles.filter((p) => p.isBanned).length,
      usersNew7d: s.profiles.filter((p) => Date.parse(p.createdAt) > weekAgo).length,
      channelsTotal: s.channels.length,
      channelsLive: s.channels.filter((c) => c.isActive && channelHasValidRights(s.rights, c.id, today)).length,
      rightsExpiring14d: s.rights.filter((r) => r.status === 'verified' && r.validUntil >= today && r.validUntil <= addDays(today, 14)).length,
      messages24h: s.messages.filter((m) => Date.parse(m.createdAt) > dayAgo).length,
      reportsOpen: s.reports.filter((r) => r.status === 'open').length,
      messagesPerDay: demoMessagesPerDay(now),
    };
  }

  // --- Kategoriler ve kanallar ---------------------------------------------
  async listCategories() {
    return this.clone([...this.state.categories].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async saveCategory(category: Category) {
    this.require('channels.manage');
    if (!/^[a-z][a-z0-9_]{1,30}$/.test(category.key)) throw new ValidationError('Kategori anahtarı geçersiz.');
    if (!category.nameTr.trim() || !category.nameEn.trim()) throw new ValidationError('Türkçe ve İngilizce ad zorunlu.');
    const i = this.state.categories.findIndex((c) => c.key === category.key);
    if (i >= 0) this.state.categories[i] = this.clone(category);
    else this.state.categories.push(this.clone(category));
    this.log(i >= 0 ? 'update' : 'insert', 'channel_categories', category.key, `Kategori: ${category.nameTr}`);
  }

  async listChannels() {
    this.require('channels.manage');
    return this.clone([...this.state.channels].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  private checkChannel(input: ChannelInput, ignoreId?: string) {
    validateChannel(input);
    if (!this.state.categories.some((c) => c.key === input.category)) throw new ValidationError('Kategori tanımlı değil.');
    if (this.state.channels.some((c) => c.slug === input.slug && c.id !== ignoreId)) {
      throw new ValidationError('Bu kısa ad başka bir kanalda kullanılıyor.');
    }
  }

  async createChannel(input: ChannelInput) {
    this.require('channels.manage');
    this.checkChannel(input);
    const channel = { ...this.clone(input), id: this.id('ch') };
    this.state.channels.push(channel);
    this.log('insert', 'channels', channel.id, `Kanal eklendi: ${channel.name}`);
    return this.clone(channel);
  }

  async updateChannel(id: string, input: ChannelInput) {
    this.require('channels.manage');
    const i = this.state.channels.findIndex((c) => c.id === id);
    if (i < 0) throw new ValidationError('Kanal bulunamadı.');
    this.checkChannel(input, id);
    const channel = { ...this.clone(input), id };
    this.state.channels[i] = channel;
    this.log('update', 'channels', id, `Kanal güncellendi: ${channel.name}`);
    return this.clone(channel);
  }

  // --- Yayın hakları -------------------------------------------------------
  async listRights() {
    this.require('rights.manage');
    return this.clone(this.state.rights);
  }

  async createRight(input: RightInput) {
    this.require('rights.manage');
    validateRight(input);
    if (!this.state.channels.some((c) => c.id === input.channelId)) throw new ValidationError('Kanal bulunamadı.');
    const right = { ...this.clone(input), id: this.id('r') };
    this.state.rights.push(right);
    this.log('insert', 'broadcast_rights', right.id, `Yayın hakkı eklendi: ${right.rightsHolder}`);
    return this.clone(right);
  }

  async updateRight(id: string, input: RightInput) {
    this.require('rights.manage');
    validateRight(input);
    const i = this.state.rights.findIndex((r) => r.id === id);
    if (i < 0) throw new ValidationError('Kayıt bulunamadı.');
    const right = { ...this.clone(input), id };
    this.state.rights[i] = right;
    this.log('update', 'broadcast_rights', id, `Yayın hakkı güncellendi (${right.status}): ${right.rightsHolder}`);
    return this.clone(right);
  }

  // --- Kullanıcılar ----------------------------------------------------------
  async listProfiles() {
    this.require('users.read');
    return this.clone(this.state.profiles.map(({ email: _email, ...p }) => p));
  }

  private target(userId: string) {
    const p = this.state.profiles.find((x) => x.id === userId);
    if (!p) throw new ValidationError('Kullanıcı bulunamadı.');
    return p;
  }

  private activeAdmins() {
    return this.state.profiles.filter((p) => p.role === 'admin' && !p.isBanned).length;
  }

  async moderateUser(userId: string, action: ModerationAction, reason?: string, minutes = 60 * 24) {
    const actor = this.require('users.moderate');
    const target = this.target(userId);
    if (target.id === actor.id) throw new ForbiddenError('Kendi durumunuzu değiştiremezsiniz.');
    if (target.role === 'admin' && actor.role !== 'admin') throw new ForbiddenError('Yöneticileri yalnızca yöneticiler kısıtlayabilir.');
    if (action === 'ban' && target.role === 'admin' && this.activeAdmins() <= 1) throw new ForbiddenError('Son aktif yönetici yasaklanamaz.');
    switch (action) {
      case 'mute': target.mutedUntil = new Date(this.now().getTime() + minutes * 60_000).toISOString(); break;
      case 'unmute': target.mutedUntil = null; break;
      case 'ban': target.isBanned = true; break;
      case 'unban': target.isBanned = false; break;
    }
    const labels: Record<ModerationAction, string> = { mute: 'susturuldu', unmute: 'susturma kaldırıldı', ban: 'yasaklandı', unban: 'yasak kaldırıldı' };
    this.log('update', 'profiles', userId, `${target.username} ${labels[action]}${reason ? ` — ${reason}` : ''}`);
  }

  async setRole(userId: string, role: Role) {
    const actor = this.require('users.manage_roles');
    const target = this.target(userId);
    if (target.id === actor.id) throw new ForbiddenError('Kendi rolünüzü değiştiremezsiniz.');
    if (target.role === 'admin' && role !== 'admin' && this.activeAdmins() <= 1) throw new ForbiddenError('Son aktif yönetici düşürülemez.');
    const old = target.role;
    target.role = role;
    this.log('update', 'profiles', userId, `${target.username}: rol ${old} → ${role}`);
  }

  // --- Moderasyon -------------------------------------------------------------
  async listReports() {
    this.require('reports.manage');
    return this.clone(this.state.reports.map(({ reporterId: _r, ...rep }) => rep))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listMessages() {
    this.require('chat.moderate');
    return this.clone([...this.state.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async resolveReport(reportId: string, status: ReportStatus, hideMessage: boolean) {
    this.require('reports.manage');
    const report = this.state.reports.find((r) => r.id === reportId);
    if (!report) throw new ValidationError('Şikâyet bulunamadı.');
    if (hideMessage) this.require('chat.moderate');
    report.status = status;
    this.log('update', 'reports', reportId, `Şikâyet ${status === 'actioned' ? 'işleme alındı' : status === 'dismissed' ? 'reddedildi' : 'yeniden açıldı'}`);
    if (hideMessage && report.messageId) await this.setMessageHidden(report.messageId, true);
  }

  async setMessageHidden(messageId: string, hidden: boolean) {
    this.require('chat.moderate');
    const m = this.state.messages.find((x) => x.id === messageId);
    if (!m) throw new ValidationError('Mesaj bulunamadı.');
    m.isHidden = hidden;
    this.log('update', 'chat_messages', messageId, `Mesaj ${hidden ? 'gizlendi' : 'yeniden gösterildi'}: “${m.body.slice(0, 40)}”`);
  }

  // --- Reklam alanları -------------------------------------------------------
  async listAdPlacements() {
    this.require('ads.manage');
    return this.clone(this.state.ads);
  }

  async saveAdPlacement(id: string | null, input: AdPlacementInput) {
    this.require('ads.manage');
    validateAdPlacement(input);
    if (this.state.ads.some((a) => a.key === input.key && a.id !== id)) throw new ValidationError('Bu anahtar kullanılıyor.');
    const ad = { ...this.clone(input), id: id ?? this.id('ad') };
    const i = this.state.ads.findIndex((a) => a.id === id);
    if (i >= 0) this.state.ads[i] = ad;
    else this.state.ads.push(ad);
    this.log(i >= 0 ? 'update' : 'insert', 'ad_placements', ad.key, `Reklam alanı ${ad.isEnabled ? 'açık' : 'kapalı'}: ${ad.name}`);
    return this.clone(ad);
  }

  // --- Ayarlar ve duyurular ----------------------------------------------------
  async getSettings() {
    this.require('dashboard.read');
    return this.clone(this.state.settings);
  }

  async saveSettings(settings: AppSettings) {
    this.require('settings.manage');
    const { languages, appVersion } = settings;
    if (languages.supported.length === 0) throw new ValidationError('En az bir dil seçilmeli.');
    if (!languages.supported.includes(languages.default)) throw new ValidationError('Varsayılan dil desteklenen diller arasında olmalı.');
    validateVersion(appVersion.android.latest, appVersion.android.minSupported);
    validateVersion(appVersion.ios.latest, appVersion.ios.minSupported);
    this.state.settings = this.clone(settings);
    this.log('update', 'app_settings', null, 'Uygulama ayarları güncellendi');
  }

  async listAnnouncements() {
    this.require('dashboard.read');
    return this.clone(this.state.announcements);
  }

  async saveAnnouncement(id: string | null, input: AnnouncementInput) {
    this.require('announcements.manage');
    validateAnnouncement(input);
    const a = { ...this.clone(input), id: id ?? this.id('ann') };
    const i = this.state.announcements.findIndex((x) => x.id === id);
    if (i >= 0) this.state.announcements[i] = a;
    else this.state.announcements.unshift(a);
    this.log(i >= 0 ? 'update' : 'insert', 'announcements', a.id, `Duyuru: ${a.titleTr}`);
    return this.clone(a);
  }

  // --- Denetim kaydı -------------------------------------------------------------
  async listAudit() {
    this.require('audit.read');
    return this.clone(this.audit);
  }
}
