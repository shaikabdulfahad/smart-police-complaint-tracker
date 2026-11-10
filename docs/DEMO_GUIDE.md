# Fictional-data demo guide

This short walkthrough demonstrates the prototype using fictional records. Use a dedicated demo Supabase project. Do not enter real personal information, upload real evidence, or present the site as an official reporting channel.

## Before the demo

- Confirm the site is connected to the intended demo Supabase project.
- Keep `DEMO_MODE=true` and `SMS_MODE=mock`.
- If you need fresh demo accounts and records, follow the guarded seeding instructions in the [setup guide](./SETUP_AND_DEPLOYMENT.md). Seeding replaces marked demo complaints, resets the shared demo clock, and resets seeded account passwords.
- Use only the demo accounts created by the seed script. Their shared password is defined in `scripts/seed.ts`; never use these accounts in a real deployment.
- Avoid public screenshots or recordings that expose account credentials, environment variables, or private case details.

## Walkthrough

### 1. Citizen submission and tracking

1. Open `/submit` and enter clearly fictional test details.
2. Submit the complaint and note its tracking ID.
3. Open `/track`, enter the ID, and review the displayed status and action history.

### 2. Officer workflow

1. Sign in with a seeded officer account.
2. Review the assigned-complaint list and dashboard counts.
3. Open a complaint to inspect its details and history.
4. If demonstrating an update, use only a seeded fictional complaint and explain that this action changes the shared demo database.

### 3. Senior dashboard

1. Sign out, then sign in with the seeded senior account.
2. Review the overview metrics, complaint categories, and escalation/reminder tabs.
3. Explain that reassignment and status updates write to the demo database; do not make changes unless you intend to alter the demo data.

### 4. Demo-time controls (admin only)

1. Sign in with the seeded demo admin account and open `/senior`.
2. Use **Advance Demo Time +3 Days** and **Advance Demo Time +1 Day** only in the isolated demo project.
3. Review the resulting reminders and escalations.

These controls advance the shared demo clock and can update complaint states and logs. They are not presentation-only animations.

### 5. Language support

Use the language control in the navigation to switch between English and Kannada.

## After the demo

- Sign out of the staff account.
- Do not leave a shared browser signed in.
- Keep demo data separate from any real or operational system.
- If the demo database is shared, tell collaborators before reseeding or advancing its clock.

## What this demo illustrates

- Complaint submission and tracking
- Staff role-based views
- Department assignment
- Status history
- Reminder and escalation concepts
- English and Kannada interface

These are prototype workflows, not a guarantee of official handling, response time, or emergency response.
