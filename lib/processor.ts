import { admin, getConfig } from './clock';
import { sendSms } from './sms';

/** Idempotent: unique(complaint_id,kind,due_at) and unique(complaint_id) block duplicates. */
export async function processDeadlines() {
  const db = admin(); const { now, grace } = await getConfig();
  let overdue = 0, reminders = 0, escalated = 0;

  const { data: late } = await db.from('complaints').select('*, officer:assigned_officer(id,name,phone)')
    .lte('due_at', now.toISOString()).not('status', 'in', '("Resolved","Escalated")');
  for (const c of late ?? []) {
    if (c.status !== 'Overdue') { await db.from('complaints').update({ status: 'Overdue' }).eq('id', c.id); overdue++; }
    const { data: exists } = await db.from('reminder_logs').select('id').eq('complaint_id', c.id).eq('kind', 'deadline').eq('due_at', c.due_at).maybeSingle();
    if (exists) continue;
    const msg = `Reminder: Complaint ID #${c.tracking_id} has reached its deadline and is still pending. Please take necessary action. Smart Complaint Tracker.`;
    const r = await sendSms(c.officer?.phone ?? '', msg);
    const { error } = await db.from('reminder_logs').insert({
      complaint_id: c.id, officer_id: c.officer?.id, kind: 'deadline', due_at: c.due_at,
      simulated_at: now.toISOString(), mode: r.mode, status: r.status, provider_id: r.providerId, error: r.error });
    if (!error) reminders++;
  }

  const cutoff = new Date(now.getTime() - grace * 3600_000).toISOString();
  const { data: due } = await db.from('reminder_logs').select('complaint_id, complaints!inner(id,status,assigned_officer)')
    .eq('kind', 'deadline').lte('simulated_at', cutoff).eq('complaints.status', 'Overdue');
  for (const row of due ?? []) {
    const c: any = row.complaints;
    const { data: off } = await db.from('users').select('superior_id').eq('id', c.assigned_officer).single();
    const { error } = await db.from('escalation_logs').insert({
      complaint_id: c.id, from_officer: c.assigned_officer, to_senior: off?.superior_id,
      reason: `Unresolved ${grace}h after overdue reminder`, simulated_at: now.toISOString() });
    if (error) continue;
    await db.from('complaints').update({ status: 'Escalated' }).eq('id', c.id);
    await db.from('complaint_updates').insert({ complaint_id: c.id, status: 'Escalated', remark: 'Auto-escalated to senior officer' });
    escalated++;
  }
  return { overdue, reminders, escalated, simulatedNow: now.toISOString() };
}
