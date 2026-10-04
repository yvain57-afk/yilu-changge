from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];E=R/'evidence/R3-COMBAT-PATCH-20261002';D=R/'deliverables/R3-COMBAT-PATCH-20261002'
natural=json.loads((E/'runtime/natural20-summary.json').read_text())
targets={r['chapter']:r['target'] for r in json.loads((E/'combat/legacy-timing-current-reference.json').read_text())['rows']}
text=['# 最终真实 Cocos 连续二十关','',f"版本0.12.4 / 2026100303，代码指纹 `{natural['code_fingerprint']}`。",'',f"完整原速录像 {natural['raw_recording_seconds']:.2f} 秒（43分41秒），不是20段拼接。20/20连续首通、10次真实里程碑、奖励与页面跳转、0页面错误。正常引擎时钟；自动输入只读当前可见危险，含300ms反应延迟；隔离新档，未注入胜利、装备、军功或无敌。不是人手操作、iOS原生或手机性能验收。",'', '|关卡|实际战斗秒|原定目标秒|计时目标|发奖|', '|---|---:|---|---|---|']
for r in natural['rows']:
 lo,hi=targets[r['chapter']];met=lo<=r['simulation_seconds']<=hi
 text.append(f"|{r['chapter']}|{r['simulation_seconds']:.2f}|{lo}–{hi}|{'符合' if met else '未达'}|{r['reward_kind']} / +{r['earned_xp']}|")
text+=['','第2/11关在这次连续配装中仍低于最小时长；第8关本次105.38秒符合，但独立参考配装仍148.70秒未达。三处独立参考偏离保持失败断言，不以这次成功首通抹掉。','', '完整录像：`media/natural20-original-speed.mp4`。核验ZIP含实际前后像素和原速短片；大体积完整录像独立交付。','', '证据：`runtime/natural20-record.json`、`natural20-progress.json`、各关battle/checkpoint/settlement截图及状态JSON。']
(D/'NATURAL20.md').write_text('\n'.join(text)+'\n')
p=D/'REPORT.md';s=p.read_text()
s=s.replace('本报告是运行验证进行中的交付账本。最新0303自然二十关由主代理继续执行，第16关原速已经完成；七兵种与原生构建已取得本报告下述局部回执；尚未产生的终局结果不计通过。','最终0303已在真实Cocos场景正常时钟连续首通20/20，完成10次里程碑与全部奖励/页面跳转，0页面错误。完整原速录像43分41秒已经交付；自动走位不等于真人或真机。逐关时间见 `NATURAL20.md`。总任务仍未全绿，素材、节奏目标与设备缺口不因20/20通关转绿。')
s=s.replace('自然20正在执行；','自然20/20已完成；')
s=s.replace('最新原速 `natural20-record.json` 尚待最终产生/终局核对；第1关95.817秒胜及真实reward已回报，不以加速证据替代原速。','最新原速 `natural20-record.json` 已20/20完整终局、0页面错误、相同cd613指纹、真实10里程碑；完整原速2621.32秒。旧加速10行保留旧FP，不替代本次完整证据。')
s=s.replace('## 下一步验收账本','## 最终验收账本与未完成项')
start=s.index('`acceptance.json`逐项标局部已验')
end=s.index('\n## 资源导出故障',start)
s=s[:start]+'`acceptance.json`逐项记录：最终cd613原速20/20、七军、骑兵命中/闪避、两坐骑优先随军至少20完整攻击循环、密集门箱、3尺寸菜单与iOS Release/签名均有各自真实证据。全角色独立步态/专用语义帧、参考配装计时2/8/11、正常策略胜率建议区间和实体安装/触控/后台/热量/性能仍未达或待验。33拒收资产等缺口已逐项列明，没有笼统归为用户审美。\n\n只读MCP默认入口已改为优先读取当前代码版本的精确字节finalize报告，防止仍指向旧UI。实际18项桥接回归通过，见 `bridge-reader-regression-receipt.json`。本地读取、官方隧道连接、ChatGPT真正调用工具读图须分别验收；本次ChatGPT端实际读取尚未执行。'+s[end:]
(D/'REPORT.md').write_text(s)
p=D/'acceptance.json';j=json.loads(p.read_text());by={r['id']:r for r in j['cases']}
for key,status,note in [('L02','local_and_actual20_verified','真实连续20关与第16关完整账本；第16关全部590头生成、终局无待生成队列，离场原因明确。'),('G01','data_and_actual20_verified_pending_native','20/20真实原速首通；各章普通远程由真实route生成，第3关起常规数据显式包含弓手，不等于真人难度验收。'),('G03','local_and_actual20_verified_pending_native','20种Boss显式组合，真实连续20关全部终局；后十Boss专用hurt/defeat/yield素材缺口另记V04。'),('P03','browser_normal_clock20_verified_native_pending','2621.32秒原速连续录像，20/20首通，10里程碑，真实奖励/关间跳转；当前可见自动走位，非真人/原生/性能验收。')]:
 by[key]['status']=status;by[key]['actual_result']=note;f=E/'runtime/natural20-summary.json';by[key]['evidence_paths']=[{'path':str(f.relative_to(R)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}]
j['status']='partial_not_complete';j['current_code_fingerprint']=natural['code_fingerprint'];j['app_version']='0.12.4';j['build_number']='2026100303';p.write_text(json.dumps(j,ensure_ascii=False,indent=2))
print('Final natural20/report updated; incomplete gates retained.')
