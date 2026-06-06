# Timeshare

Timeshare is a Vercel-ready group calendar app for friend groups. A group creates one shared `Timeline`, members mark free or busy ranges, and everyone can create shared events. Members can subscribe only to the events they care about and optionally expose those subscriptions through a private ICS feed.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- bcryptjs
- zod
- date-fns
- deterministic ICS generation

## Local Setup

Install dependencies:

```bash
npm install
```

Copy the environment example:

```bash
cp .env.example .env
```

Set:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXT_PUBLIC_APP_URL`: local or deployed app URL, such as `http://localhost:3000`.

Generate Prisma and run the first migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Start the dev server:

```bash
npm run dev
```

## Vercel Deployment

1. Create a PostgreSQL database and set `DATABASE_URL` in Vercel.
2. Set `NEXT_PUBLIC_APP_URL` to the deployed app URL or custom domain.
3. Deploy the connected Git repository.
4. Run Prisma migrations against the production database before using the app.

The build script runs `prisma generate` before `next build`.

## Product Concepts

- `Timeline`: one shared calendar instance for a group.
- `Timeline password`: shared password used to join a timeline.
- `Free/busy blocks`: large availability ranges marked by members.
- `Events`: shared timeline events visible to all members.
- `Subscriptions`: event creator is subscribed automatically; other members can subscribe or unsubscribe.
- `Personal feed`: optional ICS feed containing only subscribed events for that member and timeline.
- `Share links`: temporary event links that send unauthenticated users through the join flow before event details are shown.

## Notes

Disabling a personal feed clears its token, so the old feed URL stops working. Share links expire after seven days and do not expose event details directly.
