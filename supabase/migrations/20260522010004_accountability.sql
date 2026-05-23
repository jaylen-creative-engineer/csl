-- Individual learner journey — accountability primitives.
-- Milestones live under a learning plan; commitments connect a participant to a milestone
-- they have explicitly opted into ([[lat.md/individual-learner-journey#Individual learner journey#Accountability]]).

create table public.milestones (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.learning_plans (id) on delete cascade,
  description text not null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index milestones_plan_id_idx on public.milestones (plan_id);
create index milestones_due_date_idx on public.milestones (due_date);

comment on table public.milestones is
  'Concrete checkpoints within a learning plan; completed_at marks done.';

create table public.commitments (
  id text primary key default gen_random_uuid()::text,
  participant_id text not null references public.participants (id) on delete cascade,
  milestone_id text not null references public.milestones (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (participant_id, milestone_id)
);

create index commitments_participant_id_idx on public.commitments (participant_id);
create index commitments_milestone_id_idx on public.commitments (milestone_id);

comment on table public.commitments is
  'Explicit participant opt-in to a milestone; powers drift-aware prompts.';

alter table public.milestones enable row level security;
alter table public.commitments enable row level security;
