import fs from 'node:fs';
import path from 'node:path';

export function restorePrice(vehicle, pricing) {
  if (vehicle.sourceCode !== 'carsensor' || vehicle.fobPriceNzd != null) return vehicle;
  const price = vehicle.sourcePriceUsd, rate = pricing?.nzdPerUsd;
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(rate) || rate <= 0) return vehicle;
  return { ...vehicle, fobPriceNzd: Math.round(price * rate / 10) * 10,
    fobPriceEstimated: true, priceBasis: 'FOB', priceCurrency: 'NZD',
    sourcePriceType: 'CAR PRICE (legacy estimate)', sourcePriceAmount: price,
    sourcePriceCurrency: 'USD', nzdExchangeRate: rate, priceCheckedAt: vehicle.updatedAt };
}

export function restoreDirectory(directory) {
  const files = ['index.json', 'featured.json', ...fs.readdirSync(path.join(directory,'details')).filter(n=>/^\d+\.json$/.test(n)).map(n=>`details/${n}`)];
  for (const name of files) {
    const file=path.join(directory,name), payload=JSON.parse(fs.readFileSync(file,'utf8'));
    payload.vehicles=payload.vehicles.map(v=>restorePrice(v,payload.pricing));
    fs.writeFileSync(file,JSON.stringify(payload));
  }
  const inventory=JSON.parse(fs.readFileSync(path.join(directory,'index.json'),'utf8'));
  const manifestPath=path.join(directory,'manifest.json');
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  manifest.withFobPrice=inventory.vehicles.filter(v=>v.fobPriceNzd!=null).length;
  fs.writeFileSync(manifestPath,JSON.stringify(manifest));
  console.log(`${inventory.vehicles.length} retained vehicles; ${manifest.withFobPrice} priced; ${inventory.vehicles.length-manifest.withFobPrice} on request.`);
}
if (process.argv.includes('--apply')) restoreDirectory(path.resolve('public/data/japan-market'));
