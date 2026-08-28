import { useParams } from 'react-router';
import { JapanMarket } from './JapanMarket';
import { JapanMarketVehicleDetail } from './JapanMarketVehicleDetail';

export function JapanMarketEntry() {
  const { segment = '' } = useParams();
  return /^JP[\w-]+$/i.test(segment)
    ? <JapanMarketVehicleDetail vehicleId={segment} />
    : <JapanMarket initialMakeSlug={segment.toLowerCase()} />;
}

export function JapanMarketModelEntry() {
  const { make = '', model = '' } = useParams();
  return <JapanMarket initialMakeSlug={make.toLowerCase()} initialModelSlug={model.toLowerCase()} />;
}
