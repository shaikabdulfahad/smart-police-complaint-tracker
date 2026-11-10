import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';

export async function PATCH(
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

    const body = await req.json();
    const attachments = body?.attachments;
    if (!Array.isArray(attachments) || attachments.length > 3 ||
      attachments.some((item: any) =>
        !item || typeof item.name !== 'string' || item.name.length > 255 ||
        typeof item.path !== 'string' || !item.path.startsWith(`${id}/`) ||
        item.path.slice(id.length + 1).length > 512 || item.path.slice(id.length + 1).includes('/') ||
        !/\.(pdf|jpe?g|png)$/i.test(item.name)
      )) {
      return Response.json({ error: 'Invalid attachments' }, { status: 400 });
    }

    const db = admin();
    const { data: c, error: complaintError } = await db
      .from('complaints').select('id,citizen_id').eq('id', id).maybeSingle();
    if (complaintError) throw complaintError;
    if (!c) return Response.json({ error: 'Not found' }, { status: 404 });
    if (c.citizen_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { error: updateError } = await db.from('complaints').update({ attachments }).eq('id', id);
    if (updateError) throw updateError;

    const { error: historyError } = await db.from('complaint_updates').insert({
      complaint_id: id, author: user.id, remark: `${attachments.length} document(s) attached by citizen`,
    });
    if (historyError) throw historyError;
    return Response.json({ ok: true });
  } catch (e: any) {
    console.error('Attachment metadata update failed:', e);
    return Response.json({ error: 'Unable to save attachment details.' }, { status: 500 });
  }
}
