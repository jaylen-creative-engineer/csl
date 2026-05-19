-- Dev-only seed data for Creative Sports League (CSL).
-- Matches domain-style string IDs (e.g. league:1) and JSON shapes in src/*/types.ts.
-- Reload: `supabase db reset` (local) or `npm run db:seed` against your dev database.
-- Do not run against production databases with real user data.

begin;

truncate table
  public.scores,
  public.submissions,
  public.sponsor_attachments,
  public.challenges,
  public.league_enrollments,
  public.team_members,
  public.teams,
  public.leagues,
  public.participants,
  public.sponsors,
  public.seasons,
  public.league_hosts,
  public.disciplines,
  public.season_periods
restart identity cascade;

-- Disciplines (same rows as migration; reinserted after truncate)
insert into public.disciplines (id, label, sort_order) values
  ('design', 'Design', 10),
  ('writing', 'Writing', 20),
  ('code', 'Code', 30),
  ('video', 'Video', 40),
  ('strategy', 'Strategy', 50),
  ('photography', 'Photography', 60),
  ('illustration', 'Illustration', 70),
  ('other', 'Other', 80);

-- Season period kinds (same rows as migration; reinserted after truncate)
insert into public.season_periods (id, label, sort_order) values
  ('spring', 'Spring', 10),
  ('summer', 'Summer', 20),
  ('fall', 'Fall', 30),
  ('winter', 'Winter', 40),
  ('full_year', 'Full year', 50),
  ('rolling', 'Rolling (no fixed window)', 60),
  ('custom', 'Custom', 70);

-- League hosts & seasons
insert into public.league_hosts (id, name, organization, created_at)
values
  ('host:1', 'Alex Rivera', 'Eastside Design Collective', '2026-01-10T12:00:00Z');

insert into public.seasons (id, name, start_date, end_date, period_id, created_at)
values
  ('season:1', 'Spring 2026', '2026-03-01', '2026-06-30', 'spring', '2026-01-10T12:00:00Z');

-- Sponsors
insert into public.sponsors (id, name, organization, contact_email, created_at)
values
  ('sponsor:1', 'Northwind Creative', 'Northwind Labs', 'briefs@northwind.example', '2026-01-12T15:00:00Z');

-- Leagues
insert into public.leagues (id, name, host_id, season_id, status, created_at)
values
  ('league:1', 'Eastside Open League', 'host:1', 'season:1', 'active', '2026-01-15T10:00:00Z'),
  ('league:2', 'Weekend Writers Guild', 'host:1', null, 'draft', '2026-02-01T09:00:00Z');

-- Participants (handles unique case-insensitively per participants_handle_lower_unique)
insert into public.participants (id, handle, discipline_id, created_at)
values
  ('participant:1', 'mara_k', 'design', '2026-01-20T08:00:00Z'),
  ('participant:2', 'jules_v', 'writing', '2026-01-20T08:05:00Z'),
  ('participant:3', 'devon_codes', 'code', '2026-01-21T11:00:00Z'),
  ('participant:4', 'sam_strategy', 'strategy', '2026-01-22T14:00:00Z'),
  ('participant:5', 'riley_other', 'other', '2026-02-05T16:00:00Z');

-- Optional teams within a league (squads); membership is independent of league_enrollments
insert into public.teams (id, league_id, name, created_at)
values
  ('team:1', 'league:1', 'Studio North', '2026-01-18T10:00:00Z'),
  ('team:2', 'league:1', 'Write Club', '2026-01-18T10:30:00Z');

insert into public.team_members (team_id, participant_id, joined_at)
values
  ('team:1', 'participant:1', '2026-01-19T12:00:00Z'),
  ('team:1', 'participant:3', '2026-01-19T12:00:00Z'),
  ('team:2', 'participant:2', '2026-01-19T12:30:00Z');

-- Enrollments (one row per league + participant)
insert into public.league_enrollments (league_id, participant_id, status, enrolled_at)
values
  ('league:1', 'participant:1', 'enrolled', '2026-01-25T10:00:00Z'),
  ('league:1', 'participant:2', 'enrolled', '2026-01-25T10:30:00Z'),
  ('league:1', 'participant:3', 'enrolled', '2026-01-26T09:00:00Z'),
  ('league:1', 'participant:4', 'enrolled', '2026-01-27T12:00:00Z'),
  ('league:2', 'participant:5', 'enrolled', '2026-02-06T10:00:00Z');

-- Challenges (draft → open → judging → complete)
insert into public.challenges (
  id,
  league_id,
  title,
  prompt,
  deadline,
  status,
  scoring_criteria,
  sponsor_id,
  created_at
)
values
  (
    'challenge:1',
    'league:1',
    'Brand sprint: neighborhood coffee co-op',
    'Design a logo mark and one social asset that feels welcoming and local.',
    '2026-05-15',
    'open',
    '[
      {"name":"craft","weight":0.35,"description":"Execution and polish"},
      {"name":"concept","weight":0.35,"description":"Fit to brief"},
      {"name":"clarity","weight":0.30,"description":"Communication"}
    ]'::jsonb,
    'sponsor:1',
    '2026-02-10T10:00:00Z'
  ),
  (
    'challenge:2',
    'league:1',
    'Microcopy clinic: onboarding email',
    'Rewrite a three-step onboarding email for a budgeting app; keep tone human.',
    '2026-04-01',
    'judging',
    '[
      {"name":"voice","weight":0.4,"description":"Tone and empathy"},
      {"name":"precision","weight":0.35,"description":"Clarity and brevity"},
      {"name":"structure","weight":0.25,"description":"Flow"}
    ]'::jsonb,
    null,
    '2026-02-01T10:00:00Z'
  ),
  (
    'challenge:3',
    'league:1',
    'Prototype: one-screen habit tracker',
    'Ship a single-screen UI prototype that shows streaks and a skip day.',
    '2026-03-01',
    'complete',
    '[
      {"name":"usability","weight":0.5,"description":"Layout and affordances"},
      {"name":"craft","weight":0.5,"description":"Visual polish"}
    ]'::jsonb,
    null,
    '2026-01-05T10:00:00Z'
  ),
  (
    'challenge:4',
    'league:2',
    'Draft: flash fiction — first line given',
    'Start from the line: “The station was empty except for the piano.” Max 500 words.',
    '2026-06-01',
    'draft',
    '[
      {"name":"story","weight":0.6,"description":"Narrative pull"},
      {"name":"language","weight":0.4,"description":"Prose quality"}
    ]'::jsonb,
    null,
    '2026-02-08T10:00:00Z'
  );

-- Submissions
insert into public.submissions (id, challenge_id, participant_id, artifact, is_public, submitted_at)
values
  (
    'submission:1',
    'challenge:1',
    'participant:1',
    '{"url":"https://example.dev/artifacts/mara-coffee-mood.png","mimeType":"image/png","description":"Mood board"}'::jsonb,
    true,
    '2026-02-18T18:00:00Z'
  ),
  (
    'submission:2',
    'challenge:1',
    'participant:3',
    '{"url":"https://example.dev/artifacts/devon-coffee-code.zip","mimeType":"application/zip","description":"SVG + README"}'::jsonb,
    true,
    '2026-02-19T20:00:00Z'
  ),
  (
    'submission:3',
    'challenge:2',
    'participant:2',
    '{"url":"https://example.dev/artifacts/jules-onboarding.md","mimeType":"text/markdown","description":"Email copy"}'::jsonb,
    true,
    '2026-03-20T14:00:00Z'
  ),
  (
    'submission:4',
    'challenge:2',
    'participant:4',
    '{"url":"https://example.dev/artifacts/sam-onboarding.pdf","mimeType":"application/pdf","description":"PDF variant"}'::jsonb,
    true,
    '2026-03-21T09:00:00Z'
  ),
  (
    'submission:5',
    'challenge:3',
    'participant:1',
    '{"url":"https://example.dev/artifacts/mara-habit.png","mimeType":"image/png","description":"UI mock"}'::jsonb,
    true,
    '2026-02-15T12:00:00Z'
  ),
  (
    'submission:6',
    'challenge:3',
    'participant:3',
    '{"url":"https://example.dev/artifacts/devon-habit.html","mimeType":"text/html","description":"Static HTML"}'::jsonb,
    true,
    '2026-02-16T11:00:00Z'
  ),
  (
    'submission:7',
    'challenge:3',
    'participant:4',
    '{"url":"https://example.dev/artifacts/sam-habit.pdf","mimeType":"application/pdf","description":"Wireflow"}'::jsonb,
    false,
    '2026-02-17T08:00:00Z'
  );

-- Scores (judging + complete challenges)
insert into public.scores (id, submission_id, judge_id, criteria_scores, total_score, rationale, scored_at)
values
  (
    'score:1',
    'submission:3',
    'judge:host',
    '[{"criteriaName":"voice","score":82},{"criteriaName":"precision","score":76},{"criteriaName":"structure","score":88}]'::jsonb,
    81.4,
    'Strong voice; tighten the CTA line.',
    '2026-03-25T10:00:00Z'
  ),
  (
    'score:2',
    'submission:4',
    'judge:host',
    '[{"criteriaName":"voice","score":74},{"criteriaName":"precision","score":80},{"criteriaName":"structure","score":72}]'::jsonb,
    75.6,
    'Clear structure; voice feels slightly corporate.',
    '2026-03-25T10:15:00Z'
  ),
  (
    'score:3',
    'submission:5',
    'judge:guest',
    '[{"criteriaName":"usability","score":90},{"criteriaName":"craft","score":85}]'::jsonb,
    87.5,
    'Excellent hierarchy and spacing.',
    '2026-02-28T16:00:00Z'
  ),
  (
    'score:4',
    'submission:6',
    'judge:guest',
    '[{"criteriaName":"usability","score":78},{"criteriaName":"craft","score":80}]'::jsonb,
    79.0,
    'Solid layout; typography could be more distinctive.',
    '2026-02-28T16:05:00Z'
  ),
  (
    'score:5',
    'submission:7',
    'judge:guest',
    '[{"criteriaName":"usability","score":72},{"criteriaName":"craft","score":74}]'::jsonb,
    73.0,
    'Good flow; one confusing icon choice.',
    '2026-02-28T16:10:00Z'
  );

-- Sponsor attachment (brief on an active challenge)
insert into public.sponsor_attachments (id, sponsor_id, challenge_id, brief, outcome, attached_at)
values
  (
    'attachment:1',
    'sponsor:1',
    'challenge:1',
    '{
      "headline":"Neighborhood co-op launch",
      "description":"We want a mark that reads local and craft without looking kitsch.",
      "deliverables":["Primary logo on white","One 1080x1080 social square"],
      "prize":"1:1 portfolio review with the brand team"
    }'::jsonb,
    null,
    '2026-02-11T12:00:00Z'
  );

commit;
