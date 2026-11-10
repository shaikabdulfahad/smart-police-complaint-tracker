'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useT } from '@/lib/lang';
import { inp, btn, Badge, fmt } from '@/lib/ui';
import { sb } from '@/lib/supabase';

const STATUS_ORDER = ['Submitted','Assigned','In Progress','Resolved','Overdue','Escalated'];
const STATUS_COLOR: Record<string,string> = {
  Submitted:'bg-slate-400', Assigned:'bg-blue-400', 'In Progress':'bg-blue-600',
  Resolved:'bg-green-500', Overdue:'bg-red-500', Escalated:'bg-red-900',
};

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-4 text-slate-500">Loading...</div>}>
      <Track />
    </Suspense>
  );
}

function Track() {
  const { t } = useT();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp?.get('id') ?? '');
  const [d, setD] = useState<any>(null);
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);

  async function go(qv = q) {
    if (!qv.trim()) return;
    setE(''); setD(null); setBusy(true);
    try {
      const { data: { session }, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw sessionError;
      const headers = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;
      const r = await fetch('/api/track?id=' + encodeURIComponent(qv), { headers });
      const j = await r.json();
      if (!r.ok) setE(j.error); else setD(j);
    } catch { setE(t('error')); } finally { setBusy(false); }
  }

  // Auto-search if id is in URL
  useEffect(() => { const id = sp?.get('id'); if (id) { setQ(id); go(id); } }, []);

  const c = d?.complaint;
  const updates: any[] = d?.updates ?? [];
  const curIdx = c ? STATUS_ORDER.indexOf(c.status) : -1;
  const isClosedBad = c && (c.status === 'Overdue' || c.status === 'Escalated');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white border rounded-lg p-5 shadow-sm">
        <h1 className="text-xl font-bold text-[#0b1f4d] mb-3">{t('track')}</h1>
        <form onSubmit={e => { e.preventDefault(); go(); }} className="flex gap-2">
          <input className={inp} placeholder="SPT0123456789ABCDEF" value={q}
            onChange={x => setQ(x.target.value.toUpperCase())} />
          <button className={btn} disabled={busy}>{busy ? '...' : t('track')}</button>
        </form>
        {e && <p className="text-red-600 text-sm mt-2">{e}</p>}
      </div>

      {c && (
        <>
          {/* Header card */}
          <div className="bg-white border rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{t('trackingId')}</p>
                <p className="text-2xl font-bold text-[#0b1f4d]">{c.tracking_id}</p>
              </div>
              <Badge c={c} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">{t('category')}:</span> <b>{t(('cat.' + c.category) as any)}</b></div>
              <div><span className="text-slate-500">{t('location')}:</span> <b>{c.location}</b></div>
              <div><span className="text-slate-500">{t('assignedTo')}:</span> <b>{c.officer?.name ?? '—'}</b></div>
              <div><span className="text-slate-500">{t('department')}:</span> <b>{c.officer?.department ?? '—'}</b></div>
              <div><span className="text-slate-500">{t('submittedOn')}:</span> {fmt(c.submitted_at)}</div>
              <div className={isClosedBad ? 'text-red-600 font-semibold' : ''}>
                <span className="text-slate-500">{t('dueDate')}:</span> {fmt(c.due_at)}
              </div>
            </div>

            {/* Progress bar */}
            {!isClosedBad && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {['Submitted','Assigned','In Progress','Resolved'].map((s, i) => (
                    <div key={s} className={`flex-1 h-2 rounded-full transition-all ${i <= curIdx ? STATUS_COLOR[c.status] ?? 'bg-blue-600' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{t('st.Submitted')}</span><span>{t('st.Assigned')}</span>
                  <span>{t('st.In Progress')}</span><span>{t('st.Resolved')}</span>
                </div>
              </div>
            )}
            {isClosedBad && (
              <div className={`rounded p-2 text-sm text-center font-medium ${c.status === 'Escalated' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-700'}`}>
                {c.status === 'Escalated'
                  ? '⚠ This complaint has been escalated to a Senior Officer for immediate attention.'
                  : '⏰ This complaint is overdue. A reminder has been sent to the assigned officer.'}
              </div>
            )}
          </div>

          {/* Action history timeline - full PS-2 requirement */}
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h2 className="font-bold text-[#0b1f4d] mb-3">{t('actionHistory')}</h2>
            {!updates.length && <p className="text-sm text-slate-400">{t('noHistory')}</p>}
            <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
              {updates.map((u, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-[#0b1f4d] border-2 border-white" />
                  <p className="text-xs text-slate-400">{fmt(u.created_at)}</p>
                  {u.status && (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 mt-0.5">
                      {t(('st.' + u.status) as any)}
                    </span>
                  )}
                  {u.remark && <p className="text-sm text-slate-700 mt-0.5">{u.remark}</p>}
                </li>
              ))}
            </ol>
          </div>

          {/* Attachments */}
          {c.attachments?.length > 0 && (
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <h2 className="font-bold text-[#0b1f4d] mb-2">{t('attachments')}</h2>
              <ul className="space-y-1">
                {c.attachments.map((a: any, i: number) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noreferrer"
                      className="text-sm text-blue-700 underline flex items-center gap-1">
                      📎 {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
