import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, MapPin, Newspaper, Search, Ship, Sparkles, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router';
import { getJapanSpecialOrderImages, type JapanSpecialOrderVehicle, type JapanWeeklyReportState, useJapanSpecialOrders } from '../hooks/useJapanSpecialOrders';
import { useLanguage } from '../components/SiteTranslator';

type VehicleCategory = NonNullable<JapanSpecialOrderVehicle['category']>;
type VehicleCategoryFilter = 'all' | VehicleCategory;

const VEHICLE_CATEGORIES: Array<{
  value: VehicleCategoryFilter;
  en: string;
  zh: string;
}> = [
  { value: 'all', en: 'All recommendations', zh: '全部推荐' },
  { value: 'price-opportunity', en: 'Price opportunities', zh: '价格机会' },
  { value: 'japan-rare', en: 'Rare in Japan', zh: '日本稀有' },
  { value: 'special-model', en: 'Special models', zh: '特别车型' },
];

function getVehicleCategory(vehicle: JapanSpecialOrderVehicle): VehicleCategory {
  if (vehicle.category) return vehicle.category;
  const numericYear = Number.parseInt(vehicle.year, 10);
  return Number.isFinite(numericYear) && numericYear < 2000 ? 'japan-rare' : 'price-opportunity';
}

function getCategoryLabel(category: VehicleCategory, zh: boolean) {
  const match = VEHICLE_CATEGORIES.find((item) => item.value === category);
  return zh ? match?.zh : match?.en;
}

function vehicleStatus(vehicle: JapanSpecialOrderVehicle, index: number, zh: boolean) {
  const status = vehicle.status.toLowerCase();
  if (status.includes('arrived')) return zh ? '已抵达新西兰' : 'ARRIVED IN NEW ZEALAND';
  if (status.includes('transit')) return zh ? '运输途中' : 'IN TRANSIT';
  if (status.includes('purchased')) return zh ? '已在日本采购' : 'PURCHASED IN JAPAN';
  return index === 0 ? (zh ? '本周推荐' : 'WEEKLY PICK') : (zh ? '日本可选车源' : 'AVAILABLE IN JAPAN');
}

function WeeklyVehicleCard({
  vehicle,
  index,
  zh,
  arrived = false,
  onOpen,
}: {
  vehicle: JapanSpecialOrderVehicle;
  index: number;
  zh: boolean;
  arrived?: boolean;
  onOpen: () => void;
}) {
  const { text } = useLanguage();

  return (
    <button type="button" onClick={onOpen} className="group relative aspect-[16/10] overflow-hidden rounded-[24px] border border-black/8 bg-black text-left shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <img src={getJapanSpecialOrderImages(vehicle)[0]} alt={text({ en: vehicle.title, zh: vehicle.zhTitle })} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] group-hover:opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-70" />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] ${arrived ? 'bg-sky-700 text-white' : 'bg-[#101113]/90 text-primary'}`}>
          {arrived ? text({ en: 'CUSTOMER ORDER · ARRIVED', zh: '客户已订 · 已到港' }) : vehicleStatus(vehicle, index, zh)}
        </span>
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-black shadow-lg">
          {text({ en: 'View details', zh: '查看详情' })}<ArrowRight className="h-4 w-4" />
        </span>
    </button>
  );
}

function LibraryVehicleCard({
  vehicle,
  issueNumber,
  publishedAt,
  onOpen,
}: {
  vehicle: JapanSpecialOrderVehicle;
  issueNumber: string;
  publishedAt: string;
  onOpen: () => void;
}) {
  const { text, language } = useLanguage();
  const isSold = vehicle.availability === 'sold';
  const isPaused = vehicle.availability === 'paused';
  const category = getVehicleCategory(vehicle);

  return (
    <article className="group overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.06)]">
      <button type="button" onClick={onOpen} className="relative block aspect-[16/10] w-full overflow-hidden bg-[#111214] text-left">
        <img
          src={getJapanSpecialOrderImages(vehicle)[0]}
          alt={text({ en: vehicle.title, zh: vehicle.zhTitle })}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black">
          {getCategoryLabel(category, language === 'zh')}
        </span>
        {isSold || isPaused ? (
          <span className="absolute right-4 top-4 rounded-full bg-black/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            {text({
              en: isSold ? 'Sold' : 'Recommendation paused',
              zh: isSold ? '已售出' : '暂停推荐',
            })}
          </span>
        ) : null}
      </button>
      <div className="p-5">
        <p className="text-xs text-foreground/45">
          {text({ en: `Featured in Issue ${issueNumber}`, zh: `收录于第 ${issueNumber} 期` })} · {publishedAt}
        </p>
        <h3 className="mt-2 text-xl">{text({ en: vehicle.title, zh: vehicle.zhTitle })}</h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/55">
          <span>{vehicle.year}</span>
          <span>{vehicle.mileage}</span>
          <span>{vehicle.landedEstimate || vehicle.price}</span>
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-7 text-foreground/68">
          {text({
            en: vehicle.recommendation || vehicle.summary,
            zh: vehicle.zhRecommendation || vehicle.zhSummary,
          })}
        </p>
        <button type="button" onClick={onOpen} className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
          {text({ en: 'View vehicle analysis', zh: '查看车辆分析' })}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

function VehicleDetailModal({
  vehicle,
  arrived,
  onClose,
}: {
  vehicle: JapanSpecialOrderVehicle;
  arrived: boolean;
  onClose: () => void;
}) {
  const { text } = useLanguage();
  const images = getJapanSpecialOrderImages(vehicle);
  const [activeImage, setActiveImage] = useState(images[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isUnavailable = vehicle.availability === 'sold' || vehicle.availability === 'paused';
  const previewIndex = previewImage ? Math.max(0, images.indexOf(previewImage)) : 0;

  const changePreviewImage = (direction: -1 | 1) => {
    const nextIndex = (previewIndex + direction + images.length) % images.length;
    setPreviewImage(images[nextIndex]);
    setActiveImage(images[nextIndex]);
  };

  useEffect(() => {
    if (!previewImage || images.length < 2) return;
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') changePreviewImage(-1);
      if (event.key === 'ArrowRight') changePreviewImage(1);
    };
    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [previewImage, previewIndex, images.length]);
  const details = arrived
    ? [
        [text({ en: 'Year', zh: '年份' }), vehicle.year],
        [text({ en: 'Mileage', zh: '里程' }), vehicle.mileage],
        [text({ en: 'Current status', zh: '当前状态' }), text({ en: 'Customer order · compliance in progress', zh: '客户已订／合规处理中' })],
        [text({ en: 'Location', zh: '所在地' }), vehicle.location],
      ]
    : [
        [text({ en: 'Year', zh: '年份' }), vehicle.year],
        [text({ en: 'Mileage', zh: '里程' }), vehicle.mileage],
        [text({ en: 'Japan price', zh: '日本价格' }), vehicle.japanPrice || vehicle.price],
        [text({ en: 'Est. landed', zh: '预计落地价' }), vehicle.landedEstimate || text({ en: 'Confirm with Inno', zh: '联系确认' })],
      ];

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
        <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#f6f1e8] shadow-[0_35px_120px_rgba(0,0,0,.55)]">
          <header className="flex flex-none items-center justify-between border-b border-white/10 bg-[#141517] px-5 py-4 text-white sm:px-6">
            <div><p className="!text-[10px] font-bold uppercase tracking-[0.16em] !text-primary">{arrived ? 'Customer arrival' : 'Weekly pick'}</p><p className="mt-1 !font-bold !text-white">{text({ en: vehicle.title, zh: vehicle.zhTitle })}</p></div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white hover:text-black" aria-label={text({ en: 'Close vehicle details', zh: '关闭车辆详情' })}><X className="h-5 w-5" /></button>
          </header>
          <div className="min-h-0 overflow-x-hidden overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className="min-w-0 overflow-hidden bg-[#111214] p-4 sm:p-6">
              <button type="button" onClick={() => setPreviewImage(activeImage)} className="group relative block w-full overflow-hidden rounded-2xl bg-black">
                <img src={activeImage} alt={text({ en: vehicle.title, zh: vehicle.zhTitle })} className="h-[min(58vh,560px)] w-full object-contain transition duration-300 group-hover:scale-[1.01] group-hover:opacity-90" />
                <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-2 text-xs font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">{text({ en: 'View large image', zh: '查看大图' })}</span>
              </button>
              {images.length > 1 ? (
                <div className="mt-4 flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2">
                  {images.map((image, index) => (
                    <button key={image} type="button" onClick={() => setActiveImage(image)} className={`w-24 flex-none overflow-hidden rounded-xl border-2 transition sm:w-28 ${activeImage === image ? 'border-primary shadow-[0_0_0_3px_rgba(199,162,74,.15)]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={image} alt={`${vehicle.title} ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="min-w-0 bg-[#fbf8f2] p-6 sm:p-8 lg:p-9">
            <p className="flex items-center gap-2 !text-xs !text-foreground/50"><MapPin className={`h-4 w-4 ${arrived ? 'text-sky-700' : 'text-primary'}`} />{vehicle.location}</p>
            <h2 className="mt-3 !text-3xl sm:!text-4xl">{text({ en: vehicle.title, zh: vehicle.zhTitle })}</h2>
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/8 text-sm">{details.map(([label, value], index) => <div key={label} className={arrived && index === 2 ? 'bg-sky-50 p-4' : !arrived && index === 3 ? 'bg-primary/12 p-4' : 'bg-white p-4'}><span className="block text-xs text-foreground/45">{label}</span><strong>{value}</strong></div>)}</div>
            <div className="mt-6">
              <p className={`!text-[10px] font-bold uppercase tracking-[0.14em] ${arrived ? '!text-sky-700' : '!text-primary'}`}>{text({ en: arrived ? 'Customer order update' : 'Why we picked it', zh: arrived ? '客户订单进度' : '推荐理由' })}</p>
              <p className="mt-2 !text-sm !leading-7">{arrived ? text({ en: `This customer-ordered ${vehicle.title} has arrived in New Zealand and is now moving through local compliance and handover preparation.`, zh: `这台客户订购的 ${vehicle.zhTitle || vehicle.title} 已抵达新西兰，目前正在进行本地合规及交付准备。` }) : text({ en: vehicle.recommendation || vehicle.summary, zh: vehicle.zhRecommendation || vehicle.zhSummary })}</p>
            </div>
            {arrived ? (
              <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <p className="!text-[10px] font-bold uppercase tracking-[0.14em] !text-sky-700">{text({ en: 'Already reserved for a customer', zh: '该车辆已有客户订购' })}</p>
                <p className="mt-2 !text-sm !leading-7 !text-sky-950">{text({ en: 'This vehicle is not available for sale. It is shown as a real example of Inno’s sourcing, shipping and New Zealand arrival process.', zh: '该车辆并非在售现车，此处用于展示 Inno 从海外找车、运输到新西兰到港及后续合规的真实服务进度。' })}</p>
              </div>
            ) : (
              <>
                {vehicle.recommendedFor || vehicle.zhRecommendedFor ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="!text-[10px] font-bold uppercase tracking-[0.14em] !text-emerald-700">{text({ en: 'Best for', zh: '适合人群' })}</p><p className="mt-1 !text-sm !font-semibold !text-emerald-950">{text({ en: vehicle.recommendedFor || '', zh: vehicle.zhRecommendedFor || '' })}</p></div> : null}
                <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4"><p className="!text-[10px] font-bold uppercase tracking-[0.14em] !text-orange-700">{text({ en: 'Confirm before buying', zh: '购买前确认' })}</p><p className="mt-1 !text-sm !leading-7 !text-orange-950">{text({ en: vehicle.risk || 'Availability, condition and documents require confirmation.', zh: vehicle.zhRisk || '需要确认库存、车况和相关文件。' })}</p></div>
              </>
            )}
            {isUnavailable && !arrived ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {text({
                    en: vehicle.availability === 'sold' ? 'This vehicle has been sold, but we can find another.' : 'This recommendation is currently paused.',
                    zh: vehicle.availability === 'sold' ? '这台车已售出，但我们可以继续寻找同款。' : '这台车目前暂停推荐，但仍保留历史分析。',
                  })}
                </p>
              </div>
            ) : null}
            <Link to={`/contact?source=${arrived || isUnavailable ? 'find-similar-weekly-vehicle' : 'inno-auto-weekly'}&vehicle=${encodeURIComponent(vehicle.title)}#quote`} className={arrived ? 'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 font-bold text-white hover:bg-sky-800' : 'button-primary mt-5 w-full'}>{text({ en: arrived || isUnavailable ? 'Find a Similar Vehicle' : 'Ask About This Vehicle', zh: arrived || isUnavailable ? '帮我寻找同款' : '咨询这台车' })}<ArrowRight className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </div>
      {previewImage ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-3 backdrop-blur-lg" onMouseDown={(event) => event.currentTarget === event.target && setPreviewImage(null)}>
          <button type="button" onClick={() => setPreviewImage(null)} className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black" aria-label={text({ en: 'Close large image', zh: '关闭大图' })}><X className="h-6 w-6" /></button>
          {images.length > 1 ? (
            <>
              <button type="button" onClick={() => changePreviewImage(-1)} className="absolute left-3 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur hover:bg-white hover:text-black sm:left-6" aria-label={text({ en: 'Previous image', zh: '上一张图片' })}><ChevronLeft className="h-8 w-8" /></button>
              <button type="button" onClick={() => changePreviewImage(1)} className="absolute right-3 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur hover:bg-white hover:text-black sm:right-6" aria-label={text({ en: 'Next image', zh: '下一张图片' })}><ChevronRight className="h-8 w-8" /></button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-xs font-bold text-white backdrop-blur">{previewIndex + 1} / {images.length}</span>
            </>
          ) : null}
          <img src={previewImage} alt={text({ en: vehicle.title, zh: vehicle.zhTitle })} className="max-h-[92vh] max-w-[96vw] rounded-xl object-contain shadow-2xl" />
        </div>
      ) : null}
    </>
  );
}

export function WeeklyReport() {
  const { text, language } = useLanguage();
  const { reports, isLoadingCloudVehicles } = useJapanSpecialOrders();
  const [selectedReport, setSelectedReport] = useState<JapanWeeklyReportState | null>(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<{ vehicle: JapanSpecialOrderVehicle; arrived: boolean } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategoryFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const arrivedVehicles = selectedReport?.arrivedVehicles ?? [];
  const vehicleLibrary = useMemo(() => {
    const uniqueVehicles = new Map<string, {
      vehicle: JapanSpecialOrderVehicle;
      issueNumber: string;
      publishedAt: string;
    }>();

    reports.forEach((report) => {
      report.vehicles.forEach((vehicle) => {
        if (!uniqueVehicles.has(vehicle.slug)) {
          uniqueVehicles.set(vehicle.slug, {
            vehicle,
            issueNumber: report.issueNumber,
            publishedAt: report.publishedAt,
          });
        }
      });
    });

    return Array.from(uniqueVehicles.values());
  }, [reports]);
  const filteredVehicleLibrary = useMemo(() => {
    const normalizedSearch = vehicleSearch.trim().toLowerCase();
    return vehicleLibrary.filter(({ vehicle }) => {
      const matchesCategory =
        categoryFilter === 'all' || getVehicleCategory(vehicle) === categoryFilter;
      const matchesAvailability =
        availabilityFilter === 'all' || (vehicle.availability ?? 'available') === 'available';
      const matchesSearch =
        !normalizedSearch ||
        [vehicle.title, vehicle.zhTitle, vehicle.year, vehicle.summary, vehicle.zhSummary]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }, [availabilityFilter, categoryFilter, vehicleLibrary, vehicleSearch]);

  useEffect(() => {
    if (!selectedReport && !selectedVehicleDetail) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedVehicleDetail) setSelectedVehicleDetail(null);
      else setSelectedReport(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedReport, selectedVehicleDetail]);

  return (
    <div className="min-h-screen bg-[#f6f1e8] pt-20">
      <section className="relative overflow-hidden bg-[#0d0e10] px-4 py-16 text-white sm:py-24">
        <div className="absolute -right-32 -top-36 h-[520px] w-[520px] rounded-full bg-primary/15 blur-[110px]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="section-shell relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">New Arrivals · Weekly Picks · Market Updates</p>
            <h1 className="mt-5 max-w-5xl !text-white">INNO AUTO <span className="text-primary">WEEKLY</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              {text({
                en: 'Open an issue for this week’s vehicles, landed-cost guidance, buying notes and real progress from the Inno team.',
                zh: '打开任意一期，查看本周车辆、落地成本、购买建议以及 Inno 团队的真实进展。',
              })}
            </p>
          </div>
          <div className="rounded-[24px] border border-primary/25 bg-primary/[0.08] p-6">
            <p className="!text-xs font-bold uppercase tracking-[0.18em] !text-primary">{text({ en: 'Built for buyers', zh: '为买家而设计' })}</p>
            <p className="mt-4 !text-lg !font-semibold !leading-8 !text-white">
              {text({ en: 'What is available, what it may cost, who it suits and what to confirm before buying.', zh: '有什么车、预计多少钱、适合谁，以及购买前需要确认什么。' })}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="section-shell">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker"><Newspaper className="h-4 w-4" />Weekly issues</p>
              <h2 className="mt-5">{text({ en: 'Choose a week to open.', zh: '选择一期周报打开查看。' })}</h2>
            </div>
            <p className="text-sm text-foreground/50">{isLoadingCloudVehicles ? text({ en: 'Loading latest issues…', zh: '正在获取最新周报…' }) : `${reports.length} ${text({ en: 'issues', zh: '期周报' })}`}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report, index) => {
              const cover = report.vehicles[0] ? getJapanSpecialOrderImages(report.vehicles[0])[0] : '';
              return (
                <button
                  key={`${report.issueNumber}-${index}`}
                  type="button"
                  onClick={() => { setSelectedVehicleDetail(null); setSelectedReport(report); }}
                  className="group overflow-hidden rounded-[26px] border border-black/8 bg-white text-left shadow-[0_18px_55px_rgba(0,0,0,0.07)] hover:-translate-y-1 hover:border-primary/45"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#111214]">
                    {cover ? <img src={cover} alt="" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.04]" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                    <div className="absolute left-5 top-5 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-black">
                      {index === 0 ? text({ en: 'Latest issue', zh: '最新一期' }) : `Issue ${report.issueNumber}`}
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="!text-xs !font-bold !uppercase !tracking-[0.16em] !text-primary">Inno Auto Weekly</p>
                      <h3 className="mt-2 !text-2xl !text-white">Issue {report.issueNumber}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs text-foreground/48">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{report.publishedAt}</span>
                      <span>{report.vehicles.length} {text({ en: 'vehicles', zh: '台车' })}</span>
                    </div>
                    <p className="mt-4 line-clamp-2 !text-sm !leading-7">{text({ en: report.marketSummary, zh: report.zhMarketSummary })}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">{text({ en: 'Open full issue', zh: '打开完整周报' })}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-black/7 bg-[#efe8dc] px-4 py-16 sm:py-24">
        <div className="section-shell">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="section-kicker"><Search className="h-4 w-4" />Vehicle library</p>
              <h2 className="mt-5">{text({ en: 'Explore every vehicle we have featured.', zh: '浏览往期周报收录的推荐车辆。' })}</h2>
              <p className="mt-4 max-w-3xl leading-7 text-foreground/60">
                {text({
                  en: 'Each vehicle stays in the library after its weekly issue. Sold vehicles remain as useful sourcing examples, with an option to ask us to find another.',
                  zh: '每周发布过的车辆都会保留在车库中。即使车辆已经售出，历史分析仍会保留，你也可以让我们继续寻找同款。',
                })}
              </p>
            </div>
            <p className="text-sm text-foreground/50">
              {filteredVehicleLibrary.length} / {vehicleLibrary.length} {text({ en: 'vehicles', zh: '台车辆' })}
            </p>
          </div>

          <div className="mt-8 rounded-[24px] border border-black/8 bg-white/70 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/35" />
                <input
                  type="search"
                  value={vehicleSearch}
                  onChange={(event) => setVehicleSearch(event.target.value)}
                  placeholder={text({ en: 'Search model, year or keyword', zh: '搜索车型、年份或关键词' })}
                  className="w-full rounded-xl border border-black/10 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-primary"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setCategoryFilter(category.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      categoryFilter === category.value
                        ? 'border-primary bg-primary text-black'
                        : 'border-black/10 bg-white text-foreground/60 hover:border-primary/60'
                    }`}
                  >
                    {text({ en: category.en, zh: category.zh })}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAvailabilityFilter((current) => current === 'all' ? 'available' : 'all')
                  }
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                    availabilityFilter === 'available'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-black/10 bg-white text-foreground/60 hover:border-emerald-500'
                  }`}
                >
                  {text({ en: 'Currently available', zh: '当前可售' })}
                </button>
              </div>
            </div>
          </div>

          {filteredVehicleLibrary.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredVehicleLibrary.map(({ vehicle, issueNumber, publishedAt }) => (
                <LibraryVehicleCard
                  key={vehicle.slug}
                  vehicle={vehicle}
                  issueNumber={issueNumber}
                  publishedAt={publishedAt}
                  onOpen={() => setSelectedVehicleDetail({ vehicle, arrived: false })}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-black/15 bg-white/55 p-10 text-center">
              <p className="font-semibold">{text({ en: 'No vehicles match these filters.', zh: '没有符合当前筛选条件的车辆。' })}</p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setAvailabilityFilter('all');
                  setVehicleSearch('');
                }}
                className="mt-4 text-sm font-bold text-primary"
              >
                {text({ en: 'Clear filters', zh: '清除筛选' })}
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedReport ? (
        <div className="fixed inset-0 z-[100] bg-black/75 p-0 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label={`Inno Auto Weekly Issue ${selectedReport.issueNumber}`} onMouseDown={(event) => event.currentTarget === event.target && setSelectedReport(null)}>
          <div className="mx-auto h-full max-w-7xl overflow-y-auto bg-[#f6f1e8] shadow-2xl sm:rounded-[28px]">
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0d0e10]/95 px-5 py-4 text-white backdrop-blur-xl sm:px-8">
              <div>
                <p className="!text-[10px] font-bold uppercase tracking-[0.18em] !text-primary">Inno Auto Weekly</p>
                <p className="!text-sm font-bold !text-white">Issue {selectedReport.issueNumber} · {selectedReport.publishedAt}</p>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white hover:text-black" aria-label={text({ en: 'Close weekly report', zh: '关闭周报' })}><X className="h-5 w-5" /></button>
            </header>

            <section className="bg-[#0d0e10] px-5 py-12 text-white sm:px-10 sm:py-16">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{text({ en: 'This week in one sentence', zh: '本周一句话结论' })}</p>
                  <h2 className="mt-5 max-w-4xl !text-white">{text({ en: selectedReport.marketSummary, zh: selectedReport.zhMarketSummary })}</h2>
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
                  <div className="bg-white/[0.05] p-5"><CalendarDays className="h-5 w-5 text-primary" /><p className="mt-4 !text-xs !text-white/40">{text({ en: 'Published', zh: '发布时间' })}</p><p className="!text-sm !font-bold !text-white">{selectedReport.publishedAt}</p></div>
                  <div className="bg-white/[0.05] p-5"><Sparkles className="h-5 w-5 text-primary" /><p className="mt-4 !text-xs !text-white/40">{text({ en: 'Selected', zh: '本期精选' })}</p><p className="!text-sm !font-bold !text-white">{selectedReport.vehicles.length} {text({ en: 'vehicles', zh: '台车辆' })}</p></div>
                </div>
              </div>
            </section>

            {arrivedVehicles.length > 0 ? (
              <section className="border-b border-sky-100 bg-sky-50 px-5 py-10 sm:px-10 sm:py-12">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700"><Ship className="h-4 w-4" />Customer arrivals</p>
                  <h2 className="mt-5">{text({ en: 'Customer vehicles arriving in New Zealand.', zh: '本周客户订购车辆到港。' })}</h2>
                  <p className="mt-3 max-w-3xl !text-sm !leading-7 !text-slate-500">{text({ en: 'These vehicles have already been ordered by customers and are not available for sale. Follow their real progress from arrival through compliance and handover.', zh: '这些车辆均已由客户订购，并非在售现车。这里记录车辆抵达新西兰、进入合规流程直至准备交付的真实进度。' })}</p>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  {arrivedVehicles.map((vehicle, index) => (
                    <WeeklyVehicleCard key={vehicle.slug} vehicle={vehicle} index={index} zh={language === 'zh'} arrived onOpen={() => setSelectedVehicleDetail({ vehicle, arrived: true })} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="px-5 py-12 sm:px-10 sm:py-16">
              <p className="section-kicker"><Sparkles className="h-4 w-4" />Weekly picks</p>
              <h2 className="mt-5">{text({ en: 'Vehicles worth your attention.', zh: '本周值得关注的车辆。' })}</h2>
              <div className="mt-9 grid gap-6 lg:grid-cols-2">
                {selectedReport.vehicles.map((vehicle, index) => (
                  <WeeklyVehicleCard key={vehicle.slug} vehicle={vehicle} index={index} zh={language === 'zh'} onOpen={() => setSelectedVehicleDetail({ vehicle, arrived: false })} />
                ))}
              </div>
            </section>

            <section className="bg-[#111214] px-5 py-12 text-white sm:px-10 sm:py-16">
              <div className="grid gap-9 lg:grid-cols-[0.7fr_1.3fr]">
                <div><p className="section-kicker"><Newspaper className="h-4 w-4" />This week at Inno</p><h2 className="mt-5 !text-white">{text({ en: 'Real work, clearly updated.', zh: '本周真实工作进展。' })}</h2></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(language === 'zh' ? selectedReport.zhWeeklyUpdates : selectedReport.weeklyUpdates)?.map((note, index) => <article key={note} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5"><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-black">{String(index + 1).padStart(2, '0')}</span><p className="!text-sm !leading-7 !text-white/68">{note}</p></article>)}
                </div>
              </div>
            </section>

            <section className="px-5 py-12 sm:px-10 sm:py-16">
              <div className="grid gap-9 lg:grid-cols-[0.7fr_1.3fr]">
                <div><p className="section-kicker"><TrendingUp className="h-4 w-4" />Market watch</p><h2 className="mt-5">{text({ en: 'What matters this week.', zh: '本周真正重要的市场变化。' })}</h2><p className="mt-4 flex items-center gap-2 !text-sm"><Clock3 className="h-4 w-4" />{selectedReport.dataUpdatedAt}</p></div>
                <div className="space-y-3">
                  {(language === 'zh' ? selectedReport.zhMarketNotes : selectedReport.marketNotes).map((note, index) => <article key={`${index}-${note}`} className="flex gap-4 rounded-2xl border border-black/8 bg-white p-5"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" /><p className="!font-medium !text-foreground">{note}</p></article>)}
                </div>
              </div>
            </section>

            <section className="bg-[#0d0e10] px-5 py-10 text-white sm:px-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div><p className="!text-xs font-bold uppercase tracking-[0.18em] !text-primary">What’s next</p><p className="mt-2 !text-lg !font-semibold !text-white">{text({ en: selectedReport.nextWeekTeaser || 'New vehicle opportunities every week.', zh: selectedReport.zhNextWeekTeaser || '每周更新新的车辆机会。' })}</p></div>
                <Link to="/contact?source=inno-auto-weekly#quote" className="button-primary">{text({ en: 'Tell Us What You Want', zh: '告诉我们你想找什么车' })}<ArrowRight className="h-5 w-5" /></Link>
              </div>
            </section>
          </div>
        </div>
      ) : null}
      {selectedVehicleDetail ? (
        <VehicleDetailModal
          vehicle={selectedVehicleDetail.vehicle}
          arrived={selectedVehicleDetail.arrived}
          onClose={() => setSelectedVehicleDetail(null)}
        />
      ) : null}
    </div>
  );
}
