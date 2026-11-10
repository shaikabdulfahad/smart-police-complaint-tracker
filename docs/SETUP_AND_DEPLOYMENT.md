# Setup and deployment

This is a fictional-data college prototype, not an official police system.

## Local setup

1. Install locked dependencies with `npm ci`.
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
3. Run `supabase/migration_ps2.sql`. It creates or configures the private `complaint-docs` Storage bucket with a 5 MB PDF/JPG/PNG limit and restricts uploads to a signed-in citizen's own complaint. Remove any older broad authenticated upload policy on this bucket; Supabase combines permissive policies.
4. Copy `.env.example` to `.env.local` and add the Supabase URL, anon key, service-role key, and a strong `CRON_SECRET`. Keep service-role and Twilio secrets server-only.
5. Set `DEMO_MODE=true` and `SMS_MODE=mock` for the demo. In Supabase Auth, disable email confirmation for demo accounts.
6. To seed the fictional dataset, set `SEED_DEMO_CONFIRM=I_ACCEPT_DEMO_DATA_RESET` in `.env.local`, then run `npm run seed`. The script only replaces its marked fictional complaints and updates its five demo accounts; it does not clear unrelated complaint or user data.
7. Run `npm run dev`.

## Scheduled deadline processing

`vercel.json` calls `GET /api/cron/process` daily at `03:00 UTC` (08:30 IST). Configure `CRON_SECRET` in Vercel; Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>`. The endpoint rejects requests without the matching secret.

The demo time-advance buttons invoke deadline processing directly, so the scheduled job is not required for the presentation.

## Tests

- `npm test` runs unit tests.
- `npm run build` checks the production build and types.
- `npm run e2e` runs the Supabase-backed deadline workflow. Use a disposable demo project: it inserts a test complaint and advances the configured demo clock while the test runs.

## SMS

SMS is mocked by default. Keep `SMS_MODE=mock` for the presentation. Real SMS requires `SMS_MODE=real`, `DEMO_MODE=false`, Twilio credentials, and explicitly allowlisted recipient numbers in `SMS_ALLOWLIST`.
