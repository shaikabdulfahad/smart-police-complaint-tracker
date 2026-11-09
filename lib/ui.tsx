import { useT } from './lang';
export const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
export function Badge({ c }: { c: any }) {
  const { t } = useT();
  const soon = c.status !== 'Resolved' && !['Overdue', 'Escalated'].includes(c.status) && new Date(c.due_at).getTime() - Date.now() < 86400000;
  const cls: any = { Resolved: 'bg-green-100 text-green-800', 'In Progress': 'bg-blue-100 text-blue-800', Overdue: 'bg-red-100 text-red-700', Escalated: 'bg-red-900 text-white' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${soon ? 'bg-yellow-100 text-yellow-800' : cls[c.status] ?? 'bg-slate-100 text-slate-700'}`}>{t(('st.' + c.status) as any)}</span>;
}
export const Card = ({ label, v, cls = '' }: any) => <div className={`rounded-lg border bg-white p-4 ${cls}`}><div className="text-sm text-slate-500">{label}</div><div className="text-2xl font-bold text-[#0b1f4d]">{v}</div></div>;
export const inp = 'w-full border rounded px-3 py-2 text-sm';
export const btn = 'bg-[#0b1f4d] text-white rounded px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50';
