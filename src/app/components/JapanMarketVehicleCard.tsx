import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import {
  formatMileage,
  formatNzd,
  japanMarketVehiclePath,
  type JapanMarketVehicleSummary,
  vehicleName,
} from '../../data/japanMarket';
import { useLanguage } from './SiteTranslator';

export function JapanMarketVehicleVisual({ vehicle, className = '' }: { vehicle: JapanMarketVehicleSummary; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#17191c] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_46%,rgba(199,162,74,0.18),transparent_29%)]" />
      <div className="absolute -right-12 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-primary/25" />
      <div className="absolute -right-1 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute bottom-0 right-0 h-1/2 w-2/3 -skew-x-12 border-l border-t border-white/7 bg-white/[0.025]" />
      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
        <div className="relative flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          <span>Inno Group</span>
          <span>{vehicle.bodyType}</span>
        </div>
        <div className="relative">
          <div className="mb-4 h-px w-12 bg-primary" />
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Japan Market</p>
          <p className="mt-2 max-w-[78%] text-xl font-semibold leading-tight text-white">{vehicle.make}</p>
        </div>
      </div>
    </div>
  );
}

export function JapanMarketVehicleCard({ vehicle, compact = false }: { vehicle: JapanMarketVehicleSummary; compact?: boolean }) {
  const { language, text } = useLanguage();
  const hasPrice = vehicle.estimatedNzdPrice != null;

  return (
    <Link
      to={japanMarketVehiclePath(vehicle)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/65 transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:bg-white"
    >
      <JapanMarketVehicleVisual vehicle={vehicle} className={compact ? 'aspect-[16/10]' : 'aspect-[4/3]'} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#8b6b1d]">Japan Market</span>
          <span className="text-sm font-bold text-foreground/48">{vehicle.year}</span>
        </div>
        <h3 className="mt-4 line-clamp-2 text-xl leading-snug">{vehicleName(vehicle)}</h3>
        {vehicle.variant ? <p className="mt-1 line-clamp-1 text-sm text-foreground/48">{vehicle.variant}</p> : null}
        <div className="mt-5 space-y-2 border-t border-black/7 pt-4 text-sm text-foreground/65">
          <p className="flex items-center justify-between"><span>{formatMileage(vehicle.mileage, language)}</span><span>{vehicle.auctionGrade ? `${text({ en: 'Grade', zh: '评分' })} ${vehicle.auctionGrade}` : text({ en: 'Unrated', zh: '暂无评分' })}</span></p>
          <p>{vehicle.fuelType} · {vehicle.transmission}</p>
        </div>
        <div className="mt-auto pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/42">{text({ en: 'Estimated landed price', zh: '预计新西兰落地价' })}</p>
          <p className="mt-1 text-xl font-extrabold text-foreground">{formatNzd(vehicle.estimatedNzdPrice, language)} {hasPrice ? <span className="text-xs font-semibold text-foreground/45">{text({ en: 'landed', zh: '落地' })}</span> : null}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-foreground">
            {text({ en: 'View Details', zh: '查看详情' })} <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
