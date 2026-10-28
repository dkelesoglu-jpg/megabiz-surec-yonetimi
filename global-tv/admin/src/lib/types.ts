// Veritabanı şemasının (supabase/migrations) panel tarafındaki karşılıkları.

export type Role = 'user' | 'moderator' | 'editor' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface Category {
  key: string;
  nameTr: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Channel {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  category: string;
  language: string;
  logoUrl: string | null;
  attribution: string | null;
  isActive: boolean;
  sortOrder: number;
  streamUrl: string | null;
}

export type ChannelInput = Omit<Channel, 'id'>;

export type RightsStatus = 'pending' | 'verified' | 'rejected' | 'revoked';

export interface BroadcastRight {
  id: string;
  channelId: string;
  rightsHolder: string;
  licenseType: string;
  allowedCountries: string[];
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  status: RightsStatus;
  notes: string | null;
  /** Yüklenmiş yayın hakkı belgesinin adı (özel depoda). */
  documentName: string | null;
}

export type RightInput = Omit<BroadcastRight, 'id' | 'documentName'>;

export interface Profile {
  id: string;
  username: string;
  role: Role;
  countryCode: string | null;
  isBanned: boolean;
  mutedUntil: string | null; // ISO
  createdAt: string;
}

export type ModerationAction = 'mute' | 'unmute' | 'ban' | 'unban';

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string | null;
  authorName: string;
  body: string;
  isHidden: boolean;
  createdAt: string;
}

export type ReportReason = 'spam' | 'abuse' | 'hate' | 'sexual' | 'other';
export type ReportStatus = 'open' | 'actioned' | 'dismissed';

export interface Report {
  id: string;
  reporterName: string;
  messageId: string | null;
  reportedUserId: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface AdPlacement {
  id: string;
  key: string;
  name: string;
  platform: 'android' | 'ios' | 'all';
  format: 'banner' | 'interstitial' | 'native' | 'preroll';
  provider: string;
  unitId: string | null;
  isTest: boolean;
  isEnabled: boolean;
  frequencyCap: number | null;
  notes: string | null;
}

export type AdPlacementInput = Omit<AdPlacement, 'id'>;

export interface LanguageSettings {
  supported: string[];
  default: string;
}

export interface PlatformVersion {
  latest: string;
  minSupported: string;
}

export interface VersionSettings {
  android: PlatformVersion;
  ios: PlatformVersion;
}

export interface MaintenanceSettings {
  enabled: boolean;
  messageTr: string;
  messageEn: string;
}

export interface AppSettings {
  languages: LanguageSettings;
  appVersion: VersionSettings;
  maintenance: MaintenanceSettings;
}

export interface Announcement {
  id: string;
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}

export type AnnouncementInput = Omit<Announcement, 'id'>;

export interface AuditEntry {
  id: string;
  actorName: string | null;
  action: 'insert' | 'update' | 'delete';
  entity: string;
  entityId: string | null;
  /** Kaydın okunabilir adı (kanal adı, kullanıcı adı…). */
  label: string;
  /** Ek ayrıntı (ör. moderasyon gerekçesi, rol değişikliği). */
  detail: string | null;
  createdAt: string;
}

export type LogAction = 'warn' | 'mute' | 'unmute' | 'ban' | 'unban' | 'hide_message' | 'unhide_message' | 'delete_message';

export interface ModerationLogEntry {
  id: string;
  moderatorName: string;
  targetName: string;
  action: LogAction;
  reason: string | null;
  messageExcerpt: string | null;
  createdAt: string;
}

export interface ChatRoom {
  channelId: string;
  channelName: string;
  isLocked: boolean;
  slowModeSeconds: number;
  messages24h: number;
  participants24h: number;
  openReports: number;
}

export interface RoomSettingsInput {
  isLocked: boolean;
  slowModeSeconds: number;
}

export type SponsorPlacement = 'home_featured' | 'channel_banner' | 'chat_pinned';

export interface Sponsorship {
  id: string;
  sponsorName: string;
  titleTr: string;
  titleEn: string;
  placement: SponsorPlacement;
  channelId: string | null;
  clickUrl: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  notes: string | null;
}

export type SponsorshipInput = Omit<Sponsorship, 'id'>;

export interface DayCount {
  day: string;
  count: number;
}

export interface KeyCount {
  key: string;
  count: number;
}

export interface ReportData {
  days: number;
  signupsPerDay: DayCount[];
  activePerDay: DayCount[];
  usersByCountry: KeyCount[];
  /** Misafirler dahil günlük tekil anonim cihaz. */
  activeDevicesPerDay: DayCount[];
  /** Anonim: 5'ten az cihazlı ülkeler `OTHER` altında birleşir (sunucuda uygulanır). */
  watchByCountry: { key: string; minutes: number; devices: number }[];
  watchByPlatform: KeyCount[];
  watchByChannel: { channelId: string; channelName: string; minutes: number; sessions: number }[];
  messagesPerDay: DayCount[];
  reportsByReason: KeyCount[];
  moderationByAction: KeyCount[];
  /** Yalnızca ads.manage izni olanlara. */
  ads: { impressions: number; clicks: number } | null;
}

export interface DashboardStats {
  usersTotal: number;
  usersBanned: number;
  usersNew7d: number;
  channelsTotal: number;
  channelsLive: number;
  rightsExpiring14d: number;
  messages24h: number;
  reportsOpen: number;
  activeUsers1d: number;
  activeUsers7d: number;
  watchMinutes24h: number;
  /** Son 7 günün günlük izlenme dakikası (eskiden yeniye). */
  watchPerDay: DayCount[];
}
