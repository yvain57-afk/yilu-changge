# 一路长歌：三国 · iOS 第二轮表现优化

任务：`IOS-POLISH-ROUND2-20260929`。打开同目录 `index.html` 可查看实际 Cocos 原生截图、前后对照和原速短片；`REPORT.md` 记录分项结果、十关时长和待验范围。

本轮保留十关、收／访／盟、兵器、宝物、共鸣、支援和玩家存档。微信路线暂缓，未删除。原认可美术基线未修改。

## 内容

- `media/`：实际运行 PNG、对应状态 JSON、原速战斗 MP4，核验包内直接带文件。
- `verification/`：原生连续十关结果、模型对照、类型与测试日志、构建核验摘要。
- `changes/`：本轮修改的源文件、新资源及相对 `79fbea0` 的改动，供继续核查；该目录是补丁资料，不是另一份独立完整工程。
- `CocosGame-iOS-0.11.0.zip`：本地开发签名的完整 Release `.app`。用已配对 Mac 的 Xcode / `devicectl` 安装；不是点击 ZIP 即可安装的网页分发包，也没有上传 TestFlight。
- `CHANGES.md`：改动与源码定位。

固定状态截图使用隔离的内存测试存档；连续十关使用正常战斗、奖励和解锁逻辑，由 DEBUG 专用输入驱动横移与菜单操作。它证明原生集成流程，不能替代真人触屏、发热或耗电验收。Release 不开放这些测试入口。

## 本地复现

工程根目录执行：

```sh
npm run typecheck
npm test
python3 tools/build-ios.py --device --release --team <本机已有开发团队> --evidence-dir evidence/IOS-POLISH-ROUND2-20260929/rebuild
```

需要本机现有 Cocos Creator 3.8.8、Xcode 与对应设备签名。玩家数据备份保存在工程 `.cache/round2/device-save-backup/`，不随核验包外发。
