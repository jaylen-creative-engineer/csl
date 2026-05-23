-- Individual learner journey — skill intent + mastery anchors.
-- Captures a participant's declared skill goal so AI coordination and showcase surfaces
-- can frame evidence against intent ([[lat.md/individual-learner-journey#Individual learner journey#Skill intent & mastery framing]]).

create table public.skill_intents (
  id text primary key default gen_random_uuid()::text,
  participant_id text not null references public.participants (id) on delete cascade,
  skill_label text not null,
  target_disciplines text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index skill_intents_participant_id_idx on public.skill_intents (participant_id);
create index skill_intents_participant_created_idx
  on public.skill_intents (participant_id, created_at desc);

comment on table public.skill_intents is
  'Declared skill goal per participant; latest row is the active intent driving mastery framing.';

-- RLS policies land in Phase 4 — service role bypasses for server-side AI/route code.
alter table public.skill_intents enable row level security;
