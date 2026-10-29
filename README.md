# Support Desk System

Interview practical: a small support-ticket product with a finished Next.js frontend and an Express/Prisma/SQLite backend that implements a shared API contract.

## Architecture

```
┌──────────────┐     REST/JSON      ┌──────────────┐     Prisma      ┌────────┐
│  Next.js UI  │ ─────────────────► │ Express API  │ ──────────────► │ SQLite │
│  :3000       │  Bearer JWT        │  :4000 /api  │                 │ .db    │
└──────────────┘                    └──────────────┘                 └────────┘
```

- **Frontend** (`frontend/`): Next.js + shadcn/ui, reads `NEXT_PUBLIC_API_URL`
- **Backend** (`backend/`): Express 5, Prisma 6, SQLite, zod validation, JWT auth
- **Contract** (`docs/API_CONTRACT.md`): binding shapes, paths, status codes

## Setup & run

### Backend (port 4000)

```bash
cd backend
cp .env.example .env
npm install
npm run setup
npm run dev
```

### Frontend (port 3000)

```bash
cd frontend
cp .env.example .env.local   # ensure NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a demo account.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@demo.local` | `admin123` |
| AGENT | `riya@demo.local` | `agent123` |
| AGENT | `arjun@demo.local` | `agent123` |
| AGENT | `neha@demo.local` | `agent123` |

## Database

SQLite file at `backend/prisma/dev.db` (URL `file:./dev.db` relative to the Prisma schema).

**Models:** `User`, `Ticket`, `Message`, `Activity`, `Setting`

- Enums stored as strings (SQLite has no native enums); validated with zod
- `Ticket.priorityRank` denormalised for `ORDER BY`
- `Ticket.updatedAt` is set manually in services (no Prisma `@updatedAt`) so no-op PATCH does not bump it
- `Message` / `Activity` use `onDelete: Cascade` from `Ticket`

**Migrations / seed**

```bash
cd backend
npm run setup      # migrate + seed
npm run db:seed    # wipe + re-seed
npm run db:reset   # migrate reset --force + seed
```

Seed creates 4 demo users, `slaHours=4`, and ~18 tickets with messages/activity spanning statuses, priorities, overdue, and SLA-breached cases.

## What works

**Core**

- [x] A — Auth: login, JWT Bearer, `/auth/me`
- [x] B — Tickets: list (filters/sort/search/pagination), create, get, patch
- [x] C — Messages: replies + internal notes, activity history
- [x] D — Dashboard stats
- [x] E — Settings: read SLA hours; ADMIN can update

**Stretch**

- [x] Admin vs Agent roles (`DELETE` tickets + `PATCH` settings are ADMIN-only)
- [x] Pagination envelope `{ data, meta }`
- [x] Overdue (24h from `createdAt`) and SLA breach (first public reply)
- [x] Automated tests (`npm test` in `backend/`)

## Assumptions

- **Open count** = tickets with status exactly `OPEN` (not “all non-resolved”)
- **Urgent count** = `URGENT` and **not** `RESOLVED`
- **Overdue** measured from `createdAt` (not `updatedAt`); resolved tickets are never overdue
- **SLA** = time to first **REPLY** (notes do not count); `slaHours` from `Setting`, default 4
- **Delete** = hard delete with cascade of messages/activity; ADMIN only
- **`updatedAt`** is bumped by field changes **and** by new messages
- **Ticket edit ACL** = any authenticated Agent or Admin may view/edit **any** ticket (assignee is workflow, not an ownership lock). Role split today is only: Admin-only delete + Admin-only SLA settings

## Known issues / incomplete

- No known blocking bugs in the core ticket flow (create → list/filter → detail → reply/note → resolve → dashboard).
- Backend tests reset a dedicated `prisma/test.db` by deleting the file and running `prisma db push` (rather than `db push --force-reset`) so the suite runs cleanly in this environment.
- Frontend/UI was drafted with Claude Code; backend was drafted with Cursor — both aimed at `docs/API_CONTRACT.md` so the stack stays in sync.
- Production hardening (rate limiting, refresh tokens, audit logging, multi-tenant isolation) is out of scope for this 3-hour practical.

## Improvements / future work

- **Assignee-scoped permissions** — optionally restrict Agents so they can only edit tickets assigned to them (or unassigned), while Admins retain full access. Today any Agent can edit any ticket by design.
- Soft-delete or archive instead of hard delete, with an admin restore path.
- Email notifications on assignment, public reply, and SLA breach.
- Richer audit (IP / request id) and rate limiting on login.

## How AI tools were used

This project followed Comhard’s AI-assisted path: **specify → direct → review → verify → ship**.

1. **Specify** — Used the candidate brief plus the binding API contract (`docs/API_CONTRACT.md`) as the source of truth for data model, endpoints, enums, error shapes, overdue/SLA rules, auth, and UI behaviour.
2. **Direct**
   - **Frontend / UI** — Built with **Claude Code**: Next.js app shell, login, dashboard, tickets list/detail, filters, composer (reply vs note), activity timeline, settings, and shadcn/ui components, all wired to the shared contract.
   - **Backend** — Built with **Cursor** (Agent mode): Express/Prisma/SQLite API (modules, middleware, seed, tests, READMEs). Steering kept the agent from renaming or nesting fields that would break the Claude-built frontend.
3. **Review** — Diffs were checked on both sides for contract mismatches (paths, JSON shapes, status codes, `details` keys, cascade delete, manual `updatedAt`, assignee name snapshots, JWT user reload). Confident-but-wrong patterns were corrected before treating drafts as done.
4. **Verify** — Ran backend `npm run typecheck` and `npm test` (24 tests: domain rules + API via Supertest), exercised the live API, then walked the Claude-built UI end to end (login → dashboard → tickets → create/edit → reply/note → settings) against `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.
5. **Ship** — Deliverable is source + README ready for local run; not deployed as a hosted service for this assessment.

Ownership: both the Claude Code frontend and the Cursor backend were verified against the contract and brief; anything the agents generated that did not match was fixed before submission.
