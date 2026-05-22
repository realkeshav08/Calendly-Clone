# Calendly Clone

A full-stack scheduling app that replicates Calendly's booking flow: hosts define event types and weekly availability, and invitees pick a slot from a timezone-aware calendar to book a meeting — with double-booking protection and buffers.

> **Live demo** _(fill in after deploy)_
> - **Frontend:** https://YOUR-APP.vercel.app
> - **API health check:** https://YOUR-API.onrender.com/health
> - **Sample booking page:** https://YOUR-APP.vercel.app/demo/30min

| Marketing homepage | Booking page | Admin dashboard |
|---|---|---|
| ![Landing](docs/shots/landing.png) | ![Booking](docs/shots/booking2.png) | ![Admin](docs/shots/eventtypes.png) |

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router, TS, React 19)** | File-based routing, RSC, first-class Vercel deploy |
| Styling | **Tailwind CSS + shadcn-style UI** | Matches Calendly's clean, rounded, whitespace-heavy look |
| Server state | **TanStack Query** | Caching, optimistic updates for toggle/delete/cancel |
| Forms | **React Hook Form + Zod** | Same Zod schemas validate on client and server |
| Dates/TZ | **date-fns + date-fns-tz** | Correct DST and half-hour-offset handling (no raw `Date` math) |
| Backend | **Node + Express (TS)** | Lightweight, explicit routing/middleware |
| ORM | **Prisma** | Type-safe queries, migrations, matches a PostgreSQL stack |
| Database | **PostgreSQL (Neon)** | Serverless Postgres, generous free tier |
| Validation | **Zod** (shared package) | One source of truth for request/response contracts |
| Logging/Security | **pino, helmet, cors, express-rate-limit** | Structured logs, secure headers, abuse protection |
| Email | **nodemailer + Resend** | Confirmation/cancellation emails (graceful no-op without a key) |

---

## Features

**Core**
- ✅ Event types — create / edit / delete, enable-disable toggle, copy booking link
- ✅ Availability — weekly hours editor (multiple windows per day), timezone per schedule
- ✅ Public booking page — month calendar with available-day dots, timezone auto-detect, Calendly's signature slot→**Confirm** split interaction, details form
- ✅ Booking confirmation page + public cancel link
- ✅ Meetings dashboard — Upcoming / Past tabs, cancel
- ✅ **Timezone-correct slot generation** (UTC in DB, converted at the display boundary)
- ✅ **Double-booking prevention** via a Serializable transaction

**Bonus (implemented)**
- ✅ Fully responsive (mobile bottom-nav, stacked booking layout)
- ✅ Multiple availability schedules (pick per event type)
- ✅ Buffer time before/after (in the slot algorithm + event form)
- ✅ Date overrides (one-off unavailable days / custom hours)
- ✅ Rescheduling (marks the old booking `RESCHEDULED`, creates a new one)
- ✅ Custom invitee questions (stored in `Booking.answers` JSON)
- ✅ Email notifications (Resend; no-op when unconfigured)

**Skipped (intentionally)** — real auth, payments, Google Calendar sync, recurring events. See _Assumptions_.

---

## Architecture

```mermaid
flowchart LR
  Browser[Browser] -->|HTTPS| Next[Next.js on Vercel]
  Next -->|fetch /api| Express[Express API on Render]
  Express -->|Prisma + Neon serverless driver| PG[(PostgreSQL on Neon)]
  Express -.->|optional| Resend[Resend email]
```

The shared `packages/shared` module exports Zod schemas/types consumed by **both** apps, so request/response contracts can't drift.

### Backend layering (OOP / SOLID)

The API is layered so each class has one responsibility and depends on abstractions, not concretions:

```
Route → Controller → Service (class) → Repository (interface) → Prisma
                          │
                          └→ NotificationService → INotificationChannel (Email | Console)
```

- **Repositories** (`src/repositories`) — an abstract `BaseRepository` (shared Prisma access + a Serializable-transaction helper) is **extended** by `User/EventType/Schedule/Booking` repositories, each implementing a focused interface (`IUserRepository`, …). Services depend on these interfaces, so the data store is swappable — **Dependency Inversion + encapsulation**.
- **Services** (`src/modules/**/**.service.ts`) — plain classes receiving their collaborators via the constructor; they hold the use-case logic and ownership checks. **Single Responsibility + DIP.**
- **Notifications** (`src/services/notification`) — `INotificationChannel` strategy with interchangeable `EmailChannel` / `ConsoleChannel` implementations; adding SMS/Slack is a new class, no edits to the booking flow. **Open/Closed + Liskov + polymorphism.**
- **Errors** (`src/lib/errors.ts`) — an `AppError` base **inherited** by `NotFound/Validation/Conflict/BadRequest`; the error middleware branches on type. **Polymorphism.**
- **Composition root** (`src/container.ts`) — the one place concrete classes are constructed and wired; controllers just call the resulting service instances.

The slot algorithm (`utils/slots.ts`) is deliberately kept a **pure function** (not a class) so it stays deterministic and unit-testable in isolation — a reminder that not everything should be an object.

### Database schema

Entity-relationship overview (mirrors [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma)). `PK` = primary key, `UK` = unique, `FK` = foreign key.

```mermaid
erDiagram
  User ||--o{ EventType : "owns"
  User ||--o{ AvailabilitySchedule : "owns"
  User ||--o{ Booking : "hosts"
  AvailabilitySchedule ||--o{ WeeklyHour : "has"
  AvailabilitySchedule ||--o{ DateOverride : "has"
  AvailabilitySchedule |o--o{ EventType : "applies to"
  EventType ||--o{ Booking : "booked as"
  EventType ||--o{ CustomQuestion : "asks"

  User {
    string   id            PK "cuid()"
    string   email         UK
    string   username      UK "used in /{username}/{slug}"
    string   name
    string   timezone         "IANA, default Asia/Kolkata"
    datetime createdAt
    datetime updatedAt
  }

  EventType {
    string   id               PK "cuid()"
    string   userId           FK
    string   scheduleId       FK "nullable -> falls back to default"
    string   title
    string   slug                "unique per user (userId, slug)"
    string   description         "nullable"
    int      durationMinutes
    int      bufferBeforeMins    "default 0"
    int      bufferAfterMins     "default 0"
    string   color               "hex, default #0069ff"
    boolean  isActive            "default true"
    datetime createdAt
    datetime updatedAt
  }

  AvailabilitySchedule {
    string   id          PK "cuid()"
    string   userId      FK
    string   name
    string   timezone       "IANA"
    boolean  isDefault      "one default per user"
    datetime createdAt
    datetime updatedAt
  }

  WeeklyHour {
    string id         PK "cuid()"
    string scheduleId FK
    int    dayOfWeek     "0=Sun .. 6=Sat"
    string startTime     "HH:mm in schedule tz"
    string endTime       "HH:mm in schedule tz"
  }

  DateOverride {
    string  id            PK "cuid()"
    string  scheduleId    FK "unique per (scheduleId, date)"
    date    date             "@db.Date"
    boolean isUnavailable    "if true, no slots that day"
    string  startTime        "nullable HH:mm"
    string  endTime          "nullable HH:mm"
  }

  Booking {
    string   id                 PK "cuid()"
    string   eventTypeId        FK
    string   hostId             FK "denormalized for fast queries"
    string   inviteeName
    string   inviteeEmail
    string   inviteeTimezone       "IANA the invitee booked from"
    datetime startTime             "stored in UTC"
    datetime endTime               "stored in UTC"
    enum     status                "CONFIRMED | CANCELLED | RESCHEDULED"
    string   cancellationReason    "nullable"
    datetime cancelledAt           "nullable"
    string   notes                 "nullable"
    json     answers               "nullable custom-question answers"
    datetime createdAt
    datetime updatedAt
  }

  CustomQuestion {
    string  id          PK "cuid()"
    string  eventTypeId FK
    string  question
    boolean isRequired     "default false"
    int     order          "display order"
  }
```

**Indexing & integrity highlights:** `@@unique([userId, slug])` on EventType and `@@unique([scheduleId, date])` on DateOverride; composite indexes `Booking(hostId, startTime)`, `Booking(eventTypeId, startTime)`, and `Booking(startTime)` for the meetings page and slot lookups; `onDelete: Cascade` from User → its schedules/event types and from a schedule/event type → its child rows, while Bookings are retained (soft-cancelled, never orphaned).

---

## Local setup

```bash
git clone <repo-url>
cd "Calendly Clone"
corepack enable                                  # provides pnpm
pnpm install

cp apps/api/.env.example apps/api/.env           # fill DATABASE_URL (Neon)
cp apps/web/.env.example apps/web/.env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000

# Apply schema + seed demo data.
pnpm --filter api migrate:http                   # applies migrations over Neon (port 443)
pnpm --filter api seed                           # 1 user, 2 schedules, 3 events, 4 bookings

pnpm dev                                          # starts API (:4000) and web (:3000)
```

Open http://localhost:3000 (admin) and http://localhost:3000/demo/30min (booking).

> **Note on `migrate:http`:** the standard `prisma migrate deploy` connects on port **5432**. If your network blocks 5432 (common on some ISPs), use `pnpm --filter api migrate:http`, which applies migrations through the Neon serverless driver over port **443**. On a network/host where 5432 is open, `pnpm --filter api migrate:deploy` works too. Both write identical `_prisma_migrations` bookkeeping.

---

## Environment variables

**`apps/api/.env`**

| Var | Required | Example |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | – | `4000` (Render injects its own) |
| `DEFAULT_USER_ID` | ✅ | `demo-user-0000000000000000` (the seeded demo user) |
| `FRONTEND_URL` | ✅ | `http://localhost:3000` (CORS allow-list in prod) |
| `RESEND_API_KEY` | – | leave blank to disable email |
| `EMAIL_FROM` | – | `Calendly Clone <onboarding@resend.dev>` |

**`apps/web/.env.local`**

| Var | Required | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:4000` |

---

## API documentation

**Admin** (uses the stubbed `currentUser` — see _Key design decisions_)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/me` | – | current user |
| PATCH | `/api/me` | `{name?,username?,timezone?}` | updated user |
| GET | `/api/event-types` | – | `EventType[]` |
| POST | `/api/event-types` | event-type fields | `EventType` |
| GET/PATCH/DELETE | `/api/event-types/:id` | – / partial / – | `EventType` / 204 |
| GET | `/api/schedules` | – | `AvailabilitySchedule[]` |
| POST | `/api/schedules` | schedule + weeklyHours | `AvailabilitySchedule` |
| PATCH/DELETE | `/api/schedules/:id` | replace-all weeklyHours | `AvailabilitySchedule` / 204 |
| POST/DELETE | `/api/schedules/:id/date-overrides[/:overrideId]` | override | override / 204 |
| GET | `/api/bookings?filter=upcoming\|past` | – | `Booking[]` |
| DELETE | `/api/bookings/:id` | – | cancelled `Booking` |

**Public** (no auth)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/public/:username` | – | host + active events |
| GET | `/api/public/:username/:slug` | – | event details |
| GET | `/api/public/:username/:slug/slots?date&timezone` | – | `string[]` (UTC ISO) |
| GET | `/api/public/:username/:slug/month-availability?month&timezone` | – | `{ "YYYY-MM-DD": boolean }` |
| POST | `/api/public/:username/:slug/book` | `{startTime,inviteeName,inviteeEmail,inviteeTimezone,notes?,answers?}` | `Booking` |
| GET | `/api/public/bookings/:id` | – | `Booking` |
| POST | `/api/public/bookings/:id/cancel` | `{cancellationReason?}` | `Booking` |
| POST | `/api/public/bookings/:id/reschedule` | `{startTime}` | new `Booking` |

Errors use one envelope: `{ "error": { "code", "message", "fields?" } }`.

---

## Key design decisions

- **Layered OOP + SOLID.** Controllers → service classes → repository interfaces → Prisma, wired in a single composition root (`container.ts`). Inheritance (`BaseRepository`, `AppError`), polymorphism (notification channel strategy, error hierarchy), encapsulation (Prisma never leaks past a repository), and Dependency Inversion (services depend on interfaces) — see _Backend layering_ above.
- **Store UTC, convert at the edge.** Every booking instant is stored in UTC; availability times-of-day are `"HH:mm"` strings in the schedule's timezone. Conversion happens only when rendering or computing slots, using `date-fns-tz` — never raw `Date` math — so DST and the India +5:30 offset stay correct.
- **Slot generation** (`apps/api/src/utils/slots.ts`): map the invitee's date to the schedule's timezone day → resolve windows (date override beats weekly hours) → step in `durationMinutes` (back-to-back, not a 15-min grid) → convert each candidate to UTC independently (DST-safe) → drop slots overlapping a booking padded by buffers, and slots in the past. Covered by **13 unit tests** including DST spring-forward/fall-back, India offset, buffers, and boundary touching.
- **Serializable isolation over a unique constraint.** Booking conflicts are *interval overlaps* (buffers, varying durations), which a unique index on `(hostId, startTime)` can't express. We re-check overlap inside a `Serializable` transaction; a race triggers a Postgres serialization failure → mapped to HTTP 409.
- **Monorepo + shared Zod.** `packages/shared` is the single source of truth for validation; client and server never disagree on a contract.
- **Prisma.** Type-safe queries and a real migration history, a natural fit for Postgres.
- **No auth, by design.** A single `currentUser` middleware loads the seeded demo user. Swap its body for JWT/session validation and the rest of the admin code (which only reads `req.user.id`) is unchanged.
- **Neon serverless driver.** The app connects via `@prisma/adapter-neon` over WebSocket/443, which also sidesteps networks that block 5432.

---

## Security & production hardening

- **Validation everywhere** — every request body and query is parsed with Zod before it reaches a service; failures return a structured `VALIDATION_ERROR`. All DB access goes through Prisma (parameterized), so there's no SQL injection surface.
- **Helmet** sets secure HTTP headers; **CORS** is locked to `FRONTEND_URL` in production (any-origin only in dev).
- **Rate limiting** — public writes (book/reschedule) are capped at 10/min/IP; all public reads at 120/min/IP (the month-availability endpoint computes ~31 days of slots per call).
- **`trust proxy`** is enabled so rate limiting and `req.ip` see the real client IP behind Render's proxy.
- **Body size cap** (`64kb`) blunts memory-exhaustion via oversized JSON; string/array fields are length-bounded in the schemas.
- **No stack traces leak** — the central error handler returns generic 5xx messages in production and maps known Prisma errors (`P2002→409`, `P2025→404`, `P2003→409`).
- **Secrets** live only in env vars; `.env*` is gitignored (only `.env.example` is committed). The DB connection uses `sslmode=require`.
- **Bookings are soft-deleted** (status flips), never hard-deleted, so history is preserved and event types with bookings can't be orphaned.
- **Concurrency** — the double-booking race is closed by a Serializable transaction (see _Key design decisions_).
- **Dependencies** — `pnpm audit --prod` reports **no known vulnerabilities**. Production deps are kept on patched lines (Next.js 15, React 19, nodemailer 8), with a workspace override forcing a patched `postcss`.

> Note: admin routes are intentionally unauthenticated per the assignment ("assume a default user is logged in"). The `currentUser` middleware is the single seam to add real auth — see below.

## Assumptions

- Single host (no sign-up / multi-tenant) — auth is stubbed.
- No payments, no Google/Outlook calendar sync, no recurring events.
- One-on-one events only (no group/round-robin).
- Email is best-effort; a delivery failure never fails a booking.

## What I'd add with more time

- Real authentication (the `currentUser` seam is ready) and multi-user sign-up.
- Google Calendar two-way sync and conflict import.
- A proper concurrency load test for the booking race path.
- i18n and accessibility audit pass; e2e tests (Playwright) for the booking flow.

---

## Project structure

```
Calendly Clone/
├── apps/
│   ├── api/                      # Express + Prisma
│   │   └── src/
│   │       ├── repositories/     # BaseRepository + per-entity repos (interfaces + Prisma impls)
│   │       ├── services/         # cross-cutting (notification strategy)
│   │       ├── modules/          # users, eventTypes, availability, slots, bookings (controller + service + routes)
│   │       ├── middleware/       # currentUser (auth seam), validate, errorHandler
│   │       ├── utils/            # slots.ts (pure algorithm) + slots.test.ts, timezone.ts
│   │       ├── lib/              # prisma, neonAdapter, logger, errors
│   │       └── container.ts      # composition root (DI wiring)
│   └── web/                      # Next.js App Router (marketing + admin + public booking)
├── packages/
│   └── shared/                   # Zod schemas + shared types
├── render.yaml                   # API deploy blueprint
└── README.md
```

---

## Deployment

Three pieces: **Neon** (database) → **Render** (API) → **Vercel** (web). The repo must be pushed to a public GitHub repo first.

### 1. Database — Neon
Already provisioned. Copy the connection string (`postgresql://…@…neon.tech/neondb?sslmode=require`); you'll paste it into Render as `DATABASE_URL`.

### 2. Backend API — Render
1. **New → Blueprint**, select this repo. Render reads [`render.yaml`](render.yaml) and provisions a Node web service in the **virginia** region (matching Neon's `us-east-1`).
2. Set the `sync: false` secrets in the dashboard:
   - `DATABASE_URL` — the Neon string
   - `FRONTEND_URL` — your Vercel URL (set after step 3; e.g. `https://calendly-clone.vercel.app`)
   - `RESEND_API_KEY` — optional (leave blank to disable email)
3. Deploy. The build runs `pnpm install → build shared → build api`, and `preDeployCommand` runs `prisma migrate deploy` (Render can reach port 5432).
4. **Seed once** via the Render **Shell** tab: `pnpm --filter api seed`. (Don't automate this — the seed wipes and recreates data.)
5. Note the API URL, e.g. `https://calendly-clone-api.onrender.com`. Health check: `/health`.

> Render free tier sleeps after inactivity; the first request after idle takes ~50s to wake.

### 3. Frontend — Vercel
1. **Add New → Project**, import the repo.
2. **Root Directory:** `apps/web`. Framework auto-detects as Next.js.
3. **Build Command (override):** `pnpm --filter shared build && pnpm --filter web build`
4. **Environment Variable:** `NEXT_PUBLIC_API_URL` = your Render API URL.
5. Deploy → note the Vercel URL.

### 4. Wire CORS + verify
1. Back in Render, set `FRONTEND_URL` to the Vercel URL and **redeploy** the API (CORS is locked to it in production).
2. Open the Vercel URL → landing loads → `/event-types` (admin) → `/demo/30min` books end-to-end → meeting appears under **Upcoming**.

> **Note on the database & port 5432:** local dev on a network that blocks 5432 must apply migrations with `pnpm --filter api migrate:http` (Neon serverless driver over 443). Render has no such restriction, so the standard `prisma migrate deploy` works there.
