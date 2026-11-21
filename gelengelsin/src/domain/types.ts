// GelenGelsin alan modeli. Canlı MVP'deki Postgres tablolarıyla birebir eşleşecek
// şekilde tutuldu (bkz. docs/MVP-PLANI.md).

export type PlanType = 'going' | 'need_people' | 'meet_there';

export type CategoryId =
  | 'spor'
  | 'kultur'
  | 'muzik'
  | 'yeme'
  | 'acikhava'
  | 'kesif'
  | 'seyahat'
  | 'hobi'
  | 'topluluk';

export interface City {
  id: string;
  name: string;
  country: string;
  /** Pilotta yalnızca İstanbul aktif; yeni şehirler veriyle açılır. */
  active: boolean;
  districts: string[];
}

export interface User {
  id: string;
  name: string;
  birthYear: number;
  cityId: string;
  bio: string;
  interests: CategoryId[];
  avatarColor: string;
  /** Canlıda kimlik/yaş doğrulamasıyla dolar; prototipte demo kullanıcılar için true. */
  verified18: boolean;
  isModerator?: boolean;
  isDemo: boolean;
  joinedAt: string;
}

export type PlanStatus = 'active' | 'cancelled' | 'removed';

export interface Plan {
  id: string;
  ownerId: string;
  type: PlanType;
  category: CategoryId;
  title: string;
  description?: string;
  cityId: string;
  district: string;
  /** Herkese açık kartta görünen genel mekân (ör. "Moda sahili civarı"). */
  areaLabel?: string;
  /** Yalnızca plan sahibi ve onaylı katılımcılara döner. */
  meetingPointExact?: string;
  startAt: string;
  /** Seyahat planlarında tarih aralığının sonu. */
  endAt?: string;
  destination?: { city: string; country: string };
  /** Plan sahibi hariç katılımcı sayısı. */
  capacity: number;
  costNote?: string;
  eventUrl?: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'left';

export interface JoinRequest {
  id: string;
  planId: string;
  userId: string;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  planId: string;
  /** null = sistem mesajı */
  userId: string | null;
  text: string;
  createdAt: string;
}

export type NotificationKind =
  | 'request_received'
  | 'request_withdrawn'
  | 'request_approved'
  | 'request_rejected'
  | 'participant_left'
  | 'plan_updated'
  | 'plan_cancelled'
  | 'plan_removed';

export interface AppNotification {
  id: string;
  userId: string;
  planId?: string;
  kind: NotificationKind;
  text: string;
  createdAt: string;
  read: boolean;
}

export type ReportTarget = { kind: 'plan'; planId: string } | { kind: 'user'; userId: string };

export type ReportStatus = 'open' | 'dismissed' | 'actioned';

export interface Report {
  id: string;
  reporterId: string;
  target: ReportTarget;
  reason: string;
  note?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface PlanOutcome {
  planId: string;
  userId: string;
  happened: boolean;
  createdAt: string;
}

export interface DB {
  version: 1;
  cities: City[];
  users: User[];
  plans: Plan[];
  requests: JoinRequest[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  reports: Report[];
  blocks: Block[];
  outcomes: PlanOutcome[];
}

export type Result<T = undefined> =
  | { ok: true; db: DB; value: T }
  | { ok: false; error: string };
