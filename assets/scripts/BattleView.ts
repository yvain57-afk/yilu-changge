import {HAND_SOCKETS} from './core/artSockets';
import {poseGeometry,rigidWeapon,WEAPON_LENGTH,nearGeometry,frameBlend,actorAnchor} from './core/combatGeometry';
import {WEAPONS,CAST,WeaponId,CastId,AttackInstance,TIER_WIDTHS} from './core/weapons';
import {V05_SOCKETS} from './ArtAtlasV05';
import { Node, Graphics, Color, Label, UITransform, Layers } from 'cc';
import { Journey, BOSS_TARGET, MELEE, clamp } from './core/model';
import { project, formation } from './VisualConfig';
import { lossLabel, bossFootprint, Effects } from './Presentation';
import { Pose } from './HeroRig';
import { ArtSprites, Art, ART_FRAMES } from './ArtSprites';
import { RankStage } from './core/progression';
import { Volleys, VOLLEY_CAPACITY } from './Volley';
import { worldStrip, gaitFrame, shootFrame } from './WorldScenery';
const C={ink:'#263c43',cream:'#f8edcf',red:'#a34e37',gold:'#c5a15c',road:'#deceb0',grass:'#899c88'};
export type Preview={count:number;x:number;time:number;pose:Pose;rank:boolean;debug:boolean};
/** Shared atlas sprites and bounded effects. Simulation facts remain read-only. */
export class BattleView {
 private g!:Graphics;private layer!:Node;private order=0;private labels=new Map<string,Node>();private layers=new Map<string,Node>();private spearState:any=null;private currentScene=0;private currentRank:RankStage=0;private art=new ArtSprites();
 readonly effects=new Effects();readonly volleys=new Volleys();debug=false;private sceneryState:{id:number;worldZ:number;y:number}[]=[];
 constructor(private root:Node){}
 private use(id:string){let n=this.layers.get(id);if(!n){n=new Node(id);n.layer=Layers.Enum.UI_2D;this.root.addChild(n);n.addComponent(UITransform);n.addComponent(Graphics);this.layers.set(id,n);}n.active=true;n.setSiblingIndex(this.order++);this.layer=n;this.g=n.getComponent(Graphics)!;this.g.clear();return n;}
 private begin(){this.order=0;for(const n of this.layers.values())n.active=false;for(const n of this.labels.values())n.active=false;this.art.begin();}
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
  if(CAST[castId].weapon==='throwing_fork'&&phase==='flight'&&!ally&&!contactTip){/* fork is in the traveling attack, hand now empty */}else this.weaponSprite(id+'-weapon',CAST[castId].weapon,gx,gy,tx,ty,height/140);
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


 private ground(z:number,scene=0,duration=54,victory=false){
  this.use('ground');this.rect(-360,-1900,720,3800,scene===1?'#a89b7c':scene===2?'#889c95':C.grass);
  this.rect(-360,530,720,1000,'#c7d5c5');
  // Every ground point uses the same world-distance projection as obstacles.
  const strip=worldStrip(z);for(const tile of strip){const d=tile.worldZ-z,a=project(-1.25,d),b=project(1.25,d),c=project(1.25,d+1.25),e=project(-1.25,d+1.25);
   this.poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[e.x,e.y]],tile.id%2?'#deceb0':'#dac9aa');
   this.line(a.x,a.y,e.x,e.y,'#acb18f',5);this.line(b.x,b.y,c.x,c.y,'#acb18f',5);
   for(const x of [-.72,-.25,.3,.78]){const p=project(x,d+.18),q=project(x+.07,d+.54);this.line(p.x,p.y,q.x,q.y,'#cebb98',2);}
  }
  if(scene===0)this.sprite('ridge','ridge',0,520-z*.12,1.25);
  const dest=project(0,duration+6-z),frame=(scene===0?'stockade':scene===1?(victory?'campOpen':'campClosed'):(victory?'cityOpen':'cityClosed')) as Art;
  if(dest.y<920)this.sprite('destination',frame,0,dest.y,(scene===0?.6:scene===1?1.1:1.3)*dest.s);
  const sides=worldStrip(z,2.4,12);this.sceneryState=sides.map(p=>({id:p.id,worldZ:p.worldZ,y:p.y}));
  for(const o of sides){const side=o.id%2?-1:1,p=project(side*1.55,o.worldZ-z),variant=((o.id%3)+3)%3;
   this.ellipse(p.x,p.y,28*p.s,7*p.s,'#798e77');
   if(scene===0)this.sprite('side'+o.slot,'pine',p.x,p.y,.27*p.s);
   else if(scene===1)this.sprite('side'+o.slot,variant===0?'tent':'wall',p.x,p.y,(variant===0?.30:.25)*p.s);
   else {this.sprite('side'+o.slot,'wall',p.x,p.y,.24*p.s);this.line(p.x-15*p.s,p.y,p.x-20*p.s,p.y+15*p.s,'#637e68',3);}
  }
  // Only two city towers at fixed world locations; never a repeating conveyor.
  if(scene===2)for(const side of [-1,1]){const p=project(side*1.65,duration+3-z);if(p.y<920)this.sprite('tower'+side,'tower',p.x,p.y,.42*p.s);}
 }

 render(j:Journey|null,rank:RankStage=0,finishAge=0,equipped:WeaponId='spear'){this.begin();this.currentRank=rank;this.currentScene=j?Math.max(0,Number(j.level.id.slice(-2))-1):rank===3?2:rank===2?1:0;this.ground(j?.z||0,this.currentScene,j?j.level.duration:6,j?.phase==='won'||!j&&rank>0);if(!j){this.use('hero-home');this.hero('home',0,-65,180,0,'idle',rank,10,undefined,equipped);return;}
  this.effects.advance(j.elapsed);this.use('danger-ground');
  for(const w of j.warnings){const source=w.source==='boss'?project(0,j.bossDepth):project(j.obstacles.find(o=>o.id===w.source)?.x??0,(j.obstacles.find(o=>o.id===w.source)?.at??j.z+1)-j.z),left=project(w.x-w.width,0),right=project(w.x+w.width,0);
   // Only thin, tapered shape edges; no full-road red rectangle.
   this.line(source.x,source.y,left.x,left.y,'#b87759',2);this.line(source.x,source.y,right.x,right.y,'#b87759',2);
   this.g.strokeColor=new Color(164,83,48,135);this.g.lineWidth=w.stage==='impact'?4:2;this.g.ellipse(w.x*260,-270,w.width*260,12);this.g.stroke();
   if(w.weaponId==='great_axe'){this.g.moveTo(left.x,left.y);this.g.quadraticCurveTo(w.x*260,left.y-35,right.x,right.y);this.g.stroke();}else this.poly([[w.x*260,-252],[w.x*260-6,-265],[w.x*260+6,-265]],'#ba8763');
  }
  const jobs:{y:number;id:string;draw:()=>void}[]=[];
  for(const r of j.level.rows){const d=r.at-j.z;if(j.usedRows.has(r.id)||d<0||d>7)continue;const p=project(0,d);jobs.push({id:'gate'+r.id,y:p.y,draw:()=>{for(const side of [-1,1]){const x=side*130*p.s,op=side<0?r.left:r.right,selected=(j.x<0?-1:1)===side;this.ellipse(x,p.y,123*p.s,8*p.s,'#a7a185');this.sprite('gate'+r.id+side,'gate',x,p.y,256*p.s/561);this.text(`g${r.id}${side}`,op.kind==='add'?`+${op.value}`:'×2',x,p.y+109*p.s,44,selected?C.cream:'#d5d3bd',230);if(selected)this.line(x-100*p.s,p.y+6,x+100*p.s,p.y+6,C.gold,5);}}});}
  for(const o of j.obstacles){const d=o.at-j.z;if(o.dead||o.resolved||d<0||d>7)continue;const p=project(o.x,d),hit=this.effects.items.find(f=>(f.event.kind==='hit'||f.event.kind==='meleeHit'||f.event.kind==='waveHit')&&f.event.targetId===o.id),hurtAge=hit?j.elapsed-hit.born:1;const tint=hurtAge<.09?'#ffe1a4':'#ffffff';jobs.push({id:'obstacle'+o.id,y:p.y,draw:()=>{if(o.kind==='wood'){const w=(o.rowId!==undefined?260:o.width*520)*p.s;this.ellipse(p.x,p.y,w/2,9*p.s,'#9b987c');this.sprite('ob'+o.id,'wood',p.x,p.y,w/538,hit?Math.sin(hurtAge*40)*2:0,255,tint).setScale(w/538,w/538*.48,1);}else if(o.kind==='rock'){this.sprite('ob'+o.id,'rock',p.x,p.y,o.width*520*p.s/588);}else{this.ellipse(p.x,p.y,28*p.s,8*p.s,'#7c8871');const w=j.warnings.find(w=>w.source===o.id),f=hit?3:w?.stage==='charge'?1:w?.stage==='flight'?2:0;this.sprite('ob'+o.id,(o.kind==='crossbowman'?'crossbow'+f:hit?'enemy2':'enemy0') as Art,p.x,p.y,98*p.s/(o.kind==='crossbowman'?330:278),hit?-6:0,255,tint);}
   if(j.level.eliteIds?.indexOf(o.id)!==-1&&j.level.eliteIds){this.text('elite'+o.id,'◆ 精锐',p.x,p.y+147*p.s,22,'#896827',150);}
   const top=o.kind==='wood'?82*p.s:o.kind==='rock'?80*p.s:118*p.s;this.text('loss'+o.id,lossLabel(o),p.x,p.y-24,23,C.red,320);if(o.kind!=='rock'){const max=j.level.obstacles.find(a=>a.id===o.id)!.hp;this.rect(p.x-43*p.s,p.y+top,86*p.s,7,'#7e7b68');this.rect(p.x-43*p.s,p.y+top,86*p.s*o.hp/max,7,C.red);}if(this.debug){const hw=(o.side ? .5 : o.width)*260*p.s;this.line(p.x-hw,p.y,p.x+hw,p.y,'#00d5d5',3);}}});}
  if(j.phase==='boss'||j.phase==='won'||j.z>j.level.duration-4){const d=j.bossDepth+(j.phase==='run'?j.level.duration-j.z:0),p=project(0,d),width=bossFootprint(d),w=j.bossWarning;const frame=j.phase==='won'?3:w?.stage==='charge'?1:w?.stage==='flight'?2:w?.stage==='impact'||j.bossClock<.5&&j.bossIndex>0?3:0;const hit=this.effects.items.some(f=>(f.event.kind==='hit'||f.event.kind==='meleeHit'||f.event.kind==='waveHit')&&f.event.targetId==='boss'&&j.elapsed-f.born<.1);jobs.push({id:'boss',y:p.y,draw:()=>{
   const contact=w?.stage==='flight'&&['axe_sweep','close_fork_thrust','step_thrust'].indexOf(w.profile??'')>=0?project(w.projectileX??w.x,(w.projectileZ??j.z)-j.z):null;this.cast('boss',j.level.bossId!,0,p.y,220*p.s,w?.stage??'idle',j.elapsed,false,hit,contact?{x:contact.x,y:contact.y+85*contact.s}:undefined);const top=p.y+400*p.s;this.text('boss',j.level.bossName,0,top+34,27);this.rect(-110,top,220,10,'#8b8970');this.rect(-110,top,220*j.bossHP/j.level.bossHP,10,C.red);this.text('bosshp',`${Math.ceil(j.bossHP)} / ${j.level.bossHP}`,0,top-25,20);
   if(this.debug){this.line(-width/2,p.y,width/2,p.y,'#00d5d5',3);for(const x of [-width/2,width/2])this.line(x,p.y,x,p.y+180,'#00d5d5',2);}}});}
  const team=formation(j.visibleCount,j.x,j.companionActive);if(j.companionActive&&team[1]){const a=actorAnchor(j.x,j.z,j.companionAttack,j.companion!),p=project(a.x,a.z-j.z);team[1].x=p.x;team[1].y=p.y;}const gather=this.effects.items.find(f=>f.event.kind==='gather'),newStart=gather?Math.max(1,Math.min(48,j.count-gather.event.amount)):48;
  if(team.length){const u=team[0];jobs.push({id:'team-hero',y:u.y,draw:()=>this.hero('battle',u.x,u.y,108,j.elapsed,j.phase==='run'?'walk':'idle',rank,j.elapsed-this.effects.lastShot,j)});}
  if(team.length>1)jobs.push({id:'team-followers',y:team[1].y,draw:()=>{for(let i=1;i<team.length;i++){const u=team[i];this.ellipse(u.x,u.y,16,4,'#7e8c77');}for(let i=1;i<team.length;i++){const u=team[i];if(u.companion){this.cast('companion',j.companion!,u.x,u.y,88,j.companionAttack?.phase??'idle',j.elapsed,true,false,undefined,j);continue;}const age=gather?j.elapsed-gather.born:1,join=i>=newStart?1-clamp(age/.36,0,1):0;this.archer('friend'+i,u.x,u.y-join*28,70,j.elapsed,3,j.elapsed-this.effects.lastShot,j.phase==='run',i,255*(1-join*.55));}}});
  // Dead foes remain briefly as presentation ghosts; they no longer collide or fire.
  for(const f of this.effects.items.filter(f=>f.event.kind==='break')){const o=j.obstacles.find(o=>o.id===f.event.targetId);if(!o)continue;const p=project(o.x,o.at-j.z),age=(j.elapsed-f.born)/f.life;jobs.push({id:'fallen'+o.id,y:p.y,draw:()=>{if(o.kind==='fighter'||o.kind==='crossbowman')this.sprite('fallen'+o.id,o.kind==='crossbowman'?'crossbow3':'enemy3',p.x+age*20,p.y+age*20,98*p.s/(o.kind==='crossbowman'?330:278),-age*32,255*(1-age));}});}
  jobs.sort((a,b)=>b.y-a.y||a.id.localeCompare(b.id));for(const job of jobs){this.use(job.id);job.draw();}
  this.use('projectiles');this.volleys.retain(j.arrows);for(const a of j.arrows){const points=this.volleys.points(a,j.z,j.phase==='boss'?j.bossDepth:undefined),previous=this.volleys.points({...a,z:a.z-.09},j.z,j.phase==='boss'?j.bossDepth:undefined);points.forEach((p,i)=>{const old=previous[i],length=Math.hypot(p.x-old.x,p.y-old.y)||1,dx=(p.x-old.x)/length,dy=(p.y-old.y)/length;this.line(p.x-dx*20,p.y-dy*20,p.x,p.y,C.ink,2.6);this.poly([[p.x+dx*3,p.y+dy*3],[p.x-dx*5-dy*3,p.y-dy*5+dx*3],[p.x-dx*5+dy*3,p.y-dy*5-dx*3]],C.ink);});}

  this.use('weapon-waves');for(const w of j.waves){const p=project(w.x,w.z-j.z);this.wave(w.attack.weaponId,p.x,p.y+48*p.s,w.halfWidth,p.s,false,w.attack.tier);}
  this.use('effects');for(const f of this.effects.items){const p=project(f.event.x,(f.event.worldZ??j.z)-j.z),age=(j.elapsed-f.born)/f.life;if(f.event.kind==='upgrade'){const tip=j.heroGeometry?.tip??{x:j.x*260,y:-150},q=clamp(age,0,1);this.line(p.x+(tip.x-p.x)*Math.max(0,q-.2),p.y+48+(tip.y-p.y-48)*Math.max(0,q-.2),p.x+(tip.x-p.x)*q,p.y+48+(tip.y-p.y-48)*q,'#f0ce76',5*(1-q)+1);continue;}if(f.event.kind==='gather'){this.g.strokeColor=this.color(C.gold);this.g.lineWidth=3;this.g.ellipse(j.x*260,-280,28+age*85,8+age*18);this.g.stroke();continue;}const n=f.event.kind==='break'?7:4;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,x=p.x+Math.cos(a)*age*36,y=p.y+(f.event.hitHeight??52)*p.s+Math.sin(a)*age*32-age*age*20;this.rect(x,y,5*(1-age)+1,3*(1-age)+1,f.event.kind==='hurt'?C.red:C.gold);}}
  this.use('warning-label');j.warnings.forEach((w,i)=>{const weapon=w.weaponId??'bow';this.text('warn'+w.source,`${WEAPONS[weapon].label}${w.stage==='charge'?'蓄势':w.stage==='flight'?'已出':'落点'} · 命中 −${w.loss}`,0,-522-i*31,23,C.red,540);if(w.stage==='flight'&&['axe_sweep','close_fork_thrust','step_thrust'].indexOf(w.profile??'')<0){const p=project(w.projectileX??w.x,(w.projectileZ??j.z)-j.z),q=clamp(w.remaining/w.flight,0,1);this.wave(weapon,p.x,p.y+48*p.s+q*45,w.width,p.s,true);}});


 }
 preview(p:Preview){this.begin();this.ground(p.pose==='walk'||p.pose==='shoot'?p.time:0);this.use('preview-main');this.hero('preview-large',0,30,250,p.time,p.pose,p.rank?1:0);const units=formation(p.count,p.x);this.use('preview-team');for(const u of units)this.ellipse(u.x,u.y,u.hero?23:16,4,'#7e8c77');for(let i=0;i<units.length;i++){const u=units[i];if(u.hero)this.hero('fixture0',u.x,u.y,108,p.time,p.pose,p.rank?1:0);else{const f=p.pose==='shoot'?3:p.pose==='walk'?1+Math.floor((p.time+i*.047)/.22)%2:0;this.sprite('fixture'+i,('ally'+f) as Art,u.x,u.y,70/272);}if(p.debug)this.line(u.x-23,u.y,u.x+23,u.y,'#00d5d5',1);}this.use('fixture-caption');this.text('fixture-caption',`排布测试 ${p.count} 人 · 显示 ${units.length}（含主角）`,0,-565,21);}
 portrait(rank:RankStage,time=1.5,level=0,equipped:WeaponId='spear'){this.begin();this.use('portrait');if(level>0)this.sprite('victory-place',level===2?'cityOpen':'campOpen',0,5,.58,0,140);this.sprite('victory-flag','blueFlag',-145,Math.min(time/.7,1)*30-45,.42);this.hero('victory-hero',0,-55,170,time,'idle',rank,10,undefined,equipped);}
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
 clear(){this.effects.clear();this.volleys.clear();}
 get poolSize(){return this.labels.size+this.layers.size+this.art.size;}
 get diagnostics(){return {weaponShapes:true,spear:this.spearState,volleyCapacity:VOLLEY_CAPACITY,volleyGroups:this.volleys.groups.length,visualArrows:this.volleys.groups.reduce((n,g)=>n+g.origins.length,0),volleys:this.volleys.groups,scenery:this.sceneryState,effects:this.effects.items.length,peakEffects:this.effects.peak,rigs:0,scene:this.currentScene,rank:this.currentRank,sprites:this.art.size,ready:ArtSprites.ready,depthOrder:Array.from(this.layers.values()).filter(n=>n.active).sort((a,b)=>a.getSiblingIndex()-b.getSiblingIndex()).map(n=>n.name),bounds:this.art.bounds};}
}
