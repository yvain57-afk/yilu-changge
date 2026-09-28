# 截图定位与资料来源

7张原图是用户问题证据，不是已修复截图，也不是最新代码的版本证明。每张图保留原始字节与文件名。

|编号|原图|页面/场景|检查重点|
|---|---|---|---|
|S01|`evidence/IMG_4291.PNG`|军中图鉴，第4/4页|马超、庞统、姜维卡片中出现截断主体与其他身体碎片；卡片需检查头像来源、帧映射、裁片和显示容器。图鉴底部仍显示兵器说明，须按页签使用相应说明。|
|S02|`evidence/IMG_4289.PNG`|诸葛亮交锋／双股剑／骑乘|检查敌将与将台的前后关系、己方坐骑与两名随军的遮挡、上方共鸣文字对比。截图无法单独证明行进速度或帧率。|
|S03|`evidence/IMG_4288.PNG`|张飞预警／青釭剑／骑乘|敌将主体与台前零散人物部位需要逐层还原；右侧预警侵入画面边缘。检查完整身体与预警有效区域。|
|S04|`evidence/IMG_4284.PNG`|周瑜收势／蛇矛／骑乘|交锋主体、箭雨与将台叠合；检查受击反馈、手握兵器和特效可读性。命中节奏、卡顿属于用户实测反馈，静图不提供时长证据。|
|S05|`evidence/IMG_4283.PNG`|赤壁整备／随军列表第2/2页|两侧展示角色存在水平截断与离散部件；下方阵容预览必须完整。列表跨页，不能仅凭本页勾选数判断总随军数错误。|
|S06|`evidence/IMG_4282.PNG`|赤壁整备／另一配队状态|用于与S05对照切换后帧、角色、占位和节点回收。明确两槽实际人名，检查旧节点残留、错用其他角色或动作帧。|
|S07|`evidence/IMG_4281.PNG`|天下地图／6/10已克|路线叠在营地背景上；未开区域用一排深色圆遮挡，地图空间感与区域识别不足。保留当前关卡、奖励和解锁数据，修复地图呈现。|

## 用户原始反馈（2026-09-27）

> 给你的图片中有很多错误，你能不能看的出来，很多同伴人物只有一半，boss在战斗的时候也会只有一部分身体。还有整个战斗进行的太快了，骑马的时候更快，根本看不清，而且还会有一卡一卡的。和每关的boss战斗也是，节奏太快，而且互相出招感觉不到对方被打击到。每一关要放慢一些节奏，每关要1分半到两分钟才够，这样人物升级装备升级用户才有操作性有掌控感。连同没有修复完成的一并进行修复，然后我们暂时不按微信小程序规划，改成做iOS的游戏规划。

这里保留用户的体验表述；骑乘纵向是否存在实际速度倍率，仍须查代码与测量，不能从原话推定具体根因。
## 依据与来源边界

- **U1｜用户2026-09-27实测反馈**：人物/同伴/Boss显示不完整；推进与骑乘体感过快；卡顿；交锋缺少打击反馈；每关90—120秒；补未完成项；目标改为iOS。原始截图见本包evidence/，动态体验以用户陈述为依据。
- **U2｜已确认新玩法**：用户2026-09-26明确采纳Claude的人物关系、随军人数、三类宝物槽、十关顺序、掉落、兵器升阶和共鸣调整。旧C10仅在不冲突处作为背景，不作为现行字段来源。
- **G1｜本次2026-09-28读取的PR #2**：仍为草稿，head=a7e34fddb2da0eae179368897bb44e230c10344a。这是审阅坐标，不能覆盖其后的本地修改。
  `https://github.com/yvain57-afk/yilu-changge/pull/2`
- **G2｜当前素材缺口**：`docs/PR2-FIX-20260927/ART_STATUS.md`。明确列出拒绝接入的六兵器跑步稿、九统帅献械稿、攻击中间帧、骑乘遮挡与部分共享技能。
  `https://github.com/yvain57-afk/yilu-changge/blob/a7e34fddb2da0eae179368897bb44e230c10344a/docs/PR2-FIX-20260927/ART_STATUS.md`
- **G3｜当前绘制代码**：`NativePaint.ts`中的`frame/drawImage/take/ground`是排查入口；代码读取没有证明其为截图错误的唯一根因。
  `https://github.com/yvain57-afk/yilu-changge/blob/a7e34fddb2da0eae179368897bb44e230c10344a/assets/scripts/formal/NativePaint.ts`
- **G4｜当前战斗片段**：`battle.ts`的`step/heroAttack`，赤兔倍率用于横移上限；偃月刀家族释放分支设置`S.hitStop=.05`，step在hitStop期间提前返回。属于优先检查项，不是本次真机性能归因结论。
  `https://github.com/yvain57-afk/yilu-changge/blob/a7e34fddb2da0eae179368897bb44e230c10344a/assets/scripts/formal/battle.ts`
- **G5｜上一轮验收与未决停顿**：`README.md`列开发端249项通过、第七关结算停住未明根因。本文不重复签署其通过结论。
  `https://github.com/yvain57-afk/yilu-changge/blob/a7e34fddb2da0eae179368897bb44e230c10344a/docs/PR2-FIX-20260927/README.md`
- **C1｜Cocos 3.8官方iOS构建示例**：支持从现有Creator项目生成iOS项目，经Xcode构建。实际本地Xcode/SDK与Creator版本兼容需执行验证，不能把文档中的历史最低版本当成本次发行要求。
  `https://docs.cocos.com/creator/3.8/manual/en/editor/publish/ios/build-example-ios.html`
- **C2｜Cocos原生发布**：作为原生构建与本地环境核查入口。
  `https://docs.cocos.com/creator/3.8/manual/en/editor/publish/native-options.html`
- **A1｜Apple TestFlight官方说明**：TestFlight是测试分发流程，需相应构建、签名和账户条件；本包只要求准备，不授权上传邀请或发布。
  `https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/`

外部资料只支撑平台路线。本文关卡分段、窗口、动效与性能阈值均为本任务工程目标/调试初值，没有声称来自Apple规定或原版商业游戏公式。未对用户手机重新测时、测帧或读取系统诊断。
