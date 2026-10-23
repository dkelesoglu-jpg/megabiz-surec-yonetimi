-- Yönetim paneli yetki testleri: roller, sütun korumaları, RPC'ler, denetim kaydı.
-- Çalıştırma: supabase/tests/run_pg_tests.sh
\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-0000000000a1', 'root@test.local',  '{"username":"kok_admin"}'),
  ('a0000000-0000-4000-8000-0000000000a2', 'admin2@test.local', '{"username":"ikinci_admin"}'),
  ('e0000000-0000-4000-8000-0000000000e1', 'editor@test.local', '{"username":"icerikci"}'),
  ('d0000000-0000-4000-8000-0000000000d1', 'mod@test.local',    '{"username":"moderator1"}'),
  ('f0000000-0000-4000-8000-0000000000f1', 'user@test.local',   '{"username":"izleyici"}');
-- Sunucu tarafı rol ataması (oturum yok)
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
-- Beklenen yetki hatası: SQL çalışır ve 42501 (insufficient_privilege) vermelidir.
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

-- 1) İçerik yöneticisi (editor)
select pg_temp.login('e0000000-0000-4000-8000-0000000000e1');
insert into public.channels (id, slug, name, country_code, category, language)
  values ('c0000000-0000-4000-8000-0000000000c1', 'yeni-kanal', 'Yeni Kanal', 'TR', 'news', 'tr');
select pg_temp.assert(exists (select 1 from public.channels where slug = 'yeni-kanal'), 'editor kanal ekleyebilir');
insert into public.broadcast_rights (channel_id, rights_holder, license_type, allowed_countries, valid_from, valid_until)
  values ('c0000000-0000-4000-8000-0000000000c1', 'Test Yayıncı', 'direct_agreement', '{TR}', current_date, current_date + 10);
select pg_temp.assert((select count(*) from public.broadcast_rights where channel_id = 'c0000000-0000-4000-8000-0000000000c1') = 1,
  'editor yayın hakkı ekleyebilir ve görebilir');
do $$ begin
  insert into public.channels (slug, name, country_code, category, language) values ('x', 'X', 'TR', 'olmayan_kategori', 'tr');
  raise exception 'BAŞARISIZ: tanımsız kategori kabul edildi';
exception when foreign_key_violation then raise notice 'ok - tanımsız kategori reddedilir';
end $$;
select pg_temp.denied($$select public.admin_set_role('f0000000-0000-4000-8000-0000000000f1', 'moderator')$$,
  'editor rol değiştiremez (RPC)');
select pg_temp.denied($$select public.admin_moderate_user('f0000000-0000-4000-8000-0000000000f1', 'ban')$$,
  'editor kullanıcı yasaklayamaz');
update public.app_settings set value = '{"x":1}' where key = 'languages';
select pg_temp.assert((select value->>'default' from public.app_settings where key = 'languages') = 'tr',
  'editor sistem ayarlarını değiştiremez (RLS satırı etkilemez)');
select pg_temp.assert((select count(*) from public.audit_log) = 0, 'editor denetim kaydını okuyamaz');
insert into public.announcements (title_tr, title_en) values ('Hoş geldiniz', 'Welcome');
select pg_temp.assert(exists (select 1 from public.announcements where title_tr = 'Hoş geldiniz'), 'editor duyuru ekleyebilir');

-- 2) Moderatör
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
update public.channels set name = 'Ele geçirildi' where slug = 'demo-mux-bbb';
select pg_temp.assert((select name from public.channels where slug = 'demo-mux-bbb') = 'Big Buck Bunny',
  'moderatör kanal değiştiremez');
select pg_temp.assert((select count(*) from public.broadcast_rights) = 0, 'moderatör yayın haklarını göremez');
select public.admin_moderate_user('f0000000-0000-4000-8000-0000000000f1', 'mute', 'spam', 30);
select pg_temp.assert((select muted_until > now() from public.profiles where id = 'f0000000-0000-4000-8000-0000000000f1'),
  'moderatör kullanıcıyı susturabilir (RPC)');
select pg_temp.denied($$update public.profiles set role = 'admin' where id = 'f0000000-0000-4000-8000-0000000000f1'$$,
  'moderatör doğrudan güncellemeyle rol veremez (tetikleyici)');
select pg_temp.denied($$select public.admin_moderate_user('a0000000-0000-4000-8000-0000000000a1', 'ban')$$,
  'moderatör admini yasaklayamaz');
select pg_temp.denied($$update public.profiles set is_banned = true where id = auth.uid()$$,
  'moderatör kendi durumunu değiştiremez');
select pg_temp.assert((select (public.admin_dashboard_stats() ->> 'reports_open') is not null), 'moderatör paneli görür');

-- 3) Normal kullanıcı
select pg_temp.login('f0000000-0000-4000-8000-0000000000f1');
select pg_temp.denied($$select public.admin_dashboard_stats()$$, 'normal kullanıcı panel istatistiklerini alamaz');
select pg_temp.denied($$update public.profiles set muted_until = null where id = auth.uid()$$,
  'kullanıcı kendi susturmasını kaldıramaz');
select pg_temp.denied($$insert into public.audit_log (action, entity) values ('sahte', 'x')$$,
  'kullanıcı denetim kaydına yazamaz');

-- 4) Admin
select pg_temp.login('a0000000-0000-4000-8000-0000000000a1');
select public.admin_set_role('a0000000-0000-4000-8000-0000000000a2', 'admin');
select pg_temp.assert((select role from public.profiles where id = 'a0000000-0000-4000-8000-0000000000a2') = 'admin',
  'admin rol atayabilir');
select pg_temp.denied($$select public.admin_set_role(auth.uid(), 'user')$$, 'admin kendi rolünü düşüremez');
update public.app_settings set value = '{"supported": ["tr", "en"], "default": "en"}' where key = 'languages';
select pg_temp.assert((select value->>'default' from public.app_settings where key = 'languages') = 'en',
  'admin sistem ayarını değiştirebilir');
insert into public.ad_placements (key, name, platform, format) values ('home_banner', 'Ana sayfa banner', 'all', 'banner');
select pg_temp.assert(exists (select 1 from public.ad_placements where key = 'home_banner'), 'admin reklam alanı ekleyebilir');

-- Denetim kaydı: kim, ne, hangi kayıt
select pg_temp.assert(exists (select 1 from public.audit_log
    where entity = 'channels' and action = 'insert' and entity_id = 'c0000000-0000-4000-8000-0000000000c1'
      and actor_id = 'e0000000-0000-4000-8000-0000000000e1'),
  'kanal eklenmesi işlemi yapan editor ile kaydedildi');
select pg_temp.assert(exists (select 1 from public.audit_log
    where entity = 'profiles' and actor_id = 'd0000000-0000-4000-8000-0000000000d1'
      and payload -> 'new' ->> 'muted_until' is not null),
  'susturma işlemi moderatör ile kaydedildi');
select pg_temp.assert(exists (select 1 from public.audit_log where entity = 'moderation_actions'), 'moderasyon işlemi kaydedildi');
select pg_temp.assert(exists (select 1 from public.audit_log where entity = 'app_settings' and entity_id = 'languages'),
  'ayar değişikliği kaydedildi');
delete from public.audit_log;  -- silme politikası yok: RLS 0 satırı etkiler
select pg_temp.assert((select count(*) from public.audit_log) > 0, 'denetim kaydı silinemez (admin dahil)');

-- 5) Şikâyet çözümü (moderatör) mesajı gizler ve kaydeder
reset role;
select pg_temp.login(null);
insert into public.chat_messages (channel_id, user_id, body)
  values ('00000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-0000000000f1', 'kötü mesaj');
insert into public.reports (id, reporter_id, message_id, reason)
  select 'b0000000-0000-4000-8000-0000000000b1', 'a0000000-0000-4000-8000-0000000000a2', id, 'abuse'
  from public.chat_messages where body = 'kötü mesaj';
set role authenticated;
select pg_temp.login('d0000000-0000-4000-8000-0000000000d1');
select public.admin_resolve_report('b0000000-0000-4000-8000-0000000000b1', 'actioned', true);
select pg_temp.assert((select is_hidden from public.chat_messages where body = 'kötü mesaj'), 'şikâyet çözümü mesajı gizler');
select pg_temp.assert((select status from public.reports where id = 'b0000000-0000-4000-8000-0000000000b1') = 'actioned',
  'şikâyet durumu güncellenir');

-- 6) Anonim: yalnızca herkese açık ayar/duyuru/reklam
reset role;
set role anon;
select pg_temp.login(null);
select pg_temp.assert((select count(*) from public.app_settings) = 3, 'anonim uygulama ayarlarını okur');
select pg_temp.assert((select count(*) from public.ad_placements) = 0, 'kapalı reklam alanları anonime görünmez');
select pg_temp.assert((select count(*) from public.announcements) = 1, 'aktif duyuru anonime görünür');
reset role;

\echo 'TÜM YÖNETİM PANELİ TESTLERİ GEÇTİ'
