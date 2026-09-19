import { Node, Graphics, Color, Label, UITransform, Layers } from 'cc';
import { Journey, clamp } from './core/model';
import { project, formation } from './VisualConfig';
const C={ink:'#203b43',blue:'#3c6573',cream:'#f3ead5',red:'#a84835',gold:'#c89349',road:'#d8c8a6',grass:'#a4ad91'};
/** Explicit temporary component-built art for S1, not approved production artwork. */
export class BattleView {
 private g:Graphics; private labels=new Map<string,Node>();
 constructor(private root:Node){this.g=root.addComponent(Graphics);}
 private color(c:string){return new Color().fromHEX(c);}
 private rect(x:number,y:number,w:number,h:number,c:string){this.g.fillColor=this.color(c);this.g.rect(x,y,w,h);this.g.fill();}
 private ellipse(x:number,y:number,w:number,h:number,c:string){this.g.fillColor=this.color(c);this.g.ellipse(x,y,w,h);this.g.fill();}
 private line(x:number,y:number,x2:number,y2:number,c:string,w=3){this.g.strokeColor=this.color(c);this.g.lineWidth=w;this.g.moveTo(x,y);this.g.lineTo(x2,y2);this.g.stroke();}
 private text(id:string,t:string,x:number,y:number,size=24,color=C.ink,w=300){let n=this.labels.get(id);if(!n){n=new Node(id);n.layer=Layers.Enum.UI_2D;this.root.addChild(n);n.addComponent(UITransform).setContentSize(w,65);const l=n.addComponent(Label);l.fontSize=size;l.lineHeight=size*1.3;l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;l.overflow=Label.Overflow.SHRINK;this.labels.set(id,n);}n.active=true;n.setPosition(x,y);const l=n.getComponent(Label)!;l.string=t;l.color=this.color(color);return n;}
 private actor(x:number,y:number,w:number,h:number,role:'hero'|'friend'|'enemy'|'boss',time:number,rank=false,charge=false){
  const g=this.g,blue=role==='hero'||role==='friend',body=blue?C.blue:C.red;
  this.ellipse(x,y,w*.43,h*.08,'#6b705c');
  const stride=Math.sin(time*9+x)*h*.035;
  this.line(x-w*.13,y+h*.28,x-w*.2,y+5+stride,C.ink,w*.16);this.line(x+w*.13,y+h*.28,x+w*.2,y+5-stride,C.ink,w*.16);
  this.rect(x-w*.28,y+h*.23,w*.56,h*.4,body);this.rect(x-w*.29,y+h*.28,w*.58,h*.06,C.gold);
  if(rank)this.rect(x-w*.32,y+h*.43,w*.64,h*.16,C.ink);
  this.ellipse(x,y+h*.78,w*.24,h*.14,'#d5ac7c');this.ellipse(x,y+h*.86,w*.26,h*.08,C.ink);this.ellipse(x,y+h*.97,w*.09,h*.04,C.ink);
  const arm=charge? h*.8:h*(.5+Math.sin(time*25)*.035);
  this.line(x-w*.28,y+h*.58,x-w*.55,y+arm,body,w*.14);this.line(x+w*.27,y+h*.59,x+w*.52,y+h*.52,body,w*.14);
  if(role==='boss'){this.line(x-w*.55,y+arm-h*.13,x-w*.55,y+arm+h*.45,C.ink,4);this.line(x-w*.55,y+arm+h*.45,x-w*.62,y+arm+h*.34,C.cream,5);}
  else if(role==='enemy'){this.line(x-w*.57,y+h*.3,x-w*.57,y+h*.9,C.ink,3);}
  else {g.strokeColor=this.color(C.gold);g.lineWidth=3;g.arc(x-w*.54,y+h*.52,w*.32,-1.25,1.25,false);g.stroke();this.line(x-w*.45,y+h*.28,x-w*.45,y+h*.75,C.cream,1.4);}
 }
 render(j:Journey|null,rank=false){const g=this.g;g.clear();for(const n of this.labels.values())n.active=false;const z=j?.z||0,t=j?.elapsed||0;
  this.rect(-360,-1800,720,3600,C.grass);
  g.fillColor=this.color(C.road);g.moveTo(-480,-1664);g.lineTo(480,-1664);g.lineTo(30,1216);g.lineTo(-30,1216);g.close();g.fill();
  this.line(-320,-640,-120,640,'#89947c',5);this.line(320,-640,120,640,'#89947c',5);
  for(let i=0;i<12;i++){const d=((i*.82-z% .82)),p=project(i%2?1.15:-1.15,d);this.ellipse(p.x,p.y,35*p.s,13*p.s,'#818d71');this.rect(p.x-4*p.s,p.y,8*p.s,60*p.s,'#857155');this.ellipse(p.x,p.y+57*p.s,31*p.s,43*p.s,'#70886e');}
  for(let i=0;i<14;i++){const p=project(Math.sin(i*19)*.8,i*.55-z%.55);this.line(p.x-8,p.y,p.x+11,p.y+2,'#c4b38e',2);}
  if(!j){this.actor(0,-65,105,145,'hero',0,rank);return;}
  for(const r of j.level.rows){const d=r.at-j.z;if(j.usedRows.has(r.id)||d<0||d>7)continue;const p=project(0,d);
   for(const side of [-1,1]){const x=side*130*p.s,op=side<0?r.left:r.right,selected=(j.x<0?-1:1)===side;
    this.rect(x-128*p.s,p.y-4*p.s,256*p.s,8*p.s,selected?C.gold:'#8c9379');
    for(const edge of [-1,1])this.rect(x+edge*122*p.s-3,p.y,6,104*p.s,'#716044');
    this.rect(x-118*p.s,p.y+54*p.s,236*p.s,51*p.s,selected?C.ink:'#75857a');
    if(op.kind==='double')this.line(x-114*p.s,p.y+107*p.s,x+114*p.s,p.y+107*p.s,C.gold,5);
    this.text(`g${r.id}${side}`,op.kind==='add'?`+${op.value}`:'×2',x,p.y+78*p.s,34,C.cream,180).setScale(p.s,p.s,1);
   }
  }
  for(const o of j.obstacles){const d=o.at-j.z;if(o.dead||o.resolved||d<0||d>7)continue;const p=project(o.x,d);
   if(o.kind==='wood'){const w=(o.rowId!==undefined?260:o.width*520)*p.s;this.rect(p.x-w/2,p.y,w,43*p.s,'#906a43');for(let i=0;i<7;i++)this.line(p.x-w/2+i*w/6,p.y,p.x-w/2+i*w/6,p.y+43*p.s,'#5f4b37',3);this.line(p.x-w/2,p.y+4*p.s,p.x+w/2,p.y+35*p.s,C.gold,4);}
   else if(o.kind==='rock'){this.ellipse(p.x,p.y+20*p.s,o.width*260*p.s,34*p.s,'#7c8179');this.line(p.x-25*p.s,p.y+30*p.s,p.x+8*p.s,p.y+47*p.s,'#adb1a3',5);}
   else {g.strokeColor=this.color(C.red);g.lineWidth=2;g.ellipse(p.x,p.y,o.width*260*p.s,9*p.s);g.stroke();this.actor(p.x,p.y,52*p.s,74*p.s,'enemy',t);}
   const msg=o.rowId!==undefined?`未清除：损失${o.loss}`:o.kind==='rock'?'山石 · 绕行':`碰撞 −${o.loss}`;
   this.text('loss'+o.id,msg,p.x,p.y-23*p.s,20,C.red,270).setScale(p.s,p.s,1);
   if(o.kind!=='rock'){const max=j.level.obstacles.find(a=>a.id===o.id)!.hp;this.rect(p.x-42*p.s,p.y+(o.kind==='wood'?45:78)*p.s,84*p.s,6,'#7e7b68');this.rect(p.x-42*p.s,p.y+(o.kind==='wood'?45:78)*p.s,84*p.s*o.hp/max,6,C.red);}
  }
  if(j.phase==='boss'||j.z>j.level.duration-4){const p=project(0,j.phase==='boss'?4:4+j.level.duration-j.z);this.actor(p.x,p.y,115*p.s,210*p.s,'boss',t,false,!!j.bossWarning&&j.bossWarning.stage==='charge');this.text('boss',j.level.bossName,0,p.y+215*p.s,27);this.rect(-130,p.y+180*p.s,260,10,'#8c8d7b');this.rect(-130,p.y+180*p.s,260*j.bossHP/j.level.bossHP,10,C.red);this.text('bosshp',`${Math.ceil(j.bossHP)} / ${j.level.bossHP}`,0,p.y+157*p.s,20);}
  for(const w of j.warnings){const x=w.x*260,width=w.width*520;g.fillColor=new Color(163,62,38,w.stage==='impact'?160:55);g.rect(x-width/2,-580,width,900);g.fill();this.line(x-width/2,-580,x-width/2,320,C.red,3);this.line(x+width/2,-580,x+width/2,320,C.red,3);for(let y=-570;y<310;y+=32)this.line(x-width/2,y,x+width/2,y+15,'#b7714d',1);this.text('warn',`${w.stage==='charge'?'蓄力':w.stage==='flight'?'已投出':'落点'} · 命中 −${w.loss}`,x,380,24,C.red,400);if(w.stage==='flight'){const q=clamp(w.remaining/w.flight,0,1);this.line(x,-270+q*430,x,-230+q*430,C.ink,5);}}
  for(const a of j.arrows){const p=project(a.x,a.z-j.z);const traces=a.damage<4?1:a.damage<12?3:5;for(let k=0;k<traces;k++){const xx=p.x+(k-(traces-1)/2)*2;this.line(xx,p.y-13,xx,p.y+10,C.ink,2);this.line(xx-3,p.y+5,xx,p.y+10,C.gold,2);}}
  // Back rows first; hero last. Count includes hero, never 48 plus one.
  const units=formation(j.visibleCount,j.x);for(let i=units.length-1;i>=0;i--){const u=units[i];this.actor(u.x,u.y,u.hero?58:42,u.hero?78:56,u.hero?'hero':'friend',t+i*.16,rank&&u.hero);}
  g.strokeColor=this.color(C.cream);g.lineWidth=3;g.ellipse(j.x*260,-270,13,6);g.stroke();
 }
 portrait(rank:boolean){this.g.clear();this.actor(0,0,68,102,'hero',0,rank);if(rank){this.line(42,0,42,111,C.ink,3);this.rect(42,75,38,28,C.gold);}}
 get poolSize(){return this.labels.size;}
}
