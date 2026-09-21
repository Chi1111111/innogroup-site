# Japan Market 私有云端图片审核

## 数据在哪里

- 车辆资料 / 来源链接：原采集流程仍写入 GitHub `public/data/japan-market/`，并随网站部署。这些 JSON 不是私有文件；本功能不迁移或封锁旧库存数据。
- 原始照片：现有 Supabase 项目的私有 Storage 桶 `japan-photo-review`，`originals/<SHA256>.<格式>`。
- 处理后的候选图片：同一个私有桶的 `candidates/<SHA256>.png`。原图不覆盖、不裁切。
- 队列、检测和像素校验结果：Supabase 表 `japan_photo_jobs`。
- 审核历史：`japan_photo_decisions`。原图与候选图均不向普通网站访客开放；查看链接 10 分钟过期。
- 本机：只保存专用连接配置和日志，图片下载、检测和上传使用内存，不保留照片副本。配置默认在项目上级的 `private-config/japan-photo-review.json`。可用 `JAPAN_MARKET_PHOTO_CONFIG` 指向其他绝对路径。

当前安装的配置：`D:\INNOGROUP\private-config\japan-photo-review.json`。配置包含仅限此图片功能的专用令牌，请勿发到聊天、提交 Git 或复制到 public。不是 Supabase service-role 密钥。

## 启动

运行环境：Node（现有采集器）、Python 3、OpenCV 和 NumPy。安装依赖：

```powershell
python -m pip install -r scripts/photo-review/requirements.txt
```

在本项目目录运行：

```powershell
npm run photos:review
npm run photos:status
npm run photos:work -- --limit 20
```

审核页：`http://127.0.0.1:17832`，仅本机可访问。点击通过只写入审核结果，**不会重新开放 Japan Market，也不会替换官网图片**。

如果照片修复覆盖到车身、损伤、铭牌或文字，请拒绝结果。水印覆盖的真实细节无法可靠恢复。低置信度匹配进入「待检查原图」，不会自动补画；算法只检测目前收集的 JAPANCARS 右下角标记，不能保证识别所有水印。

## 今后的采集

此版本 `sync-japancars-japan-market.mjs` 在接收新一批已验证车辆时，自动把图片链接加入私有云队列，并启动后台 Python worker。URL 去重，已存在记录的审核结果不会被覆盖。所有高置信度匹配结果都停在待审核，其他图片待人工检查。

- 必须使用**此版本或更新版采集程序**，旧下载包 / 已运行的旧进程不会自动升级。
- `enabled: true` 的私有配置文件存在才启用；`enabled: false` 则不再自动添加图片任务。
- GitHub Actions 自动采集不启用这条本地 worker 链路；云任务不会拿到本机专用令牌。需要改为全云运行时，另行配置 worker 和 secrets。
- 图片任务失败不会改变原有车源入库结果。网络故障时云队列保留，可重试；入队本身失败时采集日志会提示，需重新导入该批车辆。
- 手动补录：`python scripts/photo-review/cloud_worker.py enqueue --input <车辆JSON>`。支持 `{ "vehicles": [...] }` 或车辆数组；只入队，处理需另外运行 `work`。
- 重试失败 / 容量阻塞任务：`python scripts/photo-review/cloud_worker.py retry`，再运行 `work`。
- 重启 worker 会在 10 分钟租约过期后重新领取中断的图片。数据库原子预留避免并发上传超出本功能预算。

## 容量和限制

试运行上限 **250,000,000 字节（250 MB）**，只覆盖此功能，不代表整个 Supabase 组织剩余额度。达到上限停止上传，显示容量不足；不自动升级套餐或开放付费超额。

预留用量采用保守计数：失败上传及重复内容可能仍占预留额度，实际 Storage 用量可能更小。单图最多 10 MB。候选图用 PNG 保持水印区域外的解码像素不变，体积可能显著大于 JPEG 原图。全量处理前需按试跑数据确认存储、流量和套餐。

只校验非水印区域像素与尺寸；不能自动判断修复区是否遮住重要车况，所以默认全部人工审核。去水印不替代图片使用授权。

云端访问：Edge Function `japan-photo-review` 使用专用令牌校验；表开启 RLS 且不授予 anon/authenticated 访问；Storage 桶私有。服务端特权密钥只在 Supabase 运行环境内使用。

## Batch review

The private review UI defaults to pending candidates. It offers 20/50/100 items per page, current-page selection, batch approval/rejection, and original/candidate comparison with arrow keys and Space selection. One acknowledgment applies to the selected batch. A database transaction locks all selected jobs and rejects an invalid selection without partially saving it. Approval does not publish images. Originals are still retained; no automatic deletion or WebP conversion has been enabled.

## Storage planning (2026-09-22)

At 10,000 genuinely new photos/day and an assumed 100 KB final file, final images alone add about 30 GB/month. This is a planning assumption, not the current PNG output size. Supabase Free includes 1 GB object storage; R2 Standard includes 10 GB-month/month and charges $0.015/GB-month beyond it, plus requests beyond allowances. Neither provides unlimited free retention. Recommended future design: metadata in Supabase, compressed final images in object storage, content deduplication, delete originals only after approved final upload and integrity verification, and lifecycle cleanup after vehicle delisting. Retention period is awaiting the user's preference. Cloud processing compute is separate from storage and has not been deployed; the current worker runs locally without persisting downloaded source images to local disk.

## Cloud processing and Admin (2026-09-22)

- `/admin/photos` uses the existing signed Admin session. No worker token is included in browser code.
- `japan-photo-process.yml` runs independently of the disabled vehicle-collection workflow. Standard GitHub-hosted Ubuntu workers process the existing queue hourly, for at most 2,000 photos or 40 minutes per run, with a single concurrent run. Scheduled execution can be delayed by GitHub; this is not a continuously running server.
- A manual `import_snapshot=true` run registers the committed vehicle snapshot and deduplicates image URLs into the queue. It does not crawl new vehicle listings. The worker downloads the existing photo URLs, holds image bytes in memory, uploads private originals and WebP quality-85 candidates, and makes no model/API token calls.
- The scoped configuration is in the `JAPAN_PHOTO_CONFIG` repository secret. No image artifacts or credentials are uploaded as Actions artifacts. Versions of NumPy and OpenCV are pinned.
- Pause stops new claims; in-flight images finish. Expired ten-minute leases can resume after a worker stops. Failed images require explicit retry from Admin. Capacity is capped conservatively at 20 GB of reserved bytes.
- The server downloads each uploaded candidate to verify its SHA-256. Nonmatching watermark templates are compressed only and require inspection, not automatic approval. Lossy WebP changes decoded pixels outside the repair area; exact outside-mask preservation applies before compression only.
- Originals of approved photos are periodically removed only after all jobs sharing that original are approved and their stored candidates pass a fresh hash check. Original reservations are intentionally not reclaimed, so displayed reserved storage can exceed actual storage. Rejecting after cleanup does not restore the deleted original.
- `japan_photo_ready_vehicles` checks the complete registered set of photo IDs. Missing, unverified, pending, or rejected photos prevent vehicle readiness. Changing an approval to rejected removes readiness immediately.
- Public publication remains blocked pending explicit approval after automatic approval review rejected anonymous catalog deployment. The deployed catalog requires authentication; Japan Market redirects stay closed. The ready count in Admin is not a published count. Draft public-loader changes are retained locally under ignored `tmp/public-draft-*` files and are not deployed.

Validation: Python compression tests; full typecheck, lint, 105 Vitest tests and production build; database rollback fixture verifying missing/pending/rejected photos block readiness and all-approved photos enable it. Real cloud candidate verification and unauthorized endpoint checks are performed during deployment. No user photos are approved by automated tests.
