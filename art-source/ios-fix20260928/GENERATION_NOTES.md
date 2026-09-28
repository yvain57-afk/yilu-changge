# 本轮美术生成与裁片来源

方法：会话内置 imagegen 工具，生成后查看原图、分离透明alpha、逐角色裁片并接入真实Cocos原生。未用Web页面效果图替代游戏资源。

源稿保留在本目录：hero-gait-source、attack-mid-source、derived-mid-source、crossbow-mid-source、boss-ending-source、front-additions-source、campaign-map-source、dual-parts-source，以及detail-fullbody-cutout-candidate.png。具体实际文件以目录/账本为准。

## 提示内容摘要（不是原始请求逐字记录）

- 保留已认可三国写实手绘角色风格、服饰身份、兵器类型和游戏既有视角；角色全身完整，透明背景，姿态彼此隔离，不混入邻帧。
- 主角有效跑步与四家族兵器中间攻击姿态，派生兵器身份不变；双持分层，骑乘握柄与手指遮挡可用。
- 九统帅结束姿态与胜/降/访/盟的关系保留，不把所有人画成强制投降。
- 九位缺少全身详情的人物：袁绍、华佗、貂蝉、郭嘉、荀彧、孙坚、孙权、刘备、司马懿，参考项目既有人物肖像pr2-portraits.png生成统一比例的3×3全身角色；修正版保留人物并清除背景，边缘留透明间隔。

详情源图实测角/间隔alpha=0，人物alpha非零；按明确9格完整主体裁片，不根据单一最大连通块删掉独立兵器。detail-ledger.json给出裁片与atlas坐标。

复建：先tools/ios-slice-repair.py，再tools/ios-add-assets.py，最后tools/ios-detail-assets.py。脚本生成assets/resources/formal20260927内图集与formal/manifest.ts。旧错误方向/裁断生成稿不作为可用资源；保留源稿以便追溯。

资源接入不代表全部动作视觉验收。原生30人详情、关键Boss状态已取图；全部武器/骑乘/受击转换仍在验收表中明确待验。
