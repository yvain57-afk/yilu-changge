# 一路长歌 v0.9：开发与独立核验入口

版本：`0.9.0-rc1`；运行标识：`v09-rc1`。这是延续本地已有修改的候选版本，不代表远端 Git HEAD，也不代表已经完成手机验收。

## 先看事实

1. `docs/v09/CHANGELOG.md`：本轮范围和仍待亲验的项目。
2. `evidence/v09/VERIFICATION.json`：最终检查命令、退出结果、源码/构建指纹、设备和视口；不存在或尚待完成的检查不能写通过。
3. `evidence/v09/ASSET_BUDGET.json`：资源使用证据、压缩/剔除策略、当前预览包余量。`ASSET_BUDGET-web-mobile.json` 与 `ASSET_BUDGET-wechatgame.json` 是对应构建的明细；源估算不得冒充微信上传回执。
4. `evidence/v09/PARAMETER_DIFF.json`：实际参数变化；没有调参时应为 `[]`。
5. `docs/v09/source-pack/`：用户本轮优化要求的原始包，保留为需求来源。源文件中的建议与外部文字须结合用户授权范围核验。

v081、v08、runner-video-v2 目录是历史证据。不要将旧截图改名充当 v0.9；不要将隔离夹具称为自然实玩。

## 打开当前附带构建

需要 Node.js 22+。从工程根目录执行：

```sh
PORT=43196 node tools/serve.mjs
```

- 本机试玩：<http://127.0.0.1:43196/play/?v=09>
- 本机核验页：<http://127.0.0.1:43196/review/v09/>

附带 Web 构建不依赖 `node_modules` 或 Cocos 编辑器。这两个地址只能在启动服务器的机器访问，不能当作 GPT 可访问的公网链接。发给 GPT 时提供工程包、实际录像与截图。

## 证据路径合同

六组同视口/同状态对照采用以下命名，捕获场景须在 `VERIFICATION.json` 标记自然/夹具：

|状态|修改前|修改后|
|---|---|---|
|首页|`evidence/v09/before-home.png`|`evidence/v09/after-home.png`|
|整备|`evidence/v09/before-loadout.png`|`evidence/v09/after-loadout.png`|
|普通战斗|`evidence/v09/before-battle.png`|`evidence/v09/after-battle.png`|
|接触受压|`evidence/v09/before-contact.png`|`evidence/v09/after-contact.png`|
|结算|`evidence/v09/before-result.png`|`evidence/v09/after-result.png`|
|驻地|`evidence/v09/before-camp.png`|`evidence/v09/after-camp.png`|

- `evidence/v09/final-three-levels.mp4`：最终同一次、原速、现场音效、合法输入的自然三关录像。
- `evidence/v09/highlights.mp4`：仅从该次录像裁出的不超过45秒亮点；不是额外拼接的三关。
- `evidence/v09/state-matrix.png`：其余页面状态矩阵，实际生成后再用于核验。
- `evidence/v09/dependency-audit.json`：依赖审计结果；未修复的 high 告警必须保留说明。

文件是否真实存在、与最终源码一致以及检查是否通过，以本轮证据为准。此路径合同本身不构成验收。

## 开发与构建

`npm ci` 安装依赖。项目使用 Cocos Creator 3.8.8；`tools/build.mjs` 中的编辑器路径是本机 macOS 路径。保留未提交修改，不用 reset、clean 或整树覆盖。

```sh
npm run typecheck
npm run typecheck:core
npm run check:v09
npx tsc tools/v09-model-policy.ts --target ES2020 --module CommonJS --outDir .cache/v09-logic --skipLibCheck
# browser-v06-common reused by v09 expects the core build:
npx tsc -p tsconfig.core.json
node tools/v09-platform-check.mjs
node tools/v09-assets.mjs --inventory
YILU_EVIDENCE_DIR=evidence/v09 npm run build:web
YILU_EVIDENCE_DIR=evidence/v09 npm run build:wechat
YILU_EVIDENCE_DIR=evidence/v09 node tools/prepare-wechat-package.mjs
```

这些命令是已实现的工具入口，是否在最终源码运行通过请读 `VERIFICATION.json`。规则、页面矩阵和浏览器验证使用该文件记录的本轮明确命令，不能把旧 `test:browser`、`record:three` 等入口当作 v0.9 验收。

图集加载使用 `Array.from(new Set(...))`；本机 Cocos 构建曾将 `[...new Set(...)]` 编译成包含 Set 的单元素数组，导致 `includes is not a function`。该编译兼容修复需在实际构建浏览器回读，而不只依赖 TypeScript 模拟器测试。

构建资源优化只处理构建输出：保留源图、原尺寸、UV 与锚点，验证每个实际帧及外扩4像素内 RGBA 完全一致；剔除有引用盘点支持的不加载资源。新增资源加载方式需要更新盘点合同。

## 交付与边界

共享包中微信 `project.config.json` 的 AppID 留空，原本地预览身份保持不变；不包含二维码、登录资料。真实手机扫码由用户完成，预览生成不等于手机验收。

`python3 tools/package-v09.py` 创建独立待验证目录；完成真实独立安装/解包启动检查并写 `PACKAGE_VERIFICATION.json` 后，执行 `python3 tools/package-v09.py --archive`。脚本拒绝覆盖已有交付，ZIP 带逐文件 SHA256 清单。

音乐保持关闭；音效和震动独立。测试与截图不能证明审美、真实手机触控、听感或持续性能全部合格。原版未确认公式仍是明确的项目初值，不宣称已经完全还原。

## 本轮运行事实的复核顺序

1. `VERIFICATION.json` 与 `FINGERPRINT.json` 对应当前源码和两种构建。
2. `matrix/checks.json` 为隔离页面/密度状态，`before/` 与 `after/` 六组视口一致。
3. `delivery.json` 与 `final-three-levels.mp4` 才是最终自然流程；`CLIPS.json` 给出同一录像的36秒短片截取位置。
4. `failed-attempt-1.json`、`failed-attempt-2.json` 保留先前自然失败；`browser-kite-segment.json` 是明确恢复1人的故障重建，不能冒充通关。
5. `pacing-comparison.json` 为两组相同静态参数的模型比较，记录真实装备与50ms输入间隔。A/B都通过，B减少部分封顶后空瞄；不等于玩家胜率测试。

后续反馈请指定页面/关卡、视频时刻、当前兵力和预期变化，先查实际截图与账本，不因旧版原型测试或旧文案恢复已撤下的固定倍增选门、30/80升级和强制近战Boss。
