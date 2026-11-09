# Smart Police Complaint Tracker

College prototype (fictional data, not an official police system). Next.js + Supabase + Twilio (mock by default), English/Kannada.

# Smart Police Complaint Tracker

College project prototype (fictional data, not an official police system). Citizens file complaints; officers get deadlines, automatic SMS reminders (mock by default) and automatic escalation to senior officers. English and Kannada supported.

**Stack:** Next.js (TypeScript), Tailwind, Supabase (Postgres, Auth, RLS), Twilio SMS, Recharts.

## Quick start
```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
# run supabase/schema.sql in the Supabase SQL editor
npm run seed
npm run dev
```

## Structure
- `app/` pages (home, submit, track, login, my, officer, senior) and API routes
- `lib/` deadline processor, demo clock, SMS gate, i18n, UI helpers
- `supabase/schema.sql` tables, indexes, RLS
- `scripts/` seed and end-to-end workflow test
- `tests/` unit tests
- `docs/SETUP_AND_DEPLOYMENT.md` full setup, SMS config, testing, deployment, demo script

## Demo
Log in as `admin@demo.test` (password `Demo@12345`) and open `/senior`: **+3 Days** makes complaints overdue and logs reminders, **+1 Day** escalates them.

License: MIT
