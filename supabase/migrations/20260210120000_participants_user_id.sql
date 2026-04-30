-- Link participants to Supabase Auth users (nullable until user signs up / admin links).
alter table public.participants
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create unique index if not exists participants_user_id_unique
  on public.participants (user_id)
  where user_id is not null;

comment on column public.participants.user_id is 'Supabase Auth user; optional until auth onboarding links the row.';
