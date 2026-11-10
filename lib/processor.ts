import { admin, getConfig } from './clock';
import { sendSms } from './sms';

/** Idempotent: unique(complaint_id,kind,due_at) and unique(complaint_id) block duplicates. */
export async function processDeadlines() {
  const db = admin(); const { now, grace } = await getConfig();
  let overdue = 0, reminders = 0, escalated = 0;

  // ── Step 1: Mark overdue + send ONE reminder per deadline to assigned officer ──
  const { data: late } = await db.from('complaints')
    .select('*, officer:assigned_officer(id,name,phone)')
    .lte('due_at', now.toISOString())
    .not('status', 'in', '("Resolved","Escalated")');

  for (const c of late ?? []) {
    if (c.status !== 'Overdue') {
      await db.from('complaints').update({ status: 'Overdue' }).eq('id', c.id);
      overdue++;
    }
    const { data: exists } = await db.from('reminder_logs').select('id')
      .eq('complaint_id', c.id).eq('kind', 'deadline').eq('due_at', c.due_at).maybeSingle();
    if (exists) continue;

    const msg = `Reminder: Complaint ID #${c.tracking_id} has reached its deadline and is still pending. Please take necessary action. Smart Complaint Tracker.`;
    const r = await sendSms(c.officer?.phone ?? '', msg);
    const { error } = await db.from('reminder_logs').insert({
      complaint_id: c.id, officer_id: c.officer?.id, kind: 'deadline', due_at: c.due_at,
      simulated_at: now.toISOString(), mode: r.mode, status: r.status,
      provider_id: r.providerId, error: r.error,
    });
    if (!error) reminders++;
  }

  // ── Step 2: Escalate after grace period + notify senior officer ──
  const cutoff = new Date(now.getTime() - grace * 3600_000).toISOString();
  const { data: due } = await db.from('reminder_logs')
    .select('complaint_id, complaints!inner(id,tracking_id,status,assigned_officer,category)')
    .eq('kind', 'deadline').lte('simulated_at', cutoff).eq('complaints.status', 'Overdue');

  for (const row of due ?? []) {
    const c: any = row.complaints;
    // Look up officer's superior (two queries - avoids fragile self-join syntax)
    const { data: off } = await db.from('users').select('superior_id').eq('id', c.assigned_officer).single();
    const seniorId = off?.superior_id ?? null;
    const { data: seniorUser } = seniorId
      ? await db.from('users').select('id,name,phone').eq('id', seniorId).single()
      : { data: null };

    // Check if already escalated (idempotency - replaces unique constraint so reassigned complaints can re-escalate)
    const { data: alreadyEsc } = await db.from('complaints').select('status').eq('id', c.id).single();
    if (alreadyEsc?.status === 'Escalated') continue;

    const { error } = await db.from('escalation_logs').insert({
      complaint_id: c.id, from_officer: c.assigned_officer, to_senior: seniorId,
      reason: `Unresolved ${grace}h after overdue reminder`, simulated_at: now.toISOString(),
    });
    if (error) continue; // insert error - skip

    await db.from('complaints').update({ status: 'Escalated' }).eq('id', c.id);
    await db.from('complaint_updates').insert({
      complaint_id: c.id, status: 'Escalated', remark: 'Auto-escalated to senior officer',
    });

    // PS-2: notify the senior officer
    const senior: any = seniorUser;
    if (senior?.phone) {
      const escMsg = `Escalation Alert: Complaint ID #${c.tracking_id} (${c.category}) has been escalated to you as it remains unresolved. Please review immediately. Smart Complaint Tracker.`;
      const sr = await sendSms(senior.phone, escMsg);
      await db.from('reminder_logs').insert({
        complaint_id: c.id, officer_id: senior.id, kind: 'escalation',
        due_at: c.due_at ?? now.toISOString(), simulated_at: now.toISOString(),
        mode: sr.mode, status: sr.status, provider_id: sr.providerId, error: sr.error,
      }).then(() => {}); // best-effort, don't fail escalation if this insert fails
    }
    escalated++;
  }
  return { overdue, reminders, escalated, simulatedNow: now.toISOString() };
}
