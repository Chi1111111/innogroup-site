import { createClient } from 'npm:@supabase/supabase-js@2.106.1';

import { corsHeaders, verifyAdminSession } from '../_shared/admin-session.ts';

const BUCKET = 'japan-photo-review';
const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const hosts = new Set(['vimg.gabs.biz', 'www.919919.jp', 'www.japancars.co.jp', 'site.gabs.biz', 'bidimg.gabs.biz']);
const hash = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(v => v.toString(16).padStart(2, '0')).join('');
const checked = <T>(result: { data: T; error: { message: string } | null }) => { if (result.error) throw new Error(result.error.message); return result.data; };

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  let admin = false;
  const respond = (status: number, body: unknown) => new Response(JSON.stringify(admin && status < 400 ? { data: body } : body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method !== 'POST') return respond(405, { error: 'POST required' });
  try {
    const length = Number(req.headers.get('content-length') || 0);
    if (length > 15_000_000) return respond(413, { error: 'Request too large' });
    const body = await req.json();
    const action = body.action;
    const setting = checked(await client.from('japan_photo_settings').select('key_hash,used_bytes,budget_bytes,processing_enabled').eq('id',1).single());
    const sessionSecret = Deno.env.get('ADMIN_SESSION_SECRET');
    admin = Boolean(sessionSecret && await verifyAdminSession(req, sessionSecret));
    if (!admin) {
      const token = req.headers.get('X-Photo-Token') || '';
      if (!/^[a-f0-9]{64}$/.test(token) || setting.key_hash !== await hash(new TextEncoder().encode(token))) return respond(401,{error:'Authentication required'});
    }
    if (admin && !['list','decide','decide-batch','retry','control','catalog'].includes(action)) return respond(403,{error:'Worker action unavailable from browser'});
    if (action === 'catalog') {
      let query = client.from('japan_photo_ready_vehicles').select('id,payload,photo_ids').order('id').limit(1000);
      if (body.id) query = query.eq('id', String(body.id).toUpperCase());
      else query = query.range(Math.max(0, Number(body.offset)||0), Math.max(0, Number(body.offset)||0)+499);
      const ready = checked(await query);
      const ids=[...new Set(ready.flatMap(v=>body.id?v.photo_ids:v.photo_ids.slice(0,1)))];
      const jobs=ids.length?checked(await client.from('japan_photo_jobs').select('id,candidate_path').in('id',ids).eq('status','approved').eq('candidate_verified',true)):[];
      const paths=[...new Set(jobs.map(j=>j.candidate_path).filter(Boolean))];
      const signed=paths.length?checked(await client.storage.from(BUCKET).createSignedUrls(paths,3600)):[];
      const urls=new Map(signed.map(i=>[i.path,i.signedUrl]));
      const vehicles=[];
      for (const v of ready) {
        const selectedIds=body.id?v.photo_ids:v.photo_ids.slice(0,1);
        const images=selectedIds.map((id:string)=>urls.get(jobs.find(j=>j.id===id)?.candidate_path)).filter(Boolean);
        if(images.length!==selectedIds.length)continue;
        const { imageUrl: _image, imageUrls: _images, sourceUrl: _source, ...payload } = v.payload;
        vehicles.push({...payload,imageUrl:images[0],imageUrls:body.id?images:undefined,photoCount:v.photo_ids.length});
      }
      return respond(200,{vehicles,count:vehicles.length,refreshedAt:new Date().toISOString(),pricing:{nzdPerJpy:0,serviceFeeNzd:0,shippingNzd:0,complianceNzd:0,registrationNzd:0,emissionsNzd:0,gstRate:0.15},hasMore:!body.id&&ready.length===500});
    }
    if (action === 'control') {
      if (!admin || typeof body.enabled !== 'boolean') return respond(403,{error:'Admin required'});
      checked(await client.from('japan_photo_settings').update({processing_enabled:body.enabled}).eq('id',1));
      return respond(200,{enabled:body.enabled});
    }
    if (action === 'register-vehicles') {
      if (!Array.isArray(body.vehicles) || body.vehicles.length>20) throw new Error('Maximum 20 vehicles');
      const rows=[];
      for (const v of body.vehicles) {
        if (!/^JP[\w-]+$/i.test(v.id)) throw new Error('Invalid vehicle id');
        const urls=[...new Set([v.imageUrl,...(v.imageUrls||[])].filter(Boolean))] as string[];
        const photo_ids=[];
        for (const u of urls) { const url=new URL(u); if(url.protocol!=='https:'||!hosts.has(url.hostname)||url.username||url.password||url.port) throw new Error('Unsupported photo URL'); photo_ids.push(await hash(new TextEncoder().encode(u))); }
        if (!photo_ids.length) continue;
        rows.push({id:v.id,payload:v,photo_ids});
      }
      if(rows.length) checked(await client.from('japan_photo_vehicles').upsert(rows));
      return respond(200,{registered:rows.length});
    }
    if (action === 'cleanup-approved') {
      const jobs=checked(await client.from('japan_photo_jobs').select('original_path').eq('status','approved').eq('candidate_verified',true).not('original_path','is',null).limit(20));
      let removed=0;
      for(const path of [...new Set(jobs.map(j=>j.original_path))]){
        const refsResult=await client.from('japan_photo_jobs').select('id,status,candidate_path,candidate_verified',{count:'exact'}).eq('original_path',path);
        const refs=checked(refsResult);
        if(refs.length!==refsResult.count || refs.some(j=>j.status!=='approved'||!j.candidate_verified||!j.candidate_path))continue;
        for(const j of refs){const file=checked(await client.storage.from(BUCKET).download(j.candidate_path));const digest=await hash(new Uint8Array(await file.arrayBuffer()));if(!j.candidate_path.includes('/'+digest+'.'))throw new Error('Candidate verification failed; original retained');}
        checked(await client.storage.from(BUCKET).remove([path]));
        checked(await client.from('japan_photo_jobs').update({original_path:null}).eq('original_path',path));
        removed++;
      }
      return respond(200,{removed,reservationAccounting:'conservative'});
    }
    if (action === 'verify-existing') {
      const jobs=checked(await client.from('japan_photo_jobs').select('id,candidate_path').not('candidate_path','is',null).eq('candidate_verified',false).limit(10));
      for(const job of jobs){const file=checked(await client.storage.from(BUCKET).download(job.candidate_path));const digest=await hash(new Uint8Array(await file.arrayBuffer()));if(!job.candidate_path.includes('/'+digest+'.'))throw new Error('Stored file checksum mismatch');checked(await client.from('japan_photo_jobs').update({candidate_verified:true}).eq('id',job.id).eq('candidate_path',job.candidate_path));}
      return respond(200,{verified:jobs.length});
    }
    if (action === 'init') {
      const buckets = checked(await client.storage.listBuckets());
      const bucket = buckets.find(b => b.id === BUCKET);
      if (bucket?.public) throw new Error('Refusing public photo bucket');
      if (!bucket) checked(await client.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 10_000_000, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] }));
      return respond(200, { bucket: BUCKET, private: true, budgetBytes: setting.budget_bytes });
    }
    if (action === 'enqueue') {
      if (!Array.isArray(body.photos) || body.photos.length > 500) return respond(400, { error: 'Maximum 500 photos per request' });
      const rows = [];
      for (const photo of body.photos) {
        const url = new URL(photo.url);
        if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password || url.port) continue;
        rows.push({ id: await hash(new TextEncoder().encode(photo.url)), url: photo.url, vehicle: String(photo.vehicle || '').slice(0, 300) });
      }
      if (rows.length) checked(await client.from('japan_photo_jobs').upsert(rows, { onConflict: 'id', ignoreDuplicates: true }));
      return respond(200, { received: rows.length });
    }
    if (action === 'claim') {
      const jobs = checked(await client.rpc('claim_japan_photo'));
      return respond(200, { job: jobs?.[0] || null, processingEnabled:setting.processing_enabled, capacityReached: Number(setting.used_bytes) >= Number(setting.budget_bytes) });
    }
    if (action === 'list') {
      const offset = Math.max(0, Math.min(1_000_000, Number(body.offset) || 0));
      const pageSize = [20, 50, 100].includes(body.pageSize) ? body.pageSize : 50;
      let query = client.from('japan_photo_jobs').select('*').order('created_at', { ascending: false }).order('id').range(offset, offset + pageSize - 1);
      if (body.status) query = query.eq('status', body.status);
      const items = checked(await query);
      const paths = [...new Set(items.flatMap(item => [item.original_path, item.candidate_path]).filter(Boolean))];
      const signed = paths.length ? checked(await client.storage.from(BUCKET).createSignedUrls(paths, 600)) : [];
      const urls = new Map(signed.map(item => [item.path, item.signedUrl]));
      for (const item of items) {
        delete item.lease;
        for (const field of ['original_path', 'candidate_path']) {
          item[field === 'original_path' ? 'original_url' : 'candidate_url'] = urls.get(item[field]) || null;
        }
      }
      const counts = checked(await client.rpc('japan_photo_counts'));
      return respond(200, { items, counts, pageSize, processingEnabled:setting.processing_enabled, registeredVehicles: (await client.from('japan_photo_vehicles').select('id',{count:'exact',head:true})).count, publishedVehicles:(await client.from('japan_photo_ready_vehicles').select('id',{count:'exact',head:true})).count, usedBytes: setting.used_bytes, budgetBytes: setting.budget_bytes, bucket: BUCKET });
    }
    if (action === 'decide-batch') {
      if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 100 || body.ids.some((id: unknown) => typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id))) return respond(400, { error: 'Select 1–100 photos' });
      if (!['approved', 'rejected'].includes(body.decision)) return respond(400, { error: 'Invalid decision' });
      const changed = checked(await client.rpc('decide_japan_photos', { photo_ids: body.ids, decision: body.decision }));
      return respond(200, { changed, autoPublish: true });
    }
    if (action === 'decide') {
      if (!['approved', 'rejected'].includes(body.decision)) return respond(400, { error: 'Invalid decision' });
      checked(await client.rpc('decide_japan_photo', { photo_id: body.id, decision: body.decision }));
      return respond(200, { saved: true, autoPublish: true });
    }
    if (action === 'retry') {
      checked(await client.from('japan_photo_jobs').update({ status: 'queued', error: null }).in('status', ['failed', 'capacity_blocked']));
      return respond(200, { queued: true });
    }
    if (!['original', 'candidate', 'finish', 'fail'].includes(action)) return respond(400, { error: 'Unknown action' });
    const job = checked(await client.from('japan_photo_jobs').select('*').eq('id', body.id).eq('lease', body.lease).eq('status', 'processing').gt('lease_until', new Date().toISOString()).single());
    if (action === 'original' || action === 'candidate') {
      if (typeof body.data !== 'string' || body.data.length > 13_400_000) return respond(413, { error: 'Image too large' });
      if (action === 'candidate' && (!job.original_path || !['image/png', 'image/webp'].includes(body.mime))) return respond(400, { error: 'Original and PNG/WebP candidate required' });
      const binary = atob(body.data);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
      const jpeg = bytes[0] === 255 && bytes[1] === 216;
      const webp = new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP';
      if (!(body.mime === 'image/png' && png || body.mime === 'image/jpeg' && jpeg || body.mime === 'image/webp' && webp)) return respond(400, { error: 'Invalid image signature' });
      const fileHash = await hash(bytes);
      const file = `${action === 'original' ? 'originals' : 'candidates'}/${fileHash}.${png ? 'png' : jpeg ? 'jpg' : 'webp'}`;
      // Atomic reservation prevents concurrent workers exceeding the pilot budget.
      const allowed = checked(await client.rpc('reserve_japan_photo_bytes', { photo_id: job.id, photo_lease: job.lease, kind: action, byte_count: bytes.length }));
      if (!allowed) return respond(409, { error: 'PHOTO_CAPACITY_LIMIT' });
      const upload = await client.storage.from(BUCKET).upload(file, bytes, { contentType: body.mime, upsert: false });
      if (upload.error && !['409', 'Duplicate'].includes(String((upload.error as { statusCode?: string }).statusCode)) && !upload.error.message.toLowerCase().includes('already exists')) throw upload.error;
      if(action==='candidate'){const stored=checked(await client.storage.from(BUCKET).download(file));if(await hash(new Uint8Array(await stored.arrayBuffer()))!==fileHash)throw new Error('Uploaded candidate checksum mismatch');}
      checked(await client.from('japan_photo_jobs').update({ [`${action}_path`]: file, ...(action==='candidate'?{candidate_verified:true}:{}) }).eq('id', job.id).eq('lease', job.lease));
      return respond(200, { path: file, sha256: fileHash });
    }
    const status = action === 'fail' ? (body.error === 'PHOTO_CAPACITY_LIMIT' ? 'capacity_blocked' : 'failed') : job.candidate_path && body.detection?.detected ? 'pending_review' : 'needs_inspection';
    if (action === 'finish' && job.candidate_path && !job.candidate_verified) throw new Error('Candidate not verified');
    if (action === 'finish' && !job.original_path) throw new Error('Original not backed up');
    checked(await client.from('japan_photo_jobs').update({ status, detection: body.detection || {}, error: action === 'fail' ? String(body.error || 'Worker failed').slice(0, 500) : null, lease: null, lease_until: null, updated_at: new Date().toISOString() }).eq('id', job.id).eq('lease', job.lease));
    return respond(200, { status, published: false });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Photo review error');
    return respond(400, { error: error instanceof Error ? error.message : 'Photo review error' });
  }
});
