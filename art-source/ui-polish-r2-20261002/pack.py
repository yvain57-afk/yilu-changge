from pathlib import Path
import json,hashlib,uuid
from PIL import Image,ImageDraw
import numpy as np
P=Path(__file__).resolve().parent;R=P.parents[1];OUT=R/'assets/resources/formal20260927'
config=json.loads((P/'accepted-poses.json').read_text());frames={};hands={};sources=[];sheets={};boards=[]
for mount in ['chitu','dilu']:
 rows=[q for q in config if q['mount']==mount];sheet='r2_'+mount+'_crossbow';sheets[sheet]='formal20260927/r2-'+mount+'-crossbow';atlas=Image.new('RGBA',(1536,1024));board=Image.new('RGB',(1536,550),(217,214,201));d=ImageDraw.Draw(board);caps=[]
 for n,q in enumerate(rows):
  p=P/q['source'];im=Image.open(p).convert('RGBA');a=np.array(im);a[:,:,3][a[:,:,3]<24]=0;im=Image.fromarray(a);im=im.crop(im.getbbox());h=475 if mount=='chitu' else 474;im=im.resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS);w=im.width;x=8+n*300;y=8;atlas.alpha_composite(im,(x,y));key='r2_ride_'+mount+'_crossbow_'+q['phase'];frames[key]={'s':sheet,'r':[x,y,w,h],'a':[.5,0],'bh':h};socks={};board.paste(im,(x,y),im)
  for hand,pnt in q['sockets'].items():
   sx,sy=round(pnt[0]*w),round(pnt[1]*h);ck=key+'_'+hand+'_fingers';caps.append((ck,im.crop((sx-10,sy-10,sx+10,sy+10))));socks[hand]={'normalized':pnt,'occlusion_frame':ck};d.ellipse((x+sx-4,y+sy-4,x+sx+4,y+sy+4),fill=(255,40 if hand=='right' else 220,20))
  hands[key]={'bodyContainsWeapon':False,'mountId':mount,'stance':'crossbow','refH':h,'phase':q['phase'],'sockets':socks,'runtimeVerified':False};d.text((x,y+h+10),key,fill='black');sources.append({'key':key,'source':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'method':q['method']})
 for i,(k,im) in enumerate(caps):
  x=8+i*28;y=540;atlas.alpha_composite(im,(x,y));frames[k]={'s':sheet,'r':[x,y,20,20],'a':[.5,.5],'bh':20}
 path=OUT/('r2-'+mount+'-crossbow.png');atlas.save(path);meta=json.loads((OUT/'r27-oldmounts.png.meta').read_text());u=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/r2/'+path.name));meta['uuid']=u;meta['userData']['redirect']=u+'@6c48a';sub=meta['subMetas']['6c48a'];sub['uuid']=u+'@6c48a';sub['displayName']=path.stem;sub['userData']['imageUuidOrDatabaseUri']=u;path.with_suffix('.png.meta').write_text(json.dumps(meta,indent=2)+'\n');board.save(P/(mount+'-accepted-sockets-qa.jpg'),quality=95)
art={'sheets':sheets,'frames':frames};(P/'frame-map.json').write_text(json.dumps(art,indent=2)+'\n');(P/'body-sockets.json').write_text(json.dumps(hands,indent=2)+'\n');(P/'provenance.json').write_text(json.dumps(sources,indent=2)+'\n');people=json.loads((P/'people-fullbody-map.json').read_text());mod=R/'assets/scripts/formal/R2Art.ts';mod.write_text('/** R2 additive assets. Empty-handed bodies; props and hand caps must use per-frame sockets. */\nexport const R2_ART='+json.dumps(art,separators=(',',':'))+';\nexport const R2_HANDS:any='+json.dumps(hands,separators=(',',':'))+';\nexport const R2_PEOPLE:Record<string,string>='+json.dumps({k:v['frame'] for k,v in people.items()},separators=(',',':'))+';\n');meta=json.loads((R/'assets/scripts/formal/R27Art.ts.meta').read_text());meta['uuid']=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/r2/R2Art.ts'));mod.with_suffix('.ts.meta').write_text(json.dumps(meta,indent=2)+'\n');print({'bodies':len(hands),'frames':len(frames)})
