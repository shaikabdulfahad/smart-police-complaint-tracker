// Integration test: needs DEMO_MODE=true and a seeded DB. Run: npm run e2e
import assert from 'node:assert/strict';
import { admin } from '../lib/clock';
import { processDeadlines } from '../lib/processor';
(async () => {
  const db = admin(); assert.equal(process.env.DEMO_MODE, 'true', 'DEMO_MODE must be true');
  const { data: cfg } = await db.from('app_config').select('demo_offset_hours').eq('id', 1).single(); const base = cfg!.demo_offset_hours;
  const { data: off } = await db.from('users').select('id').eq('role', 'officer').limit(1).single();
  const { data: c } = await db.from('complaints').insert({ citizen_name: 'E2E (fictional)', citizen_phone: '9000099999', category: 'Cybercrime', location: 'Test', description: 'e2e',
    assigned_officer: off!.id, status: 'Assigned', due_at: new Date(Date.now() + 72 * 3600_000).toISOString() }).select('id,tracking_id').single();
  assert.match(c!.tracking_id, /^SPT(?:\d+|[A-F0-9]{16})$/); console.log('1 unique ID', c!.tracking_id);
  const status = async () => (await db.from('complaints').select('status').eq('id', c!.id).single()).data!.status;
  const nRem = async () => (await db.from('reminder_logs').select('id', { count: 'exact', head: true }).eq('complaint_id', c!.id)).count;
  try {
    await db.from('app_config').update({ demo_offset_hours: base + 72 }).eq('id', 1); await processDeadlines();
    assert.equal(await status(), 'Overdue'); assert.equal(await nRem(), 1); console.log('2 overdue + reminder created');
    await processDeadlines(); assert.equal(await nRem(), 1); console.log('3 duplicate reminder prevented');
    await processDeadlines(); assert.equal(await status(), 'Overdue'); console.log('4 no early escalation');
    await db.from('app_config').update({ demo_offset_hours: base + 96 }).eq('id', 1); await processDeadlines();
    assert.equal(await status(), 'Escalated');
    const { count } = await db.from('escalation_logs').select('id', { count: 'exact', head: true }).eq('complaint_id', c!.id); assert.equal(count, 1);
    await processDeadlines(); assert.equal((await db.from('escalation_logs').select('id', { count: 'exact', head: true }).eq('complaint_id', c!.id)).count, 1);
    console.log('5 escalated once after grace period. ALL PASSED');
  } finally { await db.from('complaints').delete().eq('id', c!.id); await db.from('app_config').update({ demo_offset_hours: base }).eq('id', 1); }
})().catch(e => { console.error('FAILED', e); process.exit(1); });
