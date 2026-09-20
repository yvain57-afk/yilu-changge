# v0.3.1 动作补帧

内置 image_gen，参考 assets/resources/v3/actors.png 与 art-source/v4/heroes.png；未调用付费 API、CLI 或音乐生成服务。保留认可的蓝围巾主角、短披肩头领、肩甲统领和青衣友军。

主提示：同造型后视角 4 行×6 列六帧迈步，左右脚接触/通过/抬起姿势，上身同时给 ready/draw/release/recovery，真 RGBA；禁止换角色、加场景或文字。首图虽有透明 alpha，但行间部分接近，因此补一次间距清理，最终图为 exec-c69b15ce-10ec-4eed-baa8-faa0ecd3f8fa.png。

最终编辑提示：Preserve these exact 24 poses, identities, costumes, colors and transparency. 1536x1024, 6 columns x 4 rows. Shrink each sprite within its cell, ensure empty transparent gutters between all sprites, same row size and centered body. Clean alternate leg steps. Animation cleanup only, not redesign. Real RGBA alpha zero background.

源图 archers.png 与 assets/resources/v031/archers.png 字节一致；不改图像像素。tools/prepare-v031-atlas.mjs 仅导出 UV，按衣摆切开上身/下身，六帧步态循环与 .25 秒射击独立。城主战斗复用统领造型；旧首页/晋升肖像保留。上下身两张共享 atlas Sprite，最多96张角色 Sprite，无逐兵骨架/音频。
