# 一路长歌：先修回归，再接全套UI

本包为完整实施规划，未修改游戏或安装任何版本。

**给Codex的入口：`CODEX_TASK.md`。按A修复→Gate A→B全UI→Gate B连续执行。**

- `BUG_ANALYSIS.md`：六张实测图的具体问题、已确认源码风险、未确诊触发器与13条修复项目。
- `UI_FULL_PLAN.md`：13类非战斗页面、交互状态、立体材质、布局、动画、组件和数据绑定。
- `ACCEPTANCE_PLAN.md`：复现路径、故障注入、原生节点测试、实录、真实安装与旧档保护。
- `BASELINE.json` / `SOURCE_EVIDENCE.json`：固定快照、源码指纹和证据入口。
- `BUG_REGISTER.json` / `UI_ASSET_PLAN.json` / `ACCEPTANCE_TEMPLATE.json`：可供执行追踪的机器清单，均未预填通过。
- `SCREENSHOT_MANIFEST.json` / `reference/`：六张原始问题图与一张外部立体UI参考，含hash。
- `index.html`：离线阅读入口，包含全部文档和截图。

上轮两张生成图不作为规则或数据依据：永久Lv不等于本局阶位，主将不随武器变成关羽，无貂蝉碎片/宝物等级/凭空三星连胜系统。

交接语：

> 按CODEX_TASK.md完整执行。先核对实装版本，在旧皮肤上复现并修复六图中的回归，重点检查异常帧清理、重复主将、HUD缺图、持械与拾取身份和Boss标签。Gate A真实通过后再接入13类非战斗UI；保留二十关、原存档和音效，别把换皮混进修复。独立交付修复版与UI最终版及各自真实运行证据。
