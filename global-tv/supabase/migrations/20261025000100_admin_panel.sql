-- Global TV & Community — yönetim paneli: izinler, sunucu tarafı korumalar,
-- kategoriler, reklam alanları, ayarlar, duyurular, denetim kaydı.
-- Yetki burada (RLS + tetikleyiciler + RPC) uygulanır; panel arayüzü yalnızca yansıtır.

-- ---------------------------------------------------------------------------
-- Roller ve izinler
-- ---------------------------------------------------------------------------
-- has_role artık enum sırasına dayanmaz: admin her şeyi kapsar, diğer roller yalnızca kendilerini.
create or replace function public.has_role(min_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and not p.is_banned
      and (p.role = 'admin' or p.role = min_role or min_role = 'user')
  );
$$;

create table public.role_permissions (
  role        public.user_role not null,
  permission  text not null,
  primary key (role, permission)
);

insert into public.role_permissions (role, permission)
select r::public.user_role, p
from (values
  ('admin', 'dashboard.read'), ('admin', 'channels.manage'), ('admin', 'rights.manage'),
  ('admin', 'users.read'), ('admin', 'users.moderate'), ('admin', 'users.manage_roles'),
  ('admin', 'chat.moderate'), ('admin', 'reports.manage'), ('admin', 'ads.manage'),
  ('admin', 'settings.manage'), ('admin', 'announcements.manage'), ('admin', 'audit.read'),
  ('editor', 'dashboard.read'), ('editor', 'channels.manage'), ('editor', 'rights.manage'),
  ('editor', 'announcements.manage'),
  ('moderator', 'dashboard.read'), ('moderator', 'users.read'), ('moderator', 'users.moderate'),
  ('moderator', 'chat.moderate'), ('moderator', 'reports.manage')
) as t(r, p);

create or replace function public.has_permission(p_permission text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role = pr.role
    where pr.id = auth.uid() and not pr.is_banned and rp.permission = p_permission
  );
$$;

create or replace function public.my_permissions()
returns setof text
language sql stable security definer set search_path = public
as $$
  select rp.permission
  from public.profiles pr
  join public.role_permissions rp on rp.role = pr.role
  where pr.id = auth.uid() and not pr.is_banned;
$$;

alter table public.role_permissions enable row level security;
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Profil değişiklik koruması (sütun düzeyinde, her yoldan geçerli)
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  status_changed boolean := new.is_banned is distinct from old.is_banned
                            or new.muted_until is distinct from old.muted_until;
  role_changed boolean := new.role is distinct from old.role;
begin
  -- Sunucu (service role / migration) işlemleri: oturum yok.
  if auth.uid() is null then
    return new;
  end if;

  if role_changed and not public.has_permission('users.manage_roles') then
    raise exception 'forbidden: role change requires users.manage_roles' using errcode = '42501';
  end if;
  if status_changed and not public.has_permission('users.moderate') then
    raise exception 'forbidden: status change requires users.moderate' using errcode = '42501';
  end if;
  if (role_changed or status_changed) and new.id = auth.uid() then
    raise exception 'forbidden: cannot change own role or status' using errcode = '42501';
  end if;
  if status_changed and old.role = 'admin' and not public.has_role('admin') then
    raise exception 'forbidden: only admins can restrict an admin' using errcode = '42501';
  end if;
  if old.role = 'admin' and (new.role <> 'admin' or new.is_banned)
     and (select count(*) from public.profiles where role = 'admin' and not is_banned) <= 1 then
    raise exception 'forbidden: last active admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create policy profiles_moderate on public.profiles for update
  using (public.has_permission('users.moderate'))
  with check (public.has_permission('users.moderate'));

-- ---------------------------------------------------------------------------
-- Kategoriler (sabit liste yerine tablo)
-- ---------------------------------------------------------------------------
create table public.channel_categories (
  key         text primary key check (key ~ '^[a-z][a-z0-9_]{1,30}$'),
  name_tr     text not null,
  name_en     text not null,
  sort_order  int not null default 100,
  is_active   boolean not null default true
);

insert into public.channel_categories (key, name_tr, name_en, sort_order) values
  ('news', 'Haber', 'News', 10),
  ('sports', 'Spor', 'Sports', 20),
  ('entertainment', 'Eğlence', 'Entertainment', 30),
  ('kids', 'Çocuk', 'Kids', 40),
  ('music', 'Müzik', 'Music', 50),
  ('documentary', 'Belgesel', 'Documentary', 60),
  ('other', 'Diğer', 'Other', 90);

alter table public.channels drop constraint if exists channels_category_check;
alter table public.channels
  add constraint channels_category_fkey foreign key (category) references public.channel_categories (key);

alter table public.channel_categories enable row level security;
create policy categories_public_select on public.channel_categories for select using (true);
create policy categories_manage on public.channel_categories for all
  using (public.has_permission('channels.manage')) with check (public.has_permission('channels.manage'));

-- İçerik yöneticileri (editor) için kanal, yayın hakkı, akış, program yönetimi
create policy channels_manage on public.channels for all
  using (public.has_permission('channels.manage')) with check (public.has_permission('channels.manage'));
create policy streams_manage on public.channel_streams for all
  using (public.has_permission('channels.manage')) with check (public.has_permission('channels.manage'));
create policy programs_manage on public.programs for all
  using (public.has_permission('channels.manage')) with check (public.has_permission('channels.manage'));
create policy rights_manage on public.broadcast_rights for all
  using (public.has_permission('rights.manage')) with check (public.has_permission('rights.manage'));

-- ---------------------------------------------------------------------------
-- Reklam alanları (gelecekteki gelir modeli için; şimdilik yalnızca test kimlikleri)
-- ---------------------------------------------------------------------------
create table public.ad_placements (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null check (key ~ '^[a-z][a-z0-9_]{2,40}$'),
  name            text not null,
  platform        text not null check (platform in ('android', 'ios', 'all')),
  format          text not null check (format in ('banner', 'interstitial', 'native', 'preroll')),
  provider        text not null default 'admob',
  unit_id         text,                      -- reklam birimi kimliği (gizli değildir)
  is_test         boolean not null default true,
  is_enabled      boolean not null default false,
  frequency_cap   int check (frequency_cap is null or frequency_cap between 1 and 100),
  notes           text,
  updated_at      timestamptz not null default now()
);

alter table public.ad_placements enable row level security;
create policy ads_public_select on public.ad_placements for select using (is_enabled);
create policy ads_manage on public.ad_placements for all
  using (public.has_permission('ads.manage')) with check (public.has_permission('ads.manage'));

-- ---------------------------------------------------------------------------
-- Uygulama ayarları (yalnızca herkese açık olabilecek değerler — gizli değer YOK)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('languages', '{"supported": ["tr", "en"], "default": "tr"}'),
  ('app_version', '{"android": {"latest": "1.0.0", "min_supported": "1.0.0"}, "ios": {"latest": "1.0.0", "min_supported": "1.0.0"}}'),
  ('maintenance', '{"enabled": false, "message_tr": "", "message_en": ""}');

alter table public.app_settings enable row level security;
create policy settings_public_select on public.app_settings for select using (true);
create policy settings_manage on public.app_settings for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title_tr    text not null check (char_length(title_tr) between 1 and 120),
  title_en    text not null check (char_length(title_en) between 1 and 120),
  body_tr     text not null default '' check (char_length(body_tr) <= 1000),
  body_en     text not null default '' check (char_length(body_en) <= 1000),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

alter table public.announcements enable row level security;
create policy announcements_public_select on public.announcements for select
  using (is_active and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy announcements_manage on public.announcements for all
  using (public.has_permission('announcements.manage')) with check (public.has_permission('announcements.manage'));

-- ---------------------------------------------------------------------------
-- Denetim kaydı: yönetim tablolarındaki her değişiklik sunucuda kaydedilir.
-- audit_log'a istemciden yazma/silme politikası yoktur (değiştirilemez).
-- ---------------------------------------------------------------------------
drop policy if exists audit_admin_select on public.audit_log;
create policy audit_read on public.audit_log for select using (public.has_permission('audit.read'));

create or replace function public.audit_row_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  o jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  n jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, payload)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(n ->> 'id', n ->> 'key', o ->> 'id', o ->> 'key'),
    jsonb_strip_nulls(jsonb_build_object('old', o, 'new', n))
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['channels', 'channel_categories', 'broadcast_rights', 'channel_streams',
                           'ad_placements', 'app_settings', 'announcements', 'moderation_actions']
  loop
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.audit_row_change()', t || '_audit', t);
  end loop;
end $$;

create trigger reports_audit after update on public.reports
  for each row execute function public.audit_row_change();
create trigger chat_messages_audit after update on public.chat_messages
  for each row when (old.is_hidden is distinct from new.is_hidden)
  execute function public.audit_row_change();
create trigger profiles_audit after update on public.profiles
  for each row when (old.role is distinct from new.role
                     or old.username is distinct from new.username
                     or old.is_banned is distinct from new.is_banned
                     or old.muted_until is distinct from new.muted_until)
  execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Yönetim işlemleri (RPC). Her biri izni sunucuda yeniden kontrol eder.
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
    'channels_total',     (select count(*) from public.channels),
    'channels_live',      (select count(*) from public.channels c where c.is_active and public.channel_has_valid_rights(c.id)),
    'rights_expiring_14d', (select count(*) from public.broadcast_rights
                            where status = 'verified' and valid_until between current_date and current_date + 14),
    'messages_24h',       (select count(*) from public.chat_messages where created_at > now() - interval '24 hours'),
    'reports_open',       (select count(*) from public.reports where status = 'open')
  );
end;
$$;

alter table public.moderation_actions drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check
  check (action in ('warn', 'mute', 'unmute', 'ban', 'unban', 'hide_message'));

create or replace function public.admin_moderate_user(
  p_target uuid, p_action text, p_reason text default null, p_minutes int default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_permission('users.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  case p_action
    when 'mute'   then update public.profiles set muted_until = now() + make_interval(mins => coalesce(p_minutes, 60 * 24)) where id = p_target;
    when 'unmute' then update public.profiles set muted_until = null where id = p_target;
    when 'ban'    then update public.profiles set is_banned = true where id = p_target;
    when 'unban'  then update public.profiles set is_banned = false where id = p_target;
    else raise exception 'invalid action %', p_action;
  end case;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
  insert into public.moderation_actions (moderator_id, target_user, action, reason)
  values (auth.uid(), p_target, p_action, p_reason);
end;
$$;

create or replace function public.admin_set_role(p_target uuid, p_role public.user_role)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_permission('users.manage_roles') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_target;  -- profil koruma tetikleyicisi de denetler
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.admin_resolve_report(
  p_report uuid, p_status public.report_status, p_hide_message boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
declare msg bigint;
begin
  if not public.has_permission('reports.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.reports set status = p_status, handled_by = auth.uid(), handled_at = now()
  where id = p_report returning message_id into msg;
  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  if p_hide_message and msg is not null then
    if not public.has_permission('chat.moderate') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    update public.chat_messages set is_hidden = true where id = msg;
  end if;
end;
$$;

-- RPC'ler yalnızca oturum açmış kullanıcılara; izin kontrolü fonksiyonların içinde.
revoke execute on function public.admin_dashboard_stats() from public, anon;
revoke execute on function public.admin_moderate_user(uuid, text, text, int) from public, anon;
revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_resolve_report(uuid, public.report_status, boolean) from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_moderate_user(uuid, text, text, int) to authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_resolve_report(uuid, public.report_status, boolean) to authenticated;
