# Creative Sports League (CSL)

CSL is an open-source platform for structured creative challenge sprints — giving emerging creatives a meritocratic path to prove skill publicly, build portfolio, and surface talent without needing insider access or warm introductions.

---

## Quick start

```bash
git clone https://github.com/your-org/csl.git
cd csl
bash scripts/setup-local.sh
# Open .env.local and set ANTHROPIC_API_KEY
npm run cli
```

That's it. No database required for single-player mode.

---

## Single-player mode

Single-player mode works with only `ANTHROPIC_API_KEY` and stores all data locally in `.csl-data.json`.

1. **Set a skill goal** — pick a label and disciplines
2. **Create a challenge** — define a prompt, deadline, and scoring criteria
3. **Submit an entry** — link a public artifact (URL or file)
4. **Score and reflect** — criteria-based scoring builds your portfolio
5. **Recommend a path** — AI suggests next steps based on your goals

The learner journey menu gives you access to all five steps in under 10 keystrokes each.

---

## Network mode

Network mode connects to a Supabase backend, unlocking multi-participant leagues, sponsor briefs, live leaderboards, and community feeds.

See [docs/network-mode.md](docs/network-mode.md) for setup and deployment details.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | For AI features | — | API key from [console.anthropic.com](https://console.anthropic.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | For network mode | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For network mode | — | Supabase anon/publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alias for above | — | Accepted as an alias for the publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin/BDD | — | Server-only; never expose to the browser |
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
│   └── lib/
│       ├── supabase/           # Supabase clients, repositories, ID generation
│       └── local-store/        # JSON file store for single-player mode
├── cli/                        # Interactive + CI-safe CLI (tsx entry point)
├── app/                        # Next.js App Router (REST API under /api/v1/*)
├── features/                   # Cucumber BDD scenarios
└── lat.md/                     # Knowledge graph — vision, domain model, backlog
```

**Guiding principles:**

- Domain logic lives in services — repositories encapsulate data access
- Services take either a Supabase client or a local file store — same interface
- BDD step definitions use real implementations against Postgres
- Scoring is deterministic — same inputs produce the same leaderboard every time

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue filing, branch conventions, and the PR checklist.
