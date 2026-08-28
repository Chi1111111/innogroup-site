import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router';
import { formatNzd, type JapanMarketVehicle, vehicleFullName } from '../../data/japanMarket';
import { submitJapanMarketLead } from '../lib/japanMarketLead';
import { useLanguage } from './SiteTranslator';

const fieldClass = 'w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

export function JapanMarketEnquiryForm({ vehicle, open, onClose }: { vehicle: JapanMarketVehicle; open: boolean; onClose: () => void }) {
  const { language, text } = useLanguage();
  const nameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferredContact: 'either' as 'phone' | 'email' | 'either',
    message: text({
      en: "I'm interested in this vehicle and would like more information about importing it to New Zealand.",
      zh: '我对这辆车感兴趣，希望进一步了解进口到新西兰的流程和费用。',
    }),
    company: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.phone && !form.email) {
      setError(text({ en: 'Please provide a phone number or email address.', zh: '请填写电话号码或邮箱。' }));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitJapanMarketLead({
        requestKind: 'vehicle_enquiry',
        ...form,
        vehicleId: vehicle.id,
        vehicleMake: vehicle.make,
        vehicleModel: `${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''}`,
        vehicleYear: vehicle.year,
        estimatedPrice: vehicle.estimatedNzdPrice ?? undefined,
        sourcePage: window.location.href,
      });
      setSent(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : text({ en: 'Unable to send enquiry.', zh: '暂时无法发送咨询。' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="vehicle-enquiry-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#f6f1e8] p-5 shadow-2xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-5 border-b border-black/8 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Japan Market · {vehicle.id}</p>
            <h2 id="vehicle-enquiry-title" className="mt-3 text-3xl">{text({ en: 'Interested in this car?', zh: '想了解这辆车？' })}</h2>
            <p className="mt-2 text-sm">{vehicleFullName(vehicle)} · {formatNzd(vehicle.estimatedNzdPrice, language)} {text({ en: 'estimated landed', zh: '预计落地' })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={text({ en: 'Close enquiry form', zh: '关闭咨询表单' })} className="rounded-full border border-black/10 bg-white p-2.5 hover:border-primary"><X className="h-5 w-5" /></button>
        </div>

        {sent ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-5 text-2xl">{text({ en: 'Enquiry received', zh: '咨询已收到' })}</h3>
            <p className="mx-auto mt-3 max-w-md">{text({ en: `Your enquiry has been saved with vehicle ID ${vehicle.id}. Inno Group will be in touch shortly.`, zh: `您的咨询已关联车辆编号 ${vehicle.id}，Inno Group 会尽快与您联系。` })}</p>
            <button type="button" onClick={onClose} className="button-primary mt-7">{text({ en: 'Done', zh: '完成' })}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="absolute -left-[9999px]" aria-hidden="true"><label>Company<input tabIndex={-1} autoComplete="off" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} /></label></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">{text({ en: 'Name *', zh: '姓名 *' })}<input ref={nameRef} required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClass} autoComplete="name" /></label>
              <label className="space-y-2">{text({ en: 'Phone', zh: '电话' })}<input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} autoComplete="tel" /></label>
              <label className="space-y-2">{text({ en: 'Email', zh: '邮箱' })}<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={fieldClass} autoComplete="email" /></label>
              <label className="space-y-2">{text({ en: 'Preferred Contact Method', zh: '首选联系方式' })}<select value={form.preferredContact} onChange={(event) => setForm((current) => ({ ...current, preferredContact: event.target.value as 'phone' | 'email' | 'either' }))} className={fieldClass}><option value="either">{text({ en: 'Phone or email', zh: '电话或邮箱均可' })}</option><option value="phone">{text({ en: 'Phone', zh: '电话' })}</option><option value="email">{text({ en: 'Email', zh: '邮箱' })}</option></select></label>
            </div>
            <label className="block space-y-2">{text({ en: 'Message', zh: '留言' })}<textarea required rows={5} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className={fieldClass} /></label>
            {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <p className="text-xs leading-6 text-foreground/50">{text({ en: 'We typically reply within one business day. Your details are used only to respond to this enquiry. See our ', zh: '我们通常会在一个工作日内回复。您的信息仅用于回复本次咨询。查看' })}<Link to="/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground">{text({ en: 'privacy statement', zh: '隐私声明' })}</Link>.</p>
            <div className="flex flex-col-reverse gap-3 border-t border-black/8 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="button-secondary">{text({ en: 'Cancel', zh: '取消' })}</button>
              <button type="submit" disabled={submitting} className="button-primary disabled:cursor-wait disabled:opacity-60">{submitting ? text({ en: 'Sending…', zh: '发送中…' }) : text({ en: 'Send Vehicle Enquiry', zh: '发送车辆咨询' })}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
