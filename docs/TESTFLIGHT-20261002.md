# TestFlight 打包接续 · 2026-10-02

按用户“配置好，可以上传并分享一路长歌”的授权完成本地准备，未完成上传或分享。

最终归档：`/Users/yvainair/Code/Codex/2026-10-02/testflight-setup/Yilu-Prepared.xcarchive`。
版本 `0.12.2 / 2026100103`，使用已有 `build/ios-ui-final` 导出的 UI-FINAL 资源；221 文件与导出资源 SHA-256 一致，Release 归档和开发签名验证通过。未更改游戏玩法，未安装到手机。

本次改动只涉及 iOS 打包：Info.plist 的版本变量、必需 API 隐私清单与 CMake 资源成员，以及 `tools/build-ios.py --prepare-only`。CMake 重生成会清除旧 WebP/Screen 工程修复，因此必须先配置再应用准备步骤。

统一归档入口：`/Users/yvainair/Developer/iOS开发-01/Tools/TestFlight/prepare.py`，项目参数 `yilu`。归档需显式指定与资源印记一致的版本和构建号。

最新状态：Mac 曾解锁并完成后台操作，后再次自动锁屏导致 UI 停止；Safari 核实付费团队 `325CW4AZ5L`，App Store Connect 记录 `6818429253` 已创建，开发自测组含本人账户，游戏介绍和审核路径已保存。Xcode Organizer 使用云端分发签名进入上传，但停在分析文件传输；日志对应 `northamerica-1.object-storage.apple.com`。该域名当前代理路径 TLS 超时，直连 HEAD 正常返回 Apple 响应。已询问单域名代理直连例外的授权，尚未修改网络设置。命令行 export 仍为 `No Accounts`，不能据此判断已登录的 Organizer 账户不可用。尚无最终上传回执、后台可测试构建和朋友链接。

完整记录、验证和续做顺序：`/Users/yvainair/Code/Codex/2026-10-02/testflight-setup/STATUS.md`。现有真机体验验收缺口保留，不把归档或开发签名当作 TestFlight 分享成功。
