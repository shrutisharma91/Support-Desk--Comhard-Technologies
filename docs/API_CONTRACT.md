# Support Desk — API Contract (v1)

Single source of truth shared by `frontend/` (Next.js) and `backend/` (Express).
If the backend deviates from this file, the frontend breaks. Change this file first, then both sides.

- Base URL: `http://localhost:4000/api`
- Content type: `application/json` (requests and responses)
- Timestamps: ISO‑8601 UTC strings, e.g. `"2026-10-29T09:15:00.000Z"`
- IDs: positive integers
- Auth: `Authorization: Bearer <jwt>` on every endpoint except `GET /health` and `POST /auth/login`

---

## 1. Enums

| Enum | Values |
|---|---|
| `TicketStatus` | `OPEN`, `IN_PROGRESS`, `WAITING_ON_CUSTOMER`, `RESOLVED` |
| `TicketPriority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `MessageType` | `REPLY` (public, customer-visible), `NOTE` (internal, agents only) |
| `UserRole` | `ADMIN`, `AGENT` |
| `ActivityType` | `TICKET_CREATED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `ASSIGNEE_CHANGED`, `DETAILS_UPDATED`, `REPLY_ADDED`, `NOTE_ADDED` |

Priority rank for sorting: `LOW=1, MEDIUM=2, HIGH=3, URGENT=4`.

---

## 2. Resource shapes

### UserSummary
```json
{ "id": 2, "name": "Riya Kapoor", "email": "riya@demo.local", "role": "AGENT" }
```

### Ticket
Returned by list, detail, create and update.
```json
{
  "id": 14,
  "subject": "Cannot reset my password",
  "customerName": "Kabir Rao",
  "customerEmail": "kabir@example.com",
  "description": "The reset link in the email says it has expired...",
  "status": "OPEN",
  "priority": "HIGH",
  "assignee": { "id": 2, "name": "Riya Kapoor", "email": "riya@demo.local", "role": "AGENT" },
  "createdBy": { "id": 1, "name": "Admin User", "email": "admin@demo.local", "role": "ADMIN" },
  "createdAt": "2026-10-27T08:00:00.000Z",
  "updatedAt": "2026-10-29T06:12:44.000Z",
  "resolvedAt": null,
  "firstResponseAt": null,
  "messageCount": 3,
  "isOverdue": true,
  "slaDueAt": "2026-10-27T12:00:00.000Z",
  "slaBreached": true
}
```
| Field | Notes |
|---|---|
| `customerName`, `customerEmail` | Each nullable; **at least one** is non-null. |
| `assignee` | `null` = unassigned. |
| `createdBy` | `null` only if the creating user no longer exists. |
| `updatedAt` | Bumped on **any** change: field edits **and** new replies/notes. |
| `resolvedAt` | Set when status becomes `RESOLVED`; cleared to `null` if reopened. |
| `firstResponseAt` | Timestamp of the first `REPLY` (notes don't count). |
| `messageCount` | Replies + notes. |
| `isOverdue` | Computed: `status !== RESOLVED && createdAt < now − 24h`. |
| `slaDueAt` | Computed: `createdAt + slaHours`. |
| `slaBreached` | Computed: `status !== RESOLVED && firstResponseAt === null && now > slaDueAt`. |

### Message
```json
{
  "id": 31,
  "ticketId": 14,
  "type": "NOTE",
  "body": "Customer is on the legacy plan, check billing before replying.",
  "author": { "id": 2, "name": "Riya Kapoor", "email": "riya@demo.local", "role": "AGENT" },
  "createdAt": "2026-10-29T06:12:44.000Z"
}
```

### Activity
```json
{
  "id": 77,
  "ticketId": 14,
  "type": "STATUS_CHANGED",
  "actor": { "id": 2, "name": "Riya Kapoor", "email": "riya@demo.local", "role": "AGENT" },
  "fromValue": "OPEN",
  "toValue": "IN_PROGRESS",
  "createdAt": "2026-10-29T06:10:00.000Z"
}
```
| `type` | `fromValue` | `toValue` |
|---|---|---|
| `TICKET_CREATED` | `null` | `null` |
| `STATUS_CHANGED` | old status enum | new status enum |
| `PRIORITY_CHANGED` | old priority enum | new priority enum |
| `ASSIGNEE_CHANGED` | old assignee **name** or `null` (unassigned) | new assignee **name** or `null` |
| `DETAILS_UPDATED` | `null` | comma list of changed fields, e.g. `"subject, description"` |
| `REPLY_ADDED` / `NOTE_ADDED` | `null` | `null` |

`actor` is `null` only if that user no longer exists.

### Pagination envelope
```json
{ "data": [ /* Ticket[] */ ], "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }
```

### Error envelope (every non-2xx response)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "subject": "Subject is required", "customer": "Provide a customer name or email" }
  }
}
```
`details` is optional; when present it maps **field name → single human-readable message**.

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query fails validation, unknown fields, bad id format |
| 400 | `BAD_REQUEST` | Malformed JSON body |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 401 | `INVALID_CREDENTIALS` | Wrong email/password at login |
| 403 | `FORBIDDEN` | Authenticated but role not allowed |
| 404 | `NOT_FOUND` | Record or route doesn't exist |
| 500 | `INTERNAL_ERROR` | Anything unexpected (never leak stack traces) |

---

## 3. Endpoints

| # | Method | Path | Auth | Success |
|---|---|---|---|---|
| 1 | GET | `/health` | — | 200 `{ "status": "ok" }` |
| 2 | POST | `/auth/login` | — | 200 `{ token, user }` |
| 3 | GET | `/auth/me` | any | 200 `UserSummary` |
| 4 | GET | `/users` | any | 200 `UserSummary[]` (sorted by name) |
| 5 | GET | `/tickets` | any | 200 paginated `Ticket[]` |
| 6 | POST | `/tickets` | any | 201 `Ticket` |
| 7 | GET | `/tickets/:id` | any | 200 `Ticket` |
| 8 | PATCH | `/tickets/:id` | any | 200 `Ticket` |
| 9 | DELETE | `/tickets/:id` | **ADMIN** | 204 (no body) |
| 10 | GET | `/tickets/:id/messages` | any | 200 `Message[]` (oldest first) |
| 11 | POST | `/tickets/:id/messages` | any | 201 `Message` |
| 12 | GET | `/tickets/:id/activity` | any | 200 `Activity[]` (oldest first) |
| 13 | GET | `/dashboard/stats` | any | 200 `DashboardStats` |
| 14 | GET | `/settings` | any | 200 `{ "slaHours": 4 }` |
| 15 | PATCH | `/settings` | **ADMIN** | 200 `{ "slaHours": 8 }` |

### 2 · POST /auth/login
Request `{ "email": "admin@demo.local", "password": "admin123" }`
Response `{ "token": "<jwt>", "user": UserSummary }`. Email match is case-insensitive.

### 5 · GET /tickets — query params (all optional, combinable)
| Param | Format | Behaviour |
|---|---|---|
| `q` | string | Case-insensitive substring match on `subject` OR `customerName` OR `customerEmail` |
| `status` | CSV of `TicketStatus` | e.g. `status=OPEN,IN_PROGRESS` (OR within the param) |
| `priority` | CSV of `TicketPriority` | e.g. `priority=HIGH,URGENT` |
| `assigneeId` | integer \| `unassigned` \| `me` | `me` = current user |
| `overdue` | `true` | Only overdue tickets (not resolved, created > 24h ago) |
| `slaBreached` | `true` | Only SLA-breached tickets (not resolved, no `REPLY` yet, created > `slaHours` ago) |
| `sort` | `updated` (default) \| `priority` \| `created` | `priority` sorts by rank, tie-break `updatedAt desc` |
| `order` | `desc` (default) \| `asc` | |
| `page` | int ≥ 1, default 1 | |
| `pageSize` | int 1–100, default 10 | |

Different params combine with AND. Invalid enum values → 400 `VALIDATION_ERROR`.

### 6 · POST /tickets
```json
{
  "subject": "Cannot reset my password",        // required, trimmed, 3–200 chars
  "customerName": "Kabir Rao",                  // optional, ≤120 chars
  "customerEmail": "kabir@example.com",         // optional, valid email, ≤254 chars
  "description": "The reset link ...",          // required, trimmed, 1–5000 chars
  "priority": "HIGH",                           // optional, default MEDIUM
  "status": "OPEN",                             // optional, default OPEN
  "assigneeId": 2                               // optional, null/absent = unassigned; must exist
}
```
Rule: at least one of `customerName` / `customerEmail` must be non-empty → else `details.customer`.
Empty strings are normalised to `null`. Side effect: one `TICKET_CREATED` activity (plus `ASSIGNEE_CHANGED` from `null` if created with an assignee). If created with `status: RESOLVED`, set `resolvedAt`.

### 8 · PATCH /tickets/:id
Body: any non-empty subset of `subject, customerName, customerEmail, description, status, priority, assigneeId` (same rules as create; `assigneeId: null` unassigns). Unknown keys → 400.
Customer rule is checked on the **merged** result.
Side effects (in one DB transaction, only for fields whose value actually changed):
- `status` → `STATUS_CHANGED`; `RESOLVED` sets `resolvedAt`, leaving `RESOLVED` clears it
- `priority` → `PRIORITY_CHANGED`
- `assigneeId` → `ASSIGNEE_CHANGED` (names, not ids)
- any of `subject/customerName/customerEmail/description` → one `DETAILS_UPDATED`
If nothing actually changed: 200 with the unchanged ticket, no activity, `updatedAt` untouched.

### 9 · DELETE /tickets/:id
ADMIN only. Hard delete; messages and activity cascade-delete (no orphans). AGENT → 403.

### 11 · POST /tickets/:id/messages
```json
{ "type": "REPLY", "body": "Hi Kabir, we've sent a fresh link." }   // body trimmed, 1–5000 chars
```
Author = authenticated user (never taken from the body). Side effects in one transaction: create message, add `REPLY_ADDED`/`NOTE_ADDED` activity, bump ticket `updatedAt`, set `firstResponseAt` if this is the first `REPLY`.

### 13 · GET /dashboard/stats
```json
{
  "total": 42,
  "open": 12,
  "inProgress": 9,
  "waitingOnCustomer": 6,
  "resolved": 15,
  "urgent": 4,
  "overdue": 7,
  "slaBreached": 3,
  "unassigned": 5,
  "slaHours": 4
}
```
- `open` / `inProgress` / `waitingOnCustomer` / `resolved` = count by exact status
- `urgent` = `URGENT` **and not resolved**
- `overdue`, `slaBreached` = same definitions as on Ticket
- `unassigned` = no assignee **and not resolved**

### 15 · PATCH /settings
`{ "slaHours": 8 }` — integer 1–168. ADMIN only.

---

## 4. Demo accounts (seeded, fictional)
| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@demo.local` | `admin123` |
| AGENT | `riya@demo.local` | `agent123` |
| AGENT | `arjun@demo.local` | `agent123` |
| AGENT | `neha@demo.local` | `agent123` |
