import { _decorator, Component, Node, Label, UITransform, Color, Layers, view, ResolutionPolicy, Graphics, input, Input, EventTouch, Vec3, profiler } from 'cc';
import { Journey } from './core/model';
import { LEVELS, PLAYABLE_LEVELS } from './core/levels';
import { Platform } from './Platform';
import { HeroRig, Pose } from './HeroRig';
import { BattleView } from './BattleView';
const { ccclass } = _decorator;
type Screen='home'|'chapters'|'battle'|'pause'|'result'|'settings'|'preview';
type Hit={id:string;x:number;y:number;w:number;h:number;run:()=>void};
const INK='#203b43',PAPER='#f3ead5',MUTE='#717969',RED='#a84835';
@ccclass('Game')
export class Game extends Component {
 private platform!:Platform;private screen:Screen='home';private level=0;private world!:Node;private ui!:Node;private battle!:BattleView;
 private hits:Hit[]=[];private journey:Journey|null=null;private dragging=false;private touchId=-1;private lastDrag=0;private pointerStart=0;private touchButton:Hit|null=null;
 private returnScreen:Screen='home';private loaded=false;private message='';private messageTime=0;private tutorialUntil=5;private dragged=false;
 private frameTimes:number[]=[];private wallFrames=0;private fps=60;private fpsElapsed=0;
 private previewState={count:8,x:0,time:0,pose:'idle' as Pose,rank:false,debug:false};private previewPaused=false;
 private touchStart=(e:EventTouch)=>{if(this.touchId!==-1)return;this.touchId=e.getID()??-1;const p=this.local(e);this.down(p.x,p.y);};
 private touchMove=(e:EventTouch)=>{if(e.getID()!==this.touchId)return;const p=this.local(e);if(this.dragging&&this.journey){this.journey.move(this.journey.target+(p.x-this.lastDrag)/260);if(Math.abs(p.x-this.lastDrag)>2&&!this.dragged){this.dragged=true;this.tutorialUntil=Math.min(this.tutorialUntil,this.journey.elapsed+2);}this.lastDrag=p.x;}};
 private touchEnd=(e:EventTouch)=>{if(e.getID()!==this.touchId)return;const p=this.local(e),b=this.touchButton;this.touchCancel();if(b&&Math.abs(p.x-b.x)<=b.w/2&&Math.abs(p.y-b.y)<=b.h/2&&Math.abs(p.x-this.pointerStart)<40)b.run();};
 private touchCancel=()=>{this.dragging=false;this.touchId=-1;this.touchButton=null;this.journey?.cancelMove();};
 async start(){view.setDesignResolutionSize(720,1280,ResolutionPolicy.FIXED_WIDTH);this.world=this.make('World',this.node);this.ui=this.make('Interface',this.node);this.battle=new BattleView(this.world);this.battle.debug=typeof location!=='undefined'&&new URLSearchParams(location.search).get('debug')==='hitboxes';this.platform=new Platform(this.node,()=>{if(this.screen==='battle')this.pause();if(this.screen==='preview'){this.previewPaused=true;this.setText('preview-pause','继续动作');}});this.text('loading','正在整队…',0,0,32);await Promise.all([this.platform.load(),HeroRig.load()]);input.on(Input.EventType.TOUCH_START,this.touchStart);input.on(Input.EventType.TOUCH_MOVE,this.touchMove);input.on(Input.EventType.TOUCH_END,this.touchEnd);input.on(Input.EventType.TOUCH_CANCEL,this.touchCancel);profiler.hideStats();this.loaded=true;this.show(typeof location!=='undefined'&&new URLSearchParams(location.search).get('preview')==='character'?'preview':'home');(globalThis as any).__YLCG__={snapshot:()=>this.snapshot()};}
 private local(e:EventTouch){const p=e.getUILocation();return this.node.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(p.x,p.y,0));}
 private down(x:number,y:number){if(!this.loaded)return;this.platform.syncAudio(this.screen!=='pause'&&!(this.screen==='preview'&&this.previewPaused));this.touchButton=this.hits.find(b=>Math.abs(x-b.x)<=b.w/2&&Math.abs(y-b.y)<=b.h/2)||null;this.pointerStart=x;if(!this.touchButton&&this.screen==='battle'){this.dragging=true;this.lastDrag=x;}}
 private make(name:string,parent:Node){const n=new Node(name);n.layer=Layers.Enum.UI_2D;parent.addChild(n);n.addComponent(UITransform);return n;}
 private text(id:string,value:string,x:number,y:number,size=26,color=INK,w=620,h=80){const n=this.make(id,this.ui);n.setPosition(x,y);n.getComponent(UITransform)!.setContentSize(w,h);const l=n.addComponent(Label);l.string=value;l.fontSize=size;l.lineHeight=size*1.4;l.color=new Color().fromHEX(color);l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;l.overflow=Label.Overflow.SHRINK;return n;}
 private panel(x:number,y:number,w:number,h:number,color=PAPER){const n=this.make('panel',this.ui);n.setPosition(x,y);const g=n.addComponent(Graphics);g.fillColor=new Color().fromHEX(color);g.roundRect(-w/2,-h/2,w,h,12);g.fill();}
 private button(id:string,title:string,y:number,run:()=>void,x=0,w=510,primary=false){this.panel(x,y,w,74,primary?INK:PAPER);this.text(id,title,x,y,27,primary?PAPER:INK,w-20,68);this.hits.push({id,x,y,w,h:74,run});}
 private show(screen:Screen){this.screen=screen;this.touchCancel();for(const n of [...this.ui.children]){n.removeFromParent();n.destroy();}this.hits=[];const l=LEVELS[this.level],b=this.platform.book,edge=Math.max(0,(view.getVisibleSize().height-1280)/2);
  if(screen!=='battle'&&screen!=='pause'&&screen!=='settings'&&screen!=='preview')this.battle.render(null,b.rank!=='布衣');
  if(screen==='home'){
   this.panel(0,330,656,410);this.text('eyebrow','起步篇 / 第一关开发预览',0,478,23,MUTE);this.text('title','一路长歌',0,385,67);this.text('tagline','从小人物起步，一步步当皇帝',0,302,27);this.text('scope','计划三关：拿下第一座城\n本次开放第一关 · 主角小样待确认',0,218,23,MUTE,600,80);
   this.text('rank',`布衣 → 头领 → 统领 → 城主`,0,-120,25);this.button('start',b.data.cleared[l.id]?'再战第一关':'开始闯关',-225,()=>this.begin(),0,530,true);this.button('chapters','关卡与晋升',-325,()=>this.show('chapters'));this.button('settings','设置',-425,()=>{this.returnScreen='home';this.show('settings')});this.button('preview','查看主角动作小样',-525,()=>this.show('preview'));
  }else if(screen==='preview'){
   this.text('preview-title','A 系主角小样 · 待确认',0,550,34);this.text('preview-info','独立展示夹具 / 重复主角排布，非正式友军',0,493,21,MUTE);
   (['idle','walk','shoot','promote'] as Pose[]).forEach((pose,i)=>this.button('pose-'+pose,['站立','行走','射箭','晋升'][i],415,()=>{this.previewState.pose=pose;this.previewState.time=0;this.previewPaused=false;this.platform.syncAudio();},-258+i*172,158));
   [1,8,24,48,256].forEach((count,i)=>this.button('count-'+count,String(count),-35,()=>this.previewState.count=count,-280+i*140,125));
   [-.91,0,.91].forEach((x,i)=>this.button('position-'+i,['最左','居中','最右'][i],-130,()=>this.previewState.x=x,-230+i*230,215));
   this.button('preview-pause',this.previewPaused?'继续动作':'暂停动作',-595,()=>{this.previewPaused=!this.previewPaused;this.platform.syncAudio(!this.previewPaused);this.setText('preview-pause',this.previewPaused?'继续动作':'暂停动作');},-165,285);
   this.button('home','返回首页',-595,()=>this.show('home'),165,285);
  }else if(screen==='chapters'){
   this.panel(0,40,660,1020);this.text('title','从一支队伍，到第一座城',0,468,35);
   LEVELS.forEach((v,i)=>{const y=290-i*225;this.text('rank'+i,`${v.rankBefore} → ${v.rankAfter} / 出征 ${v.start} 人`,0,y+70,23,MUTE);if(i<PLAYABLE_LEVELS)this.button('level'+i,v.title+(b.data.cleared[v.id]?'  ✓':''),y,()=>{this.level=i;this.begin()},0,530,true);else this.text('pending'+i,v.title+' · 后续制作',0,y,30);this.text('record'+i,i<PLAYABLE_LEVELS?`本关最佳：${b.data.best[v.id]} 人`:'角色选定、首关体验确认后接入',0,y-60,20,MUTE);});this.button('home','返回首页',-490,()=>this.show('home'));
  }else if(screen==='battle'){
   this.panel(0,543+edge,686,136);this.text('level',l.title+' · 打出自己的旗号',-40,576+edge,24,INK,540,46);this.text('count','',-170,523+edge,37,INK,300,60);this.text('progress','',100,523+edge,23,MUTE,210,60);this.button('pause','Ⅱ',555+edge,()=>this.pause(),291,78);this.text('feedback','',0,-535,26,INK,650,60);this.text('tutorial','',0,-590,22,INK,670,55);
  }else if(screen==='pause'){
   this.panel(0,0,620,700);this.text('title','已暂停',0,260,43);this.button('continue','继续',120,()=>{this.journey!.resume();this.show('battle');this.platform.syncAudio()},0,510,true);this.button('restart','重新开始',15,()=>this.begin());this.button('settings','设置',-90,()=>{this.returnScreen='pause';this.show('settings')});this.button('chapters','返回关卡',-195,()=>this.leave());
  }else if(screen==='result'){
   const j=this.journey!,won=j.phase==='won';this.panel(0,80,656,960);this.text('title',won?'身份晋升：头领':'本次未能取胜',0,460,43);this.text('ending',won?l.ending:j.cause,0,335,27,INK,570,130);this.text('identity',won?'布衣 → 头领 · 晋升已保存':'重新整队，再来一次',0,252,27);if(won){const portrait=this.make('promotion-hero',this.ui);portrait.setPosition(0,120);new BattleView(portrait).portrait(true);}this.text('stats',`剩余兵力：${j.count}  /  最佳：${b.data.best[l.id]}\n用时：${j.elapsed.toFixed(1)} 秒`,0,66,24,MUTE,570,100);this.text('stop','主角小样待确认\n友军、敌人、场景仍为草模',0,-65,23,MUTE,560,95);this.button('restart',won?'再战一次':'重新开始',-195,()=>this.begin(),0,530,true);this.button('chapters','返回关卡',-300,()=>this.leave());
  }else if(screen==='settings'){
   this.panel(0,0,640,820);this.text('title','设置',0,300,44);(['music','sfx','vibration'] as const).forEach((k,i)=>this.button(k,`${['背景音乐','动作音效','轻触震动'][i]}：${b.data.settings[k]?'开':'关'}`,140-i*110,()=>{b.data.settings[k]=!b.data.settings[k];b.persist();this.platform.syncAudio(this.returnScreen!=='pause');this.show('settings')}));this.text('privacy','进度保存在本机 · 免费重开',0,-215,23,MUTE);this.button('return','返回',-320,()=>this.show(this.returnScreen));
  }
  this.text('prototype','S2-A · 主角待确认 / 其余草模',0,627+edge,17,MUTE,650,30);if(b.notice)this.text('notice',b.notice,0,-626-edge,18,RED,690,30);
 }
 private begin(){this.platform.stopEffects();this.battle.clear();this.journey?.dispose();this.journey=new Journey(LEVELS[this.level]);this.message=`本次出征：${this.journey.count}人`;this.messageTime=3;this.tutorialUntil=5;this.dragged=false;this.frameTimes=[];this.show('battle');this.platform.syncAudio();}
 private leave(){this.battle.clear();this.journey?.dispose();this.platform.syncAudio(false);this.show('chapters');}
 private pause(){if(!this.journey)return;this.journey.pause();this.platform.syncAudio(false);this.show('pause');}
 private setText(id:string,t:string){const l=this.ui.getChildByName(id)?.getComponent(Label);if(l)l.string=t;}
 update(dt:number){if(!this.loaded)return;this.wallFrames++;this.fpsElapsed+=dt;if(this.fpsElapsed>=1){this.fps=this.wallFrames/this.fpsElapsed;this.wallFrames=0;this.fpsElapsed=0;}
  if(this.screen==='preview'){if(!this.previewPaused&&!this.platform.hidden)this.previewState.time+=dt;this.battle.preview(this.previewState);}
  if(this.screen==='battle'&&this.journey){const j=this.journey;this.frameTimes.push(dt);if(this.frameTimes.length>7200)this.frameTimes.shift();j.advance(dt);const events=j.drainFeedback();this.battle.effects.accept(events,j.elapsed);let hit=false;for(const e of events){if(e.kind==='shot')continue;if(e.kind==='hit'){hit=true;continue;}this.platform.sound(e.kind);if(e.kind==='gather'){this.message=`增兵 +${e.amount}`;this.messageTime=1.5;}if(e.kind==='hurt'){this.message=`损失 ${e.amount} 人`;this.messageTime=2;this.platform.vibrate();}}
   if(hit)this.platform.sound('hit');this.battle.render(j,this.level>0);this.setText('count',`兵力 ${j.count}`);this.setText('progress',j.phase==='boss'?'Boss 战':`行路 ${Math.floor(j.z/j.level.duration*100)}%`);this.messageTime=Math.max(0,this.messageTime-dt);this.setText('feedback',this.messageTime>0?this.message:'');this.setText('tutorial',j.elapsed<this.tutorialUntil?'左右拖动，自动射箭 · 兵力越多，火力越强':'');
   if(j.finished){this.platform.stopEffects();this.battle.clear();if(j.phase==='won'){this.platform.book.win(this.level,j.count);this.platform.sound('gather');}this.show('result');}
  }
 }
 private snapshot(){const j=this.journey;let nodes=0;const walk=(n:Node)=>{nodes++;n.children.forEach(walk)};walk(this.node);return JSON.parse(JSON.stringify({version:'v02-s2a',engine:'Cocos Creator 3.8.8',screen:this.screen,level:this.level,buttons:this.hits.map(({id,x,y,w,h})=>({id,x,y,w,h})),save:this.platform.book.data,rank:this.platform.book.rank,notice:this.platform.book.notice,nodes,pool:this.battle.poolSize,presentation:this.battle.diagnostics,audio:this.platform.audioState,preview:this.screen==='preview'?{...this.previewState,paused:this.previewPaused}:null,fps:this.fps,meanFPS:this.frameTimes.length/this.frameTimes.reduce((a,b)=>a+b,0),journey:j?{phase:j.phase,paused:j.paused,count:j.count,x:j.x,target:j.target,z:j.z,elapsed:j.elapsed,duration:j.level.duration,damage:j.damage,visible:j.visibleCount,bossHP:j.bossHP,bossWarning:j.bossWarning,warnings:j.warnings,cause:j.cause,arrows:j.arrows.length,rows:j.level.rows.filter(r=>!j.usedRows.has(r.id)),obstacles:j.obstacles.filter(o=>!o.dead&&!o.resolved),usedRows:Array.from(j.usedRows)}:null}));}
 onDestroy(){this.journey?.dispose();this.platform?.destroy();input.off(Input.EventType.TOUCH_START,this.touchStart);input.off(Input.EventType.TOUCH_MOVE,this.touchMove);input.off(Input.EventType.TOUCH_END,this.touchEnd);input.off(Input.EventType.TOUCH_CANCEL,this.touchCancel);delete(globalThis as any).__YLCG__;}
}
