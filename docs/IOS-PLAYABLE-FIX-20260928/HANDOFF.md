# IOS-PLAYABLE-FIX-20260928 实际接续点

工作区 `/Users/yvainair/Code/游戏-左右滑古代史`，分支`codex/ios-playable-fix-20260928`，基线a7e34fd。本轮代码和成果从独立分支提交审查；保留所有此前dirty工作，evidence/v03/build-web-mobile-result.json不是本轮。GitHub合并按用户本次明确授权进行；禁止reset/clean/stash，未上传TestFlight/微信/商店。

入口：deliverables/IOS-PLAYABLE-FIX-20260928/README.md。实际46项结果在evidence/IOS-PLAYABLE-FIX-20260928/03_ACCEPTANCE.json，17pass/23not_run/2fail/4blocked。**不是全绿交付。**

## 已实现/实测

原生Cocos工程、168帧重切、520帧合法矩形、20个攻击过渡、有效步态/rig、双持和骑乘手指遮挡、九统帅结束帧、真实伤害反馈、无全局空挥顿帧、十关预算、保存防护、地图/详情/支援UI。30人完整详情和关键Boss姿态已实际原生取图，261测试/typecheck/Debug与签名Release构建/codesign通过。

两轮完整原生十关实录；第二轮全新档、兵器等级1、正常逐关获得配装。最终第10关120.98秒，第7/10关Boss44.25/45.60秒。最后调Boss HP260/220→225/190，并修复门有效窗口与宝物胜利入库，模型全部95.23–108.00秒，但最终正常原生复测未执行。详情和支援显示也在完整实录后补录，版本差异明确记media-provenance.json、PARAMETER_DIFF.md。结算逻辑未变，两轮第7关均正常到第8关。

## 接续

1. 用户手动解锁Mac后继续CUA实际正常操作；最后Mac锁屏明确拒绝，不能绕过。优先补最终c7/c10测量，再按46项表补动态矩阵，不盲目十局长测。
2. 真机免费签名3应用名额已满，用户自行备份/腾位或提供已有开发团队；不卸载现有应用。安装成功后Release真机性能/生命周期/音震/覆盖保档仍必做。Debug模拟器34–49fps和长帧不是性能通过。
3. 未完成全帧逐层诊断、全武器/角色/骑乘连续动作、全共鸣组合、四宽短屏/连续门、奖励窗口末次≥15秒、快通/失败、故障结算组合和性能归因；逐条真实补，不能归为审美。

专用模拟器“Yilu Native Final”保留10关完整档、已回正常home。旧“Yilu iOS Fix Review”保留旧测试档并关机。临时准备c7专项时只在新测试模拟器写入实际旧快照，未开始战斗即锁屏；完整十关SQLite备份已恢复。私有备份在.cache/ios-playable/native-test-saves，不加入分享ZIP。视觉夹具内存存档，不修改玩家持久档。

原始大录像保留evidence，本轮不清理。核验包含真实图和完整压缩原速视频，不包含失败录制。原生入口Journey，Bundle ID com.yvainair.yiluchangge，scheme CocosGame。构建脚本tools/build-ios.py；只读证据采集ios-evidence.py；隔离截图ios-fixture-capture.py；报告ios-report.py。
