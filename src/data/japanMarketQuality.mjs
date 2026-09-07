// Shared by the collector and browser so old snapshots receive the same checks.
export function vehicleQualityIssue(value, currentYear = new Date().getFullYear()) {
  if (!value || typeof value !== 'object') return 'invalid_record';
  const { id, make, model, year, mileage } = value;
  if (typeof id !== 'string' || !id.trim()) return 'missing_id';
  if (typeof make !== 'string' || !make.trim() || make.length > 40
    || !/^[\p{L}\p{N} .&'’()\/-]+$/u.test(make)
    || /https?|www|\betc\b|\/\*/i.test(make)) return 'invalid_make';
  if (typeof model !== 'string' || !model.trim() || model.length > 80
    || /[<>={}\uFFFD]|\/\*|https?:|www\.|\?{2,}/i.test(model)) return 'invalid_model';
  if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) return 'invalid_year';
  if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000) return 'invalid_mileage';
  return null;
}
