import { useEffect, useState } from 'react';
import type { Vehicle } from '../../data/vehicles';
import {
  loadVehicleCatalog,
  resetVehicleCatalog,
  saveVehicleCatalog,
} from '../../data/vehicleStore';

const VEHICLE_STORAGE_KEY = 'inno:vehicle-catalog:v1';

export function useVehiclesCatalog() {
  const [vehicles, setVehiclesState] = useState<Vehicle[]>(() => loadVehicleCatalog());

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== VEHICLE_STORAGE_KEY) {
        return;
      }

      setVehiclesState(loadVehicleCatalog());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setVehicles = (nextVehicles: Vehicle[]) => {
    const saved = saveVehicleCatalog(nextVehicles);
    setVehiclesState(saved);
  };

  const resetVehicles = () => {
    const defaults = resetVehicleCatalog();
    setVehiclesState(defaults);
  };

  return {
    vehicles,
    setVehicles,
    resetVehicles,
  };
}
