-- CSL core schema — aligns with src/*/types.ts domain models for Phase 1 (repositories) and Phase 2 (API routes).
-- IDs remain application-generated text (e.g. league:1) to match existing services until a migration to UUIDs.

-- ---------------------------------------------------------------------------
-- League model
-- ---------------------------------------------------------------------------

create table public.league_hosts (
  id text primary key,
  name text not null,
  organization text not null,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id text primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint seasons_date_order check (start_date <= end_date)
);

create table public.leagues (
  id text primary key,
  name text not null,
  host_id text not null references public.league_hosts (id) on delete restrict,
  season_id text references public.seasons (id) on delete set null,
  status text not null default 'draft'
    constraint leagues_status_check check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now()
);

create index leagues_host_id_idx on public.leagues (host_id);
create index leagues_season_id_idx on public.leagues (season_id);

create table public.participants (
  id text primary key,
  handle text not null,
  discipline text not null
    constraint participants_discipline_check check (
      discipline in (
        'design',
        'writing',
        'code',
        'video',
        'strategy',
        'photography',
        'illustration',
        'other'
      )
    ),
  created_at timestamptz not null default now()
);

create index participants_handle_idx on public.participants (handle);

-- One row per (league, participant); status transitions update this row.
create table public.league_enrollments (
  league_id text not null references public.leagues (id) on delete cascade,
  participant_id text not null references public.participants (id) on delete cascade,
  status text not null default 'enrolled'
    constraint league_enrollments_status_check check (status in ('enrolled', 'withdrawn')),
  enrolled_at timestamptz not null default now(),
  primary key (league_id, participant_id)
);

create index league_enrollments_participant_id_idx on public.league_enrollments (participant_id);

-- ---------------------------------------------------------------------------
-- Sponsors (before challenges: optional FK sponsor_id)
-- ---------------------------------------------------------------------------

create table public.sponsors (
  id text primary key,
  name text not null,
  organization text not null,
  contact_email text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Challenges & submissions
-- ---------------------------------------------------------------------------

create table public.challenges (
  id text primary key,
  league_id text not null references public.leagues (id) on delete cascade,
  title text not null,
  prompt text not null,
  deadline date not null,
  status text not null default 'draft'
    constraint challenges_status_check check (status in ('draft', 'open', 'judging', 'complete')),
  scoring_criteria jsonb not null default '[]'::jsonb,
  sponsor_id text references public.sponsors (id) on delete set null,
  created_at timestamptz not null default now()
);

create index challenges_league_id_idx on public.challenges (league_id);
create index challenges_sponsor_id_idx on public.challenges (sponsor_id);

create table public.submissions (
  id text primary key,
  challenge_id text not null references public.challenges (id) on delete cascade,
  participant_id text not null references public.participants (id) on delete restrict,
  artifact jsonb not null,
  is_public boolean not null default true,
  submitted_at timestamptz not null default now()
);

create index submissions_challenge_id_idx on public.submissions (challenge_id);
create index submissions_participant_id_idx on public.submissions (participant_id);

-- One score row per submission (matches Submission.score in domain).
create table public.scores (
  id text primary key,
  submission_id text not null unique references public.submissions (id) on delete cascade,
  judge_id text not null,
  criteria_scores jsonb not null default '[]'::jsonb,
  total_score double precision not null,
  rationale text not null,
  scored_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sponsor attachments & outcomes
-- ---------------------------------------------------------------------------

create table public.sponsor_attachments (
  id text primary key,
  sponsor_id text not null references public.sponsors (id) on delete cascade,
  challenge_id text not null references public.challenges (id) on delete cascade,
  brief jsonb not null,
  outcome jsonb,
  attached_at timestamptz not null default now()
);

create index sponsor_attachments_sponsor_id_idx on public.sponsor_attachments (sponsor_id);
create index sponsor_attachments_challenge_id_idx on public.sponsor_attachments (challenge_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — policies land in Phase 4 (Auth). Service role bypasses RLS for server-side API.
-- ---------------------------------------------------------------------------

alter table public.league_hosts enable row level security;
alter table public.seasons enable row level security;
alter table public.leagues enable row level security;
alter table public.participants enable row level security;
alter table public.league_enrollments enable row level security;
alter table public.sponsors enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
alter table public.scores enable row level security;
alter table public.sponsor_attachments enable row level security;
