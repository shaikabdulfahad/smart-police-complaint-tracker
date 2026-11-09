'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
import { useT } from '@/lib/lang';
import { Badge, fmt } from '@/lib/ui';
export default function My() {
  const { t } = useT(); const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { (async () => {
    const { data: { user } } = await sb.auth.getUser(); if (!user) { location.href = '/login'; return; }
    setRows((await sb.from('complaints').select('*').eq('citizen_id', user.id).order('submitted_at', { ascending: false })).data ?? []);
  })(); }, []);
  if (!rows) return <p>{t('loading')}</p>;
  return <div className="space-y-2"><h1 className="text-xl font-bold">{t('myComplaints')}</h1>{!rows.length && <p>{t('noData')}</p>}
    {rows.map(r => <div key={r.id} className="bg-white border rounded p-3 flex flex-wrap gap-3 items-center text-sm"><b>{r.tracking_id}</b><span>{t(('cat.' + r.category) as any)}</span><Badge c={r} /><span className="ml-auto">{t('dueDate')}: {fmt(r.due_at)}</span></div>)}</div>;
}
