# PS-2 Demo Script – 5 Minutes

## What to say first (30 seconds)
"Our system directly addresses PS-2: Follow-up and Reminder System for Grievance Tracking.
Every complaint gets a unique ID, a 72-hour SLA deadline, automatic SMS reminders to the responsible
officer, and auto-escalation to the senior officer if unresolved. All in Kannada and English."

---

## Step 1 – Citizen submits a complaint (1 minute)
1. Open `/submit`
2. Fill in name, mobile number, select **Cybercrime**, add location, add description, attach a PDF
3. Click **Submit Complaint**
4. Show the generated `SPT` tracking ID
5. Click the Track link → show the **Action History** timeline and **Department** assignment

**Say:** "The complaint is immediately assigned to the Cybercrime Cell officer with a 72-hour deadline."

---

## Step 2 – Officer views their dashboard (45 seconds)
1. Login as `officer1@demo.test` / `Demo@12345`
2. Show the stat cards (Total, Pending, Resolved, Overdue)
3. Click Open on any complaint → show description, attachments, action history
4. Update status to **In Progress**, add a remark, Save

**Say:** "Officers see their pending complaints, deadlines and citizen documents in one place."

---

## Step 3 – Fast-forward demo (1.5 minutes) ← most impressive part
1. Login as `admin@demo.test` / `Demo@12345`, go to `/senior`
2. Show the Overview tab: bar chart (complaints per officer), pie chart (by category), SLA breach rate
3. Click **Advance Demo Time +3 Days**
4. Read out the notification: "X complaints now overdue. Y reminders logged."
5. Click the **Reminders** tab → show the reminder log (mock SMS, timestamp)
6. Click **Advance Demo Time +1 Day**
7. Read out: "Z complaints escalated."
8. Click **⚠ Escalated** tab → show the escalated complaints with Reassign dropdown
9. Click **Escalation Log** tab → show reason, from officer, to senior, timestamp

**Say:** "No human had to do anything. The system identified overdue complaints, notified the officer,
waited the grace period, then automatically moved them to my dashboard."

---

## Step 4 – Language toggle (20 seconds)
1. Click **ಕನ್ನಡ** in the navbar
2. Show the entire UI switch: headings, status badges, form labels, buttons
3. Switch back to English

**Say:** "Complete Kannada support – not just headings, but every label, error message, status and button."

---

## Step 5 – Citizen tracking (30 seconds)
1. Open `/track` with any `SPT` ID
2. Show the progress bar, department name, action history timeline, overdue warning banner

**Say:** "Citizens can track their complaint without logging in. They see every status change and
which department is handling it."

---

## Evaluation criteria mapping

| PS-2 Criterion | Where to show it |
|---|---|
| Complaint registration + unique ID | /submit → SPT ID |
| Kannada + English | navbar toggle |
| Department assignment | /track → Assigned to + Department |
| Status tracking + action history | /track timeline |
| Automatic reminders | Senior → Reminders tab after +3 days |
| Overdue monitoring | Senior → stat cards, red rows |
| Escalation | Senior → Escalated tab after +1 day |
| Communication history | Senior → Escalation Log tab |
| Working demo end-to-end | full 5-minute flow above |

---

## Backup answers for judge questions

**"Does it send real SMS?"**
"Yes, via Twilio. For this demo we use mock mode so we don't need to approve every number.
To enable real SMS: set SMS_MODE=real in .env.local, add the recipient's number to SMS_ALLOWLIST,
and configure the Twilio credentials. The system records 'sent' only when Twilio confirms with a message ID."

**"What if the same deadline is processed twice?"**
"The reminder_logs table has a unique constraint on (complaint_id, kind, due_at). The processor
checks for an existing record before inserting. Running it 100 times produces exactly one reminder per complaint."

**"How does it scale?"**
"Supabase's free tier handles 50,000 database rows and 500 MB storage. The deadline processor runs
as a scheduled API route — on Vercel it runs hourly. For a real police station handling thousands
of complaints, we'd move to Supabase Pro and a more frequent schedule."

**"What about data privacy?"**
"Citizens' phone numbers and complaint descriptions are never returned to anonymous callers.
The /track API uses the service role but returns only the tracking ID, category, status, officer name
and action history. Row Level Security on the database enforces this at the database level."
