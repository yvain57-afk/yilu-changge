# UI 更新运行检查（2026-10-17）

这是正式源码的 Cocos WebGL 构建，预览入口使用独立内存存档。

```sh
python3 tools/ui-refresh-20261017/build.py
python3 -m http.server 43229 --bind 127.0.0.1 --directory build/ui-refresh-web
```

打开 http://127.0.0.1:43229/review.html 。支持切换页面、屏幕尺寸和模拟安全区，画面内按钮与滑动使用正式逻辑。

```sh
npm run typecheck
npm run test:targeted -- tests/ui-refresh.test.ts
node tools/ui-refresh-20261017/smoke.mjs
node tools/ui-refresh-20261017/interactions.mjs
```

顺序运行两条浏览器脚本以减少同时加载纹理的压力。结果、构建指纹和原始截图在 `.cache/iphone-quick/ui-integration-20261017/`。`ui-refresh.test.ts` 引入既有菜单测试，共 23 项（19 项既有 + 4 项补充），无需再次指定 r3-menu 避免重复计数。

网页检查不代表 iPhone 原生、音频或性能验收。修改源码后重新构建再检查；不要将旧图标记为新构建。

## 本轮手机版本

0.12.9 / 2026101701 已同 bundle 安装并启动。原生构建复用 `ios-music-shanhe` 输出缓存：

```sh
python3 tools/build-ios.py --device --release --output-name ios-music-shanhe --evidence-dir .cache/iphone-quick/ui-phone-20261017 --version 0.12.9 --build-number 2026101701 --team 325CW4AZ5L
python3 tools/ui-refresh-20261017/verify-package.py --device "$YILU_DEVICE_UDID"
```

安装工具为本轮固定版本，先 `--phase prepare` 新备份，再 `--phase install` 同 bundle 更新；不要复用旧备份作为下一次更新的安装前证据。当前私有存档备份必须保留；用户手机体验测试仍由本轮反馈确认。

`YILU_DEVICE_UDID` 使用当前已配对手机的标识，在本地环境提供，不写入仓库。
