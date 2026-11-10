import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/clock';
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')?.trim().toUpperCase().replace('#', '') ?? '';
  if (!/^SPT(?:\d+|[A-F0-9]{16})$/.test(id)) return Response.json({ error: 'Invalid ID' }, { status: 400 });
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (req.headers.has('authorization') && !token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string | null = null;
    if (token) {
      const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: { user }, error: authError } = await anon.auth.getUser(token);
      if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      userId = user.id;
    }

    const db = admin();
    const { data: c, error: complaintError } = await db.from('complaints')
      .select('id,tracking_id,category,status,location,submitted_at,due_at,attachments,citizen_id,assigned_officer,officer:assigned_officer(name,department)')
      .eq('tracking_id', id).maybeSingle();
    if (complaintError) throw complaintError;
    if (!c) return Response.json({ error: 'Not found' }, { status: 404 });

    const { data: updates, error: updatesError } = await db.from('complaint_updates')
      .select('status,remark,created_at').eq('complaint_id', c.id).order('created_at');
    if (updatesError) throw updatesError;

    let canViewAttachments = userId !== null &&
      (userId === c.citizen_id || userId === c.assigned_officer);
    if (userId && !canViewAttachments) {
      const { data: profile, error } = await db.from('users').select('role').eq('id', userId).maybeSingle();
      if (error) throw error;
      canViewAttachments = profile?.role === 'senior' || profile?.role === 'admin';
    }
    const attachments = canViewAttachments
      ? await Promise.all((Array.isArray(c.attachments) ? c.attachments : []).map(async (item: any) => {
          if (typeof item?.name !== 'string' || typeof item?.path !== 'string' ||
            !item.path.startsWith(`${c.id}/`) || item.path.slice(c.id.length + 1).includes('/')) {
            return null;
          }
          const { data, error } = await db.storage.from('complaint-docs').createSignedUrl(item.path, 300);
          if (error) throw error;
          return { name: item.name, url: data.signedUrl };
        }))
      : [];

    // Never return citizen phone or full description to anonymous callers.
    return Response.json({
      complaint: {
        id: c.id,
        tracking_id: c.tracking_id,
        category: c.category,
        status: c.status,
        location: c.location,
        submitted_at: c.submitted_at,
        due_at: c.due_at,
        officer: c.officer,
        attachments: attachments.filter(Boolean),
      },
      updates,
    });
  } catch (e) {
    console.error('Complaint tracking lookup failed:', e);
    return Response.json({ error: 'Unable to load tracking details right now.' }, { status: 500 });
  }
}
