# Network mode

Network mode connects CSL to a Supabase backend, enabling multi-participant leagues, sponsor briefs, live leaderboards, and community feeds.

## Prerequisites

- A [Supabase](https://supabase.com/) project (free tier works)
- Node.js >= 18

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Apply migrations:
   ```bash
   npm run db:push
   ```
4. (Optional) Seed sample data:
   ```bash
   npm run db:seed:linked
   ```
5. Run the CLI or dev server:
   ```bash
   npm run cli          # Interactive CLI with Supabase
   npm run dev          # Next.js dev server
   ```

## Verification

Run the smoke test to confirm Supabase wiring:

```bash
npm run cli:smoke
```

A successful run prints `"mode": "supabase"` in the system-check envelope.

## BDD acceptance tests

BDD scenarios require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```bash
npm run bdd
```

## What network mode unlocks

| Feature | Single-player | Network |
|---|---|---|
| Skill goals and milestones | Yes | Yes |
| Challenge sprints | Yes (local) | Yes (shared) |
| Portfolio and scoring | Yes (local) | Yes (shared) |
| Multi-participant leagues | No | Yes |
| Sponsor briefs | No | Yes |
| Live leaderboards | No | Yes |
| Community showcase feed | No | Yes |

## Deployment

The Next.js app can be deployed to Vercel or any Node.js host. Set the same environment variables in your deployment environment. The REST API lives at `/api/v1/*` — see `docs/openapi.yaml` for the full schema.
