"""Build a portable review gallery from unaltered native screenshot/video artifacts."""
import pathlib,shutil,json,html
r=pathlib.Path(__file__).resolve().parents[1];e=r/'evidence/IOS-POLISH-ROUND2-20260929';out=r/'deliverables/IOS-POLISH-ROUND2-20260929';(out/'media').mkdir(parents=True,exist_ok=True)
groups={
'整备与奖励':[('R2-empty-after','空编 · 全锁'),('R2-partial-after','部分解锁'),('R2-equipped-after','完整编组'),('R2-result-0-after','首通 · 宝物奖励'),('R2-result-9-after','首通 · 收访盟与成长'),('R2-replay-after','重游胜利')],
'军中图鉴':[('R2-people-after','六人统一卡面'),('R2-unknown-after','未遇暗卡'),('R2-person-machao-after','统一人物详情')],
'战场与军阵':[('R2-march-20-after','20兵 · 小队'),('R2-march-80-after','80兵 · 中队'),('R2-march-120-after','120兵 · 大队'),('R2-march-180-after','180兵 · 军阵'),('R2-boss-120-after','敌将与将台护卫')],
'小屏原生验证':[('compact/R2-empty-after','小屏整备'),('compact/R2-people-after','小屏图鉴'),('compact/R2-person-machao-after','小屏详情'),('compact/R2-result-9-after','小屏结算'),('compact/R2-march-180-after','小屏高兵力')]
}
groups['全部人物卡与能力详情']=[('compact/R2-people-'+str(n)+'-after','图鉴第 '+str(n+1)+' 页') for n in range(1,5)]+[('compact/R2-person-'+who+'-after',label) for who,label in [('guan','关羽 · 随军与共鸣'),('jiang','姜维 · 随军'),('hua','华佗 · 战损支援')]]
body=[];missing=[]
for name,items in groups.items():
 cards=[]
 for stem,label in items:
  src=e/(stem+'.png') if stem.startswith('compact/') else e/'final'/(stem+'.png')
  if not src.exists():missing.append(str(src.relative_to(e)));continue
  dest=out/'media'/(stem.replace('/','-')+'.png');shutil.copy2(src,dest);side=src.with_suffix('.json')
  if side.exists():shutil.copy2(side,dest.with_suffix('.json'))
  cards.append(f'<figure><a href="media/{dest.name}" target="_blank"><img loading="lazy" src="media/{dest.name}"></a><figcaption>{label}</figcaption></figure>')
 body.append('<section><h2>'+name+'</h2><div class="grid">'+''.join(cards)+'</div></section>')
comparisons=[]
for stem,label in [('S05','同进度整备'),('S01-machao','马超详情'),('S04','97兵／周瑜收势')]:
 items=[]
 for version,path in [('修改前',e/'before'/(stem+'.png')),('修改后',e/'final'/(stem+'-after.png'))]:
  if path.exists():
   dest=out/'media'/(stem+('-before' if version=='修改前' else '-after')+'.png');shutil.copy2(path,dest);items.append(f'<figure><img loading="lazy" src="media/{dest.name}"><figcaption>{version}</figcaption></figure>')
 comparisons.append('<h3>'+label+'</h3><div class="compare">'+''.join(items)+'</div>')
body.insert(0,'<section><h2>真实 Cocos 前后对照</h2><p>同一角色、进度或战斗状态的原生截图；点击图片可看原始分辨率。</p>'+''.join(comparisons)+'</section>')
vid=[]
for p in (out/'media').glob('*.mp4'):vid.append('<figure><video controls preload="metadata" src="media/'+p.name+'"></video><figcaption>'+html.escape(p.stem)+'</figcaption></figure>')
if vid:body.insert(0,'<section><h2>原速运行录像</h2>'+''.join(vid)+'</section>')
(out/'index.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一路长歌 · iOS 第二轮核验</title><style>body{margin:0;background:#101d2b;color:#e9e1d0;font:16px/1.7 system-ui}main{max-width:1150px;margin:auto;padding:30px 20px}h1,h2,h3{color:#e5c989}h1{font-size:30px}section{margin:44px 0}p{color:#bec7cd}a{color:#edcf8f}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px}.compare{display:grid;grid-template-columns:repeat(2,minmax(0,330px));gap:20px}figure{margin:0}img{width:100%;display:block;border:1px solid #53606b}figcaption{padding:10px 0;font-size:14px}video{width:100%;max-height:700px;background:#000}header{border-bottom:1px solid #53606b;padding-bottom:20px}.tag{font-size:13px;letter-spacing:2px}details{margin:20px 0}</style><main><header><div class="tag">IOS-POLISH-ROUND2-20260929 · 0.11.0</div><h1>一路长歌：三国</h1><p>保留十关与既有玩法，本轮升级整备、图鉴、结算、地表、军阵和敌军阵型。</p><p>本页固定状态截图均来自实际 Cocos 原生运行。兵力档位与全解锁页面使用独立测试存档；完整关卡回归另列运行记录，不冒充人工触控验收。</p><a href="REPORT.md">分项说明与验证边界</a></header>'''+''.join(body)+'</main></html>')
print(json.dumps({'screenshots':len(list((out/'media').glob('*.png'))),'missing':missing},ensure_ascii=False))
