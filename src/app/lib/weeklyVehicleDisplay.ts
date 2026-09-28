const numberFormat = new Intl.NumberFormat('en-NZ', { maximumFractionDigits: 2 });

export function formatWeeklyMileage(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^([\d,]+(?:\.\d+)?)\s*(?:km|kms|kilometres?|kilometers?|公里)?$/i);
  if (!match) return trimmed || '—';
  const amount = Number(match[1].replaceAll(',', ''));
  return Number.isFinite(amount) ? `${numberFormat.format(amount)} km` : trimmed;
}

/** Only normalize numeric prices; retain qualifiers, ranges and POA verbatim. */
export function formatWeeklyPrice(value: string, fallbackCurrency = 'NZD') {
  const trimmed = value.trim();
  const match = trimmed.match(/^(NZ\$|NZD|JPY|JP¥|¥|￥|US\$|USD|AUD|AU\$|\$)?\s*([\d,]+(?:\.\d+)?)\s*(NZD|JPY|USD|AUD)?$/i);
  if (!match) return trimmed || '—';
  const amount = Number(match[2].replaceAll(',', ''));
  if (!Number.isFinite(amount)) return trimmed;
  const token = (match[3] || match[1] || '').toUpperCase();
  const currency = /JPY|¥|￥/.test(token) ? 'JPY' : /NZ/.test(token) ? 'NZD'
    : /US/.test(token) ? 'USD' : /AU/.test(token) ? 'AUD'
      : token === '$' ? 'NZD' : fallbackCurrency;
  return `${currency} ${currency === 'JPY' ? '¥' : '$'}${numberFormat.format(amount)}`;
}
