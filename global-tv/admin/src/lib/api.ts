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
  DashboardStats,
  ModerationAction,
  Profile,
  Report,
  ReportStatus,
  RightInput,
  Role,
} from './types';

/** Sunucunun reddettiği işlem (PostgreSQL 42501 / RLS). */
export class ForbiddenError extends Error {
  constructor(message = 'Bu işlem için yetkiniz yok.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

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

  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;

  listChannels(): Promise<Channel[]>;
  createChannel(input: ChannelInput): Promise<Channel>;
  updateChannel(id: string, input: ChannelInput): Promise<Channel>;

  listRights(): Promise<BroadcastRight[]>;
  createRight(input: RightInput): Promise<BroadcastRight>;
  updateRight(id: string, input: RightInput): Promise<BroadcastRight>;

  listProfiles(): Promise<Profile[]>;
  moderateUser(userId: string, action: ModerationAction, reason?: string, minutes?: number): Promise<void>;
  setRole(userId: string, role: Role): Promise<void>;

  listReports(): Promise<Report[]>;
  listMessages(): Promise<ChatMessage[]>;
  resolveReport(reportId: string, status: ReportStatus, hideMessage: boolean): Promise<void>;
  setMessageHidden(messageId: string, hidden: boolean): Promise<void>;

  listAdPlacements(): Promise<AdPlacement[]>;
  saveAdPlacement(id: string | null, input: AdPlacementInput): Promise<AdPlacement>;

  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  listAnnouncements(): Promise<Announcement[]>;
  saveAnnouncement(id: string | null, input: AnnouncementInput): Promise<Announcement>;

  listAudit(): Promise<AuditEntry[]>;
}
