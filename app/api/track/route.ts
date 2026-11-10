import { admin } from '@/lib/clock';
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')?.trim().toUpperCase().replace('#', '') ?? '';
  if (!/^SPT\d+$/.test(id)) return Response.json({ error: 'Invalid ID' }, { status: 400 });
  const db = admin();
  const { data: c } = await db.from('complaints')
    .select('id,tracking_id,category,status,location,submitted_at,due_at,attachments,officer:assigned_officer(name,department)')
    .eq('tracking_id', id).maybeSingle();
  if (!c) return Response.json({ error: 'Not found' }, { status: 404 });
  const { data: updates } = await db.from('complaint_updates')
    .select('status,remark,created_at').eq('complaint_id', c.id).order('created_at');
  // Never return citizen phone or full description to anonymous callers
  return Response.json({ complaint: c, updates });
}
