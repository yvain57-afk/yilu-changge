from pathlib import Path
import hashlib,json,subprocess
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2];E=R/'evidence/YILU_UI_POLISH_R2/old-tail';E.mkdir(parents=True,exist_ok=True)
p=R/'deliverables/YILU-REGRESSION-FIRST-UI-FULL-20261001/UI-FINAL/media/c11-liannu-original-speed.mp4'
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]));rows=[]
for sec in [128.26,130,132,134,136,138,139.8]:
 out=E/(str(sec).replace('.','-')+'.png');subprocess.run(['ffmpeg','-v','error','-y','-ss',str(sec),'-i',str(p),'-frames:v','1',str(out)],check=True)
 rows.append({'source_time_seconds':sec,'file':str(out.relative_to(R)),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
board=Image.new('RGB',(7*240,580),'#101d2b');dr=ImageDraw.Draw(board)
for i,row in enumerate(rows):
 im=Image.open(R/row['file']).convert('RGB');im.thumbnail((240,535));board.paste(im,(i*240,35));dr.text((i*240+10,10),str(row['source_time_seconds'])+'s',fill='white')
board.save(E/'contact.jpg',quality=90)
(E/'manifest.json').write_text(json.dumps({'source':str(p.relative_to(R)),'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'duration':float(info['format']['duration']),'requested_range':[128.26,139.92],'rows':rows,'claim':'Frames are from the archived UI-FINAL movie, not the new candidate. Frame interpretation recorded after actual inspection.'},indent=2))
