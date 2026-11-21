// GelenGelsin kural motoru. Prototipte tarayıcıda çalışır; canlı sürümde aynı
// kurallar Postgres fonksiyonları + RLS ile sunucuda uygulanır (docs/MVP-PLANI.md).
// Tüm yazma işlemleri saf fonksiyondur: (db, aktör, girdi) -> Result.

import type {
  AppNotification, CategoryId, ChatMessage, DB, JoinRequest, NotificationKind, Plan,
  PlanType, Report, ReportTarget, Result,
} from './types';

// ---------- yardımcılar ----------

let clock: () => Date = () => new Date();
export const setClock = (fn: () => Date) => { clock = fn; };
export const now = () => clock();
const nowISO = () => clock().toISOString();

let seq = 0;
export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const fail = (error: string): Result<never> => ({ ok: false, error });
const done = <T>(db: DB, value: T): Result<T> => ({ ok: true, db, value });
const clone = (db: DB): DB => JSON.parse(JSON.stringify(db));

const notify = (db: DB, userId: string, kind: NotificationKind, text: string, planId?: string) => {
  const n: AppNotification = { id: newId('ntf'), userId, kind, text, planId, createdAt: nowISO(), read: false };
  db.notifications.push(n);
};

const systemMessage = (db: DB, planId: string, text: string) => {
  const m: ChatMessage = { id: newId('msg'), planId, userId: null, text, createdAt: nowISO() };
  db.messages.push(m);
};

const userName = (db: DB, id: string) => db.users.find((u) => u.id === id)?.name ?? 'Bir kullanıcı';

// ---------- okuma / seçiciler ----------

export const getPlan = (db: DB, id: string) => db.plans.find((p) => p.id === id);
export const getUser = (db: DB, id: string) => db.users.find((u) => u.id === id);

export const approvedRequests = (db: DB, planId: string) =>
  db.requests.filter((r) => r.planId === planId && r.status === 'approved');

export const pendingRequests = (db: DB, planId: string) =>
  db.requests.filter((r) => r.planId === planId && r.status === 'pending');

export const spotsLeft = (db: DB, plan: Plan) =>
  Math.max(0, plan.capacity - approvedRequests(db, plan.id).length);

export const isPast = (plan: Plan, at = now()) =>
  new Date(plan.endAt ?? plan.startAt).getTime() + 3 * 3600_000 < at.getTime();

export type PlanPhase = 'open' | 'full' | 'past' | 'cancelled' | 'removed';
export const planPhase = (db: DB, plan: Plan, at = now()): PlanPhase => {
  if (plan.status === 'removed') return 'removed';
  if (plan.status === 'cancelled') return 'cancelled';
  if (isPast(plan, at)) return 'past';
  if (spotsLeft(db, plan) === 0) return 'full';
  return 'open';
};

/** Kullanıcının bu plandaki en güncel isteği. */
export const requestOf = (db: DB, planId: string, userId: string): JoinRequest | undefined =>
  db.requests
    .filter((r) => r.planId === planId && r.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

export const isMember = (db: DB, planId: string, userId: string) => {
  const plan = getPlan(db, planId);
  if (!plan) return false;
  if (plan.ownerId === userId) return true;
  return requestOf(db, planId, userId)?.status === 'approved';
};

export const isBlockedBetween = (db: DB, a: string, b: string) =>
  db.blocks.some((x) => (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a));

export const hasBlocked = (db: DB, blocker: string, blocked: string) =>
  db.blocks.some((x) => x.blockerId === blocker && x.blockedId === blocked);

/**
 * Planı izleyiciye göre filtreler. Kesin buluşma noktası yalnızca plan sahibi
 * ve onaylı katılımcılara döner. Canlıda bu, ayrı bir tablo + RLS ile yapılır.
 */
export type PlanView = Omit<Plan, 'meetingPointExact'> & {
  meetingPointExact?: string;
  meetingPointHidden: boolean;
};
export const viewPlan = (db: DB, plan: Plan, viewerId: string): PlanView => {
  const { meetingPointExact, ...rest } = plan;
  const allowed = isMember(db, plan.id, viewerId) && plan.status === 'active';
  return {
    ...rest,
    meetingPointExact: allowed ? meetingPointExact : undefined,
    meetingPointHidden: !!meetingPointExact && !allowed,
  };
};

// ---------- tarih filtreleri ----------

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export type DateFilter = { kind: 'all' } | { kind: 'today' } | { kind: 'weekend' } | { kind: 'date'; date: string };

export const dateWindow = (f: DateFilter, at = now()): [Date, Date] | null => {
  const today = startOfDay(at);
  switch (f.kind) {
    case 'all':
      return null;
    case 'today':
      return [today, addDays(today, 1)];
    case 'weekend': {
      const dow = today.getDay(); // 0 Pazar, 6 Cumartesi
      const sat = dow === 6 ? today : dow === 0 ? addDays(today, -1) : addDays(today, 6 - dow);
      return [sat, addDays(sat, 2)];
    }
    case 'date': {
      const [y, m, d] = f.date.split('-').map(Number);
      const s = new Date(y, m - 1, d);
      return [s, addDays(s, 1)];
    }
  }
};

export interface DiscoverFilters {
  cityId: string;
  district: string | 'all';
  category: CategoryId | 'all';
  date: DateFilter;
}

export const discoverPlans = (db: DB, viewerId: string, f: DiscoverFilters, at = now()) => {
  const win = dateWindow(f.date, at);
  return db.plans
    .filter((p) => p.status === 'active' && !isPast(p, at))
    .filter((p) => p.cityId === f.cityId)
    .filter((p) => f.district === 'all' || p.district === f.district)
    .filter((p) => f.category === 'all' || p.category === f.category)
    .filter((p) => !isBlockedBetween(db, viewerId, p.ownerId))
    .filter((p) => {
      if (!win) return true;
      const s = new Date(p.startAt).getTime();
      const e = new Date(p.endAt ?? p.startAt).getTime();
      return s < win[1].getTime() && e >= win[0].getTime();
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
};

export const myPlans = (db: DB, userId: string, at = now()) => {
  const hosting = db.plans.filter((p) => p.ownerId === userId && p.status !== 'removed');
  const mine = db.requests.filter((r) => r.userId === userId);
  const latest = new Map<string, JoinRequest>();
  for (const r of mine) {
    const cur = latest.get(r.planId);
    if (!cur || r.updatedAt > cur.updatedAt) latest.set(r.planId, r);
  }
  const withPlan = [...latest.values()]
    .map((r) => ({ request: r, plan: getPlan(db, r.planId)! }))
    .filter((x) => x.plan && x.plan.status !== 'removed');
  const upcoming = (p: Plan) => !isPast(p, at);
  return {
    hosting: hosting.filter((p) => upcoming(p) || p.status === 'cancelled'),
    pending: withPlan.filter((x) => x.request.status === 'pending' && upcoming(x.plan)),
    joined: withPlan.filter((x) => x.request.status === 'approved' && upcoming(x.plan)),
    past: [
      ...hosting.filter((p) => isPast(p, at) && p.status === 'active'),
      ...withPlan.filter((x) => x.request.status === 'approved' && isPast(x.plan, at)).map((x) => x.plan),
    ].sort((a, b) => b.startAt.localeCompare(a.startAt)),
    closed: withPlan.filter((x) => ['rejected', 'withdrawn', 'left'].includes(x.request.status) && upcoming(x.plan)),
  };
};

export const chatsFor = (db: DB, userId: string) =>
  db.plans
    .filter((p) => p.status !== 'removed' && isMember(db, p.id, userId))
    .map((p) => {
      const msgs = db.messages.filter((m) => m.planId === p.id);
      return { plan: p, last: msgs[msgs.length - 1], count: msgs.length };
    })
    .sort((a, b) => (b.last?.createdAt ?? b.plan.createdAt).localeCompare(a.last?.createdAt ?? a.plan.createdAt));

/** Sohbet erişimi alan katmanında kontrol edilir; UI yalnızca sonucu gösterir. */
export const readChat = (db: DB, planId: string, viewerId: string): Result<ChatMessage[]> => {
  const plan = getPlan(db, planId);
  if (!plan || plan.status === 'removed') return fail('Plan bulunamadı.');
  if (!isMember(db, planId, viewerId))
    return fail('Bu sohbete yalnızca plan sahibi ve onaylı katılımcılar erişebilir.');
  return done(db, db.messages.filter((m) => m.planId === planId));
};

export const unreadCount = (db: DB, userId: string) =>
  db.notifications.filter((n) => n.userId === userId && !n.read).length;

// ---------- yazma işlemleri ----------

export interface PlanInput {
  type: PlanType;
  category: CategoryId;
  title: string;
  description?: string;
  cityId: string;
  district: string;
  areaLabel?: string;
  meetingPointExact?: string;
  startAt: string;
  endAt?: string;
  destination?: { city: string; country: string };
  capacity: number;
  costNote?: string;
  eventUrl?: string;
}

const clean = (s?: string) => (s && s.trim() ? s.trim() : undefined);

const validatePlan = (db: DB, input: PlanInput, at = now()): string | null => {
  const title = input.title?.trim() ?? '';
  if (title.length < 5) return 'Başlık en az 5 karakter olmalı.';
  if (title.length > 90) return 'Başlık en fazla 90 karakter olabilir.';
  const city = db.cities.find((c) => c.id === input.cityId);
  if (!city || !city.active) return 'Şu an yalnızca İstanbul’da plan açılabiliyor.';
  if (!city.districts.includes(input.district)) return 'Lütfen bir ilçe seç.';
  const start = new Date(input.startAt);
  if (isNaN(start.getTime())) return 'Tarih ve saat seç.';
  if (start.getTime() < at.getTime() - 5 * 60_000) return 'Geçmiş bir tarihe plan açılamaz.';
  if (input.endAt) {
    const end = new Date(input.endAt);
    if (isNaN(end.getTime()) || end < start) return 'Bitiş tarihi başlangıçtan önce olamaz.';
  }
  if (input.category === 'seyahat' && !clean(input.destination?.city)) return 'Seyahat planı için varış şehrini yaz.';
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 30)
    return 'Kontenjan 1 ile 30 arasında olmalı (sen hariç).';
  if (input.eventUrl && !/^https?:\/\//i.test(input.eventUrl.trim())) return 'Bağlantı http:// veya https:// ile başlamalı.';
  return null;
};

const normalize = (input: PlanInput) => ({
  type: input.type,
  category: input.category,
  title: input.title.trim(),
  description: clean(input.description),
  cityId: input.cityId,
  district: input.district,
  areaLabel: clean(input.areaLabel),
  meetingPointExact: clean(input.meetingPointExact),
  startAt: new Date(input.startAt).toISOString(),
  endAt: input.endAt ? new Date(input.endAt).toISOString() : undefined,
  destination:
    input.category === 'seyahat' && clean(input.destination?.city)
      ? { city: input.destination!.city.trim(), country: input.destination!.country?.trim() ?? '' }
      : undefined,
  capacity: input.capacity,
  costNote: clean(input.costNote),
  eventUrl: clean(input.eventUrl),
});

export const createPlan = (db0: DB, actorId: string, input: PlanInput): Result<string> => {
  const actor = getUser(db0, actorId);
  if (!actor) return fail('Kullanıcı bulunamadı.');
  if (!actor.verified18) return fail('Plan açmak için 18 yaş doğrulaması gerekli.');
  const err = validatePlan(db0, input);
  if (err) return fail(err);
  const db = clone(db0);
  const plan: Plan = {
    id: newId('plan'),
    ownerId: actorId,
    ...normalize(input),
    status: 'active',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    isDemo: false,
  };
  db.plans.push(plan);
  systemMessage(db, plan.id, `${actor.name} planı açtı. Onaylanan katılımcılar bu sohbete katılacak.`);
  return done(db, plan.id);
};

export const updatePlan = (db0: DB, actorId: string, planId: string, input: PlanInput): Result => {
  const old = getPlan(db0, planId);
  if (!old) return fail('Plan bulunamadı.');
  if (old.ownerId !== actorId) return fail('Planı yalnızca plan sahibi düzenleyebilir.');
  if (old.status !== 'active') return fail('İptal edilmiş plan düzenlenemez.');
  const err = validatePlan(db0, input);
  if (err) return fail(err);
  const approved = approvedRequests(db0, planId).length;
  if (input.capacity < approved)
    return fail(`Kontenjan, onaylı katılımcı sayısının (${approved}) altına düşürülemez.`);

  const db = clone(db0);
  const plan = getPlan(db, planId)!;
  const next = normalize(input);
  const timeChanged = next.startAt !== old.startAt || next.endAt !== old.endAt;
  const placeChanged =
    next.meetingPointExact !== old.meetingPointExact || next.district !== old.district || next.areaLabel !== old.areaLabel;
  Object.assign(plan, next, { updatedAt: nowISO() });

  if (timeChanged || placeChanged) {
    const what = [timeChanged && 'tarih/saat', placeChanged && 'buluşma yeri'].filter(Boolean).join(' ve ');
    const members = approvedRequests(db, planId).map((r) => r.userId);
    const pend = pendingRequests(db, planId).map((r) => r.userId);
    for (const uid of members) notify(db, uid, 'plan_updated', `“${plan.title}” planında ${what} değişti.`, planId);
    // Bekleyenlere yalnızca tarih/saat değişikliği bildirilir; kesin yer bilgisi sızdırılmaz.
    if (timeChanged) for (const uid of pend) notify(db, uid, 'plan_updated', `“${plan.title}” planının tarihi/saati değişti.`, planId);
    systemMessage(db, planId, `Plan sahibi ${what} bilgisini güncelledi.`);
  }
  return done(db, undefined);
};

export const cancelPlan = (db0: DB, actorId: string, planId: string): Result => {
  const old = getPlan(db0, planId);
  if (!old) return fail('Plan bulunamadı.');
  if (old.ownerId !== actorId) return fail('Planı yalnızca plan sahibi iptal edebilir.');
  if (old.status !== 'active') return fail('Plan zaten iptal edilmiş.');
  const db = clone(db0);
  const plan = getPlan(db, planId)!;
  plan.status = 'cancelled';
  plan.updatedAt = nowISO();
  for (const r of db.requests.filter((r) => r.planId === planId && (r.status === 'approved' || r.status === 'pending'))) {
    notify(db, r.userId, 'plan_cancelled', `“${plan.title}” planı iptal edildi.`, planId);
    if (r.status === 'pending') { r.status = 'rejected'; r.updatedAt = nowISO(); }
  }
  systemMessage(db, planId, 'Plan iptal edildi. Sohbet artık yalnızca okunabilir.');
  return done(db, undefined);
};

export const requestJoin = (db0: DB, actorId: string, planId: string, message?: string): Result<string> => {
  const plan = getPlan(db0, planId);
  const actor = getUser(db0, actorId);
  if (!plan || plan.status === 'removed' || !actor) return fail('Plan bulunamadı.');
  if (plan.ownerId === actorId) return fail('Kendi planına istek gönderemezsin.');
  if (!actor.verified18) return fail('Katılmak için 18 yaş doğrulaması gerekli.');
  if (isBlockedBetween(db0, actorId, plan.ownerId)) return fail('Bu plana katılma isteği gönderemezsin.');
  const phase = planPhase(db0, plan);
  if (phase === 'cancelled') return fail('Bu plan iptal edildi.');
  if (phase === 'past') return fail('Bu planın tarihi geçti.');
  if (phase === 'full') return fail('Plan dolu. Bir yer açılırsa yeniden deneyebilirsin.');
  const prev = requestOf(db0, planId, actorId);
  if (prev?.status === 'pending') return fail('Zaten bekleyen bir isteğin var.');
  if (prev?.status === 'approved') return fail('Zaten bu plandasın.');
  if (prev?.status === 'rejected') return fail('Plan sahibi bu plan için isteğini kabul etmedi.');

  const db = clone(db0);
  const req: JoinRequest = {
    id: newId('req'), planId, userId: actorId, status: 'pending',
    message: clean(message)?.slice(0, 280), createdAt: nowISO(), updatedAt: nowISO(),
  };
  db.requests.push(req);
  notify(db, plan.ownerId, 'request_received', `${actor.name} “${plan.title}” planına katılmak istiyor.`, planId);
  return done(db, req.id);
};

export const withdrawRequest = (db0: DB, actorId: string, planId: string): Result => {
  const req = requestOf(db0, planId, actorId);
  if (!req || req.status !== 'pending') return fail('Geri çekilecek bekleyen bir istek yok.');
  const db = clone(db0);
  const r = db.requests.find((x) => x.id === req.id)!;
  r.status = 'withdrawn';
  r.updatedAt = nowISO();
  const plan = getPlan(db, planId)!;
  notify(db, plan.ownerId, 'request_withdrawn', `${userName(db, actorId)} “${plan.title}” isteğini geri çekti.`, planId);
  return done(db, undefined);
};

/**
 * Onay: kapasite kontrolü + durum geçişi tek adımda. Canlıda bu fonksiyon
 * `approve_join_request()` Postgres fonksiyonu olarak plan satırını
 * `SELECT ... FOR UPDATE` ile kilitleyerek çalışır; eşzamanlı onaylar kontenjanı aşamaz.
 */
export const approveRequest = (db0: DB, actorId: string, requestId: string): Result => {
  const req = db0.requests.find((r) => r.id === requestId);
  if (!req) return fail('İstek bulunamadı.');
  const plan = getPlan(db0, req.planId)!;
  if (plan.ownerId !== actorId) return fail('İstekleri yalnızca plan sahibi onaylayabilir.');
  if (req.status !== 'pending') return fail('Bu istek artık beklemede değil.');
  const phase = planPhase(db0, plan);
  if (phase === 'cancelled' || phase === 'removed') return fail('İptal edilmiş plana katılımcı kabul edilemez.');
  if (phase === 'past') return fail('Tarihi geçmiş plana katılımcı kabul edilemez.');
  if (phase === 'full') return fail('Kontenjan dolu. Önce kontenjanı artır ya da bir yer açılmasını bekle.');

  const db = clone(db0);
  const r = db.requests.find((x) => x.id === requestId)!;
  r.status = 'approved';
  r.updatedAt = nowISO();
  const p = getPlan(db, plan.id)!;
  notify(db, r.userId, 'request_approved', `Onaylandın! “${p.title}” sohbeti ve buluşma noktası açıldı.`, p.id);
  systemMessage(db, p.id, `${userName(db, r.userId)} ekibe katıldı. Hoş geldin!`);
  return done(db, undefined);
};

export const rejectRequest = (db0: DB, actorId: string, requestId: string): Result => {
  const req = db0.requests.find((r) => r.id === requestId);
  if (!req) return fail('İstek bulunamadı.');
  const plan = getPlan(db0, req.planId)!;
  if (plan.ownerId !== actorId) return fail('İstekleri yalnızca plan sahibi reddedebilir.');
  if (req.status !== 'pending') return fail('Bu istek artık beklemede değil.');
  const db = clone(db0);
  const r = db.requests.find((x) => x.id === requestId)!;
  r.status = 'rejected';
  r.updatedAt = nowISO();
  notify(db, r.userId, 'request_rejected', `“${plan.title}” için isteğin bu sefer kabul edilmedi.`, plan.id);
  return done(db, undefined);
};

export const leavePlan = (db0: DB, actorId: string, planId: string): Result => {
  const req = requestOf(db0, planId, actorId);
  if (!req || req.status !== 'approved') return fail('Bu planın katılımcısı değilsin.');
  const db = clone(db0);
  const r = db.requests.find((x) => x.id === req.id)!;
  r.status = 'left';
  r.updatedAt = nowISO();
  const plan = getPlan(db, planId)!;
  systemMessage(db, planId, `${userName(db, actorId)} plandan ayrıldı. 1 yer yeniden açıldı.`);
  notify(db, plan.ownerId, 'participant_left', `${userName(db, actorId)} “${plan.title}” planından ayrıldı. Yer yeniden açıldı.`, planId);
  return done(db, undefined);
};

export const sendMessage = (db0: DB, actorId: string, planId: string, text: string): Result => {
  const plan = getPlan(db0, planId);
  if (!plan || plan.status === 'removed') return fail('Plan bulunamadı.');
  if (!isMember(db0, planId, actorId)) return fail('Bu sohbete yalnızca plan sahibi ve onaylı katılımcılar yazabilir.');
  if (plan.status === 'cancelled') return fail('Plan iptal edildiği için sohbet kapalı.');
  const t = text.trim();
  if (!t) return fail('Boş mesaj gönderilemez.');
  if (t.length > 1000) return fail('Mesaj çok uzun.');
  const db = clone(db0);
  db.messages.push({ id: newId('msg'), planId, userId: actorId, text: t, createdAt: nowISO() });
  return done(db, undefined);
};

export const report = (db0: DB, actorId: string, target: ReportTarget, reason: string, note?: string): Result => {
  if (!reason) return fail('Bir şikâyet nedeni seç.');
  if (target.kind === 'user' && target.userId === actorId) return fail('Kendini şikâyet edemezsin.');
  const db = clone(db0);
  const r: Report = { id: newId('rep'), reporterId: actorId, target, reason, note: clean(note), status: 'open', createdAt: nowISO() };
  db.reports.push(r);
  return done(db, undefined);
};

export const blockUser = (db0: DB, actorId: string, userId: string): Result => {
  if (actorId === userId) return fail('Kendini engelleyemezsin.');
  if (hasBlocked(db0, actorId, userId)) return fail('Bu kullanıcı zaten engelli.');
  const db = clone(db0);
  db.blocks.push({ blockerId: actorId, blockedId: userId, createdAt: nowISO() });
  // Aradaki bekleyen istekler kapanır.
  for (const r of db.requests) {
    if (r.status !== 'pending') continue;
    const p = getPlan(db, r.planId)!;
    if ((p.ownerId === actorId && r.userId === userId) || (p.ownerId === userId && r.userId === actorId)) {
      r.status = p.ownerId === actorId ? 'rejected' : 'withdrawn';
      r.updatedAt = nowISO();
    }
  }
  return done(db, undefined);
};

export const unblockUser = (db0: DB, actorId: string, userId: string): Result => {
  const db = clone(db0);
  db.blocks = db.blocks.filter((b) => !(b.blockerId === actorId && b.blockedId === userId));
  return done(db, undefined);
};

export const resolveReport = (db0: DB, actorId: string, reportId: string, action: 'dismiss' | 'remove_plan'): Result => {
  const mod = getUser(db0, actorId);
  if (!mod?.isModerator) return fail('Şikâyetleri yalnızca moderatörler inceleyebilir.');
  const rep = db0.reports.find((r) => r.id === reportId);
  if (!rep || rep.status !== 'open') return fail('Açık şikâyet bulunamadı.');
  const db = clone(db0);
  const r = db.reports.find((x) => x.id === reportId)!;
  r.resolvedBy = actorId;
  r.resolvedAt = nowISO();
  if (action === 'dismiss') {
    r.status = 'dismissed';
    return done(db, undefined);
  }
  if (r.target.kind !== 'plan') return fail('Yalnızca plan şikâyetlerinde plan kaldırılabilir.');
  const plan = getPlan(db, r.target.planId);
  if (!plan) return fail('Plan bulunamadı.');
  plan.status = 'removed';
  plan.updatedAt = nowISO();
  r.status = 'actioned';
  notify(db, plan.ownerId, 'plan_removed', `“${plan.title}” planın topluluk kurallarına aykırı bulunduğu için kaldırıldı.`, plan.id);
  for (const q of db.requests.filter((q) => q.planId === plan.id && (q.status === 'approved' || q.status === 'pending')))
    notify(db, q.userId, 'plan_removed', `Katıldığın “${plan.title}” planı kaldırıldı.`, plan.id);
  return done(db, undefined);
};

export const answerOutcome = (db0: DB, actorId: string, planId: string, happened: boolean): Result => {
  const plan = getPlan(db0, planId);
  if (!plan) return fail('Plan bulunamadı.');
  if (!isMember(db0, planId, actorId)) return fail('Bu soruyu yalnızca plandakiler yanıtlayabilir.');
  if (!isPast(plan) || plan.status !== 'active') return fail('Plan henüz gerçekleşmedi.');
  const db = clone(db0);
  db.outcomes = db.outcomes.filter((o) => !(o.planId === planId && o.userId === actorId));
  db.outcomes.push({ planId, userId: actorId, happened, createdAt: nowISO() });
  return done(db, undefined);
};

export const markAllRead = (db0: DB, actorId: string): Result => {
  const db = clone(db0);
  for (const n of db.notifications) if (n.userId === actorId) n.read = true;
  return done(db, undefined);
};

// ---------- pilot metrikleri ----------

export const pilotMetrics = (db: DB, at = now()) => {
  const opened = db.plans.filter((p) => p.status !== 'removed');
  const withApproved = opened.filter((p) => db.requests.some((r) => r.planId === p.id && r.status === 'approved'));
  const pastPlans = opened.filter((p) => p.status === 'active' && isPast(p, at));
  const answeredPlans = pastPlans.filter((p) => db.outcomes.some((o) => o.planId === p.id));
  const happenedPlans = answeredPlans.filter((p) => {
    const os = db.outcomes.filter((o) => o.planId === p.id);
    return os.filter((o) => o.happened).length > os.length / 2;
  });
  return {
    plansOpened: opened.length,
    plansOpenedReal: opened.filter((p) => !p.isDemo).length,
    cancelled: opened.filter((p) => p.status === 'cancelled').length,
    withApproved: withApproved.length,
    withApprovedRate: opened.length ? withApproved.length / opened.length : 0,
    pastPlans: pastPlans.length,
    outcomeAnswered: answeredPlans.length,
    happened: happenedPlans.length,
    happenedRate: answeredPlans.length ? happenedPlans.length / answeredPlans.length : 0,
    openReports: db.reports.filter((r) => r.status === 'open').length,
  };
};
