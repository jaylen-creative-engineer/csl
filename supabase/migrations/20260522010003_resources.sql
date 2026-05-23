-- Individual learner journey — resources tied to learning steps and/or challenges.
-- Resources are the substrate for AI-coordinated paths: readings, exemplars, tools, briefs
-- ([[lat.md/individual-learner-journey#Individual learner journey#Resources]]).

create table public.resources (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  url text,
  type text not null
    constraint resources_type_check check (type in ('reading', 'exemplar', 'tool', 'brief')),
  step_id text,
  challenge_id text references public.challenges (id) on delete set null,
  created_at timestamptz not null default now()
);

create index resources_step_id_idx on public.resources (step_id);
create index resources_challenge_id_idx on public.resources (challenge_id);

comment on table public.resources is
  'Reading / exemplar / tool / brief linkable to a plan step or sponsor-attached challenge.';
comment on column public.resources.step_id is
  'Logical step identifier (matches an id inside frameworks.steps or paths.steps); not a FK.';

alter table public.resources enable row level security;
