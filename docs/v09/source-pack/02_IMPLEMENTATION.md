# v0.9 工程接入合同

## 1. 版本与证据

参考的是用户上传的v0.8本地快照，不是较旧的GitHub主分支。完整包SHA256见04_EVIDENCE.md。本包只提供优化要求、状态数据与图片参考，不是可覆盖工程的成品源码。

允许为下列职责提取小模块；不要求建立新框架、不将所有业务重写成新的ECS、不换Cocos版本。下面标注“建议新增”的文件不存在于已读v0.8快照中，名称可按本地工程调整。

## 2. 模块分工与实际读取点

|领域|已存在的模块|本轮职责|
|---|---|---|
|页面和事件|assets/scripts/Game.ts|保留业务按钮语义，拆出纯视图构建与页面可见性，处理首次/重玩结果与过渡恢复|
|战场和展示|assets/scripts/BattleView.ts|拆开环境、战斗、营地和肖像；统一对象标签、门箱、弹道与受击反馈|
|安全区与逻辑UI|assets/scripts/ui/UiLayout.ts、Platform.ts|保留已读取的窗口/安全区/胶囊指标，加入共用内容矩形和页面重排|
|真实跑道规则|assets/scripts/core/runner.ts|members/muzzle、移动敌军、接触来源、击破/改门事件、必要的低成本分离|
|关卡初值|assets/scripts/core/runnerConfig.ts|把实际生效值集中，局部校准门/箱/波次，不让尾部循环静默覆盖配置|
|资源|ArtSprites.ts、ArtAtlas*.ts、WorldScenery.ts|资源复用、足点/持械锚点、场景回收、图集大小与按需加载|
|解锁与持久化|core/save.ts、growth.ts、campaign.ts、progression.ts|保持稳定ID/数据兼容，按本次差集输出奖励，不重建存档|
|构建|tools/build.mjs、tools/prepare-wechat-package.mjs|可复现剔除未使用资源，检查真实构建，保留私有预览身份|

建议新增少量明确职责：`ui/ScreenPresenter.ts`（可见性/状态），`ui/UiComponents.ts`（组件），`ui/UiViewModels.ts`（状态文字），`ui/WorldLabels.ts`（战场标签）；不要求必须四个文件，也不允许为满足目录而空写文件。

## 3. 页面生命周期：一个页面只能拥有它需要的场景

当前Game.show()对多种非战斗页面默认调用battle.render(null,...)，结果页另建promotionView；这是必须结构性消除的双重拥有关系。

实现等价的显式视图合同：
- home：homeBackdrop + homeHero；无campMap，无promotionHero。
- loadout：loadoutBackdrop + equipmentHero + selectedCompanion；无滚动battleWorld、无campMap。
- chapters：mapBackdrop + actualChapterNodes；无默认主将全身。
- battle：runnerWorld + combatActors + worldLabels + hud；无其他页面人物。
- result：resultBackdrop + oneResultHero + actualNewRewardActor(optional)；绝不叠加homeHero。
- transition/camp：campBackdrop + flagActors/map(按页面需要)；不继承战斗士兵阵型。
- meeting：meetingBackdrop + encounterPortrait(s)；背景军旗可保留，主队不默认出现。
- pause/settings：对当前基底加overlay并冻结；返回时恢复同一基底，不额外重建人物。
- error/loading：最低必要背景 + 提示 + 重试；没有点击穿透到下层战斗。

页内未完成动画需要暂停，切页要取消专属回调，触摸ID重置。复用节点可inactive并重设owner；不必每帧destroy/recreate。通关先写Book/Growth/Campaign，动画仅消费结果，不反过来发奖励。

内部增加轻量diagnostics：screen、sceneOwner、activeHeroDisplayIds、activeCompanionIds、overlay、uiMetricsRevision、内容矩形。诊断仅供本地/测试，不进入玩家页面，不暴露改HP/解锁入口。

## 4. 统一内容坐标，不让UI和“营地世界”各摆各的

UiLayout现有逻辑窗口→Cocos的转换继续作为唯一基础。页面先获得safeContentRect、topBarRect、bodyRect、bottomActionRect；非战斗角色展示和背景对象也接受bodyRect，不继续在旧固定世界坐标里居中。

- 背景可铺满窗口；文字/按钮在安全内容区；微信胶囊是独立排除区域。
- 重新布局处理窗口尺寸、前后台后的指标变更和设备方向变化。不要累加两次顶部safe inset。
- 设计单位、逻辑窗口像素和纹理像素不要混用。热区与可见按钮使用同一转换。
- 360×640短屏先缩装饰、收紧非关键间距、让选择内容滚动，最低按钮高度不变；不把文字缩到不可读。
- 系统临时通知与永久遮挡分开，不为一条系统通知在顶部预留数百像素。
- battleWorld投影不会因为顶栏变窄而自动改变规则坐标。如确实改变镜头/投影，所有members、muzzle、target、enemy、barrier、projectile、标签及debug一起使用新的共享变换。

## 5. 战斗阵型与接触：展示改动和模型约束同时做

### 5.1 稳定队员身份
runnerFormation当前把主将、队友和普通兵排在同一网格。新布局允许给特殊角色额外空间，但模型应持有稳定的成员/槽位映射。增减人数时，已发射的弹不得移动出发点，既有射击时钟不因重排被重新触发。

人数N仍最多256，显示min(N,48)，主将/队友包含其中。每个角色的火力权重总和等于真实人数预算；N=1不能出现队友或背后幽灵弓手。

如必要改变脚底位置，让members成为显示、muzzle、扫掠接触的共同源。不得把“主将更突出”实现成屏幕上移100px、模型仍在原位置。微摆仅可在明确的局部足点容差内，视觉范围不可超过实际风险表述。

### 5.2 接敌与避让
现有moveEnemies()会将普通敌人压到j.z+.09，靠近后朝最近成员x移动。新方案采用固定预算的局部接触槽位/分离：
- 每个活敌保持稳定ID；局部选择尚有空隙的接近方向，允许其真正走到某个成员附近。
- 左右位移受速度上限约束，先缓存前帧坐标，再计算本帧坐标，用扫掠判定避免穿模。
- 允许小幅同类排斥/错位，禁止直接teleport到新槽，禁止将所有近敌挤到同一深度和同一x。
- 活敌无法接触时继续以实际位置追击/等待，不能离屏计杀、停在不可达位置导致永不结束。
- 分离不能形成全队隐形护墙：至少用一段明确放任接近的受击测试，证明正常敌人依然能攻击。
- 通路的墙、障碍和分隔结构须保持实际规则；不为画面好看撤掉挡弹或穿墙。

### 5.3 接触损失反馈
保留目前的普通敌兵损失和保护机制作为起点，先纠正来源/画面。lose事件应带sourceEnemyId/sourceTargetId、受击成员/接触点、actualLoss、reason；世界提示与兵力badge从该事件更新。

无法精确选择单个被移除成员时，可先用合法一致的损失分配策略，但须在同一模型中决定被移除槽位，不能让屏幕退出的人与人数变化不符。

### 5.4 射击/命中
每名可见成员的真实发射点、权重、武器表现一致。火力提高不能只把现有线条加粗；装备用不同头部形状/间隔/尾迹表达现有参数。

同一弹的直接与爆炸命中不能对主目标重算；门/箱不受合同禁止的爆炸伤害。最近对象优先、挡弹和冻住的发射快照不回退。不得恢复“中心一道弹+装饰箭”来简化绘制。

## 6. 世界标签与HUD

由WorldLabels或等价组件分配槽位：队伍兵力一个；特殊敌人/敌将一个；每个箱子的奖励一层、耐久一层；门只有数值/必要上限标识。

- 重要数值在逻辑视口内可读。候选：队伍数24—28px、门值24—30px、箱耐久18—22px、短正文13—15px。依真实纹理和窗口校正。
- 文字跟对象共享足点，world排序用深度；标签独立上层，但不得穿进安全区或遮住更近的关键门值。
- 同屏交叠按固定优先级避让，横移上限不能让标签看似属于另一目标；必要时用短引线/合并同类通知，不移动真实对象。
- 普通杂兵不画长名字和血条。敌群数字如新增，必须来自稳定groupId的存活计数，不能把全关remaining放到一个局部敌群头上。
- 以对象事件而非每帧重复初始化驱动数字动画；逻辑数字即时更新，动画只是呈现。
- mutableGate的semanticFill依据value固定，hitFlash单独层处理；0/正/负含符号和形状提示，不只靠颜色。
- 接触领取前后颜色、数值和奖励原因都要一致；数值上限必须读取实际使用值。

## 7. 状态文案与存档

建议纯函数构建viewModel，输入Book/Campaign/Growth快照、本局result和newUnlocks：
- 无存档/无队友/已通关/待整军/重玩/三关完成都有明确动作。
- 只有newUnlocks包含陈应，才可写“陈应加入”；固定l.ending需要拆成firstWinEnding和repeatWinEnding或等价映射。
- 这次提升身份与“当前最高身份”分开。重玩第一关不能表演再次从无名小卒晋升，也不能降低最高外观。
- best使用当前runnerBest；旧best原样保留。不用改键清空来解决错误标题。
- BGM旧存档true不生效；音效/震动继续独立。
- 用户的武器/队友选择、claimedRewards、三关解锁、过渡completed/seen全部保留。

新增显示设置默认值向后兼容，不凭UI重做提高save schema并重置数据。真正需要迁移才显式迁移、备份原值并写测试。

## 8. 有限平衡校准

门上限不是经实录确认的原版公式。当前runnerConfig尾部会统一改写各关maxPositive；先将生效来源合并，确保配置、HUD和日志一致。

若出现“早期马上封顶，继续瞄准无收益”，优先比较两组（最多）静态初值：现状与调整后的damagePerPoint/maxPositive/目标出现距离。每个变更说明解决哪个体验，避免给所有门无限收益。

节奏采样要记录availableAimTime、firstHitAt、cappedAt、spentAimingAfterCap、durabilityAtPass、claimedReward、lossCause。只有真实接触/命中驱动统计。

若队伍骤增会使大部分敌群失去判断，调整奖励间距和耐久梯度；不能背地按玩家表现变HP。Boss时长只在这条整体链条调完后评估。

## 9. 资源和移动端：给全局升级留空间

v0.8本地预览回执为20,901,322字节，距其工程当时采用的20MiB阈值70,198字节。这是旧回执，不是本轮在线核验的微信长期额度。

先记录本地最新体积和限制，再做优化：
1. 列出运行实际加载图集、未使用图集、重复音频/角色、最大纹理及来源。不能仅用目录名猜“无用”。
2. 保留源图，在可复现构建步骤剔除/分离不加载的历史素材。需要重排图集时保留锚点和有效alpha，检查边缘污染。
3. 把本轮新UI做成小尺寸图标/可伸缩面板，非战斗背景优先复用组件，只有确有必要才新增完整画布。
4. 原则目标是发布/测试包至少留1MiB且约5%的余量；实际以当前平台限制为准。无法达到时明确资源清单与缺口，不把好看的素材换成低质量占位图糊弄。
5. 如使用分包/压缩等方案，由Codex读取本地现有配置和官方能力核实；不假定一种格式在微信和浏览器都可用。新账号、付费CDN和公网服务不在授权内。
6. 不在分享包中写入AppID、登录资料、预览二维码、用户通知信息。不要原样复制第三张截图顶上的私人通知。

依赖审计中的既有sharp相关high告警单独核验真实路径；有低风险兼容修复可隔离实施，否则如实保留待办，不升级整个工具链并重复漫长构建。不宣称依赖安全全通过。

## 10. 快速协作与测试入口

不要把现有npm test:browser、test:soak、record:three当作v0.9正确入口，v0.8 package.json仍保留若干旧v03/v031脚本。先确认实际活动分支和最近验证脚本。

可新增明确check:v09/preview:v09等命令，但必须先实现后执行，不在报告里编不存在的CLI。本批只需要相关规则、类型、页面状态、密度、一次自然三关和当前微信预览。重跑失败相关部分；除非变化使早先通过失效，不重复整套流程。
