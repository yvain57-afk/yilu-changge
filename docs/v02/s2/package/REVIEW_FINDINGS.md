# S1只读评审结果

基线：184f974c0498e39cf612de2127b0c76c33ec284a；审查日期：2026-09-20。

## 范围与证据边界

已通过GitHub连接读取当前评审说明、BattleView.ts、Game.ts、VisualConfig.ts、core/model.ts、core/levels.ts、core/save.ts、tests/rules.test.ts、package.json、ART-STATUS.md、VERIFICATION.md与rules.log相关区间。图片公开读取失败；连接器获得PNG的base64文本未能转为可视文件。视频未播放；没有实际Cocos运行和手动试玩。

因此，关于规则和绘制逻辑的结论来自源代码，测试次数和实测成绩来自仓库日志；不能据此宣布手感、美术或手机性能通过。A/B原图也未作审美比较。

## 已有工作值得保留

当前实机只开放trial-01；后两关是配置与纯规则测试。Game/BattleView/VisualConfig已拆开。门一次结算、木障先扣后增益、零人数不复活、箭发射时冻结位置与伤害、最近对象先命中、预告锁定/出手后不撤箭、存档隔离均有对应实现和测试。

仓库报告30项规则测试通过；第一关真实触摸88人、58.67秒通关并保存；微信仅游客构建。以上是仓库报告结果，本轮未复测。

## A．代码确认的缺口

1. **山石未显示碰撞扣兵数。** BattleView.render里的rock分支只显示“山石 · 绕行”，第一关配置实际loss为6。影响提前判断，应在正式美术前修复。
2. **角色仍是程序部件草模。** actor使用矩形身体、椭圆头、直线四肢；friend/hero和enemy主要使用颜色与局部配件差异。正式角色资产尚未接入是事实，不是生成图片已经失败的证据。
3. **命中/击破缺少可靠局部反馈。** Game.update把hit聚合播放声音，BattleView每帧只画当前存活对象；没有完整的命中目标位置、局部受击与退场生命周期。需要表现事件桥接。
4. **动作没有完整绑定出手状态。** actor的部分摆动依赖正弦时间，Boss只在charge中抬手。正式射箭/投矛需要与模型时序接上，不能把手臂装饰摆动当作攻击动作。
5. **晋升主要是面板与静态画像。** 结果页存在头领肖像和文字，但完整接旗与同角色外观变化仍需制作。

## B．静态代码发现、需要实机叠加核验的风险

- Boss命中半宽0.42与深度4对应投影宽161.6；目前actor基础宽85.1，包含手臂/长矛后的轮廓约百余设计单位。容错区明显超出身体范围，需校准可见目标，不应只把Boss图替换后继续忽略。
- 地面对象按类型/数组顺序绘制，正式素材加入高大形体后可能出现遮挡顺序错误。以地面锚点统一排序，并分离危险提示层。
- 阵型每排纵向间距24，普通兵高56；部件宽42、横向间隔30。重叠可以是透视设计的一部分，仍需在真实透明素材上验证。现有中心点边界测试不能证明武器、服装和特效不挤。
- 门值字体会随远近缩放；近决策窗口要在360/390宽实屏检查，不以大图阅读体验替代。

## C．草模阶段可接受、S2必须解决

程序树木与道路、占位造型、开发解释性文案、未制作完整晋升动作，可以解释S1用途；它们不是正式视觉的交付标准。S2重点是角色与关键动作、场景层次、战斗反馈，暂不扩展故事和关卡。

ART-STATUS.md说明A/B为生成概念、手机图是带底裁片试排、正式透明资产未生产。不能把候选图已经存在等同于游戏已换装；也不能替用户宣布A/B通过。

## D．第二关数值风险

rules.log记录late策略损失序列[10,8,48]，最终16人，Boss约166.42秒。当前DPS为0.8×人数，16人面对HP1800，即使持续命中、没有更多损失，理论所需伤害时间也约140.63秒，未计箭飞行和躲避。此问题来自原稿数值与实际路径的组合，也需要设计方承担调整。

不建议用隐藏补兵、按当前人数缩BossHP、超时判负或无条件大幅降HP掩盖问题。候选见BALANCE_CANDIDATES.md，正式改动前需重跑正常/安全/晚换路以及不同入Boss人数。

## 原始来源（固定提交）

https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/docs/v02/GPT_REVIEW.md
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/assets/scripts/BattleView.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/assets/scripts/Game.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/assets/scripts/VisualConfig.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/assets/scripts/core/model.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/assets/scripts/core/levels.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/assets/scripts/core/save.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/tests/rules.test.ts
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/docs/v02/ART-STATUS.md
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/docs/v02/VERIFICATION.md
https://github.com/yvain57-afk/yilu-changge/blob/184f974c0498e39cf612de2127b0c76c33ec284a/evidence/v02/rules.log

技术参考：Cocos 3.8 Sprite、动画事件、2D合批文档。使用这些能力不需要更换现有引擎；具体资源与动画管理仍由工程验证。
https://docs.cocos.com/creator/3.8/manual/en/ui-system/components/editor/sprite.html
https://docs.cocos.com/creator/3.8/manual/en/animation/animation-event.html
https://docs.cocos.com/creator/3.8/manual/en/ui-system/components/engine/ui-batch.html
