'use client';
import { useState } from 'react';
import { useT } from '@/lib/lang';
import { inp, btn, Badge, fmt } from '@/lib/ui';
export default function Track() {
  const { t } = useT();
  const [q, setQ] = useState(''); const [d, setD] = useState<any>(null); const [e, setE] = useState(''); const [busy, setBusy] = useState(false);
  async function go(ev: React.FormEvent) {
    ev.preventDefault(); setE(''); setD(null); setBusy(true);
    try { const r = await fetch('/api/track?id=' + encodeURIComponent(q)); const j = await r.json(); if (!r.ok) setE(j.error); else setD(j); } catch { setE(t('error')); } finally { setBusy(false); }
  }
  return <div className="max-w-xl mx-auto space-y-4">
    <form onSubmit={go} className="flex gap-2"><input className={inp} placeholder="SPT1024" value={q} onChange={x => setQ(x.target.value)} /><button className={btn} disabled={busy}>{t('track')}</button></form>
    {e && <p className="text-red-600 text-sm">{e}</p>}
    {d && <div className="bg-white border rounded p-4 space-y-2 text-sm">
      <div className="flex justify-between"><b>{d.complaint.tracking_id}</b><Badge c={d.complaint} /></div>
      <p>{t(('cat.' + d.complaint.category) as any)} · {d.complaint.officer?.name}</p>
      <p>{t('submittedOn')}: {fmt(d.complaint.submitted_at)}</p><p>{t('dueDate')}: {fmt(d.complaint.due_at)}</p>
      <ol className="border-l-2 pl-3 space-y-1 mt-2">{d.updates.map((u: any, i: number) => <li key={i}><span className="text-slate-500">{fmt(u.created_at)}</span> {u.status && t(('st.' + u.status) as any)} {u.remark}</li>)}</ol></div>}
  </div>;
}
