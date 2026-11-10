import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PW = 'Demo@12345';

function assertSuccess(error: { message: string } | null, operation: string) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

async function mk(email: string, name: string, role: string, phone: string, extra: any = {}) {
  let existingUser;
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 });
    assertSuccess(error, 'List auth users');
    existingUser = data.users.find(user => user.email?.toLowerCase() === email);
    if (existingUser || data.users.length < 100) break;
  }

  const { data, error } = existingUser
    ? await db.auth.admin.updateUserById(existingUser.id, { password: PW, email_confirm: true })
    : await db.auth.admin.createUser({ email, password: PW, email_confirm: true });
  assertSuccess(error, `Create or update auth user ${email}`);
  if (!data.user) throw new Error(`Auth user ${email} was not returned.`);
  const id = data.user.id;

  const { error: profileError } = await db.from('users').upsert(
    { id, name, role, phone, ...extra },
    { onConflict: 'id' }
  );
  assertSuccess(profileError, `Upsert profile ${email}`);
  return id;
}

(async () => {
  if (process.env.DEMO_MODE !== 'true') {
    throw new Error('Refusing to seed: set DEMO_MODE=true in .env.local first.');
  }
  if (process.env.SEED_DEMO_CONFIRM !== 'I_ACCEPT_DEMO_DATA_RESET') {
    throw new Error('Refusing to seed: set SEED_DEMO_CONFIRM=I_ACCEPT_DEMO_DATA_RESET to confirm replacing the demo dataset.');
  }

  console.log('Clearing previous demo data...');
  const { data: previous, error: previousError } = await db
    .from('complaints')
    .select('id')
    .eq('is_demo_seed', true);
  assertSuccess(previousError, 'Find previous demo complaints');
  const previousIds = (previous ?? []).map(complaint => complaint.id);

  if (previousIds.length) {
    for (const table of ['reminder_logs', 'escalation_logs', 'complaint_updates'] as const) {
      const { error } = await db.from(table).delete().in('complaint_id', previousIds);
      assertSuccess(error, `Delete old demo ${table}`);
    }
    const { error } = await db.from('complaints').delete().in('id', previousIds);
    assertSuccess(error, 'Delete old demo complaints');
  }
  const { error: configError } = await db.from('app_config').update({ demo_offset_hours: 0 }).eq('id', 1);
  assertSuccess(configError, 'Reset demo clock');

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
      is_demo_seed: true,
    }).select('id').single();
    if (error) throw new Error(`complaint ${i + 1}: ${error.message}`);

    const { error: updateError } = await db.from('complaint_updates').insert({
      complaint_id: c.id, status, remark: 'Complaint registered and assigned to officer',
    });
    assertSuccess(updateError, `Insert complaint ${i + 1} history`);

    if (['Overdue', 'Escalated'].includes(status)) {
      const { error: reminderError } = await db.from('reminder_logs').insert({
        complaint_id: c.id, officer_id: off, due_at: due, simulated_at: due, mode: 'mock', status: 'mock_sent',
      });
      assertSuccess(reminderError, `Insert complaint ${i + 1} reminder`);
    }
    if (status === 'Escalated') {
      const { error: escalationError } = await db.from('escalation_logs').insert({
        complaint_id: c.id, from_officer: off, to_senior: senior,
        reason: 'Unresolved 24h after overdue reminder', simulated_at: new Date().toISOString(),
      });
      assertSuccess(escalationError, `Insert complaint ${i + 1} escalation`);
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
