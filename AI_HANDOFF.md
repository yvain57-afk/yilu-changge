# AI_HANDOFF｜一路长歌当前交接入口

> 由 Claude 在用户项目中实际工作后填写。本文件不是系统锁，也不证明 Codex 已经读取。凡写「未验证」的，均无实际证据。

## 0. Codex 本轮当前状态（2026-09-27）

- 当前分支 `codex/formal-cocos-20260927`，原 main/HEAD 7ee7685 与其他工作树未改；本轮 GitHub 审查入口见 `docs/FORMAL-20260927/GITHUB_REVIEW.md`。本段其余状态记录的是正式版本地交付时的快照。
- 真实Cocos十关集成版入口：http://127.0.0.1:43207/ ，核验页：http://127.0.0.1:43207/evidence/FORMAL-20260927/ 。服务为本地临时进程；失效可用 `PLAY_FORMAL.command` 重新启动。
- 本轮入口文档：`docs/FORMAL-20260927/README.md`；源码/资源清单：`evidence/FORMAL-20260927/BUILD_ID.json`；录像版本单列 `RECORDING_BUILD_ID.json`。
- 本轮25项定向规则通过，实际自然十关全部胜利、同档重载通过；原库5项旧失败仍在；视觉细化、部分UI详情/动效及微信真机待验。详见 `ACCEPTANCE.md`。
- 原Claude交接账本和认可基线保留为历史基准；以下原交接条目描述Claude停止时状态，不代表当前功能仍未接入。
- CODEX_READY_FOR_REVIEW 是待审阅状态，不代表用户美术验收或手机验收通过。

## 1. 当前持有者与原Claude交接状态

- active_editor：Codex（Claude 已停止写入）
- status：CODEX_READY_FOR_REVIEW
- 更新时刻与时区：2026-09-27 02:54 +08:00
- 最后写入任务/进程是否结束：已结束。
  - 本任务的预览服务 PID 94312（端口 8777）已终止；
  - 无本任务的 node / python / ffmpeg / Playwright 进程残留；
  - 最后一次写入是项目根的 `handoff-manifest.json`。
- 下一负责人：Codex

## 2. 工作区身份

- pwd -P：`/Users/yvainair/Code/游戏-左右滑古代史`
- git root：`/Users/yvainair/Code/游戏-左右滑古代史`
- Claude交接时 branch：`main`（当前分支见§0）
- HEAD：`7ee7685`（Complete v0.5.1 combat contact, growth feedback and WeChat preview delivery）
- worktree：
  - 本任务未创建 worktree、未切分支、未提交。
  - `git worktree list` 另有 `/Users/yvainair/Code/Codex/2026-09-26/yilu-fix2-github-audit`（分支 `codex/yilu-fix2-github-audit`），不是本任务创建的，没有动过。
- 未提交 / 未跟踪成果清单（本任务写入，全部 untracked，未提交）：
  - `docs/BATTLE-PREVIEW-20260926/`：战斗预览、规则、规格、交付媒体、检查脚本；
  - `art-source/battle-preview-20260926/`：第一批生成原图、提示词、切片脚本 `slice.py`；
  - `art-source/battle-actions-20260927/`：动作补表原图与提示词；
  - 项目根 `AI_HANDOFF.md`、`AGENTS.md`、`CLAUDE.md`、`handoff-manifest.json`。
  - 更早一轮 Claude 写入的 `docs/UI-REDESIGN-20260926/`（UI 重构方案、tokens、线框）也是 untracked。本轮未修改，只作为 §0.2/§0.3 的来源。
- 本轮之前已有、不能覆盖的工作：`git status` 里其余全部 M / ??，例如：
  - `assets/scripts/**`（含 `core/runner*.ts`、`ui/`、`BattleAtlas.ts` 等）；
  - `tests/*`、`tools/*`；
  - `docs/v06–v09`、`evidence/*`、`assets/resources/battle20260925|battlefix2|ui20260925`；
  - `package*.json`、README / PROGRESS / BLOCKED。
  - 这些都不是本任务改的，**Claude 本轮没有修改任何 Cocos 源码、测试或构建脚本**。
- manifest 实际路径：`/Users/yvainair/Code/游戏-左右滑古代史/handoff-manifest.json`（相对路径、字节数、SHA-256）

HEAD 相同不能代替未提交成果的校验，请用 manifest 核对。

## 3. 用户批准与需求优先级

用户认可了最新战斗测试视频的总体观感，要求保留视觉方向、战场构图、四兵器表现和敌将交锋，不再重新设计。用户已采纳 Claude 提出的人物关系、随军人数、三类宝物槽、十关顺序、掉落、兵器升阶和共鸣对象。

- **被认可的基准媒体**：`docs/BATTLE-PREVIEW-20260926/baseline-20260927-approved/`，含上一版 `battle-preview.mp4`、四张 @2x 截图、`preview.js`、`index.html`、`manifest-gen.js`，附 `SHA256SUMS`。只作对照，不要修改。
- **本轮新增内容的状态**：待用户审阅。本轮补的是动作、各类反馈、收服演出和规则整理，用户还没看过新视频。
- **统一玩法表**：`docs/BATTLE-PREVIEW-20260926/统一玩法规则-20260927.md`，唯一有效版本。
- **战斗规格**：`docs/BATTLE-PREVIEW-20260926/战斗规格.md` v3，与最终 `preview.js` 和媒体一致。
- **被替代的旧 C10**：见统一玩法规则 §9，共 9 条：
  1. 随军 1 人 → 2 随军 + 1 支援；
  2. 2 通用宝物槽 → 典籍 / 器物 / 坐骑 3 类槽；
  3. 开局选兵器 → 固定长枪；
  4. 3 关 → 10 关；
  5. 邢道荣 / 陈应 / 杨龄 → L9 客串；
  6. 旧解锁 → §7 表；
  7. 独立兵法区块 → 并入主将卡；
  8. runner 单阶梯 → 兵器阶位 + 部曲武装两条线；
  9. UI 方案 §3.1 / §3.2 → 战斗规格 v3。

  C10 原文不在项目和交接包内，所以只按规则内容整理，**没有条款号**。Codex 如有原文，请把条款号补进 §9。
- **新方案内部仍待统一的字段**（统一玩法规则中标【补全·待确认】的项）：
  - 盟约共鸣只加伤、没有专属技；
  - 本局获得的宝物胜利入库、失败丢弃；
  - 重玩掉落范围；
  - 张角 / 董卓不可获得；
  - 30 人中 14 人的落点；
  - 所有数值都是【调试初值】，以后以数值表为准。

以上是产品需求优先级，不覆盖环境、权限、安全和数据保护要求。

## 4. 阅读顺序（均为已核实存在的文件）

1. 项目 `AGENTS.md` → 本文件。
2. `docs/BATTLE-PREVIEW-20260926/统一玩法规则-20260927.md` → `docs/BATTLE-PREVIEW-20260926/战斗规格.md`
3. `docs/BATTLE-PREVIEW-20260926/baseline-20260927-approved/`（已认可）→ `docs/BATTLE-PREVIEW-20260926/deliver/`（本轮最新）
4. `docs/BATTLE-PREVIEW-20260926/preview.js`、`index.html`、`assets/manifest.js`、`assets/gen/manifest-gen.js`、`art-source/battle-preview-20260926/slice.py`
5. `docs/BATTLE-PREVIEW-20260926/handoff/cocos-audit-20260927.md`（Cocos 现状只读审计）→ 本文件 §5、§8。

## 5. 成果状态表

验证层级说明：
- 「已实现待验」= 只在浏览器 Canvas 预览中实现，经 Playwright 逐帧脚本检查，无用户新一轮审阅、无真机；
- Cocos 列均依据只读审计，未运行 Cocos。

| 功能或资源 | 预览中状态 | Cocos中状态 | 证据/文件 | 待做事项与负责人 |
|---|---|---|---|---|
| 四兵器动作与光波 | 已实现待验：4 帧跑步 + 蓄 / 出 / 收 + 亮兵帧；1–3 阶形态不同 | 未实现（只有 spear / blade，线上为单发 `Shot`） | `preview.js` WEAPONS / 兵器波；`deliver/weapons-4x4.jpg`；视频 0–16 s | Codex：移植兵器状态机与波；刀光贴图仍是旧 `f2_*`（美术） |
| 人物跑动、士兵出手、敌军退出 | 已实现待验：弓手行走 / 拉弓 / 放箭，随军 2 帧跑 + 蓄 + 刺，敌兵受击 / 倒地，亲兵收服后转身淡出 | 未实现（线上用旧帧） | `art-source/battle-actions-20260927/`；`deliver/feedback-*.jpg` | Codex：接入新切片与帧时序 |
| 门与箱排版、领取和反馈 | 已实现待验：停靠、飞入 / 淡出、「名·内容」标签、开箱帧 | 部分完成（有 `mutableGate` 与 `rewardCrate`；没有粮车 / 军械箱 / 宝匣、停靠和飞入） | 规格 §4.4–4.5；`verification.json` | Codex |
| 兵器取得、升阶、军械齐射 | 已实现待验：换兵器保留阶位、升阶菱形闪金、满阶溢出 +4；弓 → 火箭 → 连弩改变真实齐射 | 未实现（仍是 runner standard / repeater / explosive 单阶梯） | 冒烟日志（`verification.json` smoke normal/auto） | Codex：按规则 §3–4 重建两条线 |
| 两随军、支援、共鸣 | 已实现待验：赵云 / 张飞出手、共鸣环与共鸣技、×1.5；华佗救回 30%、冷却环；on / pact / off 判定 | 未实现（1 随军位；没有支援和共鸣） | `preview.js` COMP / SUPPORT / `resonance()` | Codex：编队与存档字段 |
| 三类型宝物与实际作用 | 部分完成：太平要术、传国玉玺、赤兔马已实现待验（试用 / 已佩戴 / 已用 / 入库）；其余 5 件只是提案，未实现 | 未实现 | 规则 §6.2；视频行军段 | Codex：数据表 + 效果；5 件宝物效果待设计确认 |
| 固定墙段与通行 | 已实现待验：挡人马、不挡刀气和箭，夹半路 | 部分完成（仅 L2 `l2.divider`，会挡弹，与新规则不同） | 规格 §4.6；视频 16–22 s | Codex |
| 敌将招式与败北演出 | 已实现待验：预警 / 出招 / 收势破绽 ×2 / 受击帧 / 断旗 / 亲兵 / 力竭 / 白旗 / 降印 / 收服牌 | 未实现（线上只有 L3 杨龄，无收势、无收降） | `deliver/feedback-boss.jpg`；视频 54.5–75.83 s；smoke general 两路均走到 yield | Codex；将台是程序绘制（美术） |
| 十关、地图与角色获得 | 部分完成：只有规则文档（§7–8）；预览只做第三关一段 | 未实现（3 关） | 统一玩法规则 §7–8 | Codex：关卡数据、地图；待确认项需用户定 |
| 正式存档与首奖事务 | 不适用（预览无存档，`DEMO_LINEUP` 为夹具） | 部分完成（`claimedRewards` 幂等首奖已有；没有宝物槽、随军 2、兵器等级字段） | cocos-audit | Codex：存档迁移 |

## 6. 文件与资产账本

路径都相对于项目根。完整逐文件的字节数和 SHA-256 见 `handoff-manifest.json`。

| 相对路径 | 新建/修改/复用 | 用途 | 可直接接入/需转换 | 注意事项 |
|---|---|---|---|---|
| `docs/BATTLE-PREVIEW-20260926/preview.js` | 新建（本轮大改） | 预览全部逻辑：常量、世界、兵器、箱门、墙、敌将、HUD、自检；`window.__preview` 调试 API | 需转换：逻辑可按模块移植为 TS | 包含只供演示的部分，见 §8 |
| `docs/BATTLE-PREVIEW-20260926/index.html` | 新建 | 预览外壳与调试面板 | 不接入 | — |
| `docs/BATTLE-PREVIEW-20260926/统一玩法规则-20260927.md` | 新建 | 唯一有效玩法规则，含 C10 替代表 | 作为需求 | 【补全·待确认】项需用户定 |
| `docs/BATTLE-PREVIEW-20260926/战斗规格.md` | 修改为 v3 | 战斗界面规格 | 作为需求 | 以代码为准 |
| `docs/BATTLE-PREVIEW-20260926/assets/gen/*.png` + `manifest-gen.js` | 新建（`slice.py` 输出） | 13 张切片图集；每帧记录 `r=[x,y,w,h]`、锚点 `a=[ax,ay]`（脚底中心 ay=0 / 图标居中 .5,.5）、躯干参考高 `bh` | 需转换：导入 Cocos SpriteFrame，锚点按 `a` 设置，体量按 `bh` 归一 | 帧名见 manifest；各帧顺序见 `slice.py` SHEETS |
| `docs/BATTLE-PREVIEW-20260926/assets/base/*` + `assets/manifest.js` | 复用（从 `assets/resources/battle20260925`、`battlefix2` 复制） | 旧图集，预览自包含 | Cocos 中原件已存在 | 不是新素材 |
| `docs/BATTLE-PREVIEW-20260926/deliver/*` | 新建（02:38–02:44 生成） | 最终截图、看板、视频、`verification.json`、`battle-preview.json` | 媒体 | 晚于最终代码（02:33） |
| `docs/BATTLE-PREVIEW-20260926/tools/*` | 新建 | `serve.mjs` / `sweep.mjs` / `smoke.mjs` / `shots.mjs` / `video.mjs` / `common.mjs` / `boards.py` / `videosheet.py` / `contact.py` | 检查工具 | 需要 Playwright 与本机 Chrome、ffmpeg、Python PIL + numpy |
| `docs/BATTLE-PREVIEW-20260926/handoff/cocos-audit-20260927.md` | 新建 | Cocos 现状只读审计 | 参考 | — |
| `docs/BATTLE-PREVIEW-20260926/baseline-20260927-approved/` | 新建（冻结） | 用户认可的上一版基线 | 对照 | 不修改 |
| `art-source/battle-preview-20260926/*.png` | 新建 | 原图：hero-weapons、enemy-lubu、gate-parts2、wall-parts、crates2、weapon-icons | 源素材 | `*-v1-badalpha.png` 是透明通道损坏的首版，只留作记录 |
| `art-source/battle-preview-20260926/slice.py` | 新建 | 抠像 → 连通域 / 手工切线 → 命名 → 装箱 → 写 manifest-gen.js；含 heal（修补 `g_lubuStrike` 后腿）、dethin | 工具 | 用法：`cd art-source/battle-preview-20260926 && python3 slice.py [表名]`；源图目录配置在 SHEETS |
| `art-source/battle-actions-20260927/*.png` | 新建 | 原图：hero-run、hero-spear、companions、troops、lubu2、props2、treasure-icons | 源素材 | — |
| `art-source/*/prompts/`、`logs-*.txt` | 新建 | 生成提示词与生成日志 | 记录 | 由本机 Codex CLI 生图工具生成（日志内有工具说明，不含密钥值）；没有外购素材或字体 |
| `AI_HANDOFF.md`、`AGENTS.md`、`CLAUDE.md`、`handoff-manifest.json` | 新建 | 交接 | — | — |

不在项目内、也不被依赖的：`/Users/yvainair/Code/Claude/2026-09-27/battle-preview/`（Claude 草稿区，存放早期中间图、已被取代的旧视频和一次性脚本）。它不是必要资源，可随时删除。

## 7. 实际复现与验证

- **预览启动**：
  - 在 `docs/BATTLE-PREVIEW-20260926/` 下运行 `node tools/serve.mjs 8777`（只监听 127.0.0.1），然后访问 `http://localhost:8777/index.html`；
  - 服务本身不需要依赖；检查脚本需要 Playwright + 本机 Chrome；视频需要 ffmpeg；切片和看板需要 Python PIL + numpy。
- **正式 Cocos 构建与启动**：本轮未运行。项目命令：
  - `npm test`：`tsx --test tests/*.test.ts`；
  - `npm run build:web` / `build:wechat`：`tools/build.mjs`，调用 CocosCreator 3.8.8；微信构建需要真实 appid。
- **已执行检查**（`deliver/verification.json`，02:44 +08:00，浏览器 Canvas 层，`advance(1/30)` 逐帧推进）：
  - `sweep`：5 尺寸（360×640、390×844、430×932、360×780、375×667）× 3 状态 × 4 兵器 × 250 帧 = 15000 帧，0 违例；
  - `smoke`：正常自动 36 → 86；密集 36 → 89；敌将躲开 3/3、中招 3/3，均走到收服；0 页面错误；
  - `shots`：48 张，0 违例；
  - 受击帧：躲开 70 帧、中招 81 帧。
- **操作方式的区分**：
  - 视频兵器段用脚本 `setX` 模拟拖动；
  - 墙段为手动；
  - 密集 / 行军 / 敌将段用预览专用 `autopilot`（自动躲开 / 自动中招）；
  - 阵容是夹具 `DEMO_LINEUP`；
  - 没有真人触控录制。
- **最终视频与最后代码是否一致**：一致。
  - `preview.js` 最后修改 02:33:53，`slice.py` 最后修改 02:37；
  - 视频 02:42 生成，截图、看板 02:38 生成，验证 02:44 生成；
  - 此后只写了文档。
- **手机触控、音效、切后台、发热**：未验证。Cocos 渲染一致性未验证。最终视觉验收未进行，不能宣称通过。

## 8. Codex接续要求

- **可复用模块**（逻辑可移植，数值为调试初值）：
  - 分区与安全区公式；
  - 门停靠 / 飞入；
  - 箱表与开箱结果；
  - 兵器阶位与 4 种波形；
  - 部曲武装与齐射；
  - `resonance()`；
  - 支援冷却；
  - 3 类宝物槽状态机（empty / worn / trial / used + runGot / storage）；
  - 墙通行；
  - 敌将阶段机（idle → warn → strike → rec → spent → yield）；
  - 提示条优先级队列；
  - 每帧版面自检 `__layoutReport`，可改写成 Cocos 测试。
- **只用于演示**，不得当作正式数据：
  - `DEMO_LINEUP`（跨进度夹具）；
  - `autopilot`；
  - 面板按钮（切兵器 / 阶位、敌将残血 `bossLow`、跳墙段、重开）；
  - `window.__preview.bare()` / `setX` / `advance`；
  - 关名「第三关 · 下邳」与进度 .18；
  - 路线事件表；
  - 兵力归零 3 秒后自动重开。
- **Cocos 适配**：
  - 1 pt = 2 px（设计宽 720）；
  - 世界 z / x 投影公式见规格 §1；
  - 切片锚点和 `bh` 见 manifest-gen.js；
  - 时序常量见规格 §4–5；
  - 旧图集在 Cocos 已有（`assets/resources/battle20260925`、`battlefix2`）；
  - 新切片需导入 `assets/resources/` 并生成 meta。
- **正式玩法和存档待接线**：
  - 移除开局选兵器（`RunLoadout.weapon`）；
  - 随军 1 → 2 + 支援；
  - 宝物 3 槽与本局获得入库；
  - 兵器长期等级；
  - 十关数据与首奖（沿用 `claimedRewards`）；
  - 存档迁移（主档无 version，需加迁移）；
  - runner 阶梯替换为两条线。
  - 现有代码细节见 `handoff/cocos-audit-20260927.md`。
- **必须保留的已认可设计**：
  - 信息分区、HUD 两行、字号阶；
  - 数字在特效之上；
  - 门箱造型与「名·内容」标签；
  - 敌将战位（将台路中）与预警竖幅；
  - 四兵器的节奏差异（快窄远 / 蓄长宽近 / 双刺蛇行 / 直刺 + 侧扇）；
  - 收服演出。
- **未完成 / 阻塞，以及最小下一步**：
  1. 美术：门数字 BMFont、吕布将台、四兵器专属刀光、蛇矛拖尾贴图、骑乘帧、攻击补间帧（规格 §10）。
  2. 规则待用户确认的【补全·待确认】项。
  3. C10 原文条款号。
  4. **最小下一步**：先在 Cocos 中接「兵器匣 → 换兵器 / 升阶 / 溢出」和「军械箱 → 部曲武装」两条线，用预览冒烟日志的事件序列做对照测试；再接宝物槽与存档字段。
- **事故披露**：Claude 在本任务早先清理临时文件时执行过 `rm -rf /var/folders/*/*/T/tmp*`，范围超出了本任务自己的文件，可能删掉了其他程序在系统临时目录中的 `tmp*` 文件。此操作不可恢复。之后的清理都只按明确路径删除。若其他程序出现临时文件丢失的异常，可能与此有关。

## 9. 交接回读

**Claude**：
- 冻结版本：`preview.js`（02:33:53）、`slice.py`（02:37）、媒体（02:38–02:44）、本文件与规格（02:47–02:54）；
- 文件清单与哈希：`handoff-manifest.json`；
- 停止写入状态：本任务所有写入和后台进程已停止，8777 服务已终止；
- 未提交，未改 Cocos 源码。

**Codex**：2026-09-27 接管本文件所记真实工作区；121 项源交接文件大小与 SHA-256 全部匹配。独立分支 `codex/formal-cocos-20260927` 保留全部原有未提交工作，源码备份见 `evidence/FORMAL-20260927/intake/before-source.zip`。以统一规则及预览 v3 接入 Cocos 原生渲染和正式存档；旧预览证据不计为 Cocos 通过。

不得虚构另一代理的确认，不以本表代替用户审美验收。
