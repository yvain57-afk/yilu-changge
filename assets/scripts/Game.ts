import { _decorator, Component, Node, Label, UITransform, Color, Layers, view, ResolutionPolicy, Sprite, SpriteFrame, Texture2D, resources, Graphics, input, Input, EventTouch, EventMouse, Vec3, UIOpacity, sys, profiler } from 'cc';
import { Journey, clamp } from './core/model';
import { LEVELS } from './core/levels';
import { Platform } from './Platform';
const { ccclass } = _decorator;
type Screen='home'|'chapters'|'intro'|'battle'|'pause'|'result'|'turn'|'clues'|'settings';
type Hit={id:string;x:number;y:number;w:number;h:number;run:()=>void};
const INK='#354e49', RED='#a45037', PAPER='#f3e7cc', MUTE='#7c806c';
@ccclass('Game')
export class Game extends Component {
 private platform!:Platform; private art:Record<string,SpriteFrame>={}; private screen:Screen='home'; private level=0;
 private world!:Node;private ui!:Node;private fx!:Graphics; private hits:Hit[]=[];private battleNodes=new Map<string,Node>();
 private journey:Journey|null=null; private dragging=false;private touchId=-1;private lastDrag=0;private pointerStart=0;private touchButton:Hit|null=null;
 private returnScreen:Screen='home';private clueIndex=0;private previousScreen:Screen='home'; private loaded=false;
 private flash=0;private message='';private messageTime=0;private lastCount=8;private pulse=0;
 private frameTimes:number[]=[];private wallFrames=0;private fps=60;private fpsElapsed=0;
 private touchStart=(e:EventTouch)=>{if(this.touchId!==-1)return;this.touchId=e.getID() ?? -1;const p=this.local(e.getUILocation().x,e.getUILocation().y);this.down(p.x,p.y);};
 private touchMove=(e:EventTouch)=>{if(e.getID()===this.touchId){const p=this.local(e.getUILocation().x,e.getUILocation().y);this.move(p.x);}};
 private touchEnd=(e:EventTouch)=>{if(e.getID()===this.touchId){const p=this.local(e.getUILocation().x,e.getUILocation().y);this.up(p.x,p.y);this.touchId=-1;}};
 private touchCancel=()=>{this.dragging=false;this.touchId=-1;this.touchButton=null;};
 private mouseDown=(e:EventMouse)=>{if(e.getButton()===0){const p=this.local(e.getUILocation().x,e.getUILocation().y);this.down(p.x,p.y);}};
 private mouseMove=(e:EventMouse)=>{const p=this.local(e.getUILocation().x,e.getUILocation().y);this.move(p.x);};
 private mouseUp=(e:EventMouse)=>{const p=this.local(e.getUILocation().x,e.getUILocation().y);this.up(p.x,p.y);};
 async start(){
  view.setDesignResolutionSize(720,1280,ResolutionPolicy.SHOW_ALL);
  this.world=this.make('World',this.node);this.ui=this.make('Interface',this.node);this.fx=this.make('Feedback',this.node).addComponent(Graphics);
  this.platform=new Platform(this.node,()=>{if(this.screen==='battle')this.pause();});
  this.text(this.ui,'loading','正在展开书卷…',0,0,32,INK,600,80);
  await Promise.all([this.platform.load(),...['landscape-0','landscape-1','landscape-2','traveler','soldier','sparrow','wood','rock','ink','cart'].map(k=>new Promise<void>((resolve,reject)=>resources.load(`art/${k}/texture`,Texture2D,(err,a)=>{if(err)reject(err);else{const frame=new SpriteFrame();frame.texture=a;this.art[k]=frame;resolve();}})))]);
  input.on(Input.EventType.TOUCH_START,this.touchStart);input.on(Input.EventType.TOUCH_MOVE,this.touchMove);input.on(Input.EventType.TOUCH_END,this.touchEnd);input.on(Input.EventType.TOUCH_CANCEL,this.touchCancel);
  // Cocos 3.8.8 already maps mouse to touch; register once to avoid duplicate input.
  profiler.hideStats();this.loaded=true;this.show('home');
  // Read-only diagnostic snapshots. No advance, win, unlock or mutation hooks.
  (globalThis as any).__YLCG__={snapshot:()=>this.snapshot()};
 }
 private local(x:number,y:number){return this.node.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(x,y,0));}
 private down(x:number,y:number){if(!this.loaded)return;this.platform.syncAudio(this.screen!=='pause');this.touchButton=this.hits.find(b=>Math.abs(x-b.x)<=b.w/2&&Math.abs(y-b.y)<=b.h/2)||null;this.pointerStart=x;if(!this.touchButton&&this.screen==='battle'){this.dragging=true;this.lastDrag=x;}}
 private move(x:number){if(this.dragging&&this.journey){this.journey.move(this.journey.target+(x-this.lastDrag)/260);this.lastDrag=x;}}
 private up(x:number,y:number){const b=this.touchButton;this.touchButton=null;this.dragging=false;if(b&&Math.abs(x-b.x)<=b.w/2&&Math.abs(y-b.y)<=b.h/2&&Math.abs(x-this.pointerStart)<40)b.run();}
 private make(name:string,parent:Node){const n=new Node(name);n.layer=Layers.Enum.UI_2D;parent.addChild(n);n.addComponent(UITransform);return n;}
 private text(parent:Node,id:string,value:string,x:number,y:number,size=26,color=INK,w=620,h=80){const n=this.make(id,parent);n.setPosition(x,y);n.getComponent(UITransform)!.setContentSize(w,h);const l=n.addComponent(Label);l.string=value;l.fontSize=size;l.lineHeight=size*1.5;l.color=new Color().fromHEX(color);l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;l.overflow=Label.Overflow.SHRINK;l.enableWrapText=true;return n;}
 private sprite(parent:Node,id:string,key:string,x:number,y:number,w:number,h:number){const n=this.make(id,parent);n.setPosition(x,y);const s=n.addComponent(Sprite);s.spriteFrame=this.art[key];s.sizeMode=Sprite.SizeMode.CUSTOM;n.getComponent(UITransform)!.setContentSize(w,h);return n;}
 private panel(parent:Node,x:number,y:number,w:number,h:number,color=PAPER,r=20){const n=this.make('paper-panel',parent);n.setPosition(x,y);const g=n.addComponent(Graphics);g.fillColor=new Color().fromHEX(color);g.roundRect(-w/2,-h/2,w,h,r);g.fill();g.strokeColor=new Color(143,128,91,100);g.lineWidth=2;g.stroke();return n;}
 private button(id:string,label:string,y:number,run:()=>void,x=0,w=510,primary=false){this.panel(this.ui,x,y,w,76,primary?INK:PAPER,12);this.text(this.ui,id,label,x,y,27,primary?PAPER:INK,w-20,68);this.hits.push({id,x,y,w,h:76,run});}
 private clear(n:Node){for(const c of [...n.children]){c.removeFromParent();c.destroy();}}
 private background(id:number){this.clear(this.world);this.sprite(this.world,'landscape',`landscape-${id}`,0,0,720,1280);}
 private show(screen:Screen){this.previousScreen=this.screen;this.screen=screen;this.dragging=false;this.touchButton=null;this.clear(this.ui);this.hits=[];this.fx.clear();
  if(screen!=='battle'&&screen!=='pause') {this.background(this.level);this.battleNodes.clear();}
  const l=LEVELS[this.level];
  if(screen==='home'){
   this.panel(this.ui,0,252,628,640,'#f3e7cc',8);
   this.text(this.ui,'eyebrow','三页无名者的归途',0,508,24,MUTE);
   this.text(this.ui,'title','一路长歌',0,394,74,INK,610,130);
   this.text(this.ui,'tagline','拾起残页，把牵挂送到。',0,302,27,MUTE);
   this.sprite(this.ui,'hero','traveler',-32,91,168,177);this.sprite(this.ui,'bird','sparrow',104,170,95,73);
   this.button('chapters','展开书卷',-161,()=>this.show('chapters'),0,510,true);
   this.button('clues','线索册',-266,()=>{this.returnScreen='home';this.show('clues')});
   this.button('settings','声音与触感',-371,()=>{this.returnScreen='home';this.show('settings')});
   this.text(this.ui,'note','单指左右拖动 · 自动前进与射箭\n原创历史幻想，不是史实复演',0,-500,22,INK,630,100);
  }else if(screen==='chapters'){
   this.panel(this.ui,0,80,650,1010);this.text(this.ui,'title','择一页，赴一程',0,500,42);
   LEVELS.forEach((v,i)=>{const y=295-i*228,open=this.platform.book.unlock(i);this.text(this.ui,'era'+i,v.era,0,y+64,22,MUTE);this.button('level'+i,`${v.title}  ${this.platform.book.data.cleared[i]?'✓':open?'→':'· 待解锁'}`,y,()=>{if(open){this.level=i;this.show('intro')}},0,530,open);this.text(this.ui,'record'+i,this.platform.book.data.cleared[i]?`最多带回 ${this.platform.book.data.best[i]} 位纸兵` : i===0?'从八位纸兵出发':'前一页送达后开启',0,y-69,21,MUTE);});
   this.button('home','返回书卷',-492,()=>this.show('home'));
  }else if(screen==='intro'){
   this.panel(this.ui,0,-85,652,865);this.text(this.ui,'era',l.era,0,510,25);this.text(this.ui,'title',l.title,0,438,51);this.sprite(this.ui,'hero','traveler',0,235,164,173);
   this.text(this.ui,'intro',l.intro.join('\n\n'),0,-40,28,INK,550,300);
   this.text(this.ui,'help','空白处左右拖动，箭沿你的位置飞出\n+ 添兵 · ×2 倍增　山石请绕行',0,-272,23,MUTE,580,110);
   this.button('start','跳过对白 · 出发',-419,()=>this.begin(),0,510,true);
   this.button('back','返回选页',-538,()=>this.show('chapters'));
  }else if(screen==='battle'){
   this.buildBattle();
  }else if(screen==='pause'){
   this.panel(this.ui,0,0,620,780);this.text(this.ui,'title','歇一歇，路还在',0,282,40);
   this.text(this.ui,'paused','已暂停 · 返回后点继续',0,197,24,MUTE);
   this.button('continue','继续行路',60,()=>{this.journey!.resume();this.show('battle');this.platform.syncAudio();},0,510,true);
   this.button('restart','免费重走这一页',-48,()=>this.begin());
   this.button('settings','声音与触感',-156,()=>{this.returnScreen='pause';this.show('settings')});
   this.button('chapters','返回选页',-264,()=>this.show('chapters'));
  }else if(screen==='result'){
   const won=this.journey?.phase==='won';this.panel(this.ui,0,25,650,1050);this.text(this.ui,'era',l.era,0,481,24,MUTE);this.text(this.ui,'title',won?'此页，已送达':'纸散了，心意还在',0,383,44);
   this.sprite(this.ui,'bird','sparrow',0,227,147,113);
   this.text(this.ui,'ending',won?l.ending:this.journey!.cause,0,77,29,INK,550,165);
   this.text(this.ui,'stats',won?`带回 ${this.journey!.count} 位纸兵 · 用时 ${Math.round(this.journey!.elapsed)} 秒`:'只因纸兵归零折返 · 没有倒计时惩罚',0,-58,23,MUTE);
   this.button('next',won?(this.level<2?'翻到下一页':'合上三页 · 回到书卷'):'免费立即重开',-184,()=>{if(!won)this.begin();else if(this.level<2)this.show('turn');else this.show('home')},0,540,true);
   this.button('clues','读这一页的线索',-292,()=>{this.clueIndex=this.level;this.returnScreen='result';this.show('clues')});
   this.button('chapters','返回选页',-401,()=>this.show('chapters'));
  }else if(screen==='turn'){
   this.panel(this.ui,0,30,640,800);this.text(this.ui,'title','翻页，跨过时光',0,307,43);
   this.text(this.ui,'era',`${l.era.split(' · ')[0]} → ${LEVELS[this.level+1].era.split(' · ')[0]}`,0,171,42);
   this.text(this.ui,'explain','两页之间，已过去数百年。\n这不是一段连续的旅程，\n是不同年代里，相似的牵挂。',0,-4,28,INK,570,210);
   this.button('start-next','不读也能继续 · 下一页',-238,()=>{this.level++;this.show('intro')},0,540,true);
  }else if(screen==='clues'){
   this.panel(this.ui,0,12,666,1140);this.text(this.ui,'title','线索册',0,495,43);
   const c=LEVELS[this.clueIndex],found=this.platform.book.data.clues[this.clueIndex];
   this.text(this.ui,'clue-title',c.era+'\n'+c.title,0,382,29);
   this.text(this.ui,'clue-body',found?c.clue:'走过这一页的半程，即可拾得线索。\n即使折返，已经拾到的线索也会留下。',0,104,27,INK,566,395);
   this.text(this.ui,'source',found?'出处：'+c.source:'未拾得',0,-168,21,MUTE,560,110);
   this.text(this.ui,'source-url',found?c.url:'',0,-253,15,MUTE,570,86);
   this.button('prev-clue','上一页',-360,()=>{this.clueIndex=(this.clueIndex+2)%3;this.show('clues')},-155,270);
   this.button('next-clue','下一页',-360,()=>{this.clueIndex=(this.clueIndex+1)%3;this.show('clues')},155,270);
   this.button('return','返回原处',-472,()=>this.show(this.returnScreen),0,540,true);
  }else if(screen==='settings'){
   this.panel(this.ui,0,0,640,880);this.text(this.ui,'title','声音与触感',0,329,44);
   (['music','sfx','vibration'] as const).forEach((key,i)=>{this.button(key,`${['背景音乐','动作音效','轻触震动'][i]}　${this.platform.book.data.settings[key]?'开':'关'}`,151-i*113,()=>{this.platform.book.data.settings[key]=!this.platform.book.data.settings[key];this.platform.book.persist();this.platform.syncAudio(this.returnScreen!=='pause');this.show('settings')})});
   this.text(this.ui,'info','震动仅在支持的微信设备上生效\n所有进度只保存在本机',0,-222,23,MUTE,540,90);
   this.button('return','返回',-338,()=>this.show(this.returnScreen),0,510,true);
  }
  if(this.platform.book.notice)this.text(this.ui,'save-notice',this.platform.book.notice,0,-609,19,RED,690,52);
 }
 private begin(){this.journey=new Journey(LEVELS[this.level]);this.message='左右拖动 · 箭会自动向前射';this.messageTime=7;this.frameTimes=[];this.lastCount=8;this.pulse=0;this.background(this.level);this.battleNodes.clear();this.show('battle');this.platform.syncAudio();}
 private pause(){if(!this.journey)return;this.journey.pause();this.platform.syncAudio(false);this.show('pause');}
 private buildBattle(){
  this.panel(this.ui,0,553,696,142,PAPER,12);this.text(this.ui,'battle-era',LEVELS[this.level].era+'  /  '+LEVELS[this.level].title,-42,585,23,INK,550,48);
  this.text(this.ui,'count','',-175,528,38,INK,300,64);this.text(this.ui,'progress','',106,529,22,MUTE,210,64);
  this.button('pause','Ⅱ',558,()=>this.pause(),291,86);
  this.panel(this.ui,0,-546,696,148,PAPER,12);this.text(this.ui,'hint','空白处左右拖动',0,-504,24,INK,630,46);this.text(this.ui,'tip','+ 添兵  /  ×2 倍增  ·  山石不可射毁',0,-559,22,MUTE,640,64);
 }
 private pooled(id:string,key:string,x:number,y:number,w:number,h:number){let n=this.battleNodes.get(id);if(!n){n=this.sprite(this.world,id,key,x,y,w,h);this.battleNodes.set(id,n);}n.active=true;n.setPosition(x,y);n.getComponent(UITransform)!.setContentSize(w,h);return n;}
 private label(id:string,value:string,x:number,y:number,size:number,color=INK,w=300,h=64){let n=this.battleNodes.get(id);if(!n){n=this.text(this.world,id,value,x,y,size,color,w,h);this.battleNodes.set(id,n);}n.active=true;n.setPosition(x,y);const l=n.getComponent(Label)!;if(l.string!==value)l.string=value;l.color=new Color().fromHEX(color);return n;}
 private setText(id:string,text:string){const label=this.ui.getChildByName(id)?.getComponent(Label);if(label&&label.string!==text)label.string=text;}
 private coord(x:number,d:number){const y=-310+d*112,scale=clamp(1-d*.065,.5,1.04);return{x:x*260*scale,y,s:scale};}
 private renderBattle(dt:number){const j=this.journey!;for(const n of this.battleNodes.values())n.active=false;const g=this.fx;g.clear();
  // Sparse road fibers slide past: movement cue without an unbounded world.
  g.strokeColor=new Color(156,144,106,105);g.lineWidth=2;
  for(let i=0;i<9;i++){const d=(i*.83-j.z%.83),p=this.coord(Math.sin(i*7)*.78,d);g.moveTo(p.x-9,p.y);g.lineTo(p.x+16,p.y+3);}g.stroke();
  for(const r of j.level.rows){const d=r.at-j.z;if(j.usedRows.has(r.id)||d<-.2||d>7)continue;
   for(const side of [-1,1]){const op=side<0?r.left:r.right,p=this.coord(side*.49,d),w=225*p.s,h=104*p.s;
    const id=`gate-${r.id}-${side}`;let n=this.battleNodes.get(id);if(!n){n=this.make(id,this.world);const q=n.addComponent(Graphics);q.fillColor=new Color().fromHEX(op.kind==='add'?'#e6edce':'#e8cb98');q.strokeColor=new Color().fromHEX(INK);q.lineWidth=4;
    if(op.kind==='add')q.roundRect(-128,-52,256,104,16);else {q.moveTo(-128,-34);q.lineTo(-109,-52);q.lineTo(109,-52);q.lineTo(128,-34);q.lineTo(128,34);q.lineTo(109,52);q.lineTo(-109,52);q.lineTo(-128,34);q.close();}q.fill();q.stroke();this.battleNodes.set(id,n);}n.active=true;n.setPosition(p.x,p.y);n.setScale(p.s,p.s,1);
    this.label(id+'text',(op.kind==='add'?`+${op.value} 添兵`:'×2 倍增'),p.x,p.y,29,INK,220,70).setScale(p.s,p.s,1);
   }
  }
  for(const o of j.obstacles){const d=o.at-j.z;if(o.dead||o.resolved||d<-.4||d>6.6)continue;const p=this.coord(o.x,d);
   this.pooled('o'+o.id,o.kind==='wood'?'wood':o.kind==='rock'?'rock':'ink',p.x,p.y,170*p.s,(o.kind==='ink'?178:106)*p.s);
   this.label('loss'+o.id,`${o.kind==='wood'?'可射毁':o.kind==='rock'?'绕行':'落墨'} · −${o.loss}`,p.x,p.y-65*p.s,21,RED,230,50).setScale(p.s,p.s,1);
   if(o.kind==='wood')this.label('hp'+o.id,`${Math.max(0,Math.ceil(o.hp))}`,p.x,p.y+58*p.s,21,INK,160,44).setScale(p.s,p.s,1);
   if(o.warn!==undefined)this.warning(g,o.x,o.width,o.warn,o.loss,`obstacle-${o.id}`);
  }
  if(j.phase==='boss'){
   const sway=Math.sin(j.elapsed*2)*8;this.pooled('boss','ink',sway,175,245,258);this.label('boss-title','守关 · 失序墨影',0,377,29);this.label('boss-hp',`${Math.ceil(j.bossHP)} / ${j.level.bossHP}`,0,322,25);
   if(j.bossWarning)this.warning(g,j.bossWarning.x,.28,j.bossWarning.remaining,j.level.bossLoss,'boss');
  }
  g.strokeColor=new Color(73,96,74,240);g.lineWidth=3;
  for(const a of j.arrows){const p=this.coord(a.x,a.z-j.z);g.moveTo(p.x,p.y-14);g.lineTo(p.x,p.y+14);g.moveTo(p.x-5,p.y+6);g.lineTo(p.x,p.y+14);g.lineTo(p.x+5,p.y+6);}g.stroke();
  const cx=j.x*260;this.pulse=Math.max(0,this.pulse-dt*2);
  for(let i=0;i<j.visibleCount;i++){const row=Math.floor(i/8),col=i%8,cols=Math.min(8,j.visibleCount-row*8),off=(col-(cols-1)/2)*18;const bob=Math.sin(j.elapsed*8+i)*2;
   this.pooled('soldier'+i,'soldier',cx+off*(1+this.pulse*.17),-342-row*15+bob,25,31);
  }
  this.pooled('traveler','traveler',cx,-302+Math.sin(j.elapsed*7)*2,54,57);this.pooled('sparrow','sparrow',cx+48,-265+Math.sin(j.elapsed*3)*9,41,32);
  if(this.level===1)this.pooled('cart','cart',cx-56,-361,52,36);
  if(this.pulse>0){g.strokeColor=new Color(182,137,64,Math.floor(this.pulse*200));g.lineWidth=3;g.circle(cx,-349,80+(1-this.pulse)*55);g.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=45+this.pulse*125;g.fillColor=new Color(252,240,199,230);g.rect(cx+Math.cos(a)*r,-350+Math.sin(a)*r*.5,7,11);g.fill();}}
  if(this.flash>0){this.flash-=dt;g.fillColor=new Color(167,57,31,Math.floor(Math.max(0,this.flash)*100));g.rect(-360,-640,720,1280);g.fill();}
  this.setText('count',`纸兵 ${j.count}`);this.setText('progress',j.phase==='boss'?'守关 · 停步':`行路 ${Math.floor(j.z/j.level.duration*100)}%`);
  this.messageTime=Math.max(0,this.messageTime-dt);this.setText('hint',this.messageTime>0?this.message:j.phase==='boss'?'对准墨影射箭，落墨前横移':'提前选路，箭沿队伍中心飞出');
 }
 private warning(g:Graphics,x:number,width:number,seconds:number,loss:number,id:string){const cx=x*260;g.fillColor=new Color(182,76,49,65+Math.floor(Math.sin(seconds*12)**2*45));g.rect(cx-width*260,-443,width*520,770);g.fill();g.strokeColor=new Color(154,56,34,230);g.lineWidth=3;for(let y=-435;y<325;y+=36){g.moveTo(cx-width*260,y);g.lineTo(cx+width*260,y+22);}g.stroke();this.label('warning-'+id,`落墨 −${loss} · 快避开`,cx,415,24,RED,370,54);}
 update(dt:number){if(!this.loaded)return;this.wallFrames++;this.fpsElapsed+=dt;if(this.fpsElapsed>=1){this.fps=this.wallFrames/this.fpsElapsed;this.wallFrames=0;this.fpsElapsed=0;}
  if(this.screen==='battle'&&this.journey){this.frameTimes.push(dt);if(this.frameTimes.length>7200)this.frameTimes.shift();this.journey.advance(dt);
   const events=this.journey.drainFeedback();let hit=false;for(const e of events){if(e.kind==='hit'){hit=true;continue;}if(e.kind==='gather'){this.pulse=1;this.message=`聚纸成阵 +${e.amount} · ${this.journey.count} 位同行`;this.messageTime=1.5;this.platform.sound('gather');}else if(e.kind==='hurt'){this.flash=.6;this.message=`折损 ${e.amount} · 注意预告与障碍`;this.messageTime=2;this.platform.sound('hurt');this.platform.vibrate();}else if(e.kind==='clue'){this.platform.book.clue(this.level);this.message='拾得一页线索，折返也会保留';this.messageTime=2;}else this.platform.sound(e.kind);}
   if(hit)this.platform.sound('hit');this.renderBattle(dt);
   if(this.journey.finished){if(this.journey.phase==='won')this.platform.book.win(this.level,this.journey.count);this.show('result');}
  }
 }
 private snapshot(){const j=this.journey;let nodes=0;const count=(n:Node)=>{nodes++;n.children.forEach(count)};count(this.node);return JSON.parse(JSON.stringify({engine:'Cocos Creator 3.8.8',screen:this.screen,level:this.level,buttons:this.hits.map(({id,x,y,w,h})=>({id,x,y,w,h})),save:JSON.parse(JSON.stringify(this.platform.book.data)),notice:this.platform.book.notice,nodes,pool:this.battleNodes.size,fps:this.fps,frames:this.frameTimes.length,meanFPS:this.frameTimes.length/this.frameTimes.reduce((a,b)=>a+b,0),minSecondFPS:this.frameTimes.length?1/Math.max(...this.frameTimes):0,journey:j?{phase:j.phase,paused:j.paused,count:j.count,x:j.x,target:j.target,z:j.z,elapsed:j.elapsed,duration:j.level.duration,damage:j.damage,visible:j.visibleCount,bossHP:j.bossHP,bossWarning:j.bossWarning,cause:j.cause,arrows:j.arrows.length,rows:j.level.rows.filter(r=>!j.usedRows.has(r.id)),obstacles:j.obstacles.filter(o=>!o.dead&&!o.resolved),usedRows:Array.from(j.usedRows)}:null}));}
 onDestroy(){this.platform?.destroy();input.off(Input.EventType.TOUCH_START,this.touchStart);input.off(Input.EventType.TOUCH_MOVE,this.touchMove);input.off(Input.EventType.TOUCH_END,this.touchEnd);input.off(Input.EventType.TOUCH_CANCEL,this.touchCancel);input.off(Input.EventType.MOUSE_DOWN,this.mouseDown);input.off(Input.EventType.MOUSE_MOVE,this.mouseMove);input.off(Input.EventType.MOUSE_UP,this.mouseUp);delete (globalThis as any).__YLCG__;}
}
