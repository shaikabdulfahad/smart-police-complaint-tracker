# Smart Police Complaint Tracker

College project prototype (fictional data, not an official police system). Citizens file complaints; officers get deadlines, automatic SMS reminders (mock by default) and automatic escalation to senior officers. English and Kannada supported.

**PS-2 alignment:** Follow-up and Reminder System for Grievance Tracking — Police Department pilot.

**Stack:** Next.js (TypeScript), Tailwind CSS v4, Supabase (Postgres, Auth, RLS), Twilio SMS, Recharts.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys (see Setup below)
npm run seed                  # creates 20 fictional complaints + demo accounts
npm run dev                   # http://localhost:3000
```

---

## Setup (do these in order)

### 1. Supabase project
1. Create a free project at supabase.com.
2. **SQL Editor → New query:** paste the full contents of `supabase/schema.sql` and click **Run**.
3. If you already ran an older schema.sql: also run `supabase/migration_ps2.sql` to add the `department` and `attachments` columns.
4. **Authentication → Sign In / Providers → Email:** turn off **Confirm email**. Citizen sign-up fails without this.

### 2. Storage bucket (for document uploads)
1. In Supabase go to **Storage → New bucket**.
2. Name: `complaint-docs`, Public: **off**.
3. Click **Policies → New policy → For authenticated users → INSERT** and save.
4. Without this bucket, complaint submission still works — attachments are silently skipped.

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=       # Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Project Settings → API → anon key
SUPABASE_SERVICE_ROLE_KEY=      # Project Settings → API → service_role key (server only, never expose)
DEMO_MODE=true
SLA_HOURS=72
GRACE_HOURS=24
SMS_MODE=mock
CRON_SECRET=any-random-string
```

### 4. Seed
```bash
npm run seed
```
Creates 20 fictional complaints across all statuses, plus five demo accounts.
Re-runnable — deletes previous demo data first.

---

## Demo logins (password: `Demo@12345`)

| Email | Role | Notes |
|---|---|---|
| officer1@demo.test | Officer | Cybercrime Cell |
| officer2@demo.test | Officer | Traffic Division |
| officer3@demo.test | Officer | General Crimes |
| senior@demo.test | Senior Officer | Views all complaints |
| admin@demo.test | Admin + Demo Admin | Has +3 Days / +1 Day buttons on /senior |

---

## 5-minute demo flow (PS-2)

1. Submit a complaint at `/submit` → get SPT tracking ID → track at `/track`
2. Login as `officer1@demo.test` → view assigned complaints → update status
3. Login as `admin@demo.test` → go to `/senior`
4. Click **Advance Demo Time +3 Days** → complaints go overdue, reminders logged
5. Click **Advance Demo Time +1 Day** → complaints escalate, senior gets notified
6. Click **⚠ Escalated** tab → reassign a complaint
7. Click **ಕನ್ನಡ** in the navbar → full Kannada UI

---

## Folder structure

| Path | Purpose |
|---|---|
| `app/` | Pages: home, submit, track, login, my, officer, senior + API routes |
| `lib/` | Deadline processor, demo clock, SMS gate, i18n (80 keys), UI helpers |
| `supabase/schema.sql` | Tables, indexes, RLS policies (run this first) |
| `supabase/migration_ps2.sql` | Adds department + attachments if schema already applied |
| `scripts/seed.ts` | 20 fictional complaints + 5 demo accounts |
| `scripts/e2e.ts` | End-to-end workflow test against live Supabase |
| `tests/unit.test.ts` | Unit tests: i18n parity, SMS safety gates |
| `docs/PS2_PRESENTATION.md` | 5-minute demo script + judge Q&A |
| `vercel.json` | Daily cron for deadline processor (Hobby plan limit) |

---

## Tests

```bash
npm test       # unit tests (i18n parity, SMS safety)
npm run e2e    # integration test against Supabase (needs DEMO_MODE=true)
```

---

## SMS (optional for demo)

Default is mock mode — no real messages sent, everything logged.
To send one real test SMS:
1. Create a Twilio trial account, verify a phone number.
2. Set `SMS_MODE=real`, `DEMO_MODE=false`, fill in Twilio credentials, add the number to `SMS_ALLOWLIST`.
3. Status `sent` is recorded only when Twilio returns a message SID.

---

## Deployment (Vercel + Supabase)

1. Push to GitHub. Import into Vercel (Next.js preset).
2. Add all variables from `.env.example` in Vercel. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never prefix with `NEXT_PUBLIC_`.
3. Keep `DEMO_MODE=true` and `SMS_MODE=mock` for the presentation.
4. `vercel.json` schedules the deadline processor daily at 3 AM IST (Vercel Hobby allows one cron per day). For more frequent processing, upgrade to Vercel Pro and change the schedule to `0 * * * *`.
5. The demo +3/+1 Day buttons trigger the processor directly — the cron is not needed for the demo.

---

**License:** MIT · Not an official government system · All data is fictional
