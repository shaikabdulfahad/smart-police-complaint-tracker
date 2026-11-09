import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';
import { processDeadlines } from '@/lib/processor';

export async function POST(req: Request) {
  if (process.env.DEMO_MODE !== 'true') return new Response('Not found', { status: 404 });
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return new Response('Unauthorized', { status: 401 });
  const db = admin();
  const { data: me } = await db.from('users').select('role,is_demo_admin').eq('id', user.id).single();
  if (me?.role !== 'admin' || !me.is_demo_admin) return new Response('Forbidden', { status: 403 });

  const { days } = await req.json();
  if (![1, 3].includes(days)) return new Response('days must be 1 or 3', { status: 400 });
  const { data: cfg } = await db.from('app_config').select('demo_offset_hours').eq('id', 1).single();
  await db.from('app_config').update({ demo_offset_hours: (cfg?.demo_offset_hours ?? 0) + days * 24 }).eq('id', 1);
  const r = await processDeadlines(); // SMS forced to mock while DEMO_MODE=true
  return Response.json({ ...r, message: `Demo time advanced by ${days} day(s). ${r.overdue} complaints newly overdue, ${r.reminders} reminders logged, ${r.escalated} escalated.` });
}
