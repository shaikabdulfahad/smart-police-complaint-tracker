# Smart Police Complaint Tracker (prototype, fictional; not an official system)
## Included
supabase/schema.sql, lib/{clock,sms,processor,i18n}.ts, API routes for cron + demo time, .env.example
## Setup
1. `npx create-next-app@latest . --ts --tailwind --app`; `npm i @supabase/supabase-js recharts lucide-react`
2. Copy these files in; run schema.sql in the Supabase SQL editor; copy .env.example to .env.local.
3. Cron: Vercel cron or any scheduler calls `GET /api/cron/process` with `Authorization: Bearer $CRON_SECRET`.
## Demo flow
+3 days → overdue + reminder logged (mock SMS). +1 day → escalated to senior. Real timestamps are never changed; only app_config.demo_offset_hours.
## SMS safety
Real SMS requires SMS_MODE=real, DEMO_MODE=false, Twilio creds, and the number in SMS_ALLOWLIST. "sent" is recorded only when Twilio returns a message SID.
## Still to build
Pages (home, submit, track, officer, senior, login), seed script (20 fictional complaints), auth wiring, assignment on submit, tests.

## Run (updated)
`npm i && npm run seed && npm run dev`. Demo logins (password `Demo@12345`): officer1@demo.test, senior@demo.test, admin@demo.test (the demo admin sees the Advance Demo Time buttons on /senior).
Seed is re-runnable (it removes old @demo.test users first).
## Test checklist
Submit at /submit → get SPT ID → /track. Login officer1 → update status. Login admin → +3 days (overdue + mock reminder logged) → +1 day (escalated). Press +3 twice: no duplicate reminders. Toggle ಕನ್ನಡ in navbar.

## Tests
`npm test` runs unit tests (language key parity, SMS safety gates). `npm run e2e` runs the deadline, reminder, duplicate-prevention and escalation workflow against your Supabase project (DEMO_MODE=true) and cleans up after itself.

## SMS configuration (real messages, optional)
Keep `SMS_MODE=mock` for the demo. For one approved real test: create a Twilio account, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM; set `SMS_MODE=real`, `DEMO_MODE=false`; put only numbers whose owners consented in SMS_ALLOWLIST (on a Twilio trial the number must also be verified). Status "sent" is stored only when Twilio returns a message SID.

## Deployment (Vercel + Supabase)
1. Supabase: create a project, run supabase/schema.sql in the SQL editor. Auth > Providers > Email: turn off "Confirm email" for the demo.
2. Push this folder to GitHub, import into Vercel (Next.js preset).
3. Add all variables from .env.example in Vercel (service role key and Twilio secrets are server-only; never prefix them NEXT_PUBLIC_). Keep DEMO_MODE=true and SMS_MODE=mock for the presentation.
4. Run the seed once locally (`npm run seed`) against the same Supabase project.
5. vercel.json schedules the processor hourly (Hobby plans allow once a day; change the cron to `0 3 * * *`). Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
6. Presentation script: login admin@demo.test → /senior → "+3 Days" → "+1 Day" → show escalated panel → toggle ಕನ್ನಡ.
