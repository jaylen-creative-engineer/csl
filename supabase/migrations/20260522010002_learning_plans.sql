-- Individual learner journey — frameworks, learning plans, and paths.
-- Frameworks are reusable skill sequences (depth/breadth). Plans are participant-scoped
-- instances. Paths are concrete depth/breadth variants under a plan
-- ([[lat.md/individual-learner-journey#Individual learner journey#Frameworks, plans, and paths]]).

create table public.frameworks (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  skill_label text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index frameworks_skill_label_idx on public.frameworks (skill_label);

comment on table public.frameworks is
  'Reusable skill development frameworks; steps describe ordered progression units.';

create table public.learning_plans (
  id text primary key default gen_random_uuid()::text,
  participant_id text not null references public.participants (id) on delete cascade,
  framework_id text references public.frameworks (id) on delete set null,
  milestones jsonb not null default '[]'::jsonb,
  start_date date,
  target_date date,
  created_at timestamptz not null default now()
);

create index learning_plans_participant_id_idx on public.learning_plans (participant_id);
create index learning_plans_framework_id_idx on public.learning_plans (framework_id);

comment on table public.learning_plans is
  'Participant-scoped instance of a framework with milestones and target dates.';

create table public.paths (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.learning_plans (id) on delete cascade,
  variant text not null
    constraint paths_variant_check check (variant in ('depth', 'breadth')),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index paths_plan_id_idx on public.paths (plan_id);

comment on table public.paths is
  'Depth/breadth variant of executable steps under a learning plan.';

alter table public.frameworks enable row level security;
alter table public.learning_plans enable row level security;
alter table public.paths enable row level security;
