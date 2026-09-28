from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];im=Image.open(root/'art-source/formal20260927/props-source.png').convert('RGBA');p=root/'assets/scripts/formal/manifest.ts';m=json.loads(p.read_text().split('export const MANIFEST:any=')[1].rstrip(';\n'))
keys=['g_wave_spear','g_wave_guandao','g_wave_shemao','g_wave_huaji','g_platform','g_mount_chitu0','g_mount_chitu1','g_mount_dilu0','g_icon_shuangji','g_icon_qinggang','g_icon_yitian','g_icon_shuanggu','g_icon_guding','g_icon_liannu','g_snakeTrail','g_mount_dilu1'];ys=[0,373,706,985,1269];xs=[0,310,620,930,1240];atlas=Image.new('RGBA',(1536,1536));x=y=4;rowh=0;rects={}
for i,key in enumerate(keys):
 row,col=divmod(i,4);xs=([0,308,622,929,1240] if row==0 else [0,343,634,936,1240] if row==1 else [0,310,625,934,1240]);tile=im.crop((xs[col],ys[row],xs[col+1],ys[row+1]));box=tile.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox();tile=tile.crop(box)
 if x+tile.width+4>1536:x=4;y+=rowh+8;rowh=0
 atlas.paste(tile,(x,y));rects[key]=[x,y,tile.width,tile.height];m['frames'][key]={'s':'formal_props','r':rects[key],'a':[.5,.5 if 'wave' in key or 'icon' in key or 'Trail' in key else 0]};rowh=max(rowh,tile.height);x+=tile.width+8
atlas=atlas.crop((0,0,1536,y+rowh+4));atlas.save(root/'assets/resources/formal20260927/formal-props.png');m['sheets']['formal_props']='formal20260927/formal-props';p.write_text('// Imported source frame geometry; do not hand-edit.\nexport const MANIFEST:any='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n');print(len(keys),atlas.size)
