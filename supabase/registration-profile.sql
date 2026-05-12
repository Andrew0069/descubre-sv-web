-- Adds private full name + public username support for new signups.
-- This does not backfill or modify existing users.

alter table public.usuarios
  add column if not exists username text;

-- Check constraint: accepts uppercase, lowercase, numbers and underscore
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'usuarios_username_format'
      and conrelid = 'public.usuarios'::regclass
  ) then
    alter table public.usuarios
      add constraint usuarios_username_format
      check (username is null or username ~ '^[A-Za-z0-9_]{3,30}$');
  end if;
end;
$$;

-- Case-insensitive unique index: LOWER(username) prevents 'Juan123' and 'juan123' from coexisting
create unique index if not exists usuarios_username_ci_unique_idx
  on public.usuarios (lower(username))
  where username is not null;

-- Keep this function aligned with the existing usuarios insert trigger.
-- If your project already has a differently named auth.users trigger function,
-- copy the coalesce(...) assignments into that function instead.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (auth_id, email, nombre, username)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1)),
    lower(nullif(new.raw_user_meta_data->>'username', ''))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
