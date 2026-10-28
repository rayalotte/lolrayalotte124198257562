create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- First account ever created becomes admin; later accounts get nothing.
create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.grant_first_admin();

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  title text,
  short_description text,
  biography text,
  role text,
  lanes text[] not null default '{}',
  tags text[] not null default '{}',
  notes text,
  portrait_url text,
  art_url text,
  gallery jsonb not null default '[]',
  stats jsonb not null default '{}',
  custom_stats jsonb not null default '[]',
  items jsonb not null default '[]',
  changelog text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.characters to anon, authenticated;
grant insert, update, delete on public.characters to authenticated;
grant all on public.characters to service_role;
alter table public.characters enable row level security;
create policy "public read characters" on public.characters for select to anon, authenticated using (true);
create policy "admin write characters" on public.characters for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.abilities (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  slot text not null check (slot in ('P','Q','W','E','R')),
  name text,
  icon_url text,
  description text,
  damage text, range text, duration text, cooldown text, cost text,
  effects text, notes text,
  unique (character_id, slot)
);
grant select on public.abilities to anon, authenticated;
grant insert, update, delete on public.abilities to authenticated;
grant all on public.abilities to service_role;
alter table public.abilities enable row level security;
create policy "public read abilities" on public.abilities for select to anon, authenticated using (true);
create policy "admin write abilities" on public.abilities for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.counters (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  target_id uuid not null references public.characters(id) on delete cascade,
  kind text not null check (kind in ('strong','weak')),
  note text,
  unique (character_id, target_id, kind)
);
grant select on public.counters to anon, authenticated;
grant insert, update, delete on public.counters to authenticated;
grant all on public.counters to service_role;
alter table public.counters enable row level security;
create policy "public read counters" on public.counters for select to anon, authenticated using (true);
create policy "admin write counters" on public.counters for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "public read media" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));