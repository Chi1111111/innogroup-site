import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMarketSnapshot, marketReturnFromState, marketSnapshotToRestore, readMarketReturn, saveMarketSnapshot } from './japanMarketNavigation';

const storage = new Map<string, string>();
const location = { key: 'filtered-page', pathname: '/japan-market', search: '?make=Toyota&page=3', hash: '', state: null };
const snapshot = { key: location.key, href: location.pathname + location.search, layout: 'grid' as const, scrollY: 1850 };

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('window', { sessionStorage: {
    setItem: (key: string, value: string) => storage.set(key, value),
    getItem: (key: string) => storage.get(key) ?? null,
  } });
});

describe('Japan Market return navigation', () => {
  it('preserves exact filter/page URL, grid layout and position on browser back or reload', () => {
    saveMarketSnapshot(snapshot);
    expect(marketSnapshotToRestore(location, 'POP')).toEqual(snapshot);
    expect(marketReturnFromState({ japanMarketReturn: snapshot })).toEqual({ key: location.key, href: snapshot.href });
  });

  it('does not restore a stale position for a normal menu visit or a different filter/page', () => {
    saveMarketSnapshot(snapshot);
    expect(marketSnapshotToRestore(location, 'PUSH')).toBeNull();
    expect(marketSnapshotToRestore({ ...location, search: '?make=Toyota&page=4' }, 'POP')).toBeNull();
  });

  it('can restore an explicit return under a new history key without losing its source URL', () => {
    saveMarketSnapshot(snapshot);
    expect(marketSnapshotToRestore({ ...location, key: 'new-key', state: { japanMarketRestoreKey: snapshot.key } }, 'PUSH')).toEqual(snapshot);
  });

  it('lets a hash destination override the saved list scroll', () => {
    saveMarketSnapshot(snapshot);
    expect(marketSnapshotToRestore({ ...location, hash: '#market-help' }, 'POP')).toBeNull();
  });

  it('reads a persisted snapshot after the in-memory context is lost', () => {
    const persisted = { ...snapshot, key: 'from-previous-document' };
    storage.set('inno-market-list:' + persisted.key, JSON.stringify(persisted));
    expect(loadMarketSnapshot(persisted.key)).toEqual(persisted);
  });

  it('falls back safely for a directly opened detail or malformed return state', () => {
    expect(marketReturnFromState(null)).toBeNull();
    expect(readMarketReturn({ key: 'unsafe', href: 'https://example.com' })).toBeNull();
    expect(readMarketReturn({ key: 'unsafe', href: '//example.com/japan-market' })).toBeNull();
    expect(readMarketReturn({ key: 'unsafe', href: '/contact' })).toBeNull();
    expect(marketSnapshotToRestore({ ...location, key: 'direct' }, 'POP')).toBeNull();
  });

  it('retains make/model landing routes and rejects corrupt stored positions', () => {
    expect(readMarketReturn({ key: 'landing', href: '/japan-market/toyota/alphard?yearFrom=2020' }))
      .toEqual({ key: 'landing', href: '/japan-market/toyota/alphard?yearFrom=2020' });
    storage.set('inno-market-list:corrupt', JSON.stringify({ ...snapshot, key: 'corrupt', scrollY: -30 }));
    expect(loadMarketSnapshot('corrupt')).toBeNull();
  });

  it('keeps same-tab return working when session storage is blocked', () => {
    vi.stubGlobal('window', { get sessionStorage() { throw new Error('Storage blocked'); } });
    const inMemory = { ...snapshot, key: 'memory-only' };
    expect(() => saveMarketSnapshot(inMemory)).not.toThrow();
    expect(loadMarketSnapshot(inMemory.key)).toEqual(inMemory);
  });
});
