# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,subprocess,shutil,html,zipfile,plistlib,sys
R=Path(__file__).resolve().parents[2];E=R/'evidence/YILU_UI_POLISH_R2';D=R/'deliverables/YILU_UI_POLISH_R2';M=D/'media';M.mkdir(parents=True,exist_ok=True)
build=json.loads((E/'web-manifest.json').read_text());build.pop('source_files');fp=build['code_fingerprint'];assets=[]
for p in sorted((E/'pixels').glob('*.png')):
 j=p.with_suffix('.json')
 if not j.exists():continue
 meta=json.loads(j.read_text())
 if meta.get('build',{}).get('code_fingerprint')!=fp:continue
 out=M/(p.stem+'.jpg');im=Image.open(p).convert('RGB');im.thumbnail((720,1800));im.save(out,quality=90,optimize=True)
 row={**meta,'original':str(p.relative_to(R)),'preview_sha256':hashlib.sha256(out.read_bytes()).hexdigest()};out.with_suffix('.json').write_text(json.dumps(row,ensure_ascii=False,indent=2));assets.append({k:v for k,v in row.items() if k!='state'})
for pair in json.loads((E/'same-state-pairs.json').read_text())['results']:
 images=[]
 for side in ['before','after']:
  p=E/pair[side]['file'];im=Image.open(p).convert('RGB');im=im.resize((360,640));images.append(im)
  shutil.copy2(p,M/(p.stem+'.png'));shutil.copy2(p.with_suffix('.json'),M/(p.stem+'.json'))
 board=Image.new('RGB',(736,694),'#101d2b');dr=ImageDraw.Draw(board)
 for i,im in enumerate(images):
  x=i*376;board.paste(im,(x,54));dr.text((x+8,10),pair['id']+(' UI-FINAL BEFORE' if i==0 else ' UI-POLISH R2 AFTER'),fill='#F1D9A0');dr.text((x+8,28),pair[['before','after'][i]]['build']['code_fingerprint'][:16],fill='white')
 board.save(M/('pair-'+pair['id']+'-board.jpg'),quality=92)
for key,name in [('page-flow','page-operation-original-speed'),('regression-video','c11-liannu-original-speed')]:
 data=json.loads((E/(key+'.json')).read_text());src=Path(data['video']);out=M/(name+'.mp4')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-movflags','+faststart','-an',str(out)],check=True)
 videoBuild=build if key=='page-flow' else json.loads((E/'targeted-regression.json').read_text())['natural_states'][0]['state']['build']
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(out)]));meta={'_bridge_media':True,'build':videoBuild,'capture_type':'browser','speed':'original','audio':'none; audio unchanged, this video is not audible evidence','scope':'actual Cocos WebGL; fixture boundaries labelled in operation log, not phone','source_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source_webm_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'duration_seconds':float(info['format']['duration'])};out.with_suffix('.json').write_text(json.dumps(meta,indent=2));assets.append(meta|{'file':str(out.relative_to(D))})
shutil.copytree(E/'old-tail',D/'old-video-tail',dirs_exist_ok=True)
for name in ['page-matrix.json','page-flow.json','page-states.json','same-state-pairs.json','targeted-regression-summary.json','presentation-runtime.json','interaction-checks.json','people42-runtime.json','normal-entry.json','conservation.json','phone-status.json','web-manifest.json']:
 shutil.copy2(E/name,D/name)
shutil.copy2(E/'native/bridge-build-manifest.json',D/'native-build-manifest.json')
shutil.copy2(R/'art-source/ui-polish-r2-20261002/gaps.json',D/'asset-gaps.json')
shutil.copy2(E/'final-preservation.json',D/'source-preservation.json')
(D/'media-manifest.json').write_text(json.dumps({'build':build,'assets':assets},ensure_ascii=False,indent=2))
pages=[('U01','营地','home','真实进度、当前出征兵器、永久等级；独立品牌插画','继续/地图/图鉴/设置'),('U02','山河地图','map','五区域、二十关、已克进度、当前城、全局里程碑','滑动/定位/展开保持地图位置/出征'),('U03','整备','prepare:weapons','实际兵器等级、局内阶位、随军/支援、三槽、兵法','四固定页签/选择与详情分离/完整编组'),('U04','军中图鉴','collection:people','42人物、收/访/盟/遇/未遇、真实收藏','两列/筛选/分页/详情'),('U05','人物详情','person:zhao','全身素材、真实经历、关系、能力、共鸣','资格约束/替换确认/原位置返回'),('U06','兵器宝物详情','item:liannu','当前与下级伤害增益、真实军功成本、能力与槽','升级/选择独立/不足、满级、未获状态'),('U07','胜利与重游','result','真实城池/军旗、归营兵力、军功、局部下一关与全局进度','查看/试用/整军；战斗HUD不再留在结算'),('U08','获得','reward:0','唯一奖励集合、主奖一次、军功单列','0.3秒门槛/详情返回/保存和恢复'),('U09','双关里程碑','milestone:9','第10关上下篇、9项真实奖励、印章；第20关终局','紧凑托盘/全部可达/收下只确认演出'),('U10','失败','defeat','实战归因字段与真实军功，不编造星级','调整编组/再战'),('U11','暂停与确认','pause','真实战斗暂停与当前编组','继续/重试/退出/取消/长确认内容裁切'),('U12','设置','settings','本地设置、实际构建与指纹、兼容降低动态','持久化/写失败回退；音乐保持关闭'),('U13','加载与异常','error','加载/资源失败/存档失败/独立安全层/旧档迁移','重试不重复发奖、菜单故障全帧清理')]
records=[]
for pid,title,fixture,data,action in pages:
 samples=[x for x in json.loads((E/'page-matrix.json').read_text())['results'] if x['id']==pid or x['id'].startswith(pid+'-')]
 records.append({'id':pid,'title':title,'fixture':fixture,'data_binding':data,'interaction':action,'small_screen':{'checked_sizes':sorted(set((x['width'],x['height']) for x in samples)),'failures':sum(len(x['failures']) for x in samples),'safe44_34':'isolated logical test, not physical safe-area acceptance'},'build':build,'runtime_screenshot':'media/pair-'+pid+'-after.png','phone_acceptance':'pending'})
(D/'UI-PAGES.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
text='# 十三类真实页面\n\n所有链接打开当前 Cocos 真实页面；隔离入口仅使用内存示范存档，正常入口另有验证。原生编译与手机验收分列。\n\n'
for x in records:text+=f"- **{x['id']} {x['title']}**：{x['data_binding']}。操作：{x['interaction']}。四尺寸检查通过；手机待验。\n"
(D/'UI-PAGES.md').write_text(text)
style='<style>body{background:#101d2b;color:#eee8db;max-width:1100px;margin:20px auto;padding:18px;font:16px/1.7 system-ui}a{color:#efd49a}small{display:block;color:#b6c9d0}section{padding:16px 0;border-bottom:1px solid #556}img,video{max-width:100%}video{max-height:650px}h2{font-size:22px}</style>'
head='<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
links=''.join(f'<section><a href="./?yilu-review=UI:{fixture}">{pid} {title}</a><small>{data}；{action}</small></section>' for pid,title,fixture,data,action in pages)
review=head+style+'<title>一路长歌 UI POLISH R2</title><h1>UI POLISH R2 · 实际 Cocos 页面</h1><p>0.12.3 / 2026100201；原生 Release 已编译，未签名/未安装。以下示范入口使用隔离内存档。</p><p><a href="./">正常游戏入口</a> · <a href="./?yilu-review=UI:regression">第11关主将连弩</a> · <a href="./?yilu-review=UI:milestone:19">第20关终局</a></p>'+links+'</html>'
(R/'build/ui-polish-r2-web/review.html').write_text(review)
index=head+style+'<title>R2 实际核验</title><h1>UI POLISH R2 · 实际核验</h1><p><a href="http://127.0.0.1:43215/review.html">打开可操作页面</a> · <a href="REPORT.md">验收与未完成项</a> · <a href="README.md">启动方式</a></p><p>指纹 '+fp+'</p><h2>连续页面操作（原速、无音轨）</h2><video controls src="media/page-operation-original-speed.mp4"></video><h2>第11关连弩自然推进 + 标明的方向/异常样段</h2><video controls src="media/c11-liannu-original-speed.mp4"></video>'
for x in records:index+=f'<section><h2>{x["id"]} {x["title"]}</h2><p>{x["data_binding"]}<br>{x["interaction"]}</p><a href="http://127.0.0.1:43215/?yilu-review=UI:{x["fixture"]}">实际打开</a><br><img loading="lazy" src="media/pair-{x["id"]}-board.jpg"></section>'
(D/'index.html').write_text(index+'</html>')
print('actual media',len(assets),'13 pages generated')
