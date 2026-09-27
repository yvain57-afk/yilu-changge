# PR2 独立审阅修复版

版本 `formal-pr2-fix-20260927.2`；基线 `c6aa92cf26b22a6682099c26e9203b70b6d14f6f`；PR #2 继续草稿。不合并 main，不宣称产品/真机/全部美术完成。

## 先看实际交付

- [可玩 Web ZIP](playable-web.zip)：解压后在 `web-mobile` 目录运行 `python3 -m http.server 8765`，浏览器打开 localhost:8765。不可直接双击HTML运行Cocos。
- [核验小包](PR2-review-small.zip)：包含实图、视频文件、JSON及必要源码，非仅路径清单。
- [实际对照与录像页](../../evidence/PR2-FIX-20260927/index.html)
- [原速连续十关](../../evidence/PR2-FIX-20260927/natural-ten.mp4) / [十关结果](../../evidence/PR2-FIX-20260927/natural-ten-result.json)
- [第四关自然交锋至结算短片](../../evidence/PR2-FIX-20260927/chapter4-natural.mp4)
- [名将动作专项原速片](../../evidence/PR2-FIX-20260927/officer-fixture.mp4)：明确夹具，5兵、单许褚，初始化之后不改HP；不是自然整关。
- [地图/人物/配装/失败/重试片](../../evidence/PR2-FIX-20260927/flow-fixtures.mp4)：明确完成存档与负门夹具，真实Cocos按钮、重试及重载。
- [构建指纹与逐文件SHA256](../../evidence/PR2-FIX-20260927/BUILD_ID.json)

## 实际修复

| 审阅项 | 修前 | 修后与证据 |
|---|---|---|
| F1 名将接触 | 满18HP许褚接触即dead，己方30→29 | 仍18HP、存活、30兵，触发独立交锋；攻击才能败北。 |
| F2 离屏与收服 | 名将可离屏移除，结算不核对战胜事实 | 错过仍保留接战；正式战斗记录defeatedOfficerIds和defeatedBossId，结算核对；表内特例明确破阵归附。 |
| F3 实际战损 | 2兵过−12，七星灯+5，华佗错按12治疗，最终9 | 实损2单独入账，灯+5，华佗+1，最终6；冷却/青囊/连续伤害/终局败北均测。 |
| F4 额外命中 | 穿透1先命中兵后仍让Boss100→97；越过Boss也可伤害 | 同一预算及交点排序，两例Boss均100；穿透2允许两次正常命中。 |
| D1 关卡内容 | 同83/23墙段与通用Boss循环 | 四势力不同墙/门/补给位置；张角夹击、吕布双波、周瑜换阵。 |
| D2 地图与人物 | 两列关卡按钮、人物文字列表 | 区域路线/节点/雾层/解锁印/奖励选择，未知人物剪影，详情/典故/获得条件/配装与保存。 |
| D3 美术与动作 | 多名将无独立出招、缺肖像、随军默认枪波 | 27名将动作、9肖像接入；吕布典韦实际双戟波；骑乘握柄锚点修正。仍有明确未完成资源，见下。 |

正式场景修前/修后五个夹具在 `before-regression.json` / `after-regression.json`。这是在真实Cocos组件中调用生产更新、原生绘制的定向证据，不伪装自然游戏里刚好发生过的碰撞。

## 验证及边界

- 全库249项通过，类型检查通过；九项新增回归覆盖F1–F4、四势力路线、三首领模式及双戟实际出弹。
- 实际Cocos五组缺陷夹具通过，360×640 / 390×844 / 430×932地图、详情、配装重载通过。
- Web与微信本地构建通过。微信包压缩后14,114,952字节，低于项目20MiB预算；调色板压缩有色差，未冒称像素一致。
- 自然录像使用隔离新档和外部触控脚本，未注入兵力/HP/胜利/进度；“自然”指合法输入连续流程，不指真人试玩。无BGM，视频为静音画布采集，不作为声音验收。分享版完整录像与自然短片转为390×844、30fps，按时间戳采样，没有改变播放速度；原780×1688 WebM保留本机。
- 首次连续录制到第7关停在已胜利画面，存档已结算；独立结算定向复测正常，未确认首轮停住根因。失败结果保留在 `failed-recording-1/natural-ten-result.json`，不能掩盖或作为通过证据。最终独立浏览器复录10/10通关、同档重载一致、无捕获到的页面/引擎错误，总长约460秒。单独结算夹具也通过；这些结果不能反推首轮停顿根因已找到。最终结果以根目录 `natural-ten-result.json` 为准。
- 录像各关结算窗口帧率约33–53fps（桌面浏览器录制条件），未宣称稳定60fps或手机性能达标。
- 微信开发者工具启动/预览、至少一台手机的触控、安全区、声音、切后台和持续性能：**未完成**；本轮没有平台或真机通过回执。

## 明确未完成

详读 [逐项素材/动作状态](ART_STATUS.md)，其中保留两次具体制作失败稿：六兵器跑步朝向不连续/单刀变双刀；九统帅献械稿冠顶截断/双戟合并。它们没有进入运行资源。主将攻击中间帧、部分角色专属技能、骑乘手指与兵器的遮挡绘制仍未完成，不能全部归为审美验收。

[五项旧失败解释](LEGACY_TESTS.md) / [本轮规则补充](RULES_DELTA.md) / [原始独立审阅包](audit/README.md)。原包断言证明旧缺陷，不是修后绿灯脚本。认可视觉基线与旧存档未覆盖。

## 复现命令

```sh
npm test
npm run typecheck
YILU_EVIDENCE_DIR=evidence/PR2-FIX-20260927 npm run build:web
PORT=43207 node tools/serve.mjs
# 另一个终端：
YILU_URL=http://127.0.0.1:43207/play/ YILU_EVIDENCE_DIR=evidence/PR2-FIX-20260927 node tools/pr2-regression.mjs after
YILU_EVIDENCE_DIR=evidence/PR2-FIX-20260927 node_modules/.bin/tsx tools/formal-model-check.ts
YILU_URL=http://127.0.0.1:43207/play/ YILU_EVIDENCE_DIR=evidence/PR2-FIX-20260927 node tools/pr2-ui-check.mjs
```

构建需Cocos Creator 3.8.8；浏览器证据脚本使用本机Chrome和Playwright。不要把测试存档写入玩家真实浏览器资料目录。开发源码及全部资源在PR分支，Web ZIP只是可运行产物。
