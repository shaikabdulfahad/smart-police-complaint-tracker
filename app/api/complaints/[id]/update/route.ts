import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify caller is the assigned officer
    const tok = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!tok) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await anon.auth.getUser(tok);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = admin();
    const { data: c } = await db.from('complaints').select('assigned_officer,status').eq('id', params.id).single();
    if (!c) return Response.json({ error: 'Not found' }, { status: 404 });
    if (c.assigned_officer !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (c.status === 'Escalated') return Response.json({ error: 'Complaint is escalated; only senior officer can update.' }, { status: 403 });

    const { status, remark } = await req.json();
    const validSts = ['Assigned','In Progress','Resolved'];
    if (!validSts.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

    await db.from('complaints').update({
      status, resolved_at: status === 'Resolved' ? new Date().toISOString() : null,
    }).eq('id', params.id);

    await db.from('complaint_updates').insert({
      complaint_id: params.id, author: user.id, status, remark: remark?.trim() || null,
    });

    return Response.json({ ok: true });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
