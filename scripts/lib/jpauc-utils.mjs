import fs from 'node:fs';

const LOST_TEXT_MARKERS = /\uFFFD|\?{3,}/g;
const MULTI_WORD_MAKES = ['MERCEDES BENZ', 'LAND ROVER', 'ALFA ROMEO', 'ASTON MARTIN', 'ROLLS ROYCE'];

export function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

export function normalizeText(value) {
  return String(value ?? '')
    .replace(LOST_TEXT_MARKERS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeScrapedValue(value) {
  if (typeof value === 'string') return normalizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeScrapedValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, sanitizeScrapedValue(item)])
  );
}

export function parseMakerModel(value) {
  const normalized = normalizeText(value);
  if (!normalized) return { maker: '', model: '' };

  const upper = normalized.toUpperCase();
  const multiWordMake = MULTI_WORD_MAKES.find(
    (make) => upper === make || upper.startsWith(`${make} `)
  );
  if (multiWordMake) {
    return {
      maker: multiWordMake,
      model: normalizeText(normalized.slice(multiWordMake.length)),
    };
  }

  const [maker = '', ...modelParts] = normalized.split(' ');
  const model = normalizeText(modelParts.join(' '));
  return {
    maker: normalizeText(maker),
    model: model.startsWith(`${maker} `) ? normalizeText(model.slice(maker.length)) : model,
  };
}

export function parsePrice(value) {
  const match = value.match(/[\u00a5\uffe5]?\s*[\d,]+/);
  return match ? normalizeText(match[0]) : '';
}

export function parseByPrefix(value, prefix) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = value.match(new RegExp(`${escaped}\\s*:?\\s*([^|]+)`, 'i'));
  return found ? normalizeText(found[1]) : '';
}

export function parseYearOnly(yearGrade) {
  return yearGrade.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? '';
}

export function parseModelGrade(yearGrade) {
  return normalizeText(yearGrade.replace(/Year:\s*(?:19|20)\d{2}\s*/i, ''));
}

export function toAbsoluteUrl(candidate, baseUrl) {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return '';
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function readExistingOutput(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' && Array.isArray(parsed.vehicles) ? parsed : null;
  } catch {
    return null;
  }
}

export function mergeVehiclesById(existingVehicles, nextVehicles) {
  const merged = existingVehicles.filter((item) => item?.id);
  const indexById = new Map(merged.map((item, index) => [item.id, index]));

  for (const item of nextVehicles) {
    if (!item?.id) continue;
    const existingIndex = indexById.get(item.id);
    if (existingIndex === undefined) {
      indexById.set(item.id, merged.length);
      merged.push(item);
    } else {
      merged[existingIndex] = item;
    }
  }
  return merged;
}

export async function runWithConcurrency(items, worker, limit) {
  const outputs = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      outputs[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return outputs;
}
