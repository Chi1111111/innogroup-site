import { createClient } from 'npm:@supabase/supabase-js@2.106.1';
import { corsHeaders, jsonResponse, verifyAdminSession } from '../_shared/admin-session.ts';

const workflow = 'https://api.github.com/repos/Chi1111111/innogroup-site/actions/workflows/japan-market-daily-sync.yml';
const workflowUrl = 'https://github.com/Chi1111111/innogroup-site/actions/workflows/japan-market-daily-sync.yml';
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed.' }, 405);
  const sessionSecret = Deno.env.get('ADMIN_SESSION_SECRET');
  if (!sessionSecret || !await verifyAdminSession(req, sessionSecret)) return jsonResponse(req, { error: '请先登录 Admin。' }, 401);
  try {
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: token, error } = await client.rpc('japan_market_dispatch_credential');
    if (error || !token) return jsonResponse(req, { error: '扫描服务尚未配置，请联系管理员。' }, 503);
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json' };
    const response = await fetch(`${workflow}/runs?per_page=10`, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return jsonResponse(req, { error: '无法读取扫描状态，请稍后重试。' }, 502);
    const { workflow_runs: runs } = await response.json();
    const active = runs.find((run: {status: string; created_at: string}) => run.status !== 'completed' || Date.now() - Date.parse(run.created_at) < 60000);
    if (active) return jsonResponse(req, { data: { started: false, message: '已有扫描正在运行或刚刚提交，请勿重复启动。', workflowUrl: active.html_url || workflowUrl } });
    const dispatched = await fetch(`${workflow}/dispatches`, { method: 'POST', headers, body: JSON.stringify({ ref: 'main' }), signal: AbortSignal.timeout(15000) });
    if (!dispatched.ok) return jsonResponse(req, { error: '扫描任务提交失败，请稍后重试。' }, 502);
    const run = dispatched.status === 204 ? {} : await dispatched.json();
    return jsonResponse(req, { data: { started: true, message: '扫描任务已提交。完成并发布后，刷新记录可查看新增车辆和详情。', workflowUrl: run.html_url || workflowUrl } });
  } catch {
    return jsonResponse(req, { error: '扫描服务暂时不可用；若已提交，请先查看运行记录再重试。' }, 503);
  }
});
