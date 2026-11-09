export type SmsResult = { mode: 'mock' | 'real'; status: 'sent' | 'mock_sent' | 'failed'; providerId?: string; error?: string };

/** Real SMS only if SMS_MODE=real, NOT demo mode, creds present, and number allowlisted. */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const allow = (process.env.SMS_ALLOWLIST ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_FROM: from } = process.env;
  const real = process.env.SMS_MODE === 'real' && process.env.DEMO_MODE !== 'true' && sid && tok && from && allow.includes(to);
  if (!real) return { mode: 'mock', status: 'mock_sent' };
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from!, Body: body }),
    });
    const j = await r.json();
    if (r.ok && j.sid) return { mode: 'real', status: 'sent', providerId: j.sid }; // success only with provider SID
    return { mode: 'real', status: 'failed', error: j.message ?? `HTTP ${r.status}` };
  } catch (e: any) { return { mode: 'real', status: 'failed', error: String(e.message ?? e) }; }
}
