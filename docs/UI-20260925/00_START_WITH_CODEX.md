# UI-20260925 当前交付入口

先读 REALITY_MAP.md、CHANGELOG.md、KNOWN_GAPS.md，再看 BUILD_ID.json 与 REVIEW_RESULTS.json。用户开发包原文保留在 source-pack/，不把其未运行的提案当成已经完成的产物。

这是当前本地未提交工作树的快照，不是 GitHub HEAD 或已发布微信版本。保留全部原有核心玩法与存档键；不要恢复固定倍增选门、难易分路或音乐，不要回滚未提交修改。

预构建 Web 无需 npm install 或 Cocos：在解压工程根目录运行 `PORT=43197 node tools/serve.mjs`，访问 `http://127.0.0.1:43197/play/`，核验页为 `/review/UI-20260925/`。若端口被占用，改 PORT；不要终止未知进程。Mac可双击“启动一路长歌.command”。

开发需 npm ci、Cocos Creator 3.8.8。相关检查：npm run check:v09（71项，已更新20px侧边/48px热区和保存真实返回契约）；npx tsx --test tests/ui20260925-save.test.ts（5项）；npm run build:web / build:wechat。新素材工具会校验独立manifest；已有图集使用帧及4px边界不可有损改动。

本轮自然流程与独立夹具证据分开。不要用 fixtureState 跳关录像冒充自然通关。未完成素材与实体手机条目不能改成pass；已有自然录像与短片复用，不默认十局。

共享包内微信project.config.json AppID留空；本地原配置未改。微信重建需自己的已核实本地游戏身份，不能换tourist或其他业务AppID，也不要从共享说明推断上传/发布授权。
