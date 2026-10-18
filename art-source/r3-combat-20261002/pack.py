from pathlib import Path
import json,hashlib,uuid,math
from PIL import Image,ImageDraw,ImageFilter
from collections import deque
import numpy as np
P=Path(__file__).resolve().parent;ROOT=P.parents[1];OUT=ROOT/'assets/resources/formal20260927';frames={};sheets={};meta={};hands={};hashof=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
ownership_cache={}
def source_ownership(im,cols,rows,row_cols=None):
 pixels=np.array(im);mask=pixels[:,:,3]>64;h,w=mask.shape;seen=np.zeros_like(mask);owner=np.full((h,w),-1,dtype=np.int16);cw=w/cols;ch=h/rows;bounds={};components=[]
 for sy,sx in zip(*np.where(mask)):
  if seen[sy,sx]:continue
  queue=deque([(int(sx),int(sy))]);seen[sy,sx]=1;coords=[]
  while queue:
   x,y=queue.popleft();coords.append((x,y))
   for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if 0<=xx<w and 0<=yy<h and mask[yy,xx] and not seen[yy,xx]:seen[yy,xx]=1;queue.append((xx,yy))
  if len(coords)<3:continue
  xs,ys=np.array(coords).T;rids=np.minimum(rows-1,(ys/ch).astype(int));widths=np.array([w/(row_cols[r] if row_cols else cols) for r in rids]);bins=rids*cols+np.minimum(cols-1,(xs/widths).astype(int));idx=int(np.bincount(bins,minlength=cols*rows).argmax());owner[ys,xs]=idx;b=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
  components.append({'pixels':len(coords),'owner':idx,'bounds':b})
  if idx in bounds:old=bounds[idx];bounds[idx]=[min(old[0],b[0]),min(old[1],b[1]),max(old[2],b[2]),max(old[3],b[3])]
  else:bounds[idx]=b
 padx=2;pady=2
 for idx,b in bounds.items():
  col=idx%cols;row=idx//cols;rowcw=w/(row_cols[row] if row_cols else cols);cw=rowcw;padx=max(padx,math.ceil(col*cw-b[0]+2),math.ceil(b[2]-(col+1)*cw+2));pady=max(pady,math.ceil(row*ch-b[1]+2),math.ceil(b[3]-(row+1)*ch+2))
 return pixels,owner,padx,pady,components

def add_grid(name,file,cols,rows,entries,row_cols=None):
 im=Image.open(P/file).convert('RGBA');cw=im.width/cols;ch=im.height/rows;sheet='r3_'+name;sheets[sheet]='formal20260927/r3-'+name
 segmented='segmented' in file or 'finger-caps' in file
 if segmented:pixels=np.array(im);owner=None;padx=0;pady=0;componentEvidence=[]
 else:pixels,owner,padx,pady,componentEvidence=source_ownership(im,cols,rows,row_cols)
 aw=math.ceil(max([im.width/n for n in row_cols]) if row_cols else cw)+2*padx;ah=math.ceil(ch)+2*pady;atlas=Image.new('RGBA',(aw*cols,ah*rows));board=Image.new('RGB',atlas.size,'#223645');d=ImageDraw.Draw(board)
 sourceQA=[]
 for i,q in enumerate(entries):
  if q is None:continue
  col=i%cols;row=i//cols;cw=im.width/(row_cols[row] if row_cols else cols);ox=round(col*cw);oy=round(row*ch)
  if owner is not None:
   own=Image.fromarray((owner==i).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(3));alpha=np.minimum(np.array(own),pixels[:,:,3]);isolated=Image.fromarray(np.dstack((pixels[:,:,:3],alpha)).astype(np.uint8));cell=isolated.crop((ox-padx,oy-pady,ox-padx+aw,oy-pady+ah))
  else:
   cropped=im.crop((ox,oy,round((col+1)*cw),round((row+1)*ch)));cell=Image.new('RGBA',(aw,ah));cell.alpha_composite(cropped,(0,0))
  box=cell.getbbox();x=col*aw;y=row*ah;atlas.alpha_composite(cell,(x,y));board.paste(cell,(x,y),cell)
  oldfoot=q.get('feetAnchor',[.53,.965]);oldpelvis=q.get('pelvisAnchor',[.53,.65]);oldbox=q.get('bodyBox',[.30,.14,.43,.82]);point=lambda v:[(v[0]*cw+padx)/aw,(v[1]*ch+pady)/ah]
  foot=point(oldfoot);pelvis=point(oldpelvis);bodybox=[(oldbox[0]*cw+padx)/aw,(oldbox[1]*ch+pady)/ah,oldbox[2]*cw/aw,oldbox[3]*ch/ah];canon=q.get('bodyHeight',ch*.8);key=q['key'];frames[key]={'s':sheet,'r':[x,y,aw,ah],'a':[foot[0],1-foot[1]],'bh':canon};meta[key]={'actorId':q['actorId'],'role':q['role'],'camera':('front_3/4' if q['role'] in ['boss','enemy'] else 'rear_3/4'),'semanticPose':q['pose'],'sourceSha':hashof(P/file),'canonicalScale':1,'feetAnchor':foot,'pelvisAnchor':pelvis,'bodyHeight':canon,'bodyBox':bodybox,'untrimmedSize':[aw,ah],'trimOffset':[0,0],'pivot':foot,'bodyContainsWeapon':q.get('bodyContainsWeapon',True),'grips':[point(g) for g in q.get('grips',[])],'weaponRoot':point(q['weaponRoot']) if q.get('weaponRoot') else None,'weaponTip':point(q['weaponTip']) if q.get('weaponTip') else None,'alphaBounds':list(box) if box else None,'source':str((P/file).relative_to(ROOT)),'qualityStatus':q.get('qualityStatus','candidate_checked_source'),'runtimeVerified':False,'sourceOwnershipMethod':'presegmented_whole_actor' if segmented else 'whole_source_connected_components_majority_grid_owner','sourceGridCell':i,'sourcePivotPx':[ox+oldfoot[0]*cw,oy+oldfoot[1]*ch],'metadataBasis':'fixed_source_canvas_manual_pelvis_and_foot_reference'}
  if key in hands:
   for sock in hands[key]['sockets'].values():sock['normalized']=point(sock['normalized'])
  sourceQA.append({'key':key,'sourceGridCell':i,'sourceRect':[ox-padx,oy-pady,aw,ah],'padding':[padx,pady],'originalUntrimmedSize':[cw,ch],'canonicalBodyHeight':canon,'targetRect':frames[key]['r']});d.text((x+5,y+4),key,fill='white');fx=x+round(foot[0]*aw);fy=y+round(foot[1]*ah);d.ellipse((fx-3,fy-3,fx+3,fy+3),fill='#00ddff')
 path=OUT/('r3-'+name+'.png');atlas.save(path);base=json.loads((OUT/'r2-chitu-crossbow.png.meta').read_text());u=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/r3/'+path.name));base['uuid']=u;base['userData']['redirect']=u+'@6c48a';sub=base['subMetas']['6c48a'];sub['uuid']=u+'@6c48a';sub['displayName']=path.stem;sub['userData']['imageUuidOrDatabaseUri']=u;path.with_suffix('.png.meta').write_text(json.dumps(base,indent=2)+'\n');board.save(P/(name+'-anchors-qa.jpg'),quality=95);(P/(name+'-source-ownership.json')).write_text(json.dumps({'frames':sourceQA,'sourceComponents':componentEvidence},indent=2)+'\n')
# The generated release/show blades cross nominal grid lines. Segment whole
# connected actors before atlas packing; never clip a blade or keep a neighbour's fragment.
im=Image.open(P/'hero-guandao-sheet-v2-alpha.png').convert('RGBA');pixels=np.array(im);mask=pixels[:,:,3]>96;h,w=mask.shape;seen=np.zeros_like(mask);components=[]
for sy,sx in zip(*np.where(mask)):
 if seen[sy,sx]:continue
 queue=deque([(int(sx),int(sy))]);seen[sy,sx]=1;coords=[]
 while queue:
  x,y=queue.popleft();coords.append((x,y))
  for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
   if 0<=xx<w and 0<=yy<h and mask[yy,xx] and not seen[yy,xx]:seen[yy,xx]=1;queue.append((xx,yy))
 if len(coords)>500:
  xs,ys=zip(*coords);components.append((coords,[min(xs),min(ys),max(xs)+1,max(ys)+1]))
# Stable pelvis/root X; foot Y measured independently of the raised weapon alpha extent.
hero=[('ready',180,351),('run0',550,350),('run1',920,351),('run2',1280,351),('run3',185,712),('wind',545,709),('rel',875,700),('rec',1325,708),('show',180,1063),('hit',550,1060),('defeat',930,1057)]
order=[0,1,3,2,6,4,7,5,8,10,9];cells=[]
for (ph,fx,fy),ci in zip(hero,order):
 coords,bounds=components[ci];own=Image.new('L',im.size);own.putdata([0]*(w*h));arr=np.zeros((h,w),dtype=np.uint8)
 for x,y in coords:arr[y,x]=255
 own=Image.fromarray(arr).filter(ImageFilter.MaxFilter(5));alpha=np.minimum(np.array(own),pixels[:,:,3]);isolated=Image.fromarray(np.dstack((pixels[:,:,:3],alpha)).astype(np.uint8));crop=isolated.crop((bounds[0]-2,bounds[1]-2,bounds[2]+2,bounds[3]+2));cell=Image.new('RGBA',(500,500));ox=230-(fx-bounds[0]+2);oy=480-(fy-bounds[1]+2);cell.alpha_composite(crop,(ox,oy));cells.append(cell)
heroSheet=Image.new('RGBA',(2000,1500))
for i,cell in enumerate(cells):heroSheet.alpha_composite(cell,(i%4*500,i//4*500))
heroSheet.save(P/'hero-guandao-segmented.png')
add_grid('hero-guandao','hero-guandao-segmented.png',4,3,[{'key':'r3_hero_guandao_'+ph,'actorId':'player','role':'hero','pose':('run' if ph.startswith('run') else 'hurt' if ph=='hit' else 'defeated' if ph=='defeat' else ph),'bodyHeight':286,'feetAnchor':[.46,.96],'pelvisAnchor':[.46,.68],'bodyBox':[.30,.36,.42,.60]} for ph,_,_ in hero])
# Priority ally weapons cross both row and column separators. Whole-actor
# segmentation is necessary: a rectangular cell imports the neighbour's blade tip.
source=Image.open(P/'ally-lubu-machao-sheet-alpha.png').convert('RGBA');pixels2=np.array(source);mask2=pixels2[:,:,3]>96;h2,w2=mask2.shape;seen2=np.zeros_like(mask2);owned=[]
for sy,sx in zip(*np.where(mask2)):
 if seen2[sy,sx]:continue
 queue=deque([(int(sx),int(sy))]);seen2[sy,sx]=1;coords=[]
 while queue:
  x,y=queue.popleft();coords.append((x,y))
  for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
   if 0<=xx<w2 and 0<=yy<h2 and mask2[yy,xx] and not seen2[yy,xx]:seen2[yy,xx]=1;queue.append((xx,yy))
 if len(coords)>500:
  xs,ys=zip(*coords);owned.append((coords,[min(xs),min(ys),max(xs)+1,max(ys)+1]))
assert len(owned)==8,('priority_actor_component_count',len(owned))
priorityAtlas=Image.new('RGBA',(3200,1600));sourceMap=[]
for i,ci in enumerate([3,0,1,2,7,4,5,6]):
 coords,bounds=owned[ci];arr=np.zeros((h2,w2),dtype=np.uint8)
 for x,y in coords:arr[y,x]=255
 own=Image.fromarray(arr).filter(ImageFilter.MaxFilter(5));alpha=np.minimum(np.array(own),pixels2[:,:,3]);isolated=Image.fromarray(np.dstack((pixels2[:,:,:3],alpha)).astype(np.uint8));crop=isolated.crop((bounds[0]-2,bounds[1]-2,bounds[2]+2,bounds[3]+2))
 fx=(i%4+.52)*w2/4;fy=(i//4+.975)*h2/2;cell=Image.new('RGBA',(800,800));cell.alpha_composite(crop,(round(360-(fx-bounds[0]+2)),round(780-(fy-bounds[1]+2))));priorityAtlas.alpha_composite(cell,(i%4*800,i//4*800));sourceMap.append({'cell':i,'sourceBounds':bounds,'fixedSourceAnchor':[fx,fy],'alphaComponent':ci})
priorityAtlas.save(P/'allies-priority-segmented.png');(P/'allies-priority-segmentation.json').write_text(json.dumps(sourceMap,indent=2)+'\n')
add_grid('allies-priority','allies-priority-segmented.png',4,2,[{'key':'r3_ally_'+id+'_'+ph,'actorId':id,'role':'ally','pose':ph,'bodyHeight':345,'feetAnchor':[.45,.975],'pelvisAnchor':[.45,.74],'bodyBox':[.28,.52,.40,.455],'qualityStatus':'source_own_component_checked'} for id in ['lubu','machao'] for ph in ['run0','wind','rel','rec']])
for tag,ids in [('a',['taishici','ganning','zhanghe']),('b',['xiahouyuan','weiyan','zhangren']),('c',['dengai','lusu','huangyueying']),('d',['caoren','zhonghui','lukang'])]:
 file='characters-'+tag+'-alpha.png'
 if not (P/file).exists():continue
 entries=[{'key':'r3_ally_'+id+'_'+ph,'actorId':id,'role':'ally','pose':('run' if ph in ['run0','pass0','run1','pass1'] else ph),'bodyHeight':Image.open(P/file).height/6*.82,'feetAnchor':[.52,.965]} for id in ids for ph in ['run0','pass0','run1','pass1','wind','rel','rec','ready']]
 if tag=='c':
  selected=[None]*36
  for actor in range(3):
   for phase,offset in enumerate([0,1,2,3,6,7,8,5] if actor==1 else [0,1,2,3,6,8,9,5]):selected[actor*12+offset]=entries[actor*8+phase]
  add_grid('characters-'+tag,file,6,6,selected,row_cols=[6,4,6,4,6,4])
 else:add_grid('characters-'+tag,file,4,6,entries)
for tag,ids in [('a',['dian','xu','liao','xiahou','lumeng','sunxiang']),('b',['luxun','zhao','zhang','guan','huang','jiang'])]:
 file='legacy-'+tag+'-alpha.png'
 if (P/file).exists():add_grid('legacy-'+tag,file,4,6,[{'key':'r3_ally_'+id+'_'+ph,'actorId':id,'role':'ally','pose':'run' if ph=='run0' else ph,'bodyHeight':Image.open(P/file).height/6*.80,'feetAnchor':[.54,.965]} for id in ids for ph in ['run0','wind','rel','rec']])
file='boss-recover-alpha.png'
if (P/file).exists():add_grid('boss-recover',file,5,2,[{'key':'r3_boss_'+id+'_rec','actorId':id,'role':'boss','pose':'rec','bodyHeight':Image.open(P/file).height/2*.84,'feetAnchor':[.50,.985]} for id in ['jiao','dong','lubu','dian','cao','sunce','zhou','zhang','guan','zhuge']])
file='light-alpha.png'
if (P/file).exists():add_grid('enemy-light',file,4,1,[{'key':'r3_enemy_light_'+ph,'actorId':'light','role':'enemy','pose':ph,'bodyHeight':Image.open(P/file).height*.84,'feetAnchor':[.54,.96]} for ph in ['run','wind','rel','rec']])
file='rider-crossbow-sheet-alpha.png'
if (P/file).exists():add_grid('rider-crossbow',file,4,2,[{'key':'r3_ride_'+mount+'_liannu_'+ph,'actorId':'player','role':'hero_mounted','pose':('run' if ph.startswith('run') else ph),'bodyHeight':415,'feetAnchor':[.53,.98]} for mount in ['chitu','dilu'] for ph in ['run1','wind','rel','rec']])
file='hero-recover-alpha.png'
if (P/file).exists():add_grid('hero-recover',file,4,2,[{'key':'r3_hero_'+id+'_rec','actorId':'player','role':'hero','pose':'rec','bodyHeight':286,'feetAnchor':[.49,.975],'bodyBox':[.25,.22,.48,.75]} for id in ['shemao','huaji','guding','shuangji','yitian','qinggang','shuanggu','liannu']])
for mount,coords in json.loads((P/'mounted-hand-review.json').read_text()).items():
 file='mount-'+mount+'-alpha.png';im2=Image.open(P/file);cw=im2.width/4;ch=im2.height/2;entries=[]
 for i,coords4 in enumerate(coords):
  style='bow' if i<4 else 'dual';ph=['run1','wind','rel','rec'][i%4]
  if coords4 is None:entries.append(None);continue
  key='r3_body_ride_'+mount+'_'+style+'_'+ph
  entries.append({'key':key,'actorId':'player','role':'hero_mounted','pose':'run' if ph=='run1' else ph,'bodyHeight':ch*.83,'feetAnchor':[.52,.98],'pelvisAnchor':[.50,.40],'bodyBox':[.27,.08,.39,.49],'bodyContainsWeapon':False})
  rx,ry,lx,ly=coords4;hands[key]={'bodyContainsWeapon':False,'pose':ph,'sockets':{'right':{'normalized':[rx/cw,ry/ch]},'left':{'normalized':[lx/cw,ly/ch]}},'basis':'manual_fist_centres_untrimmed_cell','rigidWeapon':style!='bow'}
 add_grid('mount-'+mount,file,4,2,entries)
# Finger occlusion is cropped from each newly made fist, never copied from another actor.
capAtlas=Image.new('RGBA',(28*len(hands)*2,28));capEntries=[]
for fi,(key,handspec) in enumerate(hands.items()):
 f=frames[key];sheetpath=OUT/(sheets[f['s']].split('/')[-1]+'.png');source=Image.open(sheetpath).convert('RGBA');x,y,cw,ch=f['r']
 for hi,hand in enumerate(['right','left']):
  sock=handspec['sockets'][hand];sx=x+round(sock['normalized'][0]*cw);sy=y+round(sock['normalized'][1]*ch);crop=source.crop((sx-14,sy-14,sx+14,sy+14));idx=fi*2+hi;capAtlas.alpha_composite(crop,(idx*28,0));capkey=key+'_'+hand+'_fingers';sock['occlusion_frame']=capkey;capEntries.append({'key':capkey,'actorId':'player','role':'hand_occlusion','pose':handspec['pose'],'bodyHeight':28,'feetAnchor':[.5,.5]})
if hands:
 capAtlas.save(P/'mounted-finger-caps.png');add_grid('mounted-finger-caps','mounted-finger-caps.png',len(capEntries),1,capEntries)
grip_source={
 'ready':([[237,130],[184,186]],[294,74],[336,25]),'run0':([[595,143],[550,180]],[639,85],[670,30]),
 'run1':([[972,149],[917,188]],[1008,84],[1037,25]),'run2':([[1331,150],[1290,187]],[1380,86],[1410,28]),
 'run3':([[241,494],[189,541]],[294,431],[325,383]),'wind':([[494,408],[570,431]],[450,392],[360,370]),
 'rel':([[955,478],[825,480]],[1058,476],[1133,465]),'rec':([[1354,488],[1296,546]],[1402,422],[1420,378]),
 'show':([[245,787]],[300,706],[340,668]),'hit':([[599,868],[551,911]],[649,809],[687,745]),
 'defeat':([[995,904]],[995,806],[1003,744])}
for ph,fx,fy in hero:
 k='r3_hero_guandao_'+ph;grips,root,tip=grip_source[ph];norm=lambda xy:[(230+xy[0]-fx)/500,(480+xy[1]-fy)/500]
 meta[k].update({'grips':[norm(g) for g in grips],'weaponRoot':norm(root),'weaponTip':norm(tip),'gripBasis':'manual_source_review','weaponAxis':'single_rigid_collinear_pole','originalSourceSha':hashof(P/'hero-guandao-sheet-v2-source.png'),'sourceBounds':components[order[[a[0] for a in hero].index(ph)]][1],'metadataBasis':'fixed_source_canvas_manual_pelvis_and_foot_reference'})
art={'sheets':sheets,'frames':frames};(P/'frame-map.json').write_text(json.dumps(art,indent=2)+'\n');(P/'actor-metadata.json').write_text(json.dumps(meta,indent=2)+'\n');mod=ROOT/'assets/scripts/formal/R3Art.ts';mod.write_text('/** Additive R3 artwork; source-sized cells retain a fixed anatomical reference and feet pivot. */\nexport const R3_ART='+json.dumps(art,separators=(',',':'))+';\nexport const R3_ACTOR_META:any='+json.dumps(meta,separators=(',',':'))+';\nexport const R3_HANDS:any='+json.dumps(hands,separators=(',',':'))+';\n');tsmeta=json.loads((ROOT/'assets/scripts/formal/R2Art.ts.meta').read_text());tsmeta['uuid']=str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu/r3/R3Art.ts'));mod.with_suffix('.ts.meta').write_text(json.dumps(tsmeta,indent=2)+'\n');print({'frames':len(frames),'sheets':len(sheets)})
