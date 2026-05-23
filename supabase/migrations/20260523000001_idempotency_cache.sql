-- Idempotency cache: replaces the in-memory Map used by API route handlers.
-- Stores response bodies keyed by client-supplied Idempotency-Key headers.

create table if not exists idempotency_cache (
  key         text        primary key,
  body        jsonb       not null,
  status_code smallint    not null,
  created_at  timestamptz not null default now()
);

comment on table idempotency_cache is 'Stores idempotent POST responses keyed by client Idempotency-Key header';

-- Auto-expire entries older than 24 hours via pg_cron (if available) or
-- application-level TTL check. Index supports efficient TTL sweeps.
create index if not exists idx_idempotency_cache_created_at
  on idempotency_cache (created_at);
