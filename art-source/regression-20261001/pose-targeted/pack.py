"""Pack accepted single-pose edits and original references; does not modify shared code."""
from pathlib import Path
import json,uuid,hashlib,re
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];OUT=ROOT/'assets/resources/formal20260927'
NAMES=['taishici','ganning','zhanghe','xiahouyuan','weiyan','zhangren','dengai','lusu','huangyueying','caoren','zhonghui','lukang']
s= (ROOT/'assets/scripts/formal/manifest.ts').read_text();m=json.loads(re.search(r'export const MANIFEST:any=(\{[^\n]+\});',s).group(1))
for t in ['frames','sheets']:
 for z in re.findall(r'Object.assign\(MANIFEST\.'+t+r',(\{[^\n]+\})\);',s):m[t].update(json.loads(z))
def meta(path):
 obj=json.loads((OUT/'regression-held-parts.png.meta').read_text());u=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/r27/'+path.name));obj['uuid']=u;obj['userData']['redirect']=u+'@6c48a';obj['subMetas']['6c48a']['uuid']=u+'@6c48a';obj['subMetas']['6c48a']['displayName']=path.stem;obj['subMetas']['6c48a']['userData']['imageUuidOrDatabaseUri']=u;path.with_suffix('.png.meta').write_text(json.dumps(obj,indent=2)+'\n')
def seam(a,c,r):
 h,w=a.shape;lo=max(1,int(c-r));hi=min(w-1,int(c+r));xs=np.arange(lo,hi);cost=(a[:,lo:hi]/255.)**2*300+abs(xs-c)[None,:]*.007;d=cost[0].copy();back=np.zeros(cost.shape,np.int16)
 for y in range(1,h):
  z=np.stack([np.r_[d[0]+1000,d[:-1]],d,np.r_[d[1:],d[-1]+1000]]);k=z.argmin(0);back[y]=k-1;d=z[k,np.arange(len(xs))]+cost[y]
 x=int(d.argmin());p=np.empty(h,int)
 for y in range(h-1,-1,-1):p[y]=x+lo;x+=int(back[y,x])
 return p
accepted=json.loads((HERE/'accepted.json').read_text()) if (HERE/'accepted.json').exists() else ['taishici','huangyueying'];sheets={};frames={};ledger=[];pairs={};cells=[]
for c in accepted:
 original=HERE/(c+'-run-reference.png');opposite=HERE/(c+'-opposite-source.png')
 if not opposite.exists():continue
 ref=m['frames']['c20_char_'+c+'_run'];base=Image.open(original).convert('RGBA');H=base.height
 pairs[c]={'run':['r27_char_'+c+'_run0','r27_char_'+c+'_run1'],'cycle':[0,1],'distinct_leg_poses':2,'four_distinct_phases':False,'source_original':'c20_char_'+c+'_run','bodyContainsWeapon':True}
 for i,p in enumerate([original,opposite]):
  im=Image.open(p).convert('RGBA');aa=np.array(im);aa[:,:,3][aa[:,:,3]<24]=0;im=Image.fromarray(aa);im=im.crop(im.getbbox());im=im.resize((round(im.width*H/im.height),H),Image.Resampling.LANCZOS);key='r27_char_'+c+'_run'+str(i);cells.append((key,im,ref['bh']));ledger.append({'key':key,'source':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'method':'existing approved run' if i==0 else 'single character leg-only image edit','bodyContainsWeapon':True})
atlas=Image.new('RGBA',(2048,2048));x=y=8;rh=0;sheet='r27_character_gaits';sheets[sheet]='formal20260927/r27-character-gaits'
for key,im,bh in cells:
 w,h=im.size
 if x+w+8>2048:x=8;y+=rh+16;rh=0
 if y+h+8>2048:raise RuntimeError('atlas overflow')
 atlas.alpha_composite(im,(x,y));frames[key]={'s':sheet,'r':[x,y,w,h],'a':[.5,0],'bh':bh};x+=w+16;rh=max(rh,h)
if cells:
 p=OUT/'r27-character-gaits.png';atlas.crop((0,0,2048,y+rh+8)).save(p);meta(p)
 board=Image.new('RGB',(760,max(1,len(accepted))*310),(217,214,201));d=ImageDraw.Draw(board)
 for n,c in enumerate(accepted):
  cc=[(k,im) for k,im,bh in cells if k.startswith('r27_char_'+c+'_')]
  for i,(k,im) in enumerate(cc):
   im=im.copy();im.thumbnail((340,260));board.paste(im,(i*380+(380-im.width)//2,n*310),im);d.text((i*380+15,n*310+275),k,fill=(0,0,0))
 board.save(HERE/'gait-pairs-qa.jpg',quality=94)
# Dedicated two-hand props, alpha-seam split so neither neighboring weapon is copied.
p=HERE/'two-hand-crossbows-source.png'
if p.exists():
 a=np.array(Image.open(p).convert('RGBA'));h,w=a.shape[:2];border=seam(a[:,:,3].T,h*.52,h*.14);groups=np.arange(h)[:,None]>=border[None,:];atlas=Image.new('RGBA',(1024,512));contracts={};sheet='r27_crossbows';sheets[sheet]='formal20260927/r27-crossbows'
 # source-pixel back trigger grip and underside front support; each marked in QA.
 points=[[(369,260),(968,370)],[(351,770),(900,811)]]
 board=Image.new('RGB',(1024,512),(217,214,201));d=ImageDraw.Draw(board)
 for i,key in enumerate(['r27_held_liannu','r27_held_jiguannu']):
  pix=a.copy();pix[:,:,3]=np.where((groups==i)&(a[:,:,3]>=24),a[:,:,3],0);im=Image.fromarray(pix);box=im.getbbox();im=im.crop(box);im.thumbnail((490,240),Image.Resampling.LANCZOS);cw,ch=im.size;x=8+i*512;atlas.alpha_composite(im,(x,8));frames[key]={'s':sheet,'r':[x,8,cw,ch],'a':[.5,.5],'bh':ch};grips=[]
  board.paste(im,(x,8),im)
  for j,(gx,gy) in enumerate(points[i]):
   grip=[(gx-box[0])/(box[2]-box[0]),(gy-box[1])/(box[3]-box[1])];grips.append(grip);cx=x+grip[0]*cw;cy=8+grip[1]*ch;d.ellipse((cx-4,cy-4,cx+4,cy+4),fill=(255,40 if j==0 else 220,20))
  contracts[key]={'rearGrip':grips[0],'supportGrip':grips[1],'sourceBox':list(box),'points_source_px':points[i],'bodyContainsWeapon':False,'runtimeVerified':False};d.text((x,260),key,fill=(0,0,0));ledger.append({'key':key,'source':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'method':'generated independent held prop, alpha-seam crop'})
 bowpath=HERE/'held-bow-source.png'
 if bowpath.exists():
  ba=np.array(Image.open(bowpath).convert('RGBA'));ba[:,:,3][ba[:,:,3]<24]=0;bi=Image.fromarray(ba);bbox=bi.getbbox();bi=bi.crop(bbox);bi.thumbnail((240,240),Image.Resampling.LANCZOS);bw,bh=bi.size;atlas.alpha_composite(bi,(8,264));key='r27_held_yanlinggong';frames[key]={'s':sheet,'r':[8,264,bw,bh],'a':[.5,.5],'bh':bh};contracts[key]={'rearGrip':[.037,.485],'supportGrip':[.797,.485],'drawStringGrip':[.037,.485],'bowGrip':[.797,.485],'bodyContainsWeapon':False,'runtimeVerified':False};board.paste(bi,(8,264),bi);d.text((260,320),key,fill=(0,0,0));ledger.append({'key':key,'source':str(bowpath.relative_to(ROOT)),'sha256':hashlib.sha256(bowpath.read_bytes()).hexdigest(),'method':'generated right-facing drawn bow with one nocked arrow'})
 out=OUT/'r27-crossbows.png';atlas.save(out);meta(out);board.save(HERE/'crossbows-grips-qa.jpg',quality=94);(HERE/'crossbow-contract.json').write_text(json.dumps(contracts,indent=2)+'\n')
# Verified two-phase weaponless hero bodies with two visible hands.
body_sockets={
 'crossbow0':{'right':[.84,.28],'left':[.959,.31]},'crossbow1':{'right':[.85,.246],'left':[.954,.309]},
 'dual0':{'right':[.947,.331],'left':[.206,.357]},'dual1':{'right':[.961,.417],'left':[.214,.36]},
 'bow0':{'right':[.52,.195],'left':[.960,.221]},'bow1':{'right':[.513,.183],'left':[.950,.216]}}
atlas=Image.new('RGBA',(1024,768));sheet='r27_hero_hand_poses';sheets[sheet]='formal20260927/r27-hero-hand-poses';body_contract={};caps=[]
for col,style in enumerate(['crossbow','dual','bow']):
 for phase in range(2):
  p=HERE/(style+'-body'+str(phase)+'-source.png')
  if not p.exists():continue
  ar=np.array(Image.open(p).convert('RGBA'));ar[:,:,3][ar[:,:,3]<24]=0;im=Image.fromarray(ar);im=im.crop(im.getbbox());im=im.resize((round(im.width*300/im.height),300),Image.Resampling.LANCZOS);cw,ch=im.size;x=col*330+8;y=phase*320+8;atlas.alpha_composite(im,(x,y));key='r27_body_'+style+str(phase);frames[key]={'s':sheet,'r':[x,y,cw,ch],'a':[.5,0],'bh':280};hands={}
  for hand,pt in body_sockets[style+str(phase)].items():
   sx,sy=round(pt[0]*cw),round(pt[1]*ch);cap=im.crop((sx-7,sy-7,sx+7,sy+7));capkey=key+'_'+hand+'_fingers';caps.append((capkey,cap));hands[hand]={'normalized':pt,'occlusion_frame':capkey}
  body_contract[key]={'bodyContainsWeapon':False,'sockets':hands,'gaitPhase':phase,'stance':style,'refH':280,'runtimeVerified':False};ledger.append({'key':key,'source':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'method':'arms-only edit of original verified gait'+str(phase),'bodyContainsWeapon':False})
for i,(key,cap) in enumerate(caps):
 x=8+i*22;y=650;atlas.alpha_composite(cap,(x,y));frames[key]={'s':sheet,'r':[x,y,14,14],'a':[.5,.5],'bh':14}
if body_contract:
 p=OUT/'r27-hero-hand-poses.png';atlas.crop((0,0,1024,674)).save(p);meta(p);(HERE/'body-sockets.json').write_text(json.dumps(body_contract,indent=2)+'\n')
(HERE/'frame-map.json').write_text(json.dumps({'sheets':sheets,'frames':frames},indent=2)+'\n');(HERE/'gait-contract.json').write_text(json.dumps(pairs,indent=2)+'\n');(HERE/'provenance.json').write_text(json.dumps(ledger,indent=2)+'\n');print(json.dumps({'accepted':accepted,'sheets':len(sheets),'frames':len(frames)}))
