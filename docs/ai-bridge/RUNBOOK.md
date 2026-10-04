# 一路长歌项目只读助手｜一页操作说明

工程：`/Users/yvainair/Code/游戏-左右滑古代史`。以下命令先在该目录执行；入口简称 `B=./tools/project-reader/yilu-bridge`（仅此终端变量）。Python/依赖在 `tools/project-reader/.venv`，运行状态在 `~/Library/Application Support/YiluProjectReader/yilu-changge`，默认上限 2 GiB；本项目于 2026-09-30 为二十关证据调整为 4 GiB（仅项目专用配置）。源码、游戏存档不在缓存目录。

| 日常操作 | 实际命令 |
|---|---|
| 初装／修复启动项 | `B=./tools/project-reader/yilu-bridge; $B install` |
| 启动／停止／分层状态 | `$B start` / `$B stop` / `$B status` |
| 本地协议与实际游戏图片自检 | `$B doctor` |
| 确定更新资料，不运行测试 | `$B refresh` |
| 保护／取消保护旧快照 | `$B pin s_实际编号` / `$B unpin s_实际编号` |
| 只导入选中的游戏图片／录像 | `$B import-media '/绝对路径/文件.mp4' --game-only --capture-type natural_play --speed original` |
| 局部视频帧（最多30张） | `$B export-frames m_视频编号 --start 5 --end 8 --count 12` |
| 导入本游戏模拟器诊断 | `$B import-runtime --simulator 09499CE2-E8CC-4470-A90D-DDD7F8946C21` |
| 用户选择真机开发导出 | `$B import-runtime --device 设备UDID`；只读本 App 的诊断 JSONL，需已装 Debug、设备解锁 |
| 已传到 Mac 的诊断 | `$B import-runtime --path '/所选/yilu-bridge-events.jsonl'` |
| 显式运行并记录检查 | `$B capture-check --name typecheck --timeout 180 -- npm run typecheck` |
| 开发收尾（不重复测试） | `$B finalize --task 任务编号 --result docs/ai-bridge/ACCEPTANCE.md` |
| 账号故障时人工核验包 | `$B export-review --out '/Users/yvainair/Code/游戏-左右滑古代史/evidence/ai-bridge/review.zip'`；最多64MiB，不能代替 MCP 接通验收 |
| 卸载启动项／可选清专有缓存 | `$B uninstall`；加 `--clear-cache` 清本工具生成的快照与 CAS；加 `--remove-key` 删除本工具 Keychain 项 |

**账号只需集中做一次：** 进入自己的 [Platform Tunnels](https://platform.openai.com/settings/organization/tunnels)，创建/选择《一路长歌》隧道，关联自己的目标 ChatGPT workspace；创建/管理需要 Read/Manage，运行需要 Read/Use。按自己的账号实际页面授予必要权限。创建运行密钥后，在本机终端运行 `$B auth --tunnel-id tunnel_实际ID`，按隐藏提示输入。密钥只存 macOS Keychain，不发聊天、不放 `.env` 或 plist。然后 `$B stop`、`$B start`。ChatGPT 网页 Settings → Security and login → Developer mode；Plugins 新增 Tunnel 连接并启用。名称以实际界面为准；如果权限、工作区或付费要求阻断，保留阻断，不使用匿名公网绕过、不自动购买。官方：[隧道](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)、[ChatGPT 连接](https://developers.openai.com/plugins/deploy/connect-chatgpt)。运行密钥仅用于控制面，本工具不调用模型 API。

**ChatGPT 使用：** 先调用 `project_overview` 固定 snapshot_id，再 `list_evidence/search_project/read_source/read_changes/read_checks/read_runtime/read_media`。先让它描述测试图（文件名不含答案），再描述真实游戏截图与视频帧，核对返回哈希/时间戳。能看到文件名或工具绿色不算读到图片；必须辨认真实画面。图片默认长边1600、最多4张/8MiB；超限缩小范围。大图仅保留预览时可本地明确导入原图后裁剪。帧不是音频检查或完整视频播放。

**读到旧资料：** 查看 overview 的心跳、最近成功时间、code_fingerprint 和证据自身版本。心跳超过45秒标 stale；先 `$B status`，必要时 `$B refresh`。代码停止变动5秒合并更新，完整 JSONL 批次15秒，最多等30秒再检查一致性；仍在写入就保留上一快照 updating。不会自动构建/测试。报告增加只变 evidence_fingerprint。旧快照保留最近20个以及24小时内全部快照；更久分析请 pin。超额且无法安全回收则 storage_limit，处理专有缓存，不删除游戏原件。路径迁移后显式 `$B install --rebind`；已配隧道还需再次运行 auth 重写该项目 profile 的命令路径，不寻找同名旧仓库。

**运行与隐私：** 登录后用户 LaunchAgent 恢复采集器及已授权的官方隧道；无授权时只运行本地采集。休眠/关机/断网会中断，恢复后有限退避重连，连续六次失败后需 doctor、stop/start；不改变休眠策略。只接本项目白名单源码、docs/evidence/deliverables/art-source 及主动选定媒体，不扫描相册/Downloads。文字脱敏不能证明图片没有私密内容，请只选游戏画面。只读约束不是同用户进程的系统沙箱。停止/撤销阻止后续读取，已进入聊天的内容不会自动删除；关闭训练也不表示资料始终留在本机。彻底撤销还需在 ChatGPT 删除此连接，在本人 Platform 撤销工作区关联、停用隧道及吊销此运行密钥。


**2026-09-30 连接排障：** 本项目已配置既有本地代理 `http://127.0.0.1:7897`，只对 tunnel-client 生效；本地代理需保持运行。配置保存在项目专用 Application Support/config.json 的 tunnel_proxy 字段，端口改变时按实际代理设置更新。`readyz` 只证明客户端本地就绪；`status` 还检查最近90秒的成功轮询。ChatGPT 创建界面如出现 PNG 图标校验，先移除自定义图标。应用创建和实际图像读取仍须单独验收。
