import './globals.css';
import { LangProvider } from '@/lib/lang';
import Nav from './nav';
export const metadata = { title: 'Smart Police Complaint Tracker (prototype)' };
export default function R({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-slate-50 text-slate-900"><LangProvider><Nav /><main className="max-w-6xl mx-auto p-4">{children}</main>
    <footer className="text-center text-xs text-slate-500 p-4">College prototype with fictional data. Not an official police system.</footer></LangProvider></body></html>;
}
