# 赤兔/的卢双手基础姿态增量

新增 `r27-oldmounts.png`：6个基础身体与12手部遮挡片。每匹原有坐骑分别crossbow、dual、bow；源图只编辑骑手双臂，已逐张查看仍为原来的赤兔红马、的卢白马、同一蓝披风主将和背3/4视角。没有用别的马换名。

接入 `frame-map.json` + `body-sockets.json`，key为 `r27_ride_{chitu|dilu}_{crossbow|dual|bow}`。每帧 `bodyContainsWeapon=false`，按实际武器挂对应独立部件；弩/弓用 pose-targeted 中双点匹配，不再给旧单手基础帧猜一个left坐标。手部cap必须按整个身体图像的缩放比例绘制。旧单手长兵器/刀剑可继续原 g_ride_* 与原攻击姿态。

素材核对：看过 `oldmount-poses-qa.jpg` 的全部6个身体，及 `oldmount-sockets-qa.jpg` 全部12个手部定位点，均落在可见手部；完整马和骑手，没有多余兵器。

明确边界：每种新持械姿态只有1个马腿相；没有新生成两相马步态、独立wind/rel/rec骑乘手臂。不能把一个基础帧复制改名为多帧，也不能把全64种坐骑/兵器组合标运行通过。此增量解决“左手估值/旧单手身体挂双手武器”的资源缺口；正式运行握持、遮挡、攻击/收势及马步态完整性由真实构建逐项验收。

新纹理已冻结。脚本 `pack.py` 只写本组新r27-oldmounts与本目录元数据，不会改旧图集和共享游戏代码。
