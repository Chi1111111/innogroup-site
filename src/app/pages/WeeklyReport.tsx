import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, CalendarDays, Clock3, Database, Gauge, MapPin, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router';
import { getJapanSpecialOrderImages, type JapanSpecialOrderVehicle, useJapanSpecialOrders } from '../hooks/useJapanSpecialOrders';
import { useLanguage } from '../components/SiteTranslator';

function getStatusClass(status: string) {
  const value = status.toLowerCase();
  if (value.includes('expired') || value.includes('sold')) return 'bg-red-50 text-red-700 border-red-200';
  if (value.includes('review') || value.includes('confirm')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

export function WeeklyReport() {
  const { text, language } = useLanguage();
  const { report, vehicles, isLoadingCloudVehicles } = useJapanSpecialOrders();
  const [selectedVehicle, setSelectedVehicle] = useState<JapanSpecialOrderVehicle | null>(null);

  useEffect(() => {
    if (!selectedVehicle) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedVehicle(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedVehicle]);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-[#101113] px-4 py-16 text-white sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,162,74,0.18),transparent_34%)]" />
        <div className="section-shell relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"><BarChart3 className="h-4 w-4" />Weekly Japan Finds · Japan Market Weekly</div>
            <h1 className="mt-7 max-w-4xl text-white">{text({ en: 'The Japan opportunities worth a closer look this week.', zh: '本周值得进一步了解的日本车源机会。' })}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">{text({ en: report.marketSummary, zh: report.zhMarketSummary })}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#weekly-vehicles" className="button-primary">{text({ en: 'View Vehicles', zh: '查看本周车辆' })}<ArrowRight className="h-5 w-5" /></a><Link to="/contact?source=weekly-report#quote" className="button-secondary-dark">{text({ en: 'Get Weekly Updates', zh: '订阅每周更新' })}</Link></div>
          </div>

          <aside className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06] backdrop-blur-sm">
            {[{ icon: BarChart3, label: text({ en: 'Issue', zh: '期数' }), value: report.issueNumber }, { icon: CalendarDays, label: text({ en: 'Published', zh: '发布时间' }), value: report.publishedAt }, { icon: Gauge, label: text({ en: 'Selected', zh: '筛选数量' }), value: String(vehicles.length) }, { icon: RefreshCw, label: text({ en: 'FX snapshot', zh: '汇率快照' }), value: report.exchangeRate }].map((item) => { const Icon = item.icon; return <div key={item.label} className="min-h-32 border-b border-r border-white/10 p-5"><Icon className="h-5 w-5 text-primary"/><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{item.label}</p><p className="mt-1 text-sm font-bold leading-6 text-white">{item.value}</p></div>; })}
          </aside>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div><p className="section-kicker">{text({ en: 'Market observations', zh: '本周市场观察' })}</p><h2 className="mt-5">{text({ en: 'Read the market before the listings.', zh: '先了解市场，再查看车辆。' })}</h2><div className="mt-6 flex items-center gap-2 text-sm text-foreground/52"><Clock3 className="h-4 w-4" />{report.dataUpdatedAt}</div></div>
          <div className="space-y-3">{(language === 'zh' ? report.zhMarketNotes : report.marketNotes).map((note, index) => <article key={`${index}-${note}`} className="flex gap-5 rounded-xl border border-black/7 bg-white p-5"><span className="text-sm font-bold text-primary">0{index + 1}</span><p className="font-medium text-foreground">{note}</p></article>)}</div>
        </div>
      </section>

      <section id="weekly-vehicles" className="border-y border-black/6 bg-white/55 px-4 py-16 sm:py-24">
        <div className="section-shell">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-kicker">{text({ en: `Issue ${report.issueNumber}`, zh: `第 ${report.issueNumber} 期` })}</p><h2 className="mt-5">{text({ en: 'Selected opportunities', zh: '本周精选机会' })}</h2></div><p className="text-sm text-foreground/52">{isLoadingCloudVehicles ? text({ en: 'Checking latest update…', zh: '正在检查最新更新…' }) : text({ en: `${vehicles.length} vehicles selected`, zh: `共筛选 ${vehicles.length} 个车源` })}</p></div>

          <div className="grid gap-6 lg:grid-cols-2">
            {vehicles.map((vehicle, index) => (
              <button key={vehicle.slug} type="button" onClick={() => setSelectedVehicle(vehicle)} className="group overflow-hidden rounded-[24px] border border-black/7 bg-white text-left shadow-[0_20px_60px_rgba(0,0,0,0.07)] transition-all hover:-translate-y-1 hover:border-primary/40" aria-label={text({ en: `Open details for ${vehicle.title}`, zh: `打开 ${vehicle.zhTitle} 详情` })}>
                <div className="aspect-[16/10] overflow-hidden bg-black/[0.035]"><img src={getJapanSpecialOrderImages(vehicle)[0]} alt={text({ en: vehicle.title, zh: vehicle.zhTitle })} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div>
                <div className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Opportunity {String(index + 1).padStart(2, '0')}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(vehicle.status)}`}>{vehicle.status}</span></div>
                  <h3 className="mt-5 text-2xl">{text({ en: vehicle.title, zh: vehicle.zhTitle })}</h3>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-black/[0.035] p-3"><span className="block text-xs text-foreground/45">{text({ en: 'Year', zh: '年份' })}</span><strong>{vehicle.year}</strong></div><div className="rounded-xl bg-black/[0.035] p-3"><span className="block text-xs text-foreground/45">{text({ en: 'Mileage', zh: '公里数' })}</span><strong>{vehicle.mileage}</strong></div><div className="rounded-xl bg-black/[0.035] p-3"><span className="block text-xs text-foreground/45">{text({ en: 'Est. landed', zh: '预计落地价' })}</span><strong>{vehicle.landedEstimate || text({ en: 'Confirm with Inno', zh: '联系 Inno 确认' })}</strong></div><div className="rounded-xl bg-black/[0.035] p-3"><span className="block text-xs text-foreground/45">Opportunity Score</span><strong>{vehicle.opportunityScore ? `${vehicle.opportunityScore}/100` : text({ en: 'Under review', zh: '评估中' })}</strong></div></div>
                  <p className="mt-5 text-sm leading-7">{text({ en: vehicle.recommendation || vehicle.summary, zh: vehicle.zhRecommendation || vehicle.zhSummary })}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground">{text({ en: 'View Full Analysis', zh: '查看完整分析' })}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-5"><ShieldAlert className="h-5 w-5 flex-none text-orange-700"/><p className="text-sm text-orange-950">{text({ en: 'Availability, condition, exchange rate and landed cost must be reconfirmed before any deposit.', zh: '支付任何订金前，必须重新确认库存状态、车况、汇率和最终落地成本。' })}</p></div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20"><div className="section-shell grid gap-6 lg:grid-cols-2"><div className="section-card p-7"><Database className="h-6 w-6 text-primary"/><h3 className="mt-7">{text({ en: 'Weekly Report', zh: '每周周报' })}</h3><p className="mt-3">{text({ en: 'Inno’s short, manually reviewed list of opportunities and market observations.', zh: '由 Inno 人工筛选的机会清单和市场观察。' })}</p></div><Link to="/vehicles/japan-live-stock" className="group section-card p-7"><RefreshCw className="h-6 w-6 text-primary"/><h3 className="mt-7">{text({ en: 'Japan Live Stock', zh: '日本实时车源' })}</h3><p className="mt-3">{text({ en: 'The wider search database for buyers who already know what they want.', zh: '面向已有明确车型需求用户的完整搜索数据库。' })}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">{text({ en: 'Search Live Stock', zh: '搜索实时车源' })}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span></Link></div></section>

      <section className="px-4 pb-20"><div className="section-shell"><div className="border-t border-black/8 pt-10"><p className="section-kicker">{text({ en: 'Report archive', zh: '历史周报' })}</p><div className="mt-6 max-w-sm rounded-xl border border-primary/25 bg-primary/8 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Current issue</p><p className="mt-2 text-xl font-bold text-foreground">Issue {report.issueNumber}</p><p className="mt-1 text-sm">{report.publishedAt}</p></div></div></div></section>

      {selectedVehicle ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={text({ en: selectedVehicle.title, zh: selectedVehicle.zhTitle })}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedVehicle(null);
          }}
        >
          <div className="relative max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-t-[28px] bg-[#f7f5ef] shadow-2xl sm:rounded-[28px]">
            <button
              type="button"
              onClick={() => setSelectedVehicle(null)}
              className="sticky right-4 top-4 z-20 ml-auto mr-4 mt-4 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-foreground shadow-sm transition-colors hover:bg-black hover:text-white"
              aria-label={text({ en: 'Close vehicle details', zh: '关闭车辆详情' })}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="-mt-11 grid lg:grid-cols-[1.12fr_0.88fr]">
              <div className="bg-black/[0.035] p-4 pt-16 sm:p-7 sm:pt-16 lg:p-8">
                <img
                  src={getJapanSpecialOrderImages(selectedVehicle)[0]}
                  alt={text({ en: selectedVehicle.title, zh: selectedVehicle.zhTitle })}
                  className="aspect-[16/10] w-full rounded-[22px] bg-white object-contain"
                />
                {getJapanSpecialOrderImages(selectedVehicle).length > 1 ? (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {getJapanSpecialOrderImages(selectedVehicle).slice(1, 4).map((image, index) => (
                      <img
                        key={image}
                        src={image}
                        alt={`${text({ en: selectedVehicle.title, zh: selectedVehicle.zhTitle })} ${index + 2}`}
                        className="aspect-[4/3] w-full rounded-xl bg-white object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="p-6 pt-10 sm:p-9 sm:pt-12 lg:p-10 lg:pt-14">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Japan Find · Issue {report.issueNumber}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(selectedVehicle.status)}`}>
                    {selectedVehicle.status}
                  </span>
                </div>
                <h2 className="mt-5 text-3xl sm:text-4xl">
                  {text({ en: selectedVehicle.title, zh: selectedVehicle.zhTitle })}
                </h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-foreground/55">
                  <MapPin className="h-4 w-4" />{selectedVehicle.location}
                </p>

                <dl className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    [text({ en: 'Year', zh: '年份' }), selectedVehicle.year],
                    [text({ en: 'Mileage', zh: '公里数' }), selectedVehicle.mileage],
                    [text({ en: 'Japan price', zh: '日本价格' }), selectedVehicle.japanPrice || selectedVehicle.price],
                    [text({ en: 'Estimated landed', zh: '预计落地价' }), selectedVehicle.landedEstimate || text({ en: 'Confirm with Inno', zh: '联系 Inno 确认' })],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
                      <dt className="text-xs text-foreground/45">{label}</dt>
                      <dd className="mt-1 text-sm font-bold leading-6">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 border-t border-black/8 pt-6">
                  <p className="section-kicker">{text({ en: 'Why it made the report', zh: '为什么入选本期周报' })}</p>
                  <p className="mt-4 leading-7 text-foreground/75">
                    {text({
                      en: selectedVehicle.recommendation || selectedVehicle.summary,
                      zh: selectedVehicle.zhRecommendation || selectedVehicle.zhSummary,
                    })}
                  </p>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={`/contact?source=weekly-report&vehicle=${encodeURIComponent(selectedVehicle.title)}#quote`}
                    className="button-primary flex-1"
                  >
                    {text({ en: 'Request a Quote', zh: '咨询这辆车' })}<ArrowRight className="h-5 w-5" />
                  </Link>
                  <button type="button" onClick={() => setSelectedVehicle(null)} className="button-secondary flex-1">
                    {text({ en: 'Back to Weekly Report', zh: '返回周报' })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
