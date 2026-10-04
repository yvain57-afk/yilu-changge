# 战斗观感实证采集（仅工具）

本目录从上一轮已经工作的 Cocos 实证工具增量复用。所有浏览器使用独立上下文、游戏的隔离 memory-store，不接触玩家正式存档。

## 构建和运行

- `python3 tools/battle-feel-20261004/build-web.py`：版本 0.12.6 / 2026100401，输出 `build/battle-feel-web`。**只能由主代理在源码稳定后执行，Cocos 导出不得并行。**
- `node tools/battle-feel-20261004/serve.mjs`：新构建 43219；review 页面指向 `deliverables/BATTLE-FEEL-20261004`。旧 43218 保留为 0.12.5 基线。

## 同状态截图

`YILU_FEEL_URL=http://127.0.0.1:43219/ YILU_FEEL_EVIDENCE=evidence/BATTLE-FEEL-20261004/after YILU_EXPECT_FINGERPRINT=实际新指纹 node tools/battle-feel-20261004/fixed-state.mjs after`

第 17 关、方天画戟一阶、惊帆、吕布/马超、貂蝉、太平要术/护心镜、seed 71、402×874、站定输入。真实 Cocos 中推进 4/6/8/10 秒后暂停。属于同初始条件与精确 tick 的控制样段，不是自然录像；对应 `before/pixels/before-fixed-{4,6,8,10}s.png/json`。

## 原速连续战斗

`YILU_FEEL_URL=http://127.0.0.1:43219/ YILU_FEEL_EVIDENCE=evidence/BATTLE-FEEL-20261004/after YILU_EXPECT_FINGERPRINT=实际新指纹 node tools/battle-feel-20261004/runtime-course.mjs normal 35 after`

正常实际 route，只输入当前可见状态的移动策略，无补血/无敌/改路线/伤害注入/时间加速。记录身体帧、位姿、非致命 HP 变化、死亡事件、真实出手损耗。Playwright 视频静音，不作为听觉证据，也不是人手或手机性能。

`python3 tools/battle-feel-20261004/analyze-runtime.py evidence/BATTLE-FEEL-20261004/after/after-normal-record.json`

分析产出是样本计数，不能替代看片验收。截图和 JSON 自带真实构建指纹，不将旧片重标为新版本。

## 基线复用

`evidence/BATTLE-FEEL-20261004/before/provenance.json` 保存上一轮 0.12.5 的已绑定构建、源码指纹、原始连续片 SHA、截取 35 秒过程、7 组实际截图来源。更严格的 4/6/8/10 秒同状态截图为本轮在旧构建实时新增。`before-targeted/` 是为新诊断字段追加的一段原速采样，不是第二遍长测。

`workspace-before.json` 记录本轮开始时 HEAD/branch/全部 dirty 条目和 696 份游戏源码/资源/原生入口/测试的字节 SHA。不要回退既有 dirty，不能将未提交等同未保护。

## 试玩服务恢复（2026-10-04）

43219 原服务随临时命令退出，造成连接被拒绝；游戏构建未丢失。已改为当前登录会话的 launchd 作业 `com.yvainair.yilu.battle-feel-preview`，独立于聊天命令运行。`serve.mjs` 以自身路径解析项目根，不再依赖调用目录。只监听127.0.0.1，不新增公网访问。

- 状态：`launchctl list com.yvainair.yilu.battle-feel-preview`
- 日志：`.cache/battle-feel-preview/server.log` 和 `server.err.log`
- 停止：`launchctl remove com.yvainair.yilu.battle-feel-preview`
- 注销或重启后需重新启动；未设置永久登录启动项。
- 本次确认端口、首页、引擎脚本、配置、核验页及录像HTTP返回正常；浏览器自动访问被工具安全策略拦截，未重新声称交互实测通过。原运行证据保持原版本。
