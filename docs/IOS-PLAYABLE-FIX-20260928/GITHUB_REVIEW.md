# GitHub 独立 GPT 核查入口

本次核查范围是当前独立分支相对 `a7e34fd` 的 iOS 原生改动，以及它所继承的正式十关集成（原 PR #2）。审查依据为本目录 `intake/01_IOS_FIX_SPEC.md`、`intake/03_ACCEPTANCE.json`，实测记录在 `evidence/IOS-PLAYABLE-FIX-20260928/`。审查者应检查真实代码和复现证据，不将模型、原生模拟器和真机混作同一验证层级。

独立 GPT 预合并审阅曾发现并复现两项 P1：

1. `assets/scripts/formal/battle.ts`：光波碰撞筛选允许较远的门消耗穿透，但改值函数只接受4.5秒有效窗口。现两处共用 `shootableGate()`，固定 +1 门不耗穿透；新增窗外门/固定门后方敌兵的命中预算回归。
2. `assets/scripts/formal/store.ts`：旧结算过滤要求本局新宝物已经在永久库存中，导致“结算入库”永远失败。现有效 `runGot` 只在胜利时加入收藏，败北时丢弃；新增胜败回归。规则来源为 `docs/BATTLE-PREVIEW-20260926/统一玩法规则-20260927.md` 宝匣节。

两项修复经独立复审通过。`npm run typecheck`、`npm test` 261/261通过；最终模拟器Debug和iPhone开发签名Release重建，严格codesign通过。`evidence/IOS-PLAYABLE-FIX-20260928/comparison/` 为实际原生对照，`native-github-audit-fixture-original-speed.mp4` 为修复后原速隔离战斗段。

**仍未达标的门槛：** 最后一次完整自然原生十关录像中第10关120.98秒（目标≤120秒），第7/10关Boss44.25/45.60秒（目标约28–40秒）。之后将两关HP降为225/190，模型通过，但最终版本正常原生复测未完成。真机安装受免费签名3应用名额限制；iPhone Release性能、20分钟热态、触控/音震/中断/覆盖安装均待验。46项表如实保留17通过、2失败、4阻塞、23尚无完整证据。

请在 GitHub 核查：
- Cocos原生入口与触控桥，是否还有未守护浏览器调用；
- 门、箱、弹道穿透、名将接触/战胜/收服、华佗实际战损与宝物结算；
- 存档原字节备份、暂存/重试/幂等与未知字段；
- 图集矩形、人物对应关系、节点复用与高频绘制性能；
- 实测和最终构建的版本差异，以及46项状态是否有误报。

本次GitHub合并表示提交候选源码供继续协作，不代表全部46项完成，也不等于TestFlight或App Store上传。完整原速十关视频及全量截图在核验ZIP和本地原始证据中，文件的源码指纹与媒体差异见`media-provenance.json`。
