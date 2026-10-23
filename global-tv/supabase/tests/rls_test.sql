-- Erişim kuralları (RLS) ve tetikleyici testleri.
-- Çalıştırma: supabase/tests/run_pg_tests.sh  (düz PostgreSQL üzerinde)
\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on

-- Test kullanıcıları (A, B, C, Admin)
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@test.local', '{"username":"ali"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@test.local', '{"username":"ali"}'),          -- çakışan ad
  ('cccccccc-0000-4000-8000-000000000003', 'c@test.local', '{"username":"x!"}'),           -- geçersiz ad
  ('dddddddd-0000-4000-8000-000000000004', 'admin@test.local', '{"username":"yonetici"}');
update public.profiles set role = 'admin' where id = 'dddddddd-0000-4000-8000-000000000004';

create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'BAŞARISIZ: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;
grant execute on function pg_temp.assert(boolean, text) to anon, authenticated;

create function pg_temp.login(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
end $$;
grant execute on function pg_temp.login(text) to anon, authenticated;

-- 1) Profil oluşturma tetikleyicisi
select pg_temp.assert((select username from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001') = 'ali',
  'yeni kullanıcı için profil istenen adla oluşur');
select pg_temp.assert((select username from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002') like 'user_%',
  'kullanılmış ad yerine otomatik ad verilir');
select pg_temp.assert((select username from public.profiles where id = 'cccccccc-0000-4000-8000-000000000003') like 'user_%',
  'geçersiz ad yerine otomatik ad verilir');

-- 2) Anonim kullanıcı: yayın hakkı kuralı
set role anon;
select pg_temp.login(null);
select pg_temp.assert((select count(*) from public.channels) = 4, 'anonim kullanıcı yalnızca hakkı geçerli 4 kanalı görür');
select pg_temp.assert(not exists (select 1 from public.channels where slug = 'demo-expired'), 'süresi dolmuş haklı kanal görünmez');
select pg_temp.assert((select count(*) from public.channel_streams) = 0, 'akış URL''leri istemciye kapalı');
select pg_temp.assert((select count(*) from public.broadcast_rights) = 0, 'yayın hakkı kayıtları istemciye kapalı');
reset role;

-- 3) Sohbet
set role authenticated;
select pg_temp.login('aaaaaaaa-0000-4000-8000-000000000001');
insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'Merhaba');
select pg_temp.assert((select author_name from public.chat_messages where body = 'Merhaba') = 'ali',
  'yazar adı profilden atanır, user_id oturumdan gelir');

do $$ begin
  insert into public.chat_messages (channel_id, user_id, body)
    values ('00000000-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'sahte');
  raise exception 'BAŞARISIZ: başkası adına mesaj yazılabildi';
exception when insufficient_privilege then raise notice 'ok - başkası adına mesaj yazılamaz';
end $$;

do $$ begin
  insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000005', 'x');
  raise exception 'BAŞARISIZ: hakkı dolmuş kanala mesaj yazılabildi';
exception when insufficient_privilege then raise notice 'ok - hakkı dolmuş kanala mesaj yazılamaz';
end $$;

do $$ begin
  update public.profiles set role = 'admin' where id = auth.uid();
  raise exception 'BAŞARISIZ: kullanıcı kendini admin yapabildi';
exception when insufficient_privilege then raise notice 'ok - kullanıcı kendi rolünü yükseltemez';
end $$;

-- Hız sınırı: 1 mesaj zaten var, 4 daha → 5; 6. mesaj reddedilmeli
insert into public.chat_messages (channel_id, body)
  select '00000000-0000-4000-8000-000000000002', 'm' || g from generate_series(1, 4) g;
do $$ begin
  insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'fazla');
  raise exception 'BAŞARISIZ: hız sınırı çalışmadı';
exception when raise_exception then
  if sqlerrm <> 'rate_limited' then raise; end if;
  raise notice 'ok - 10 saniyede 6. mesaj reddedilir';
end $$;

-- Favoriler yalnızca sahibine görünür
insert into public.favorites (user_id, channel_id) values (auth.uid(), '00000000-0000-4000-8000-000000000002');

-- 4) Engelleme ve şikâyet (kullanıcı B)
select pg_temp.login('bbbbbbbb-0000-4000-8000-000000000002');
select pg_temp.assert((select count(*) from public.chat_messages) = 5, 'B, A''nın mesajlarını görür');
select pg_temp.assert((select count(*) from public.favorites) = 0, 'B, A''nın favorilerini göremez');
insert into public.reports (reporter_id, message_id, reason)
  select auth.uid(), id, 'spam' from public.chat_messages where body = 'Merhaba';
insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), 'aaaaaaaa-0000-4000-8000-000000000001');
select pg_temp.assert((select count(*) from public.chat_messages) = 0, 'B, engellediği A''nın mesajlarını görmez');

select pg_temp.login('cccccccc-0000-4000-8000-000000000003');
select pg_temp.assert((select count(*) from public.chat_messages) = 5, 'C (engellemeyen) mesajları görmeye devam eder');
select pg_temp.assert((select count(*) from public.reports) = 0, 'C, başkasının şikâyetini göremez');
reset role;

-- 5) Yasaklı kullanıcı yazamaz
select pg_temp.login(null);  -- sunucu işlemi (oturum yok)
update public.profiles set is_banned = true where id = 'cccccccc-0000-4000-8000-000000000003';
set role authenticated;
select pg_temp.login('cccccccc-0000-4000-8000-000000000003');
do $$ begin
  insert into public.chat_messages (channel_id, body) values ('00000000-0000-4000-8000-000000000002', 'x');
  raise exception 'BAŞARISIZ: yasaklı kullanıcı yazabildi';
exception when insufficient_privilege then raise notice 'ok - yasaklı kullanıcı mesaj yazamaz';
end $$;

-- 6) Admin
select pg_temp.login('dddddddd-0000-4000-8000-000000000004');
select pg_temp.assert((select count(*) from public.channels) = 5, 'admin süresi dolmuş kanal dahil tüm kanalları görür');
select pg_temp.assert((select count(*) from public.reports) = 1, 'admin şikâyet kuyruğunu görür');
reset role;

-- 7) Hesap silme: mesajlar anonimleşir
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.assert(not exists (select 1 from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'hesap silinince profil silinir');
select pg_temp.assert((select count(*) from public.chat_messages where author_name = '[deleted]' and user_id is null) = 5,
  'silinen kullanıcının mesajları anonimleşir');
select pg_temp.assert(not exists (select 1 from public.favorites where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'favoriler silinir');

\echo 'TÜM RLS TESTLERİ GEÇTİ'
