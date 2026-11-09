'use client';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useT } from '@/lib/lang';
import { sb } from '@/lib/supabase';
export default function Nav() {
  const { t, l, setL } = useT();
  return <nav className="bg-[#0b1f4d] text-white flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
    <Link href="/" className="flex items-center gap-2 font-bold"><Shield size={18} />{t('appName')}</Link>
    <Link href="/submit">{t('submit')}</Link><Link href="/track">{t('track')}</Link><Link href="/my">{t('myComplaints')}</Link><Link href="/login">{t('login')}</Link><button onClick={async () => { await sb.auth.signOut(); location.href = '/'; }}>{t('logout')}</button>
    <button className="ml-auto border rounded px-2 py-1" onClick={() => setL(l === 'en' ? 'kn' : 'en')}>{l === 'en' ? 'ಕನ್ನಡ' : 'English'}</button>
  </nav>;
}
