-- League roles: fine-grained per-league permission assignments.

create type league_role as enum ('host', 'judge', 'participant', 'sponsor');

create table public.league_roles (
  id uuid primary key default gen_random_uuid(),
  league_id text not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role league_role not null,
  granted_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create index league_roles_league_id_idx on public.league_roles (league_id);
create index league_roles_user_id_idx on public.league_roles (user_id);

-- Enable RLS; service role always bypasses
alter table public.league_roles enable row level security;

-- Authenticated users can read roles in leagues they belong to
create policy "league_roles: select own league"
  on public.league_roles
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.league_roles lr2
      where lr2.league_id = league_roles.league_id
        and lr2.user_id = auth.uid()
    )
  );

comment on table public.league_roles is
  'Tracks per-league role assignments; enforces host/judge/participant/sponsor permissions.';
