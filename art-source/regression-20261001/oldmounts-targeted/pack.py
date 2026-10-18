from pathlib import Path
import json,uuid,hashlib
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];OUT=ROOT/'assets/resources/formal20260927';refs=json.loads((HERE/'original-body-refs.json').read_text())
points={'chitu_crossbow':{'right':[.731,.189],'left':[.939,.216]},'chitu_dual':{'right':[.955,.386],'left':[.133,.278]},'chitu_bow':{'right':[.496,.184],'left':[.962,.136]},'dilu_crossbow':{'right':[.770,.183],'left':[.962,.180]},'dilu_dual':{'right':[.955,.388],'left':[.139,.296]},'dilu_bow':{'right':[.479,.187],'left':[.958,.145]}}
frames={};contracts={};ledger=[];caps=[];sheet='r27_oldmounts';atlas=Image.new('RGBA',(1536,1024));board=Image.new('RGB',(1536,1040),(217,214,201));d=ImageDraw.Draw(board)
for row,mount in enumerate(['chitu','dilu']):
 for col,style in enumerate(['crossbow','dual','bow']):
  path=HERE/(mount+'-'+style+'-source.png');im=Image.open(path).convert('RGBA');ar=np.array(im);ar[:,:,3][ar[:,:,3]<24]=0;im=Image.fromarray(ar);im=im.crop(im.getbbox());height=refs[mount]['r'][3];im=im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS);w,h=im.size;x=col*512+8;y=row*492+8;atlas.alpha_composite(im,(x,y));key='r27_ride_'+mount+'_'+style;frames[key]={'s':sheet,'r':[x,y,w,h],'a':[.5,0],'bh':refs[mount]['bh']};hands={};board.paste(im,(x,y),im)
  for hand,p in points[mount+'_'+style].items():
   sx,sy=round(p[0]*w),round(p[1]*h);ck=key+'_'+hand+'_fingers';caps.append((ck,im.crop((sx-10,sy-10,sx+10,sy+10))));hands[hand]={'normalized':p,'occlusion_frame':ck};d.ellipse((x+sx-4,y+sy-4,x+sx+4,y+sy+4),fill=(255,40 if hand=='right' else 220,20))
  contracts[key]={'bodyContainsWeapon':False,'mountId':mount,'stance':style,'refH':refs[mount]['bh'],'sockets':hands,'horseGaitPhases':1,'runtimeVerified':False};ledger.append({'key':key,'source':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'method':'arms-only edit of same original red/white mounted unit','horseColorPreserved':True});d.text((x,y+h+6),key,fill=(0,0,0))
for i,(key,cap) in enumerate(caps):
 x=8+i*28;y=992;atlas.alpha_composite(cap,(x,y));frames[key]={'s':sheet,'r':[x,y,20,20],'a':[.5,.5],'bh':20}
p=OUT/'r27-oldmounts.png';atlas.save(p);obj=json.loads((OUT/'regression-held-parts.png.meta').read_text());u=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/r27/'+p.name));obj['uuid']=u;obj['userData']['redirect']=u+'@6c48a';obj['subMetas']['6c48a']['uuid']=u+'@6c48a';obj['subMetas']['6c48a']['displayName']=p.stem;obj['subMetas']['6c48a']['userData']['imageUuidOrDatabaseUri']=u;p.with_suffix('.png.meta').write_text(json.dumps(obj,indent=2)+'\n')
(HERE/'frame-map.json').write_text(json.dumps({'sheets':{sheet:'formal20260927/r27-oldmounts'},'frames':frames},indent=2)+'\n');(HERE/'body-sockets.json').write_text(json.dumps(contracts,indent=2)+'\n');(HERE/'provenance.json').write_text(json.dumps(ledger,indent=2)+'\n');board.save(HERE/'oldmount-sockets-qa.jpg',quality=94);print(json.dumps({'sheets':1,'frames':len(frames),'bodies':len(contracts),'caps':len(caps)}))
