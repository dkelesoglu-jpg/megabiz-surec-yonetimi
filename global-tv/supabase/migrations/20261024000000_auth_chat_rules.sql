-- Global TV & Community — oturum, sohbet ve hesap silme kuralları

-- Lisansın gerektirdiği atıf metni (ör. CC BY)
alter table public.channels add column attribution text;

-- ---------------------------------------------------------------------------
-- Yeni kullanıcı → profil
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data ->> 'username';
begin
  insert into public.profiles (id, username, locale)
  values (
    new.id,
    case
      when requested ~ '^[A-Za-z0-9_]{3,24}$'
        and not exists (select 1 from public.profiles where username = requested)
      then requested
      else 'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
    end,
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'tr')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Sohbet: yazar adı, hız sınırı
-- ---------------------------------------------------------------------------
alter table public.chat_messages
  add column author_name text not null default '',
  alter column user_id set default auth.uid();

create or replace function public.before_chat_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Hız sınırı: kullanıcı başına 10 saniyede en fazla 5 mesaj.
  if (
    select count(*) from public.chat_messages
    where user_id = new.user_id and created_at > now() - interval '10 seconds'
  ) >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  -- Yazar adı istemciden alınmaz, profilden kopyalanır.
  select p.username into new.author_name from public.profiles p where p.id = new.user_id;
  new.is_hidden := false;
  return new;
end;
$$;

create trigger chat_messages_before_insert
  before insert on public.chat_messages
  for each row execute function public.before_chat_insert();

-- ---------------------------------------------------------------------------
-- Hesap silme: mesajlar silinmez, anonimleştirilir.
-- Kullanıcının kendisi auth.users kaydını silemez; `delete-account` Edge
-- Function'ı kimliği doğrulayıp yönetici API'siyle siler (cascade).
-- ---------------------------------------------------------------------------
create or replace function public.anonymize_profile_messages()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.chat_messages set author_name = '[deleted]' where user_id = old.id;
  return old;
end;
$$;

create trigger profiles_before_delete
  before delete on public.profiles
  for each row execute function public.anonymize_profile_messages();
