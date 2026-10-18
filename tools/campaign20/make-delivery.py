#!/usr/bin/env python3
"""Create the review page only from completed, fingerprint-matched artifacts."""
import pathlib,json,hashlib,datetime,html,sys
R=pathlib.Path(__file__).resolve().parents[2];E=R/'evidence/YILU-CAMPAIGN20-20260930';D=R/'deliverables/YILU-CAMPAIGN20-20260930'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();M=read(E/'bridge-build-manifest.json');fp=M['code_fingerprint'];build={k:M[k] for k in ['build_id','code_fingerprint','target','configuration','produced_at']};N=read(E/'native-summary.json');A=read(E/'native-audio-summary.json');T=read(E/'checks-final.json');device=read(D/'device-install.json')
sys.path.insert(0,str(R/'tools/project-reader'));from common import game_fingerprint
assert game_fingerprint()[0]==fp,'game source drifted'
F=read(E/'render-only-followup.json');campaign_fp=N['build']['code_fingerprint']
assert N['status']=='passed' and F['simulation_unchanged'] and F['code_fingerprint']==fp and F['baseline_code_fingerprint']==campaign_fp,'native campaign relationship unverified'
assert all(a['code_fingerprint']==fp and a['peak_db']>-80 for a in A),'audible native recording missing or stale'
# Every short clip must come from a newly completed framebuffer recording.
for name in ['normal-native-system-audio','dense-native-system-audio','reward-treasure-original','reward-weapon-original','reward-person-original']:
 media=D/'media'/(name+'.mp4');meta=read(media.with_suffix('.json'))
 assert meta['build']['code_fingerprint']==fp and meta['source_sha256']==sha(media)
 capture=read(E/(name.split('-')[0]+'-capture.json')) if name.startswith(('normal-','dense-')) else meta
 raw=R/capture['source_video'];assert raw.is_file() and capture['source_video_sha256']==sha(raw)
 assert build['build_id'] in raw.name,'ambiguous reused framebuffer'
assert T['build']['code_fingerprint']==fp and T['failed']==0
assert device['build']['code_fingerprint']==fp,'device build report is stale'
fixtures=[]
for size in ['large','small']:
 for p in sorted((E/('fixtures-'+size)).glob('*.png')):
  meta=read(p.with_suffix('.json'))
  if meta.get('build',{}).get('code_fingerprint')!=fp:continue
  assert sha(p)==meta['source_sha256']
  fixtures.append({'path':str(p.relative_to(R)),'size':size,'sha256':sha(p),'fixture':meta['state']['verificationScope']})
assert all(sum(x['size']==s for x in fixtures)>=17 for s in ['large','small']),'two-size final fixtures missing'
clips=read(E/'packaged-clips.json');assert len(clips)==3 and all(c['build']['code_fingerprint']==campaign_fp for c in clips)
main_audio=read(E/'main-clips-audio-check.json');assert len(main_audio)==3 and all(c['code_fingerprint']==campaign_fp and c['peak_db']>-80 for c in main_audio)
edge=read(E/'edge-followup-after/C20-army-19-spear-right-rel-jueying-after.json');assert edge['build']['code_fingerprint']==fp
rows=[]
def add(id,status,detail,evidence):rows.append({'id':id,'status':status,'detail':detail,'evidence':evidence})
add('content','passed','20章、42人物、16兵器、18宝物；原十关身份及首奖保留。','evidence/YILU-CAMPAIGN20-20260930/content-coverage.json')
add('tests','passed',f'{T["passed"]}/{T["test_count"]} 当前指纹测试通过，0失败。','evidence/YILU-CAMPAIGN20-20260930/checks-final.json')
add('save-transaction-model','passed','schema2/3、旧8/10关、原始字符串备份、写失败、未知字段、重启与重复领奖模型回归通过；不能代替真机迁移。','tests/campaign20-store.test.ts')
add('weapon-routes-damage','passed','所选兵器、同兵器升阶、异兵器同路拾取、两次选路、门封顶、真实战损与可达预警已接入并回归。','tests/campaign20-combat.test.ts')
add('milestones-rewards','passed','十双关里程碑与领取键；奖励先可靠保存后演出、可跳过、可恢复。自然回归与三种原生奖励动画分别留证。','tools/campaign20/record-rewards.py')
add('difficulty-matrix','passed','960组固定行为样本已达设计分离目标；这是旧模型矩阵，晚于它的阶段清危/绘制修复没有全量重跑矩阵。样本比例不是真人胜率。','evidence/YILU-CAMPAIGN20-20260930/matrix-final-scope.json')
add('native-20','passed','新档20/20来自构建05；随后仅修视野边缘相机，渲染段以外与全部其余游戏文件逐字节相同。未重复整条主线；最终08另有原生截图/录音与326项回归。','evidence/YILU-CAMPAIGN20-20260930/native-summary.json')
add('native-duration','passed' if N['all_durations_in_target'] else 'failed','逐关游戏秒与前台秒分别报告；不把菜单/奖励或加载算进战斗。','deliverables/YILU-CAMPAIGN20-20260930/逐关实测.md')
add('simulator-smoothness','failed',f'本次开启诊断和部分录屏的原生模拟器平均{min(r["fps"] for r in N["rows"]):.1f}–{max(r["fps"] for r in N["rows"]):.1f} FPS，偏低；流畅性不能标通过。未隔离诊断/宿主负载影响，不能据此推断真机性能。','evidence/YILU-CAMPAIGN20-20260930/native-summary.json')
add('native-two-sizes','passed',f'{len(fixtures)}张最终指纹原生固定状态；402×874与375×667的地图、奖励、靠边、高兵力和门箱牌已采集。','evidence/YILU-CAMPAIGN20-20260930/fixtures-small')
add('map-assets-cache','passed','五张地图、建筑、旗与印章实际接入，邻段缓存≤3；地图拖动误触有模型回归，设备手势另列。','tests/campaign20-map.test.ts')
add('render-runtime','passed' if N['zero_render_errors'] else 'failed','修复第9关蛇形光波TDZ；所有兵器/随军/20章绘制域回归和最终自然主线均检查异常。','evidence/YILU-CAMPAIGN20-20260930/render-domain-fix.json')
peak_enemy=max(r['max_visible_enemies_sampled'] for r in N['rows']);peak_soldier=max(r['max_visible_soldiers_sampled'] for r in N['rows'])
add('sampled-body-budget','passed' if peak_enemy<=64 and peak_soldier<=40 else 'failed',f'本次采样峰值：可见敌军{peak_enemy}、表现兵{peak_soldier}。逻辑人数另记；不是连续每帧最大值、GPU或内存测量。','evidence/YILU-CAMPAIGN20-20260930/native-summary.json')
add('native-edge-followup','passed','最终08补测骑乘边缘、随军腿部遮挡、视觉出弹；326项回归通过。原生同状态前后图保留各自指纹，模型/其余游戏文件逐字节未变。','evidence/YILU-CAMPAIGN20-20260930/render-only-followup.json')
add('art-resource-closure','passed','新增12图集/背景在Debug和Release包中逐字节闭合；动作完整程度另列。','evidence/YILU-CAMPAIGN20-20260930/edge-final-bundle-audit.json')
add('art-gait','failed','新人物/新兵器仅一个run姿态，位移和起伏已实现，但独立腿部步态没有完成。','deliverables/YILU-CAMPAIGN20-20260930/ART-STATUS.md')
add('art-mount-weapons','failed','惊帆/绝影骑手固定长枪，未完成16种兵器骑乘组合；已去掉重复漂浮武器，不冒称外观随所选兵器切换。','deliverables/YILU-CAMPAIGN20-20260930/ART-STATUS.md')
add('art-tier-signals','failed','所有阶位实际生效；部分新兵器的阶位差异主要体现在伤害/HUD，独立光波/持械阶位外观未齐。','deliverables/YILU-CAMPAIGN20-20260930/ART-STATUS.md')
add('audio-assets','passed','旧51WAV字节不变；新增18发招+3装填，许可与源录音闭合；格挡和发招分开。','evidence/YILU-CAMPAIGN20-20260930/edge-final-bundle-audit.json')
add('audio-runtime','passed','六新兵器有实际游戏进程系统录音，PCM非零；缺音/回退0、峰值3声道。静音失败记录被隔离，没有用素材配音代替。','evidence/YILU-CAMPAIGN20-20260930/native-audio-summary.json')
add('audio-subjective','not_run','未把波形、工具事件或旧认可当作新六武器的手机主观听验。','deliverables/YILU-CAMPAIGN20-20260930/audio/index.html')
for c in device['checks']:add('device-'+c['id'],c['status'],c.get('reason',c.get('note',c['id'])),'deliverables/YILU-CAMPAIGN20-20260930/device-install.json')
add('new-chatgpt-read','not_run','本轮会完成本地MCP像素读取与官方隧道状态检查；新快照在ChatGPT中的实际读取仍需用户发起，不复用历史成功当新成功。','docs/ai-bridge/RUNBOOK.md')
add('mcp-report-binding','passed','17项只读桥接回归通过；报告仅在正文哈希匹配本地finalize记录时绑定版本，后来修改报告会解除关联，游戏源码变更会标旧版。不是重新运行游戏测试。','evidence/YILU-CAMPAIGN20-20260930/mcp-report-binding-check.json')
out={'task':'YILU-CAMPAIGN20-20260930','produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':build,'version':'0.12.0','build_number':'2026093008','overall':'playable_native_campaign_delivered_with_explicit_art_and_device_gaps','checks':rows,'fixture_manifest':fixtures,'videos':clips,'campaign_build':N['build'],'render_only_followup':F,'native_summary_sha256':sha(E/'native-summary.json'),'tests_sha256':sha(E/'checks-final.json')};(D/'acceptance.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
device_final=next(c for c in device['checks'] if c['id']=='final-upgrade')['status'];fps_values=[r['fps'] for r in N['rows']];dur=[r['simulation_seconds'] for r in N['rows']]
report=f'''# 二十关扩展实际交付

任务 `YILU-CAMPAIGN20-20260930`；iOS **0.12.0 / 2026093008**。二十关正式玩法、内容、地图与奖励流程已接入实际 Cocos 游戏并完成新档连续回归。**仍有动作素材缺口与设备待验，不能标成全部验收通过。**

最终代码指纹：`{fp}`。模拟器构建 `{build['build_id']}`。真机Release构建和签名见 [安装结果](device-install.json)。分支仍为 `codex/ios-polish-round2-20260929`，HEAD仍为 `79fbea0`；dirty成果保留，未提交、推送、合并或发布。

## 本轮已做

20关、42人物、16兵器、18宝物；六类新威胁、静态递进难度、出征兵器选择、每章两次风险选路、门值封顶与去重；十双关里程碑、可靠存档后的三类奖励演出；五段山河地图、实际城点和详情、拖动及至多三段缓存。具体机制与文件见 [改动说明](CHANGES.md)、[资源状态](ART-STATUS.md)、[内容与音效](CONTENT-AUDIO.md)。

## 本次验证

- 当前指纹全库 **{T['passed']}/{T['test_count']}** 通过、0失败；新增蛇形光波真实绘制域回归通过。没有用旧测试数当新结果。
- 原生模拟器新档连续 **20/20**，真实伤害、收服判定、奖励、解锁、下一关与第20关终局均经过实际状态链。允许的DEBUG合法输入驱动，不能称真人试玩。此完整回归来自构建05，随后仅做渲染相机边界修复；模型/其余游戏文件逐字节未变，但不将旧录像重标为08。逐关约 **{min(dur):.1f}–{max(dur):.1f}秒**，细分与目标见 [逐关实测](逐关实测.md)。
- 两尺寸共 **{len(fixtures)}** 张最终指纹固定状态图、三段来自构建05同一连续主线的原速音画、三类奖励动画、六新兵器素材试听与实际游戏系统录音。固定状态资源由隔离内存存档提供，不修改用户存档。
- 可见敌军采样峰值 {peak_enemy}、表现兵 {peak_soldier}；逻辑兵力、可见人数、帧间隔分别记录。模拟器各关平均帧率约 **{min(fps_values):.1f}–{max(fps_values):.1f} FPS**，含DEBUG诊断与部分录屏，测量偏低，流畅性未通过。未隔离诊断/宿主负载影响；不能推出真机60FPS或GPU/内存结论。
- 旧51音效保持字节一致，新21个音频的源录音/许可/编辑参数可追溯。六兵器实际录音有非零PCM；全局3声道与限流保留。奖励页没有新增可选仪式音，奖励动画视频为有意静音。

## 版本边界与已修复失败

960组难度矩阵来自冻结参数后、后续阶段清危与渲染修复前的源码。基本和进阶脚本各160/160；3–20关三种站定共1/432。它们仅是给定脚本样本；最后没有重跑整套难度矩阵。矩阵哈希、原源码与后续差异见 `matrix-final-scope.json`。最终指纹的新证据是326项回归、两尺寸截图和六兵器原生录像；完整20关和三段自然录像保持05原指纹。详见 `render-only-followup.json` 的实际源码差异边界。

首次全库的四项失败已分别处理：异兵器箱测试改为真正同路拾取；旧十关终局测试延伸到20关；军阵逐兵夹持改成全队边界平移；名将预警回归使用真实执行时点而非旧固定0.9秒。没有删除测试来获得通过。

原生样跑在第9关发现蛇形光波局部变量遮蔽，已复现、修复并补16兵器×3阶、12新人及20章绘制域回归；故障样跑单独保留，不充当最终通关。并行小屏的系统音频采集曾全为零，已隔离；最终使用有实际输出的同一大屏模拟器顺序录制，没有替换成素材配音。

最终媒体核对还发现录屏工具遇到同名文件时拒绝录制，而旧脚本继续复用了旧画面。五段受影响媒体已隔离为无效版本证据；脚本改用每次唯一文件名并验证录制成功，三段奖励和两段音画已重新采集。二十关主线录像不受影响。

最后查看原生截图发现坐骑长枪和随军在屏幕边缘仍裁切。已复现失败并将整个战场投影视点平移到完整人物范围，危险预警/弹体一起平移，碰撞坐标与伤害不改；HUD位置不动，坐骑前方的随军纵深和视觉出弹起点一起避开马身。两种坐骑、两侧、四姿态、两尺寸绘制边界回归已通过，最终08截图另行采集。完整主线未为此重复跑一遍。

## 手机与明确未完成

最终同应用覆盖安装状态：**{device_final}**，详情以 [设备逐项结果](device-install.json) 为准。首次迁移必须核对原始字符串备份、进度/收藏与合法里程碑补发；安装阶段的SQLite哈希一致只证明未清档，不证明启动迁移成功。原始玩家存档与签名身份保留在本机专用目录，不放进公开核验资料。

尚未完成：新人物独立多帧腿部步态；惊帆/绝影16兵器骑乘外观组合；部分兵器1–3阶的独立外观信号。现有源帧、生成与切片修正方法、具体定位都在ART-STATUS，不能全部归为审美确认。盾兵红缨源图顶部还有1像素接边，肢体完整。真人触控、真机帧率/发热/耗电/后台恢复与新音效主观听验，仅按安装报告实际执行状态计，不虚报。

## 使用与复核

见 [一页中文说明](使用说明.md)。已签名原生包位于 `ios/Yilu-0.12.0-2026093008.app.zip`；仅用于当前有效描述文件中的设备，不是TestFlight或商店发行包。可播放证据集中在 [结果页](index.html)。

MCP最终快照、当前本地协议/像素验证、隧道结果另见 `MCP-RESULT.json`；新快照的ChatGPT实际读取保持待验。项目缓存从2GiB调到4GiB以容纳不可变证据，旧快照未因本次操作删除，未修改全局客户端配置。
''';(D/'REPORT.md').write_text(report)
cards=[]
for name,label in [('C20-map-10-after','山河地图'),('C20-reward-11-after','双关里程碑与兵器奖励'),('C20-reward-19-after','第20关终局人物奖励'),('C20-gates-19-spear-center-after','门箱标签避让'),('C20-edge-19-goulianqiang-left-rel-after','长兵器靠边'),('C20-army-19-spear-right-rel-jueying-after','高兵力与坐骑')]:
 cards.append(f'<figure><img loading="lazy" src="../../evidence/YILU-CAMPAIGN20-20260930/fixtures-large/{name}.png" alt="{label}"><figcaption>{label} · 原生隔离状态</figcaption></figure>')
videos=''.join(f'<figure><video controls preload="metadata" src="media/c{c:02}-original.mp4"></video><figcaption>第{c}关 · 构建05连续主线原速音画</figcaption></figure>' for c in [2,12,20])
rewards=''.join(f'<figure><video controls preload="metadata" src="media/reward-{k}-original.mp4"></video><figcaption>{v}奖励 · 原生隔离演出，页面无音效</figcaption></figure>' for k,v in [('treasure','宝物'),('weapon','兵器'),('person','人物')])
details=''.join(f'<tr><td>{html.escape(r["id"])}</td><td class="{r["status"]}">{r["status"]}</td><td>{html.escape(r["detail"])}</td></tr>' for r in rows)
page=f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一路长歌 · 二十关实际交付</title><style>body{{margin:0;background:#101c2a;color:#f0ede4;font:16px/1.65 system-ui}}main{{max-width:1100px;margin:auto;padding:36px 20px}}h1,h2{{color:#e7cd91;line-height:1.3}}h1{{font-size:34px}}small,.muted{{color:#afbdc9}}a{{color:#edcb7c}}code{{overflow-wrap:anywhere;font-size:13px}}nav{{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}}section{{padding:24px 0;border-top:1px solid #344252}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px}}figure{{margin:0;background:#1a2a3c;padding:10px;border-radius:10px}}img,video{{width:100%;display:block;border-radius:5px}}figcaption{{padding:10px 2px;font-size:14px}}.notice{{border-left:4px solid #e8b36c;padding:12px 18px;background:#2a2b29}}table{{width:100%;border-collapse:collapse;font-size:14px}}td,th{{text-align:left;padding:10px;border-bottom:1px solid #344252;vertical-align:top}}.passed{{color:#93d5ac}}.failed,.blocked{{color:#ffb795}}.not_run{{color:#ddcd99}}audio{{width:100%}}</style><main><small>YILU-CAMPAIGN20-20260930 · Cocos Native / iOS</small><h1>一路长歌 · 二十关实际交付</h1><p>20关 · 42人物 · 16兵器 · 18宝物 · 10座里程碑</p><p><code>{fp}</code><br>0.12.0 / 2026093008 · {T['passed']}项测试通过 · 原生连续20/20</p><div class="notice">可玩主线已交付；动作素材、手机验证与主观听验仍有明确未完成项。最终手机安装：{device_final}。本页固定状态图不是自然通关证明；三段主线视频来自构建05合法输入连续回归；最终08仅追加视野边缘修复，保留各自指纹。</div><nav><a href="REPORT.md">完整报告</a><a href="acceptance.json">逐项验收JSON</a><a href="逐关实测.md">逐关时长</a><a href="使用说明.md">使用与GPT核查</a><a href="device-install.json">手机安装结果</a><a href="ios/Yilu-0.12.0-2026093008.app.zip">原生签名包</a></nav><section><h2>实际前后对照 · 骑乘右侧</h2><div class="grid"><figure><img src="../../evidence/YILU-CAMPAIGN20-20260930/edge-followup-before/C20-army-19-spear-right-rel-jueying-after.png"><figcaption>修复前 · 构建05 · 武器出屏、随军被马身遮挡</figcaption></figure><figure><img src="../../evidence/YILU-CAMPAIGN20-20260930/edge-followup-after/C20-army-19-spear-right-rel-jueying-after.png"><figcaption>最终08 · 整体投影留边、随军和出弹纵深同步</figcaption></figure></div></section><section><h2>实际运行画面</h2><div class="grid">{''.join(cards)}</div></section><section><h2>同次主线 · 原速战斗</h2><div class="grid">{videos}</div></section><section><h2>奖励动画</h2><div class="grid">{rewards}</div></section><section><h2>可听证据</h2><p><a href="audio/index.html">六新兵器独立素材试听</a>；以下是游戏进程实际系统录音，没有后配素材音轨。</p><div class="grid"><figure><video controls preload="metadata" src="media/normal-native-system-audio.mp4"></video><figcaption>六兵器正常战斗录音</figcaption></figure><figure><video controls preload="metadata" src="media/dense-native-system-audio.mp4"></video><figcaption>六兵器密集战斗录音</figcaption></figure></div></section><section><h2>逐项状态与边界</h2><p><a href="ART-STATUS.md">资源完成程度与具体缺口</a> · <a href="CHANGES.md">全部实际改动</a></p><table><tr><th>检查</th><th>状态</th><th>实际范围</th></tr>{details}</table></section></main></html>''';(D/'index.html').write_text(page);print(json.dumps({'checks':len(rows),'fixtures':len(fixtures),'fp':fp,'native20':N['status'],'device_final':device_final}))
