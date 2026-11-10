import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = admin();
    const { data: profile, error: profileError } = await db.from('users')
      .select('role').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || !['senior', 'admin'].includes(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (typeof body?.officerId !== 'string') {
      return Response.json({ error: 'Invalid officer' }, { status: 400 });
    }

    const { data: officer, error: officerError } = await db.from('users')
      .select('id').eq('id', body.officerId).eq('role', 'officer').maybeSingle();
    if (officerError) throw officerError;
    if (!officer) return Response.json({ error: 'Officer not found' }, { status: 404 });

    const { data: complaint, error: updateError } = await db.from('complaints')
      .update({ assigned_officer: officer.id, status: 'Assigned' })
      .eq('id', id).eq('status', 'Escalated')
      .select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!complaint) return Response.json({ error: 'Complaint is no longer escalated.' }, { status: 409 });

    const { error: historyError } = await db.from('complaint_updates').insert({
      complaint_id: id,
      author: user.id,
      status: 'Assigned',
      remark: 'Reassigned by Senior Officer',
    });
    if (historyError) throw historyError;

    return Response.json({ ok: true });
  } catch (e) {
    console.error('Complaint reassignment failed:', e);
    return Response.json({ error: 'Unable to reassign complaint right now.' }, { status: 500 });
  }
}
