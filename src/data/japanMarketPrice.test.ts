import { expect, it } from 'vitest';
import { publicJapanMarketPrice, type JapanMarketVehicleSummary } from './japanMarket';
const base: JapanMarketVehicleSummary = {id:'a',make:'Daihatsu',model:'Tanto',variant:'Custom RS',year:2023,mileage:5000,fuelType:'Petrol',transmission:'CVT',auctionGrade:null,bodyType:'Hatchback',updatedAt:'2026-09-15',imageUrl:'photo'};
it('withholds unverified old estimates while retaining the vehicle and audit inputs', () => {
  for(const price of [200600,593300,18360]) {
    const original={...base,sourceCode:'carsensor',fobPriceNzd:price,estimatedNzdPrice:239000,fobPriceEstimated:true,sourcePriceUsd:118000,sourcePriceType:'CAR PRICE (legacy estimate)'};
    expect(publicJapanMarketPrice(original)).toMatchObject({id:'a',imageUrl:'photo',fobPriceNzd:null,estimatedNzdPrice:null,sourcePriceUsd:118000});
    expect(original.fobPriceNzd).toBe(price);
  }
});
it('only displays finite positive, explicit NZD FOB quotes', () => {
  const quote={...base,sourceCode:'japancars',sourcePriceType:'FOB',priceBasis:'FOB' as const,priceCurrency:'NZD' as const,fobPriceNzd:10360};
  expect(publicJapanMarketPrice(quote).fobPriceNzd).toBe(10360);
  for(const bad of [{sourcePriceType:'CIF'},{sourcePriceType:undefined},{fobPriceEstimated:true},{fobPriceNzd:Infinity},{fobPriceNzd:-1},{fobPriceNzd:0}]) expect(publicJapanMarketPrice({...quote,...bad}).fobPriceNzd).toBeNull();
});
