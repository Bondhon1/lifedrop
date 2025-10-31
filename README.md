![BloodDonationTS hero](./public/hero-preview.png "Modern donor coordination platform")

# BloodDonationTS · Next.js 14 + Prisma rewrite

A ground-up TypeScript rebuild of the BloodDonationTS platform using **Next.js 14 App Router**, **Tailwind CSS**, **Prisma**, and **NextAuth**. Every legacy feature from the Flask app (blood requests, donor network, chat, notifications, admin console) is being modernized with real-time UX, reusable UI primitives, and a scalable database schema.

> ✅ Status: Foundation & authentication layer in progress. Follow the [migration plan](./docs/migration-plan.md) for phase-by-phase progress.

## Stack

- **Frontend**: Next.js 14 (App Router), React 19, Tailwind CSS 4, React Query, Radix UI primitives
- **Backend**: Route Handlers + Server Actions, NextAuth (credentials), Prisma ORM (PostgreSQL / Neon)
- **Real-time**: Socket.io for chat and live notifications
- **Utilities**: Zod validation, React Hook Form, bcrypt password hashing, Lucide icon set

## Getting started

```bash
cp .env.example .env              # populate with project secrets
npm install                       # install dependencies
npm run db:push                   # apply schema (see scripts below)
npm run dev                       # start the development server
```

Then visit `http://localhost:3000`.

### Required environment variables

| Name | Description |
| --- | --- |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | Neon Stack project id for auth |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Public Stack client key |
| `STACK_SECRET_SERVER_KEY` | Server-side Stack key |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ char string for JWT encryption |
| `NEXTAUTH_URL` | App base URL (default `http://localhost:3000`) |
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (e.g. `587` for TLS) |
| `SMTP_SECURE` | Set `true` for SMTPS/465, `false` for STARTTLS |
| `SMTP_USER` | SMTP username (app email account) |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Friendly from address shown in emails |

See `.env.example` for current values.

## NPM scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (ignores legacy `copy/` directory) |
| `npm run db:push` | Prisma `db push` (see below) |
| `npm run db:studio` | Prisma Studio |

> Add the convenience scripts by pasting the following to `package.json` if not already present:

```json
"scripts": {
	"db:push": "prisma db push",
	"db:studio": "prisma studio"
}
```

## Project structure snapshot

```
src/
	app/
		(auth)/          → register/login/forgot password flows
		(app)/           → authenticated experience (dashboard, requests, chat, admin)
		page.tsx         → marketing landing page
		providers.tsx    → Session + React Query + Toasts
	components/
		layout/          → App shell, navigation, layout primitives
		ui/              → Tailwind-first button, card, input, badge, etc.
	lib/               → Prisma client, auth options, hashing, validators
	server/actions/    → Server actions (auth, requests, notifications ...)
docs/
	migration-plan.md  → Phase checklist mirroring user requirements
prisma/
	schema.prisma      → Legacy schema translated to Prisma

copy/                → Snapshot of original Flask project (reference only)
```

## Development checklist (live)

See [`docs/migration-plan.md`](./docs/migration-plan.md) for the rolling status of each phase:

- ✅ Foundation: project scaffold, dependencies, Prisma schema, global providers, UI primitives
- 🚧 Authentication: NextAuth credentials, server actions for registration/reset, admin guard
- 🔜 User features: profile management, blood request CRUD, donor workflows, chat, notifications
- 🔜 Admin console & analytics

## Conventions

- **App Router** with colocated server components/actions; prefer server-side data fetching
- **Tailwind-first** components using `class-variance-authority` + `tailwind-merge`
- **Prisma + Zod** sharing schema contracts to avoid drift
- **React Query** for client caches and optimistic updates (mutations live under `src/hooks` soon)
- **Socket.io** connection in a dedicated client provider for chat/notifications (coming next phase)

## Migration notes

- The entire Flask codebase is preserved under `copy/` for cross-checking business logic.
- Database tables map 1:1 to Prisma models (see `schema.prisma`). Additional enums were added for `UserRole`.
- File uploads (profile pics, medical docs, chat attachments) will be abstracted behind a storage service adapter; local disk will back development until an object store is chosen.
- Chat + notifications will leverage a Next.js Route Handler with a shared Socket.io server instance.

## Testing & quality

- ESLint + TypeScript strict mode keep the codebase clean.
- Upcoming phases will introduce Vitest for units, Playwright for smoke flows, and `prisma-test-utils` for isolated DB fixtures.

## Deployment

- Works out-of-the-box on Vercel (Edge runtime disabled for Prisma route handlers).
- Ensure Neon connection pooling (pgBouncer) is enabled or use Prisma Accelerate in production.
- Configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and Neon credentials per environment.

---

Questions or feature requests? Open an issue or ping the maintainers. Let’s continue elevating the donor experience together. ❤️
