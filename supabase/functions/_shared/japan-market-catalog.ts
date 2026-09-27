import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.106.1';

export function catalogFilters(body: Record<string, unknown>) {
  const text=(name:string,max=80)=>typeof body[name]==='string' ? String(body[name]).slice(0,max).trim() : '';
  const integer=(name:string,min:number,max:number)=>Number.isSafeInteger(Number(body[name])) && Number(body[name])>=min && Number(body[name])<=max ? Number(body[name]) : null;
  const list=(name:string,allowed:string[])=>Array.isArray(body[name]) ? [...new Set((body[name] as unknown[]).filter((v):v is string=>typeof v==='string' && allowed.includes(v)))] : [];
  const prices:Record<string,[number,number|null]>={under20:[0,20000],'20to30':[20000,30000],'30to40':[30000,40000],'40to50':[40000,50000],'50to70':[50000,70000],over70:[70000,null]};
  const range=prices[text('price')];
  let yearFrom=integer('yearFrom',1900,new Date().getFullYear()+1),yearTo=integer('yearTo',1900,new Date().getFullYear()+1);
  if(yearFrom && yearTo && yearFrom>yearTo)[yearFrom,yearTo]=[yearTo,yearFrom];
  const sorts=['recommended','price-asc','price-desc','year','mileage','newest'];
  return {q:text('q',200),make:text('make',40),model:text('model'),makeSlug:text('makeSlug'),modelSlug:text('modelSlug'),yearFrom,yearTo,minPrice:range?.[0]??null,maxPrice:range?.[1]??null,mileage:integer('mileage',1,2000000),fuels:list('fuels',['Petrol','Hybrid','PHEV','EV','Diesel','Other']),bodies:list('bodies',['Sedan','SUV','Hatchback','Wagon','Coupe','Van / MPV','Sports','Other']),sort:sorts.includes(text('sort'))?text('sort'):'recommended',page:integer('page',1,1000000)??1};
}

export async function catalogPage(client:SupabaseClient, body:Record<string,unknown>) {
  const result=await client.rpc('japan_market_catalog_page',{filters:catalogFilters(body)});
  if(result.error)throw result.error;
  const {rows,...metadata}=result.data;
  const ids:string[]=rows.flatMap((row:{photo_ids:string[]})=>row.photo_ids);
  const jobs=ids.length ? await client.from('japan_photo_jobs').select('id,candidate_path').in('id',ids).eq('status','approved').eq('candidate_verified',true) : {data:[],error:null};
  if(jobs.error)throw jobs.error;
  const paths=jobs.data!.map(job=>job.candidate_path).filter((path):path is string=>typeof path==='string');
  const signed=paths.length ? await client.storage.from('japan-photo-review').createSignedUrls(paths,3600) : {data:[],error:null};
  if(signed.error)throw signed.error;
  const urls=new Map(signed.data!.map(image=>[image.path,image.signedUrl]));
  const photos=new Map(jobs.data!.map(job=>[job.id,urls.get(job.candidate_path)]));
  const vehicles=rows.map((row:{id:string;payload:Record<string,unknown>;photo_ids:string[];photoCount:number})=>{
    const imageUrl=photos.get(row.photo_ids[0]);
    if(!imageUrl)throw new Error('A catalog image is temporarily unavailable.');
    return {...row.payload,id:row.id,imageUrl,photoCount:row.photoCount};
  });
  return {...metadata,vehicles,refreshedAt:new Date().toISOString(),pricing:{nzdPerJpy:0,serviceFeeNzd:0,shippingNzd:0,complianceNzd:0,registrationNzd:0,emissionsNzd:0,gstRate:0.15}};
}
