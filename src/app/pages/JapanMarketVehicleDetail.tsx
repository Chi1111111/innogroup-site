import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { JapanMarketEnquiryForm } from '../components/JapanMarketEnquiryForm';
import { JapanMarketVehicleVisual } from '../components/JapanMarketVehicleCard';
import { useLanguage } from '../components/SiteTranslator';
import {
  formatMileage,
  formatNzd,
  getCostBreakdown,
  loadJapanMarketVehicle,
  type JapanMarketPricing,
  type JapanMarketVehicle,
  vehicleFullName,
} from '../../data/japanMarket';
import { SEO_CONFIG } from '../../config/seo';

function setHeadMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function removeHeadMeta(name: string, attribute: 'name' | 'property' = 'name') {
  document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove();
}

export function JapanMarketVehicleDetail({ vehicleId }: { vehicleId: string }) {
  const { language, text } = useLanguage();
  const [pricing, setPricing] = useState<JapanMarketPricing | null>(null);
  const [vehicle, setVehicle] = useState<JapanMarketVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadJapanMarketVehicle(vehicleId).then((result) => {
      if (!active) return;
      setVehicle(result?.vehicle ?? null);
      setPricing(result?.pricing ?? null);
      setLoading(false);
    }).catch(() => active && setLoading(false));
    return () => { active = false; };
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicle) return;
    const title = `${vehicleFullName(vehicle)} for Import from Japan | Inno Group NZ`;
    const description = `View ${vehicleFullName(vehicle)}, auction grade and estimated landed pricing for New Zealand.`;
    document.title = title;
    setHeadMeta('description', description);
    setHeadMeta('og:title', title, 'property');
    setHeadMeta('og:description', description, 'property');
    setHeadMeta('twitter:title', title);
    setHeadMeta('twitter:description', description);
    setHeadMeta('twitter:card', 'summary');
    removeHeadMeta('og:image', 'property');
    removeHeadMeta('og:image:alt', 'property');
    removeHeadMeta('og:image:width', 'property');
    removeHeadMeta('og:image:height', 'property');
    removeHeadMeta('twitter:image');
    removeHeadMeta('twitter:image:alt');

    const schema = document.createElement('script');
    schema.id = 'inno-japan-market-vehicle-schema';
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Vehicle',
      name: vehicleFullName(vehicle),
      brand: { '@type': 'Brand', name: vehicle.make },
      model: vehicle.model,
      vehicleModelDate: String(vehicle.year),
      mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'KMT' },
      color: vehicle.colour,
      fuelType: vehicle.fuelType,
      url: `${SEO_CONFIG.siteUrl}/japan-market/${vehicle.id}`,
    });
    document.getElementById(schema.id)?.remove();
    document.head.appendChild(schema);
    return () => schema.remove();
  }, [vehicle]);

  if (loading) return <main className="min-h-[70vh] pt-20"><div className="section-shell px-4 py-20"><div className="h-96 animate-pulse rounded-3xl bg-black/5" /></div></main>;
  if (!vehicle || !pricing) return <main className="min-h-[70vh] pt-20"><div className="section-shell px-4 py-24 text-center"><p className="section-kicker">Japan Market</p><h1 className="mt-6">{text({ en: 'Vehicle unavailable', zh: '暂时无法查看该车辆' })}</h1><p className="mx-auto mt-4 max-w-xl">{text({ en: 'Browse other Japan Market vehicles or ask us to source something similar.', zh: '您可以继续浏览其他日本车源，或让我们寻找相似车辆。' })}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/japan-market" className="button-primary">{text({ en: 'Browse Japan Market', zh: '浏览日本市场' })}</Link><Link to="/vehicles/find-my-car" className="button-secondary">{text({ en: 'Request a Vehicle', zh: '提交找车需求' })}</Link></div></div></main>;

  const breakdown = getCostBreakdown(vehicle, pricing);
  const specs = [
    [text({ en: 'Year', zh: '年份' }), vehicle.year],
    [text({ en: 'Make', zh: '品牌' }), vehicle.make],
    [text({ en: 'Model', zh: '车型' }), vehicle.model],
    [text({ en: 'Variant', zh: '版本' }), vehicle.variant || text({ en: 'Not listed', zh: '暂无信息' })],
    [text({ en: 'Mileage', zh: '公里数' }), formatMileage(vehicle.mileage, language)],
    [text({ en: 'Fuel Type', zh: '燃料类型' }), vehicle.fuelType],
    [text({ en: 'Engine', zh: '排量' }), vehicle.engine === 'Not listed' ? text({ en: 'Not listed', zh: '暂无信息' }) : `${vehicle.engine} cc`],
    [text({ en: 'Transmission', zh: '变速箱' }), vehicle.transmission],
    [text({ en: 'Drive Type', zh: '驱动方式' }), vehicle.driveType],
    [text({ en: 'Colour', zh: '颜色' }), vehicle.colour],
    [text({ en: 'Chassis Code', zh: '底盘编号' }), vehicle.chassisCode],
    [text({ en: 'Auction Area', zh: '拍卖地区' }), vehicle.location],
  ];
  const costRows = breakdown ? [
    [text({ en: 'Japan Vehicle Price (NZD equivalent)', zh: '日本车价（纽币换算）' }), breakdown.japanVehiclePriceNzd],
    [text({ en: 'Inno Service Fee', zh: 'Inno 服务费' }), breakdown.serviceFeeNzd],
    [text({ en: 'Shipping', zh: '运输费' }), breakdown.shippingNzd],
    ['GST', breakdown.gstNzd],
    [text({ en: 'Compliance', zh: '合规费用' }), breakdown.complianceNzd],
    [text({ en: 'Registration', zh: '注册费用' }), breakdown.registrationNzd],
    [text({ en: 'Clean Car / Emissions Cost', zh: '清洁车 / 排放费用' }), breakdown.emissionsNzd],
  ] as const : [];
  const gradeDescription = !vehicle.auctionGrade
    ? text({ en: 'No auction grade is listed. We will confirm the available inspection information before you proceed.', zh: '该车辆暂未提供拍卖评分，我们会在您继续前确认可用的检查信息。' })
    : Number(vehicle.auctionGrade) >= 4.5
      ? text({ en: 'A strong auction grade. Final condition still needs confirmation from the auction information.', zh: '拍卖评分较高，最终车况仍需结合拍卖资料确认。' })
      : Number(vehicle.auctionGrade) >= 4
        ? text({ en: 'A solid auction grade. We will confirm condition notes and repair history before purchase.', zh: '拍卖评分良好，购买前会进一步确认车况备注及维修记录。' })
        : text({ en: 'Condition can vary at this grade. We will review the auction information and explain any concerns before purchase.', zh: '这一评分的实际车况差异可能较大，购买前我们会审核拍卖资料并说明需要注意的问题。' });
  const whatsappHref = `https://wa.me/64272858065?text=${encodeURIComponent(`Hi Inno Group, I'm interested in ${vehicleFullName(vehicle)} (${vehicle.id}).`)}`;

  return (
    <main className="pb-24 pt-20 md:pb-0">
      <section className="border-b border-black/8 px-4 py-8"><div className="section-shell"><Link to="/japan-market" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground"><ArrowLeft className="h-4 w-4" />{text({ en: 'Back to Japan Market', zh: '返回日本市场' })}</Link></div></section>
      <section className="px-4 py-10 sm:py-14">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <JapanMarketVehicleVisual vehicle={vehicle} className="aspect-[16/10] rounded-3xl" />
              <div className="mt-8"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Japan Market · {vehicle.id}</p><h1 className="mt-4 text-4xl sm:text-5xl">{vehicleFullName(vehicle)}</h1></div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-black/10 bg-white/65 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">{text({ en: 'Auction Grade', zh: '拍卖评分' })}</p><div className="mt-4 flex items-end justify-between gap-5"><h2 className="text-4xl">{vehicle.auctionGrade ? `${text({ en: 'Grade', zh: '评分' })} ${vehicle.auctionGrade}` : text({ en: 'Unrated', zh: '暂无评分' })}</h2>{vehicle.auctionGrade ? <span className="rounded-full bg-[#111214] px-4 py-2 text-lg font-extrabold text-primary">{vehicle.auctionGrade}</span> : null}</div><p className="mt-4 text-sm leading-7">{gradeDescription}</p>{vehicle.interiorGrade ? <p className="mt-3 text-sm font-bold">{text({ en: `Exterior: ${vehicle.auctionGrade} · Interior: ${vehicle.interiorGrade}`, zh: `外观：${vehicle.auctionGrade} · 内饰：${vehicle.interiorGrade}` })}</p> : null}</section>

              <section className="rounded-3xl border border-primary/25 bg-[#111214] p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{text({ en: 'Estimated Landed Price', zh: '预计新西兰落地价' })}</p><h2 className="mt-4 text-4xl text-white">{formatNzd(vehicle.estimatedNzdPrice, language)}</h2><p className="mt-4 text-sm leading-7 text-white/62">{text({ en: 'Estimated total cost to import and register this vehicle in New Zealand.', zh: '预计包含车辆进口至新西兰并完成注册的总费用。' })}</p>{breakdown ? <><button type="button" onClick={() => setCostOpen((value) => !value)} className="mt-6 flex w-full items-center justify-between border-y border-white/10 py-4 text-sm font-bold text-white">{text({ en: 'View Cost Breakdown', zh: '查看费用明细' })}<ChevronDown className={`h-4 w-4 transition-transform ${costOpen ? 'rotate-180' : ''}`} /></button>{costOpen ? <div className="space-y-3 border-b border-white/10 py-5">{costRows.map(([label, amount]) => <div key={label} className="flex justify-between gap-5 text-sm"><span className="text-white/55">{label}</span><span className="font-bold text-white">{amount != null ? formatNzd(amount, language) : text({ en: 'Estimate pending', zh: '待确认' })}</span></div>)}</div> : null}</> : null}<p className="mt-5 text-xs leading-6 text-white/45">{text({ en: 'All figures are estimates. Final pricing may vary with exchange rates, shipping, compliance requirements, vehicle condition and other import costs.', zh: '所有金额均为估算，最终价格可能因汇率、运输、合规要求、实际车况及其他进口成本而变化。' })}</p></section>

              <section className="rounded-3xl border border-black/10 bg-white/65 p-6 sm:p-8"><h2 className="text-2xl">{text({ en: 'Interested in this car?', zh: '想了解这辆车？' })}</h2><p className="mt-3 text-sm">{text({ en: 'Ask about condition, pricing and the next steps to import this vehicle.', zh: '咨询车况、价格和进口下一步流程。' })}</p><button type="button" onClick={() => setEnquiryOpen(true)} className="button-primary mt-6 w-full">{text({ en: 'Enquire About This Vehicle', zh: '咨询这辆车' })}<ArrowRight className="h-5 w-5" /></button><div className="mt-5 flex gap-3 border-t border-black/8 pt-5 text-xs leading-6 text-foreground/50"><ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-primary" /><p>{text({ en: 'We usually reply within one business day. Condition and final landed cost are confirmed before you commit.', zh: '我们通常在一个工作日内回复。确认购买前，会先核实车况和最终落地费用。' })}</p></div></section>
            </aside>
          </div>

          <section className="mt-12 border-t border-black/8 pt-9"><h2 className="text-3xl">{text({ en: 'Vehicle information', zh: '车辆信息' })}</h2><dl className="mt-6 grid gap-x-10 md:grid-cols-2 lg:grid-cols-3">{specs.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-black/8 py-4"><dt className="text-sm text-foreground/50">{label}</dt><dd className="text-right text-sm font-bold text-foreground">{value}</dd></div>)}</dl></section>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-black/10 bg-[#f6f1e8]/95 p-3 shadow-[0_-16px_40px_rgba(17,17,17,0.12)] backdrop-blur-xl md:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-2 gap-2.5">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="button-secondary justify-center"><MessageCircle className="h-4 w-4" />WhatsApp</a>
          <button type="button" onClick={() => setEnquiryOpen(true)} className="button-primary justify-center">{text({ en: 'Enquire', zh: '立即咨询' })}<ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
      <JapanMarketEnquiryForm vehicle={vehicle} open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </main>
  );
}
