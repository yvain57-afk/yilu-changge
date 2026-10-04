from pathlib import Path
import json,re
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent; R=P.parents[1];m=json.loads((P/'manifest-reference.json').read_text());a=json.loads((R/'art-source/regression-20261001/pose-targeted/frame-map.json').read_text())
for t in ['frames','sheets']:m[t].update(a[t])
s=(R/'assets/scripts/formal/data.ts').read_text();body=re.search(r'export const PEOPLE:Record<string,string>=\{([^\n]+)\};',s).group(1);ids=re.findall(r"(\w+):'([^']+)'",body);out={};b=Image.new('RGB',(1400,320*6),(217,214,201));d=ImageDraw.Draw(b)
for n,(i,name) in enumerate(ids):
 candidates=['r27_char_'+i+'_run0','c20_char_'+i+'_run','g_detail_'+i,'g_front_'+i+'Run0','g_boss_'+i+'_idle']+(['g_lubuIdle'] if i=='lubu' else [])
 k=next((k for k in candidates if k in m['frames']),None);out[i]={'name':name,'frame':k,'source':'existing-full-body','visualInspected':False}
 if not k:continue
 f=m['frames'][k];x,y,w,h=f['r'];im=Image.open(R/('assets/resources/'+m['sheets'][f['s']]+'.png')).crop((x,y,x+w,y+h));im.thumbnail((192,275));xx=n%7*200;yy=n//7*320;b.paste(im,(xx+(200-im.width)//2,yy),im);d.text((xx+2,yy+278),i,fill='black');d.text((xx+2,yy+294),k,fill='black')
b.save(P/'people42-fullbody-qa.jpg',quality=95);(P/'people-fullbody-map.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n');print('mapped',len(out),'missing',[i for i,v in out.items() if not v['frame']])
