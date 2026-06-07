# Timeshare Build Specification

## Source of truth
This file is the required source of truth for all agents. Before editing code, read this file, identify the current incomplete step, inspect the existing repository, avoid repeating completed work, then update this file after implementation.

## Product definition
Timeshare is a Vercel-deployed web app for group calendars. A `Timeline` is one shared calendar instance for a friend group or similar group. Users have global accounts identified by email and can belong to multiple timelines. A user creates a timeline with a shared timeline password. Other users join that timeline by entering their email, display name, timeline id or slug, and the shared password.

Inside a timeline, each member can mark large free or busy ranges. Every member has two timeline-specific colors: a green shade for free ranges and a red shade for busy ranges. Timeline events are visible to all members. The event creator is subscribed by default. Other members can subscribe by opening the event. Users may optionally enable a personal timeline ICS feed. When enabled, that feed contains only timeline events the user subscribed to. When disabled, the old feed URL must stop working.

Events also support temporary share links. A share link should not expose event details directly. It should send unauthenticated users to the join page with a redirect back to the event after successful login/join.

## Stack
- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- bcryptjs for timeline password hashing
- zod for validation
- date-fns for display formatting
- ics package or deterministic manual ICS generation
- Vercel deployment

## Required files
Create or update these files unless an equivalent structure is documented here afterward:

- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `.eslintrc.json`
- `.gitignore`
- `.env.example`
- `README.md`
- `prisma/schema.prisma`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/create/page.tsx`
- `app/join/page.tsx`
- `app/t/[timelineId]/page.tsx`
- `app/t/[timelineId]/event/[eventId]/page.tsx`
- `app/share/[token]/page.tsx`
- `app/api/feed/[token]/route.ts`
- `app/api/event/[eventId]/ics/route.ts`
- `app/actions/auth.ts`
- `app/actions/timelines.ts`
- `app/actions/availability.ts`
- `app/actions/events.ts`
- `app/actions/settings.ts`
- `components/AppHeader.tsx`
- `components/CalendarGrid.tsx`
- `components/EventCard.tsx`
- `components/TimelineForms.tsx`
- `components/AvailabilityForm.tsx`
- `components/EventForm.tsx`
- `components/FeedSettings.tsx`
- `lib/prisma.ts`
- `lib/auth.ts`
- `lib/colors.ts`
- `lib/dates.ts`
- `lib/ics.ts`
- `lib/links.ts`
- `lib/validators.ts`

## Prisma schema
Implement these enums and models.

### Enums
`TimelineRole`: OWNER, MEMBER.
`AvailabilityStatus`: FREE, BUSY.

### User
Fields: id String cuid primary key; email String unique lowercase; name optional String; createdAt default now; updatedAt updatedAt. Relations: memberships, createdTimelines, createdEvents, eventSubscriptions.

### Timeline
Fields: id String cuid primary key; name String; slug String unique; passwordHash String; createdById String; createdAt default now; updatedAt updatedAt. Relations: createdBy User; members; availabilityBlocks; events.

### TimelineMember
Fields: id String cuid primary key; timelineId String; userId String; role TimelineRole default MEMBER; displayName String; freeColor String; busyColor String; timelineFeedEnabled Boolean default false; timelineFeedToken optional String unique; createdAt default now; updatedAt updatedAt. Constraints: unique timelineId plus userId. Relations: timeline, user, availabilityBlocks.

### AvailabilityBlock
Fields: id String cuid primary key; timelineId String; memberId String; status AvailabilityStatus; startAt DateTime; endAt DateTime; note optional String; createdAt default now; updatedAt updatedAt. Server validation must require endAt after startAt. Overlap is allowed in the first scaffold.

### Event
Fields: id String cuid primary key; timelineId String; createdById String; title String; description optional String; location optional String; startAt DateTime; endAt DateTime; createdAt default now; updatedAt updatedAt. Server validation must require endAt after startAt. Creator must be auto-subscribed in the same mutation.

### EventSubscription
Fields: id String cuid primary key; eventId String; userId String; createdAt default now. Constraint: unique eventId plus userId.

### EventShareLink
Fields: id String cuid primary key; eventId String; token String unique; expiresAt DateTime; createdById String; createdAt default now. Default expiration is 7 days.

## Auth and session behavior
Initial auth is app-managed. User identity is email-only. On create or join, normalize email by trimming and lowercasing. Create the user if missing. Store a session cookie with the current user id. Cookie should be httpOnly, sameSite lax, path `/`, secure in production, and expire after 30 days.

Implement `lib/auth.ts` helpers:
- `getCurrentUser()` returns user or null.
- `requireCurrentUser()` returns user or redirects to `/join`.
- `setUserSession(userId)` writes the session cookie.
- `clearUserSession()` removes it.
- `requireTimelineMember(timelineId)` verifies the current user is a member.
- `requireTimelineOwner(timelineId)` verifies OWNER role.

## Authorization rules
Only timeline members can view timeline pages, create availability blocks, create timeline events, subscribe to timeline events, or generate event share links. Only event creators can edit/delete events in the initial scaffold. Share links do not grant direct event access; they only preserve the intended redirect.

## Routes
`/`: Home page explaining timelines, free/busy ranges, shared events, and links to create or join.

`/create`: Form with email, optional display name, timeline name, shared password. Server action creates user, timeline, owner membership, colors, session, then redirects to `/t/[timelineId]`.

`/join`: Form with email, optional display name, timeline id or slug, shared password, optional safe redirect. Server action verifies shared password, creates membership if needed, sets session, redirects to requested safe path or timeline dashboard.

`/t/[timelineId]`: Protected timeline dashboard. Show timeline name, member legend, availability form, event form, calendar/list view, and feed settings.

`/t/[timelineId]/event/[eventId]`: Protected event detail. Show event details, subscription status, subscribe/unsubscribe action, share-link action, event ICS download, Google Calendar link, and back link.

`/share/[token]`: Share redirect. Invalid token shows invalid message. Expired token shows expired message. If logged-in member, redirect to event detail. Otherwise redirect to `/join` with timeline prefilled and redirect preserved.

`/api/event/[eventId]/ics`: Return one-event ICS file.

`/api/feed/[token]`: Return ICS feed for the TimelineMember whose feed token matches and whose feed is enabled. Include only EventSubscriptions for that user where event.timelineId matches the member timeline.

## Server actions
`auth.ts`: `logoutAction()`.

`timelines.ts`: `createTimelineAction(formData)`, `joinTimelineAction(formData)`. Use zod validation, bcrypt password hashing/checking, color assignment, session cookie, and redirects.

`availability.ts`: `createAvailabilityAction(timelineId, formData)`, optional `deleteAvailabilityAction(blockId)`. Require membership, validate fields, revalidate timeline path.

`events.ts`: `createEventAction(timelineId, formData)`, `subscribeToEventAction(eventId)`, `unsubscribeFromEventAction(eventId)`, `createEventShareLinkAction(eventId)`. Require membership. Event creation must auto-subscribe creator.

`settings.ts`: `setTimelineFeedEnabledAction(timelineId, enabled)`. Require membership. Enabling creates a random URL-safe feed token if absent. Disabling clears the token and sets enabled false.

## Validation
Implement in `lib/validators.ts`: email, create timeline, join timeline, availability, event schemas. Enforce: valid email; password min 6; timeline name 1-80; event title 1-120; description max 2000; location max 200; note max 160; start and end parse as valid dates; end after start.

## Color assignment
Implement `colorsForMemberIndex(index)` in `lib/colors.ts`. Use at least 12 green hex colors and 12 red hex colors. Pick by `index % palette.length`, where index is the count of existing timeline members before creating the new one.

## ICS and calendar links
Implement `lib/ics.ts` to generate ICS for one or many events. Stable UID format: event id plus app domain suffix. Include title, description, location, start, end, created timestamp. Use UTC. Implement `lib/links.ts` to create Google Calendar add links with UTC date ranges.

## UI requirements
Use clean responsive CSS. The initial calendar can be a grouped list/grid rather than drag-select. It must support large ranges through start/end inputs. `CalendarGrid` groups availability and events by date, shows member names, status, colors, event links, and empty states. `FeedSettings` explains that the personal feed contains subscribed events only.

## Environment
`.env.example` must include `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`. The app URL is used for absolute share/feed links.

## README
Document purpose, stack, setup, env vars, Prisma migration, Vercel deployment, timeline concept, free/busy blocks, events, subscriptions, optional feed, and share links.

## Implementation order
1. Verify repository state and read this file.
2. Add base config files.
3. Add Prisma schema.
4. Add libraries.
5. Add layout, CSS, header, home page.
6. Add create/join pages and actions.
7. Add dashboard, forms, availability, events.
8. Add event detail, subscriptions, share links.
9. Add ICS routes and feed settings.
10. Add README.
11. Update this file with completed items, changed files, tests run, and remaining issues.

## Acceptance criteria
- `npm install` succeeds.
- Prisma schema validates.
- Build succeeds after env vars and Prisma generation are configured.
- User can create a timeline.
- User can join a timeline.
- Members can view dashboard.
- Members can create free/busy blocks.
- Blocks render with member colors.
- Members can create events.
- Event creator is auto-subscribed.
- Members can subscribe/unsubscribe.
- Event detail has ICS and Google Calendar links.
- Members can create temporary share links.
- Share links route through login/join when needed.
- Optional feed can be enabled.
- Feed contains only subscribed events for that member and timeline.
- Disabling feed invalidates the old URL.

## Out of scope for initial scaffold
Email sending, OAuth login, Google Calendar API writes, Apple Calendar API writes, drag-select interactions, recurring events, reminders, timeline deletion, password reset, email verification, conflict detection, automatic scheduling suggestions.

## Current incomplete step
Step 11: Validate dependency install, Prisma generation/schema validation, and Next.js build in an environment with Node.js and npm available.

## Completed items
- Read `AGENTS.md`.
- Confirmed `PLAN.md` existed and was initially empty.
- Created initial `package.json`.
- Created initial `tsconfig.json`.
- Expanded `PLAN.md` into this build specification.
- Renamed project-facing wording to Timeshare.
- Verified repository state before implementation.
- Added base Next.js, ESLint, gitignore, env, and TypeScript config files.
- Added Prisma schema with users, timelines, memberships, availability blocks, events, subscriptions, and share links.
- Added Prisma client helper, auth/session helpers, validators, member colors, date formatting, ICS generation, and calendar links.
- Added server actions for auth, timeline create/join, availability, events/subscriptions/share links, and feed settings.
- Added App Router pages for home, create, join, timeline dashboard, event detail, and share redirects.
- Added API routes for one-event ICS downloads and personal ICS feeds.
- Added responsive global CSS and reusable app components.
- Expanded README with setup, environment, migration, deployment, and product concept docs.
- Made Prisma script commands use the explicit `prisma/schema.prisma` path for Vercel compatibility.
- Fixed event share-link server action to return `void` so it can be used directly as a Next.js form action.
- Added the initial Prisma migration and updated the build script to run `prisma migrate deploy` before generating Prisma and building Next.js.
- Simplified the public home page to a plain Timeshare intro and redirected logged-in users to their latest timeline.
- Replaced the form-first timeline dashboard with a calendar-first workspace: month grid, selected-day hourly view, drag/click range selection, and range-based free/busy or event creation.
- Changed selected-day behavior so the hourly editor opens as an overlay only after clicking a day, closes on outside clicks, and switches directly when another day is clicked.

## Changed files so far
- `.env.example`
- `.eslintrc.json`
- `.gitignore`
- `README.md`
- `PLAN.md`
- `app/actions/auth.ts`
- `app/actions/availability.ts`
- `app/actions/events.ts`
- `app/actions/settings.ts`
- `app/actions/timelines.ts`
- `app/api/event/[eventId]/ics/route.ts`
- `app/api/feed/[token]/route.ts`
- `app/create/page.tsx`
- `app/globals.css`
- `app/join/page.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/share/[token]/page.tsx`
- `app/t/[timelineId]/event/[eventId]/page.tsx`
- `app/t/[timelineId]/page.tsx`
- `components/AppHeader.tsx`
- `components/AvailabilityForm.tsx`
- `components/CalendarGrid.tsx`
- `components/EventCard.tsx`
- `components/EventForm.tsx`
- `components/FeedSettings.tsx`
- `components/TimelineCalendar.tsx`
- `components/TimelineForms.tsx`
- `lib/auth.ts`
- `lib/colors.ts`
- `lib/dates.ts`
- `lib/ics.ts`
- `lib/links.ts`
- `lib/prisma.ts`
- `lib/validators.ts`
- `next-env.d.ts`
- `next.config.mjs`
- `package.json`
- `prisma/migrations/20260606223000_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/schema.prisma`
- `tsconfig.json`

## Tests run
- `git diff --check` passed.
- `npm install` could not run because `npm` is not installed in the current shell.
- `which node` and `which npm` confirmed Node.js/npm are not available in the current shell.
- Vercel build log indicated the deployed build used an older package state (`shared-calendar@0.1.0`) and did not include `prisma/schema.prisma`.
- Vercel type check reported `createEventShareLinkAction` returned `{ url: string }`; updated it to return `void`.
- Vercel runtime log reported `public.Timeline` did not exist; added an initial migration so production can create the database tables.
- `git diff --check` passed after the calendar UI changes.
- `which npm` still reports `npm not found` in this shell, so local lint/build could not be run here.
- `git diff --check` passed after changing selected-day mechanics to an overlay.

## Remaining issues
- Install Node.js/npm or use an environment where they are available.
- Run `npm install`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run lint`, and `npm run build` locally when Node.js/npm are available.
- Configure `DATABASE_URL` and `NEXT_PUBLIC_APP_URL` locally and in Vercel before production use.
