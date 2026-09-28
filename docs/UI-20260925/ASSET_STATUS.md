# UI-20260925 资源逐项盘点

源包42项是生产计划，不包含完成运行美术。以下区分现有资源复用、待修改组件与新作独立素材；status不是最终视觉验收。来源PNG和运行图均与UI文字、热区分离。不引入第三方字体或授权不明素材。

|assetId|决策|现有/源路径|最终/候选路径|缺口与实际状态|
|---|---|---|---|---|
|home-bg-far|create|art-source/ui20260925/home-bg-original-249dd1b4ab40.png|assets/resources/ui20260925/home-bg.jpg|已导入；真实构建画面待验|
|home-bg-mid|create|暂无独立透明层|待定|当前home-bg若为合成远中近景，只能算一张静态背景；分层视差未完成|
|home-bg-near|create|暂无独立透明层|待定|当前home-bg若为合成远中近景，只能算一张静态背景；分层视差未完成|
|hero-home|create|art-source/ui20260925/hero-home-original-d6ec215d08e2.png|assets/resources/ui20260925/hero-home.png|已导入；真实构建画面待验|
|brand-title|create|art-source/ui20260925/brand-title-original-91914250bc0f.png|assets/resources/ui20260925/brand-title.png|已导入；真实构建画面待验|
|map-bg|create|art-source/ui20260925/map-bg-original-cc9c82b26fb6.png|assets/resources/ui20260925/map-bg.jpg|已导入；真实构建画面待验|
|map-scroll|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|map-node-current|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|map-node-cleared|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|map-node-locked|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|map-node-available|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|camp-bg|create|art-source/ui20260925/camp-bg-original-9c25f4803cad.png|assets/resources/ui20260925/camp-bg.jpg|已导入；真实构建画面待验|
|result-bg|create|art-source/ui20260925/result-bg-original-1723bb91a367.png|assets/resources/ui20260925/result-bg.jpg|已导入；真实构建画面待验|
|button-primary|create|art-source/ui20260925/gold-button-original-b5da40b581b9.png|assets/resources/ui20260925/gold-button.png|已导入；真实构建画面待验|
|button-secondary|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-panel|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-portrait-frame|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-equipment-frame|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-reward-frame|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-modal|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-selection-mark|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-lock-mark|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|ui-navigation-icons|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|portrait-set|reuse|assets/scripts/ArtSprites.ts 与 ArtAtlas*.ts|现有组件及本轮真实实现，由最终代码核对|现有身份/兵器/动作帧复用，头像裁区由呈现层约束|
|battle-actor-set|reuse|assets/scripts/ArtSprites.ts 与 ArtAtlas*.ts|现有组件及本轮真实实现，由最终代码核对|现有身份/兵器/动作帧复用，头像裁区由呈现层约束|
|weapon-icon-set|reuse|assets/scripts/ArtSprites.ts 与 ArtAtlas*.ts|现有组件及本轮真实实现，由最终代码核对|现有身份/兵器/动作帧复用，头像裁区由呈现层约束|
|reward-icon-set|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|road-tile|modify|assets/scripts/WorldScenery.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|roadside-set|modify|assets/scripts/WorldScenery.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|actual-divider-set|modify|assets/scripts/WorldScenery.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|gate-posts|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|gate-face-positive|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|gate-face-negative|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|gate-face-neutral|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|gate-symbol-set|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|continuous-one-gate|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|reward-box-body-set|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|box-type-icons|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|projectile-set|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|hit-and-reward-fx|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|shadow-set|modify|assets/scripts/WorldScenery.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
|result-title-set|modify|assets/scripts/Game.ts / BattleView.ts|现有组件及本轮真实实现，由最终代码核对|已有引擎图形/文字组件；本轮视觉修改与合格状态由父级实际截图核验，不能按ID声称新贴图已制作|
