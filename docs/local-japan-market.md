# Local collection, cloud storage

Run `npm run japan-market:local:check` to verify GitHub access without contacting Japan Cars or changing inventory.

Run `npm run japan-market:local` to collect up to 5,000 additional/refreshed vehicles with a three-second request gap. The CLI uses the existing GitHub login. It reads the current immutable cloud snapshot into memory, keeps source responses and galleries in memory, and uploads an atomic commit directly to GitHub. The existing website deployment serves the data after the commit builds. No new HTML, vehicle cache, snapshot, checkpoint, or image files are written to local disk in this mode. Photos remain source URLs, not downloaded images.

This mode does not use the disk-writing reporting wrapper. Existing repository data and past local test files are not removed. This is application-level no-disk storage, not a guarantee about OS paging or crash dumps.

Source challenges stop collection. Verified records can still be uploaded when available. Closing the process before upload discards the in-memory batch; published records remain in the cloud. If only website code changes during scanning, uploads use the latest commit and preserve those code changes. If inventory or collection history changes, the upload fails closed instead of overwriting newer data. Run again to resume from cloud inventory; there is no durable local retry file.

Admin's run detail button shows per-vehicle added/updated fields and photo additions/removals. Timestamp-only checks are not counted as content updates. Older runs without detailed snapshots say that details were not recorded. The 25-vehicle run from 15 September has been reconstructed from its exact Git commit; it is marked as reconstructed.

The Admin manual scan button starts the GitHub runner; the separate local-run button connects to this computer. It does not remotely start a switched-off computer. This local command runs only while this computer is on; no startup task or replacement midnight scheduler is installed by this change.

## 在其他电脑安装 / Admin 本地运行

1. 安装 Node.js 24 或更新的兼容版本，以及 GitHub CLI（gh），确保两者在 PATH 中。
2. 解压 Admin 下载的程序包，在解压目录运行 `npm install`。
3. 运行 `gh auth login`，登录对 Chi1111111/innogroup-site 有写入权限的账号。账号凭据由 GitHub CLI 管理，不包含在下载包中。
4. 运行 `npm run check` 验证云端读取权限（不会访问车源站或写入库存；上传权限在实际上传时验证）。
5. 双击 `Start.cmd`（Windows），或运行 `npm start`（其他系统）。保持窗口开启。
6. 在正式网站 Admin 点击“本地运行”，填入程序窗口显示的配对码，点击“开始本地扫描”。若浏览器询问本地网络访问，允许该网站连接。

已有完整代码的电脑可运行 `npm run japan-market:local:service` 启动服务。
每批上限 5,000，串行请求间隔 3 秒，本地最长运行 6 小时；来源限制可能使实际采集更少。配对码随服务重启更换，仅保存在内存。服务只监听 127.0.0.1:17831，仅接受正式网站来源及正确配对码，不支持任意命令执行。
关闭网页不会停止采集，关闭本地程序会中断未上传批次。完成后等网站发布，再刷新 Admin 运行记录。一次仅在一台电脑扫描，避免不同电脑或云端任务同时更新造成上传冲突。本功能不会注册开机服务，也不会从网页自动启动尚未运行的程序。

程序包只包含代码，不包含库存、照片、缓存或账号凭据；运行时车源仅在内存中处理，结果直接上传 GitHub。安装依赖、程序代码和 GitHub CLI 登录凭据仍会保存在电脑上。没有安装程序的电脑不能直接从网页执行采集。

## 实时进度

Admin 本地运行面板每两秒读取服务内存中的进度：阶段、有效车源、FOB 报价、照片链接、详情失败、跳过和过滤数量、用时及上传状态，并显示最近 50 条运行日志。采集数量条不表示整个任务完成比例。刷新网页后填入配对码，点击“连接并查看进度”恢复查看，不会新开采集任务。断线会显示最后收到的值并重连。旧版本本地服务需要等本批结束后更新程序包并重启；进度和日志不保存到磁盘，服务关闭即消失。

## 仅采集新增车源
云端已有的 Japan Cars 车辆按来源库存编号或详情链接匹配，不再读取详情，不受七天期限影响。同一批重复出现的车辆也只处理一次。列表页仍需读取才能发现新车；不按品牌、车型、年份合并不同车辆。此模式不会自动刷新已有车辆的价格、照片或库存状态。源站换编号和链接、或跨来源缺少共同车架号的车辆，无法保证识别为同一辆。

详情编号不匹配时会记录请求编号、实际编号和页面标题，统计首次不匹配发生在第几次详情请求。单辆失败会跳过；连续九次失败暂停采集并上传本批已验证车源。大小写及首尾空格差异不视为不同车辆。停止原因保留在运行记录中，不能将批次已上传误认为完成了全部目标。

## 连续运行与自动等待
连续三辆详情缺少库存编号时，在同一会话内依次等待 15、30、60 分钟，每次只重试当前失败车辆。恢复正常后继续新增采集；整次运行最多等待三次，仍失败或剩余时间不足则结束并尝试上传已验证车辆。串行运行，请求间隔仍为三秒。不更换 IP、不清空 Cookie、不自动处理验证码；HTTP 401/403/429 或明确挑战仍停止。Admin 显示等待阶段和下一次检查时间。等待期间车源只在内存，关闭进程会丢失未上传批次。间隔为程序退避设置，不代表源站承诺在该时间恢复。

## Admin 自动批次模式（当前默认）
本地服务启动的采集改为自动分批：连续三辆缺失编号时结束本批并上传，只有进程正常退出、确认车源已上传且有新增，才会等待 30 秒启动下一批。每批重新读取最新云端库存，跳过已收录车辆。一次点击累计上限 5,000 辆、最多 40 批、总运行时间最多 6 小时；到达任一限制即停止。
上传失败、没有新增、非此类异常、HTTP 401/403/429 或明确验证码挑战不会自动重启。Admin 显示批次及累计上传量，提供“本批结束后停止”；批间等待时点击会取消下一批。已上传批次留在云端，未上传内容仍只在内存。不要直接关闭正在采集的窗口。新模式替代 Admin 原先的 15/30/60 分钟同会话等待；独立命令仍保留原等待方式。自动分批不保证源站持续可用。
