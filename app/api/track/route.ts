import { admin } from '@/lib/clock';
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')?.trim().toUpperCase().replace('#', '') ?? '';
  if (!/^SPT\d+$/.test(id)) return Response.json({ error: 'Invalid ID' }, { status: 400 });
  const db = admin();
  const { data: c } = await db.from('complaints').select('id,tracking_id,category,status,submitted_at,due_at,officer:assigned_officer(name)').eq('tracking_id', id).maybeSingle();
  if (!c) return Response.json({ error: 'Not found' }, { status: 404 });
  const { data: updates } = await db.from('complaint_updates').select('status,remark,created_at').eq('complaint_id', c.id).order('created_at');
  return Response.json({ complaint: c, updates }); // limited fields only: no phone/description
}
