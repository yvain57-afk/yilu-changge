import {R2_PEOPLE} from './R2Art';
import {HomeButtonConfig,homeButtonLayout} from './HomeButtonLayout';
import {HOME_BUTTON_CONFIG} from './HomeButtonConfig';
import {HOME_EDITOR_CONFIG} from './HomeEditorConfig';
import {HomeEditorConfig,HomeEditorItem,HomeElementId,HomeElementKind,homeEditorItem} from './HomeEditor';
import {installHomeEditorPreview} from './HomeEditorPreview';
import {intersection,clipHit,inset,layoutText,MenuViewState,homeLayout} from './MenuLayout';
import {MenuLayers} from './MenuLayers';
import {NativePaint} from './NativePaint';
import {
 drawPanel,drawCompactPanel,drawCompactCard,drawButton,drawTab,drawCard,
 drawBanner,drawDialog,drawRewardSocket,drawState,drawProgress,drawMedal,
 drawNavBar,drawSegmentedBar,drawFilterPill
} from './UIComponents';
import {CHAPTERS,PEOPLE,PERSON_PROFILES,WEAPON_DATA,TREASURES,TUNING,Slot,WeaponId,personRole,MILESTONES} from './data';
import {resolveWeaponPresentation,drawWeaponPresentation,presentationBounds} from './WeaponPresentation';
import {rewardLabel,nextMilestoneHint,canSkipPresentation} from './RewardFlow';
import {BRIDGE_BUILD} from './BridgeBuild';
import {FormalStore} from './store';
import {MANIFEST} from './manifest';
import {Platform} from '../Platform';

export type MenuScreen='loading'|'error'|'home'|'chapters'|'prepare'|'collection'|'battle'|'pause'|'result'|'transition'|'settings'|'person'|'reward'|'render-error'|'item'|'confirm';
export interface MenuHost {
 size:{W:number;H:number;top:number;bottom:number};menu:NativePaint;menuLayers?:MenuLayers;store:FormalStore;platform:Platform;
 screen:MenuScreen;chapter:number;tab:string;page:number;screenAge:number;personId:string;
 first:boolean;resultError:string;loadingError:string;runId:string;battle:any;rewardReturn:MenuScreen;
 hits:{id:string;label?:string;x:number;y:number;w:number;h:number;action:()=>void}[];
 pressed:{id:string}|null;resultReceipt:any;
 menuProbe?(stage:string):void;drawHomeArt?(region:{x:number;y:number;w:number;h:number}):void;show(s:MenuScreen):void;drawMenu():void;begin():void;load():Promise<void>;drawMap():void;
}

/** Uses post-protection troop losses only; a damage source is not a judgement of player error. */
export function resultLossSummary(sources:Record<string,unknown>={}){
 const details:Record<string,[string,string]>={
  gate:['负数门','可以提前选好门；射击能改变门上的数字。'],
  archer:['敌方弓手','可以先击破弓手，或横移避开箭矢落点。'],
  rain:['敌方箭雨','箭雨落下前，可以横移到预警区域外。'],
  cavalry:['骑兵冲撞','骑兵冲锋前，可以移到冲线外，等它冲过后继续推进。'],
  mechanism:['敌方机关','可以先击破机关，或绕开它的攻击区域。'],
  shield:['敌方盾兵','盾兵出手后会露出空隙，可以趁它收招时集中攻击。'],
  guard:['敌方护卫','可以先集中攻击一侧，打开通过敌阵的空隙。'],
  light:['敌方步兵','可以边横移边集火，减少同时贴近的敌兵。'],
  banner:['敌方旗手','可以先击破旗手，削弱附近敌军。'],
  boss:['关底敌将','敌将收招时是反击机会；出手前可以横移避开预警。'],
  officer:['途中敌将','敌将收招时是反击机会；出手前可以横移避开预警。'],
  wall:['路障','可以沿路障空隙通过，再调整队伍位置。'],
  other:['其他攻击','可以调整兵器和编组，再挑战这一关。'],
 };
 const group=(key:string)=>details[key]?key:/gate/.test(key)?'gate':/rain/.test(key)?'rain':/archer|arrow/.test(key)?'archer':/cavalry|charge/.test(key)?'cavalry':/mechanism|trap/.test(key)?'mechanism':/boss/.test(key)?'boss':/officer/.test(key)?'officer':/enemy/.test(key)?'light':'other';
 const totals:Record<string,number>={};
 for(const [key,n] of Object.entries(sources)){if(typeof n!=='number'||!Number.isFinite(n)||n<=0)continue;const id=group(key);totals[id]=(totals[id]||0)+n;}
 const ranked=Object.entries(totals).sort((a,b)=>b[1]-a[1]),total=ranked.reduce((n,[,v])=>n+v,0);
 if(!ranked.length)return '兵力耗尽，本关失败。\n这次没有完整的战损记录，暂时无法判断主要原因。';
 const lines=ranked.slice(0,2).map(([id,n])=>details[id][0]+' · 损失 '+Math.round(n)+' 名'),remaining=ranked.slice(2).reduce((n,[,v])=>n+v,0);
 if(remaining>0)lines.push('其余来源 · 损失 '+Math.round(remaining)+' 名');
 return '兵力耗尽 · 累计战损 '+Math.round(total)+' 名\n'+lines.join('\n')+'\n'+details[ranked[0][0]][1];
}

/** State belongs to one menu router. No gameplay ticks, awards or storage schema live here. */
export class FullMenu {
 homeButtonOverride:HomeButtonConfig|null=null;
 homeEditorOverride:HomeEditorConfig|null=null;homeEditorItems:HomeEditorItem[]=[];
 scroll=0;maxScroll=0;contentTop=0;contentBottom=0;detailKind:'weapon'|'treasure'='weapon';detailId='spear';detailReturn:MenuScreen='collection';
 settingsReturn:MenuScreen='home';confirmTitle='';confirmText='';confirmReturn:MenuScreen='pause';confirmActions:{id:string;label:string;action:()=>void}[]=[];
 reducedMotion=false;lastScreen='';lastTab='';filter='all';focus='';rewardClock=new Map<string,number>();
 textRecords:{text:string;x:number;y:number;size:number;bounds:any;container?:any;layer:string}[]=[];
 itemRecords:{id:string;bounds:any}[]=[];contentHeight=0;private views=new MenuViewState();private headBottom=0;
 private g!:MenuHost;private activePaint:NativePaint|null=null;private inContent=false;private settingsNotice='';private errorExpanded=false;
 private navBackRegistered=false;
 private get p(){return this.activePaint||this.g.menu;}
 private get W(){return this.g.size.W;}
 private get bottom(){return this.g.size.H-this.g.size.bottom-72;}

 scrollBy(delta:number){const next=Math.max(0,Math.min(this.maxScroll,this.scroll+delta));if(next===this.scroll)return false;this.scroll=next;return true;}
 private measure=(s:string,n:number)=>this.g.menuLayers?this.g.menuLayers.measure(s,n):this.g.menu.measure(s,n);

 private label(t:string,x:number,y:number,size=15,color='#F3EEE1',align='left',container?:any){
  const w=this.measure(t,size),bounds={x:align==='center'?x-w/2:align==='right'?x-w:x,y:y-size*.6,w,h:size*1.2};
  this.textRecords.push({text:t,x,y,size,bounds,container,layer:this.inContent?'content':this.activePaint?'overlay':'fixed'});
  this.g.menuProbe?.('label');this.p.font=`600 ${size}px Arial`;this.p.fillStyle=color;this.p.textAlign=align;this.p.fillText(t,x,y);
 }

 private text(t:string,r:any,size=14,color='#D5DAD7',align='left'){
  const v=layoutText(t,r.w,size,this.measure);
  v.lines.forEach((line,i)=>this.label(line,align==='center'?r.x+r.w/2:align==='right'?r.x+r.w:r.x,r.y+v.lineHeight/2+i*v.lineHeight,size,color,align,r));
  return v.height;
 }

 private wrap(t:string,x:number,y:number,w:number,size=14,color='#D5DAD7'){
  return this.text(t,{x,y:y-size*.6,w,h:layoutText(t,w,size,this.measure).height},size,color);
 }

 private hit(id:string,label:string,x:number,y:number,w:number,h:number,action:()=>void){
  const r=this.inContent?clipHit({x,y,w,h},{x:12,y:this.contentTop,w:this.W-24,h:this.contentBottom-this.contentTop}):{x,y,w,h};
  if(r){
   const idx=this.g.hits.findIndex(existing=>existing.id===id);
   const entry={id,label,...r,action:()=>{this.focus=id;action();}};
   if(idx>=0)this.g.hits[idx]=entry;
   else this.g.hits.push(entry);
  }
 }

 private button(id:string,t:string,x:number,y:number,w:number,action:()=>void,tone:'gold'|'navy'|'warning'='navy',disabled=false,style:{height:number;fontSize:number}={height:52,fontSize:15}){
  const h=style.height,size=style.fontSize,r=drawButton(this.p,{x,y,w,h},t,{tone,state:disabled?'disabled':this.g.pressed?.id===id?'pressed':'normal',fontSize:size});
  this.textRecords.push({text:t,x:x+w/2,y:y+h/2,size,bounds:{x:x+(w-this.measure(t,size))/2,y:y+h/2-size*.6,w:this.measure(t,size),h:size*1.2},container:r.content,layer:this.inContent?'content':this.activePaint?'overlay':'fixed'});
  if(!disabled)this.hit(id,t,x,y,w,h,action);
 }

 private header(title:string,sub:string,back?:()=>void,backLabel='返回',showBack=true){
  const {top,W}=this.g.size;
  // Match drawNavBar's title bounds so measuring and drawing wrap on the same line.
  const sidePad=showBack?62:14;
  const titleAvailW=Math.max(80,W-24-sidePad*2);
  const t=layoutText(title,titleAvailW,21,this.measure);
  const v=layoutText(sub,W-48,13,this.measure);
  const h=Math.max(58,t.height+v.height+24);
  const nav=drawNavBar(this.p,{x:12,y:top,w:W-24,h},{
   showBack,
   backLabel:'‹ '+(backLabel==='返回营地'?'营地':backLabel),
   pressedBack:this.g.pressed?.id==='back',
  });
  this.text(title,{x:nav.titleRect.x,y:nav.content.y+3,w:nav.titleRect.w,h:t.height},21,'#F1D9A0','center');
  this.text(sub,{x:nav.content.x+6,y:nav.content.y+t.height+6,w:nav.content.w-12,h:v.height},13,'#D5DAD7','center');
  if(showBack&&nav.backHit){
   const onBack=back||(()=>this.g.show('home'));
   this.hit('back',backLabel,nav.backHit.x,nav.backHit.y,nav.backHit.w,nav.backHit.h,onBack);
   this.navBackRegistered=true;
  }else{
   this.navBackRegistered=false;
  }
  this.headBottom=top+h+8;
  this.contentTop=this.headBottom;
 }

 private footer(main?:{id:string;label:string;action:()=>void;disabled?:boolean},back:()=>void=()=>this.g.show('home'),hint='',backLabel='返回'){
  this.activePaint=null;this.inContent=false;
  const {top}=this.g.size;
  this.hit('back',backLabel,12,top,68,52,back);
  this.navBackRegistered=true;
  if(!main){
   if(hint)this.label(hint,this.W/2,this.g.size.H-this.g.size.bottom-14,12,'#9AA8B2','center');
   return;
  }
  this.p.fillStyle='rgba(12,24,36,0.96)';
  this.p.fillRect(0,this.bottom-6,this.W,this.g.size.H-this.bottom+6);
  this.button(main.id,main.label,16,this.bottom,this.W-32,main.action,'gold',!!main.disabled);
  if(hint)this.label(hint,this.W/2,this.bottom+63,12,'#B5BEC6','center');
 }

 private visible(y:number,h:number){
  return !!intersection({x:12,y,w:this.W-24,h},{x:12,y:this.contentTop,w:this.W-24,h:this.contentBottom-this.contentTop});
 }

 private surface(y:number,h:number,selected=false,locked=false){
  return inset(drawCompactCard(this.p,{x:16,y,w:this.W-32,h},locked?'locked':selected?'selected':'normal').content,8);
 }

 private list(blocks:{id:string;h:number;draw:(y:number)=>void}[],top=this.headBottom,hasBottomAction=true){
  this.contentTop=top;
  this.contentBottom=hasBottomAction?(this.bottom-8):(this.g.size.H-this.g.size.bottom-24);
  this.contentHeight=blocks.reduce((n,b)=>n+b.h+8,0);
  this.maxScroll=Math.max(0,this.contentHeight-(this.contentBottom-this.contentTop));
  this.scroll=Math.max(0,Math.min(this.scroll,this.maxScroll));
  this.g.menuProbe?.('viewport');
  this.g.menuLayers?.setViewport({x:12,y:top,w:this.W-24,h:Math.max(48,this.contentBottom-top)});
  this.activePaint=this.g.menuLayers?.content||null;this.inContent=true;
  let y=top-this.scroll;
  for(const b of blocks){
   if(this.visible(y,b.h)){
    this.itemRecords.push({id:b.id,bounds:{x:16,y,w:this.W-32,h:b.h}});
    b.draw(y);
   }
   y+=b.h+8;
  }
  this.activePaint=null;this.inContent=false;
 }

 private infoBlock(id:string,body:string,size=14){
  const h=layoutText(body,this.W-64,size,this.measure).height+26;
  return{id,h,draw:(y:number)=>{
   this.p.fillStyle='rgba(15,29,42,.88)';
   this.p.fillRect(16,y,this.W-32,h);
   this.p.fillStyle='rgba(186,158,98,0.42)';
   this.p.fillRect(28,y+2,this.W-56,1);
   this.text(body,{x:30,y:y+13,w:this.W-60,h:h-26},size);
  }};
 }

 private relation(id:string){
  const d=this.g.store.data;
  return d.captures.includes(id)?'收':d.visits.includes(id)?'访':d.allies.includes(id)?'盟':d.seen.includes(id)?'遇':'未遇';
 }

 private figure(id:string,x:number,y:number,w:number,h:number,unknown=false){
  this.g.menuProbe?.('icon');
  const key=[R2_PEOPLE[id],'r27_char_'+id+'_run0','c20_char_'+id+'_run','g_detail_'+id,'g_front_'+id+'Run0','g_boss_'+id+'_idle',...(id==='lubu'?['g_lubuIdle']:[]),'g_portrait_'+id].find(k=>MANIFEST.frames[k]);
  if(!key){
   if(unknown){drawState(this.p,{x:x-w/2,y:y-h,w,h},'locked');return;}
   throw Error('menu_required_person:'+id);
  }
  const f=MANIFEST.frames[key],scale=Math.min(w/f.r[2],h/f.r[3]);
  this.p.frame(key,x,y,h,{
   refH:h/scale,
   visualMode:unknown?'silhouette':'normal',
   silhouette:unknown,
   silhouetteColor:'#16222F',
  });
 }

 private icon(key:string,x:number,y:number,w:number,h=w,locked=false){
  this.g.menuProbe?.('icon');
  const f=MANIFEST.frames[key];
  if(!f)throw Error('menu_required_icon:'+key);
  const sc=Math.min(w/f.r[2],h/f.r[3]);
  this.p.frame(key,x,y,f.r[3]*sc,{
   center:true,
   visualMode:locked?'grayscale':'normal',
   grayscale:locked,
   tint:locked?'#8D99A6':undefined,
  });
  if(locked){
   drawState(this.p,{x:x+w*.18,y:y-h*.38,w:16,h:20},'locked');
  }
 }

 private weaponIcon(id:string){return MANIFEST.frames['c20_icon_'+id]?'c20_icon_'+id:'g_icon_'+id;}
 private hero(x:number,y:number,w:number,h:number){
  const l=this.g.store.loadout(),v=resolveWeaponPresentation(l.startWeaponId as WeaponId,'ready',l.treasures.ma),b=presentationBounds(v,75,150),k=Math.min(w/b.w,h/b.h);
  drawWeaponPresentation(this.p.frame.bind(this.p),v,x+(w-b.w*k)/2-b.x*k,y+(h-b.h*k)/2-b.y*k,75*k,150*k);
 }
 private detail(kind:'weapon'|'treasure',id:string,ret:MenuScreen){this.detailKind=kind;this.detailId=id;this.detailReturn=ret;this.g.show('item');}
 private confirm(title:string,text:string,actions:{id:string;label:string;action:()=>void}[],ret:MenuScreen){this.confirmTitle=title;this.confirmText=text;this.confirmActions=actions;this.confirmReturn=ret;this.g.show('confirm');}

 private equipPerson(id:string){
  const d=this.g.store.data,rel=this.relation(id);
  if(rel==='访'){this.g.store.equipSupport(id);this.g.drawMenu();return;}
  if(rel!=='收')return;
  if(!d.companions.includes(id)&&d.companions.length>=this.g.store.companionLimit){
   this.confirm('随军已满','选择一位替换；其收藏与永久成长保留。',d.companions.map(old=>({
    id:'replace-'+old,
    label:'替换 '+PEOPLE[old],
    action:()=>{d.companions=d.companions.filter(x=>x!==old);this.g.store.equipCompanion(id);this.g.show(this.confirmReturn);}
   })),this.g.screen);
   return;
  }
  this.g.store.equipCompanion(id);this.g.drawMenu();
 }

 draw(g:MenuHost){
  this.g=g;this.activePaint=null;this.inContent=false;this.textRecords=[];this.itemRecords=[];this.navBackRegistered=false;
  const key=[g.screen,g.screen==='prepare'?g.chapter:'',g.tab,this.filter,g.screen==='person'?g.personId:'',g.screen==='item'?this.detailId:'',g.screen==='reward'?g.store.data.pendingRewardPresentation?.key:''].join(':');
  const oldKey=this.views.key,v=this.views.enter(key,this.scroll,g.page,this.focus);
  if(key!==oldKey){this.scroll=v.scroll;g.page=v.page;this.focus=v.focus;}
  this.lastScreen=g.screen;this.lastTab=g.tab;this.maxScroll=0;this.contentTop=g.size.top+108;this.contentBottom=this.bottom-8;
  this.reducedMotion=!!g.platform.book.data.settings.reducedMotion;
  if(!NativePaint.textures.ui_full_components){
   this.p.fillStyle='#101D2B';this.p.fillRect(0,0,this.W,g.size.H);
   this.label(g.screen==='error'?'资源尚未就绪':'一路长歌：三国',this.W/2,g.size.H*.35,25,'#F1D9A0','center');
   this.wrap(g.screen==='error'?'加载失败，已保留进度。':'正在加载人物、战场与界面组件',24,g.size.H*.47,this.W-48,14);
   if(g.screen==='error'){
    this.label('重新加载',this.W/2,this.bottom+24,18,'#F1D9A0','center');
    this.hit('retry','重新加载',16,this.bottom,this.W-32,52,()=>{g.show('loading');void g.load();});
   }
   return;
  }
  if(g.screen==='home')this.home();
  if(g.screen==='chapters'||g.screen==='transition')g.drawMap();
  if(g.screen==='prepare')this.prepare();
  if(g.screen==='collection')this.collection();
  if(g.screen==='person')this.person();
  if(g.screen==='item')this.item();
  if(g.screen==='reward')this.reward();
  if(g.screen==='result')this.result();
  if(g.screen==='pause')this.pause();
  if(g.screen==='confirm')this.confirmView();
  if(g.screen==='settings')this.settings();
  if(g.screen==='loading'||g.screen==='error')this.loadView();
  if(g.screen==='battle')this.hit('pause','暂停战斗',4,g.size.top,48,48,()=>g.show('pause'));
  this.views.remember(this.scroll,g.page,this.focus);
  if(g.store.notice)this.saveError();
 }

 private home(){
  const g=this.g,{W,H,top,bottom}=g.size,n=g.store.completed,pending=!!g.store.data.pendingRewardPresentation;
  const layout=homeLayout(W,H,top,bottom,pending),l=g.store.loadout(),weapon=WEAPON_DATA[l.startWeaponId as WeaponId],chapter=CHAPTERS[Math.min(19,n)];
  this.homeEditorItems=[];
  const variables={
   '通关数':n,'关数':n+1,'地点':chapter.place,'关名':chapter.title,'兵器':weapon.label,
   '等级':g.store.data.weaponLevels[l.startWeaponId]||1,'成长提示':nextMilestoneHint(n),
   '出征文案':n===0?'开始征程':n===20?'重游山河':'继续征程',
   '关卡提示':n===20?'九州已定，再启征程':'第'+(n+1)+'关 · '+chapter.place+' · '+chapter.title
  };
  const activeEditorConfig=this.homeEditorOverride||HOME_EDITOR_CONFIG;
  const item=(id:HomeElementId,label:string,kind:HomeElementKind,r:{x:number;y:number;w:number;h:number},fontSize=15,text='')=>{
   const value=homeEditorItem(id,label,kind,r,fontSize,text,variables,activeEditorConfig,W,H);
   this.homeEditorItems.push(value);return value;
  };
  const text=(id:HomeElementId,label:string,r:{x:number;y:number;w:number;h:number},size:number,template:string,color:string)=>{
   const i=item(id,label,'text',r,size,template);this.text(i.text,i.rect,i.fontSize,color);
  };
  const button=(id:HomeElementId,label:string,r:{x:number;y:number;w:number;h:number},template:string,action:()=>void,tone:'gold'|'navy'='navy',fontSize=15)=>{
   const i=item(id,label,'button',r,fontSize,template);
   this.button(id==='reward'?'recover-reward':id,i.text,i.rect.x,i.rect.y,i.rect.w,action,tone,false,{height:i.rect.h,fontSize:i.fontSize});
  };
  const safeHeroRect={x:layout.hero.x,y:Math.max(top+72,layout.hero.y),w:layout.hero.w,h:Math.max(110,layout.actionTop-Math.max(top+72,layout.hero.y)-6)};
  const hero=item('hero','首页人物图','image',safeHeroRect);
  g.drawHomeArt?.(hero.rect);

  const fade=(y:number,h:number,stops:number[][])=>{
   const steps=Math.ceil(h);
   for(let i=0;i<steps;i++){
    const t=i/Math.max(1,steps-1);let j=1;while(j<stops.length-1&&t>stops[j][0])j++;
    const a=stops[j-1],b=stops[j],alpha=a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]);
    this.p.fillStyle='rgba(8,23,35,'+alpha+')';
    this.p.fillRect(0,y+i*h/steps,W,h/steps+.1);
   }
  };
  fade(0,top+136,[[0,.84],[.58,.42],[1,0]]);
  text('title','游戏标题',{x:22,y:top+8,w:layout.titleWidth,h:40},32,'一路长歌','#F4DDA4');
  text('progress','进度文字',{x:24,y:top+50,w:W-96,h:22},13,'三国 · 已克 {通关数}/20','#F3E8CF');
  button('settings','设置按钮',{x:W-78,y:top+10,w:62,h:48},'设置',()=>{this.settingsReturn='home';g.show('settings');},'navy',14);

  fade(layout.fadeTop-36,H-layout.fadeTop+36,[[0,0],[.30,.70],[.65,.92],[1,.98]]);
  const y=layout.actionTop;
  this.p.fillStyle='rgba(14,29,43,0.68)';
  this.p.fillRect(16,y-6,W-32,94);
  this.p.fillStyle='rgba(212,178,106,0.38)';
  this.p.fillRect(24,y-6,W-48,1);

  text('chapter','关卡文字',{x:24,y,w:W-48,h:26},18,'{关卡提示}','#F4DDA4');
  const icon=item('weaponIcon','兵器图标','image',{x:24,y:y+28,w:25,h:30});
  this.icon(this.weaponIcon(l.startWeaponId),icon.rect.x+icon.rect.w/2,icon.rect.y+icon.rect.h/2,icon.rect.w,icon.rect.h);
  text('weapon','兵器与等级文字',{x:56,y:y+32,w:W-80,h:22},14,'出征 {兵器} · 永久 Lv.{等级}','#D5DAD7');
  text('growth','成长提示',{x:24,y:y+62,w:W-48,h:22},12,'{成长提示}','#C9D3D5');

  const cleanButtonConfig:HomeButtonConfig=this.homeButtonOverride||{offsetX:0,offsetY:0,widthPercent:100,height:54,fontSize:17};
  const start=homeButtonLayout(W,H,top,bottom,pending,cleanButtonConfig);
  button('start','主出征按钮',start,'{出征文案}',()=>{g.chapter=Math.min(19,n);g.tab='weapons';g.page=0;g.show('prepare');},'gold',start.fontSize);
  button('chapters','山河地图按钮',{x:16,y:layout.navY,w:(W-44)/2,h:50},'山河地图',()=>g.show('chapters'),'navy',15);
  button('collection','军中图鉴按钮',{x:28+(W-44)/2,y:layout.navY,w:(W-44)/2,h:50},'军中图鉴',()=>{g.tab='people';g.page=0;g.show('collection');},'navy',15);
  if(pending)button('reward','待领奖按钮',{x:16,y:layout.rewardY,w:W-32,h:50},'继续查看已存奖励',()=>{g.rewardReturn='home';g.show('reward');},'navy',15);
  installHomeEditorPreview(this,g);
 }

 private tabs(ids:string[],names:string[],y=this.headBottom){
  const items=ids.map((id,i)=>({id,label:names[i]}));
  const bar=drawSegmentedBar(this.p,{x:16,y,w:this.W-32,h:46},items,this.g.tab);
  bar.segments.forEach(seg=>{
   this.hit('tab-'+seg.id,seg.label,seg.rect.x,y,seg.rect.w,48,()=>{
    if(this.g.tab!==seg.id){this.g.tab=seg.id;this.g.page=0;this.scroll=0;}
    this.g.drawMenu();
   });
  });
  this.contentTop=y+54;
 }

 private prepare(){
  const g=this.g,l=g.store.loadout(),W=this.W,c=CHAPTERS[g.chapter];
  this.header('第'+(g.chapter+1)+'关 · '+c.place,'敌将 '+PEOPLE[c.boss]+' · '+(c.keyMechanic||'数值门与敌阵推进'),()=>g.show('home'));
  const y=this.headBottom;
  const box=drawCompactPanel(this.p,{x:16,y,w:W-32,h:104},'normal'),r=inset(box.content,6);
  const selected=l.startWeaponId as WeaponId,lv=g.store.data.weaponLevels[selected]||1;
  this.hero(r.x,r.y,44,40);
  this.text(WEAPON_DATA[selected].label,{x:r.x+54,y:r.y,w:r.w-132,h:20},15,'#F1D9A0');
  this.text('永久 Lv.'+lv+' · 本局Ⅰ阶',{x:r.x+54,y:r.y+21,w:r.w-132,h:18},12,'#C7D1D6');
  this.button('view-lineup','编组',W-98,y+10,64,()=>{
   this.confirm('当前编组','主将 '+WEAPON_DATA[selected].label+'\n随军 '+(l.companions.map(id=>PEOPLE[id]).join('、')||'未编入')+' · 支援 '+(PEOPLE[l.support||'']||'未编入'),[
    {id:'lineup-weapon',label:'查看当前兵器',action:()=>this.detail('weapon',selected,'prepare')},
    {id:'lineup-tactic',label:'兵法 · '+(l.tactic==='zhenjun'?'震军':'贯阵')+' · 切换',action:()=>{
     g.store.equipTactic();
     if(g.screen==='confirm'){
      const current=g.store.loadout().tactic;
      this.confirmActions.find(a=>a.id==='lineup-tactic')!.label='兵法 · '+(current==='zhenjun'?'震军':'贯阵')+' · 切换';
      g.drawMenu();
     }
    }}
   ],'prepare');
  },'navy',false,{height:48,fontSize:14});
  this.text('随军 '+(l.companions.map(id=>PEOPLE[id]).join('、')||'未编入')+' · 支援 '+(PEOPLE[l.support||'']||'未编入'),{x:r.x,y:r.y+42,w:r.w,h:18},12);
  const slots=(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典',qi:'器',ma:'骑'}[slot])+' '+(l.treasures[slot]?TREASURES[l.treasures[slot]!].name:g.store.slotOpen(slot)?'空':'锁'));
  this.text(slots.join(' · '),{x:r.x,y:r.y+62,w:r.w,h:18},12,'#BAC6CE');

  this.tabs(['companions','support','treasures','weapons'],['随军','支援','宝物','兵器'],y+110);
  const weapon=g.tab==='weapons',treasure=g.tab==='treasures',owned=(id:string)=>weapon?g.store.data.weapons.includes(id):treasure?g.store.data.treasures.includes(id):true;
  let rows=weapon?Object.keys(WEAPON_DATA):treasure?Object.keys(TREASURES):g.tab==='support'?g.store.data.visits:g.store.data.captures;
  const isSelected=(id:string)=>weapon?l.startWeaponId===id:treasure?l.treasures[TREASURES[id].slot]===id:g.tab==='support'?l.support===id:l.companions.includes(id);
  rows=rows.map((id,i)=>({id,i,priority:isSelected(id)?0:owned(id)?1:2})).sort((a,b)=>a.priority-b.priority||a.i-b.i).map(v=>v.id);

  const blocks=rows.map(id=>{
   const name=weapon?WEAPON_DATA[id as WeaponId].label:treasure?TREASURES[id].name:PEOPLE[id];
   const desc=weapon?(owned(id)?'永久 Lv.'+(g.store.data.weaponLevels[id]||1)+' · 本局Ⅰ阶':'第'+(CHAPTERS.findIndex(ch=>ch.weapon===id)+1)+'关首通获得'):treasure?({dian:'典籍',qi:'器物',ma:'坐骑'}[TREASURES[id].slot])+' · '+(owned(id)?'已收藏':'未获得'):personRole(id);
   const titleH=layoutText(name,W-190,15,this.measure).height,descH=layoutText(desc,W-190,12,this.measure).height,h=Math.max(78,titleH+descH+30);
   return{id,h,draw:(ry:number)=>{
    const isOwned=owned(id),sel=isSelected(id),rc=this.surface(ry,h,sel,!isOwned);
    if(weapon)this.icon(this.weaponIcon(id),rc.x+21,ry+h/2,40,46,!isOwned);
    else if(treasure)this.icon(TREASURES[id].icon,rc.x+21,ry+h/2,40,46,!isOwned);
    else this.figure(id,rc.x+21,rc.y+rc.h,42,rc.h,false);
    this.text((sel?'✓ ':'')+name,{x:82,y:rc.y,w:W-180,h:titleH},15,isOwned?'#F1D9A0':'#9CA8B2');
    this.text(desc,{x:82,y:rc.y+titleH+2,w:W-180,h:descH},12,isOwned?'#D5DAD7':'#8E9AA4');
    this.hit((weapon?'select-':treasure?'treasure-':g.tab==='support'?'support-':'comp-')+id,name,16,ry,W-104,h,()=>{
     if(!isOwned){this.detail(weapon?'weapon':'treasure',id,'prepare');return;}
     if(weapon){g.store.selectWeapon(id);this.scroll=0;}
     else if(treasure){
      const t=TREASURES[id],old=l.treasures[t.slot];
      if(!g.store.slotOpen(t.slot)){this.detail('treasure',id,'prepare');return;}
      if(old&&old!==id){
       this.confirm('替换'+({dian:'典籍',qi:'器物',ma:'坐骑'}[t.slot]),TREASURES[old].name+' → '+t.name,[{id:'replace-treasure',label:'确认佩戴',action:()=>{g.store.equipTreasure(id);g.show('prepare');}}],'prepare');
       return;
      }
      g.store.equipTreasure(id);
     }else this.equipPerson(id);
     g.drawMenu();
    });
    this.button('detail-'+id,'详情',W-84,ry+(h-48)/2,68,()=>{
     if(weapon||treasure)this.detail(weapon?'weapon':'treasure',id,'prepare');
     else{g.personId=id;this.detailReturn='prepare';g.show('person');}
    },'navy',false,{height:48,fontSize:14});
   }};
  });
  if(!rows.length)blocks.push(this.infoBlock('empty',g.tab==='support'?'第二关寻访后开放支援。主将已整装，可直接出征。':'通关后可邀请同袍。主将已整装，可直接出征。'));
  blocks.push({id:'tactic',h:60,draw:(ry:number)=>{
   const rc=this.surface(ry,60);
   this.text('兵法 · '+(l.tactic==='zhenjun'?'震军':'贯阵')+' · 点击切换',{x:rc.x,y:rc.y,w:rc.w,h:rc.h},14,'#F1D9A0');
   this.hit('tactic','切换兵法',16,ry,W-32,60,()=>{g.store.equipTactic();g.drawMenu();});
  }});
  if(g.store.data.weaponTrialPrevious&&g.store.data.weaponTrialPrevious!==selected){
   blocks.push({id:'restore',h:50,draw:(ry:number)=>this.button('restore-weapon','恢复原兵器',16,ry,W-32,()=>{
    const id=String(g.store.data.weaponTrialPrevious);g.store.data.weaponTrialPrevious=null;g.store.selectWeapon(id);g.drawMenu();
   },'navy',false,{height:50,fontSize:14})});
  }
  blocks.push(this.infoBlock('treasure-summary',(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'：'+(l.treasures[slot]?TREASURES[l.treasures[slot]!].name:g.store.slotOpen(slot)?'未佩戴':'槽未开')).join('\n')));
  this.list(blocks,this.contentTop,true);
  this.footer({id:'depart',label:'出征',action:()=>g.begin(),disabled:!!g.store.notice},()=>g.show('home'),this.maxScroll?'上滑查看 · 详情返回保留位置':'编组已就绪');
 }

 private collection(){
  const g=this.g,d=g.store.data;
  if(!['people','weapons','treasures'].includes(g.tab))g.tab='people';
  const peopleIds=Object.keys(PEOPLE);
  const weaponIds=Object.keys(WEAPON_DATA);
  const treasureIds=Object.keys(TREASURES);
  const seenPeopleCount=new Set(peopleIds.filter(id=>this.relation(id)!=='未遇')).size;
  const captureCount=new Set(d.captures.filter(id=>PEOPLE[id])).size;
  const visitCount=new Set(d.visits.filter(id=>PEOPLE[id])).size;
  const allyCount=new Set(d.allies.filter(id=>PEOPLE[id])).size;
  const ownedWeaponCount=new Set(d.weapons.filter(id=>WEAPON_DATA[id as WeaponId])).size;
  const ownedTreasureCount=new Set(d.treasures.filter(id=>TREASURES[id])).size;

  let headerTitle='军中图鉴 · 人物';
  let headerSub=`已遇 ${seenPeopleCount}/${peopleIds.length} · 收服 ${captureCount} · 支援 ${visitCount} · 盟约 ${allyCount}`;
  if(g.tab==='weapons'){
   const curWeapon=WEAPON_DATA[g.store.loadout().startWeaponId as WeaponId]?.label||'长枪';
   headerTitle='军中图鉴 · 兵器';
   headerSub=`已获得 ${ownedWeaponCount}/${weaponIds.length} · 出征 ${curWeapon} · 军功 ${d.xp}`;
  }else if(g.tab==='treasures'){
   const equippedCount=(['dian','qi','ma'] as Slot[]).filter(s=>g.store.loadout().treasures[s]).length;
   headerTitle='军中图鉴 · 宝物';
   headerSub=`已收藏 ${ownedTreasureCount}/${treasureIds.length} · 已佩戴 ${equippedCount}/3`;
  }
  this.header(headerTitle,headerSub,()=>g.show('home'));
  this.tabs(['people','weapons','treasures'],['人物','兵器','宝物']);

  const filters=g.tab==='people'?['all','seen','companion','support','ally']:['all','owned'];
  const names=g.tab==='people'?['全部','已遇','随军','支援','盟约']:[g.tab==='weapons'?'全部':'全部',g.tab==='weapons'?'已获得':'已收藏'];
  const active=filters.includes(this.filter)?this.filter:'all';
  const fy=this.contentTop,w=(this.W-32-6*(filters.length-1))/filters.length;
  filters.forEach((f,i)=>{
   const x=16+i*(w+6);
   drawFilterPill(this.p,{x,y:fy,w,h:34},names[i],active===f);
   this.hit('filter-'+f,names[i],x,fy-6,w,48,()=>{if(this.filter!==f){this.filter=f;g.page=0;}g.drawMenu();});
  });

  let ids=g.tab==='people'?peopleIds:g.tab==='weapons'?weaponIds:treasureIds;
  ids=ids.filter(id=>g.tab==='people'
   ?(active==='all'||active==='seen'&&this.relation(id)!=='未遇'||active==='companion'&&d.captures.includes(id)||active==='support'&&d.visits.includes(id)||active==='ally'&&d.allies.includes(id))
   :(active==='all'||(g.tab==='weapons'?d.weapons:d.treasures).includes(id))
  );

  const start=fy+44,end=this.g.size.H-this.g.size.bottom-64,rowH=132,rows=Math.max(1,Math.floor((end-start)/(rowH+8))),per=rows*2,pages=Math.max(1,Math.ceil(ids.length/per));
  g.page=Math.max(0,Math.min(g.page,pages-1));
  const cw=(this.W-44)/2;
  this.contentTop=start;this.contentBottom=end;
  g.menuLayers?.setViewport({x:12,y:start,w:this.W-24,h:Math.max(48,end-start)});
  this.activePaint=g.menuLayers?.content||null;this.inContent=true;

  ids.slice(g.page*per,(g.page+1)*per).forEach((id,i)=>{
   const x=16+i%2*(cw+12),y=start+Math.floor(i/2)*(rowH+8),person=g.tab==='people',weapon=g.tab==='weapons';
   const rel=person?this.relation(id):'';
   const unlocked=person?(rel!=='未遇'):(weapon?d.weapons:d.treasures).includes(id);
   const isFocused=this.focus===(person?'person-':'item-')+id;
   const r=inset(drawCompactCard(this.p,{x,y,w:cw,h:rowH},!unlocked?'locked':isFocused?'selected':'normal').content,8);
   if(person){
    this.figure(id,x+cw/2,r.y+64,r.w,64,!unlocked);
   }else{
    this.icon(weapon?this.weaponIcon(id):TREASURES[id].icon,x+cw/2,r.y+30,58,56,!unlocked);
   }
   const itemTitle=person?(unlocked?PEOPLE[id]:'未遇之人'):weapon?WEAPON_DATA[id as WeaponId].label:TREASURES[id].name;
   this.text(itemTitle,{x:r.x,y:r.y+66,w:r.w,h:20},14,unlocked?'#F1D9A0':'#9AA6B0','center');
   const badge=person
    ?(({收:'收服 · 可随军',访:'寻访 · 可支援',盟:'盟约 · 常驻',遇:'已遇 · 待结缘',未遇:'尚未相逢'} as Record<string,string>)[rel]||'')
    :(unlocked?(weapon?'永久 Lv.'+(d.weaponLevels[id]||1):'已收藏'):'未获得');
   this.text(badge,{x:r.x,y:r.y+84,w:r.w,h:18},12,unlocked?'#BAC8D0':'#7F8C96','center');
   this.hit((person?'person-':'item-')+id,'查看详情',x,y,cw,rowH,()=>{
    this.detailReturn='collection';
    if(person){g.personId=id;g.show('person');}
    else this.detail(weapon?'weapon':'treasure',id,'collection');
   });
  });
  this.activePaint=null;this.inContent=false;
  const py=this.g.size.H-this.g.size.bottom-56;
  this.button('prev-page','上一页',16,py,96,()=>{g.page=(g.page+pages-1)%pages;g.drawMenu();},'navy',pages<=1,{height:48,fontSize:14});
  this.button('next-page','下一页',this.W-112,py,96,()=>{g.page=(g.page+1)%pages;g.drawMenu();},'navy',pages<=1,{height:48,fontSize:14});
  this.label(`第 ${g.page+1}/${pages} 页 · 共 ${ids.length} 项`,this.W/2,py+24,12,'#F1D9A0','center');
  this.footer(undefined,()=>g.show('home'));
 }

 private person(){
  const g=this.g,id=g.personId;
  if(!Object.prototype.hasOwnProperty.call(PEOPLE,id))throw Error('unknown_person:'+id);
  const rel=this.relation(id),known=rel!=='未遇',info=PERSON_PROFILES[id];
  const c=CHAPTERS.find(ch=>ch.boss===id||ch.enemy.includes(id)||ch.capture.includes(id)||ch.visit.includes(id)||ch.allies.includes(id));
  const titleStr=known?(PEOPLE[id]+(info?.[0]?' · 字'+info[0]:'')+(info?.[1]?' · '+info[1]:'')):'未遇之人';
  const subStr=known
   ?`${info?.[2]||'三国人物'} · ${({收:'已收服 · 可编入随军',访:'已寻访 · 可安排支援',盟:'已结盟 · 盟约常驻',遇:'已相逢 · 尚未归附',未遇:'未遇'}[rel])}`
   :'循征程前行，再会天下英杰';
  const retScreen=this.detailReturn==='reward'?'reward':this.detailReturn==='prepare'?'prepare':'collection';
  this.header(titleStr,subStr,()=>g.show(retScreen));

  const lines:string[]=[
   known?personRole(id):'人物剪影 · 推进关隘相逢后可揭示身份与能力',
   c?'相逢关隘 · 第'+(CHAPTERS.indexOf(c)+1)+'关 '+(known?c.place+' · '+c.title:c.faction+'篇'):'继续推进征程'
  ];
  if(known){
   const owner=Object.values(WEAPON_DATA).find(w=>w.owner===id);
   if(owner)lines.push('共鸣兵器 · '+owner.label);
   if(info&&info[3])lines.push(info[2]+'：'+info[3]);
  }
  if(rel==='盟')lines.push('盟约常驻加成，无需占用随军或支援槽位。');

  const canEquip=rel==='收'||rel==='访';
  const portraitH=known&&info?.[3]&&info[3].length>28?164:188;
  const blocks=[
   {id:'portrait',h:portraitH,draw:(y:number)=>{
    const r=inset(drawCompactPanel(this.p,{x:16,y,w:this.W-32,h:portraitH},'raised').content,8);
    this.figure(id,this.W/2,r.y+r.h,this.W*.58,r.h,!known);
   }},
   this.infoBlock('biography',lines.join('\n\n'))
  ];
  this.list(blocks,this.headBottom,canEquip);
  const equipped=rel==='收'?g.store.data.companions.includes(id):g.store.data.support===id;
  this.footer(
   canEquip?{
    id:'person-equip',
    label:equipped?'移出'+(rel==='收'?'随军':'支援'):'编入'+(rel==='收'?'随军':'支援'),
    action:()=>this.equipPerson(id),
    disabled:rel==='访'&&g.store.completed<2
   }:undefined,
   ()=>g.show(retScreen),
   this.maxScroll?'上滑查看完整经历':''
  );
 }

 /**
  * Weapon / Treasure Detail Screen (`item`):
  * - Reclaims the bottom 72px bar when no primary action is available (`!hasAction`),
  *   such as unowned items, max-level weapons, insufficient XP, or unopened treasure slots.
  */
private item(){
  const g=this.g,id=this.detailId,weapon=this.detailKind==='weapon',w=WEAPON_DATA[id as WeaponId],t=TREASURES[id];
  const owned=(weapon?g.store.data.weapons:g.store.data.treasures).includes(id),lv=g.store.data.weaponLevels[id]||1,slot=t?.slot,cost=TUNING.upgradeCost(lv);
  this.header(
   weapon?w.label:t.name,
   weapon?('兵器册 · '+(owned?'永久 Lv.'+lv:'未获得')+' · 本局Ⅰ阶起'):(({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+' · '+(owned?'已收藏':'未获得')),
   ()=>g.show(this.detailReturn)
  );
  const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[{
   id:'item-body',
   h:112,
   draw:(y:number)=>{
    const r=inset(drawCompactPanel(this.p,{x:16,y,w:this.W-32,h:112},'raised').content,8);
    this.icon(weapon?this.weaponIcon(id):t.icon,this.W/2,r.y+r.h/2,r.w*.65,r.h,!owned);
   }
  }];
  const firstChapIdx=CHAPTERS.findIndex(ch=>weapon?ch.weapon===id:ch.treasure===id);
  const acquireHint=firstChapIdx>=0?('获取方式：第'+(firstChapIdx+1)+'关（'+CHAPTERS[firstChapIdx].place+'）首通获得'):'获取方式：征程行军或关隘首通获得';
  const statusLine=weapon
   ?(!owned?acquireHint:lv>=TUNING.weaponMaxLevel?'升级状态：永久等级已满（Lv.5）':g.store.data.xp<cost?('当前军功：'+g.store.data.xp+'（升级需 '+cost+' 军功，还差 '+(cost-g.store.data.xp)+'）'):('当前军功：'+g.store.data.xp+' · 可消耗 '+cost+' 军功升级'))
   :(!owned?acquireHint:!g.store.slotOpen(slot)?'当前状态：已收藏，对应宝物槽尚未开启':g.store.data.slots[slot]===id?'当前状态：已佩戴':'当前状态：已收藏，可佩戴');
  const body=weapon
   ?[
    owned?('永久等级：Lv.'+lv+' · 基础伤害 +'+Math.round((lv-1)*TUNING.weaponLevelDamage*100)+'%'):'当前状态：尚未获得',
    '局内规则：本局Ⅰ阶出征，局内拾取同兵器匣可升Ⅱ/Ⅲ阶',
    lv<TUNING.weaponMaxLevel?('下一永久等级：Lv.'+(lv+1)+'（伤害 +'+Math.round(lv*TUNING.weaponLevelDamage*100)+'%）'):'永久等级已达上限（Lv.5）',
    '武将共鸣：'+(w.owner?(PEOPLE[w.owner]+' / '+w.label):'通用主将兵器'),
    statusLine
   ].join('\n')
   :[
    '宝物效果：'+t.effect,
    '所属槽位：'+({dian:'典籍槽（第1关首通开启）',qi:'器物槽（第2关首通开启）',ma:'坐骑槽（第3关首通开启）'}[slot]),
    statusLine
   ].join('\n');
  blocks.push(this.infoBlock('growth-ability',body));
  if(weapon&&owned){
   blocks.push({
    id:'choose',
    h:50,
    draw:(y:number)=>this.button('choose-item',g.store.loadout().startWeaponId===id?'已选为出征兵器':'设为出征兵器',16,y,this.W-32,()=>{
     g.store.selectWeapon(id);
     g.drawMenu();
    },'navy',false,{height:50,fontSize:14})
   });
  }
  const hasAction=owned&&(weapon?(lv<TUNING.weaponMaxLevel&&g.store.data.xp>=cost):g.store.slotOpen(slot));
  this.list(blocks,this.headBottom,hasAction);
  this.footer(
   hasAction?{
    id:weapon?'upgrade-item':'equip-item',
    label:weapon?('升级 · '+cost+'军功'):(g.store.data.slots[slot]===id?'移出当前槽':'佩戴到'+({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])),
    action:()=>{
     if(weapon){
      g.store.upgrade(id);
      g.drawMenu();
     }else{
      const old=g.store.data.slots[slot];
      if(old&&old!==id){
       this.confirm('替换'+({dian:'典籍',qi:'器物',ma:'坐骑'}[slot]),TREASURES[old].name+' → '+t.name,[{
        id:'replace-treasure',
        label:'确认佩戴',
        action:()=>{
         g.store.equipTreasure(id);
         g.show('item');
        }
       }],'item');
      }else{
       g.store.equipTreasure(id);
       g.drawMenu();
      }
     }
    }
   }:undefined,
   ()=>g.show(this.detailReturn),
   weapon?'升级与选择分开 · 不改变本局阶位':'替换需确认 · 取消保留原配装'
  );
 }


 private reward(){
  const g=this.g,r=g.store.data.pendingRewardPresentation;
  if(!r){g.show(g.rewardReturn);return;}
  const previous=this.rewardClock.get(r.key)||0,age=this.reducedMotion?3:Math.max(previous,g.screenAge);
  this.rewardClock.set(r.key,age);
  const title=r.kind==='migration'?'征程更新':r.chapter===9&&r.kind==='milestone'?'上篇完成 · 下篇开启':r.chapter===19?'二十关贯通 · 九州长歌':r.title;
  const unique=Array.from(new Map(r.items.map(i=>[i.kind+':'+i.id,i])).values());
  const primary=unique.find(i=>i.kind==='weapon'&&i.isNew)||unique.find(i=>i.kind==='person'&&i.isNew)||unique[0];
  const remaining=unique.filter(i=>i!==primary);
  this.header(title,r.kind==='migration'?'原收藏与配装保留':(g.store.notice?'保存未完成':'已入库')+' · 本次共'+unique.length+'项 · 军功 +'+r.xp,()=>g.show(g.rewardReturn));
  const primaryH=unique.length<=3?216:124;
  const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[];
  if(r.kind==='migration')blocks.push(this.infoBlock('migration','补齐 '+r.backfilled+' 座里程碑\n军功 +'+r.xp+' · 原收藏与配装保留'));
  if(primary){
   blocks.push({id:'primary',h:primaryH,draw:(y:number)=>{
    const r0=this.surface(y,primaryH,true);
    const progress=this.reducedMotion?1:Math.max(.15,Math.min(1,(age-.18)/.47));
    this.p.save();this.p.globalAlpha=progress;
    const visualH=primaryH-64,cy=r0.y+visualH/2;
    if(primary.kind==='person')this.figure(primary.id,this.W/2,r0.y+visualH,this.W*.58,visualH);
    else this.icon(primary.kind==='weapon'?this.weaponIcon(primary.id):primary.kind==='treasure'?TREASURES[primary.id].icon:'c20_stamp_'+Number(primary.id.replace('badge_m','')),this.W/2,cy,primaryH>124?148:98,visualH);
    this.p.restore();
    this.text(rewardLabel(primary),{x:r0.x,y:y+primaryH-46,w:r0.w,h:24},18,'#F1D9A0','center');
    this.hit('reward-primary','查看主要奖励',16,y,this.W-32,primaryH,()=>{
     this.detailReturn='reward';
     if(primary.kind==='person'){g.personId=primary.id;g.show('person');}
     else if(primary.kind==='weapon'||primary.kind==='treasure')this.detail(primary.kind,primary.id,'reward');
    });
   }});
   if(unique.length<=3){
    const purpose=primary.kind==='weapon'?'可在整备选择'+WEAPON_DATA[primary.id as WeaponId].label+'出征；同兵器匣提升本局阶位，图鉴可提升永久等级。':primary.kind==='treasure'?TREASURES[primary.id].effect:primary.kind==='person'?personRole(primary.id)+' · '+(primary.relation==='收'?'整备可编入随军。':primary.relation==='访'?'整备可安排支援。':'盟约常驻，不占编组位。'):nextMilestoneHint(g.store.completed);
    blocks.push(this.infoBlock('primary-purpose',purpose,14));
   }
  }
  for(let i=0;i<remaining.length;i+=2){
   const group=remaining.slice(i,i+2),w=(this.W-44)/2,h=Math.max(72,...group.map(it=>layoutText(rewardLabel(it),w-62,14,this.measure).height+44));
   blocks.push({id:'tray-'+i,h,draw:(y:number)=>group.forEach((it,j)=>{
    const x=16+j*(w+12),r0=inset(drawCompactCard(this.p,{x,y,w,h},'normal').content,8);
    this.p.save();this.p.globalAlpha=this.reducedMotion?1:Math.max(.18,Math.min(1,(age-.55-j*.06)/.5));
    if(it.kind==='person')this.figure(it.id,r0.x+15,r0.y+r0.h,30,r0.h);
    else this.icon(it.kind==='weapon'?this.weaponIcon(it.id):it.kind==='treasure'?TREASURES[it.id].icon:'c20_stamp_'+Number(it.id.replace('badge_m','')),r0.x+15,y+h/2,28,34);
    this.p.restore();
    this.text(rewardLabel(it),{x:r0.x+38,y:r0.y,w:r0.w-38,h:h-42},14,'#F1D9A0');
    this.text(it.relation?({收:'可随军',访:'可支援',盟:'盟约'}[it.relation]):it.isNew?'新收藏':'已有收藏',{x:r0.x+38,y:r0.y+h-52,w:r0.w-38,h:16},12);
    this.hit('reward-item-'+it.id,'查看奖励详情',x,y,w,h,()=>{
     if(it.kind==='person'){g.personId=it.id;this.detailReturn='reward';g.show('person');}
     else if(it.kind==='weapon'||it.kind==='treasure')this.detail(it.kind,it.id,'reward');
    });
   })});
  }
  if(r.kind==='milestone')blocks.push(this.infoBlock('next-milestone',nextMilestoneHint(g.store.completed),13));
  this.list(blocks,this.headBottom,true);
  this.footer({
   id:'reward-done',
   label:age<1.8?'收下 · 跳过演出':'全部收下',
   disabled:!canSkipPresentation(age)||!!g.store.notice,
   action:()=>{if(g.store.acknowledgePresentation())g.show(g.rewardReturn);else g.drawMenu();}
  },()=>g.show(g.rewardReturn),this.maxScroll?'上滑查看余项 · 本次'+unique.length+'项':'已保存 · 收下仅结束演出');
 }

 private result(){
  const g=this.g,st=g.battle?.state,won=(st?.troops||0)>0,receipt=g.resultReceipt,c=CHAPTERS[g.chapter],next=Math.min(19,g.chapter+1);
  const xp=receipt?.xp??Number(won?g.store.data.lastRewardXP||0:g.store.data.lastPracticeXP||0);
  this.header(won?'胜利 · '+c.place:'失败','第'+(g.chapter+1)+'关 · '+c.place+' · 已通关 '+g.store.completed+'/20',()=>g.show('home'),'返回营地');
  const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[];
  if(won){
   blocks.push({id:'victory-focus',h:126,draw:(y:number)=>{
    const banner=drawBanner(this.p,{x:16,y,w:this.W-32,h:58},'victory');
    this.text(c.place+' · 胜利',{...banner.content,y:banner.content.y+2,h:24},18,'#F1D9A0','center');
    this.p.frame('c20_site_city',this.W/2,y+121,64);
    this.p.frame('c20_flag_done',this.W/2+42,y+105,42);
   }});
  }
  blocks.push(this.infoBlock('battle-result','剩余兵力 '+Math.round(st?.troops||0)+' · 本局军功 +'+xp+'\n累计军功 '+g.store.data.xp+(g.store.notice?' · 保存未完成':' · 已保存'),15));
  if(won){
   const items=Array.from(new Map((receipt?.items||[]).map((i:any)=>[i.kind+':'+i.id,i])).values()) as any[];
   blocks.push(this.infoBlock('new-collection',g.first?items.map(i=>rewardLabel(i)).join(' · ')||'首通进度已记录':'重游战果已记录 · 首通收藏不重复授予'));
   blocks.push(this.infoBlock('next-target',g.chapter===19?'二十关贯通 · 可回山河重游':'下一出征 · 第'+(next+1)+'关 '+CHAPTERS[next].place+'\n全局下一里程碑 · '+nextMilestoneHint(g.store.completed),13));
  }else{
   blocks.push(this.infoBlock('losses',resultLossSummary(g.battle?.snapshot().damageSources)));
   blocks.push(this.infoBlock('retry-context','已通关进度、军功和收藏都会保留。\n直接重试会使用当前编组，也可以先调整再出征。',13));
  }
  blocks.push({id:'adjust',h:50,draw:(y:number)=>this.button('view-reward',won?'整备查看':'调整编组',16,y,this.W-32,()=>{g.tab='companions';g.show('prepare');},'navy',false,{height:50,fontSize:14})});
  if(won&&c.weapon){
   blocks.push({id:'try',h:50,draw:(y:number)=>this.button('try-weapon','下关试用 · '+WEAPON_DATA[c.weapon!].label,16,y,this.W-32,()=>{
    g.store.data.weaponTrialPrevious=g.store.data.selectedWeaponId;
    if(g.store.selectWeapon(c.weapon!)){g.chapter=next;g.tab='weapons';g.show('prepare');}
   },'navy',false,{height:50,fontSize:14})});
  }
  this.list(blocks,this.headBottom,true);
  this.footer({
   id:'next',
   label:won?(g.chapter===19?'重游山河':'整军 · 第'+(next+1)+'关'):'重试本关',
   disabled:!!g.store.notice,
   action:()=>{if(!won)g.begin();else g.show(g.chapter===19?'chapters':'transition');}
  },()=>g.show('home'),'','返回营地');
 }

 private pause(){
  const g=this.g;
  this.p.fillStyle='rgba(8,18,28,.97)';this.p.fillRect(0,0,this.W,g.size.H);
  this.header('暂歇','战斗、音效与位移已暂停',()=>g.show('battle'),'继续');
  const y=g.size.H*.39;
  drawDialog(this.p,{x:16,y:y-22,w:this.W-32,h:224});
  this.button('continue','继续战斗',32,y,this.W-64,()=>g.show('battle'),'gold');
  this.button('restart','重新挑战',32,y+66,this.W-64,()=>this.confirm('重新挑战？','尚未结算的本局收益将舍弃；永久收藏与存档保留。',[{id:'confirm-restart',label:'确认重新挑战',action:()=>g.begin()}],'pause'),'navy');
  this.button('quit','返回营地',32,y+132,this.W-64,()=>this.confirm('离开当前战斗？','尚未结算的本局收益将舍弃；永久收藏与存档保留。',[{id:'confirm-quit',label:'确认返回营地',action:()=>g.show('home')}],'pause'),'warning');
 }

 private confirmView(){
  const g=this.g;
  this.p.fillStyle='rgba(8,18,28,.98)';this.p.fillRect(0,0,this.W,g.size.H);
  this.header(this.confirmTitle,this.confirmTitle==='当前编组'?'当前配装 · 出征以此为准':'确认前不会执行操作',()=>g.show(this.confirmReturn));
  const body=this.confirmText+(this.confirmTitle==='当前编组'?'\n'+(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'：'+(g.store.loadout().treasures[slot]?TREASURES[g.store.loadout().treasures[slot]!].name:'未佩戴')).join('\n'):'');
  const blocks=[this.infoBlock('confirm-context',body)];
  if(this.confirmTitle==='当前编组')blocks.unshift({id:'lineup',h:180,draw:(y:number)=>this.hero(30,y+12,this.W-60,154)});
  for(const a of this.confirmActions){
   blocks.push({id:a.id,h:52,draw:(y:number)=>this.button(a.id,a.label,24,y,this.W-48,a.action,this.confirmTitle==='当前编组'?'navy':'warning')});
  }
  this.list(blocks,this.headBottom,false);
  this.footer(undefined,()=>g.show(this.confirmReturn));
 }

 private settings(){
  const g=this.g,b=g.platform.book;
  this.header('行军设置','山河长歌 · 音乐与音效独立',()=>g.show(this.settingsReturn));
  const setting=(key:'music'|'sfx'|'vibration'|'reducedMotion',name:string)=>({
   id:key,h:50,draw:(y:number)=>this.button(key==='reducedMotion'?'motion':key,name+' · '+(b.data.settings[key]?'开':'关'),16,y,this.W-32,()=>{
    const old=!!b.data.settings[key];b.data.settings[key]=!old;
    if(b.persist()===false){b.data.settings[key]=old;this.settingsNotice='设置保存失败，仍使用原值；请重试。';}
    else this.settingsNotice='设置已保存';
    g.platform.syncAudio(false);g.battle?.clearAudioEvents();g.drawMenu();
   },'navy',false,{height:50,fontSize:14})
  });
  const build=BRIDGE_BUILD as any;
  const blocks=[
   setting('music','背景音乐'),
   {id:'music-volume',h:50,draw:(y:number)=>this.button('music-volume','音乐音量 · '+Math.round((b.data.settings.musicVolume??.6)*100)+'%',16,y,this.W-32,()=>{
    const old=b.data.settings.musicVolume,v=old??.6;
    b.data.settings.musicVolume=v<.45?.6:v<.75?.9:.3;
    if(b.persist()===false){b.data.settings.musicVolume=old;this.settingsNotice='设置保存失败，仍使用原值；请重试。';}
    else this.settingsNotice='音乐音量已保存';
    g.platform.syncAudio(false);g.drawMenu();
   },'navy',false,{height:50,fontSize:14})},
   setting('sfx','音效'),
   setting('vibration','震动'),
   setting('reducedMotion','降低动态'),
   this.infoBlock('music-help','静观山河：营地与设置。踏阵而行：战斗。切换场景平滑过渡，暂停和切后台停止播放。',13),
   this.infoBlock('motion-help','降低动态减少非必要位移、闪烁与缩放；保留信息和危险预警，不改变战斗节奏。',13),
   this.infoBlock('real-version','运行平台 '+build.target+'\n应用版本 '+(build.app_version||'包未写入')+' / '+(build.build_number||'unknown')+'\n构建 '+build.build_id+'\n代码 '+build.code_fingerprint.slice(0,16),13)
  ];
  if(this.settingsNotice)blocks.push(this.infoBlock('settings-result',this.settingsNotice,13));
  this.list(blocks,this.headBottom,false);
  this.footer(undefined,()=>g.show(this.settingsReturn),this.settingsNotice);
 }

 private loadView(){
  const g=this.g,isErr=g.screen==='error';
  this.header(isErr?'资源尚未就绪':'整装待发',isErr?'已保留本机存档':'正在加载资源 · 不显示未知百分比',()=>g.show('home'));
  drawState(this.p,{x:this.W/2-30,y:this.headBottom+18,w:60,h:60},isErr?'error':'loading');
  const blocks=[this.infoBlock('load-state',isErr?'资源加载失败，请重试。原进度与配装保留。':'战场、人物、界面组件加载中')];
  if(isErr){
   blocks.push({id:'dev-detail',h:50,draw:(y:number)=>this.button('error-detail',this.errorExpanded?'收起诊断信息':'查看诊断信息',16,y,this.W-32,()=>{this.errorExpanded=!this.errorExpanded;g.drawMenu();},'navy',false,{height:50,fontSize:14})});
  }
  if(this.errorExpanded)blocks.push(this.infoBlock('error-text',g.loadingError,13));
  this.list(blocks,this.headBottom+88,isErr);
  if(isErr)this.footer({id:'retry',label:'重新加载',action:()=>{g.show('loading');void g.load();}},()=>g.show('home'));
  else this.footer(undefined,()=>g.show('home'));
 }

 private saveError(){
  const g=this.g,y=g.size.H-g.size.bottom-202;
  this.activePaint=g.menuLayers?.overlay||null;this.inContent=false;
  this.p.fillStyle='rgba(8,18,28,.99)';this.p.fillRect(0,y,this.W,210);
  g.hits=[];
  const r=inset(drawCompactPanel(this.p,{x:12,y:y+4,w:this.W-24,h:184},'raised').content,8);
  this.text('保存未完成，进度仍在本次运行中。\n请重试后再继续。',{x:r.x,y:r.y,w:r.w,h:52},14);
  this.button('retry-save','重试保存',24,y+108,this.W-48,()=>{
   if(g.store.retry()&&g.store.data.pendingRewardPresentation){
    g.rewardReturn=g.screen==='result'?'result':'home';g.show('reward');
   }else g.drawMenu();
  },'gold');
  this.activePaint=null;
 }
}
