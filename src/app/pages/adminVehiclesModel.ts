import type { PartnerPlaceholder } from '../../data/services';
import {
  type JapanSpecialOrderVehicle,
  type JapanWeeklyReportMeta,
  type JapanWeeklyReportState,
} from '../hooks/useJapanSpecialOrders';

export interface PartnerDraft extends PartnerPlaceholder {
  logoWordmarkLine1: string;
  logoWordmarkLine2: string;
}

export interface JapanSpecialOrderDraft extends JapanSpecialOrderVehicle {
  imagesText: string;
}

export interface AdminNotice {
  type: 'success' | 'error' | 'info';
  text: string;
}

export type WeeklyAutoSaveStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'incomplete' | 'error';

type WeeklyReportBuildResult =
  | { report: JapanWeeklyReportState; error: null }
  | { report: null; error: string };

export const EMPTY_PARTNER_DRAFT: PartnerDraft = {
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

export const EMPTY_JAPAN_SPECIAL_ORDER_DRAFT: JapanSpecialOrderDraft = {
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

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function splitImageText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function toPartnerDraft(partner: PartnerPlaceholder): PartnerDraft {
  return {
    ...partner,
    logoWordmarkLine1: partner.logoWordmark?.line1 ?? '',
    logoWordmarkLine2: partner.logoWordmark?.line2 ?? '',
  };
}

export function toPartner(draft: PartnerDraft): PartnerPlaceholder | null {
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

export function toJapanSpecialOrderDraft(vehicle: JapanSpecialOrderVehicle): JapanSpecialOrderDraft {
  const images = Array.from(new Set([vehicle.image, ...(vehicle.images ?? [])].filter(Boolean)));

  return {
    ...vehicle,
    image: images[0] ?? vehicle.image,
    images,
    imagesText: images.join('\n'),
  };
}

export function toJapanSpecialOrderVehicle(draft: JapanSpecialOrderDraft): JapanSpecialOrderVehicle | null {
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

export function normalizeSmartSourceText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function findFirstMatch(text: string, patterns: RegExp[]) {
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

export function parseJapanFindSource(source: string) {
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

export function getNoticeClass(type: AdminNotice['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

export function buildWeeklyReport(
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
