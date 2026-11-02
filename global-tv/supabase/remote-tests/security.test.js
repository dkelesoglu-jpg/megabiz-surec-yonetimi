// Global TV — gerçek Supabase sunucusuna karşı uçtan uca güvenlik ve işlev testleri.
//
// Yerel Supabase yığınında (supabase start) ve globaltv-dev projesinde aynı şekilde çalışır.
// Testler kendi geçici kullanıcılarını oluşturur ve sonunda yalnızca bunları siler.
//
// Çalıştırma:
//   cd global-tv/supabase/remote-tests && npm ci
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=... GLOBALTV_REMOTE_TESTS=1 npm test
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: publishable, SUPABASE_SECRET_KEY: secret } = process.env;

// Güvenlik kilidi: şirket projelerinde asla çalışmaz; yalnızca açıkça izin verilince çalışır.
const FORBIDDEN_PROJECT_REFS = ['xklessegjdczwujitwuw' /* mega-hrms */, 'rggxrvanfofmnqolucnc' /* vakit-rezervasyon */];
if (!url || !publishable || !secret) throw new Error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY ve SUPABASE_SECRET_KEY gerekli.');
if (process.env.GLOBALTV_REMOTE_TESTS !== '1') throw new Error('Testler kayıt oluşturur: yalnızca test projesinde GLOBALTV_REMOTE_TESTS=1 ile çalıştırın.');
if (FORBIDDEN_PROJECT_REFS.some((ref) => url.includes(ref))) throw new Error('Bu bir şirket projesi. Global TV testleri burada çalıştırılamaz.');

const CH = {
  bipbop: '00000000-0000-4000-8000-000000000001',
  bbb: '00000000-0000-4000-8000-000000000002',
  tos: '00000000-0000-4000-8000-000000000003',
  haber: '00000000-0000-4000-8000-000000000004',
  expired: '00000000-0000-4000-8000-000000000005',
};
const RUN = Date.now().toString(36);
const PASSWORD = `Gt-${RUN}-Test!9`;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

const admin = createClient(url, secret, opts); // yalnızca kurulum/temizlik
const anon = () => createClient(url, publishable, opts);
const created = [];

/** Doğrulanmış test kullanıcısı oluşturur, istenirse rol verir ve oturum açmış istemciyi döndürür. */
async function user(tag, role = 'user') {
  const email = `gt-${RUN}-${tag}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { username: `t${RUN}${tag}`.slice(0, 24) },
  });
  if (error) throw error;
  created.push(data.user.id);
  if (role !== 'user') {
    const { error: e } = await admin.from('profiles').update({ role }).eq('id', data.user.id);
    if (e) throw e;
  }
  const client = anon();
  const { error: e2 } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (e2) throw e2;
  return { id: data.user.id, email, client };
}

const ok = ({ error }) => assert.equal(error, null, error?.message);
const rejected = (res, pattern) => {
  assert.ok(res.error, 'işlem reddedilmeliydi');
  if (pattern) assert.match(`${res.error.code} ${res.error.message}`, pattern);
};

/**
 * Realtime aboneliği açar. `ready` abonelik kurulunca, `event` ilk olay gelince çözülür
 * (en fazla `ms` bekler).
 */
function listen(client, filter, ms = 15000) {
  const channel = client.channel(`t-${Math.random().toString(36).slice(2)}`);
  let onReady;
  const ready = new Promise((r) => { onReady = r; });
  const event = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { client.removeChannel(channel); reject(new Error(`Realtime olayı gelmedi: ${filter.table}`)); }, ms);
    channel
      .on('postgres_changes', filter, (payload) => { clearTimeout(timer); client.removeChannel(channel); resolve(payload); })
      .subscribe((status) => { if (status === 'SUBSCRIBED') setTimeout(onReady, 500); });
  });
  return { ready, event };
}

let A, B, MOD, ED, ADM;
before(async () => {
  [A, B, MOD, ED, ADM] = await Promise.all([user('a'), user('b'), user('m', 'moderator'), user('e', 'editor'), user('x', 'admin')]);
  // Testler arası bağımsızlık: odaları varsayılana çek
  await admin.from('chat_room_settings').delete().in('channel_id', [CH.bbb, CH.tos, CH.bipbop]);
  await warmUpRealtime();
});

/**
 * Yeni başlatılmış Realtime sunucusu ilk aboneliğin ilk saniyelerinde olay kaçırabiliyor
 * (yerel yığında ölçüldü: soğuk başlangıçta düşüyor, ısınmışta geçiyor). Testler gerçek
 * davranışı ölçsün diye önce bir deneme mesajı ulaşana kadar beklenir. Asıl testler kendi
 * yeni abonelikleriyle çalışır; bu adım bir hatayı gizlemez.
 */
async function warmUpRealtime() {
  for (let i = 0; i < 6; i++) {
    const sub = listen(MOD.client, { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${CH.haber}` }, 5000);
    await sub.ready;
    await ADM.client.from('chat_messages').insert({ channel_id: CH.haber, body: `ısınma ${RUN} ${i}` });
    try { await sub.event; return; } catch { /* yeniden dene */ }
  }
  throw new Error('Realtime 30 saniyede hazır olmadı');
}
after(async () => {
  await admin.from('chat_room_settings').delete().in('channel_id', [CH.bbb, CH.tos, CH.bipbop]);
  for (const id of created) await admin.auth.admin.deleteUser(id);
  for (const c of [A, B, MOD, ED, ADM]) c?.client.removeAllChannels();
});

describe('Kimlik doğrulama', () => {
  test('kayıt: profil istenen kullanıcı adıyla oluşur', async () => {
    const { data } = await admin.from('profiles').select('username, role').eq('id', A.id).single();
    assert.equal(data.username, `t${RUN}a`);
    assert.equal(data.role, 'user');
  });
  test('yanlış şifreyle giriş reddedilir', async () => {
    rejected(await anon().auth.signInWithPassword({ email: A.email, password: 'yanlis-sifre-1' }));
  });
  test('kısa şifreyle kayıt reddedilir (en az 8)', async () => {
    rejected(await anon().auth.signUp({ email: `gt-${RUN}-kisa@example.com`, password: 'kisa1' }));
  });
});

describe('Kanallar ve yayın hakkı', () => {
  test('misafir yalnızca hakkı geçerli kanalları görür; süresi dolmuş görünmez', async () => {
    const { data } = await anon().from('channels').select('id');
    const ids = data.map((c) => c.id);
    assert.ok(ids.includes(CH.bbb));
    assert.ok(!ids.includes(CH.expired));
  });
  test('yayın adresleri ve hak kayıtları istemciye kapalı', async () => {
    assert.deepEqual((await A.client.from('channel_streams').select('*')).data, []);
    assert.deepEqual((await A.client.from('broadcast_rights').select('*')).data, []);
  });
});

describe('Profil gizliliği', () => {
  test('kullanıcı yalnızca kendi profilini okur', async () => {
    const { data } = await A.client.from('profiles').select('id, is_banned, role');
    assert.deepEqual(data.map((p) => p.id), [A.id]);
  });
  test('başkasının yalnızca kullanıcı adı alınabilir', async () => {
    const { data } = await A.client.rpc('public_usernames', { p_ids: [B.id] });
    assert.deepEqual(data, [{ id: B.id, username: `t${RUN}b` }]);
  });
  test('misafir kullanıcı adı sorgulayamaz', async () => {
    rejected(await anon().rpc('public_usernames', { p_ids: [B.id] }));
  });
  test('kullanıcı kendi rolünü yükseltemez', async () => {
    await A.client.from('profiles').update({ role: 'admin' }).eq('id', A.id);
    const { data } = await admin.from('profiles').select('role').eq('id', A.id).single();
    assert.equal(data.role, 'user');
  });
});

describe('Sohbet', () => {
  test('mesaj Realtime ile diğer kullanıcıya anında ulaşır; yazar adı sunucuda atanır', async () => {
    const sub = listen(B.client, { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${CH.bbb}` });
    await sub.ready;
    ok(await A.client.from('chat_messages').insert({ channel_id: CH.bbb, body: `merhaba ${RUN}` }));
    const payload = await sub.event;
    assert.equal(payload.new.body, `merhaba ${RUN}`);
    assert.equal(payload.new.author_name, `t${RUN}a`);
    assert.equal(payload.new.user_id, A.id);
  });
  test('başkası adına mesaj yazılamaz', async () => {
    rejected(await A.client.from('chat_messages').insert({ channel_id: CH.bbb, body: 'x', user_id: B.id }), /42501|row-level security/);
  });
  test('misafir mesaj okuyamaz ve yazamaz', async () => {
    assert.deepEqual((await anon().from('chat_messages').select('id')).data, []);
    rejected(await anon().from('chat_messages').insert({ channel_id: CH.bbb, body: 'x' }));
  });
  test('hakkı dolmuş kanala mesaj yazılamaz', async () => {
    rejected(await A.client.from('chat_messages').insert({ channel_id: CH.expired, body: 'x' }));
  });
  test('engellenen kullanıcının mesajları görünmez', async () => {
    ok(await B.client.from('blocks').insert({ blocker_id: B.id, blocked_id: A.id }));
    const { data } = await B.client.from('chat_messages').select('user_id').eq('channel_id', CH.bbb);
    assert.ok(data.every((m) => m.user_id !== A.id));
    ok(await B.client.from('blocks').delete().eq('blocked_id', A.id));
  });
  test('şikâyet: kullanıcı yalnızca kendi şikâyetini görür', async () => {
    const { data: msg } = await A.client.from('chat_messages').select('id').eq('body', `merhaba ${RUN}`).single();
    ok(await B.client.from('reports').insert({ reporter_id: B.id, message_id: msg.id, reason: 'spam' }));
    assert.equal((await A.client.from('reports').select('id')).data.length, 0);
    assert.ok((await MOD.client.from('reports').select('id').eq('message_id', msg.id)).data.length >= 1);
  });
});

describe('Oda kilidi ve yavaş mod', () => {
  test('normal kullanıcı oda ayarını değiştiremez', async () => {
    rejected(await A.client.from('chat_room_settings').upsert({ channel_id: CH.tos, is_locked: true }));
  });
  test('kilit: değişiklik Realtime ile gelir ve mesaj room_locked ile reddedilir', async () => {
    const sub = listen(A.client, { event: '*', schema: 'public', table: 'chat_room_settings', filter: `channel_id=eq.${CH.tos}` });
    await sub.ready;
    ok(await MOD.client.from('chat_room_settings').upsert({ channel_id: CH.tos, is_locked: true }));
    assert.equal((await sub.event).new.is_locked, true);
    rejected(await A.client.from('chat_messages').insert({ channel_id: CH.tos, body: 'x' }), /room_locked/);
  });
  test('yavaş mod: ikinci mesaj slow_mode ile reddedilir', async () => {
    ok(await MOD.client.from('chat_room_settings').upsert({ channel_id: CH.tos, is_locked: false, slow_mode_seconds: 30 }));
    ok(await A.client.from('chat_messages').insert({ channel_id: CH.tos, body: 'ilk' }));
    rejected(await A.client.from('chat_messages').insert({ channel_id: CH.tos, body: 'ikinci' }), /slow_mode/);
  });
});

describe('Moderasyon kararlarının yansıması', () => {
  test('gizlenen mesajı yazarı görür, diğerleri görmez; işlem kaydı oluşur', async () => {
    ok(await A.client.from('chat_messages').insert({ channel_id: CH.bipbop, body: `gizlenecek ${RUN}` }));
    const { data: msg } = await MOD.client.from('chat_messages').select('id').eq('body', `gizlenecek ${RUN}`).single();
    ok(await MOD.client.from('chat_messages').update({ is_hidden: true }).eq('id', msg.id));
    assert.equal((await A.client.from('chat_messages').select('is_hidden').eq('id', msg.id).single()).data.is_hidden, true);
    assert.deepEqual((await B.client.from('chat_messages').select('id').eq('id', msg.id)).data, []);
    const { data: log } = await ADM.client.from('moderation_actions').select('action').eq('message_id', msg.id);
    assert.deepEqual(log.map((l) => l.action), ['hide_message']);
  });
  test('susturma: kullanıcı kendi profil değişikliğini Realtime ile alır ve yazamaz', async () => {
    const sub = listen(B.client, { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${B.id}` });
    await sub.ready;
    ok(await MOD.client.rpc('admin_moderate_user', { p_target: B.id, p_action: 'mute', p_reason: 'test', p_minutes: 30 }));
    assert.ok(new Date((await sub.event).new.muted_until) > new Date());
    rejected(await B.client.from('chat_messages').insert({ channel_id: CH.bbb, body: 'x' }), /42501|row-level security/);
    ok(await MOD.client.rpc('admin_moderate_user', { p_target: B.id, p_action: 'unmute' }));
  });
  test('normal kullanıcı moderasyon yapamaz', async () => {
    rejected(await A.client.rpc('admin_moderate_user', { p_target: B.id, p_action: 'ban' }));
  });
});

describe('Gizlilik ve analitik', () => {
  test('misafir anonim izlenme kaydı gönderebilir, okuyamaz', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      device_hash: `${RUN}-cihaz-tr-000${i}`.padEnd(16, '0'), channel_id: CH.bbb, platform: 'android', country_code: 'TR', duration_seconds: 120,
    }));
    ok(await anon().from('watch_sessions').insert([...rows, { device_hash: `${RUN}-cihaz-de-0001`.padEnd(16, '0'), channel_id: CH.bbb, platform: 'ios', country_code: 'DE', duration_seconds: 60 }]));
    assert.deepEqual((await anon().from('watch_sessions').select('id')).data, []);
    assert.deepEqual((await A.client.from('watch_sessions').select('id')).data, []);
  });
  test('başkası adına izlenme kaydı yazılamaz', async () => {
    rejected(await A.client.from('watch_sessions').insert({ user_id: B.id, channel_id: CH.bbb, platform: 'android', duration_seconds: 1 }));
  });
  test('günlük aktiflik: yalnızca giriş yapmış kullanıcı', async () => {
    ok(await A.client.rpc('touch_activity', { p_platform: 'android' }));
    rejected(await anon().rpc('touch_activity', { p_platform: 'android' }));
  });
  test('rapor: ülke kırılımında 5 cihazdan az ülke adıyla görünmez', async () => {
    const { data, error } = await ADM.client.rpc('admin_report', { p_days: 1 });
    assert.equal(error, null);
    for (const c of data.watch_by_country) if (c.key !== 'OTHER') assert.ok(c.devices >= 5, `${c.key}: ${c.devices}`);
    assert.ok(!data.watch_by_country.some((c) => c.key === 'DE' && c.devices < 5));
  });
  test('rapor yalnızca yetkili personele açık', async () => {
    rejected(await A.client.rpc('admin_report', { p_days: 1 }));
  });
  test('saklama temizliğini istemci çalıştıramaz', async () => {
    rejected(await ADM.client.rpc('purge_old_analytics'));
  });
});

describe('Yönetim yetkileri ve belge deposu', () => {
  test('içerik yöneticisi hak belgesi yükler; moderatör yükleyemez ve göremez', async () => {
    const path = `test-${RUN}/sozlesme.pdf`;
    const pdf = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    ok(await ED.client.storage.from('rights-documents').upload(path, pdf));
    rejected(await MOD.client.storage.from('rights-documents').upload(`test-${RUN}/sahte.pdf`, pdf));
    rejected(await MOD.client.storage.from('rights-documents').download(path));
    rejected(await anon().storage.from('rights-documents').download(path));
    ok(await ED.client.storage.from('rights-documents').remove([path]));
  });
  test('denetim kaydı istemciden değiştirilemez', async () => {
    const before = (await ADM.client.from('audit_log').select('id', { count: 'exact', head: true })).count;
    await ADM.client.from('audit_log').delete().gt('id', 0);
    const afterCount = (await ADM.client.from('audit_log').select('id', { count: 'exact', head: true })).count;
    assert.equal(afterCount, before);
  });
});

// Edge Functions: gerçek projede `${SUPABASE_URL}/functions/v1`, yerelde `supabase functions serve`.
const functionsBase = process.env.GLOBALTV_FUNCTIONS_BASE ?? `${url}/functions/v1`;
const fnSkip = process.env.GLOBALTV_TEST_FUNCTIONS === '1' ? false : 'GLOBALTV_TEST_FUNCTIONS=1 ile çalışır';
const callFn = (name, { token = publishable, body } = {}) => fetch(`${functionsBase}/${name}`, {
  method: 'POST',
  headers: { apikey: publishable, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined,
});

describe('Edge Functions', { skip: fnSkip }, () => {
  test('get-stream: hakkı geçerli kanal adres döner; süresi dolmuş, ülke dışı ve eksik istek reddedilir', async () => {
    const okRes = await callFn('get-stream', { body: { channel_id: CH.bbb, country: 'TR' } });
    assert.equal(okRes.status, 200);
    assert.match((await okRes.json()).url, /^https:\/\//);
    assert.equal((await callFn('get-stream', { body: { channel_id: CH.expired, country: 'TR' } })).status, 404);
    assert.equal((await callFn('get-stream', { body: { channel_id: CH.haber, country: 'US' } })).status, 403);
    assert.equal((await callFn('get-stream', { body: {} })).status, 400);
  });
  test('delete-account: oturumsuz reddedilir; kullanıcı silinir, mesajları anonimleşir, kayıt düşer', async () => {
    const D = await user('d');
    ok(await D.client.from('chat_messages').insert({ channel_id: CH.tos, body: `silinecek ${RUN}` }));
    assert.equal((await callFn('delete-account', { token: 'sahte' })).status, 401);
    const { data: { session } } = await D.client.auth.getSession();
    const res = await callFn('delete-account', { token: session.access_token });
    assert.equal(res.status, 200);
    assert.equal((await admin.auth.admin.getUserById(D.id)).data.user, null);
    assert.deepEqual((await admin.from('profiles').select('id').eq('id', D.id)).data, []);
    const { data: msg } = await admin.from('chat_messages').select('user_id, author_name').eq('body', `silinecek ${RUN}`).single();
    assert.deepEqual(msg, { user_id: null, author_name: '[deleted]' });
    assert.equal((await admin.from('audit_log').select('id').eq('entity_id', D.id).eq('action', 'account_deleted')).data.length, 1);
  });
});
