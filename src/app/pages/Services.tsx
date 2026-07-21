import { ArrowRight, CarFront, Paintbrush, PackageSearch, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { PartnerNetworkSection } from '../components/PartnerNetworkSection';
import { useLanguage } from '../components/SiteTranslator';

export function Services() {
  const { text } = useLanguage();
  const supportOptions = [
    { icon: Wrench, title: { en: 'Repairs & Diagnostics', zh: '维修与诊断' }, text: { en: 'My vehicle needs a workshop, fault diagnosis or practical repair support.', zh: '车辆需要维修厂、故障诊断或实际维修协助。' } },
    { icon: Paintbrush, title: { en: 'Panel & Paint', zh: '钣金与喷漆' }, text: { en: 'I need help with dents, scratches, bodywork or refinishing.', zh: '需要处理凹痕、划痕、钣金或喷漆。' } },
    { icon: PackageSearch, title: { en: 'Parts & Accessories', zh: '配件与用品' }, text: { en: 'I need help finding parts or accessories for an imported vehicle.', zh: '需要寻找进口车型的配件或用品。' } },
    { icon: CarFront, title: { en: 'Trusted Service Partners', zh: '可信服务伙伴' }, text: { en: 'I want a local business Inno owners can contact with confidence.', zh: '希望找到 Inno 车主可以放心联系的本地商家。' } },
  ];

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-20 text-white sm:py-28"><div className="section-shell max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Ownership Support</p><h1 className="mt-6 max-w-4xl text-white">{text({ en: 'What do you need help with?', zh: '你的车辆现在需要什么帮助？' })}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">{text({ en: 'Choose the problem you are trying to solve. Inno will help point you toward the right local support.', zh: '选择你需要解决的问题，Inno 会协助你找到合适的本地支持。' })}</p></div></section>
      <section className="px-4 py-16 sm:py-24"><div className="section-shell grid gap-5 sm:grid-cols-2">{supportOptions.map((item) => { const Icon = item.icon; return <article key={item.title.en} className="section-card p-7"><Icon className="h-7 w-7 text-primary"/><h2 className="mt-8 text-3xl">{text(item.title)}</h2><p className="mt-4 leading-8">{text(item.text)}</p><Link to={`/contact?type=support&message=${encodeURIComponent(item.title.en)}#quote`} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground">{text({ en: 'Contact Support', zh: '联系支持' })}<ArrowRight className="h-4 w-4"/></Link></article>; })}</div></section>
      <PartnerNetworkSection />
      <section className="px-4 py-20"><div className="section-shell flex flex-col gap-6 rounded-[24px] bg-white p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12"><div><h2>{text({ en: 'Not sure who to contact?', zh: '不确定应该联系谁？' })}</h2><p className="mt-3">{text({ en: 'Tell us what happened and we will help with the next step.', zh: '告诉我们遇到的问题，我们会协助安排下一步。' })}</p></div><Link to="/contact?type=support#quote" className="button-primary shrink-0">{text({ en: 'Contact Support', zh: '联系支持' })}<ArrowRight className="h-5 w-5"/></Link></div></section>
    </div>
  );
}
