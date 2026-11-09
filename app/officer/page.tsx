'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { Badge, Card, fmt, inp, btn } from '@/lib/ui';
const STS = ['Assigned', 'In Progress', 'Resolved'];
export default function Officer() {
  const { t } = useT();
  const [rows, setRows] = useState<any[]>([]); const [q, setQ] = useState(''); const [fs, setFs] = useState(''); const [sel, setSel] = useState<any>(null);
  const [st, setSt] = useState('In Progress'); const [rem, setRem] = useState(''); const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(true);
  async function load() {
    const { data: { user } } = await sb.auth.getUser(); if (!user) { location.href = '/login'; return; }
    const { data } = await sb.from('complaints').select('*').eq('assigned_officer', user.id).order('due_at');
    setRows(data ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function save() {
    setMsg('');
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from('complaints').update({ status: st, resolved_at: st === 'Resolved' ? new Date().toISOString() : null }).eq('id', sel.id);
    if (error) { setMsg(t('error')); return; }
    await sb.from('complaint_updates').insert({ complaint_id: sel.id, author: user!.id, status: st, remark: rem || null });
    setSel(null); setRem(''); setMsg('✓'); load();
  }
  const shown = rows.filter(r => (!fs || r.status === fs) && (r.tracking_id + r.location + r.category).toLowerCase().includes(q.toLowerCase()));
  const n = (s: string) => rows.filter(r => r.status === s).length;
  if (loading) return <p>{t('loading')}</p>;
  return <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Card label={t('total')} v={rows.length} /><Card label={t('pending')} v={rows.filter(r => r.status !== 'Resolved').length} /><Card label={t('resolved')} v={n('Resolved')} /><Card label={t('overdue')} v={n('Overdue')} cls="border-red-400" /></div>
    <div className="flex gap-2"><input className={inp} placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
      <select className={inp + ' max-w-48'} value={fs} onChange={e => setFs(e.target.value)}><option value="">{t('all')}</option>{['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Overdue', 'Escalated'].map(s => <option key={s} value={s}>{t(('st.' + s) as any)}</option>)}</select></div>
    {msg && <p className="text-sm">{msg}</p>}
    <div className="overflow-x-auto bg-white border rounded"><table className="w-full text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-2">ID</th><th>{t('category')}</th><th>{t('location')}</th><th>{t('dueDate')}</th><th>{t('status')}</th><th></th></tr></thead>
      <tbody>{shown.map(r => <tr key={r.id} className={'border-t ' + (r.status === 'Overdue' ? 'bg-red-50' : '')}><td className="p-2">{r.tracking_id}</td><td>{t(('cat.' + r.category) as any)}</td><td>{r.location}</td><td>{fmt(r.due_at)}</td><td><Badge c={r} /></td>
        <td><button className="text-blue-700 underline" onClick={() => { setSel(r); setSt(r.status === 'Resolved' ? 'Resolved' : 'In Progress'); }}>{t('open')}</button></td></tr>)}</tbody></table></div>
    {sel && <div className="bg-white border rounded p-4 space-y-2"><b>{sel.tracking_id}</b><p className="text-sm">{sel.description}</p><p className="text-xs text-slate-500">{sel.citizen_name} · {sel.citizen_phone}</p>
      <select className={inp} value={st} onChange={e => setSt(e.target.value)}>{STS.map(s => <option key={s} value={s}>{t(('st.' + s) as any)}</option>)}</select>
      <textarea className={inp} placeholder={t('remarks')} value={rem} onChange={e => setRem(e.target.value)} /><div className="flex gap-2"><button className={btn} onClick={save}>{t('save')}</button><button className="border rounded px-3" onClick={() => setSel(null)}>{t('cancel')}</button></div></div>}
  </div>;
}
