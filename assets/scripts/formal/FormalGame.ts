import {combatReviewTarget} from './CombatReviewPolicy';
import {MenuLayers} from './MenuLayers';
import {inset,layoutText,homeLayout} from './MenuLayout';
import {drawButton,drawCompactPanel,drawPanel,drawTab} from './UIComponents';
import {FullMenu,MenuHost,resultLossSummary} from './FullMenu';
import {BRIDGE_BUILD} from './BridgeBuild';
import {resolveWeaponPresentation,drawWeaponPresentation,presentationBounds} from './WeaponPresentation';
import {rewardSoundContext} from './WeaponSfx';
import {DEBUG} from 'cc/env';
import {BridgeDiagnostics} from './BridgeDiagnostics';
import {MANIFEST} from './manifest';
import {prepareLayout} from './presentation';
import {mapMetrics,mapPosition,mapScrollFor,visibleMapPanels,marchPath,mapPanelNames,chapterThreats} from './CampaignMap';
import {RewardItem,RewardPresentation,rewardLabel,presentationDuration,canSkipPresentation,nextMilestoneHint} from './RewardFlow';
import {reviewTarget} from './NativeReview';
import {configureCampaignReference} from './CampaignReference';
import {_decorator,Component,Node,UITransform,Layers,view,ResolutionPolicy,input,Input,EventTouch,sys,profiler,native} from 'cc';
import {Platform} from '../Platform';
import {PresentationAssets,PresentationKey} from '../ui/PresentationAssets';
import {NativePaint} from './NativePaint';
import {SafeErrorOverlay} from './SafeErrorOverlay';
import {createBattle} from './battle';
import {FormalStore,RULES_VERSION} from './store';
import {CHAPTERS,PEOPLE,WEAPON_DATA,TREASURES,RANKS,TUNING,Slot,WeaponId,routeFor,FACTIONS,PERSON_PROFILES,personRole,MILESTONES,milestoneFor} from './data';
const {ccclass}=_decorator;
declare const wx:any;
type Hit={id:string;label?:string;x:number;y:number;w:number;h:number;action:()=>void};
type Screen='loading'|'error'|'home'|'chapters'|'prepare'|'collection'|'battle'|'pause'|'result'|'transition'|'settings'|'person'|'reward'|'render-error'|'item'|'confirm';
@ccclass('FormalGame')
export class FormalGame extends Component {
 private menuLayers!:MenuLayers;private gestureDragged=false;private reviewMenuFault='';private faultOrigin:'battle'|'menu'='battle';private faultMenuScreen:Screen='home';private isolatedInsets:{top:number;bottom:number}|null=null;
 private reviewFixtureOpened=false;private reviewStorageFailures=0;private menuAnimAcc=0;private uiSkin=true;private fullMenu=new FullMenu();private resultReceipt:any=null;private reviewProbeStage='';
 private safeLayer!:SafeErrorOverlay;private renderFault='';private retryingRender=false;private disposed=false;
 private bridgeDiagnostics=new BridgeDiagnostics();
 private root!:Node;private bg!:Node;private ui!:Node;private paint!:NativePaint;private menu!:NativePaint;private art=new PresentationAssets();private platform!:Platform;private store!:FormalStore;private battle:ReturnType<typeof createBattle>|null=null;
 private reviewInputAge=0;private reviewEquipped=-1;private reviewFixture='';private personId='';private mapSelection=0;private screenAge=0;private animFrame=0;private lastSound='';private lastDamage=0;private lastHeavy=0;private screen:Screen='loading';private hits:Hit[]=[];private chapter=0;private page=0;private tab='companions';private runId='';private settled=false;private resultError='';private renderErrors:string[]=[];private first=false;private elapsed=0;private acc=0;private finishAge=0;private touch=-1;private lastX=0;private startX=0;private startY=0;private pressed:Hit|null=null;private loadingError='';private rev=0;private avg=60;private diagAge=0;private frames:number[]=[];private lastSize='';
 private mapScroll=0;private mapExpanded=false;private mapPanelKey='';private mapDragging=false;private lastY=0;private rewardReturn:Screen='home';private reviewReaction:any=null;
 private make(name:string,parent=this.node){const n=new Node(name);n.layer=Layers.Enum.UI_2D;parent.addChild(n);n.addComponent(UITransform);return n;}
 private get size(){const m=this.platform?.windowMetrics;const v=view.getVisibleSize();const W=m?.width||390,H=W*v.height/v.width,k=v.width/W,top=this.isolatedInsets?.top??Math.max(8,m?.safe.top||0),bottom=this.isolatedInsets?.bottom??Math.max(8,(m?.height||H)-(m?.safe.bottom||H));return{W,H,k,top,bottom,capsule:m?.capsule?{x:m.capsule.left,y:m.capsule.top,w:m.capsule.right-m.capsule.left,h:m.capsule.bottom-m.capsule.top}:null};}
 async start(){view.setDesignResolutionSize(720,1280,ResolutionPolicy.FIXED_WIDTH);profiler.hideStats();this.root=this.make('FormalWorld');this.bg=this.make('FormalBackground');this.ui=this.make('FormalInterface');this.paint=new NativePaint(this.root);this.menuLayers=new MenuLayers(this.ui);this.menu=this.menuLayers.fixed;this.safeLayer=new SafeErrorOverlay(this.node);
 const storage={getItem:(k:string)=>typeof wx!=='undefined'&&wx.getStorageSync?wx.getStorageSync(k)||null:(sys.isBrowser?window.localStorage:sys.localStorage).getItem(k),setItem:(k:string,v:string)=>{if(typeof wx!=='undefined'&&wx.setStorageSync)wx.setStorageSync(k,v);else(sys.isBrowser?window.localStorage:sys.localStorage).setItem(k,v);}};
 this.uiSkin=!(DEBUG&&sys.isBrowser&&new URLSearchParams(window.location.search).get('ui-skin')==='legacy');
 this.reviewFixture=DEBUG?(sys.isNative?native.reflection.callStaticMethod('YiluNativeBridge','reviewFixture:','')||'':sys.isBrowser?new URLSearchParams(window.location.search).get('yilu-review')||'':''):'';const fixtureMemory=new Map<string,string>();this.store=new FormalStore(this.reviewFixture?{getItem:k=>fixtureMemory.get(k)??null,setItem:(k,v)=>{if(this.reviewStorageFailures>0){this.reviewStorageFailures--;throw Error('isolated storage write failure');}fixtureMemory.set(k,v);}}:storage);this.platform=new Platform(this.node,()=>{this.cancel();if(this.screen==='battle')this.show('pause');},true);
 input.on(Input.EventType.TOUCH_START,this.down,this);input.on(Input.EventType.TOUCH_MOVE,this.move,this);input.on(Input.EventType.TOUCH_END,this.up,this);input.on(Input.EventType.TOUCH_CANCEL,this.cancel,this);
 (globalThis as any).__YLCG__={snapshot:()=>this.snapshot(),...(DEBUG&&this.reviewFixture?{reviewCommand:(cmd:string,value?:any)=>this.reviewCommand(cmd,value)}:{})};this.show('loading');await this.load();}
 private async load(){try{await Promise.all([NativePaint.load(),PresentationAssets.load(),this.platform.load()]);const gold=PresentationAssets.frame('gold-button');if(gold)NativePaint.textures.ui_gold=gold.texture as any;if(this.disposed)return;this.show('home');if(DEBUG&&this.reviewFixture&&!this.reviewFixtureOpened){this.reviewFixtureOpened=true;this.openReviewFixture();}else if(this.store.data.pendingRewardPresentation&&!this.store.notice){this.rewardReturn='home';this.show('reward');}}catch(e){if(this.disposed)return;this.loadingError=String(e);if(DEBUG)this.bridgeDiagnostics.event('business_error',{message:this.loadingError,scope:'load'});this.show('error');}}
 /** Isolated screenshot fixtures. No persistent storage writes; never active in Release. */
 private openReviewFixture(){
  if(this.reviewFixture==='MUSIC:flow'){this.platform.book.data.settings.music=true;this.platform.book.data.settings.musicVolume=.6;this.platform.syncAudio(false);this.show('home');return;}
  if(this.reviewFixture.startsWith('UI:')){this.openUIFixture();return;}
  if(this.reviewFixture.startsWith('REG:')){this.openRegressionFixture();return;}
  if(this.reviewFixture.startsWith('C20SFX:')){this.openSoundFixture();return;}
  if(this.reviewFixture.startsWith('C20:')){this.openCampaignFixture();return;}
  if(this.reviewFixture.startsWith('SFX:')){this.openSoundFixture();return;}
  if(this.reviewFixture.startsWith('R2:')){this.openPolishFixture();return;}
  const id=this.reviewFixture.split(':')[0],d=this.store.data,n=id==='S01'?10:id==='S02'?9:id==='S03'?7:6;
  for(let i=0;i<n;i++){const c=CHAPTERS[i];d.cleared.push(c.id);d.seen.push(c.boss,...c.enemy,...c.capture,...c.visit,...c.allies);d.captures.push(...c.capture);d.visits.push(...c.visit);d.allies.push(...c.allies);if(c.weapon)d.weapons.push(c.weapon);if(c.treasure)d.treasures.push(c.treasure);}
  d.companions=id==='S02'?['guan','huang']:id==='S03'?['luxun','sunxiang']:id==='S06'?['lubu','xiahou']:['liao','xiahou'];d.support=id==='S02'?'diao':'xun';d.slots={dian:'mengde',qi:'yuxi',ma:'chitu'};
  if(id==='S01'){this.tab='people';this.page=3;if(this.reviewFixture.split(':')[1]&&PEOPLE[this.reviewFixture.split(':')[1]]){this.personId=this.reviewFixture.split(':')[1];this.show('person');}else this.show('collection');return;}
  if(id==='S07'){this.show('chapters');return;}
  this.chapter=id==='S02'?9:id==='S03'?7:6;
  if(id==='S05'||id==='S06'){this.tab='companions';this.page=1;this.show('prepare');return;}
  this.begin();const st=this.battle!.state;st.ents=[];st.course=[];st.dist=st.courseLen+6;st.defeatedOfficerIds=CHAPTERS[this.chapter].enemy.slice();this.battle!.step();
  st.ents=[];st.deltas=[];st.waves=[];st.arrows=[];st.fx=[];st.toasts=[];st.toast=null;st.weapon=id==='S02'?'shuanggu':id==='S03'?'qinggang':'shemao';st.tier=3;st.arms='repeater';st.troops=st.troopShown=97;st.heroX=st.targetX=0;st.atkT=.05;
  if(st.boss){st.boss.phase=(this.reviewFixture.endsWith(':live')?'idle':this.reviewFixture.split(':')[1])||(id==='S03'?'warn':id==='S04'?'rec':'idle');st.boss.pt=.3;st.boss.band=[.2,.9];st.boss.bands=[[.2,.9]];}
  if(!this.reviewFixture.endsWith(':live'))this.battle!.pause(true);
 }
 private at(e:EventTouch){const p=e.getUILocation(),u=this.node.getComponent(UITransform)!,v=u.convertToNodeSpaceAR({x:p.x,y:p.y,z:0} as any),s=this.size;return{x:v.x/s.k+s.W/2,y:s.H/2-v.y/s.k};}
 private down(e:EventTouch){if(this.touch!==-1)return;this.touch=e.getID()??-1;const p=this.at(e);this.lastX=this.startX=p.x;this.startY=this.lastY=p.y;this.mapDragging=false;this.gestureDragged=false;this.pressed=this.hits.find(h=>p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h)||null;this.platform.syncAudio(this.screen==='battle');if(this.uiSkin&&this.screen!=='battle')this.drawMenu();}
 private move(e:EventTouch){if(e.getID()!==this.touch)return;const p=this.at(e);if(this.screen==='battle'&&!this.pressed&&this.battle)this.battle.move(this.battle.state.targetX+(p.x-this.lastX)/(this.size.W*.4));if(['chapters','transition'].includes(this.screen)&&this.startY>this.size.top+72&&this.startY<this.menuMapMetrics().bottom){if(Math.abs(p.y-this.startY)>8)this.mapDragging=true;if(this.mapDragging){this.pressed=null;this.mapScroll=Math.max(0,Math.min(this.menuMapMetrics().maxScroll,this.mapScroll-(p.y-this.lastY)));this.drawMenu();}}if(this.uiSkin&&['prepare','person','item','reward','result','settings','confirm','error','loading'].includes(this.screen)&&this.startY>=this.fullMenu.contentTop&&this.startY<=this.fullMenu.contentBottom&&(this.gestureDragged||Math.hypot(p.y-this.startY,p.x-this.startX)>8)){this.gestureDragged=true;this.pressed=null;this.fullMenu.scrollBy(this.lastY-p.y);this.drawMenu();}this.lastY=p.y;this.lastX=p.x;}
 private up(e:EventTouch){if(e.getID()!==this.touch)return;this.platform.unlockAudio();const p=this.at(e),h=this.pressed,dragged=this.gestureDragged;this.cancel();if(h&&!dragged&&Math.abs(p.x-this.startX)<24&&Math.abs(p.y-this.startY)<24&&p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h){h.action();}else if(this.uiSkin&&this.screen!=='battle')this.drawMenu();}
 private cancel(){this.touch=-1;this.pressed=null;this.battle?.cancel();}
 private button(id:string,title:string,x:number,y:number,w:number,action:()=>void,primary=false,disabled=false){if(this.uiSkin){const r=this.fullMenuButton(id,title,x,y,w,action,primary,disabled);return r;}const p=this.menu;p.fillStyle=primary?'#C9A45C':'#172C40';p.strokeStyle='#8E7549';p.lineWidth=1;if(primary&&NativePaint.textures.ui_gold){const t=NativePaint.textures.ui_gold;p.drawImage('ui_gold',0,0,t.width,t.height,x,y,w,48);}else{p.fillRect(x,y,w,48);p.strokeRect(x,y,w,48);}this.label(title,x+w/2,y+24,primary?18:14,disabled?'#79818A':primary?'#182638':'#F5EFE2','center');if(!disabled)this.hits.push({id,label:title,x,y,w,h:48,action});}
 private fullMenuButton(id:string,title:string,x:number,y:number,w:number,action:()=>void,primary:boolean,disabled:boolean){drawButton(this.menu,{x,y,w,h:48},title,{tone:primary?'gold':'navy',state:disabled?'disabled':this.pressed?.id===id?'pressed':'normal',fontSize:16});if(!disabled)this.hits.push({id,label:title,x,y,w,h:48,action});}
 private label(str:string,x:number,y:number,size=14,col='#F5EFE2',align='left'){const p=this.menu;p.font=`600 ${size}px Arial`;p.fillStyle=col;p.textAlign=align;p.fillText(str,x,y);}
 private title(str:string,sub:string){const s=this.size;this.menu.fillStyle='rgba(15,28,42,.92)';this.menu.fillRect(12,s.top,s.W-24,86);this.label(str,s.W/2,s.top+25,23,'#E6CD93','center');this.label(sub,s.W/2,s.top+61,13,'#D1D4D5','center');}
 private back(action=()=>this.show('home')){const s=this.size;this.button('back','返回',12,s.H-s.bottom-58,76,action);}
 private show(screen:Screen){if(screen!=='render-error')this.safeLayer?.hide();if(DEBUG){this.bridgeDiagnostics.event('screen_enter',{screen,chapter:this.chapter});if(screen==='result')this.bridgeDiagnostics.event('level_end',{chapter:this.chapter,scope:this.reviewFixture||'normal-gameplay',counts:this.battle?.diagnostics.counts});}this.cancel();this.screen=screen;this.screenAge=0;if(screen==='chapters'||screen==='transition'){this.mapSelection=Math.min(CHAPTERS.length-1,screen==='chapters'?this.store.completed:this.chapter+1);this.mapExpanded=false;this.mapScroll=mapScrollFor(screen==='transition'?this.chapter:this.mapSelection,this.menuMapMetrics());}this.rev++;this.battle?.pause(screen!=='battle');this.platform?.syncAudio(screen==='battle');this.platform?.setMusicScene(screen);this.drawMenu();}
 private drawMenu(){if(this.screen==='render-error'){this.showSafeError();return;}if(!this.platform)return;const s=this.size,{W,H,top,bottom,k}=s;this.root.setScale(k,k,1);this.ui.setScale(k,k,1);this.bg.setScale(k,k,1);this.hits=[];try{if(this.menuLayers)this.menuLayers.begin(s);else this.menu.begin(s);this.art.begin();this.root.active=['battle','pause'].includes(this.screen)||(!this.uiSkin&&this.screen==='result');this.bg.active=!this.root.active;
 if(this.bg.active){const key:PresentationKey=this.screen==='home'?'home-bg':this.screen==='chapters'?'map-bg':this.screen==='result'?'result-bg':'camp-bg';this.art.draw(this.bg,'background',key,0,0,W,H,'cover');}
 const footer=H-bottom-58;
 if(this.uiSkin){if(!['home','chapters','transition','battle','pause'].includes(this.screen)){this.menu.fillStyle='rgba(8,18,28,.45)';this.menu.fillRect(0,0,W,H);}this.fullMenu.draw(this as unknown as MenuHost);}else{
 if(this.screen==='loading'){this.title('一路长歌：三国','正在加载战场与人物');}
 if(this.screen==='error'){this.title('资源尚未就绪','加载失败，已保留本机存档');this.button('retry','重新加载',24,footer,W-48,()=>{this.show('loading');this.load();},true);}
 if(this.screen==='home'){
 this.art.draw(this.bg,'home-hero','hero-home',0,35,W*.92,Math.max(260,H*.55),'contain');this.art.draw(this.bg,'brand','brand-title',0,H/2-top-88,W-32,90,'contain');
 const shade=this.menu.createLinearGradient();shade.addColorStop(0,'rgba(14,27,41,0)');shade.addColorStop(.3,'rgba(14,27,41,.90)');shade.addColorStop(1,'rgba(14,27,41,.98)');this.menu.fillStyle=shade;this.menu.fillRect(0,H-280,W,280);this.menu.fillStyle='rgba(14,27,41,.85)';this.menu.fillRect(12,top,W-82,48);this.label(this.campaignRank()+' · '+(this.store.completed===CHAPTERS.length?'二十关已贯通':CHAPTERS[this.store.completed].faction+'征程'),20,top+20,15,'#E6CD93');
 this.button('settings','设',W-62,top+4,50,()=>this.show('settings'));this.label(this.store.completed===CHAPTERS.length?'重游故地，再聚同袍':'下一站 · '+CHAPTERS[this.store.completed].title,W/2,H-203,20,'#F5EFE2','center');
 this.button('start',this.store.completed===CHAPTERS.length?'重游征程':'开始征程',20,H-176,W-40,()=>{this.chapter=Math.min(CHAPTERS.length-1,this.store.completed);this.tab='companions';this.page=0;this.show('prepare');},true);
 this.button('chapters','征 程',20,H-116,(W-52)/2,()=>this.show('chapters'));this.button('collection','图 鉴',32+(W-52)/2,H-116,(W-52)/2,()=>{this.tab='people';this.page=0;this.show('collection');});
 }
 if(this.screen==='chapters'||this.screen==='transition')this.drawMap();
 if(this.screen==='person')this.drawPerson();
 if(this.screen==='prepare'||this.screen==='collection'){
 const prep=this.screen==='prepare',tabs=prep?['companions','support','treasures','weapons']:['people','weapons','treasures'];if(!tabs.includes(this.tab))this.tab=tabs[0];this.title(prep?CHAPTERS[this.chapter].title:'军中图鉴',prep?'敌将 '+PEOPLE[CHAPTERS[this.chapter].boss]+' · 匣内 '+Array.from(new Set(routeFor(this.chapter,this.store.loadout().weapons,[],this.store.loadout().startWeaponId).filter(e=>e.kind==='weapon').map(e=>WEAPON_DATA[e.gives as WeaponId].label))).join(' / '):'收服同行 · 寻访支援 · 盟约共鸣');
 const tw=(W-24-8*(tabs.length-1))/tabs.length;tabs.forEach((id,i)=>this.button('tab-'+id,({companions:'随军',support:'支援',treasures:'宝物',people:'人物',weapons:prep?'出征兵器':'兵器'} as any)[id],12+i*(tw+8),top+96,tw,()=>{this.tab=id;this.page=0;this.drawMenu();},this.tab===id));
 let rows:{id:string;label:string;detail:string;action:()=>void;disabled?:boolean}[]=[];
 if(this.tab==='companions'){rows=this.store.data.captures.map(id=>({id:'comp-'+id,label:(this.store.data.companions.includes(id)?'✓ ':'')+PEOPLE[id],detail:'收 · 随军',action:()=>{this.store.equipCompanion(id);this.drawMenu();}}));}
 if(this.tab==='support'){rows=this.store.data.visits.map(id=>({id:'support-'+id,label:(this.store.data.support===id?'✓ ':'')+PEOPLE[id],detail:id==='hua'?'减员后救回伤兵':['diao','xun','sunjian'].includes(id)?'每12秒鼓舞 +2':'每12秒自动策应',action:()=>{this.store.equipSupport(id);this.drawMenu();},disabled:this.store.completed<2}));}
 if(this.tab==='treasures'){rows=Object.entries(TREASURES).map(([id,t])=>{const owned=this.store.data.treasures.includes(id);return{id:'treasure-'+id,label:(this.store.data.slots[t.slot]===id?'✓ ':'')+t.name,detail:owned?t.effect:'未获得 · '+({dian:'典籍',qi:'器物',ma:'坐骑'}[t.slot]),action:()=>{this.store.equipTreasure(id);this.drawMenu();},disabled:!owned||!this.store.slotOpen(t.slot)};});}
 if(this.tab==='people')this.drawPeopleGrid(top+154,footer);
 if(this.tab==='weapons'){rows=Object.entries(WEAPON_DATA).map(([id,w])=>{const owned=this.store.data.weapons.includes(id),lv=this.store.data.weaponLevels[id]||1;return{id:(prep?'select-':'upgrade-')+id,label:(prep&&this.store.loadout().startWeaponId===id?'✓ ':'')+w.label+' · 永久 Lv.'+lv,detail:owned?(prep?'本局出征Ⅰ阶 · '+(w.owner?PEOPLE[w.owner]+'本主兵器':'贯阵光波'):(lv>=5?'已满级':'升级需 '+TUNING.upgradeCost(lv)+' 军功 · 现有 '+this.store.data.xp)):'第'+(CHAPTERS.findIndex(c=>c.weapon===id)+1)+'关首通获得',action:()=>{if(prep)this.store.selectWeapon(id);else this.store.upgrade(id);this.drawMenu();},disabled:!owned||(!prep&&(lv>=5||this.store.data.xp<TUNING.upgradeCost(lv)))};});}
 if(this.tab!=='people'){
  const layout=prepareLayout(W,H,top,bottom),first=top+154;
  const count=prep?layout.rows:Math.max(2,Math.min(6,Math.floor((footer-first-52)/60))),pages=Math.max(1,Math.ceil(rows.length/count));this.page=Math.min(this.page,pages-1);
  rows.slice(this.page*count,(this.page+1)*count).forEach((r,i)=>{
   const y=first+i*60;this.card(16,y,W-32,54,r.disabled?'muted':'normal');this.label(r.label,28,y+17,14,r.disabled?'#A7AEB2':'#E6CD93');
   this.label(r.detail,28,y+37,Math.min(12,(W-58)/Math.max(1,r.detail.length)),r.disabled?'#A7AEB2':'#D4D6D2');
   if(!r.disabled){this.label('›',W-31,y+25,20,'#C9A45C','center');this.hits.push({id:r.id,label:r.label,x:16,y,w:W-32,h:54,action:r.action});}
  });
  if(!rows.length){this.card(16,first,W-32,66,'muted');this.label(this.tab==='support'?'第二关寻访华佗后开放支援':'通关后可邀请同袍同行',W/2,first+25,14,'#E6CD93','center');this.label('主将已整装，可直接出征',W/2,first+46,12,'#B7C0C6','center');}
  if(pages>1)this.pager(pages,prep?first+count*60+2:footer-48);
  if(prep)this.drawPreparation(layout.y,layout.h);
 }
 this.back();if(prep)this.button('depart','出 征',100,footer,W-116,()=>this.begin(),true);
 else this.label(this.tab==='weapons'?'永久等级 · 局内阶位每局重置':this.tab==='people'?'点选人物 · 查看经历与能力':'已获宝物可在整备时佩戴',W-15,footer+24,11,'#E6CD93','right');
 }
 if(this.screen==='battle'){this.hits.push({id:'pause',x:4,y:top,w:48,h:48,action:()=>this.show('pause')});}
 if(this.screen==='pause'){
 this.menu.fillStyle='rgba(9,19,30,.8)';this.menu.fillRect(0,0,W,H);this.title('暂 歇','松开手指后可继续出征');this.button('continue','继续战斗',32,H*.43,W-64,()=>this.show('battle'),true);this.button('restart','重新挑战',32,H*.43+64,W-64,()=>this.begin());this.button('quit','返回营地',32,H*.43+128,W-64,()=>this.show('home'));
 }
 if(this.screen==='result')this.drawResult();
 if(this.screen==='reward')this.drawReward();
 if(this.screen==='settings'){this.title('行军设置','山河长歌 · 音乐与音效独立');const b=this.platform.book;this.button('sfx','音效 · '+(b.data.settings.sfx?'开':'关'),24,top+130,W-48,()=>{b.data.settings.sfx=!b.data.settings.sfx;b.persist();this.platform.syncAudio(false);this.battle?.clearAudioEvents();this.drawMenu();});this.button('vibration','震动 · '+(b.data.settings.vibration?'开':'关'),24,top+195,W-48,()=>{b.data.settings.vibration=!b.data.settings.vibration;b.persist();this.drawMenu();});this.button('music','音乐 · '+(b.data.settings.music?'开':'关'),24,top+260,W-48,()=>{b.data.settings.music=!b.data.settings.music;b.persist();this.platform.syncAudio(false);this.drawMenu();});this.back();}
 }
 if(!this.uiSkin&&this.store.notice){this.menu.fillStyle='#722B22';this.hits=[];this.menu.fillRect(0,H-110-bottom,W,110);this.label('保存未完成：请重试，当前进度仍保留',W/2,H-89-bottom,12,'#fff','center');this.button('retry-save','重试保存',W/2-52,H-68-bottom,104,()=>{if(this.store.retry()&&this.store.data.pendingRewardPresentation){this.rewardReturn=this.screen==='result'?'result':'home';this.show('reward');}else this.drawMenu();});}
 if(this.menuLayers)this.menuLayers.commit();else this.menu.end();this.art.end();}catch(error){this.hits=[];this.menuLayers?.abort();this.menu.abortFrame();this.art.begin();this.art.end();this.enterRenderError(error,'menu');return;}if(sys.isNative)native.reflection.callStaticMethod('YiluNativeBridge','syncButtons:',JSON.stringify({width:W,height:H,buttons:[...this.hits.map(({id,label,x,y,w,h})=>({id,label:label||({pause:'暂停战斗'} as any)[id]||id,x,y,w,h})),...(this.screen==='battle'?[-.78,-.48,0,.48,.78].map(lane=>({id:lane<-.6?'move-far-left':lane<0?'move-left':lane>.6?'move-far-right':lane>0?'move-right':'move-center',label:lane<-.6?'向左侧闪避':lane<0?'向左路走位':lane>.6?'向右侧闪避':lane>0?'向右路走位':'向中路走位',x:W/2-20,y:H*.85-20,w:40,h:40,lane})):[])]}));}
 private paragraph(value:string,x:number,y:number,width:number,size=13,color='#E7E0D3'){const max=Math.max(8,Math.floor(width/size));let lines=0;for(const part of value.split('\n'))for(let i=0;i<part.length;i+=max){this.label(part.slice(i,i+max),x,y+lines*(size+7),size,color);lines++;}return lines*(size+7);}
 private relation(id:string){const d=this.store.data;return d.captures.includes(id)?'收':d.visits.includes(id)?'访':d.allies.includes(id)?'盟':d.seen.includes(id)?'遇':'未遇';}
 private portrait(id:string,x:number,y:number,h:number,unknown=false){const candidates=['c20_char_'+id+'_run','g_portrait_'+id];const key=candidates.find(k=>MANIFEST.frames[k]);if(key)this.menu.frame(key,x,y,h,{refH:MANIFEST.frames[key].bh||MANIFEST.frames[key].r[3],tint:unknown?'#293744':undefined});}
 private campaignRank(){return this.store.completed===CHAPTERS.length?'九州长歌':MILESTONES.filter(m=>m.chapter<=this.store.completed).slice(-1)[0]?.title||'初出乡关';}
 private drawMap(){
  const {W,H,top,bottom}=this.size,p=this.menu,m=this.menuMapMetrics(),transition=this.screen==='transition',conquest=transition&&this.first&&!this.fullMenu.reducedMotion;
  if(transition&&!this.fullMenu.reducedMotion&&!this.mapDragging&&this.screenAge<1.2){const a=mapScrollFor(this.chapter,m),b=mapScrollFor(this.mapSelection,m),t=Math.min(1,this.screenAge/.5);this.mapScroll=a+(b-a)*(t*t*(3-2*t));}
  this.mapScroll=Math.max(0,Math.min(m.maxScroll,this.mapScroll));const panels=visibleMapPanels(this.mapScroll,m),key=panels.join(',');if(key!==this.mapPanelKey){this.mapPanelKey=key;NativePaint.loadMapPanels(panels).then(()=>{if(!this.disposed&&['chapters','transition'].includes(this.screen))this.drawMenu();}).catch(e=>{this.loadingError=String(e);});}
  p.fillStyle='#CCD1BA';p.fillRect(0,m.y,W,m.height);
  for(const i of panels){const f=MANIFEST.frames['c20_map_'+i];if(!f||!NativePaint.textures[f.s])continue;const py=m.y+i*m.panel-this.mapScroll,lo=Math.max(m.y,py),hi=Math.min(m.bottom,py+m.panel);if(hi<=lo)continue;const fy=(lo-py)/m.panel,fh=(hi-lo)/m.panel;p.drawImage(f.s,f.r[0],f.r[1]+fy*f.r[3],f.r[2],fh*f.r[3],0,lo,W,hi-lo);}
  for(let i=0;i<CHAPTERS.length;i++){
   const a=mapPosition(i,m,W),y=m.y+a.y-this.mapScroll,cleared=this.store.data.cleared.includes(CHAPTERS[i].id),open=this.store.unlocked(i),current=i===Math.min(CHAPTERS.length-1,this.store.completed),milestone=milestoneFor(i);
   if(i>0&&this.store.data.cleared.includes(CHAPTERS[i-1].id)){const prev=mapPosition(i-1,m,W);for(const [fi,foot] of marchPath(prev,a).entries()){if(conquest&&i===this.chapter+1&&fi/12>Math.max(0,(this.screenAge-.7)/.5))continue;const yy=m.y+foot.y-this.mapScroll;if(yy>m.y+4&&yy<m.bottom-4){p.fillStyle='#92743F';p.beginPath();p.ellipse(foot.x,yy,1.4,2.4,.2,0,Math.PI*2);p.fill();}}}
   if(y<m.y-45||y>m.bottom+45)continue;
   if(!open||(conquest&&i===this.chapter+1&&this.screenAge<1.2)){p.globalAlpha=open?Math.max(0,1-(this.screenAge-.65)/.55):1;const fog=p.createLinearGradient();fog.addColorStop(0,'rgba(224,229,219,0)');fog.addColorStop(.5,'rgba(224,229,219,.78)');fog.addColorStop(1,'rgba(224,229,219,0)');p.fillStyle=fog;p.fillRect(0,y-55,W,106);p.globalAlpha=1;}
   const site=milestone?'pass':['camp','city','water','pass'][i%4];p.frame('c20_site_'+site,a.x,y+12,milestone?86:71,{alpha:open?1:.54});
   const justTaken=conquest&&i===this.chapter,flagAt=justTaken?Math.max(0,Math.min(1,(this.screenAge-.45)/.3)):1;if(justTaken&&flagAt<1)p.frame('c20_flag_locked',a.x+27,y-13,32,{alpha:1-flagAt});p.frame('c20_flag_'+(cleared?'done':current?'current':open?'open':'locked'),a.x+27,y-13+(1-flagAt)*14,32,{alpha:(open?1:.65)*flagAt});
   if(current){p.frame('g_run_spear0',a.x-33,y+22,39,{alpha:this.uiSkin?1:.88+.12*Math.sin(this.screenAge*3)});}
   if(cleared&&milestone&&(!justTaken||this.screenAge>.75))p.frame('c20_stamp_'+(i+1)/2,a.x-29,y-20,26,{center:true});
   if(y>m.y+20&&y<m.bottom-35){p.fillStyle=i===this.mapSelection?'rgba(22,38,49,.95)':'rgba(243,235,211,.93)';p.fillRect(a.x-66,y+16,132,29);this.label((i+1)+' · '+CHAPTERS[i].place,a.x,y+30,14,i===this.mapSelection?'#F0DFB8':'#352E25','center');
    this.hits.push({id:'level'+i,label:CHAPTERS[i].title+(open?'':'未至'),x:a.x-66,y:y-34,w:132,h:80,action:()=>{this.mapSelection=i;this.drawMenu();}});}
  }
  // A light measured chrome, independent from the retained five terrain panels.
  p.fillStyle='#122639';p.fillRect(0,0,W,m.y);
  if(this.uiSkin){
   const r=inset(drawCompactPanel(p,{x:12,y:top,w:W-24,h:m.y-top-8},'raised').content,8);
   const titleH=this.menuText('天下征程',{x:68,y:r.y,w:W-136,h:m.y-top-46},22,'#E6CD93','center');
   const progressH=this.menuText('征程进度 · '+this.store.completed+'/20',{x:r.x,y:r.y+titleH+1,w:r.w,h:20},13);
   const next=MILESTONES.find(v=>v.chapter>this.store.completed);this.menuText(next?'下一未领里程碑 · 第'+next.chapter+'关 '+next.title:'全部里程碑已领取',{x:r.x,y:r.y+titleH+progressH+2,w:r.w,h:m.y-top-titleH-progressH-46},12);
  }else{this.label('天下征程',W/2,top+18,21,'#E6CD93','center');this.label('已克 '+this.store.completed+'/'+CHAPTERS.length,W/2,top+40,12,'#D4D8CF','center');this.label(nextMilestoneHint(this.store.completed),W/2,top+60,11,'#D4D8CF','center');}
  this.hits.push({id:'map-back',label:'返回营地',x:0,y:top,w:52,h:48,action:()=>this.show('home')});this.label('‹',24,top+23,25);this.hits.push({id:'map-current',label:'回到当前',x:W-64,y:top,w:64,h:48,action:()=>{this.mapSelection=Math.min(CHAPTERS.length-1,this.store.completed);this.mapScroll=mapScrollFor(this.mapSelection,m);this.drawMenu();}});this.label('定位',W-32,top+24,12,'#E6CD93','center');
  const c=CHAPTERS[this.mapSelection],dy=m.bottom,owned=this.store.data.cleared.includes(c.id),available=this.store.unlocked(this.mapSelection);p.fillStyle='rgba(14,29,42,.98)';p.fillRect(0,dy,W,H-dy);
  const r=inset(drawCompactPanel(p,{x:12,y:dy+4,w:W-24,h:H-dy-bottom-66},'normal').content,8);
  this.menuText('当前选择 · 第'+(this.mapSelection+1)+'关 '+c.place,{x:r.x,y:r.y,w:r.w-72,h:24},16,'#E6CD93');
  this.menuText(chapterThreats(this.mapSelection),{x:r.x,y:r.y+28,w:r.w,h:24},13);
  const main=c.weapon?WEAPON_DATA[c.weapon].label:c.treasure?TREASURES[c.treasure].name:PEOPLE[c.boss];this.menuText((owned?'已获 · ':'首胜 · ')+main,{x:r.x,y:r.y+55,w:r.w,h:20},13,'#CFC1A1');
  this.label(this.mapExpanded?'收起 ▾':'详情 ▴',W-46,r.y+11,12,'#D1C5A8','center');this.hits.push({id:'map-detail',label:'展开关卡详情',x:W-78,y:dy+5,w:66,h:48,action:()=>{this.mapExpanded=!this.mapExpanded;this.drawMenu();}});
  if(this.mapExpanded){const rewards=[...c.capture.map(id=>'收 '+PEOPLE[id]),...c.visit.map(id=>'访 '+PEOPLE[id]),...c.allies.map(id=>'盟 '+PEOPLE[id]),c.treasure?TREASURES[c.treasure].name:''].filter(Boolean).join(' · ');this.menuText(rewards,{x:r.x,y:r.y+83,w:r.w,h:Math.max(56,r.h-83)},13);
   if(this.store.completed===CHAPTERS.length){const orders=[null,'elite','few-supplies','double-officers'],labels=['常规','精兵','少援','双将'],at=orders.indexOf((this.store.data.replayOrder as string)||null);this.menuText('重游军令 · '+labels[Math.max(0,at)]+'  ›',{x:r.x,y:r.y+145,w:r.w,h:22},14,'#E6CD93');this.hits.push({id:'replay-order',label:'切换重游军令',x:16,y:r.y+127,w:W-32,h:48,action:()=>{this.store.setReplayOrder(orders[(at+1)%orders.length]);this.drawMenu();}});}else this.menuText('架空征程示意 · '+mapPanelNames[Math.floor(this.mapSelection/4)],{x:r.x,y:r.y+145,w:r.w,h:22},12);
  }
  this.button(transition?'prepare-next':'map-depart',available?'整备出征':'先通关第'+this.mapSelection+'关',16,H-bottom-56,W-32,()=>{this.chapter=this.mapSelection;this.tab='companions';this.page=0;this.show('prepare');},true,!available);
 }
 private card(x:number,y:number,w:number,h:number,tone='normal'){
  if(this.uiSkin){drawPanel(this.menu,{x,y,w,h},tone==='muted'?'muted':tone==='gold'?'raised':'normal');return;}const p=this.menu;p.fillStyle=tone==='muted'?'rgba(20,34,47,.83)':'rgba(17,33,48,.96)';p.fillRect(x,y,w,h);
  p.strokeStyle=tone==='gold'?'#BA985B':'rgba(169,150,112,.55)';p.lineWidth=1;p.strokeRect(x+.5,y+.5,w-1,h-1);
  p.fillStyle=tone==='gold'?'#C9A45C':'#776E57';p.fillRect(x+10,y,Math.min(30,w-20),2);
 }
 private pager(pages:number,y:number){const W=this.size.W;for(const [id,label,dx,delta] of [['prev-page','‹',-81,-1],['next-page','›',45,1]] as const){this.card(W/2+dx,y,36,28);this.label(label,W/2+dx+18,y+14,19,'#E6CD93','center');this.hits.push({id,label,x:W/2+dx,y,w:36,h:28,action:()=>{this.page=(this.page+pages+delta)%pages;this.drawMenu();}});}this.label((this.page+1)+' / '+pages,W/2,y+14,12,'#E6CD93','center');}
 private lock(x:number,y:number){const p=this.menu;p.strokeStyle='#B7B3A6';p.lineWidth=1.5;p.beginPath();p.arc(x,y-3,4,Math.PI,Math.PI*2);p.stroke();p.fillStyle='#B7B3A6';p.fillRect(x-6,y-3,12,10);p.fillStyle='#253747';p.fillRect(x-1,y,2,4);}
 private figure(id:string,x:number,y:number,w:number,h:number,unknown=false){
  const key=['c20_char_'+id+'_run','g_detail_'+id,'g_front_'+id+'Run0','g_boss_'+id+'_idle',...(id==='lubu'?['g_lubuIdle']:[])].find(k=>MANIFEST.frames[k]);
  if(!key)return;const f=MANIFEST.frames[key],scale=Math.min(w/f.r[2],h/f.r[3]);
  this.menu.frame(key,x,y,f.r[3]*scale,{refH:f.r[3],tint:unknown?'#364753':undefined});
 }
 private drawPreparation(y:number,h:number){
  const {W}=this.size,p=this.menu,load=this.store.loadout(),selected=load.startWeaponId as WeaponId;
  this.card(14,y,W-28,h,'gold');this.label(this.store.data.weaponSelectionIntro?'出征兵器现可自由选择':'行军编组',26,y+17,12,'#B9B9AF');if(this.store.data.weaponTrialPrevious&&this.store.data.weaponTrialPrevious!==selected){this.label('恢复原兵器',W-26,y+17,12,'#E6CD93','right');this.hits.push({id:'restore-weapon',label:'恢复原兵器',x:W-116,y,w:104,h:44,action:()=>{const previous=String(this.store.data.weaponTrialPrevious);this.store.data.weaponTrialPrevious=null;this.store.selectWeapon(previous);this.drawMenu();}});}else this.label(this.campaignRank(),W-26,y+17,12,'#E6CD93','right');
  const visual=resolveWeaponPresentation(selected,'run',load.treasures.ma),box={x:26,y:y+32,w:88,h:86},bounds=presentationBounds(visual,75,150),scale=Math.min(box.w/bounds.w,box.h/bounds.h);
  drawWeaponPresentation(p.frame.bind(p),visual,box.x+(box.w-bounds.w*scale)/2-bounds.x*scale,box.y+(box.h-bounds.h*scale)/2-bounds.y*scale,75*scale,150*scale);
  const lv=this.store.data.weaponLevels[selected]||1;
  this.label(WEAPON_DATA[selected].label,125,y+43,15,'#E6CD93');this.label('永久等级 Lv.'+lv+' · 伤害 +'+Math.round((lv-1)*TUNING.weaponLevelDamage*100)+'%',125,y+63,12,'#E6CD93');this.label('本局出征 Ⅰ阶 · 蓝披风主将',125,y+81,12,'#BDC9CD');
  this.label('选择兵器 ›',125,y+109,12,'#E6CD93');this.hits.push({id:'choose-weapon',label:'选择兵器',x:125,y:y+89,w:W-152,h:35,action:()=>{this.tab='weapons';this.page=Math.floor(Object.keys(WEAPON_DATA).indexOf(selected)/prepareLayout(W,this.size.H,this.size.top,this.size.bottom).rows);this.drawMenu();}});
  const sy=y+125;this.label('随军 '+(load.companions.map(id=>PEOPLE[id]).join('、')||'未编入'),28,sy,12,'#E6CD93');this.label('支援 '+(PEOPLE[load.support||'']||'未编入'),28,sy+19,12,'#B5BEC4');
  const ty=sy+30;this.card(24,ty,W-48,40,'gold');this.label('兵法 · '+(load.tactic==='zhenjun'?'震军':'贯阵'),36,ty+14,14,'#E6CD93');this.label(load.tactic==='zhenjun'?'光波震退敌军，打断其推进':'光波贯穿敌阵，保持正面火力',36,ty+29,11,'#D4D6D2');this.label('切换 ›',W-35,ty+14,11,'#C6B27F','right');this.hits.push({id:'tactic',label:'切换兵法',x:24,y:ty,w:W-48,h:40,action:()=>{this.store.equipTactic();this.drawMenu();}});
  const slotY=ty+48,sw=(W-64)/3;(['dian','qi','ma'] as Slot[]).forEach((slot,i)=>{const id=load.treasures[slot],open=this.store.slotOpen(slot),x=24+i*(sw+8),name={dian:'典籍',qi:'器物',ma:'坐骑'}[slot];this.card(x,slotY,sw,63,id?'gold':'muted');this.label(name,x+8,slotY+12,10,'#BFC3BE');if(id){p.frame(TREASURES[id].icon,x+sw/2,slotY+30,24,{center:true});this.label(TREASURES[id].name,x+sw/2,slotY+51,10,'#F0DFB8','center');}else{if(!open)this.lock(x+sw/2,slotY+28);else this.label('＋',x+sw/2,slotY+29,20,'#8C999F','center');this.label(open?'未佩戴':'第'+({dian:1,qi:2,ma:3}[slot])+'关首通解锁',x+sw/2,slotY+51,10,'#B9C0C2','center');}this.hits.push({id:'slot-'+slot,label:name+'配置',x,y:slotY,w:sw,h:63,action:()=>{this.tab='treasures';this.page=0;this.drawMenu();}});});
 }
 private drawPeopleGrid(y:number,footer:number){
  const {W}=this.size,available=footer-y-54,rows=3,per=rows*2,ids=Object.keys(PEOPLE),pages=Math.ceil(ids.length/per),gap=10,w=(W-42)/2,h=Math.min(176,(available-(rows-1)*gap)/rows);this.page=Math.min(this.page,pages-1);
  ids.slice(this.page*per,(this.page+1)*per).forEach((id,i)=>{const x=16+(i%2)*(w+gap),yy=y+Math.floor(i/2)*(h+gap),rel=this.relation(id),known=rel!=='未遇';
   this.card(x,yy,w,h,known?'normal':'muted');this.menu.fillStyle=known?'rgba(201,164,92,.10)':'rgba(8,18,27,.25)';this.menu.fillRect(x+5,yy+25,w-10,h-54);
   this.figure(id,x+w/2,yy+h-29,w-14,Math.min(h-58,(w-14)/1.55),!known);this.menu.fillStyle=known?'#80673D':'#334451';this.menu.fillRect(x+7,yy+7,known?23:36,19);this.label(rel,x+(known?18.5:25),yy+16.5,10,'#F0DFB8','center');
   this.label(known?PEOPLE[id]:'未遇之人',x+w/2,yy+h-14,13,known?'#E6CD93':'#9CA8AF','center');this.hits.push({id:'person-'+id,label:known?PEOPLE[id]:'未遇之人',x,y:yy,w,h,action:()=>{this.personId=id;this.show('person');}});
  });this.pager(pages,footer-42);
 }
 private drawPerson(){
  const {W,H,top,bottom}=this.size,id=this.personId,info=PERSON_PROFILES[id],rel=this.relation(id),known=rel!=='未遇',footer=H-bottom-58;
  this.title(known?PEOPLE[id]+(info[0]?' · '+info[0]:''):'未遇之人',known?info[1]+' · '+({收:'收服同行',访:'寻访支援',盟:'盟约之主',遇:'已遇见'} as any)[rel]:'循征程前行，再会天下英杰');
  const c=CHAPTERS.find(c=>c.boss===id||c.enemy.includes(id)||c.capture.includes(id)||c.visit.includes(id)||c.allies.includes(id))!,idx=CHAPTERS.indexOf(c),portraitH=Math.min(216,Math.max(104,(footer-top-328))),y0=top+100;
  this.card(16,y0,W-32,portraitH+28,'gold');this.menu.fillStyle='rgba(201,164,92,.07)';this.menu.fillRect(22,y0+6,W-44,portraitH+16);this.figure(id,W/2,y0+portraitH+17,W*.56,portraitH,!known);
  this.label(rel,30,y0+22,15,'#E6CD93');this.label(c.faction+'篇',W-30,y0+22,12,'#C9C3B3','right');
  const y=y0+portraitH+39;this.card(16,y,W-32,footer-y-12);this.label('相逢 · 第'+(idx+1)+'关 '+(this.store.unlocked(idx)?c.title:c.faction+'篇'),28,y+19,13,'#E6CD93');
  let yy=y+45;yy+=this.paragraph(known?personRole(id):'人物剪影 · 继续推进可揭示身份',28,yy,W-56,13)+10;
  if(c.capture.includes(id)&&id!==c.boss&&!c.enemy.includes(id))yy+=this.paragraph('归附条件：击破本关统帅',28,yy,W-56,12)+8;
  if(known){const owner=Object.entries(WEAPON_DATA).find(([,w])=>w.owner===id);if(owner)yy+=this.paragraph('共鸣兵器：'+owner[1].label+' · '+(this.store.data.weapons.includes(owner[0])?'已入池':'未入池'),28,yy,W-56,12)+8;this.paragraph(info[2]+' · '+info[3],28,yy,W-56,12,'#BEC5C6');}
  this.back(()=>this.show('collection'));if(rel==='收'||rel==='访')this.button('person-equip',rel==='收'?(this.store.data.companions.includes(id)?'移出随军':'编入随军'):(this.store.data.support===id?'移出支援':'编入支援'),100,footer,W-116,()=>{if(rel==='收')this.store.equipCompanion(id);else this.store.equipSupport(id);this.drawMenu();},true);else this.label(rel==='盟'?'盟约常驻 · 无需上阵':'继续征程，期待再会',W-16,footer+24,13,'#C9B98E','right');
 }
 private rewardArt(item:RewardItem,x:number,y:number,h:number,animated=false){
  if(item.kind==='person'){
   const key='c20_char_'+item.id+'_'+(animated&&this.screenAge>1&&this.screenAge<1.8?'rel':'run');if(MANIFEST.frames[key])this.menu.frame(key,x,y,h,{refH:MANIFEST.frames[key].r[3]});else this.figure(item.id,x,y,h*1.2,h);return;
  }
  const key=item.kind==='weapon'?(MANIFEST.frames['c20_icon_'+item.id]?'c20_icon_'+item.id:'g_icon_'+item.id):item.kind==='treasure'?TREASURES[item.id]?.icon:'c20_stamp_'+Number(item.id.replace('badge_m',''));
  if(key)this.menu.frame(key,x,y,h,{center:true});
 }
 private drawReward(){
  const r=this.store.data.pendingRewardPresentation;if(!r){this.show(this.rewardReturn);return;}const {W,H,top,bottom}=this.size,p=this.menu,age=this.screenAge;
  p.fillStyle='rgba(12,26,39,.95)';p.fillRect(0,0,W,H);this.title(r.kind==='migration'?'征程更新':r.title,r.kind==='milestone'?(r.chapter===9?'上篇 · 半壁已定，下篇已经开启':r.chapter===19?'二十关贯通 · 九州长歌':'双关里程碑 · 军旗立起'):'成长已可靠存盘');
  if(r.kind==='migration'){this.label('已补齐 '+r.backfilled+' 座里程碑',W/2,H*.38,22,'#E6CD93','center');this.label('新军功 +'+r.xp+' · 原收藏与配装保留',W/2,H*.45,14,'#DFDDCE','center');this.label('出征前可选择已拥有兵器',W/2,H*.52,14,'#DFDDCE','center');}
  else{
   const primary=r.items.find(i=>i.kind==='weapon'&&i.isNew)||r.items.find(i=>i.kind==='person'&&i.isNew)||r.items.find(i=>i.kind==='treasure'&&i.isNew)||r.items[0];
   const y=top+126,stageH=Math.max(100,Math.min(210,(H-top-bottom-390)*.55)),t=Math.min(1,age/.65);p.globalAlpha=t;
   if(primary){this.rewardArt(primary,W/2,y+(primary.kind==='person'?stageH:stageH*.52),stageH*t,true);this.label(rewardLabel(primary),W/2,y+stageH+28,22,'#F1DEAC','center');const description=primary.kind==='person'?(primary.relation+' · '+personRole(primary.id)):primary.kind==='weapon'?'已入兵器册 · 整备可选择，下关即可出征':primary.kind==='treasure'?TREASURES[primary.id].effect:'唯一征程印章';this.paragraph(description,24,y+stageH+55,W-48,13,'#D9DDD6');}
   p.globalAlpha=1;if(r.kind==='milestone'){const rise=Math.min(1,age/.7);p.frame('c20_flag_done',38,y+54+(1-rise)*30,66,{alpha:rise});p.frame('c20_stamp_'+(r.chapter+1)/2,W-41,y+24,39,{center:true,alpha:Math.max(0,Math.min(1,(age-.8)/.25))});}
   const rest=r.items.filter(i=>i!==primary),rowY=Math.min(H-bottom-255,y+stageH+105),cols=Math.min(4,Math.max(1,rest.length)),cell=(W-32)/cols;
   rest.forEach((item,i)=>{const x=16+cell*(i%cols+.5),ry=rowY+Math.floor(i/cols)*80;this.rewardArt(item,x,ry+16,29);this.label(rewardLabel(item),x,ry+38,11,'#E7D3A5','center');this.label(item.isNew?'新获得':'已拥有',x,ry+53,10,'#AEBBBE','center');});
   this.label('军功 +'+r.xp+' · '+(r.kind==='milestone'?'征程印章已收藏':'永久收藏已入库'),W/2,H-bottom-101,13,'#E6CD93','center');
  }
  this.button('reward-done',age<presentationDuration(r)?'跳过演出 · 全部收下':'全部收下',24,H-bottom-65,W-48,()=>{if(this.store.acknowledgePresentation())this.show(this.rewardReturn);else this.drawMenu();},true,!canSkipPresentation(age));
 }
 private drawResult(){
  const {W,H,top,bottom}=this.size,footer=H-bottom-58,st=this.battle!.state,won=st.troops>0,c=CHAPTERS[this.chapter],p=this.menu;
  p.fillStyle='rgba(9,19,30,.94)';p.fillRect(0,0,W,H);this.title(won?'胜利 · '+c.place:'失败',won?(this.chapter===CHAPTERS.length-1?'九州长歌 · 二十关贯通':nextMilestoneHint(this.chapter+1)):'第'+(this.chapter+1)+'关 · '+c.place+' · 进度与收藏保留');
  this.card(16,top+100,W-32,62,'gold');this.label('剩余兵力 '+Math.round(st.troops),28,top+125,19,'#F0DFB8');this.label(this.campaignRank(),W-28,top+146,12,'#E6CD93','right');
  const ry=top+176;this.card(16,ry,W-32,Math.max(115,footer-ry-156));
  this.label(won?'本次成长':'本局战损',28,ry+21,16,'#E6CD93');
  const gain=won?Number(this.store.data.lastRewardXP||0):Number(this.store.data.lastPracticeXP||0);this.label('军功 +'+gain+' · 累计 '+this.store.data.xp,28,ry+48,14);
  let yy=ry+77;
  if(won){const names=[...c.capture.map(x=>'收 '+PEOPLE[x]),...c.visit.map(x=>'访 '+PEOPLE[x]),...c.allies.map(x=>'盟 '+PEOPLE[x]),c.weapon?WEAPON_DATA[c.weapon].label:'',c.treasure?TREASURES[c.treasure].name:''].filter(Boolean);yy+=this.paragraph(this.first?names.join(' · '):'重游完成 · 首通收藏不重复授予',28,yy,W-56,13);}
  else yy+=this.paragraph(resultLossSummary(this.battle!.snapshot().damageSources),28,yy,W-56,13);
  if(won&&c.weapon){this.button('try-weapon','下关试用兵器',24,footer-116,(W-60)/2,()=>{this.store.data.weaponTrialPrevious=this.store.data.selectedWeaponId;if(this.store.selectWeapon(c.weapon!)){this.chapter=Math.min(CHAPTERS.length-1,this.chapter+1);this.tab='weapons';this.page=0;this.show('prepare');}},false);this.button('view-reward','整备查看',36+(W-60)/2,footer-116,(W-60)/2,()=>{this.tab=c.capture.length?'companions':'treasures';this.show('prepare');});}
  else if(won)this.button('view-reward','整备查看',24,footer-116,W-48,()=>{this.tab=c.capture.length?'companions':'treasures';this.show('prepare');});
  else this.button('view-reward','调整编组',24,footer-116,W-48,()=>{this.tab='companions';this.show('prepare');});
  this.button('next',won&&this.chapter<CHAPTERS.length-1?'整军 · 下一关':won?'重游山河':'重试本关',24,footer-58,W-48,()=>{if(this.store.notice){this.store.retry();this.drawMenu();return;}if(!won)this.begin();else if(this.chapter<CHAPTERS.length-1)this.show('transition');else this.show('chapters');},true);
  this.label('返回营地',W/2,footer+24,13,'#B6BFC5','center');this.hits.push({id:'back',label:'返回营地',x:W/2-60,y:footer,w:120,h:48,action:()=>this.show('home')});
 }
 /** UI acceptance uses memory storage and actual settle/equip APIs, excluded from Release. */
 private openUIFixture(){
  const [,kind,arg]=this.reviewFixture.split(':'),n=kind==='new'?0:kind==='complete'?20:kind==='milestone'||kind==='reward'?Math.max(0,Number(arg||1)):13;
  for(let i=0;i<n;i++)this.store.settle({id:'ui-isolated-'+i,chapter:i,won:true,troops:55,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:CHAPTERS[i].enemy});
  this.store.acknowledgePresentation();if(n>2){this.store.data.companions=['zhao','lubu'];this.store.data.support='diao';this.store.data.slots={dian:'taiping',qi:'yuxi',ma:null};if(this.store.data.weapons.includes('liannu'))this.store.selectWeapon('liannu');}
  this.chapter=Math.min(19,n);this.first=false;
  if(kind==='reward'||kind==='milestone'){const i=Number(arg||1);this.store.settle({id:'ui-present-'+i,chapter:i,won:true,troops:55,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:CHAPTERS[i].enemy});this.chapter=i;this.first=true;this.rewardReturn='home';this.show('reward');return;}
  if(kind==='volley'){
   // Explicit native/Web visual fixture: isolated memory save, no production balance path.
   this.store.data.companions=[];this.store.data.support=null;this.store.data.slots={dian:null,qi:null,ma:null};this.store.selectWeapon('spear');
   this.begin();const st=this.battle!.state,parts=(arg||'30-bow').split('-');st.course=[];st.ents=[];st.courseLen=1e8;st.troops=st.troopShown=Math.max(1,Math.min(2000,Number(parts[0])||30));st.arms=['bow','fire','repeater'].includes(parts[1])?parts[1]:'bow';st.volleyT=.7;st.show=0;return;
  }
  if(kind==='prepare'){this.tab=arg||'weapons';this.show('prepare');return;}
  if(kind==='collection'){this.tab=arg||'people';this.show('collection');return;}
  if(kind==='person'){this.personId=arg||'zhao';if(!Object.prototype.hasOwnProperty.call(PEOPLE,this.personId))throw Error('acceptance_unknown_person:'+this.personId);this.show('person');return;}
  if(kind==='item'){this.fullMenu.detailId=arg||'liannu';this.fullMenu.detailKind=TREASURES[arg]?'treasure':'weapon';this.show('item');return;}
  if(kind==='loading'||kind==='error'){this.loadingError='隔离验证：资源加载失败，请重试';this.show(kind);return;}
  if(kind==='save-error'){this.reviewStorageFailures=1;this.store.save();this.show('home');return;}
  if(['result','defeat','pause','regression'].includes(kind)){this.chapter=10;this.begin();if(kind==='regression')return;const st=this.battle!.state;if(kind==='pause'){this.show('pause');return;}st.troops=kind==='defeat'?0:55;st.ended=true;st.defeatedOfficerIds=CHAPTERS[10].enemy.slice();st.defeatedBossId=CHAPTERS[10].boss;const before=this.store.data.xp;const saved=this.store.settle({id:this.runId,chapter:10,won:st.troops>0,troops:st.troops,treasures:[],defeatedBossId:st.defeatedBossId,defeatedOfficerIds:st.defeatedOfficerIds,practiceSegments:[1],effectiveHits:5});this.resultReceipt={runId:this.runId,saved,xp:this.store.data.xp-before,items:this.store.data.pendingRewardPresentation?.items||[]};this.settled=true;this.show('result');return;}
  if(kind==='migration'){const d=JSON.parse(JSON.stringify(this.store.data));d.schemaVersion=2;d.claimed=d.claimed.filter((x:string)=>!x.startsWith('milestone:'));d.badges=[];d.pendingRewardPresentation=null;const mem=new Map<string,string>([['yilu-changge-formal-v2',JSON.stringify(d)]]);this.store=new FormalStore({getItem:k=>mem.get(k)||null,setItem:(k,v)=>{mem.set(k,v);}});this.rewardReturn='home';this.show('reward');return;}
  this.show(kind==='map'?'chapters':kind==='settings'?'settings':'home');
 }
 private reviewCommand(cmd:string,value?:any){
  if(!DEBUG||!this.reviewFixture)return false;
  // Reuse the actual Cocos scene and pools for a fresh, explicitly isolated UI case.
  // Never available from a normal game entrance or a Release binary.
  if(cmd==='ui-fixture'&&this.reviewFixture.startsWith('UI:')){const mem=new Map<string,string>();this.isolatedInsets=null;this.reviewStorageFailures=0;this.battle?.pause(true);this.battle?.clearAudioEvents();this.platform.stopEffects();this.battle=null;this.paint.abortFrame();this.store=new FormalStore({getItem:k=>mem.get(k)||null,setItem:(k,v)=>{if(this.reviewStorageFailures>0){this.reviewStorageFailures--;throw Error('isolated test storage failure');}mem.set(k,v);}});this.fullMenu=new FullMenu();this.reviewFixture='UI:'+String(value);this.openUIFixture();return true;}
  if(cmd==='r3-scene'){
   // Explicit isolated memory loadout. Prior unlocks are fixture setup, not recorded clears.
   const mem=new Map<string,string>();this.battle?.pause(true);this.paint.abortFrame();this.platform.stopEffects();
   this.store=new FormalStore({getItem:k=>mem.get(k)||null,setItem:(k,v)=>{mem.set(k,v);}});
   this.chapter=Math.max(0,Math.min(19,Number(value?.chapter)||0));
   for(let n=0;n<this.chapter;n++){const c=CHAPTERS[n];this.store.settle({id:'r3-prior-'+n,chapter:n,won:true,troops:55,treasures:[],defeatedBossId:c.boss,defeatedOfficerIds:c.enemy});}
   this.store.acknowledgePresentation();const requested=String(value?.weapon||'spear');
   if(!this.store.selectWeapon(requested))throw Error('r3_unavailable_weapon:'+requested);
   const lvl=Math.max(1,Math.min(3,Number(value?.level)||1));
   while((this.store.data.weaponLevels[requested]||1)<lvl)if(!this.store.upgrade(requested))throw Error('r3_insufficient_upgrade_budget');
   this.store.data.companions=[];for(const id of value?.companions||[])if(!this.store.equipCompanion(id))throw Error('r3_unavailable_companion:'+id);
   if(value?.support&&!this.store.equipSupport(value.support))throw Error('r3_unavailable_support');
   for(const [slot,id] of Object.entries(value?.slots||{}))if(id&&!this.store.equipTreasure(String(id)))throw Error('r3_unavailable_treasure:'+id);
   this.begin();
   this.battle=createBattle({chapter:this.chapter,lineup:this.store.loadout(),renderer:this.paint,viewport:this.size,diagnostic:true,runId:this.runId,seed:Number(value?.seed)||71,noFriendlyFire:value?.noFriendlyFire===true});
   return true;
  }
  if(cmd==='r3-actor-cycle'&&this.battle){const st=this.battle.state;st.course=[];st.ents=[];st.courseLen=1e9;st.troops=st.troopShown=46;st.tier=2;st.arms='fire';st.show=0;return true;}
  if(cmd==='r3-policy'&&this.battle){this.battle.move(combatReviewTarget(this.battle.snapshot(),value||'normal'));return true;}
  if(cmd==='r3-move'&&this.battle){this.battle.move(Number(value));return true;}
  if(cmd==='r3-pause'&&this.battle){this.battle.pause(!!value);return true;}
  if(cmd==='r3-ticks'&&this.battle){this.battle.pause(false);for(let n=0;n<Math.min(12000,Number(value)||0)&&!this.battle.state.ended;n++)this.battle.step();this.battle.pause(true);return true;}
  if(cmd==='menu-fault'){this.reviewMenuFault=String(value);this.drawMenu();return true;}
  if(cmd==='safe-insets'){this.isolatedInsets=value;this.drawMenu();return true;}
  if(cmd==='settings-failure'){this.platform.book.persist=()=>false;return true;}
  if(cmd==='long-content'){this.fullMenu.confirmTitle='长内容裁切验证';this.fullMenu.confirmText=String(value);this.fullMenu.confirmActions=[];this.fullMenu.confirmReturn='prepare';this.show('confirm');return true;}
  if(cmd==='scroll'){this.fullMenu.scrollBy(Number(value));this.drawMenu();return true;}
  if(cmd==='fault'){this.reviewProbeStage=String(value);return true;}
  if(cmd==='presentation'&&this.battle){const st=this.battle.state,w=WEAPON_DATA[value.weapon as WeaponId];if(!w||!(value.mount===null||['chitu','dilu','jingfan','jueying'].includes(value.mount)))return false;st.weapon=value.weapon;st.slots.ma.id=value.mount;st.tier=value.tier||3;st.show=0;st.ents=[];st.waves=[];st.arrows=[];st.heroX=st.targetX=Number(value.x||0);st.t=Number(value.gait||0)*.15;if(value.gait!==undefined)st.dist=Number(value.gait)/(.9*1.7);st.atkT=value.pose==='run'?w.wind+w.rel+w.rec+.01:value.pose==='wind'?w.wind*.3:value.pose==='rel'?w.wind+w.rel*.5:w.wind+w.rel+w.rec*.8;this.battle.pause(true);return true;}
  if(cmd==='boss'&&this.battle){const st=this.battle.state;st.course=[];st.ents=[];st.dist=st.courseLen+6;st.defeatedOfficerIds=CHAPTERS[this.chapter].enemy.slice();this.battle.step();return true;}
  if(cmd==='review-target'&&this.battle){this.battle.move(reviewTarget(this.battle.snapshot()));return true;}
  return false;
 }
 /** Isolated visual checks may seed explicitly labelled fixtures; campaign mode never does. */
 private openRegressionFixture(){
  const [,kind,arg]=this.reviewFixture.split(':');
  for(let i=0;i<13;i++)this.store.settle({id:'regression-isolated-'+i,chapter:i,won:true,troops:55,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:CHAPTERS[i].enemy});
  this.store.acknowledgePresentation();this.store.data.companions=['machao','lubu'];this.store.data.support='diao';this.store.data.slots={dian:'taiping',qi:'yuxi',ma:null};this.store.data.weaponLevels.guandao=3;this.store.data.weaponLevels.liannu=3;
  this.store.selectWeapon(kind==='prepare'?'guandao':'liannu');this.chapter=kind==='prepare'?9:10;
  if(kind==='prepare'){this.tab='weapons';this.show('prepare');return;}
  this.begin();const st=this.battle!.state;st.tier=Number(arg)||2;st.show=0;
  if(kind==='left'||kind==='right')st.heroX=st.targetX=kind==='left'?-.82:.82;
  if(kind!=='live'&&kind!=='fault')this.battle!.pause(true);
 }
 private openCampaignFixture(){
  const [,kind,arg]=this.reviewFixture.split(':');if(kind==='campaign'){this.chapter=0;this.show('home');return;}
  const index=Math.max(0,Math.min(CHAPTERS.length-1,Number(arg)||0)),n=kind==='reward'?index:index+1;
  for(let i=0;i<n;i++)this.store.settle({id:'c20-fixture-'+i,chapter:i,won:true,troops:55,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:CHAPTERS[i].enemy});
  this.store.acknowledgePresentation();this.chapter=index;
  if(kind==='map'){this.show('chapters');this.mapSelection=index;this.mapScroll=mapScrollFor(index,this.menuMapMetrics());this.drawMenu();return;}
  if(kind==='reward'){const c=CHAPTERS[index];this.store.settle({id:'c20-show-'+index,chapter:index,won:true,troops:55,treasures:[],defeatedBossId:c.boss,defeatedOfficerIds:c.enemy});this.rewardReturn='home';this.show('reward');return;}
  if(kind==='prepare'){this.tab='weapons';this.show('prepare');return;}
  if(['edge','army','gates'].includes(kind)){
   const parts=this.reviewFixture.split(':'),weapon=parts[3]||'goulianqiang';configureCampaignReference(this.store);if(this.store.data.weapons.includes(weapon))this.store.selectWeapon(weapon);this.store.data.slots.ma=parts[6]&&TREASURES[parts[6]]?parts[6]:null;
   this.begin();const st=this.battle!.state;st.course=[];st.ents=[];st.troops=st.troopShown=200;st.heroX=st.targetX=parts[4]==='left'?-.82:parts[4]==='right'?.82:0;st.show=0;st.tier=3;const w=WEAPON_DATA[st.weapon as WeaponId],pose=parts[5]||'rel';st.atkT=pose==='wind'?w.wind*.5:pose==='rec'?w.wind+w.rel+w.rec*.5:w.wind+w.rel*.5;
   if(kind==='gates'){st.ents=[{id:990,type:'gate',x:st.heroX,d:st.dist+.3,val:7,initialVal:1,passed:false},{id:991,type:'gate',x:-.5,d:st.dist+5,val:-3,initialVal:-3,passed:false},{id:992,type:'gate',x:.5,d:st.dist+9,val:4,initialVal:4,passed:false},{id:993,type:'crate',kind:'grain',x:-.4,d:st.dist+6,hp:9,max:9,open:0,hitT:0}];}
   this.battle!.pause(true);return;
  }
  this.begin();if(kind==='boss'){const st=this.battle!.state;st.course=[];st.ents=[];st.dist=st.courseLen+6;st.defeatedOfficerIds=CHAPTERS[index].enemy.slice();this.battle!.step();if(st.boss){st.boss.phase='reposition';st.boss.pt=.4;}this.battle!.pause(true);}
 }
 /** Review states use an isolated memory store and are excluded from Release. */
 private openPolishFixture(){
  const [,kind,arg]=this.reviewFixture.split(':');if(kind==='campaign'){this.chapter=0;this.show('home');return;}const d=this.store.data,n=kind==='empty'||kind==='unknown'?0:kind==='partial'?1:kind==='result'?Number(arg||0):10;
  for(let i=0;i<n;i++){const c=CHAPTERS[i];d.cleared.push(c.id);d.seen.push(c.boss,...c.enemy,...c.capture,...c.visit,...c.allies);d.captures.push(...c.capture);d.visits.push(...c.visit);d.allies.push(...c.allies);if(c.weapon)d.weapons.push(c.weapon);if(c.treasure)d.treasures.push(c.treasure);}
  this.chapter=Math.min(CHAPTERS.length-1,n);d.companions=n>=3?['lubu','zhao']:[];d.support=n>=2?'hua':null;d.slots={dian:n?'taiping':null,qi:n>=2?'yuxi':null,ma:n>=3?'chitu':null};
  if(['empty','partial','equipped'].includes(kind)){this.tab=arg||'companions';this.show('prepare');return;}
  if(kind==='people'||kind==='unknown'){this.tab='people';this.page=Number(arg||0);this.show('collection');return;}
  if(kind==='person'){this.personId=arg||'machao';this.show('person');return;}
  this.chapter=kind==='result'?Number(arg||0):6;this.begin();const st=this.battle!.state;
  if(kind==='result'||kind==='replay'){st.troops=83;st.ended=true;st.defeatedOfficerIds=CHAPTERS[this.chapter].enemy.slice();st.defeatedBossId=CHAPTERS[this.chapter].boss;st.runGot=kind==='replay'?['taiping']:[];this.store.settle({id:this.runId,chapter:this.chapter,won:true,troops:83,treasures:st.runGot,defeatedOfficerIds:st.defeatedOfficerIds,defeatedBossId:st.defeatedBossId});this.settled=true;this.show('result');return;}
  if(kind==='boss'){st.course=[];st.ents=[];st.dist=st.courseLen+6;st.defeatedOfficerIds=CHAPTERS[this.chapter].enemy.slice();this.battle!.step();}
  else for(let tick=0;tick<20*60;tick++){if(tick%6===0)this.battle!.move(reviewTarget(this.battle!.snapshot()));this.battle!.step();}
  st.troops=st.troopShown=Number(arg)||120;if(kind!=='live')this.battle!.pause(true);
 }
 private nativeCampaignInput(dt:number){
  if(!DEBUG||!['R2:campaign','C20:campaign'].includes(this.reviewFixture))return;
  if(this.screen==='battle'&&this.battle){this.reviewInputAge+=dt;if(this.reviewInputAge>=.1){this.reviewInputAge=0;this.battle.move(reviewTarget(this.battle.snapshot()));}return;}
  if(this.screenAge<2)return;
  let id='';
  if(this.screen==='home'&&this.store.completed===0)id='start';
  if(this.screen==='prepare'){
   if(this.reviewEquipped!==this.chapter){this.reviewEquipped=this.chapter;configureCampaignReference(this.store);this.drawMenu();this.screenAge=0;return;}id='depart';
  }
  if(this.screen==='result'&&this.battle!.state.troops>0&&this.chapter<CHAPTERS.length-1)id='next';
  if(this.screen==='reward'&&this.screenAge>=4.6)id='reward-done';
  if(this.screen==='transition')id='prepare-next';
  if(id)this.hits.find(h=>h.id===id)?.action();
 }
 /** Audio verification only: in-memory loadout, actual combat events, no save writes. */
 private musicReviewAge=0;private musicReviewStage=-1;
 private musicReviewInput(dt:number){
  if(this.reviewFixture!=='MUSIC:flow')return;this.musicReviewAge+=dt;
  const times=[0,4,8,16,19,23,26,29,32,38],stage=times.filter(t=>this.musicReviewAge>=t).length-1;
  if(stage===this.musicReviewStage)return;this.musicReviewStage=stage;
  if(stage===0)this.show('home');if(stage===1||stage===4)this.show('settings');
  if(stage===2){this.begin();const s=this.battle!.state;s.course=[];s.ents=[];s.courseLen=1e8;s.minT=1e8;s.troops=s.troopShown=30;}
  if(stage===3)this.show('pause');
  if(stage===5||stage===6){this.platform.book.data.settings.music=stage===6;this.platform.syncAudio(false);this.drawMenu();}
  if(stage===7){this.platform.book.data.settings.musicVolume=.3;this.platform.syncAudio(false);this.drawMenu();}
  if(stage===8)this.show('battle');if(stage===9)this.show('home');
 }
 private soundFixtureAge=0;private soundFixtureStage=-1;private soundFixturePaused=false;
 private openSoundFixture(){this.chapter=0;this.platform.book.data.settings.sfx=true;this.store.data.companions=this.reviewFixture.endsWith('dense')?['zhao','zhang']:[];if(this.reviewFixture.endsWith('dense')){this.store.data.cleared=['c01','c02','c03'];this.store.data.captures=['zhao','zhang'];}this.begin();const st=this.battle!.state;st.course=[];st.courseLen=99999;st.minT=99999;st.troops=st.troopShown=this.reviewFixture.endsWith('dense')?120:30;st.heroX=st.targetX=0;st.show=0;this.soundFixtureAge=0;this.soundFixtureStage=-1;}
 private soundFixtureInput(dt:number){if(!/^(SFX|C20SFX):/.test(this.reviewFixture)||!this.battle)return;this.soundFixtureAge+=dt;const age=this.soundFixtureAge;
  if(age>=25&&age<27){if(!this.soundFixturePaused){this.soundFixturePaused=true;this.show('pause');}return;}if(this.soundFixturePaused){this.soundFixturePaused=false;this.show('battle');}
  if(age>58){if(this.screen!=='pause')this.show('pause');return;}const stage=Math.min(9,Math.floor((age-(age>=27?2:0))/5.5));if(stage===this.soundFixtureStage)return;this.soundFixtureStage=stage;
  const st=this.battle.state;st.weapon=Object.keys(WEAPON_DATA)[this.reviewFixture.startsWith('C20SFX:')?10+Math.min(5,Math.floor(stage*6/10)):stage];st.tier=3;st.show=0;st.arms=['bow','fire','repeater'][stage%3];st.ents=[];
  const dense=this.reviewFixture.endsWith('dense');for(let i=0;i<(dense?18:4);i++)st.ents.push({id:90000+stage*100+i,type:'enemy',x:(i%3-1)*.22,d:st.dist+10+Math.floor(i/3)*1.5,hp:20,max:20,walk:0,dead:0,elite:i%2===0});
  st.ents.push({id:91000+stage,type:'crate',kind:'grain',x:0,d:st.dist+4,hp:12,max:12,open:0,hitT:0});st.ents.push({id:92000+stage,type:'gate',x:0,d:st.dist+7,val:2,passed:false});
 }
 private begin(){if(!this.store.unlocked(this.chapter))return;if(this.store.data.pendingRewardPresentation&&!this.store.notice&&!this.reviewFixture){this.rewardReturn='prepare';this.show('reward');return;}if(this.store.notice&&!this.store.retry()){this.drawMenu();return;}this.runId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);this.first=!this.store.data.cleared.includes(CHAPTERS[this.chapter].id);this.settled=false;this.resultError='';this.acc=0;this.finishAge=0;this.elapsed=0;this.frames=[];this.lastSound='';this.lastDamage=0;this.lastHeavy=0;this.battle?.clearAudioEvents();this.platform.stopEffects();this.reviewReaction=null;let probeArmed=DEBUG&&this.reviewFixture==='REG:fault';this.battle=createBattle({renderProbe:(stage:string)=>{if((probeArmed&&stage==='hud')||(DEBUG&&this.reviewProbeStage===stage)){this.reviewProbeStage='';probeArmed=false;throw Error('injected regression HUD failure');}},chapter:this.chapter,lineup:this.store.loadout(),renderer:this.paint,viewport:this.size,diagnostic:DEBUG,runId:this.runId});if(DEBUG)this.bridgeDiagnostics.event('level_start',{chapter:this.chapter,scope:this.reviewFixture||'normal-gameplay'});this.show('battle');}
 update(dt:number){if(!this.platform)return;this.platform.updateMusic(dt);if(DEBUG)this.bridgeDiagnostics.sample(dt,this.screen,this.chapter,this.screen==='battle'?this.battle?.diagnostics.counts:null,this.platform.windowMetrics);if(DEBUG){this.nativeCampaignInput(dt);this.soundFixtureInput(dt);this.musicReviewInput(dt);}if(DEBUG&&sys.isNative&&(this.diagAge+=dt)>.2){this.diagAge=0;native.reflection.callStaticMethod('YiluNativeBridge','reviewState:',JSON.stringify({screen:this.screen,battle:this.battle?.snapshot(),save:this.store?.data}));native.fileUtils.writeStringToFile(JSON.stringify(this.snapshot()),native.fileUtils.getWritablePath()+'yilu-diagnostics.json');}if(sys.isNative&&this.screen==='battle'&&this.battle)native.reflection.callStaticMethod('YiluNativeBridge','position:',String(this.battle.state.targetX));this.screenAge+=dt;this.menuAnimAcc+=dt;const menuAnimating=this.uiSkin?(!this.fullMenu.reducedMotion&&((this.screen==='transition'&&this.screenAge<1.3)||(this.screen==='reward'&&this.screenAge<2.8))):['chapters','transition','reward'].includes(this.screen);if(menuAnimating&&this.menuAnimAcc>=.09){this.menuAnimAcc=0;this.drawMenu();}const s=this.size,signature=[s.W,s.H,s.top,s.bottom,this.platform.windowMetrics.revision].join(':');if(signature!==this.lastSize){this.lastSize=signature;this.drawMenu();}if(this.screen==='battle'&&this.battle){this.frames.push(dt);this.acc+=Math.min(.1,dt);while(this.acc>=1/60){this.battle.step();this.acc-=1/60;}if(!this.battle.state.ended)this.elapsed+=dt;const st=this.battle.state;if(st.ended){this.finishAge+=dt;if(!this.settled){const xpBefore=this.store.data.xp;try{const saved=this.store.settle({id:this.runId,chapter:this.chapter,won:st.troops>0,troops:st.troops,treasures:st.runGot,defeatedOfficerIds:st.defeatedOfficerIds,defeatedBossId:st.defeatedBossId,practiceSegments:this.battle.snapshot().progressEligible||[],effectiveHits:this.battle.totals.damage,routeXP:this.battle.snapshot().routeXP});this.resultReceipt={runId:this.runId,won:st.troops>0,firstClear:this.first,saved,xp:this.store.data.xp-xpBefore,items:this.store.data.pendingRewardPresentation?.items||[]};}catch(e){this.resultError=String(e);if(DEBUG)this.bridgeDiagnostics.event('business_error',{message:this.resultError,scope:'settlement'});this.store.notice='结算保存异常，当前结果保留，请重试保存。';}finally{this.settled=true;}}if(this.finishAge>1.6){this.rewardReturn='result';this.show(this.store.data.pendingRewardPresentation&&!this.store.notice?'reward':'result');}}this.platform.consumeSoundEvents(this.battle.drainAudioEvents());if(st.ended){this.platform.syncAudio(false);this.platform.setMusicScene('result');}const last=st.log[st.log.length-1],rewardContext=last?rewardSoundContext(this.runId,last):undefined,key=rewardContext?.eventId||'';if(key!==this.lastSound){this.lastSound=key;if(last?.kind==='gate'||last?.kind==='crate'||last?.kind==='weapon')this.platform.sound('gather',rewardContext);if(last?.kind==='boss'){if(/收服|结盟|寻访|击败/.test(last.msg))this.platform.sound('gather',rewardContext);}}const dmg=this.battle.totals.damage;if(dmg>this.lastDamage){this.lastDamage=dmg;const heavy=(st.nextHeavyHold||0)>this.lastHeavy;if(heavy){this.lastHeavy=st.nextHeavyHold;this.platform.vibrate();}}}
 this.platform.pumpSound();
 if(this.battle&&(['battle','pause'].includes(this.screen)||(!this.uiSkin&&this.screen==='result'))){try{this.battle.render(s);}catch(e){this.enterRenderError(e);}}}
 private enterRenderError(error:unknown,origin:'battle'|'menu'='battle'){
  this.faultOrigin=origin;if(origin==='menu')this.faultMenuScreen=this.screen;this.menuLayers?.abort();this.paint?.abortFrame();
  this.renderFault=String(error);this.battle?.pause(true);this.battle?.clearAudioEvents();this.platform.syncAudio(false);this.platform.stopEffects();this.acc=0;this.cancel();this.screen='render-error';this.platform.setMusicScene('render-error');this.menu.abortFrame();this.bg.active=false;this.art.end();
  if(!this.renderErrors.includes(this.renderFault)){this.renderErrors.push(this.renderFault);if(DEBUG)this.bridgeDiagnostics.event('business_error',{message:this.renderFault,scope:'render',tick:this.battle?.snapshot().t});}
  this.showSafeError();
 }
 private showSafeError(){const s=this.size;this.safeLayer.show(s,this.renderFault,this.retryingRender);this.hits=this.retryingRender?[]:[{id:'retry-render',label:'重新载入并恢复',x:24,y:s.H*.56,w:s.W-48,h:48,action:()=>{void this.retryRender();}},{id:'safe-home',label:'返回营地',x:24,y:s.H*.56+64,w:s.W-48,h:48,action:()=>{this.battle?.clearAudioEvents();this.show('home');}}];if(sys.isNative)native.reflection.callStaticMethod('YiluNativeBridge','syncButtons:',JSON.stringify({width:s.W,height:s.H,buttons:this.hits.map(({id,label,x,y,w,h})=>({id,label,x,y,w,h}))}));}
 private async retryRender(){if(this.retryingRender)return;this.retryingRender=true;this.showSafeError();try{await NativePaint.load();if(this.disposed)return;
  if(this.faultOrigin==='battle'&&!this.battle?.retryRender(this.size))throw Error(this.battle?.diagnostics.renderFailure?.message||'画面仍未就绪');
  this.renderFault='';this.retryingRender=false;this.acc=0;this.show(this.faultOrigin==='menu'?this.faultMenuScreen:'battle');
 }catch(e){this.retryingRender=false;this.renderFault=String(e);if(!this.disposed)this.showSafeError();}}
 private menuProbe(stage:string){if(DEBUG&&this.reviewFixture&&this.reviewMenuFault===stage){this.reviewMenuFault='';throw Error('injected menu '+stage+' failure');}}
 private drawHomeArt(region?:{x:number;y:number;w:number;h:number}){const {W,H,top,bottom}=this.size,r=region||homeLayout(W,H,top,bottom).hero;this.art.draw(this.bg,'home-hero','hero-home',r.x+r.w/2-W/2,H/2-r.y-r.h/2,r.w,r.h,'contain');}
 private menuMapMetrics(){const m=mapMetrics(this.size,this.mapExpanded);if(!this.uiSkin)return m;
  const s=this.size,measure=this.menuLayers?this.menuLayers.measure.bind(this.menuLayers):this.menu.measure.bind(this.menu),next=MILESTONES.find(v=>v.chapter>this.store.completed);
  const hint=next?'下一未领里程碑 · 第'+next.chapter+'关 '+next.title:'全部里程碑已领取';
  const titleH=layoutText('天下征程',s.W-136,22,measure).height,progressH=layoutText('征程进度 · '+this.store.completed+'/20',s.W-72,13,measure).height,hintH=layoutText(hint,s.W-72,12,measure).height;
  const y=s.top+Math.max(112,titleH+progressH+hintH+47),c=CHAPTERS[this.mapSelection],main=c.weapon?WEAPON_DATA[c.weapon].label:c.treasure?TREASURES[c.treasure].name:PEOPLE[c.boss];
  const bodyWidth=s.W-72,drawerTitle=layoutText('当前选择 · 第'+(this.mapSelection+1)+'关 '+c.place,bodyWidth-72,16,measure).height,threat=layoutText(chapterThreats(this.mapSelection),bodyWidth,13,measure).height,reward=layoutText('首胜 · '+main,bodyWidth,13,measure).height;
  const baseDrawer=Math.max(180,Math.max(drawerTitle,28+threat,55+reward)+106);
  const rewards=[...c.capture.map(id=>'收 '+PEOPLE[id]),...c.visit.map(id=>'访 '+PEOPLE[id]),...c.allies.map(id=>'盟 '+PEOPLE[id]),c.treasure?TREASURES[c.treasure].name:''].filter(Boolean).join(' · ');
  const extraHeight=layoutText(rewards,bodyWidth,13,measure).height,drawer=this.mapExpanded?Math.max(270,Math.max(83+extraHeight,167)+106):baseDrawer;
  const bottom=s.H-s.bottom-drawer,height=Math.max(120,bottom-y),step=Math.max(122,(s.H-s.bottom-baseDrawer-y)/3.5),panel=step*4;
  return{y,bottom,height,step,panel,total:panel*5,maxScroll:Math.max(0,panel*5-height)};
 }
 private menuText(text:string,r:{x:number;y:number;w:number;h:number},size=14,color='#D5DAD7',align='left'){
  const v=layoutText(text,r.w,size,this.menuLayers?this.menuLayers.measure.bind(this.menuLayers):this.menu.measure.bind(this.menu));v.lines.forEach((t,i)=>{const x=align==='center'?r.x+r.w/2:r.x,y=r.y+v.lineHeight/2+i*v.lineHeight,w=this.menuLayers?this.menuLayers.measure(t,size):this.menu.measure(t,size);this.label(t,x,y,size,color,align);this.fullMenu.textRecords.push({text:t,x,y,size,bounds:{x:align==='center'?x-w/2:x,y:y-size*.6,w,h:size*1.2},container:r,layer:'fixed'});});return v.height;
 }
 snapshot(){const person=this.screen==='person'?{id:this.personId,valid:Object.prototype.hasOwnProperty.call(PEOPLE,this.personId),known:[...this.store.data.captures,...this.store.data.visits,...this.store.data.allies,...this.store.data.seen].includes(this.personId),title:PEOPLE[this.personId]||null,profile:PERSON_PROFILES[this.personId]||null}:null;return{musicReview:this.reviewFixture==='MUSIC:flow'?{seconds:this.musicReviewAge,stage:this.musicReviewStage}:null,person,ui:{skin:this.uiSkin?'full':'legacy',scroll:this.fullMenu.scroll,maxScroll:this.fullMenu.maxScroll,texts:this.fullMenu.textRecords,items:this.fullMenu.itemRecords,contentHeight:this.fullMenu.contentHeight,viewport:{top:this.fullMenu.contentTop,bottom:this.fullMenu.contentBottom},layers:this.menuLayers?.diagnostics,filter:this.fullMenu.filter,reducedMotion:this.fullMenu.reducedMotion},build:BRIDGE_BUILD,verificationScope:this.reviewFixture?'isolated-'+(sys.isNative?'native':'browser')+'-visual-fixture:'+this.reviewFixture:'normal-gameplay',version:TUNING.version,engine:sys.isNative?'Cocos native Sprite/Graphics/Label':'Cocos WebGL Sprite/Graphics/Label',screen:this.screen,chapter:this.chapter,runId:this.runId,revision:this.rev,save:JSON.parse(JSON.stringify(this.store?.data||{})),saveNotice:this.store?.notice,battle:this.battle?.snapshot(),ledger:this.battle?.ledger.slice(-100),diagnostics:this.battle?.diagnostics,buttons:this.hits.map(({id,label,x,y,w,h})=>({id,label,x,y,w,h})),viewport:this.platform?.windowMetrics,nativeNodes:this.paint?.activeNodes,frameState:{generation:this.paint?.generation,lastFrameCommitted:this.paint?.lastFrameCommitted,abortedFrames:this.paint?.abortedFrames,submissions:this.paint?.submissions.filter(x=>x.role!=='decoration'),resourceErrors:this.paint?.resourceErrors,renderFault:this.renderFault},createdNodes:this.paint?.createdNodes,invalidRects:[...Array.from(this.paint?.invalidRects||[]),...Array.from(this.menu?.invalidRects||[])],renderErrors:this.renderErrors,foregroundElapsedSeconds:this.elapsed,resultReadyLatencySeconds:this.finishAge,resultError:this.resultError,missingArt:[...Array.from(this.paint?.missing||[]),...Array.from(this.menu?.missing||[])],performance:{sampleCount:this.frames.length,over50ms:this.frames.filter(v=>v>.05).length,over100ms:this.frames.filter(v=>v>.1).length,p95ms:[...this.frames].sort((a,b)=>a-b)[Math.floor(this.frames.length*.95)]*1000||0,scope:'foreground battle render intervals, native host dependent'},fps:this.frames.length?this.frames.length/this.frames.reduce((a,b)=>a+b,0):0,map:{scroll:this.mapScroll,selected:this.mapSelection,expanded:this.mapExpanded,cachedPanels:NativePaint.mapWanted.size,metrics:this.menuMapMetrics()},reward:this.store?.data.pendingRewardPresentation,audio:this.platform?.audioState,error:this.loadingError};}
 onDestroy(){this.disposed=true;this.safeLayer?.destroy();this.bridgeDiagnostics.close();input.off(Input.EventType.TOUCH_START,this.down,this);input.off(Input.EventType.TOUCH_MOVE,this.move,this);input.off(Input.EventType.TOUCH_END,this.up,this);input.off(Input.EventType.TOUCH_CANCEL,this.cancel,this);this.paint?.destroy();if(this.menuLayers)this.menuLayers.destroy();else this.menu?.destroy();this.art.destroy();this.platform?.destroy();}
}
