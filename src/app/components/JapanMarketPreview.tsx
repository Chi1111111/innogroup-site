import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { loadJapanMarketFeatured, type JapanMarketPayload } from '../../data/japanMarket';
import { useLanguage } from './SiteTranslator';
import { JapanMarketVehicleCard } from './JapanMarketVehicleCard';

export function JapanMarketPreview() {
  const { text } = useLanguage();
  const [payload, setPayload] = useState<JapanMarketPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadJapanMarketFeatured()
      .then((data) => active && setPayload(data))
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, []);

  return (
    <section className="border-y border-black/8 bg-[#111214] px-4 py-16 text-white sm:py-20">
      <div className="section-shell">
        <div className="grid gap-7 border-b border-white/10 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Japan Market</p>
            <h2 className="mt-5 max-w-3xl text-white">{text({ en: 'Explore Cars from Japan', zh: '浏览日本市场车辆' })}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/62">
              {text({ en: 'Browse vehicles available for import to New Zealand.', zh: '浏览目前可进口至新西兰的日本车辆。' })}
            </p>
          </div>
          <div className="lg:text-right">
            <p className="text-sm text-white/48">{payload ? text({ en: `${payload.count.toLocaleString('en-NZ')} vehicles available`, zh: `${payload.count.toLocaleString('en-NZ')} 台车辆可浏览` }) : text({ en: 'Live market availability', zh: '日本市场车源' })}</p>
            <Link to="/japan-market" className="mt-3 inline-flex items-center gap-2 font-bold text-primary hover:text-[#e0bd69]">
              {text({ en: 'Browse All Japan Vehicles', zh: '浏览全部日本车辆' })} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {failed ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/64">{text({ en: 'Vehicle information is being refreshed.', zh: '车辆信息正在更新。' })}</p>
            <Link to="/vehicles/find-my-car" className="button-primary mt-5">{text({ en: 'Request a Vehicle', zh: '提交找车需求' })}</Link>
          </div>
        ) : payload ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {payload.vehicles.map((vehicle) => <JapanMarketVehicleCard key={vehicle.id} vehicle={vehicle} compact />)}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading Japan Market vehicles">
            {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl border border-white/8 bg-white/5" />)}
          </div>
        )}
      </div>
    </section>
  );
}
