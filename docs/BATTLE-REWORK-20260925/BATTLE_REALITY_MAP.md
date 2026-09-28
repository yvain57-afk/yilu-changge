# BATTLE_REALITY_MAP — 2026-09-25

范围：当前三关的真实战斗展示；菜单、存档、奖励数值和运动/碰撞模型冻结。下述是源码核验结果，资源接入和实机画面验收单独记录，不把设计当成完成。

| 真实链路 | 当前依据 | 本轮替换与风险约束 |
| --- | --- | --- |
| 世界 → 屏幕 | `VisualConfig.project(x,d)`：`s=clamp(1-.065*d,.5,1.04)`，`screenX=x*260*s`，`screenY=-270+104*d` | 保持函数和世界坐标不变。真实道路纹理切固定 UV 横条，逐条投影世界纵坐标，宽度服从同一尺度；按世界片段 ID 回收，不用屏幕滚动量伪造前进。 |
| 横向输入 | `Game.ts` UI 坐标转换后，`journey.move(target+deltaX/260)` | 玩家基准深度 d=0、scale=1，现有输入和投影相配。不得单独改路宽、偏移角色脚点或制造三条封闭车道。 |
| 玩家编队 | `core/runner.ts` members 稳定 ID、固定 slot 0..47；脚半径 .025；后排 z 最深约 -2.75 | 新人物姿态围绕原脚点换帧，行走需真实双腿变化。显示最多48人，实际兵数/权重不变；不能通过删显示单位隐藏风险。 |
| 子弹与出手 | `runner.muzzle(member)`；origin 固定记录 owner/tick/x/z/role；真实 shots 参与最近命中 | 射击帧只由真实 shot tick 驱动，普通兵发射高度45、主角/同袍72保持。暂停只读模拟时钟，不用 wall clock 偷跑。 |
| 门/箱触发 | targets `x±halfWidth`；子弹纵深±.06、脚触发±.035；目标脚点 `project(t.x,t.at-j.z)` | 门板/立柱/数字分层，四箱独立材质与图标。视觉宽度按真实 halfWidth，受击改变值/耐久、破箱和奖励只读 ledger。装饰不得改变判定。 |
| 敌人与伤亡 | enemies 真正接近/接触；lastDamage.removedMembers 记录实际被移除成员脚位 | 敌人行进/攻击/受击/退场用新统一美术。死亡和我方退出从真实事件坐标绘制，不能平均扣人或按视觉猜测命中。 |
| 障碍与环境 | runner barriers 给出 left/right/back/front；`BattleView.runnerBattle` 据此绘制 | 保留实际低隔栏/下方开口。新增体积建筑全部在走廊外，只有远方装饰地标允许视差；不能画无碰撞实体占据可走区。 |
| 当前渲染入口 | `BattleView.render → ground → runnerBattle`；WorldScenery 固定 worldStrip slots；菜单走 pageScene | 只替换 battle ground 与 runner 资源。pageScene 不变。现有 ArtSprites 混用旧图集，由专用 BattleAssets 接新资源，不误替换菜单肖像。 |

## 新资源实物与接口

已查看真实生成文件：`art-source/battle-rework20260925/road-source.png`（泥石车辙/路肩平面纹理）和 `soldiers-source.png`（蓝后背两步/射击/受击，红正面两步/攻击/受击）。后者源图有背景，须经资产代理去背景、统一脚点、裁切后才可运行；不能把整张素材板当场景。

约定 `BattleAssets.load/ready/frame/diagnostics`；实例 `begin/draw/end/destroy`。draw 接受 parent、稳定ID、资源key、原脚点x/y、精确w/h、anchor/angle/alpha/tint。道路32个固定 SpriteFrame 切片共享同一纹理；UV与世界整数片段绑定，首尾资源需实测接缝，池大小固定。建筑、四箱、门板和将领资源以实际交付的 atlas key 为准，不虚构已存在素材。

## 验证边界

先复现 `evidence/BATTLE-REWORK-20260925/before` 的第二关三状态，与 after 的 members/targets/shots/enemies/ledger 摘要逐项比对（状态不变而画面改变）。再录真实可控15–25秒 R1 段观察纹理接缝、脚点、姿态、门箱层级与连续运动；内部看图合格后才进入三关自然录像。静态 fixture、浏览器画面、自然通关和微信真机结果分别记录，不相互替代。

## R1 实图修正（尚待第二次构建审图）

第一版三态模型摘要与基线完全一致，但实图暴露远景被HUD遮住、窄草条横向拉伸、人物偏小。保留失败证据。当前 renderer 已改为完整512方草地tile、soft-road同UV循环、独立透明雾底远山；地标装饰脚点约y397，道路仅在远端与背景渐融。普通兵/主将/同袍/敌兵逻辑高度110/140/126/110，脚位不变，箭口显示高度同步角色比例；+1旗78design高。路侧图片可见内缘±1.22仍超出实际成员最大脚位±1.16与半径.025，远端装饰渐隐。三关分别用岩地/粮仓哨楼/城门区别，不改变目标身份或游戏世界。`tsc --noEmit`通过；这些修改须以新的真实截图确认，不能继承首轮画面验收。
