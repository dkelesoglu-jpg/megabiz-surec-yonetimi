-- GelenGelsin — Canlı MVP için Supabase (Postgres) şema TASLAĞI
-- Henüz hiçbir projede çalıştırılmadı. Onay sonrası migration olarak uygulanacak.

create extension if not exists pgcrypto;

-- ---------- Şehirler (şehirden bağımsız model) ----------
create table cities (
  id text primary key,                 -- 'istanbul'
  name text not null,
  country text not null,
  active boolean not null default false,
  districts text[] not null default '{}'
);

-- ---------- Profiller (auth.users ile 1-1) ----------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_year int not null,
  city_id text not null references cities,
  bio text check (char_length(bio) <= 280),
  interests text[] not null default '{}',
  verified_18 boolean not null default false,  -- yalnızca sunucu (doğrulama akışı) yazar
  is_moderator boolean not null default false, -- yalnızca yönetici yazar
  created_at timestamptz not null default now(),
  constraint adult check (extract(year from now()) - birth_year >= 18)
);

-- ---------- Planlar ----------
create type plan_type as enum ('going', 'need_people', 'meet_there');
create type plan_status as enum ('active', 'cancelled', 'removed');

create table plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  type plan_type not null,
  category text not null,
  title text not null check (char_length(title) between 5 and 90),
  description text check (char_length(description) <= 600),
  city_id text not null references cities,
  district text not null,
  area_label text,                      -- herkese açık genel mekân
  start_at timestamptz not null,
  end_at timestamptz,                   -- seyahat aralığı
  destination_city text,
  destination_country text,
  capacity int not null check (capacity between 1 and 30), -- sahip hariç
  approved_count int not null default 0 check (approved_count >= 0 and approved_count <= capacity),
  cost_note text,
  event_url text check (event_url is null or event_url ~* '^https?://'),
  status plan_status not null default 'active',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);
create index plans_discover on plans (city_id, status, start_at);

-- Kesin buluşma noktası AYRI tabloda: RLS ile yalnızca sahip + onaylılar okur.
create table plan_secrets (
  plan_id uuid primary key references plans on delete cascade,
  meeting_point_exact text
);

-- ---------- Katılım istekleri ----------
create type request_status as enum ('pending', 'approved', 'rejected', 'withdrawn', 'left');

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  status request_status not null default 'pending',
  message text check (char_length(message) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Bir kullanıcının bir planda aynı anda tek "canlı" isteği olabilir.
create unique index one_live_request on join_requests (plan_id, user_id)
  where status in ('pending', 'approved');
create index join_requests_plan on join_requests (plan_id, status);

-- ---------- Sohbet, bildirim, güvenlik ----------
create table messages (
  id bigint generated always as identity primary key,
  plan_id uuid not null references plans on delete cascade,
  user_id uuid references profiles,      -- null = sistem mesajı
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_plan on messages (plan_id, created_at);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  plan_id uuid references plans on delete cascade,
  kind text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_id uuid references profiles on delete cascade,
  blocked_id uuid references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create type report_status as enum ('open', 'dismissed', 'actioned');
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles,
  target_plan_id uuid references plans,
  target_user_id uuid references profiles,
  reason text not null,
  note text,
  status report_status not null default 'open',
  resolved_by uuid references profiles,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((target_plan_id is null) <> (target_user_id is null))
);

create table plan_outcomes (
  plan_id uuid references plans on delete cascade,
  user_id uuid references profiles on delete cascade,
  happened boolean not null,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

-- ---------- Yardımcı fonksiyonlar ----------
create or replace function is_member(p uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from plans where id = p and owner_id = u)
      or exists (select 1 from join_requests where plan_id = p and user_id = u and status = 'approved');
$$;

create or replace function is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_moderator from profiles where id = auth.uid()), false);
$$;

-- ---------- Kapasite güvenli onay (eşzamanlılık) ----------
-- Plan satırı FOR UPDATE ile kilitlenir; iki eşzamanlı onay sırayla çalışır,
-- ikincisi approved_count = capacity gördüğü için reddedilir. Ayrıca CHECK
-- kısıtı (approved_count <= capacity) son savunma hattıdır.
create or replace function approve_join_request(req uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r join_requests; p plans;
begin
  select * into r from join_requests where id = req for update;
  if not found then raise exception 'İstek bulunamadı'; end if;
  select * into p from plans where id = r.plan_id for update;
  if p.owner_id <> auth.uid() then raise exception 'Yalnızca plan sahibi onaylayabilir'; end if;
  if r.status <> 'pending' then raise exception 'İstek beklemede değil'; end if;
  if p.status <> 'active' then raise exception 'Plan aktif değil'; end if;
  if p.start_at < now() - interval '3 hours' then raise exception 'Plan tarihi geçti'; end if;
  if p.approved_count >= p.capacity then raise exception 'Kontenjan dolu'; end if;

  update join_requests set status = 'approved', updated_at = now() where id = req;
  update plans set approved_count = approved_count + 1, updated_at = now() where id = p.id;
  insert into messages (plan_id, user_id, body)
    values (p.id, null, (select display_name from profiles where id = r.user_id) || ' ekibe katıldı.');
  insert into notifications (user_id, plan_id, kind, body)
    values (r.user_id, p.id, 'request_approved', 'Onaylandın! Sohbet ve buluşma noktası açıldı.');
end $$;

create or replace function leave_plan(pid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from plans where id = pid for update;
  update join_requests set status = 'left', updated_at = now()
    where plan_id = pid and user_id = auth.uid() and status = 'approved';
  if not found then raise exception 'Bu planın katılımcısı değilsin'; end if;
  update plans set approved_count = approved_count - 1, updated_at = now() where id = pid;
  insert into messages (plan_id, user_id, body)
    values (pid, null, (select display_name from profiles where id = auth.uid()) || ' plandan ayrıldı.');
end $$;
-- Benzer şekilde: request_join(), withdraw_request(), reject_request(),
-- cancel_plan(), update_plan() (bildirim üreten), resolve_report().

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table plans enable row level security;
alter table plan_secrets enable row level security;
alter table join_requests enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table plan_outcomes enable row level security;

create policy "profil herkese okunur" on profiles for select to authenticated using (true);
create policy "kendi profilini günceller" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- verified_18 / is_moderator sütunları için: column-level GRANT ile istemciye UPDATE yetkisi verilmez.

create policy "aktif planlar okunur (engel hariç)" on plans for select to authenticated
  using ((status <> 'removed' or owner_id = auth.uid() or is_moderator()) and not is_blocked(owner_id, auth.uid()));
create policy "doğrulanmış kullanıcı plan açar" on plans for insert to authenticated
  with check (owner_id = auth.uid() and approved_count = 0 and status = 'active'
    and exists (select 1 from profiles where id = auth.uid() and verified_18)
    and exists (select 1 from cities where id = city_id and active));
-- Güncelleme/iptal yalnızca RPC (security definer) üzerinden; doğrudan UPDATE politikası yok.

create policy "kesin yer yalnızca üyelere" on plan_secrets for select to authenticated
  using (is_member(plan_id, auth.uid()) and exists (select 1 from plans where id = plan_id and status = 'active'));
create policy "kesin yeri sahip yazar" on plan_secrets for all to authenticated
  using (exists (select 1 from plans where id = plan_id and owner_id = auth.uid()))
  with check (exists (select 1 from plans where id = plan_id and owner_id = auth.uid()));

create policy "istekleri sahibi ve istek sahibi görür" on join_requests for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from plans where id = plan_id and owner_id = auth.uid())
         or status = 'approved'); -- onaylı katılımcı listesi herkese açık
-- Ekleme/durum değişiklikleri RPC ile.

create policy "sohbeti üyeler okur" on messages for select to authenticated using (is_member(plan_id, auth.uid()));
create policy "üyeler aktif planda yazar" on messages for insert to authenticated
  with check (user_id = auth.uid() and is_member(plan_id, auth.uid())
    and exists (select 1 from plans where id = plan_id and status = 'active'));

create policy "kendi bildirimleri" on notifications for select to authenticated using (user_id = auth.uid());
create policy "okundu işaretle" on notifications for update to authenticated using (user_id = auth.uid());

create policy "kendi engelleri" on blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "şikâyet gönder" on reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "moderatör okur" on reports for select to authenticated using (is_moderator() or reporter_id = auth.uid());
create policy "moderatör çözer" on reports for update to authenticated using (is_moderator());

create policy "üye yanıtlar" on plan_outcomes for insert to authenticated
  with check (user_id = auth.uid() and is_member(plan_id, auth.uid()));
create policy "kendi yanıtını okur" on plan_outcomes for select to authenticated using (user_id = auth.uid() or is_moderator());

-- Realtime: messages ve notifications tabloları supabase_realtime yayınına eklenir;
-- RLS, abonelerin yalnızca yetkili satırları almasını sağlar.
-- alter publication supabase_realtime add table messages, notifications;

-- ---------- Pilot metrikleri ----------
create or replace view pilot_weekly as
select date_trunc('week', p.created_at) as hafta,
       count(*) filter (where not p.is_demo) as acilan_plan,
       count(*) filter (where not p.is_demo and p.approved_count > 0) as onayli_katilimcili_plan,
       round(100.0 * count(*) filter (where not p.is_demo and p.approved_count > 0)
             / nullif(count(*) filter (where not p.is_demo), 0), 1) as onay_orani_yuzde,
       count(distinct o.plan_id) as gerceklesti_yanitlanan,
       count(distinct o.plan_id) filter (where o.happened) as gerceklesti_evet
from plans p left join plan_outcomes o on o.plan_id = p.id
where p.city_id = 'istanbul' and p.status <> 'removed'
group by 1 order by 1 desc;
