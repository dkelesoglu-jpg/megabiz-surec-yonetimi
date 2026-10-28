-- Mobil uygulama: profil gizliliği, moderasyon kararlarının kullanıcıya yansıması,
-- anonim ülke analitiği ve saklama süresi.
-- Çalıştırma: supabase/tests/run_pg_tests.sh
\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-0000000000a1', 'root@test.local',  '{"username":"kok_admin"}'),
  ('e0000000-0000-4000-8000-0000000000e1', 'editor@test.local', '{"username":"icerikci"}'),
  ('d0000000-0000-4000-8000-0000000000d1', 'mod@test.local',    '{"username":"moderator1"}'),
  ('f0000000-0000-4000-8000-0000000000f1', 'user@test.local',   '{"username":"izleyici"}'),
  ('f0000000-0000-4000-8000-0000000000f2', 'user2@test.local',  '{"username":"izleyici2"}');
update public.profiles set role = 'admin'     where id = 'a0000000-0000-4000-8000-0000000000a1';
update public.profiles set role = 'editor'    where id = 'e0000000-0000-4000-8000-0000000000e1';
update public.profiles set role = 'moderator' where id = 'd0000000-0000-4000-8000-0000000000d1';
update public.profiles set country_code = 'DE' where id = 'f0000000-0000-4000-8000-0000000000f2';

create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'BAŞARISIZ: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;
create function pg_temp.login(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
end $$;
create function pg_temp.denied(sql text, msg text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'BAŞARISIZ (izin verildi): %', msg;
exception when insufficient_privilege then
  raise notice 'ok - %', msg;
end $$;
grant execute on function pg_temp.assert(boolean, text), pg_temp.login(text), pg_temp.denied(text, text)
  to anon, authenticated;

set role authenticated;

-- 1) Profil gizliliği
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
select pg_temp.assert((select count(*) from public.profiles) = 1, 'kullanıcı yalnızca kendi profilini okur');
select pg_temp.assert(not exists (select 1 from public.profiles where id = 'f0000000-0000-4000-8000-0000000000f2'),
  'başkasının yasak/susturma durumu, rolü ve ülkesi okunamaz');
select pg_temp.assert((select username from public.public_usernames(array['f0000000-0000-4000-8000-0000000000f2']::uuid[])) = 'izleyici2',
  'başkasının yalnızca kullanıcı adı alınabilir');
select pg_temp.assert((select count(*) from public.public_usernames(array_fill('f0000000-0000-4000-8000-0000000000f2'::uuid, array[500]))) <= 200,
  'kullanıcı adı sorgusu en fazla 200 kimlikle sınırlı');
select pg_temp.login('e0000000-0000-4000-8000-0000000000e1');
select pg_temp.assert((select count(*) from public.profiles) = 1, 'kullanıcı yönetimi izni olmayan içerik yöneticisi de yalnızca kendini görür');
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
select pg_temp.assert((select count(*) from public.profiles) = 5, 'moderatör (users.read) tüm profilleri görür');
reset role;
set role anon;
select pg_temp.login(null);
select pg_temp.denied($$select * from public.public_usernames(array['f0000000-0000-4000-8000-0000000000f2']::uuid[])$$,
  'anonim istemci kullanıcı adı sorgulayamaz');
select pg_temp.assert((select count(*) from public.profiles) = 0, 'anonim istemci profil okuyamaz');
reset role;
set role authenticated;

-- 2) Gizlenen mesaj yazarına görünür kalır, diğerlerine görünmez
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'kural dışı mesaj');
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
update public.chat_messages set is_hidden = true where body = 'kural dışı mesaj';
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
select pg_temp.assert((select is_hidden from public.chat_messages where body = 'kural dışı mesaj'),
  'yazar gizlenen mesajını "gizlendi" bilgisiyle görür');
select pg_temp.login('f0000000-0000-4000-8000-0000000000f2');
select pg_temp.assert(not exists (select 1 from public.chat_messages where body = 'kural dışı mesaj'),
  'diğer kullanıcılar gizlenen mesajı görmez');

-- 3) Susturma ve yasak kullanıcıya yansır
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
select public.admin_moderate_user('f0000000-0000-4000-8000-0000000000f2', 'mute', 'deneme', 30);
select pg_temp.login('f0000000-0000-4000-8000-0000000000f2');
select pg_temp.assert((select muted_until from public.profiles where id = auth.uid()) > now() + interval '29 minutes',
  'susturulan kullanıcı kendi susturma bitiş zamanını okuyabilir');
select pg_temp.denied($$insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'x')$$,
  'susturulan kullanıcı mesaj yazamaz');
reset role;
select pg_temp.assert(
  (select count(*) from pg_publication_tables where pubname = 'supabase_realtime'
     and tablename in ('chat_room_settings', 'profiles', 'chat_messages')) = 3,
  'oda ayarları ve profil değişiklikleri canlı yayınlanır');
set role authenticated;

-- 4) Anonim izlenme kaydı ve ülke bazında k-anonimlik
reset role;
set role anon;
select pg_temp.login(null);
insert into public.watch_sessions (device_hash, channel_id, platform, country_code, duration_seconds)
select 'cihaz-tr-000000-' || i, '00000000-0000-4000-8000-000000000001', 'android', 'TR', 600
from generate_series(1, 5) i;
insert into public.watch_sessions (device_hash, channel_id, platform, country_code, duration_seconds) values
  ('cihaz-de-0000001', '00000000-0000-4000-8000-000000000001', 'ios', 'DE', 300),
  ('cihaz-de-0000002', '00000000-0000-4000-8000-000000000001', 'ios', 'DE', 300),
  ('cihaz-us-0000001', '00000000-0000-4000-8000-000000000002', 'android', 'US', 120),
  ('cihaz-us-0000001', '00000000-0000-4000-8000-000000000002', 'android', 'US', 120);
select pg_temp.assert(true, 'misafir cihaz kimlik bilgisi olmadan izlenme kaydı gönderebilir');
reset role;
set role authenticated;

select pg_temp.login('a0000000-0000-4000-8000-0000000000a1');
create temp table r as select public.admin_report(30) j;
select pg_temp.assert((select count(*) from r, jsonb_array_elements(j -> 'watch_by_country') e where e ->> 'key' = 'TR'
    and (e ->> 'minutes')::int = 50 and (e ->> 'devices')::int = 5) = 1,
  '5 ve üzeri cihazlı ülke ayrı raporlanır (TR: 50 dk, 5 cihaz)');
select pg_temp.assert((select count(*) from r, jsonb_array_elements(j -> 'watch_by_country') e where e ->> 'key' in ('DE', 'US')) = 0,
  '5''ten az cihazlı ülkeler adıyla raporlanmaz');
select pg_temp.assert((select (e ->> 'devices')::int from r, jsonb_array_elements(j -> 'watch_by_country') e where e ->> 'key' = 'OTHER') = 3,
  'küçük gruplar "OTHER" altında birleşir (3 cihaz)');
select pg_temp.assert((select (e ->> 'count')::int from r, jsonb_array_elements(j -> 'active_devices_per_day') e
    where (e ->> 'day')::date = current_date) = 8,
  'günlük aktif cihaz sayısı tekil cihazlardan hesaplanır (8)');
select pg_temp.assert((select count(*) from r, jsonb_array_elements(j -> 'users_by_country') e where e ->> 'key' = 'DE') = 0,
  'kullanıcı ülke dağılımında tek kişilik ülke görünmez');

-- 5) Saklama süresi
select pg_temp.denied($$select public.purge_old_analytics()$$, 'istemci saklama temizliğini çalıştıramaz');
reset role;
insert into public.watch_sessions (device_hash, channel_id, platform, started_at, duration_seconds)
values ('cihaz-eski-00000', '00000000-0000-4000-8000-000000000001', 'web', now() - interval '14 months', 60);
select public.purge_old_analytics();
select pg_temp.assert(not exists (select 1 from public.watch_sessions where device_hash = 'cihaz-eski-00000'),
  '13 aydan eski izlenme kayıtları silinir');
select pg_temp.assert((select count(*) from public.watch_sessions) = 9, 'yeni kayıtlar korunur');

\echo 'TÜM MOBİL GİZLİLİK VE MODERASYON TESTLERİ GEÇTİ'
