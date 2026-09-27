"""Technical atlas extraction. Keeps all supplied/source pixels; records crops and anchors."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
p=root/'assets/scripts/formal/manifest.ts';m=json.loads(p.read_text().split('export const MANIFEST:any=')[1].rstrip(';\n'))
im=Image.open(root/'art-source/formal20260927/enemies-source.png').convert('RGBA')
ys=[0,186,371,542,714,889,1068,1232,1385,1536];ids=['jiao','dong','dian','cao','sunce','zhou','zhang','guan','zhuge'];tiles=[]
for row,id in enumerate(ids):
 for col,pose in enumerate(['idle','strike','spent']):
  tile=im.crop((col*im.width//3,ys[row],(col+1)*im.width//3,ys[row+1]));bounds=tile.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
  if not bounds:raise ValueError((id,pose))
  tile=tile.crop(bounds);tiles.append((id,pose,tile,bounds))
atlas=Image.new('RGBA',(1024,2048));x=y=4;rowh=0;rects={}
for id,pose,tile,crop in tiles:
 if x+tile.width+4>1024:x=4;y+=rowh+8;rowh=0
 atlas.paste(tile,(x,y));rects[id+'_'+pose]=[x,y,tile.width,tile.height];rowh=max(rowh,tile.height);x+=tile.width+8
if y+rowh>2048:raise ValueError('atlas overflow')
atlas=atlas.crop((0,0,1024,y+rowh+4));atlas.save(root/'assets/resources/formal20260927/formal-enemies.png')
m['sheets']['formal_enemies']='formal20260927/formal-enemies'
for id,pose,tile,crop in tiles:
 ref=rects[id+'_idle'][3]*.83
 m['frames']['g_boss_'+id+'_'+pose]={'s':'formal_enemies','r':rects[id+'_'+pose],'a':[.5,0],'bh':ref,'sourceCrop':crop}
p.write_text('// Imported source frame geometry; do not hand-edit.\nexport const MANIFEST:any='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'art-source/formal20260927/slice-ledger.json').write_text(json.dumps({'source':'enemies-source.png','rows':ys,'columns':3,'frames':rects},indent=2))
print('27 native enemy frames',atlas.size)
