# Smart Police Complaint Tracker

A web application prototype for registering, tracking, and managing public-service complaints. Citizens can submit a complaint and follow its status; staff can review assigned cases, record updates, and escalate unresolved complaints.

> **Prototype notice:** This project is an educational prototype, not an official police service or emergency-reporting channel. It uses fictional demo data. Do not submit real complaints, personal information, or evidence.

## What it includes

- Complaint submission with a tracking ID and configurable service deadline.
- Public tracking with status and action history.
- Role-based citizen, officer, senior-officer, and admin experiences.
- Department assignment, overdue reminders, and escalation workflows.
- Private document storage with authorization-checked, short-lived links.
- English and Kannada interface.
- Demo-time controls and mock SMS for presentations.

## Technology

- Next.js and TypeScript
- Supabase Auth, Postgres, Row Level Security, and Storage
- Tailwind CSS
- Recharts
- Twilio integration (optional; mock mode is the default)

## Run locally

### Prerequisites

- Node.js compatible with the project
- npm
- A Supabase project for development or demo use

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure Supabase

In the Supabase SQL Editor, run these scripts in order:

1. [`supabase/schema.sql`](./supabase/schema.sql)
2. [`supabase/migration_ps2.sql`](./supabase/migration_ps2.sql)

The migration creates/configures the private `complaint-docs` bucket and its upload policy. Review and remove any older broad Storage upload policies; Supabase combines permissive policies.

### 3. Configure local environment

Copy `.env.example` to `.env.local` and set the Supabase URL and keys from **Project Settings → API**.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase secret; never expose or prefix with `NEXT_PUBLIC_` |
| `DEMO_MODE` | Set to `true` for the fictional demo |
| `SMS_MODE` | Keep `mock` for the demo |
| `SLA_HOURS` | Complaint response deadline in hours (default: `72`) |
| `GRACE_HOURS` | Escalation grace period in hours (default: `24`) |
| `CRON_SECRET` | Long, random secret for the scheduled processing endpoint; generate one with `openssl rand -hex 32` |
| `SEED_DEMO_CONFIRM` | Set only when intentionally reseeding demo data |
| `SMS_ALLOWLIST`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Optional Twilio configuration; leave unset for mock SMS |

Replace the `CRON_SECRET=change-me` template value with a generated secret. Keep `.env.local` out of Git. The `TZ` setting can be used locally as needed, but Vercel reserves that variable name; do not add it in Vercel.

### 4. Optional: seed fictional demo data

Only use a dedicated, disposable demo Supabase project. The seed script:

- Requires `DEMO_MODE=true` and `SEED_DEMO_CONFIRM=I_ACCEPT_DEMO_DATA_RESET`.
- Replaces complaints marked as demo data and their related logs.
- Resets the shared demo clock.
- Creates or updates five demo staff accounts and resets their passwords to the shared demo password defined in [`scripts/seed.ts`](./scripts/seed.ts).

**Do not run this against a project containing real or valuable data. Do not use the seeded accounts in a real deployment.**

After confirming the target project and setting both safeguards in `.env.local`, run:

```bash
npm run seed
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm test
npm run build
```

`npm run e2e` writes a test complaint and advances the configured demo clock. Run it only against a disposable Supabase demo project, never a production or shared dataset.

## Deployment

The project can be deployed to Vercel with the Next.js preset and repository root as the project root. Add the runtime environment variables in Vercel; use separate, strong secrets and keep service-role/Twilio credentials server-side. Do not add `SEED_DEMO_CONFIRM` to Vercel. Redeploy after changing environment variables.

[`vercel.json`](./vercel.json) schedules `/api/cron/process` daily at 03:00 UTC. Configure `CRON_SECRET` in the hosting environment. Demo time controls invoke processing directly and should only be used with fictional demo data.

## Before any real-world use

This prototype has not been approved or assessed for handling real complaints or sensitive personal information. A real deployment would require an authorized operating partner, legal/privacy review, security assessment, incident and support procedures, retention rules, accessibility testing, reliable backups, and a controlled pilot. It is not a substitute for emergency services or official reporting channels.

## Repository map

| Path | Purpose |
|---|---|
| `app/` | Pages and server API routes |
| `lib/` | Deadline processing, demo clock, SMS, and localization helpers |
| `supabase/schema.sql` | Base database schema and policies |
| `supabase/migration_ps2.sql` | Department, attachment, demo-marker, and policy migration |
| `scripts/seed.ts` | Guarded fictional demo data seeder |
| `scripts/e2e.ts` | Supabase-backed workflow test |
| `tests/unit.test.ts` | Unit tests |
| `docs/SETUP_AND_DEPLOYMENT.md` | Detailed local setup and deployment notes |
| `docs/DEMO_GUIDE.md` | Walkthrough for a fictional-data demo |

## License

MIT. See [`LICENSE`](./LICENSE).
