# UI FULL 离线组件交接

本目录只提供阶段B所需可复用组件，不代表阶段A修复通过，也未接入任何游戏assets或构建。先由主代理通过Gate A，才允许接入正式Cocos。未改玩家、地图、兵器、宝物、规则、音效或存档。

## 已生成

13类规范组件、32个状态/独立图块（其中进度条额外分出fill/cap），一张2048×1024 RGBA图集、32张透明PNG。材质为墨蓝织物/皮革、暖金/旧青铜、暗红织物；左上光照、较厚暗底边。无数字/文字/人物姓名/假奖励。X只是错误状态图标，并非烘焙文案。

- `manifest.json`：每个ID+state的源图hash/原图裁切rect/最终hash/atlas rect/九宫格边界。
- `ui-components.png`：实际图集；`slices/`为独立可读PNG。
- `build_components.py`：可复现裁切、缩小、打包和QA。仅Pillow几何裁切/缩放/合成，不画替代美术。
- `source/`：内建image_gen原始输出。所有有效资源均在本工程内。
- `qa/contact-{dark,light,field}.jpg`：同一实际RGBA组件在三种背景上的合成检查。
- `qa/nine-slice-stretch.jpg`：真实切片算法拉伸样例，金角保持比例。

## 接入契约

1. Sprite rect使用左上起点像素坐标，无旋转；Cocos转换纹理V坐标时只转换一次。所有图块为straight RGBA；不要再把alpha乘两次。
2. `slice_margins`为**图集纹素**，left/top/right/bottom。建议图集密度2 px/逻辑单位，组件角宽由这些边界÷2决定；不是把整张图固定画成原尺寸。
3. 普通面板、卡片、按钮、tab、弹窗、奖励槽使用9-slice；横幅仅水平3段伸缩，左右尾旗固定，不纵向拉伸；奖章及4个状态图标等比fit。
4. 进度条track/fill独立绘制，fill沿当前进度裁剪或用独立9-slice宽度；小于两端宽度时裁剪，不拉歪端帽。cap是独立sprite，可不用；不要将它误当金币奖励。
5. 文本由Label渲染，置于可用内区，动态中文/数字不入图。按钮48–56逻辑高；热区至少48×48；视觉角宽随密度处理，文本另给内边距。
6. gold/navy/warning各normal、pressed、disabled是真实不同材质帧。禁用仍需由真实状态阻止点击并显示原因。selected/frame仅用于选择，不改变游戏数值。
7. 防止像素外溢：图集中每帧至少4px空隙；linear采样，关闭mipmap或对每帧扩边后再启用mipmap。禁止从一个SpriteFrame跨到邻帧。
8. 不得将本QA联系表用作整屏背景；它有QA标签，正式图集无文字。

## 检查和边界

已实际查看dark联系表与九宫格拉伸图：32个图块完整、无外来角色或文案，正常/按下/禁用可区分，长按钮/高卡片/宽面板未拉歪金角。alpha合成后无明显绿边；RGBA在查看器直接显示透明RGB时看似有色噪点，实际合成正常。原图的透明RGB未人为篡改。

自动检查32个rect均在图集内，全部九宫格边界合法；完整13家族state集合匹配任务书。`qa/checks.json`记录离线检查，runtime_verified=false。

**尚待主代理：** Gate A通过后的Cocos接入、四尺寸实际页面、真实状态驱动、触控/层级/性能以及设备视觉核验。本资源制作完成不能替代十三类页面完成。

`buttons-rejected-background.png`是首稿的历史文件名：初次查看器未正确呈现alpha导致误判，但实际RGBA合成检查证明背景alpha=0。最终采用它的同字节副本`buttons-primary.png`，首稿normal/pressed差异比第二次编辑更清楚。`buttons-key.png`是未采用的第二次编辑，保留追溯，不打入运行图集。没有调用CLI/API计费或改全局配置。
