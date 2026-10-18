from pathlib import Path
import json,hashlib
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[1]
a=json.loads((P/'frame-map.json').read_text());checked=[];issues=[]
for key,f in a['frames'].items():
 file=ROOT/'assets/resources'/(a['sheets'][f['s']]+'.png');size=Image.open(file).size;x,y,w,h=f['r'];valid=all(isinstance(v,int) for v in f['r']) and x>=0 and y>=0 and w>0 and h>0 and x+w<=size[0] and y+h<=size[1]
 checked.append({'key':key,'sheet':str(file.relative_to(ROOT)),'texture_size':list(size),'rect':f['r'],'valid':valid})
 if not valid:issues.append(checked[-1])
result={'scope':'actual PNG bounds, not runtime playback','sheets':len(a['sheets']),'frames':len(checked),'issues':issues,'checked':checked,'textures':[{'sheet':k,'path':v+'.png','size':list(Image.open(ROOT/'assets/resources'/(v+'.png')).size),'sha256':hashlib.sha256((ROOT/'assets/resources'/(v+'.png')).read_bytes()).hexdigest()}for k,v in a['sheets'].items()]}
(ROOT/'evidence/R3-COMBAT-PATCH-20261002/atlas-bounds-validation.json').write_text(json.dumps(result,indent=2)+'\n');print({k:result[k] for k in ['sheets','frames','issues']});assert not issues
