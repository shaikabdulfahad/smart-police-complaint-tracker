import { admin } from '@/lib/clock';
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { attachments } = await req.json();
    if (!Array.isArray(attachments)) return Response.json({ error: 'Invalid' }, { status: 400 });
    const db = admin();
    const { data: c } = await db.from('complaints').select('id').eq('id', params.id).single();
    if (!c) return Response.json({ error: 'Not found' }, { status: 404 });
    await db.from('complaints').update({ attachments }).eq('id', params.id);
    await db.from('complaint_updates').insert({ complaint_id: params.id, remark: `${attachments.length} document(s) attached by citizen` });
    return Response.json({ ok: true });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
