import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLanguage } from '../components/SiteTranslator';
import { getJapanSpecialOrderImages, useJapanSpecialOrders } from '../hooks/useJapanSpecialOrders';

export function WeeklyVehicleDetail() {
  const { issue, slug } = useParams();
  const { reports } = useJapanSpecialOrders();
  const { text } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const matchedReport = reports.find((item) => item.issueNumber === issue?.replace('issue-', ''))
    ?? reports.find((item) => item.vehicles.some((candidate) => candidate.slug === slug))
    ?? reports[0];
  const vehicle = matchedReport?.vehicles.find((candidate) => candidate.slug === slug);

  if (!vehicle) {
    return (
      <div className="px-4 pb-24 pt-40 text-center">
        <h1>{text({ en: 'Vehicle not found', zh: '未找到该车辆' })}</h1>
        <Link to="/selected-vehicles" className="button-primary mt-8">
          {text({ en: 'Back to selected vehicles', zh: '返回甄选车型库' })}
        </Link>
      </div>
    );
  }

  const images = getJapanSpecialOrderImages(vehicle);
  const activeImage = images[activeImageIndex] ?? images[0];
  const details = [
    [text({ en: 'Year', zh: '年份' }), vehicle.year],
    [text({ en: 'Mileage', zh: '公里数' }), vehicle.mileage],
    [text({ en: 'Japan price', zh: '日本价格' }), vehicle.japanPrice || vehicle.price],
    [text({ en: 'Estimated landed', zh: '预计落地价' }), vehicle.landedEstimate || text({ en: 'Confirm with Inno', zh: '联系 Inno 确认' })],
  ];

  const changeImage = (direction: -1 | 1) => {
    setActiveImageIndex((current) => (current + direction + images.length) % images.length);
  };

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: vehicle.title, url: window.location.href });
    else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] pb-24 pt-24 text-[#171716] sm:pt-28">
      <main className="section-shell px-4">
        <Link to="/selected-vehicles" className="inline-flex items-center gap-2 text-sm font-semibold text-black/55 transition hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          {text({ en: 'Back to selected vehicles', zh: '返回甄选车型库' })}
        </Link>

        <section className="pb-8 pt-10 sm:pb-10">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(620px,1.28fr)]">
            <div>
              <div className="inline-flex rounded-full border border-[#d4a83e]/35 bg-[#fff8e8] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b48319]">
                INNO SELECT · {issue?.replace('issue-', 'Issue ')}
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#bd8c22]">Vehicle profile</p>
              <h1 className="mt-4 max-w-3xl text-[clamp(2.5rem,5vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.055em]">
                {text({ en: vehicle.title, zh: vehicle.zhTitle })}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-black/60">
                {text({ en: vehicle.summary, zh: vehicle.zhSummary })}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {details.map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-2xl border border-black/7 bg-white/85 px-4 py-5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.17em] text-black/45">{label}</dt>
                  <dd className="mt-2 break-words text-sm font-bold leading-5 sm:text-base">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_28px_80px_rgba(55,42,18,0.12)] lg:grid lg:grid-cols-[minmax(0,1.06fr)_minmax(390px,0.94fr)]">
          <div className="flex min-w-0 flex-col bg-[#ebe6dd] p-4 sm:p-7 lg:p-8">
            <div className="relative flex min-h-[360px] flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-white/60 sm:min-h-[500px] lg:min-h-[590px]">
              <img
                src={activeImage}
                alt={`${text({ en: vehicle.title, zh: vehicle.zhTitle })} ${activeImageIndex + 1}`}
                className="h-full max-h-[640px] w-full object-contain"
              />
              {images.length > 1 ? (
                <>
                  <button type="button" onClick={() => changeImage(-1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-md transition hover:bg-[#d2a747]" aria-label={text({ en: 'Previous image', zh: '上一张图片' })}>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => changeImage(1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-md transition hover:bg-[#d2a747]" aria-label={text({ en: 'Next image', zh: '下一张图片' })}>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button key={`${image}-${index}`} type="button" onClick={() => setActiveImageIndex(index)} className={`w-14 flex-none overflow-hidden rounded-lg border-2 bg-white transition ${index === activeImageIndex ? 'border-[#d2a747]' : 'border-transparent opacity-55 hover:opacity-100'}`} aria-label={text({ en: `View image ${index + 1}`, zh: `查看第 ${index + 1} 张图片` })}>
                    <img src={image} alt="" className="aspect-[4/3] w-full object-cover" />
                  </button>
                ))}
              </div>
              <span className="flex-none rounded-full bg-white px-4 py-2 text-xs font-bold shadow-sm">Photo {activeImageIndex + 1} / {images.length}</span>
            </div>
          </div>

          <aside className="flex flex-col p-6 sm:p-9 lg:p-10">
            <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b48319]">Vehicle status</p>
                <p className="mt-2 text-xl font-bold">{vehicle.status}</p>
              </div>
              <div className="text-right text-xs leading-5 text-black/45">
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Updated</span>
                <p>{vehicle.updatedAt || matchedReport?.dataUpdatedAt}</p>
              </div>
            </div>

            <div className="py-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/45">Why this vehicle</p>
              <p className="mt-4 leading-7 text-black/68">
                {text({ en: vehicle.recommendation || vehicle.summary, zh: vehicle.zhRecommendation || vehicle.zhSummary })}
              </p>
            </div>

            <div className="rounded-2xl border border-[#d2a747]/35 bg-[#fcfaf5] p-5">
              <h2 className="text-2xl font-bold tracking-[-0.03em]">{text({ en: 'Suitable for', zh: '适合人群' })}</h2>
              <p className="mt-3 text-sm leading-7 text-black/60">
                {text({ en: vehicle.recommendedFor || 'Buyers who value this specification and can allow time for condition and landed-cost confirmation.', zh: vehicle.zhRecommendedFor || '适合重视该车型配置，并愿意预留时间确认车况与落地成本的买家。' })}
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  { en: 'Condition reviewed before deposit', zh: '订金前确认车况' },
                  { en: 'Landed estimate prepared for your brief', zh: '按你的需求确认落地价' },
                  { en: 'New Zealand compliance checked', zh: '确认新西兰合规要求' },
                ].map((item) => (
                  <li key={item.en} className="flex gap-3 text-sm leading-6"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#c7972f]" />{text(item)}</li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-7">
              <Link to={`/contact?source=weekly-report&vehicle=${encodeURIComponent(vehicle.title)}#quote`} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d2a747] px-6 py-4 font-bold transition hover:bg-[#c49634]">
                {text({ en: 'Request This Vehicle', zh: '咨询这辆车' })}<ArrowRight className="h-5 w-5" />
              </Link>
              <button type="button" onClick={() => void handleShare()} className="mt-3 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-black/55 transition hover:text-black">
                <Share2 className="h-4 w-4" />{text({ en: 'Share This Vehicle', zh: '分享这辆车' })}
              </button>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[24px] border border-black/6 bg-white/75 p-7 sm:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b48319]">INNO SELECT NOTE</p>
            <h2 className="mt-5 text-3xl">{text({ en: 'Opportunity analysis', zh: '机会分析' })}</h2>
            <p className="mt-5 leading-8 text-black/65">{text({ en: vehicle.recommendation || vehicle.summary, zh: vehicle.zhRecommendation || vehicle.zhSummary })}</p>
          </article>
          <article className="rounded-[24px] border border-orange-200 bg-[#fff8eb] p-7 sm:p-9">
            <div className="flex gap-3"><ShieldAlert className="h-6 w-6 flex-none text-orange-700" /><div><h3 className="text-orange-950">{text({ en: 'Main risks to confirm', zh: '需要确认的主要风险' })}</h3><p className="mt-3 leading-7 text-orange-900/75">{text({ en: vehicle.risk || 'Availability, condition, documents, compliance and final landed cost require confirmation before deposit.', zh: vehicle.zhRisk || '支付订金前，需要确认库存状态、车况、文件、合规要求和最终落地成本。' })}</p></div></div>
          </article>
        </section>
      </main>
    </div>
  );
}
