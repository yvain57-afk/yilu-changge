from pathlib import Path
import json
from PIL import Image
from collections import deque
import numpy as np
P=Path(__file__).resolve().parent;ROOT=P.parents[1];a=json.loads((P/'frame-map.json').read_text());m=json.loads((P/'actor-metadata.json').read_text());cache={};rows=[]
for key,f in a['frames'].items():
 if m[key]['role']=='hand_occlusion':continue
 if f['s'] not in cache:cache[f['s']]=Image.open(ROOT/'assets/resources'/(a['sheets'][f['s']]+'.png')).convert('RGBA')
 x,y,w,h=f['r'];im=cache[f['s']].crop((x,y,x+w,y+h));mask=np.array(im)[:,:,3]>128;seen=np.zeros_like(mask);components=[]
 for sy,sx in zip(*np.where(mask)):
  if seen[sy,sx]:continue
  q=deque([(int(sx),int(sy))]);seen[sy,sx]=1;xs=[];ys=[]
  while q:
   xx,yy=q.popleft();xs.append(xx);ys.append(yy)
   for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
    if 0<=nx<w and 0<=ny<h and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((nx,ny))
  if len(xs)>=80:components.append({'pixels':len(xs),'box':[min(xs),min(ys),max(xs)+1,max(ys)+1]})
 components.sort(key=lambda a:-a['pixels']);rows.append({'key':key,'components':components,'suspect':len(components)>1})
result={'scope':'alpha connected-component diagnostic; detached candidates require semantic review','rows':rows};(ROOT/'evidence/R3-COMBAT-PATCH-20261002/source-component-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps([r for r in rows if r['suspect']]))
