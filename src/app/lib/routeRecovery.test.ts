import { describe, expect, it, vi } from 'vitest';
import { isRouteChunkError, recoverRouteChunk } from './routeRecovery';

const chunkError = new TypeError('Failed to fetch dynamically imported module: https://www.innogroup.co.nz/assets/JapanMarket-old.js');

function environment() {
  const values = new Map<string, string>();
  return {
    pathname: '/japan-market', online: true, reload: vi.fn(),
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    },
  };
}

describe('route loading recovery', () => {
  it.each([
    chunkError.message,
    'error loading dynamically imported module: https://example.com/page.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/page.css',
    'Loading chunk 3 failed.',
  ])('recognises the browser module failure: %s', (message) => {
    expect(isRouteChunkError(new Error(message))).toBe(true);
  });

  it('reloads once and persists the guard across a new document and different routes', () => {
    const first = environment();
    expect(recoverRouteChunk(chunkError, first)).toBe(true);
    const nextDocument = { ...environment(), storage: first.storage, pathname: '/services' };
    expect(recoverRouteChunk(chunkError, nextDocument)).toBe(false);
    expect(first.reload).toHaveBeenCalledTimes(1);
    expect(nextDocument.reload).not.toHaveBeenCalled();
  });

  it.each([new Error('Failed to fetch'), new Error('Cannot read properties of undefined'), null, { status: 404 }])('does not reload unrelated application or API errors', (error) => {
    const env = environment();
    expect(recoverRouteChunk(error, env)).toBe(false);
    expect(env.reload).not.toHaveBeenCalled();
  });

  it('leaves offline recovery to the visitor without consuming the retry', () => {
    const env = environment();
    expect(recoverRouteChunk(chunkError, { ...env, online: false })).toBe(false);
    expect(env.reload).not.toHaveBeenCalled();
    expect(recoverRouteChunk(chunkError, env)).toBe(true);
  });

  it.each(['/admin', '/admin/contracts', '/sign/123', '/contract/123'])('does not automatically reload a sensitive workflow: %s', (pathname) => {
    const env = { ...environment(), pathname };
    expect(recoverRouteChunk(chunkError, env)).toBe(false);
    expect(env.reload).not.toHaveBeenCalled();
  });

  it.each(['getItem', 'setItem'] as const)('does not reload if storage %s is blocked', (method) => {
    const env = environment();
    env.storage[method] = () => { throw new Error('Storage blocked'); };
    expect(recoverRouteChunk(chunkError, env)).toBe(false);
    expect(env.reload).not.toHaveBeenCalled();
  });
});
