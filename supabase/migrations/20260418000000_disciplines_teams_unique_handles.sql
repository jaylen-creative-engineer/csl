-- Disciplines as a reference table (aligns with Discipline enum in src/league-model/types.ts).
-- Case-insensitive unique participant handles.
-- Optional teams within a league (squads); membership is separate from league_enrollments.

-- ---------------------------------------------------------------------------
-- Disciplines
-- ---------------------------------------------------------------------------

create table public.disciplines (
  id text primary key,
  label text not null,
  sort_order integer not null default 0
);

insert into public.disciplines (id, label, sort_order) values
  ('design', 'Design', 10),
  ('writing', 'Writing', 20),
  ('code', 'Code', 30),
  ('video', 'Video', 40),
  ('strategy', 'Strategy', 50),
  ('photography', 'Photography', 60),
  ('illustration', 'Illustration', 70),
  ('other', 'Other', 80);

-- ---------------------------------------------------------------------------
-- Participants: discipline text -> FK; unique handle (case-insensitive)
-- ---------------------------------------------------------------------------

alter table public.participants
  add column discipline_id text references public.disciplines (id);

update public.participants set discipline_id = discipline;

alter table public.participants alter column discipline_id set not null;

alter table public.participants drop constraint participants_discipline_check;

alter table public.participants drop column discipline;

drop index if exists public.participants_handle_idx;

create unique index participants_handle_lower_unique on public.participants (lower (handle));

comment on index public.participants_handle_lower_unique is 'Public handles are unique ignoring case.';

-- ---------------------------------------------------------------------------
-- Teams (optional squads within a league)
-- ---------------------------------------------------------------------------

create table public.teams (
  id text primary key,
  league_id text not null references public.leagues (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index teams_league_id_idx on public.teams (league_id);

create unique index teams_league_id_name_lower_idx on public.teams (league_id, lower (name));

create table public.team_members (
  team_id text not null references public.teams (id) on delete cascade,
  participant_id text not null references public.participants (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, participant_id)
);

create index team_members_participant_id_idx on public.team_members (participant_id);

comment on table public.disciplines is 'Lookup for participant.discipline_id; keep in sync with domain Discipline enum.';
comment on table public.teams is 'Optional squads within a league.';
comment on table public.team_members is 'Many-to-many: participants on teams (also use league_enrollments for league membership).';

-- ---------------------------------------------------------------------------
-- RLS (policies in Phase 4)
-- ---------------------------------------------------------------------------

alter table public.disciplines enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
