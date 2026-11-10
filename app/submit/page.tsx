'use client';
import { useState, useRef } from 'react';
import { useT } from '@/lib/lang';
import { inp, btn } from '@/lib/ui';
import { sb } from '@/lib/supabase';

const CATS = ['Cybercrime', 'Financial Fraud', 'Lost Property', 'Traffic Complaints'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function Submit() {
  const { t } = useT();
  const [f, setF] = useState({ name: '', phone: '', category: CATS[0], location: '', description: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState('');
  const [fail, setFail] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 3) { setErr((x: any) => ({ ...x, files: t('tooManyFiles') })); return; }
    const tooBig = picked.find(f => f.size > MAX_SIZE);
    if (tooBig) { setErr((x: any) => ({ ...x, files: t('fileTooLarge') })); return; }
    setErr((x: any) => ({ ...x, files: undefined }));
    setFiles(picked);
  }

  async function go(e: React.FormEvent) {
    e.preventDefault(); setFail('');
    const er: any = {};
    if (!f.name.trim()) er.name = t('required');
    if (!f.location.trim()) er.location = t('required');
    if (!f.description.trim()) er.description = t('required');
    if (!/^[6-9]\d{9}$/.test(f.phone)) er.phone = t('invalidMobile');
    setErr(er); if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const { data: { session } } = await sb.auth.getSession();
      const headers: any = { 'Content-Type': 'application/json' };
      if (session) headers['Authorization'] = 'Bearer ' + session.access_token;
      const r = await fetch('/api/complaints', { method: 'POST', headers, body: JSON.stringify(f) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'error');
      const tid: string = j.trackingId;

      // Upload attachments if any
      if (files.length && j.complaintId) {
        let uploadWarn = false;
        const urls: { name: string; url: string }[] = [];
        for (const file of files) {
          const path = `${j.complaintId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { error: ue } = await sb.storage.from('complaint-docs').upload(path, file);
          if (ue) { uploadWarn = true; continue; }
          const { data: pub } = sb.storage.from('complaint-docs').getPublicUrl(path);
          urls.push({ name: file.name, url: pub.publicUrl });
        }
        if (urls.length) {
          await fetch('/api/complaints/' + j.complaintId + '/attachments', {
            method: 'PATCH', headers, body: JSON.stringify({ attachments: urls }),
          });
        }
        if (uploadWarn) setFail(t('docUploadFail'));
      }
      setId(tid);
    } catch (e: any) { setFail(e.message || t('error')); }
    finally { setBusy(false); }
  }

  if (id) return (
    <div className="max-w-lg mx-auto bg-green-50 border border-green-300 rounded-lg p-8 text-center space-y-3">
      <div className="text-4xl">✅</div>
      <p className="font-semibold text-green-800">{t('success')}</p>
      <p className="text-slate-600 text-sm">Save this ID to track your complaint</p>
      <div className="bg-white border-2 border-green-400 rounded-lg p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{t('trackingId')}</p>
        <p className="text-3xl font-bold text-[#0b1f4d] mt-1">{id}</p>
      </div>
      <a href={`/track?id=${id}`} className={btn + ' inline-block mt-2'}>{t('track')} →</a>
      {fail && <p className="text-amber-600 text-sm">{fail}</p>}
    </div>
  );

  const fld = (k: 'name' | 'phone' | 'location' | 'description', label: string, area = false) => (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1 block">{label} <span className="text-red-500">*</span></span>
      {area
        ? <textarea className={inp} rows={4} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
        : <input className={inp} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />}
      {err[k] && <span className="text-red-600 text-xs mt-0.5 block">{err[k]}</span>}
    </label>
  );

  return (
    <form onSubmit={go} className="max-w-lg mx-auto bg-white border rounded-lg p-6 space-y-4 shadow-sm">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold text-[#0b1f4d]">{t('submit')}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('ps2Tagline')}</p>
      </div>
      {fld('name', t('name'))}
      {fld('phone', t('mobile'))}
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-1 block">{t('category')} <span className="text-red-500">*</span></span>
        <select className={inp} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          {CATS.map(c => <option key={c} value={c}>{t(('cat.' + c) as any)}</option>)}
        </select>
      </label>
      {fld('location', t('location'))}
      {fld('description', t('description'), true)}
      {/* Document upload */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700">{t('uploadDocs')}</p>
        <p className="text-xs text-slate-400">{t('uploadHint')}</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={pickFiles} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded px-4 py-2 text-sm text-slate-600 hover:border-[#0b1f4d] w-full">
          {files.length ? files.map(f => f.name).join(', ') : '+ Choose files'}
        </button>
        {err.files && <span className="text-red-600 text-xs block">{err.files}</span>}
      </div>
      {fail && <p className="text-amber-600 text-sm">{fail}</p>}
      <button className={btn + ' w-full py-3'} disabled={busy}>
        {busy ? '⏳ Submitting...' : t('submit')}
      </button>
    </form>
  );
}
