export interface QuoteEstimate {
  vehiclePriceJPY: number;
  exchangeRate: number;
  rateDate: string;
  rateStatus: 'loading' | 'live' | 'fallback';
  landedPriceNZD: number;
}

/** Keep the rate used at calculation time, even if a later rate request finishes. */
export function formatQuoteEstimate(estimate: QuoteEstimate, language: 'en' | 'zh'): string {
  const price = estimate.vehiclePriceJPY.toLocaleString('en-NZ', { maximumFractionDigits: 2 });
  const total = estimate.landedPriceNZD.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rate = `1 NZD = ${estimate.exchangeRate.toFixed(2)} JPY`;
  const date = estimate.rateDate ? ` (${estimate.rateDate})` : '';
  const fallback = estimate.rateStatus !== 'live';

  return language === 'zh'
    ? [
      '日本进口车辆估价咨询',
      `日本车辆价格：¥${price} JPY`,
      `${fallback ? '备用参考汇率' : '参考汇率'}${date}：${rate}`,
      `预计新西兰落地价：$${total} NZD`,
      '仅供估算，请协助确认具体车辆和最终费用。',
    ].join('\n')
    : [
      'Japan vehicle import estimate enquiry',
      `Vehicle price: ¥${price} JPY`,
      `${fallback ? 'Fallback reference rate' : 'Reference rate'}${date}: ${rate}`,
      `Estimated landed price: $${total} NZD`,
      'Estimate only. Please help confirm the vehicle and final costs.',
    ].join('\n');
}

export function combineQuoteMessage(message: string, estimateNote: string | null): string {
  return [message.trim(), estimateNote?.trim()].filter(Boolean).join('\n\n') || 'No additional details provided';
}
