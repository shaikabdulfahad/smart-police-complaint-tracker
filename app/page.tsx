'use client';
import Link from 'next/link';
import { useT } from '@/lib/lang';
import { btn } from '@/lib/ui';
import { Shield, Bell, TrendingUp, Users, FileText, CheckCircle } from 'lucide-react';

export default function Home() {
  const { t } = useT();
  const features = [
    { icon: FileText,    title: t('f1'), desc: t('f1desc') },
    { icon: Bell,        title: t('f2'), desc: t('f2desc') },
    { icon: TrendingUp,  title: t('f3'), desc: t('f3desc') },
    { icon: Users,       title: t('f4'), desc: t('f4desc') },
    { icon: CheckCircle, title: t('f5'), desc: t('f5desc') },
    { icon: Shield,      title: t('f6'), desc: t('f6desc') },
  ];
  return (
    <div className="space-y-10 py-6">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex justify-center"><div className="bg-[#0b1f4d] text-white rounded-full p-4"><Shield size={36} /></div></div>
        <h1 className="text-3xl font-bold text-[#0b1f4d]">{t('appName')}</h1>
        <p className="max-w-2xl mx-auto text-slate-600">{t('ps2Tagline')}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/submit" className={btn + ' px-6 py-3'}>{t('submit')}</Link>
          <Link href="/track"  className="border-2 border-[#0b1f4d] text-[#0b1f4d] rounded px-6 py-3 text-sm font-medium hover:bg-[#0b1f4d] hover:text-white transition-colors">{t('track')}</Link>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-bold text-[#0b1f4d] text-center mb-5">{t('howItWorks')}</h2>
        <div className="flex flex-wrap justify-center gap-2 text-sm text-center">
          {[
            ['1', 'Citizen submits complaint', 'bg-blue-100 text-blue-800'],
            ['→', '', 'text-slate-400 self-center hidden sm:block'],
            ['2', 'Unique SPT ID generated', 'bg-blue-100 text-blue-800'],
            ['→', '', 'text-slate-400 self-center hidden sm:block'],
            ['3', 'Officer assigned (by dept)', 'bg-blue-100 text-blue-800'],
            ['→', '', 'text-slate-400 self-center hidden sm:block'],
            ['4', 'SLA deadline set', 'bg-yellow-100 text-yellow-800'],
            ['→', '', 'text-slate-400 self-center hidden sm:block'],
            ['5', 'SMS reminder if overdue', 'bg-orange-100 text-orange-800'],
            ['→', '', 'text-slate-400 self-center hidden sm:block'],
            ['6', 'Auto-escalate to senior', 'bg-red-100 text-red-800'],
            ['→', '', 'text-slate-400 self-center hidden sm:block'],
            ['7', 'Resolved & closed', 'bg-green-100 text-green-800'],
          ].filter(([n]) => n !== '→' || true).map(([n, label, cls], i) =>
            n === '→'
              ? <span key={i} className="text-slate-300 text-xl hidden sm:inline">→</span>
              : <div key={i} className={`rounded-lg px-3 py-2 font-medium ${cls}`}><span className="font-bold mr-1">{n}.</span>{label}</div>
          )}
        </div>
      </div>

      {/* Features grid */}
      <div>
        <h2 className="font-bold text-[#0b1f4d] text-center mb-4">PS-2 Features</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border rounded-lg p-4 space-y-2 hover:border-[#0b1f4d] transition-colors">
              <div className="flex items-center gap-2 font-semibold text-[#0b1f4d]"><Icon size={18} />{title}</div>
              <p className="text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div className="bg-[#0b1f4d] text-white rounded-lg p-6 text-center space-y-3">
        <p className="font-semibold">{t('staffLogin')}</p>
        <div className="flex gap-3 justify-center flex-wrap text-sm">
          <Link href="/login" className="bg-white text-[#0b1f4d] rounded px-4 py-2 font-medium hover:bg-slate-100">Officer Login</Link>
          <Link href="/login" className="border border-white rounded px-4 py-2 font-medium hover:bg-white hover:text-[#0b1f4d] transition-colors">Senior Officer / Admin</Link>
        </div>
        <p className="text-xs text-slate-400">{t('demoNote')}</p>
      </div>
    </div>
  );
}
