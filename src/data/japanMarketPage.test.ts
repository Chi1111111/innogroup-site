import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadJapanMarketPage } from './japanMarket';
const car={id:'JP1',make:'Toyota',model:'Aqua',year:2020,mileage:10000,sourcePriceType:'FOB',priceBasis:'FOB',priceCurrency:'NZD',fobPriceNzd:12000};
beforeEach(()=>vi.stubEnv('VITE_SUPABASE_URL','https://example.supabase.co'));
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('requests only the selected page and preserves the server total',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({vehicles:[car],count:7483,totalCount:7483,page:2,facets:[],hasMore:true})});
  vi.stubGlobal('fetch',fetcher);
  const result=await loadJapanMarketPage({page:2,make:'Toyota'});
  expect(result.count).toBe(7483);
  expect(result.vehicles).toHaveLength(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({action:'catalog-page',page:2,make:'Toyota'});
});
it('never displays an unconfirmed or missing price from a page',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({vehicles:[{...car,sourcePriceType:'CAR PRICE'}],count:1,facets:[]})}));
  await expect(loadJapanMarketPage()).rejects.toThrow('Invalid priced vehicle');
});
it('does not replace a failed page with misleading partial inventory',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));
  await expect(loadJapanMarketPage({page:3})).rejects.toThrow('temporarily unavailable');
});
