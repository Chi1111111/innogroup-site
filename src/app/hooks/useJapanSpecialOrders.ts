import { useEffect, useState } from 'react';
import { japanSpecialOrderVehicles } from '../../data/japanSpecialOrders';
import {
  loadJapanSpecialOrdersState,
  saveJapanSpecialOrdersState,
} from '../lib/japanSpecialOrders';

export interface JapanSpecialOrderVehicle {
  slug: string;
  title: string;
  zhTitle: string;
  image: string;
  images?: string[];
  price: string;
  year: string;
  mileage: string;
  location: string;
  status: string;
  summary: string;
  zhSummary: string;
  japanPrice?: string;
  landedEstimate?: string;
  nzMarketRange?: string;
  opportunityScore?: number;
  recommendation?: string;
  zhRecommendation?: string;
  risk?: string;
  zhRisk?: string;
  recommendedFor?: string;
  zhRecommendedFor?: string;
  updatedAt?: string;
}

export interface JapanWeeklyReportMeta {
  issueNumber: string;
  publishedAt: string;
  exchangeRate: string;
  dataUpdatedAt: string;
  marketSummary: string;
  zhMarketSummary: string;
  marketNotes: string[];
  zhMarketNotes: string[];
}

export interface JapanWeeklyReportState extends JapanWeeklyReportMeta {
  vehicles: JapanSpecialOrderVehicle[];
}

export const DEFAULT_JAPAN_WEEKLY_REPORT_META: JapanWeeklyReportMeta = {
  issueNumber: '029',
  publishedAt: '20 July 2026',
  exchangeRate: 'Confirm at quotation',
  dataUpdatedAt: 'Updated weekly',
  marketSummary: 'A focused shortlist of Japan vehicle opportunities worth reviewing for New Zealand buyers and trade partners.',
  zhMarketSummary: '为新西兰买家和车商筛选本周值得进一步了解的日本车源机会。',
  marketNotes: [
    'Condition and documentation matter more than headline price on enthusiast vehicles.',
    'Dealer and private-channel stock can suit buyers who value specification over auction timing.',
    'Every landed estimate must be reconfirmed against exchange rate, shipping and compliance.',
  ],
  zhMarketNotes: [
    '玩家车型不能只看表面价格，车况和文件更加重要。',
    '更重视配置而非拍卖时间的买家，可以关注车商和私人渠道。',
    '所有落地价都需要根据汇率、海运和合规要求重新确认。',
  ],
};

const JAPAN_SPECIAL_ORDERS_STORAGE_KEY = 'inno:japan-special-orders:v1';
const JAPAN_WEEKLY_REPORT_STORAGE_KEY = 'inno:japan-weekly-report-meta:v1';

function isValidVehicle(item: Partial<JapanSpecialOrderVehicle>): item is JapanSpecialOrderVehicle {
  return Boolean(
    item.slug &&
      item.title &&
      item.zhTitle &&
      item.image &&
      item.price &&
      item.year &&
      item.mileage &&
      item.location &&
      item.status &&
      item.summary &&
      item.zhSummary
  );
}

export function getJapanSpecialOrderImages(vehicle: JapanSpecialOrderVehicle) {
  return Array.from(new Set([vehicle.image, ...(vehicle.images ?? [])].filter(Boolean)));
}

function readJapanSpecialOrders(): JapanSpecialOrderVehicle[] {
  if (typeof window === 'undefined') {
    return japanSpecialOrderVehicles;
  }

  try {
    const raw = window.localStorage.getItem(JAPAN_SPECIAL_ORDERS_STORAGE_KEY);
    if (!raw) return japanSpecialOrderVehicles;

    const parsed = JSON.parse(raw) as unknown;
    const possibleVehicles = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && 'vehicles' in parsed
        ? (parsed as { vehicles?: unknown }).vehicles
        : null;

    if (!Array.isArray(possibleVehicles) || possibleVehicles.length === 0) {
      return japanSpecialOrderVehicles;
    }

    const nextVehicles = possibleVehicles.filter(isValidVehicle);
    return nextVehicles.length > 0 ? nextVehicles : japanSpecialOrderVehicles;
  } catch {
    return japanSpecialOrderVehicles;
  }
}

function readWeeklyReportMeta(): JapanWeeklyReportMeta {
  if (typeof window === 'undefined') return DEFAULT_JAPAN_WEEKLY_REPORT_META;

  try {
    const raw = window.localStorage.getItem(JAPAN_WEEKLY_REPORT_STORAGE_KEY);
    if (!raw) return DEFAULT_JAPAN_WEEKLY_REPORT_META;
    const stored = JSON.parse(raw) as Partial<JapanWeeklyReportMeta>;

    return {
      ...DEFAULT_JAPAN_WEEKLY_REPORT_META,
      ...stored,
      marketNotes: Array.isArray(stored.marketNotes)
        ? stored.marketNotes
        : DEFAULT_JAPAN_WEEKLY_REPORT_META.marketNotes,
      zhMarketNotes: Array.isArray(stored.zhMarketNotes)
        ? stored.zhMarketNotes
        : DEFAULT_JAPAN_WEEKLY_REPORT_META.zhMarketNotes,
    };
  } catch {
    return DEFAULT_JAPAN_WEEKLY_REPORT_META;
  }
}

function writeLocalJapanSpecialOrders(vehicles: JapanSpecialOrderVehicle[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(JAPAN_SPECIAL_ORDERS_STORAGE_KEY, JSON.stringify(vehicles));
}

function writeWeeklyReportMeta(report: JapanWeeklyReportState) {
  if (typeof window === 'undefined') return;
  const { vehicles: _vehicles, ...meta } = report;
  window.localStorage.setItem(JAPAN_WEEKLY_REPORT_STORAGE_KEY, JSON.stringify(meta));
}

export function useJapanSpecialOrders() {
  const [report, setReportState] = useState<JapanWeeklyReportState>(() => ({
    ...readWeeklyReportMeta(),
    vehicles: readJapanSpecialOrders(),
  }));
  const [isLoadingCloudVehicles, setIsLoadingCloudVehicles] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingCloudVehicles(true);
    loadJapanSpecialOrdersState()
      .then((cloudVehicles) => {
        if (!isMounted || !cloudVehicles || cloudVehicles.length === 0) return;
        const validVehicles = cloudVehicles.filter(isValidVehicle);
        if (validVehicles.length === 0) return;
        setReportState((current) => ({ ...current, vehicles: validVehicles }));
        writeLocalJapanSpecialOrders(validVehicles);
      })
      .catch((error) => {
        console.warn('Could not load Japan special orders from Supabase.', error);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCloudVehicles(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setVehicles = async (nextVehicles: JapanSpecialOrderVehicle[]) => {
    const nextReport = { ...report, vehicles: nextVehicles };
    setReportState(nextReport);
    writeLocalJapanSpecialOrders(nextVehicles);
    await saveJapanSpecialOrdersState(nextVehicles);
  };

  const setReport = async (nextReport: JapanWeeklyReportState) => {
    setReportState(nextReport);
    writeLocalJapanSpecialOrders(nextReport.vehicles);
    writeWeeklyReportMeta(nextReport);
    await saveJapanSpecialOrdersState(nextReport.vehicles);
  };

  const resetVehicles = () => {
    const nextReport = { ...DEFAULT_JAPAN_WEEKLY_REPORT_META, vehicles: japanSpecialOrderVehicles };
    setReportState(nextReport);
    writeLocalJapanSpecialOrders(nextReport.vehicles);
    writeWeeklyReportMeta(nextReport);
  };

  return {
    report,
    vehicles: report.vehicles,
    isLoadingCloudVehicles,
    setVehicles,
    setReport,
    resetVehicles,
  };
}
