# GitHub 完整审查入口｜一路长歌：三国

审查范围是 `codex/formal-cocos-20260927` 相对 `main` 的 PR。它把本地已有的 UI、战斗返工、FIX2、规则预览与本轮真实 Cocos 十关集成一起交给 GPT 核查。旧的 FIX2 PR 是历史阶段，不代表此版。`main` 未合并此版。

## 先看可复核的结果

- [本轮验收与未完成项](ACCEPTANCE.md)：25 项定向测试通过；整套旧测试 233 项中 5 项失败，在接管前代码中也复现；Web 与微信包本地构建通过，微信正式资源约 13.3 MB。没有微信开发者工具回执或真机结论。
- [完整自然十关视频（GitHub 压缩版）](../../evidence/FORMAL-20260927/natural-ten-github.mp4)：与本地原始 MP4 等时长、同帧率、无加速、无声。压缩仅用于 GitHub 审查；本地原片为 `evidence/FORMAL-20260927/natural-ten.mp4`，未入 Git，因为超过 GitHub 单文件上限。录像代码版本见 [RECORDING_BUILD_ID.json](../../evidence/FORMAL-20260927/RECORDING_BUILD_ID.json)。
- [第四关原速连续片段](../../evidence/FORMAL-20260927/battle-short.mp4) 与 [前三关复用片段](../../evidence/FORMAL-20260927/natural-three.mp4)。[最终 UI 与震军夹具补录](../../evidence/FORMAL-20260927/final-ui-control.mp4) 拍摄于后续修补版本，不属于自然十关。片段来源见 [MEDIA_SOURCES.json](../../evidence/FORMAL-20260927/MEDIA_SOURCES.json)。
- [四组同状态前后截图](../../evidence/FORMAL-20260927/comparison/) 与 [十关抽帧总览](../../evidence/FORMAL-20260927/video-ten-contact.jpg)。截图是夹具；自然流程证据是视频及 [逐关结果](../../evidence/FORMAL-20260927/natural-ten-result.json)。
- [可下载的 Web 构建](playable-web.zip)：将 ZIP 解压到仓库的 `build/` 下，在 `build/web-mobile/` 目录用本地 HTTP 服务运行。ZIP 内包含实际 Cocos Web 构建，不需先安装 Cocos；核验媒体在本 PR 的 `evidence/FORMAL-20260927/`。

## 源码与事实来源

- 正式入口：[Game.ts](../../assets/scripts/Game.ts)、[FormalGame.ts](../../assets/scripts/formal/FormalGame.ts)。规则、战斗、存档及素材目录为 `assets/scripts/formal/`、`assets/resources/formal20260927/`；原素材在 `art-source/`，切片脚本在 `tools/formal-*.py`。
- 有效玩法：[统一玩法规则](../BATTLE-PREVIEW-20260926/统一玩法规则-20260927.md)；显式补全初值：[PARAMETERS.md](PARAMETERS.md)。浏览器预览代码、认可视觉基线和最终战斗规格在 `docs/BATTLE-PREVIEW-20260926/`。
- 实施清单：[IMPLEMENTATION.md](IMPLEMENTATION.md)；美术边界：[ART_STATUS.md](ART_STATUS.md)；逐项核验提纲：[给GPT的核验说明.md](给GPT的核验说明.md)。
- 版本关系：[BUILD_ID.json](../../evidence/FORMAL-20260927/BUILD_ID.json)、[AFTER_RECORDING_DIFF.json](../../evidence/FORMAL-20260927/AFTER_RECORDING_DIFF.json)。完整自然录像发生在小屏整备、兵法与菜单动态图集的最后修补前；补录覆盖受影响状态，不能说两个代码哈希相同。

## 本地复核

克隆 PR 分支后，可先运行 `mkdir -p build && unzip docs/FORMAL-20260927/playable-web.zip -d build`，然后运行 `python3 tools/play-formal.py`。修改源码后，用 Cocos Creator 3.8.8 打开工程，`npm ci`，运行 `npm run typecheck`、`./node_modules/.bin/tsx --test tests/formal.test.ts`、`npm run build:web`；微信包为 `npm run build:wechat`。默认正式版，`?legacy=1` 可打开旧三关入口。构建步骤详见 [README.md](README.md)。

本次请求 GPT 逐项审查真实入口、规则与可达性、旧存档兼容、十关自然流程、界面与素材、构建复现和证据边界。请列出具体代码路径、复现步骤和严重度；对于只靠模型或夹具证据支持的项单独标注，不能把“可运行十关”写成最终视觉或真机全绿。
