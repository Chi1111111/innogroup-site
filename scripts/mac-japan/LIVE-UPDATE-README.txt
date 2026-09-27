Mac 采集实时日志小更新

1. 将本 ZIP 解压到独立目录，勿覆盖原来的完整部署包。
2. 由 Mac Codex 执行：python3 scripts/mac-japan/install_live_update.py
3. 更新器只更新采集器、状态转发和日志上传模块；不改 setup.py、runner.py、launchd 配置或连接密钥，不重启图片程序。
4. 仅当采集已经暂停或服务未加载时安装。安装前检查原文件摘要，发现其他修改会拒绝覆盖。
5. 更新器保留暂停文件。安装后先查看 Admin 的 Mac 报到时间和暂停状态。需要恢复采集时，在 Mac 检查原因后使用现有 setup.py resume-collector。
6. 查看 Admin 是否连续出现读取列表、读取详情、发布、等待等中文记录。程序心跳不等于采集进展。
7. 自动备份位于 ~/Library/Application Support/INNO Japan Pipeline/backups/collector-live-时间戳。

云端接收函数：japan-collector-live。仅传中文动作、时间和状态，不传原始日志、来源链接、连接密钥。
Mac 每 10 秒报到，Admin 每 5 秒读取，日志最近 100 条、24 小时；上传失败不暂停采集。
