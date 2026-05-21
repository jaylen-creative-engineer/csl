-- Multi-judge scoring: remove unique constraint so multiple judges can score a submission
alter table public.scores drop constraint if exists scores_submission_id_key;

-- Submission withdrawal: soft-delete flag for lifecycle completeness
alter table public.submissions add column if not exists withdrawn boolean not null default false;
