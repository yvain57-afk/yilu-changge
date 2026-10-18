# 一路长歌｜iPhone 16 Pro 真机安装记录（2026-09-29）

- Bundle ID：`com.yvainair.yiluchangge`；版本 `0.10.0 (20260928)`。
- 真机安装及启动成功，进程持续运行，首页实拍见 `home-after.png`。当前用户可在手机点“开始征程”测试；战斗触控、十关节奏和性能尚待真机实玩记录。
- 初次安装的 2026-09-28 Release 包缺少启动场景、脚本及素材，真机黑屏，见 `black-before.png`。重新导出后包含 1 个场景、57 个脚本、522 个资源，重新签名并覆盖安装后首页正常。`tools/build-ios.py` 新增导出完整性校验，防止空包继续进入 Xcode。
- 本目录的 `iPhone真机测试版.zip` 是**修复后的本机开发签名包**，ZIP CRC 通过，SHA-256：`b87849018a9fd94f060409dc822370a4010f3c3879352d4ba5459c1bab329449`。旧目录 `IOS-PLAYABLE-FIX-20260928/iPhone开发签名构建.zip` 为黑屏包，不再用于安装。
- 为腾出免费开发签名名额，按用户选择卸载了“四月喵”贴纸。卸载前通过 `devicectl` 备份其应用数据目录，目录为空；备份位置：`/Users/yvainair/Code/Codex/2026-09-29/yilu-iphone-install/siyue-app-data`。完整重建工程及贴纸素材保留在 `/Users/yvainair/Code/AprilCatStickers`。恢复“四月喵”前需先腾出一个免费签名名额。
- 本包包含开发描述文件和设备标识，仅供本机保存和测试，未上传 GitHub、TestFlight 或 App Store。
