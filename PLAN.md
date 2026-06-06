# Shared Calendar Implementation Plan

## Source of truth
This file tracks implementation status per `AGENTS.md`.

## Current incomplete step
Step 1: Build the initial Vercel-ready Next.js scaffold for Option B: global user identity plus timeline memberships.

## Target architecture
- Next.js App Router application deployed on Vercel.
- PostgreSQL database accessed through Prisma.
- Global users identified by email.
- Timelines protected by a shared password hash.
- Users join timelines as members after providing the shared password.
- Each membership receives deterministic free and busy colors.
- Availability blocks store large free/busy date ranges.
- Timeline events are visible to every member.
- Event subscriptions connect users to events and expose ICS calendar data.
- Temporary event share links redirect through login and then show the event.

## Planned scaffold
- Project config: `package.json`, `tsconfig.json`, `next.config.mjs`, `.eslintrc.json`, `.gitignore`, `.env.example`.
- Styling: `app/globals.css`.
- Pages: home, login/join, create timeline, timeline dashboard, event share redirect.
- Server actions: authentication, timeline creation/join, availability creation, event creation, subscription creation.
- Database: Prisma schema for User, Timeline, TimelineMember, AvailabilityBlock, Event, EventSubscription, EventShareLink.
- Calendar export: ICS route for event subscribers and Google Calendar link helpers.
- Utilities: Prisma client, password hashing, session cookies, color assignment, date helpers.

## Completed items
- Read `AGENTS.md`.
- Confirmed `PLAN.md` exists and was empty.
- Created initial `package.json`.
- Created initial `tsconfig.json`.

## Changed files
- `package.json`
- `tsconfig.json`
- `PLAN.md`

## Tests run
- Not run yet. Repository is being scaffolded through GitHub file writes.

## Remaining issues
- Requires `DATABASE_URL` in Vercel.
- Requires running `npx prisma migrate dev` locally or applying equivalent migration before production use.
- Email sending is not implemented in the initial scaffold; event subscription exports ICS/Google Calendar links.
