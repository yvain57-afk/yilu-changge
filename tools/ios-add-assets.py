"""Pack reviewed iOS additions; input masters retained, geometry explicitly logged."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import ast,json,numpy as np
root=Path(__file__).resolve().parents[1]
n=next(n for n in ast.parse((root/'tools/pr2-art-slice.py').read_text()).body if isinstance(n,ast.FunctionDef) and n.name=='components');exec(compile(ast.Module(body=[n],type_ignores=[]),'components','exec'))
mp=root/'assets/scripts/formal/manifest.ts';m=json.loads(mp.read_text().split('export const MANIFEST:any=')[1].rstrip(';\n'))
out=root/'art-source/ios-fix20260928';tiles=[];ledger=[]
def extract(im,r):
 a=np.array(im);mask=np.zeros(a.shape[:2],dtype=np.uint8)
 for y,x0,x1 in r['runs']:mask[y,x0:x1]=255
 mask=np.array(Image.fromarray(mask).filter(ImageFilter.MaxFilter(3)))>0
 a[:,:,3]=np.where(mask,a[:,:,3],0)
 return Image.fromarray(a).crop(tuple(map(int,r['box'])))
im=Image.open(out/'hero-gait-source.png').convert('RGBA');cs=sorted([r for r in components(np.array(im)[:,:,3]>24) if r['area']>2000],key=lambda r:(r['box'][1]//600,r['box'][0]))
for i,r in enumerate(cs):
 t=extract(im,r);t.thumbnail((260,300));tiles.append((f'g_ios_gait{i}',t,280));ledger.append({'key':f'g_ios_gait{i}','source':'hero-gait-source.png','box':list(map(int,r['box']))})
im=Image.open(out/'boss-ending-source.png').convert('RGBA');cs=[r for r in components(np.array(im)[:,:,3]>24) if r['area']>2000]
ids=['jiao','dong','dian','cao','sunce','zhou','zhang','guan','zhuge']
# Only intact first/third columns are used. Two middle-column actors touch in the master.
for col in [0,2]:
 column=sorted([r for r in cs if int((r['box'][0]+r['box'][2])/2/im.width*3)==col],key=lambda r:r['box'][1]);assert len(column)==9
 for id,r in zip(ids,column):
  t=extract(im,r);tiles.append((f'g_end_{id}_{col}',t,158));ledger.append({'key':f'g_end_{id}_{col}','source':'boss-ending-source.png','box':list(map(int,r['box']))})
# Distinct portrait assets: upper body crop from intact FRONT art, never a back-run frame.
for id in ['jiao','dong','dian','cao','sunce','zhou','zhang','guan','zhuge','lubu','xu','liao','xiahou','lumeng','luxun','zhao','huang','pang','machao','sunxiang','jiang']:
 k=('g_lubuIdle' if id=='lubu' else 'g_front_'+id+'Run0' if 'g_front_'+id+'Run0' in m['frames'] else 'g_boss_'+id+'_idle')
 if k not in m['frames']:continue # sunxiang/jiang need front art; never label back sprites portraits.
 f=m['frames'][k];src=Image.open(root/'assets/resources'/str(m['sheets'][f['s']]+'.png')).convert('RGBA');x,y,w,h=f['r'];t=src.crop((x,y,x+w,y+round(h*.62)));t.thumbnail((140,150));tiles.append(('g_portrait_'+id,t,t.height));ledger.append({'key':'g_portrait_'+id,'sourceFrame':k,'region':'upper 62 percent, front only'})
for source,ids in [('attack-mid',['spear','guandao','shemao','huaji']),('derived-mid',['guding','shuangji','yitian','qinggang','shuanggu','liannu']),('crossbow-mid',['liannu'])]:
 im=Image.open(out/(source+'-source.png')).convert('RGBA');cs=[r for r in components(np.array(im)[:,:,3]>24) if r['area']>3000]
 for col in range(2):
  column=sorted([r for r in cs if int((r['box'][0]+r['box'][2])/2/im.width*2)==col],key=lambda r:r['box'][1]);assert len(column)==len(ids),(source,col,len(column))
  for id,r in zip(ids,column):
   if source=='derived-mid' and id=='liannu':continue # Replaced by unclipped dedicated two-pose master.
   t=extract(im,r);t.thumbnail((320,270));key=f'g_mid_{id}_{col}';tiles.append((key,t,t.height*.86));ledger.append({'key':key,'source':source+'-source.png','box':list(map(int,r['box']))})
im=Image.open(out/'front-additions-source.png').convert('RGBA');cs=sorted([r for r in components(np.array(im)[:,:,3]>24) if r['area']>10000],key=lambda r:r['box'][0]);assert len(cs)==2
for id,r in zip(['sunxiang','jiang'],cs):
 t=extract(im,r);portrait=t.crop((0,0,t.width,round(t.height*.50)));portrait.thumbnail((140,150));tiles.append(('g_portrait_'+id,portrait,portrait.height));t.thumbnail((240,300));tiles.append(('g_front_'+id+'Run0',t,t.height));ledger.append({'key':'g_portrait_'+id,'source':'front-additions-source.png','box':list(map(int,r['box']))})
im=Image.open(out/'dual-parts-source.png').convert('RGBA');cs=sorted([r for r in components(np.array(im)[:,:,3]>24) if r['area']>2000],key=lambda r:r['box'][0]);assert len(cs)==2
for key,r in zip(['g_part_shuanggu','g_part_shuangji'],cs):
 t=extract(im,r);t.thumbnail((120,260));tiles.append((key,t,t.height));ledger.append({'key':key,'source':'dual-parts-source.png','box':list(map(int,r['box']))})
atlas=Image.new('RGBA',(2048,2048));x=y=4;rh=0
for key,t,bh in tiles:
 if x+t.width+4>2048:x=4;y+=rh+8;rh=0
 assert y+t.height+4<=2048
 atlas.paste(t,(x,y));m['frames'][key]={'s':'ios_added','r':[x,y,t.width,t.height],'a':[.5,0],'bh':bh};t.save(out/(key+'.png'));x+=t.width+8;rh=max(rh,t.height)
atlas.crop((0,0,2048,y+rh+4)).save(root/'assets/resources/formal20260927/ios-added.png');m['sheets']['ios_added']='formal20260927/ios-added'
im=Image.open(out/'campaign-map-source.png');im.thumbnail((768,1152));im.save(root/'assets/resources/formal20260927/ios-map.png');m['sheets']['ios_map']='formal20260927/ios-map';m['frames']['g_ios_map']={'s':'ios_map','r':[0,0,im.width,im.height],'a':[.5,0],'bh':im.height}
# Hand occluders use exact pixels from the approved rider, not painted placeholder fingers.
for key,hand in {'g_ride_chitu_run0':(.9429,.3874),'g_ride_chitu_run1':(.9483,.389),'g_ride_chitu_wind':(.9465,.084),'g_ride_chitu_rel':(.9485,.0966),'g_ride_dilu_run0':(.9502,.3924),'g_ride_dilu_run1':(.952,.3996),'g_ride_dilu_wind':(.9437,.0819),'g_ride_dilu_rel':(.9309,.0799)}.items():
 f=m['frames'][key];x,y,w,h=f['r'];pw,ph=max(5,round(w*.045)),max(5,round(h*.028));cx,cy=round(w*hand[0]),round(h*hand[1]);m['frames'][key+'_fingers']={'s':f['s'],'r':[x+cx-pw//2,y+cy-ph//2,pw,ph],'a':[.5,.5],'bh':ph};ledger.append({'key':key+'_fingers','sourceFrame':key,'purpose':'near fingers occlude real weapon grip'})
mp.write_text('// Generated by tools/ios-slice-repair.py then tools/ios-add-assets.py.\nexport const MANIFEST:any='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n');(out/'added-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2));print(len(tiles),'added frames')
