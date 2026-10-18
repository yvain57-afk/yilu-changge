"""Pack complete generated actors, preserving crossing weapons and alpha. No painted pixels."""
from pathlib import Path
from collections import deque
import hashlib,json,uuid
import numpy as np
from PIL import Image,ImageFilter,ImageDraw

P=Path(__file__).resolve().parent
R=P.parents[2]
im=Image.open(P/'source.png').convert('RGBA'); pix=np.array(im)
mask=pix[:,:,3]>32;h,w=mask.shape;seen=np.zeros_like(mask);components=[]
for sy,sx in zip(*np.where(mask)):
 if seen[sy,sx]:continue
 q=deque([(int(sx),int(sy))]);seen[sy,sx]=1;xy=[]
 while q:
  x,y=q.popleft();xy.append((x,y))
  for u,v in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
   if 0<=u<w and 0<=v<h and mask[v,u] and not seen[v,u]:seen[v,u]=1;q.append((u,v))
 if len(xy)>200:
  a=np.array(xy);components.append({'xy':a,'box':[int(a[:,0].min()),int(a[:,1].min()),int(a[:,0].max()+1),int(a[:,1].max()+1)]})
# Source visual review: root is ground contact, not top of raised blade.
anchors=[(194,334),(488,290),(776,350),(1096,340),(176,684),(480,677),(776,685),(1070,670),
         (170,953),(480,945),(774,948),(1073,950),(166,1243),(474,1242),(762,1221),(1070,1210)]
def clean_actor(img):
 pixels=np.array(img); m=pixels[:,:,3]>32;hh,ww=m.shape;seen=np.zeros_like(m);best=[]
 for sy,sx in zip(*np.where(m)):
  if seen[sy,sx]:continue
  q=deque([(int(sx),int(sy))]);seen[sy,sx]=1;coords=[]
  while q:
   x,y=q.popleft();coords.append((x,y))
   for u,v in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
    if 0<=u<ww and 0<=v<hh and m[v,u] and not seen[v,u]:seen[v,u]=1;q.append((u,v))
  if len(coords)>len(best):best=coords
 own=np.zeros_like(m,dtype=np.uint8)
 for x,y in best:own[y,x]=255
 pixels[:,:,3]=np.minimum(pixels[:,:,3],np.array(Image.fromarray(own).filter(ImageFilter.MaxFilter(3))))
 return Image.fromarray(pixels)
big=[c for c in components if len(c['xy'])>10000]
assert len(big)==16,('whole actor count',len(big))
big.sort(key=lambda c:((c['box'][1]+c['box'][3])/2//315,c['box'][0]))
# Explicit component map is repeatable and prevents heuristic row assignment of a high spear.
order=[3,1,0,2,4,5,6,7,9,8,10,11,12,13,14,15]
big0=[c for c in components if len(c['xy'])>10000]
big=[big0[i] for i in order]
atlas=Image.new('RGBA',(1664,1664));frames={};rows=[]
for i,(c,(ax,ay)) in enumerate(zip(big,anchors)):
 own=np.zeros((h,w),dtype=np.uint8);a=c['xy'];own[a[:,1],a[:,0]]=255
 # Reject detached generated debris; all retained actor limbs are connected.
 alpha=np.minimum(np.array(Image.fromarray(own).filter(ImageFilter.MaxFilter(3))),pix[:,:,3])
 actor=Image.fromarray(np.dstack((pix[:,:,:3],alpha)).astype(np.uint8))
 cell=actor.crop((ax-208,ay-390,ax+208,ay+26))
 # The first sheet repeated the same front leg. Use actual generated opposite
 # contact / passing poses, preserving sword/shield hand identity (never mirror).
 if i in (9,10,11):
  src='run-first-retry.png' if i==9 else 'left-contact.png' if i==10 else 'left-passing.png'
  alt=Image.open(P/src).convert('RGBA')
  if i==9:
   alt=clean_actor(alt.crop((alt.width//4,0,alt.width//2,alt.height)));box=alt.getbbox();alt=alt.crop(box)
   ratio=250/alt.height;alt=alt.resize((round(alt.width*ratio),250),Image.Resampling.LANCZOS)
   cell=Image.new('RGBA',(416,416));cell.alpha_composite(alt,(208-alt.width//2,390-alt.height))
  else:
   alt=clean_actor(alt)
   ratio=.216;ax2,ay2=(695,1205) if i==10 else (695,1144)
   scaled=alt.resize((round(alt.width*ratio),round(alt.height*ratio)),Image.Resampling.LANCZOS)
   cell=Image.new('RGBA',(416,416));cell.alpha_composite(scaled,(208-round(ax2*ratio),390-round(ay2*ratio)))
 assert cell.getbbox(),i
 atlas.alpha_composite(cell,((i%4)*416,(i//4)*416))
 kind='cavalry' if i<8 else 'light';pose=['run0','run1','run2','run3','wind','rel','hit','fallen'][i%8]
 key='bf_enemy_'+kind+'_'+pose
 frames[key]={'s':'bf_enemies','r':[(i%4)*416,(i//4)*416,416,416],'a':[.5,26/416],'bh':300 if kind=='cavalry' else 250}
 rows.append({'key':key,'sourceAnchor':[ax,ay] if i not in (9,10,11) else None,'sourceBounds':c['box'],'pixels':len(a),'alphaBounds':cell.getbbox(),'sourceFile':'art-source/battle-feel-20261004/enemies/'+(src if i in (9,10,11) else 'source.png'),'bh':frames[key]['bh']})
out=R/'assets/resources/formal20260927/feel-enemies.png';atlas.save(out)
meta=json.loads((out.parent/'r2-chitu-crossbow.png.meta').read_text());uid=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/battle-feel-20261004/enemies'))
meta['uuid']=uid;meta['userData']['redirect']=uid+'@6c48a';sub=meta['subMetas']['6c48a'];sub['uuid']=uid+'@6c48a';sub['displayName']=out.stem;sub['userData']['imageUuidOrDatabaseUri']=uid
out.with_suffix('.png.meta').write_text(json.dumps(meta,indent=2)+'\n')
art={'sheets':{'bf_enemies':'formal20260927/feel-enemies'},'frames':frames}
module=R/'assets/scripts/formal/BattleFeelEnemyArt.ts';module.write_text('/** Whole-source sprites; fixed ground anchors and anatomical scale. */\nexport const BATTLE_FEEL_ENEMY_ART='+json.dumps(art,separators=(',',':'))+';\n')
tm=json.loads((module.parent/'R2Art.ts.meta').read_text());tm['uuid']=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/BattleFeelEnemyArt.ts'));module.with_suffix('.ts.meta').write_text(json.dumps(tm,indent=2)+'\n')
(P/'frame-review.json').write_text(json.dumps({'sourceSha256':hashlib.sha256((P/'source.png').read_bytes()).hexdigest(),'outputSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'frames':rows},indent=2)+'\n')
board=Image.new('RGB',atlas.size,'#334338');board.paste(atlas,(0,0),atlas);d=ImageDraw.Draw(board)
for i,row in enumerate(rows):d.text((i%4*416+8,i//4*416+6),row['key'],fill='white')
board.save(P/'contact.png');print('packed',len(frames),'frames')
special=P.parent/'special-casualties/pack.py'
if special.exists():
 import subprocess,sys
 subprocess.run([sys.executable,str(special),'--append'],check=True)
