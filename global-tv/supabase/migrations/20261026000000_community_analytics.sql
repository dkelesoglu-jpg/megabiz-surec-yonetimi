-- Global TV & Community — topluluk yönetimi, izlenme/aktif kullanıcı analitiği,
-- sponsorlu içerik, yayın hakkı belgeleri (Storage) ve raporlama.

-- ---------------------------------------------------------------------------
-- Yeni izinler
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role, permission)
select r::public.user_role, p
from (values
  ('admin', 'community.manage'), ('admin', 'reports.read'),
  ('moderator', 'community.manage'), ('moderator', 'reports.read'),
  ('editor', 'reports.read')
) as t(r, p);

-- ---------------------------------------------------------------------------
-- Sohbet odaları: kilit ve yavaş mod (oda = kanal)
-- ---------------------------------------------------------------------------
create table public.chat_room_settings (
  channel_id         uuid primary key references public.channels (id) on delete cascade,
  is_locked          boolean not null default false,
  slow_mode_seconds  int not null default 0 check (slow_mode_seconds between 0 and 300),
  updated_at         timestamptz not null default now()
);

alter table public.chat_room_settings enable row level security;
create policy room_settings_public_select on public.chat_room_settings for select using (true);
create policy room_settings_manage on public.chat_room_settings for all
  using (public.has_permission('community.manage')) with check (public.has_permission('community.manage'));

create trigger chat_room_settings_audit after insert or update or delete on public.chat_room_settings
  for each row execute function public.audit_row_change();

-- Mesaj ekleme kurallarına oda kilidi ve yavaş mod eklenir (hız sınırı korunur).
create or replace function public.before_chat_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  room public.chat_room_settings;
begin
  select * into room from public.chat_room_settings where channel_id = new.channel_id;
  if room.is_locked then
    raise exception 'room_locked' using errcode = 'P0001';
  end if;
  if coalesce(room.slow_mode_seconds, 0) > 0 and exists (
    select 1 from public.chat_messages
    where user_id = new.user_id and channel_id = new.channel_id
      and created_at > now() - make_interval(secs => room.slow_mode_seconds)
  ) then
    raise exception 'slow_mode' using errcode = 'P0001';
  end if;

  -- Hız sınırı: kullanıcı başına 10 saniyede en fazla 5 mesaj.
  if (
    select count(*) from public.chat_messages
    where user_id = new.user_id and created_at > now() - interval '10 seconds'
  ) >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select p.username into new.author_name from public.profiles p where p.id = new.user_id;
  new.is_hidden := false;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Mesaj silme (kalıcı) + moderasyon işlem kaydı
-- ---------------------------------------------------------------------------
alter table public.moderation_actions drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check
  check (action in ('warn', 'mute', 'unmute', 'ban', 'unban', 'hide_message', 'unhide_message', 'delete_message'));
alter table public.moderation_actions add column message_id bigint;
alter table public.moderation_actions add column message_excerpt text;

create policy chat_delete on public.chat_messages for delete using (public.has_permission('chat.moderate'));

-- Silinen mesajın içeriği denetim kaydında kalır (kanıt).
create trigger chat_messages_audit_delete after delete on public.chat_messages
  for each row execute function public.audit_row_change();

-- Mesaj gizleme/gösterme/silme moderasyon kaydına otomatik işlenir.
create or replace function public.log_message_moderation()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  msg public.chat_messages := coalesce(new, old);
  act text := case
    when tg_op = 'DELETE' then 'delete_message'
    when new.is_hidden then 'hide_message'
    else 'unhide_message' end;
begin
  if auth.uid() is null or msg.user_id is null then
    return msg;
  end if;
  insert into public.moderation_actions (moderator_id, target_user, action, message_id, message_excerpt)
  values (auth.uid(), msg.user_id, act, msg.id, left(msg.body, 80));
  return msg;
end;
$$;

create trigger chat_messages_moderation_update after update on public.chat_messages
  for each row when (old.is_hidden is distinct from new.is_hidden)
  execute function public.log_message_moderation();
create trigger chat_messages_moderation_delete after delete on public.chat_messages
  for each row execute function public.log_message_moderation();

-- ---------------------------------------------------------------------------
-- İzlenme oturumları ve günlük aktif kullanıcılar (KVKK: analitik onayı verilmişse gönderilir)
-- ---------------------------------------------------------------------------
create table public.watch_sessions (
  id                bigint generated always as identity primary key,
  user_id           uuid references public.profiles (id) on delete set null,
  device_hash       text check (device_hash is null or char_length(device_hash) between 16 and 128),
  channel_id        uuid not null references public.channels (id) on delete cascade,
  platform          text not null check (platform in ('android', 'ios', 'web')),
  country_code      char(2),
  started_at        timestamptz not null default now(),
  duration_seconds  int not null default 0 check (duration_seconds between 0 and 86400)
);
create index watch_sessions_started_idx on public.watch_sessions (started_at desc);
create index watch_sessions_channel_idx on public.watch_sessions (channel_id, started_at desc);

alter table public.watch_sessions enable row level security;
-- Uygulama yalnızca kendi adına (veya anonim) ve makul zamanlı kayıt ekleyebilir; okuyamaz.
create policy watch_insert on public.watch_sessions for insert to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and started_at between now() - interval '1 day' and now() + interval '5 minutes'
  );
create policy watch_read on public.watch_sessions for select using (public.has_permission('reports.read'));

create table public.user_daily_activity (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  day       date not null default current_date,
  platform  text check (platform in ('android', 'ios', 'web')),
  primary key (user_id, day)
);

alter table public.user_daily_activity enable row level security;
create policy activity_read on public.user_daily_activity for select using (public.has_permission('reports.read'));

-- Uygulama açılışında çağrılır; kullanıcı yalnızca kendi bugünkü kaydını oluşturabilir.
create or replace function public.touch_activity(p_platform text)
returns void
language sql security definer set search_path = public
as $$
  insert into public.user_daily_activity (user_id, day, platform)
  select auth.uid(), current_date, p_platform
  where auth.uid() is not null
  on conflict (user_id, day) do nothing;
$$;
revoke execute on function public.touch_activity(text) from public, anon;
grant execute on function public.touch_activity(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Sponsorlu içerik ve reklam istatistikleri (ileride AdMob raporlarından doldurulur)
-- ---------------------------------------------------------------------------
create table public.sponsorships (
  id            uuid primary key default gen_random_uuid(),
  sponsor_name  text not null check (char_length(sponsor_name) between 2 and 120),
  title_tr      text not null check (char_length(title_tr) between 1 and 120),
  title_en      text not null check (char_length(title_en) between 1 and 120),
  placement     text not null check (placement in ('home_featured', 'channel_banner', 'chat_pinned')),
  channel_id    uuid references public.channels (id) on delete set null,
  click_url     text check (click_url is null or click_url like 'https://%'),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  is_active     boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.sponsorships enable row level security;
create policy sponsorships_public_select on public.sponsorships for select
  using (is_active and now() between starts_at and ends_at);
create policy sponsorships_manage on public.sponsorships for all
  using (public.has_permission('ads.manage')) with check (public.has_permission('ads.manage'));
create trigger sponsorships_audit after insert or update or delete on public.sponsorships
  for each row execute function public.audit_row_change();

create table public.ad_stats_daily (
  placement_key  text not null,
  day            date not null,
  impressions    int not null default 0 check (impressions >= 0),
  clicks         int not null default 0 check (clicks >= 0),
  primary key (placement_key, day)
);
alter table public.ad_stats_daily enable row level security;
create policy ad_stats_read on public.ad_stats_daily for select using (public.has_permission('ads.manage'));
-- Yazma yalnızca sunucu (service role) tarafından: istemci politikası yok.

-- ---------------------------------------------------------------------------
-- Yayın hakkı belgeleri: özel Storage kovası, yalnızca rights.manage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('rights-documents', 'rights-documents', false)
  on conflict (id) do nothing;

create policy rights_docs_read on storage.objects for select
  using (bucket_id = 'rights-documents' and public.has_permission('rights.manage'));
create policy rights_docs_insert on storage.objects for insert
  with check (bucket_id = 'rights-documents' and public.has_permission('rights.manage'));
create policy rights_docs_delete on storage.objects for delete
  using (bucket_id = 'rights-documents' and public.has_permission('rights.manage'));

alter table public.broadcast_rights add column document_name text;

-- ---------------------------------------------------------------------------
-- Pano ve raporlama
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.has_permission('dashboard.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users_total',        (select count(*) from public.profiles),
    'users_banned',       (select count(*) from public.profiles where is_banned),
    'users_new_7d',       (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'active_users_1d',    (select count(*) from public.user_daily_activity where day = current_date),
    'active_users_7d',    (select count(distinct user_id) from public.user_daily_activity where day > current_date - 7),
    'channels_total',     (select count(*) from public.channels),
    'channels_live',      (select count(*) from public.channels c where c.is_active and public.channel_has_valid_rights(c.id)),
    'rights_expiring_14d', (select count(*) from public.broadcast_rights
                            where status = 'verified' and valid_until between current_date and current_date + 14),
    'watch_minutes_24h',  (select coalesce(sum(duration_seconds), 0) / 60 from public.watch_sessions where started_at > now() - interval '24 hours'),
    'messages_24h',       (select count(*) from public.chat_messages where created_at > now() - interval '24 hours'),
    'reports_open',       (select count(*) from public.reports where status = 'open')
  );
end;
$$;

create or replace function public.admin_report(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  since date := current_date - greatest(1, least(p_days, 365)) + 1;
begin
  if not public.has_permission('reports.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'signups_per_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', n) order by d), '[]')
      from (select created_at::date d, count(*) n from public.profiles where created_at::date >= since group by 1) s),
    'active_per_day', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', n) order by day), '[]')
      from (select day, count(*) n from public.user_daily_activity where day >= since group by 1) s),
    'users_by_country', (select coalesce(jsonb_agg(jsonb_build_object('key', k, 'count', n) order by n desc), '[]')
      from (select coalesce(country_code, '??') k, count(*) n from public.profiles group by 1) s),
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

revoke execute on function public.admin_report(int) from public, anon;
grant execute on function public.admin_report(int) to authenticated;
