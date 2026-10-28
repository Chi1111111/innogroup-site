export interface VehicleIdentity {
  make: string;
  model: string;
  /** Original catalog values, retained for source lookup and exact backend filters. */
  sourceMake?: string;
  sourceModel?: string;
}

const makes = [
  'Toyota', 'Lexus', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi',
  'Suzuki', 'Daihatsu', 'Isuzu', 'BMW', 'MINI', 'Mercedes-Benz', 'Audi',
  'Volkswagen', 'Porsche', 'Volvo', 'Peugeot', 'Renault', 'Citroen',
  'Land Rover', 'Jaguar', 'Ford', 'Chevrolet', 'Jeep', 'Tesla',
] as const;
const makeKey = (value: string) => value.trim().replace(/[\s-]+/g, ' ').toLowerCase();
const canonicalMakes = new Map(makes.map((make) => [makeKey(make), make]));
const tidy = (value: string) => value.trim().replace(/\s+/g, ' ');

export function canonicalVehicleMake(value: string): string {
  return canonicalMakes.get(makeKey(value)) ?? tidy(value);
}

function withoutMakePrefix(model: string, make: string): string {
  // Match complete brand words only: MINI must not strip "Minicab", for example.
  const words = make.split(/[\s-]+/).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const prefix = new RegExp(`^${words.join('[\\s-]+')}(?:\\s+|$)`, 'i');
  return model.replace(prefix, '').trim();
}

export function normalizeVehicleIdentity<T extends VehicleIdentity>(vehicle: T): T {
  const sourceMake = vehicle.sourceMake ?? vehicle.make;
  const sourceModel = vehicle.sourceModel ?? vehicle.model;
  let make = canonicalVehicleMake(vehicle.make);
  let model = withoutMakePrefix(tidy(vehicle.model), make);

  // The feed groups some explicitly named subsidiary brands under the parent.
  // Only correct these known pairs; never infer a brand from a trim or keyword.
  if (make === 'Toyota' && /^lexus\s+/i.test(model)) {
    make = 'Lexus';
    model = withoutMakePrefix(model, make);
  } else if (make === 'BMW' && /^mini\s+/i.test(model)) {
    make = 'MINI';
    model = withoutMakePrefix(model, make);
  }

  if (make === 'Lexus') {
    // Fix the source's title-cased series codes, preserving the remaining trim.
    model = model.replace(/^(RX|NX|UX|GX|LX|LS|IS|ES|GS|RC|LC|CT|HS|SC)\s*(\d{2,3})(h\+?|d|t)?(?=\s|$)/i,
      (_match, series: string, engine: string, suffix: string | undefined) => `${series.toUpperCase()}${engine}${suffix?.toLowerCase() ?? ''}`);
  }
  if (/^(other|others|unknown|not listed|not specified|n\/?a)$/i.test(model)) model = '';

  return { ...vehicle, make, model, sourceMake, sourceModel };
}

export function vehicleModelLabel(vehicle: VehicleIdentity, language: 'en' | 'zh' = 'en') {
  return normalizeVehicleIdentity(vehicle).model || (language === 'zh' ? '车型待确认' : 'Model to confirm');
}
