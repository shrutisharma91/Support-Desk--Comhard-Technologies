# Support Desk — Frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + **shadcn/ui** (new-york, Radix).
Talks to the Express API described in [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).

## Run

```bash
cd frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                     # http://localhost:3000
```
Start the backend first (`cd backend && npm run dev`). Demo logins: `admin@demo.local / admin123` (Admin), `riya@demo.local / agent123` (Agent) — one-click buttons on the login page.

Other scripts: `npm run build` (type-checks + production build), `npm run lint`.

## Screens

| Route | What it does |
|---|---|
| `/login` | Demo login, client + server validation, `?next=` redirect back after sign-in |
| `/` | Dashboard: total / open / in progress / resolved, urgent, overdue, SLA breached, unassigned (all from `GET /dashboard/stats`), status breakdown bar, overdue list and urgent queue. Every card links to the matching filtered list. |
| `/tickets` | Table (subject, customer, status, priority, assignee, last updated) with search, multi-select status/priority filters, assignee filter, overdue + SLA toggles, sort by updated/priority/created + direction, pagination. All filter state lives in the URL (shareable, survives refresh). |
| `/tickets/new` | Create form — required fields validated on the client; server `details` mapped back onto fields. |
| `/tickets/[id]` | Original request + replies/notes in chronological order; composer with **Public reply / Internal note** modes (notes are amber, dashed, lock-badged everywhere); instant-save status/priority/assignee; edit-details dialog; resolve/reopen; admin-only delete with confirm; activity history timeline. |
| `/settings` | SLA first-response target (admin-editable, read-only for agents) and team list. |

## Structure

```
src/
├── app/
│   ├── layout.tsx                 # fonts, <Providers>
│   ├── login/page.tsx
│   └── (app)/                     # authenticated area — layout.tsx guards + sidebar shell
│       ├── page.tsx               # dashboard
│       ├── tickets/page.tsx, tickets/new/page.tsx, tickets/[id]/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                        # shadcn/ui primitives (generated, lightly patched for lint)
│   ├── auth/                      # AuthProvider (token restore, 401 → login), LoginForm
│   ├── layout/                    # AppSidebar (views with live counts), breadcrumb, PageHeader
│   ├── dashboard/                 # DashboardView
│   ├── tickets/                   # table, filters, pagination, badges, thread, composer, properties, history, dialogs
│   ├── settings/
│   └── common/                    # EmptyState / ErrorState, UserAvatar, Kbd
├── hooks/
│   ├── use-api.ts                 # TanStack Query hooks + cache invalidation after writes
│   └── use-ticket-filters.ts      # URL ⇄ filter state
└── lib/
    ├── api/client.ts              # fetch wrapper → typed ApiError, bearer token, network/401 handling
    ├── api/endpoints.ts           # one function per API endpoint
    ├── types.ts                   # mirrors API_CONTRACT.md
    ├── validation.ts              # zod schemas (client mirror of server rules)
    ├── constants.ts               # status/priority labels + colours
    └── format.ts, form-errors.ts, utils.ts
```

## Design decisions

- **Client-rendered behind login.** The JWT is kept in `localStorage` and sent as a Bearer header, so pages fetch on the client with TanStack Query (caching, loading/error states, `keepPreviousData` while filters change, no retry on 4xx). Cache Components are deliberately off in `next.config.ts`.
- **Server is the source of truth.** Overdue, SLA breach, counts and history all come from the API; the UI never recomputes business rules. After any write the relevant queries (ticket, list, dashboard, history) are invalidated.
- **Validation twice.** zod on the client for instant feedback; server `VALIDATION_ERROR.details` are mapped onto the same fields (`customer` covers the name-or-email rule).
- **Status / priority readable without colour alone.** Status = coloured dot + label; priority = signal bars + label, Urgent is a solid red pill; overdue rows get a red edge + badge.
- **Reply vs note can't be confused.** Different tab, colour, border style, badge, placeholder, helper text ("Visible to {customer}" vs "Only visible to your team") and button.
- **Permissions in the UI mirror the API.** Delete and SLA editing are only shown to admins; the API still enforces them (403).
