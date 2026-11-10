'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { Badge, Card, fmt, btn, inp } from '@/lib/ui';

const PIE_COLORS = ['#0b1f4d','#3b82f6','#22c55e','#ef4444','#7f1d1d'];

export default function Senior() {
  const { t } = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [rem, setRem] = useState<any[]>([]);
  const [esc, setEsc] = useState<any[]>([]);
  const [offs, setOffs] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [catFilter, setCatFilter] = useState(''); const [stFilter, setStFilter] = useState('');
  const [tab, setTab] = useState<'overview'|'complaints'|'escalated'|'reminders'|'history'>('overview');

  async function load() {
    setLoadError('');
    try {
      const { data: { user }, error: authError } = await sb.auth.getUser();
      if (authError) throw authError;
      if (!user) { location.href = '/login'; return; }

      const { data: profile, error: profileError } = await sb.from('users').select('*').eq('id', user.id).single();
      if (profileError) throw profileError;
      if (!['senior', 'admin'].includes(profile.role)) {
        throw new Error('You do not have permission to view the senior dashboard.');
      }

      const [complaints, reminders, escalations, officers] = await Promise.all([
        sb.from('complaints').select('*, officer:assigned_officer(name,department)').order('due_at'),
        sb.from('reminder_logs').select('*, complaints(tracking_id), officer:officer_id(name)')
          .eq('kind', 'deadline').order('real_at', { ascending: false }),
        sb.from('escalation_logs').select('*, complaints(tracking_id,category,location), from_off:from_officer(name), to_sen:to_senior(name)')
          .order('real_at', { ascending: false }),
        sb.from('users').select('id,name,department').eq('role', 'officer'),
      ]);
      const failed = [complaints, reminders, escalations, officers].find(result => result.error);
      if (failed?.error) throw failed.error;

      setMe(profile);
      setRows(complaints.data ?? []);
      setRem(reminders.data ?? []);
      setEsc(escalations.data ?? []);
      setOffs(officers.data ?? []);
    } catch (e: any) {
      setLoadError(e?.message || 'Unable to load the senior dashboard.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function advance(days: number) {
    setBusy(true); setNote('');
    try {
      const { data: { session }, error: sessionError } = await sb.auth.getSession();
      if (sessionError || !session) throw sessionError ?? new Error('Please sign in again.');
      const r = await fetch('/api/demo/advance', { method: 'POST', headers: { Authorization: 'Bearer ' + session?.access_token }, body: JSON.stringify({ days }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `${t('error')} (${r.status})`);
      setNote(j.message);
      await load();
    } catch (e: any) {
      setNote(e?.message || t('error'));
    } finally { setBusy(false); }
  }

  async function reassign(id: string, officer: string) {
    setNote('');
    try {
      const { data: { session }, error: sessionError } = await sb.auth.getSession();
      if (sessionError || !session) throw sessionError ?? new Error('Please sign in again.');
      const response = await fetch(`/api/complaints/${id}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ officerId: officer }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('error'));
      await load();
    } catch (e: any) {
      setNote(e?.message || t('error'));
    }
  }

  const n = (s: string) => rows.filter(r => r.status === s).length;
  const escRows = rows.filter(r => r.status === 'Escalated');
  const pendingCount = rows.filter(r => ['Submitted', 'Assigned', 'In Progress'].includes(r.status)).length;
  const CATS = ['Cybercrime','Financial Fraud','Lost Property','Traffic Complaints'];
  const barData = offs.map(o => ({
    name: o.name.replace(' (fictional)','').replace('SI ',''),
    pending: rows.filter(r => r.assigned_officer === o.id && ['Submitted', 'Assigned', 'In Progress'].includes(r.status)).length,
    resolved: rows.filter(r => r.assigned_officer === o.id && r.status === 'Resolved').length,
  }));
  const pieData = CATS.map(c => ({ name: t(('cat.' + c) as any), value: rows.filter(r => r.category === c).length }));
  const avgResolution = (() => {
    const resolved = rows.filter(r => r.status === 'Resolved' && r.resolved_at);
    if (!resolved.length) return null;
    const avg = resolved.reduce((s, r) => s + (new Date(r.resolved_at).getTime() - new Date(r.submitted_at).getTime()), 0) / resolved.length;
    return (avg / 3600_000).toFixed(1);
  })();
  const slaBreachRate = rows.length ? Math.round((n('Overdue') + n('Escalated')) / rows.length * 100) : 0;

  const shownRows = rows.filter(r =>
    (!catFilter || r.category === catFilter) &&
    (!stFilter || r.status === stFilter)
  );

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'complaints', label: 'All Complaints' },
    { key: 'escalated', label: `⚠ Escalated (${n('Escalated')})` },
    { key: 'reminders', label: 'Reminders' },
    { key: 'history', label: 'Escalation Log' },
  ];

  if (loading) return <p className="p-4">{t('loading')}</p>;
  if (loadError) return (
    <div className="max-w-xl mx-auto mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {loadError}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Demo controls */}
      {me?.is_demo_admin && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex flex-wrap gap-2 items-center">
          <span className="font-bold text-sm text-amber-800">🧪 DEMO MODE</span>
          <button className={btn} disabled={busy} onClick={() => advance(3)}>{t('advance3')}</button>
          <button className={btn} disabled={busy} onClick={() => advance(1)}>{t('advance1')}</button>
        </div>
      )}
      {note && <p className="text-sm font-medium text-amber-900 bg-amber-100 border border-amber-200 rounded px-3 py-2">{note}</p>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card label={t('total')} v={rows.length} />
        <Card label={t('resolved')} v={n('Resolved')} />
        <Card label={t('pending')} v={pendingCount} />
        <Card label={t('overdue')} v={n('Overdue')} cls="border-red-400" />
        <Card label={t('escalated')} v={n('Escalated')} cls="border-red-900 border-2" />
      </div>

      {/* SLA metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500">SLA Breach Rate</p>
          <p className={`text-2xl font-bold ${slaBreachRate > 20 ? 'text-red-600' : 'text-green-600'}`}>{slaBreachRate}%</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500">Avg Resolution Time</p>
          <p className="text-2xl font-bold text-[#0b1f4d]">{avgResolution ? avgResolution + 'h' : '—'}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500">Reminders Sent</p>
          <p className="text-2xl font-bold text-[#0b1f4d]">{rem.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b flex-wrap">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === tb.key ? 'border-[#0b1f4d] text-[#0b1f4d]' : 'border-transparent text-slate-500 hover:text-slate-700'} ${tb.key === 'escalated' && n('Escalated') > 0 ? 'text-red-700' : ''}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="font-semibold text-sm mb-2">Complaints per Officer</p>
            <div className="h-56"><ResponsiveContainer><BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
              <Bar dataKey="pending" fill="#0b1f4d" name="Pending" stackId="a" />
              <Bar dataKey="resolved" fill="#22c55e" name="Resolved" stackId="a" />
            </BarChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="font-semibold text-sm mb-2">Complaints by Category</p>
            <div className="h-56"><ResponsiveContainer><PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie><Legend /><Tooltip />
            </PieChart></ResponsiveContainer></div>
          </div>
        </div>
      )}

      {/* All complaints tab */}
      {tab === 'complaints' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select className={inp + ' max-w-48'} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">{t('all')} {t('category')}</option>
              {CATS.map(c => <option key={c} value={c}>{t(('cat.' + c) as any)}</option>)}
            </select>
            <select className={inp + ' max-w-48'} value={stFilter} onChange={e => setStFilter(e.target.value)}>
              <option value="">{t('all')} {t('status')}</option>
              {['Submitted','Assigned','In Progress','Resolved','Overdue','Escalated'].map(s =>
                <option key={s} value={s}>{t(('st.' + s) as any)}</option>)}
            </select>
            <span className="text-sm text-slate-500 self-center">{shownRows.length} complaints</span>
          </div>
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-left">
                <tr><th className="p-3">ID</th><th className="p-3">{t('category')}</th><th className="p-3">{t('officer')}</th>
                  <th className="p-3">{t('department')}</th><th className="p-3">{t('dueDate')}</th><th className="p-3">{t('status')}</th></tr>
              </thead>
              <tbody>
                {shownRows.map(r => (
                  <tr key={r.id} className={`border-t ${r.status === 'Escalated' ? 'bg-red-100' : r.status === 'Overdue' ? 'bg-red-50' : ''}`}>
                    <td className="p-3 font-mono font-medium">{r.tracking_id}</td>
                    <td className="p-3">{t(('cat.' + r.category) as any)}</td>
                    <td className="p-3">{r.officer?.name?.replace(' (fictional)','').replace('SI ','')}</td>
                    <td className="p-3 text-slate-500">{r.officer?.department ?? '—'}</td>
                    <td className={`p-3 ${new Date(r.due_at) < new Date() && r.status !== 'Resolved' ? 'text-red-600 font-medium' : ''}`}>{fmt(r.due_at)}</td>
                    <td className="p-3"><Badge c={r} /></td>
                  </tr>
                ))}
                {!shownRows.length && <tr><td colSpan={6} className="p-4 text-center text-slate-400">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Escalated tab */}
      {tab === 'escalated' && (
        <div className="space-y-3">
          {!escRows.length && <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-700 font-medium">✅ No escalated complaints</div>}
          {escRows.map(r => (
            <div key={r.id} className="bg-white border-2 border-red-900 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-red-900">{r.tracking_id}</span>
                <Badge c={r} />
                <span className="text-sm">{t(('cat.' + r.category) as any)} · {r.location}</span>
              </div>
              <p className="text-sm text-slate-600">{r.description}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-slate-500">Reassign to:</span>
                <select className="border rounded text-sm px-2 py-1" value={r.assigned_officer ?? ''}
                  onChange={e => reassign(r.id, e.target.value)}>
                  {offs.map(o => <option key={o.id} value={o.id}>{o.name?.replace(' (fictional)','').replace('SI ','')} ({o.department ?? '—'})</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminders tab */}
      {tab === 'reminders' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-left">
              <tr><th className="p-3">Complaint</th><th className="p-3">Officer</th><th className="p-3">Mode</th><th className="p-3">Status</th><th className="p-3">Sent at (simulated)</th></tr>
            </thead>
            <tbody>
              {rem.map(x => (
                <tr key={x.id} className="border-t">
                  <td className="p-3 font-mono">{x.complaints?.tracking_id}</td>
                  <td className="p-3">{x.officer?.name?.replace(' (fictional)','').replace('SI ','')}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${x.mode === 'real' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{x.mode}</span></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${x.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{x.status}</span></td>
                  <td className="p-3 text-slate-500">{fmt(x.simulated_at)}</td>
                </tr>
              ))}
              {!rem.length && <tr><td colSpan={5} className="p-4 text-center text-slate-400">{t('noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Escalation history tab */}
      {tab === 'history' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-left">
              <tr><th className="p-3">Complaint</th><th className="p-3">Category</th><th className="p-3">From Officer</th><th className="p-3">To Senior</th><th className="p-3">Reason</th><th className="p-3">Escalated At</th></tr>
            </thead>
            <tbody>
              {esc.map(x => (
                <tr key={x.id} className="border-t">
                  <td className="p-3 font-mono font-medium">{x.complaints?.tracking_id}</td>
                  <td className="p-3">{x.complaints?.category}</td>
                  <td className="p-3">{x.from_off?.name?.replace(' (fictional)','').replace('SI ','')}</td>
                  <td className="p-3">{x.to_sen?.name?.replace(' (fictional)','')}</td>
                  <td className="p-3 text-slate-500">{x.reason}</td>
                  <td className="p-3 text-slate-500">{fmt(x.simulated_at)}</td>
                </tr>
              ))}
              {!esc.length && <tr><td colSpan={6} className="p-4 text-center text-slate-400">{t('noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
