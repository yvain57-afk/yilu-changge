# 一路长歌：三国 · FORMAL-20260927

这是当前工程的真实 Cocos 十关集成测试版。交付表示可运行、可核验；不代表用户已批准最终审美或实体手机验收。

## 直接运行

- 本机当前入口：http://127.0.0.1:43207/
- 本机核验页：http://127.0.0.1:43207/evidence/FORMAL-20260927/
- 解压完整开发包后，双击根目录 `PLAY_FORMAL.command`，或执行 `python3 tools/play-formal.py`。使用现成Web构建，不需先安装npm依赖/Cocos。
- 正式开发用 Cocos Creator 3.8.8 打开工程。依赖安装 `npm ci`；打开项目使引擎生成 temp 类型后执行 `npm run typecheck`。
- `npm run build:web` 构建Web；`YILU_EVIDENCE_DIR=evidence/FORMAL-20260927 npm run build:wechat` 构建并压缩微信包。微信项目沿用本地已存在项目配置，未自动上传。
- 定向规则测试：`./node_modules/.bin/tsx --test tests/formal.test.ts`。整套旧测试还有5项接管前已存在的失败，见验收文档。

## 先看这些证据

1. `evidence/FORMAL-20260927/battle-short.mp4`：从自然十关原录像截取的连续第四关，原速。
2. `natural-ten.mp4`：完整自然新档十关，7分32秒；外部触摸自动操作，没有注入兵力、血量或胜利。
3. `final-ui-control.mp4`：最后的小屏UI与震军分支补录，使用明示的完成档和高耐久敌将夹具，不属于自然流程。
4. `comparison/*-pair.jpg`：交接最终预览→Cocos四组同状态截图，两侧PNG原图也在包内。
5. `natural-ten-result.json`：十关逐关结算、奖励、伤害/门/部曲统计与原测试存档重载结果。
6. `BUILD_ID.json` / `RECORDING_BUILD_ID.json` / `MEDIA_SOURCES.json`：最终代码、连续录像版本、片段来源。不要假设所有媒体都对应最后UI修补。

完整开发包内有源码、必要原图/切片、Web和微信构建及关键核验文件。核验包额外携带完整MP4、前三关复用片段、实际对照图及结果。接管备份、失败录像和原始WebM保留在本地证据目录，没有当作最终成功证据装进包。

## 事实与未完成项

见 `IMPLEMENTATION.md`（实际改动）、`PARAMETERS.md`（初值与规则决策）、`ART_STATUS.md`（美术边界）、`ACCEPTANCE.md`（验证与未完成）。不恢复音乐，不加账户、付费、遥测或外网游戏依赖。
