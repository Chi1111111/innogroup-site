import { retryPublication } from './lib/japan-market-retry.mjs';
import { restorePending } from './lib/japan-market-resume.mjs';
import { rotateGroups, readMakes, readModels, groupListingUrl, matchesGroup, missingGroupAction, hasMissingModelSlug } from './lib/japan-market-rotation.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { openCloudInventory } from './lib/japan-market-cloud.mjs';
import { vehicleChanges } from './lib/japan-market-changes.mjs';
import { createVehicleIdentitySet, createRepeatedPageGuard } from './lib/japan-market-seen.mjs';
import { createDetailRecovery } from './lib/japan-market-recovery.mjs';
import { load } from 'cheerio';
import { ORIGIN, SOURCE, readListing, readDetail, readRates, summary, shardFor, applyResponseCookies } from './lib/japancars.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')));
function integer(value, fallback, min, max) {
  const n = Number(value ?? fallback);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Invalid collector setting: expected ${min}–${max}.`);
  return n;
}
const remote = Object.hasOwn(args, 'remote');
let cloud;
const runId = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || '1'}-${randomUUID().slice(0,8)}` : randomUUID();
const target = integer(args.target ?? process.env.JAPANCARS_TARGET, 5000, 1, 5000);
const concurrency = integer(process.env.JAPANCARS_CONCURRENCY, 1, 1, 1);
const requestGap = integer(process.env.JAPANCARS_REQUEST_GAP_MS, 3000, 200, 10000);
const timeoutMs = integer(process.env.JAPANCARS_TIMEOUT_MS, remote ? 21600000 : 6600000, 60000, 28800000);
const output = path.resolve(args.output || 'public/data/japan-market');
const cache = path.resolve('tmp/japancars-cache');
if (!remote) fs.mkdirSync(cache, { recursive: true });
const startedAt = process.env.JAPAN_MARKET_STARTED_AT || new Date().toISOString();
const deadline = Date.now() + timeoutMs;
const metrics = {
  stage: 'configuration', target, pagesExpected: null, pagesFetched: 0, received: 0, accepted: 0, rejected: 0,
  rejectionReasons: {}, detailRequested: 0, detailSucceeded: 0, detailFailed: 0, detailSkipped: 0, requests: 0,
  added: 0, removed: 0, published: false, timedOut: false, rateLimited: false, lastProgressAt: startedAt,
  withFobPrice: 0, withoutFobPrice: 0, withPhotos: 0, photoCount: 0, cachedDetails: 0, duplicates: 0,
  sourceAccessBlocked: false,
};
function checkpoint() {
  metrics.lastProgressAt = new Date().toISOString();
  if (process.connected && process.send) process.send({ type: 'progress', metrics: { ...metrics } }, () => {});
  if (!remote && process.env.JAPAN_MARKET_METRICS_FILE) fs.writeFileSync(process.env.JAPAN_MARKET_METRICS_FILE, JSON.stringify({ startedAt, metrics }));
}
if (process.send) setInterval(checkpoint, 1000).unref();
process.on('exit', checkpoint);
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => { checkpoint(); process.exit(130); });
const cookies = new Map();
// Supply only a source-authorized session through a runner secret or local secret file.
const suppliedCookie = process.env.JAPANCARS_COOKIE_FILE
  ? fs.readFileSync(path.resolve(process.env.JAPANCARS_COOKIE_FILE), 'utf8').trim()
  : String(process.env.JAPANCARS_COOKIE || '').trim();
for (const part of suppliedCookie.split(';')) {
  const pair=part.trim(); const i=pair.indexOf('=');
  if(i>0) cookies.set(pair.slice(0,i),pair.slice(i+1));
}
let nextRequest = 0;
let stopped = false;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(url, options = {}, redirectCount = 0, jar = cookies) {
  const parsed = new URL(url);
  if (parsed.origin !== ORIGIN) throw new Error('Unexpected collector destination.');
  for (let attempt = 0; attempt < 3; attempt++) {
    if (stopped || Date.now() >= deadline) { metrics.timedOut = true; throw new Error('Collection deadline reached.'); }
    const slot = Math.max(Date.now(), nextRequest); nextRequest = slot + requestGap;
    if (slot > Date.now()) await sleep(slot - Date.now());
    if (stopped) throw new Error('Source access paused.');
    metrics.requests++;
    try {
      const response = await fetch(url, {
        ...options, redirect: 'manual', signal: AbortSignal.timeout(Math.min(30000, Math.max(1, deadline - Date.now()))),
        headers: { 'User-Agent': 'InnoGroup-JapanMarket/1.0', Accept: 'text/html,application/json', Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join('; '), ...options.headers },
      });
      applyResponseCookies(jar, response.headers.getSetCookie());
      if (response.status >= 300 && response.status < 400) {
        const destination = new URL(response.headers.get('location') || '/', url);
        const token = (value) => value.pathname.match(/-([\w=]+)\.html$/)?.[1];
        // A canonical same-vehicle URL is fine. Redirects to a previous vehicle, login,
        // or a loop indicate source access limits; never reset sessions to get around them.
        if (redirectCount < 2 && destination.href !== parsed.href && token(parsed) && token(destination) === token(parsed) && destination.origin === ORIGIN && !options.method) {
          await response.body?.cancel();
          return request(destination.href, options, redirectCount + 1, jar);
        }
        stopped = true; metrics.sourceAccessBlocked = true; metrics.stage = 'access';
        throw new Error('Source access redirect. An authorized bulk-access session or source API is required; existing inventory preserved.');
      }
      if ([401,403,429].includes(response.status)) {
        stopped = true; metrics.rateLimited = response.status === 429;
        metrics.sourceAccessBlocked = true; metrics.stage = 'access';
        throw new Error(`Source returned HTTP ${response.status}; collection stopped.`);
      }
      if (!response.ok) throw new Error(`Source HTTP ${response.status}.`);
      const body = await response.text();
      if (/Just a moment|cf-chl-|Access Denied/i.test(body.slice(0,5000))) { stopped = true; metrics.sourceAccessBlocked = true; metrics.stage = 'access'; throw new Error('Source access challenge; collection stopped.'); }
      return body;
    } catch (error) {
      if (stopped || attempt === 2) throw new Error(`${error.message}${error.cause?.message ? ` (${error.cause.message})` : ''}`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}
function reject(reason) { metrics.rejected++; metrics.rejectionReasons[reason] = (metrics.rejectionReasons[reason] || 0) + 1; }
function cachedFile(row) { return path.join(cache, `${createHash('sha256').update(row.sourceUrl).digest('hex')}.json`); }
async function detail(row, jar) {
  const filename = cachedFile(row);
  try {
    if (!remote && fs.existsSync(filename)) {
      const cached = JSON.parse(fs.readFileSync(filename, 'utf8'));
      // Resume within six hours, never label cached quotes as freshly checked.
      if (Date.now() - Date.parse(cached.vehicle?.priceCheckedAt) < 6 * 60 * 60 * 1000 && cached.vehicle?.sourceUrl === row.sourceUrl && cached.schema === 2) {
        metrics.cachedDetails++; return { vehicle: { ...cached.vehicle, lastSeenAt: new Date().toISOString() }, issue: cached.issue };
      }
    }
  } catch { /* Invalid checkpoint is fetched again. */ }
  metrics.detailRequested++;
  const html = await request(row.sourceUrl, {}, 0, jar);
  let result;
  try { result = readDetail(html, row, new Date().toISOString()); }
  catch (error) {
    if(error.code === 'VEHICLE_IDENTITY_MISMATCH') {
      metrics.identityMismatchCount = (metrics.identityMismatchCount || 0) + 1;
      metrics.firstIdentityMismatchAt ??= metrics.detailRequested;
      metrics.lastIdentityMismatch = { requested: error.expectedStock, received: error.receivedStock };
    }
    throw error;
  }
  metrics.detailSucceeded++;
  if (!remote) fs.writeFileSync(filename, JSON.stringify({ schema: 2, ...result }));
  return result;
}
async function publishWithRetry(vehicles,rates) {
  const batch=[...vehicles];
  try { return await retryPublication(async attempt=>{
    let candidates=batch;
    if(remote && attempt>0){
      cloud=await openCloudInventory();
      const existingIds=new Set(cloud.index.vehicles.map(v=>v.id));
      candidates=batch.filter(v=>!existingIds.has(v.id));
      if(!candidates.length){
        metrics.published=true;metrics.added=0;metrics.updated=0;metrics.publishError=null;metrics.stage='complete';pending=[];
        try{await saveResume();}catch(error){console.warn(`Checkpoint acknowledgement deferred: ${error.message}`);}
        console.log('Recovered publication: all pending vehicles already exist in cloud inventory.');
        return;
      }
    }
    await publish(candidates,rates);
    metrics.publishError=null;
  },{onRetry:({attempt,delay,error})=>{
    metrics.publishRetries=attempt;metrics.publishError=error.message;metrics.stage='upload_retry';
    metrics.resumeAt=new Date(Date.now()+delay).toISOString();checkpoint();
    console.warn(`Cloud upload retry ${attempt}/2 in ${delay/1000}s: ${error.message}. Pending vehicles remain in cloud checkpoint.`);
  }}); } catch(error) { metrics.publishError=error.message;throw Object.assign(error,{code:'UPLOAD_FAILED'}); }
}
async function publish(vehicles, rates) {
  metrics.stage = 'validation'; checkpoint();
  if (!vehicles.length) throw new Error('No validated vehicles; previous inventory preserved.');
  metrics.accepted = vehicles.length;
  metrics.withFobPrice = vehicles.filter(v => v.fobPriceNzd != null).length;
  metrics.withoutFobPrice = vehicles.length - metrics.withFobPrice;
  metrics.withPhotos = vehicles.filter(v => v.photoCount > 0).length;
  metrics.photoCount = vehicles.reduce((sum, v) => sum + v.photoCount, 0);
  const indexPath = path.join(output, 'index.json');
  const previous = remote ? cloud.index.vehicles : fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')).vehicles : [];
  const merged = new Map(previous.map(v => [v.id, v]));
  const detailDirectory = path.join(output, 'details');
  if (remote) for (const v of await cloud.details()) { if (merged.has(v.id)) merged.set(v.id,v); }
  if (!remote && fs.existsSync(detailDirectory)) for (const name of fs.readdirSync(detailDirectory).filter(name => /^\d+\.json$/.test(name))) {
    for (const v of JSON.parse(fs.readFileSync(path.join(detailDirectory, name), 'utf8')).vehicles) {
      if (merged.has(v.id)) merged.set(v.id, v);
    }
  }
  const changes = vehicleChanges([...merged.values()],vehicles);
  metrics.changesPath = `changes/${runId}.json`;
  metrics.added = vehicles.filter(v => !merged.has(v.id)).length;
  metrics.updated = changes.filter(v=>v.kind==='updated').length;
  metrics.unchanged = vehicles.length - metrics.added - metrics.updated;
  metrics.retained = previous.length - metrics.updated;
  metrics.removed = 0;
  for (const v of vehicles) merged.set(v.id, v);
  vehicles = [...merged.values()];
  const refreshedAt = new Date().toISOString();
  const pricing = { nzdPerJpy: rates.NZD / rates.JPY, nzdPerUsd: rates.NZD, serviceFeeNzd: 0, shippingNzd: 0, complianceNzd: 0, registrationNzd: 0, emissionsNzd: 0, gstRate: 0 };
  const base = { source: previous.some(v => v.sourceCode !== 'japancars') ? 'Japan Cars + retained inventory' : SOURCE, priceBasis: 'FOB', priceCurrency: 'NZD', destination: 'New Zealand', refreshedAt, pricing, count: vehicles.length };
  const stage = path.join(path.dirname(output), `.japancars-stage-${randomUUID()}`);
  const backup = path.join(cache, `previous-${randomUUID()}`);
  const files = new Map();
  if (!remote) fs.mkdirSync(path.join(stage, 'details'), { recursive: true });
  const write = (name, value) => {if(remote)files.set(name,value);else {fs.mkdirSync(path.dirname(path.join(stage,name)),{recursive:true});fs.writeFileSync(path.join(stage,name),JSON.stringify(value));}};
  if (!remote && fs.existsSync(path.join(output,'changes'))) fs.cpSync(path.join(output,'changes'),path.join(stage,'changes'),{recursive:true});
  write(metrics.changesPath,{version:1,runId,changes});
  // Public reports contain aggregate statistics only; session cookies and HTML stay outside the website.
  if (!remote && fs.existsSync(path.join(output, 'sync-history.json'))) fs.copyFileSync(path.join(output, 'sync-history.json'), path.join(stage, 'sync-history.json'));
  const buckets = Array.from({ length:128 }, () => []);
  for (const v of vehicles) buckets[Number(shardFor(v.id))].push(v);
  buckets.forEach((bucket, i) => write(`details/${String(i).padStart(3,'0')}.json`, { ...base, vehicles: bucket }));
  const featured = [];
  const makes = new Set();
  for (const v of vehicles.filter(v => v.fobPriceNzd != null && v.photoCount > 0)) if (!makes.has(v.make)) { featured.push(v); makes.add(v.make); if (featured.length === 8) break; }
  for (const v of vehicles) { if (featured.length >= 8) break; if (!featured.includes(v)) featured.push(v); }
  write('index.json', { ...base, vehicles: vehicles.map(summary) });
  write('featured.json', { ...base, vehicles: featured.map(summary) });
  write('manifest.json', { ...base, target:5000, lastRunTarget:target, withFobPrice: vehicles.filter(v => v.fobPriceNzd != null).length, withPhotos: vehicles.filter(v => v.photoCount > 0).length, photoCount: vehicles.reduce((n,v) => n + (v.photoCount || 0), 0), photoStorage: 'source-urls', disclaimer: 'FOB prices in NZD from Japan Cars. Freight, insurance, NZ taxes, compliance, registration and Inno services are quoted separately. Availability and price require reconfirmation.' });
  metrics.stage = 'publish'; checkpoint();
  // Swap fully written snapshots; restore the last one if installation fails.
  if (remote) {
    const history=await cloud.read('sync-history.json');
    const finishedAt=new Date().toISOString();
    const run={id:runId,source:SOURCE,trigger:process.env.GITHUB_EVENT_NAME || 'local',startedAt,finishedAt,durationSeconds:Math.round((Date.parse(finishedAt)-Date.parse(startedAt))/1000),status:metrics.sourceAccessBlocked || metrics.detailFailed || metrics.accepted<target?'partial':'success',metrics:{...metrics,published:true,stage:'complete',publishError:null},error:metrics.sourceAccessBlocked?'来源访问受限，已保留本次验证成功的车辆。':metrics.stopReason || null,workflowUrl:process.env.GITHUB_RUN_ID ? `https://github.com/Chi1111111/innogroup-site/actions/runs/${process.env.GITHUB_RUN_ID}` : null};
    write('sync-history.json',{version:1,runs:[run,...history.runs].slice(0,90)});
    const sha=await cloud.publish(files);
    metrics.published=true;metrics.stage='complete';
    pending = [];
    try { await saveResume(); } catch (error) { console.warn(`Inventory uploaded; checkpoint acknowledgement failed. Next start will deduplicate saved vehicles: ${error.message}`); }
    console.log(`Uploaded ${metrics.added} new, ${metrics.updated} updated vehicles. Cloud commit: ${sha}. No vehicle data written to local disk.`);
    return;
  }
  const existed = fs.existsSync(output);
  if (existed) fs.renameSync(output, backup);
  try { fs.renameSync(stage, output); } catch (error) { if (existed) fs.renameSync(backup, output); throw error; }
  metrics.published = true; metrics.stage = 'complete'; checkpoint();
  console.log(`Published ${vehicles.length} Japan Cars vehicles; ${metrics.withFobPrice} FOB quotes; ${metrics.photoCount} source photos.`);
}

let pending = []; let activeRates; let resumeStore; let resumeCursor;
async function saveResume() {
  if (!resumeStore) return;
  metrics.checkpointAt = await resumeStore.save({writer:{runId,trigger:process.env.GITHUB_EVENT_NAME || 'local'},cursor:metrics.rotationCursor || resumeCursor || {},pending,rates:activeRates});
  checkpoint();
}
try {
  if (remote) { cloud=await openCloudInventory(); console.log(`Cloud inventory ready: ${cloud.index.vehicles.length} vehicles. Memory-only mode.`); if(Object.hasOwn(args,'check')) process.exit(0); }
  if (remote && !args.input) {
    resumeStore = await cloud.resume();
    resumeCursor = resumeStore.snapshot.cursor;
    pending = restorePending(resumeStore.snapshot, cloud.index.vehicles);
    activeRates = resumeStore.snapshot.rates;
    if (!resumeCursor.make) {
      const history = await cloud.read('sync-history.json');
      resumeCursor = history.runs.find(r=>r.metrics?.published && r.metrics?.rotationCursor)?.metrics.rotationCursor || {};
    }
    metrics.rotationCursor = resumeCursor;
    metrics.accepted = pending.length;
    metrics.restoredVehicles = pending.length;
    metrics.photoCount = pending.reduce((n,v)=>n+(v.photoCount||0),0);
    metrics.withPhotos = pending.filter(v=>v.photoCount>0).length;
    metrics.withFobPrice = pending.filter(v=>v.fobPriceNzd!=null).length;
    metrics.withoutFobPrice = pending.length - metrics.withFobPrice;
    metrics.checkpointAt = resumeStore.snapshot.savedAt || null;
    console.log(`Cloud resume: ${resumeCursor.make || 'start'} / ${resumeCursor.model || '-'}, page ${resumeCursor.page || 1}; ${pending.length} unpublished vehicles restored.`);
  }
  if (remote && Object.hasOwn(args,'recover-only') && !pending.length) { console.log('No pending cloud vehicles to recover.');process.exit(0); }
  if (remote && Object.hasOwn(args,'recover-only') && pending.length && !activeRates) throw new Error('Cloud recovery rates are missing; no source requests made.');
  if (remote && pending.length && activeRates) {
    metrics.stopCode='RECOVERED_PENDING';metrics.stopReason='Recovered pending cloud vehicles before requesting source pages.';
    await publishWithRetry(pending,activeRates);
  } else if (args.input) {
    const fixture = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf8'));
    const vehicles = [];
    for (const item of fixture.items) {
      const { vehicle, issue } = readDetail(item.html, item.row, new Date().toISOString());
      metrics.received++;
      if (issue || !vehicle.photoCount) reject(issue || 'missing_photos');
      else vehicles.push(vehicle);
    }
    await publishWithRetry(vehicles.slice(0,target), fixture.rates);
  } else {
  const initial = await request(`${ORIGIN}/stock-list?country=Japan&perPage=10&page=1`);
  const rates = readRates(initial); activeRates = rates;
  const $ = load(initial); const csrf = $('meta[name="csrf-token"]').attr('content');
  if (!csrf) throw new Error('Source session initialization failed.');
  await request(`${ORIGIN}/set-selected-country`, { method:'POST', headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf}, body:JSON.stringify({country_name:'New Zealand', country_code:'NZ'}) });
  const currency = JSON.parse(await request(`${ORIGIN}/change-price-ex-rate`, { method:'POST', headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf}, body:JSON.stringify({currency:'NZD',exchange_rate:rates.NZD}) }));
  if (!currency.success) throw new Error('Could not select source NZD pricing.');
  // Keep one source session; concurrent reads, when enabled, share its access limits.
  metrics.stage = 'listing';
  const collected = pending; const seen = createVehicleIdentitySet();
  const existingPath = path.join(output, 'index.json');
  const existing = remote ? cloud.index.vehicles : fs.existsSync(existingPath) ? JSON.parse(fs.readFileSync(existingPath, 'utf8')).vehicles : [];
  const known = createVehicleIdentitySet([...existing,...pending]);

  let consecutiveDetailFailures = 0;
  let consecutiveMissingDetails = 0;
  const recoverDetail = createDetailRecovery({ deadline,
    onPause: ({ delay, attempt, resumeAt }) => {
      metrics.stage = 'cooldown'; metrics.recoveryAttempts = attempt;
      metrics.resumeAt = new Date(resumeAt).toISOString();
      console.warn(`Detail content missing. Paused ${delay / 60000} minutes; automatic recovery ${attempt}/3 at ${metrics.resumeAt}. Same source session retained.`);
      checkpoint();
    },
    onResume: () => { metrics.stage = 'details'; metrics.resumeAt = null; checkpoint(); console.log('Checking whether vehicle details have recovered.'); },
  });
  const catalog = async (route, data) => JSON.parse(await request(`${ORIGIN}/stock-list/${route}`, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({_token:csrf,...data}).toString() }));
  metrics.stage = 'catalog'; checkpoint();
  const makes = readMakes(await catalog('get-maker-data', {maker:''}));
  if (!makes.length) throw new Error('Source make catalog is empty.');
  const cursor = resumeCursor || JSON.parse(process.env.JAPANCARS_ROTATION_CURSOR || '{}');
  const turns = rotateGroups({ makes, cursor, modelsFor: async make => readModels(await catalog('get-model-data', {value:make})) });
  groups: for await (const turn of turns) {
    if (collected.length >= target) break;
    let groupMissing = 0, groupSucceeded = 0, groupMismatches = 0;
    const checkRepeatedPage = createRepeatedPageGuard();
    metrics.rotationCursor = {...turn}; metrics.rotationMake = turn.make; metrics.rotationModel = turn.model; metrics.rotationCycle = turn.cycle;
    console.log(`Round ${turn.cycle}: ${turn.make} / ${turn.model}, up to ${5-turn.accepted} additional vehicles.`);
    const maxPages = 2000;
    for (let page = turn.page || 1; page <= maxPages && collected.length < target && turn.accepted < 5; page++) {
    metrics.rotationCursor = {...turn,page};
    await saveResume();
    metrics.stage = 'listing';
    const html = await request(groupListingUrl(ORIGIN, turn.make, turn.model, page));
    const { rows, count } = readListing(html);
    if (!rows.length) { if (count === 0) break; throw new Error('Empty or changed listing markup.'); }
    metrics.pagesFetched++;
    let fresh = 0;
    const eligible = [];
    for (const row of rows) {
      if (seen.has(row)) { metrics.duplicates++; continue; }
      fresh++; metrics.received++;
      if (row.location !== 'Japan') { seen.add(row); reject('outside_japan'); continue; }
      if (/sold|reserved|pending|unavailable|on order/i.test(row.status)) { seen.add(row); reject('unavailable'); continue; }
      if (known.has(row)) { seen.add(row); metrics.detailSkipped++; continue; }
      if (hasMissingModelSlug(row, turn)) {
        seen.add(row); reject('missing_model_slug');
        metrics.malformedDetailLinks = (metrics.malformedDetailLinks || 0) + 1;
        if (metrics.malformedDetailLinks <= 5) console.warn(`Skipping incomplete source detail link: ${turn.make} / ${turn.model}, stock ${row.stockNumber}. Continuing catalog without requesting this detail.`);
        continue;
      }
      eligible.push(row);
    }
    let repeated;
    try { repeated = checkRepeatedPage(fresh); } catch { console.warn('Repeated group pages; moving to the next make/model.'); break; }
    if (repeated) {
      metrics.repeatedPages = (metrics.repeatedPages || 0) + 1;
      console.warn(`Listing page ${page} repeated earlier vehicles; skipping page (${repeated}/3 consecutive).`);
      checkpoint();
      if (count != null && page * 10 >= count) break;
      continue;
    }
    metrics.stage = 'details'; checkpoint();
    for (let i = 0; i < eligible.length && collected.length < target && turn.accepted < 5; i += concurrency) {
      const results = await Promise.allSettled(eligible.slice(i, i+concurrency).map((row) => { seen.add(row); return process.env.JAPANCARS_AUTO_BATCH === '1' ? detail(row, cookies) : recoverDetail(() => detail(row, cookies)); }));
      for (const result of results) {
        if (result.status === 'rejected') {
          if (result.reason?.code === 'DETAIL_RECOVERY_EXHAUSTED') throw result.reason;
          metrics.detailFailed++;
          consecutiveDetailFailures++;
          consecutiveMissingDetails = result.reason?.code === 'VEHICLE_IDENTITY_MISMATCH' && result.reason?.receivedStock === 'Not listed' ? consecutiveMissingDetails + 1 : 0;
          if (consecutiveMissingDetails) groupMissing++;
          if (process.env.JAPANCARS_AUTO_BATCH === '1' && consecutiveMissingDetails >= 3 && result.reason?.code === 'VEHICLE_IDENTITY_MISMATCH' && result.reason?.receivedStock === 'Not listed') {
            if (missingGroupAction(consecutiveMissingDetails, groupMissing, groupSucceeded) === 'defer') {
              metrics.deferredGroups = (metrics.deferredGroups || 0) + 1;
              metrics.rotationCursor = {...turn,page,deferred:true};
              console.warn(`Skipping unavailable model group ${turn.make} / ${turn.model} for this round. Checking the next group in the same session; another missing detail will stop this batch.`);
              await saveResume();
              continue groups;
            }
            throw Object.assign(new Error('Detail content missing repeatedly; ending this batch and uploading validated vehicles.'), { code: 'BATCH_CONTENT_MISSING' });
          }
          if (metrics.detailFailed <= 5) console.warn(`Detail: ${result.reason instanceof Error ? result.reason.message : 'failed'}`);
          continue;
        }
        consecutiveDetailFailures = 0; consecutiveMissingDetails = 0; groupSucceeded++;
        if (result.value.issue) { reject(result.value.issue); continue; }
        const v = result.value.vehicle;
        if (!matchesGroup(v, turn)) {
          reject('group_mismatch');groupMismatches++;
          const mismatch = {expected:`${turn.make} / ${turn.model}`,received:`${v.make} / ${v.model}`,stockNumber:v.stockNumber};
          metrics.groupMismatchSamples = [...(metrics.groupMismatchSamples || []),mismatch].slice(-5);
          if (metrics.rejectionReasons.group_mismatch <= 5) console.warn(`Catalog mismatch: expected ${mismatch.expected}; received ${mismatch.received}; stock ${mismatch.stockNumber}.`);
          if(groupMismatches>=5 && turn.accepted===0){
            metrics.deferredGroups=(metrics.deferredGroups||0)+1;
            metrics.rotationCursor={...turn,page,deferred:true};
            console.warn(`Deferred catalog mapping after 5 mismatches: ${turn.make} / ${turn.model}. Vehicles were not relabeled or imported.`);
            await saveResume();continue groups;
          }
          continue;
        }
        if (!v.photoCount) { reject('missing_photos'); continue; }
        if (collected.length < target) {
          collected.push(v);
          turn.accepted++; turn.page = page; metrics.rotationCursor = {...turn};
          await saveResume();
          metrics.photoCount += v.photoCount;
          metrics.withPhotos++;
          if (v.fobPriceNzd != null) metrics.withFobPrice++;
          else metrics.withoutFobPrice++;
        }
      }
      metrics.accepted = collected.length; checkpoint();
      if (consecutiveDetailFailures >= 9) throw new Error('Nine consecutive detail failures; stopped to preserve the previous inventory.');
      if (stopped) throw new Error('Source access stopped; previous inventory preserved.');
    }
    if (page % 10 === 0 || collected.length >= target) console.log(`Page ${page}: ${collected.length}/${target} vehicles; ${metrics.detailFailed} detail errors.`);
    if (count != null && page * 10 >= count) break;
  }
  }
  await publishWithRetry(collected, rates);
  }
} catch (error) {
  metrics.stopCode = error?.code || null;
  metrics.stopReason = error instanceof Error ? error.message : String(error);
  console.error(error instanceof Error ? error.message : String(error));
  if (error?.code !== 'UPLOAD_FAILED' && pending.length && activeRates && metrics.stage !== 'publish' && metrics.stage !== 'validation') {
    try { await publishWithRetry(pending, activeRates); } catch (publishError) { metrics.publishError=publishError.message;metrics.stopCode='UPLOAD_FAILED';metrics.stopReason=`Upload failed: ${publishError.message}`;console.error(metrics.stopReason);process.exitCode=1; }
  } else process.exitCode = 1;
  if (remote && cloud && !metrics.published) {
    try {
      const history=await cloud.read('sync-history.json');
      const finishedAt=new Date().toISOString();
      metrics.changesPath = `changes/${runId}.json`;
      const run={id:runId,source:SOURCE,trigger:process.env.GITHUB_EVENT_NAME || 'local',startedAt,finishedAt,durationSeconds:Math.round((Date.parse(finishedAt)-Date.parse(startedAt))/1000),status:'failed',metrics,error:metrics.sourceAccessBlocked?'来源访问受限，未发布新车源。':metrics.publishError ? `入库失败：${metrics.publishError}；已确认车源保留在云端断点。` : '扫描未完成，旧库存保留。',workflowUrl:process.env.GITHUB_RUN_ID ? `https://github.com/Chi1111111/innogroup-site/actions/runs/${process.env.GITHUB_RUN_ID}` : null};
      await cloud.publish(new Map([[metrics.changesPath,{version:1,runId,changes:[]}],['sync-history.json',{version:1,runs:[run,...history.runs].slice(0,90)}]]));
    } catch { console.error('Failure report could not be uploaded; no local report was written.'); }
  }
  checkpoint();
}
checkpoint();
if (process.connected) process.disconnect();
