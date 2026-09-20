> 本文件保留 S1 历史。当前 S2-A 候选与验证见 [s2/GPT_REVIEW.md](s2/GPT_REVIEW.md)。

# v0.2 / S1 验证

本轮验证属于第一关可玩草模。第二、第三关为独立规则验证，未完成实机界面与正式美术；用户亲玩与微信真机尚未通过。

## 命令与证据

|检查|结果|证据|
|迁移前 npm test / typecheck:core|18项旧规则通过、核心类型通过|evidence/v02/baseline-*.log|
|npm test|30项新版规则通过，失败/跳过/TODO均0|evidence/v02/rules.log|
|npm run typecheck:core / typecheck|通过|evidence/v02/typecheck*.log|
|npm run test:negative|故意移除同排保护，正式断言检出256≠20；正式源码未变|evidence/v02/negative-gate.log|
|npm run build:web|真实Cocos web-mobile构建，原始退出36|evidence/v02/build-web-mobile-result.json|
|npm run build:wechat|真实Cocos wechatgame构建，原始退出36；仅游客占位|evidence/v02/build-wechatgame-result.json|
|npm run test:browser|真实触摸首关、保存/刷新/暂停/取消/存储异常/手机视口|evidence/v02/browser-first.json|
|npm run test:edge|真实hidden=true后台暂停、显式继续；旧档隔离、设置、两个视口各5次重开|evidence/v02/browser-edge.json、browser-lifecycle.json|
|npm run test:failure|实际撞击/投矛损兵至0，最后损失按剩余人数显示，旧触摸不误重开|evidence/v02/browser-failure.json|
|手机概念排布|8/24/48×左/中/右，两方向人数包含唯一主角|evidence/v02/gallery.json|

所有浏览器脚本只读取诊断快照，通过真实触摸操作控制；未提供强制获胜、跳时间、改兵力或改HP接口。存储故障用真正的Storage边界注入，不替换Book或规则实现。

## 最终首关实测

- 真实触摸通关：58.67秒，剩余88人，头领保存后显示结算。
- 桌面Chrome记录平均58.16 FPS，1秒采样最低45.24；节点峰值28，标签池峰值15。不等于目标手机性能。
- 页面错误0、外部运行请求0。失败路线84.62秒，最后“被投矛击中，损失2人，队伍归零”。
- 视频回读通过：10秒首页→增兵、68秒完整首局；录制器原生有效画面304×632，已裁除框外空白。录屏不含音轨；手机布局仍以390×844/360×800原始截图核验。

## 纯规则轨迹（不是玩家通过率）

|关卡|策略|剩余人数|总用时|Boss用时|
|---|---|---:|---:|---:|
|拉起队伍|提前清障|88|59.17s|17.17s|
|拉起队伍|绕开受阻门|56|68.67s|26.67s|
|拉起队伍|晚换路|52|70.92s|28.92s|
|拿下营寨|提前清障|172|68.92s|14.92s|
|拿下营寨|绕开受阻门|112|77.17s|23.17s|
|拿下营寨|晚换路|16|220.42s|166.42s|
|夺下首城|提前清障|256|81.67s|15.67s|
|夺下首城|绕开受阻门|124|97.42s|31.42s|
|夺下首城|晚换路|68|123.92s|57.92s|

第二局晚换路只剩16人，战斗明显过长，作为后续平衡问题保留；未暗改HP或添加超时。最初机器人总在固定侧路预告时离开中路，导致输出不足；改为只有中路受威胁才避让，无改规则保胜。

## 录屏与限制

`session.webm`保留一次完整自动试玩与后续边界操作原始记录。`first-ten-seconds.mp4`从可互动首页裁取真实10秒，冷启动另计；`first-level.mp4`为从首页到首局胜利的连续真实录屏。只裁掉浏览器录制框外的空白，不合成游戏状态、不加速。

截图：home / first-gain / guard / boss / victory / failure，以及360/390 CSS视口。角色图与排布图标为概念，Cocos截图标为草模。

微信AppID为 `touristappid`，未打开/上传、未使用业务AppID。构建通过不等于开发者工具或真机通过。旧版十局浏览器/旧版微信报告为历史资料；本轮运行的是30项规则、规则十局，以及首关浏览器与边界检查，不宣称已完成新版三关实机十局。

## 已知待办

- 停点A：A/B角色方向及手机辨识度选择。
- S2：正式第一关人物、分层场景、动作与打击反馈；当前草模只验证规则和操作闭环。
- 停点B：用户实际体验，确认跟手、可读、增兵与Boss手感，再扩S3。
- 第二局低兵路线时长需要在S3调参，第二/第三关尚未实机开放。
- 微信开发者工具与目标手机帧率、手势安全区仍待专用身份和设备验收。
