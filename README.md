# Velora

A visual kanban board for creative workflows. Built with Next.js 16, Prisma, and NextAuth.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | NextAuth v5 (credentials + JWT) |
| Database | PostgreSQL via Prisma 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Email | Resend (REST API) |
| Validation | Zod v4 |
| Toasts | Sonner |

## Features

- Kanban boards with drag-and-drop (same-column reorder, cross-column moves)
- Task priorities (Low / Medium / High), due dates with overdue indicator
- Many-to-many labels per board with color swatches
- Board background presets
- Password reset and email verification flows
- Keyboard shortcut: `N` to open the add-task form in the first column

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

Fill in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/velora"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
RESEND_API_KEY="re_xxxx"   # optional — emails skip silently if unset
APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npm run db:push      # push schema to DB
npm run db:seed      # optional seed data
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## Project structure

```
src/
  app/
    api/            # Route handlers (boards, columns, tasks, labels, auth)
    board/[id]/     # Board page + client component
    boards/         # Boards list
    login/          # Auth pages
    signup/
    forgot-password/
    reset-password/
    verify-email/
  components/
    board/          # BoardSettings, Column, TaskCard, AddTaskForm
    layout/         # GlassLayout
    ui/             # GlassPanel
  lib/
    date-utils.ts   # formatDueDate, isOverdue, toDateInputValue
    email.ts        # Resend helpers
    prisma.ts       # Prisma client singleton
    types.ts        # Shared TypeScript types
  auth.ts           # NextAuth config
  proxy.ts          # Route protection
prisma/
  schema.prisma
  seed.ts
tests/              # Vitest unit tests
e2e/                # Playwright E2E tests
```

## Email

Email sending uses the [Resend](https://resend.com) REST API directly. If `RESEND_API_KEY` is not set, emails are skipped silently — the token is still written to the database, so you can test the reset/verify flows by grabbing the token from Prisma Studio.

## Deployment

The app is stateless — deploy to any platform that supports Node.js (Vercel, Railway, Fly.io). Set the three env vars (`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`) and run `prisma db push` against your production database on first deploy.
