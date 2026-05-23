-- RLS policies for Phase 4 (Auth). All tables already have RLS enabled from
-- the initial schema migration. This migration adds the access-control policies.

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------

-- Participants can read their own row
create policy "participants: select own"
  on public.participants
  for select
  using (auth.uid() = user_id);

-- Participants can update their own row
create policy "participants: update own"
  on public.participants
  for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------------

-- Participants can read submissions they own (via their participant row)
create policy "submissions: select own"
  on public.submissions
  for select
  using (
    exists (
      select 1 from public.participants p
      where p.id = submissions.participant_id
        and p.user_id = auth.uid()
    )
  );

-- Participants can submit to open challenges (and only for themselves)
create policy "submissions: insert for open challenge as self"
  on public.submissions
  for insert
  with check (
    -- Challenge must be open
    exists (
      select 1 from public.challenges c
      where c.id = submissions.challenge_id
        and c.status = 'open'
    )
    -- The participant_id on the submission must belong to the calling user
    and exists (
      select 1 from public.participants p
      where p.id = submissions.participant_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- leagues — public read
-- ---------------------------------------------------------------------------

create policy "leagues: select public"
  on public.leagues
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- challenges — public read
-- ---------------------------------------------------------------------------

create policy "challenges: select public"
  on public.challenges
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- league_hosts — authenticated insert
-- ---------------------------------------------------------------------------

create policy "league_hosts: insert authenticated"
  on public.league_hosts
  for insert
  with check (auth.role() = 'authenticated');
