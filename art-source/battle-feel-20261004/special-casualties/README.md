# 战斗受击与倒地资源 · 2026-10-04

`source.png` 是本轮内置 imagegen 的实际输出；`pack.py` 只按完整连通域及已检查的独立武器/机关残骸归属提取，不绘制角色、不补画武器。

- 12 帧：敌弓手、盾兵、近卫、旗手、机关，以及己方背向弓手，各 hit/fallen 两态。
- 16 个有效连通域全部归属；独立弓和合法机关碎片单独保留。低 alpha 边缘只在所属组件外扩 1 px 内保留，不把远离身体的杂点带入。
- 固定 448×448 单元，地面锚点 (224,416)。每组 hit/fallen 共用站姿身体高度参考；倒地不会按趴姿裁切高度放大。
- `contact.png` 仅为资产检查板，不是运行截图；`frame-review.json` 记录源/输出哈希、归属、源坐标、alpha 边界和 refH。

复现：`python3 art-source/battle-feel-20261004/special-casualties/pack.py --append`

此命令生成 `assets/resources/formal20260927/feel-special-casualties.png` 与对应 meta，生成 `frames.json`，再幂等追加 `BattleFeelEnemyArt.ts`。先运行基础 `enemies/pack.py` 后再运行本命令，防止基础重打包覆盖注册。

已完成源图和切片完整性检查、Cocos 真实渲染函数提交键回归；完整战斗画面、连续时序和手机体验由最终运行验收单独记录，不能用本检查板替代。
