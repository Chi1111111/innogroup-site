import { useEffect, useMemo, useState } from 'react';
import { Database, Gauge, Mail, MapPin, MessageCircle, Search, Tag, X } from 'lucide-react';

interface JpaucVehicle {
  absoluteIndex?: number;
  id: string;
  source: string;
  scrapedAt: string;
  detailUrl: string;
  listingPageUrl: string;
  imageUrl: string;
  number: string;
  dateTime: string;
  location: string;
  lotNo: string;
  maker: string;
  model: string;
  year: string;
  modelGrade: string;
  cc: string;
  modelCode: string;
  transmission: string;
  mileage: string;
  color: string;
  title: string;
  auctionGrade: string;
  startPrice: string;
  status: string;
  endPrice: string;
  rawColumns: string[];
  titleFull?: string;
  detailSpecs?: Record<string, string>;
  auctionSheetUrl?: string;
  galleryImages?: string[];
}

interface JpaucPayload {
  source: string;
  scrapedAt: string;
  count: number;
  listingBaseUrl: string;
  settings: {
    maxPages: number;
    maxVehicles: number;
    detailConcurrency: number;
  };
  vehicles: JpaucVehicle[];
}

type FeedType = 'auction' | 'oneprice_japan';

interface FeedManifest {
  source: string;
  scrapedAt: string;
  count: number;
  listingBaseUrl: string;
  shardSize: number;
  pageSize: number;
  shardCount: number;
  pageCount: number;
  settings: JpaucPayload['settings'];
  options: {
    maker: string[];
    model: string[];
    modelCode: string[];
    year: string[];
    color: string[];
    cc: string[];
    auctionGrade: string[];
  };
}

interface SearchIndexEntry {
  absoluteIndex: number;
  id: string;
  maker: string;
  model: string;
  modelGrade: string;
  year: string;
  modelCode: string;
  transmission: string;
  mileage: string;
  color: string;
  cc: string;
  auctionGrade: string;
  startPrice: string;
  endPrice: string;
  status: string;
  location: string;
  lotNo: string;
  titleFull?: string;
}

interface SearchIndexPayload {
  count: number;
  shardSize: number;
  pageSize: number;
  vehicles: SearchIndexEntry[];
}

interface FeedFilters {
  keyword: string;
  maker: string;
  model: string;
  modelCode: string;
  year: string;
  transmission: string;
  color: string;
  cc: string;
  auctionGrade: string;
  mileageMin: string;
  mileageMax: string;
  startPriceFrom: string;
  startPriceTo: string;
}

const DEFAULT_FILTERS: FeedFilters = {
  keyword: '',
  maker: 'all',
  model: 'all',
  modelCode: 'all',
  year: 'all',
  transmission: 'all',
  color: 'all',
  cc: 'all',
  auctionGrade: 'all',
  mileageMin: '',
  mileageMax: '',
  startPriceFrom: '',
  startPriceTo: '',
};

const VEHICLES_PER_PAGE = 20;

const FEED_PATHS: Record<FeedType, string> = {
  auction: '/data/jpauc-paged/auction',
  oneprice_japan: '/data/jpauc-paged/oneprice_japan',
};

const MILEAGE_SELECT_OPTIONS = [
  0, 5000, 10000, 20000, 30000, 40000, 50000, 70000, 90000, 120000, 150000, 180000,
  220000, 260000, 300000, 400000, 500000,
];

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseMileageNumber(value: string) {
  const matched = value.match(/[\d,]+/);
  return matched ? Number(matched[0].replace(/,/g, '')) : null;
}

function parsePriceNumber(value: string) {
  const matched = value.match(/[\d,]+/);
  return matched ? Number(matched[0].replace(/,/g, '')) : null;
}

function normalizeTransmission(value: string) {
  const upper = normalizeText(value).toUpperCase();
  if (!upper) return '';
  if (upper.includes('MT') || upper.includes('MANUAL')) return 'MT';
  return 'AT';
}

function parseAuctionGradeScore(value: string) {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return null;

  const numeric = normalized.match(/\d+(\.\d+)?/);
  if (numeric) {
    return Number(numeric[0]);
  }

  if (normalized.startsWith('S')) return 6;
  if (normalized.startsWith('R')) return 0.5;
  return null;
}

function getVehicleImages(vehicle: JpaucVehicle) {
  return Array.from(
    new Set([vehicle.imageUrl, ...(vehicle.galleryImages ?? []), vehicle.auctionSheetUrl ?? ''])
  ).filter(Boolean);
}

function hasActiveFilters(filters: FeedFilters) {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'keyword' || key === 'mileageMin' || key === 'mileageMax' || key === 'startPriceFrom' || key === 'startPriceTo') {
      return value.trim() !== '';
    }
    return value !== 'all';
  });
}

function matchesFilters(item: SearchIndexEntry, filters: FeedFilters) {
  const q = filters.keyword.trim().toLowerCase();
  const mileageMin = filters.mileageMin ? Number(filters.mileageMin) : null;
  const mileageMax = filters.mileageMax ? Number(filters.mileageMax) : null;
  const priceFrom = filters.startPriceFrom ? Number(filters.startPriceFrom) : null;
  const priceTo = filters.startPriceTo ? Number(filters.startPriceTo) : null;
  const yearFrom = filters.year !== 'all' ? Number(filters.year) : null;
  const gradeFrom = filters.auctionGrade !== 'all' ? parseAuctionGradeScore(filters.auctionGrade) : null;

  if (filters.maker !== 'all' && item.maker !== filters.maker) return false;
  if (filters.model !== 'all' && item.model !== filters.model) return false;
  if (filters.modelCode !== 'all' && item.modelCode !== filters.modelCode) return false;
  if (yearFrom !== null) {
    const itemYear = Number(item.year);
    if (Number.isFinite(itemYear) && itemYear < yearFrom) return false;
  }
  if (filters.transmission !== 'all' && normalizeTransmission(item.transmission) !== filters.transmission) {
    return false;
  }
  if (filters.color !== 'all' && item.color !== filters.color) return false;
  if (filters.cc !== 'all' && item.cc !== filters.cc) return false;
  if (gradeFrom !== null) {
    const itemGrade = parseAuctionGradeScore(item.auctionGrade);
    if (itemGrade !== null && itemGrade < gradeFrom) return false;
  }

  const mileage = parseMileageNumber(item.mileage);
  if (mileageMin !== null && mileage !== null && mileage < mileageMin) return false;
  if (mileageMax !== null && mileage !== null && mileage > mileageMax) return false;

  const startPrice = parsePriceNumber(item.startPrice);
  if (priceFrom !== null && startPrice !== null && startPrice < priceFrom) return false;
  if (priceTo !== null && startPrice !== null && startPrice > priceTo) return false;

  if (!q) return true;
  return [
    item.id,
    item.maker,
    item.model,
    item.modelGrade,
    item.year,
    item.location,
    item.lotNo,
    item.modelCode,
    item.startPrice,
    item.endPrice,
    item.status,
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function JpaucFeed() {
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');
  const [manifests, setManifests] = useState<Record<FeedType, FeedManifest | null>>({
    auction: null,
    oneprice_japan: null,
  });
  const [searchIndexes, setSearchIndexes] = useState<Record<FeedType, SearchIndexPayload | null>>({
    auction: null,
    oneprice_japan: null,
  });
  const [activeFeed, setActiveFeed] = useState<FeedType>('auction');
  const [visibleVehicles, setVisibleVehicles] = useState<JpaucVehicle[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openEnquiryId, setOpenEnquiryId] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<FeedFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FeedFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    if (manifests[activeFeed]) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const loadManifest = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${FEED_PATHS[activeFeed]}/manifest.json`);
        if (!response.ok) throw new Error(`Cannot load ${activeFeed} manifest: ${response.status}`);
        const manifest = (await response.json()) as FeedManifest;

        if (!active) return;
        setManifests((current) => ({
          ...current,
          [activeFeed]: manifest,
        }));
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void loadManifest();

    return () => {
      active = false;
    };
  }, [activeFeed]);

  const manifest = manifests[activeFeed];
  const activeFilters = hasActiveFilters(appliedFilters);

  const options = useMemo(() => {
    return {
      maker: manifest?.options.maker ?? [],
      model: manifest?.options.model ?? [],
      modelCode: manifest?.options.modelCode ?? [],
      year: manifest?.options.year ?? [],
      transmission: ['AT', 'MT'],
      color: manifest?.options.color ?? [],
      cc: manifest?.options.cc ?? [],
      auctionGrade: manifest?.options.auctionGrade ?? [],
    };
  }, [manifest]);

  const totalPages = Math.max(1, Math.ceil(matchedCount / VEHICLES_PER_PAGE));
  const pageStartIndex = (currentPage - 1) * VEHICLES_PER_PAGE;

  useEffect(() => {
    let active = true;

    const fetchShardVehicles = async (shardNumbers: number[]) => {
      const uniqueShards = Array.from(new Set(shardNumbers)).filter((shard) => shard > 0);
      const shardPayloads = await Promise.all(
        uniqueShards.map(async (shard) => {
          const response = await fetch(`${FEED_PATHS[activeFeed]}/shards/${shard}.json`);
          if (!response.ok) throw new Error(`Cannot load vehicle page: ${response.status}`);
          return (await response.json()) as { vehicles: JpaucVehicle[] };
        })
      );

      return shardPayloads.flatMap((payload) => payload.vehicles);
    };

    const loadVehicles = async () => {
      if (!manifest) return;

      try {
        setPageLoading(true);
        setError('');

        if (!activeFilters) {
          setMatchedCount(manifest.count);
          const startIndex = pageStartIndex;
          const endIndex = Math.min(startIndex + VEHICLES_PER_PAGE, manifest.count);
          const firstShard = Math.floor(startIndex / manifest.shardSize) + 1;
          const lastShard = Math.floor(Math.max(endIndex - 1, startIndex) / manifest.shardSize) + 1;
          const vehicles = await fetchShardVehicles(
            Array.from({ length: lastShard - firstShard + 1 }, (_, index) => firstShard + index)
          );
          if (!active) return;
          setVisibleVehicles(
            vehicles
              .filter((vehicle) => {
                const absoluteIndex = vehicle.absoluteIndex ?? -1;
                return absoluteIndex >= startIndex && absoluteIndex < endIndex;
              })
              .sort((a, b) => (a.absoluteIndex ?? 0) - (b.absoluteIndex ?? 0))
          );
          return;
        }

        let index = searchIndexes[activeFeed];
        if (!index) {
          const response = await fetch(`${FEED_PATHS[activeFeed]}/index.json`);
          if (!response.ok) throw new Error(`Cannot load search index: ${response.status}`);
          index = (await response.json()) as SearchIndexPayload;
          if (!active) return;
          setSearchIndexes((current) => ({ ...current, [activeFeed]: index }));
        }

        const matchedEntries = index.vehicles.filter((item) => matchesFilters(item, appliedFilters));
        const pageEntries = matchedEntries.slice(pageStartIndex, pageStartIndex + VEHICLES_PER_PAGE);
        const neededIndexes = new Set(pageEntries.map((entry) => entry.absoluteIndex));
        const vehicles = await fetchShardVehicles(
          pageEntries.map((entry) => Math.floor(entry.absoluteIndex / manifest.shardSize) + 1)
        );

        if (!active) return;
        setMatchedCount(matchedEntries.length);
        setVisibleVehicles(
          vehicles
            .filter((vehicle) => neededIndexes.has(vehicle.absoluteIndex ?? -1))
            .sort((a, b) => (a.absoluteIndex ?? 0) - (b.absoluteIndex ?? 0))
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!active) return;
        setLoading(false);
        setPageLoading(false);
      }
    };

    void loadVehicles();

    return () => {
      active = false;
    };
  }, [activeFeed, activeFilters, appliedFilters, currentPage, manifest, pageStartIndex, searchIndexes]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenEnquiryId(null);
  }, [activeFeed, appliedFilters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const applyFilters = () => setAppliedFilters(draftFilters);
  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const updateDraft = (key: keyof FeedFilters, value: string) => {
    setDraftFilters((current) => {
      if (key === 'maker') {
        return { ...current, maker: value, model: 'all', modelCode: 'all' };
      }
      if (key === 'model') {
        return { ...current, model: value, modelCode: 'all' };
      }
      return { ...current, [key]: value };
    });
  };

  return (
    <div className="pt-20">
      <section className="bg-gradient-to-br from-primary/8 via-white to-primary/12 px-4 py-16">
        <div className="section-shell space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Cars From Japan
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-5xl">
            {activeFeed === 'auction' ? 'Auction Vehicles' : 'One Price Vehicles'}
            <span className="block text-primary">Price First View</span>
          </h1>
          <div className="inline-flex w-fit rounded-full border border-black/10 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveFeed('auction')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                activeFeed === 'auction'
                  ? 'bg-[#151515] text-white'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Auction
            </button>
            <button
              type="button"
              onClick={() => setActiveFeed('oneprice_japan')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                activeFeed === 'oneprice_japan'
                  ? 'bg-[#151515] text-white'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              One Price (Japan)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="section-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {manifest?.count?.toLocaleString() ?? 0}
              </p>
            </div>
            <div className="section-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Matched</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {matchedCount.toLocaleString()}
              </p>
            </div>
            <div className="section-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Scraped</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {manifest?.scrapedAt ? new Date(manifest.scrapedAt).toLocaleString() : '-'}
              </p>
            </div>
            <div className="section-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Source</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {activeFeed === 'auction' ? 'JPAUC Auction' : 'JPAUC One Price (Japan)'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f5ee] px-4 py-8">
        <div className="section-shell">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <div className="border-b border-black/10 bg-[#0f172a] px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white">
              Search Filter
            </div>
            <div className="space-y-3 p-4">
              <div className="grid gap-3 md:grid-cols-6">
                <input
                  value={draftFilters.keyword}
                  onChange={(event) => updateDraft('keyword', event.target.value)}
                  placeholder="Keyword"
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <select
                  value={draftFilters.maker}
                  onChange={(event) => updateDraft('maker', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Makes</option>
                  {options.maker.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.model}
                  onChange={(event) => updateDraft('model', event.target.value)}
                  disabled={draftFilters.maker === 'all'}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Models</option>
                  {options.model.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.modelCode}
                  onChange={(event) => updateDraft('modelCode', event.target.value)}
                  disabled={draftFilters.model === 'all'}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All model code</option>
                  {options.modelCode.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.year}
                  onChange={(event) => updateDraft('year', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">Year From</option>
                  {options.year.map((item) => (
                    <option key={item} value={item}>
                      {item}+
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.transmission}
                  onChange={(event) => updateDraft('transmission', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Transmission</option>
                  {options.transmission.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <select
                  value={draftFilters.color}
                  onChange={(event) => updateDraft('color', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Colors</option>
                  {options.color.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.cc}
                  onChange={(event) => updateDraft('cc', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All cc</option>
                  {options.cc.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.auctionGrade}
                  onChange={(event) => updateDraft('auctionGrade', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">Grade From</option>
                  {options.auctionGrade.map((item) => (
                    <option key={item} value={item}>
                      {item}+
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.mileageMin}
                  onChange={(event) => updateDraft('mileageMin', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">From km</option>
                  {MILEAGE_SELECT_OPTIONS.map((value) => (
                    <option key={`min-${value}`} value={String(value)}>
                      {value.toLocaleString()} km
                    </option>
                  ))}
                </select>
                <select
                  value={draftFilters.mileageMax}
                  onChange={(event) => updateDraft('mileageMax', event.target.value)}
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">To km</option>
                  {MILEAGE_SELECT_OPTIONS.map((value) => (
                    <option key={`max-${value}`} value={String(value)}>
                      {value.toLocaleString()} km
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  type="number"
                  min={0}
                  value={draftFilters.startPriceFrom}
                  onChange={(event) => updateDraft('startPriceFrom', event.target.value)}
                  placeholder="¥ Start Price From"
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  type="number"
                  min={0}
                  value={draftFilters.startPriceTo}
                  onChange={(event) => updateDraft('startPriceTo', event.target.value)}
                  placeholder="¥ Start Price To"
                  className="rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={applyFilters}
                  className="rounded-lg bg-[#0b77d1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0861ac]"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f5ee] px-4 pb-24">
        <div className="section-shell">
          {loading || (pageLoading && visibleVehicles.length === 0) ? (
            <div className="section-card p-8 text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
          ) : matchedCount === 0 ? (
            <div className="section-card p-8 text-center text-muted-foreground">
              No vehicles found for current filters.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pageStartIndex + 1}-{Math.min(pageStartIndex + VEHICLES_PER_PAGE, matchedCount)} of{' '}
                  {matchedCount.toLocaleString()} vehicles. 20 vehicles per page.
                  {pageLoading ? ' Loading this page...' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="rounded-lg bg-black/[0.04] px-3 py-2 text-sm font-semibold text-foreground">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {visibleVehicles.map((vehicle) => {
                const images = getVehicleImages(vehicle);
                const mainImage = images[0] ?? '';
                const vehicleTitle = vehicle.model || vehicle.titleFull || `${vehicle.maker} ${vehicle.id}`;
                const vehicleLink =
                  vehicle.detailUrl ||
                  vehicle.listingPageUrl ||
                  'https://www.innogroup.co.nz/jpauc-feed';
                const enquiryMessage = [
                  "Hi Inno Group, I'm interested in this vehicle:",
                  vehicleTitle,
                  `Type: ${activeFeed === 'auction' ? 'Auction' : 'One Price (Japan)'}`,
                  `ID: ${vehicle.id}`,
                  `Start Price: ${vehicle.startPrice || 'N/A'}`,
                  `Link: ${vehicleLink}`,
                ].join('\n');
                const whatsappUrl = `https://wa.me/642885307225?text=${encodeURIComponent(enquiryMessage)}`;
                const mailtoUrl = `mailto:innogroup.shawn@gmail.com?subject=${encodeURIComponent(`[${activeFeed === 'auction' ? 'Auction' : 'One Price Japan'} Enquiry] ${vehicleTitle}`)}&body=${encodeURIComponent(`${enquiryMessage}\n\nMy name:\nMy contact number:\n`)}`;

                return (
                  <article key={vehicle.id} className="section-card overflow-visible border border-black/8 p-4 md:p-5">
                    <div className="grid gap-4 md:grid-cols-[360px_1fr]">
                      <div className="space-y-2">
                        <div className="relative h-56 overflow-hidden rounded-xl bg-black/5">
                          {mainImage ? (
                            <button
                              type="button"
                              className="h-full w-full"
                              onClick={() => setPreviewImage(mainImage)}
                              aria-label={`Open image for ${vehicle.model || vehicle.id}`}
                            >
                              <img
                                src={mainImage}
                                alt={vehicle.titleFull || vehicle.model}
                                className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.03]"
                              />
                            </button>
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>

                        {images.length > 1 ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.slice(1).map((image) => (
                              <button
                                key={`${vehicle.id}-${image}`}
                                type="button"
                                onClick={() => setPreviewImage(image)}
                                className="h-16 w-24 flex-none overflow-hidden rounded-lg border border-black/10 bg-white"
                              >
                                <img src={image} alt={vehicle.model || vehicle.id} className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {vehicle.maker || 'Unknown Maker'}
                            </p>
                            <h3 className="mt-1 text-2xl font-semibold text-foreground">
                              {vehicle.model || vehicle.titleFull || 'Unknown Model'}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {vehicle.modelGrade || '-'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                              Start Price
                            </p>
                            <p className="mt-1 text-5xl font-bold leading-none text-primary md:text-6xl">
                              {vehicle.startPrice || 'N/A'}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-foreground/60">
                              End {vehicle.endPrice || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-sm text-foreground/80">
                          <div className="rounded-lg bg-black/[0.03] p-2">
                            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Year</p>
                            <p className="mt-1 font-medium">{vehicle.year || '-'}</p>
                          </div>
                          <div className="rounded-lg bg-black/[0.03] p-2">
                            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Mileage</p>
                            <p className="mt-1 font-medium">{vehicle.mileage || '-'}</p>
                          </div>
                          <div className="rounded-lg bg-black/[0.03] p-2">
                            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Location / Lot</p>
                            <p className="mt-1 font-medium">
                              {vehicle.location || '-'} {vehicle.lotNo ? `| ${vehicle.lotNo}` : ''}
                            </p>
                          </div>
                          <div className="rounded-lg bg-black/[0.03] p-2">
                            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Grade / Status</p>
                            <p className="mt-1 font-medium">
                              {vehicle.auctionGrade || '-'} {vehicle.status ? `| ${vehicle.status}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-foreground/80">
                              <Tag className="h-3.5 w-3.5" />
                              {vehicle.id}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-foreground/80">
                              <Gauge className="h-3.5 w-3.5" />
                              {normalizeTransmission(vehicle.transmission) || '-'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-foreground/80">
                              <MapPin className="h-3.5 w-3.5" />
                              {vehicle.color || '-'}
                            </span>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenEnquiryId((current) => (current === vehicle.id ? null : vehicle.id))
                              }
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#151515] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2b2b2b]"
                            >
                              <Search className="h-3.5 w-3.5" />
                              Enquiry
                            </button>

                            {openEnquiryId === vehicle.id ? (
                              <div className="absolute bottom-full right-0 z-30 mb-2 w-40 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                                <a
                                  href={mailtoUrl}
                                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-black/[0.03]"
                                >
                                  <Mail className="h-4 w-4 text-primary" />
                                  Email
                                </a>
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 border-t border-black/8 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-black/[0.03]"
                                >
                                  <MessageCircle className="h-4 w-4 text-green-600" />
                                  WhatsApp
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((page) => Math.max(1, page - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((page) => Math.min(totalPages, page + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/40 p-2 text-white"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewImage}
            alt="Vehicle preview"
            className="max-h-[88vh] max-w-[96vw] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
