# FIX2 真实路径盘点

基线：当前工作树 `0.9.2-battle20260925.1` / `battle-rework-20260925-fix1`。源码和可运行Web原样备份在 `.cache/BATTLE-FIX2-20260925-baseline`；保留全部旧修改，未reset/stash/clean。附件为规格和旧证据，不含新运行素材。

- 真实入口：`tools/serve.mjs` 的 `/play/` → `docs/UI-20260925/play.html` → Cocos Web构建；`assets/scripts/Game.ts` 的 `begin` 创建 `Journey(LEVELS[index], loadout)`，三关均使用 runnerVideoV2。
- 主将真实可选：`core/weapons.ts` 的 PlayerWeapon仅 spear、blade。同袍：邢道荣great_axe、陈应throwing_fork、赵云spear；普通兵是弓弩身份。配置中其他WeaponId不是新增玩家选择。杨龄是敌将，spear。
- 真实发射：`core/runner.ts` 的 `fire()`、`muzzle()`；原 origin冻结 owner/role/位置/方向/stage/damage/tick，缺真实兵器身份。FIX2将补充冻结身份及只读正式发射记录，表现从记录读取，不由动画生成伤害。
- 原动作：`BattleView.runnerBattle`按shotAge短暂选择单张Attack；高阶段又给包括持刀/枪武将在内的所有成员叠弩配件。FIX2移除武将弩配件，普通兵保留，武将独立起势/出手/收势与兵器波。
- 门箱真实字段：`Target.value/hp/maxHp/progress/reward`。现有 `texturedGate/texturedCrate`与`ui/WorldLabels`是实际排版入口。FIX1连续门侧签与长线不符合本轮认可要求，将撤回本体低旗签；箱上下两块牌改为一个局部两层信息组。
- 顶部丑装饰来源已确认：`texturedGround()`给第一关在固定farY左右绘rocks/tower，第二关绘granary/tower；farY只有很小正弦漂动，与下方滚动道路叠在一起。FIX2删除两组运行生成，保留山雾与第三关低对比终点背景剪影。路侧`battleScenery()`用稳定worldZ投影且在整个视口后回收，属于另一条路径。
- 隔离墙真实模型：`RunnerDirector.barriers`由divider from/toProgress、aheadMin/aheadMax推得玩家前方动态挡弹段；非固定世界长墙，非玩家碰撞。美术必须每帧使用实际left/right/back/front，保留下方开口，不新增封闭车道。
- 封顶入口：`hitTarget()`的maxPositive回退64、清余数逻辑；关卡配置存在4/8/12，另有`add()`逻辑人数256和48个加权显示代理。`core/save.ts` runnerBest也有256读写截断，需要与新的逻辑人数上界兼容；legacy best与key/schema保持。
- 素材能力：内置imagegen可用，独立新动作、波形和木墙本轮制作；旧源图保留。旧参考PNG不会直接当新运行贴图。制作源、锚点、运行尺寸、使用映射与失败迭代独立记录。
- 音乐维持关闭。菜单绘制和存档结构保持；必要的加载新战斗资源及runnerBest合法范围兼容会明确列入差异。

纯视觉对照回放旧配置显式capped，比较物理字段；window新规则的后续人数不同属于预期，单独比较收益账本，不伪称全部模型相等。实体手机仍需真实设备证据。
