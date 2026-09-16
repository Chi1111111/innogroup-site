// Stock identity is source-specific; make/model/year never identify a vehicle.
function keys(vehicle) {
  const result = [];
  const id = String(vehicle.id || '').trim().toUpperCase();
  if (id.startsWith('JPJC-')) result.push(`stock:${id.slice(5)}`);
  let sourceUrl;
  try {
    const url = new URL(vehicle.sourceUrl);
    if (url.hostname === 'www.japancars.co.jp' && url.pathname.startsWith('/stock-detail/')) sourceUrl = url.pathname.replace(/\/$/, '');
  } catch { /* Missing URL is normal in legacy imports. */ }
  if (sourceUrl) result.push(`url:${sourceUrl}`);
  if (vehicle.stockNumber && (vehicle.sourceCode === 'japancars' || id.startsWith('JPJC-') || sourceUrl)) result.push(`stock:${String(vehicle.stockNumber).trim().toUpperCase()}`);
  return result;
}
export function createVehicleIdentitySet(vehicles = []) {
  const seen = new Set(vehicles.flatMap(keys));
  return {
    has: vehicle => keys(vehicle).some(key => seen.has(key)),
    add: vehicle => keys(vehicle).forEach(key => seen.add(key)),
  };
}

export function createRepeatedPageGuard() {
  let consecutive = 0;
  return freshCount => {
    consecutive = freshCount > 0 ? 0 : consecutive + 1;
    if (consecutive >= 3) throw Object.assign(new Error('Three consecutive listing pages repeated previously seen vehicles; stopped to avoid an endless scan.'), { code: 'REPEATED_LISTING_PAGES' });
    return consecutive;
  };
}
