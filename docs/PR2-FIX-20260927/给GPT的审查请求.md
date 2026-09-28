请在PR #2当前分支核查完整PR，并优先检查本轮相对c6aa92cf26b22a6682099c26e9203b70b6d14f6f的增量。PR保持草稿，不合并。

先读docs/PR2-FIX-20260927/README.md、RULES_DELTA.md、ART_STATUS.md和LEGACY_TESTS.md，再核对assets/scripts/formal与新增tests/pr2-regression.test.ts。

重点验证：途中名将必须攻击败北且不能离屏略过；结算需要对应名将与统帅证明，孙尚香/姜维破阵归附是明确规则；华佗按实际损失计数，不把七星灯增加算伤兵；所有光波目标共享穿透预算与交点排序；四势力路线、张角/吕布/周瑜攻击和吕布/典韦随军效果确实改变运行状态；地图/人物详情配装与存档闭环。

对照evidence/PR2-FIX-20260927/BUILD_ID.json和ACCEPTANCE.json。before/after-regression是正式Cocos定向夹具，不冒充自然路线复现。natural-ten.mp4为最终新档连续十关，原速、外部触控、无HP/胜利注入；chapter4-natural.mp4从其中原速截取；officer-fixture和flow-fixtures明确为夹具。核验小包内包含真实媒体。

不要把249项测试通过等同美术或真机通过。首轮第7关结算停顿根因仍未确认；最终隔离浏览器复录10关成功不能证明该风险永不再现。动作失败稿、剩余共用技能、主将中间帧、骑乘遮挡、微信预览和手机体验均有明确未完成状态。请给出可复现、带路径行号和影响范围的发现，区分真实bug、明确初值与尚未交付的美术/平台项目。
