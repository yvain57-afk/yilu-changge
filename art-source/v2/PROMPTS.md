# 生成提示与修订记录

工具：built-in image_gen；2026-09-20。生成与修订均要求真 alpha；没有后期按颜色抠除背景。没有自动批准。

## 1. 背向分层候选

参考：docs/v02/concept-ab-revised.png，仅使用左侧 A。

Create a production 2D game character CUTOUT RIG PARTS ATLAS with genuinely transparent alpha background, NO checkerboard painted into image, NO beige or white background, NO cast shadows. Reference: use ONLY the left A character from the supplied design board, adult ancient Chinese male archer, 4.25 heads tall, dark indigo tied topknot, ivory sleeves, muted indigo cloth vest and sash, ochre leather bow. Small mobile game readability: bold clean painterly silhouettes, thicker limbs, no tiny ornaments. One consistent character viewed from BACK, slightly elevated camera, facing up screen away from us. All parts are isolated disconnected items for skeletal animation, NOT whole figures and NOT a sequence of frames. EXACT 4 columns x 3 rows equal grid invisible cells, transparent gutters. Row1 left to right: rear head with topknot only; cloth torso including skirt with no head arms or legs; alternate light lamellar leader torso same exact shape and size with no head arms legs; one small triangular indigo flag on straight pole. Row2: left upper arm ivory sleeve; right upper arm ivory sleeve; left forearm with hand; right forearm with hand. Row3: left full lower leg and boot; right full lower leg and boot; one large ochre recurved bow with CLEAR visible taut string; one upward-pointing arrow. Each item fully contained in its own cell centered with generous transparent margins, no text labels, no cell dividers. Arms and legs oriented vertically neutral down so pivots can rotate in game. This is ONE atlas for ONE character's back-view rig with cloth and leader torso swap. Keep volumes and brushwork coherent. True transparent PNG.

产出：1448×1086；格子间距并不完全服从等分，因此使用逐部件 UV 范围，避免跨格误裁。原图保留不改；运行锚点在 HeroRig.ts。

## 2. 正面布衣/头领对照

参考：本轮 hero-a-rig.png 与此前 concept-ab-revised.png。

Produce a transparent PNG character reference sheet with TWO full body front-view characters side by side, ONE same young adult Chinese archer, exactly identical face, dark tied topknot, body, bow and palette in both. FIRST reference supplies exact rear-view cutout costume and hairstyle; SECOND reference use ONLY A style, 4–4.5 heads adult proportion. Left is cloth hero in ivory long sleeves muted indigo scarf/vest waist sash and brown boots; right is same hero promoted to light lamellar armor with small indigo flag in off hand. Bold readable mobile game silhouette, strong small bow, painterly clean 2D cutout treatment matches rig. Friendly determined adult face, no child proportions. Front-facing standing neutral with bow on same anatomical side, full body including feet, generous padding. EXACTLY two complete figures, no text, no panels, no checker pattern, no floor or shadow. Background must have genuine alpha transparency. These are SAME character front reference for in-game back rig, not a new A/B choice.

## 3. Cocos 组装与检查修订

- 首轮原阵型会将靠边多个单位中心逐个 clamp 到同一点。改为每排整体平移，保持列间距；仅改变装饰排布，主角和规则中心不变。
- 预览计数、位置按钮上移，避免盖住 94 单位高的战斗主角。
- 使用 Cocos 实际运行原图做 alpha、脚底、部件宽度和手机视口检查，不使用旧带底色概念裁片。

## 4. 正面持弓手修正

参考：hero-a-front.png（编辑目标），hero-a-rig.png（手持关系参考）。输出：hero-a-front-v2.png。v1 原稿保留。

Edit ONLY the front-reference sheet (first image), using the rear rig (second image) to correct hand consistency. Preserve exactly this character's face, hairstyle, adult 4–4.5 head proportion, colors, painterly cutout art, cloth costume on left and same-person leader armor on right. IMPORTANT: the back-view rig holds the bow in the character's anatomical LEFT hand. Therefore BOTH FRONT-facing figures must hold the SAME bow in their anatomical LEFT hand, which appears on the VIEWER'S RIGHT side. The leader's flag is held in the anatomical RIGHT hand, appearing on the VIEWER'S LEFT side. Correct the arms/props only; do NOT mirror the entire sheet or swap the two figures. Keep full feet, generous transparent margins, genuine clean alpha background, NO shadow, NO painted checkerboard, NO text. The flag may sit in the central gutter between the two figures without overlapping either body. Two full figures with visible arm/hand grip, unchanged same identity. Preserve original style and rest of the design.
