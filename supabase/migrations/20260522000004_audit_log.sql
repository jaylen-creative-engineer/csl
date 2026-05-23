-- Audit log: append-only record of significant mutations for compliance and debugging.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  diff jsonb
);

-- Only admins / service role should write to audit_log; no authenticated-user policies.
-- Service role bypasses RLS, so no insert policy is needed for server-side writes.
alter table public.audit_log enable row level security;

-- Authenticated users may read their own audit entries (actor_user_id = auth.uid())
create policy "audit_log: select own"
  on public.audit_log
  for select
  using (actor_user_id = auth.uid());

create index audit_log_actor_user_id_idx on public.audit_log (actor_user_id);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_timestamp_idx on public.audit_log (timestamp desc);

comment on table public.audit_log is
  'Append-only audit trail written by the service role (createSupabaseAdminClient).';
