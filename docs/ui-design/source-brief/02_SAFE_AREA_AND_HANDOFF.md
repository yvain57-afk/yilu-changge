# 手机安全区域与Codex接入附录

此文件是给设计实现衔接用的规则，不是已经在用户手机运行过的修复补丁。

## 1. 已确认的原因

Game.ts 当前：`view.setDesignResolutionSize(720,1280,ResolutionPolicy.FIXED_WIDTH)`。
`edge = max(0, (view.getVisibleSize().height-1280)/2)`。
战斗标题Y=`576+edge`；暂停Y=`555+edge`；顶部面板Y=`543+edge`；第二状态行Y=`450+edge`。

当可见高度不小于1280、根节点居中时，标题离可见顶边固定为约64设计单位。edge只是在长屏里保持同样的顶边距离，它没有表达刘海或平台胶囊的位置。这个计算与用户截图的遮挡相符；具体真机根节点/Canvas转换仍须记录验证。

当前手动 `hits` 数组与节点位置分别存储。新UI必须从同一布局结果生成控件图形、Label和命中矩形；只移动图形不移动hit区，会产生“看得见但点不到”的问题。

## 2. 三层空间必须分开

A. FullBleedWorld：背景与现有战斗世界继续全屏，不套整个游戏SafeArea，不缩放/下移模型。
B. PlatformOcclusion：设备安全区以外、微信胶囊、底部手势/圆角等占用；平台拥有，不画成游戏资源。
C. SafeUIRoot：关键文字、按钮、HUD和弹层使用避让后的坐标，世界标签只改屏幕展示层。

设计稿中的黑色灵动岛和胶囊是校验叠层。必须能开关查看，但不能在最终游戏里另画一个假的胶囊/黑条。

## 3. 数据获取与坐标归一

后续Codex在用户本地读取当前引擎/小游戏SDK和官方技能，能力探测后取得：实际窗口尺寸、Canvas显示矩形、DPR、可见设计尺寸、设备安全矩形、平台胶囊矩形。

候选平台接口名称：微信小游戏环境核对 `wx.getWindowInfo`（或实际版本支持的系统信息接口）与 `wx.getMenuButtonBoundingClientRect`；必须确认小游戏支持与返回坐标，不得把小程序接口直接无条件复制。兼容回退只在SDK支持时使用，不依赖机型硬编码。官方微信页面本轮未能取得正文，因此这里不把接口兼容版本写成已核实事实。

Cocos 3.8官方SafeArea文档说明该组件经 `sys.getSafeAreaRect()` 和Widget调整UI节点。可以用它做设备基础安全区，但不能据此假定微信胶囊也已被扣掉；避免Cocos已避让一次、手工又加一次产生双重padding。

若平台返回屏幕坐标，先减去实际窗口相对屏幕的原点；若返回窗口坐标，直接使用。设备截图物理像素、平台逻辑像素、Canvas像素与Cocos设计单位不能混用。DPR仅在明确转换物理像素时用一次。

Web布局演示可使用CSS safe-area-inset值与模拟胶囊，但CSS只修网页不等于修好Cocos微信小游戏。

## 4. 推荐的保守排版策略

把所有输入先转换到同一个“左上为原点的窗口逻辑坐标”系。设窗口W×H，设备安全矩形S，胶囊矩形M（存在且合法），间距g=8为候选设计值。

```
contentLeft  = S.left + horizontalPadding
contentRight = S.right - horizontalPadding
contentTop   = max(S.top, M.valid ? M.bottom : S.top) + g
contentBottom = S.bottom - bottomPadding
```

此策略把核心HUD放到胶囊下方，代价是预留整行；优先换取稳健，而非勉强在胶囊旁塞标题。背景仍画满，预留区不必是黑色或实色空白。

请不要把 `statusBarHeight + safeArea.top + capsule.bottom` 相加，它们可能已经是同一原点的绝对位置。

没有可用的胶囊数据时：保留平台fallback并标注“实机参数待核”，不要猜一个统一90px就宣布完成。布局演示用本包合成fixtures验证，实际安装后必须以真实返回矩形确认。

FIXED_WIDTH、Canvas全窗口且居中、可见宽为D时，可用于校验的简式为：

```
k = D / W
xDesign = (xWindow - W/2) * k
yDesign = (H/2 - yWindow) * k
```

这不是无条件通用代码。若存在浏览器容器、窗口原点偏移、Canvas缩放或相机变化，以真实节点转换和viewport为准；用四角点做一次对照。重新布局在首次有效读取和窗口/安全区变化时触发，不在每帧反复调用平台API。

## 5. 设计数据与状态

`viewport-fixtures.json`中的safeArea、capsule均为合成测试值；没有任何一个被当作用户机型的真值。

每个fixture检查：
- 所有关键文字/按钮的矩形均在S内；热区与M扩展8单位后的矩形不相交。
- 底部主按钮高于S.bottom并保留间距；不要强制把整个scene挤进安全矩形。
- 长队友名、256兵、刀Ⅲ、觉醒6秒、Boss名+血条可同时排下。
- 短屏优先压缩装饰和空白，再重排二级状态；不缩成难读小字。
- 角色、门、近战区保持当前世界尺度；HUD不得盖住即将进入交战的目标。

如果World标签碰撞：只在屏幕层有限移动标签，保留所属对象关联，先让损失和血条可见。不要为了消除标签交叠更改敌人坐标、武器长度或伤害判定。

## 6. Codex接入点

现有文件：
- `assets/scripts/Game.ts`：页面、动态文本、手动Hit区域；主要接入点。
- `assets/scripts/Platform.ts`：现有平台边界；可新增只读布局指标获取，不影响音效与存档。
- `assets/scripts/BattleView.ts`：对象上方精锐/血条/损失文字及成长表现；仅改UI呈现。
- `assets/scripts/core/campaignData.ts`：现有文案与路线；保持游戏内容。
- `assets/scripts/core/battleNotices.ts`：反馈优先级与寿命；设计阶段不改逻辑。

可建议新增 `ui/UiLayout.ts`、`ui/UiTheme.ts`、`ui/HudView.ts` 等小模块，但不要为了这次换皮做全面架构重写。模块名是建议，不是已经存在的文件。

禁止改动：core/model、weapon伤害/接触规则、Volley伤害与起点、WorldScenery世界运动、存档/奖励/解锁语义。无法在不改世界投影的前提下达成布局时，列明冲突让产品确认，不偷偷挪人。

## 7. 资源与验收预算

本版仓库报告的微信预览总包为20,803,961字节，并记录曾因包过大预览失败。这是该次报告的事实，不在此将“20MB”写成所有版本通用规则。不要为一页首页增加几MB纹理。优先替换、合图、小九宫格、矢量边角及已有肖像；高分辨率设计稿留在docs，不进assets。

设计交付：静态矩形/层级/最拥挤状态检查，无需运行游戏测试。
接入后：现有快速检查仅跑受影响部分；一次界面状态巡检、短暂停/继续/整备/返回流程；一段战斗HUD短录像；最终手机截图含系统遮挡层。无需为UI重复生成完整230秒三关视频或默认十局长测。

要分别报告设计稿通过、Cocos布局检查、当前微信预览生成、用户手机确认。只生成设计稿时不得说“刘海问题已修复”。
