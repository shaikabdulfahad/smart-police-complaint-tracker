import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PW = 'Demo@12345'; // fictional demo accounts only
async function mk(email: string, name: string, role: string, phone: string, extra: any = {}) {
  const { data, error } = await db.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw error;
  await db.from('users').insert({ id: data.user.id, name, role, phone, ...extra }); return data.user.id;
}
(async () => {
  await db.from('complaints').delete().not('id', 'is', null); // must run before deleting officers (FK)
  await db.from('app_config').update({ demo_offset_hours: 0 }).eq('id', 1);
  const { data: ul } = await db.auth.admin.listUsers({ perPage: 200 });
  for (const u of ul?.users ?? []) if (u.email?.endsWith('@demo.test')) { const { error } = await db.auth.admin.deleteUser(u.id); if (error) throw error; }
  const senior = await mk('senior@demo.test', 'Insp. Ravi Kumar (fictional)', 'senior', '9000000010');
  await mk('admin@demo.test', 'Demo Admin', 'admin', '9000000011', { is_demo_admin: true });
  const offs = [await mk('officer1@demo.test', 'SI Anita Rao (fictional)', 'officer', '9000000001', { superior_id: senior }),
    await mk('officer2@demo.test', 'SI Mahesh Gowda (fictional)', 'officer', '9000000002', { superior_id: senior }),
    await mk('officer3@demo.test', 'SI Latha Shetty (fictional)', 'officer', '9000000003', { superior_id: senior })];
  const cats = ['Cybercrime', 'Financial Fraud', 'Lost Property', 'Traffic Complaints'];
  const locs = ['Indiranagar', 'Jayanagar', 'Whitefield', 'Malleshwaram', 'Koramangala'];
  // [status, due offset hours from now]
  const plan: [string, number][] = [['Submitted', 70], ['Assigned', 60], ['Assigned', 20], ['In Progress', 48], ['In Progress', 10], ['In Progress', 30], ['Assigned', 40],
    ['Resolved', 24], ['Resolved', -10], ['Resolved', 5], ['Resolved', 30],
    ['Overdue', -6], ['Overdue', -20], ['Overdue', -2], ['Overdue', -12],
    ['Escalated', -80], ['Escalated', -100], ['Escalated', -75], ['Submitted', 66], ['In Progress', 36]];
  for (let i = 0; i < plan.length; i++) {
    const [status, h] = plan[i]; const due = new Date(Date.now() + h * 3600_000).toISOString(); const off = offs[i % 3];
    const { data: c, error } = await db.from('complaints').insert({ citizen_name: `Citizen ${i + 1} (fictional)`, citizen_phone: `90000${String(20000 + i)}`, category: cats[i % 4], location: locs[i % 5],
      description: `Sample fictional complaint #${i + 1} for demonstration.`, assigned_officer: off, status, submitted_at: new Date(Date.now() - 72 * 3600_000 + h * 3600_000).toISOString(), due_at: due,
      resolved_at: status === 'Resolved' ? new Date().toISOString() : null }).select('id').single();
    if (error) throw error;
    await db.from('complaint_updates').insert({ complaint_id: c.id, status, remark: 'Seeded demo data' });
    if (['Overdue', 'Escalated'].includes(status)) await db.from('reminder_logs').insert({ complaint_id: c.id, officer_id: off, due_at: due, simulated_at: due, mode: 'mock', status: 'mock_sent' });
    if (status === 'Escalated') await db.from('escalation_logs').insert({ complaint_id: c.id, from_officer: off, to_senior: senior, reason: 'Unresolved 24h after overdue reminder', simulated_at: new Date().toISOString() });
  }
  console.log('Seeded. Login password for all demo accounts:', PW);
})();
