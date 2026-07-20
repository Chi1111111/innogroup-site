import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Share2, ShieldAlert } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { getJapanSpecialOrderImages, useJapanSpecialOrders } from '../hooks/useJapanSpecialOrders';
import { useLanguage } from '../components/SiteTranslator';

export function WeeklyVehicleDetail() {
  const { issue, slug } = useParams();
  const { report, vehicles } = useJapanSpecialOrders();
  const { text } = useLanguage();
  const vehicle = vehicles.find((item) => item.slug === slug);

  if (!vehicle) return <div className="px-4 pb-24 pt-40 text-center"><h1>{text({ en: 'Opportunity not found', zh: '未找到该车源' })}</h1><Link to="/weekly-report" className="button-primary mt-8">{text({ en: 'Back to report', zh: '返回周报' })}</Link></div>;

  const images = getJapanSpecialOrderImages(vehicle);
  const details = [
    [text({ en: 'Year', zh: '年份' }), vehicle.year],
    [text({ en: 'Mileage', zh: '公里数' }), vehicle.mileage],
    [text({ en: 'Japan price', zh: '日本价格' }), vehicle.japanPrice || vehicle.price],
    [text({ en: 'Estimated landed', zh: '预计落地价' }), vehicle.landedEstimate || text({ en: 'Confirm with Inno', zh: '联系 Inno 确认' })],
    [text({ en: 'NZ market reference', zh: '新西兰市场参考' }), vehicle.nzMarketRange || text({ en: 'Under review', zh: '评估中' })],
    ['Opportunity Score', vehicle.opportunityScore ? `${vehicle.opportunityScore}/100` : text({ en: 'Under review', zh: '评估中' })],
  ];

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: vehicle.title, url: window.location.href });
    else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-10 text-white sm:py-14"><div className="section-shell"><Link to="/weekly-report" className="inline-flex items-center gap-2 text-sm font-bold text-white/62 hover:text-primary"><ArrowLeft className="h-4 w-4"/>{text({ en: `Back to Issue ${report.issueNumber}`, zh: `返回第 ${report.issueNumber} 期` })}</Link><div className="mt-9 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-primary"><span>Japan Market Weekly</span><span className="text-white/25">/</span><span>{issue?.replace('issue-', 'Issue ')}</span></div><h1 className="mt-5 max-w-4xl text-white">{text({ en: vehicle.title, zh: vehicle.zhTitle })}</h1><div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/55"><span>{vehicle.status}</span><span className="h-1 w-1 rounded-full bg-primary"/><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4"/>{vehicle.updatedAt || report.dataUpdatedAt}</span></div></div></section>

      <section className="px-4 py-12 sm:py-20"><div className="section-shell grid gap-10 lg:grid-cols-[1.15fr_0.85fr]"><div className="space-y-5">{images.map((image, index) => <img key={image} src={image} alt={`${text({ en: vehicle.title, zh: vehicle.zhTitle })} ${index + 1}`} className="w-full rounded-[24px] border border-black/7 bg-white object-contain" />)}<article className="section-card p-7"><p className="section-kicker">{text({ en: 'Why it made the report', zh: '为什么入选本周周报' })}</p><h2 className="mt-5 text-3xl">{text({ en: 'Opportunity analysis', zh: '机会分析' })}</h2><p className="mt-5 leading-8">{text({ en: vehicle.recommendation || vehicle.summary, zh: vehicle.zhRecommendation || vehicle.zhSummary })}</p></article><article className="rounded-[24px] border border-orange-200 bg-orange-50 p-7"><div className="flex gap-3"><ShieldAlert className="h-6 w-6 flex-none text-orange-700"/><div><h3 className="text-orange-950">{text({ en: 'Main risks to confirm', zh: '需要确认的主要风险' })}</h3><p className="mt-3 leading-7 text-orange-900/75">{text({ en: vehicle.risk || 'Availability, condition, documents, compliance and final landed cost require confirmation before deposit.', zh: vehicle.zhRisk || '支付订金前，需要确认库存状态、车况、文件、合规要求和最终落地成本。' })}</p></div></div></article></div>

        <aside className="h-fit rounded-[24px] border border-black/7 bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.07)] lg:sticky lg:top-28"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Opportunity snapshot</p><dl className="mt-6 grid grid-cols-2 gap-3">{details.map(([label, value]) => <div key={label} className="rounded-xl bg-black/[0.035] p-4"><dt className="text-xs text-foreground/45">{label}</dt><dd className="mt-1 text-sm font-bold leading-6">{value}</dd></div>)}</dl><h3 className="mt-8">{text({ en: 'Suitable for', zh: '适合什么客户' })}</h3><p className="mt-3 text-sm leading-7">{text({ en: vehicle.recommendedFor || 'Buyers who value this specification and can allow time for condition and landed-cost confirmation.', zh: vehicle.zhRecommendedFor || '适合重视该车型配置，并愿意预留时间确认车况与落地成本的买家。' })}</p><ul className="mt-6 space-y-3">{[{ en: 'Condition reviewed before deposit', zh: '订金前确认车况' }, { en: 'Landed estimate prepared for your brief', zh: '按你的需求确认落地价' }, { en: 'New Zealand compliance checked', zh: '确认新西兰合规要求' }].map((item) => <li key={item.en} className="flex gap-3 text-sm"><CheckCircle2 className="h-5 w-5 flex-none text-primary"/>{text(item)}</li>)}</ul><Link to={`/contact?source=weekly-report&vehicle=${encodeURIComponent(vehicle.title)}#quote`} className="button-primary mt-8 w-full">{text({ en: 'Request a Quote', zh: '咨询这辆车' })}<ArrowRight className="h-5 w-5"/></Link><button type="button" onClick={() => void handleShare()} className="button-secondary mt-3 w-full"><Share2 className="h-4 w-4"/>{text({ en: 'Share This Vehicle', zh: '分享这辆车' })}</button></aside></div></section>
    </div>
  );
}
