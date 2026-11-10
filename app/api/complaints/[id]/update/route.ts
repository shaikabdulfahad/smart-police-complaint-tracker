import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Verify caller is the assigned officer
    const tok = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!tok) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anon.auth.getUser(tok);
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = admin();
    const { data: c, error: complaintError } = await db.from('complaints')
      .select('assigned_officer,status').eq('id', id).maybeSingle();
    if (complaintError) throw complaintError;
    if (!c) return Response.json({ error: 'Not found' }, { status: 404 });
    if (c.assigned_officer !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (c.status === 'Escalated') return Response.json({ error: 'Complaint is escalated; only senior officer can update.' }, { status: 403 });
    if (c.status === 'Resolved') return Response.json({ error: 'Resolved complaints cannot be reopened.' }, { status: 409 });

    const body = await req.json();
    const { status, remark } = body ?? {};
    const validSts = ['Assigned', 'In Progress', 'Resolved'];
    if (typeof status !== 'string' || !validSts.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (remark !== undefined && remark !== null && typeof remark !== 'string') {
      return Response.json({ error: 'Invalid remark' }, { status: 400 });
    }
    const cleanRemark = typeof remark === 'string' ? remark.trim() : '';
    if (cleanRemark.length > 2000) return Response.json({ error: 'Remark is too long' }, { status: 400 });

    const { error: updateError } = await db.from('complaints').update({
      status,
      resolved_at: status === 'Resolved' ? new Date().toISOString() : null,
    }).eq('id', id);
    if (updateError) throw updateError;

    const { error: historyError } = await db.from('complaint_updates').insert({
      complaint_id: id,
      author: user.id,
      status,
      remark: cleanRemark || null,
    });
    if (historyError) throw historyError;

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error('Complaint status update failed:', e);
    return Response.json({ error: 'Unable to update complaint right now.' }, { status: 500 });
  }
}
