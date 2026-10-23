-- Global TV & Community — başlangıç şeması
-- Bu dosya yalnızca dev/staging ortamlarına migration olarak uygulanır.
-- prod ortamına uygulama ürün sahibinin onayıyla yapılır.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiller ve roller
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'moderator', 'admin');

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  avatar_key    text not null default 'avatar_01',
  locale        text not null default 'tr' check (locale in ('tr', 'en')),
  country_code  char(2),
  role          public.user_role not null default 'user',
  is_banned     boolean not null default false,
  muted_until   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.has_role(min_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role >= min_role and not p.is_banned
  );
$$;

-- ---------------------------------------------------------------------------
-- Kanallar ve yayın hakları
-- ---------------------------------------------------------------------------
create table public.channels (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  country_code  char(2) not null,
  category      text not null check (category in
                  ('news', 'sports', 'entertainment', 'kids', 'music', 'documentary', 'other')),
  language      text not null,
  logo_url      text,
  is_active     boolean not null default false,
  sort_order    int not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create type public.rights_status as enum ('pending', 'verified', 'rejected', 'revoked');

create table public.broadcast_rights (
  id                 uuid primary key default gen_random_uuid(),
  channel_id         uuid not null references public.channels (id) on delete cascade,
  rights_holder      text not null,
  license_type       text not null,           -- ör. 'direct_agreement', 'fast_partner', 'demo_test'
  allowed_countries  char(2)[] not null,      -- boş dizi = hiçbir ülke
  valid_from         date not null,
  valid_until        date not null,
  status             public.rights_status not null default 'pending',
  document_path      text,                    -- Storage: rights-documents/…
  verified_by        uuid references public.profiles (id),
  verified_at        timestamptz,
  notes              text,
  created_at         timestamptz not null default now(),
  check (valid_until >= valid_from)
);

-- Akış URL'leri istemciye doğrudan açılmaz; get-stream Edge Function'ı verir.
create table public.channel_streams (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references public.channels (id) on delete cascade,
  hls_url     text not null check (hls_url like 'https://%'),
  is_primary  boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.channel_has_valid_rights(p_channel_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.broadcast_rights r
    where r.channel_id = p_channel_id
      and r.status = 'verified'
      and current_date between r.valid_from and r.valid_until
  );
$$;

create table public.programs (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references public.channels (id) on delete cascade,
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Kullanıcı verileri
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  channel_id  uuid not null references public.channels (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create table public.blocks (
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------------
-- Sohbet
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id          bigint generated always as identity primary key,
  channel_id  uuid not null references public.channels (id) on delete cascade,
  program_id  uuid references public.programs (id) on delete set null,
  user_id     uuid references public.profiles (id) on delete set null,  -- hesap silinince anonim
  body        text not null check (char_length(body) between 1 and 500),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index chat_messages_channel_created_idx on public.chat_messages (channel_id, created_at desc);

create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  message_id   bigint references public.chat_messages (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason       text not null check (reason in ('spam', 'abuse', 'hate', 'sexual', 'other')),
  details      text check (char_length(details) <= 1000),
  status       public.report_status not null default 'open',
  handled_by   uuid references public.profiles (id),
  handled_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (message_id is not null or reported_user_id is not null)
);

create table public.moderation_actions (
  id            uuid primary key default gen_random_uuid(),
  moderator_id  uuid not null references public.profiles (id),
  target_user   uuid not null references public.profiles (id) on delete cascade,
  action        text not null check (action in ('warn', 'mute', 'ban', 'unban', 'hide_message')),
  reason        text,
  created_at    timestamptz not null default now()
);

create table public.account_deletion_requests (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  requested_at  timestamptz not null default now()
);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  action     text not null,
  entity     text not null,
  entity_id  text,
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.channels                  enable row level security;
alter table public.broadcast_rights          enable row level security;
alter table public.channel_streams           enable row level security;
alter table public.programs                  enable row level security;
alter table public.favorites                 enable row level security;
alter table public.blocks                    enable row level security;
alter table public.chat_messages             enable row level security;
alter table public.reports                   enable row level security;
alter table public.moderation_actions        enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.audit_log                 enable row level security;

-- profiles: herkes kendi profilini okur/günceller; kullanıcı adları sohbet için görünür
create policy profiles_select on public.profiles for select using (true);
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- kullanıcı kendi rolünü / yasak durumunu değiştiremez
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and is_banned = (select p.is_banned from public.profiles p where p.id = auth.uid())
    and muted_until is not distinct from (select p.muted_until from public.profiles p where p.id = auth.uid())
  );
create policy profiles_admin_all on public.profiles for all
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- channels: YAYIN HAKKI KURALI — yalnızca aktif ve hakkı geçerli kanallar görünür
create policy channels_public_select on public.channels for select
  using (is_active and public.channel_has_valid_rights(id));
create policy channels_admin_all on public.channels for all
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- broadcast_rights, channel_streams: yalnızca admin (istemci akışı Edge Function'dan alır)
create policy rights_admin_all on public.broadcast_rights for all
  using (public.has_role('admin')) with check (public.has_role('admin'));
create policy streams_admin_all on public.channel_streams for all
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy programs_public_select on public.programs for select
  using (public.channel_has_valid_rights(channel_id));
create policy programs_admin_all on public.programs for all
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- favorites, blocks: yalnızca sahibi
create policy favorites_owner on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy blocks_owner on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- chat_messages: giriş yapmış kullanıcılar okur (engellediklerinin ve gizlenenlerin hariç)
create policy chat_select on public.chat_messages for select to authenticated
  using (
    (not is_hidden or public.has_role('moderator'))
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = chat_messages.user_id
    )
  );
create policy chat_insert on public.chat_messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.channel_has_valid_rights(channel_id)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and not p.is_banned
        and (p.muted_until is null or p.muted_until < now())
    )
  );
create policy chat_moderate on public.chat_messages for update
  using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- reports: kullanıcı oluşturur ve kendi şikâyetini görür; moderatör hepsini yönetir
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select_own on public.reports for select
  using (reporter_id = auth.uid() or public.has_role('moderator'));
create policy reports_moderate on public.reports for update
  using (public.has_role('moderator')) with check (public.has_role('moderator'));

create policy modactions_moderator on public.moderation_actions for all
  using (public.has_role('moderator')) with check (public.has_role('moderator') and moderator_id = auth.uid());

create policy deletion_owner on public.account_deletion_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy deletion_owner_select on public.account_deletion_requests for select
  using (user_id = auth.uid() or public.has_role('admin'));

create policy audit_admin_select on public.audit_log for select using (public.has_role('admin'));

-- Sohbet tablosunu Realtime yayınına ekle
alter publication supabase_realtime add table public.chat_messages;
