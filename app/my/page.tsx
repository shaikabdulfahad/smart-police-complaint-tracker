'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { Badge, fmt } from '@/lib/ui';

export default function My() {
  const { t } = useT();
  const [rows, setRows] = useState<any[] | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await sb.auth.getUser();
      if (!u) { location.href = '/login'; return; }
      setUser(u);
      const { data } = await sb.from('complaints')
        .select('id,tracking_id,category,status,location,submitted_at,due_at')
        .eq('citizen_id', u.id).order('submitted_at', { ascending: false });
      setRows(data ?? []);
    })();
  }, []);

  if (!rows) return <p className="p-4">{t('loading')}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0b1f4d]">{t('myComplaints')}</h1>
        <Link href="/submit" className="text-sm text-blue-700 underline">{t('submit')} +</Link>
      </div>

      {!rows.length && (
        <div className="bg-white border rounded-lg p-8 text-center space-y-3">
          <p className="text-slate-500">{t('noData')}</p>
          <Link href="/submit" className="text-blue-700 underline text-sm">{t('submit')}</Link>
        </div>
      )}

      {rows.map(r => (
        <Link key={r.id} href={`/track?id=${r.tracking_id}`}
          className={`block bg-white border rounded-lg p-4 hover:border-[#0b1f4d] transition-colors
            ${r.status === 'Escalated' ? 'border-red-900 border-2' : r.status === 'Overdue' ? 'border-red-400' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold text-[#0b1f4d]">{r.tracking_id}</span>
            <Badge c={r} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-sm text-slate-600">
            <span>{t(('cat.' + r.category) as any)}</span>
            <span>{r.location}</span>
            <span className="text-xs text-slate-400">{t('submittedOn')}: {fmt(r.submitted_at)}</span>
            <span className={`text-xs ${new Date(r.due_at) < new Date() && r.status !== 'Resolved' ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
              {t('dueDate')}: {fmt(r.due_at)}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-2">View full details →</p>
        </Link>
      ))}
    </div>
  );
}
