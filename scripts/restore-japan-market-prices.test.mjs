import { expect, it } from 'vitest';
import { restorePrice } from './restore-japan-market-prices.mjs';
it('recovers a reference vehicle price from the stored rate, not the landed total',()=>{
  const old={sourceCode:'carsensor',sourcePriceUsd:30000,estimatedNzdPrice:66900,updatedAt:'2026-07-10',imageUrls:['photo']};
  const result=restorePrice(old,{nzdPerUsd:1.7});
  expect(result).toMatchObject({fobPriceNzd:51000,fobPriceEstimated:true,priceCheckedAt:'2026-07-10',imageUrls:['photo']});
  expect(restorePrice(result,{nzdPerUsd:2})).toBe(result);
});
it('does not invent prices or replace explicit source quotes',()=>{
  for(const v of [{sourceCode:'carsensor',estimatedNzdPrice:66900},{sourceCode:'japancars',sourcePriceUsd:30000},{sourceCode:'carsensor',sourcePriceUsd:100,fobPriceNzd:123}]) expect(restorePrice(v,{nzdPerUsd:1.7})).toBe(v);
  expect(restorePrice({sourceCode:'carsensor',sourcePriceUsd:100},{}).fobPriceNzd).toBeUndefined();
});
