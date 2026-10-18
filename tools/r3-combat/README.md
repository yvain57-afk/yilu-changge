# R3 战斗复现

所有命令从项目根运行，使用现有本地 tsx，不重新安装依赖。工具只建立内存 FormalStore，不读取或写玩家原生存档。

- `node tools/run-local.mjs ./node_modules/.bin/tsx tools/r3-combat/seven-kind-route.ts`：7兵种d62自然route，诊断停己方火力，站定/读预警实际生命周期与损耗。
- `node tools/run-local.mjs ./node_modules/.bin/tsx tools/r3-combat/progression20.ts`：fresh store合法配装、正常可见信息策略、真实settle，20关连续。当前安全包络已更新，不将旧20结果称本版重跑。
- `node tools/run-local.mjs ./node_modules/.bin/tsx tools/r3-combat/matrix288.ts`：六章、八固定种子、三策略、两合法等级共288。已跑一次，安全包络改后没有再跑，重跑会覆盖旧证据，需先改输出路径保存旧件。
- `node tools/run-local.mjs ./node_modules/.bin/tsx tools/r3-combat/chapter03.ts`：复用已记录的合法第3关配装，古锭刀Lv1自然场景专测。
- `node tools/run-local.mjs ./node_modules/.bin/tsx tools/r3-combat/report.ts`：汇总当前数值表与已有矩阵，不能伪造当前再跑。

`legal-loadout.ts / configureLegalLoadout(store)` 是20关场景复用入口：优先已拥有的偃月刀/双铁戟/方天戟/古锭刀/长枪，真实XP升级至最高3；只选已收服随军/已寻访华佗/已拥有三槽宝物。该函数只用于隔离验证存档，不能在正式游戏里替玩家自动配装。

旧基线详细trace曾误覆盖，baseline-runtime.json仅保留当时实际控制台汇总；不得说它还能完整逐帧复现。model-restored-old-parameters.json保存了调波前实测旧敌军数值场景，当前脚本运行的是当前代码，不冒充旧版。

- `node tools/run-local.mjs ./node_modules/.bin/tsx tools/r3-combat/risk-footprint-regression18.ts`：当前最终风险脚点专项18场。输出 `risk-footprint-final18.json`，再次运行前保留旧件。此前20/288未按此包络重跑。
- `node tools/run-local.mjs ./node_modules/.bin/tsx --test tests/r3-combat.test.ts`：17项真实轨迹/脚点/生命链/损耗反馈回归。

矩阵288中第1关两档皆Lv1，配置相同：实际不同chapter/seed/policy/lineup输入264组，不按独立288输入报告。
