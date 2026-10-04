# YILU-MCP-COMPLETE-20260929｜实际交付与验收

2026-09-30 更新：本地实现与官方隧道控制面连接已验证，**ChatGPT 应用创建已由用户截图确认；实际读取／视觉辨认仍待验**。用户已提供本项目 tunnel_id 并在本机输入运行密钥。最初只读取 readyz 产生了误报；实际日志是直连超时、成功轮询为零。已让项目隧道单独使用现有系统本地代理 `http://127.0.0.1:7897`，没有修改系统代理或其他项目。成功取得“一路长歌”远端元数据，并出现真实成功轮询。status 现在必须有90秒内的成功轮询才标 connected。证据见 `evidence/ai-bridge/tunnel-repair-20260930.json`；定向回归15通过，本地八工具和图片协议重验通过。

2026-09-30 01:08 用户截图显示“一路长歌mcp”创建成功且已连接。本地控制面轮询仍成功；尚无对应新工具调用记录。浏览器自动化对该网址的访问被工具限制，不绕过。

真实根目录 `/Users/yvainair/Code/游戏-左右滑古代史`；分支 `codex/ios-polish-round2-20260929`；HEAD `79fbea0f8f135e6d9457cde672118b52baacb4b6`，仍有原先未提交工作。本轮无提交／推送／合并／发布。活动平台是 iOS 原生，入口 `tools/build-ios.py`。未更改全局 Codex/Claude、登录或计费，也未调用模型 API。

## 已实施的完整本地范围

| 范围 | 实际结果与证据 |
|---|---|
| 接入源码／需求／Git／配置／报告 | 已索引 5300 余项允许资料，含 dirty 源码、暂存／未暂存 diff、最近提交、真实配置字段入口；`initial-refresh.json`、固定快照清单 |
| 八个只读工具 | 官方 Python SDK **2.2.0**，stdio 实际列出八工具并逐项调用；`evidence/ai-bridge/stdio-acceptance.json` 包含 FormalGame.ts 1–12 行与原哈希，无远程执行入口 |
| 不可变版本与自动更新 | code/evidence 两类指纹、CAS 独立副本、固定 id、游标绑定、稳定性重试、debounce、心跳、pin/unpin、20份＋24小时保留及2GiB限额；合成变更合并成一次新快照，旧快照读到旧值 |
| 真实图片 | 标准 ImageContent、本地 SDK 解码、EXIF 清除、透明／比例保留、受限原图与裁剪；`stdio-game-image.png` 是 MCP 真正返回的游戏像素。Codex 已查看到周瑜、偃月刀、部队和道路；**不是 ChatGPT 客户端验收** |
| 视频关键帧 | 复用 89.933333 秒、30fps 的既有原速对比短片，初导12帧，再导5–8秒6帧；共18帧，缓存去重；MCP读到0.000和7.494秒真实帧。旧短片的本轮源码归属未知，保持 version_unknown；标为固定状态／自动输入辅助的演示证据，不冒充真人自然试玩 |
| 开发态诊断 | 真正导出、编译、安装并运行 Cocos iOS 模拟器。build_id `ios-cfc78ed2f4a44245`；构建前 code_fingerprint `cea5390c9f9fb2b13dbb85e689bb6fe39cea29d4cd5509ca1b4d2b20a64804b0`，与当前游戏内容一致；见 `native/bridge-build-manifest.json` |
| 真实运行数据 | 已记录 startup、screen_enter、level_start、level_end、interval。一次样本逻辑兵力180，主将1／随军2／士兵40，显示部曲上限40，活动敌军55、视口提交敌军55、投射物3；不是从静态代码推出来的数字。`runtime-import.json` 对应实际完整 JSONL |
| 运维与交接 | 项目专用 LaunchAgent 已启用；停止后 live=false、恢复后心跳恢复；install/auth/start/stop/status/doctor/refresh/pin/unpin/import-media/export-frames/import-runtime/capture-check/finalize/export-review/uninstall 均有实际实现。一页 RUNBOOK、任务模板及带真实基线的交接样例已提供 |
| 官方隧道准备 | 官方 v0.0.15 Apple Silicon 客户端，发布资产 SHA256 已核对；项目专用 profile 生成、隐藏输入 Keychain、子进程剥离控制面密钥、有限退避／停止均已接入。本机 Keychain 与控制面元数据／成功轮询已验证；ChatGPT 工作区创建与调用仍待验 |

## 集中验证结果

- 桥接安全／快照／媒体／自动更新／保留策略：**12 项通过**，见 `bridge-test-receipt.json` 及其 report_id。包含越界、软链接、敏感字面量、命令参数脱敏、错游标、并发改源、旧快照、quota、pin、24小时保护、导入视频帧引用保护。
- 正式玩法相关回归：**26 项通过**；TypeScript 检查 exit 0；见 `formal-check-receipt.json`、`typecheck-receipt.json`。未默认重跑完整十关。
- 原生 Debug 导出／构建 exit 0，正式战场实际运行；新增统计在绘制路径取样，不修改碰撞／数值／占位。开发场景使用隔离存档 `R2:live:180`，**不是新一轮十关或真人触控验收**。
- 实际诊断类开关测试：Release条件下写盘 **0 次**；600帧 Debug 运行含退出清理共11次批量写盘，10条间隔聚合；模拟写盘异常不崩溃。此项是实际 TypeScript 类的适配器测试，**没有运行新的原生 Release 二进制**。
- 本地协议结果真实包含 ImageContent，图片736×1600；两个视频帧返回原视频时间戳。源文件行号、哈希及八工具返回状态存于 `stdio-acceptance.json`。
- 611 个原有 assets/native/tools 文件逐一比对：仅 `FormalGame.ts`、`battle.ts` 和 `tools/build-ios.py` 因诊断接入改变，0丢失；原数值／素材／关卡／存档实现未改。见 `protected-files-verification.json`。Git diff 还包含此前已存在的表现优化，不能全部归为本轮。

## 修复过程中保留的失败记录

初始原图缓存策略触及2GiB，服务按限制停止发布；改为历史图960、当期证据1600长边的真实预览，清理仅限本任务尚未发布的 CAS 副本，保留全部源图。现在可通过显式本地 import-media 导入需要细看的原图。当前空间由 status／专有目录实况为准。

一次回归命令直接调用 `tsx` 时 PATH 不含本项目 bin，得到 ENOENT；修正为明确的 `./node_modules/.bin/tsx` 后26项通过，失败报告未删除。第一次原生抓取探针断言失败；重新确认安装后的 App 容器、核对内嵌 build_id 后读取成功，未把失败探针计为通过。

## 真实待验与观察边界

1. **blocked_user_action：** 隧道与密钥配置已完成；ChatGPT 应用已创建并显示连接；等待在聊天中执行实际工具与图像读取。
2. **未验：** 隧道 readyz 与账号实际归属、ChatGPT 列出八工具、返回代码行、对测试图盲辨视觉特征、读取真实游戏图和视频帧、账号撤销后的拒绝。只有本地图片成功，不能替代这些项。
3. **未验：** 本轮真机 Debug 运行及诊断导出、原生 Release 二进制的关闭状态、跨真实休眠／掉网恢复。iPhone 可在当前开发设备列表发现，但本轮只把诊断 Debug 安装到指定模拟器，未改动 iPhone 安装。
4. 渲染计数是人体精灵已提交且矩形与战场视口相交，排除零透明与已死敌兵；**不测量被其他物体遮挡后的像素可见性**。CPU/GPU耗时、draw call、内存无法可靠取得，返回 unavailable。帧间隔不是 GPU 耗时。
5. 旧报告和媒体没有可信构建关联时是 unknown，时间仅 observed_at，不能用文件 mtime 冒充测试时间。视频帧不能验声音、连续动作全部细节或真实性能。

## 启动与下一步

在工程根运行 `./tools/project-reader/yilu-bridge start`，随后 `status` 或 `doctor`。登录自启采集已开启，没有账号配置时隧道不会连接。

用户账号操作完成后运行本地 `auth --tunnel-id ...`，再 stop/start；使用 `TASK_TEMPLATE.md` 中验收提示，让 ChatGPT 真正读取两张图与视频帧。当前服务保持只读，不因任务书内容自动获得开发权限。

主要文件：`tools/project-reader/`（完整服务与锁依赖）；`assets/scripts/formal/BridgeDiagnostics.ts` / `BridgeBuild.ts`（开发日志与预构建印记）；`docs/ai-bridge/RUNBOOK.md`（一页操作）；`evidence/ai-bridge/`（实际图片、协议返回、检查与原生记录）。


## 2026-09-30 实际 ChatGPT 读取与缺口修复

用户转交了 GPT 读取固定快照 `s_20260929T170915_ca320d31` 的回复，本地 audit 对应记录包含 project/source/check/runtime 与实际 read_media 调用。游戏截图和一张旧视频帧的 ImageContent 已返回；这确认实际资料与媒体读取，不能单凭泛化画面描述认为已完成详细视觉评审。

修复：原项目录像路径与显式导入副本按完整 SHA-256 关联，原路径现在可直接读取18张预计算帧中的指定帧；旧快照不可变，新内容同名不能复用旧帧。overview 提供报告、运行图、录像、版本差异四个直接入口，避免逐页扫描全量美术素材。16项回归通过，原路径实际返回两帧，见 `video-index-fix-20260930.json`。ChatGPT 需重新选择最新快照才能复验。

对上轮运行源码账本13项逐一比对：10相同、3不同；交付账本19项：16相同、3不同。不同项是 battle.ts、FormalGame.ts、tools/build-ios.py，后续桥接诊断接入已改变文件。账本仅覆盖列出文件，不能冒称完整历史构建指纹。旧264测试／十关／录像保持历史记录，不标成当前重新执行，见 `evidence-gap-review-20260930.json`。当前代码对应的完整录像、iPhone实际操作与性能仍待验。
