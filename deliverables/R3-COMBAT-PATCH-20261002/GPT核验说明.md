# GPT 核验本轮 R3

本地八工具协议和本轮实际图片、录像帧读取已通过。官方隧道重新启动后的动态结果见 MCP-RESULT.json。此页不证明 ChatGPT 已读到 R3，须在已连接「一路长歌 MCP」的 ChatGPT 对话实际调用工具。固定快照见 MCP-RESULT.json；以后代码发生变化时，仍用固定快照核验此候选。

可直接给 GPT 这段请求：

> 通过一路长歌 MCP，先调用 project_overview，核对 project_id=yilu-changge。读取 deliverables/R3-COMBAT-PATCH-20261002/MCP-RESULT.json 中的固定 snapshot_id，本轮代码指纹必须为 cd613377a62aeddaff93ad9dbf39e72a272ab9305294bcf848694bde87beb0e1。固定这个快照读取本轮 REPORT.md、acceptance.json、NATURAL20.md、ACTION-ASSET-RESULT.md 和 MCP-MEDIA.json，不以旧 UI 或九月报告代替。根据 MCP-MEDIA 中的实际 media ID，用 read_media 读取首页、编组、吕布/马超、密集门箱、第16关自然战斗、七兵种和骑兵命中/闪避图片；再读取原速录像预计算帧，每次最多4帧。明确区分 fixture 与 natural_play，以及自动 Cocos 操作、真人操作、原生真机。检查20/20、10次里程碑、67次敌军释放事件与5支射手死亡后继续飞行的箭、参考计时第2/8/11关失败、自动正常策略100%胜率、33个拒收资产和实体连接阻塞，是否有对应原始证据。给出已验证、失败、证据不足和下一轮最优先修复项，不因可玩或测试通过便称总验收完成。不把参考素材或静音视频当实际运行或听验。MCP不支持音频读取，本地M4A才是可听证据，未在GPT听验。

所有截图核对内嵌 runtime build 与 PNG SHA 后导入。导入记录 version basis 为 local/user_assigned，并非 PNG 自带数字签名；mcp-current-pixels-check 逐个验证了实际返回字节的 SHA。视频帧只证明相应时间点的画面，不等于 GPT 观看完整43分钟，也不证明真机性能。

完整二十关原速 MP4 约858MiB，独立交付；核验 ZIP 包含真实前后图片和原速短片，完整视频另有 SHA 和实际文件。没有上传、推送、发布或新建外部分享。
