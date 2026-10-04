# TestFlight 0.12.8 更新实际结果

**最新安装事实（19:53）：TestFlight 新版可见，但无法安装。** 实体 iPhone 实际回读仍为 0.12.5 /2026100304。Console 捕获失败发生在 `Downloading Install Data`，返回 `Error Downloading Install Data`，尚未下载或安装新版；详情见 [INSTALL-DIAGNOSIS.md](INSTALL-DIAGNOSIS.md)。邀请接受与后台测试状态不代表安装成功。下方构建、上传和邀请事实仍有效。

2026-10-04：已提交并推送正式源代码，Release Archive 与 App Store Connect 上传成功；Apple 处理完成，内部“开发自测”组的 **0.12.8（2026100403）正在测试**。外部“朋友体验”组尚未加入新版，Beta 审核未提交成功。

| 项目 | 实际结果 |
|---|---|
| 游戏源提交 | `e0e88e931de2d58283aa22937ad1a47a6b2b23c3` |
| GitHub | [草稿 PR #4](https://github.com/yvain57-afk/yilu-changge/pull/4)，分支 `codex/ios-polish-round2-20260929` 已推送；没有合并 main |
| 当前游戏代码指纹 | `0f9797bb89081d2980e7d59794eef69108bc18c22bc169daf69f97a6512a221c` |
| 原生 | Release Archive 成功，严格签名检查通过；包内指纹与两首音乐 PCM 哈希与源资源一致 |
| Apple 上传 | 2026-10-04 18:53:55（北京时间）Upload succeeded / EXPORT SUCCEEDED |
| App | 一路长歌，ASC App ID `6818429253`，bundle `com.yvainair.yiluchangge` |
| 后台 build ID | `5e72372d-ab74-4ad7-9c8d-6506b0b0db9a` |
| 内部组 | 开发自测：1 个既有测试员、2 个构建；新旧均正在测试。未删除或设为过期 |
| 外部组 | 朋友体验：0 个测试员、0 个构建。Apple 返回通用请求处理错误，不能写成等待审核或已开放 |
| 测试说明 | 新构建测试内容和 Beta 审核备注已保存，正确对应 0.12.8 |

## 本次包含和验证

775 个文件约 303 MiB 的提交包含实际源代码、资源、测试、构建与核验工具、必要资源制作来源，以及最近首页/箭雨、交战减员和音乐交付物。二十关、13 类页面、已认可规则、兵器音效与玩家存档保留。此前大体积历史原始录像、私有配置、签名和备份留在本机，没有公开上传。没有 reset/stash/clean，没有安装或卸载手机 App，没有触发手机摄像头。

TypeScript 检查通过；本次全库 452 通过、1 失败、0 跳过。失败为 `tests/ios-playable.test.ts` 的模型时长下限：第2关87.8秒对90秒、第11关108.75秒对110秒；同一模型检查的通关条件通过。本次发布不改已认可数值，不删除失败测试。此前38项音乐/首页专项记录保留，未冒充本次新增真机验收。

## 明确待验与阻塞

- 原生音乐实际发声尚未通过：此前 Cocos 进程录音全静音，播放器进度/音量正常；音乐文件试听不能替代 iPhone 听验。请在 TestFlight 重点听菜单/战斗、开关/音量、暂停/后台恢复。
- 真实设备触控、帧率、发热、高兵力可读性及整体视觉仍需实际体验。
- 上传成功但崩溃符号上传警告：上传时 CocosGame 缺少 dSYM。后续 dsymutil 虽产生相同 UUID `25787A6E-349E-3E74-999D-B8DFE4FF584C`，却明确提示 no debug symbols；不把空符号包算作修复。影响崩溃定位，不阻断内部 TestFlight 安装。
- 外部 Beta 审核两次分别通过构建详情与群组入口提交：首轮失败后核对实际组仍0构建，更新过期0.12.2审核备注为当前0.12.8，再经组入口提交，仍同一通用错误。UI没有暴露具体原因；停止无信息重复提交。没有接受新协议、启用新增权限或群发邀请。

## iPhone 使用

打开 TestFlight → 一路长歌 → 更新。应显示 **0.12.8（2026100403）**；若列表仍旧，可在 App 详情“之前的构建版本”中选该版本。19:38 后用户反馈手机列表没有本 App。后台确认原邀请仍未接受，已通过原内部测试员“重新邀请”重发；用户随后明确回复“已接受，看到一路长歌了”，后台刷新实际回读“已接受 / 2026年10月4日”。本 App 已在用户 TestFlight 列表可见，安装和实际游玩尚未确认。不要卸载清档。平台可测试不代表用户已经安装。

## 可复核证据

- `upload-receipt.json`、`archive-verification.json`：版本/指纹/签名/音乐/平台状态。
- 本地 `evidence/TESTFLIGHT-20261004/testflight-internal-0.12.8.pdf` 与 PNG：Safari 对实际 Apple 内部组页面的导出/渲染，清晰显示新版本“正在测试”，不是重建页面。
- 本地 `evidence/TESTFLIGHT-20261004/testflight-external-error-0.12.8.pdf` 与 PNG：第二次审核提交错误页面。
- 本地 `archive.log`、`upload.log`、`tests.log`、`typecheck.log`：实际命令记录。签名与 Apple 原始分发诊断不公开上传。
- 本地 Archive：`release/testflight-20261004/Yilu-0.12.8-2026100403.xcarchive`。

此次只交付 TestFlight 测试版本；没有提交 App Store 生产审核，没有合并 main。下方 GitHub 回执与 MCP 最终快照用于复核相同代码指纹，不替代手机验收。

内部邀请接受的本地实际页面导出：`evidence/TESTFLIGHT-20261004/testflight-invitation-accepted-20261004.pdf` 及 PNG。含测试员身份，仅本地保留，不上传公共 GitHub。
