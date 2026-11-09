'use client';
import { useState } from 'react';
import { useT } from '@/lib/lang';
import { inp, btn } from '@/lib/ui';
import { sb } from '@/lib/supabase';
const CATS = ['Cybercrime', 'Financial Fraud', 'Lost Property', 'Traffic Complaints'];
export default function Submit() {
  const { t } = useT();
  const [f, setF] = useState({ name: '', phone: '', category: CATS[0], location: '', description: '' });
  const [err, setErr] = useState<any>({}); const [busy, setBusy] = useState(false); const [id, setId] = useState(''); const [fail, setFail] = useState('');
  async function go(e: React.FormEvent) {
    e.preventDefault(); setFail('');
    const er: any = {};
    if (!f.name.trim()) er.name = t('required'); if (!f.location.trim()) er.location = t('required'); if (!f.description.trim()) er.description = t('required');
    if (!/^[6-9]\d{9}$/.test(f.phone)) er.phone = t('invalidMobile');
    setErr(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { const { data: { session } } = await sb.auth.getSession(); const r = await fetch('/api/complaints', { method: 'POST', headers: session ? { Authorization: 'Bearer ' + session.access_token } : {}, body: JSON.stringify(f) }); const j = await r.json(); if (!r.ok) throw new Error(); setId(j.trackingId); }
    catch { setFail(t('error')); } finally { setBusy(false); }
  }
  if (id) return <div className="bg-green-50 border border-green-300 rounded p-6 text-center"><p>{t('success')}</p><p className="text-2xl font-bold mt-2">{t('trackingId')}: {id}</p></div>;
  const fld = (k: 'name' | 'phone' | 'location' | 'description', label: string, area = false) => <label className="block text-sm">{label}
    {area ? <textarea className={inp} rows={4} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /> : <input className={inp} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />}
    {err[k] && <span className="text-red-600 text-xs">{err[k]}</span>}</label>;
  return <form onSubmit={go} className="max-w-lg mx-auto bg-white border rounded p-6 space-y-3">
    <h1 className="text-xl font-bold">{t('submit')}</h1>
    {fld('name', t('name'))}{fld('phone', t('mobile'))}
    <label className="block text-sm">{t('category')}<select className={inp} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATS.map(c => <option key={c} value={c}>{t(('cat.' + c) as any)}</option>)}</select></label>
    {fld('location', t('location'))}{fld('description', t('description'), true)}
    {fail && <p className="text-red-600 text-sm">{fail}</p>}
    <button className={btn} disabled={busy}>{busy ? '...' : t('submit')}</button></form>;
}
