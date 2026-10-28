-- Global TV & Community — mobil uygulama için gizlilik, moderasyon görünürlüğü ve
-- anonim ülke analitiği.

-- ---------------------------------------------------------------------------
-- Profil gizliliği: herkes herkesin yasak/susturma durumunu, rolünü ve ülkesini
-- okuyabiliyordu. Artık kullanıcı yalnızca kendi profilini, yetkili personel tüm
-- profilleri görür. Başkalarının yalnızca kullanıcı adı `public_usernames` ile alınır.
-- ---------------------------------------------------------------------------
drop policy profiles_select on public.profiles;
create policy profiles_select_self on public.profiles for select using (id = auth.uid());
create policy profiles_select_staff on public.profiles for select using (public.has_permission('users.read'));

create or replace function public.public_usernames(p_ids uuid[])
returns table (id uuid, username text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.username from public.profiles p
  where p.id = any (p_ids[1:200]) and auth.uid() is not null;
$$;
revoke execute on function public.public_usernames(uuid[]) from public, anon;
grant execute on function public.public_usernames(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Moderasyon kararlarının kullanıcıya yansıması
-- ---------------------------------------------------------------------------
-- Gizlenen mesajı yazarı görmeye devam eder (uygulama "moderatör gizledi" etiketiyle
-- gösterir); diğer kullanıcılar görmez.
drop policy chat_select on public.chat_messages;
create policy chat_select on public.chat_messages for select to authenticated
  using (
    (not is_hidden or user_id = auth.uid() or public.has_role('moderator'))
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = chat_messages.user_id
    )
  );

-- Oda kilidi / yavaş mod ve kullanıcının kendi susturma/yasak durumu canlı yansısın.
-- (Gerçek zamanlı akış RLS'ye uyar: kullanıcı yalnızca kendi profil değişikliğini alır.)
alter publication supabase_realtime add table public.chat_room_settings;
alter publication supabase_realtime add table public.profiles;

-- ---------------------------------------------------------------------------
-- Anonim analitik: ülke kırılımında küçük grupları birleştir (k-anonimlik)
-- ---------------------------------------------------------------------------
-- Bir ülkede dönem içinde 5'ten az farklı cihaz/kullanıcı varsa ülke "OTHER" olarak
-- raporlanır; tek tek kişiler ülke üzerinden ayırt edilemez.
create or replace function public.analytics_min_group() returns int
language sql immutable as $$ select 5 $$;

create or replace function public.admin_report(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  since date := current_date - greatest(1, least(p_days, 365)) + 1;
  k int := public.analytics_min_group();
begin
  if not public.has_permission('reports.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'signups_per_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', n) order by d), '[]')
      from (select created_at::date d, count(*) n from public.profiles where created_at::date >= since group by 1) s),
    'active_per_day', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', n) order by day), '[]')
      from (select day, count(*) n from public.user_daily_activity where day >= since group by 1) s),
    -- Misafirler dahil: farklı anonim cihaz sayısı (cihaz kimliği uygulamada 30 günde bir yenilenir)
    'active_devices_per_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', n) order by d), '[]')
      from (select started_at::date d, count(distinct device_hash) n from public.watch_sessions
            where started_at::date >= since and device_hash is not null group by 1) s),
    'users_by_country', (select coalesce(jsonb_agg(jsonb_build_object('key', k2, 'count', n) order by n desc), '[]')
      from (select k2, sum(n)::bigint n from (
              select case when count(*) >= k then coalesce(country_code, '??') else 'OTHER' end k2, count(*) n
              from public.profiles group by country_code) g group by 1) s),
    'watch_by_country', (select coalesce(jsonb_agg(jsonb_build_object('key', k2, 'minutes', m, 'devices', dv) order by m desc), '[]')
      from (select k2, sum(m)::bigint m, sum(dv)::bigint dv from (
              select case when count(distinct device_hash) >= k then coalesce(country_code, '??') else 'OTHER' end k2,
                     sum(duration_seconds) / 60 m, count(distinct device_hash) dv
              from public.watch_sessions where started_at::date >= since group by country_code) g group by 1) s),
    'watch_by_platform', (select coalesce(jsonb_agg(jsonb_build_object('key', platform, 'minutes', m) order by m desc), '[]')
      from (select platform, sum(duration_seconds) / 60 m from public.watch_sessions where started_at::date >= since group by 1) s),
    'watch_by_channel', (select coalesce(jsonb_agg(jsonb_build_object('channel_id', channel_id, 'minutes', m, 'sessions', n) order by m desc), '[]')
      from (select channel_id, sum(duration_seconds) / 60 m, count(*) n from public.watch_sessions
            where started_at::date >= since group by 1 order by 2 desc limit 10) s),
    'messages_per_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', n) order by d), '[]')
      from (select created_at::date d, count(*) n from public.chat_messages where created_at::date >= since group by 1) s),
    'reports_by_reason', (select coalesce(jsonb_agg(jsonb_build_object('key', reason, 'count', n) order by n desc), '[]')
      from (select reason, count(*) n from public.reports where created_at::date >= since group by 1) s),
    'moderation_by_action', (select coalesce(jsonb_agg(jsonb_build_object('key', action, 'count', n) order by n desc), '[]')
      from (select action, count(*) n from public.moderation_actions where created_at::date >= since group by 1) s),
    'ads', case when public.has_permission('ads.manage') then (select jsonb_build_object(
        'impressions', coalesce(sum(impressions), 0), 'clicks', coalesce(sum(clicks), 0))
        from public.ad_stats_daily where day >= since) end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Saklama süresi: ham izlenme ve aktiflik kayıtları 13 aydan uzun tutulmaz.
-- Gerçek ortamda pg_cron ile günlük çalıştırılır; istemciler çağıramaz.
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_analytics()
returns void
language sql security definer set search_path = public
as $$
  delete from public.watch_sessions where started_at < now() - interval '13 months';
  delete from public.user_daily_activity where day < current_date - interval '13 months';
$$;
revoke execute on function public.purge_old_analytics() from public, anon, authenticated;
