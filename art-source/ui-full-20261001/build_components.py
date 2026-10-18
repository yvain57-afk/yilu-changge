#!/usr/bin/env python3
"""Reproducible crop/packing only. Does not paint or synthesize replacement art."""
from pathlib import Path
import json,hashlib,math
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
S=P/'source'; OUT=P/'slices'; OUT.mkdir(exist_ok=True)
H=lambda f:hashlib.sha256(Path(f).read_bytes()).hexdigest()
frames=[]
def add(id,state,src,box,margins=None,mode='nine_slice'):
 im=Image.open(S/src).convert('RGBA'); crop=im.crop(box)
 # Ignore transparent RGB/noisy extremely faint pixels when determining bounds; retain antialiasing within crop.
 bb=crop.getchannel('A').point(lambda a:255 if a>=96 else 0).getbbox()
 assert bb,(id,state)
 bb=(max(0,bb[0]-2),max(0,bb[1]-2),min(crop.width,bb[2]+2),min(crop.height,bb[3]+2))
 q=crop.crop(bb); q=q.resize((math.ceil(q.width/2),math.ceil(q.height/2)),Image.Resampling.LANCZOS)
 file=OUT/f'{id}__{state}.png';q.save(file)
 m={k:round(v/2) for k,v in zip(['left','top','right','bottom'],margins)} if margins else None
 frames.append(dict(id=id,state=state,mode=mode,source='source/'+src,source_sha256=H(S/src),source_rect=[box[0]+bb[0],box[1]+bb[1],bb[2]-bb[0],bb[3]-bb[1]],file=str(file.relative_to(P)),sha256=H(file),size=list(q.size),slice_margins=m,transparent_padding_px=2,content_inset_px=m,source_scale=.5, suggested_pixels_per_logical_unit=2))
for r,id in enumerate(['ui_button_gold','ui_button_navy','ui_button_warning']):
 for c,state in enumerate(['normal','pressed','disabled']):add(id,state,'buttons-primary.png',(c*512,r*320+70,(c+1)*512,min(1024,r*320+315)),[58,55,58,55])
for r,(id,states) in enumerate([('ui_panel_navy',['normal','raised','muted']),('ui_card_item',['normal','selected','locked'])]):
 for c,state in enumerate(states):add(id,state,'panels.png',(c*418,r*400,(c+1)*418,r*400+400),[76,76,76,76])
for c,state in enumerate(['normal','warning']):add('ui_dialog',state,'panels.png',(c*418,800,(c+1)*418,1210),[78,76,78,76])
for c,state in enumerate(['normal','selected','disabled']):add('ui_tab',state,'misc.png',(c*418,40,(c+1)*418,260),[54,40,54,40])
add('ui_banner_victory','normal','misc.png',(0,290,444,610),[120,0,120,0],'fixed_corners_stretch_center')
add('ui_banner_milestone','normal','misc.png',(448,290,903,610),[120,0,120,0],'fixed_corners_stretch_center')
add('ui_medal_base','normal','misc.png',(910,260,1254,610),None,'sprite')
add('ui_progress_track','normal','misc.png',(318,665,863,815),[70,25,70,25],'sliced_track_fill_cap')
add('ui_progress_fill','normal','misc.png',(875,670,1254,820),[42,20,42,20],'sliced_track_fill_cap')
for id,crop in [('locked',(65,900,327,1230)),('empty',(445,920,811,1210)),('loading',(896,898,1240,1230))]:add('ui_lock_empty',id,'misc.png',crop,None,'sprite')
for c,state in enumerate(['normal','highlight']):add('ui_reward_socket',state,'addons.png',(c*627,70,(c+1)*627,625),[100,100,100,100])
add('ui_lock_empty','error','addons.png',(80,695,580,1150),None,'sprite')
add('ui_progress_cap','normal','addons.png',(680,695,1200,1150),None,'sprite')
# Simple padded shelves; no rotations; stable IDs; straight RGBA, no premultiplication.
W=2048;x=y=4;rowh=0
for f in frames:
 w,h=f['size']
 if x+w+4>W:x=4;y+=rowh+8;rowh=0
 f['atlas_rect']=[x,y,w,h];f['atlas']='ui-components.png';x+=w+8;rowh=max(rowh,h)
height=2**math.ceil(math.log2(y+rowh+4));atlas=Image.new('RGBA',(W,height))
for f in frames:atlas.alpha_composite(Image.open(P/f['file']),f['atlas_rect'][:2])
atlas.save(P/'ui-components.png')
manifest=dict(schema=1,task='YILU-BUGFIX-UI-FULL-20261001',status='offline_assets_ready_runtime_not_integrated',gate_a_required=True,provenance={'method':'OpenAI built-in image_gen; generated specifically for this project; PIL crop/downscale/packing only','third_party_art':'none','reference':'IMG_4399.jpeg only for volume/hierarchy, no source pixels reused','lighting':'upper-left','text_baked':False},atlas={'file':'ui-components.png','size':list(atlas.size),'sha256':H(P/'ui-components.png'),'alpha':'straight RGBA','filter':'bilinear','padding':4,'rotate':False},frames=frames)
(P/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Contact sheets on light, dark and field-like colors, real scaled assets, labels QA-only.
for color,name in [('#101D2B','dark'),('#EDE6D5','light'),('#71836C','field')]:
 board=Image.new('RGB',(1200,math.ceil(len(frames)/4)*175),color);d=ImageDraw.Draw(board)
 for i,f in enumerate(frames):
  col=i%4;row=i//4;im=Image.open(P/f['file']);im.thumbnail((278,125),Image.Resampling.LANCZOS)
  board.paste(im,(col*300+(300-im.width)//2,row*175+8),im)
  d.text((col*300+8,row*175+142),f["id"].replace('ui_','')+' / '+f['state'],fill='#FFFFFF' if name!='light' else '#202030')
 board.save(P/'qa'/f'contact-{name}.jpg',quality=94)
# 9-slice insets and stretch specimen. All corners retain their native aspect.
def sliced(f,w,h):
 src=Image.open(P/f['file']);m=f['slice_margins'];l,t,r,b=[m[k] for k in ['left','top','right','bottom']]
 assert l+r<src.width and t+b<src.height
 xx=[0,l,src.width-r,src.width];yy=[0,t,src.height-b,src.height]
 dx=[0,l,w-r,w];dy=[0,t,h-b,h];out=Image.new('RGBA',(w,h))
 for j in range(3):
  for i in range(3):
   if yy[j+1]==yy[j]:continue
   tile=src.crop((xx[i],yy[j],xx[i+1],yy[j+1])).resize((dx[i+1]-dx[i],dy[j+1]-dy[j]),Image.Resampling.LANCZOS);out.alpha_composite(tile,(dx[i],dy[j]))
 return out
q=Image.new('RGB',(1200,1250),'#101D2B');d=ImageDraw.Draw(q)
for k,(id,st,w,h) in enumerate([('ui_button_gold','normal',350,64),('ui_button_navy','pressed',180,64),('ui_panel_navy','normal',400,260),('ui_card_item','selected',180,260),('ui_dialog','warning',390,300),('ui_reward_socket','normal',180,180)]):
 f=next(f for f in frames if f['id']==id and f['state']==st);im=sliced(f,w,h);xy=(30+(k%2)*560,30+(k//2)*380);q.paste(im,xy,im);d.text((xy[0],xy[1]+h+10),id+' '+st,fill='white')
q.save(P/'qa/nine-slice-stretch.jpg',quality=96)
qa=dict(frames=len(frames),component_families=len(set(f['id'] for f in frames)),required_family_count=13,additional_progress_parts=['ui_progress_fill','ui_progress_cap'],all_alpha=True,rects_within_atlas=all(f['atlas_rect'][0]+f['size'][0]<=W and f['atlas_rect'][1]+f['size'][1]<=height for f in frames),nine_slice_bounds=all(not f['slice_margins'] or (f['slice_margins']['left']+f['slice_margins']['right']<f['size'][0] and f['slice_margins']['top']+f['slice_margins']['bottom']<f['size'][1]) for f in frames),runtime_verified=False)
plan=json.loads((P.parent.parent/'docs/YILU-BUGFIX-UI-FULL-20261001/intake/UI_ASSET_PLAN.json').read_text())
expected={(c['id'],state) for c in plan['components'] for state in c['states']}
actual={(f['id'],f['state']) for f in frames}
assert expected<=actual
qa.update(expected_required_states=len(expected),required_states_present=len(expected & actual),missing_required_states=[])
(P/'qa/checks.json').write_text(json.dumps(qa,indent=2)+'\n');print(json.dumps(qa));print('atlas',atlas.size)
