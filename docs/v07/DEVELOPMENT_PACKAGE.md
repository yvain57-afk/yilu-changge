# 完整开发包使用说明

此包是本地当前 v0.7 完整快照，包含此前未提交的 UI、敌潮和本次射击成长改动，不是某个旧 Git 提交导出的源码。入口以 `00_START_HERE.md` 和 `docs/v07/GPT_REVIEW.md` 为准，旧文档保留用于追溯。

## 包含什么

- Cocos 项目全部 `assets/`（含 `.meta` 和场景）、`settings/`，完整 TypeScript 源码、测试、开发工具、锁文件。
- `art-source/`、`music-source/`、`references/`：原始美术、历史音频及叙事资料；存在素材不表示本版正在播放音乐。
- 当前 `build/web-mobile/` 和 `build/wechatgame/`，可立即查看浏览器版，微信产物已做历史冗余资源剔除。
- 设计规范与 UI 原始设计、v07 参考视频拆解与关键帧、v07 测试日志/报告/截图、原速三关 MP4 和节选。
- `MANIFEST.json`：逐文件 SHA-256、大小、包含/排除策略、构建版本；`PACKAGE_VERIFICATION.json`：本次独立解包验证。

不含 `.git`、`node_modules`、Cocos 生成缓存、编辑器个人配置、登录凭证、测试二维码、完整第三方视频、重复历史 ZIP、原始重复 WebM。源码与源素材完整保留，依赖可由锁文件安装。二维码单独交给用户，不发送给下一个 GPT。微信 `project.config.json` 的 AppID 在共享包内留空，原本机项目和二维码不受影响；导入时填写你已确认的小游戏 AppID。

## 立即试玩（不需要 Cocos）

解压到普通本地开发目录（本机建议 `~/Code/`），避免 Documents/Desktop/iCloud。需要 Node.js 18+，当前验证环境为 Node.js 22。

```sh
cd YILU_V07_FULL_DEV
PORT=43190 node tools/serve.mjs
```

打开 `http://127.0.0.1:43190/play/?v=07`；证据页是 `/review/v07/`。端口已占用就换空闲端口，别终止其他任务。附带的 `启动一路长歌.command` 默认用 43187，本机可能被旧版本占用；上面的显式端口命令更容易区分版本。任何 `127.0.0.1` 链接都只属于运行服务的那台电脑，不是手机公网试玩地址。

## 开发与测试

```sh
npm ci
npm test
npm run typecheck:core
```

完整游戏为 Cocos Creator **3.8.8** 项目。用 Dashboard 添加解压根目录并打开一次，生成 `temp/tsconfig.cocos.json` 和资源库后：

```sh
npm run typecheck
YILU_EVIDENCE_DIR=evidence/v07 npm run build:web
```

`tools/build.mjs` 的 Cocos 路径为 macOS 默认 3.8.8 安装位置；其他环境请调整该路径。Cocos CLI 的 36 表示完成，本项目包装脚本成功返回 0。源码变更后要重新构建，直接启动服务器仍会显示旧的预构建产物。

当前 v07 浏览器脚本使用 macOS `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` 和端口 **43189**；在其他系统调整 `tools/browser-v03-common.mjs` 的浏览器路径，端口相关入口见 `browser-v07-common.mjs`、`browser-v07-final.mjs`。运行前关闭该脚本上次的独立测试窗口，并给本次证据留副本：

```sh
npx tsc -p tsconfig.core.json
PORT=43189 node tools/serve.mjs
# 在另一个终端运行，工作目录仍为项目根目录
node tools/browser-v07-delivery.mjs
node tools/browser-v07-mobile.mjs
node tools/browser-v07-final.mjs
```

`delivery` 约需数分钟，会生成 WebM 和 JSON，不会自动把新录像转为 MP4；`final` 会检查已经存在的 34 秒 MP4，不能拿包内旧 MP4 冒充重新录制。`package.json` 的 `test:browser`、`record:three` 等早期别名仍指历史版本，**本轮请使用以上 v07 明确命令**。

## 微信重新构建 / 预览

1. 在 `build/wechatgame/project.config.json` 填入本人有权限、类型为小游戏的真实 AppID，保留 `compileType: game`。不得拿普通小程序 AppID 替代。共享包故意没有继承本机账号。
2. Cocos 资源导入完成后执行：

```sh
YILU_EVIDENCE_DIR=evidence/v07 npm run build:wechat
YILU_EVIDENCE_DIR=evidence/v07 node tools/prepare-wechat-package.mjs
```

3. 微信开发者工具导入 `build/wechatgame/`，登录并生成新的预览二维码。预览动作和审核/发布是不同操作。

当前服务端总包 20,863,691 字节，距 20 MiB 仅约 105 KiB。后续新增素材必须重新验证包体；不要跳过精简脚本，也不要删除源素材来临时压包。

## 本次交付验证

包内 `PACKAGE_VERIFICATION.json` 记录独立解包后的文件哈希、测试与可玩页面加载结果。其检查范围不包含另一台机器的 Cocos 安装、微信登录或手机实测。Git 提交、推送、正式审核及发布未执行。
