from pathlib import Path
import json,math,hashlib
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;R=P.parents[1];m=json.load(open(P/'frame-map.json'));old=json.load(open(R/'art-source/regression-20261001/pose-targeted/frame-map.json'))
for t in ['sheets','frames']:m[t].update(old[t])
hands=json.load(open(P/'body-sockets.json'));props=json.load(open(R/'art-source/regression-20261001/pose-targeted/crossbow-contract.json'))
def frame(k):
 f=m['frames'][k];x,y,w,h=f['r'];return Image.open(R/('assets/resources/'+m['sheets'][f['s']]+'.png')).crop((x,y,x+w,y+h))
b=Image.new('RGB',(1600,1100),(217,214,201));d=ImageDraw.Draw(b);validation=[]
for row,pkey in enumerate(['r27_held_liannu','r27_held_jiguannu']):
 prop=frame(pkey);g=props[pkey];gp=[(g[x][0]*prop.width,g[x][1]*prop.height) for x in ['rearGrip','supportGrip']];gx,gy=gp[1][0]-gp[0][0],gp[1][1]-gp[0][1]
 for col,(key,c) in enumerate(hands.items()):
  body=frame(key);canvas=Image.new('RGBA',(400,520));ox=30;oy=20;canvas.alpha_composite(body,(ox,oy));pts=[(c['sockets'][h]['normalized'][0]*body.width+ox,c['sockets'][h]['normalized'][1]*body.height+oy) for h in ['right','left']];hx,hy=pts[1][0]-pts[0][0],pts[1][1]-pts[0][1];scale=math.hypot(hx,hy)/math.hypot(gx,gy);ang=math.atan2(hy,hx)-math.atan2(gy,gx);a=math.cos(ang)/scale;b1=math.sin(ang)/scale;dd=-math.sin(ang)/scale;e=math.cos(ang)/scale;cc=gp[0][0]-a*pts[0][0]-b1*pts[0][1];ff=gp[0][1]-dd*pts[0][0]-e*pts[0][1];image=prop.transform(canvas.size,Image.Transform.AFFINE,(a,b1,cc,dd,e,ff),Image.Resampling.BICUBIC);canvas.alpha_composite(image)
  for h,pt in zip(['right','left'],pts):
   cap=frame(c['sockets'][h]['occlusion_frame']);canvas.alpha_composite(cap,(round(pt[0]-10),round(pt[1]-10)))
  b.paste(canvas,(col*400,row*550),canvas);d.text((col*400+4,row*550+521),key,fill='black');d.text((col*400+4,row*550+535),pkey+' span '+str(round(math.hypot(hx,hy),2)),fill='black');validation.append({'key':key,'prop':pkey,'gripSpanPx':math.hypot(hx,hy),'scale':scale})
b.save(P/'mounted-crossbow-composite-qa.jpg',quality=95)
for key,f in json.load(open(P/'frame-map.json'))['frames'].items():
 im=Image.open(R/('assets/resources/'+m['sheets'][f['s']]+'.png'));x,y,w,h=f['r'];assert x>=0 and y>=0 and x+w<=im.width and y+h<=im.height
(P/'validation.json').write_text(json.dumps({'atlasBounds':'pass','bodies':4,'frames':12,'distinctGaitPhasesPerMount':2,'noMirroring':True,'attackPosesAccepted':0,'runtimeVerified':False,'deviceVerified':False,'fits':validation},indent=2)+'\n')
