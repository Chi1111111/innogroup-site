import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../components/SiteTranslator';
import {
  getJapanSpecialOrderImages,
  type JapanSpecialOrderVehicle,
  useJapanSpecialOrders,
} from '../hooks/useJapanSpecialOrders';

type CollectionFilter = 'all' | 'value' | 'collector';

const COLLECTION_FILTERS: Array<{ value: CollectionFilter; en: string; zh: string }> = [
  { value: 'all', en: 'All selected vehicles', zh: '全部甄选' },
  { value: 'value', en: 'Value opportunities', zh: '价值机会' },
  { value: 'collector', en: 'Collector & special', zh: '玩家珍藏' },
];

function collectionType(vehicle: JapanSpecialOrderVehicle): Exclude<CollectionFilter, 'all'> {
  if (vehicle.category === 'price-opportunity') return 'value';
  if (vehicle.category === 'japan-rare' || vehicle.category === 'special-model') return 'collector';
  const year = Number.parseInt(vehicle.year, 10);
  return Number.isFinite(year) && year < 2000 ? 'collector' : 'value';
}

export function SelectedVehicles() {
  const { reports, isLoadingCloudVehicles } = useJapanSpecialOrders();
  const { text, language } = useLanguage();
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const vehicles = useMemo(() => {
    const unique = new Map<string, {
      vehicle: JapanSpecialOrderVehicle;
      issueNumber: string;
      publishedAt: string;
    }>();
    reports.forEach((report) => {
      report.vehicles.forEach((vehicle) => {
        if (!unique.has(vehicle.slug)) {
          unique.set(vehicle.slug, {
            vehicle,
            issueNumber: report.issueNumber,
            publishedAt: report.publishedAt,
          });
        }
      });
    });
    return Array.from(unique.values());
  }, [reports]);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vehicles.filter(({ vehicle }) => {
      const matchesType = filter === 'all' || collectionType(vehicle) === filter;
      const matchesAvailability = !availableOnly || (vehicle.availability ?? 'available') === 'available';
      const matchesSearch = !term || [vehicle.title, vehicle.zhTitle, vehicle.year, vehicle.summary, vehicle.zhSummary]
        .join(' ')
        .toLowerCase()
        .includes(term);
      return matchesType && matchesAvailability && matchesSearch;
    });
  }, [availableOnly, filter, search, vehicles]);

  return (
    <div className="min-h-screen bg-[#f6f1e8] pt-20">
      <section className="relative overflow-hidden bg-[#0d0e10] px-4 py-16 text-white sm:py-24">
        <div className="absolute -right-28 -top-28 h-[480px] w-[480px] rounded-full bg-primary/15 blur-[110px]" />
        <div className="section-shell relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">INNO SELECT · COLLECTION</p>
            <h1 className="mt-5 max-w-5xl !text-white">{text({ en: 'Selected Vehicle Collection', zh: '甄选车型库' })}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
              {text({
                en: 'Every vehicle featured in our reports, collected in one place—from strong value opportunities to rare and special enthusiast cars.',
                zh: '汇总历期周报发布过的全部车型，从具备市场优势的价值机会，到稀有、特殊的玩家车型。',
              })}
            </p>
            <Link to="/weekly-report" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-white">
              {text({ en: 'View weekly reports & arrivals', zh: '查看每周周报与到港动态' })}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={() => setFilter('value')} className="rounded-[22px] border border-primary/25 bg-primary/[0.08] p-5 text-left transition hover:border-primary/55"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">01 · Value</p><p className="mt-2 font-bold text-white">{text({ en: 'Value Opportunities', zh: '价值机会' })}</p><p className="mt-2 text-sm leading-6 text-white/50">{text({ en: 'Market gaps and stronger landed-cost positioning.', zh: '具备市场价差与落地成本优势的车型。' })}</p></button>
            <button type="button" onClick={() => setFilter('collector')} className="rounded-[22px] border border-white/12 bg-white/[0.045] p-5 text-left transition hover:border-primary/45"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">02 · Collector</p><p className="mt-2 font-bold text-white">{text({ en: 'Collector & Special', zh: '玩家珍藏' })}</p><p className="mt-2 text-sm leading-6 text-white/50">{text({ en: 'Rare, distinctive and enthusiast-grade vehicles.', zh: '稀有、特别并具有玩家价值的车型。' })}</p></button>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-20">
        <div className="section-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker"><Sparkles className="h-4 w-4" />Curated archive</p>
              <h2 className="mt-5">{text({ en: 'Find the right kind of opportunity.', zh: '按你的目标寻找合适车型。' })}</h2>
            </div>
            <p className="text-sm text-foreground/50">
              {isLoadingCloudVehicles ? text({ en: 'Loading vehicles…', zh: '正在加载车辆…' }) : `${filteredVehicles.length} / ${vehicles.length} ${text({ en: 'vehicles', zh: '台车辆' })}`}
            </p>
          </div>

          <div className="mt-8 rounded-[24px] border border-black/8 bg-white/70 p-4 shadow-sm sm:p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/35" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text({ en: 'Search model, year or keyword', zh: '搜索车型、年份或关键词' })}
                className="w-full rounded-xl border border-black/10 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {COLLECTION_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${filter === item.value ? 'border-primary bg-primary text-black' : 'border-black/10 bg-white text-foreground/60 hover:border-primary/60'}`}
                >
                  {text({ en: item.en, zh: item.zh })}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAvailableOnly((current) => !current)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${availableOnly ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-black/10 bg-white text-foreground/60 hover:border-emerald-500'}`}
              >
                {text({ en: 'Currently available', zh: '当前可售' })}
              </button>
            </div>
          </div>

          {filteredVehicles.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map(({ vehicle, issueNumber, publishedAt }) => {
                const isCollector = collectionType(vehicle) === 'collector';
                return (
                  <article key={vehicle.slug} className="group overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.06)]">
                    <Link to={`/weekly-report/issue-${issueNumber}/${vehicle.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[#111214]">
                      <img src={getJapanSpecialOrderImages(vehicle)[0]} alt={text({ en: vehicle.title, zh: vehicle.zhTitle })} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                      <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black">
                        {text({ en: isCollector ? 'Collector & special' : 'Value opportunity', zh: isCollector ? '玩家珍藏' : '价值机会' })}
                      </span>
                    </Link>
                    <div className="p-5">
                      <p className="text-xs text-foreground/45">{text({ en: `Featured in Issue ${issueNumber}`, zh: `收录于第 ${issueNumber} 期` })} · {publishedAt}</p>
                      <h3 className="mt-2 text-xl">{text({ en: vehicle.title, zh: vehicle.zhTitle })}</h3>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/55"><span>{vehicle.year}</span><span>{vehicle.mileage}</span><span>{vehicle.landedEstimate || vehicle.price}</span></div>
                      <p className="mt-4 line-clamp-2 text-sm leading-7 text-foreground/68">{text({ en: vehicle.recommendation || vehicle.summary, zh: vehicle.zhRecommendation || vehicle.zhSummary })}</p>
                      <Link to={`/weekly-report/issue-${issueNumber}/${vehicle.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold">{text({ en: 'View vehicle analysis', zh: '查看车辆分析' })}<ArrowRight className="h-4 w-4" /></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-black/15 bg-white/55 p-10 text-center">
              <p className="font-semibold">{text({ en: 'No vehicles match these filters.', zh: '没有符合当前筛选条件的车辆。' })}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
