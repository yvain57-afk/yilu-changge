import {PresentationAssets} from './ui/PresentationAssets';
import {BattleFix2Assets} from './ui/BattleFix2Assets';
import {WeaponPresentation} from './ui/WeaponPresentation';
import {BattleAssets} from './BattleAssets';
import {BattleRoad} from './BattleRoad';
import {WorldLabels} from './ui/WorldLabels';
import {hazardOutline} from './core/hazards';
import {muzzle,Target} from './core/runner';
import {HAND_SOCKETS} from './core/artSockets';
import {poseGeometry,rigidWeapon,WEAPON_LENGTH,nearGeometry,frameBlend,actorAnchor} from './core/combatGeometry';
import {WEAPONS,CAST,WeaponId,CastId,AttackInstance,TIER_WIDTHS} from './core/weapons';
import {V05_SOCKETS} from './ArtAtlasV05';
import { Node, Graphics, Color, Label, UITransform, Layers, UIOpacity } from 'cc';
import { Journey, BOSS_TARGET, MELEE, clamp } from './core/model';
import { project, formation } from './VisualConfig';
import { lossLabel, bossFootprint, Effects } from './Presentation';
import { Pose } from './HeroRig';
import { ArtSprites, Art, ART_FRAMES } from './ArtSprites';
import { RankStage } from './core/progression';
import { Volleys, VOLLEY_CAPACITY } from './Volley';
import { worldStrip, gaitFrame, shootFrame, battleScenery } from './WorldScenery';
const BATTLE_HEIGHT={soldier:110,hero:140,companion:126,enemy:110};
const shotLift=(role:'hero'|'companion'|'soldier',weapon?:WeaponId)=>{
 if(role==='soldier')return 45*BATTLE_HEIGHT.soldier/78;
 const prefix=role==='hero'?(weapon==='blade'?'blade':'spear'):weapon==='great_axe'?'xing':weapon==='throwing_fork'?'chen':'zhao',h=role==='hero'?BATTLE_HEIGHT.hero:BATTLE_HEIGHT.companion;
 const socket=BattleFix2Assets.socket(prefix+'Release','muzzle',h);
 // Camera-only elevation: metal outlet and wave share the same measured socket.
 // Model x/z, issued tick, speed, damage and collisions remain untouched.
 return socket?socket.y-5.2:72*h/(role==='hero'?114:104);
};
const C={ink:'#1E2F46',cream:'#F4EBDC',red:'#C94537',gold:'#D4B06A',road:'#deceb0',grass:'#8b987e'};
export type SceneRect={x:number;y:number;w:number;h:number};
export type PageSceneKind='home'|'loadout'|'chapters'|'camp'|'transition'|'meeting'|'result'|'loading'|'error';
export type PageSceneOptions={hero?:boolean;map?:boolean;identity?:string;stage?:number;settled?:boolean;flag?:{x:number;y:number};externalBackdrop?:boolean;externalHero?:boolean;minHitSize?:number};
export type Preview={count:number;x:number;time:number;pose:Pose;rank:boolean;debug:boolean};
/** Shared atlas sprites and bounded effects. Simulation facts remain read-only. */
export class BattleView {
 private g!:Graphics;private layer!:Node;private order=0;private labels=new Map<string,Node>();private layers=new Map<string,Node>();private spearState:any=null;private currentScene=0;private currentRank:RankStage=0;private art=new ArtSprites();private battleArt=new BattleAssets();private battleRoad=new BattleRoad();private fix2Art=new BattleFix2Assets();private rewardPortraits=new PresentationAssets();private weaponPresentation=new WeaponPresentation();private actorLabelObstacles:{x:number;y:number;width:number;height:number}[]=[];private targetFrames:{id:string;slot:number;kind:string;distance:number;x:number;y:number;value:number;labelId:string}[]=[];private attackFrames:{memberId:number;key:string;eventId:number|null;muzzle:{x:number;y:number};artMuzzle:{x:number;y:number}|null;outletError:number|null}[]=[];
 private visualRun:Journey|null=null;private memberShotTicks=new Map<number,number>();private memberBirthTicks=new Map<number,number>();private observedTick=-1;private worldLabels=new WorldLabels();private sceneOwner='none';private sceneRect:SceneRect|null=null;private heroDisplays:string[]=[];private companionDisplays:string[]=[];private flagDisplay:{x:number;y:number}|null=null;private dropTarget:(SceneRect)|null=null;private flagHit:(SceneRect&{footX:number;footY:number;offsetX:number;offsetY:number})|null=null;private logicalScale=720/390;private labelBounds={left:-344,right:344,bottom:-590,top:490};
 readonly effects=new Effects();readonly volleys=new Volleys();debug=false;private sceneryState:{id:number;worldZ:number;y:number}[]=[];
 constructor(private root:Node){}
 private use(id:string){let n=this.layers.get(id);if(!n){n=new Node(id);n.layer=Layers.Enum.UI_2D;this.root.addChild(n);n.addComponent(UITransform);n.addComponent(Graphics);n.addComponent(UIOpacity);this.layers.set(id,n);}n.active=true;n.getComponent(UIOpacity)!.opacity=255;n.setSiblingIndex(this.order++);this.layer=n;this.g=n.getComponent(Graphics)!;this.g.clear();return n;}
 private begin(){this.order=0;this.worldLabels.begin();this.sceneOwner='none';this.heroDisplays=[];this.companionDisplays=[];this.flagDisplay=null;this.dropTarget=null;this.flagHit=null;this.sceneRect=null;for(const n of this.layers.values())n.active=false;for(const n of this.labels.values())n.active=false;this.art.begin();this.battleArt.begin();this.fix2Art.begin();this.rewardPortraits.begin();this.attackFrames=[];this.targetFrames=[];}
 private color(c:string){return new Color().fromHEX(c);}
 private rect(x:number,y:number,w:number,h:number,c:string){this.g.fillColor=this.color(c);this.g.rect(x,y,w,h);this.g.fill();}
 private ellipse(x:number,y:number,w:number,h:number,c:string){this.g.fillColor=this.color(c);this.g.ellipse(x,y,w,h);this.g.fill();}
 private line(x:number,y:number,x2:number,y2:number,c:string,w=3){this.g.strokeColor=this.color(c);this.g.lineWidth=w;this.g.moveTo(x,y);this.g.lineTo(x2,y2);this.g.stroke();}
 private poly(points:number[][],c:string){this.g.fillColor=this.color(c);this.g.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))this.g.lineTo(p[0],p[1]);this.g.close();this.g.fill();}
 private text(id:string,t:string,x:number,y:number,size=24,color=C.ink,w=300){let n=this.labels.get(id);if(!n){n=new Node(id);n.layer=Layers.Enum.UI_2D;n.addComponent(UITransform);n.addComponent(Label);this.labels.set(id,n);}if(n.parent!==this.layer)this.layer.addChild(n);n.active=true;n.setSiblingIndex(this.layer.children.length-1);n.setPosition(x,y);n.setScale(1,1,1);n.getComponent(UITransform)!.setContentSize(w,Math.max(65,size*1.35));const l=n.getComponent(Label)!;l.fontSize=size;l.lineHeight=size*1.3;l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;l.overflow=Label.Overflow.NONE;l.string=t;l.color=this.color(color);return n;}
 private sprite(id:string,frame:Art,x:number,y:number,s:number,angle=0,alpha=255,tint='#ffffff'){return this.art.draw(id,frame,this.layer,x,y,s,angle,alpha,tint);}
 private archer(id:string,x:number,y:number,h:number,time:number,row:number,age:number,moving=true,phase=0,alpha=255){
  const scale=h/(row===3?205:190),leg=moving?gaitFrame(time,phase):0,upper=shootFrame(age),sway=moving?Math.sin((time/.66+phase*.137)*Math.PI*4)*.8:0;
  this.sprite(id+'-legs',(`archer${row}Leg${leg}`) as Art,x,y,scale,0,alpha);
  this.sprite(id+'-upper',(`archer${row}Upper${upper}`) as Art,x,y+sway,scale,0,alpha);
 }
 private hero(id:string,x:number,y:number,h:number,t:number,pose:Pose,rank:RankStage,age=10,j?:Journey,equipped:WeaponId='spear'){
  this.ellipse(x,y,h*.22,h*.06,'#788773');const moving=pose==='walk'||pose==='shoot',leg=moving?gaitFrame(t,0):0,r=Math.min(rank,2);
  this.sprite(id+'-legs',(`archer${r}Leg${leg}`) as Art,x,y,h/190);
  const weapon=j?.weapon??equipped,g=j?.heroGeometry??poseGeometry(x/260,0,null,weapon,'hero',r),b=g.blend,k=h/108,dx=x-g.body.x*k,dy=y-g.body.y*k;
  for(const [key,alpha] of [[b.from,1-b.mix],[b.to,b.mix]])if(alpha>0)this.sprite(id+'-upper'+(key===b.from?'a':'b'),(`${g.prefix}${g.row}Pose${key}`) as Art,x,y,h/350,0,255*alpha,j&&j.awakeningRemaining>5.7?'#fff9df':j&&j.awakeningRemaining>0?'#fff0bf':'#ffffff');
  const grip={x:g.grip.x*k+dx,y:g.grip.y*k+dy},tip={x:g.tip.x*k+dx,y:g.tip.y*k+dy};
  this.weaponSprite(id+'-weapon',weapon,grip.x,grip.y,tip.x,tip.y,k*g.body.s);
  this.spearState={key:b.to,grip,tip,attackId:j?.melee?.id,phase:j?.melee?.phase??'idle'};
  if(j&&j.tier===3){this.line(grip.x,grip.y,tip.x,tip.y,'#f3df9b',2);}
  if(j&&j.awakeningRemaining>0){const q=j.awakeningRemaining/6;this.g.strokeColor=new Color(238,209,128,190*Math.min(1,j.awakeningRemaining/.2));this.g.lineWidth=3;this.g.arc(x,y+55,39,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false);this.g.stroke();}
  if(this.debug&&j?.heroGeometry)this.drawContactDebug(j.heroGeometry,j);
 }
 private drawContactDebug(g:ReturnType<typeof nearGeometry>,j:Journey){
  const a=project(g.anchor.x-g.halfWidth,g.from-j.z),b=project(g.anchor.x+g.halfWidth,g.to-j.z),center=project(g.anchor.x,g.to-j.z);
  this.line(g.grip.x,g.grip.y,g.tip.x,g.tip.y,'#00afca',2);this.ellipse(g.grip.x,g.grip.y,3,3,'#00afca');this.ellipse(g.tip.x,g.tip.y,4,4,'#ee723b');
  if(g.shape==='arc'){this.g.strokeColor=this.color('#00afca');this.g.lineWidth=2;this.g.moveTo(a.x,center.y+35);this.g.quadraticCurveTo(center.x,center.y+63,b.x,center.y+35);this.g.stroke();}else this.poly([[a.x,center.y+48],[center.x,center.y+60],[b.x,center.y+48]],'#00afca');
  if(j.phase==='boss'){const p=project(0,j.bossDepth);this.line(-.42*260*p.s,p.y+48*p.s,.42*260*p.s,p.y+48*p.s,'#ed7354',3);}
  this.text('geometry-'+g.prefix,`${g.weapon} #${g.prefix==='companion'?j.companionAttack?.id:j.melee?.id} · ${g.length.toFixed(0)}`,g.grip.x,g.grip.y-22,15,'#1b4a55',240);
 }

 private weaponSprite(id:string,weapon:WeaponId,gx:number,gy:number,tx:number,ty:number,size=1){
  const key=(weapon==='spear'?'spear':weapon==='blade'?'blade':weapon==='great_axe'?'great_axe':'throwing_fork') as keyof typeof V05_SOCKETS;
  const a=V05_SOCKETS[key],vx=a.tip[0]-a.grip[0],vy=a.grip[1]-a.tip[1],dx=tx-gx,dy=ty-gy;
  const scale=WEAPON_LENGTH[weapon]*size/Math.hypot(vx,vy),angle=(Math.atan2(dy,dx)-Math.atan2(vy,vx))*180/Math.PI;
  return this.sprite(id,key as Art,gx,gy,scale,angle);
 }
 private cast(id:string,castId:CastId,x:number,y:number,height:number,phase:string,time:number,ally=false,hit=false,contactTip?:{x:number;y:number},journey?:Journey){
  if(ally&&journey){const a=journey.companionAttack,g=journey.companionGeometry??poseGeometry(journey.x,journey.z,null,CAST[castId].weapon,castId as any),b=g.blend;this.ellipse(g.body.x,g.body.y,24,5,'#798773');
   for(const [key,alpha] of [[b.from,1-b.mix],[b.to,b.mix]])if(alpha>0){const art=(`companion${g.row}Pose${key}`) as Art;this.sprite(id+'-body'+(key===b.from?'a':'b'),art,g.body.x,g.body.y,height/ART_FRAMES[art].rect[3]*g.body.s,0,alpha*255);}
   if(!(castId==='chen_ying'&&a?.released&&(a.phase==='active'||a.phase==='recovery'&&b.mix<.8)))this.weaponSprite(id+'-weapon',CAST[castId].weapon,g.grip.x,g.grip.y,g.tip.x,g.tip.y,g.body.s);
   this.sprite(id+'-flag','blueFlag',g.body.x+height*.36,g.body.y+height*.30,.11);
   if(this.debug&&journey.companionGeometry)this.drawContactDebug(journey.companionGeometry,journey);return;
  }
  const row=['xing_daorong','chen_ying','yang_ling','zhao_yun_guest'].indexOf(castId),key=ally?3:phase==='charge'||phase==='windup'?1:phase==='flight'||phase==='active'?2:0;
  const art=(`cast${row}Pose${key}`) as Art,rect=ART_FRAMES[art].rect,s=height/rect[3],sway=ally?Math.sin(time*9)*1.5:0;
  this.ellipse(x,y,height*.3,height*.06,'#798773');this.sprite(id+'-body',art,x,y+sway,s,ally&&phase==='active'?-5:0,255,hit?'#ffe1a4':'#ffffff');
  const grip=HAND_SOCKETS[`boss${Math.min(row,2)}Pose${Math.min(key,2)}` as keyof typeof HAND_SOCKETS],gx=x+height/220*grip[0],gy=y+height/220*grip[1];
  let tx=gx+(ally?20:-35),ty=gy+height*.75;
  if(phase==='flight'||phase==='active'){tx=x+(ally?45:15);ty=y+(ally?height*1.25:height*.14);}
  if(contactTip){tx=contactTip.x;ty=contactTip.y;}
  const hazard=!ally?journey?.bossDirector:null;
  if(hazard?.weapon){const a=project(hazard.weapon.grip.x/2.5,hazard.weapon.grip.z-journey!.z),b=project(hazard.weapon.tip.x/2.5,hazard.weapon.tip.z-journey!.z),lift=hazard.weaponLift*height/220;this.weaponSprite(id+'-weapon',CAST[castId].weapon,a.x,a.y+lift,b.x,b.y+lift,Math.hypot(b.x-a.x,b.y-a.y)/WEAPON_LENGTH[CAST[castId].weapon]);}
  else if(CAST[castId].weapon==='throwing_fork'&&phase==='flight'&&!ally&&!contactTip){/* released fork; the hand stays empty */}
  else this.weaponSprite(id+'-weapon',CAST[castId].weapon,gx,gy,tx,ty,height/220);
  if(ally){this.sprite(id+'-flag','blueFlag',x+height*.32,y+height*.35,.11);}
 }
 private wave(weapon:WeaponId,x:number,y:number,halfWidth:number,s:number,enemy=false,tier=1){
  const w=halfWidth*260*s,dir=enemy?-1:1,edge=enemy?'#ffbe76':'#fff6ce',inner=enemy?'#b3603e':'#73aeb4';
  if(WEAPONS[weapon].shape==='fork'){
   this.line(x,y-dir*40*s,x,y+dir*22*s,edge,4*s);for(const side of [-1,1]){this.line(x,y-dir*8*s,x+side*w,y+dir*4*s,edge,3*s);this.line(x+side*w,y+dir*4*s,x+side*w,y+dir*20*s,edge,3*s);}this.poly([[x,y+dir*27*s],[x-5*s,y+dir*15*s],[x+5*s,y+dir*15*s]],edge);
  }else if(WEAPONS[weapon].shape==='crescent'||WEAPONS[weapon].shape==='axe'){
   const outer:number[][]=[],inside:number[][]=[];for(let i=0;i<=12;i++){const q=-1+2*i/12;outer.push([x+q*w,y+dir*(1-q*q)*22*s]);inside.unshift([x+q*w,y+dir*((1-q*q)*22-(weapon==='great_axe'?12:5))*s]);}this.poly([...outer,...inside],edge);if(tier===3)this.line(x-w*.8,y-dir*10*s,x+w*.8,y-dir*10*s,inner,2*s);
  }else{this.poly([[x,y+dir*32*s],[x-w,y],[x,y-dir*48*s],[x+w,y]],inner);this.poly([[x,y+dir*32*s],[x-w*.65,y],[x,y-dir*18*s],[x+w*.65,y]],edge);}
 }


 private ground(z:number,scene=0,duration=54,victory=false,textured=false){
  if(textured&&BattleAssets.ready){this.texturedGround(z,scene,duration);return;}
  this.use('ground');this.rect(-360,-1900,720,3800,scene===1?'#a89b7c':scene===2?'#889c95':C.grass);
  // One continuous roadside color; the previous sky rectangle made a hard
  // full-width horizontal band through the visible road environment.
  // Every ground point uses the same world-distance projection as obstacles.
  const strip=worldStrip(z);for(const tile of strip){const d=tile.worldZ-z,a=project(-1.25,d),b=project(1.25,d),c=project(1.25,d+1.25),e=project(-1.25,d+1.25);
   this.poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[e.x,e.y]],'#deceb0');
   this.line(a.x,a.y,e.x,e.y,'#b1a27f',7);this.line(b.x,b.y,c.x,c.y,'#b1a27f',7);this.line(a.x-5,a.y,e.x-5,e.y,'#8e9579',3);this.line(b.x+5,b.y,c.x+5,c.y,'#8e9579',3);
   for(const x of [-.72,-.25,.3,.78]){const p=project(x,d+.18),q=project(x+.07,d+.54);this.line(p.x,p.y,q.x,q.y,'#d1c09e',1.5);if((tile.id+Math.round(x*10))%3===0)this.ellipse(p.x+8,p.y-9,2.5,1.1,'#cbb99a');}
   for(let k=0;k<3;k++){const seed=Math.abs(Math.sin(tile.id*17.31+k*41.7)),px=(seed*2-1)*1.05,p=project(px,d+.25+k*.31),w=(5+seed*11)*p.s;this.poly([[p.x-w,p.y],[p.x-w*.7,p.y+4*p.s],[p.x+w*.65,p.y+3*p.s],[p.x+w,p.y-2*p.s],[p.x-w*.3,p.y-3*p.s]],'#d0bd9a');this.line(p.x-w*.7,p.y+4*p.s,p.x+w*.65,p.y+3*p.s,'#e5d4b4',1.2*p.s);}
  }
  // Distant architecture is an atmospheric landmark, not a collidable target.
  // Compress only its decorative travel so direction is visible from departure;
  // every gameplay object continues to use the untouched world projection.
  this.use('far-environment');
  const farDepth=6+1.1*(1-Math.exp(-Math.max(0,duration-z)/12)),dest=project(0,farDepth),horizon=dest.y+14;
  this.poly([[-380,horizon+25],[-295,horizon+143],[-200,horizon+74],[-96,horizon+196],[35,horizon+112],[162,horizon+173],[255,horizon+87],[380,horizon+142],[380,1900],[-380,1900]],scene===0?'#b8c3b4':'#c2c5b5');
  this.poly([[-380,horizon+13],[-279,horizon+94],[-163,horizon+38],[-78,horizon+108],[45,horizon+62],[170,horizon+113],[278,horizon+45],[380,horizon+95],[380,1900],[-380,1900]],scene===0?'#91a497':'#a4b1a5');
  this.sprite('ridge','ridge',0,horizon+24,1.30,0,115,'#b5c1b3');
  const frame=(scene===0?'stockade':scene===1?(victory?'campOpen':'campClosed'):(victory?'cityOpen':'cityClosed')) as Art;
  this.sprite('destination',frame,0,dest.y,(scene===0?.82:scene===1?.94:1.04)*dest.s,0,210,'#cdd2bd');
  if(scene===2)for(const side of [-1,1])this.sprite('distant-tower'+side,'tower',side*225*dest.s,dest.y-5,.46*dest.s,0,190,'#b8c5b8');
  this.use('roadside');
  const sides=worldStrip(z,2.35,14);this.sceneryState=sides.map(p=>({id:p.id,worldZ:p.worldZ,y:p.y}));
  // Back-to-front within this fixed scenery pool; the entire footprint stays
  // outside x=±1.30, leaving the playable x=±1.16 corridor open.
  for(const o of [...sides].sort((a,b)=>b.worldZ-a.worldZ)){const side=o.id%2?-1:1,d=o.worldZ-z,edge=project(side*1.30,d),variant=((o.id%4)+4)%4;
   const frame=(scene===0?(variant===0?'rock':'pine'):scene===1?(variant<2?'tent':variant===2?'wood':'blueFlag'):(variant===0?'rock':'wall')) as Art;
   const base=scene===0?(variant===0?.23:.43):scene===1?(variant<2?.47:variant===2?.24:.40):(variant===0?.18:.36),scale=base*edge.s;
   const width=ART_FRAMES[frame].rect[2]*scale,x=edge.x+side*(width*.5+4*edge.s),alpha=d>5?190:235;
   this.ellipse(x,edge.y,width*.42,10*edge.s,scene===0?'#7d8d6f':'#8b8668');
   // Low foliage and field stones fill the verge; they never form extra lanes.
   for(let k=0;k<3;k++){const q=project(side*(1.29+k*.07),d-.16+k*.12);this.poly([[q.x, q.y],[q.x+side*12*edge.s,q.y+7*edge.s],[q.x+side*23*edge.s,q.y],[q.x+side*9*edge.s,q.y-4*edge.s]],scene===1?'#8f946e':'#798b68');}
   this.sprite('side'+o.slot,frame,x,edge.y,scale,0,alpha,d>5?'#c4cbb6':'#ffffff');
  }

 }

 private battleImage(id:string,key:string,x:number,y:number,h:number,options:{angle?:number;alpha?:number;tint?:string}={}){return this.battleArt.drawHeight(this.layer,id,key,x,y,h,options);}
 private texturedGate(id:string,t:Target,p:ReturnType<typeof project>,w:number,dist:number,j:Journey){
  const small=t.kind==='token',k=this.logicalScale,value=t.value===0?'0':(t.value>0?'+':'−')+Math.abs(t.value),size=small?16*k:(dist<=1.5?32:Math.max(16,32*p.s))*k,faceWidth=small?w:Math.max(w,Math.max(4,value.length)*.57*size+16*p.s),h=(small?48:132)*p.s,key=t.value<0?'gateRed':t.value===0?'gateNeutral':'gateBlue',color=t.value<0?'#bd3d32':t.value===0?'#82837e':'#2d76a1',age=j.simulationTick-t.lastHit;
  this.fix2Art.drawSlice(this.layer,id+'-face',key,p.x,p.y+h*.16,Math.max(24,faceWidth-12*p.s),h*.86);
  for(const side of [-1,1])this.battleArt.draw(this.layer,id+'-post'+side,'gatePost',p.x+side*faceWidth/2,p.y,13*p.s,h+(small?3:18)*p.s);
  if(!small&&t.value!==0)this.battleImage(id+'-symbol',t.value<0?'iconSkull':'iconHelmet',p.x,p.y+h*.86,17*p.s);
  // Every token owns a stable local value on its own crossbar. No side rail.
  this.worldLabels.add({id:id+'-value',text:value,x:p.x,y:p.y+h*.55,width:small?Math.min(w-10,64):faceWidth-12*p.s,size,color:'#fff7df',priority:12,depth:dist,anchorY:p.y,locked:true});
  this.use(id+'-details');this.line(p.x-w/2,p.y,p.x+w/2,p.y,color,3*p.s);
  if(age<5){this.line(p.x-faceWidth/2,p.y+h,p.x+faceWidth/2,p.y+h,'#f6dca3',2*p.s);}
 }
 private crateKey(t:Target){return t.reward?.kind==='equipment'?'boxEquipment':t.reward?.kind==='chain'?'boxChain':t.reward?.kind==='fieldCompanion'?'boxCompanion':'boxTroops';}
 private crateImage(id:string,key:string,x:number,y:number,width:number,options:{angle?:number;alpha?:number;tint?:string}={}){const d=BattleAssets.meta(key.replace('Open',''));if(!d)return 0;const logical=d.logicalSize||[d.rect[2],d.rect[3]];this.battleImage(id,key,x,y,width*logical[1]/d.rect[2],options);return width*d.rect[3]/d.rect[2];}
 private texturedCrate(id:string,t:Target,p:ReturnType<typeof project>,w:number,dist:number,tick:number){
  const key=this.crateKey(t),reward=t.reward!,equipment=reward.kind==='equipment',chain=reward.kind==='chain',ally=reward.kind==='fieldCompanion',hitAge=tick-t.lastHit,scale=Math.max(.75,p.s),k=this.logicalScale*scale;
  const h=this.crateImage(id,key,p.x,p.y,w,{tint:t.hp/t.maxHp<.35?'#dfcab0':'#ffffff'});this.use(id+'-details');
  const name=equipment?(reward.stage===1?'连弩':'火矢'):chain?`+1×${reward.count}`:ally?`${CAST[reward.id??'zhao_yun_guest'].name}助阵`:`+${reward.count}`;
  const width=Math.max(88*k,Math.min(110*k,Math.max(w,name.length*16*k+30*k))),height=44*k;
  this.worldLabels.add({id:id+'-info',text:name,x:p.x,y:p.y+h+height/2+6*p.s,width,size:16*k,height,scale,secondary:String(Math.ceil(t.hp)),ratio:t.hp/t.maxHp,icon:equipment?(reward.stage===1?'weaponCrossbow':'fireArrow'):chain?'chain':ally?'ally:'+reward.id:'iconHelmet',color:'#263d4b',fill:'#f1e5ca',priority:12,depth:dist,anchorY:p.y,avoid:this.actorLabelObstacles,alternatives:[{x:p.x,y:p.y-height/2-8*p.s},{x:p.x-w/2-width/2-8*p.s,y:p.y+h/2},{x:p.x+w/2+width/2+8*p.s,y:p.y+h/2}]});
  if(t.hp/t.maxHp<.5){this.line(p.x+w*.23,p.y+h*.65,p.x+w*.11,p.y+h*.45,'#3d3025',2*p.s);this.line(p.x+w*.11,p.y+h*.45,p.x+w*.20,p.y+h*.27,'#3d3025',2*p.s);}
  if(hitAge<5)this.line(p.x-w*.45,p.y+h*.28,p.x-w*.45,p.y+h*.68,'#ffe0a4',3*p.s);
 }
 /** Actual generated texture/objects. Decorative footprints stay out of combat. */
 private texturedGround(z:number,scene:number,duration:number){
  this.use('battle-textured-road');this.battleRoad.draw(this.layer,this.battleArt,z);
  this.use('battle-distant-backdrop');
  this.battleArt.draw(this.layer,'battle-distant-mountains','distantBackdrop',0,340,720,480);
  this.use('battle-distant-road');this.battleRoad.drawHorizon(this.layer,this.battleArt,z);
  // FIX2: remove decorative paired rocks/watchtowers entirely. The low-contrast
  // end-city silhouette remains background only; gameplay obstacles are separate.
  if(scene===2){this.use('battle-distant-landmark');this.battleImage('battle-destination','cityGate',0,445,132,{alpha:100,tint:'#bcbfaa'});}
  const scenery=battleScenery(z,scene);this.sceneryState=scenery.map(p=>({id:p.id,worldZ:p.worldZ,y:p.y}));
  this.use('battle-roadside');
  for(const item of scenery){
   const meta=BattleAssets.meta(item.key);if(!meta||item.worldZ-z>7.3)continue;const logical=meta.logicalSize||[meta.rect[2],meta.rect[3]],h=item.height*item.s,w=h*meta.rect[2]/logical[1]*(item.key==='tower'?.82:1),x=item.x+item.side*(w*(item.side>0?meta.anchor[0]:1-meta.anchor[0])+6*item.s),d=item.worldZ-z;
   this.ellipse(x,item.y,w*.38,7*item.s,'#7b7556');
   const object=this.battleImage('battle-side-'+item.slot,item.key,x,item.y,h,{alpha:Math.round(255*Math.min(1,Math.max(0,(7.3-d)/1.2))),tint:d>6?'#d1d0bb':'#ffffff'});if(object&&item.key==='tower')object.setScale(.82,1,1);
  }
 }

 /** Shared safe-area-aware label viewport; coordinates are Cocos design units. */
 setWorldLabelBounds(rect:SceneRect,logicalScale=720/390){this.logicalScale=logicalScale;this.labelBounds={left:rect.x-rect.w/2,right:rect.x+rect.w/2,bottom:rect.y-rect.h/2,top:rect.y+rect.h/2};}
 /** Explicit page scene owner. The supplied rectangle is centered Cocos geometry. */
 pageScene(kind:PageSceneKind,rect:SceneRect,rank:RankStage,time:number,equipped:WeaponId,companion:CastId|null=null,options:PageSceneOptions={}){
  this.begin();this.sceneOwner=kind;this.sceneRect={...rect};this.currentRank=rank;this.currentScene=options.stage??0;
  this.use(kind+'-backdrop');if(!options.externalBackdrop)this.rect(-360,-1900,720,3800,'#e3dbc7');
  const x=rect.x,foot=rect.y-rect.h*.30,h=Math.min(kind==='home'?300:210,rect.h*.76),floor=foot-12;
  if(!options.externalBackdrop)this.ellipse(x,floor,Math.min(rect.w*.43,245),Math.min(rect.h*.13,45),'#c7c4aa');
  // One quiet camp vignette, never the scrolling runner road or repeated gateways.
  if(!options.externalBackdrop&&['error','loading','chapters'].indexOf(kind)<0){
   this.sprite('page-tent','tent',x-rect.w*.28,floor+20,Math.min(.29,rect.h/1100),0,155);
   this.sprite('page-banner','blueFlag',x+rect.w*.29,floor+18,Math.min(.33,rect.h/1200),0,180);
  }
  if(!options.externalBackdrop&&(kind==='camp'||kind==='chapters'||options.map)){
   const mw=Math.min(460,rect.w*.83),mh=Math.min(160,rect.h*.45);this.rect(x-mw/2,rect.y-mh/2,mw,mh,'#d5c6a3');
   const points=[{x:x-mw*.32,y:rect.y-mh*.2},{x,y:rect.y+mh*.16},{x:x+mw*.32,y:rect.y-mh*.04}];
   for(let i=0;i<points.length;i++){const q=points[i];if(i){const a=points[i-1];this.line(a.x,a.y,q.x,q.y,'#a19570',3);}this.ellipse(q.x,q.y,8,5,'#546e68');}
   if(kind==='camp')for(const [i,name] of ['山道','粮营','白石'].entries())this.text('camp-place-'+i,name,points[i].x,points[i].y-26,21,C.ink,100);
  }
  if(kind==='transition'){
   const hitSize=Math.max(88,options.minHitSize??88);this.dropTarget={x,y:foot+Math.min(80,rect.h*.22),w:hitSize,h:hitSize};
   const tx=this.dropTarget.x,ty=this.dropTarget.y,markerScale=hitSize/88;
   // Marker and interactive rectangle share the safe-layout minimum size. Contrast is local;
   // neither the accepted foot point nor the drag anchor changes.
   this.ellipse(tx,ty,42*markerScale,28*markerScale,'#1E2F46');this.ellipse(tx,ty,35*markerScale,22*markerScale,'#286981');
   for(let i=0;i<12;i++){const a=i*Math.PI/6,b=a+Math.PI/10;this.line(tx+Math.cos(a)*42*markerScale,ty+Math.sin(a)*28*markerScale,tx+Math.cos(b)*42*markerScale,ty+Math.sin(b)*28*markerScale,'#E5C67D',3);}
   this.line(tx-9,ty,tx+9,ty,'#F4EBDC',2);this.line(tx,ty-7,tx,ty+7,'#F4EBDC',2);
   this.rect(tx-62,ty+36,124,36,'#1E2F46');this.line(tx-62,ty+36,tx+62,ty+36,'#D4B06A',2);this.text('flag-drop-label',options.settled?'已立旗':'立旗处',tx,ty+54,26,'#F4EBDC',120);
   this.flagDisplay=options.settled?this.dropTarget:options.flag??{x:x-rect.w*.26,y:foot+20};
   const scale=Math.min(.45,rect.h/800),art=ART_FRAMES.blueFlag,[rx,ry,rw,rh]=art.rect,offsetX=(rx+rw/2-art.pivot[0])*scale,offsetY=(art.pivot[1]-ry-rh/2)*scale;this.sprite('page-action-flag','blueFlag',this.flagDisplay.x,this.flagDisplay.y,scale);this.flagHit={x:this.flagDisplay.x+offsetX,y:this.flagDisplay.y+offsetY,w:Math.max(hitSize,rw*scale),h:Math.max(hitSize,rh*scale),footX:this.flagDisplay.x,footY:this.flagDisplay.y,offsetX,offsetY};
  }
  const showHero=options.hero??(['home','loadout','result'].indexOf(kind)>=0);
  if(showHero&&!options.externalHero){const hx=x+(companion?-rect.w*.16:0),id=kind+'-hero';this.hero(id,hx,foot,h,time,'idle',rank,10,undefined,equipped);this.heroDisplays.push(id);}
  if(companion&&(['loadout','meeting','result'].indexOf(kind)>=0)){
   const id=kind+'-companion',cx=x+(showHero?rect.w*.20:0);this.cast(id,companion,cx,foot,h*.88,'idle',time,true);this.companionDisplays.push(id);
  }
 }

 /** Page background has no home actor, destination or camp-map layers. */
 background(rank:RankStage=0){this.begin();this.sceneOwner='background';this.currentRank=rank;this.use('page-background');this.rect(-360,-1900,720,3800,'#d6cfb8');this.rect(-360,-1900,720,1600,'#c1c7af');}
 preparation(rank:RankStage,time:number,equipped:WeaponId,companion:CastId|null,height:number){
  this.begin();this.sceneOwner='loadout';this.heroDisplays=['preparation-hero'];this.companionDisplays=companion?['preparation-companion']:[];this.use('preparation-display');const h=Math.max(60,height),x=companion?-52:0;
  this.ellipse(0,-3,125,9,'#c5bda5');this.sprite('preparation-tent','tent',-122,5,.13,0,170);
  this.hero('preparation-hero',x,0,h,time,'idle',rank,10,undefined,equipped);
  if(companion)this.cast('preparation-companion',companion,64,0,h*.8,'idle',time,true);
 }

 render(j:Journey|null,rank:RankStage=0,finishAge=0,equipped:WeaponId='spear'){this.begin();this.sceneOwner=j?'battle':'home';this.heroDisplays=[j?'runner-hero':'home'];this.companionDisplays=j?.companionActive?['runner-companion']:[];this.currentRank=rank;this.currentScene=j?Math.max(0,Number(j.level.id.slice(-2))-1):rank===3?2:rank===2?1:0;this.ground(j?.z||0,this.currentScene,j?j.level.duration:6,j?.phase==='won'||!j&&rank>0,!!j?.runner);if(!j){this.use('hero-home');this.hero('home',0,-70,310,0,'idle',rank,10,undefined,equipped);return;}
  this.effects.advance(j.elapsed);if(j.runner){this.runnerBattle(j,rank);return;}if(j.horde)this.branchGround(j);this.use('danger-ground');
  if(j.bossDirector&&j.phase==='boss')this.hazardGround(j);
  for(const w of j.warnings){const source=w.source==='boss'?project(0,j.bossDepth):project(j.obstacles.find(o=>o.id===w.source)?.x??0,(j.obstacles.find(o=>o.id===w.source)?.at??j.z+1)-j.z),left=project(w.x-w.width,0),right=project(w.x+w.width,0);
   // Only thin, tapered shape edges; no full-road red rectangle.
   this.line(source.x,source.y,left.x,left.y,'#b87759',2);this.line(source.x,source.y,right.x,right.y,'#b87759',2);
   this.g.strokeColor=new Color(164,83,48,135);this.g.lineWidth=w.stage==='impact'?4:2;this.g.ellipse(w.x*260,-270,w.width*260,12);this.g.stroke();
   if(w.weaponId==='great_axe'){this.g.moveTo(left.x,left.y);this.g.quadraticCurveTo(w.x*260,left.y-35,right.x,right.y);this.g.stroke();}else this.poly([[w.x*260,-252],[w.x*260-6,-265],[w.x*260+6,-265]],'#ba8763');
  }
  const jobs:{y:number;id:string;draw:()=>void}[]=[];
  if(j.assault)this.assaultObjects(j,jobs);
  for(const r of j.rows){const d=r.at-j.z;if(j.usedRows.has(r.id)||d<0||d>7)continue;const p=project(0,d);jobs.push({id:'gate'+r.id,y:p.y,draw:()=>{for(const side of [-1,1]){const x=side*130*p.s,op=side<0?r.left:r.right,selected=(j.x<0?-1:1)===side;this.ellipse(x,p.y,123*p.s,8*p.s,'#a7a185');this.sprite('gate'+r.id+side,'gate',x,p.y,256*p.s/561);this.text(`g${r.id}${side}`,op.kind==='add'?`+${op.value}`:'×2',x,p.y+109*p.s,44,selected?C.cream:'#d5d3bd',230);if(selected)this.line(x-100*p.s,p.y+6,x+100*p.s,p.y+6,C.gold,5);}}});}
  for(const o of j.obstacles){
   const d=o.at-j.z;if(o.dead||o.resolved||d<-.35||d>7)continue;const p=project(o.x,d),visualId=o.poolSlot!==undefined?'enemy-slot-'+o.poolSlot:'ob'+o.id;
   const hit=this.effects.items.find(f=>(f.event.kind==='hit'||f.event.kind==='meleeHit'||f.event.kind==='waveHit')&&f.event.targetId===o.id),hurtAge=hit?j.elapsed-hit.born:1,tint=hurtAge<.09?'#fff4c8':'#ffffff';
   jobs.push({id:'obstacle-'+visualId,y:p.y,draw:()=>{
    if(o.kind==='wood'){const w=(o.rowId!==undefined?260:o.width*520)*p.s;this.ellipse(p.x,p.y,w/2,9*p.s,'#9b987c');this.sprite(visualId,'wood',p.x,p.y,w/538,hit?Math.sin(hurtAge*40)*2:0,255,tint).setScale(w/538,w/538*.48,1);}
    else if(o.kind==='rock')this.sprite(visualId,'rock',p.x,p.y,o.width*520*p.s/588);
    else{this.ellipse(p.x,p.y,24*p.s,6*p.s,'#7c8871');const warning=j.warnings.find(w=>w.source===o.id),moving=!!o.enemyKind,gait=moving?Math.sin(j.elapsed*(o.enemyKind==='runner'?17:12)+o.id*1.79):0;
     const f=hit?3:warning?.stage==='charge'?1:warning?.stage==='flight'?2:0;
     const frame=(o.kind==='crossbowman'?'crossbow'+f:hit?'enemy2':moving&&gait>0?'enemy1':'enemy0') as Art;
     this.sprite(visualId,frame,p.x,p.y+Math.abs(gait)*2*p.s,98*p.s/(o.kind==='crossbowman'?330:278),hit?-6:gait*2,255,o.enemyKind==='runner'&&hurtAge>=.09?'#e7c3a0':tint);
     if(o.enemyKind==='elite'){this.sprite(visualId+'-flag','redFlag',p.x+25*p.s,p.y+20*p.s,.10*p.s);}
    }
    // Ordinary horde soldiers have no name, HP bar or individual contact labels.
    if(!o.enemyKind){if(j.level.eliteIds&&j.level.eliteIds.indexOf(o.id)>=0)this.text('elite'+visualId,'◆ 精锐',p.x,p.y+147*p.s,22,'#896827',150);const top=o.kind==='wood'?82*p.s:o.kind==='rock'?80*p.s:118*p.s;this.text('loss'+visualId,lossLabel(o),p.x,p.y-24,23,C.red,320);if(o.kind!=='rock'){const max=o.maxHp??j.level.obstacles.find(a=>a.id===o.id)?.hp??o.hp;this.rect(p.x-43*p.s,p.y+top,86*p.s,7,'#7e7b68');this.rect(p.x-43*p.s,p.y+top,86*p.s*o.hp/max,7,C.red);}}
    else if(o.enemyKind==='crossbowman'||o.enemyKind==='elite'){const warning=j.warnings.find(w=>w.source===o.id);if(warning||o.enemyKind==='elite'){this.rect(p.x-37*p.s,p.y+103*p.s,74*p.s,23*p.s,'#19363d');this.text('special-'+visualId,o.enemyKind==='elite'?'精锐':warning?.stage==='charge'?'弩手蓄力':'弩手',p.x,p.y+115*p.s,18*p.s,'#f4ecd9',90*p.s);this.rect(p.x-32*p.s,p.y+102*p.s,64*p.s*o.hp/(o.maxHp??o.hp),3,'#de8b69');}}
    if(this.debug){const hw=(o.side?.length?.5:o.width)*260*p.s;this.line(p.x-hw,p.y,p.x+hw,p.y,'#00d5d5',2);}
   }});
  }
  if(j.phase==='boss'||j.phase==='won'||j.z>j.level.duration-4){const d=j.bossDepth+(j.phase==='run'?j.level.duration-j.z:0),p=project(0,d),width=bossFootprint(d),w=j.bossWarning;const director=j.bossDirector;const frame=j.phase==='won'?3:w?.stage==='charge'?1:w?.stage==='flight'?2:w?.stage==='impact'||j.bossClock<.5&&j.bossIndex>0?3:0;const hit=this.effects.items.some(f=>(f.event.kind==='hit'||f.event.kind==='meleeHit'||f.event.kind==='waveHit')&&f.event.targetId==='boss'&&j.elapsed-f.born<.1);jobs.push({id:'boss',y:p.y,draw:()=>{
   const contact=w?.stage==='flight'&&['axe_sweep','close_fork_thrust','step_thrust'].indexOf(w.profile??'')>=0?project(w.projectileX??w.x,(w.projectileZ??j.z)-j.z):null;this.cast('boss',j.level.bossId!,0,p.y,220*p.s,director?(director.phase==='telegraph'?'charge':director.phase==='active'?'flight':'idle'):w?.stage??'idle',j.elapsed,false,hit,contact?{x:contact.x,y:contact.y+85*contact.s}:undefined,j);if(!j.horde){const top=p.y+400*p.s;this.text('boss',j.level.bossName,0,top+34,27);this.rect(-110,top,220,10,'#8b8970');this.rect(-110,top,220*j.bossHP/j.level.bossHP,10,C.red);this.text('bosshp',`${Math.ceil(j.bossHP)} / ${j.level.bossHP}`,0,top-25,20);}
   if(this.debug){this.line(-width/2,p.y,width/2,p.y,'#00d5d5',3);for(const x of [-width/2,width/2])this.line(x,p.y,x,p.y+180,'#00d5d5',2);}}});}
  const team=formation(j.visibleCount,j.x,j.companionActive);if(j.companionActive&&team[1]){const a=actorAnchor(j.x,j.z,j.companionAttack,j.companion!),p=project(a.x,a.z-j.z);team[1].x=p.x;team[1].y=p.y;}const gather=this.effects.items.find(f=>f.event.kind==='gather'),newStart=gather?Math.max(1,Math.min(48,j.count-gather.event.amount)):48;
  if(team.length){const u=team[0];jobs.push({id:'team-hero',y:u.y,draw:()=>this.hero('battle',u.x,u.y,108,j.elapsed,j.phase==='run'?'walk':'idle',rank,j.elapsed-this.effects.lastShot,j)});}
  if(team.length>1)jobs.push({id:'team-followers',y:team[1].y,draw:()=>{for(let i=1;i<team.length;i++){const u=team[i];this.ellipse(u.x,u.y,16,4,'#7e8c77');}for(let i=1;i<team.length;i++){const u=team[i];if(u.companion){this.cast('companion',j.companion!,u.x,u.y,88,j.companionAttack?.phase??'idle',j.elapsed,true,false,undefined,j);continue;}const age=gather?j.elapsed-gather.born:1,join=i>=newStart?1-clamp(age/.36,0,1):0;this.archer('friend'+i,u.x,u.y-join*28,70,j.elapsed,3,j.elapsed-this.effects.lastShot,j.phase==='run',i,255*(1-join*.55));}}});
  // Dead foes remain briefly as presentation ghosts; they no longer collide or fire.
  for(const [i,f] of this.effects.items.filter(f=>f.event.kind==='break'&&j.elapsed-f.born<.3).slice(-16).entries()){const o=j.obstacles.find(o=>o.id===f.event.targetId);if(!o)continue;const p=project(o.x,o.at-j.z),age=(j.elapsed-f.born)/.3;jobs.push({id:'fallen-slot'+i,y:p.y,draw:()=>{if(o.kind==='fighter'||o.kind==='crossbowman')this.sprite('fallen-slot'+i,o.kind==='crossbowman'?'crossbow3':'enemy3',p.x+age*12,p.y+age*10,98*p.s/(o.kind==='crossbowman'?330:278),-age*32,255*(1-age));}});}
  jobs.sort((a,b)=>b.y-a.y||a.id.localeCompare(b.id));for(const job of jobs){this.use(job.id);job.draw();}
  if(j.assault&&j.phase==='run'){this.use('aim-anchor');this.poly([[j.x*260,-292],[j.x*260-18,-307],[j.x*260+18,-307]],'#edc979');for(let i=0;i<3;i++)this.line(j.x*260,-150+i*24,j.x*260,-141+i*24,'#b99c62',2);}
  this.use('projectiles');this.volleys.retain(j.arrows);for(const a of j.arrows){const points=this.volleys.points(a,j.z,j.phase==='boss'?j.bossDepth:undefined),previous=this.volleys.points({...a,z:a.z-.09},j.z,j.phase==='boss'?j.bossDepth:undefined);points.forEach((p,i)=>{const old=previous[i],length=Math.hypot(p.x-old.x,p.y-old.y)||1,dx=(p.x-old.x)/length,dy=(p.y-old.y)/length;this.line(p.x-dx*20,p.y-dy*20,p.x,p.y,j.assault?(j.tier===3?'#d59131':j.tier===2?'#25858e':C.ink):C.ink,j.assault&&j.tier>1?3.4:2.6);this.poly([[p.x+dx*3,p.y+dy*3],[p.x-dx*5-dy*3,p.y-dy*5+dx*3],[p.x-dx*5+dy*3,p.y-dy*5-dx*3]],C.ink);});}

  this.use('weapon-waves');for(const w of j.waves){const p=project(w.x,w.z-j.z);this.wave(w.attack.weaponId,p.x,p.y+48*p.s,w.halfWidth,p.s,false,w.attack.tier);}
  this.use('effects');if(this.effects.items.some(f=>f.event.kind==='hurt'&&j.elapsed-f.born<.16)){this.g.strokeColor=new Color(164,64,48,140);this.g.lineWidth=3;this.g.ellipse(j.x*260,-290,48,14);this.g.stroke();}for(const f of this.effects.items){const p=project(f.event.x,(f.event.worldZ??j.z)-j.z),age=(j.elapsed-f.born)/f.life;if(f.event.kind==='upgrade'){const tip=j.heroGeometry?.tip??{x:j.x*260,y:-150},q=clamp(age,0,1);this.line(p.x+(tip.x-p.x)*Math.max(0,q-.2),p.y+48+(tip.y-p.y-48)*Math.max(0,q-.2),p.x+(tip.x-p.x)*q,p.y+48+(tip.y-p.y-48)*q,'#f0ce76',5*(1-q)+1);continue;}if(f.event.kind==='gather'){this.g.strokeColor=this.color(C.gold);this.g.lineWidth=3;this.g.ellipse(j.x*260,-280,28+age*85,8+age*18);this.g.stroke();continue;}const n=f.event.kind==='break'?7:4;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,x=p.x+Math.cos(a)*age*36,y=p.y+(f.event.hitHeight??52)*p.s+Math.sin(a)*age*32-age*age*20;this.rect(x,y,5*(1-age)+1,3*(1-age)+1,f.event.kind==='hurt'?C.red:C.gold);}}
  this.use('warning-label');j.warnings.forEach((w,i)=>{const weapon=w.weaponId??'bow';if(!j.horde)this.text('warn'+w.source,`${WEAPONS[weapon].label}${w.stage==='charge'?'蓄势':w.stage==='flight'?'已出':'落点'} · 命中 −${w.loss}`,0,-522-i*31,23,C.red,540);if(w.stage==='flight'&&['axe_sweep','close_fork_thrust','step_thrust'].indexOf(w.profile??'')<0){const p=project(w.projectileX??w.x,(w.projectileZ??j.z)-j.z),q=clamp(w.remaining/w.flight,0,1);this.wave(weapon,p.x,p.y+48*p.s+q*45,w.width,p.s,true);}});


 }
 private runnerBattle(j:Journey,rank:RankStage){
  const r=j.runner!;
  if(this.visualRun!==j){this.visualRun=j;this.memberShotTicks.clear();this.memberBirthTicks.clear();this.observedTick=-1;}
  const feet=r.members;this.weaponPresentation.observe(j);
  if(j.simulationTick!==this.observedTick){
   const liveIds=new Set(feet.map(m=>m.id));
   for(const id of this.memberShotTicks.keys())if(!liveIds.has(id))this.memberShotTicks.delete(id);
   for(const id of this.memberBirthTicks.keys())if(!liveIds.has(id))this.memberBirthTicks.delete(id);
   for(const m of feet)if(!this.memberBirthTicks.has(m.id))this.memberBirthTicks.set(m.id,this.observedTick<0?-100:j.simulationTick);
   for(const shot of r.recentFires)if(liveIds.has(shot.origin.owner))this.memberShotTicks.set(shot.origin.owner,Math.max(this.memberShotTicks.get(shot.origin.owner)??-100,shot.issuedTick));
   this.observedTick=j.simulationTick;
  }
  this.actorLabelObstacles=r.members.filter(m=>m.role!=='soldier').map(m=>{const p=project(m.x,m.z-j.z),h=(m.role==='hero'?140:126)*p.s;return{x:p.x,y:p.y+h*.48,width:62*p.s,height:h*.85};});
  const jobs:{id:string;y:number;draw:()=>void}[]=[];
  for(const b of r.barriers){
   const center=(b.left+b.right)/2,span=b.front-b.back,step=1.5;
   // Segment footprint and both caps follow this frame's actual model bounds.
   for(let i=0;i<Math.ceil(span/step);i++){const back=b.back+i*step,front=Math.min(b.front,back+step),a=project(center,back-j.z),q=project(center,front-j.z);
    jobs.push({id:'runner-divider-'+b.id+'-'+i,y:a.y,draw:()=>{const h=q.y-a.y,w=((b.right-b.left)*260+8)*a.s;
     this.fix2Art.draw(this.layer,'fix2-wall-shadow-'+i,'wallShadow',a.x,a.y,w+12*a.s,h,{anchorX:.5,anchorY:0,alpha:100});
     this.fix2Art.draw(this.layer,'fix2-wall-middle-'+i,'wallMiddle',a.x,a.y,w,h+20*a.s,{anchorX:.5,anchorY:0});
     if(this.debug)this.line(a.x,a.y,q.x,q.y,'#00d9dd',(b.right-b.left)*260*a.s);
    }});
   }
   for(const end of ['Start','End'] as const){const p=project(center,(end==='Start'?b.back:b.front)-j.z);jobs.push({id:'runner-divider-cap-'+end,y:p.y+.1,draw:()=>{this.fix2Art.draw(this.layer,'fix2-wall-cap-'+end,'wall'+end,p.x,p.y,((b.right-b.left)*260+8)*p.s,46*p.s);}});}
  }
  for(const [slot,t] of r.targets.entries()){
   const dist=t.at-j.z,age=(j.simulationTick-t.resolvedTick)/60,rear=Math.min(0,...r.members.map(m=>m.z-j.z))-0.35;if(dist<rear||dist>7.8||t.resolved&&age>.22)continue;
   const p=project(t.x,dist),w=t.halfWidth*520*p.s,flash=j.simulationTick-t.lastHit<5,id='runner-object-'+slot;
   if(!t.resolved)this.targetFrames.push({id:t.id,slot,kind:t.kind,distance:dist,x:p.x,y:p.y,value:t.value,labelId:id+(t.kind==='mutableGate'||t.kind==='token'?'-value':'-info')});
   jobs.push({id,y:p.y,draw:()=>{
    if(t.resolved&&t.reward&&BattleAssets.frame(this.crateKey(t)+'Open')){this.crateImage(id+'-open',this.crateKey(t)+'Open',p.x,p.y,w,{alpha:255*(1-age/.22)});return;}
    if(t.resolved){this.g.strokeColor=new Color(213,183,107,Math.round(255*(1-age/.22)));this.g.lineWidth=3;this.g.ellipse(p.x,p.y+12,w*.55+age*60,12+age*20);this.g.stroke();return;}
    this.ellipse(p.x,p.y,w*.5,5*p.s,'#928f74');
    if(t.kind==='mutableGate'||t.kind==='token')this.texturedGate(id,t,p,w,dist,j);
    else this.texturedCrate(id,t,p,w,dist,j.simulationTick);
   }});
  }
  for(const e of r.enemies){const dist=e.at-j.z;if(dist< -3.3||dist>8)continue;const p=project(e.x,dist),hit=j.simulationTick-e.lastHit<6,attacked=r.lastContact?.enemyId===e.id&&j.simulationTick-r.lastContact.tick<12;
   jobs.push({id:'runner-enemy-'+e.slot,y:p.y,draw:()=>{
    if(e.dead&&e.castId&&BattleAssets.ready){const age=(j.simulationTick-e.lastHit)/18,prefix=e.castId==='xing_daorong'?'bossXing':e.castId==='chen_ying'?'bossChen':'bossYang';if(age<1)this.battleImage('runner-cast-'+e.slot,prefix+'Hurt',p.x,p.y,(e.large?242:145)*p.s,{angle:-age*25,alpha:255*(1-age)});return;}
    if(e.dead&&!e.castId&&BattleAssets.frame('redHurt')){const age=(j.simulationTick-e.lastHit)/18;if(age<1)this.battleImage('runner-enemy-'+e.slot,'redHurt',p.x+age*8,p.y,BATTLE_HEIGHT.enemy*p.s,{angle:-age*42,alpha:255*(1-age)});return;}
    if(e.dead){const age=(j.simulationTick-e.lastHit)/18;if(age>=1)return;this.sprite('runner-enemy-'+e.slot,'enemy3',p.x+age*8,p.y+age*5,88*p.s/278,-age*40,255*(1-age));return;}
    if(attacked){this.g.strokeColor=this.color(C.red);this.g.lineWidth=3;this.g.ellipse(p.x,p.y,20*p.s,6*p.s);this.g.stroke();}
    if(e.castId){if(BattleAssets.ready){const prefix=e.castId==='xing_daorong'?'bossXing':e.castId==='chen_ying'?'bossChen':'bossYang',acting=e.contacting||j.warnings.some(w=>w.source===e.numericId&&w.remaining<.8),step=Math.floor(j.elapsed/.32+e.numericId*.37)%2,key=prefix+(hit?'Hurt':acting?'Attack':'Walk'+step);this.ellipse(p.x,p.y,(e.large?42:25)*p.s,7*p.s,'#70664d');this.battleImage('runner-cast-'+e.slot,key,p.x,p.y,(e.large?242:145)*p.s);}else this.cast('runner-cast-'+e.slot,e.castId,p.x,p.y,(e.large?210:125)*p.s,e.contacting?'active':'idle',j.elapsed,false,hit);if(!e.large){this.worldLabels.add({id:'runner-name-'+e.slot,text:CAST[e.castId].name,x:p.x,y:p.y+148*p.s,width:100,size:25,color:C.ink,fill:'#e9dabc',priority:4,depth:dist});this.rect(p.x-44*p.s,p.y+133*p.s,88*p.s,5,'#70694f');this.rect(p.x-44*p.s,p.y+133*p.s,88*p.s*e.hp/e.maxHp,5,C.red);}}
    else if(BattleAssets.frame('redWalk0')){const step=Math.floor((j.elapsed/.32+e.numericId*.37))%2,key=hit?'redHurt':attacked||e.contacting?'redAttack':'redWalk'+step;this.ellipse(p.x,p.y,16*p.s,4*p.s,'#73684f');this.battleImage('runner-enemy-'+e.slot,key,p.x,p.y,BATTLE_HEIGHT.enemy*p.s,{tint:hit?'#fff0c9':'#ffffff'});}
    else{const gait=Math.sin(j.elapsed*11+e.numericId*1.7);this.ellipse(p.x,p.y,16*p.s,4*p.s,'#798873');this.sprite('runner-enemy-'+e.slot,hit?'enemy2':gait>0?'enemy1':'enemy0',p.x,p.y+Math.abs(gait)*p.s,78*p.s/278,hit?-5:gait*2,255,hit?'#ffe4a7':'#ffffff');}
   }});
  }
  const removed=r.lastDamage?.removedMembers??[],exitAge=r.lastDamage?(j.simulationTick-r.lastDamage.tick)/60:1;
  if(exitAge<.2)for(const [slot,m] of removed.entries()){const p=project(m.x,m.z-j.z);jobs.push({id:'runner-casualty-'+slot,y:p.y,draw:()=>{this.layer.getComponent(UIOpacity)!.opacity=Math.round(180*(1-exitAge/.2));this.ellipse(p.x,p.y,14,4,'#a65e48');if((m.role==='hero'||m.role==='companion')&&BattleAssets.ready){const prefix=m.role==='hero'?(j.weapon==='blade'?'heroBlade':'heroSpear'):j.companion==='xing_daorong'?'xing':j.companion==='chen_ying'?'pan':'zhao';this.battleImage('casualty-'+m.role,prefix+'Hurt',p.x,p.y,(m.role==='hero'?BATTLE_HEIGHT.hero:BATTLE_HEIGHT.companion)*p.s,{angle:exitAge*90});}else if(m.role==='hero')this.hero('casualty-hero',p.x,p.y,BATTLE_HEIGHT.enemy*p.s,0,'idle',rank,10,undefined,j.weapon);else if(m.role==='companion'&&j.companion)this.cast('casualty-companion',j.companion,p.x,p.y,82*p.s,'idle',0,true);else if(BattleAssets.frame('blueHurt'))this.battleImage('casualty-'+slot,'blueHurt',p.x,p.y,BATTLE_HEIGHT.soldier*p.s,{angle:exitAge*90});else this.archer('casualty-'+slot,p.x,p.y,66*p.s,0,3,10,false,slot);}});}
  for(const m of feet){const shotAge=(j.simulationTick-(this.memberShotTicks.get(m.id)??-100))/60,joinAge=(j.simulationTick-(this.memberBirthTicks.get(m.id)??-100))/60,visualSlot=(m as typeof m & {slot?:number}).slot??m.id,p=project(m.x,m.z-j.z),mout=muzzle(m),tip=project(mout.x,mout.z-j.z),hurt=!!r.lastDamage&&j.simulationTick-r.lastDamage.tick<12&&(r.lastDamage.type!=='enemyContact'||r.lastContact?.memberId===m.id);
   jobs.push({id:'runner-member-'+visualSlot,y:p.y,draw:()=>{
    this.ellipse(p.x,p.y,9*p.s,3*p.s,hurt?'#c78d66':'#778775');if(joinAge<.28){this.layer.getComponent(UIOpacity)!.opacity=Math.round(150+105*joinAge/.28);this.g.strokeColor=new Color(212,176,106,Math.round(180*(1-joinAge/.28)));this.g.lineWidth=2;this.g.ellipse(p.x,p.y,9+joinAge*36,3+joinAge*9);this.g.stroke();}
    if(m.role==='soldier'&&BattleAssets.frame('blueWalk0')){const step=j.z<j.level.duration?Math.floor(j.elapsed/.32+m.id*.37)%2:0,key=hurt?'blueHurt':shotAge<.16?'blueFire':'blueWalk'+step;this.battleImage('runner-soldier-'+visualSlot,key,p.x,p.y,BATTLE_HEIGHT.soldier*p.s);}
    else if((m.role==='hero'||m.role==='companion')&&BattleAssets.ready){
     const pose=this.weaponPresentation.pose(j,m),prefix=this.weaponPresentation.prefix(j,m),key=prefix+pose.pose,oldPrefix=m.role==='hero'?(j.weapon==='blade'?'heroBlade':'heroSpear'):j.companion==='xing_daorong'?'xing':j.companion==='chen_ying'?'pan':'zhao',step=j.z<j.level.duration?Math.floor(j.elapsed/.32+m.id*.37)%2:0,h=(m.role==='hero'?BATTLE_HEIGHT.hero:BATTLE_HEIGHT.companion)*p.s;
     if(pose.pose!=='Idle'&&BattleFix2Assets.frame(key)&&(!hurt||pose.pose==='Release'))this.fix2Art.drawHeight(this.layer,'fix2-actor-'+visualSlot,key,p.x,p.y,h);
     else this.battleImage(m.role==='hero'?'runner-hero':'runner-companion',oldPrefix+(hurt?'Hurt':'Walk'+step),p.x,p.y,h);
     const outlet={x:tip.x,y:tip.y+shotLift(m.role,m.role==='hero'?j.weapon:j.companion?CAST[j.companion].weapon:undefined)*p.s},socket=BattleFix2Assets.socket(key,'muzzle',h),artMuzzle=socket?{x:p.x+socket.x,y:p.y+socket.y}:null;this.attackFrames.push({memberId:m.id,key:hurt&&pose.pose!=='Release'?oldPrefix+'Hurt':pose.pose==='Idle'?oldPrefix+'Walk'+step:key,eventId:pose.eventId,muzzle:outlet,artMuzzle,outletError:artMuzzle?Math.hypot(artMuzzle.x-outlet.x,artMuzzle.y-outlet.y):null});
     if(pose.age<.065){this.fix2Art.drawHeight(this.layer,'fix2-release-'+visualSlot,'muzzleFlash',outlet.x,outlet.y,14*p.s,{alpha:Math.round(220*(1-pose.age/.065))});}
    }
    else if(m.role==='hero'){this.hero('runner-hero',p.x,p.y,BATTLE_HEIGHT.enemy*p.s,j.elapsed,'walk',rank,0,undefined,j.weapon);this.weaponSprite('runner-hero-weapon',j.weapon,p.x+12*p.s,p.y+35*p.s,tip.x,tip.y+mout.height*p.s,Math.hypot(tip.x-p.x-12*p.s,tip.y+mout.height*p.s-p.y-35*p.s)/WEAPON_LENGTH[j.weapon]);}
    else if(m.role==='companion'){this.cast('runner-companion',j.companion!,p.x,p.y,82*p.s,'idle',j.elapsed,true,hurt);this.weaponSprite('runner-companion-weapon',CAST[j.companion!].weapon,p.x+10*p.s,p.y+31*p.s,tip.x,tip.y+mout.height*p.s,Math.hypot(tip.x-p.x-10*p.s,tip.y+mout.height*p.s-p.y-31*p.s)/WEAPON_LENGTH[CAST[j.companion!].weapon]);}
    else this.archer('runner-soldier-'+visualSlot,p.x,p.y,66*p.s,j.elapsed,3,shotAge,j.z<j.level.duration,m.id,hurt?190:255);
    // Issued crossbows/fire-arrow fittings visibly change for every soldier.
    if(m.role==='soldier'&&r.stage&&BattleAssets.frame('weaponCrossbow')){this.battleImage('runner-equipment-'+visualSlot,r.stage===2?'fireArrow':'weaponCrossbow',p.x-8*p.s,p.y+(m.role==='soldier'?53:65)*p.s,(r.stage===2?31:27)*p.s,{angle:r.stage===2?14:-8});}
    else if(m.role==='soldier'&&r.stage){const color=r.stage===2?'#cb8131':'#388b91';this.rect(p.x-12*p.s,p.y+38*p.s,24*p.s,5*p.s,color);if(r.stage===2)this.poly([[p.x-6*p.s,p.y+49*p.s],[p.x,p.y+60*p.s],[p.x+6*p.s,p.y+49*p.s]],'#e3b759');}
    if(this.debug){this.g.strokeColor=this.color('#00aab9');this.g.lineWidth=1;this.g.ellipse(p.x,p.y,m.radius*260*p.s,m.radius*104);this.g.stroke();this.ellipse(tip.x,tip.y+shotLift(m.role,m.role==='hero'?j.weapon:j.companion?CAST[j.companion].weapon:undefined)*p.s,3,3,'#ff8c40');}
   }});
  }
  jobs.sort((a,b)=>b.y-a.y||a.id.localeCompare(b.id));for(const job of jobs){this.use(job.id);job.draw();}
  this.use('runner-shots');for(const s of r.shots){const p=project(s.x,s.z-j.z),height=shotLift(s.origin.role,s.origin.weapon),from=project(s.x,s.z-.16-j.z);
   if(s.origin.role!=='soldier'&&BattleFix2Assets.frame(this.weaponPresentation.wave(s))){
    const key=this.weaponPresentation.wave(s),h=(key==='spearWave'?38:key==='forkWave'?34:26)*p.s,sy=p.y+height*p.s;
    this.fix2Art.drawHeight(this.layer,'fix2-wave-'+(s.id%768),key,p.x,sy,h,{anchorX:.5,anchorY:1,alpha:215,tint:s.stage===2?'#ffcb7c':s.stage===1?'#c7f1ef':'#f3e1ad'});
    // The crisp point is the real swept projectile. Broad tails are translucent art, not new area damage.
    this.ellipse(p.x,sy,2.2*p.s,3*p.s,s.stage===2?'#fff0bb':'#fff6d8');
    if(s.stage===2)this.line(from.x,from.y+height*from.s,p.x,sy-5*p.s,'#d59048',1.8*p.s);
    continue;
   }
   const color=s.stage===2?'#cb7534':s.stage===1?'#267e89':'#465b59';this.line(from.x,from.y+height*from.s,p.x,p.y+height*p.s,color,s.stage===2?3.6:2.3);const sy=p.y+height*p.s;if(j.simulationTick-s.origin.tick<4&&s.origin.owner%3===0){const origin=project(s.origin.x,s.origin.z-j.z),q=(j.simulationTick-s.origin.tick)/4;this.line(origin.x-4,origin.y+height*origin.s,origin.x+4,origin.y+height*origin.s,'#e7cc86',2*(1-q));}if(s.stage===2){this.poly([[p.x,sy+7],[p.x-5,sy],[p.x,sy-9],[p.x+5,sy]],'#efb957');this.line(from.x,from.y+height*from.s-8,p.x,sy-6,'#d38a49',2);}else{this.poly([[p.x,sy+5],[p.x-3,sy-2],[p.x+3,sy-2]],color);if(s.stage===1){this.line(p.x-4,sy-5,p.x+4,sy-5,'#397d82',2);this.line(p.x-4,sy-9,p.x+4,sy-9,'#397d82',2);}}}
  for(const e of r.explosions){const p=project(e.x,e.z-j.z),age=(j.simulationTick-e.tick)/16;this.g.strokeColor=new Color(224,158,74,Math.round(255*(1-age)));this.g.lineWidth=4*(1-age)+1;this.g.ellipse(p.x,p.y+48*p.s,e.radius*104*p.s*(.4+age),e.radius*70*p.s*(.4+age));this.g.stroke();}
  this.use('runner-impact-facts');for(const f of this.effects.items.filter(f=>f.event.kind==='hit'&&j.elapsed-f.born<.13).slice(-20)){const p=project(f.event.x,(f.event.worldZ??j.z)-j.z),q=(j.elapsed-f.born)/.13;for(let k=0;k<3;k++){const angle=k*2.1+.5,dx=Math.cos(angle),dy=Math.sin(angle);this.line(p.x+dx*4,p.y+42*p.s+dy*4,p.x+dx*(7+q*15),p.y+42*p.s+dy*(7+q*12),'#e8c88a',2*(1-q)+.4);}}
  this.use('runner-hostile');for(const w of j.warnings){if(w.hit)continue;if(w.stage==='charge'){const p=project(w.x,0);this.g.strokeColor=new Color(176,89,60,150);this.g.lineWidth=2;this.g.ellipse(p.x,p.y,w.width*260,7);this.g.stroke();}else if(w.projectileZ!==undefined){const p=project(w.projectileX!,w.projectileZ-j.z);this.wave('spear',p.x,p.y+48*p.s,.05,p.s,true);}}
  const members=r.members,leader=members.find(m=>m.role==='hero'),front=leader?project(leader.x,leader.z-j.z):project(j.x,0),badgeX=clamp(front.x,-275,275),badgeY=front.y+180,badgeAlternatives=[clamp(front.x+120,-275,275),clamp(front.x-120,-275,275),-275,275].map(x=>({x,y:badgeY}));
  this.worldLabels.add({id:'runner-team-count',text:`${j.count}人`,x:badgeX,y:badgeY,width:j.count>99?130:110,size:44,color:C.cream,fill:'#1E2F46',priority:7,depth:-1,alternatives:badgeAlternatives});
  this.use('runner-contact');const damage=r.lastDamage,damageAge=damage?(j.simulationTick-damage.tick)/60:10;
  if(damage&&damageAge<.62){const point=(damage as typeof damage & {point?:{x:number;z:number}}).point,p=point?project(point.x,point.z-j.z):front;this.worldLabels.add({id:'runner-team-loss',text:`−${Math.abs(damage.value)}`,x:badgeX,y:badgeY+64+damageAge*8,width:85,size:30,color:'#fff4dc',fill:'#a94030',priority:6,depth:-2,alternatives:badgeAlternatives.map(p=>({...p,y:badgeY+64+damageAge*8}))});this.g.strokeColor=new Color(181,73,53,Math.round(180*(1-damageAge/.62)));this.g.lineWidth=3;this.g.ellipse(p.x,p.y,22+damageAge*25,7+damageAge*8);this.g.stroke();}
  const contact=r.lastContact;if(contact&&j.simulationTick-contact.tick<12){const a=project(contact.enemyX,contact.enemyZ-j.z),b=project(contact.x,contact.z-j.z);this.line(a.x,a.y+12*a.s,b.x,b.y+20*b.s,C.red,3);this.line(b.x-9,b.y+18,b.x+9,b.y+34,'#fff0ce',3);this.line(b.x+9,b.y+18,b.x-9,b.y+34,'#fff0ce',3);}
  this.use('runner-feedback');
  // Records are emitted by resolved gameplay transactions; no rewards are minted here.
  const recent=r.ledger.filter(e=>j.simulationTick-e.tick<28&&['crateBroken','reinforcement','gateGain','equipment','fieldCompanion'].indexOf(e.type)>=0).slice(-10);
  for(const [slot,e] of recent.entries()){const target=r.targets.find(t=>t.id===e.sourceId),q=(j.simulationTick-e.tick)/28,p=target?project(target.x,target.at-j.z):front;
   if(e.type==='crateBroken'){for(let k=0;k<6;k++){const a=k*Math.PI/3;if(BattleAssets.frame('woodFragment0'))this.battleImage('runner-break-'+slot+'-'+k,'woodFragment'+(k%3),p.x+Math.cos(a)*q*48,p.y+45+Math.sin(a)*q*38-q*q*22,18*(1-q)+5,{angle:q*(k%2?190:-190),alpha:255*(1-q)});else this.rect(p.x+Math.cos(a)*q*48,p.y+45+Math.sin(a)*q*38-q*q*22,7*(1-q)+2,4*(1-q)+1,k%2?'#aa814e':'#dec18a');}continue;}
   const equipment=e.type==='equipment',companion=e.type==='fieldCompanion',color=equipment?'#aa7630':companion?'#477c9d':'#267f86',tx=p.x+(front.x-p.x)*q,ty=p.y+75+(front.y+70-p.y-75)*q;
   this.ellipse(tx,ty,5*(1-q)+2,5*(1-q)+2,color);
   if(e.value>0)this.worldLabels.add({id:'runner-reward-'+slot,text:equipment?(e.value===2?'火矢':'连弩'):companion?'同袍助阵':`+${e.value}`,x:p.x,y:p.y+130+q*24,width:equipment||companion?130:75,size:29,color,fill:'#f5e6be',priority:5,depth:0});
  }
  this.use('runner-world-labels');for(const label of this.worldLabels.layout(this.labelBounds).slice().reverse()){
   if(label.secondary!==undefined){const k=this.logicalScale*(label.scale??1),h=label.height!,left=label.x-label.width/2,top=label.y+h/2;
    this.g.fillColor=this.color(label.fill!);this.g.roundRect(left,top-h,label.width,h,5*k);this.g.fill();
    const tx=label.x+9*k,ty=top-12*k;
    this.text(label.id,label.text,tx,ty,label.size,label.color,label.width-28*k);
    const ix=left+13*k;
    if(label.icon==='chain'){this.g.strokeColor=this.color('#397b83');this.g.lineWidth=2*k;for(const dx of [-3,3]){this.g.ellipse(ix+dx*k,ty,4*k,3*k);this.g.stroke();}}
    else if(label.icon?.startsWith('ally:')){const row=label.icon==='ally:xing_daorong'?0:label.icon==='ally:chen_ying'?1:3;this.rewardPortraits.drawPortrait(this.layer,label.id+'-icon',('cast'+row+'Pose0') as Art,ix,ty,19*k,20*k);}
    else this.battleImage(label.id+'-icon',label.icon!,ix,ty-7*k,16*k);
    const by=top-32*k,bw=label.width-46*k;this.rect(left+8*k,by-2*k,bw,4*k,'#aaab99');this.rect(left+8*k,by-2*k,bw*Math.max(0,Math.min(1,label.ratio!)),4*k,'#657e73');
    this.text(label.id+'-remaining',label.secondary,label.x+label.width/2-19*k,by,14*k,'#344b4d',34*k);
   }else{
    if(label.shifted&&!label.id.startsWith('runner-team-'))this.line(label.sourceX,label.sourceY,label.x,label.y,'#bca987',1.5);
    if(label.fill)this.rect(label.x-label.width/2,label.y-label.size*.65-3,label.width,label.size*1.3+6,label.fill);
    this.text(label.id,label.text,label.x,label.y,label.size,label.color,label.width);
   }
  }

 }
 private assaultObjects(j:Journey,jobs:{y:number;id:string;draw:()=>void}[]){
  for(const t of j.assault!.targets){
   const d=t.at-j.z;if(t.resolved||d<0||d>7)continue;
   const p=project(t.x,d),w=t.width*520*p.s,flash=j.simulationTick-t.lastHit<5;
   const aimed=Math.abs(j.x-t.x)<=t.width;
   jobs.push({id:'supply-'+t.id,y:p.y,draw:()=>{
    this.ellipse(p.x,p.y,w*.57,7*p.s,'#9f9b7d');
    if(t.kind==='gate'){
     const color=t.value<0?'#a34e37':'#287d86',height=(t.chain?43:96)*p.s;
     for(const sign of [-1,1]){this.rect(p.x+sign*w/2-4*p.s,p.y,8*p.s,height+16*p.s,'#735d3f');this.rect(p.x+sign*w/2-9*p.s,p.y,18*p.s,8*p.s,'#b39862');}
     this.rect(p.x-w/2,p.y+height*.34,w,height*.68,color);
     this.line(p.x-w/2-6*p.s,p.y+height+12*p.s,p.x+w/2+6*p.s,p.y+height+12*p.s,'#c5a15c',5*p.s);
     this.text('supply-value'+t.id,(t.value>=0?'+':'−')+Math.abs(t.value),p.x,p.y+height*.68,Math.max(23,(t.chain?28:42)*p.s),'#fff7df',w+12);
     if(!t.chain)this.text('supply-label'+t.id,t.value<0?'射击转正':t.value>=t.cap?'增员已满':'射击增员',p.x,p.y+height+38*p.s,Math.max(19,22*p.s),color,w+38);
    }else{
     const color=t.reward==='weapon'?'#a6772c':t.reward==='chain'?'#287d86':'#74643e',height=75*p.s;
     this.poly([[p.x-w/2,p.y+height],[p.x-w/2+14*p.s,p.y+height+15*p.s],[p.x+w/2+14*p.s,p.y+height+15*p.s],[p.x+w/2,p.y+height]],'#ccb582');
     this.rect(p.x-w/2,p.y,w,height,flash?'#f4dc99':'#aa814a');
     this.poly([[p.x+w/2,p.y],[p.x+w/2+14*p.s,p.y+15*p.s],[p.x+w/2+14*p.s,p.y+height+15*p.s],[p.x+w/2,p.y+height]],'#795b36');
     for(const sign of [-1,1])this.rect(p.x+sign*w*.34-3*p.s,p.y,6*p.s,height,'#524f3d');
     this.rect(p.x-w*.4,p.y+height*.2,w*.8,height*.57,color);
     this.text('supply-hp'+t.id,String(Math.ceil(t.hp)),p.x,p.y+height*.52,Math.max(24,35*p.s),'#fff7df',w);
     this.text('supply-label'+t.id,t.reward==='troops'?`援军 +${t.amount}`:t.reward==='chain'?`连营 ×${t.amount}`:`弩阵 ${t.amount}阶`,p.x,p.y+height+40*p.s,Math.max(20,25*p.s),color,w+65);
     this.rect(p.x-w/2,p.y-9*p.s,w,5*p.s,'#7b755e');this.rect(p.x-w/2,p.y-9*p.s,w*t.hp/t.maxHp,5*p.s,'#d4ad62');
    }
    if(aimed){this.line(p.x-w/2,p.y-17*p.s,p.x+w/2,p.y-17*p.s,'#e3b24e',4*p.s);}
   }});
  }

 }
 /** Road choice changes scenery only; the actual team and touch mapping never move. */
 private branchGround(j:Journey){
  const h=j.horde!;const fork=h.config.forks.find(f=>j.z>=f.previewAt&&j.z<f.endAt+.4);if(!fork)return;
  const choice=h.choices.find(c=>c.forkId===fork.id),age=choice?(j.simulationTick-choice.committedTick)/24:0,blend=clamp(age,0,1),d=clamp(fork.commitAt-j.z,.5,5);
  this.use('branch-road');
  for(const side of [-1,1]){const chosen=!choice||(choice.side==='left'?-1:1)===side;if(!chosen&&blend>=1)continue;const alpha=chosen?110:Math.round(110*(1-blend)),a=project(side*.12,d-.7),b=project(side*(choice&&chosen?.86:.65),d+2.6);
   this.g.strokeColor=new Color(chosen?74:125,chosen?109:107,chosen?99:84,alpha);this.g.lineWidth=chosen?5:3;this.g.moveTo(a.x,a.y);this.g.quadraticCurveTo(side*130,a.y+100,b.x,b.y);this.g.stroke();
   if(!choice){const p=project(side*.65,d+.55);this.sprite('route-flag'+side,(fork.safeSide===(side<0?'left':'right')?'blueFlag':'redFlag') as Art,p.x,p.y,.15*p.s);}
  }
 }
 private hazardGround(j:Journey){
  const d=j.bossDirector!;const toScreen=(p:{x:number;z:number})=>project(p.x/2.5,p.z-j.z);
  for(const shape of d.warningShapes){const pts=hazardOutline(shape).map(toScreen);if(!pts.length)continue;this.g.strokeColor=new Color(163,78,55,d.phase==='telegraph'?155:55);this.g.lineWidth=2;this.g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))this.g.lineTo(p.x,p.y);this.g.close();this.g.stroke();}
  for(const shape of d.activeShapes){const pts=hazardOutline(shape).map(toScreen);if(!pts.length)continue;this.g.fillColor=new Color(181,91,51,72);this.g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))this.g.lineTo(p.x,p.y);this.g.close();this.g.fill();this.g.strokeColor=new Color(247,190,110,240);this.g.lineWidth=3;this.g.stroke();
   if(shape.kind==='capsule'){const a=toScreen(shape.a),b=toScreen(shape.b);if(d.attackId==='earth_split'){const dx=b.x-a.x,dy=b.y-a.y;this.line(a.x,a.y,a.x+dx*.33+5,a.y+dy*.33,'#794c38',2);this.line(a.x+dx*.33+5,a.y+dy*.33,b.x,b.y,'#ffe0a0',3);}else if(d.attackId&&(d.attackId.indexOf('fork')>=0||d.attackId==='spear_wave')){
    const dx=b.x-a.x,dy=(b.y+d.weaponLift*b.s)-(a.y+d.weaponLift*a.s),length=Math.max(.001,Math.hypot(dx,dy)),ux=dx/length,uy=dy/length,tx=b.x,ty=b.y+d.weaponLift*b.s;
    const point=(back:number,side:number)=>[tx-ux*back*b.s-uy*side*b.s,ty-uy*back*b.s+ux*side*b.s];
    if(d.attackId.indexOf('fork')>=0){const tail=point(52,0);this.line(tail[0],tail[1],tx,ty,'#794c38',4*b.s);for(const side of [-9,0,9]){const tip=point(side===0?0:7,side),base=point(24,side*.7);this.line(base[0],base[1],tip[0],tip[1],'#fff1bd',3*b.s);}}
    else this.poly([point(0,0),point(24,6),point(65,0),point(24,-6)],'#fff1bd');
   }}
  }
 }
 preview(p:Preview){this.begin();this.ground(p.pose==='walk'||p.pose==='shoot'?p.time:0);this.use('preview-main');this.hero('preview-large',0,30,250,p.time,p.pose,p.rank?1:0);const units=formation(p.count,p.x);this.use('preview-team');for(const u of units)this.ellipse(u.x,u.y,u.hero?23:16,4,'#7e8c77');for(let i=0;i<units.length;i++){const u=units[i];if(u.hero)this.hero('fixture0',u.x,u.y,108,p.time,p.pose,p.rank?1:0);else{const f=p.pose==='shoot'?3:p.pose==='walk'?1+Math.floor((p.time+i*.047)/.22)%2:0;this.sprite('fixture'+i,('ally'+f) as Art,u.x,u.y,70/272);}if(p.debug)this.line(u.x-23,u.y,u.x+23,u.y,'#00d5d5',1);}this.use('fixture-caption');this.text('fixture-caption',`排布测试 ${p.count} 人 · 显示 ${units.length}（含主角）`,0,-565,21);}
 portrait(rank:RankStage,time=1.5,level=0,equipped:WeaponId='spear'){this.begin();this.sceneOwner='result';this.heroDisplays=['victory-hero'];this.use('portrait');if(level>0)this.sprite('victory-place',level===2?'cityOpen':'campOpen',0,5,.58,0,140);this.sprite('victory-flag','blueFlag',-145,Math.min(time/.7,1)*30-45,.42);this.hero('victory-hero',0,-55,170,time,'idle',rank,10,undefined,equipped);}
 camp(stage:number,settled:boolean,time:number,flag?:{x:number;y:number},meeting=false,equipped:WeaponId='spear'){
  this.begin();this.currentScene=stage;this.ground([42,54,66][stage],stage,[42,54,66][stage],true);
  this.use('camp-scene');if(meeting){this.sprite('zhaoyun','zhaoyun',0,-305,.35);return;}if(stage===1){this.sprite('secured-gate','campOpen',0,-110,.45);this.line(0,-170,0,30,'#756044',5);}if(stage===2)this.sprite('secured-city','cityOpen',0,-100,.4);this.ellipse(0,-235,190,85,'#c1b78e');
  if(stage===1){this.sprite('camp-tent','tent',-225,-110,.38);this.sprite('camp-rack','wood',200,-115,.26);}
  if(stage===2){this.rect(-245,-260,490,260,'#c7b58a');for(const [i,name] of ['曹操','刘备','孙权'].entries()){const x=-170+i*170;this.line(0,-220,x,-30,'#8f8e6d',5);this.text('map'+i,name,x,-10,23);this.sprite('direction'+i,i===1?'blueFlag':'redFlag',x,-50,.12,0,150);}this.text('baishi','白石',0,-265,25);}
  else {this.line(-100,-180,100,-180,'#a18f60',5);this.text('target','立旗处',0,-205,25);}
  const count=stage===0?12:16;
  for(let i=0;i<count;i++){const row=Math.floor(i/8),col=i%8,q=settled?1:Math.min(1,time*.8),x=(col-3.5)*45+(1-q)*(i%2?55:-55),y=-365-row*45;
   this.archer('camp-soldier'+i,x,y,64,time,3,10,!settled&&time<1.2,i);}
  this.hero('camp-hero',-200,-240,108,time,'idle',Math.min(stage+1,2) as RankStage,10,undefined,equipped);
  if(settled)this.sprite('camp-flag','blueFlag',0,-155,.55);else this.sprite('camp-flag','blueFlag',flag?.x??-215,flag?.y??-105,.44);
  if(settled&&stage===1){this.ellipse(160,-285,27,10,'#a75b36');this.poly([[142,-283],[162,-238],[178,-283]],'#d99c46');}
  if(meeting)this.sprite('zhaoyun','zhaoyun' as Art,0,-340,.36);
 }
 clear(){this.effects.clear();this.volleys.clear();this.visualRun=null;this.memberShotTicks.clear();this.memberBirthTicks.clear();this.observedTick=-1;this.weaponPresentation.clear();this.fix2Art.hide();}
 get poolSize(){return this.labels.size+this.layers.size+this.art.size+this.battleArt.size+this.fix2Art.size+this.rewardPortraits.diagnostics.nodes;}
 get diagnostics(){return {sceneOwner:this.root.activeInHierarchy?this.sceneOwner:'inactive',activeHeroDisplayIds:this.root.activeInHierarchy?this.heroDisplays:[],activeCompanionIds:this.root.activeInHierarchy?this.companionDisplays:[],actorBounds:this.art.bounds.concat(this.battleArt.bounds).filter(b=>this.heroDisplays.concat(this.companionDisplays).some(id=>b.id.startsWith(id))),contentRect:this.sceneRect,draggableFlag:this.flagHit,dropTarget:this.dropTarget,worldLabels:this.worldLabels.placed,hiddenWorldLabels:this.worldLabels.hidden,dynamicFacts:{runTracked:!!this.visualRun,shotOwners:this.memberShotTicks.size,rosterTracked:this.memberBirthTicks.size,tick:this.observedTick,projection:'unchanged-world-feet'},battleAssets:BattleAssets.diagnostics,fix2Assets:BattleFix2Assets.diagnostics,weaponPresentation:this.weaponPresentation.diagnostics,attackFrames:this.attackFrames,targetFrames:this.targetFrames.map(t=>({...t,readable:this.worldLabels.placed.some(l=>l.id===t.labelId)})),topDecorationPolicy:'paired foreground instances removed at source; low-contrast final-city silhouette only',battleRoad:this.battleRoad.diagnostics,battleSpritePool:this.battleArt.size,weaponShapes:true,spear:this.spearState,volleyCapacity:VOLLEY_CAPACITY,volleyGroups:this.volleys.groups.length,visualArrows:this.volleys.groups.reduce((n,g)=>n+g.origins.length,0),volleys:this.volleys.groups,scenery:this.sceneryState,effects:this.effects.items.length,peakEffects:this.effects.peak,rigs:0,scene:this.currentScene,rank:this.currentRank,sprites:this.art.size,ready:ArtSprites.ready,depthOrder:Array.from(this.layers.values()).filter(n=>n.active).sort((a,b)=>a.getSiblingIndex()-b.getSiblingIndex()).map(n=>n.name),bounds:this.art.bounds.concat(this.battleArt.bounds,this.fix2Art.bounds)};}
}
