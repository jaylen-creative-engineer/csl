# Contributing to CSL

Thank you for your interest in contributing to the Creative Sports League platform.

## Filing issues

Use [GitHub Issues](https://github.com/your-org/csl/issues) to report bugs, propose features, or ask questions. Please include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node.js version and OS

## Branch naming

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Tooling, dependencies, docs, formatting |

Examples: `feat/ai-path-recommendation`, `fix/local-store-upsert`, `chore/update-readme`

## Development setup

```bash
git clone https://github.com/your-org/csl.git
cd csl
bash scripts/setup-local.sh
# Set ANTHROPIC_API_KEY in .env.local
npm run cli    # Verify local-store mode works
```

For Supabase-backed development, set all three Supabase vars in `.env.local` (see `.env.example`).

## Pull request checklist

Before opening a PR, run the verification gate:

```bash
npm run typecheck && npm test && npm run bdd
```

Or all at once:

```bash
npm run verify
```

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm test` passes (all Vitest unit tests green)
- [ ] `npm run bdd` passes (or is skipped cleanly if Supabase env vars are absent)
- [ ] README updated if public behavior or CLI options changed
- [ ] New environment variables added to `.env.example` with inline comments
- [ ] No `.env.local` or credentials committed

## Code style

- TypeScript strict mode — no `any`, no `@ts-ignore` without a comment explaining why
- Domain logic in `src/` services — not in CLI or API route handlers
- Keep CLI workflows to 10 keystrokes or fewer on the happy path
- JSON output uses `{ ok: true, data }` / `{ ok: false, error }` envelopes

## Running individual test suites

```bash
npm run test:watch            # Vitest in watch mode
npm run bdd:challenge         # BDD: @challenge scenarios only
npm run bdd:league            # BDD: @league scenarios only
npm run bdd:showcase          # BDD: @showcase scenarios only
```
