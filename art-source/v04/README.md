# v0.4 资产生产记录

使用本机内置 `image_gen`，未调用付费 CLI/API 回退。原文件存于本目录，运行副本在 `assets/resources/v04/`。没有覆盖 v031 图集。

- `spear-hero.png`：1536×1024 RGBA，3 阶段 × 4 上身姿态，沿用认可的蓝色识别布料和束发；下身继续使用 v031 六帧。
- `spear.png`：1254×1254 RGBA，独立枪层。UV、枪握点与枪尖、人物上身切片见 manifest.json；实际装配坐标见 BattleView.hero。
- `zhaoyun.png`：1254×1254 RGBA，原创会面人物，只用于对白，不加入战斗。
- 三张贴图 alpha 最小值均为 0。实际明亮道路、较暗营地中已检查，无背景矩形。生成图片透明区仍保留 RGB 信息，查看器忽略 alpha 时会显示原 RGB；引擎正确按 alpha 合成。

## 工具提示词

主将（参考 `assets/resources/v031/archers.png`）：

Create a production sprite sheet for this existing 2D game. Reference preserves same approved youthful male face/hair tied dark brown topknot, blue fabric and bold outlined warm painterly chibi style. TRUE transparent RGBA background, no colored backdrop no shadow rectangles no checkerboard painted in. 1536x1024 landscape sheet, exactly 4 columns x 3 rows equal grid cells with large transparent margins. Each row same hero stage: row1 blue scarf white tunic leather; row2 blue short cloak modest shoulder armor; row3 blue teal short cape gold shoulder plates. Each column exact pose: 1 holding stance; 2 windup hands withdrawn; 3 thrust arms extended forward UP SCREEN; 4 recovery. Back-facing slightly three-quarter overhead as reference, head at same height, waist at same height, cropped at UPPER THIGH with NO FEET OR LOWER LEGS (existing legs attached at runtime). Both arms and hands visible, hands gripping an IMAGINARY straight shaft pointing upward-right; DO NOT DRAW ANY WEAPON shaft, bow, quiver, arrows, flag or spear. Weapon supplied separate layer. All 12 torsos separate nonoverlapping. Same body scale and anchor across poses. Spear thrust gestures must clear head on character right; front hand near right shoulder extending up-right in thrust. Clean solid color shapes readable at 60 pixels. No text. Transparent empty space around all silhouettes. This is replacement upperbody art, no background scene.

透明输出复核请求：

Precise background extraction only. Keep all 12 sprites in exact existing positions and geometry, same image dimensions. REMOVE all brown black blue gradient background completely to REAL alpha=0 transparency. No new background, no checkerboard, no shadow halos. Crisp fully opaque characters, antialiased silhouette edges. Export actual transparent RGBA PNG for game sprite atlas. Do not redraw or move sprites. Transparent background essential.

独立枪：

Production game asset: one ordinary ancient Chinese infantry spear, straight wooden brown shaft with simple silver leaf blade and tiny dark red wrap under blade. Bold clean dark outline, hand painted warm cel-shaded chibi strategy game style. Vertical centered spear point UP, butt down. No hand no person no stand no text no ground no shadow. True RGBA transparent background. Square canvas 1024x1024, spear occupies center x512 and y64 to960 with shaft width about16, blade width60 length130. One independent weapon sprite for animation grip anchor, clean opaque edges.

赵云（参考同一旧图集）：

Original Zhao Yun character waist-up portrait for a Chinese Three Kingdoms mobile game. Match reference game's bold dark outlines, warm cel shading, charming simplified proportions and blue fabric palette; reference only style, this is an adult commanding general, calm kind confident expression, not a child. Face visible front three-quarter, dark hair tied in a neat topknot with blue tie, silver-white simplified lamellar armor with readable large shoulder plates and pale blue scarf. Hands relaxed, no weapon, no horse. Original design no actor likeness no commercial game imitation. Centered single character, head to waist fully in frame. 1024x1024 actual transparent RGBA background, no colored glow, no scene, no typography or name or watermark. Ready-to-use clean game dialogue portrait.

生成尺寸以实际 PNG 元数据为准；枪和赵云返回 1254×1254，运行 UV 已据此修正，未假定请求尺寸。
