# UI-FINAL 操作说明

本轮为 **0.12.2 / 2026100103** 隔离开发构建，13类真实非战斗页面已经接入。手机仍为 **0.12.1 / 2026100102 FIX_ONLY**；未覆盖安装，未提交、推送或发布。

1. 当前 Mac 直接打开 http://127.0.0.1:43214/review.html 。各入口进入实际 Cocos 场景，可以点击、拖动、出征；验收入口用内存存档，不把示范配装写进玩家存档。正常新游戏入口是 http://127.0.0.1:43214/ 。
2. 服务停止后，在项目根运行 `python3 -m http.server 43214 --bind 127.0.0.1 --directory build/ui-full-web`。Web 构建压缩包解压后，以其目录作为 `--directory` 即可。不要双击 `index.html` 当作完整游戏启动。
3. [index.html](index.html) 包含实际截图、9组同状态旧/新布局、连续页面操作视频和第11关连弩专项视频。每页的数据、交互、小屏情况见 [UI-PAGES.md](UI-PAGES.md)。前后截图是同构建的旧布局兼容模式与新布局，不是归档旧手机二进制与新版手机实录。
4. `CocosGame-UI-FINAL-unsigned.zip` 是实际 arm64 iOS Release `.app`，未签名、未安装，不能直接发给手机点击安装。Xcode 工程在 `build/ios-ui-final/proj/一路长歌.xcodeproj`。修复版真机专项未通过前，保持当前手机包。
5. 重建独立原生包：`python3 tools/build-ios.py --device --release --output-name ios-ui-final --version 0.12.2 --build-number 2026100103 --evidence-dir evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001/ui-continuation/native`。这条命令不签名、不安装、不上传。实际构建使用项目局部 `.cache/regression-import-tmp` 的 `TMPDIR`。

两个新视频均为浏览器系统录像原速转换，未快进，没有音轨；不是可听证据或 iPhone 验收。此前用户提供的偃月刀手机录像继续单独保留，不替代主将连弩专项。

明确未完成：手机版主将连弩触控/升阶/密集箱门/后台恢复与性能；新骑乘弩、弓、双持姿态的独立马腿循环和蓄势/出手/收势身体帧；两相步态的中间过渡；部分旧人物完整新立绘；降低动态的持久化。上述资源已做双手点拟合与正式 WebGL 对照，不能把映射矩阵算作所有动作视觉完成。总体验收未通过。
