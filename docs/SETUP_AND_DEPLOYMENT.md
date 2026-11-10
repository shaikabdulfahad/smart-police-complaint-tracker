# Setup and deployment

This guide is for local development and fictional-data demonstrations. The application is a prototype, not an official police service; do not use it to collect real complaints or sensitive personal information.

## Requirements

- Node.js compatible with the project
- npm
- A Supabase project dedicated to development or demo use

## Supabase setup

In the Supabase SQL Editor, run the files in this order:

1. [`../supabase/schema.sql`](../supabase/schema.sql) to create the base tables, functions, and row-level security policies.
2. [`../supabase/migration_ps2.sql`](../supabase/migration_ps2.sql) to add the department, attachment, and demo-data fields, configure the private `complaint-docs` bucket, and apply the corresponding policies.

Review the Storage policies for `complaint-docs`. Supabase combines permissive policies, so remove any older broad authenticated upload policy. The application issues short-lived signed links only after checking that the requester is authorized.

## Local environment

Install dependencies and create `.env.local` from `.env.example`:

```bash
npm ci
cp .env.example .env.local
```

Set the following values in `.env.local`:

| Variable | Guidance |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only secret; never expose it to browser code or commit it |
| `DEMO_MODE` | `true` for the fictional demo |
| `SMS_MODE` | `mock` to avoid sending real messages |
| `SLA_HOURS` | Deadline duration; default is `72` |
| `GRACE_HOURS` | Escalation grace period; default is `24` |
| `CRON_SECRET` | A strong, randomly generated secret; generate one with `openssl rand -hex 32` |

Optional Twilio variables (`SMS_ALLOWLIST`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM`) are not needed in mock mode. Never expose the service-role key or Twilio credentials with a `NEXT_PUBLIC_` prefix. Keep `.env.local` private and out of Git.

Replace the `CRON_SECRET=change-me` template value with a generated secret. Do not reuse the placeholder or commit the secret.

Vercel reserves the environment variable name `TZ`; do not add it in Vercel. No timezone variable is required for the application deployment.

## Seed fictional demo data (optional)

Use only a dedicated, disposable Supabase demo project. Before running the seeder, verify the project URL in `.env.local` and set both:

```dotenv
DEMO_MODE=true
SEED_DEMO_CONFIRM=I_ACCEPT_DEMO_DATA_RESET
```

Then run:

```bash
npm run seed
```

The script replaces complaints marked as demo data and their related logs, resets the shared demo clock, and creates or updates five demo staff accounts. It resets those accounts to the shared demo password defined in `scripts/seed.ts`. Never run it against real, production, or shared data; never use the seeded accounts for real users.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scheduled deadline processing

[`../vercel.json`](../vercel.json) schedules `GET /api/cron/process` daily at 03:00 UTC. Configure `CRON_SECRET` in Vercel; requests without the matching secret are rejected. Demo time controls invoke the processor directly and change the shared demo clock, so use them only with fictional demo data.

## Tests

```bash
npm test
npm run build
```

`npm run e2e` inserts a test complaint and advances the configured demo clock. Run it only against a disposable Supabase demo project.

## SMS

SMS is mocked by default. Keep `SMS_MODE=mock` for development and demonstrations. Real SMS requires Twilio credentials, an explicit recipient allowlist, and `DEMO_MODE=false`; do not enable real messaging without authorization, testing, and operational procedures.

## Vercel deployment

1. Import the GitHub repository into Vercel using the Next.js preset and repository root (`./`).
2. Add the runtime environment variables for the target environment. Use the correct Supabase project URL and keys, keep server-only secrets private, and set `SMS_MODE=mock` and `DEMO_MODE=true` for a fictional demo. Do not add `SEED_DEMO_CONFIRM` to Vercel.
3. Use a strong `CRON_SECRET`. Do not add `TZ`; Vercel reserves that name.
4. Deploy and confirm the deployment is ready. Redeploy after changing environment variables.
5. Test only with fictional data. Keep seeded demo accounts out of real deployments.

## Production readiness

This prototype has not been approved for operational use. Before any real-world deployment, obtain an authorized service owner and complete legal/privacy review, threat modeling and independent security testing, access-control review, retention and incident procedures, accessibility checks, backup restoration tests, monitoring, and a controlled pilot. Provide an official alternative channel and clear emergency guidance.
