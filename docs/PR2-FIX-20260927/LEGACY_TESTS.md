# 五项旧测试逐项解释

接管前证据：`evidence/FORMAL-20260927/baseline-failures.log`；本轮修前全库：`evidence/PR2-FIX-20260927/all-tests.log`。本轮修后：`all-tests-final.log`。五项均修前失败、修后通过，没有删测或skip。

| 断言 | 原因与处理 | 默认正式入口影响 |
|---|---|---|
| corrupt sidecar recovers from base, failed storage allows progress and meeting | Campaign.complete/meet现有返回值表示持久化成功；旧断言把内存推进当成写入成功。改为断言返回false、内存推进仍在、失败提示存在，恢复存储后重试成功。 | 旧三关Campaign路径，默认Formal不调用；正式保存失败另有原定向测试。 |
| rigid weapon keeps length across phase, motion and Boss distance; feet move with companion origin | 旧几何测试误用当前runner配置；显式legacy-v051并移除runner/assault/horde配置。长度、脚点和步幅断言原样保留。 | 旧几何模块，Formal独立绘制，不走此路径。 |
| actual damage aggregates by source and never counts overkill | 同上，旧近战伤害测试进入新runner模式导致不满足其场景。固定旧模式后保留总伤害=11、无溢出和箭伤断言。 | 旧模型；Formal光波实际穿透由新增F4测试覆盖。 |
| R08 旧档保留，只迁移设置；新关不解锁 | 真实共享模块缺陷：构造时提示先赋值，persist随即清空。改为保存成功后设置迁移提示；失败提示仍优先。 | Book供默认Formal平台设置适配使用；不改旧档原字符串，不让旧三关解锁正式关卡。 |
| R08 坏档及存储失败仍可玩；保存先于画面且成绩不降 | 旧测试匹配“仍可游玩”，现提示为“本次数据仍保留，请重试”。保留坏档、军衔、解锁、最佳成绩和起始人数断言，检查“无法保存”和“重试”语义，不绑死旧文案。 | Book共享设置路径；内存成绩与重试语义未改。 |

当前全库249项通过（原246项加3项路线/首领/随军回归）；类型检查通过。Formal新增F1–F4九项测试与原正式模块测试并存。
