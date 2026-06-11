# Creative Sports League (CSL)

CSL is an open-source platform for structured creative challenge sprints — giving emerging creatives a meritocratic path to prove skill publicly, build portfolio, and surface talent without needing insider access or warm introductions.

---

## Quick start

```bash
git clone https://github.com/your-org/csl.git
cd csl
bash scripts/setup-local.sh
# Open .env.local and fill in Supabase + Anthropic credentials
npm run db:push
npm run cli
```

---

## Setup

CSL requires a [Supabase](https://supabase.com/) project for data storage. All domain data — leagues, challenges, submissions, sponsors, and learner journeys — is persisted in Postgres via Supabase.

1. Create a Supabase project at [supabase.com](https://supabase.com/) (free tier works).
2. Copy `.env.example` to `.env.local` and fill in your credentials.
3. Apply database migrations: `npm run db:push`
4. (Optional) Seed sample data: `npm run db:seed:linked`
5. Run the CLI or dev server:
   ```bash
   npm run cli          # Interactive CLI
   npm run dev          # Next.js dev server
   ```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | For AI features | — | API key from [console.anthropic.com](https://console.anthropic.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | — | Supabase anon/publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alias for above | — | Accepted as an alias for the publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | — | Server-only; never expose to the browser |
| `DATABASE_URL` | For migrations | — | Direct Postgres connection string (port 5432) |

Copy `.env.example` to `.env.local` to get started:

```bash
cp .env.example .env.local
```

---

## Development

```bash
npm run typecheck     # TypeScript type check
npm test              # Vitest unit tests
npm run bdd           # Cucumber BDD scenarios (requires Supabase env vars)
npm run verify        # typecheck + tests + BDD (full integration gate)
npm run dev           # Start Next.js dev server
npm run cli           # Start interactive CLI (requires TTY)
npm run cli:smoke     # Non-interactive wiring check (CI-safe)
```

**Architecture:**

```
csl/
├── src/
│   ├── league-model/           # Core entities: League, Season, LeagueHost, Participant
│   ├── challenge-intelligence/ # Sprint lifecycle, scoring, leaderboard, diff
│   ├── showcase-intelligence/  # Portfolio, skill signals, top performers feed
│   ├── sponsor-intelligence/   # Sponsor attachment, brief, outcome tracking
│   ├── skill-journey/          # Skill intent, learning plans, milestones
│   └── lib/
│       └── supabase/           # Supabase clients, repositories, ID generation
├── cli/                        # Interactive + CI-safe CLI (tsx entry point)
├── app/                        # Next.js App Router (REST API under /api/v1/*)
├── features/                   # Cucumber BDD scenarios
└── lat.md/                     # Knowledge graph — vision, domain model, backlog
```

**Guiding principles:**

- Domain logic lives in services — repositories encapsulate data access
- All data is persisted in Supabase Postgres
- BDD step definitions use real implementations against Postgres
- Scoring is deterministic — same inputs produce the same leaderboard every time

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue filing, branch conventions, and the PR checklist.
