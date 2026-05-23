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

## Features

| Feature | Description |
|---|---|
| Multi-participant leagues | Hosts create leagues, participants enroll and compete |
| Challenge sprints | Time-boxed creative challenges with scoring criteria |
| Portfolio and scoring | Multi-judge scoring with leaderboards |
| Sponsor briefs | Sponsors attach briefs and track outcomes |
| Live leaderboards | Real-time ranked submissions |
| Community showcase feed | Public feed of scored submissions |
| Skill journey | Skill intents, learning plans, milestones |

## Deployment

The Next.js app can be deployed to Vercel or any Node.js host. Set the same environment variables in your deployment environment. The REST API lives at `/api/v1/*` — see `docs/openapi.yaml` for the full schema.
