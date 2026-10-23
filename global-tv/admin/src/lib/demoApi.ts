import { ForbiddenError, ValidationError, checkDocument, type AdminApi } from './api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, createDemoState, type DemoState } from './demoData';
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
  DayCount,
  KeyCount,
  LogAction,
  ModerationAction,
  ReportStatus,
  RightInput,
  Role,
  RoomSettingsInput,
  SponsorshipInput,
} from './types';
import {
  validateAdPlacement,
  validateAnnouncement,
  validateChannel,
  validateRight,
  validateRoom,
  validateSponsorship,
  validateVersion,
} from './validation';

/**
 * Bellekte çalışan demo sunucu. Gerçek sunucudaki kuralların aynısını uygular:
 * her işlemde izin kontrolü (RLS / RPC karşılığı), profil korumaları
 * (guard_profile_update), moderasyon kaydı (log_message_moderation) ve
 * değiştirilemez denetim kaydı (audit_row_change). Arayüz bir düğmeyi gizlemeyi
 * unutsa bile işlem burada reddedilir.
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
    if (!account || password !== DEMO_PASSWORD) throw new ValidationError('err.credentials');
    const profile = this.state.profiles.find((p) => p.id === account.id);
    if (!profile || profile.isBanned) throw new ForbiddenError('err.accountDisabled');
    if (!canEnterPanel(profile.role)) throw new ForbiddenError('err.noPanelAccess');
    this.session = { id: profile.id, email: profile.email, username: profile.username, role: profile.role };
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  async currentUser(): Promise<AdminUser | null> {
    return this.session;
  }

  // --- Yardımcılar ----------------------------------------------------------
  private role(): Role | undefined {
    const actor = this.session;
    // Rol her işlemde güncel profilden okunur (oturum açıkken rolü düşürülen kullanıcı da durdurulur).
    return actor ? this.state.profiles.find((p) => p.id === actor.id)?.role : undefined;
  }

  private require(permission: Permission): AdminUser {
    if (!this.session || !can(this.role(), permission)) throw new ForbiddenError();
    return this.session;
  }

  private id(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.now().getTime().toString(36)}-${this.seq}`;
  }

  private log(action: AuditEntry['action'], entity: string, entityId: string | null, label: string, detail: string | null = null): void {
    this.audit.unshift({
      id: this.id('audit'), actorName: this.session?.username ?? null, action, entity, entityId, label, detail,
      createdAt: this.now().toISOString(),
    });
  }

  private modLog(action: LogAction, targetName: string, reason: string | null, excerpt: string | null = null): void {
    this.state.modLog.unshift({
      id: this.id('log'), moderatorName: this.session?.username ?? '', targetName, action, reason,
      messageExcerpt: excerpt, createdAt: this.now().toISOString(),
    });
  }

  private clone<T>(value: T): T {
    return structuredClone(value);
  }

  private since(days: number): string {
    return addDays(todayIso(this.now()), -(Math.max(1, Math.min(days, 365)) - 1));
  }

  private perDay(days: number, fill: (day: string) => number): DayCount[] {
    const out: DayCount[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const day = addDays(todayIso(this.now()), -d);
      out.push({ day, count: fill(day) });
    }
    return out;
  }

  // --- Pano ve raporlar -----------------------------------------------------
  async dashboardStats() {
    this.require('dashboard.read');
    const now = this.now();
    const today = todayIso(now);
    const s = this.state;
    const dayAgo = now.getTime() - 86_400_000;
    const weekAgo = now.getTime() - 7 * 86_400_000;
    const weekStart = addDays(today, -6);
    return {
      usersTotal: s.profiles.length,
      usersBanned: s.profiles.filter((p) => p.isBanned).length,
      usersNew7d: s.profiles.filter((p) => Date.parse(p.createdAt) > weekAgo).length,
      activeUsers1d: new Set(s.activity.filter((a) => a.day === today).map((a) => a.userId)).size,
      activeUsers7d: new Set(s.activity.filter((a) => a.day >= weekStart).map((a) => a.userId)).size,
      channelsTotal: s.channels.length,
      channelsLive: s.channels.filter((c) => c.isActive && channelHasValidRights(s.rights, c.id, today)).length,
      rightsExpiring14d: s.rights.filter((r) => r.status === 'verified' && r.validUntil >= today && r.validUntil <= addDays(today, 14)).length,
      watchMinutes24h: s.watch.filter((w) => w.day === today).reduce((n, w) => n + w.minutes, 0),
      messages24h: s.messages.filter((m) => Date.parse(m.createdAt) > dayAgo).length,
      reportsOpen: s.reports.filter((r) => r.status === 'open').length,
      watchPerDay: this.perDay(7, (day) => s.watch.filter((w) => w.day === day).reduce((n, w) => n + w.minutes, 0)),
    };
  }

  async report(days: number) {
    this.require('reports.read');
    const s = this.state;
    const since = this.since(days);
    const span = Math.max(1, Math.min(days, 365));
    const count = <T>(items: T[], key: (x: T) => string): KeyCount[] => {
      const m = new Map<string, number>();
      for (const x of items) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
      return [...m].map(([k, n]) => ({ key: k, count: n })).sort((a, b) => b.count - a.count);
    };
    const watch = s.watch.filter((w) => w.day >= since);
    const byChannel = new Map<string, { minutes: number; sessions: number }>();
    for (const w of watch) {
      const c = byChannel.get(w.channelId) ?? { minutes: 0, sessions: 0 };
      byChannel.set(w.channelId, { minutes: c.minutes + w.minutes, sessions: c.sessions + w.sessions });
    }
    const today = todayIso(this.now());
    const todaysMessages = s.messages.filter((m) => m.createdAt.slice(0, 10) === today).length;
    return {
      days: span,
      signupsPerDay: this.perDay(span, (day) => s.profiles.filter((p) => p.createdAt.slice(0, 10) === day).length),
      activePerDay: this.perDay(span, (day) => s.activity.filter((a) => a.day === day).length),
      usersByCountry: count(s.profiles, (p) => p.countryCode ?? '??'),
      watchByPlatform: (['android', 'ios'] as const).map((p) => ({ key: p, count: watch.filter((w) => w.platform === p).reduce((n, w) => n + w.minutes, 0) })),
      watchByChannel: [...byChannel].map(([channelId, v]) => ({
        channelId, channelName: s.channels.find((c) => c.id === channelId)?.name ?? channelId, ...v,
      })).sort((a, b) => b.minutes - a.minutes),
      messagesPerDay: this.perDay(span, (day) => day === today ? todaysMessages : s.messageHistory.find((h) => h.day === day)?.count ?? 0),
      reportsByReason: count(s.reports.filter((r) => r.createdAt.slice(0, 10) >= since), (r) => r.reason),
      moderationByAction: count(s.modLog.filter((l) => l.createdAt.slice(0, 10) >= since), (l) => l.action),
      ads: can(this.role(), 'ads.manage') ? { impressions: 0, clicks: 0 } : null,
    };
  }

  // --- Kategoriler ve kanallar ---------------------------------------------
  async listCategories() {
    return this.clone([...this.state.categories].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async saveCategory(category: Category) {
    this.require('channels.manage');
    if (!/^[a-z][a-z0-9_]{1,30}$/.test(category.key)) throw new ValidationError('err.categoryKey');
    if (!category.nameTr.trim() || !category.nameEn.trim()) throw new ValidationError('err.bilingualName');
    const i = this.state.categories.findIndex((c) => c.key === category.key);
    if (i >= 0) this.state.categories[i] = this.clone(category);
    else this.state.categories.push(this.clone(category));
    this.log(i >= 0 ? 'update' : 'insert', 'channel_categories', category.key, category.nameTr);
  }

  async listChannels() {
    this.require('channels.manage');
    return this.clone([...this.state.channels].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  /** Kanal adları: kanal yönetimi izni olmayanlar (moderatör) da oda adlarını görebilmeli. */
  private channelName(id: string): string {
    return this.state.channels.find((c) => c.id === id)?.name ?? id;
  }

  private checkChannel(input: ChannelInput, ignoreId?: string) {
    validateChannel(input);
    if (!this.state.categories.some((c) => c.key === input.category)) throw new ValidationError('err.categoryUnknown');
    if (this.state.channels.some((c) => c.slug === input.slug && c.id !== ignoreId)) throw new ValidationError('err.slugTaken');
  }

  async createChannel(input: ChannelInput) {
    this.require('channels.manage');
    this.checkChannel(input);
    const channel = { ...this.clone(input), id: this.id('ch') };
    this.state.channels.push(channel);
    this.log('insert', 'channels', channel.id, channel.name);
    return this.clone(channel);
  }

  async updateChannel(id: string, input: ChannelInput) {
    this.require('channels.manage');
    const i = this.state.channels.findIndex((c) => c.id === id);
    if (i < 0) throw new ValidationError('err.notFound');
    this.checkChannel(input, id);
    const channel = { ...this.clone(input), id };
    this.state.channels[i] = channel;
    this.log('update', 'channels', id, channel.name);
    return this.clone(channel);
  }

  // --- Yayın lisansları ----------------------------------------------------
  async listRights() {
    this.require('rights.manage');
    return this.clone(this.state.rights);
  }

  async createRight(input: RightInput) {
    this.require('rights.manage');
    validateRight(input);
    if (!this.state.channels.some((c) => c.id === input.channelId)) throw new ValidationError('err.notFound');
    const right = { ...this.clone(input), id: this.id('r'), documentName: null };
    this.state.rights.push(right);
    this.log('insert', 'broadcast_rights', right.id, right.rightsHolder);
    return this.clone(right);
  }

  async updateRight(id: string, input: RightInput) {
    this.require('rights.manage');
    validateRight(input);
    const i = this.state.rights.findIndex((r) => r.id === id);
    if (i < 0) throw new ValidationError('err.notFound');
    const right = { ...this.clone(input), id, documentName: this.state.rights[i]!.documentName };
    this.state.rights[i] = right;
    this.log('update', 'broadcast_rights', id, right.rightsHolder, right.status);
    return this.clone(right);
  }

  async uploadRightDocument(rightId: string, file: File) {
    this.require('rights.manage');
    checkDocument(file);
    const right = this.state.rights.find((r) => r.id === rightId);
    if (!right) throw new ValidationError('err.notFound');
    const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : `blob:demo/${file.name}`;
    this.state.documents[rightId] = { name: file.name, url };
    right.documentName = file.name;
    this.log('update', 'broadcast_rights', rightId, right.rightsHolder, file.name);
    return this.clone(right);
  }

  async rightDocumentUrl(rightId: string) {
    this.require('rights.manage');
    const doc = this.state.documents[rightId];
    if (!doc) throw new ValidationError('err.notFound');
    return doc.url;
  }

  // --- Kullanıcılar ve moderasyon ------------------------------------------
  async listProfiles() {
    this.require('users.read');
    return this.clone(this.state.profiles.map(({ email: _email, ...p }) => p));
  }

  private target(userId: string) {
    const p = this.state.profiles.find((x) => x.id === userId);
    if (!p) throw new ValidationError('err.notFound');
    return p;
  }

  private activeAdmins() {
    return this.state.profiles.filter((p) => p.role === 'admin' && !p.isBanned).length;
  }

  async moderateUser(userId: string, action: ModerationAction, reason?: string, minutes = 60 * 24) {
    const actor = this.require('users.moderate');
    const target = this.target(userId);
    if (target.id === actor.id) throw new ForbiddenError('err.selfChange');
    if (target.role === 'admin' && this.role() !== 'admin') throw new ForbiddenError('err.adminOnly');
    if (action === 'ban' && target.role === 'admin' && this.activeAdmins() <= 1) throw new ForbiddenError('err.lastAdmin');
    switch (action) {
      case 'mute': target.mutedUntil = new Date(this.now().getTime() + minutes * 60_000).toISOString(); break;
      case 'unmute': target.mutedUntil = null; break;
      case 'ban': target.isBanned = true; break;
      case 'unban': target.isBanned = false; break;
    }
    this.modLog(action, target.username, reason ?? null);
    this.log('update', 'profiles', userId, target.username, `${action}${reason ? ` — ${reason}` : ''}`);
  }

  async setRole(userId: string, role: Role) {
    const actor = this.require('users.manage_roles');
    const target = this.target(userId);
    if (target.id === actor.id) throw new ForbiddenError('err.selfChange');
    if (target.role === 'admin' && role !== 'admin' && this.activeAdmins() <= 1) throw new ForbiddenError('err.lastAdmin');
    const old = target.role;
    target.role = role;
    this.log('update', 'profiles', userId, target.username, `${old} → ${role}`);
  }

  async listModerationLog() {
    this.require('users.read');
    return this.clone(this.state.modLog);
  }

  // --- Topluluk ---------------------------------------------------------------
  async listRooms() {
    this.require('community.manage');
    const dayAgo = this.now().getTime() - 86_400_000;
    const s = this.state;
    return s.channels.map((c) => {
      const recent = s.messages.filter((m) => m.channelId === c.id && Date.parse(m.createdAt) > dayAgo);
      const room = s.rooms[c.id] ?? { isLocked: false, slowModeSeconds: 0 };
      return {
        channelId: c.id, channelName: c.name, ...room,
        messages24h: recent.length,
        participants24h: new Set(recent.map((m) => m.userId)).size,
        openReports: s.reports.filter((r) => r.status === 'open' && s.messages.find((m) => m.id === r.messageId)?.channelId === c.id).length,
      };
    });
  }

  async updateRoom(channelId: string, input: RoomSettingsInput) {
    this.require('community.manage');
    validateRoom(input);
    if (!this.state.channels.some((c) => c.id === channelId)) throw new ValidationError('err.notFound');
    this.state.rooms[channelId] = { ...input };
    this.log('update', 'chat_room_settings', channelId, this.channelName(channelId),
      `${input.isLocked ? 'locked' : 'open'}, slow ${input.slowModeSeconds}s`);
  }

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
    if (!report) throw new ValidationError('err.notFound');
    if (hideMessage) this.require('chat.moderate');
    report.status = status;
    this.log('update', 'reports', reportId, report.reason, status);
    if (hideMessage && report.messageId) await this.setMessageHidden(report.messageId, true);
  }

  async setMessageHidden(messageId: string, hidden: boolean) {
    this.require('chat.moderate');
    const m = this.state.messages.find((x) => x.id === messageId);
    if (!m) throw new ValidationError('err.notFound');
    if (m.isHidden === hidden) return;
    m.isHidden = hidden;
    this.modLog(hidden ? 'hide_message' : 'unhide_message', m.authorName, null, m.body.slice(0, 80));
    this.log('update', 'chat_messages', messageId, m.authorName, m.body.slice(0, 40));
  }

  async deleteMessage(messageId: string) {
    this.require('chat.moderate');
    const i = this.state.messages.findIndex((x) => x.id === messageId);
    if (i < 0) throw new ValidationError('err.notFound');
    const [m] = this.state.messages.splice(i, 1);
    for (const r of this.state.reports) if (r.messageId === messageId) r.messageId = null;
    this.modLog('delete_message', m!.authorName, null, m!.body.slice(0, 80));
    // Denetim kaydı silinen içeriğin tamamını kanıt olarak saklar.
    this.log('delete', 'chat_messages', messageId, m!.authorName, m!.body);
  }

  // --- Reklam ve sponsorluk ------------------------------------------------------
  async listAdPlacements() {
    this.require('ads.manage');
    return this.clone(this.state.ads);
  }

  async saveAdPlacement(id: string | null, input: AdPlacementInput) {
    this.require('ads.manage');
    validateAdPlacement(input);
    if (this.state.ads.some((a) => a.key === input.key && a.id !== id)) throw new ValidationError('err.adKeyTaken');
    const ad = { ...this.clone(input), id: id ?? this.id('ad') };
    const i = this.state.ads.findIndex((a) => a.id === id);
    if (i >= 0) this.state.ads[i] = ad;
    else this.state.ads.push(ad);
    this.log(i >= 0 ? 'update' : 'insert', 'ad_placements', ad.key, ad.name, ad.isEnabled ? 'on' : 'off');
    return this.clone(ad);
  }

  async listSponsorships() {
    this.require('ads.manage');
    return this.clone(this.state.sponsorships);
  }

  async saveSponsorship(id: string | null, input: SponsorshipInput) {
    this.require('ads.manage');
    validateSponsorship(input);
    const sp = { ...this.clone(input), id: id ?? this.id('sp') };
    const i = this.state.sponsorships.findIndex((x) => x.id === id);
    if (i >= 0) this.state.sponsorships[i] = sp;
    else this.state.sponsorships.unshift(sp);
    this.log(i >= 0 ? 'update' : 'insert', 'sponsorships', sp.id, sp.sponsorName, sp.titleTr);
    return this.clone(sp);
  }

  // --- Ayarlar ve duyurular ----------------------------------------------------
  async getSettings() {
    this.require('dashboard.read');
    return this.clone(this.state.settings);
  }

  async saveSettings(settings: AppSettings) {
    this.require('settings.manage');
    const { languages, appVersion } = settings;
    if (languages.supported.length === 0) throw new ValidationError('err.languageRequired');
    if (!languages.supported.includes(languages.default)) throw new ValidationError('err.defaultLanguage');
    validateVersion(appVersion.android.latest, appVersion.android.minSupported);
    validateVersion(appVersion.ios.latest, appVersion.ios.minSupported);
    this.state.settings = this.clone(settings);
    this.log('update', 'app_settings', null, 'app_settings');
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
    this.log(i >= 0 ? 'update' : 'insert', 'announcements', a.id, a.titleTr);
    return this.clone(a);
  }

  // --- Denetim kaydı -------------------------------------------------------------
  async listAudit() {
    this.require('audit.read');
    return this.clone(this.audit);
  }
}
