# 给公司 Mac mini 上的 Codex：INNO 照片处理安装与验收

## 用户已授权的目标

请在这台公司 Mac mini 安装并启动照片后台程序。用户已授权两台电脑分工处理已有照片队列、自动上传及按既有规则自动通过；无需再次询问是否安装此程序。不要采集新增车辆，不要修改水印检测或自动上架规则，不要缩短 1.5 秒间隔，不要增加超过 3 个在途任务。

这不是 AI 图片程序，不调用大模型 API。下载、检测、修补和压缩在内存中完成，照片不落本机硬盘。照片和队列存 Supabase；本机仅有代码、Python 环境、私密连接配置及日志。

## 收到的文件

1. `INNO-Photo-Mac.zip`：解压后包含本说明、mac_setup.py、cloud_worker.py、image_processing.py、japancars-template.png、requirements.txt、测试文件。
2. `connection-private.json`：单独传来的真实连接配置，**不要打印内容、提交 Git、上传公共网盘或粘贴到聊天里**。它是照片功能专用凭据，不是 Supabase service-role 密钥。

程序包不含凭据。如果缺少第二个文件，请向用户索取这个文件，不能自行猜测或创建令牌。

## 分工与交接（云端已准备好）

- Windows：默认处理全部来源，直到 Mac 第一次领取任务。
- Mac：配置固定 `sourceGroup: mac`，只领取 `www.japancars.co.jp`。
- Mac 第一次领取时，云端开启分工。Windows 此后只领取 919919.jp 和 gabs.biz 图片。
- 若 Windows 正在下载 Japan Cars，Mac 先等待这些任务结束或租约到期，避免交接期间重复请求该来源。
- 数据库行锁与十分钟租约保证两个任务不会领取同一张照片；程序还有本机进程锁。
- **分工开启后不会因 Mac 暂时离线自动退回 Windows**。Mac 暂停时其队列保留，重新启动后继续；Windows 关闭时 Mac 也不会接管 Windows 来源。
- 不要再在第三台机器启动相同来源组。两台分别限速不等于来源永远不会限流。
- Admin 暂停是全局开关，影响两台。任何来源 401/403/429 也会暂停全局队列，先查原因再手动恢复，禁止自动换 IP/代理或反复请求。

## 安装步骤：由 Mac Codex 实际执行

1. 确认当前在 macOS 已登录桌面用户下运行，记录芯片类型与 macOS 版本。不要使用 sudo 安装本服务。
2. 把程序 ZIP 解压到用户可写的普通文件夹。保留连接文件在本机私密位置。
3. 检查 `python3 --version`。本包固定依赖支持 Python 3.10–3.13，优先 Python 3.12；不要用 Python 3.14，也不要用系统 Python 2。
4. 如果没有合适 Python，优先使用机器已有的 Python 3.12。若已安装 Homebrew，可执行 `brew install python@3.12`，然后使用 `$(brew --prefix python@3.12)/bin/python3.12`。没有 Homebrew 时按官方安装方式准备 Python 3.12，不要运行来源不明脚本。不要为此修改其他项目环境。
5. 进入解压后的程序文件夹，运行（将路径替换为实际绝对路径，并正确引用空格）：

```sh
python3.12 mac_setup.py install --config "/实际路径/connection-private.json"
```

`python3.12` 可替换成检查过版本的 Python 绝对路径。安装器会创建私有目录、独立 venv、安装固定依赖，检查云端连接并注册用户 LaunchAgent。它会强制 sourceGroup=mac，不会把凭据显示出来。

6. 等待日志出现 `processed`。如果 Admin 暂停中，不要擅自反复重启，先向用户报告，再根据用户授权点击“允许继续”。不要自动批准人工待审图片。

## 安装位置与后台行为

- 程序：`~/Library/Application Support/INNO Photo Worker/`
- 私密配置：上述目录的 `connection.json`，权限 600；目录权限 700。
- 日志：上述目录的 `logs/worker.log` 和 `logs/worker.error.log`。
- 服务：`~/Library/LaunchAgents/nz.co.innogroup.photo-worker.plist`。
- 使用当前用户 LaunchAgent；远程控制断开、关闭终端、屏幕锁定不停止处理。
- **用户登出会停止服务；重启后须登录这个用户才会自动启动**。没有承诺开机未登录即可运行。开启 FileVault 的重启通常还需要解锁。
- 程序运行期间使用 macOS 自带 `caffeinate -i` 防止空闲睡眠，不会修改系统永久设置；主动睡眠、关机仍会停止。
- 每台最多 3 张在途，但来源下载始终单路，开始时间至少间隔 1.5 秒。上传复用 HTTPS 连接。
- 本版日志没有无限期自动轮换。长期运行时可定期归档/清理日志，不能清理配置或照片云端数据。

## 验收：请完成后向用户报告

1. `python3.12 mac_setup.py status` 应显示服务已加载、正在运行；重复 start 不能产生第二个处理进程。
2. 查看最近日志（只输出状态行，不输出 connection.json）：

```sh
tail -n 10 "$HOME/Library/Application Support/INNO Photo Worker/logs/worker.log"
tail -n 10 "$HOME/Library/Application Support/INNO Photo Worker/logs/worker.error.log"
```

3. 等到至少 5 张真实照片完成，确认没有持续 401/403/429 或认证错误；记录 elapsedSeconds 估算吞吐，不承诺理论上限。
4. 在 Admin `/admin/photos` 确认进度增长。如果能访问数据库，检查 `mac_seen_at` 更新、`mac_worker_enabled=true`；Mac 领取记录的 `worker_source_group=mac` 且 URL host 为 www.japancars.co.jp。不要为了测试更改已审核照片。
5. 新照片只存 Supabase；本机目录不应出现批量 JPG/WebP 原图或成品。程序自带的 japancars-template.png 是算法模板，不是下载的车辆照片。
6. 确认明确检测到水印的照片进入人工待审；其他符合既有规则的校验成功后自动通过。只有车辆完整照片集合全部通过才自动上架。
7. 最后报告安装路径、服务状态、已完成样本数量、速度、是否需要用户处理任何事项。没有实际执行成功不得声称部署完成。

## 日常操作

在保留的解压文件夹执行：

```sh
python3.12 mac_setup.py status
python3.12 mac_setup.py stop
python3.12 mac_setup.py start
```

stop 卸载当前服务但保留安装文件；start 重新加载。重复 start 不创建第二个实例。安装器可再次运行进行更新，会先停止旧服务再复制程序。

单次前台诊断必须先停止后台服务，然后使用安装环境和显式配置：

```sh
"$HOME/Library/Application Support/INNO Photo Worker/venv/bin/python"   "$HOME/Library/Application Support/INNO Photo Worker/cloud_worker.py" work   --config "$HOME/Library/Application Support/INNO Photo Worker/connection.json"   --limit 5 --interval 1.5
```

诊断结束后重新 start。不要从默认路径误加载 Windows 配置。

## 故障处理

- 缺少 cv2/numpy：检查安装器 pip 输出，确保 Python 版本支持且使用安装目录 venv。不要盲目升级依赖版本。
- 系统提示 launchctl 域不存在：当前不在已登录用户桌面会话。远程登录桌面后重试；不要改成 root 服务绕过。
- Admin 已暂停：服务会保持在线但不下载。先查暂停原因。
- 401/403/429：停下来报告来源和状态码，不要通过改 IP/代理绕过。
- 网络临时中断：队列和已上传照片保留，程序会重连；未完成任务最多等待十分钟租约到期。
- Mac 停机：只影响它负责的 Japan Cars 队列，不丢任务。
- 若用户要恢复 Windows 处理全部来源：先 stop Mac，确认没有其有效 processing 租约，再让具有 Supabase 权限的 Codex 将 japan_photo_settings.mac_worker_enabled 设为 false。**不要仅改这个开关而让 Mac 继续运行**，它下次领取会再次开启分工。

## 来源参考

macOS 睡眠设置：https://support.apple.com/en-asia/guide/mac-help/mchle41a6ccd/mac
数据库任务锁定：https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE

Windows 侧已完成代码与服务端验证；Mac 的真实安装、依赖下载、LaunchAgent 与公司网络访问必须由这台 Mac 上的 Codex 完成验收。

## 运行详情更新

此包包含 worker-details-1 诊断上报。若之前已安装，请使用本包重新执行安装命令，安装器会停旧服务并替换程序，再重新启动。不要只替换文件而不重启旧进程。Admin 的“运行详情”展开后显示机器、来源、当前照片、采样步骤、最后完成时间、错误记录和排查提示。状态采样每 15 秒，快速步骤可能不出现在采样中；云端断网期间无法实时上报，连接恢复后才补报最近错误。旧版仍能显示机器心跳与服务端失败记录，但详细阶段会标记未上报。重试不会删除诊断启用后记录的错误历史。
