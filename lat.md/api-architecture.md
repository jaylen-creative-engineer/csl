# HTTP API architecture

Thin Next.js Route Handlers expose versioned JSON over the domain services. No business rules in `app/api` — only parsing, HTTP codes, and wiring to [[src/lib/csl-services.ts]].

## Supabase client choice (interim)

Service-role wiring only until RLS ships.

Handlers use [[src/lib/api/route-services.ts]] today. Later, switch to [[src/lib/supabase/server.ts#createSupabaseServerClient]] under [[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 4 — Auth, RBAC, observability]].

## Envelope & helpers

Success: `{ "ok": true, "data": T }`. Error: `{ "ok": false, "error": string }`. Shared helpers live in [[src/lib/api/http.ts]].

## Resource map

Version prefix is **`/api/v1`**.

Full table of methods and paths (Next App Router file layout uses `[param]` folders):

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/hosts` | Create league host |
| POST | `/api/v1/seasons` | Create season |
| POST | `/api/v1/leagues` | Create league |
| GET | `/api/v1/leagues/[leagueId]` | Get league |
| POST | `/api/v1/leagues/[leagueId]/activate` | Activate league |
| POST | `/api/v1/leagues/[leagueId]/close` | Close league |
| GET | `/api/v1/leagues/[leagueId]/participants` | List enrolled participants |
| POST | `/api/v1/leagues/[leagueId]/enrollments` | Enroll `{ participantId }` |
| GET | `/api/v1/leagues/[leagueId]/showcase/feed` | Showcase feed |
| GET | `/api/v1/leagues/[leagueId]/showcase/top?limit=` | Top performers |
| POST | `/api/v1/participants` | Create participant |
| GET | `/api/v1/participants/[participantId]` | Get participant |
| GET | `/api/v1/participants/[participantId]/portfolio` | Portfolio |
| POST | `/api/v1/challenges` | Create challenge |
| GET | `/api/v1/challenges/[challengeId]` | Get challenge |
| POST | `/api/v1/challenges/[challengeId]/open` | Open submissions |
| POST | `/api/v1/challenges/[challengeId]/judging` | Judging phase |
| POST | `/api/v1/challenges/[challengeId]/complete` | Complete |
| GET/POST | `/api/v1/challenges/[challengeId]/submissions` | List / submit |
| GET | `/api/v1/challenges/[challengeId]/leaderboard` | Leaderboard |
| POST | `/api/v1/challenges/diff` | Body `{ challengeAId, challengeBId }` |
| POST | `/api/v1/submissions/[submissionId]/score` | Score submission |
| POST | `/api/v1/sponsors` | Create sponsor |
| GET | `/api/v1/sponsors/[sponsorId]` | Get sponsor |
| GET | `/api/v1/sponsors/[sponsorId]/summary` | Summary |
| POST | `/api/v1/sponsors/[sponsorId]/attachments` | Attach to challenge |
| PATCH | `/api/v1/sponsor-attachments/[attachmentId]/outcome` | Outcome |

## Next steps

Ship hardening before external clients depend on this surface.

- **Validation** — Zod schemas for bodies; 422 for invalid shape.
- **Auth** — Cookie session; map `auth.users` → participant; role checks per route.
- **Idempotency** — `Idempotency-Key` on mutating POSTs where duplicates are costly.
- **Pagination** — Cursor or offset for feeds and long lists.
- **OpenAPI** — Spec generation or checked-in `openapi.yaml`.
