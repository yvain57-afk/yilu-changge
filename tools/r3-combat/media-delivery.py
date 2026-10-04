"""Package actual recorded pixels without relabelling their embedded runtime version."""
from pathlib import Path
import json, subprocess, hashlib, shutil
from PIL import Image, ImageDraw, ImageFont
R=Path(__file__).resolve().parents[2]
E=R/'evidence/R3-COMBAT-PATCH-20261002'; D=R/'deliverables/R3-COMBAT-PATCH-20261002'
M=D/'media'; M.mkdir(parents=True,exist_ok=True)
font_path=next(p for p in ['/System/Library/Fonts/PingFang.ttc','/System/Library/Fonts/STHeiti Medium.ttc'] if Path(p).is_file())
font=ImageFont.truetype(font_path,22)
small=ImageFont.truetype(font_path,16)
def read(p): return json.loads(p.read_text())
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def relative(p):
 try: return str(p.resolve().relative_to(R))
 except ValueError: return str(p)
def compact(b): return {k:v for k,v in b.items() if k!='source_files'}
def record_build(data):
 found=[]
 if data.get('build'): found.append(data['build'])
 for row in data.get('rows',[])+data.get('results',[]):
  b=row.get('build') or row.get('state',{}).get('build')
  if b: found.append(b)
 fps={b.get('code_fingerprint') for b in found}
 if len(fps)!=1 or None in fps: raise ValueError('missing/mixed embedded build fingerprint')
 return compact(found[0])
def preserve(out,source_sha):
 side=out.with_suffix('.json')
 if out.exists():
  prior=read(side) if side.exists() else {}
  if prior.get('recorder_source_sha256')!=source_sha:
   archive=M/'archive'/((prior.get('build') or {}).get('code_fingerprint','unknown')[:12]);archive.mkdir(parents=True,exist_ok=True)
   shutil.copy2(out,archive/out.name)
   if side.exists(): shutil.copy2(side,archive/side.name)
current=compact(read(E/'web-manifest.json')); pairs=[];videos=[];missing=[]
for label,key in [('首页构图','home-402x874'),('偃月刀站姿与握持','lineup-402x874'),('吕布／马超收势比例','c16-lubu-machao-rec')]:
 files=[E/'menu/pixels'/('before-'+key+'.png'),E/'menu/pixels'/('after-'+key+'.png')]
 try:
  metas=[read(p.with_suffix('.json')) for p in files]
  for p,m in zip(files,metas):
   assert m['state']['screen']!='render-error' and not m['state'].get('renderErrors')
   assert m['source_sha256']==digest(p),'source hash changed'
  protected=['cleared','captures','visits','allies','weapons','treasures','weaponLevels','selectedWeaponId','slots','companions','support','mainTactic','claimed','xp']
  assert all(metas[0]['state']['save'].get(k)==metas[1]['state']['save'].get(k) for k in protected),'paired state changed'
  ims=[Image.open(p).convert('RGB') for p in files];assert ims[0].size==ims[1].size
  ims=[im.resize((402,874),Image.Resampling.LANCZOS) for im in ims]
  canvas=Image.new('RGB',(824,978),'#18283b');draw=ImageDraw.Draw(canvas)
  draw.text((12,8),label,font=font,fill='#f1d494')
  for x,side,m in zip([12,424],['旧','新'],metas): draw.text((x,43),side+' '+m['build']['code_fingerprint'][:8],font=small,fill='white')
  canvas.paste(ims[0],(8,72));canvas.paste(ims[1],(414,72));draw.text((12,949),'实际 Cocos WebGL · 隔离同状态；不是概念图或真机',font=small,fill='white')
  out=M/(key+'-before-after.jpg');canvas.save(out,quality=93)
  pair={'label':label,'file':relative(out),'sources':[relative(p) for p in files],'source_sha256':[digest(p) for p in files],'beforeBuild':compact(metas[0]['build']),'afterBuild':compact(metas[1]['build']),'protectedModelStateEqual':True,'scope':'Actual same-state Cocos WebGL screenshots; not physical device.'}
  out.with_suffix('.json').write_text(json.dumps(pair,ensure_ascii=False,indent=2));pairs.append(pair)
 except (FileNotFoundError,KeyError,AssertionError,ValueError) as exc: missing.append({'item':key,'reason':str(exc)})
def convert(name,rec,menu=False):
 if not rec.exists(): missing.append({'item':name,'reason':'runtime record not produced'});return
 data=read(rec)
 try:
  build=record_build(data)
  row=next((r for r in data.get('rows',[]) if r.get('video')),None)
  src=Path(data.get('video') or (row or {}).get('video') or '')
  if not src.is_file(): raise ValueError('recorded WebM missing')
  src_sha=digest(src);out=M/(name+'-original-speed.mp4');preserve(out,src_sha)
  subprocess.run(['/Users/yvainair/.local/bin/ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(out)],check=True)
  stamp={'_bridge_media':True,'capture_type':'browser','speed':'original','build':build,'source_sha256':digest(out),'recorder_source_sha256':src_sha,'scope':data.get('scope','Actual recorded Cocos browser run; see runtime record for limits.'),'audio':'No audio in Playwright recording; not native or listening acceptance','recorder_source':relative(src),'runtime_record':relative(rec),'pageErrors':data.get('pageErrors'), 'record_rows':len(data.get('rows',[]))}
  out.with_suffix('.json').write_text(json.dumps(stamp,ensure_ascii=False,indent=2));videos.append({'file':relative(out),**stamp})
 except (FileNotFoundError,KeyError,ValueError) as exc:missing.append({'item':name,'reason':str(exc)})
for name,f in [('actors','actors-record.json'),('natural','natural-record.json'),('natural-mounted','natural-mounted-record.json'),('natural20','natural20-record.json'),('seven-route','seven-route-runtime.json'),('cavalry-hit-avoid','cavalry-hit-avoid-record.json'),('mount-cycles-chitu','mount-cycles-chitu-record.json'),('mount-cycles-dilu','mount-cycles-dilu-record.json'),('old-enemy-route','old-enemy-route.json')]:convert(name,E/'runtime'/f)
convert('menu',E/'menu/menu-runtime.json',True)
convert('final-menu-smoke',E/'menu/final-menu-smoke.json',True)
audio_file=M/'game-output-audio.m4a';audio=[]
if audio_file.exists() and audio_file.with_suffix('.json').exists():audio=[{'file':relative(audio_file),**read(audio_file.with_suffix('.json'))}]
(D/'media-index.json').write_text(json.dumps({'build':current,'build_scope':'Current exported candidate; each medium has its own embedded version, not assumed current.','pairs':pairs,'videos':videos,'audio':audio,'missing':missing},ensure_ascii=False,indent=2))
print('pairs',len(pairs),'videos',len(videos),'missing',len(missing))
