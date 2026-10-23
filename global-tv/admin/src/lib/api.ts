import type { MessageKey } from '../i18n/tr';
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
  ChatRoom,
  DashboardStats,
  ModerationAction,
  ModerationLogEntry,
  Profile,
  Report,
  ReportData,
  ReportStatus,
  RightInput,
  Role,
  RoomSettingsInput,
  Sponsorship,
  SponsorshipInput,
} from './types';

/** Kullanıcıya gösterilecek hata: metin dile göre `key` ile çevrilir. */
export class AppError extends Error {
  constructor(readonly key: MessageKey, readonly params?: Record<string, string | number>) {
    super(key);
    this.name = 'AppError';
  }
}

/** Sunucunun reddettiği işlem (PostgreSQL 42501 / RLS). */
export class ForbiddenError extends AppError {
  constructor(key: MessageKey = 'err.forbidden') {
    super(key);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(key: MessageKey, params?: Record<string, string | number>) {
    super(key, params);
    this.name = 'ValidationError';
  }
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * Panelin konuştuğu tek arayüz. DemoAdminApi (bellekte, demo veri) ve
 * SupabaseAdminApi (gerçek sunucu) aynı sözleşmeyi uygular.
 */
export interface AdminApi {
  readonly mode: 'demo' | 'supabase';

  signIn(email: string, password: string): Promise<AdminUser>;
  signOut(): Promise<void>;
  currentUser(): Promise<AdminUser | null>;

  dashboardStats(): Promise<DashboardStats>;
  report(days: number): Promise<ReportData>;

  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;

  listChannels(): Promise<Channel[]>;
  createChannel(input: ChannelInput): Promise<Channel>;
  updateChannel(id: string, input: ChannelInput): Promise<Channel>;

  listRights(): Promise<BroadcastRight[]>;
  createRight(input: RightInput): Promise<BroadcastRight>;
  updateRight(id: string, input: RightInput): Promise<BroadcastRight>;
  uploadRightDocument(rightId: string, file: File): Promise<BroadcastRight>;
  rightDocumentUrl(rightId: string): Promise<string>;

  listProfiles(): Promise<Profile[]>;
  moderateUser(userId: string, action: ModerationAction, reason?: string, minutes?: number): Promise<void>;
  setRole(userId: string, role: Role): Promise<void>;
  listModerationLog(): Promise<ModerationLogEntry[]>;

  listRooms(): Promise<ChatRoom[]>;
  updateRoom(channelId: string, input: RoomSettingsInput): Promise<void>;
  listReports(): Promise<Report[]>;
  listMessages(): Promise<ChatMessage[]>;
  resolveReport(reportId: string, status: ReportStatus, hideMessage: boolean): Promise<void>;
  setMessageHidden(messageId: string, hidden: boolean): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;

  listAdPlacements(): Promise<AdPlacement[]>;
  saveAdPlacement(id: string | null, input: AdPlacementInput): Promise<AdPlacement>;
  listSponsorships(): Promise<Sponsorship[]>;
  saveSponsorship(id: string | null, input: SponsorshipInput): Promise<Sponsorship>;

  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  listAnnouncements(): Promise<Announcement[]>;
  saveAnnouncement(id: string | null, input: AnnouncementInput): Promise<Announcement>;

  listAudit(): Promise<AuditEntry[]>;
}

export function checkDocument(file: File): void {
  if (!DOCUMENT_TYPES.includes(file.type)) throw new ValidationError('err.fileType');
  if (file.size > MAX_DOCUMENT_BYTES) throw new ValidationError('err.fileSize');
}
