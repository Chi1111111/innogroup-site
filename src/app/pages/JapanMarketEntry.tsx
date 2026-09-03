import { useParams } from 'react-router';
import { isJapanMarketVehicleId } from '../../data/japanMarket';
import { JapanMarket } from './JapanMarket';
import { JapanMarketVehicleDetail } from './JapanMarketVehicleDetail';

export function JapanMarketEntry() {
  const { segment = '' } = useParams();
  return isJapanMarketVehicleId(segment)
    ? <JapanMarketVehicleDetail vehicleId={segment} />
    : <JapanMarket initialMakeSlug={segment.toLowerCase()} />;
}

export function JapanMarketModelEntry() {
  const { make = '', model = '' } = useParams();
  return <JapanMarket initialMakeSlug={make.toLowerCase()} initialModelSlug={model.toLowerCase()} />;
}
