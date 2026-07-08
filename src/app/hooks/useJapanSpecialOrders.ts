import { useEffect, useState } from 'react';
import { japanSpecialOrderVehicles } from '../../data/japanSpecialOrders';

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
}

const JAPAN_SPECIAL_ORDERS_STORAGE_KEY = 'inno:japan-special-orders:v1';

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

    const parsed = JSON.parse(raw) as Partial<JapanSpecialOrderVehicle>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return japanSpecialOrderVehicles;

    const nextVehicles = parsed.filter(isValidVehicle);
    return nextVehicles.length > 0 ? nextVehicles : japanSpecialOrderVehicles;
  } catch {
    return japanSpecialOrderVehicles;
  }
}

export function useJapanSpecialOrders() {
  const [vehicles, setVehiclesState] = useState<JapanSpecialOrderVehicle[]>(() =>
    readJapanSpecialOrders()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(JAPAN_SPECIAL_ORDERS_STORAGE_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  const setVehicles = (nextVehicles: JapanSpecialOrderVehicle[]) => {
    setVehiclesState(nextVehicles);
  };

  const resetVehicles = () => {
    setVehiclesState(japanSpecialOrderVehicles);
  };

  return {
    vehicles,
    setVehicles,
    resetVehicles,
  };
}
