# FIX1 证据核对与封顶参数记录

## 1. 使用的版本与证据边界

原始文件：`YILU_BATTLE_REWORK_20260925_FIX1_GPT_EVIDENCE.zip`。SHA256：`8bd56ae8eecdf75726719c7a862e400be7805abbb5d89b6dc62a70bc7d576b5b`。

包内README的版本为 `0.9.2-battle20260925.1` / `battle-rework-20260925-fix1`。本次读取了包内说明、JSON、实际PNG；读取30秒MP4元数据并抽取两段连续片段的关键帧形成接触表。没有在本环境启动Cocos游戏，没有重新执行该包声称通过的测试，没有连续播放验证听感，也没有实体手机测试。

完整工程不在这个小包内。README指向另一个FULL_DEV包；docs/00入口中“完整工作区”的说明不能改变当前附件实际只提供小包的事实。

## 2. 修订上一条答复的版本混用

FIX1的 `sources/fix1/docs/KNOWN_GAPS.md` 明确写“核心战场素材齐备”。更早UI报告中的“核心素材未齐”不能继续当作FIX1现状。

本轮返工依据是用户对攻击动作、门箱排版、顶部景物、隔离结构和封顶体验的否定；“素材齐备”与“用户认可美术质量”分别记录。FIX1的FINAL_REVIEW也仅具体说明了通知行、连续门高度和标签等定向修复。

## 3. 实际画面可以支持的观察

|证据|画面所见|不能据此声称|
|---|---|---|
|references/fix1/390x844-gates-crates.png|宝箱上方奖励名、下方“耐久 9”等独立色块；中间很细的纵向分隔物；近战角色与兵队并存。|无法只凭静图判断武将每一次攻击的发射者、帧时序或碰撞正确性。|
|references/fix1/02-equipment.png|战场有细箭状轨迹，兵力标签和装备标签各自显示；顶部近处有塔楼/岩块等。|不能从箭状轨迹推断所有角色都用弓或已经识别错误发射点。|
|references/fix1/clip-contact-sheet.jpg|短片0.25—5秒、12.25—17秒的抽帧中，顶部反复可见塔楼/岩块/屋舍组合；它们与道路目标的相对变化值得核查。|不能仅凭抽帧断定是取模回收、屏幕钳位、相机父节点还是正常世界装饰。用户要求的可见结果是删除这类顶部持续挂着的近景组合。|
|references/fix1/390x844-contact.png|连续+1有独立侧签和引线；FIX1报告说明其数量及不重叠检查。|“不重叠”不等于布局好看，也不证明不同密度下都可读。|

这些旧版画面仅供定位问题，不能当成FIX2效果，也不作为已批准新美术。

## 4. 单门封顶已在小包数据中找到

以下是**开发方运行记录**的原字段读取，不是本次重跑得到的成绩。完整提取见 `config/FIX1_CAP_OBSERVATIONS.json`；原文件副本在sources中。

|记录位置|目标ID|记录的正值上限 maxPositive|每增加1所需伤害 damagePerPoint|封顶后命中 hitsAfterCap|封顶后瞄准计时 spentAimingAfterCap|
|---|---|---:|---:|---:|---:|
|natural-flow.json /runs/0/pacing/4|l1.g1|4|4|345|约5.317秒|
|natural-flow.json /runs/2/pacing（按ID定位）|l3.g0.left|8|5|15|约1.217秒|
|natural-flow.json /runs/2/pacing（按ID定位）|l3.g1|8|6|222|约2.833秒|
|390x844-gates-crates.json /model/targets（按ID定位）|l2.g1|12|8|该行是夹具快照，不作自然游玩统计|不据夹具推断|
|390x844-gates-crates.json /model/targets（按ID定位）|l2.g2|12|15|同上|同上|

第一条记录同时写：约10.633秒封顶，约16.000秒经过，实际领取为4人。这支持“至少该记录中有封顶后继续消耗命中的阶段”。它不等于345名士兵或345点奖励；spentAimingAfterCap的累计方法仍需核对源码，不能把它自动解释为实际手指保持的时长。

**仍未找到：为什么要把这些门分别设成4、8、12，以及是否有原版公式依据。** 小包含参数结果，未含可独立证明这套设计理由的完整推导。Codex必须核对本地配置、默认值、Git/本地变更记录；无推导就写“项目初值，未找到依据”，不能编造为原版设定。

## 5. 四种“上限”必须分开查

单门正值上限决定门最多能积累多少奖励；逻辑总兵力容量决定队伍最多容纳多少人；可见精灵数限制仅决定画多少个代理；数值安全护栏用于防异常数值。前三者不能都用“满员”一词。

本次取消的默认对象是普通mutableGate的低额正值封顶。小包没有证明完整逻辑兵力容量与可见精灵上限；不得照抄旧版本提到的数值作为当前事实。高人数要先核对权重守恒、占位与伤害，不靠偷偷丢奖励控制性能。

## 6. 可核实的代码检索起点

`sources/fix1/evidence/SOURCE_DIFF.json`列出FIX1修改了 `assets/scripts/BattleView.ts`、`assets/scripts/Game.ts`、`assets/scripts/ui/WorldLabels.ts` 等。

`sources/fix1/evidence/PRESERVED_CONTRACTS.json`列出 `core/runner.ts`、`core/runnerConfig.ts`、`core/model.ts`、`core/weapons.ts`、`core/save.ts` 等在该次修复前后的哈希。这里未读到这些完整源码；本包不给虚构行号或假定API。

素材替换与门值规则调整分别建变更记录。前者可做原模型逐字段一致验证；后者预期会改变后续人数、击杀和胜负，不能再要求所有后续状态与FIX1完全相等。
