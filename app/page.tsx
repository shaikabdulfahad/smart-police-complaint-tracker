'use client';
import Link from 'next/link';
import { useT } from '@/lib/lang';
import { btn } from '@/lib/ui';
export default function Home() {
  const { t } = useT();
  return <div className="text-center py-16 space-y-6">
    <h1 className="text-3xl font-bold text-[#0b1f4d]">{t('appName')}</h1>
    <p className="max-w-xl mx-auto text-slate-600">{t('tagline')}</p><div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-sm">{(['f1','f2','f3'] as const).map(k => <div key={k} className="bg-white border rounded p-4 font-medium text-[#0b1f4d]">{t(k)}</div>)}</div>
    <div className="flex gap-3 justify-center"><Link href="/submit" className={btn}>{t('submit')}</Link><Link href="/track" className={btn}>{t('track')}</Link></div></div>;
}
