import { createClient } from 'npm:@supabase/supabase-js@2.106.1';
import { corsHeaders, jsonResponse, verifyAdminSession } from '../_shared/admin-session.ts';

const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const states = ['starting','running','waiting','paused','stopped'];
const text = (v: unknown, max = 160) => typeof v === 'string' ? v.slice(0,max) : '';
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;
Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders(req)});
  if(req.method!=='POST') return jsonResponse(req,{error:'POST required'},405);
  try {
    const secret=Deno.env.get('ADMIN_SESSION_SECRET');
    if(secret && await verifyAdminSession(req,secret)) {
      const {data,error}=await client.from('japan_collector_live').select('received_at,snapshot').eq('id',1).maybeSingle();
      if(error) throw error;
      return jsonResponse(req,{data});
    }
    const token=req.headers.get('X-Photo-Token') ?? '';
    if(!/^[a-f0-9]{64}$/.test(token)) return jsonResponse(req,{error:'Authentication required'},401);
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(v=>v.toString(16).padStart(2,'0')).join('');
    const setting=await client.from('japan_photo_settings').select('key_hash').eq('id',1).single();
    if(setting.error) throw setting.error;
    if(setting.data.key_hash!==digest) return jsonResponse(req,{error:'Authentication required'},401);
    const raw=await req.text();
    if(raw.length>64000) return jsonResponse(req,{error:'Too large'},413);
    const b=JSON.parse(raw);
    if(!states.includes(b.state)) return jsonResponse(req,{error:'Invalid state'},400);
    const now=Date.now();
    const snapshot={version:1,session:text(b.session,64),state:b.state,message:text(b.message,300),lastActionAt:date(b.lastActionAt),nextRunAt:date(b.nextRunAt),
      events:(Array.isArray(b.events)?b.events:[]).slice(-100).map((e:Record<string,unknown>)=>({at:date(e.at),message:text(e.message,300)})).filter((e:{at:string|null})=>e.at && Date.parse(e.at)>now-86400000 && Date.parse(e.at)<now+60000)};
    const {error}=await client.from('japan_collector_live').upsert({id:1,received_at:new Date().toISOString(),snapshot});
    if(error) throw error;
    return jsonResponse(req,{ok:true});
  } catch { return jsonResponse(req,{error:'采集实时状态暂时无法读取或保存'},503); }
});
