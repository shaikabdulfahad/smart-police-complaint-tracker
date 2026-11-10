import { admin, getConfig } from '@/lib/clock';
const CATS = ['Cybercrime', 'Financial Fraud', 'Lost Property', 'Traffic Complaints'];
export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b || typeof b !== 'object' || Array.isArray(b)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    const phone = typeof b.phone === 'string' ? b.phone.trim() : '';
    const loc = typeof b.location === 'string' ? b.location.trim() : '';
    const desc = typeof b.description === 'string' ? b.description.trim() : '';
    if (!name || name.length > 120 || !loc || loc.length > 300 || !desc || desc.length > 5000 ||
      !CATS.includes(b.category) || !/^[6-9]\d{9}$/.test(phone)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = admin();
    let citizenId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const tok = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!tok) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const { data: { user }, error } = await db.auth.getUser(tok);
      if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      citizenId = user.id;
    }

    const { sla, now } = await getConfig();
    if (!Number.isFinite(sla) || sla <= 0) throw new Error('Configured SLA must be a positive number.');
    // Smart assignment: officer in matching department first, then least loaded
    const { data: officers, error: officersError } = await db.from('users').select('id,department').eq('role', 'officer');
    if (officersError) throw officersError;
    if (!officers?.length) return Response.json({ error: 'No officers available' }, { status: 503 });
    const deptMap: Record<string, string> = {
      'Cybercrime': 'Cybercrime Cell', 'Financial Fraud': 'Cybercrime Cell',
      'Traffic Complaints': 'Traffic Division', 'Lost Property': 'General Crimes',
    };
    const preferred = officers.filter(o => o.department === deptMap[b.category]);
    const pool = preferred.length ? preferred : officers;
    const counts = await Promise.all(pool.map(async o => {
      const { count, error } = await db.from('complaints').select('id', { count: 'exact', head: true })
        .eq('assigned_officer', o.id).not('status', 'in', '("Resolved","Escalated")');
      if (error) throw error;
      return { id: o.id, n: count ?? 0 };
    }));
    const officer = counts.sort((a, z) => a.n - z.n || a.id.localeCompare(z.id))[0].id;
    const { data, error } = await db.from('complaints').insert({
      citizen_id: citizenId, citizen_name: name, citizen_phone: phone,
      category: b.category, location: loc, description: desc,
      assigned_officer: officer, status: 'Assigned',
      due_at: new Date(now.getTime() + sla * 3600_000).toISOString(),
    }).select('id,tracking_id').single();
    if (error) throw error;
    const { error: updateError } = await db.from('complaint_updates').insert({
      complaint_id: data.id, status: 'Assigned',
      remark: 'Complaint registered and assigned to officer',
    });
    if (updateError) throw updateError;
    // Return both trackingId (shown to citizen) and complaintId (used for attachment upload)
    return Response.json({ trackingId: data.tracking_id, complaintId: data.id });
  } catch (e: any) {
    console.error('Complaint creation failed:', e);
    return Response.json({ error: 'Unable to create complaint right now.' }, { status: 500 });
  }
}
