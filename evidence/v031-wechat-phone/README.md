# 手机微信预览（2026-09-20）

已用当前小游戏测试号成功生成手机预览二维码。打开手机微信的“扫一扫”，扫描本地 `preview-qr.png`；优先使用登录开发者工具的同一个微信账号。实际手机启动、声音和流畅度仍待用户扫码反馈。

首次 auto_preview 返回 80051：source size 15767KB exceed max limit 4MB。通过 Cocos 3.8 的项目 Bundle 配置，将 resources 图像/音频设置为小游戏分包，未删减三关或更换素材。最终服务端回执：主包 1,839,514 字节，resources 分包 14,306,749 字节，总包 16,146,263 字节，预览成功。

修改为 settings/v2/packages/builder.json；网页与原生压缩方式保留，小游戏使用本地分包。微信 game.json 和 Cocos settings 中的分包项由引擎生成，resources 仍在启动场景前预加载。

验证：真实 Cocos 微信构建通过（退出 36）；本地包检查主包小于 4 MiB、resources/game.js 存在；微信服务器成功接受预览包并返回二维码。没有正式上传体验版或发布，没有重跑旧全量长测。

记录：package-size.json、preview-receipt.json、build-wechatgame-result.json。临时二维码与含二维码字节的完整工具回执仅留本地，不纳入 Git。

实现依据：https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/subpackage.html

补充：分包构建后刷新模拟器成功，但追加截图调用返回 `waitForAutomatorReady timeout: timeout waiting for automator response`。未据此宣称本次分包版本模拟器启动或手机运行已通过；以手机扫码实测继续确认。
