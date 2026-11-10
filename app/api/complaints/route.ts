import { admin, getConfig } from '@/lib/clock';
const CATS = ['Cybercrime', 'Financial Fraud', 'Lost Property', 'Traffic Complaints'];
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const name = String(b.name ?? '').trim(), phone = String(b.phone ?? '').trim(),
          loc = String(b.location ?? '').trim(), desc = String(b.description ?? '').trim();
    if (!name || !loc || !desc || !CATS.includes(b.category) || !/^[6-9]\d{9}$/.test(phone))
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    const db = admin(); let citizenId: string | null = null;
    const tok = req.headers.get('authorization')?.replace('Bearer ', '');
    if (tok) { const { data: u } = await db.auth.getUser(tok); citizenId = u.user?.id ?? null; }
    const { sla, now } = await getConfig();
    // Smart assignment: officer in matching department first, then least loaded
    const { data: officers } = await db.from('users').select('id,department').eq('role', 'officer');
    if (!officers?.length) return Response.json({ error: 'No officers available' }, { status: 503 });
    const deptMap: Record<string, string> = {
      'Cybercrime': 'Cybercrime Cell', 'Financial Fraud': 'Cybercrime Cell',
      'Traffic Complaints': 'Traffic Division', 'Lost Property': 'General Crimes',
    };
    const preferred = officers.filter(o => o.department === deptMap[b.category]);
    const pool = preferred.length ? preferred : officers;
    const counts = await Promise.all(pool.map(async o => ({
      id: o.id,
      n: (await db.from('complaints').select('id', { count: 'exact', head: true })
            .eq('assigned_officer', o.id).not('status', 'in', '("Resolved","Escalated")')).count ?? 0,
    })));
    const officer = counts.sort((a, z) => a.n - z.n)[0].id;
    const { data, error } = await db.from('complaints').insert({
      citizen_id: citizenId, citizen_name: name, citizen_phone: phone,
      category: b.category, location: loc, description: desc,
      assigned_officer: officer, status: 'Assigned',
      due_at: new Date(now.getTime() + sla * 3600_000).toISOString(),
    }).select('id,tracking_id').single();
    if (error) throw error;
    await db.from('complaint_updates').insert({
      complaint_id: data.id, status: 'Assigned',
      remark: 'Complaint registered and assigned to officer',
    });
    // Return both trackingId (shown to citizen) and complaintId (used for attachment upload)
    return Response.json({ trackingId: data.tracking_id, complaintId: data.id });
  } catch (e: any) { return Response.json({ error: e.message ?? 'Server error' }, { status: 500 }); }
}
