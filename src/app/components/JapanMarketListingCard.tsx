import { useState } from 'react';
import { ArrowUpRight, CarFront, Images, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { formatBodyType, formatFuelType, formatMileage, formatNzd, formatTransmission, japanMarketVehiclePath, vehicleName, vehicleVariant, type JapanMarketVehicleSummary } from '../../data/japanMarket';
import { useLanguage } from './SiteTranslator';

export function JapanMarketListingCard({ vehicle: v, priority = false }: { vehicle: JapanMarketVehicleSummary; priority?: boolean }) {
  const { language, text } = useLanguage();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = v.imageUrl && failedImage !== v.imageUrl;
  const variant = vehicleVariant(v);
  return <article className="jm-listing" data-vehicle-id={v.id}>
    <Link to={japanMarketVehiclePath(v)} className="jm-photo" aria-label={text({ en: `View ${v.year} ${vehicleName(v)}`, zh: `查看 ${v.year} ${vehicleName(v)}` })}>
      {hasImage ? <img src={v.imageUrl!} alt={`${v.year} ${vehicleName(v)}`} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} referrerPolicy="no-referrer" onError={() => setFailedImage(v.imageUrl!)} />
        : <span className="jm-photo-empty"><CarFront size={42} strokeWidth={1.3} /><span>{text({ en: 'Photo unavailable', zh: '暂无照片' })}</span></span>}
      {!!v.photoCount && hasImage && <span className="jm-photo-count"><Images size={15} />{v.photoCount}</span>}
    </Link>
    <div className="jm-car-info">
      <div className="jm-car-heading"><span className="jm-car-year">{v.year}</span><span>{formatBodyType(v.bodyType, language)}</span></div>
      <h2><Link to={japanMarketVehiclePath(v)}>{vehicleName(v)}</Link></h2><p className="jm-variant">{variant || text({ en: 'Japanese dealer listing', zh: '日本经销商车源' })}</p>
      <dl className="jm-specs">
        <div><dt>{text({ en: 'Mileage', zh: '里程' })}</dt><dd>{formatMileage(v.mileage, language)}</dd></div>
        <div><dt>{text({ en: 'Fuel', zh: '燃料' })}</dt><dd>{formatFuelType(v.fuelType, language)}</dd></div>
        <div><dt>{text({ en: 'Gearbox', zh: '变速箱' })}</dt><dd>{formatTransmission(v.transmission, language)}</dd></div>
      </dl>
      <div className="jm-car-meta"><span><MapPin size={14} />{text({ en: 'Japan', zh: '日本' })} · {v.source || 'Carsensor'}</span>
        <span className={v.hasAccident === true ? 'jm-condition-warning' : ''}>{v.hasAccident === false ? text({ en: 'No accident reported', zh: '暂无事故记录' }) : v.hasAccident === true ? text({ en: 'Accident history', zh: '有事故记录' }) : text({ en: 'Condition to confirm', zh: '车况待确认' })}</span>
      </div>
    </div>
    <div className="jm-car-price"><span className="jm-price-label">{text({ en: 'Est. NZ landed price', zh: '预计新西兰落地价' })}</span><strong>{formatNzd(v.estimatedNzdPrice, language)}</strong><span className="jm-price-note">{text({ en: 'Availability & final cost to confirm', zh: '库存及最终费用需确认' })}</span>
      <Link to={japanMarketVehiclePath(v)} className="jm-details-link">{text({ en: 'View vehicle', zh: '查看车辆' })}<ArrowUpRight size={18} /></Link>
    </div>
  </article>;
}
