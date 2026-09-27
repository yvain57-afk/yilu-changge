# 当前战斗返工版本

当前源码和预构建版本为 `0.9.2-battle20260925`，运行标识 `battle-rework-20260925`。这是保留本地未提交工作的完整快照，不是远程Git提交声明。

1. 运行：安装Node.js18+后，双击根目录 `启动一路长歌.command`；或在根目录运行 `node tools/launch.mjs`。预构建试玩不需要安装依赖或Cocos。
2. 打开本地服务的 `/review/BATTLE-REWORK-20260925/` 查看实际前后PNG、参考和原速录像；`/play/` 可操作游戏。
3. 修改源码：`npm ci` 后运行 `npm run typecheck` / `npm run check:v09`，Cocos Creator3.8.8用于重新构建。源码入口 `assets/scripts/Game.ts`；战场 `BattleView.ts`、`BattleRoad.ts`、`BattleAssets.ts`。
4. 看 `BATTLE_VISUAL_DIFF.md`、`REVIEW_RESULTS.json`、`KNOWN_GAPS.md` 和 `ASSET_WORKLIST.json`，再继续修改。失败样片保留，勿只读最终通过项。
5. 完整自然三关：`evidence/BATTLE-REWORK-20260925/final-three-levels.mp4`；原始WebM和过程失败证据也在完整包。分享包的微信AppID置空，当前本机工程身份保持原样；未做本轮上传或发布。

本轮冻结菜单，保持核心玩法、投影/碰撞/输入、存档、永久解锁和关间流程。素材原始生成图在 `art-source/battle-rework20260925`；运行切片在 `assets/resources/battle20260925`；生产及编码参数有指纹记录。不要将本包参考PNG裁成运行素材，不要移除源图来压包体。
