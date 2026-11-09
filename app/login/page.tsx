'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { inp, btn } from '@/lib/ui';
export default function Login() {
  const { t } = useT(); const r = useRouter();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) { setErr(error?.message ?? t('error')); setBusy(false); return; }
    const { data: me } = await sb.from('users').select('role').eq('id', data.user.id).single();
    r.push(me?.role === 'officer' ? '/officer' : me?.role === 'citizen' || !me ? '/my' : '/senior');
  }
  async function signup() {
    setErr(''); if (!email || pw.length < 6) { setErr(t('required')); return; }
    const { data, error } = await sb.auth.signUp({ email, password: pw });
    if (error || !data.user || !data.session) { setErr(error?.message ?? 'Disable email confirmation in Supabase for the demo.'); return; }
    const { error: e2 } = await sb.from('users').insert({ id: data.user.id, name: email.split('@')[0], role: 'citizen' });
    if (e2) { setErr(t('error')); return; } r.push('/my');
  }
  return <form onSubmit={go} className="max-w-sm mx-auto bg-white border rounded p-6 space-y-3">
    <h1 className="text-xl font-bold">{t('login')}</h1>
    <input className={inp} type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} required />
    <input className={inp} type="password" placeholder={t('password')} value={pw} onChange={e => setPw(e.target.value)} required />
    {err && <p className="text-red-600 text-sm">{err}</p>}<button className={btn} disabled={busy}>{t('login')}</button>
    <button type="button" className="text-sm underline" onClick={signup}>{t('signup')}</button><p className="text-xs text-slate-500">{t('demoNote')}</p></form>;
}
