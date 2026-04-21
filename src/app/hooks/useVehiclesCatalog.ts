import { useEffect, useState } from 'react';
import { defaultVehicles, type Vehicle } from '../../data/vehicles';

const VEHICLES_STORAGE_KEY = 'inno:vehicles:v1';

function readVehicles(): Vehicle[] {
  if (typeof window === 'undefined') {
    return defaultVehicles;
  }

  try {
    const raw = window.localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (!raw) return defaultVehicles;
    const parsed = JSON.parse(raw) as Vehicle[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultVehicles;
    return parsed;
  } catch {
    return defaultVehicles;
  }
}

export function useVehiclesCatalog() {
  const [vehicles, setVehiclesState] = useState<Vehicle[]>(() => readVehicles());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  const setVehicles = (nextVehicles: Vehicle[]) => {
    setVehiclesState(nextVehicles);
  };

  const resetVehicles = () => {
    setVehiclesState(defaultVehicles);
  };

  return {
    vehicles,
    setVehicles,
    resetVehicles,
  };
}

