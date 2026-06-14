# AGENTS.md

## Cursor Cloud specific instructions

CSL is a single repo with three runnable surfaces, all backed by one Supabase
Postgres database:

- **Next.js web app + REST API** — `npm run dev` (http://localhost:3000). UI under
  `app/`, REST API under `app/api/v1/*`. `GET` routes are open; mutating routes call
  `requireAuth()` and need a Supabase Auth session cookie (there is no login page in
  the UI yet, so UI-driven writes are not yet a complete flow — exercise writes via
  the CLI instead).
- **Interactive CLI** — primary surface for taking domain actions; uses the
  service-role admin client, so no auth is needed. See "CLI" below.
- **Supabase Postgres** — all domain data. Required for the CLI, every `/api/v1/*`
  data call, and the BDD suite.

Standard commands live in `README.md` / `package.json` scripts; don't duplicate them.
Notes below are the non-obvious things.

### Environment / services

- Dependencies are installed by the startup update script (`npm install`). Use **npm**
  (the documented manager); a `pnpm-lock.yaml` also exists but README/scripts use npm.
- A local **Supabase stack runs in Docker** (Docker is preinstalled in the VM image,
  with the `fuse-overlayfs` storage driver and the containerd-snapshotter feature
  disabled — required for Docker 29 here). If Docker isn't running, start it with
  `sudo dockerd &` and, in a new shell, `sudo chmod 666 /var/run/docker.sock`.
- Bring up the DB with `npx supabase start` (first run pulls many images). Credentials
  come from `npx supabase status`; put them in `.env.local` (git-ignored). The local
  API URL is `http://127.0.0.1:54321`, Postgres is on `127.0.0.1:54322`
  (user/pass `postgres`/`postgres`).
- `.env.local` keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (or `..._ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`. `ANTHROPIC_API_KEY`
  is optional — only the 3 learner AI routes use it.
- The Next dev server reads `.env.local` at startup; restart it after editing env.

### Local DB bring-up gotchas (important — fresh `supabase start` will NOT work cleanly)

1. **Migration ordering bug.** `supabase/migrations/20260210120000_participants_user_id.sql`
   is timestamped *before* `20260417000000_initial_schema.sql`, but it `alter`s the
   `participants` table that initial_schema creates. A fresh `supabase start` /
   `supabase db reset` / `supabase db push` therefore fails with
   `relation "public.participants" does not exist`. Work around it for local bring-up
   by temporarily making that file sort right after initial_schema, then restoring its
   name (keeps the working tree clean):
   ```bash
   cd supabase/migrations
   mv 20260210120000_participants_user_id.sql 20260417000001_participants_user_id.sql
   cd ../.. && npx supabase start
   mv supabase/migrations/20260417000001_participants_user_id.sql \
      supabase/migrations/20260210120000_participants_user_id.sql
   ```
   (The proper fix is to renumber that migration in the repo; not done here to avoid
   changing committed schema.)

2. **Missing table grants.** The migrations contain no `GRANT` statements, and the
   local stack does not auto-grant DML to the Supabase roles for migration-created
   tables. Without this, the CLI/API fail with `permission denied for table ...`.
   After the stack is up, grant once:
   ```bash
   docker exec -i supabase_db_csl psql -U postgres -d postgres <<'SQL'
   GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
   SQL
   ```

3. Reset/clean data between runs with `supabase/seed.sql` (it truncates + reseeds):
   `docker exec -i supabase_db_csl psql -U postgres -d postgres < supabase/seed.sql`.

### CLI

- `npm run cli -- --demo` does **not** forward the flag (nested npm script). Run the
  entry directly:
  - End-to-end demo (creates league → challenge → submissions → scoring → leaderboard
    → sponsor): `node ./node_modules/tsx/dist/cli.mjs ./cli/entry.ts --demo`
  - Wiring smoke check: `npm run cli:smoke`
  - Interactive menu: `npm run cli` (needs a TTY).

### Known pre-existing issues (not environment problems)

- `npm run typecheck` (`tsc --noEmit`) fails on `app/**/*.tsx` `next/link` /
  `next/navigation` / `next/font` imports under `moduleResolution: nodenext`. The app
  itself runs fine under `next dev`. This is unrelated to env setup.
- A few Vitest cases assert exact error-message wording that has since drifted (e.g.
  expecting `"Sponsor not found"` vs the actual PostgREST `"Cannot coerce ..."`); these
  fail regardless of environment.
- The BDD suite (`npm run bdd`) is not isolated (the `Before` hook resets in-memory
  state only, not the DB) and reuses fixed handles like `alex` across scenarios, so it
  hits `participants_handle_lower_unique` collisions; it also has a duplicate step
  definition (`the sponsor attaches a brief to the challenge` registered as both
  `Given` and `When` in `features/step_definitions/sponsor.steps.ts`) → "ambiguous"
  failures. Steps do execute against real Postgres.
