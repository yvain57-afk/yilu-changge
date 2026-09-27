# 《一路长歌：三国》UI-01 设计交付

已完成「轻量三国军阵」一套设计。依据附件两张用户原图，首页突出既有主将与单一出征入口，战斗改为墨青旗签 HUD，统一世界标签；兵力、武器、随军与觉醒均保留原语义。

**这是高保真设计与交互演示交付，尚未接入 Cocos，也不是新的微信手机预览。** 游戏基线为 `7ee7685e4bcb4fb7aa67284e7b56692826b86675`；本次没有更改游戏源码、玩法、存档或音乐。

## 直接查看

解压后双击 `index.html`：单文件离线演示，图片已内嵌，无需安装依赖，无外网请求。可切换首页、普通战斗、Boss 与觉醒，以及短屏、平台遮挡和压力状态。侧栏是设计工具，不属于游戏界面。

- `exports/overview.png`：四个核心画面总览。
- `exports/H01-home-*.png`、`B01-run-*.png`、`B02-boss-*.png`、`B03-awaken-*.png`：390×844 干净稿与平台层稿。
- `exports/short-home-*.png`、`short-awaken-*.png`：360×640。
- `exports/941x2048-home.png`、`941x2048-run.png`：用户原图比例复核；平台数据仍为合成值。
- `exports/standby-and-long-loss.png`、`new-save-failure.png`、`pending-rally.png`：补充状态。
- `COMPONENTS.svg` / `exports/components.png`：共用组件。

## 编辑与接入

- `source/design.js`：可编辑布局、色值、图标和文案；40份 `source/*.svg` 可分层编辑文本与矢量 UI。场景层是引擎原画面，不是重绘角色。
- `DESIGN_SPEC.md`、`specs/tokens.json`、`specs/layouts.json`、`specs/dynamic-states.json`：尺寸、字体、锚点、热区、动态状态。
- **`CODEX_UI_HANDOFF.md`**：逐项映射现有行为、坐标转换、世界标签接入边界与最少验证。
- `runtime-ui/`：可选九宫格和首页渐变，两张 PNG 合计 2,231 字节。其它高清图及 HTML 只用于沟通，不进小游戏包。
- `source-brief/`：附件原始材料，含两张用户截图。

SVG 使用系统字体回退，不包含字体文件。换机器/编辑器后须检查文字宽度；未创建 Figma 云文件。

## 验证与边界

`specs/layout-validation.json`：60组布局/状态检查无失败；包含5个合成视口×4画面、32组兵力/随军压力状态、8组首页存档分支与保存失败状态。核心画面检查字形矩形、44最小热区、热区相交、平台胶囊8单位留白、安全区、世界关键角色区域及标签相交。压力检查范围见各条记录，不代表无限状态穷举。

`specs/prototype-checks.json`：觉醒示意六秒结束、设置开关和暂停演示通过。`specs/world-captures.json`：16张原引擎场景提取记录；战斗世界位置和尺度未改。离线演示导出无页面错误、无 HTTP 请求。

仍待接入：采集实际小游戏窗口/安全区/胶囊参数，将渲染与点击统一到同一布局结果，接入随世界运动的标签避让，进行一次短 UI 巡检及手机截图验收。本次不重复三关录像或历史十局长测。

## 开发者复现

直接查看不需要 Node。修改生成器时，从原游戏仓库根目录依次运行：

```sh
node docs/ui-design/tools/components.mjs
node docs/ui-design/tools/build-design.mjs
node docs/ui-design/tools/export-design.mjs
node docs/ui-design/tools/export-extras.mjs
```

导出脚本使用仓库现有 `playwright` 和本机 Chrome；提取底图脚本另依赖现有游戏预览服务。无需重新提取底图即可编辑 UI。可选本地服务：`node docs/ui-design/tools/start.mjs`，访问 `http://127.0.0.1:43188/`。
