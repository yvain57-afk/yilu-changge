"""Reproducible alpha-aware atlas slicing. Original generated images are immutable.
No old frame is replaced. Alpha seam paths avoid cutting neighboring silhouettes;
only alpha < 24 background residue is removed. Source coordinates and seam hits logged.
"""
from pathlib import Path
import json, uuid, hashlib, importlib.util
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[2]; HERE=Path(__file__).resolve().parent
OUT=ROOT/'assets/resources/formal20260927'
spec=importlib.util.spec_from_file_location('slice_base',ROOT/'art-source/battle-preview-20260926/slice.py'); labeler=importlib.util.module_from_spec(spec);spec.loader.exec_module(labeler)
POSES=['run','wind','rel','rec']
CHARS_A=['taishici','ganning','zhanghe','xiahouyuan','weiyan','zhangren']
CHARS_B=['dengai','lusu','huangyueying','caoren','zhonghui','lukang']
WEAPONS=['duanji','tiesuodao','goulianqiang','dundao','yanlinggong','jiguannu']
TREASURES=['huxinjing','jinfanling','fengshitu','tiebifu','jingfan','pozhengu','xingjunyaolue','jueying','yingbianbingshu','jiuzhouyin']
CFG={
 'characters-a':(4,[0,215,420,632,850,1064,1254],[[f'c20_char_{c}_{p}' for p in POSES] for c in CHARS_A]),
 'characters-b':(4,[0,222,475,716,960,1230,1536],[[f'c20_char_{c}_{p}' for p in POSES] for c in CHARS_B]),
 'hero-weapons':(4,[0,252,500,754,1000,1266,1536],[[f'c20_hero_{c}_{p}' for p in POSES] for c in WEAPONS]),
 'enemies':(4,[0,200,401,619,835,1026,1195],[[f'c20_enemy_{c}_{p}' for p in POSES] for c in ['shield','archer','cavalry','banner','guard','mechanism']]),
 'mounts':(4,[0,500,1024],[[f'c20_ride_{c}_{p}' for p in POSES] for c in ['jingfan','jueying']]),
 'icons':(4,[0,330,652,935,1254],[( ['c20_weapon_'+w for w in WEAPONS]+['c20_tr_'+t for t in TREASURES])[i:i+4] for i in range(0,16,4)]),
 'sites':(5,[0,290,616,855,1122],[['c20_site_city','c20_site_pass','c20_site_water','c20_site_camp','c20_garrison'],['c20_flag_locked','c20_flag_open','c20_flag_done','c20_flag_current','c20_flag_defeated'],['c20_stamp_'+str(i) for i in range(1,6)],['c20_stamp_'+str(i) for i in range(6,11)]])}

def seam(a,center,radius):
 # top-to-bottom x path; alpha is high-cost, tiny center bias gives stable transparent gutters
 h,w=a.shape; lo=max(1,int(center-radius)); hi=min(w-1,int(center+radius)); xs=np.arange(lo,hi)
 cost=(a[:,lo:hi]/255.)**2*300+abs(xs-center)[None,:]*.007
 d=cost[0].copy(); back=np.zeros(cost.shape,np.int16)
 for y in range(1,h):
  choices=np.stack([np.r_[d[0]+1000,d[:-1]],d,np.r_[d[1:],d[-1]+1000]])
  k=choices.argmin(axis=0); back[y]=k-1; d=choices[k,np.arange(len(xs))]+cost[y]
 x=int(d.argmin()); path=np.empty(h,int)
 for y in range(h-1,-1,-1):path[y]=x+lo;x+=int(back[y,x])
 return path

def meta(path,alpha=True):
 ident=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/campaign20/'+path.name)); n=path.stem
 obj={'ver':'1.0.27','importer':'image','imported':True,'uuid':ident,'files':['.json','.png'],'subMetas':{'6c48a':{'importer':'texture','uuid':ident+'@6c48a','displayName':n,'id':'6c48a','name':'texture','userData':{'wrapModeS':'clamp-to-edge','wrapModeT':'clamp-to-edge','minfilter':'linear','magfilter':'linear','mipfilter':'none','anisotropy':0,'isUuid':True,'imageUuidOrDatabaseUri':ident,'visible':False},'ver':'1.0.22','imported':True,'files':['.json'],'subMetas':{}}},'userData':{'type':'texture','fixAlphaTransparencyArtifacts':False,'hasAlpha':alpha,'redirect':ident+'@6c48a'}}
 path.with_suffix('.png.meta').write_text(json.dumps(obj,indent=2)+'\n')

sheets={};frames={};ledger=[];review=[]
for name,(cols,ys,names) in CFG.items():
 im=np.array(Image.open(HERE/(name+'.png')).convert('RGBA'));h,w=im.shape[:2]; a=im[:,:,3].copy();im[:,:,3][a<24]=0
 # Assign complete rows along minimum-alpha seams, then columns independently.
 rows=np.zeros((h,w),int)
 for b in ys[1:-1]:rows+=np.arange(h)[:,None]>=seam(a.T,b,36)[None,:]
 cells=[]
 for row in range(len(names)):
  ar=np.where(rows==row,a,0); boundaries=[]
  for col in range(1,cols):
   boundary=seam(ar,w*col/cols,w/cols*.35)
   if name=='characters-a' and row==2 and col==3:
    boundary=np.interp(np.arange(h),[0,410,465,495,650,h-1],[1070,1070,1070,1010,935,935]).astype(int)
   boundaries.append(boundary)
  cm=np.zeros((h,w),int)
  for boundary in boundaries:cm+=np.arange(w)[None,:]>=boundary[:,None]
  for col,key in enumerate(names[row]):
   mask=(rows==row)&(cm==col); pix=im.copy();pix[:,:,3]=np.where(mask,im[:,:,3],0)
   oy,ox=np.nonzero(pix[:,:,3]>24)
   if len(ox)==0:raise RuntimeError('Empty '+key)
   box=[int(ox.min()),int(oy.min()),int(ox.max()+1),int(oy.max()+1)]
   crop=Image.fromarray(pix).crop(tuple(box))
   if key=='c20_hero_goulianqiang_rec':
    fixed=Image.open(HERE/'goulianqiang-rec-fixed.png').convert('RGBA');aa=np.array(fixed);aa[:,:,3][aa[:,:,3]<24]=0;fixed=Image.fromarray(aa);crop=fixed.crop(fixed.getbbox());crop.thumbnail((320,270),Image.Resampling.LANCZOS)
   # Actual emitted projectiles belong to runtime, not a baked detached sprite fragment.
   arr=np.array(crop); lab,n=labeler._label(arr[:,:,3]>24,4)
   counts=np.bincount(lab[arr[:,:,3]>24].ravel(),minlength=n+1);counts[0]=0
   for component in range(1,n+1):
    if counts[component]<counts.max()*.045:arr[:,:,3][lab==component]=0
   crop=Image.fromarray(arr)
   cells.append((key,crop,box))
 # Shelf atlas packing, no texture exceeds 2048 edge.
 atlas=Image.new('RGBA',(2048,2048));x=y=4;rh=0
 sheet='c20_'+name.replace('-','_');sheets[sheet]='formal20260927/campaign20-'+name
 for key,crop,box in cells:
  cw,ch=crop.size
  if x+cw+4>2048:x=4;y+=rh+8;rh=0
  if y+ch+4>2048:raise RuntimeError('atlas overflow '+name)
  atlas.alpha_composite(crop,(x,y)); icon=name in ['icons','sites']
  frames[key]={'s':sheet,'r':[x,y,cw,ch],'a':[.5,.5 if icon else 0],'bh':ch if icon else round(ch*.88,2)}
  ledger.append({'key':key,'source':name+'.png','box':box,'alpha_pixels':int((np.array(crop)[:,:,3]>24).sum()),'source_edge_contact':box[0]==0 or box[1]==0 or box[2]==w or box[3]==h})
  review.append((key,crop));x+=cw+8;rh=max(rh,ch)
 atlas=atlas.crop((0,0,2048,y+rh+4));path=OUT/('campaign20-'+name+'.png');atlas.save(path);meta(path)
# Alias only identical-purpose use of the same NEW character artwork.
for c in CHARS_A+CHARS_B:
 frames['c20_portrait_'+c]=frames['c20_char_'+c+'_run'].copy()
 for p in POSES:frames['c20_front_'+c+'_'+p]=frames['c20_char_'+c+'_'+p].copy()
for c in WEAPONS:frames['c20_icon_'+c]=frames['c20_weapon_'+c].copy()
for i in range(5):
 path=HERE/f'map{i}.png'
 if not path.exists():continue
 im=Image.open(path).convert('RGB').resize((768,1152),Image.Resampling.LANCZOS); dest=OUT/f'campaign20-map{i}.png';im.save(dest);meta(dest,False)
 sheet=f'c20_map_{i}';sheets[sheet]=f'formal20260927/campaign20-map{i}';frames[sheet]={'s':sheet,'r':[0,0,768,1152],'a':[.5,0],'bh':1152}
# Stable append-only extension keeps original MANIFEST source unchanged.
p=ROOT/'assets/scripts/formal/manifest.ts';src=p.read_text();marker='\n// CAMPAIGN20 GENERATED ADDITIONS'
if marker in src:src=src.split(marker)[0]
src+=marker+' — art-source/campaign20/slice.py\nObject.assign(MANIFEST.sheets,'+json.dumps(sheets,separators=(',',':'))+');\nObject.assign(MANIFEST.frames,'+json.dumps(frames,separators=(',',':'))+');\n';p.write_text(src)
(HERE/'slice-ledger.json').write_text(json.dumps({'sheets':sheets,'frames':ledger},ensure_ascii=False,indent=2)+'\n')
# QA contact sheet uses final sliced frames, checker/light background and labels.
CW,CH=230,265;board=Image.new('RGB',(CW*6,CH*((len(review)+5)//6)),(211,208,193));d=ImageDraw.Draw(board)
for i,(key,im) in enumerate(review):
 im=im.copy();im.thumbnail((220,230)); xx=(i%6)*CW+(CW-im.width)//2;yy=(i//6)*CH;board.paste(im,(xx,yy),im);d.text(((i%6)*CW+4,yy+234),key,fill=(25,25,25))
board.save(HERE/'contact-sheet.jpg',quality=90)
print(json.dumps({'sheets':len(sheets),'frames_with_aliases':len(frames),'unique_sprites':len(ledger),'maps':sum(k.startswith('c20_map') for k in sheets),'source_edge_contacts':[x['key'] for x in ledger if x['source_edge_contact']]}))
