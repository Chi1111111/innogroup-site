import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, LayoutGrid, List, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { JapanMarketListingCard } from '../components/JapanMarketListingCard';
import { JapanMarketFilters } from '../components/JapanMarketFilters';
import { useLanguage } from '../components/SiteTranslator';
import { formatBodyType, formatFuelType, loadJapanMarketData, type JapanMarketPayload } from '../../data/japanMarket';
import { EMPTY_FILTERS, PAGE_SIZE, PRICE_OPTIONS, PRIMARY_MAKES, SORT_OPTIONS, filterMarketVehicles, marketPage, marketSearchParams, readMarketFilters, type MarketFilters } from './japanMarketSearch';
import '../../styles/japan-market.css';

export function JapanMarket({ initialMakeSlug = '', initialModelSlug = '' }: { initialMakeSlug?: string; initialModelSlug?: string }) {
  const { language, text } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [payload, setPayload] = useState<JapanMarketPayload | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const results = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setError('');
    loadJapanMarketData().then((data) => { if (active) setPayload(data); })
      .catch(() => { if (active) setError('unavailable'); });
    return () => { active = false; };
  }, [retry]);
  const filters = useMemo(() => readMarketFilters(params, payload?.vehicles, initialMakeSlug, initialModelSlug), [params, payload, initialMakeSlug, initialModelSlug]);
  const deferredQuery = useDeferredValue(filters.q);
  const filtered = useMemo(() => filterMarketVehicles(payload?.vehicles ?? [], { ...filters, q: deferredQuery }), [payload, filters, deferredQuery]);
  const page = marketPage(params.get('page'), filtered.length);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;

  // URL state supports reloads, shareable searches and browser Back.
  useEffect(() => {
    if (!payload || filters.q !== deferredQuery) return;
    const clean = marketSearchParams(filters, page);
    if (clean.toString() !== params.toString()) setParams(clean, { replace: true });
  }, [payload, filters, deferredQuery, page, params, setParams]);
  useEffect(() => {
    if (!mobileOpen) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, [mobileOpen]);
  const update = (patch: Partial<MarketFilters>) => {
    const next = marketSearchParams({ ...filters, ...patch });
    navigate({ pathname: '/japan-market', search: next.toString() ? `?${next}` : '' }, { replace: true });
  };
  const clear = () => update(EMPTY_FILTERS);
  const changePage = (next: number) => {
    navigate({ pathname: '/japan-market', search: `?${marketSearchParams(filters, next)}` });
    results.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const tags = [
    ...(filters.q ? [{ label: `“${filters.q}”`, patch: { q: '' } }] : []),
    ...(filters.make ? [{ label: filters.make === 'Other' ? text({ en: 'Other makes', zh: '其他品牌' }) : filters.make, patch: { make: '', model: '' } }] : []),
    ...(filters.model ? [{ label: filters.model, patch: { model: '' } }] : []),
    ...(filters.price ? [{ label: text(PRICE_OPTIONS.find((p) => p.value === filters.price)!), patch: { price: '' } }] : []),
    ...(filters.yearFrom || filters.yearTo ? [{ label: `${filters.yearFrom || '…'} – ${filters.yearTo || '…'}`, patch: { yearFrom: '', yearTo: '' } }] : []),
    ...(filters.mileage ? [{ label: `< ${Number(filters.mileage).toLocaleString('en-NZ')} km`, patch: { mileage: '' } }] : []),
    ...filters.fuels.map((fuel) => ({ label: formatFuelType(fuel, language), patch: { fuels: filters.fuels.filter((v) => v !== fuel) } })),
    ...filters.bodies.map((body) => ({ label: formatBodyType(body, language), patch: { bodies: filters.bodies.filter((v) => v !== body) } })),
  ];
  const popular = PRIMARY_MAKES.slice(0, 6).filter((make) => payload?.vehicles.some((v) => v.make === make));
  const refreshed = payload && Number.isFinite(Date.parse(payload.refreshedAt)) ? new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-NZ', { timeZone: 'Pacific/Auckland', day: 'numeric', month: 'short' }).format(new Date(payload.refreshedAt)) : null;
  const filterPanel = <JapanMarketFilters filters={filters} vehicles={payload?.vehicles ?? []} update={update} />;
  const pageNumbers = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  return <main className="japan-market">
    <section className="jm-search-header"><div className="jm-shell">
      <nav aria-label={text({ en: 'Breadcrumb', zh: '当前位置' })} className="jm-breadcrumb"><Link to="/">{text({ en: 'Home', zh: '首页' })}</Link><ChevronRight size={14} /><span>Japan Market</span></nav>
      <div className="jm-heading-row"><div><p className="jm-eyebrow">JAPAN → NEW ZEALAND</p><h1>{text({ en: 'Find your car in Japan.', zh: '日本好车，直接找。' })}</h1></div><p className="jm-source-note">{text({ en: 'Japanese dealer listings. NZ landed estimates.', zh: '日本经销商车源 · 新西兰落地价参考' })}</p></div>
      <div className="jm-search-row">
        <div className="jm-search-input"><Search size={22} /><input aria-label={text({ en: 'Search make or model', zh: '搜索品牌或车型' })} value={filters.q} onChange={(e) => update({ q: e.target.value })} placeholder={text({ en: 'Make, model or keyword — e.g. Toyota Alphard', zh: '搜索品牌、车型或关键词，例如 Toyota Alphard' })} />{filters.q && <button type="button" onClick={() => update({ q: '' })} aria-label={text({ en: 'Clear search', zh: '清除搜索' })}><X size={18} /></button>}</div>
        <a className="jm-sourcing-link" href="#market-help">{text({ en: 'Need help finding a car?', zh: '需要帮忙找车？' })}<ArrowRight size={17} /></a>
      </div>
      <div className="jm-quick-makes"><span>{text({ en: 'Quick picks', zh: '热门品牌' })}</span>{popular.map((make) => <button key={make} type="button" aria-pressed={filters.make === make} onClick={() => update({ make: filters.make === make ? '' : make, model: '' })}>{make}</button>)}</div>
    </div></section>
    <div className="jm-shell jm-workspace">
      <aside className="jm-sidebar" aria-label={text({ en: 'Vehicle filters', zh: '车辆筛选' })}><div className="jm-sidebar-title"><h2><SlidersHorizontal size={18} />{text({ en: 'Refine search', zh: '筛选车源' })}</h2><button type="button" onClick={clear}>{text({ en: 'Reset', zh: '重置' })}</button></div>{filterPanel}</aside>
      <div className="jm-results" ref={results}>
        <div className="jm-results-heading"><div><h2 aria-live="polite">{payload ? filtered.length.toLocaleString('en-NZ') : '—'} <span>{text({ en: 'cars from Japan', zh: '台日本车源' })}</span></h2><p>{refreshed ? <><RefreshCw size={13} />{text({ en: `Data updated ${refreshed} · NZ time`, zh: `数据更新于 ${refreshed} · 新西兰时间` })}</> : text({ en: 'Loading dealer listings…', zh: '正在加载经销商车源…' })}</p></div>
          <div className="jm-view-switch" aria-label={text({ en: 'Results layout', zh: '显示方式' })}><button type="button" aria-label={text({ en: 'List view', zh: '列表视图' })} aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><List size={20} /></button><button type="button" aria-label={text({ en: 'Grid view', zh: '网格视图' })} aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}><LayoutGrid size={19} /></button></div>
        </div>
        <div className="jm-results-toolbar"><button type="button" className="jm-filter-trigger" onClick={() => setMobileOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={18} />{text({ en: 'Filters', zh: '筛选' })}{tags.length > 0 && <span>{tags.length}</span>}</button><p className="jm-price-disclaimer">{text({ en: 'All prices in NZD · estimated landed', zh: '价格单位：纽币 · 预计落地价' })}</p><label className="jm-sort"><span>{text({ en: 'Sort', zh: '排序' })}</span><select aria-label={text({ en: 'Sort by', zh: '排序方式' })} value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>{SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{text(option)}</option>)}</select></label></div>
        {tags.length > 0 && <div className="jm-active-filters" aria-label={text({ en: 'Active filters', zh: '已选筛选条件' })}>{tags.map((tag, i) => <button type="button" key={`${tag.label}-${i}`} onClick={() => update(tag.patch)} aria-label={`${text({ en: 'Remove', zh: '移除' })} ${tag.label}`}>{tag.label}<X size={14} /></button>)}<button type="button" className="jm-clear-all" onClick={clear}>{text({ en: 'Clear all', zh: '全部清除' })}</button></div>}
        {error ? <div className="jm-empty" role="alert"><RefreshCw size={30} /><h2>{text({ en: 'Listings could not be loaded', zh: '暂时无法加载车源' })}</h2><p>{text({ en: 'Please try again in a moment.', zh: '请稍后重试。' })}</p><button type="button" className="jm-primary" onClick={() => setRetry((n) => n + 1)}>{text({ en: 'Try again', zh: '重新加载' })}</button></div>
          : !payload ? <div aria-label={text({ en: 'Loading vehicles', zh: '正在加载车辆' })} className="jm-loading">{[1, 2, 3].map((n) => <div key={n} />)}</div>
          : filtered.length === 0 ? <div className="jm-empty"><Search size={32} /><h2>{text({ en: 'No cars match these filters', zh: '没有符合条件的车辆' })}</h2><p>{text({ en: 'Try a wider budget or remove a filter to see more cars.', zh: '试试扩大预算或移除部分筛选条件。' })}</p><button type="button" className="jm-primary" onClick={clear}>{text({ en: 'Clear filters', zh: '清除筛选' })}</button><Link to="/vehicles/find-my-car#find-car-form">{text({ en: 'Ask Inno to find a car', zh: '让 Inno 帮你找车' })}<ArrowRight size={16} /></Link></div>
          : <><div className={`jm-listings jm-listings-${layout}`} aria-busy={filters.q !== deferredQuery}>{filtered.slice(start, start + PAGE_SIZE).map((vehicle, i) => <JapanMarketListingCard key={vehicle.id} vehicle={vehicle} priority={i === 0} />)}</div>
            <div className="jm-pagination"><p>{text({ en: `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length.toLocaleString('en-NZ')}`, zh: `第 ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} 台，共 ${filtered.length.toLocaleString('en-NZ')} 台` })}</p>
              {pages > 1 && <nav aria-label={text({ en: 'Results pages', zh: '结果分页' })}><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} aria-label={text({ en: 'Previous page', zh: '上一页' })}><ChevronLeft size={18} /></button>{pageNumbers.map((n, i) => <span key={n}>{i > 0 && n - pageNumbers[i - 1] > 1 && <span className="jm-page-gap">…</span>}<button type="button" aria-current={n === page ? 'page' : undefined} onClick={() => changePage(n)}>{n}</button></span>)}<button type="button" disabled={page === pages} onClick={() => changePage(page + 1)} aria-label={text({ en: 'Next page', zh: '下一页' })}><ChevronRight size={18} /></button></nav>}
            </div></>}
        <details className="jm-about-data"><summary>{text({ en: 'About these listings & landed estimates', zh: '车源及落地价说明' })}</summary><p>{text({ en: 'Carsensor dealer listings are supplied through CARAPIS. These are not auction results. Estimates may change with exchange rates, shipping, compliance and vehicle condition. We confirm availability, condition and final costs before you commit.', zh: '车源由 CARAPIS 提供，来自 Carsensor 经销商，并非拍卖结果。预计落地价会受汇率、运费、合规和实际车况影响。购买前我们会再次确认库存、车况与最终费用。' })}</p></details>
        <section className="jm-help" id="market-help"><div><p className="jm-eyebrow">INNO SOURCING</p><h2>{text({ en: 'Your next car, made easier.', zh: '选车这件事，交给懂你的人。' })}</h2><p>{text({ en: 'Tell us the model and budget. We’ll help you find it in Japan.', zh: '告诉我们车型与预算，我们从日本帮你寻找。' })}</p></div><Link to="/vehicles/find-my-car#find-car-form">{text({ en: 'Request a vehicle', zh: '提交找车需求' })}<ArrowRight size={18} /></Link></section>
      </div>
    </div>
    <dialog ref={dialog} className="jm-filter-dialog japan-market" aria-labelledby="jm-dialog-title" onCancel={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)}>
      <div className="jm-dialog-header"><h2 id="jm-dialog-title">{text({ en: 'Refine search', zh: '筛选车源' })}</h2><button type="button" autoFocus onClick={() => setMobileOpen(false)} aria-label={text({ en: 'Close filters', zh: '关闭筛选' })}><X size={22} /></button></div><div className="jm-dialog-body">{mobileOpen && filterPanel}</div><div className="jm-dialog-footer"><button type="button" onClick={clear}>{text({ en: 'Reset', zh: '重置' })}</button><button type="button" className="jm-primary" onClick={() => setMobileOpen(false)}>{text({ en: `Show ${filtered.length.toLocaleString('en-NZ')} cars`, zh: `查看 ${filtered.length.toLocaleString('en-NZ')} 台车` })}</button></div>
    </dialog>
  </main>;
}
