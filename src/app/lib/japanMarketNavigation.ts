export type MarketLayout = 'list' | 'grid';

export interface MarketReturnLocation {
  key: string;
  href: string;
}

export interface MarketListSnapshot extends MarketReturnLocation {
  layout: MarketLayout;
  scrollY: number;
}

type NavigationLocation = { key: string; pathname: string; search: string; hash: string; state: unknown };
const STORAGE_PREFIX = 'inno-market-list:';
const snapshots = new Map<string, MarketListSnapshot>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readMarketReturn(value: unknown): MarketReturnLocation | null {
  if (!isRecord(value) || typeof value.key !== 'string' || !value.key || typeof value.href !== 'string') return null;
  // Only local market routes can be used as a return destination.
  if (!/^\/japan-market(?:\/[a-z0-9-]+){0,2}\/?(?:\?[^#]*)?$/i.test(value.href)) return null;
  return { key: value.key, href: value.href };
}

export function marketReturnFromState(state: unknown): MarketReturnLocation | null {
  return readMarketReturn(isRecord(state) ? state.japanMarketReturn : null);
}

export function saveMarketSnapshot(snapshot: MarketListSnapshot): void {
  snapshots.set(snapshot.key, snapshot);
  try { window.sessionStorage.setItem(STORAGE_PREFIX + snapshot.key, JSON.stringify(snapshot)); } catch { /* In-memory restoration still works when storage is unavailable. */ }
}

export function loadMarketSnapshot(key: string): MarketListSnapshot | null {
  const cached = snapshots.get(key);
  if (cached) return cached;
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_PREFIX + key) || 'null');
    const origin = readMarketReturn(value);
    if (!origin || origin.key !== key || !isRecord(value) || !['list', 'grid'].includes(String(value.layout)) || typeof value.scrollY !== 'number' || !Number.isFinite(value.scrollY) || value.scrollY < 0) return null;
    return { ...origin, layout: value.layout as MarketLayout, scrollY: value.scrollY };
  } catch { return null; }
}

export function marketSnapshotToRestore(location: NavigationLocation, navigationType: string): MarketListSnapshot | null {
  if (location.hash) return null; // An explicit anchor takes precedence over saved scrolling.
  const explicitKey = isRecord(location.state) && typeof location.state.japanMarketRestoreKey === 'string'
    ? location.state.japanMarketRestoreKey : null;
  if (!explicitKey && navigationType !== 'POP') return null;
  const snapshot = loadMarketSnapshot(explicitKey || location.key);
  return snapshot?.href === location.pathname + location.search ? snapshot : null;
}
