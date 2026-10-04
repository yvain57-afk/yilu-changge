# R2 人物与骑乘素材交接（2026-10-02）

## 可接入成品

- `people-fullbody-map.json`：42/42 人均复用已有真正全身帧。已实际查看 `people42-fullbody-qa.jpg`。旧 Boss 九人应选 `g_boss_{id}_idle`，吕布选 `g_lubuIdle`，不是 `g_portrait_*`。这是选择链遗漏，不需要把半身图拉长，也不需要新画一批不同身份的人物。
- `assets/scripts/formal/R2Art.ts` 导出 `R2_ART`、`R2_HANDS`、`R2_PEOPLE`。仅新增文件；未改 manifest/FullMenu/WeaponPresentation/FormalGame/battle。
- `r2-chitu-crossbow.png` 与 `r2-dilu-crossbow.png`：4 个空手身体帧、8 个独立手部遮挡块。每只马包含原始已合格 run0 和新制作的真实反相 run1，合计两个真实步态，不能称四相。
- 关键帧名 `r2_ride_{chitu|dilu}_crossbow_{run0|run1}`，`*_right_fingers`、`*_left_fingers`。适用于连弩/机关弩持械姿态，不可用于弓/双持，不换马身份。

## 接入合同

1. 注册 `R2_ART.sheets/frames`，不覆盖旧资源。
2. 只在赤兔/的卢、crossbow 类型、奔跑状态时依真实步态节拍选 run0/run1。攻击 wind/rel/rec 本轮无合格新帧，不能把两张跑姿命名为攻击动作。
3. `R2_HANDS[key].sockets.right.normalized` 为后握点，left 为前支撑点；坐标相对裁剪后帧左上角。
4. 身体 → 两点握持拟合的 r27_held_liannu / r27_held_jiguannu → 两只手 caps。caps 为20×20身体像素，使用与身体相同缩放。不要拟合后另加兵器旋转，避免脱离左手。
5. 画面 anchor [0.5,0]、refH 475(赤兔)/474(的卢)。不改变数值、弹道、攻击节拍或音效。
6. `mounted-crossbow-composite-qa.jpg` 是离线装配检查，**不是游戏运行证据**。正式页面和战斗由主代理集成验证。

## 实际方法及失败边界

使用现有内建 imagegen，每张只编辑一个原始已合法坐骑，不新增付费外部 API。两张 run1 明确改为左后蹄抬高、右后蹄降低；无镜像、无同图复制冒充新帧。源图保留，pack.py 可重现裁切/透明边缘清理/等比缩放及装包。

生成了两只旧马各 wind/rel/rec，以及每只马 rel/rec 的固定握距修正版，共10张攻击候选。实际图检发现第一版 release/recovery 两手靠得太近；修正版 release 有改善但整体握距仍变化约25%–45%，recovery 仍近手或遮住后握点。若直接套两点拟合，会使刚性弩体显著缩放跳变；若猜测隐藏握点，会重新引入估值手部。因此这些候选全部保留为失败证据，不入运行 atlas。不是等待审美批准，也不是宣称工具不可用；是几何握持约束尚未满足。候选 `*-wind-source.png`、`*-rel-source.png`、`*-rec-source.png`、`*-rel-v2-source.png`、`*-rec-v2-source.png` 不应集成。

## 未完成项（按键详见 gaps.json）

- 赤兔/的卢 crossbow：wind/rel/rec 尚缺合格固定握距身体，已做两轮实际尝试。
- 赤兔/的卢 bow/dual，以及惊帆/绝影 crossbow/bow/dual：各自 run1、wind/rel/rec 尚未制作。不能套用赤兔/的卢 crossbow 图，否则换马或握姿错误。这些是尚未执行的制作项，不冒称已尝试失败。
- 12名新人物 r27_char_{id}：仍为2个真实支撑相，pass0/pass1过渡帧尚未制作。
- 3类地面 r27_body_{crossbow|dual|bow}：仍为2相，pass0/pass1过渡帧尚未制作。
- 原生/真机动作与页面验证：本素材子任务没有执行。

## 检查与文件

- 42人全身QA、马腿源图、两只马握点QA、连弩/机关弩装配QA均已实际查看。
- validation.json：12帧边界检查通过，4身体、两相/马，无镜像；runtimeVerified/deviceVerified=false。
- frame-map.json、body-sockets.json、provenance.json、accepted-poses.json、gaps.json 为精确机器可读合同。
- 本轮新增资源之外未修改游戏代码、已有素材、玩家存档和声音；不提交/发布。
