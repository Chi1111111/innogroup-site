import { ChevronDown } from 'lucide-react';
import { useLanguage } from './SiteTranslator';
import { formatBodyType, formatFuelType, type JapanMarketVehicleSummary } from '../../data/japanMarket';
import { BODY_TYPES, FUEL_TYPES, PRICE_OPTIONS, type MarketFilters } from '../pages/japanMarketSearch';

interface Props { filters: MarketFilters; vehicles: JapanMarketVehicleSummary[]; update: (patch: Partial<MarketFilters>) => void; }
export function JapanMarketFilters({ filters: f, vehicles, update }: Props) {
  const { language, text } = useLanguage();
  const makes = [...new Set(vehicles.map((v) => v.make))].filter((make) => make !== 'Other').sort();
  const models = [...new Set(vehicles.filter((v) => v.make === f.make).map((v) => v.model))].sort();
  const oldest = vehicles.reduce((min, v) => Math.min(min, v.year), 1990);
  const latest = new Date().getFullYear() + 1;
  const years = Array.from({ length: latest - oldest + 1 }, (_, i) => latest - i);
  return <div className="jm-filter-fields">
    <div className="jm-filter-section">
      <label>{text({ en: 'Make', zh: '品牌' })}<select value={f.make} onChange={(e) => update({ make: e.target.value, model: '' })}>
        <option value="">{text({ en: 'All makes', zh: '全部品牌' })}</option>{makes.map((make) => <option key={make}>{make}</option>)}
        <option value="Other">{text({ en: 'Other makes', zh: '其他品牌（合并）' })}</option>
      </select></label>
      <label>{text({ en: 'Model', zh: '车型' })}<select value={f.model} disabled={!f.make || f.make === 'Other'} onChange={(e) => update({ model: e.target.value })}>
        <option value="">{text({ en: 'All models', zh: '全部车型' })}</option>{models.map((model) => <option key={model}>{model}</option>)}
      </select></label>
    </div>
    <div className="jm-filter-section">
      <label>{text({ en: 'Landed budget (NZD)', zh: '落地预算（纽币）' })}<select value={f.price} onChange={(e) => update({ price: e.target.value })}>
        <option value="">{text({ en: 'Any budget', zh: '不限预算' })}</option>{PRICE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{text(option)}</option>)}
      </select></label><p className="jm-field-note">{text({ en: 'Estimated NZ landed cost, not the Japan sale price.', zh: '预计新西兰落地费用，并非日本售价。' })}</p>
    </div>
    <div className="jm-filter-section">
      <fieldset><legend>{text({ en: 'Year', zh: '年份' })}</legend><div className="jm-range">
        <select aria-label={text({ en: 'Year from', zh: '起始年份' })} value={f.yearFrom} onChange={(e) => update({ yearFrom: e.target.value, ...(f.yearTo && Number(e.target.value) > Number(f.yearTo) ? { yearTo: '' } : {}) })}>
          <option value="">{text({ en: 'From', zh: '不限下限' })}</option>{years.map((year) => <option key={year}>{year}</option>)}
        </select><span>–</span>
        <select aria-label={text({ en: 'Year to', zh: '结束年份' })} value={f.yearTo} onChange={(e) => update({ yearTo: e.target.value, ...(e.target.value && f.yearFrom && Number(e.target.value) < Number(f.yearFrom) ? { yearFrom: '' } : {}) })}>
          <option value="">{text({ en: 'To', zh: '不限上限' })}</option>{years.map((year) => <option key={year}>{year}</option>)}
        </select>
      </div></fieldset>
      <label>{text({ en: 'Mileage', zh: '里程' })}<select value={f.mileage} onChange={(e) => update({ mileage: e.target.value })}>
        <option value="">{text({ en: 'Any mileage', zh: '不限里程' })}</option>{[20000, 40000, 60000, 100000].map((km) => <option key={km} value={km}>{text({ en: `Under ${km.toLocaleString('en-NZ')} km`, zh: `${km.toLocaleString('en-NZ')} 公里以下` })}</option>)}
      </select></label>
    </div>
    <details className="jm-filter-section" open><summary>{text({ en: 'Fuel type', zh: '燃料类型' })}<ChevronDown size={16} /></summary>
      <div className="jm-checks">{FUEL_TYPES.map((fuel) => <label key={fuel}><input type="checkbox" checked={f.fuels.includes(fuel)} onChange={() => update({ fuels: f.fuels.includes(fuel) ? f.fuels.filter((v) => v !== fuel) : [...f.fuels, fuel] })} />{formatFuelType(fuel, language)}</label>)}</div>
    </details>
    <details className="jm-filter-section" open><summary>{text({ en: 'Body type', zh: '车身类型' })}<ChevronDown size={16} /></summary>
      <div className="jm-checks">{BODY_TYPES.map((body) => <label key={body}><input type="checkbox" checked={f.bodies.includes(body)} onChange={() => update({ bodies: f.bodies.includes(body) ? f.bodies.filter((v) => v !== body) : [...f.bodies, body] })} />{formatBodyType(body, language)}</label>)}</div>
    </details>
  </div>;
}
