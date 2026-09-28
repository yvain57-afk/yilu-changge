#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regenerate the scoped iOS delivery review from measured evidence; never infer pass."""
from pathlib import Path
import json,shutil,html
R=Path(__file__).resolve().parents[1];E=R/'evidence/IOS-PLAYABLE-FIX-20260928';D=R/'docs/IOS-PLAYABLE-FIX-20260928';I=D/'intake'
for n,k in enumerate(['4291','4289','4288','4284','4283','4282','4281'],1):shutil.copy2(I/f'evidence/IMG_{k}.PNG',E/f'comparison/S{n:02}-before.png')
model=json.loads((E/'model-pacing.json').read_text())['results'];actual=json.loads((E/'native-calibrated-natural/results.json').read_text())
lines=['# 逐关时长：原生实测与最终模型分开','', '原生数据来自第二次完整十关：新建专用模拟器、零进度首通、兵器长期等级1、逐关合法已获配装，使用实际可访问触控按钮操作；无内部autopilot、锁胜或变速。暂停/菜单不计前台有效战斗时间。','', '**最终代码在此录像之后将第7/10关Boss HP从260/220改为225/190，并补人物全身详情、支援HUD、门有效射击判定与宝物胜利入库。最终参数模型通过，但第7/10关最终原生复测因Mac锁屏未执行。**','', '|关卡|原生前台秒|关底秒|攻防轮|最终模型秒|实测判断|','|---|---:|---:|---:|---:|---|']
for r,a in zip(model,actual):
 lines.append(f"|{a['chapter']}|{a['foregroundSeconds']:.2f}|{a['phaseSeconds']['boss']:.2f}|{a['cycles']}|{r['simulationSeconds']:.2f}|{'超120秒' if a['foregroundSeconds']>120 else '90–120秒内'}{'；关底超40秒' if a['phaseSeconds']['boss']>40 else ''}|")
lines+=['','所有十关胜利后约1.60–1.64秒进入结果页，renderErrors/invalidRects均为空。第七关结算并进入第八关已实际执行，旧版停顿的唯一根因没有重新复现。','', '原生Debug模拟器并录屏的平均FPS为'+f"{min(a['fps'] for a in actual):.2f}–{max(a['fps'] for a in actual):.2f}"+'，存在>100ms长帧；这是未达60fps目标的诊断，不能作为真机通过证据。iPhone安装仍受免费签名3应用名额限制。完整分关数据见native-calibrated-natural/results.json。','', '第一次完整十关结果与当时代码另存native-final-natural/results.json、calibration-before/；第5/10关曾超时，保留用于修复前后比较。最终模型使用同一真实玩法模型，仍不能替代人类操作或真机性能。']
(E/'TIMINGS.md').write_text('\n'.join(lines))
# Each status is manually bounded by the original case's full acceptance requirement.
rows={
'SRC-01':('not_run','520帧矩形无越界；168帧重切，原生十关及详情无invalidRects。尚缺完整原图→独立PNG→标准Sprite→生产渲染逐层诊断页和全部帧动态核对。','frame-inventory.json'),
'SRC-02':('pass','S01末页三卡完整；马超、庞统、姜维详情已改完整立绘，并在最终原生构建分别截图。卡片保留有意半身构图。','comparison/'),
'SRC-03':('not_run','S05/S06两种配队最终原生图无残片；十关中实际翻页换人已录。尚未做两配队反复返回重入的独立连续核验。','comparison/'),
'SRC-04':('not_run','S02/S03/S04已补原生idle/warn/strike/rec/spent/yield静态状态图；受击及连续切换全矩阵尚未逐帧验收。','comparison/'),
'SRC-05':('not_run','类型独立池、frame/texture/UV更新与原生冷启动已验证无报告错误；跨全部图集的alpha/offset残留专项未齐。','native-calibrated-natural/'),
'SRC-06':('not_run','补双持分层、骑乘手指遮挡、有效四帧步态与兵器rig；全部武器×骑乘×跑攻伤连续转换仍待专项。','character-state-matrix.json'),
'ACT-01':('not_run','六派生兵器拒绝稿已替换为四有效步态+独立兵器rig；源稿和切片已交付。全部连续循环的脚锚/握柄核对未齐，不凭帧数判完成。','character-state-matrix.json'),
'ACT-02':('not_run','十兵器20个中间帧接入蓄势/收势；自然十关覆盖主要已解锁兵器。全部兵器发射出口与动作逐帧对照未完成。','character-state-matrix.json'),
'ACT-03':('not_run','九统帅新增结束帧与胜/降/访/盟文本已接入；十关yield/结果实录俱全。尚未对每个结束帧的交械姿态逐项视觉确认。','native-calibrated-natural/'),
'ACT-04':('not_run','实际扣血账本、零伤害不闪、同源250ms飘字聚合已通过回归并录原生短片；轻击/重击/免伤全部指定状态尚缺一一对照。','native-github-audit-fixture-original-speed.mp4'),
'ACT-05':('pass','无条件全局hitStop已删除；空挥世界时钟继续的模型回归通过，原生十关intentionalHitStop均0。真实重击只停主将局部姿态40ms且间隔至少600ms。','native-calibrated-natural/results.json'),
'ACT-06':('not_run','随军/支援按兵器家族显示波形与专属用途，四角色来源模型通过；最终支援头像、姓名、冷却已接入。全部合法配队/共鸣开关专项仍待。','full-tests.log'),
'GROW-01':('not_run','实际十关录到兵器换型、阶位增长与HUD变化，模型含溢出和单次结算；满阶溢出的原生定向片尚未单独补齐。','native-calibrated-natural/'),
'GROW-02':('pass','原生十关军械换装与密集齐射可见；箭从真实队伍位置出发，减小箭头不改命中规则，主将身份保持；账本可追踪。','native-calibrated-ten-review.mp4'),
'GROW-03':('not_run','三槽、试用/重复、共鸣/次数现行规则回归通过；原生自然过程覆盖部分，全部组合原生定向验证未齐。','full-tests.log'),
'PACE-01':('fail','第二轮真实首通前9关在90–120秒，第10关120.98秒。末次仅调低第7/10关Boss血量后模型全部达标，但最终两关原生重测被锁屏阻塞。保留最后实测失败，不用模型覆盖。','TIMINGS.md'),
'PACE-02':('not_run','重排十关行军、名将、关底预算与4.5秒有效门窗口，事件时间戳保留；全部奖励的决定/瞄准时间及末次升级后≥15秒未逐关专项确认。','model-pacing.json'),
'PACE-03':('not_run','赤兔只影响横移的确定性模型检查通过；步行/赤兔/的卢完整固定横坐标原生A/B trace未执行。','full-tests.log'),
'PACE-04':('fail','第二轮原生第7/10关关底44.25/45.60秒超过28–40秒；最终HP修正模型28.25/28.52秒，原生复测未执行。其余八关在目标区间。','TIMINGS.md'),
'PACE-05':('not_run','无90秒锁胜/120秒强判，模型失败/复玩回归保留；高配快通与低兵力失败两种原生专项未执行。','full-tests.log'),
'PACE-06':('pass','名将接战暂停前进时门不再无限改值，时间/射击窗口模型边界回归通过；原生十关保留合法门和名将接战。','full-tests.log'),
'PERF-01':('blocked','Release已签名，但iPhone返回免费开发应用3个名额已满。Debug模拟器34–49fps且有长帧，不能代替真机60fps达标。','device-install-result.txt'),
'PERF-02':('blocked','完整原生模拟器十关已录；真实iPhone未安装，20分钟热态、内存首尾、充电/温升实测缺失。','device-install-result.txt'),
'PERF-03':('pass','30/60/120Hz输入回放模型通过，距离/时序/结算一致；这是确定性回放，不是三种刷新率真机录制。','full-tests.log'),
'PERF-04':('not_run','节点池消除按类型销毁重建；原生逐关记录节点数与长帧。Debug仍有未细分CPU/GPU来源的>100ms帧，首次武器/转场尖峰未全归因。','native-calibrated-natural/results.json'),
'END-01':('pass','两次自然原生第7关均正常结算，第二轮约1.6秒进入结果，实际进入第8关并继续通关。最终HP修正未改结算逻辑，但其时长复测单列待验。','native-final-natural/c07-to-c08-prepare.png'),
'END-02':('not_run','存档暂存/原字节备份/校验/失败重试/幂等模型通过；原生后台快速点击与故障注入组合未齐。','full-tests.log'),
'END-03':('pass','没有重新复现旧版本第7关唯一根因。已加终态继续演出、1.6秒有限等待、保存重试；新版本复录通过只是防护有效证据。','implementation-notes.md'),
'UI-01':('not_run','S07实际地形地图、城池/路线/区域雾；自然十关逐步解锁并继续出征。全城回点/奖励详情专项未齐。','comparison/S07-after.png'),
'UI-02':('not_run','原生402宽末页/整备与30人详情已取图；360/375/390/430宽及短屏专项缺失。','comparison/'),
'UI-03':('not_run','武器名、共鸣、敌将牌分层；支援头像/姓名/数字冷却替换泛用援字。最终密集夹具已截图，连续门/升级/预警全部重叠组合未齐。','comparison/S04-after.png'),
'UI-04':('not_run','保留每个小门独立数值和奖励，没有隐藏合并；四指定宽度原生连续门矩阵未执行。','implementation-notes.md'),
'IOS-01':('pass','Cocos3.8.8→Xcode27原生Sprite/Graphics/Label，实际模拟器完整十关；scheme CocosGame，非WebView。','ios-simulator-build.log'),
'IOS-02':('pass','无wx/DOM Canvas/window的原生JS入口已启动、加载、战斗和十关结算。','native-calibrated-natural/results.json'),
'IOS-03':('blocked','开发签名Release构建/严格codesign通过；iPhone安装被免费开发名额限制拒绝，未卸载现有应用，覆盖安装保档未验。','device-install-result.txt'),
'IOS-04':('not_run','原生模拟器402×874、安全区顶62底34及真实触控映射已运行；实际iPhone各页面安全区待验。','native-calibrated-natural/c01-result.json'),
'IOS-05':('not_run','模拟器实际暂停后Home切后台并重开，战斗时间保持9.55秒，手动继续后推进；控制中心、设备锁屏和音频打断组合仍未验。','native-pause-after-background.json'),
'IOS-06':('blocked','实际UI关闭/开启音效与震动设置有截图；代码事件限频、BGM关闭。真机未安装，听觉差异与触感无法验证，录像无音轨。','native-settings-both-off.png'),
'IOS-07':('pass','不清源端存档；独立测试模拟器有完整十关档和SQLite备份，夹具只用内存。iOS新沙盒不冒称与Web/微信自动互通。','implementation-notes.md'),
'REG-01':('pass','原F1/F2模型回归通过，名将接触/错过/独立战胜与收服规则保持；正式原生十关实际运行。','full-tests.log'),
'REG-02':('pass','原F3实际战损2、七星灯5、华佗1、最终6兵回归通过，没有恢复按名义伤害治疗。','full-tests.log'),
'REG-03':('pass','原F4统一交点排序、穿透预算耗尽和越过Boss不额外扣血回归通过。','full-tests.log'),
'REG-04':('pass','一次发奖、原字节备份、未知字段保留、暂存校验重试、rulesVersion成绩隔离均回归通过。','full-tests.log'),
'DEL-01':('pass','最终源码dirty指纹、最终构建哈希、最终七组/详情及短片随包。完整十关录像明确属于末次HP/详情/HUD与门/入库修复前版本；参数差异与当时代码保留，不混称最终完整十关。','media-provenance.json'),
'DEL-02':('pass','46项原始要求保留，逐项写真实状态与具体缺口；未全绿，不将未完成动作/设备项归为审美待验。','ACCEPTANCE.md'),
'DEL-03':('pass','GitHub源码审查与授权合并单列；未上传TestFlight/商店/微信。','implementation-notes.md')}
check=json.loads((I/'03_ACCEPTANCE.json').read_text());assert len(rows)==46
for c in check['cases']:
 c['status'],c['actual'],p=rows[c['id']];c['evidencePaths']=[p]
check['status']='PARTIAL_NATIVE_CANDIDATE_NOT_ACCEPTED';check['evidenceBoundary']='模型、静态/动态夹具、原生模拟器自然操作、iPhone未安装分开记录。最后实测失败保留，最终模型不能覆盖。'
check['summary']={s:sum(c['status']==s for c in check['cases']) for s in check['allowedStatus']}
(E/'03_ACCEPTANCE.json').write_text(json.dumps(check,ensure_ascii=False,indent=2))
lines=['# 46项实际验收','',str(check['summary']),'','pass仅代表该项所述范围；not_run表示完整规定证据未齐，actual中保留已做部分。','', '|编号|状态|实际结果|','|---|---|---|']
for c in check['cases']:lines.append('|'+c['id']+'|'+c['status']+'|'+c['actual'].replace('|','/')+'|')
(E/'ACCEPTANCE.md').write_text('\n'.join(lines))
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>一路长歌 iOS原生核验</title><style>body{margin:auto;max-width:1100px;background:#101b29;color:#eee;font:16px/1.65 system-ui;padding:24px}a{color:#edca84}h1,h2{color:#edca84}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;display:block}article{margin:40px 0}video{width:min(100%,400px);max-height:700px}small{color:#bfccd7}</style><h1>一路长歌：三国 · iOS原生修复候选</h1><p><b>尚未全部验收通过。</b>两次原生完整十关已录。最后一轮第十关120.98秒、第七/十关Boss偏长；最终HP已校准，尚未原生复测。iPhone受免费签名名额阻塞，性能不报通过。</p><p><a href="GITHUB_REVIEW.md">GitHub GPT核查入口</a> · <a href="ACCEPTANCE.md">46项实际状态</a> · <a href="TIMINGS.md">逐关时长</a> · <a href="PARAMETER_DIFF.md">参数前后与依据</a> · <a href="implementation-notes.md">实施/具体缺口</a> · <a href="character-state-matrix.json">角色/动作矩阵</a></p><h2>最终构建原速战斗短片</h2><p>实际Cocos原生Debug独立内存样段，无走位操作，非自然首通；不改存档。无音轨，不证明声音与触感。最终人物/支援显示与门/宝物修复已接入。</p><video controls preload="metadata" src="native-github-audit-fixture-original-speed.mp4"></video><h2>完整自然十关 · 第二轮原生实录</h2><p>专用新模拟器零进度，兵器等级1，正常解锁配装和实际触控按钮；原速、未剪接，包含菜单/暂停。仅缩小分辨率和压缩。最后HP/详情/HUD及门窗口/宝物入库修复前的版本，具体差异见参数与媒体清单。</p><video controls preload="metadata" src="native-calibrated-ten-review.mp4"></video><p><a href="native-calibrated-natural/results.json">原生逐关原始测量</a> · <a href="model-pacing.json">最终模型校准</a> · <a href="media-provenance.json">版本/媒体对应</a> · <a href="source-fingerprint.json">最终源码指纹</a></p><h2>七组对应画面</h2><p>左为用户问题原图，右为最终Cocos原生内存夹具；保持对应关卡/角色/兵器/配队，设备分辨率与安全区不同，不宣称像素同态。静图不替代触控/性能验收。</p>'''
for n,title in enumerate(['末页人物卡','诸葛亮／双股剑／骑乘','张飞预警／青釭剑／骑乘','周瑜收势／蛇矛／骑乘','赤壁整备／张辽与夏侯惇','赤壁整备／吕布与夏侯惇','地图推进／6关已克'],1):
 page+=f'<article><h2>S{n:02} · {title}</h2><div class="pair"><div><small>修复前</small><img src="comparison/S{n:02}-before.png"></div><div><small>最终原生构建</small><img src="comparison/S{n:02}-after.png"></div></div></article>'
page+='<h2>完整人物详情补充</h2><p>九位缺少全身素材的人物已经补图；以下是实际原生取图。其余30人详情在comparison目录。</p>'
for actor in ['machao','pang','jiang','hua','diao','sima']:
 page+=f'<a href="comparison/S01-{actor}-after.png"><img style="display:inline-block;width:30%;margin:1%" src="comparison/S01-{actor}-after.png"></a>'
(E/'index.html').write_text(page+'</html>');print(check['summary'])
