# R3 修订实际结果与验收边界

本轮在现有正式工程连续修改，保留 dirty、二十关、存档、奖励、音频与已认可视觉方向。**任务仍未全绿**：战斗生命链、首页和优先动作已有真实运行证据；难度建议区间、全部动作和实体 iPhone 验收仍有明确缺口。没有提交、推送、合并、发布或访问摄像头。

最终0303已在真实Cocos场景正常时钟连续首通20/20，完成10次里程碑与全部奖励/页面跳转，0页面错误。完整原速录像43分41秒已经交付；自动走位不等于真人或真机。逐关时间见 `NATURAL20.md`。总任务仍未全绿，素材、节奏目标与设备缺口不因20/20通关转绿。

## 版本与证据对应

|版本|指纹|证据范围|
|---|---|---|
|旧0.12.3 / 2026100201|`cb6842dee7e9b609ae7d840dbaf3133c9fc9bd4678187537c042f47bf2bb4527`|实际旧首页、编组、随军和前方敌军对照；并非当前版本|
|中间0301|`9d4713a42b6631d2536115869d6e9527e4add66fee2b063b8c075f12323ca8c3`|完整8种人物详情专项、旧自然第16关；旧FP保留|
|中间0302|`774f3293256971ef30fefa4714f0ab66a4db8ea2ce23b669cf524aa0c35fb0d5`|8种详情、3尺寸首页、编组交互、固定随军姿态专项；原目录/archive不重标版本|
|最后有效0302|`ab953a241e4b9a48c958981e3dc995cff849f272a5c87cf3297ffd87fcef7461`|3尺寸菜单烟测、同状态优先截图、空场真实动作循环、角色与固定姿态矩阵、真实WebAudio；Release签名通过|
|最新0303候选|`cd613377a62aeddaff93ad9dbf39e72a272ab9305294bcf848694bde87beb0e1`|Web `r3-combat-6617407477f6`已导出，55 handlers/0 missing；`bridge-targeted-restored-check.json`通过。自然20/20已完成；3尺寸菜单/优先固定姿态烟测与自然第16关已完成，Release与codesign strict已通过。不能据此称真机验收通过|

每份媒体以自己的截图/运行JSON内嵌指纹为准。`media-index.json` 顶部为当前导出候选；其每项 `beforeBuild/afterBuild/build` 才是该媒体实际版本。媒体脚本已修正“旧录像盖最新manifest”问题，并拒绝缺失/混合内嵌指纹；旧文件保留。本轮最终报告将用 finalize 绑定精确字节与当前代码指纹；固定快照、媒体ID和协议读取结果见同目录 `MCP-RESULT.json` 与 `GPT核验说明.md`，不以旧快照代替本轮证据。

## 真实修复与对应位置

- **前方敌军与事件预算**：`battle.ts`、`EncounterDirector.ts` 为波次和头数分配身份，容量不足留队列/部分生成；撤下 `elite && z>40` 误清理。只有死亡动画结束、后方越界和终局进行合法销毁。`combat/baseline-runtime.json`记录旧版6种非轻兵在第一步消失、损耗0；旧详细trace早期被误覆盖，真实旧运行另见 `runtime/old-enemy-route.json`。
- **敌军真实威胁**：`EnemyProfiles.ts` 与正式战斗将近卫/盾兵改为实际脚点接敌→预警→释放→回收，不在远处扣兵，不靠自杀扣兵；弓箭从射手位置发出、锁定后不追踪；同攻击/子攻击只命中一次；射手死亡和Boss换阵不吞已发箭。骑兵实体冲线、旗手存活加成、机关地面范围均有独立链路。
- **损耗与恢复**：绝对防护允许实际伤害0，hurt/HUD仅在actual>0触发；Boss生命周期保留已释放危险，亲兵预算满时排队。`CombatFootprint.ts`按真实军阵脚点/夹持重新计算箭线、近战reach、机关深度和已承诺危险，保留300ms反应窗口与下一堵墙检查。可达性证明范围是保守候选中心；不是任意二维输入路径的形式证明。
- **首页与编组**：`FullMenu.ts`、`MenuLayout.ts` 和 `FormalGame.drawHomeArt`基于安全头栏/底部动作区分配人物空间，撤下品牌说明，大屏完整人物，小屏也完整头手兵器。编组用专用ready站姿，战术真实写入mainTactic；低数量奖励放大主要信息块，保留奖励事务。3尺寸实际运行截图及8组同状态板在 `menu/`，不是素材效果图。
- **人物详情验收**：8个U05-long由错误 `zhugeliang` 改为真实 `zhuge`，未知ID在验收模式明确失败，核对真实known/title/body；缓存包含脚本与夹具哈希。774的8组运行专项通过；ab953a另做3尺寸展示与真实交互烟测，没有冒称重跑全部8组。
- **动作与切片**：偃月刀专用ready/run/wind/rel/rec/show源与角色归一锚点已接入；吕布/马超固定收势图的邻格浮片清除。15独立图集238帧统一ceil边界、75处邻格串片、C表可变网格索引修正；21随军/20Boss明确合法角色语义与身份，不为展示而改收服规则。Cocos `Set` spread转译错误通过 `Array.from(new Set)` 修正。所有源与拒收原因见 `ACTION-ASSET-RESULT.md`、`inherited-assets-result.json`，源码扫描不等于全动作视觉通过。

上述路径在 `assets/scripts/formal/`，证据路径默认以 `evidence/R3-COMBAT-PATCH-20261002/` 为根。源码已由主代理集成，此账本不再改游戏数值/素材。

## 参数、难度与时间：没有隐藏未达目标

`combat/parameters-old-new.json`包含20关逐项旧/新值和依据。示例：首关波次4→3.5秒、6–8→8–12人、轻兵速度2.2→2.8；第3关后普通波加入弓手；17–20开场18秒从12人渐进密度；机关与轻兵间隔0.8→1.5秒；Boss回收亲兵3人/3.2秒→2人/6.4秒。基础敌军HP/伤害、己方DPS、军械burst、BossHP、章节长度、奖励和音频字节保持原值。防护公式由 `max(ceil(scaled*.5), round(scaled*reductionProduct-prevented))` 改为 `max(0, round(...))`，乘法减伤上限仍50%。

- 288场上限矩阵为6章×8种子×3策略×2合法配装；第1关两档均Lv1，所以**264个唯一输入**，不是288个独立配置。来源 `final-matrix288.json` / `matrix-summary.json`，这是安全包络最终修正前的模型记录，组合源码hash不是MCP指纹。站定0/96，追正收益40/96，正常96/96。**正常100%，未达到建议70–90%区间**，也不是真人胜率。
- 最后安全/生命周期调整后18场专项：正常6/6，站定0/6，追正收益4/6；c11/c16/c20有真实释放和损耗，见 `risk-footprint-final18.json` / `risk-footprint-comparison.json`。没有重跑288，不能将旧矩阵挂到最终源码。
- 20个独立合法参考的时间结果 `legacy-timing-current-reference.json` 为17/20符合原目标。第2关87.80秒（目标90–115）、第8关148.70秒（100–135）、第11关108.75秒（110–145），**三项时长偏离仍待调校**。全20关均胜/正常settle不等于全部计时目标通过。
- 前一模型fresh连续20为20/20、10里程碑、真实XP1472；第20关154.53秒，目标150–180。低成长长枪tier1第3关184.12秒也保留公开。模型、浏览器加速、浏览器原速和真人操作分别记账。
- `runtime/progression20.json`为774加速固定tick实际Cocos运行，文件存在不代表20关已闭环；本报告检查时只有10 rows。最新原速 `natural20-record.json` 已20/20完整终局、0页面错误、相同cd613指纹、真实10里程碑；完整原速2621.32秒。旧加速10行保留旧FP，不替代本次完整证据。

## 测试结果与三项旧失败影响

全库本次一次运行：`full-tests.tap` **393/396，3失败、0跳过**。后续按受影响部分回归，没有再次全库，不写“396全绿”。

|旧失败|原因与修正|实际回归/边界|
|---|---|---|
|固定合法配装全部符合Boss时间|旧固定长枪策略不读本轮可见危险，且假设Boss统一25–45秒；改真实此前装备/XP/风险策略，仍要求合法20胜、settle、分时和有限Boss窗口|最终严格保留章节计时目标断言；2/8/11三处偏离仍为红，不用日志代替断言|
|最后squad一定为elite|R3延后弓手/特殊兵改变事件顺序；精确定位marchSeconds-8守卫，核对人数和固定+1链前位置，扩20关|不删守卫、不缩测试范围|
|一tick立即盾甲block声音|尚未走预警/释放就要求block；改实际reach、释放、防护链，并核对subAttack、dundao归因/资源/voice预算|首次加强断言遗漏`:0`攻击后缀，按真实ID修正|

三文件定向 `updated-three-legacy-tests.tap` 首轮34/35；仅上述音效文件追加修正后 `updated-weapon-sfx-tests.tap` 17/17，覆盖首轮唯一失败。其余60项受影响回归 `affected-final-tests.tap` 和 `final-affected.tap`各60/60；17项脚点/危险回归与引擎/图集/音频转译回归见各TAP。最新0303另有`bridge-targeted-restored-check.json`：受影响6文件专项exit0，前后指纹同cd613、source_stable=true；它仍不是全库重跑回执。

最终 `bridge-timing-gate-check.json` / `authored-timing-gate.tap` 再次保留全部章节计时断言：12项中11通过、1项失败（第2/8/11关三处偏离，exit1，前后cd613稳定）。早期计时用例仅记录偏离，不能算节奏验收通过。

## 运行媒体与原生状态

- 三组交付同状态板已更新为旧cb→最终cd613：实际首页、偃月刀站姿、吕布/马超收势；8组774完整板另保留 `menu/boards`。原截图和JSON存在且保护字段相同。
- 空场`actors-record.json`为最终cd613、457次采样的42秒实际自动攻击循环原速，明确非自然交锋；赤兔375和的卢402另外完整验证吕布/马超各至少20次wind→rel→rec，记录见`runtime/mount-cycles-metrics.json`，仍不代表独立步态全部完成。`natural-record.json`是旧9d第16关，不重标最新。
- `seven-route-runtime.json`是实际单兵种替换route、仅停己方火力的诊断；最终cd613记录7/7 rows、pageErrors=[]；轻兵/近卫/盾兵/弓手/旗手/机关损耗为1/3/3/3/2/7。骑兵出现真实charge impact但该轨迹未命中、实际损耗0；这是允许的公平miss，不由此判机制全失败。模型已有骑兵命中/闪避对照，但不能声称本次录像七种均损耗。单兵种诊断不等于自然整关。
- `final-menu-smoke.json`已完成cd6133尺寸与实际375操作WebM，交付脚本已经原速转MP4。`natural-mounted-record.json`已完成cd613第16关原速：131.30秒胜、102兵、轻兵损耗4，生命周期590条、63名敌军共67次释放（弓手42/轻兵14/盾兵10/近卫1）；全部590名按预算生成，终局无待生成队列。其中5支已释放箭的事件链真实满足 release < 射手死亡 < 命中/闪避，见 `runtime/released-arrows-survive-source-death.json`；不是仅用模型断言代替。骑兵另有同路线站定损耗6／走位损耗0的实际命中闪避原速片。不是真机性能证明。Web录屏无音轨，不替代声音验收。
- `runtime/audio-runtime.json` + `cocos-game-audio.webm`及交付`media/game-output-audio.m4a`为最终cd613实际WebAudio输出图录制、无麦克风/摄像头；这是浏览器可听证据，真机听验仍待验。
- 历史0302签名候选保留在本机私有归档，不能引用已更新的0303回执证明0302。最新0303为0.12.4 / 2026100303，iOS Release exit0、codesign strict通过；`native/signing.json` / `bridge-build-manifest.json`均对应cd613。签名profile到期2026-10-05 05:12:40 UTC；无新设备安装/启动收据。
- 实体早期`devicectl`预检15秒超时；最终只读list预检成功，配对iPhone booted，但localNetwork tunnel disconnected，见`native/physical-final-preflight.json`；没有覆盖安装。上次核验的手机0.12.3/2026100201仅作历史记录，不能当作此次设备回读。触控、安全区肉眼、后台恢复、热量、耗电、FPS/峰值内存和真机听验都待验。

## 76继承动作逐项缺口

**33当前合法映射候选 + 10已制作但当前不可收服 + 33明确拒收 = 76，不是43完成。**

10个不可收服passing涉及鲁肃、黄月英、曹仁、钟会、陆抗；不修改人物关系强行部署。33拒收中24惊帆/绝影骑乘帧有视角、4×5排版、坐骑身份、蹄裁切及双手握持问题；1的卢弓run1有残余弦/缰；6主将连弩/双刃/弓passing缺真实腿交替和稳定手部；2甘宁passing修图误去唯一正确刀。甘宁rec/ready正确刀仍缺，明确受控fallback而非冒称完成。

14随军run仍用run0回退；后10Boss hurt/defeated/yield仍回退本角色run；机关弩骑乘沿用旧表现。吕布、马超及既有随军第二真实步态与passing、骑弓独立弦分层、非优先兵器完整hurt/defeat仍缺；不是“等用户审美”。2560解析映射/固定姿态运行证明资源可解析，不证明全部原速动作自然。优先实际截图/连续动作中能确认的改进与整套未完成项分别记账。

## 最终验收账本与未完成项

`acceptance.json`逐项记录：最终cd613原速20/20、七军、骑兵命中/闪避、两坐骑优先随军至少20完整攻击循环、密集门箱、3尺寸菜单与iOS Release/签名均有各自真实证据。全角色独立步态/专用语义帧、参考配装计时2/8/11、正常策略胜率建议区间和实体安装/触控/后台/热量/性能仍未达或待验。33拒收资产等缺口已逐项列明，没有笼统归为用户审美。

只读MCP默认入口已改为优先读取当前代码版本的精确字节finalize报告，防止仍指向旧UI。实际18项桥接回归通过；官方Python SDK stdio协议八工具复检通过，另实际调用read_media读取本轮首页、第16关运行图和3张原速录像帧，5个像素块逐个解码/SHA验证且code_fingerprint=cd613，见 `mcp-doctor.json`、`mcp-current-pixels-check.json`。本地读取、官方隧道连接、ChatGPT真正调用工具读图须分别验收；隧道动态状态见 MCP-RESULT.json，本次ChatGPT端实际读取尚未执行。
## 资源导出故障与存量保护

最终导出前 Cocos 出现运行时 importer 注册缺失，自动把316份 metadata 退化为通用 `*`；场景完整性检查拒绝该坏构建。已保留日志与坏 metadata，从不可变 MCP 快照逐文件核对 UUID 及 lastgood 原生源 hash 后恢复精确字节，未回滚其他 dirty 源码或 PNG。正式编辑器单独启动恢复55 handlers后，Web及iOS两次导出均55注册、0missing，源码指纹稳定cd613；具体初始化故障触发原因未证实。详见 `evidence/R3-COMBAT-PATCH-20261002/importer-recovery.json`，不将错误导出当可玩交付。

## 存档与已有成果保护

本轮未卸载、清理、复制覆盖实体手机的App或Documents；保留当前存档键、奖励事务和全部既有dirty。79份原音频的逐文件SHA与己方空场攻击/多段事件均核对不变，见 `friendly-invariants.json`。本轮浏览器验证使用隔离测试会话，不触碰用户浏览器存档。由于没有进行实体覆盖安装，不将历史备份或旧存档一致回执冒称本轮新安装验收。分支与HEAD保持原值，无提交、合并、推送或发布。
