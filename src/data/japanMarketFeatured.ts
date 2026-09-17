import type { JapanMarketVehicleSummary } from './japanMarket';

export function newZealandDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function hasVehiclePhoto(vehicle: JapanMarketVehicleSummary) {
  if (!vehicle.imageUrl || !vehicle.photoCount) return false;
  try {
    const url = new URL(vehicle.imageUrl);
    return ['https:', 'http:'].includes(url.protocol)
      && !/coming[\s_-]*soon|no[\s_-]*(?:image|photo)|placeholder|image[\s_-]*(?:not|coming)|default[\s_-]*(?:car|image)/i.test(decodeURIComponent(url.pathname));
  } catch { return false; }
}

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

// A stable mixed catalogue, advanced eight positions each NZ calendar day.
// Return reserve candidates as well so broken images can be replaced.
export function dailyFeaturedVehicles(vehicles: JapanMarketVehicleSummary[], day: string) {
  const seen = new Set<string>();
  const eligible = vehicles.filter((vehicle) => {
    if (!hasVehiclePhoto(vehicle) || seen.has(vehicle.id)) return false;
    seen.add(vehicle.id);
    return true;
  }).sort((a, b) => hash(a.id) - hash(b.id) || a.id.localeCompare(b.id));
  if (!eligible.length) return [];
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  const start = ((dayNumber * 8) % eligible.length + eligible.length) % eligible.length;
  return [...eligible.slice(start), ...eligible.slice(0, start)];
}
