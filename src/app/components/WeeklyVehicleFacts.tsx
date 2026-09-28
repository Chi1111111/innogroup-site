import type { JapanSpecialOrderVehicle } from '../../data/japanSpecialOrderTypes';
import { formatWeeklyMileage, formatWeeklyPrice } from '../lib/weeklyVehicleDisplay';
import { useLanguage } from './SiteTranslator';

export function WeeklyVehicleFacts({ vehicle }: { vehicle: JapanSpecialOrderVehicle }) {
  const { text } = useLanguage();
  return (
    <dl className="mt-4 overflow-hidden rounded-2xl border border-[#c7a24a]/25 bg-[#fcf8ef]">
      <div className="border-b border-[#c7a24a]/20 px-4 py-3">
        <dt className="text-xs font-semibold text-[#625332]">{text({ en: vehicle.landedEstimate ? 'Estimated landed price' : 'Price', zh: vehicle.landedEstimate ? '预计落地价' : '车辆价格' })}</dt>
        <dd className="mt-1 break-words text-[28px] font-extrabold leading-tight tracking-tight text-[#171716] tabular-nums !normal-case">{formatWeeklyPrice(vehicle.landedEstimate || vehicle.price)}</dd>
      </div>
      <div className="grid grid-cols-[0.8fr_1.2fr] divide-x divide-[#c7a24a]/20">
        <div className="min-w-0 px-4 py-3"><dt className="text-xs font-semibold text-[#625332]">{text({ en: 'Year', zh: '年份' })}</dt><dd className="mt-1 text-xl font-bold text-[#171716] tabular-nums !normal-case">{vehicle.year || '—'}</dd></div>
        <div className="min-w-0 px-4 py-3"><dt className="text-xs font-semibold text-[#625332]">{text({ en: 'Mileage', zh: '公里数' })}</dt><dd className="mt-1 break-words text-xl font-bold text-[#171716] tabular-nums !normal-case">{formatWeeklyMileage(vehicle.mileage)}</dd></div>
      </div>
    </dl>
  );
}
