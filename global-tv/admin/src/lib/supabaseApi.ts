import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ForbiddenError, ValidationError, type AdminApi } from './api';
import { canEnterPanel } from './permissions';
import type {
  AdPlacement,
  AdPlacementInput,
  AdminUser,
  Announcement,
  AnnouncementInput,
  AppSettings,
  AuditEntry,
  BroadcastRight,
  Category,
  Channel,
  ChannelInput,
  ChatMessage,
  ModerationAction,
  Profile,
  Report,
  ReportStatus,
  RightInput,
  Role,
} from './types';
import { validateAdPlacement, validateAnnouncement, validateChannel, validateRight, validateVersion } from './validation';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Gerçek Supabase uygulaması. Yalnızca publishable key ve yöneticinin kendi oturumu
 * kullanılır; yetki veritabanında (RLS, guard_profile_update, admin_* RPC) uygulanır.
 * Not: Gerçek sunucuya karşı henüz çalıştırılmadı (ayrı Supabase hesabı bekleniyor).
 */
export class SupabaseAdminApi implements AdminApi {
  readonly mode = 'supabase' as const;

  constructor(private readonly db: SupabaseClient) {}

  private fail(error: PostgrestError | null): void {
    if (!error) return;
    if (error.code === '42501' || /row-level security/i.test(error.message)) throw new ForbiddenError();
    if (['23505'].includes(error.code)) throw new ValidationError('Bu değer başka bir kayıtta kullanılıyor.');
    if (['23503', '23514', '22P02', 'P0002'].includes(error.code)) throw new ValidationError(error.message);
    throw new Error(error.message);
  }

  private async rows<T>(query: PromiseLike<{ data: T | null; error: PostgrestError | null }>): Promise<T> {
    const { data, error } = await query;
    this.fail(error);
    return data as T;
  }

  // --- Oturum -------------------------------------------------------------
  async signIn(email: string, password: string): Promise<AdminUser> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new ValidationError('E-posta veya şifre hatalı.');
    const user = await this.currentUser();
    if (!user) {
      await this.db.auth.signOut();
      throw new ForbiddenError('Bu hesabın yönetim paneline erişim yetkisi yok.');
    }
    return user;
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  async currentUser(): Promise<AdminUser | null> {
    const { data } = await this.db.auth.getUser();
    if (!data.user) return null;
    const profile = await this.rows<Row | null>(
      this.db.from('profiles').select('id, username, role, is_banned').eq('id', data.user.id).maybeSingle(),
    );
    if (!profile || profile.is_banned || !canEnterPanel(profile.role as Role)) return null;
    return { id: profile.id, username: profile.username, role: profile.role, email: data.user.email ?? '' };
  }

  // --- Pano -----------------------------------------------------------------
  async dashboardStats() {
    const s = await this.rows<Row>(this.db.rpc('admin_dashboard_stats'));
    const since = new Date(Date.now() - 7 * 86_400_000);
    const msgs = await this.rows<Row[]>(
      this.db.from('chat_messages').select('created_at').gte('created_at', since.toISOString()).limit(50_000),
    );
    const perDay = new Map<string, number>();
    for (let i = 6; i >= 0; i--) perDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
    for (const m of msgs) {
      const d = String(m.created_at).slice(0, 10);
      if (perDay.has(d)) perDay.set(d, (perDay.get(d) ?? 0) + 1);
    }
    return {
      usersTotal: s.users_total, usersBanned: s.users_banned, usersNew7d: s.users_new_7d,
      channelsTotal: s.channels_total, channelsLive: s.channels_live, rightsExpiring14d: s.rights_expiring_14d,
      messages24h: s.messages_24h, reportsOpen: s.reports_open,
      messagesPerDay: [...perDay].map(([date, count]) => ({ date, count })),
    };
  }

  // --- Kategoriler ve kanallar ---------------------------------------------
  async listCategories(): Promise<Category[]> {
    const rows = await this.rows<Row[]>(this.db.from('channel_categories').select('*').order('sort_order'));
    return rows.map((r) => ({ key: r.key, nameTr: r.name_tr, nameEn: r.name_en, sortOrder: r.sort_order, isActive: r.is_active }));
  }

  async saveCategory(c: Category) {
    await this.rows(this.db.from('channel_categories').upsert({
      key: c.key, name_tr: c.nameTr, name_en: c.nameEn, sort_order: c.sortOrder, is_active: c.isActive,
    }));
  }

  private toChannel(r: Row): Channel {
    const streams = (r.channel_streams ?? []) as Row[];
    const primary = streams.find((s) => s.is_primary) ?? streams[0];
    return {
      id: r.id, slug: r.slug, name: r.name, countryCode: String(r.country_code).trim(), category: r.category,
      language: r.language, logoUrl: r.logo_url, attribution: r.attribution, isActive: r.is_active,
      sortOrder: r.sort_order, streamUrl: primary?.hls_url ?? null,
    };
  }

  private channelRow(i: ChannelInput) {
    return {
      slug: i.slug, name: i.name, country_code: i.countryCode, category: i.category, language: i.language,
      logo_url: i.logoUrl, attribution: i.attribution, is_active: i.isActive, sort_order: i.sortOrder,
    };
  }

  private async replaceStream(channelId: string, url: string | null) {
    await this.rows(this.db.from('channel_streams').delete().eq('channel_id', channelId));
    if (url) await this.rows(this.db.from('channel_streams').insert({ channel_id: channelId, hls_url: url, is_primary: true }));
  }

  async listChannels() {
    const rows = await this.rows<Row[]>(this.db.from('channels').select('*, channel_streams(hls_url, is_primary)').order('sort_order'));
    return rows.map((r) => this.toChannel(r));
  }

  async createChannel(input: ChannelInput) {
    validateChannel(input);
    const row = await this.rows<Row>(this.db.from('channels').insert(this.channelRow(input)).select().single());
    await this.replaceStream(row.id, input.streamUrl);
    return { ...this.toChannel(row), streamUrl: input.streamUrl };
  }

  async updateChannel(id: string, input: ChannelInput) {
    validateChannel(input);
    const row = await this.rows<Row>(this.db.from('channels').update(this.channelRow(input)).eq('id', id).select().single());
    await this.replaceStream(id, input.streamUrl);
    return { ...this.toChannel(row), streamUrl: input.streamUrl };
  }

  // --- Yayın hakları -------------------------------------------------------
  private toRight(r: Row): BroadcastRight {
    return {
      id: r.id, channelId: r.channel_id, rightsHolder: r.rights_holder, licenseType: r.license_type,
      allowedCountries: r.allowed_countries ?? [], validFrom: r.valid_from, validUntil: r.valid_until,
      status: r.status, notes: r.notes,
    };
  }

  private rightRow(i: RightInput) {
    return {
      channel_id: i.channelId, rights_holder: i.rightsHolder, license_type: i.licenseType,
      allowed_countries: i.allowedCountries, valid_from: i.validFrom, valid_until: i.validUntil,
      status: i.status, notes: i.notes,
    };
  }

  async listRights() {
    return (await this.rows<Row[]>(this.db.from('broadcast_rights').select('*').order('valid_until'))).map((r) => this.toRight(r));
  }

  async createRight(input: RightInput) {
    validateRight(input);
    return this.toRight(await this.rows<Row>(this.db.from('broadcast_rights').insert(this.rightRow(input)).select().single()));
  }

  async updateRight(id: string, input: RightInput) {
    validateRight(input);
    return this.toRight(await this.rows<Row>(this.db.from('broadcast_rights').update(this.rightRow(input)).eq('id', id).select().single()));
  }

  // --- Kullanıcılar ----------------------------------------------------------
  async listProfiles(): Promise<Profile[]> {
    const rows = await this.rows<Row[]>(this.db.from('profiles')
      .select('id, username, role, country_code, is_banned, muted_until, created_at').order('created_at', { ascending: false }).limit(1000));
    return rows.map((r) => ({
      id: r.id, username: r.username, role: r.role, countryCode: r.country_code, isBanned: r.is_banned,
      mutedUntil: r.muted_until, createdAt: r.created_at,
    }));
  }

  async moderateUser(userId: string, action: ModerationAction, reason?: string, minutes?: number) {
    await this.rows(this.db.rpc('admin_moderate_user', { p_target: userId, p_action: action, p_reason: reason ?? null, p_minutes: minutes ?? null }));
  }

  async setRole(userId: string, role: Role) {
    await this.rows(this.db.rpc('admin_set_role', { p_target: userId, p_role: role }));
  }

  // --- Moderasyon -------------------------------------------------------------
  async listReports(): Promise<Report[]> {
    const rows = await this.rows<Row[]>(this.db.from('reports')
      .select('id, reason, details, status, created_at, message_id, reported_user_id, reporter:profiles!reports_reporter_id_fkey(username)')
      .order('created_at', { ascending: false }).limit(500));
    return rows.map((r) => ({
      id: r.id, reporterName: r.reporter?.username ?? '—', messageId: r.message_id === null ? null : String(r.message_id),
      reportedUserId: r.reported_user_id, reason: r.reason, details: r.details, status: r.status, createdAt: r.created_at,
    }));
  }

  async listMessages(): Promise<ChatMessage[]> {
    const rows = await this.rows<Row[]>(this.db.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(300));
    return rows.map((r) => ({
      id: String(r.id), channelId: r.channel_id, userId: r.user_id, authorName: r.author_name, body: r.body,
      isHidden: r.is_hidden, createdAt: r.created_at,
    }));
  }

  async resolveReport(reportId: string, status: ReportStatus, hideMessage: boolean) {
    await this.rows(this.db.rpc('admin_resolve_report', { p_report: reportId, p_status: status, p_hide_message: hideMessage }));
  }

  async setMessageHidden(messageId: string, hidden: boolean) {
    const rows = await this.rows<Row[]>(this.db.from('chat_messages').update({ is_hidden: hidden }).eq('id', Number(messageId)).select('id'));
    if (rows.length === 0) throw new ForbiddenError();
  }

  // --- Reklam alanları -------------------------------------------------------
  private toAd(r: Row): AdPlacement {
    return {
      id: r.id, key: r.key, name: r.name, platform: r.platform, format: r.format, provider: r.provider,
      unitId: r.unit_id, isTest: r.is_test, isEnabled: r.is_enabled, frequencyCap: r.frequency_cap, notes: r.notes,
    };
  }

  async listAdPlacements() {
    return (await this.rows<Row[]>(this.db.from('ad_placements').select('*').order('key'))).map((r) => this.toAd(r));
  }

  async saveAdPlacement(id: string | null, i: AdPlacementInput) {
    validateAdPlacement(i);
    const row = {
      key: i.key, name: i.name, platform: i.platform, format: i.format, provider: i.provider, unit_id: i.unitId,
      is_test: i.isTest, is_enabled: i.isEnabled, frequency_cap: i.frequencyCap, notes: i.notes, updated_at: new Date().toISOString(),
    };
    const q = id ? this.db.from('ad_placements').update(row).eq('id', id) : this.db.from('ad_placements').insert(row);
    return this.toAd(await this.rows<Row>(q.select().single()));
  }

  // --- Ayarlar ve duyurular ----------------------------------------------------
  async getSettings(): Promise<AppSettings> {
    const rows = await this.rows<Row[]>(this.db.from('app_settings').select('key, value'));
    const v = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Row;
    const ver = (p: Row | undefined) => ({ latest: p?.latest ?? '1.0.0', minSupported: p?.min_supported ?? '1.0.0' });
    return {
      languages: { supported: v.languages?.supported ?? ['tr', 'en'], default: v.languages?.default ?? 'tr' },
      appVersion: { android: ver(v.app_version?.android), ios: ver(v.app_version?.ios) },
      maintenance: {
        enabled: Boolean(v.maintenance?.enabled), messageTr: v.maintenance?.message_tr ?? '', messageEn: v.maintenance?.message_en ?? '',
      },
    };
  }

  async saveSettings(s: AppSettings) {
    validateVersion(s.appVersion.android.latest, s.appVersion.android.minSupported);
    validateVersion(s.appVersion.ios.latest, s.appVersion.ios.minSupported);
    const ver = (p: { latest: string; minSupported: string }) => ({ latest: p.latest, min_supported: p.minSupported });
    const rows = await this.rows<Row[]>(this.db.from('app_settings').upsert([
      { key: 'languages', value: s.languages },
      { key: 'app_version', value: { android: ver(s.appVersion.android), ios: ver(s.appVersion.ios) } },
      { key: 'maintenance', value: { enabled: s.maintenance.enabled, message_tr: s.maintenance.messageTr, message_en: s.maintenance.messageEn } },
    ]).select('key'));
    if (rows.length !== 3) throw new ForbiddenError();
  }

  private toAnnouncement(r: Row): Announcement {
    return {
      id: r.id, titleTr: r.title_tr, titleEn: r.title_en, bodyTr: r.body_tr, bodyEn: r.body_en,
      startsAt: r.starts_at, endsAt: r.ends_at, isActive: r.is_active,
    };
  }

  async listAnnouncements() {
    return (await this.rows<Row[]>(this.db.from('announcements').select('*').order('starts_at', { ascending: false })))
      .map((r) => this.toAnnouncement(r));
  }

  async saveAnnouncement(id: string | null, i: AnnouncementInput) {
    validateAnnouncement(i);
    const row = {
      title_tr: i.titleTr, title_en: i.titleEn, body_tr: i.bodyTr, body_en: i.bodyEn,
      starts_at: i.startsAt, ends_at: i.endsAt, is_active: i.isActive,
    };
    const q = id ? this.db.from('announcements').update(row).eq('id', id) : this.db.from('announcements').insert(row);
    return this.toAnnouncement(await this.rows<Row>(q.select().single()));
  }

  // --- Denetim kaydı -------------------------------------------------------------
  async listAudit(): Promise<AuditEntry[]> {
    const rows = await this.rows<Row[]>(this.db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(300));
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
    const names = new Map<string, string>();
    if (actorIds.length) {
      const ps = await this.rows<Row[]>(this.db.from('profiles').select('id, username').in('id', actorIds));
      ps.forEach((p) => names.set(p.id, p.username));
    }
    return rows.map((r) => ({
      id: String(r.id), actorName: r.actor_id ? names.get(r.actor_id) ?? r.actor_id : null, action: r.action,
      entity: r.entity, entityId: r.entity_id, createdAt: r.created_at,
      summary: summarize(r),
    }));
  }
}

function summarize(r: Row): string {
  const n = r.payload?.new ?? {};
  const label = n.name ?? n.title_tr ?? n.username ?? n.rights_holder ?? n.key ?? r.entity_id ?? '';
  return `${r.entity} ${r.action}${label ? `: ${label}` : ''}`;
}
