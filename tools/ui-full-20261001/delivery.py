# coding: utf-8
from pathlib import Path
import json, shutil, html, hashlib, zipfile, plistlib

R=Path(__file__).resolve().parents[2]
D=R/'deliverables/YILU-REGRESSION-FIRST-UI-FULL-20261001'
U=D/'UI-FINAL'
E=R/'evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001/ui-continuation'
W=R/'build/ui-full-web'
rows=[
 ('U01','首页营地','home','store.completed / selectedWeaponId / pendingRewardPresentation','开始、继续、重游、地图、图鉴、设置','新档/进行中/20关完成/待恢复奖励'),
 ('U02','山河地图','map','CHAPTERS / MILESTONES / store.cleared / unlocked','地图拖动、定位、城点详情、出征、关间转场','保留五段地图和未至/可挑战/已克'),
 ('U03','整备出征','prepare:weapons','store.loadout / weaponLevels / captures / visits / slots','四页签、单层滚动、选兵器、兵法、编组替换、详情、出征','空态/已获/满编替换；预览、页签与底栏分区'),
 ('U04','图鉴总览','collection:people','42人物关系 / 16兵器 / 18宝物真实收藏','三页签、双列卡、分页、详情','未遇/未获/已获；未知姓名不泄露'),
 ('U05','人物详情','person:zhao','PERSON_PROFILES / personRole / 收访盟遇','编入/移出、满编替换、取消、返回','五类关系按资格给动作；长内容滚动；旧半身源图仍登记'),
 ('U06','兵器与宝物详情','item:liannu','WEAPON_DATA / TREASURES / upgradeCost / xp / slots','永久升级、出征选择、佩戴/移出、替换确认','未获/足额/不足/满级；永久Lv与本局Ⅰ阶分别展示'),
 ('U07','胜利与重游结算','result','真实settle收据 / runId / 军功前后差 / troops','整备查看、下一关转场、试用兵器、回营','首通/重游/终局/保存失败；没有虚构星级'),
 ('U08','获得演出','reward:1','持久pendingRewardPresentation；不再次settle','主奖和托盘详情、返回、跳过、确认、未确认奖励恢复','单件/多件；0.3秒后可跳过；小屏托盘滚动'),
 ('U09','双关里程碑与终局','milestone:9','MILESTONES / 合法结算与迁移事务','第10关下篇开启、第20关重游、演出确认','上下篇/终局；不重复发奖'),
 ('U10','战败复盘','defeat','damageSources / practiceXP / 原loadout','调整编组、再战、回营','缺归因明确说明；已有归因用实际最高项给建议'),
 ('U11','暂停与确认','pause','同一个battle.paused / Platform音源暂停','继续、重开确认/取消、退出确认/取消','不透明确认层；取消不推进战斗，不丢永久配装'),
 ('U12','设置','settings','现有Platform.book设置 / 实际BRIDGE_BUILD','音效、震动、降低动态、返回','显示实际版本/构建/短指纹；降低动态仅本次运行'),
 ('U13','加载异常与迁移','error','真实load / FormalStore.notice与迁移 / SafeErrorOverlay','资源重试、保存重试、异常重载/回营、迁移确认','实际PNG请求中断恢复、写入失败恢复；不造百分比'),
]
record=[]
for ident,title,fixture,data,interaction,state in rows:
 key={'U09':'U09-upper','U13':'U13-save'}.get(ident,ident)
 record.append(dict(id=ident,title=title,runtime_integration='implemented_real_Cocos',data_binding=data,interaction=interaction,small_screen_state=state,sizes=['375x667','402x874','360x640','430x932'],actual_screenshot=f'media/{key}-375x667.jpg',device_acceptance='pending_not_installed'))
(U/'UI-PAGES.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
text='# U01—U13 实际接入清单\n\n全部页面运行于真实 Cocos Sprite/Graphics/Label。本地接入和操作已经执行；真机和最终视觉保持待验。\n\n|页面|真实数据|真实交互|小屏与必要状态|\n|---|---|---|---|\n'
for r in record:text+=f"|{r['id']} {r['title']}|{r['data_binding']}|{r['interaction']}|{r['small_screen_state']}|\n"
text+='\n四尺寸共92状态/尺寸组合，无越界或小于48逻辑像素的操作热区。这是几何检查，不代替文字、美术或真机验收。16个附加状态通过真实操作捕获，连续28步页面操作另有原速视频。部分旧人物源图是半身，不冒称新的完整立绘；降低动态为本次运行设置。\n'
(U/'UI-PAGES.md').write_text(text)
for name in ['page-matrix.json','page-flow.json','page-states.json','same-state-pairs.json','targeted-regression-summary.json','presentation-runtime.json','source-preservation.json','resource-retry.json','phone-installed-version.json']:
 shutil.copy2(E/name,U/name)
shutil.copy2(E/'native/bridge-build-manifest.json',U/'bridge-build-manifest.json')
shutil.copy2(E/'native/package-inspection.json',U/'package-inspection.json')
links=''.join(f'<li><a href="./?yilu-review=UI:{fixture}">{ident} {html.escape(title)}</a><small>{html.escape(state)}</small></li>' for ident,title,fixture,_,_,state in rows)
style='<style>body{background:#101d2b;color:#f3eee1;max-width:1000px;margin:30px auto;padding:16px;font:16px/1.7 system-ui}a{color:#f1d9a0}li{margin:16px 0}small{display:block;color:#b5bec6}img,video{max-width:100%;vertical-align:top}section{padding:16px 0;border-top:1px solid #506071}video{height:600px}</style>'
head='<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
(W/'review.html').write_text(head+style+'<title>UI-FINAL 实际页面</title><h1>一路长歌 UI-FINAL 实际页面</h1><p>链接打开实际Cocos场景。验收入口使用隔离内存存档，合法收藏仅用于查看状态；不会把示范存档写进iPhone。</p><p><a href="./">正常新游戏</a> · <a href="./?yilu-review=UI:regression">第11关主将连弩专项</a></p><ul>'+links+'</ul><p>手机版本仍为0.12.1 / 2026100102。辅助版不是手机版验收。</p></html>')
body=''.join(f'<section id="{r["id"]}"><h2>{r["id"]} {html.escape(r["title"])}</h2><a href="http://127.0.0.1:43214/?yilu-review=UI:{rows[i][2]}">实际打开、操作</a><p>{html.escape(r["data_binding"])}<br>{html.escape(r["interaction"])}<br>小屏：{html.escape(r["small_screen_state"])}</p><a href="{r["actual_screenshot"]}"><img loading="lazy" src="{r["actual_screenshot"]}" width="300"></a></section>' for i,r in enumerate(record))
pairs=''.join(f'<a href="media/pair-{i}-board.jpg"><img loading="lazy" src="media/pair-{i}-board.jpg" width="440"></a>' for i in ['U01','U02','U03','U04','U05','U07','U08','U11','U12'])
(U/'index.html').write_text(head+style+'<title>UI-FINAL 真实核验</title><h1>UI-FINAL 真实核验</h1><p>0.12.2 / 2026100103 独立构建。13类页面已接入；未安装手机，手机仍是0.12.1 / 2026100102。</p><p><a href="http://127.0.0.1:43214/review.html">13页可操作入口</a> · <a href="README.md">启动与待验</a> · <a href="UI-PAGES.md">逐页数据</a></p><h2>连续页面操作 · 原速</h2><p>真实系统触控。独立场景之间重新打开隔离状态，不是一份存档连续通关。视频没有声音。</p><video controls src="media/page-operation-original-speed.mp4"></video><h2>第11关主将连弩 · 原速</h2><p>自然关卡推进，路线选择采用DEBUG可见目标输入；后段为单独方向和异常恢复场景。不是真机，没有快进。</p><video controls src="media/c11-liannu-original-speed.mp4"></video><h2>同状态前后</h2><p>同一构建运行保留的旧布局与新布局，配装/进度/军功相同；不是归档旧手机包与新手机截图。新详情和确认页没有同名旧页，不伪造前图。</p>'+pairs+'<h2>逐页</h2>'+body+'</html>')
print('13-page index generated')
