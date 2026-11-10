import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PW = 'Demo@12345';

async function mk(email: string, name: string, role: string, phone: string, extra: any = {}) {
  const { data, error } = await db.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  const { error: e2 } = await db.from('users').insert({ id: data.user.id, name, role, phone, ...extra });
  if (e2) throw new Error(`insert user ${email}: ${e2.message}`);
  return data.user.id;
}

(async () => {
  console.log('Clearing previous demo data...');
  // delete complaints first (FK)
  await db.from('reminder_logs').delete().not('id', 'is', null);
  await db.from('escalation_logs').delete().not('id', 'is', null);
  await db.from('complaint_updates').delete().not('id', 'is', null);
  await db.from('complaints').delete().not('id', 'is', null);
  await db.from('users').delete().not('id', 'is', null);
  await db.from('app_config').update({ demo_offset_hours: 0 }).eq('id', 1);

  const { data: ul } = await db.auth.admin.listUsers({ perPage: 200 });
  for (const u of ul?.users ?? []) {
    if (u.email?.endsWith('@demo.test')) {
      const { error } = await db.auth.admin.deleteUser(u.id);
      if (error) throw error;
    }
  }

  console.log('Creating demo users...');
  const senior = await mk('senior@demo.test', 'Insp. Ravi Kumar (fictional)', 'senior', '9000000010');
  await mk('admin@demo.test', 'Demo Admin', 'admin', '9000000011', { is_demo_admin: true, superior_id: senior });

  const offs = [
    await mk('officer1@demo.test', 'SI Anita Rao (fictional)',    'officer', '9000000001', { superior_id: senior, department: 'Cybercrime Cell' }),
    await mk('officer2@demo.test', 'SI Mahesh Gowda (fictional)', 'officer', '9000000002', { superior_id: senior, department: 'Traffic Division' }),
    await mk('officer3@demo.test', 'SI Latha Shetty (fictional)', 'officer', '9000000003', { superior_id: senior, department: 'General Crimes' }),
  ];

  const cats = ['Cybercrime', 'Financial Fraud', 'Lost Property', 'Traffic Complaints'];
  const locs = ['Indiranagar, Bengaluru', 'Jayanagar, Bengaluru', 'Whitefield, Bengaluru', 'Malleshwaram, Bengaluru', 'Koramangala, Bengaluru'];
  const descs = [
    'Unknown caller demanded OTP and transferred ₹45,000 from account.',
    'Received a fake job offer email asking for processing fees.',
    'Laptop bag with documents lost near bus stop.',
    'Vehicle signal jumping causing accident risk at intersection.',
    'Online fraud through fake shopping website – order not delivered.',
    'UPI transaction fraud – money debited without authorization.',
    'Wallet containing ID cards and ₹2,000 cash lost.',
    'Truck parked illegally blocking emergency vehicle access.',
    'Phishing link received on WhatsApp – bank credentials stolen.',
    'Ponzi scheme – invested ₹1 lakh, now uncontactable.',
    'Mobile phone lost at market.',
    'Wrong-side driving causing near-miss accident.',
    'SIM card swap fraud – mobile banking access lost.',
    'Fake lottery SMS scam – ₹5,000 paid as processing fee.',
    'Bicycle stolen from housing society premises.',
    'Drunk driving reported near school zone.',
    'Social media account hacked – blackmail messages sent.',
    'Bogus investment app scam – ₹80,000 lost.',
    'Passport and cash stolen from car.',
    'Traffic signal not working – causing chaos at junction.',
  ];
  const deptOff: Record<string, number> = {
    'Cybercrime': 0, 'Financial Fraud': 0, 'Lost Property': 2, 'Traffic Complaints': 1,
  };

  // [status, due offset hours from now]
  const plan: [string, number][] = [
    ['Submitted', 70], ['Assigned', 60], ['Assigned', 20], ['In Progress', 48], ['In Progress', 10],
    ['In Progress', 30], ['Assigned', 40], ['Resolved', 24], ['Resolved', -10], ['Resolved', 5],
    ['Resolved', 30], ['Overdue', -6], ['Overdue', -20], ['Overdue', -2], ['Overdue', -12],
    ['Escalated', -80], ['Escalated', -100], ['Escalated', -75], ['Submitted', 66], ['In Progress', 36],
  ];

  console.log('Seeding 20 complaints...');
  for (let i = 0; i < plan.length; i++) {
    const [status, h] = plan[i];
    const cat = cats[i % 4];
    const off = offs[deptOff[cat]];
    const due = new Date(Date.now() + h * 3600_000).toISOString();
    const submitted = new Date(Date.now() - 72 * 3600_000 + h * 3600_000).toISOString();

    const { data: c, error } = await db.from('complaints').insert({
      citizen_name: `Citizen ${i + 1} (fictional)`,
      citizen_phone: `90000${String(20000 + i).padStart(5, '0')}`,
      category: cat, location: locs[i % 5], description: descs[i],
      assigned_officer: off, status, submitted_at: submitted, due_at: due,
      resolved_at: status === 'Resolved' ? new Date().toISOString() : null,
    }).select('id').single();
    if (error) throw new Error(`complaint ${i + 1}: ${error.message}`);

    await db.from('complaint_updates').insert({ complaint_id: c.id, status, remark: 'Complaint registered and assigned to officer' });

    if (['Overdue', 'Escalated'].includes(status)) {
      await db.from('reminder_logs').insert({
        complaint_id: c.id, officer_id: off, due_at: due, simulated_at: due, mode: 'mock', status: 'mock_sent',
      });
    }
    if (status === 'Escalated') {
      await db.from('escalation_logs').insert({
        complaint_id: c.id, from_officer: off, to_senior: senior,
        reason: 'Unresolved 24h after overdue reminder', simulated_at: new Date().toISOString(),
      });
    }
    console.log(`  ${i + 1}/20 ${c.id.slice(0,8)} [${status}]`);
  }

  console.log('\n✅ Seeded successfully.');
  console.log('   Login password for all demo accounts: Demo@12345');
  console.log('   officer1@demo.test → Cybercrime Cell');
  console.log('   officer2@demo.test → Traffic Division');
  console.log('   officer3@demo.test → General Crimes');
  console.log('   senior@demo.test   → Senior Officer');
  console.log('   admin@demo.test    → Demo Admin (can use +3/+1 day buttons)');
})().catch(e => { console.error('SEED FAILED:', e.message); process.exit(1); });
