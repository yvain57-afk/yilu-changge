from PIL import Image
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1];p=root/'assets/scripts/formal/manifest.ts';m=json.loads(p.read_text().split('export const MANIFEST:any=')[1].rstrip(';\n'))
sets={'bossactions':(['jiao','dong','dian','cao','sunce','zhou','zhang','guan','zhuge'],['wind','rec','hit'],'g_boss_'), 'fronts':(['xu','liao','xiahou','lumeng','luxun','zhao','huang','pang','machao'],['Run0','Run1','Hurt'],'g_front_'), 'runs':(['guding','shuangji','yitian','qinggang','shuanggu','liannu'],['run0','run1','run2','run3'],'g_hero_'), 'heroes':(['guding','shuangji','yitian','qinggang','shuanggu','liannu'],['run','wind','rel','rec'],'g_hero_'), 'companions':(['xu','liao','xiahou','lumeng','sunxiang','luxun','huang','machao','jiang'],['Run0','Run1','Thrust'],'g_'), 'owners':(['lubu','dian','guan'],['Run0','Run1','Wind','Thrust'],'g_'), 'mounted':(['chitu','dilu'],['run0','run1','wind','rel'],'g_ride_')}
for name in sys.argv[1:]:
 ids,poses,prefix=sets[name];im=Image.open(root/f'art-source/formal20260927/{name}-source.png').convert('RGBA');atlas=Image.new('RGBA',(2048,2048));x=y=4;rh=0;frames=[];standing={}
 for i,id in enumerate(ids):
  for j,pose in enumerate(poses):
   tile=im.crop((round(j*im.width/len(poses)),round(i*im.height/len(ids)),round((j+1)*im.width/len(poses)),round((i+1)*im.height/len(ids))));box=tile.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox();tile=tile.crop(box)
   if x+tile.width+4>2048:x=4;y+=rh+8;rh=0
   atlas.paste(tile,(x,y));key=prefix+id+('_' if name in ['heroes','mounted','runs','bossactions'] else '')+pose
   if j==0:standing[id]=tile.height*(.8 if name!='mounted' else 1)
   frames.append((key,id,[x,y,tile.width,tile.height]));rh=max(rh,tile.height);x+=tile.width+8
 if y+rh>2048:raise ValueError(name+' overflow')
 atlas=atlas.crop((0,0,2048,y+rh+4));atlas.save(root/f'assets/resources/formal20260927/formal-{name}.png');m['sheets']['formal_'+name]='formal20260927/formal-'+name
 for key,id,rect in frames:m['frames'][key]={'s':'formal_'+name,'r':rect,'a':[.5,0],'bh':standing[id]}
 print(name,len(frames),atlas.size)
p.write_text('// Imported source frame geometry; do not hand-edit.\nexport const MANIFEST:any='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n')
