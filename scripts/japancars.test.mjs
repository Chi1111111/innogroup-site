import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { readListing, readDetail, readFob, readRates, sourceUrl, photoUrl, shardFor, applyResponseCookies } from './lib/japancars.mjs';

const listing = fs.readFileSync(new URL('./fixtures/japancars/list.html',import.meta.url),'utf8');
const detail = fs.readFileSync(new URL('./fixtures/japancars/detail.html',import.meta.url),'utf8');
const row = readListing(listing).rows[0];
const timestamp='2026-09-14T10:00:00Z';
describe('Japan Cars public snapshot parsing',()=>{
  it('honors expired recently-viewed cookies so source cleanup redirects can finish',()=>{
    const jar=new Map([['recent_view_data[stock][1]','old'],['session','value']]);
    applyResponseCookies(jar,['recent_view_data[stock][1]=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0','session=new=value; Path=/']);
    expect(jar.has('recent_view_data[stock][1]')).toBe(false);
    expect(jar.get('session')).toBe('new=value');
  });
  it('extracts Japan stock identity and actual images without mixing overseas stock',()=>{
    const result=readListing(listing);
    expect(result.count).toBeGreaterThan(100000);
    expect(result.rows[0]).toMatchObject({stockNumber:'gh415457',location:'Japan',status:'Available'});
    expect(result.rows[2].location).toBe('Malaysia');
  });
  it('loads all 15 actual gallery photos and verifies vehicle identity',()=>{
    const {vehicle,issue}=readDetail(detail,row,timestamp);
    expect(issue).toBeNull();
    expect(vehicle).toMatchObject({make:'Toyota',model:'Tank',year:2020,mileage:43000,fobPriceNzd:10380,photoCount:15,hasAccident:null});
    expect(vehicle.imageUrls).toHaveLength(15);
    expect(()=>readDetail(detail,{...row,stockNumber:'different'},timestamp)).toThrow('identity');
  });
  it('matches the screenshot NZ$3,870 quote using the source rate and rounding',()=>{
    const $=load(detail);$('.mainPrice').attr('data-price','344400');
    expect(readFob($,readRates(detail)).fobPriceNzd).toBe(3870);
  });
  it('retains original CAR PRICE type while applying the owner FOB presentation policy',()=>{
    const $=load(detail);$('.mainPrice').attr('data-pricetype','CAR PRICE').attr('data-price','2950').attr('data-conversion-rate','1').attr('data-vehiclecurrency','USD');
    expect(readFob($,readRates(detail))).toMatchObject({fobPriceNzd:5040,sourcePriceType:'CAR PRICE',sourcePriceAmount:2950});
  });
  it.each(['CIF','CFR','C&F','Unknown'])('does not relabel freight-inclusive or unknown %s amounts as FOB',type=>{
    const $=load(detail);$('.mainPrice').attr('data-pricetype',type);
    expect(readFob($,readRates(detail)).fobPriceNzd).toBeNull();
  });
  it('keeps ASK as unknown and fails when source currency rates disappear',()=>{
    const $=load(detail);$('.mainPrice').attr('data-isask','1');
    expect(readFob($,readRates(detail)).fobPriceNzd).toBeNull();
    expect(()=>readRates('<html></html>')).toThrow('NZD');
  });
  it('rejects missing mileage, unavailable cars and different locations',()=>{
    const $=load(detail);$('li:contains("Mileage") .stockdetailInfo').text('--');
    expect(readDetail($.html(),row,timestamp).issue).toBe('invalid_mileage');
    expect(readDetail(detail,{...row,status:'Sold Out'},timestamp).issue).toBe('unavailable');
    expect(readDetail(detail,{...row,location:'Malaysia'},timestamp).issue).toBe('outside_japan');
  });
  it('restricts source URLs, rejects placeholder photos and uses stable detail shards',()=>{
    expect(sourceUrl('https://other.example/stock-detail/a')).toBeNull();
    expect(photoUrl('javascript:alert(1)')).toBeNull();
    expect(photoUrl('https://example.com/loading_new.gif')).toBeNull();
    expect(shardFor('JPJC-GH415457')).toBe(shardFor('jpjc-gh415457'));
  });
});
it('publishes matching list/detail/featured shards and preserves them after an incomplete collection',()=>{
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'inno-japancars-test-'));
  try {
    const input=path.join(cwd,'input.json');
    const script=fileURLToPath(new URL('./sync-japancars-japan-market.mjs',import.meta.url));
    const fixture={rates:readRates(detail),items:[{row,html:detail}]};
    fs.writeFileSync(input,JSON.stringify(fixture));
    const directory=path.join(cwd,'public/data/japan-market');
    fs.mkdirSync(path.join(directory,'details'),{recursive:true});
    const oldVehicles=Array.from({length:3991},(_,i)=>({id:`legacy-${i}`,source:'Carsensor',imageUrl:'https://example.com/car.jpg',photoCount:2,estimatedNzdPrice:20000}));
    fs.writeFileSync(path.join(directory,'index.json'),JSON.stringify({vehicles:oldVehicles}));
    fs.writeFileSync(path.join(directory,'details','000.json'),JSON.stringify({vehicles:oldVehicles.map(v=>({...v,imageUrls:['https://example.com/car.jpg','https://example.com/interior.jpg']}))}));
    const execute=()=>spawnSync(process.execPath,[script,'--target=1',`--input=${input}`],{cwd,encoding:'utf8',env:{...process.env,JAPAN_MARKET_METRICS_FILE:''}});
    const result=execute();
    expect(result.status,result.stderr).toBe(0);
    const original=fs.readFileSync(path.join(directory,'index.json'),'utf8');
    const index=JSON.parse(original);
    expect(index.vehicles).toHaveLength(3992);
    const added=index.vehicles.find(v=>v.id.startsWith('JPJC-'));
    expect(added).toMatchObject({fobPriceNzd:10380,photoCount:15,priceBasis:'FOB'});
    expect(index.vehicles.filter(v=>v.id.startsWith('legacy-'))).toHaveLength(3991);
    const retained=JSON.parse(fs.readFileSync(path.join(directory,'details',`${shardFor('legacy-0')}.json`),'utf8')).vehicles.find(v=>v.id==='legacy-0');
    expect(retained.imageUrls).toHaveLength(2);
    expect(retained.fobPriceNzd).toBeUndefined();
    expect(fs.readdirSync(path.join(directory,'details'))).toHaveLength(128);
    const shard=JSON.parse(fs.readFileSync(path.join(directory,'details',`${shardFor(added.id)}.json`),'utf8'));
    expect(shard.vehicles.find(v=>v.id===added.id).imageUrls).toHaveLength(15);
    expect(execute().status).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(directory,'index.json'),'utf8')).vehicles).toHaveLength(3992);
    const beforeFailure=fs.readFileSync(path.join(directory,'index.json'),'utf8');
    fs.writeFileSync(input,JSON.stringify({...fixture,items:[]}));
    expect(execute().status).toBe(1);
    expect(fs.readFileSync(path.join(directory,'index.json'),'utf8')).toBe(beforeFailure);
  } finally {
    if(path.dirname(cwd)===path.resolve(os.tmpdir()) && path.basename(cwd).startsWith('inno-japancars-test-')) fs.rmSync(cwd,{recursive:true,force:true});
  }
});
