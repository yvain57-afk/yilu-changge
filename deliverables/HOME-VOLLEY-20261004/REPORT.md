# HOME-VOLLEY-20261004 实际交付

版本 **0.12.7 / 2026100402**。代码指纹 `484b2e9a758919236df6d9e15b7e90831232bd12221dfc955ed8822614dd74a9`。分支继续 `codex/ios-polish-round2-20260929`，HEAD `79fbea0`；所有既有 dirty 保留，未提交或推送。

## 可玩入口

- 当前 Mac Web 游戏：http://127.0.0.1:43220/ （原 43219 仍是上一版）。登录启动项 `com.yvainair.yilu.home-volley-preview` 已运行。
- 画面与录像核验：http://127.0.0.1:43220/review/
- Web 构建：`build/home-volley-web/`。
- Cocos iOS Debug 模拟器构建：`build/ios-home-volley/proj/Debug-iphonesimulator/CocosGame.app`。已安装到本任务独立 iPhone SE 3 模拟器 `F9504D9B-8094-40EC-949F-925A31F707A8`，没有操作真实 iPhone 或原模拟器存档。

## 实际变化

首页：复用已认可的山水与人物资产，移除顶部与底部两块硬面板；主角扩大，标题叠在山水上，信息和操作区按屏幕安全区定位，底部自然渐暗；修掉原生渐变的粗条带。兵器、永久等级、关卡地名、下一里程碑、奖励恢复入口仍绑定真实存档。新档与二十关完成状态均实际原生渲染。

箭雨：旧逻辑在 40 人后最多 8 组箭，人数增加只加伤害。保留这套真实伤害组，在每组下挂可见箭束；10/30/80/160/300 人分别显示 8/24/42/62/96 支，每轮最高 96 支，避免无界渲染。箭从真实兵阵各排位置发出，按排错开释放，拉弓与出箭对应；火箭保留火尾，连弩保留三轮连射，80 人连弩实测最高同时 126 支。可见箭不是额外伤害或额外音效，命中仍由原组结算。

## 本轮验证及证据边界

- 类型检查通过；37 项相关测试通过。首页覆盖 0—20 关进度、320×568 / 375×667 / 402×874 与奖励状态，实际菜单回调走整备、地图、图鉴。9 组相同 seed、相同输入的 600 tick 前后对比：伤害账本、兵力、统计和音效事件一致。
- Web 导出成功；原生 iOS simulator Debug 构建成功。没有设备签名构建或手机安装。
- 真正运行 Cocos 原生场景，8 组截图/JSON、6 段约 8 秒原速录像（模拟器录屏无音轨，不作为可听证据）；共 242 个诊断采样，无 renderErrors / invalidRects / missingArt。所有采样的嵌入式指纹与本次构建一致。PNG 与诊断相邻采样，不声称像素逐帧锁步。
- 10 / 80 / 300 人同兵器对比使用隔离内存存档、清空敌人与奖励的射击场景，保持人数固定；这是表现对比，不能当作自然通关。另有第 11 关真实路线自动运行片段 `UI-regression.mp4`，保留敌阵、门箱与原规则，没有人工操作，不是通关证据。
- 旧首页 `home-before-user.png` 是用户提交的旧版本截图，视口不同，未绑定当前指纹；不是同状态 A/B。`UI-new.png` 是当前原生新档运行截图。
- 对已有 320 个脚本与音效文件做前后哈希核对，仅本任务 5 个既有脚本变化（含生成的 BridgeBuild）；新增 VolleyPresentation 模块。全部音效资源哈希不变，存档与关卡数据未改。

## 性能与未完成项

独立 SE 模拟器、开启诊断和录屏：10 人最后读数 59.1 FPS，80 人 48.6，300 人 36.1；对应 P95 帧间隔 17.5 / 33.4 / 40.3 ms。实际第 11 关片段最后读数约 20.3 FPS，P95 50.2 ms；这是真实未达标，不宣称稳定 60 FPS，也不外推为真机性能。未做此次新旧完整场景性能基准，不能归因全部为箭雨。

Mac 锁屏导致 Device Hub 交互被拒，未完成原生人工点击验收；已完成菜单回调测试与原生截图/录像，不将其写作人工点击通过。浏览器自动化受策略限制，本轮未重新执行浏览器点击试玩；HTTP 可达只证明服务在线。真实 iPhone 的触控、帧率、发热和最新界面仍待验。本轮主角继续使用已有首页立绘，没有新增首页人物动作。

## 复现与维护

`npm run typecheck`

`node tools/run-local.mjs ./node_modules/.bin/tsx --test tests/home-volley.test.ts tests/r3-menu.test.ts`

`python3 tools/home-volley-20261004/build-web.py`

`python3 tools/build-ios.py --output-name ios-home-volley --evidence-dir evidence/HOME-VOLLEY-20261004/native --version 0.12.7 --build-number 2026100402`

`python3 tools/home-volley-20261004/capture.py`（仅该隔离模拟器）

详细检查：`evidence/HOME-VOLLEY-20261004/acceptance.json`、`preservation.json`；原始诊断与录像在 `final-native/`，本目录媒体为其原样复制。
