import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';
import { processDeadlines } from '@/lib/processor';

export async function POST(req: Request) {
  if (process.env.DEMO_MODE !== 'true') return new Response('Not found', { status: 404 });
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return new Response('Unauthorized', { status: 401 });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    const db = admin();
    const { data: me, error: profileError } = await db.from('users')
      .select('role,is_demo_admin').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (me?.role !== 'admin' || !me.is_demo_admin) return new Response('Forbidden', { status: 403 });

    const body = await req.json();
    const days = body?.days;
    if (![1, 3].includes(days)) return new Response('days must be 1 or 3', { status: 400 });

    const { data: cfg, error: configError } = await db.from('app_config')
      .select('demo_offset_hours').eq('id', 1).single();
    if (configError) throw configError;
    const { error: updateError } = await db.from('app_config')
      .update({ demo_offset_hours: cfg.demo_offset_hours + days * 24 }).eq('id', 1);
    if (updateError) throw updateError;

    const r = await processDeadlines();
    return Response.json({
      ...r,
      message: `Demo time advanced by ${days} day(s). ${r.overdue} complaints newly overdue, ${r.reminders} reminders logged, ${r.escalated} escalated.`,
    });
  } catch (e) {
    console.error('Demo time advance failed:', e);
    return Response.json({ error: 'Unable to advance demo time.' }, { status: 500 });
  }
}
