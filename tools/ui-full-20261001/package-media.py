from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,subprocess
R=Path(__file__).resolve().parents[2];E=R/'evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001/ui-continuation';D=R/'deliverables/YILU-REGRESSION-FIRST-UI-FULL-20261001/UI-FINAL';M=D/'media';M.mkdir(parents=True,exist_ok=True)
fp=json.loads((E/'web-final-manifest.json').read_text())['code_fingerprint'];rows=[]
for p in sorted((E/'pixels').glob('*.png')):
 j=p.with_suffix('.json')
 if not j.exists():continue
 meta=json.loads(j.read_text())
 if meta.get('build',{}).get('code_fingerprint')!=fp:continue
 out=M/(p.stem+'.jpg');im=Image.open(p).convert('RGB');im.thumbnail((720,1800));im.save(out,quality=88,optimize=True)
 row={**{k:v for k,v in meta.items() if k!='state'},'original':str(p.relative_to(R)),'preview':str(out.relative_to(D)),'preview_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'dimensions':im.size};rows.append(row)
 (M/(p.stem+'.json')).write_text(json.dumps({**row,'state':meta['state']},ensure_ascii=False,indent=2))
# Pure comparison assembly of unaltered runtime screenshots; same save data asserted in pairs.json.
for pair in json.loads((E/'same-state-pairs.json').read_text())['results']:
 ids=pair['id'];a=Image.open(M/('pair-'+ids+'-legacy.jpg'));b=Image.open(M/('pair-'+ids+'-full.jpg'));w=420;h=round(a.height*w/a.width);a=a.resize((w,h));b=b.resize((w,h));board=Image.new('RGB',(w*2+20,h+50),'#101d2b');board.paste(a,(0,50));board.paste(b,(w+20,50));dr=ImageDraw.Draw(board);dr.text((12,14),ids+' BEFORE / LEGACY LAYOUT',fill='#F1D9A0');dr.text((w+32,14),ids+' AFTER / UI-FINAL',fill='#F1D9A0');board.save(M/('pair-'+ids+'-board.jpg'),quality=88)
for key,name in [('page-flow','page-operation-original-speed'),('regression-video','c11-liannu-original-speed')]:
 data=json.loads((E/(key+'.json')).read_text());src=Path(data['video']);out=M/(name+'.mp4');
 if not out.exists():
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-movflags','+faststart','-an',str(out)],check=True)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(out)]));row={'_bridge_media':True,'capture_type':'browser','scope':'actual Cocos DEBUG system touch/labelled fixtures, not native phone','speed':'original browser wall time; no retiming','audio':'none; not audible evidence','build':json.loads((E/'web-final-manifest.json').read_text()),'source_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source_webm_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'duration_seconds':float(info['format']['duration']),'video':str(out.relative_to(D))};row['build'].pop('source_files',None);out.with_suffix('.json').write_text(json.dumps(row,ensure_ascii=False,indent=2));rows.append(row)
(D/'media-manifest.json').write_text(json.dumps({'code_fingerprint':fp,'assets':rows},ensure_ascii=False,indent=2));print('media',len(rows))
