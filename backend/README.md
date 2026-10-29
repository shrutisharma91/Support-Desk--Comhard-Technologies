# Support Desk Backend

Express 5 + Prisma 6 + SQLite API for the Support Desk interview practical. Implements [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md) field-for-field.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run setup          # migrate + seed
npm run dev            # http://localhost:4000
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run setup` | `prisma migrate dev --name init` + seed |
| `npm run db:seed` | Re-seed (idempotent wipe + insert) |
| `npm run db:reset` | Reset migrations + seed |
| `npm test` | Vitest + Supertest |
| `npm run typecheck` | `tsc --noEmit` |

## Demo credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@demo.local` | `admin123` |
| AGENT | `riya@demo.local` | `agent123` |
| AGENT | `arjun@demo.local` | `agent123` |
| AGENT | `neha@demo.local` | `agent123` |

## Endpoints

Base URL: `http://localhost:4000/api`

Full request/response shapes, enums, query params and error envelope: **[`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)**.

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | — |
| POST | `/auth/login` | — |
| GET | `/auth/me` | any |
| GET | `/users` | any |
| GET | `/tickets` | any |
| POST | `/tickets` | any |
| GET | `/tickets/:id` | any |
| PATCH | `/tickets/:id` | any |
| DELETE | `/tickets/:id` | **ADMIN** |
| GET | `/tickets/:id/messages` | any |
| POST | `/tickets/:id/messages` | any |
| GET | `/tickets/:id/activity` | any |
| GET | `/dashboard/stats` | any |
| GET | `/settings` | any |
| PATCH | `/settings` | **ADMIN** |

## Delete policy

`DELETE /tickets/:id` is **ADMIN-only**. It hard-deletes the ticket; related `Message` and `Activity` rows cascade-delete so no orphans remain. Agents receive `403 FORBIDDEN`.
