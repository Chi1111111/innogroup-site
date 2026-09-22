# Japan Market 图片处理与审核

## 当前运行方式

图片由本地 Python 程序单线程下载、检测、修补与压缩。每张处理完至少等待 2 秒，再领取下一张；不调用大模型或消耗模型 token。图片只经过内存，不写本地照片文件或临时图片。原图和 WebP 85 成品上传 Supabase 私有桶 `japan-photo-review`，队列、审核记录与车辆关联也存 Supabase。本机只保存程序、连接配置、进程锁与运行日志。

GitHub 图片处理工作流已关闭并从仓库移除，车辆自动新增任务也保持关闭。电脑关机停止处理；重启本地程序后从云端队列继续。关闭浏览器不影响后台程序。

## 启动与控制

配置位于 `D:\INNOGROUP\private-config\japan-photo-review.json`，包含专用受限令牌，不得提交 Git。安装依赖：

```powershell
python -m pip install -r scripts/photo-review/requirements.txt
```

右键 `scripts/photo-review/start-local.ps1`，选择“使用 PowerShell 运行”，再到 `/admin/photos` 点击“允许继续”。重复启动会被操作系统锁阻止，不会增加并发。前台试跑：

```powershell
python scripts/photo-review/cloud_worker.py work --limit 5 --interval 2
```

管理员暂停只停止新任务领取，正在处理的图片会完成。后台每 15 秒检查队列，Admin 每 10 秒更新进度，不清空已选图片。最近两分钟收到程序联络才显示已连接。中断任务的十分钟租约过期后可以续跑。来源返回 401、403 或 429 自动暂停，需检查原因后手动恢复；不会通过代理绕过限制。

## 审核与上架

Admin 支持每页 20/50/100 张、本页全选、批量审核和原图成品对比。模板未可靠匹配的图片仅压缩并进入待检查，禁止自动通过。修补区外像素在编码前保持一致，但有损 WebP 压缩会改变像素。尺寸与上传哈希均验证。

车辆的完整照片集合全部通过审核且成品校验成功，才自动出现在 Japan Market。缺失、待审或拒绝照片阻止上架。公开目录没有原始静态库存回退，普通访客只能取得已通过车辆的成品链接。

每处理 100 张检查一次已通过原图；重新校验对应成品且所有共用该原图的任务均通过后，才删除 Supabase 原图。以后拒绝无法恢复已删除原图。私有桶访问通过短时签名链接；已签发公开成品链接最长一小时失效。照片使用授权仍需自行确认。

## 容量与恢复

当前功能保守预留上限 20 GB，不等于 Supabase 账户剩余额度。失败上传和删除原图不自动退还预留，显示量可能大于实际 Storage 用量。单张下载限 10 MB。达到预算暂停领取，不能自动开通超额。

失败任务可在 Admin 重试；重试不会自动打开暂停开关。URL 去重防止重复入队，审核状态保留。所有图片审核动作使用数据库事务与审计记录。Admin 使用已有登录会话，浏览器不包含 worker 令牌。表开启 RLS，服务端校验授权后访问。

## Automatic approval enabled by owner

The owner explicitly authorized automatic approval and vehicle publication for photos without a detected known JAPANCARS watermark. Version 2 scans the full image: scores below 0.40 with dimensions at least 320×240 are eligible; scores 0.40–0.88 and smaller photos require inspection; matches at or above 0.88 require review after repair. This does not detect every possible watermark. Server approval requires a verified candidate and versioned classification metadata; the decision reason and timestamp are stored in detection metadata. All vehicle photos must still be approved before publication. Legacy unreviewed version-1 photos were requeued for the new detection; existing manual approvals and rejections were preserved.

Owner policy update: only confirmed template matches (score >= 0.88) require manual review. Version-2 full-image scans with detected=false and score < 0.88, including the former uncertain category, are automatically approved after candidate verification. Existing verified uncertain results are migrated to approved; manual rejections are preserved.
