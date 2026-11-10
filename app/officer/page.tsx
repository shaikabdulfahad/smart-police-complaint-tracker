'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { Badge, Card, fmt, inp, btn } from '@/lib/ui';

const STS = ['Assigned','In Progress','Resolved'];

export default function Officer() {
  const { t } = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState(''); const [fs, setFs] = useState('');
  const [sel, setSel] = useState<any>(null);
  const [st, setSt] = useState('In Progress'); const [rem, setRem] = useState('');
  const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');

  async function load() {
    try {
      const { data: { user }, error: userError } = await sb.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setRows([]);
        setLoadError('Please log in to view officer complaints.');
        setLoading(false);
        return;
      }

      const { data: m, error: meError } = await sb.from('users').select('*').eq('id', user.id).single();
      if (meError) throw meError;
      setMe(m);
      const { data, error: complaintsError } = await sb.from('complaints').select('*').eq('assigned_officer', user.id).order('due_at');
      if (complaintsError) throw complaintsError;
      setRows(data ?? []);
      setLoadError('');
    } catch (e: any) {
      setRows([]);
      setLoadError(e?.message || 'Unable to load officer dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function openComplaint(r: any) {
    setSel(r); setSt(r.status === 'Resolved' ? 'Resolved' : 'In Progress'); setRem(''); setMsg('');
    try {
      const { data: { session }, error: sessionError } = await sb.auth.getSession();
      if (sessionError || !session) throw sessionError ?? new Error('Please sign in again.');
      const response = await fetch('/api/track?id=' + encodeURIComponent(r.tracking_id), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('error'));
      setSel({ ...r, attachments: result.complaint.attachments ?? [] });
      setHistory(result.updates ?? []);
    } catch (e: any) {
      setMsg(e?.message || t('error'));
    }
  }

  async function save() {
    setMsg('');
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch('/api/complaints/' + sel.id + '/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session?.access_token },
      body: JSON.stringify({ status: st, remark: rem }),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || t('error')); return; }
    setMsg('✓ Saved'); setSel(null); setRem(''); load();
  }

  const shown = rows.filter(r =>
    (!fs || r.status === fs) &&
    (r.tracking_id + r.location + r.category + r.citizen_name).toLowerCase().includes(q.toLowerCase())
  );
  const n = (s: string) => rows.filter(r => r.status === s).length;
  const urgent = rows.filter(r => !['Resolved','Escalated'].includes(r.status) && new Date(r.due_at).getTime() - Date.now() < 86400000);

  if (loading) return <p className="p-4">{t('loading')}</p>;
  if (loadError) return (
    <div className="max-w-xl mx-auto mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {loadError} <a href="/login" className="underline font-medium">Go to login</a>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Officer info banner */}
      {me && (
        <div className="bg-[#0b1f4d] text-white rounded-lg px-4 py-2 flex items-center justify-between text-sm">
          <span>👮 {me.name} · {me.department ?? 'Officer'}</span>
          {urgent.length > 0 && (
            <span className="bg-yellow-400 text-black rounded px-2 py-0.5 font-bold">
              ⚠ {urgent.length} complaint{urgent.length > 1 ? 's' : ''} due within 24h
            </span>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label={t('total')} v={rows.length} />
        <Card label={t('pending')} v={rows.filter(r => !['Resolved','Escalated'].includes(r.status)).length} />
        <Card label={t('resolved')} v={n('Resolved')} />
        <Card label={t('overdue')} v={n('Overdue')} cls="border-red-400" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input className={inp + ' max-w-64'} placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
        <select className={inp + ' max-w-48'} value={fs} onChange={e => setFs(e.target.value)}>
          <option value="">{t('all')}</option>
          {['Submitted','Assigned','In Progress','Resolved','Overdue','Escalated'].map(s =>
            <option key={s} value={s}>{t(('st.' + s) as any)}</option>)}
        </select>
      </div>

      {msg && <p className="text-sm font-medium text-green-700">{msg}</p>}

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">ID</th><th className="p-3">{t('category')}</th>
              <th className="p-3">{t('location')}</th><th className="p-3">{t('dueDate')}</th>
              <th className="p-3">{t('status')}</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.id} className={`border-t hover:bg-slate-50 ${r.status === 'Overdue' ? 'bg-red-50' : r.status === 'Escalated' ? 'bg-red-100' : ''}`}>
                <td className="p-3 font-mono font-medium">{r.tracking_id}</td>
                <td className="p-3">{t(('cat.' + r.category) as any)}</td>
                <td className="p-3">{r.location}</td>
                <td className={`p-3 ${new Date(r.due_at) < new Date() && r.status !== 'Resolved' ? 'text-red-600 font-medium' : ''}`}>{fmt(r.due_at)}</td>
                <td className="p-3"><Badge c={r} /></td>
                <td className="p-3">
                  <button className="text-blue-700 underline text-xs" onClick={() => openComplaint(r)}>{t('open')}</button>
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={6} className="p-4 text-center text-slate-400">{t('noData')}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {sel && (
        <div className="bg-white border-2 border-[#0b1f4d] rounded-lg p-5 space-y-3 shadow-md">
          <div className="flex justify-between items-start">
            <div><p className="text-xs text-slate-500">{t('trackingId')}</p><p className="text-lg font-bold text-[#0b1f4d]">{sel.tracking_id}</p></div>
            <Badge c={sel} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">{t('category')}:</span> {t(('cat.' + sel.category) as any)}</div>
            <div><span className="text-slate-500">{t('location')}:</span> {sel.location}</div>
            <div><span className="text-slate-500">{t('name')}:</span> {sel.citizen_name}</div>
            <div><span className="text-slate-500">{t('mobile')}:</span> {sel.citizen_phone}</div>
          </div>
          <div className="bg-slate-50 rounded p-3 text-sm"><b>{t('description')}:</b> {sel.description}</div>
          {sel.attachments?.length > 0 && (
            <div className="text-sm"><b>{t('attachments')}:</b> {sel.attachments.map((a: any, i: number) =>
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="ml-2 text-blue-700 underline">📎 {a.name}</a>)}
            </div>
          )}

          {/* Action history */}
          {history.length > 0 && (
            <div className="border rounded p-3 text-xs space-y-1 max-h-40 overflow-y-auto">
              <p className="font-semibold text-slate-600">{t('actionHistory')}</p>
              {history.map((h, i) => (
                <div key={i} className="border-t pt-1">
                  <span className="text-slate-400">{fmt(h.created_at)}</span>
                  {h.status && <span className="ml-2 font-medium">{t(('st.' + h.status) as any)}</span>}
                  {h.remark && <span className="ml-2 text-slate-600">{h.remark}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Update form */}
          {!['Escalated'].includes(sel.status) && (
            <>
              <select className={inp} value={st} onChange={e => setSt(e.target.value)}>
                {STS.map(s => <option key={s} value={s}>{t(('st.' + s) as any)}</option>)}
              </select>
              <textarea className={inp} rows={3} placeholder={t('remarks')} value={rem} onChange={e => setRem(e.target.value)} />
              <div className="flex gap-2">
                <button className={btn} onClick={save}>{t('save')}</button>
                <button className="border rounded px-3 text-sm" onClick={() => setSel(null)}>{t('cancel')}</button>
              </div>
            </>
          )}
          {sel.status === 'Escalated' && (
            <div className="bg-red-900 text-white rounded p-2 text-sm text-center">
              This complaint has been escalated. Only the Senior Officer can update it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
