# -*- coding: utf-8 -*-
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]; T='BATTLE-FIX2-20260925'; E=R/'evidence'/T; D=R/'docs'/T
v=json.loads((E/'VERIFICATION.json').read_text()); groups=json.loads((E/'COMPARISON_GROUPS.json').read_text())
names={'normal-attack':'武将攻击与兵器','gates-crates':'门与箱的信息组','wall-end':'隔离墙及两端','chain-contact':'连续 +1 门与接敌'}
prefix='/evidence/'+T+'/'
photos=''.join('<article><h3>'+names[g['id']]+'</h3><div class="pair">'+''.join('<figure><img loading="lazy" src="'+prefix+g[side]+'"><figcaption>'+('FIX1 同状态基线' if side=='before' else 'FIX2 实际战斗')+'</figcaption></figure>' for side in ['before','after'])+'</div></article>' for g in groups)
runs='、'.join('第%d关 %s秒，剩余%s人'%(x['level'],round(x['seconds'],2),x['count']) for x in v['natural']['runs'])
videos=''.join('<article><h3>'+title+'</h3><video controls playsinline preload="metadata" src="'+prefix+file+'"></video><p>'+note+'</p></article>' for title,file,note in [
 ('38 秒原速展示','showcase.mp4','从同一次自然三关截取，6 段切点见 CLIPS.json。'),
 ('完整自然三关','full-natural-three-levels.mp4',runs+'。包含菜单、整备、过渡、会面与结尾。'),
 ('五兵器 · 10 段定向实测','weapon-identity-showcase.mp4','依次主将刀、主将枪、邢道荣斧、陈应叉、赵云枪；每种低频约3秒、高频约2秒。设置武将与火力后按引擎真实时间运行，不冒充同一自然局。赵云高频真实间隔0.3秒，其余0.2秒。'),
 ('顶部装饰 · 连续 8 秒','top-decoration-uncut.mp4','来自自然第二关，同一连续镜头，保留正常路侧运动。')])
body='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一路长歌 · 战斗 FIX2 核验</title>
<style>body{margin:0;background:#101922;color:#e9e5db;font:16px/1.7 system-ui,sans-serif}main{max-width:1040px;margin:auto;padding:32px 20px}h1{font-size:30px;line-height:1.25}h2{margin-top:44px}a{color:#9edbdd}.play{display:inline-block;background:#dec28a;color:#182630;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700}.pair,.videos{display:flex;gap:24px;flex-wrap:wrap}figure{margin:0;max-width:390px;flex:1;min-width:240px}img{width:100%;height:auto;border-radius:8px}figcaption{color:#b4bbc1;margin:5px 0 25px}video{width:100%;max-width:390px;background:#000}.videos article{max-width:390px}.note{color:#bfc9cf}.status{border-left:3px solid #88b9ab;padding:12px 18px;background:#1a2935}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #34414d;text-align:left;padding:12px 8px}</style><main>
<p class="note">0.9.3-battlefix2 · battle-fix2-20260925</p><h1>战斗 FIX2 · 实际版本与证据</h1><p>五种持械身份接入动作与兵器光波；重排门箱、删除顶部成对装饰、修改普通增援门增长策略，并替换世界定位的木质隔离墙。保留菜单、三关、存档和无音乐规则。</p>
<p><a class="play" href="/play/?v=battle-fix2-20260925">进入可操作游戏</a>　<a href="FINAL_REVIEW.md">交付说明</a>　<a href="VERIFICATION.json">实际验证结果</a></p>
<div class="status">84 项代码检查通过；三尺寸同状态对照 12 组；排版修复复核 27 项；可读窗口 36 组；五兵器低/高频共 10 段。用户审美与实体手机分别待核验。<p id="package-status">独立解包状态见验证回执。</p></div>
<h2>原速视频</h2><div class="videos">VIDEOS</div>
<h2>四组同状态前后对照</h2><p class="note">390×844 实际引擎截图。同初始状态、输入和时间点，固定旧 capped 隔离视觉变化；自然录像使用新 window 规则。另两尺寸见 compare-latest.json。</p>PHOTOS
<h2>封顶旧值、依据与新策略</h2><table><tr><th>项目</th><th>旧值</th><th>新策略</th></tr><tr><td>普通门</td><td>4 / 8 / 12；缺省64</td><td>15门显式window，累计伤害达到阈值后继续改值，接触只领取一次</td></tr><tr><td>逻辑兵力</td><td>静默截断256</td><td>取消截断；48个显示代理不限制真实兵力</td></tr><tr><td>数值安全</td><td>混用容量限制</td><td>2^42异常保护，触发有记录并报错，正常上界低于保护值</td></tr></table>
<p>旧上限没有原录像公式证据，只视为工程初值。同输入8人连弩第一关首门由+4变为+53，原约5.03秒封顶空耗消失；第三关由+8变为+23。伤害阈值、敌人、速度、箱奖励及火力参数保持。<a href="CAP_AUDIT.md">来源审计</a> · <a href="CAP_AND_PACING_REPORT.json">A/B与窗口</a> · <a href="PARAMETER_DIFF.json">参数差异</a></p>
<h2>验收边界</h2><p>必需资源已齐，开发端已复核实际画面。最初的连续门遮挡、三位值溢出、箱牌遮武将及木墙接缝均已修复，失败证据保留。拥挤时队伍人数牌与己方的关联仍有提升空间。用户审美认可和实体手机触控、胶囊、声音、后台及持续性能尚未代验。</p><p><a href="FIX2_REVIEW_RESULTS.json">逐项验收</a> · <a href="KNOWN_GAPS.md">待核验项</a> · <a href="SOURCE_DIFF.md">代码保留范围</a> · <a href="BUILD_ID.json">构建指纹</a></p><p class="note">仅本地构建，未上传或发布。视频诊断采样可能相差1–2帧，姿势以原视频连续帧复核。</p></main><script>fetch('VERIFICATION.json').then(r=>r.json()).then(v=>document.getElementById('package-status').textContent=v.packaging==='passed'?'完整包已实际独立解包启动并回读运行标识，归档哈希见打包回执。':'独立解包核验尚未完成，不提前标绿。').catch(()=>{})</script></html>'''
(D/'index.html').write_text(body.replace('VIDEOS',videos).replace('PHOTOS',photos))
(D/'FINAL_REVIEW.md').write_text('''# 战斗 FIX2 实际交付

版本 0.9.3-battlefix2 / battle-fix2-20260925。打开 index.html 查看四组实际前后图与原速视频。游戏入口 http://127.0.0.1:43198/play/?v=battle-fix2-20260925 。

六组必做项已实现并完成开发端检查：武将动作与兵器光波、四类箱信息组、正负零及连续门排版、顶部近景清理、增援门窗口策略、木墙与原障碍规则。用户审美认可不由开发端代签。

84 项代码检查、12 组同状态截图、27 项排版修复、36 组匹配可读窗口、10 段兵器原速定向片与一次自然三关。原初3项遮挡失败和中间尝试保留，最终以 latest 和 VERIFICATION.json 为准。

38秒展示取自唯一自然录像，另附完整三关、五兵器定向片和顶部连续8秒片；切点与来源见 CLIPS.json / WEAPON_CLIPS.json。四组对照固定旧capped隔离视觉，自然局使用window。

旧门上限4/8/12、缺省64及兵力256是历史工程初值，未证实来自原版公式。15门现用window，伤害阈值不变，取消静默256截断。48显示代理不限制真实兵力；2^42是异常保护，非正常收益封顶。详见CAP_AUDIT、CAP_AND_PACING_REPORT和PARAMETER_DIFF。

完整包含源码、资源、Web/微信构建与媒体；小包含实际PNG/MP4及报告。独立解包与归档以PACKAGE_VERIFICATION和VERIFICATION实际回执为准。共享微信AppID置空，未上传或发布。

待核验：实体手机触控、胶囊、听感、后台和持续性能；用户审美认可。小瑕疵：拥挤时人数牌与己方关联仍偏弱。没有用临时素材冒充必需资源完成。

后续GPT先看00_START_WITH_CODEX.md，再读实际媒体和验收表；保护累积工作区及存档。
'''+ '\n自然结果：'+runs+'。\n')
print(D/'index.html')
