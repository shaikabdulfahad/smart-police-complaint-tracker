import { createClient } from '@supabase/supabase-js';
export const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

/** Simulated "now" = real now + demo offset (offset ignored unless DEMO_MODE=true). */
export async function getConfig() {
  const { data } = await admin().from('app_config').select('*').eq('id', 1).single();
  const demo = process.env.DEMO_MODE === 'true';
  const offsetH = demo ? data?.demo_offset_hours ?? 0 : 0;
  return {
    now: new Date(Date.now() + offsetH * 3600_000),
    sla: data?.sla_hours ?? Number(process.env.SLA_HOURS ?? 72),
    grace: data?.grace_hours ?? Number(process.env.GRACE_HOURS ?? 24),
    demo,
  };
}
