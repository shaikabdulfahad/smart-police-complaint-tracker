'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Lang, t as tr, dict } from './i18n';
const Ctx = createContext<{ l: Lang; setL: (l: Lang) => void }>({ l: 'en', setL: () => {} });
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [l, setLang] = useState<Lang>('en');
  useEffect(() => { try { const s = localStorage.getItem('lang'); if (s === 'kn' || s === 'en') setLang(s); } catch {} }, []);
  const setL = (x: Lang) => { setLang(x); try { localStorage.setItem('lang', x); } catch {} };
  return <Ctx.Provider value={{ l, setL }}>{children}</Ctx.Provider>;
}
export const useT = () => { const { l, setL } = useContext(Ctx); return { l, setL, t: (k: keyof typeof dict.en) => tr(l, k) }; };
