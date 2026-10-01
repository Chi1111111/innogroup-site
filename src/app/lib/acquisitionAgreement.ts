import type { VehicleContract } from './contracts';

export interface AcquisitionAgreement {
  date: string;
  registration: string;
  purchasePrice: string;
  depositPaid: string;
  financeSettlement: string;
  financeCompany: string;
  financeReference: string;
  sellerBankName: string;
  sellerBankAccount: string;
  paymentDate: string;
  handoverDate: string;
  handoverLocation: string;
  keysAndAccessories: string;
  disclosedCondition: string;
  securityInterests: string;
  specialConditions: string;
  gstStatus: string;
}

export function emptyAcquisition(): AcquisitionAgreement {
  return { date: '', registration: '', purchasePrice: '', depositPaid: '0', financeSettlement: '0', financeCompany: '', financeReference: '', sellerBankName: '', sellerBankAccount: '', paymentDate: '', handoverDate: '', handoverLocation: '', keysAndAccessories: '', disclosedCondition: '', securityInterests: '', specialConditions: '', gstStatus: 'Private seller — no GST charged' };
}

export const ACQUISITION_FIELDS: Array<{ key: keyof AcquisitionAgreement; label: string; multiline?: boolean }> = [
  { key: 'date', label: '协议日期 / Agreement date' },
  { key: 'purchasePrice', label: '收购总价（NZD）/ Purchase price' },
  { key: 'depositPaid', label: '已付给车主的订金（NZD）/ Deposit paid' },
  { key: 'financeSettlement', label: '直接付给贷款机构（NZD）/ Finance payout' },
  { key: 'financeCompany', label: '贷款机构 / Finance company' },
  { key: 'financeReference', label: '贷款结清编号 / Payout reference' },
  { key: 'sellerBankName', label: '车主账户名 / Account holder' },
  { key: 'sellerBankAccount', label: '车主银行账号 / Bank account' },
  { key: 'paymentDate', label: '付款日期 / Payment date' },
  { key: 'handoverDate', label: '交车日期及时间 / Handover date & time' },
  { key: 'handoverLocation', label: '交车地点 / Handover location' },
  { key: 'keysAndAccessories', label: '钥匙、配件及文件 / Keys, accessories & documents', multiline: true },
  { key: 'disclosedCondition', label: '事故、故障及里程异常披露 / Condition disclosures', multiline: true },
  { key: 'securityInterests', label: '贷款及其他权益披露（无请填 None）/ Security interests', multiline: true },
  { key: 'specialConditions', label: '验车条件及其他约定 / Inspection & special conditions', multiline: true },
];

export function acquisitionCents(value: string): number | null {
  const clean = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean.replaceAll(',', '')) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}
export function acquisitionBalance(agreement: AcquisitionAgreement): number | null {
  const amounts = [agreement.purchasePrice, agreement.depositPaid, agreement.financeSettlement].map(acquisitionCents);
  if (amounts.some(v => v === null)) return null;
  return amounts[0]! - amounts[1]! - amounts[2]!;
}
export function acquisitionMoney(cents: number | null): string {
  return cents === null ? 'NZD __________' : `NZD $${(cents / 100).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export function acquisitionErrors(contract: VehicleContract): string[] {
  if (contract.contractType !== 'vehicle-acquisition') return [];
  const a = contract.acquisitionAgreement ?? emptyAcquisition();
  const errors: string[] = [];
  if (!contract.client.name.trim()) errors.push('请填写卖方姓名。');
  if (!contract.purchasedVehicle.make.trim() || !contract.purchasedVehicle.model.trim() || !contract.purchasedVehicle.vinOrRegistration.trim() || !a.registration.trim()) errors.push('请填写品牌、车型、VIN 和车牌号。');
  if (!a.date.trim() || !a.paymentDate.trim() || !a.handoverDate.trim() || !a.handoverLocation.trim()) errors.push('请填写协议、付款、交车日期及交车地点。');
  if ((acquisitionCents(a.purchasePrice) ?? 0) <= 0 || acquisitionBalance(a) === null) errors.push('金额必须为有效非负数字，最多两位小数，收购价必须大于零。');
  if ((acquisitionBalance(a) ?? 0) < 0) errors.push('订金与贷款清偿款合计不能超过收购总价。');
  if ((acquisitionCents(a.financeSettlement) ?? 0) > 0 && (!a.financeCompany.trim() || !a.financeReference.trim())) errors.push('请填写贷款机构和结清编号。');
  if (!a.sellerBankName.trim() || !a.sellerBankAccount.trim()) errors.push('请填写车主收款账户名和账号。');
  if (!a.disclosedCondition.trim() || !a.securityInterests.trim()) errors.push('请填写车况和权益披露，无相关事项请填 None。');
  return errors;
}

// These acknowledgement slots are also used by the existing signing service for consignment contracts.
export const ACQUISITION_ACKNOWLEDGEMENTS = [
  { key: 'terms', field: 'termsAccepted', label: 'I have read and accept this vehicle acquisition agreement. / 我已阅读并接受收车合同。' },
  { key: 'cin', field: 'cinProvided', label: 'I am the legal owner or authorised seller, and have disclosed all security interests. / 我有权出售车辆并已披露全部第三方权益。' },
  { key: 'docs', field: 'signDocumentsAccepted', label: 'I will provide the documents and notifications required for settlement and transfer. / 我会配合结算及车辆登记变更。' },
  { key: 'odometer', field: 'odometerAcknowledged', label: 'The vehicle, odometer and condition disclosures are accurate to my knowledge. / 据我所知车辆、里程及车况披露真实。' },
  { key: 'privacy', field: 'privacyAccepted', label: 'I authorise use of my information for this transaction, verification and record keeping. / 我同意为本次交易、核验和存档使用资料。' },
  { key: 'deposit', field: 'depositForfeitureAccepted', label: 'I confirm the price, finance payout, balance and handover arrangements. / 我确认收购价、贷款清偿款、尾款及交车安排。' },
] as const;
