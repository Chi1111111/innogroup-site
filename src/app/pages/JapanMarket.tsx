import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { JapanMarketVehicleCard } from '../components/JapanMarketVehicleCard';
import { useLanguage } from '../components/SiteTranslator';
import {
  loadJapanMarketData,
  slugifyVehicleValue,
  type JapanMarketBodyType,
  type JapanMarketFuelType,
  type JapanMarketPayload,
} from '../../data/japanMarket';

const PRIMARY_MAKES = ['Toyota', 'Lexus', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche'];
const FUEL_TYPES: JapanMarketFuelType[] = ['Petrol', 'Hybrid', 'PHEV', 'EV', 'Diesel', 'Other'];
const BODY_TYPES: JapanMarketBodyType[] = ['Sedan', 'SUV', 'Hatchback', 'Wagon', 'Coupe', 'Van / MPV', 'Sports', 'Other'];
const YEARS = Array.from({ length: 37 }, (_, index) => new Date().getFullYear() - index);
const PAGE_SIZE = 24;

const PRICE_BUCKETS: Record<string, [number, number]> = {
  under20: [0, 20_000],
  '20to30': [20_000, 30_000],
  '30to40': [30_000, 40_000],
  '40to50': [40_000, 50_000],
  '50to70': [50_000, 70_000],
  over70: [70_000, Number.POSITIVE_INFINITY],
};

function toggleValue<T extends string>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function valuesFromParam<T extends string>(value: string | null, allowed: readonly T[]) {
  if (!value) return [];
  const allowedSet = new Set<string>(allowed);
  return value.split(',').filter((item): item is T => allowedSet.has(item));
}

interface FilterPanelProps {
  makes: string[];
  models: string[];
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  price: string;
  mileage: string;
  fuels: JapanMarketFuelType[];
  bodies: JapanMarketBodyType[];
  setMake: (value: string) => void;
  setModel: (value: string) => void;
  setYearFrom: (value: string) => void;
  setYearTo: (value: string) => void;
  setPrice: (value: string) => void;
  setMileage: (value: string) => void;
  setFuels: (value: JapanMarketFuelType[]) => void;
  setBodies: (value: JapanMarketBodyType[]) => void;
  clear: () => void;
}

function FilterPanel(props: FilterPanelProps) {
  const { text } = useLanguage();
  const selectClass = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-primary';
  const fuelLabel = (fuel: JapanMarketFuelType) => ({
    Petrol: text({ en: 'Petrol', zh: '汽油' }),
    Hybrid: text({ en: 'Hybrid', zh: '混合动力' }),
    PHEV: text({ en: 'PHEV', zh: '插电混动' }),
    EV: text({ en: 'EV', zh: '纯电' }),
    Diesel: text({ en: 'Diesel', zh: '柴油' }),
    Other: text({ en: 'Other', zh: '其他' }),
  })[fuel];
  const bodyLabel = (body: JapanMarketBodyType) => ({
    Sedan: text({ en: 'Sedan', zh: '轿车' }),
    SUV: 'SUV',
    Hatchback: text({ en: 'Hatchback', zh: '掀背车' }),
    Wagon: text({ en: 'Wagon', zh: '旅行车' }),
    Coupe: text({ en: 'Coupe', zh: '双门轿跑' }),
    'Van / MPV': text({ en: 'Van / MPV', zh: '厢式车 / MPV' }),
    Sports: text({ en: 'Sports', zh: '跑车' }),
    Other: text({ en: 'Other', zh: '其他' }),
  })[body];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-black/8 pb-4"><h2 className="text-xl">{text({ en: 'Filters', zh: '筛选' })}</h2><button type="button" onClick={props.clear} className="text-xs font-bold text-foreground/50 hover:text-foreground">{text({ en: 'Clear all', zh: '全部清除' })}</button></div>
      <label className="block space-y-2"><span>{text({ en: 'Make', zh: '品牌' })}</span><select value={props.make} onChange={(event) => { props.setMake(event.target.value); props.setModel(''); }} className={selectClass}><option value="">{text({ en: 'All makes', zh: '全部品牌' })}</option>{props.makes.map((make) => <option key={make} value={make}>{make === 'Other' ? text({ en: 'Other', zh: '其他品牌' }) : make}</option>)}</select></label>
      <label className="block space-y-2"><span>{text({ en: 'Model', zh: '车型' })}</span><select value={props.model} onChange={(event) => props.setModel(event.target.value)} className={selectClass} disabled={!props.make || props.make === 'Other'}><option value="">{text({ en: 'All models', zh: '全部车型' })}</option>{props.models.map((model) => <option key={model} value={model}>{model}</option>)}</select></label>
      <fieldset><legend className="mb-2">{text({ en: 'Year', zh: '年份' })}</legend><div className="grid grid-cols-2 gap-2"><select aria-label={text({ en: 'Year from', zh: '起始年份' })} value={props.yearFrom} onChange={(event) => props.setYearFrom(event.target.value)} className={selectClass}><option value="">{text({ en: 'From', zh: '从' })}</option>{YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select><select aria-label={text({ en: 'Year to', zh: '结束年份' })} value={props.yearTo} onChange={(event) => props.setYearTo(event.target.value)} className={selectClass}><option value="">{text({ en: 'To', zh: '至' })}</option>{YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></div></fieldset>
      <label className="block space-y-2"><span>{text({ en: 'Estimated NZ Price', zh: '预计新西兰价格' })}</span><select value={props.price} onChange={(event) => props.setPrice(event.target.value)} className={selectClass}><option value="">{text({ en: 'Any price', zh: '不限价格' })}</option><option value="under20">{text({ en: 'Under $20,000', zh: '$20,000 以下' })}</option><option value="20to30">$20,000–$30,000</option><option value="30to40">$30,000–$40,000</option><option value="40to50">$40,000–$50,000</option><option value="50to70">$50,000–$70,000</option><option value="over70">$70,000+</option></select></label>
      <label className="block space-y-2"><span>{text({ en: 'Mileage', zh: '公里数' })}</span><select value={props.mileage} onChange={(event) => props.setMileage(event.target.value)} className={selectClass}><option value="">{text({ en: 'Any mileage', zh: '不限公里数' })}</option><option value="20000">{text({ en: 'Under 20,000 km', zh: '20,000 公里以下' })}</option><option value="40000">{text({ en: 'Under 40,000 km', zh: '40,000 公里以下' })}</option><option value="60000">{text({ en: 'Under 60,000 km', zh: '60,000 公里以下' })}</option><option value="100000">{text({ en: 'Under 100,000 km', zh: '100,000 公里以下' })}</option></select></label>
      <fieldset><legend className="mb-3">{text({ en: 'Fuel Type', zh: '燃料类型' })}</legend><div className="grid grid-cols-2 gap-2">{FUEL_TYPES.map((fuel) => <label key={fuel} className="flex items-center gap-2 rounded-lg border border-black/8 bg-white/55 px-3 py-2 text-sm"><input type="checkbox" checked={props.fuels.includes(fuel)} onChange={() => props.setFuels(toggleValue(props.fuels, fuel))} className="accent-[#c7a24a]" />{fuelLabel(fuel)}</label>)}</div></fieldset>
      <fieldset><legend className="mb-3">{text({ en: 'Body Type', zh: '车身类型' })}</legend><div className="space-y-2">{BODY_TYPES.map((body) => <label key={body} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={props.bodies.includes(body)} onChange={() => props.setBodies(toggleValue(props.bodies, body))} className="accent-[#c7a24a]" />{bodyLabel(body)}</label>)}</div></fieldset>
    </div>
  );
}

export function JapanMarket({ initialMakeSlug = '', initialModelSlug = '' }: { initialMakeSlug?: string; initialModelSlug?: string }) {
  const { text } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payload, setPayload] = useState<JapanMarketPayload | null>(null);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const deferredQuery = useDeferredValue(query);
  const [make, setMake] = useState(() => searchParams.get('make') ?? '');
  const [model, setModel] = useState(() => searchParams.get('model') ?? '');
  const [yearFrom, setYearFrom] = useState(() => searchParams.get('yearFrom') ?? '');
  const [yearTo, setYearTo] = useState(() => searchParams.get('yearTo') ?? '');
  const [price, setPrice] = useState(() => searchParams.get('price') ?? '');
  const [mileage, setMileage] = useState(() => searchParams.get('mileage') ?? '');
  const [fuels, setFuels] = useState<JapanMarketFuelType[]>(() => valuesFromParam(searchParams.get('fuels'), FUEL_TYPES));
  const [bodies, setBodies] = useState<JapanMarketBodyType[]>(() => valuesFromParam(searchParams.get('bodies'), BODY_TYPES));
  const [sort, setSort] = useState(() => searchParams.get('sort') ?? 'recommended');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const hadMakeParam = searchParams.has('make');
    const hadModelParam = searchParams.has('model');
    loadJapanMarketData().then((data) => {
      if (!active) return;
      setPayload(data);
      const pathMake = [...new Set(data.vehicles.map((vehicle) => vehicle.make))].find((item) => slugifyVehicleValue(item) === initialMakeSlug);
      if (pathMake && !hadMakeParam) {
        setMake(pathMake);
        const pathModel = [...new Set(data.vehicles.filter((vehicle) => vehicle.make === pathMake).map((vehicle) => vehicle.model))].find((item) => slugifyVehicleValue(item) === initialModelSlug);
        if (pathModel && !hadModelParam) setModel(pathModel);
      }
    }).catch((error) => active && setLoadError(error instanceof Error ? error.message : text({ en: 'Unable to load vehicles.', zh: '暂时无法加载车辆。' })));
    return () => { active = false; };
    // Initial path slugs and query parameters only seed the local filter state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMakeSlug, initialModelSlug]);

  useEffect(() => {
    const next = new URLSearchParams();
    const setIf = (key: string, value: string) => { if (value) next.set(key, value); };
    setIf('q', query.trim()); setIf('make', make); setIf('model', model); setIf('yearFrom', yearFrom); setIf('yearTo', yearTo);
    setIf('price', price); setIf('mileage', mileage); setIf('fuels', fuels.join(',')); setIf('bodies', bodies.join(','));
    if (sort !== 'recommended') next.set('sort', sort);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [query, make, model, yearFrom, yearTo, price, mileage, fuels, bodies, sort, searchParams, setSearchParams]);

  const allMakes = useMemo(() => {
    if (!payload) return [...PRIMARY_MAKES, 'Other'];
    const available = new Set(payload.vehicles.map((vehicle) => vehicle.make));
    return [...PRIMARY_MAKES.filter((item) => available.has(item)), 'Other'];
  }, [payload]);
  const models = useMemo(() => payload && make && make !== 'Other'
    ? [...new Set(payload.vehicles.filter((vehicle) => vehicle.make === make).map((vehicle) => vehicle.model))].sort()
    : [], [payload, make]);
  const primaryMakeSet = useMemo(() => new Set(PRIMARY_MAKES), []);

  const filtered = useMemo(() => {
    if (!payload) return [];
    const queryTokens = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const priceRange = price ? PRICE_BUCKETS[price] : null;
    const maxMileage = mileage ? Number(mileage) : null;
    const from = yearFrom ? Number(yearFrom) : null;
    const to = yearTo ? Number(yearTo) : null;
    const matches = payload.vehicles.filter((vehicle) => {
      const searchText = `${vehicle.make} ${vehicle.model} ${vehicle.variant}`.toLowerCase();
      if (queryTokens.length && !queryTokens.every((token) => searchText.includes(token))) return false;
      if (make === 'Other' && primaryMakeSet.has(vehicle.make)) return false;
      if (make && make !== 'Other' && vehicle.make !== make) return false;
      if (model && vehicle.model !== model) return false;
      if (from && vehicle.year < from) return false;
      if (to && vehicle.year > to) return false;
      if (priceRange && (vehicle.estimatedNzdPrice == null || vehicle.estimatedNzdPrice < priceRange[0] || vehicle.estimatedNzdPrice >= priceRange[1])) return false;
      if (maxMileage && vehicle.mileage >= maxMileage) return false;
      if (fuels.length && !fuels.includes(vehicle.fuelType)) return false;
      if (bodies.length && !bodies.includes(vehicle.bodyType)) return false;
      return true;
    });
    return matches.sort((a, b) => {
      if (sort === 'newest') return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      if (sort === 'year') return b.year - a.year;
      if (sort === 'price-asc') return (a.estimatedNzdPrice ?? Number.POSITIVE_INFINITY) - (b.estimatedNzdPrice ?? Number.POSITIVE_INFINITY);
      if (sort === 'price-desc') return (b.estimatedNzdPrice ?? -1) - (a.estimatedNzdPrice ?? -1);
      if (sort === 'mileage') return a.mileage - b.mileage;
      return 0;
    });
  }, [payload, deferredQuery, make, model, yearFrom, yearTo, price, mileage, fuels, bodies, sort, primaryMakeSet]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [deferredQuery, make, model, yearFrom, yearTo, price, mileage, fuels, bodies, sort]);

  const clearFilters = () => {
    setMake(''); setModel(''); setYearFrom(''); setYearTo(''); setPrice(''); setMileage(''); setFuels([]); setBodies([]); setQuery('');
  };
  const filterProps: FilterPanelProps = { makes: allMakes, models, make, model, yearFrom, yearTo, price, mileage, fuels, bodies, setMake, setModel, setYearFrom, setYearTo, setPrice, setMileage, setFuels, setBodies, clear: clearFilters };
  const activeFilters = [
    query ? { key: 'query', label: `“${query}”`, clear: () => setQuery('') } : null,
    make ? { key: 'make', label: make === 'Other' ? text({ en: 'Other makes', zh: '其他品牌' }) : make, clear: () => { setMake(''); setModel(''); } } : null,
    model ? { key: 'model', label: model, clear: () => setModel('') } : null,
    yearFrom || yearTo ? { key: 'year', label: `${yearFrom || '…'}–${yearTo || '…'}`, clear: () => { setYearFrom(''); setYearTo(''); } } : null,
    price ? { key: 'price', label: text({ en: 'Price range', zh: '价格范围' }), clear: () => setPrice('') } : null,
    mileage ? { key: 'mileage', label: `< ${Number(mileage).toLocaleString('en-NZ')} km`, clear: () => setMileage('') } : null,
    ...fuels.map((fuel) => ({ key: `fuel-${fuel}`, label: fuel, clear: () => setFuels(fuels.filter((item) => item !== fuel)) })),
    ...bodies.map((body) => ({ key: `body-${body}`, label: body, clear: () => setBodies(bodies.filter((item) => item !== body)) })),
  ].filter((item): item is { key: string; label: string; clear: () => void } => Boolean(item));

  return (
    <main className="pt-20">
      <section className="border-b border-white/10 bg-[#111214] px-4 py-16 text-white sm:py-20">
        <div className="section-shell">
          <p className="text-xs font-extrabold uppercase tracking-[0.23em] text-primary">Japan Market</p>
          <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div><h1 className="max-w-4xl text-white">{text({ en: 'Find your next car from Japan.', zh: '从日本找到你的下一辆车。' })}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/65">{text({ en: 'Browse vehicles from our Japan sourcing network. Pricing shown is an estimated landed cost in New Zealand and may change with exchange rates, shipping, compliance and vehicle condition.', zh: '浏览 Inno 日本采购网络中的车辆。页面价格为新西兰预计落地价，可能因汇率、运输、合规和实际车况而调整。' })}</p></div>
            <div className="lg:text-right"><p className="text-3xl font-bold text-white">{payload ? filtered.length.toLocaleString('en-NZ') : '—'}</p><p className="mt-1 text-sm font-bold uppercase tracking-[0.16em] text-primary">{text({ en: 'Vehicles Available', zh: '可浏览车辆' })}</p></div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white/55 px-4 py-12 sm:py-16">
        <div className="section-shell grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-black/8 bg-white p-6">
            <p className="section-kicker"><RefreshCw className="h-4 w-4" />CARAPIS · Carsensor</p>
            <h2 className="mt-5 text-2xl">{text({ en: 'Real Japanese dealer listings', zh: '真实日本经销商车源' })}</h2>
            <p className="mt-3 text-sm leading-7 text-foreground/62">{text({ en: 'Vehicle details and photos are supplied by Carsensor through CARAPIS and refreshed on our website.', zh: '车辆资料与照片由 CARAPIS 提供的 Carsensor 数据更新至本网站。' })}</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-6">
            <p className="section-kicker"><BadgeCheck className="h-4 w-4" />{text({ en: 'Condition checked', zh: '车况复核' })}</p>
            <h2 className="mt-5 text-2xl">{text({ en: 'Confirmed before you commit', zh: '决定购买前再次确认' })}</h2>
            <p className="mt-3 text-sm leading-7 text-foreground/62">{text({ en: 'Carsensor is a dealer marketplace rather than an auction house. We confirm availability, condition and final landed cost before any purchase.', zh: 'Carsensor 是经销商车源平台，并非拍卖场。购买前我们会再次确认库存、实际车况和最终落地成本。' })}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-14">
        <div className="section-shell">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative"><span className="sr-only">{text({ en: 'Search make or model', zh: '搜索品牌或车型' })}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text({ en: 'Search make or model', zh: '搜索品牌或车型' })} className="h-13 w-full rounded-2xl border border-black/12 bg-white px-5 pr-12 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />{query ? <button type="button" onClick={() => setQuery('')} aria-label={text({ en: 'Clear search', zh: '清除搜索' })} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-black/5"><X className="h-4 w-4" /></button> : null}</label>
            <div className="grid grid-cols-2 gap-3 lg:flex">
              <button type="button" onClick={() => setMobileFiltersOpen((value) => !value)} className="button-secondary lg:hidden"><SlidersHorizontal className="h-4 w-4" />{text({ en: 'Filters', zh: '筛选' })}{activeFilters.length ? ` (${activeFilters.length})` : ''}</button>
              <label className="flex items-center gap-3 rounded-2xl border border-black/12 bg-white px-4"><span className="whitespace-nowrap text-sm font-semibold text-foreground/55">{text({ en: 'Sort by', zh: '排序' })}</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 bg-transparent text-sm font-bold outline-none"><option value="recommended">{text({ en: 'Recommended', zh: '推荐' })}</option><option value="newest">{text({ en: 'Recently added', zh: '最近添加' })}</option><option value="year">{text({ en: 'Model year: newest', zh: '年份：从新到旧' })}</option><option value="price-asc">{text({ en: 'Price: Low to High', zh: '价格：从低到高' })}</option><option value="price-desc">{text({ en: 'Price: High to Low', zh: '价格：从高到低' })}</option><option value="mileage">{text({ en: 'Mileage: Low to High', zh: '公里数：从低到高' })}</option></select></label>
            </div>
          </div>

          {activeFilters.length ? <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={text({ en: 'Active filters', zh: '已选筛选条件' })}>{activeFilters.map((filter) => <button key={filter.key} type="button" onClick={filter.clear} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold hover:border-primary"><span>{filter.label}</span><X className="h-3.5 w-3.5" /></button>)}<button type="button" onClick={clearFilters} className="px-2 py-1.5 text-xs font-bold text-foreground/45 hover:text-foreground">{text({ en: 'Clear all', zh: '全部清除' })}</button></div> : null}
          {mobileFiltersOpen ? <div className="mt-4 rounded-2xl border border-black/10 bg-white/65 p-5 lg:hidden"><FilterPanel {...filterProps} /><button type="button" onClick={() => setMobileFiltersOpen(false)} className="button-primary mt-7 w-full">{text({ en: `Show ${filtered.length.toLocaleString('en-NZ')} vehicles`, zh: `查看 ${filtered.length.toLocaleString('en-NZ')} 台车辆` })}</button></div> : null}

          <div className="mt-8 grid gap-8 lg:grid-cols-[270px_1fr]">
            <aside className="hidden self-start rounded-2xl border border-black/10 bg-white/50 p-5 lg:sticky lg:top-24 lg:block"><FilterPanel {...filterProps} /></aside>
            <div>
              {loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{loadError}</div> : !payload ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/5" />)}</div> : filtered.length ? <><div className="mb-5 flex items-center justify-between"><p className="text-sm text-foreground/55">{text({ en: `Showing ${Math.min(visibleCount, filtered.length).toLocaleString('en-NZ')} of ${filtered.length.toLocaleString('en-NZ')}`, zh: `已显示 ${Math.min(visibleCount, filtered.length).toLocaleString('en-NZ')} / ${filtered.length.toLocaleString('en-NZ')} 台` })}</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.slice(0, visibleCount).map((vehicle) => <JapanMarketVehicleCard key={vehicle.id} vehicle={vehicle} />)}</div>{visibleCount < filtered.length ? <div className="mt-10 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="button-secondary">{text({ en: 'Load More Vehicles', zh: '加载更多车辆' })}</button></div> : null}</> : <div className="rounded-2xl border border-black/10 bg-white/55 p-10 text-center"><h2 className="text-2xl">{text({ en: 'No matching vehicles', zh: '没有符合条件的车辆' })}</h2><p className="mt-3">{text({ en: 'Try widening your filters, or tell us exactly what you want.', zh: '可以放宽筛选条件，或直接告诉我们你想找什么车。' })}</p><button type="button" onClick={clearFilters} className="button-secondary mt-6">{text({ en: 'Clear Filters', zh: '清除筛选' })}</button></div>}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-white/45 px-4 py-16 sm:py-20"><div className="section-shell grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="section-kicker">{text({ en: 'Personal Sourcing', zh: '定向找车' })}</p><h2 className="mt-5">{text({ en: "Can't find exactly what you're looking for?", zh: '暂时没找到合适的？' })}</h2><p className="mt-4 text-lg">{text({ en: "Tell us what you want and we'll help source it from Japan.", zh: '告诉我们你的要求，我们可以从日本帮你寻找。' })}</p></div><Link to="/vehicles/find-my-car#find-car-form" className="button-primary">{text({ en: 'Request a Vehicle', zh: '提交找车需求' })}<ArrowRight className="h-5 w-5" /></Link></div></section>
    </main>
  );
}
