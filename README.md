# Velora

**A collaborative kanban board for creative teams** — boards you share with
teammates, tasks with assignees, labels, due dates and threaded comments, and a
board that updates itself while someone else is moving cards around.

Built from scratch with Next.js 16, Prisma and Auth.js: no Trello API, no
managed auth provider, no UI kit.

[![CI](https://github.com/JoshBlazer/velora/actions/workflows/ci.yml/badge.svg)](https://github.com/JoshBlazer/velora/actions/workflows/ci.yml)
[![E2E](https://github.com/JoshBlazer/velora/actions/workflows/e2e.yml/badge.svg)](https://github.com/JoshBlazer/velora/actions/workflows/e2e.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![The board view: four columns of tasks with priority chips, labels, due dates and assignee avatars](docs/screenshots/board.jpg)

<table>
<tr>
<td width="50%">

![The task detail panel, showing priority, due date, assignee, labels and a comment thread](docs/screenshots/task-detail.jpg)

**Task detail** — priority, due date, assignee, labels and comments, without leaving the board.

</td>
<td width="50%">

![The analytics panel, showing totals, overdue count, completion rate and breakdowns by priority and column](docs/screenshots/analytics.jpg)

**Analytics** — totals, overdue, completion rate, and breakdowns by priority and column.

</td>
</tr>
</table>

## Quality

| | |
|---|---|
| Tests | **34 unit** (Vitest) + **18 end-to-end** (Playwright) |
| CI | Type check, lint and unit tests on every push; full E2E against a production build and a real Postgres |
| Dependencies | **0** `npm audit` advisories |
| Lint | **0** errors, **0** warnings — CI fails on errors |
| Accessibility | Form controls are properly labelled; the E2E suite drives the app the way a screen reader reads it, via `getByLabel` |

Authentication, authorisation and rate limiting are covered by tests rather
than assumed — see [Security](#security).

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth v5 (credentials + JWT) |
| Database | PostgreSQL via Prisma 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Email | Resend (REST API) |
| Rate limiting | Upstash Redis, with an in-memory fallback |
| Validation | Zod v4 |
| Toasts | Sonner |

## Features

**Boards and tasks**

- Kanban boards with drag-and-drop (same-column reorder, cross-column moves)
- Task priorities (Low / Medium / High), due dates with overdue indicator
- Task detail panel: description, assignee, due date, labels, comments
- Many-to-many labels per board with colour swatches
- Bulk actions: multi-select tasks to move, reprioritise or delete
- Search and filter by text, priority, label or overdue state
- Board background presets

**Collaboration**

- Share a board by email invite; invitees join as Editor or Viewer
- Owners manage and remove members
- Activity log of board changes
- Live updates: open boards poll for activity over SSE and refresh themselves

**Insight**

- Analytics panel: totals, overdue count, completion rate, tasks by priority and column, 7-day activity

**Account**

- Signup with email verification, login, password reset
- Settings: display name, avatar URL, password change, account deletion
- Due-date reminder emails, sent by a daily cron job

**Interface**

- Light and dark themes
- Installable as a PWA
- Keyboard shortcuts: `N` new task, `?` shortcut help, `Esc` close

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/JoshBlazer/velora.git
cd velora
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

`.env.example` documents every variable, what it does and what breaks without
it. The minimum for local development:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/velora"
AUTH_SECRET="generate-with: npx auth secret"
APP_URL="http://localhost:3000"
```

Locally you can leave `RESEND_API_KEY` unset — email is skipped with a console
warning and verification tokens are still written to the database, so you can
complete the flows by copying a token out of Prisma Studio. See
[Email](#email). **In production it is required**; see [Deployment](#deployment).

### 3. Set up the database

```bash
npm run db:push      # push schema to DB
npm run db:seed      # optional seed data
```

> **On migrations.** This project uses `prisma db push`, not the migrate
> workflow. `prisma/migrations/` still contains an old `init` migration that
> predates the `Comment` model and task assignees, so `prisma migrate deploy`
> would build a database missing those and the app would fail on any board
> load. Treat that directory as stale: use `db push`, and if you want a
> migrate-based workflow, regenerate a baseline from the current schema first.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (CI fails on errors) |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:verify-existing` | Mark pre-existing accounts as email-verified |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |

## Project structure

```
src/
  app/
    api/            # Route handlers
      auth/         #   signup, forgot/reset password, NextAuth
      boards/       #   boards, members, activity, analytics, SSE stream
      columns/      #   columns
      tasks/        #   tasks, move, bulk, comments, labels
      labels/       #   board labels
      invites/      #   accept a board invite
      user/         #   profile, password, delete account
      cron/         #   due-date reminders (requires CRON_SECRET)
    board/[id]/     # Board page + client component
    boards/         # Boards list, new board
    invite/[token]/ # Invite landing page
    settings/       # Account settings
    login/ signup/ forgot-password/ reset-password/ verify-email/
    manifest.ts     # PWA manifest
  components/
    board/          # Column, TaskCard, TaskDetailPanel, AddTaskForm,
                    # BoardSettings, ActivityPanel, AnalyticsPanel,
                    # BulkActionsBar, SearchFilterBar, KeyboardShortcuts
    layout/         # GlassLayout
    ui/             # GlassPanel, RemoteAvatar
  contexts/
    ThemeContext.tsx  # Light/dark theme
  hooks/
    useBoardSync.ts   # SSE subscription for live board updates
  lib/
    activity.ts     # Activity log writes
    board-access.ts # Board authorisation (getBoardAccess, canRead, canWrite)
    cn.ts           # Class name helper
    date-utils.ts   # formatDueDate, isOverdue, toDateInputValue
    email.ts        # Resend helpers, with HTML escaping
    env-check.ts    # Startup configuration validation
    prisma.ts       # Prisma client singleton
    rate-limit.ts   # Redis-backed rate limiting, in-memory fallback
    types.ts        # Shared TypeScript types
  auth.ts           # NextAuth config
  proxy.ts          # Route protection
  instrumentation.ts# Runs env validation at server start
prisma/
  schema.prisma
  seed.ts
  verify-existing.ts  # Backfill script for email verification
tests/              # Vitest unit tests
e2e/                # Playwright E2E tests
```

## Email

Email sending uses the [Resend](https://resend.com) REST API directly.

If `RESEND_API_KEY` is not set, sending is skipped with a console warning. The
token is still written to the database, so you can test the reset and verify
flows by copying it out of Prisma Studio.

That is fine locally, but note the consequence: **login requires a verified
email address**, so without a working mail provider nobody who signs up can get
in. Either set the key, or set `REQUIRE_EMAIL_VERIFICATION=false`.

User-supplied values — display names, board titles, task text — are escaped
before they are interpolated into an email body. Keep it that way: these
templates are HTML, they go out from our own domain, and for invites the sender
also chooses the recipient.

## Security

- Login is rate limited per IP and per account. Only failed attempts count, and
  a success clears the counter.
- Rate limit state lives in Redis when `UPSTASH_REDIS_REST_*` is configured.
  Without it the limiter falls back to an in-memory counter that is per-instance
  and resets on cold start, so limits will not hold on serverless.
- Board authorisation goes through `lib/board-access.ts`. Requests for a board
  the caller cannot read return 404 rather than 403, so existence is not
  confirmed.
- Signup, password reset, forgot-password and invite sending are all rate
  limited.

## Deployment

Deploy to any platform that supports Node.js (Vercel, Railway, Fly.io).

Note that the app is only stateless when Redis is configured — otherwise rate
limiting keeps per-instance state, which is why it does not hold up on
serverless.

### Required environment variables

| Variable | Why |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `AUTH_SECRET` | Signs session tokens |
| `APP_URL` | Public origin, used for links in email |
| `AUTH_URL` or `AUTH_TRUST_HOST` | Auth.js only infers a trusted host in development. Without one of these every `/api/auth` request fails with `UntrustedHost` |
| `RESEND_API_KEY` | Verification email. Login requires a verified address, so without this no new account can sign in |

The server refuses to start in production if any of these are missing, naming
the variable and its consequence.

### Strongly recommended

| Variable | Why |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limit state. Without it, login limits do not hold across instances |
| `CRON_SECRET` | Protects `/api/cron/reminders`, scheduled daily in `vercel.json`. The route rejects every request when unset, so reminders silently never send |

### First deploy

1. `npx prisma db push` against the production database (see the note on
   migrations above).
2. If the database already has accounts created before email verification was
   enforced, run `npm run db:verify-existing`. They have no verification
   timestamp and would otherwise be unable to log in.

### Optional tuning

`REQUIRE_EMAIL_VERIFICATION`, `STREAM_POLL_MS` and `STREAM_MAX_LIFETIME_MS` are
documented in `.env.example`. `SKIP_ENV_VALIDATION` exists for the E2E job,
which serves a production build with no mail provider; setting it on a real
deployment just restores the silent failures the startup check exists to catch.

## License

[MIT](LICENSE) — do what you like with it.
