import { createClient } from '@supabase/supabase-js';
export const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

/** Simulated "now" = real now + demo offset (offset ignored unless DEMO_MODE=true). */
export async function getConfig() {
  const { data, error } = await admin().from('app_config').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  const demo = process.env.DEMO_MODE === 'true';
  const offsetH = demo ? data?.demo_offset_hours ?? 0 : 0;
  const sla = data?.sla_hours ?? Number(process.env.SLA_HOURS ?? 72);
  const grace = data?.grace_hours ?? Number(process.env.GRACE_HOURS ?? 24);
  if (!Number.isFinite(offsetH)) throw new Error('Configured demo time offset must be a number.');
  if (!Number.isFinite(sla) || sla <= 0) throw new Error('SLA_HOURS must be a positive number.');
  if (!Number.isFinite(grace) || grace < 0) throw new Error('GRACE_HOURS must be zero or a positive number.');
  return {
    now: new Date(Date.now() + offsetH * 3600_000),
    sla,
    grace,
    demo,
  };
}
