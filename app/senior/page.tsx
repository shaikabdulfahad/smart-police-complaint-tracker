'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { Badge, Card, fmt, btn } from '@/lib/ui';
export default function Senior() {
  const { t } = useT();
  const [rows, setRows] = useState<any[]>([]); const [rem, setRem] = useState<any[]>([]); const [esc, setEsc] = useState<any[]>([]); const [offs, setOffs] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  async function load() {
    const { data: { user } } = await sb.auth.getUser(); if (!user) { location.href = '/login'; return; }
    const { data: m } = await sb.from('users').select('*').eq('id', user.id).single(); setMe(m);
    setRows((await sb.from('complaints').select('*').order('due_at')).data ?? []);
    setRem((await sb.from('reminder_logs').select('*, complaints(tracking_id), officer:officer_id(name)').order('real_at', { ascending: false })).data ?? []);
    setEsc((await sb.from('escalation_logs').select('*, complaints(tracking_id)').order('real_at', { ascending: false })).data ?? []);
    setOffs((await sb.from('users').select('id,name').eq('role', 'officer')).data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function advance(days: number) {
    setBusy(true); setNote('');
    const { data: { session } } = await sb.auth.getSession();
    try { const r = await fetch('/api/demo/advance', { method: 'POST', headers: { Authorization: 'Bearer ' + session?.access_token }, body: JSON.stringify({ days }) });
      const j = await r.json().catch(() => ({})); setNote(r.ok ? j.message : t('error') + ' (' + r.status + ')'); await load(); } finally { setBusy(false); }
  }
  async function reassign(id: string, officer: string) { await sb.from('complaints').update({ assigned_officer: officer, status: 'Assigned' }).eq('id', id); load(); }
  const n = (s: string) => rows.filter(r => r.status === s).length;
  const chart = offs.map(o => ({ name: o.name, pending: rows.filter(r => r.assigned_officer === o.id && r.status !== 'Resolved').length }));
  const escRows = rows.filter(r => r.status === 'Escalated');
  return <div className="space-y-4">
    {me?.is_demo_admin && <div className="bg-amber-50 border border-amber-300 rounded p-3 flex flex-wrap gap-2 items-center"><b className="text-sm">DEMO</b>
      <button className={btn} disabled={busy} onClick={() => advance(3)}>{t('advance3')}</button><button className={btn} disabled={busy} onClick={() => advance(1)}>{t('advance1')}</button>{note && <span className="text-sm">{note}</span>}</div>}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3"><Card label={t('total')} v={rows.length} /><Card label={t('resolved')} v={n('Resolved')} /><Card label={t('pending')} v={rows.length - n('Resolved')} /><Card label={t('overdue')} v={n('Overdue')} cls="border-red-400" /><Card label={t('escalated')} v={n('Escalated')} cls="border-red-900 border-2" /></div>
    <div className="bg-white border rounded p-4 h-64"><ResponsiveContainer><BarChart data={chart}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="pending" fill="#0b1f4d" /></BarChart></ResponsiveContainer></div>
    <div className="bg-white border-2 border-red-900 rounded p-4"><h2 className="font-bold text-red-900">{t('escalated')} ({escRows.length})</h2>
      {escRows.map(r => <div key={r.id} className="flex flex-wrap gap-2 items-center border-t py-2 text-sm"><b>{r.tracking_id}</b><Badge c={r} /><span>{r.location}</span>
        <select className="border rounded text-xs ml-auto" value={r.assigned_officer ?? ''} onChange={e => reassign(r.id, e.target.value)}>{offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>)}</div>
    <div className="grid md:grid-cols-2 gap-4 text-sm">
      <div className="bg-white border rounded p-4"><h2 className="font-bold">{t('reminderHistory')}</h2>{rem.map(x => <p key={x.id} className="border-t py-1">{x.complaints?.tracking_id} → {x.officer?.name} · {x.status} ({x.mode}) · {fmt(x.simulated_at)}</p>)}</div>
      <div className="bg-white border rounded p-4"><h2 className="font-bold">{t('escalationHistory')}</h2>{esc.map(x => <p key={x.id} className="border-t py-1">{x.complaints?.tracking_id} · {x.reason} · {fmt(x.simulated_at)}</p>)}</div></div>
  </div>;
}
