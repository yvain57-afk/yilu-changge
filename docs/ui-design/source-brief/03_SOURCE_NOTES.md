# 来源与版本

## 用户材料

两张用户手机截图：IMG_4072.PNG（首页）与IMG_4073.PNG（战斗）。本包原样复制为references中的original文件，各941×2048；注释图仅覆盖标注框与说明，不改变原始文件。

截图中动态状态：第二关、兵力24、行路10%、枪Ⅰ、邢道荣随军；首页显示当前领队。截图能证明UI遮挡与该瞬间的排版，不证明游戏整体美术通过、手机性能通过或教程常驻。

## 已读取的仓库

仓库：yvain57-afk/yilu-changge
阅读提交：7ee7685e4bcb4fb7aa67284e7b56692826b86675
版本入口：v0.5.1-rc1

- docs/GPT_START_HERE.md
  https://github.com/yvain57-afk/yilu-changge/blob/7ee7685e4bcb4fb7aa67284e7b56692826b86675/docs/GPT_START_HERE.md
- docs/v051/GPT_REVIEW.md
  https://github.com/yvain57-afk/yilu-changge/blob/7ee7685e4bcb4fb7aa67284e7b56692826b86675/docs/v051/GPT_REVIEW.md
- assets/scripts/Game.ts
  https://github.com/yvain57-afk/yilu-changge/blob/7ee7685e4bcb4fb7aa67284e7b56692826b86675/assets/scripts/Game.ts
- assets/scripts/Platform.ts
  https://github.com/yvain57-afk/yilu-changge/blob/7ee7685e4bcb4fb7aa67284e7b56692826b86675/assets/scripts/Platform.ts

源码说明了FIXED_WIDTH、通栏双边框、固定UI坐标、状态文本、各按钮的实际行为。报告说明当前已完成的三关、接触、齐射、关闭音乐、微信预览及包体压力。报告中的自动检查不能覆盖本次用户截图已经显示的遮挡缺陷。

## 外部技术资料（仅用于安全区附录）

Cocos 3.8 SafeArea官方文档，本轮已读取：
https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/safearea.html
文档支持：用sys.getSafeAreaRect和Widget适配设备安全区域。文档不能单独证明微信胶囊已避让。

以下官方微信页面本轮无法读取正文，只留给后续Codex按本地SDK核对，不声称已验证其版本兼容性：
https://developers.weixin.qq.com/minigame/dev/api/base/system/wx.getWindowInfo.html
https://developers.weixin.qq.com/minigame/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html

## 提案与事实的界限

视觉方向、配色、尺寸起点、HUD72–88逻辑单位、44单位热区、128KiB资源目标均为本轮设计建议，不是原项目验收事实或平台硬性规格。
viewport-fixtures.json是合成压力条件，不是任何手机型号的实测数据。
本包未运行当前游戏、未改仓库、未上传微信预览，也没有宣称完成UI重设计。

## 建议读取顺序与预算

设计agent：先00、01和两张原图，再按需看02；别通读历史策划/课程库/全部战斗源码。
Codex：接设计产物时看CODEX_UI_HANDOFF及02，再读取受影响的现有UI模块。
只返回必要的变化与失败日志，完整素材与测试留在工程中，不每轮重复发送大录像。
