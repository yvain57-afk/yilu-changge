# 新战场资源接入

所有来源与运行图指纹、网格/连通域切片参数位于 `art-source/battle-rework20260925/runtime-manifest.json`。源图保留；`assets/resources/battle20260925` 仅运行资源。`tools/battle-rework-assets.mjs --check` 核验源/运行 SHA-256、meta 和全部帧边界，构建前自动调用。

`BattleAssets.load()/ready/frame(key)/meta(key)/diagnostics` 提供共享缓存。`ArtSprites.load()` 等待新战场预载，失败可重试已缺失的纹理，不重复创建已有帧。实例 `begin()` 隐藏池节点；`draw(parent,id,key,x,y,w,h,options)` 使用精确逻辑画布宽高，`drawHeight(...,height,options)` 自动使用原网格宽高比。`options` 支持 anchorX/anchorY/angle/alpha/tint/flipY；返回 Node|null。`end()` 不分配资源，`destroy()` 销毁本实例池。

人物帧先按透明边界取出，但 meta.logicalSize 始终是原网格等比缩放的画布，anchor 按原人物脚点换算。因此宽大的攻击姿态不会缩成同一 tight-bbox 宽度，脚点不会随裁片变化。英雄长兵器跨格，使用明确透明连通域种子提取；运行图需逐张目视核对枪尖。`pan` 是资源内部键，当前角色身份映射为既有陈应，不增加新人物。

道路为原图等比缩小的640平方JPEG，无绘画补像素。提供 `roadStrip00..31`（源上至下）与 `roadGrassLeft/Right`。原图首尾不一致，由道路渲染每周期交替纵向镜像、反转条带顺序，形成同端连续拼接；不把原图声称为无缝纹理。每个 SpriteFrame 与节点复用。

旧 battle 资源只通过 manifest.legacyAliases 明确换成真实新帧，编译后优化器依据相同映射释放旧 native；旧源码、atlas、原图均保留。菜单共用 cast、兵器、旗帜不改。当前新资源指纹通过不代表实际手机纹理内存或最终视觉验收；最终构建字节与自然录像由主代理追加。

最终远景道路细分：`roadFine000..127` 为同640平方 road.jpg 的128个5px水平UV条；主 `roadStrip00..31` 不变。BattleAssets.load 一次性缓存，不在每帧新建 SpriteFrame。贴图 SHA、运行图片字节及纹理内存均不变；只增加少量metadata与SpriteFrame对象。
