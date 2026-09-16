import { expect, it } from 'vitest';
import { createVehicleIdentitySet, createRepeatedPageGuard } from './lib/japan-market-seen.mjs';
const row={stockNumber:'abc123',sourceUrl:'https://www.japancars.co.jp/stock-detail/car.html'};
it('skips transient repeated pages, resets on fresh identities and stops a persistent pagination loop',()=>{
  const guard=createRepeatedPageGuard();
  expect(guard(10)).toBe(0);
  expect(guard(0)).toBe(1);
  expect(guard(0)).toBe(2);
  expect(guard(1)).toBe(0);
  expect(guard(0)).toBe(1);
  expect(guard(0)).toBe(2);
  expect(()=>guard(0)).toThrow('Three consecutive listing pages');
});
it('skips previously stored vehicles regardless of age, using stock or source URL',()=>{
  const known=createVehicleIdentitySet([{id:'jpjc-ABC123',priceCheckedAt:'2020-01-01'},{sourceUrl:'https://www.japancars.co.jp/stock-detail/second.html?old=1'}]);
  expect(known.has(row)).toBe(true);
  expect(known.has({...row,stockNumber:'changed',sourceUrl:'https://www.japancars.co.jp/stock-detail/second.html#photos'})).toBe(true);
  expect(known.has({...row,stockNumber:'new',sourceUrl:'https://www.japancars.co.jp/stock-detail/new.html'})).toBe(false);
});
it('deduplicates repeated rows and does not confuse other sources or identical models',()=>{
  const seen=createVehicleIdentitySet([{sourceCode:'carsensor',stockNumber:'abc123',make:'Toyota',model:'Tank'}]);
  expect(seen.has(row)).toBe(false);
  seen.add(row);
  expect(seen.has({...row,stockNumber:'ABC123',sourceUrl:'https://www.japancars.co.jp/stock-detail/renamed.html'})).toBe(true);
  expect(seen.has({...row,stockNumber:'new',sourceUrl:'https://www.japancars.co.jp/stock-detail/new.html',make:'Toyota',model:'Tank'})).toBe(false);
});
