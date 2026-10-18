# TestFlight 安装失败诊断（2026-10-04）

当前结论：邀请已接受、0.12.8 已显示在 TestFlight，但实际安装失败。尚未修复，不得以后台“正在测试”代替下载或安装成功。

## 本次实际核验

- 用户 19:46 截图：0.12.8（2026100403），提示“无法安装‘一路长歌’。所请求的 App 不可用或者不存在。”
- 连接实体 iPhone 16 Pro，系统 iOS 27.0；符合包内 iOS 16.0 最低版本及 arm64 / Metal 要求。
- `devicectl device info apps` 回读仍为 0.12.5 / 2026100304。
- App Store Connect 免费 App 协议“有效”，生效期 2026-10-01 至 2027-10-02。没有签署新的付费协议。
- Console 选择实体 iPhone，短暂收集安装诊断后暂停流式传输；用户重试时实际捕获以下消息。仅摘录本 App 相关内容，不收集相机画面。

## Console 消息摘录

这是实际 UI 日志转录，不是原始 logarchive。

```text
19:53:36.469739+0800 TestFlight
[com.yvainair.yiluchangge;6818429253 241088999 0.12.8 (2026100403);shouldReinstallSameVersion:NO]
installing: Starting Install: userInitiated=1 interactive=1 autoUpdate=0 cliMode=0

19:53:36.507149+0800 TestFlight
installing: Downloading Install Data

19:53:37.788949+0800 TestFlight
installing: FAILED: TFBundleInstallation for com.yvainair.yiluchangge
buildID=241088999
progressPhase=No Progress
downloadProgress=(null)
installProgress=(null)
serverFailureReason=Error Downloading Install Data
userFailureReason: errorMessage=所请求的 App 不可用或者不存在。, code=-1, serverCode=200
previousPhaseDescription=ProcessingInstallInitiateResponse
installStatusDescription=None
```

失败发生在获取安装数据阶段，未进入安装包下载及设备安装阶段。不能由该失败推断 Cocos 运行问题、旧存档损坏或设备签名冲突。

## 尚未确定的原因与下一步

外部 Beta 审核也返回通用处理错误；Apple Developer Forums 上有类似“内部安装不可用 + 外部提交失败”的 Beta contract 缺失案例：
https://developer.apple.com/forums/thread/691372

这只用于定位可能的后台原因。本账号尚未读取到 `BETA_CONTRACT_MISSING`，不能宣称已证实该原因。已准备 Apple 支持工单正文；提交需用户授权。暂不盲目重建、换 bundle、删测试员、过期旧构建或卸载游戏。

游戏源、指纹、资源、存档均未修改。TestFlight 仍阻塞；本地同版本覆盖安装仅可作为经授权的临时试玩路径，不能标记 TestFlight 修复。
