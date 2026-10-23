-- Topluluk, analitik, sponsorluk, belge deposu ve raporlama testleri.
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
create function pg_temp.raises(sql text, expected text, msg text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'BAŞARISIZ (hata bekleniyordu): %', msg;
exception when raise_exception then
  if sqlerrm <> expected then raise; end if;
  raise notice 'ok - %', msg;
end $$;
grant execute on function pg_temp.assert(boolean, text), pg_temp.login(text), pg_temp.denied(text, text),
  pg_temp.raises(text, text, text) to anon, authenticated;

set role authenticated;

-- 1) Sohbet odası: kilit ve yavaş mod
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
insert into public.chat_room_settings (channel_id, is_locked) values ('00000000-0000-4000-8000-000000000002', true);
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
select pg_temp.raises($$insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'x')$$,
  'room_locked', 'kilitli odaya mesaj yazılamaz');
select pg_temp.denied($$insert into public.chat_room_settings (channel_id, slow_mode_seconds) values ('00000000-0000-4000-8000-000000000003', 30)$$,
  'normal kullanıcı oda ayarı değiştiremez');

select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
update public.chat_room_settings set is_locked = false, slow_mode_seconds = 30 where channel_id = '00000000-0000-4000-8000-000000000002';
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'ilk mesaj');
select pg_temp.raises($$insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'ikinci')$$,
  'slow_mode', 'yavaş modda 30 saniye dolmadan ikinci mesaj reddedilir');
insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000003', 'başka oda');
select pg_temp.assert(true, 'yavaş mod yalnızca o odayı etkiler');

-- 2) Mesaj gizleme/silme ve moderasyon kaydı
select pg_temp.login('f0000000-0000-4000-8000-0000000000f2');
delete from public.chat_messages where body = 'ilk mesaj';
select pg_temp.assert((select count(*) from public.chat_messages where body = 'ilk mesaj') = 1, 'normal kullanıcı mesaj silemez (RLS 0 satır)');

select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
update public.chat_messages set is_hidden = true where body = 'başka oda';
delete from public.chat_messages where body = 'ilk mesaj';
select pg_temp.assert(not exists (select 1 from public.chat_messages where body = 'ilk mesaj'), 'moderatör mesaj silebilir');
select pg_temp.assert((select count(*) from public.moderation_actions
    where moderator_id = 'd0000000-0000-4000-8000-0000000000d1' and action in ('hide_message', 'delete_message')) = 2,
  'gizleme ve silme moderasyon kaydına işlenir');
select pg_temp.assert(exists (select 1 from public.moderation_actions where action = 'delete_message' and message_excerpt = 'ilk mesaj'),
  'silinen mesajın özeti moderasyon kaydında kalır');

-- 3) İzlenme ve aktif kullanıcı
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
insert into public.watch_sessions (user_id, channel_id, platform, country_code, duration_seconds)
  values (auth.uid(), '00000000-0000-4000-8000-000000000002', 'android', 'TR', 1800);
select pg_temp.denied($$insert into public.watch_sessions (user_id, channel_id, platform, duration_seconds)
  values ('f0000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-000000000002', 'ios', 60)$$,
  'başkası adına izlenme kaydı eklenemez');
select pg_temp.denied($$insert into public.watch_sessions (channel_id, platform, started_at)
  values ('00000000-0000-4000-8000-000000000002', 'ios', now() - interval '10 days')$$,
  'geçmişe dönük sahte izlenme kaydı eklenemez');
select pg_temp.assert((select count(*) from public.watch_sessions) = 0, 'kullanıcı izlenme verilerini okuyamaz');
select public.touch_activity('android');
select public.touch_activity('android');
reset role;
set role anon;
select pg_temp.login(null);
insert into public.watch_sessions (device_hash, channel_id, platform, duration_seconds)
  values ('anon-device-hash-0001', '00000000-0000-4000-8000-000000000003', 'ios', 600);
select pg_temp.assert(true, 'misafir (anonim) izlenme kaydı eklenebilir');
reset role;
set role authenticated;

-- 4) Pano ve raporlar
select pg_temp.login('e0000000-0000-4000-8000-0000000000e1');
select pg_temp.assert((public.admin_dashboard_stats() ->> 'active_users_1d')::int = 1, 'günlük aktif kullanıcı sayılır (tekrar sayılmaz)');
select pg_temp.assert((public.admin_dashboard_stats() ->> 'watch_minutes_24h')::int = 40, 'son 24 saat izlenme dakikası');
select pg_temp.assert(jsonb_array_length(public.admin_report(30) -> 'watch_by_channel') = 2, 'rapor: kanal bazlı izlenme');
select pg_temp.assert(public.admin_report(30) -> 'ads' = 'null'::jsonb, 'editor reklam istatistiklerini göremez');
select pg_temp.login('a0000000-0000-4000-8000-0000000000a1');
select pg_temp.assert((public.admin_report(30) -> 'ads' ->> 'impressions')::int = 0, 'admin reklam istatistiklerini görür');
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
select pg_temp.denied($$select public.admin_report(30)$$, 'normal kullanıcı raporları göremez');

-- 5) Sponsorlu içerik
select pg_temp.login('a0000000-0000-4000-8000-0000000000a1');
insert into public.sponsorships (sponsor_name, title_tr, title_en, placement, starts_at, ends_at, is_active)
  values ('Test Sponsor', 'Sponsorlu', 'Sponsored', 'home_featured', now() - interval '1 hour', now() + interval '1 day', true);
do $$ begin
  insert into public.sponsorships (sponsor_name, title_tr, title_en, placement, click_url, starts_at, ends_at)
    values ('Kötü', 'x', 'x', 'home_featured', 'http://guvensiz.com', now(), now() + interval '1 day');
  raise exception 'BAŞARISIZ: http bağlantısı kabul edildi';
exception when check_violation then raise notice 'ok - sponsor bağlantısı https olmalı';
end $$;
select pg_temp.login('e0000000-0000-4000-8000-0000000000e1');
select pg_temp.denied($$insert into public.sponsorships (sponsor_name, title_tr, title_en, placement, starts_at, ends_at)
  values ('X Sponsor', 'x', 'x', 'chat_pinned', now(), now() + interval '1 day')$$, 'editor sponsorluk ekleyemez');
reset role;
set role anon;
select pg_temp.login(null);
select pg_temp.assert((select count(*) from public.sponsorships) = 1, 'aktif sponsorluk uygulamaya görünür');
reset role;
set role authenticated;

-- 6) Yayın hakkı belgeleri (özel depo)
select pg_temp.login('e0000000-0000-4000-8000-0000000000e1');
insert into storage.objects (bucket_id, name) values ('rights-documents', 'r-1/sozlesme.pdf');
select pg_temp.assert((select count(*) from storage.objects where bucket_id = 'rights-documents') = 1, 'editor belge yükleyip görebilir');
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
select pg_temp.assert((select count(*) from storage.objects where bucket_id = 'rights-documents') = 0, 'moderatör belgeleri göremez');
select pg_temp.denied($$insert into storage.objects (bucket_id, name) values ('rights-documents', 'sahte.pdf')$$, 'moderatör belge yükleyemez');
reset role;
select pg_temp.assert(not (select public from storage.buckets where id = 'rights-documents'), 'belge kovası herkese açık değil');

-- 7) Denetim kaydı yeni tablolarda da çalışır
select pg_temp.assert(exists (select 1 from public.audit_log where entity = 'chat_room_settings'), 'oda ayarı değişikliği denetim kaydında');
select pg_temp.assert(exists (select 1 from public.audit_log where entity = 'chat_messages' and action = 'delete'
    and payload -> 'old' ->> 'body' = 'ilk mesaj'), 'silinen mesajın tam içeriği denetim kaydında (kanıt)');
select pg_temp.assert(exists (select 1 from public.audit_log where entity = 'sponsorships'), 'sponsorluk denetim kaydında');

\echo 'TÜM TOPLULUK VE ANALİTİK TESTLERİ GEÇTİ'
