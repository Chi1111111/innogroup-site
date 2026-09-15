const fields = ['fobPriceNzd','photoCount','make','model','variant','year','mileage','fuelType','transmission','status','sourcePriceType'];
export function vehicleChanges(previous, incoming) {
  const old = new Map(previous.map(v=>[v.id,v]));
  return incoming.flatMap(v=>{
    const before=old.get(v.id);
    const changes=fields.filter(k=>JSON.stringify(before?.[k] ?? null)!==JSON.stringify(v[k] ?? null))
      .map(field=>({field,before:before?.[field] ?? null,after:v[field] ?? null}));
    const oldPhotos=new Set(before?.imageUrls ?? []), newPhotos=new Set(v.imageUrls ?? []);
    const addedPhotos=[...newPhotos].filter(p=>!oldPhotos.has(p));
    const removedPhotos=[...oldPhotos].filter(p=>!newPhotos.has(p));
    if(before && !changes.length && !addedPhotos.length && !removedPhotos.length)return [];
    return [{id:v.id,name:`${v.year} ${v.make} ${v.model}`,stockNumber:v.stockNumber ?? v.id,
      kind:before?'updated':'added',changes,addedPhotos,removedPhotos}];
  });
}
