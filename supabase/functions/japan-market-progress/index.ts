import { createClient } from 'npm:@supabase/supabase-js@2.106.1';
import { corsHeaders, jsonResponse, verifyAdminSession } from '../_shared/admin-session.ts';

// Read-only cloud evidence. Never dispatch a collector or contact a user's localhost.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed.' }, 405);
  const secret = Deno.env.get('ADMIN_SESSION_SECRET');
  if (!secret || !await verifyAdminSession(req, secret)) return jsonResponse(req, { error: '请先登录 Admin。' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) } });
  const warnings: string[] = [];
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  async function read<T>(label: string, task: PromiseLike<{data:T;error:unknown}>) {
    try { const result = await task; if (result.error) throw result.error; return result.data; }
    catch { warnings.push(`${label}暂时无法读取`); return null; }
  }
  const github = async () => {
    const { data: token, error } = await client.rpc('japan_market_dispatch_credential');
    if (error || !token) throw new Error('credential');
    const get = async (path: string, ref: string) => {
      const response = await fetch(`https://api.github.com/repos/Chi1111111/innogroup-site/contents/${path}?ref=${ref}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('github');
      return response.json();
    };
    const [checkpoint, history] = await Promise.allSettled([get('checkpoint.json','japan-market-resume'), get('public/data/japan-market/sync-history.json','main')]);
    if (checkpoint.status === 'rejected') warnings.push('采集断点暂时无法读取');
    if (history.status === 'rejected') warnings.push('运行记录暂时无法读取');
    const c = checkpoint.status === 'fulfilled' ? checkpoint.value : null;
    const latest = history.status === 'fulfilled' ? history.value.runs?.[0] : null;
    return {
      checkpoint: c ? { savedAt: c.savedAt, runId: c.writer?.runId, cursor: c.cursor ? { make: c.cursor.make, model: c.cursor.model, page: c.cursor.page, cycle: c.cursor.cycle } : null, pending: Array.isArray(c.pending) ? c.pending.length : null } : null,
      latestRun: latest ? { id: latest.id, finishedAt: latest.finishedAt, status: latest.status, error: latest.error, metrics: { accepted: latest.metrics?.accepted } } : null,
      runs: history.status === 'fulfilled' ? (history.value.runs ?? []).filter((run: {finishedAt:string}) => run.finishedAt >= cutoff).slice(0,20).map((run: {id:string;finishedAt:string;status:string;error?:string;metrics?:{accepted?:number}}) => ({ id:run.id, finishedAt:run.finishedAt, status:run.status, error:run.error, metrics:{accepted:run.metrics?.accepted} })) : null,
    };
  };
  const [collection, settings, counts, recent, photoRecords, photoErrors, activePhotos, blockedPhotos] = await Promise.all([
    github().catch(() => { warnings.push('采集断点与运行记录暂时无法读取'); return {checkpoint:null,latestRun:null}; }),
    read('图片工作状态', client.from('japan_photo_settings').select('processing_enabled,worker_seen_at,mac_seen_at,windows_seen_at,mac_runtime,windows_runtime,pause_details').eq('id',1).single()),
    read('图片队列', client.rpc('japan_photo_counts')),
    read('最新登记车辆', client.from('japan_photo_vehicles').select('id,registered_at,make:payload->>make,model:payload->>model').gte('registered_at',cutoff).order('registered_at',{ascending:false}).limit(12)),
    read('图片处理记录', client.from('japan_photo_jobs').select('id,vehicle,status,failure_count,error,updated_at').in('status',['approved','failed']).gte('updated_at',cutoff).order('updated_at',{ascending:false}).limit(20)),
    read('图片出错记录', client.from('japan_photo_errors').select('id,vehicle,stage,message,created_at').gte('created_at',cutoff).order('created_at',{ascending:false}).limit(20)),
    read('正在处理的图片', client.from('japan_photo_jobs').select('id,vehicle,status,failure_count,updated_at').eq('status','processing').order('updated_at',{ascending:false}).limit(10)),
    read('需要处理的图片异常', client.from('japan_photo_jobs').select('id,vehicle,status,error,updated_at').eq('status','capacity_blocked').order('updated_at',{ascending:false}).limit(10)),
  ]);
  return jsonResponse(req, { data: { fetchedAt: new Date().toISOString(), ...collection, settings, counts, recent, photoRecords, photoErrors, activePhotos, blockedPhotos, warnings } });
});
