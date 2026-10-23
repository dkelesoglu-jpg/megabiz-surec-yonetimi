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
}

export type RightInput = Omit<BroadcastRight, 'id'>;

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
  summary: string;
  createdAt: string;
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
  /** Son 7 günün günlük mesaj sayıları (eskiden yeniye). */
  messagesPerDay: { date: string; count: number }[];
}
