# 基线、来源与变更决定

## 实际核验范围

核验日期：2026-09-22。GitHub连接读取main，当前提交 `a8b56c16cc94f26d81fe12479b3d12854989efd8`。
本次读取源码与交接，未重新试玩、未重新听音轨、未评审新生成图片。开发包是在此基础上提出的新规格，全部战斗初值未经过本次Cocos实测。

已读取的固定版本文件：
- `docs/v03/GPT_NEXT_STEP.md`、`docs/v03/GPT_REVIEW.md`：上下文中已完整提供，说明v0.3.1齐射/连续运动/步态/音乐和轻量测试边界。
- `assets/scripts/core/model.ts`：固定步长、N×0.2原齐射、门事务、Boss固定目标、shot快照。
- `assets/scripts/Volley.ts`：5组、原48弓口、冻结发射与真实命中关联。
- `assets/scripts/WorldScenery.ts`：世界距离回收和六帧步态。
- `assets/scripts/core/save.ts`：现有存档键、3稳定ID、连续解锁、最高称谓。
- `assets/scripts/core/progression.ts`：rankStage、canStart、nextUnfinished。

文件基址：`https://github.com/yvain57-afk/yilu-changge/blob/a8b56c16cc94f26d81fe12479b3d12854989efd8/`
固定交接：`https://github.com/yvain57-afk/yilu-changge/blob/a8b56c16cc94f26d81fe12479b3d12854989efd8/docs/v03/GPT_NEXT_STEP.md`

没有逐件阅读全部历史课程，未将其观点补进本轮玩家文案。赵云会面与白石剧情为本项目新增写作，不能在资料页冒充原著原话或真实事件。

## 来源与新设计严格分开

|项目|来源支持的既有状态|本包新设计|
|---|---|---|
|射击|全队包括主角从弓口出箭、N×0.2合并逻辑箭|主将独立近战、N-1弓兵、235可见箭上限|
|Boss|固定深度4，原预告/伤害合同|模型接近到0.90的交锋位，按同一几何结算|
|流程|三关、下一关、结尾与保存已存在|共用整军/建营/驻防过渡|
|叙事|通用小人物到城主|三国世界中无名武将到白石驻将|
|视觉认可|用户曾认可角色方向，尚不等于全部动作/队伍通过|沿用脸型识别色，换长枪与武将姿态|
|音乐|Shenyang授权曲已接入，用户不喜欢但暂留|本轮不重做，保留署名与设置|

## 明确替代的旧要求

1. 玩家最新意见撤回正常界面的“架空演绎”等表述。项目内部仍需清楚区分原创写作与原著事实。
2. 主角必须持弓被“标准主将、先做长枪近战”替代。旧人物脸型/画风认可继续有效。
3. 原伤害总额N×0.2与Boss固定深度不再是不可改合同；本包明确授权更新并新增测试。门、公平性、清档禁令等继续保留。
4. 第三关直接成为城主/第四方，与这版慢成长不一致。显示称谓改白石驻将，不删除数值进度、最佳成绩和解锁。
5. 本轮允许最小的营地过渡，不扩成后宫、经营、装备或外交系统。
6. 旧“先审批角色/只做首关”停点继续失效。内部制作不中断等待，最终集中亲验。
7. 旧每轮十局+全量双平台长测继续不作为默认；重大问题才扩大验证。

## 技术参考（仅辅助，不覆盖项目合同）

Cocos 3.8 Sprite：
`https://docs.cocos.com/creator/3.8/manual/en/ui-system/components/editor/sprite.html`

Cocos 3.8 Animation Events：
`https://docs.cocos.com/creator/3.8/manual/en/animation/animation-event.html`

官方文档说明Sprite与动画事件用法；“逻辑模型负责伤害、动画只表现”是本项目的设计决定，不冒充官方唯一方案。
不升级Cocos、不新增收费动画软件、不下载商业游戏素材、不在外部API中发送私有代码/凭证。
