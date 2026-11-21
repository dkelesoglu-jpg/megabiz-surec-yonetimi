import { beforeEach, describe, expect, it } from 'vitest';
import * as E from './engine';
import { createSeed } from './seed';
import type { DB, Result } from './types';

const BASE = new Date(2026, 10, 18, 12, 0); // Çarşamba öğlen
E.setClock(() => BASE);

const ok = <T>(r: Result<T>) => {
  if (!r.ok) throw new Error(`Beklenmeyen hata: ${r.error}`);
  return r;
};
const err = (r: Result<unknown>) => {
  expect(r.ok).toBe(false);
  return (r as { ok: false; error: string }).error;
};

const input = (over: Partial<E.PlanInput> = {}): E.PlanInput => ({
  type: 'need_people', category: 'spor', title: 'Perşembe basket oynayalım', cityId: 'istanbul',
  district: 'Kadıköy', areaLabel: 'Fenerbahçe parkı', meetingPointExact: 'Parkın basket sahası, kuzey kale',
  startAt: new Date(2026, 10, 19, 20, 0).toISOString(), capacity: 1, ...over,
});

let db: DB;
beforeEach(() => { db = createSeed(BASE); });

describe('ana senaryo: plan aç → bul → istek → onay → sohbet → ayrıl', () => {
  it('uçtan uca çalışır', () => {
    // 1) Ayşe plan açar
    const c = ok(E.createPlan(db, 'u_ayse', input()));
    db = c.db;
    const planId = c.value;

    // 2) Mert keşfette bulur; kesin yer gizli
    const found = E.discoverPlans(db, 'u_mert', { cityId: 'istanbul', district: 'Kadıköy', category: 'spor', date: { kind: 'all' } });
    expect(found.map((p) => p.id)).toContain(planId);
    const pv = E.viewPlan(db, E.getPlan(db, planId)!, 'u_mert');
    expect(pv.meetingPointExact).toBeUndefined();
    expect(pv.meetingPointHidden).toBe(true);
    expect(err(E.readChat(db, planId, 'u_mert'))).toMatch(/yalnızca plan sahibi/);

    // 3) İstek gönderir, Ayşe'ye bildirim gider
    db = ok(E.requestJoin(db, 'u_mert', planId, 'Ben gelirim!')).db;
    expect(E.requestOf(db, planId, 'u_mert')?.status).toBe('pending');
    expect(db.notifications.some((n) => n.userId === 'u_ayse' && n.kind === 'request_received')).toBe(true);
    expect(err(E.requestJoin(db, 'u_mert', planId))).toMatch(/bekleyen/);

    // 4) Ayşe onaylar
    const req = E.requestOf(db, planId, 'u_mert')!;
    expect(err(E.approveRequest(db, 'u_mert', req.id))).toMatch(/yalnızca plan sahibi/);
    db = ok(E.approveRequest(db, 'u_ayse', req.id)).db;

    // 5) Sohbet ve kesin buluşma noktası açılır
    expect(E.viewPlan(db, E.getPlan(db, planId)!, 'u_mert').meetingPointExact).toBe('Parkın basket sahası, kuzey kale');
    db = ok(E.sendMessage(db, 'u_mert', planId, 'Topu ben getiririm')).db;
    expect(ok(E.readChat(db, planId, 'u_mert')).value.some((m) => m.text === 'Topu ben getiririm')).toBe(true);
    expect(E.spotsLeft(db, E.getPlan(db, planId)!)).toBe(0);
    expect(E.planPhase(db, E.getPlan(db, planId)!)).toBe('full');

    // 6) Mert ayrılır → yer geri gelir, sohbet ve kesin yer kapanır
    db = ok(E.leavePlan(db, 'u_mert', planId)).db;
    expect(E.spotsLeft(db, E.getPlan(db, planId)!)).toBe(1);
    expect(E.planPhase(db, E.getPlan(db, planId)!)).toBe('open');
    expect(E.viewPlan(db, E.getPlan(db, planId)!, 'u_mert').meetingPointExact).toBeUndefined();
    expect(E.readChat(db, planId, 'u_mert').ok).toBe(false);
    expect(E.sendMessage(db, 'u_mert', planId, 'merhaba?').ok).toBe(false);
    // ve yeniden istek gönderebilir
    expect(E.requestJoin(db, 'u_mert', planId).ok).toBe(true);
  });
});

describe('kenar durumları', () => {
  it('dolu plana istek gönderilemez ve onay verilemez', () => {
    // p_foto: kontenjan 2, iki onaylı → dolu
    expect(E.planPhase(db, E.getPlan(db, 'p_foto')!)).toBe('full');
    expect(err(E.requestJoin(db, 'u_mert', 'p_foto'))).toMatch(/dolu/);

    // Bekleyen iki istek varken ilk onay yeri doldurur, ikincisi reddedilir
    let d = ok(E.createPlan(db, 'u_ayse', input({ capacity: 1 })));
    const pid = d.value;
    let x = ok(E.requestJoin(d.db, 'u_mert', pid)).db;
    x = ok(E.requestJoin(x, 'u_can', pid)).db;
    x = ok(E.approveRequest(x, 'u_ayse', E.requestOf(x, pid, 'u_mert')!.id)).db;
    expect(err(E.approveRequest(x, 'u_ayse', E.requestOf(x, pid, 'u_can')!.id))).toMatch(/Kontenjan dolu/);
    expect(E.approvedRequests(x, pid)).toHaveLength(1);
    // Kontenjan onaylıların altına düşürülemez
    expect(err(E.updatePlan(x, 'u_ayse', pid, input({ capacity: 0 })))).toBeTruthy();
    void d;
  });

  it('iptal edilen plana istek/onay olmaz, katılımcılar bildirim alır, sohbet salt okunur', () => {
    let d = ok(E.createPlan(db, 'u_ayse', input({ capacity: 3 })));
    const pid = d.value;
    let x = ok(E.requestJoin(d.db, 'u_mert', pid)).db;
    x = ok(E.approveRequest(x, 'u_ayse', E.requestOf(x, pid, 'u_mert')!.id)).db;
    x = ok(E.requestJoin(x, 'u_can', pid)).db;
    expect(err(E.cancelPlan(x, 'u_mert', pid))).toMatch(/yalnızca plan sahibi/);
    x = ok(E.cancelPlan(x, 'u_ayse', pid)).db;
    expect(x.notifications.filter((n) => n.kind === 'plan_cancelled').map((n) => n.userId).sort()).toEqual(['u_can', 'u_mert']);
    expect(err(E.requestJoin(x, 'u_elif', pid))).toMatch(/iptal/);
    expect(E.requestOf(x, pid, 'u_can')?.status).toBe('rejected');
    expect(err(E.sendMessage(x, 'u_mert', pid, 'selam'))).toMatch(/iptal/);
    expect(E.discoverPlans(x, 'u_elif', { cityId: 'istanbul', district: 'all', category: 'all', date: { kind: 'all' } }).some((p) => p.id === pid)).toBe(false);
    void d;
  });

  it('geri çekilen istek onaylanamaz ve yeniden gönderilebilir', () => {
    let x = ok(E.requestJoin(db, 'u_mert', 'p_kesif')).db;
    const rid = E.requestOf(x, 'p_kesif', 'u_mert')!.id;
    x = ok(E.withdrawRequest(x, 'u_mert', 'p_kesif')).db;
    expect(E.requestOf(x, 'p_kesif', 'u_mert')?.status).toBe('withdrawn');
    expect(err(E.approveRequest(x, 'u_zeynep', rid))).toMatch(/beklemede değil/);
    expect(err(E.withdrawRequest(x, 'u_mert', 'p_kesif'))).toBeTruthy();
    expect(E.requestJoin(x, 'u_mert', 'p_kesif').ok).toBe(true);
  });

  it('yetkisiz sohbet erişimi ve yazma reddedilir', () => {
    expect(E.readChat(db, 'p_tiyatro', 'u_elif').ok).toBe(true); // onaylı
    expect(E.readChat(db, 'p_tiyatro', 'u_zeynep').ok).toBe(true); // sahip
    expect(err(E.readChat(db, 'p_tiyatro', 'u_mert'))).toMatch(/yalnızca/);
    expect(err(E.sendMessage(db, 'u_mert', 'p_tiyatro', 'sızma'))).toMatch(/yalnızca/);
    // bekleyen istek sahibi de erişemez
    expect(E.readChat(db, 'p_roma', 'u_zeynep').ok).toBe(false);
  });

  it('tarih/yer değişikliği bildirimi; bekleyenlere kesin yer sızmaz', () => {
    const pl = E.getPlan(db, 'p_roma')!;
    const base: E.PlanInput = { ...pl, startAt: pl.startAt } as E.PlanInput;
    let x = ok(E.updatePlan(db, 'u_ayse', 'p_roma', { ...base, meetingPointExact: 'Başka bir meydan' })).db;
    expect(x.notifications.filter((n) => n.userId === 'u_zeynep')).toHaveLength(0); // bekleyen → yer bildirimi yok
    x = ok(E.updatePlan(x, 'u_ayse', 'p_roma', { ...base, startAt: new Date(2026, 11, 2, 11).toISOString() })).db;
    expect(x.notifications.some((n) => n.userId === 'u_zeynep' && n.kind === 'plan_updated')).toBe(true);
  });

  it('engelleme: plan gizlenir ve istek gönderilemez', () => {
    let x = ok(E.blockUser(db, 'u_mert', 'u_zeynep')).db;
    const list = E.discoverPlans(x, 'u_mert', { cityId: 'istanbul', district: 'all', category: 'all', date: { kind: 'all' } });
    expect(list.some((p) => p.ownerId === 'u_zeynep')).toBe(false);
    expect(E.requestJoin(x, 'u_mert', 'p_kesif').ok).toBe(false);
    expect(E.requestJoin(x, 'u_zeynep', 'p_kahve').ok).toBe(false); // ters yön
  });

  it('şikâyet → moderatör planı kaldırır; moderatör olmayan inceleyemez', () => {
    let x = ok(E.report(db, 'u_mert', { kind: 'plan', planId: 'p_caz' }, 'Spam / reklam')).db;
    const rep = x.reports.find((r) => r.target.kind === 'plan' && r.target.planId === 'p_caz')!;
    expect(err(E.resolveReport(x, 'u_mert', rep.id, 'remove_plan'))).toMatch(/moderatör/);
    x = ok(E.resolveReport(x, 'u_deniz', rep.id, 'remove_plan')).db;
    expect(E.getPlan(x, 'p_caz')!.status).toBe('removed');
    expect(x.notifications.some((n) => n.userId === 'u_can' && n.kind === 'plan_removed')).toBe(true);
  });

  it('tarih filtreleri: bugün ve hafta sonu', () => {
    const f = (date: E.DateFilter) => E.discoverPlans(db, 'u_mert', { cityId: 'istanbul', district: 'all', category: 'all', date }).map((p) => p.id);
    expect(f({ kind: 'today' })).toContain('p_mac');
    expect(f({ kind: 'weekend' })).toEqual(expect.arrayContaining(['p_tiyatro', 'p_belgrad', 'p_foto']));
    expect(f({ kind: 'weekend' })).not.toContain('p_mac');
  });

  it('plan gerçekleşti mi? yalnızca katılımcılar, geçmiş planda', () => {
    expect(E.answerOutcome(db, 'u_can', 'p_gecmis', true).ok).toBe(false);
    const x = ok(E.answerOutcome(db, 'u_mert', 'p_gecmis', true)).db;
    const m = E.pilotMetrics(x);
    expect(m.outcomeAnswered).toBe(1);
    expect(m.happened).toBe(1);
    expect(E.answerOutcome(db, 'u_elif', 'p_tiyatro', true).ok).toBe(false); // henüz olmadı
  });

  it('doğrulama: geçmiş tarih, seyahatte varış şehri, aktif olmayan şehir', () => {
    expect(err(E.createPlan(db, 'u_ayse', input({ startAt: new Date(2026, 10, 1).toISOString() })))).toMatch(/Geçmiş/);
    expect(err(E.createPlan(db, 'u_ayse', input({ category: 'seyahat' })))).toMatch(/varış/);
    expect(err(E.createPlan(db, 'u_ayse', input({ cityId: 'ankara', district: 'Çankaya' })))).toMatch(/İstanbul/);
  });
});
