// One public request; no login, cookie rotation, challenge solving or inventory writes.
const url = 'https://www.japancars.co.jp/stock-list?country=Japan&perPage=10&page=1';
const response = await fetch(url, {
  redirect: 'manual', signal: AbortSignal.timeout(25000),
  headers: { 'User-Agent': 'InnoGroup-JapanMarket/1.0', Accept: 'text/html,application/json' },
});
const body = await response.text();
const headers = Object.fromEntries(['server','content-type','location','cf-mitigated','cf-ray','retry-after','via','x-cache'].map(k=>[k,response.headers.get(k)]));
console.log(JSON.stringify({time:new Date().toISOString(),status:response.status,headers,
  title:body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim(),
  bytes:Buffer.byteLength(body),
  markers:{cloudflare:/cloudflare|cf-chl-/i.test(body),captcha:/captcha/i.test(body),cloudfront:/cloudfront/i.test(body),accessDenied:/access denied|forbidden/i.test(body)},
  errorText:response.status>=400?body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,1000):undefined
},null,2));
