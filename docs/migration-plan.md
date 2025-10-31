# BloodDonationTS Migration Plan

## Phase 1 · Foundation
- [x] Scaffold Next.js 14 (App Router, Tailwind, TypeScript)
- [x] Install core dependencies (NextAuth, Prisma, React Query, Socket.io, UI libs)
- [x] Configure `.env` / Prisma schema to mirror legacy models
- [x] Generate Prisma client, seed scripts, and utility helpers *(client + helpers in progress)*
- [x] Establish global providers (React Query, Session, Toasts)
- [x] Create base UI primitives (buttons, cards, layouts)

## Phase 2 · Authentication & Authorization
- [ ] Implement registration & login flows (server actions + NextAuth)
- [ ] Admin credential flow + middleware guard
- [ ] Password reset & email verification pipelines

## Phase 3 · User Experience
- [ ] Profile management (bio, medical info, address lookup)
- [ ] Blood request creation, status tracking, upvote/comment interactions
- [ ] Donor applications & approvals
- [ ] Friend graph, requests, chat (real-time socket)
- [ ] Notifications system (user + admin)
- [ ] Search & news feed experiences

## Phase 4 · Admin Console
- [ ] Admin dashboards for users, donors, requests, reports
- [ ] Moderation workflows (approve/decline, notifications)
- [ ] Analytics widgets & export options

## Phase 5 · Polish & Ops
- [ ] File storage adapters for profile pics, attachments, medical docs
- [ ] Automated tests (unit, integration, e2e smoke)
- [ ] Lint, format, CI readiness
- [ ] README & onboarding docs
