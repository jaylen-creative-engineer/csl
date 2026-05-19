-- CSL initial domain schema
-- Phase 1: persistence for league/challenge/showcase/sponsor intelligence.

create table if not exists league_hosts (
  id text primary key,
  name text not null,
  organization text not null,
  league_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists seasons (
  id text primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint seasons_date_range_ck check (end_date >= start_date)
);

create table if not exists leagues (
  id text primary key,
  name text not null,
  host_id text not null references league_hosts(id) on delete restrict,
  season_id text references seasons(id) on delete set null,
  status text not null,
  challenge_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  constraint leagues_status_ck check (status in ('draft', 'active', 'closed'))
);

create table if not exists participants (
  id text primary key,
  handle text not null unique,
  discipline text not null,
  league_memberships jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint participants_discipline_ck check (
    discipline in ('design', 'writing', 'code', 'video', 'strategy', 'photography', 'illustration', 'other')
  )
);

create table if not exists challenges (
  id text primary key,
  league_id text not null references leagues(id) on delete cascade,
  title text not null,
  prompt text not null,
  deadline timestamptz not null,
  status text not null,
  scoring_criteria jsonb not null default '[]'::jsonb,
  sponsor_id text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint challenges_status_ck check (status in ('draft', 'open', 'judging', 'complete'))
);

create table if not exists submissions (
  id text primary key,
  challenge_id text not null references challenges(id) on delete cascade,
  participant_id text not null references participants(id) on delete cascade,
  artifact jsonb not null,
  is_public boolean not null default true,
  score jsonb,
  submitted_at timestamptz not null default timezone('utc', now())
);

create table if not exists sponsors (
  id text primary key,
  name text not null,
  organization text not null,
  contact_email text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists sponsor_attachments (
  id text primary key,
  sponsor_id text not null references sponsors(id) on delete cascade,
  challenge_id text not null references challenges(id) on delete cascade,
  brief jsonb not null,
  outcome jsonb,
  attached_at timestamptz not null default timezone('utc', now()),
  constraint sponsor_attachments_unique unique (sponsor_id, challenge_id)
);

create index if not exists leagues_host_id_idx on leagues (host_id);
create index if not exists leagues_status_idx on leagues (status);
create index if not exists challenges_league_id_idx on challenges (league_id);
create index if not exists challenges_status_idx on challenges (status);
create index if not exists submissions_challenge_id_idx on submissions (challenge_id);
create index if not exists submissions_participant_id_idx on submissions (participant_id);
create index if not exists submissions_scored_idx on submissions (challenge_id)
  where score is not null;
create index if not exists sponsor_attachments_sponsor_id_idx on sponsor_attachments (sponsor_id);
create index if not exists sponsor_attachments_challenge_id_idx on sponsor_attachments (challenge_id);
