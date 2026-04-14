import { defaultVehicles, type Vehicle } from './vehicles';

const VEHICLE_STORAGE_KEY = 'inno:vehicle-catalog:v1';

function cloneVehicles(source: Vehicle[]): Vehicle[] {
  return source.map((vehicle) => ({
    ...vehicle,
    images: vehicle.images ? [...vehicle.images] : undefined,
  }));
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeVehicle(raw: unknown): Vehicle | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const name = normalizeString(data.name);
  const image = normalizeString(data.image);

  if (!name || !image) {
    return null;
  }

  const imagesSource = Array.isArray(data.images) ? data.images : [];
  const images = imagesSource
    .map((value) => normalizeString(value))
    .filter(Boolean);

  return {
    name,
    image,
    images: images.length > 0 ? images : undefined,
    priceRange: normalizeString(data.priceRange) || 'TBC',
    year: normalizeString(data.year) || 'TBC',
    mileage: normalizeString(data.mileage) || 'TBC',
    availability: normalizeString(data.availability) || 'Pre Order',
  };
}

export function getDefaultVehicleCatalog(): Vehicle[] {
  return cloneVehicles(defaultVehicles);
}

export function loadVehicleCatalog(): Vehicle[] {
  if (typeof window === 'undefined') {
    return getDefaultVehicleCatalog();
  }

  try {
    const stored = window.localStorage.getItem(VEHICLE_STORAGE_KEY);

    if (stored === null) {
      const defaults = getDefaultVehicleCatalog();
      window.localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid vehicle catalog format');
    }

    const normalized = parsed
      .map((item) => normalizeVehicle(item))
      .filter((item): item is Vehicle => item !== null);

    if (normalized.length !== parsed.length) {
      window.localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    const defaults = getDefaultVehicleCatalog();
    window.localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveVehicleCatalog(nextVehicles: Vehicle[]): Vehicle[] {
  const normalized = nextVehicles
    .map((vehicle) => normalizeVehicle(vehicle))
    .filter((vehicle): vehicle is Vehicle => vehicle !== null);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function resetVehicleCatalog(): Vehicle[] {
  const defaults = getDefaultVehicleCatalog();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(defaults));
  }

  return defaults;
}
