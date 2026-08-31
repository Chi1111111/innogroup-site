import { type ClipboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import type { PartnerPlaceholder } from '../../data/services';
import {
  type JapanSpecialOrderVehicle,
  type JapanWeeklyReportMeta,
  type JapanWeeklyReportState,
  DEFAULT_JAPAN_WEEKLY_REPORT_META,
  useJapanSpecialOrders,
} from '../hooks/useJapanSpecialOrders';
import { usePartnersCatalog } from '../hooks/usePartnersCatalog';
import { signOutAdmin } from '../lib/adminAuth';

interface PartnerDraft extends PartnerPlaceholder {
  logoWordmarkLine1: string;
  logoWordmarkLine2: string;
}

interface JapanSpecialOrderDraft extends JapanSpecialOrderVehicle {
  imagesText: string;
}

interface AdminNotice {
  type: 'success' | 'error' | 'info';
  text: string;
}

type WeeklyAutoSaveStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'incomplete' | 'error';

type WeeklyReportBuildResult =
  | { report: JapanWeeklyReportState; error: null }
  | { report: null; error: string };

const EMPTY_PARTNER_DRAFT: PartnerDraft = {
  id: '',
  name: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  hours: '',
  logoSrc: '',
  logoAlt: '',
  logoPanel: 'light',
  logoFit: 'contain',
  logoWordmarkLine1: '',
  logoWordmarkLine2: '',
};

const EMPTY_JAPAN_SPECIAL_ORDER_DRAFT: JapanSpecialOrderDraft = {
  slug: '',
  title: '',
  zhTitle: '',
  image: '',
  images: [],
  imagesText: '',
  price: '',
  year: '',
  mileage: '',
  location: '',
  status: '',
  summary: '',
  zhSummary: '',
  japanPrice: '',
  landedEstimate: '',
  nzMarketRange: '',
  opportunityScore: undefined,
  recommendation: '',
  zhRecommendation: '',
  risk: '',
  zhRisk: '',
  recommendedFor: '',
  zhRecommendedFor: '',
  updatedAt: '',
  category: 'price-opportunity',
  availability: 'available',
};

const VEHICLE_TERM_TRANSLATIONS: Array<[RegExp, string]> = [
  [/路虎/g, 'Land Rover'],
  [/捷豹/g, 'Jaguar'],
  [/丰田/g, 'Toyota'],
  [/本田/g, 'Honda'],
  [/日产/g, 'Nissan'],
  [/尼桑/g, 'Nissan'],
  [/马自达/g, 'Mazda'],
  [/三菱/g, 'Mitsubishi'],
  [/斯巴鲁/g, 'Subaru'],
  [/铃木/g, 'Suzuki'],
  [/雷克萨斯/g, 'Lexus'],
  [/奔驰/g, 'Mercedes-Benz'],
  [/宝马/g, 'BMW'],
  [/保时捷/g, 'Porsche'],
  [/法拉利/g, 'Ferrari'],
  [/兰博基尼/g, 'Lamborghini'],
  [/迈凯伦/g, 'McLaren'],
  [/宾利/g, 'Bentley'],
  [/劳斯莱斯/g, 'Rolls-Royce'],
  [/悍马/g, 'Hummer'],
];

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function splitImageText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function toPartnerDraft(partner: PartnerPlaceholder): PartnerDraft {
  return {
    ...partner,
    logoWordmarkLine1: partner.logoWordmark?.line1 ?? '',
    logoWordmarkLine2: partner.logoWordmark?.line2 ?? '',
  };
}

function toPartner(draft: PartnerDraft): PartnerPlaceholder | null {
  const id = draft.id.trim();
  const name = draft.name.trim();
  const address = draft.address.trim();

  if (!id || !name || !address) return null;

  const logoWordmarkLine1 = draft.logoWordmarkLine1.trim();
  const logoWordmarkLine2 = draft.logoWordmarkLine2.trim();

  return {
    id,
    name,
    address,
    website: draft.website?.trim() || undefined,
    email: draft.email?.trim() || undefined,
    phone: draft.phone?.trim() || undefined,
    hours: draft.hours?.trim() || undefined,
    logoSrc: draft.logoSrc?.trim() || undefined,
    logoAlt: draft.logoAlt?.trim() || undefined,
    logoPanel: draft.logoPanel === 'dark' ? 'dark' : 'light',
    logoFit: draft.logoFit === 'cover' ? 'cover' : 'contain',
    logoWordmark: logoWordmarkLine1
      ? {
          line1: logoWordmarkLine1,
          line2: logoWordmarkLine2 || undefined,
        }
      : undefined,
  };
}

function toJapanSpecialOrderDraft(vehicle: JapanSpecialOrderVehicle): JapanSpecialOrderDraft {
  const images = Array.from(new Set([vehicle.image, ...(vehicle.images ?? [])].filter(Boolean)));

  return {
    ...vehicle,
    image: images[0] ?? vehicle.image,
    images,
    imagesText: images.join('\n'),
  };
}

function toJapanSpecialOrderVehicle(draft: JapanSpecialOrderDraft): JapanSpecialOrderVehicle | null {
  const images = splitImageText(draft.imagesText);
  const primaryImage = images[0] || draft.image.trim();
  const requiredVehicle = {
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    zhTitle: draft.zhTitle.trim(),
    image: primaryImage,
    images,
    price: draft.price.trim(),
    year: draft.year.trim(),
    mileage: draft.mileage.trim(),
    location: draft.location.trim(),
    status: draft.status.trim(),
    summary: draft.summary.trim(),
    zhSummary: draft.zhSummary.trim(),
  };

  const isComplete = Object.entries(requiredVehicle).every(([key, value]) => {
    if (key === 'images') return true;
    return Boolean(value);
  });

  if (!isComplete) return null;

  return {
    ...requiredVehicle,
    japanPrice: draft.japanPrice?.trim() || undefined,
    landedEstimate: draft.landedEstimate?.trim() || undefined,
    nzMarketRange: draft.nzMarketRange?.trim() || undefined,
    opportunityScore: draft.opportunityScore,
    recommendation: draft.recommendation?.trim() || undefined,
    zhRecommendation: draft.zhRecommendation?.trim() || undefined,
    risk: draft.risk?.trim() || undefined,
    zhRisk: draft.zhRisk?.trim() || undefined,
    recommendedFor: draft.recommendedFor?.trim() || undefined,
    zhRecommendedFor: draft.zhRecommendedFor?.trim() || undefined,
    updatedAt: draft.updatedAt?.trim() || undefined,
    category: draft.category,
    availability: draft.availability,
  };
}

function normalizeSmartSourceText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function stripOcrQuestionMarks(value: string) {
  return value
    .replace(/[\uFFFD？?]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseVehicleName(value: string) {
  return value
    .split(/\s+/)
    .map((part) =>
      /^[A-Z0-9-]+$/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(' ')
    .trim();
}

function translateVehicleTitleToEnglish(value: string) {
  let translated = stripOcrQuestionMarks(value);

  VEHICLE_TERM_TRANSLATIONS.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });

  translated = translated
    .replace(/[：:]/g, ' ')
    .replace(/[\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCaseVehicleName(translated || stripOcrQuestionMarks(value) || 'Japan Fresh Find');
}

function buildSlugFromTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || createId('japan-find');
}

function uniquifyJapanFindSlugs(drafts: JapanSpecialOrderDraft[]) {
  const slugCounts = new Map<string, number>();

  return drafts.map((draft) => {
    const baseSlug = buildSlugFromTitle(draft.slug || draft.title || draft.zhTitle);
    const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1;
    slugCounts.set(baseSlug, nextCount);

    return {
      ...draft,
      slug: nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`,
    };
  });
}

function parseJapanFindSource(source: string) {
  const normalizedText = normalizeSmartSourceText(source);
  const compactText = normalizedText.replace(/\n/g, ' ');
  const year = findFirstMatch(compactText, [
    /\b((?:19|20)\d{2})\b/,
    /(?:年式|年份|year)[:：]?\s*((?:19|20)\d{2})/i,
  ]);
  const mileage = findFirstMatch(compactText, [
    /(?:走行|公里|里程|mileage|odometer|km)[:：]?\s*([0-9,]+(?:\.\d+)?\s*(?:km|公里|万公里|kms)?)/i,
    /\b([0-9,]+(?:\.\d+)?\s*(?:km|公里|万公里|kms))\b/i,
  ]);
  const price = findFirstMatch(compactText, [
    /(?:price|asking|价格|售价|车价|本体|総額|支払総額)[:：]?\s*([¥￥$]?\s*[0-9,]+(?:\.\d+)?\s*(?:万|万円|円|jpy|nzd|usd)?)/i,
    /\b((?:jpy|nzd|usd)\s*[0-9,]+(?:\.\d+)?)\b/i,
    /([¥￥$]\s*[0-9,]+(?:\.\d+)?\s*(?:万|万円|円|jpy|nzd|usd)?)/i,
    /\b([0-9,]+(?:\.\d+)?\s*(?:万円|円|jpy|nzd|usd))\b/i,
  ]);
  const location = findFirstMatch(compactText, [
    /(?:location|所在地|地点|地域|出品地|保管場所)[:：]?\s*([A-Za-z\u4e00-\u9fff\u3040-\u30ff\s-]{2,30})/i,
  ]);
  const status = findFirstMatch(compactText, [
    /(?:status|状态|状况)[:：]?\s*([A-Za-z\u4e00-\u9fff\s/-]{2,40})/i,
  ]);
  const explicitTitle = findFirstMatch(compactText, [
    /(?:model|车型|车名|車名|name)[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s.+/-]{2,80})/i,
  ]);
  const firstUsefulLine =
    normalizedText
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /[A-Za-z0-9\u4e00-\u9fff]/.test(line) && line.length >= 3 && line.length <= 80) ??
    '';
  const rawTitle = stripOcrQuestionMarks(explicitTitle || firstUsefulLine) || 'Japan Fresh Find';
  const title = translateVehicleTitleToEnglish(rawTitle);
  const zhTitle = rawTitle.trim() || title;
  const safeMileage = mileage || 'To be confirmed';
  const safePrice = price || 'POA';
  const safeYear = year || 'To be confirmed';
  const safeLocation = location || 'Japan';
  const safeStatus = status || 'Japan channel update';

  return {
    slug: buildSlugFromTitle(title),
    title,
    zhTitle,
    price: safePrice,
    year: safeYear,
    mileage: safeMileage,
    location: safeLocation,
    status: safeStatus,
    summary: `${title} sourced from our Japan channel. Listed details indicate ${safeYear}, ${safeMileage} and ${safePrice}; availability, condition, documents and landed cost must be confirmed before deposit.`,
    zhSummary: `${zhTitle} 为日本渠道发来的车源。当前信息显示年份 ${safeYear}、公里数 ${safeMileage}、价格 ${safePrice}；是否仍可锁车、车况、文件和落地成本都需要在订金前再次确认。`,
  };
}

function getNoticeClass(type: AdminNotice['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function buildWeeklyReport(
  meta: JapanWeeklyReportMeta,
  weeklyDrafts: JapanSpecialOrderDraft[],
  arrivalDrafts: JapanSpecialOrderDraft[]
): WeeklyReportBuildResult {
  if (!meta.issueNumber.trim() || !meta.publishedAt.trim()) {
    return { report: null, error: '请先填写期数和发布时间。' };
  }

  const normalizedWeeklyDrafts = uniquifyJapanFindSlugs(weeklyDrafts);
  const vehicles = normalizedWeeklyDrafts
    .map((draft) => toJapanSpecialOrderVehicle(draft))
    .filter((vehicle): vehicle is JapanSpecialOrderVehicle => vehicle !== null);

  if (vehicles.length !== normalizedWeeklyDrafts.length) {
    return { report: null, error: '推荐车辆资料尚未填写完整，补全后会继续自动保存。' };
  }

  const normalizedArrivalDrafts = uniquifyJapanFindSlugs(arrivalDrafts);
  const arrivedVehicles = normalizedArrivalDrafts
    .map((draft) => toJapanSpecialOrderVehicle(draft))
    .filter((vehicle): vehicle is JapanSpecialOrderVehicle => vehicle !== null);

  if (arrivedVehicles.length !== normalizedArrivalDrafts.length) {
    return { report: null, error: '到港车辆资料尚未填写完整，补全后会继续自动保存。' };
  }

  return {
    report: {
      ...meta,
      issueNumber: meta.issueNumber.trim(),
      publishedAt: meta.publishedAt.trim(),
      vehicles,
      arrivedVehicles,
    },
    error: null,
  };
}

export function AdminVehicles({ mode = 'main' }: { mode?: 'main' | 'weekly' }) {
  const { partners, setPartners, resetPartners } = usePartnersCatalog();
  const {
    report: japanWeeklyReport,
    reports: japanWeeklyReports,
    isLoadingCloudVehicles,
    setReports: setJapanWeeklyReports,
  } = useJapanSpecialOrders();
  const [selectedIssueNumber, setSelectedIssueNumber] = useState(
    japanWeeklyReport.issueNumber
  );
  const selectedWeeklyReport =
    japanWeeklyReports.find((report) => report.issueNumber === selectedIssueNumber) ??
    japanWeeklyReports[0] ??
    japanWeeklyReport;
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [partnerDrafts, setPartnerDrafts] = useState<PartnerDraft[]>([]);
  const [japanSpecialOrderDrafts, setJapanSpecialOrderDrafts] = useState<
    JapanSpecialOrderDraft[]
  >([]);
  const [arrivalVehicleDrafts, setArrivalVehicleDrafts] = useState<JapanSpecialOrderDraft[]>([]);
  const [weeklyReportDraft, setWeeklyReportDraft] = useState<JapanWeeklyReportMeta>(() => ({
    issueNumber: selectedWeeklyReport.issueNumber,
    publishedAt: selectedWeeklyReport.publishedAt,
    exchangeRate: selectedWeeklyReport.exchangeRate,
    dataUpdatedAt: selectedWeeklyReport.dataUpdatedAt,
    marketSummary: selectedWeeklyReport.marketSummary,
    zhMarketSummary: selectedWeeklyReport.zhMarketSummary,
    marketNotes: selectedWeeklyReport.marketNotes,
    zhMarketNotes: selectedWeeklyReport.zhMarketNotes,
    weeklyUpdates: selectedWeeklyReport.weeklyUpdates ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.weeklyUpdates,
    zhWeeklyUpdates: selectedWeeklyReport.zhWeeklyUpdates ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.zhWeeklyUpdates,
    arrivals: selectedWeeklyReport.arrivals ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.arrivals,
    zhArrivals: selectedWeeklyReport.zhArrivals ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.zhArrivals,
    arrivalImages: selectedWeeklyReport.arrivalImages ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.arrivalImages,
    nextWeekTeaser: selectedWeeklyReport.nextWeekTeaser ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.nextWeekTeaser,
    zhNextWeekTeaser: selectedWeeklyReport.zhNextWeekTeaser ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.zhNextWeekTeaser,
  }));
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [expandedJapanSpecialOrderSlug, setExpandedJapanSpecialOrderSlug] = useState<
    string | null
  >(null);
  const [uploadingPartnerLogoMap, setUploadingPartnerLogoMap] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadingJapanSpecialOrderImageMap, setUploadingJapanSpecialOrderImageMap] = useState<
    Record<string, boolean>
  >({});
  const [smartSourceTextMap, setSmartSourceTextMap] = useState<Record<string, string>>({});
  const [smartOcrPreviewMap, setSmartOcrPreviewMap] = useState<Record<string, string>>({});
  const [smartOcrProcessingMap, setSmartOcrProcessingMap] = useState<Record<string, boolean>>({});
  const [aiWeeklySource, setAiWeeklySource] = useState('');
  const [aiWeeklyFiles, setAiWeeklyFiles] = useState<File[]>([]);
  const [aiWeeklyPreviews, setAiWeeklyPreviews] = useState<string[]>([]);
  const [isGeneratingWeeklyDraft, setIsGeneratingWeeklyDraft] = useState(false);
  const [isWeeklyAiOpen, setIsWeeklyAiOpen] = useState(false);
  const [isArrivalAiOpen, setIsArrivalAiOpen] = useState(false);
  const [arrivalAiSource, setArrivalAiSource] = useState('');
  const [arrivalAiFiles, setArrivalAiFiles] = useState<File[]>([]);
  const [arrivalAiPreviews, setArrivalAiPreviews] = useState<string[]>([]);
  const [isGeneratingArrivalDraft, setIsGeneratingArrivalDraft] = useState(false);
  const [weeklyAutoSaveStatus, setWeeklyAutoSaveStatus] = useState<WeeklyAutoSaveStatus>('loading');
  const [weeklyAutoSaveError, setWeeklyAutoSaveError] = useState('');
  const [weeklyLastSavedAt, setWeeklyLastSavedAt] = useState<Date | null>(null);
  const reportHydrationIssueRef = useRef<string | null>(null);
  const lastPersistedReportRef = useRef('');
  const lastQueuedReportRef = useRef('');
  const failedReportRef = useRef('');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const reportsRef = useRef(japanWeeklyReports);
  const setReportsRef = useRef(setJapanWeeklyReports);

  useEffect(() => {
    let robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    const previous = robotsMeta.content;
    robotsMeta.content = 'noindex, nofollow';
    document.title = 'Inno Group Admin';

    return () => {
      robotsMeta.content = previous || 'index, follow';
    };
  }, []);

  useEffect(() => {
    const nextPartnerDrafts = partners.map((partner) => toPartnerDraft(partner));
    setPartnerDrafts(nextPartnerDrafts);
    setExpandedPartnerId((current) => current ?? nextPartnerDrafts[0]?.id ?? null);
  }, [partners]);

  useEffect(() => {
    reportsRef.current = japanWeeklyReports;
    setReportsRef.current = setJapanWeeklyReports;
  }, [japanWeeklyReports, setJapanWeeklyReports]);

  useEffect(() => {
    if (isLoadingCloudVehicles || japanWeeklyReports.length === 0) return;
    if (japanWeeklyReports.some((report) => report.issueNumber === selectedIssueNumber)) return;
    setSelectedIssueNumber(japanWeeklyReports[0].issueNumber);
  }, [isLoadingCloudVehicles, japanWeeklyReports, selectedIssueNumber]);

  useEffect(() => {
    if (isLoadingCloudVehicles) {
      setWeeklyAutoSaveStatus('loading');
      return;
    }

    reportHydrationIssueRef.current = selectedWeeklyReport.issueNumber;
    lastPersistedReportRef.current = '';
    lastQueuedReportRef.current = '';
    failedReportRef.current = '';
    const nextDrafts = selectedWeeklyReport.vehicles.map((vehicle) =>
      toJapanSpecialOrderDraft(vehicle)
    );
    setJapanSpecialOrderDrafts(nextDrafts);
    setArrivalVehicleDrafts(
      (selectedWeeklyReport.arrivedVehicles ?? []).map((vehicle) =>
        toJapanSpecialOrderDraft(vehicle)
      )
    );
    setExpandedJapanSpecialOrderSlug(null);
    const { vehicles: _vehicles, arrivedVehicles: _arrivedVehicles, ...meta } = selectedWeeklyReport;
    setWeeklyReportDraft({
      ...meta,
      weeklyUpdates: meta.weeklyUpdates ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.weeklyUpdates,
      zhWeeklyUpdates: meta.zhWeeklyUpdates ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.zhWeeklyUpdates,
      arrivals: meta.arrivals ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.arrivals,
      zhArrivals: meta.zhArrivals ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.zhArrivals,
      arrivalImages: meta.arrivalImages ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.arrivalImages,
      nextWeekTeaser: meta.nextWeekTeaser ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.nextWeekTeaser,
      zhNextWeekTeaser: meta.zhNextWeekTeaser ?? DEFAULT_JAPAN_WEEKLY_REPORT_META.zhNextWeekTeaser,
    });
    setWeeklyAutoSaveStatus('loading');
    setWeeklyAutoSaveError('');
  }, [isLoadingCloudVehicles, selectedWeeklyReport.issueNumber]);

  const handleLogout = async () => {
    setNotice(null);
    await signOutAdmin();
  };

  const updatePartnerDraftField = (id: string, key: keyof PartnerDraft, value: string) => {
    setPartnerDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const updateJapanSpecialOrderDraftField = (
    slug: string,
    key: keyof JapanSpecialOrderDraft,
    value: string
  ) => {
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => (draft.slug === slug ? { ...draft, [key]: value } : draft))
    );
  };

  const updateWeeklyReportField = (key: keyof JapanWeeklyReportMeta, value: string) => {
    setWeeklyReportDraft((current) => ({
      ...current,
      [key]: key === 'marketNotes' || key === 'zhMarketNotes' || key === 'weeklyUpdates' || key === 'zhWeeklyUpdates' || key === 'arrivals' || key === 'zhArrivals'
        ? value.split('\n').map((item) => item.trim()).filter(Boolean)
        : value,
    }));
  };

  const addJapanSpecialOrderDraft = () => {
    const nextSlug = createId('special-order');
    setJapanSpecialOrderDrafts((current) => [
      ...current,
      {
        ...EMPTY_JAPAN_SPECIAL_ORDER_DRAFT,
        slug: nextSlug,
        title: `New Japan Find ${current.length + 1}`,
        zhTitle: `日本精选车源 ${current.length + 1}`,
        price: 'POA',
        year: 'To be confirmed',
        mileage: 'To be confirmed',
        location: 'Japan',
        status: 'Japan channel update',
        opportunityScore: 75,
        updatedAt: new Date().toLocaleDateString('en-NZ'),
        category: 'price-opportunity',
        availability: 'available',
      },
    ]);
    setExpandedJapanSpecialOrderSlug(nextSlug);
    setNotice({ type: 'info', text: '已新增日本精选车源。' });
  };

  const removeJapanSpecialOrderDraft = (slug: string) => {
    setJapanSpecialOrderDrafts((current) => current.filter((draft) => draft.slug !== slug));
    setExpandedJapanSpecialOrderSlug((current) => (current === slug ? null : current));
  };

  const removeJapanSpecialOrderImage = (slug: string, imageToRemove: string) => {
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => {
        if (draft.slug !== slug) return draft;
        const nextImages = splitImageText(draft.imagesText).filter(
          (image) => image !== imageToRemove
        );

        return {
          ...draft,
          image: nextImages[0] ?? '',
          images: nextImages,
          imagesText: nextImages.join('\n'),
        };
      })
    );
  };

  const moveJapanSpecialOrderImage = (slug: string, imageToMove: string, direction: -1 | 1) => {
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => {
        if (draft.slug !== slug) return draft;

        const nextImages = splitImageText(draft.imagesText);
        const imageIndex = nextImages.indexOf(imageToMove);
        const targetIndex = imageIndex + direction;

        if (imageIndex < 0 || targetIndex < 0 || targetIndex >= nextImages.length) {
          return draft;
        }

        [nextImages[imageIndex], nextImages[targetIndex]] = [
          nextImages[targetIndex],
          nextImages[imageIndex],
        ];

        return {
          ...draft,
          image: nextImages[0] ?? '',
          images: nextImages,
          imagesText: nextImages.join('\n'),
        };
      })
    );
  };

  const weeklyReportBuild = useMemo(
    () => buildWeeklyReport(weeklyReportDraft, japanSpecialOrderDrafts, arrivalVehicleDrafts),
    [arrivalVehicleDrafts, japanSpecialOrderDrafts, weeklyReportDraft]
  );
  const weeklyReportSnapshot = useMemo(
    () => (weeklyReportBuild.report ? JSON.stringify(weeklyReportBuild.report) : ''),
    [weeklyReportBuild]
  );

  const persistWeeklyReport = useCallback(async (
    nextReport: JapanWeeklyReportState,
    source: 'auto' | 'manual'
  ) => {
    const snapshot = JSON.stringify(nextReport);
    if (source === 'manual' && failedReportRef.current === snapshot) {
      failedReportRef.current = '';
    }
    const saveSequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = saveSequence;
    lastQueuedReportRef.current = snapshot;
    setWeeklyAutoSaveStatus('saving');
    setWeeklyAutoSaveError('');

    const saveTask = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const currentReports = reportsRef.current;
        const selectedIndex = currentReports.findIndex(
          (report) => report.issueNumber === selectedIssueNumber
        );
        const targetIndex = selectedIndex >= 0
          ? selectedIndex
          : currentReports.findIndex((report) => report.issueNumber === nextReport.issueNumber);
        const nextReports = targetIndex >= 0
          ? currentReports
              .map((report, index) => (index === targetIndex ? nextReport : report))
              .filter(
                (report, index, all) =>
                  all.findIndex((candidate) => candidate.issueNumber === report.issueNumber) === index
              )
          : [nextReport, ...currentReports];

        reportsRef.current = nextReports;
        await setReportsRef.current(nextReports);
      });

    saveQueueRef.current = saveTask.catch(() => undefined);

    try {
      await saveTask;
      lastPersistedReportRef.current = snapshot;
      failedReportRef.current = '';
      if (saveSequence === saveSequenceRef.current) {
        setWeeklyAutoSaveStatus('saved');
        setWeeklyLastSavedAt(new Date());
      }
      if (selectedIssueNumber !== nextReport.issueNumber) {
        setSelectedIssueNumber(nextReport.issueNumber);
      }
      if (source === 'manual') {
        setNotice({ type: 'success', text: `第 ${nextReport.issueNumber} 期周报已保存到云端。` });
      }
    } catch (error) {
      if (lastQueuedReportRef.current === snapshot) lastQueuedReportRef.current = '';
      const message = error instanceof Error ? error.message : '未知错误';
      if (saveSequence === saveSequenceRef.current) {
        failedReportRef.current = snapshot;
        setWeeklyAutoSaveStatus('error');
        setWeeklyAutoSaveError(message);
        setNotice({
          type: 'error',
          text: `自动保存失败：${message} 请重新登录后再试。`,
        });
      }
      throw error;
    }
  }, [selectedIssueNumber]);

  useEffect(() => {
    if (mode !== 'weekly' || isLoadingCloudVehicles) return;

    if (!weeklyReportBuild.report) {
      setWeeklyAutoSaveStatus('incomplete');
      setWeeklyAutoSaveError(weeklyReportBuild.error);
      return;
    }

    if (selectedIssueNumber !== selectedWeeklyReport.issueNumber) return;

    if (
      reportHydrationIssueRef.current === selectedWeeklyReport.issueNumber &&
      weeklyReportBuild.report.issueNumber === selectedWeeklyReport.issueNumber
    ) {
      reportHydrationIssueRef.current = null;
      lastPersistedReportRef.current = weeklyReportSnapshot;
      lastQueuedReportRef.current = '';
      setWeeklyAutoSaveStatus('saved');
      setWeeklyAutoSaveError('');
      return;
    }

    if (
      weeklyReportSnapshot === lastPersistedReportRef.current ||
      weeklyReportSnapshot === lastQueuedReportRef.current ||
      weeklyReportSnapshot === failedReportRef.current
    ) {
      return;
    }

    setWeeklyAutoSaveStatus('pending');
    setWeeklyAutoSaveError('');
    const timer = window.setTimeout(() => {
      void persistWeeklyReport(weeklyReportBuild.report, 'auto').catch(() => undefined);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    isLoadingCloudVehicles,
    mode,
    persistWeeklyReport,
    selectedIssueNumber,
    selectedWeeklyReport.issueNumber,
    weeklyReportBuild,
    weeklyReportSnapshot,
  ]);

  const handleSaveJapanSpecialOrders = async () => {
    if (!weeklyReportBuild.report) {
      setWeeklyAutoSaveStatus('incomplete');
      setWeeklyAutoSaveError(weeklyReportBuild.error);
      setNotice({ type: 'error', text: weeklyReportBuild.error });
      return;
    }

    await persistWeeklyReport(weeklyReportBuild.report, 'manual').catch(() => undefined);
  };

  const addWeeklyReport = async () => {
    const largestIssue = japanWeeklyReports.reduce(
      (largest, report) => Math.max(largest, Number.parseInt(report.issueNumber, 10) || 0),
      0
    );
    const issueNumber = String(largestIssue + 1).padStart(3, '0');
    const nextReport = {
      ...DEFAULT_JAPAN_WEEKLY_REPORT_META,
      issueNumber,
      publishedAt: new Date().toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      vehicles: [],
      arrivedVehicles: [],
    };

    try {
      await setJapanWeeklyReports([nextReport, ...japanWeeklyReports]);
      setSelectedIssueNumber(issueNumber);
      setNotice({ type: 'info', text: `已新建第 ${issueNumber} 期，请分别添加周报推荐车辆和实际到港车辆。` });
    } catch (error) {
      setNotice({
        type: 'error',
        text: `新建失败。${error instanceof Error ? ` ${error.message}` : ''}`,
      });
    }
  };

  const removeWeeklyReport = async (issueNumber: string) => {
    if (japanWeeklyReports.length <= 1) {
      setNotice({ type: 'info', text: '至少保留一期周报。' });
      return;
    }
    if (!window.confirm(`确定删除第 ${issueNumber} 期周报吗？`)) return;

    const nextReports = japanWeeklyReports.filter(
      (report) => report.issueNumber !== issueNumber
    );
    try {
      await setJapanWeeklyReports(nextReports);
      setSelectedIssueNumber(nextReports[0].issueNumber);
      setNotice({ type: 'success', text: `第 ${issueNumber} 期已删除。` });
    } catch (error) {
      setNotice({
        type: 'error',
        text: `删除失败。${error instanceof Error ? ` ${error.message}` : ''}`,
      });
    }
  };

  const handleUploadJapanSpecialOrderImage = async (slug: string, files: FileList | null) => {
    const uploadFiles = Array.from(files ?? []);
    if (uploadFiles.length === 0) return;

    setUploadingJapanSpecialOrderImageMap((current) => ({ ...current, [slug]: true }));
    setNotice(null);

    try {
      const imageUrls = await Promise.all(uploadFiles.map((file) => uploadImageToCloudinary(file)));
      setJapanSpecialOrderDrafts((current) =>
        current.map((draft) => {
          if (draft.slug !== slug) return draft;
          const nextImages = Array.from(
            new Set([...splitImageText(draft.imagesText), ...imageUrls])
          );

          return {
            ...draft,
            image: nextImages[0] ?? draft.image,
            images: nextImages,
            imagesText: nextImages.join('\n'),
          };
        })
      );
      setNotice({ type: 'success', text: `已上传 ${imageUrls.length} 张图片。` });
    } catch {
      setNotice({ type: 'error', text: '图片上传失败，请稍后重试。' });
    } finally {
      setUploadingJapanSpecialOrderImageMap((current) => ({ ...current, [slug]: false }));
    }
  };

  const applySmartJapanSpecialOrderText = (slug: string) => {
    const sourceText = smartSourceTextMap[slug]?.trim();
    if (!sourceText) {
      setNotice({ type: 'error', text: '请先上传截图识别，或粘贴车源文字。' });
      return;
    }

    const parsed = parseJapanFindSource(sourceText);
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => {
        if (draft.slug !== slug) return draft;
        const shouldReplaceSlug = !draft.slug || draft.slug.startsWith('special-order-');

        return {
          ...draft,
          slug: shouldReplaceSlug ? parsed.slug : draft.slug,
          title: parsed.title,
          zhTitle: parsed.zhTitle,
          price: parsed.price,
          year: parsed.year,
          mileage: parsed.mileage,
          location: parsed.location,
          status: parsed.status,
          summary: parsed.summary,
          zhSummary: parsed.zhSummary,
        };
      })
    );
    setNotice({ type: 'success', text: '已根据截图/文字生成车源草稿，下面字段仍可继续修改。' });
  };

  const handleSmartJapanSpecialOrderOcr = async (slug: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setSmartOcrProcessingMap((current) => ({ ...current, [slug]: true }));
    setSmartOcrPreviewMap((current) => {
      const previous = current[slug];
      if (previous) URL.revokeObjectURL(previous);
      return { ...current, [slug]: URL.createObjectURL(file) };
    });
    setNotice({ type: 'info', text: '正在识别截图文字，首次加载会稍慢。' });

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng+jpn+chi_sim');
      const result = await worker.recognize(file);
      await worker.terminate();
      const nextText = normalizeSmartSourceText(result.data.text);

      if (!nextText) {
        setNotice({ type: 'error', text: '没有识别到文字，可以换一张更清晰的截图或直接粘贴文字。' });
        return;
      }

      setSmartSourceTextMap((current) => ({ ...current, [slug]: nextText }));
      setNotice({ type: 'success', text: '截图文字已识别，可检查后点击生成并填充。' });
    } catch {
      setNotice({ type: 'error', text: '截图识别失败，可以先把微信文字复制粘贴到文本框。' });
    } finally {
      setSmartOcrProcessingMap((current) => ({ ...current, [slug]: false }));
    }
  };

  const addPartnerDraft = () => {
    const nextId = createId('partner');
    setPartnerDrafts((current) => [
      ...current,
      {
        ...EMPTY_PARTNER_DRAFT,
        id: nextId,
        name: `新合作方 ${current.length + 1}`,
      },
    ]);
    setExpandedPartnerId(nextId);
    setNotice({ type: 'info', text: '已新增供应商/合作方。' });
  };

  const removePartnerDraft = (id: string) => {
    setPartnerDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedPartnerId((current) => (current === id ? null : current));
  };

  const handleSavePartners = () => {
    const normalizedIds = partnerDrafts.map((draft) => draft.id.trim()).filter(Boolean);
    const hasDuplicateId = new Set(normalizedIds).size !== normalizedIds.length;

    if (hasDuplicateId) {
      setNotice({ type: 'error', text: '保存失败：每个供应商 ID 不能重复。' });
      return;
    }

    const nextPartners = partnerDrafts
      .map((draft) => toPartner(draft))
      .filter((partner): partner is PartnerPlaceholder => partner !== null);

    if (nextPartners.length !== partnerDrafts.length) {
      setNotice({ type: 'error', text: '保存失败：每个供应商都需要 ID、名称和地址。' });
      return;
    }

    setPartners(nextPartners);
    setNotice({ type: 'success', text: '供应商/合作方列表已保存，并同步到前台。' });
  };

  const handleUploadPartnerLogo = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingPartnerLogoMap((current) => ({ ...current, [id]: true }));
    setNotice(null);

    try {
      const logoUrl = await uploadImageToCloudinary(file);
      setPartnerDrafts((current) =>
        current.map((draft) => (draft.id === id ? { ...draft, logoSrc: logoUrl } : draft))
      );
      setNotice({ type: 'success', text: '供应商 logo 已上传。' });
    } catch {
      setNotice({ type: 'error', text: '供应商 logo 上传失败。' });
    } finally {
      setUploadingPartnerLogoMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleResetPartners = () => {
    if (!window.confirm('确定要把供应商/合作方恢复为默认数据吗？')) return;
    resetPartners();
    setNotice({ type: 'success', text: '供应商/合作方已恢复默认。' });
  };

  const removeArrivalVehicleDraft = (slug: string) => {
    setArrivalVehicleDrafts((current) => current.filter((draft) => draft.slug !== slug));
  };

  const handleAiWeeklyFiles = (files: FileList | null) => {
    const nextFiles = Array.from(files ?? []).slice(0, 6);
    aiWeeklyPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setAiWeeklyFiles(nextFiles);
    setAiWeeklyPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleAiWeeklyPaste = (event: ClipboardEvent<HTMLElement>) => {
    const pastedImages = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (pastedImages.length === 0) return;

    event.preventDefault();
    const nextFiles = [...aiWeeklyFiles, ...pastedImages].slice(0, 6);
    aiWeeklyPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setAiWeeklyFiles(nextFiles);
    setAiWeeklyPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
    setNotice({
      type: 'success',
      text: `已从剪贴板粘贴 ${pastedImages.length} 张截图，共 ${nextFiles.length} 张待处理图片。`,
    });
  };

  const removeAiWeeklyFile = (indexToRemove: number) => {
    const previewToRemove = aiWeeklyPreviews[indexToRemove];
    if (previewToRemove) URL.revokeObjectURL(previewToRemove);
    setAiWeeklyFiles((current) => current.filter((_, index) => index !== indexToRemove));
    setAiWeeklyPreviews((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const clearAiWeeklyFiles = () => {
    aiWeeklyPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setAiWeeklyFiles([]);
    setAiWeeklyPreviews([]);
    setNotice({ type: 'info', text: '已清空 AI 周报助手中的所有待处理图片。' });
  };

  const setArrivalAiImages = (files: File[]) => {
    const nextFiles = files;
    arrivalAiPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setArrivalAiFiles(nextFiles);
    setArrivalAiPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleArrivalAiPaste = (event: ClipboardEvent<HTMLElement>) => {
    const pastedImages = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'));
    if (pastedImages.length === 0) return;
    event.preventDefault();
    setArrivalAiImages([...arrivalAiFiles, ...pastedImages]);
    setNotice({ type: 'success', text: `已粘贴 ${pastedImages.length} 张到港图片。` });
  };

  const removeArrivalAiFile = (indexToRemove: number) => {
    const nextFiles = arrivalAiFiles.filter((_, index) => index !== indexToRemove);
    setArrivalAiImages(nextFiles);
  };

  const removeSavedArrivalImage = (imageToRemove: string) => {
    setWeeklyReportDraft((current) => ({
      ...current,
      arrivalImages: (current.arrivalImages ?? []).filter((image) => image !== imageToRemove),
    }));
  };

  const generateArrivalDraft = async () => {
    if (!arrivalAiSource.trim() && arrivalAiFiles.length === 0) {
      setNotice({ type: 'error', text: '请先粘贴到港信息，或上传到港车辆照片/截图。' });
      return;
    }
    setIsGeneratingArrivalDraft(true);
    setNotice({ type: 'info', text: '正在识别到港资料并生成详细进度。' });
    try {
      const recognizedTexts: string[] = [];
      if (arrivalAiFiles.length > 0) {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng+jpn+chi_sim');
        for (const file of arrivalAiFiles) {
          const result = await worker.recognize(file);
          if (result.data.text.trim()) recognizedTexts.push(result.data.text);
        }
        await worker.terminate();
      }
      const combinedSource = normalizeSmartSourceText([arrivalAiSource, ...recognizedTexts].filter(Boolean).join('\n\n'));
      const parsed = parseJapanFindSource(combinedSource || arrivalAiSource);
      const uploadedImages = arrivalAiFiles.length
        ? await Promise.all(arrivalAiFiles.map((file) => uploadImageToCloudinary(file)))
        : [];
      const port = findFirstMatch(combinedSource, [
        /\b(Auckland|Tauranga|Wellington|Lyttelton|Christchurch|Napier)\s*(?:Port)?\b/i,
      ]) || 'New Zealand';
      const englishArrival = `${parsed.title} · Arrived in New Zealand · ${parsed.year} · ${parsed.mileage} · Port release and compliance inspection being arranged`;
      const chineseArrival = `${parsed.zhTitle} · 已抵达新西兰 · ${parsed.year}年 · ${parsed.mileage} · 正在安排提车及合规检查`;
      setWeeklyReportDraft((current) => ({
        ...current,
        arrivals: [...(current.arrivals ?? []), englishArrival],
        zhArrivals: [...(current.zhArrivals ?? []), chineseArrival],
        arrivalImages: Array.from(new Set([...(current.arrivalImages ?? []), ...uploadedImages])),
      }));
      if (uploadedImages.length > 0) {
        const arrivalVehicleSlug = createId('arrived');
        const arrivalVehicle: JapanSpecialOrderDraft = {
          ...EMPTY_JAPAN_SPECIAL_ORDER_DRAFT,
          ...parsed,
          slug: arrivalVehicleSlug,
          image: uploadedImages[0],
          images: uploadedImages,
          imagesText: uploadedImages.join('\n'),
          location: port,
          status: 'Arrived in New Zealand',
          japanPrice: parsed.price,
          summary: `${parsed.title} has arrived in New Zealand. Port release and compliance inspection are being arranged before the vehicle is ready for viewing or delivery.`,
          zhSummary: `${parsed.zhTitle} 已抵达新西兰，目前正在安排港口放行和合规检查，完成后可进一步预约看车或交付。`,
          recommendation: 'Now physically in New Zealand, allowing local inspection and a clearer path to compliance and delivery.',
          zhRecommendation: '车辆已实际抵达新西兰，可进行本地检查，后续合规和交付进度也更加清晰。',
          risk: 'Port release, compliance outcome, registration timing and final on-road cost still require confirmation.',
          zhRisk: '仍需确认港口放行、合规结果、注册时间以及最终上路成本。',
          recommendedFor: 'Buyers who prefer a vehicle already in New Zealand and available for local follow-up.',
          zhRecommendedFor: '希望购买已抵达新西兰、可以本地继续跟进车辆的客户。',
          updatedAt: new Date().toLocaleDateString('en-NZ'),
        };
        setArrivalVehicleDrafts((current) => [...current, arrivalVehicle]);
      }
      setArrivalAiSource('');
      setArrivalAiImages([]);
      setIsArrivalAiOpen(false);
      setNotice({ type: 'success', text: '到港资料已识别，核对内容后系统会自动保存到云端。' });
    } catch {
      setNotice({ type: 'error', text: '到港资料识别失败，请换清晰图片或直接粘贴文字后重试。' });
    } finally {
      setIsGeneratingArrivalDraft(false);
    }
  };

  const generateWeeklyDraftFromAi = async () => {
    if (!aiWeeklySource.trim() && aiWeeklyFiles.length === 0) {
      setNotice({ type: 'error', text: '请先粘贴本周信息，或上传车辆图片/资料截图。' });
      return;
    }

    setIsGeneratingWeeklyDraft(true);
    setNotice({ type: 'info', text: '正在识别图片并整理周报草稿，请稍候。' });

    try {
      const recognizedTexts: string[] = [];
      if (aiWeeklyFiles.length > 0) {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng+jpn+chi_sim');
        for (const file of aiWeeklyFiles) {
          const result = await worker.recognize(file);
          if (result.data.text.trim()) recognizedTexts.push(result.data.text);
        }
        await worker.terminate();
      }

      const combinedSource = normalizeSmartSourceText(
        [aiWeeklySource, ...recognizedTexts].filter(Boolean).join('\n\n')
      );
      const parsed = parseJapanFindSource(combinedSource || aiWeeklySource);
      setWeeklyReportDraft((current) => ({
        ...current,
        marketSummary: `This week, Inno Group is highlighting ${parsed.title} from our Japan network, with pricing, condition and landed-cost checks in progress.`,
        zhMarketSummary: `本周 Inno Group 重点关注日本渠道的 ${parsed.zhTitle}，正在核对价格、车况及预计落地成本。`,
        weeklyUpdates: [
          `Reviewed the latest information for ${parsed.title}.`,
          'Checked availability, vehicle details and export-document requirements.',
          'Prepared the next landed-cost and compliance review for New Zealand.',
        ],
        zhWeeklyUpdates: [
          `整理并核对 ${parsed.zhTitle} 的最新车源信息。`,
          '跟进库存状态、车辆资料和出口文件要求。',
          '准备新西兰落地成本与合规评估。',
        ],
        marketNotes: [
          'Vehicle availability and final price should be reconfirmed before deposit.',
          'Shipping, exchange rate and compliance can materially change landed cost.',
        ],
        zhMarketNotes: [
          '支付订金前需要重新确认库存状态和最终价格。',
          '海运、汇率与合规费用会影响最终落地成本。',
        ],
        nextWeekTeaser: `Next week: further updates on ${parsed.title} and new Japan-channel opportunities.`,
        zhNextWeekTeaser: `下周将继续更新 ${parsed.zhTitle}，并带来新的日本渠道车源。`,
      }));
      clearAiWeeklyFiles();
      setAiWeeklySource('');
      setIsWeeklyAiOpen(false);
      setNotice({ type: 'success', text: '周报概要草稿已生成。到港和车辆资料请分别使用各自的小助手。' });
    } catch {
      setNotice({ type: 'error', text: '自动生成失败。可以减少图片数量、换更清晰的图片，或先只粘贴文字重试。' });
    } finally {
      setIsGeneratingWeeklyDraft(false);
    }
  };

  const weeklyStepStatus = [
    Boolean(
      weeklyReportDraft.issueNumber.trim() &&
      weeklyReportDraft.publishedAt.trim() &&
      weeklyReportDraft.marketSummary.trim() &&
      weeklyReportDraft.zhMarketSummary.trim()
    ),
    japanSpecialOrderDrafts.length > 0,
    Boolean(weeklyReportDraft.weeklyUpdates?.length && weeklyReportDraft.zhWeeklyUpdates?.length),
    Boolean(weeklyReportDraft.marketNotes.length && weeklyReportDraft.zhMarketNotes.length),
    Boolean(weeklyReportDraft.nextWeekTeaser?.trim() && weeklyReportDraft.zhNextWeekTeaser?.trim()),
  ];
  const completedWeeklySteps = weeklyStepStatus.filter(Boolean).length;
  const weeklyCompletion = Math.round((completedWeeklySteps / weeklyStepStatus.length) * 100);
  const weeklyAutoSaveLabel = (() => {
    if (weeklyAutoSaveStatus === 'loading') return '正在载入云端数据…';
    if (weeklyAutoSaveStatus === 'pending') return '有修改，等待自动保存…';
    if (weeklyAutoSaveStatus === 'saving') return '正在自动保存…';
    if (weeklyAutoSaveStatus === 'incomplete') return weeklyAutoSaveError || '资料不完整，暂未保存';
    if (weeklyAutoSaveStatus === 'error') return `保存失败：${weeklyAutoSaveError}`;
    return weeklyLastSavedAt
      ? `已自动保存 · ${weeklyLastSavedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      : '已与云端同步';
  })();
  const weeklyAutoSaveTone = weeklyAutoSaveStatus === 'error'
    ? 'text-red-300'
    : weeklyAutoSaveStatus === 'incomplete'
      ? 'text-amber-300'
      : weeklyAutoSaveStatus === 'saved'
        ? 'text-emerald-300'
        : 'text-primary';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                {mode === 'weekly' ? '周报管理' : '内容管理后台'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === 'weekly'
                  ? '按客户阅读顺序完成每期 Inno Auto Weekly；周报推荐车辆和实际到港车辆分开管理，数量不限。'
                  : '管理供应商/合作方信息，并从独立入口进入周报管理。'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={mode === 'weekly' ? '/admin' : '/admin/weekly-reports'}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {mode === 'weekly' ? '返回内容后台' : '周报管理'}
              </Link>
              <Link
                to="/admin/crm"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
              >
                CRM 管理
              </Link>
              <Link
                to="/admin/contracts"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                合同管理
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>

        {notice ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${getNoticeClass(notice.type)}`}>
            {notice.text}
          </div>
        ) : null}

        {mode === 'weekly' ? <section className="flex flex-col gap-5">
          <div className="order-0 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-black">正在编辑</span>
                  <span className="text-sm text-white/50">第 {weeklyReportDraft.issueNumber || '—'} 期 · {weeklyReportDraft.publishedAt || '尚未设置日期'}</span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">把这一周的机会讲清楚</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
                  按客户阅读顺序填写。先给结论，再讲车辆和价格，最后补充团队进展与市场判断。
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void addWeeklyReport()} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">＋ 新建一期</button>
                  <button type="button" onClick={addJapanSpecialOrderDraft} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">＋ 添加车辆</button>
                  <Link to="/weekly-report" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">预览客户页面</Link>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-end justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">本期完成度</p><p className="mt-1 text-sm text-white/48">{completedWeeklySteps}/5 个步骤已完成</p></div>
                  <strong className="text-3xl text-white">{weeklyCompletion}%</strong>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${weeklyCompletion}%` }} /></div>
                <div className="mt-4 grid grid-cols-5 gap-1">
                  {weeklyStepStatus.map((complete, index) => <div key={index} className={`h-1.5 rounded-full ${complete ? 'bg-emerald-400' : 'bg-white/12'}`} title={`步骤 ${index + 1}`} />)}
                </div>
              </div>
            </div>
            <div className="sticky top-0 z-20 flex flex-col gap-3 border-t border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm text-white/55">自动保存已开启，停止修改约 1 秒后同步到客户页面。</p>
                <p className={`mt-1 text-xs font-semibold ${weeklyAutoSaveTone}`} aria-live="polite">{weeklyAutoSaveLabel}</p>
              </div>
              <button type="button" disabled={weeklyAutoSaveStatus === 'loading' || weeklyAutoSaveStatus === 'saving'} onClick={() => void handleSaveJapanSpecialOrders()} className="min-h-11 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-[#d2af59] disabled:cursor-wait disabled:opacity-60">立即保存</button>
            </div>
          </div>

          <div className="order-1 rounded-2xl border border-violet-200 bg-white shadow-sm" onPaste={handleAiWeeklyPaste}>
            <button type="button" onClick={() => setIsWeeklyAiOpen((current) => !current)} className="flex w-full items-center justify-between gap-4 p-4 text-left sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet-100 text-lg">✨</span>
                <div className="min-w-0"><p className="text-sm font-bold text-slate-900">周报概要 AI 助手</p><p className="truncate text-xs text-slate-500">只生成本周结论、业务动态和市场观察，不处理到港或单车资料</p></div>
              </div>
              <span className="flex-none rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">{isWeeklyAiOpen ? '收起' : '展开使用'}</span>
            </button>
            {isWeeklyAiOpen ? (
              <div className="border-t border-violet-100 p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <label className="block"><span className="text-sm font-semibold text-slate-800">粘贴本周工作和市场信息</span><textarea value={aiWeeklySource} onChange={(event) => setAiWeeklySource(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder={'例如：本周完成两台车验车；日元汇率变化；新的运输安排……'} /></label>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">补充资料截图</span>{aiWeeklyFiles.length ? <button type="button" onClick={clearAiWeeklyFiles} className="text-xs font-semibold text-red-600">清空</button> : null}</div>
                    <label className="mt-2 flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 text-center"><span className="text-xs font-bold text-violet-700">Ctrl + V 粘贴，或点击选择</span><span className="mt-1 text-xs text-slate-400">{aiWeeklyFiles.length ? `已添加 ${aiWeeklyFiles.length} 张` : '最多 6 张'}</span><input type="file" accept="image/*,.webp,.avif,.heic,.heif" multiple className="hidden" onChange={(event) => { handleAiWeeklyFiles(event.target.files); event.target.value = ''; }} /></label>
                    {aiWeeklyPreviews.length ? <div className="mt-2 grid grid-cols-6 gap-2">{aiWeeklyPreviews.map((preview, index) => <div key={preview} className="relative"><img src={preview} alt={`概要资料 ${index + 1}`} className="aspect-square w-full rounded-md object-cover" /><button type="button" onClick={() => removeAiWeeklyFile(index)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">×</button></div>)}</div> : null}
                  </div>
                </div>
                <div className="mt-4 flex justify-end"><button type="button" disabled={isGeneratingWeeklyDraft} onClick={() => void generateWeeklyDraftFromAi()} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60">{isGeneratingWeeklyDraft ? '生成中…' : '生成概要草稿'}</button></div>
              </div>
            ) : null}
          </div>

          <div className="order-2">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-base font-semibold text-slate-900">选择要编辑的周报</h3><p className="mt-1 text-sm text-slate-500">点击一期即可切换，当前选择会以金色边框标记。</p></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {japanWeeklyReports.map((report, index) => {
              const isSelected = report.issueNumber === selectedWeeklyReport.issueNumber;
              return (
                <article
                  key={`${report.issueNumber}-${index}`}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIssueNumber(report.issueNumber)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        第 {report.issueNumber} 期
                      </h3>
                      {index === 0 ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          最新
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{report.publishedAt}</p>
                    <div className="mt-4 space-y-2">
                      {report.vehicles.length === 0 ? (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          暂未添加车辆
                        </p>
                      ) : (
                        report.vehicles.slice(0, 2).map((vehicle, vehicleIndex) => (
                          <p
                            key={vehicle.slug}
                            className="truncate rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                          >
                            #{vehicleIndex + 1} {vehicle.title}
                          </p>
                        ))
                      )}
                    </div>
                  </button>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">{report.vehicles.length} 辆车</span>
                    <button
                      type="button"
                      onClick={() => void removeWeeklyReport(report.issueNumber)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      删除本期
                    </button>
                  </div>
                </article>
              );
            })}
            </div>
          </div>

          <div className="order-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">步骤 3 · This Week at Inno</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">本周业务动态</h3>
                <p className="mt-1 text-sm text-slate-500">填写本周完成了什么、到港情况和业务进展；每行显示为一条动态。</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">建议 3–5 条</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <TextareaInput label="英文业务动态（每行一条）" value={(weeklyReportDraft.weeklyUpdates ?? []).join('\n')} onChange={(value) => updateWeeklyReportField('weeklyUpdates', value)} />
              <TextareaInput label="中文业务动态（每行一条）" value={(weeklyReportDraft.zhWeeklyUpdates ?? []).join('\n')} onChange={(value) => updateWeeklyReportField('zhWeeklyUpdates', value)} />
            </div>
          </div>

          <div className="order-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">步骤 1 · 本周结论</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">先让客户一眼看懂本周重点</h3>
            <p className="mt-1 text-sm text-slate-500">摘要会显示在周报封面和弹窗顶部；请尽量用一句话给出明确判断。</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <TextInput label="期数" value={weeklyReportDraft.issueNumber} onChange={(value) => updateWeeklyReportField('issueNumber', value)} placeholder="029" />
              <TextInput label="发布时间" value={weeklyReportDraft.publishedAt} onChange={(value) => updateWeeklyReportField('publishedAt', value)} placeholder="20 July 2026" />
              <TextInput label="汇率快照" value={weeklyReportDraft.exchangeRate} onChange={(value) => updateWeeklyReportField('exchangeRate', value)} placeholder="NZD 1 = JPY 86.5" />
              <TextInput label="数据更新时间" value={weeklyReportDraft.dataUpdatedAt} onChange={(value) => updateWeeklyReportField('dataUpdatedAt', value)} placeholder="20 July 2026, 4:30 PM" />
              <TextareaInput label="英文市场摘要" value={weeklyReportDraft.marketSummary} onChange={(value) => updateWeeklyReportField('marketSummary', value)} />
              <TextareaInput label="中文市场摘要" value={weeklyReportDraft.zhMarketSummary} onChange={(value) => updateWeeklyReportField('zhMarketSummary', value)} />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">步骤 4 · Market Watch</p>
              <h4 className="mt-2 text-base font-semibold text-slate-900">市场观察</h4>
              <p className="mt-1 text-sm text-slate-500">只写会影响客户购买决定的变化，每行一条，建议 1–3 条。</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TextareaInput label="英文市场观察（每行一条）" value={weeklyReportDraft.marketNotes.join('\n')} onChange={(value) => updateWeeklyReportField('marketNotes', value)} />
                <TextareaInput label="中文市场观察（每行一条）" value={weeklyReportDraft.zhMarketNotes.join('\n')} onChange={(value) => updateWeeklyReportField('zhMarketNotes', value)} />
              </div>
            </div>
          </div>

          <div className="order-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">步骤 5 · What’s Next</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">下周预告</h3>
              <p className="mt-1 text-sm text-slate-500">用一句话告诉客户下周可以期待什么。</p>
              <div className="mt-5 grid gap-3">
                <TextareaInput label="英文下周预告" value={weeklyReportDraft.nextWeekTeaser ?? ''} onChange={(value) => updateWeeklyReportField('nextWeekTeaser', value)} />
                <TextareaInput label="中文下周预告" value={weeklyReportDraft.zhNextWeekTeaser ?? ''} onChange={(value) => updateWeeklyReportField('zhNextWeekTeaser', value)} />
              </div>
          </div>

          <div className="order-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">步骤 2A · Arrived This Week</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">本周实际到港</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">填写车型、抵达港口、当前状态和下一步安排；只发布已确认抵达新西兰的车辆。</p>
              </div>
              <button type="button" onClick={() => setIsArrivalAiOpen((current) => !current)} className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800">
                {isArrivalAiOpen ? '收起智能识别' : '✨ AI 识别到港资料'}
              </button>
            </div>

            {arrivalVehicleDrafts.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {arrivalVehicleDrafts.map((vehicle, index) => (
                  <div key={vehicle.slug} className="flex items-center gap-3 rounded-xl border border-sky-200 bg-white p-3">
                    {vehicle.image ? <img src={vehicle.image} alt={vehicle.title} className="h-16 w-20 flex-none rounded-lg bg-slate-100 object-cover" /> : <div className="flex h-16 w-20 flex-none items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-sky-700">待加照片</div>}
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">到港车辆 #{index + 1} · {vehicle.title}</p><p className="mt-1 text-xs text-slate-500">{vehicle.year} · {vehicle.mileage}</p><p className="mt-1 text-xs font-semibold text-sky-700">{vehicle.location} · 已到港／合规处理中</p></div>
                    <button type="button" onClick={() => removeArrivalVehicleDraft(vehicle.slug)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">删除</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-sky-200 bg-white/60 px-4 py-3 text-sm text-sky-800">暂无到港车辆。可使用右上角 AI 识别，或从 CRM 将“已到港／合规处理中”的车辆同步进来。</div>
            )}

            {isArrivalAiOpen ? (
              <div className="mt-5 rounded-2xl border border-sky-200 bg-white p-4" onPaste={handleArrivalAiPaste}>
                <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800">粘贴到港文字</span>
                    <textarea value={arrivalAiSource} onChange={(event) => setArrivalAiSource(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" placeholder={'例如：2021 Toyota Alphard\n今天抵达 Auckland Port\n正在等待港口放行，之后安排合规检查'} />
                  </label>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">车辆照片 / 到港截图</span><span className="text-xs text-slate-400">数量不限</span></div>
                    <label className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-200 bg-sky-50 px-3 text-center hover:border-sky-400">
                      <span className="rounded-md bg-sky-700 px-2.5 py-1 text-xs font-bold text-white">Ctrl + V 粘贴</span>
                      <span className="mt-2 text-xs font-semibold text-sky-800">或点击选择图片</span>
                      <input type="file" accept="image/*,.webp,.avif,.heic,.heif" multiple className="hidden" onChange={(event) => { setArrivalAiImages([...arrivalAiFiles, ...Array.from(event.target.files ?? [])]); event.target.value = ''; }} />
                    </label>
                    {arrivalAiPreviews.length ? <div className="mt-2 grid grid-cols-4 gap-2">{arrivalAiPreviews.map((preview, index) => <div key={preview} className="relative"><img src={preview} alt={`到港资料 ${index + 1}`} className="aspect-square w-full rounded-lg border border-sky-100 object-cover" /><button type="button" onClick={() => removeArrivalAiFile(index)} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 font-bold text-white shadow">×</button></div>)}</div> : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-400">识别后会自动生成车型、年份、里程、到港状态和下一步安排；保存前请核实。</p>
                  <button type="button" disabled={isGeneratingArrivalDraft} onClick={() => void generateArrivalDraft()} className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60">{isGeneratingArrivalDraft ? '识别生成中…' : '生成到港草稿'}</button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <TextareaInput label="英文详细到港信息（每行一台）" value={(weeklyReportDraft.arrivals ?? []).join('\n')} onChange={(value) => updateWeeklyReportField('arrivals', value)} />
              <TextareaInput label="中文详细到港信息（每行一台）" value={(weeklyReportDraft.zhArrivals ?? []).join('\n')} onChange={(value) => updateWeeklyReportField('zhArrivals', value)} />
            </div>
            {(weeklyReportDraft.arrivalImages ?? []).length ? (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">已加入本期的到港照片</span><span className="text-xs text-slate-400">{weeklyReportDraft.arrivalImages?.length} 张</span></div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {weeklyReportDraft.arrivalImages?.map((image, index) => <div key={image} className="relative"><img src={image} alt={`到港照片 ${index + 1}`} className="aspect-[4/3] w-full rounded-lg border border-sky-100 object-cover" /><button type="button" onClick={() => removeSavedArrivalImage(image)} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 font-bold text-white shadow">×</button></div>)}
                </div>
              </div>
            ) : null}
            <div className="mt-4 rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-xs leading-6 text-sky-900">建议格式：车型 · 年份/里程 · 抵达港口 · 当前状态 · 下一步安排</div>
          </div>

          <div className="order-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">步骤 2 · Weekly Picks</p><h3 className="mt-2 text-lg font-semibold text-slate-900">本周推荐车辆与购买建议</h3><p className="mt-1 text-sm text-slate-500">这里只管理周报推荐车辆，不包含到港车辆；车辆数量不限。</p></div>
                <button type="button" onClick={addJapanSpecialOrderDraft} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">＋ 添加一台车</button>
              </div>
            </div>
            {japanSpecialOrderDrafts.map((draft, index) => (
              <div
                key={draft.slug}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    周报车辆 #{index + 1} - {draft.title || '未命名'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedJapanSpecialOrderSlug((current) =>
                          current === draft.slug ? null : draft.slug
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      {expandedJapanSpecialOrderSlug === draft.slug ? '收起' : '编辑'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeJapanSpecialOrderDraft(draft.slug)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {expandedJapanSpecialOrderSlug !== draft.slug ? null : (
                  <>
                    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            截图 / 文字智能填充
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            上传微信截图识别文字，或直接粘贴日本发来的车源信息；生成后下面字段都可以继续手动修改。
                          </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50">
                          {smartOcrProcessingMap[draft.slug] ? '识别中...' : '上传截图识别'}
                          <input
                            type="file"
                            accept="image/*,.webp,.avif,.heic,.heif"
                            className="hidden"
                            disabled={smartOcrProcessingMap[draft.slug]}
                            onChange={(event) => {
                              void handleSmartJapanSpecialOrderOcr(draft.slug, event.target.files);
                              event.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
                        {smartOcrPreviewMap[draft.slug] ? (
                          <div className="overflow-hidden rounded-xl border border-blue-100 bg-white p-2">
                            <img
                              src={smartOcrPreviewMap[draft.slug]}
                              alt="OCR preview"
                              className="h-36 w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white/70 text-xs font-medium text-slate-400">
                            截图预览
                          </div>
                        )}
                        <div className="space-y-2">
                          <textarea
                            value={smartSourceTextMap[draft.slug] ?? ''}
                            onChange={(event) =>
                              setSmartSourceTextMap((current) => ({
                                ...current,
                                [draft.slug]: event.target.value,
                              }))
                            }
                            rows={6}
                            className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder={'例如：1999 Nissan Skyline GT-R V Spec\n68,000km\nJPY 12,800,000\nTokyo'}
                          />
                          <button
                            type="button"
                            onClick={() => applySmartJapanSpecialOrderText(draft.slug)}
                            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                          >
                            生成并填充下面字段
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">图片 URL *</span>
                        <input
                          value={draft.image}
                          onChange={(event) =>
                            updateJapanSpecialOrderDraftField(
                              draft.slug,
                              'image',
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          placeholder="https://..."
                        />
                      </label>
                      <label className="space-y-1.5 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">
                          图库 URL（一行一张，第一张为主图）*
                        </span>
                        <textarea
                          value={draft.imagesText}
                          onChange={(event) =>
                            updateJapanSpecialOrderDraftField(
                              draft.slug,
                              'imagesText',
                              event.target.value
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          placeholder={'https://...\nhttps://...'}
                        />
                      </label>
                      <TextInput
                        label="英文标题 *"
                        value={draft.title}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'title', value)
                        }
                      />
                      <TextInput
                        label="中文标题 *"
                        value={draft.zhTitle}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'zhTitle', value)
                        }
                      />
                      <TextInput
                        label="价格 *"
                        value={draft.price}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'price', value)
                        }
                        placeholder="POA / JPY 12,800,000 / From $120,000"
                      />
                      <TextInput
                        label="年份 *"
                        value={draft.year}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'year', value)
                        }
                        placeholder="1969 / 1989 - 2002"
                      />
                      <TextInput
                        label="公里数 *"
                        value={draft.mileage}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'mileage', value)
                        }
                        placeholder="68,000 km / To be confirmed"
                      />
                      <TextInput
                        label="所在地 *"
                        value={draft.location}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'location', value)
                        }
                        placeholder="Japan"
                      />
                      <TextInput
                        label="状态 *"
                        value={draft.status}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'status', value)
                        }
                        placeholder="Japan channel update"
                        className="md:col-span-2"
                      />
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">推荐分类</span>
                        <select
                          value={draft.category ?? 'price-opportunity'}
                          onChange={(event) =>
                            updateJapanSpecialOrderDraftField(draft.slug, 'category', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                        >
                          <option value="price-opportunity">价格机会</option>
                          <option value="japan-rare">日本稀有</option>
                          <option value="special-model">特别车型</option>
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">当前可售情况</span>
                        <select
                          value={draft.availability ?? 'available'}
                          onChange={(event) =>
                            updateJapanSpecialOrderDraftField(draft.slug, 'availability', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                        >
                          <option value="available">当前可售</option>
                          <option value="sold">已售出（保留展示）</option>
                          <option value="paused">暂停推荐（保留展示）</option>
                        </select>
                      </label>
                      <TextInput
                        label="日本价格"
                        value={draft.japanPrice ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'japanPrice', value)}
                        placeholder="JPY 3,500,000"
                      />
                      <TextInput
                        label="预计新西兰落地价"
                        value={draft.landedEstimate ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'landedEstimate', value)}
                        placeholder="$58,000 - $62,000 NZD"
                      />
                      <TextInput
                        label="新西兰市场参考区间"
                        value={draft.nzMarketRange ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'nzMarketRange', value)}
                        placeholder="$65,000 - $72,000 NZD"
                      />
                      <TextInput
                        label="Opportunity Score（0-100）"
                        value={draft.opportunityScore?.toString() ?? ''}
                        onChange={(value) => setJapanSpecialOrderDrafts((current) => current.map((item) => item.slug === draft.slug ? { ...item, opportunityScore: value ? Math.max(0, Math.min(100, Number(value))) : undefined } : item))}
                        placeholder="82"
                      />
                      <TextInput
                        label="车辆数据更新时间"
                        value={draft.updatedAt ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'updatedAt', value)}
                        placeholder="20 July 2026, 4:30 PM"
                        className="md:col-span-2"
                      />
                      <TextareaInput
                        label="英文简介 *"
                        value={draft.summary}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'summary', value)
                        }
                      />
                      <TextareaInput
                        label="中文简介 *"
                        value={draft.zhSummary}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'zhSummary', value)
                        }
                      />
                      <TextareaInput
                        label="英文推荐理由"
                        value={draft.recommendation ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'recommendation', value)}
                      />
                      <TextareaInput
                        label="中文推荐理由"
                        value={draft.zhRecommendation ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'zhRecommendation', value)}
                      />
                      <TextareaInput
                        label="英文风险提示"
                        value={draft.risk ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'risk', value)}
                      />
                      <TextareaInput
                        label="中文风险提示"
                        value={draft.zhRisk ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'zhRisk', value)}
                      />
                      <TextareaInput
                        label="英文适合客户"
                        value={draft.recommendedFor ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'recommendedFor', value)}
                      />
                      <TextareaInput
                        label="中文适合客户"
                        value={draft.zhRecommendedFor ?? ''}
                        onChange={(value) => updateJapanSpecialOrderDraftField(draft.slug, 'zhRecommendedFor', value)}
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                        {uploadingJapanSpecialOrderImageMap[draft.slug]
                          ? '图片上传中...'
                          : '上传卡片图片'}
                        <input
                          type="file"
                          accept="image/*,.webp,.avif,.heic,.heif"
                          multiple
                          className="hidden"
                          disabled={uploadingJapanSpecialOrderImageMap[draft.slug]}
                          onChange={(event) => {
                            void handleUploadJapanSpecialOrderImage(draft.slug, event.target.files);
                            event.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    {draft.imagesText ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-4">
                        {splitImageText(draft.imagesText).map((image, imageIndex, imageList) => (
                          <div
                            key={`${draft.slug}-${image}`}
                            className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"
                          >
                            <button
                              type="button"
                              onClick={() => removeJapanSpecialOrderImage(draft.slug, image)}
                              className="absolute right-2 top-2 z-10 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                              aria-label={`删除第 ${imageIndex + 1} 张图片`}
                            >
                              删除
                            </button>
                            <img
                              src={image}
                              alt={`${draft.title} ${imageIndex + 1}`}
                              className="h-32 w-full object-contain"
                            />
                            <p className="mt-1 text-center text-xs text-slate-500">
                              {imageIndex === 0 ? '主图' : `图 ${imageIndex + 1}`}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => moveJapanSpecialOrderImage(draft.slug, image, -1)}
                                disabled={imageIndex === 0}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                前移
                              </button>
                              <button
                                type="button"
                                onClick={() => moveJapanSpecialOrderImage(draft.slug, image, 1)}
                                disabled={imageIndex === imageList.length - 1}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                后移
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </div>
        </section> : null}

        {mode === 'main' ? <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">供应商/合作方卡片</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              编辑服务与车主支持页面使用的供应商和合作方信息。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addPartnerDraft}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              + 添加供应商/合作方
            </button>
            <button
              type="button"
              onClick={handleSavePartners}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
            >
              保存供应商
            </button>
            <button
              type="button"
              onClick={handleResetPartners}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              恢复供应商默认
            </button>
          </div>

          <div className="space-y-4">
            {partnerDrafts.map((draft, index) => (
              <div
                key={draft.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      供应商 #{index + 1} - {draft.name || '未命名'}
                    </h2>
                    <p className="text-xs text-slate-500">{draft.address || '暂无地址'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPartnerId((current) => (current === draft.id ? null : draft.id))
                      }
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      {expandedPartnerId === draft.id ? '收起' : '编辑'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePartnerDraft(draft.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {expandedPartnerId !== draft.id ? null : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextInput
                        label="ID *"
                        value={draft.id}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'id', value)}
                      />
                      <TextInput
                        label="名称 *"
                        value={draft.name}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'name', value)}
                      />
                      <TextInput
                        label="地址 *"
                        value={draft.address}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'address', value)}
                        className="md:col-span-2"
                      />
                      <TextInput
                        label="网站"
                        value={draft.website ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'website', value)}
                        placeholder="https://..."
                      />
                      <TextInput
                        label="邮箱"
                        value={draft.email ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'email', value)}
                      />
                      <TextInput
                        label="电话"
                        value={draft.phone ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'phone', value)}
                      />
                      <TextInput
                        label="营业时间"
                        value={draft.hours ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'hours', value)}
                      />
                      <TextInput
                        label="Logo URL"
                        value={draft.logoSrc ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'logoSrc', value)}
                        placeholder="https://..."
                      />
                      <TextInput
                        label="Logo 说明"
                        value={draft.logoAlt ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'logoAlt', value)}
                      />
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">Logo 背景</span>
                        <select
                          value={draft.logoPanel ?? 'light'}
                          onChange={(event) =>
                            updatePartnerDraftField(draft.id, 'logoPanel', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                        >
                          <option value="light">浅色</option>
                          <option value="dark">深色</option>
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">Logo 适配</span>
                        <select
                          value={draft.logoFit ?? 'contain'}
                          onChange={(event) =>
                            updatePartnerDraftField(draft.id, 'logoFit', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                        >
                          <option value="contain">完整显示</option>
                          <option value="cover">填充裁切</option>
                        </select>
                      </label>
                      <TextInput
                        label="文字 Logo 第一行（可选）"
                        value={draft.logoWordmarkLine1}
                        onChange={(value) =>
                          updatePartnerDraftField(draft.id, 'logoWordmarkLine1', value)
                        }
                      />
                      <TextInput
                        label="文字 Logo 第二行（可选）"
                        value={draft.logoWordmarkLine2}
                        onChange={(value) =>
                          updatePartnerDraftField(draft.id, 'logoWordmarkLine2', value)
                        }
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                        {uploadingPartnerLogoMap[draft.id]
                          ? '供应商 logo 上传中...'
                          : '上传供应商 Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPartnerLogoMap[draft.id]}
                          onChange={(event) => {
                            void handleUploadPartnerLogo(draft.id, event.target.files);
                            event.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    {draft.logoSrc ? (
                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                        <img
                          src={draft.logoSrc}
                          alt={draft.logoAlt || draft.name}
                          className="h-24 w-full rounded-lg object-contain"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </div>
        </section> : null}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  className = '',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
    </label>
  );
}
