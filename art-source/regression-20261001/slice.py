"""Non-destructive source slicing only. Never modifies shared manifest/source code."""
from pathlib import Path
import json,uuid,hashlib
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent;OUT=ROOT/'assets/resources/formal20260927'
CFG={'mount-sockets': ['jingfan','jueying'],'characters-a-gaits':['taishici','ganning','zhanghe','xiahouyuan','weiyan','zhangren'],'characters-b-gaits':['dengai','lusu','huangyueying','caoren','zhonghui','lukang']}
def seam(a,center,radius):
 h,w=a.shape;lo=max(1,int(center-radius));hi=min(w-1,int(center+radius));xs=np.arange(lo,hi)
 cost=(a[:,lo:hi]/255.)**2*300+abs(xs-center)[None,:]*.007;d=cost[0].copy();back=np.zeros(cost.shape,np.int16)
 for y in range(1,h):
  opts=np.stack([np.r_[d[0]+1000,d[:-1]],d,np.r_[d[1:],d[-1]+1000]]);k=opts.argmin(0);back[y]=k-1;d=opts[k,np.arange(len(xs))]+cost[y]
 x=int(d.argmin());p=np.empty(h,int)
 for y in range(h-1,-1,-1):p[y]=x+lo;x+=int(back[y,x])
 return p

def meta(path):
 ident=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/regression-20261001/'+path.name));n=path.stem
 sample=json.loads((OUT/'campaign20-mounts.png.meta').read_text());sample['uuid']=ident;sample['subMetas']['6c48a']['uuid']=ident+'@6c48a';sample['subMetas']['6c48a']['displayName']=n;sample['subMetas']['6c48a']['userData']['imageUuidOrDatabaseUri']=ident;sample['userData']['redirect']=ident+'@6c48a';path.with_suffix('.png.meta').write_text(json.dumps(sample,indent=2)+'\n')
frames={};sheets={};ledger=[];qa=[]
# Absolute source-pixel fist centers, verified visually against generated 1536x1024.
hands=[[(132,201),(234,169)],[(550,166),(611,158)],[(895,110),(1043,140)],[(1263,163),(1450,158)],[(132,704),(232,665)],[(550,662),(609,649)],[(895,605),(1040,635)],[(1260,659),(1450,650)]]
contracts={}
for name,ids in CFG.items():
 if name!='mount-sockets':continue
 path=HERE/(name+'-source.png')
 if not path.exists():continue
 ar=np.array(Image.open(path).convert('RGBA'));a=ar[:,:,3];h,w=a.shape;rows=np.zeros((h,w),int)
 for b in range(1,len(ids)):rows+=np.arange(h)[:,None]>=seam(a.T,h*b/len(ids),h/len(ids)*.28)[None,:]
 cells=[]
 for row,ident in enumerate(ids):
  rowa=np.where(rows==row,a,0);cols=np.zeros((h,w),int)
  for b in range(1,4):cols+=np.arange(w)[None,:]>=seam(rowa,w*b/4,w*.065)[:,None]
  for col in range(4):
   pix=ar.copy();pix[:,:,3]=np.where((rows==row)&(cols==col)&(a>=24),a,0);yy,xx=np.nonzero(pix[:,:,3]);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];crop=Image.fromarray(pix).crop(box)
   suffix=['single','crossbow','bow','dual'][col] if name=='mount-sockets' else 'run'+str(col)
   key='r26_'+('ride_' if name=='mount-sockets' else 'hero_' if name=='hero-gaits' else 'char_')+ident+'_'+suffix
   cells.append((key,crop,box,row,col));ledger.append({'key':key,'source':str(path.relative_to(ROOT)),'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source_box':box,'alpha_pixels':int((np.array(crop)[:,:,3]>24).sum()),'pixel_sha256':hashlib.sha256(crop.tobytes()).hexdigest()})
 sheet='regression_'+name.replace('-','_');sheets[sheet]='formal20260927/regression-'+name
 atlas=Image.new('RGBA',(2048,2048));x=y=8;rh=0
 for key,crop,box,row,col in cells:
  cw,ch=crop.size
  if x+cw+8>2048:x=8;y+=rh+16;rh=0
  if y+ch+8>2048:raise RuntimeError('atlas overflow '+name)
  atlas.alpha_composite(crop,(x,y));frames[key]={'s':sheet,'r':[x,y,cw,ch],'a':[.5,0],'bh':round(ch*.88,2)}
  if name=='mount-sockets':
   points=hands[row*4+col];sockets={}
   for side,point in zip(['right','left'],points):
    sx,sy=point;sockets[side]={'source_px':[sx,sy],'normalized':[(sx-box[0])/cw,(sy-box[1])/ch]}
   contracts[key]={'bodyContainsWeapon':False,'pose':['single','crossbow','bow','dual'][col],'sockets':sockets,'body_frame':key,'occlusion':'Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body.'}
  qa.append((key,crop));x+=cw+16;rh=max(rh,ch)
 if name=='mount-sockets':
  fy=y+rh+12;fx=8
  for key,crop,box,row,col in cells:
   for side,point in zip(['right','left'],hands[row*4+col]):
    sx,sy=point;cap=Image.fromarray(ar).crop((sx-10,sy-10,sx+10,sy+10));atlas.alpha_composite(cap,(fx,fy));fk=key+'_'+side+'_fingers';frames[fk]={'s':sheet,'r':[fx,fy,20,20],'a':[.5,.5],'bh':20};contracts[key]['sockets'][side]['occlusion_frame']=fk;fx+=28
  rh+=36
 out=OUT/('regression-'+name+'.png');atlas.crop((0,0,2048,y+rh+8)).save(out);meta(out)
 # QA per sheet avoids tiny proof images.
 board=Image.new('RGB',(1200,len(ids)*320),(218,216,202));draw=ImageDraw.Draw(board)
 for key,crop,box,row,col in cells:
  pic=crop.copy();pic.thumbnail((290,278));board.paste(pic,(col*300+(300-pic.width)//2,row*320+4),pic);draw.text((col*300+5,row*320+287),key,fill=(25,25,25))
 board.save(HERE/(name+'-qa.jpg'),quality=94)
# Independent held parts. Cropping/scaling only; generated source is unchanged.
partpath=HERE/'held-parts-source.png'
if partpath.exists():
 im=np.array(Image.open(partpath).convert('RGBA'));h,w=im.shape[:2];aa=im[:,:,3];cm=np.zeros((h,w),int)
 for b in [1,2]:cm+=np.arange(w)[None,:]>=seam(aa,w*b/3,w*.09)[:,None]
 atlas=Image.new('RGBA',(1024,512));x=8;sheet='regression_held_parts';sheets[sheet]='formal20260927/regression-held-parts';held={};board=Image.new('RGB',(1024,512),(214,212,202));d=ImageDraw.Draw(board)
 for i,(key,grip) in enumerate([('r26_part_duanji',[.49,.68]),('r26_part_dundao_shield',[.5,.52]),('r26_part_dundao_blade',[.69,.24])]):
  pix=im.copy();pix[:,:,3]=np.where((cm==i)&(aa>=24),aa,0);yy,xx=np.nonzero(pix[:,:,3]);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];crop=Image.fromarray(pix).crop(box);crop.thumbnail((300,460),Image.Resampling.LANCZOS);cw,ch=crop.size;atlas.alpha_composite(crop,(x,8));frames[key]={'s':sheet,'r':[x,8,cw,ch],'a':[.5,.5],'bh':ch};held[key]={'grip':grip,'role':'held_weapon','containsBody':False,'containsOtherWeapon':False};board.paste(crop,(x,8),crop);d.text((x,478),key,fill=(0,0,0));ledger.append({'key':key,'source':str(partpath.relative_to(ROOT)),'source_sha256':hashlib.sha256(partpath.read_bytes()).hexdigest(),'source_box':box,'pixel_sha256':hashlib.sha256(crop.tobytes()).hexdigest()});x+=cw+20
 dest=OUT/'regression-held-parts.png';atlas.crop((0,0,x,480)).save(dest);meta(dest);board.save(HERE/'held-parts-qa.jpg',quality=94);(HERE/'held-parts.json').write_text(json.dumps(held,indent=2)+'\n')
(HERE/'frame-map.json').write_text(json.dumps({'sheets':sheets,'frames':frames},ensure_ascii=False,indent=2)+'\n')
(HERE/'slice-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
(HERE/'mount-sockets.json').write_text(json.dumps(contracts,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sheets':len(sheets),'frames':len(frames),'duplicate_pixel_hashes':len(ledger)-len(set(x['pixel_sha256'] for x in ledger))}))
