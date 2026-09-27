# v0.8 完整开发包

本包是当前未提交本地工作区的完整快照，不是旧Git提交。包含全部Cocos源码和.meta、图集与源素材、settings、tests、tools、package锁文件、当前Web/微信构建、UI设计成果、附件实证包以及本版截图/原速实录/五段机制片段。旧缓存、node_modules、Git历史、个人编辑器配置、登录状态和二维码不在共享包；依赖可按锁文件安装。

## 直接试玩

解压到本地Code目录（避免iCloud、Documents/Desktop），在项目根目录执行：

```sh
PORT=43193 node tools/serve.mjs
```

需要Node.js 18+，预构建试玩不需要Cocos或npm install。打开 `http://127.0.0.1:43193/play/?v=08`，机制展示为 `/review/v08/`。这些是运行服务电脑的本机地址，不是手机公网地址。端口被占用时换一个，不要终止其他项目服务。

## 修改与验证

```sh
npm ci
npx tsx --test tests/runner-v08.test.ts tests/progression.test.ts tests/ui-v06.test.ts tests/combat-v05.test.ts
npm run typecheck:core
```

用Cocos Creator 3.8.8打开项目、完成导入生成 `temp/tsconfig.cocos.json` 后，运行 `npm run typecheck` 和 `YILU_EVIDENCE_DIR=evidence/v08 npm run build:web`。构建脚本使用macOS默认Cocos 3.8.8路径；其他系统需修改安装路径。源码修改不会自动更新预构建页面。

当前浏览器脚本依赖macOS Chrome路径与43192端口：

```sh
npx tsc -p tsconfig.core.json
npx tsc tools/v08-policy.ts --target ES2020 --module CommonJS --outDir .cache/v08-logic --skipLibCheck
PORT=43192 node tools/serve.mjs
# 另一个终端，同一项目目录
node tools/browser-v08-fixtures.mjs
node tools/browser-v08-delivery.mjs
```

录像脚本写WebM与JSON。不要把包内旧MP4当成新运行结果；`tools/encode-v08.py`按时间线转码并从同一条录像切五段，另需已录好的独立边缘风险夹具WebM。历史 npm test:browser/record:three 和旧十局不是本轮默认命令。

## 微信

共享包的 `build/wechatgame/project.config.json` AppID留空，原本机项目不受影响。接手人填写本人已确认且有权限的小游戏AppID（compileType必须game），登录微信开发者工具后再生成预览。重建先运行 `YILU_EVIDENCE_DIR=evidence/v08 npm run build:wechat`，再运行 `YILU_EVIDENCE_DIR=evidence/v08 node tools/prepare-wechat-package.mjs`。

服务端当前包体见 `evidence/v08/phone-preview.json`。接近本项目当前打包阈值，新加素材前必须重新检查；不是所有平台统一的容量保证。真机扫码和体验仍待用户完成，预览成功不等于手机验收。

## 先读什么

机制差异、数值初值与下一轮反馈：`docs/runner-video-v2/GPT_REVIEW.md`；精确摘要：`evidence/runner-video-v2/summary.json`；本包验证：`PACKAGE_VERIFICATION.json`；逐文件SHA-256：`MANIFEST.json`。

原有sharp开发依赖审计告警见前轮反馈记录；本轮没有新增依赖或自动升级依赖。不恢复音乐，不自动推送、发布或扩关。
