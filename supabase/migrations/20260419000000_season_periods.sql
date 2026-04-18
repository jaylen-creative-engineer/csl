-- Lookup for calendar / operational period (spring league vs summer intensive, etc.).
-- Concrete date ranges stay on public.seasons; period_id groups them for filters and workflows.

create table public.season_periods (
  id text primary key,
  label text not null,
  sort_order integer not null default 0
);

insert into public.season_periods (id, label, sort_order) values
  ('spring', 'Spring', 10),
  ('summer', 'Summer', 20),
  ('fall', 'Fall', 30),
  ('winter', 'Winter', 40),
  ('full_year', 'Full year', 50),
  ('rolling', 'Rolling (no fixed window)', 60),
  ('custom', 'Custom', 70);

alter table public.seasons
  add column period_id text references public.season_periods (id);

update public.seasons set period_id = 'custom' where period_id is null;

alter table public.seasons alter column period_id set not null;

create index seasons_period_id_idx on public.seasons (period_id);

comment on table public.season_periods is 'Stable period kinds for season rows; use for lookups, reporting, and automation.';
comment on column public.seasons.period_id is 'Classifies this season instance (dates remain on start_date / end_date).';

alter table public.season_periods enable row level security;
