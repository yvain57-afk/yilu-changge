import {R2_PEOPLE} from './R2Art';
import {intersection,clipHit,inset,layoutText,MenuViewState,homeLayout} from './MenuLayout';
import {MenuLayers} from './MenuLayers';
import {NativePaint} from './NativePaint';
import {drawPanel,drawCompactPanel,drawCompactCard,drawButton,drawTab,drawCard,drawBanner,drawDialog,drawRewardSocket,drawState,drawProgress,drawMedal} from './UIComponents';
import {CHAPTERS,PEOPLE,PERSON_PROFILES,WEAPON_DATA,TREASURES,TUNING,Slot,WeaponId,personRole} from './data';
import {chapterThreats} from './CampaignMap';
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
  gate:['正负门','可先选好门；射击能改门上的数字。'],
  archer:['敌方弓手','可先击破弓手，或横移避开箭矢。'],
  rain:['敌方箭雨','箭雨落下前，横移到预警之外。'],
  cavalry:['骑兵冲撞','冲锋前移到冲线外，等它过后再进。'],
  mechanism:['敌方机关','可先击破机关，或绕开其范围。'],
  shield:['敌方盾兵','盾兵收招时有空隙，可集中攻击。'],
  guard:['敌方护卫','先攻一侧，打开通过敌阵的空隙。'],
  light:['敌方步兵','边横移边集火，少让敌兵同时贴近。'],
  banner:['敌方旗手','先击破旗手，削弱附近敌军。'],
  boss:['关底敌将','收招时可反击；出手前横移避开预警。'],
  officer:['途中敌将','收招时可反击；出手前横移避开预警。'],
  wall:['路障','沿空隙通过，再调整队伍位置。'],
  other:['其他攻击','可调整兵器和编组，再挑战这一关。'],
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
 scroll=0;maxScroll=0;contentTop=0;contentBottom=0;detailKind:'weapon'|'treasure'='weapon';detailId='spear';detailReturn:MenuScreen='collection';
 settingsReturn:MenuScreen='home';confirmTitle='';confirmText='';confirmReturn:MenuScreen='pause';confirmActions:{id:string;label:string;action:()=>void}[]=[];
 reducedMotion=false;lastScreen='';lastTab='';filter='all';focus='';rewardClock=new Map<string,number>();
 textRecords:{text:string;x:number;y:number;size:number;bounds:any;container?:any;layer:string}[]=[];
 itemRecords:{id:string;bounds:any}[]=[];contentHeight=0;private views=new MenuViewState();private headBottom=0;
 private g!:MenuHost;private activePaint:NativePaint|null=null;private inContent=false;private settingsNotice='';private errorExpanded=false;
 private get p(){return this.activePaint||this.g.menu;} private get W(){return this.g.size.W;} private get bottom(){return this.g.size.H-this.g.size.bottom-72;}
 scrollBy(delta:number){const next=Math.max(0,Math.min(this.maxScroll,this.scroll+delta));if(next===this.scroll)return false;this.scroll=next;return true;}
 private measure=(s:string,n:number)=>this.g.menuLayers?this.g.menuLayers.measure(s,n):this.g.menu.measure(s,n);
 private label(t:string,x:number,y:number,size=15,color='#F3EEE1',align='left',container?:any){
  const w=this.measure(t,size),bounds={x:align==='center'?x-w/2:align==='right'?x-w:x,y:y-size*.6,w,h:size*1.2};
  this.textRecords.push({text:t,x,y,size,bounds,container,layer:this.inContent?'content':this.activePaint?'overlay':'fixed'});
  this.g.menuProbe?.('label');this.p.font=`600 ${size}px Arial`;this.p.fillStyle=color;this.p.textAlign=align;this.p.fillText(t,x,y);
 }
 private text(t:string,r:any,size=14,color='#D5DAD7',align='left'){
  const v=layoutText(t,r.w,size,this.measure);v.lines.forEach((line,i)=>this.label(line,align==='center'?r.x+r.w/2:r.x,r.y+v.lineHeight/2+i*v.lineHeight,size,color,align,r));return v.height;
 }
 private wrap(t:string,x:number,y:number,w:number,size=14,color='#D5DAD7'){return this.text(t,{x,y:y-size*.6,w,h:layoutText(t,w,size,this.measure).height},size,color);}
 private hit(id:string,label:string,x:number,y:number,w:number,h:number,action:()=>void){
  const r=this.inContent?clipHit({x,y,w,h},{x:12,y:this.contentTop,w:this.W-24,h:this.contentBottom-this.contentTop}):{x,y,w,h};
  if(r)this.g.hits.push({id,label,...r,action:()=>{this.focus=id;action();}});
 }
 private button(id:string,t:string,x:number,y:number,w:number,action:()=>void,tone:'gold'|'navy'|'warning'='navy',disabled=false){
  const r=drawButton(this.p,{x,y,w,h:52},t,{tone,state:disabled?'disabled':this.g.pressed?.id===id?'pressed':'normal',fontSize:15});
  const size=15;this.textRecords.push({text:t,x:x+w/2,y:y+26,size,bounds:{x:x+(w-this.measure(t,size))/2,y:y+17,w:this.measure(t,size),h:18},container:r.content,layer:this.inContent?'content':this.activePaint?'overlay':'fixed'});
  if(!disabled)this.hit(id,t,x,y,w,52,action);
 }
 private header(title:string,sub:string){
  const {top,W}=this.g.size,t=layoutText(title,W-60,22,this.measure),v=layoutText(sub,W-60,13,this.measure),h=t.height+v.height+26;
  const c=inset(drawCompactPanel(this.p,{x:12,y:top,w:W-24,h},'raised').content,5);
  this.text(title,{x:c.x,y:c.y,w:c.w,h:t.height},22,'#F1D9A0','center');this.text(sub,{x:c.x,y:c.y+t.height+3,w:c.w,h:v.height},13);
  this.headBottom=top+h+8;this.contentTop=this.headBottom;
 }
 private footer(main?:{id:string;label:string;action:()=>void;disabled?:boolean},back:()=>void=()=>this.g.show('home'),hint='',backLabel='返回'){
  this.activePaint=null;this.inContent=false;this.p.fillStyle='#101D2B';this.p.fillRect(0,this.bottom-4,this.W,this.g.size.H-this.bottom+4);
  this.button('back',backLabel,16,this.bottom,84,back);if(main)this.button(main.id,main.label,112,this.bottom,this.W-128,main.action,'gold',!!main.disabled);
  if(hint)this.text(hint,{x:16,y:this.bottom-26,w:this.W-32,h:18},12,'#B7C4C8','center');
 }
 private visible(y:number,h:number){return !!intersection({x:12,y,w:this.W-24,h},{x:12,y:this.contentTop,w:this.W-24,h:this.contentBottom-this.contentTop});}
 private surface(y:number,h:number,selected=false,locked=false){return inset(drawCompactCard(this.p,{x:16,y,w:this.W-32,h},locked?'locked':selected?'selected':'normal').content,8);}
 private list(blocks:{id:string;h:number;draw:(y:number)=>void}[],top=this.headBottom){
  this.contentTop=top;this.contentBottom=this.bottom-26;this.contentHeight=blocks.reduce((n,b)=>n+b.h+8,0);
  this.maxScroll=Math.max(0,this.contentHeight-(this.contentBottom-this.contentTop));this.scroll=Math.max(0,Math.min(this.scroll,this.maxScroll));
  this.g.menuProbe?.('viewport');this.g.menuLayers?.setViewport({x:12,y:top,w:this.W-24,h:this.contentBottom-top});this.activePaint=this.g.menuLayers?.content||null;this.inContent=true;
  let y=top-this.scroll;for(const b of blocks){if(this.visible(y,b.h)){this.itemRecords.push({id:b.id,bounds:{x:16,y,w:this.W-32,h:b.h}});b.draw(y);}y+=b.h+8;}
  this.activePaint=null;this.inContent=false;
 }
 private infoBlock(id:string,body:string,size=14){
  const h=layoutText(body,this.W-64,size,this.measure).height+28;
  return{id,h,draw:(y:number)=>{this.p.fillStyle='rgba(15,29,42,.92)';this.p.fillRect(16,y,this.W-32,h);this.p.fillStyle='#6A654E';this.p.fillRect(28,y+3,this.W-56,1);this.text(body,{x:30,y:y+14,w:this.W-60,h:h-28},size);}};
 }
 private relation(id:string){const d=this.g.store.data;return d.captures.includes(id)?'收':d.visits.includes(id)?'访':d.allies.includes(id)?'盟':d.seen.includes(id)?'遇':'未遇';}
 private figure(id:string,x:number,y:number,w:number,h:number,unknown=false){this.g.menuProbe?.('icon');const key=[R2_PEOPLE[id],'r27_char_'+id+'_run0','c20_char_'+id+'_run','g_detail_'+id,'g_front_'+id+'Run0','g_boss_'+id+'_idle',...(id==='lubu'?['g_lubuIdle']:[]),'g_portrait_'+id].find(k=>MANIFEST.frames[k]);if(!key){if(unknown){drawState(this.p,{x:x-w/2,y:y-h,w,h},'locked');return;}throw Error('menu_required_person:'+id);}const f=MANIFEST.frames[key],scale=Math.min(w/f.r[2],h/f.r[3]);this.p.frame(key,x,y,h,{refH:h/scale,tint:unknown?'#53616A':undefined});}
 private icon(key:string,x:number,y:number,w:number,h=w){this.g.menuProbe?.('icon');const f=MANIFEST.frames[key];if(!f)throw Error('menu_required_icon:'+key);const sc=Math.min(w/f.r[2],h/f.r[3]);this.p.frame(key,x,y,f.r[3]*sc,{center:true});}
 private weaponIcon(id:string){return MANIFEST.frames['c20_icon_'+id]?'c20_icon_'+id:'g_icon_'+id;}
 private hero(x:number,y:number,w:number,h:number){const l=this.g.store.loadout(),v=resolveWeaponPresentation(l.startWeaponId as WeaponId,'ready',l.treasures.ma),b=presentationBounds(v,75,150),k=Math.min(w/b.w,h/b.h);drawWeaponPresentation(this.p.frame.bind(this.p),v,x+(w-b.w*k)/2-b.x*k,y+(h-b.h*k)/2-b.y*k,75*k,150*k);}
 private detail(kind:'weapon'|'treasure',id:string,ret:MenuScreen){this.detailKind=kind;this.detailId=id;this.detailReturn=ret;this.g.show('item');}
 private confirm(title:string,text:string,actions:{id:string;label:string;action:()=>void}[],ret:MenuScreen){this.confirmTitle=title;this.confirmText=text;this.confirmActions=actions;this.confirmReturn=ret;this.g.show('confirm');}
 private equipPerson(id:string){const d=this.g.store.data,rel=this.relation(id);if(rel==='访'){this.g.store.equipSupport(id);this.g.drawMenu();return;}if(rel!=='收')return;
  if(!d.companions.includes(id)&&d.companions.length>=this.g.store.companionLimit){this.confirm('随军已满','选择一位替换；其收藏与永久成长保留。',d.companions.map(old=>({id:'replace-'+old,label:'替换 '+PEOPLE[old],action:()=>{d.companions=d.companions.filter(x=>x!==old);this.g.store.equipCompanion(id);this.g.show(this.confirmReturn);}})),this.g.screen);return;}
  this.g.store.equipCompanion(id);this.g.drawMenu();
 }
 draw(g:MenuHost){this.g=g;this.activePaint=null;this.inContent=false;this.textRecords=[];this.itemRecords=[];
  const key=[g.screen,g.screen==='prepare'?g.chapter:'',g.tab,this.filter,g.screen==='person'?g.personId:'',g.screen==='item'?this.detailId:'',g.screen==='reward'?g.store.data.pendingRewardPresentation?.key:''].join(':');
  const oldKey=this.views.key,v=this.views.enter(key,this.scroll,g.page,this.focus);if(key!==oldKey){this.scroll=v.scroll;g.page=v.page;this.focus=v.focus;}
  this.lastScreen=g.screen;this.lastTab=g.tab;this.maxScroll=0;this.contentTop=g.size.top+108;this.contentBottom=this.bottom-8;
  this.reducedMotion=!!g.platform.book.data.settings.reducedMotion;
  if(!NativePaint.textures.ui_full_components){
   this.p.fillStyle='#101D2B';this.p.fillRect(0,0,this.W,g.size.H);this.label(g.screen==='error'?'资源尚未就绪':'一路长歌：三国',this.W/2,g.size.H*.35,25,'#F1D9A0','center');
   this.wrap(g.screen==='error'?'加载失败，进度已保留。':'正在集结人马',24,g.size.H*.47,this.W-48,14);
   if(g.screen==='error'){this.label('重新加载',this.W/2,this.bottom+24,18,'#F1D9A0','center');this.hit('retry','重新加载',16,this.bottom,this.W-32,52,()=>{g.show('loading');void g.load();});}return;
  }
  if(g.screen==='home')this.home();
  if(g.screen==='chapters'||g.screen==='transition')g.drawMap();
  if(g.screen==='prepare')this.prepare();if(g.screen==='collection')this.collection();if(g.screen==='person')this.person();if(g.screen==='item')this.item();
  if(g.screen==='reward')this.reward();if(g.screen==='result')this.result();if(g.screen==='pause')this.pause();if(g.screen==='confirm')this.confirmView();if(g.screen==='settings')this.settings();
  if(g.screen==='loading'||g.screen==='error')this.loadView();if(g.screen==='battle')this.hit('pause','暂停战斗',4,g.size.top,48,48,()=>g.show('pause'));
  this.views.remember(this.scroll,g.page,this.focus);if(g.store.notice)this.saveError();
 }
 private home(){const g=this.g,{W,H,top,bottom}=g.size,n=g.store.completed,pending=!!g.store.data.pendingRewardPresentation,layout=homeLayout(W,H,top,bottom,pending);g.drawHomeArt?.(layout.hero);
  // One landscape, with soft readability falloffs instead of three full-width slabs.
  const fade=(y:number,h:number,stops:number[][])=>{const steps=Math.ceil(h);for(let i=0;i<steps;i++){const t=i/Math.max(1,steps-1);let j=1;while(j<stops.length-1&&t>stops[j][0])j++;const a=stops[j-1],b=stops[j],alpha=a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]);this.p.fillStyle='rgba(8,23,35,'+alpha+')';this.p.fillRect(0,y+i*h/steps,W,h/steps+.1);}};
  fade(0,top+146,[[0,.8],[.55,.42],[1,0]]);
  this.text('一路长歌',{x:20,y:top+10,w:layout.titleWidth,h:40},28,'#F4DDA4');
  this.text('三国 · 已克 '+n+'/20',{x:20,y:top+48,w:W-40,h:22},13,'#F3E8CF');
  this.button('settings','设置',W-78,top+12,62,()=>{this.settingsReturn='home';g.show('settings');});
  fade(layout.fadeTop-42,H-layout.fadeTop+42,[[0,0],[.34,.72],[.68,.94],[1,.98]]);
  const y=layout.actionTop,l=g.store.loadout(),weapon=WEAPON_DATA[l.startWeaponId as WeaponId];
  this.text(n===20?'九州已定，再启征程':'第'+(n+1)+'关 · '+CHAPTERS[n].place+' · '+CHAPTERS[n].title,{x:20,y,w:W-40,h:26},18,'#F4DDA4');
  this.icon(this.weaponIcon(l.startWeaponId),34,y+43,25,30);this.text('出征 '+weapon.label+' · 永久 Lv.'+(g.store.data.weaponLevels[l.startWeaponId]||1),{x:55,y:y+33,w:W-77,h:22},14);
  this.text(nextMilestoneHint(n),{x:20,y:y+65,w:W-40,h:22},12,'#C9D3D5');
  this.button('start',n===0?'开始征程':n===20?'重游山河':'继续征程',16,layout.actionY,W-32,()=>{g.chapter=Math.min(19,n);g.tab='weapons';g.page=0;g.show('prepare');},'gold');
  this.button('chapters','山河地图',16,layout.navY,(W-44)/2,()=>g.show('chapters'));this.button('collection','军中图鉴',28+(W-44)/2,layout.navY,(W-44)/2,()=>{g.tab='people';g.page=0;g.show('collection');});
  if(pending)this.button('recover-reward','继续领赏',16,layout.rewardY,W-32,()=>{g.rewardReturn='home';g.show('reward');});
 }
 private tabs(ids:string[],names:string[],y=this.headBottom){const w=(this.W-32-8*(ids.length-1))/ids.length;
  ids.forEach((id,i)=>{const x=16+i*(w+8);drawTab(this.p,{x,y,w,h:48},names[i],this.g.tab===id?'selected':'normal');this.hit('tab-'+id,names[i],x,y,w,48,()=>{this.g.tab=id;this.g.drawMenu();});});this.contentTop=y+56;
 }
 private prepare(){const g=this.g,l=g.store.loadout(),W=this.W,c=CHAPTERS[g.chapter];this.header('第'+(g.chapter+1)+'关 · '+c.place,'敌将 '+PEOPLE[c.boss]+' · '+chapterThreats(g.chapter));
  const y=this.headBottom,selected=l.startWeaponId as WeaponId,lv=g.store.data.weaponLevels[selected]||1,btnW=72,btnX=W-16-btnW;
  const comp='随军 '+(l.companions.map(id=>PEOPLE[id]).join('、')||'未编入')+' · 支援 '+(PEOPLE[l.support||'']||'未编入');
  const slotLine=(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'·'+(l.treasures[slot]?TREASURES[l.treasures[slot]!].name:g.store.slotOpen(slot)?'未佩戴':'未开启')).join('  ');
  const below=layoutText(comp,W-64,12,this.measure).height+layoutText(slotLine,W-64,12,this.measure).height+16,boxH=Math.max(132,78+below);
  const box=drawCompactPanel(this.p,{x:16,y,w:W-32,h:boxH},'raised'),r=inset(box.content,6);
  const textX=r.x+56,textW=Math.max(40,btnX-8-textX);
  this.hero(r.x,r.y,46,42);this.text(WEAPON_DATA[selected].label,{x:textX,y:r.y,w:textW,h:22},15,'#F1D9A0');
  this.text('永久 Lv.'+lv+' · 本局Ⅰ阶',{x:textX,y:r.y+22,w:textW,h:18},12);
  this.button('view-lineup','编组',btnX,y+12,btnW,()=>{this.confirm('当前编组','主将 '+WEAPON_DATA[selected].label+'\n随军 '+(l.companions.map(id=>PEOPLE[id]).join('、')||'未编入')+' · 支援 '+(PEOPLE[l.support||'']||'未编入'),[{id:'lineup-weapon',label:'查看当前兵器',action:()=>this.detail('weapon',selected,'prepare')},{id:'lineup-tactic',label:'兵法 · '+(l.tactic==='zhenjun'?'震军':'贯阵')+' · 切换',action:()=>{g.store.equipTactic();if(g.screen==='confirm'){const current=g.store.loadout().tactic;this.confirmActions.find(a=>a.id==='lineup-tactic')!.label='兵法 · '+(current==='zhenjun'?'震军':'贯阵')+' · 切换';g.drawMenu();}}}],'prepare');});
  const lineY=y+68,compH=layoutText(comp,r.w,12,this.measure).height;this.text(comp,{x:r.x,y:lineY,w:r.w,h:compH},12);
  this.text(slotLine,{x:r.x,y:lineY+compH+4,w:r.w,h:layoutText(slotLine,r.w,12,this.measure).height},12);
  this.tabs(['companions','support','treasures','weapons'],['随军','支援','宝物','兵器'],y+boxH+8);
  const weapon=g.tab==='weapons',treasure=g.tab==='treasures',owned=(id:string)=>weapon?g.store.data.weapons.includes(id):treasure?g.store.data.treasures.includes(id):true;
  let rows=weapon?Object.keys(WEAPON_DATA):treasure?Object.keys(TREASURES):g.tab==='support'?g.store.data.visits:g.store.data.captures;
  const isSelected=(id:string)=>weapon?l.startWeaponId===id:treasure?l.treasures[TREASURES[id].slot]===id:g.tab==='support'?l.support===id:l.companions.includes(id);
  rows=rows.map((id,i)=>({id,i,priority:isSelected(id)?0:owned(id)?1:2})).sort((a,b)=>a.priority-b.priority||a.i-b.i).map(v=>v.id);
  const blocks=rows.map(id=>{const name=weapon?WEAPON_DATA[id as WeaponId].label:treasure?TREASURES[id].name:PEOPLE[id],desc=weapon?(owned(id)?'永久 Lv.'+(g.store.data.weaponLevels[id]||1)+' · 本局Ⅰ阶':'第'+(CHAPTERS.findIndex(c=>c.weapon===id)+1)+'关首通'):treasure?({dian:'典籍',qi:'器物',ma:'坐骑'}[TREASURES[id].slot])+' · '+(owned(id)?'已收藏':'未获得'):personRole(id);
   const textW=Math.max(40,W-16-72-8-82),titleH=layoutText(name,textW,15,this.measure).height,descH=layoutText(desc,textW,12,this.measure).height,h=Math.max(88,titleH+descH+34);
   return{id,h,draw:(y:number)=>{const r=this.surface(y,h,isSelected(id),!owned(id));if(weapon)this.icon(this.weaponIcon(id),r.x+21,y+h/2,40,48);else if(treasure)this.icon(TREASURES[id].icon,r.x+21,y+h/2,40,48);else this.figure(id,r.x+21,r.y+r.h,42,r.h);
    this.text((isSelected(id)?'✓ ':'')+name,{x:82,y:r.y,w:textW,h:titleH},15,'#F1D9A0');this.text(desc,{x:82,y:r.y+titleH+2,w:textW,h:descH},12);
    this.hit((weapon?'select-':treasure?'treasure-':g.tab==='support'?'support-':'comp-')+id,name,16,y,W-16-72-8-16,h,()=>{
     if(!owned(id)){this.detail(weapon?'weapon':'treasure',id,'prepare');return;}
     if(weapon){g.store.selectWeapon(id);this.scroll=0;}else if(treasure){const t=TREASURES[id],old=l.treasures[t.slot];if(!g.store.slotOpen(t.slot)){this.detail('treasure',id,'prepare');return;}if(old&&old!==id){this.confirm('替换'+({dian:'典籍',qi:'器物',ma:'坐骑'}[t.slot]),TREASURES[old].name+' → '+t.name,[{id:'replace-treasure',label:'确认佩戴',action:()=>{g.store.equipTreasure(id);g.show('prepare');}}],'prepare');return;}g.store.equipTreasure(id);}else this.equipPerson(id);g.drawMenu();
    });this.button('detail-'+id,'详情',W-16-72,y+(h-52)/2,72,()=>{if(weapon||treasure)this.detail(weapon?'weapon':'treasure',id,'prepare');else{g.personId=id;this.detailReturn='prepare';g.show('person');}});
   }};});
  if(!rows.length)blocks.push(this.infoBlock('empty',g.tab==='support'?'第二关后可寻访支援。现在即可出征。':'通关后可邀同袍。现在即可出征。'));
  blocks.push({id:'tactic',h:64,draw:(y:number)=>{const r=this.surface(y,64);this.text('兵法 · '+(l.tactic==='zhenjun'?'震军':'贯阵')+' · 轻点切换',{x:r.x,y:r.y,w:r.w,h:r.h},14,'#F1D9A0');this.hit('tactic','切换兵法',16,y,W-32,64,()=>{g.store.equipTactic();g.drawMenu();});}});
  if(g.store.data.weaponTrialPrevious&&g.store.data.weaponTrialPrevious!==selected)blocks.push({id:'restore',h:52,draw:(y:number)=>this.button('restore-weapon','恢复原兵器',16,y,W-32,()=>{const id=String(g.store.data.weaponTrialPrevious);g.store.data.weaponTrialPrevious=null;g.store.selectWeapon(id);g.drawMenu();})});
  blocks.push(this.infoBlock('treasure-summary',(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'：'+(l.treasures[slot]?TREASURES[l.treasures[slot]!].name:g.store.slotOpen(slot)?'未佩戴':'未开启')).join('\n')));
  this.list(blocks,this.contentTop);this.footer({id:'depart',label:'出征',action:()=>g.begin(),disabled:!!g.store.notice},undefined,this.maxScroll?'上滑查看其余':'可以出征');
 }
 private collection(){const g=this.g,d=g.store.data;this.header('军中图鉴','已遇 '+Object.keys(PEOPLE).filter(id=>this.relation(id)!=='未遇').length+'/42 · 收服 '+d.captures.length+' · 寻访 '+d.visits.length+' · 盟约 '+d.allies.length);
  this.tabs(['people','weapons','treasures'],['人物','兵器','宝物']);const filters=g.tab==='people'?['all','seen','companion','support','ally']:['all','owned'],names=g.tab==='people'?['全部','已遇','随军','支援','盟约']:['全部','已拥有'];
  const active=filters.includes(this.filter)?this.filter:'all',fy=this.contentTop,w=(this.W-32-8*(filters.length-1))/filters.length;
  filters.forEach((f,i)=>{const x=16+i*(w+8);drawTab(this.p,{x,y:fy,w,h:48},names[i],active===f?'selected':'normal');this.hit('filter-'+f,names[i],x,fy,w,48,()=>{this.filter=f;g.drawMenu();});});
  let ids=g.tab==='people'?Object.keys(PEOPLE):g.tab==='weapons'?Object.keys(WEAPON_DATA):Object.keys(TREASURES);
  ids=ids.filter(id=>g.tab==='people'?active==='all'||active==='seen'&&this.relation(id)!=='未遇'||active==='companion'&&d.captures.includes(id)||active==='support'&&d.visits.includes(id)||active==='ally'&&d.allies.includes(id):active==='all'||(g.tab==='weapons'?d.weapons:d.treasures).includes(id));
  const pagerY=this.bottom-58,labelY=pagerY-20,start=fy+58,end=labelY-6,rowH=122,rows=Math.max(1,Math.floor((end-start)/(rowH+8))),per=rows*2,pages=Math.max(1,Math.ceil(ids.length/per));g.page=Math.max(0,Math.min(g.page,pages-1));const cw=(this.W-44)/2;
  this.contentTop=start;this.contentBottom=end;g.menuLayers?.setViewport({x:12,y:start,w:this.W-24,h:Math.max(0,end-start)});this.activePaint=g.menuLayers?.content||null;this.inContent=true;
  ids.slice(g.page*per,(g.page+1)*per).forEach((id,i)=>{const x=16+i%2*(cw+12),y=start+Math.floor(i/2)*(rowH+8),person=g.tab==='people',weapon=g.tab==='weapons',rel=person?this.relation(id):'',owned=person?rel!=='未遇':(weapon?d.weapons:d.treasures).includes(id),r=inset(drawCompactCard(this.p,{x,y,w:cw,h:rowH},owned?'normal':'locked').content,8);
   const plate=r.y+r.h-40;this.p.fillStyle='rgba(10,22,34,.88)';this.p.fillRect(r.x,plate,r.w,r.y+r.h-plate);
   if(person)this.figure(id,x+cw/2,plate-2,r.w,Math.max(24,plate-r.y-4),!owned);else this.icon(weapon?this.weaponIcon(id):TREASURES[id].icon,x+cw/2,r.y+(plate-r.y)/2,Math.min(72,r.w-16),Math.max(24,plate-r.y-8));
   const name=person?owned?PEOPLE[id]:'未遇之人':weapon?WEAPON_DATA[id as WeaponId].label:TREASURES[id].name;
   const badge=person?(({收:'可随军',访:'可支援',盟:'盟约',遇:'已遇',未遇:'未遇'} as Record<string,string>)[rel]||''):owned?weapon?'永久 Lv.'+(d.weaponLevels[id]||1):'已收藏':'未获得';
   this.text(name,{x:r.x,y:plate+2,w:r.w,h:18},14,'#F1D9A0','center');this.text(badge,{x:r.x,y:plate+20,w:r.w,h:16},12,'#BAC8D0','center');
   this.hit((person?'person-':'item-')+id,'查看详情',x,y,cw,rowH,()=>{this.detailReturn='collection';if(person){g.personId=id;g.show('person');}else this.detail(weapon?'weapon':'treasure',id,'collection');});
  });this.activePaint=null;this.inContent=false;this.label((g.page+1)+' / '+pages,this.W/2,labelY,12,'#F1D9A0','center');this.button('prev-page','上一页',16,pagerY,100,()=>{g.page=(g.page+pages-1)%pages;g.drawMenu();});this.button('next-page','下一页',this.W-116,pagerY,100,()=>{g.page=(g.page+1)%pages;g.drawMenu();});this.footer();
 }
 private person(){const g=this.g,id=g.personId,rel=this.relation(id),known=rel!=='未遇',info=PERSON_PROFILES[id],c=CHAPTERS.find(c=>c.boss===id||c.enemy.includes(id)||c.capture.includes(id)||c.visit.includes(id)||c.allies.includes(id));
  this.header(known?PEOPLE[id]+(info?.[0]?' · '+info[0]:''):'未遇之人',known?(info?.[1]||'')+' · '+({收:'可随军',访:'可支援',盟:'盟约常驻',遇:'已遇',未遇:'未遇'}[rel]):'沿征程前行，自会相逢');
  const lines=[known?personRole(id):'人物剪影 · 尚未遇见',c?'相逢 · 第'+(CHAPTERS.indexOf(c)+1)+'关 '+(known?c.title:c.faction+'篇'):'继续推进征程'];
  if(known){const owner=Object.values(WEAPON_DATA).find(w=>w.owner===id);if(owner)lines.push('共鸣兵器 · '+owner.label);if(info)lines.push(info[2]+'\n'+info[3]);}if(rel==='盟')lines.push('盟约常驻，无需占用随军或支援位。');
  const blocks=[{id:'portrait',h:180,draw:(y:number)=>{const r=inset(drawCompactPanel(this.p,{x:16,y,w:this.W-32,h:180},'raised').content,8);this.figure(id,this.W/2,r.y+r.h,this.W*.6,r.h,!known);}},this.infoBlock('biography',lines.join('\n\n'))];
  this.list(blocks);const equipped=rel==='收'?g.store.data.companions.includes(id):g.store.data.support===id;
  this.footer(rel==='收'||rel==='访'?{id:'person-equip',label:equipped?'移出'+(rel==='收'?'随军':'支援'):'编入'+(rel==='收'?'随军':'支援'),action:()=>this.equipPerson(id),disabled:rel==='访'&&g.store.completed<2}:undefined,()=>g.show(this.detailReturn==='reward'?'reward':this.detailReturn==='prepare'?'prepare':'collection'),this.maxScroll?'上滑查看其余':'');
 }
 private item(){const g=this.g,id=this.detailId,weapon=this.detailKind==='weapon',w=WEAPON_DATA[id as WeaponId],t=TREASURES[id],owned=(weapon?g.store.data.weapons:g.store.data.treasures).includes(id),lv=g.store.data.weaponLevels[id]||1,slot=t?.slot,cost=TUNING.upgradeCost(lv);
  this.header(weapon?w.label:t.name,weapon?'永久强化与本局阶位分开':({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+' · '+(owned?'已收藏':'未获得'));
  const blocks=[{id:'item-body',h:104,draw:(y:number)=>{const r=inset(drawCompactPanel(this.p,{x:16,y,w:this.W-32,h:104},'raised').content,8);this.icon(weapon?this.weaponIcon(id):t.icon,this.W/2,r.y+r.h/2,r.w*.7,r.h);}}];
  const body=weapon?['永久 Lv.'+lv+' · 伤害 +'+Math.round((lv-1)*TUNING.weaponLevelDamage*100)+'%','本局从Ⅰ阶起，匣中可升至Ⅲ阶',lv<TUNING.weaponMaxLevel?'下一级永久伤害 +'+Math.round(lv*TUNING.weaponLevelDamage*100)+'%':'永久已满级','共鸣 · '+(w.owner?PEOPLE[w.owner]:'无专属'),owned?'军功 '+g.store.data.xp+(lv<TUNING.weaponMaxLevel?' · 升级需 '+cost:''):'第'+(CHAPTERS.findIndex(c=>c.weapon===id)+1)+'关首通获得'].join('\n'):t.effect+'\n'+(owned?g.store.data.slots[slot]===id?'已佩戴':g.store.slotOpen(slot)?'可以佩戴':'槽位尚未开启':'继续征程可得');
  blocks.push(this.infoBlock('growth-ability',body));
  if(weapon&&owned)blocks.push({id:'choose',h:52,draw:(y:number)=>this.button('choose-item',g.store.loadout().startWeaponId===id?'已选为出征兵器':'设为出征兵器',16,y,this.W-32,()=>{g.store.selectWeapon(id);g.drawMenu();})});
  this.list(blocks);
  this.footer({id:weapon?'upgrade-item':'equip-item',label:weapon?!owned?'尚未获得':lv>=TUNING.weaponMaxLevel?'永久已满级':g.store.data.xp<cost?'军功不足 '+(cost-g.store.data.xp):'升级 · '+cost+'军功':!owned?'尚未获得':!g.store.slotOpen(slot)?'尚未开启':g.store.data.slots[slot]===id?'移出当前槽':'佩戴到'+({dian:'典籍',qi:'器物',ma:'坐骑'}[slot]),disabled:!owned||(weapon?(lv>=TUNING.weaponMaxLevel||g.store.data.xp<cost):!g.store.slotOpen(slot)),action:()=>{if(weapon){g.store.upgrade(id);g.drawMenu();}else{const old=g.store.data.slots[slot];if(old&&old!==id)this.confirm('替换'+({dian:'典籍',qi:'器物',ma:'坐骑'}[slot]),TREASURES[old].name+' → '+t.name,[{id:'replace-treasure',label:'确认佩戴',action:()=>{g.store.equipTreasure(id);g.show('item');}}],'item');else{g.store.equipTreasure(id);g.drawMenu();}}}},()=>g.show(this.detailReturn),weapon?'升级不改本局阶位':'替换前会再确认');
 }
 private reward(){const g=this.g,r=g.store.data.pendingRewardPresentation;if(!r){g.show(g.rewardReturn);return;}const previous=this.rewardClock.get(r.key)||0,age=this.reducedMotion?3:Math.max(previous,g.screenAge);this.rewardClock.set(r.key,age);
  const title=r.kind==='migration'?'征程更新':r.chapter===9&&r.kind==='milestone'?'上篇完成 · 下篇开启':r.chapter===19?'二十关贯通 · 九州长歌':r.title;
  const unique=Array.from(new Map(r.items.map(i=>[i.kind+':'+i.id,i])).values()),primary=unique.find(i=>i.kind==='weapon'&&i.isNew)||unique.find(i=>i.kind==='person'&&i.isNew)||unique[0],remaining=unique.filter(i=>i!==primary);
  this.header(title,r.kind==='migration'?'收藏与编组都在':(g.store.notice?'尚未保存':'已记下')+' · 共'+unique.length+'项 · 军功 +'+r.xp);
  const primaryH=unique.length<=3?220:124;const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[];
  if(r.kind==='migration')blocks.push(this.infoBlock('migration','补齐 '+r.backfilled+' 座里程碑\n军功 +'+r.xp+' · 收藏与编组都在'));
  if(primary){blocks.push({id:'primary',h:primaryH,draw:(y:number)=>{const r0=this.surface(y,primaryH,true);const progress=this.reducedMotion?1:Math.max(.15,Math.min(1,(age-.18)/.47));this.p.save();this.p.globalAlpha=progress;const visualH=primaryH-65,cy=r0.y+visualH/2;if(primary.kind==='person')this.figure(primary.id,this.W/2,r0.y+visualH,this.W*.58,visualH);else this.icon(primary.kind==='weapon'?this.weaponIcon(primary.id):primary.kind==='treasure'?TREASURES[primary.id].icon:'c20_stamp_'+Number(primary.id.replace('badge_m','')),this.W/2,cy,primaryH>124?150:100,visualH);this.p.restore();this.text(rewardLabel(primary),{x:r0.x,y:y+primaryH-46,w:r0.w,h:24},18,'#F1D9A0','center');this.hit('reward-primary','查看主要奖励',16,y,this.W-32,primaryH,()=>{this.detailReturn='reward';if(primary.kind==='person'){g.personId=primary.id;g.show('person');}else if(primary.kind==='weapon'||primary.kind==='treasure')this.detail(primary.kind,primary.id,'reward');});}});if(unique.length<=3){const purpose=primary.kind==='weapon'?'整备可以此兵器出征。匣升本局阶位，图鉴升永久等级。':primary.kind==='treasure'?TREASURES[primary.id].effect:primary.kind==='person'?personRole(primary.id)+' · '+(primary.relation==='收'?'整备可编入随军。':primary.relation==='访'?'整备可安排支援。':'盟约常驻，不占编组。'):nextMilestoneHint(g.store.completed);blocks.push(this.infoBlock('primary-purpose',purpose,14));}}
  for(let i=0;i<remaining.length;i+=2){const group=remaining.slice(i,i+2),w=(this.W-44)/2,h=Math.max(72,...group.map(it=>layoutText(rewardLabel(it),w-62,14,this.measure).height+44));blocks.push({id:'tray-'+i,h,draw:(y:number)=>group.forEach((it,j)=>{const x=16+j*(w+12),r0=inset(drawCompactCard(this.p,{x,y,w,h},'normal').content,8);this.p.save();this.p.globalAlpha=this.reducedMotion?1:Math.max(.18,Math.min(1,(age-.55-j*.06)/.5));if(it.kind==='person')this.figure(it.id,r0.x+15,r0.y+r0.h,30,r0.h);else this.icon(it.kind==='weapon'?this.weaponIcon(it.id):it.kind==='treasure'?TREASURES[it.id].icon:'c20_stamp_'+Number(it.id.replace('badge_m','')),r0.x+15,y+h/2,28,34);this.p.restore();this.text(rewardLabel(it),{x:r0.x+38,y:r0.y,w:r0.w-38,h:h-42},14,'#F1D9A0');this.text(it.relation?({收:'可随军',访:'可支援',盟:'盟约'}[it.relation]):it.isNew?'新收藏':'已有收藏',{x:r0.x+38,y:r0.y+h-52,w:r0.w-38,h:16},12);this.hit('reward-item-'+it.id,'查看奖励详情',x,y,w,h,()=>{if(it.kind==='person'){g.personId=it.id;this.detailReturn='reward';g.show('person');}else if(it.kind==='weapon'||it.kind==='treasure')this.detail(it.kind,it.id,'reward');});})});}
  if(r.kind==='milestone')blocks.push(this.infoBlock('next-milestone',nextMilestoneHint(g.store.completed),13));
  this.list(blocks);this.footer({id:'reward-done',label:age<1.8?'跳过':'收下',disabled:age<.3||!!g.store.notice,action:()=>{if(g.store.acknowledgePresentation())g.show(g.rewardReturn);else g.drawMenu();}},()=>g.show(g.rewardReturn),this.maxScroll?'上滑查看其余':'赏赐已记下');
 }
 private result(){const g=this.g,st=g.battle?.state,won=(st?.troops||0)>0,receipt=g.resultReceipt,c=CHAPTERS[g.chapter],next=Math.min(19,g.chapter+1),xp=receipt?.xp??Number(won?g.store.data.lastRewardXP||0:g.store.data.lastPracticeXP||0);
  this.header(won?'胜利 · '+c.place:'失败','第'+(g.chapter+1)+'关 · 已克 '+g.store.completed+'/20');
  const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[];
  if(won)blocks.push({id:'victory-focus',h:128,draw:(y:number)=>{const banner=drawBanner(this.p,{x:16,y,w:this.W-32,h:58},'victory');this.text(c.place+' · 胜利',{...banner.content,y:banner.content.y+2,h:24},18,'#F1D9A0','center');this.p.frame('c20_site_city',this.W/2,y+123,65);this.p.frame('c20_flag_done',this.W/2+42,y+107,43);}});
  blocks.push(this.infoBlock('battle-result','剩余兵力 '+Math.round(st?.troops||0)+' · 本局军功 +'+xp+'\n累计军功 '+g.store.data.xp+(g.store.notice?' · 尚未保存':' · 已记下'),15));
  if(won){const items=Array.from(new Map((receipt?.items||[]).map((i:any)=>[i.kind+':'+i.id,i])).values()) as any[];blocks.push(this.infoBlock('new-collection',g.first?items.map(i=>rewardLabel(i)).join(' · ')||'首通已记下':'重游只记军功，不重复封赏'));
   blocks.push(this.infoBlock('next-target',g.chapter===19?'二十关贯通 · 可回山河重游':'下一出征 · 第'+(next+1)+'关 '+CHAPTERS[next].place+'\n'+nextMilestoneHint(g.store.completed),13));
  }else{
   blocks.push(this.infoBlock('losses',resultLossSummary(g.battle?.snapshot().damageSources)));
   blocks.push(this.infoBlock('retry-context','已克进度、军功与收藏都在。\n可直接重试，也可先调整编组。',13));
  }
  blocks.push({id:'adjust',h:52,draw:(y:number)=>this.button('view-reward',won?'前往整备':'调整编组',16,y,this.W-32,()=>{g.tab='companions';g.show('prepare');})});
  if(won&&c.weapon)blocks.push({id:'try',h:52,draw:(y:number)=>this.button('try-weapon','下关试用 · '+WEAPON_DATA[c.weapon!].label,16,y,this.W-32,()=>{g.store.data.weaponTrialPrevious=g.store.data.selectedWeaponId;if(g.store.selectWeapon(c.weapon!)){g.chapter=next;g.tab='weapons';g.show('prepare');}})});
  this.list(blocks);this.footer({id:'next',label:won?g.chapter===19?'重游山河':'整军 · 第'+(next+1)+'关':'重试本关',disabled:!!g.store.notice,action:()=>{if(!won)g.begin();else g.show(g.chapter===19?'chapters':'transition');}},undefined,'','返回营地');
 }
 private pause(){const g=this.g,note='本局尚未入账的收获会失去。已有收藏与存档都在。';this.p.fillStyle='rgba(8,18,28,.97)';this.p.fillRect(0,0,this.W,g.size.H);this.header('暂歇','战斗已暂停');const y=this.headBottom+12,gap=12;drawDialog(this.p,{x:16,y,w:this.W-32,h:16+52*3+gap*2+16});this.button('continue','继续战斗',32,y+16,this.W-64,()=>g.show('battle'),'gold');this.button('restart','重新挑战',32,y+16+52+gap,this.W-64,()=>this.confirm('重新挑战？',note,[{id:'confirm-restart',label:'确认重新挑战',action:()=>g.begin()}],'pause'));this.button('quit','返回营地',32,y+16+2*(52+gap),this.W-64,()=>this.confirm('离开当前战斗？',note,[{id:'confirm-quit',label:'确认返回营地',action:()=>g.show('home')}],'pause'),'warning');}
 private confirmView(){const g=this.g;this.p.fillStyle='rgba(8,18,28,.98)';this.p.fillRect(0,0,this.W,g.size.H);this.header(this.confirmTitle,this.confirmTitle==='当前编组'?'出征以此编组为准':'请先确认');
  const body=this.confirmText+(this.confirmTitle==='当前编组'?'\n'+(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'：'+(g.store.loadout().treasures[slot]?TREASURES[g.store.loadout().treasures[slot]!].name:'未佩戴')).join('\n'):'');
  const blocks=[this.infoBlock('confirm-context',body)];if(this.confirmTitle==='当前编组')blocks.unshift({id:'lineup',h:182,draw:(y:number)=>this.hero(30,y+12,this.W-60,156)});
  for(const a of this.confirmActions)blocks.push({id:a.id,h:52,draw:(y:number)=>this.button(a.id,a.label,24,y,this.W-48,a.action,this.confirmTitle==='当前编组'?'navy':'warning')});this.list(blocks);this.footer(undefined,()=>g.show(this.confirmReturn));
 }
 private settings(){const g=this.g,b=g.platform.book;this.header('设置','音乐与音效各自开关');
  const row=(id:string,name:string,value:string,action:()=>void)=>({id,h:56,draw:(y:number)=>{const r=this.surface(y,56);this.text(name,{x:r.x,y:r.y+10,w:r.w-80,h:24},16,'#F3EEE1');drawButton(this.p,{x:this.W-88,y:y+2,w:64,h:52},value,{tone:value==='关'?'navy':'gold',fontSize:15});this.hit(id,name+' '+value,16,y,this.W-32,56,action);}});
  const setting=(key:'music'|'sfx'|'vibration'|'reducedMotion',name:string)=>row(key==='reducedMotion'?'motion':key,name,b.data.settings[key]?'开':'关',()=>{const old=!!b.data.settings[key];b.data.settings[key]=!old;if(b.persist()===false){b.data.settings[key]=old;this.settingsNotice='没能保存，仍是原来的设置。';}else this.settingsNotice='已保存';g.platform.syncAudio(false);g.battle?.clearAudioEvents();g.drawMenu();});
  const build=BRIDGE_BUILD as any,blocks=[setting('music','背景音乐'),row('music-volume','音乐音量',Math.round((b.data.settings.musicVolume??.6)*100)+'%',()=>{const old=b.data.settings.musicVolume,v=old??.6;b.data.settings.musicVolume=v<.45?.6:v<.75?.9:.3;if(b.persist()===false){b.data.settings.musicVolume=old;this.settingsNotice='没能保存，仍是原来的设置。';}else this.settingsNotice='音量已保存';g.platform.syncAudio(false);g.drawMenu();}),setting('sfx','音效'),setting('vibration','震动'),setting('reducedMotion','减弱动态'),this.infoBlock('music-help','营地与设置播放静曲，战斗播放行军曲。\n暂停或离开即停。',13),this.infoBlock('motion-help','少一些闪动，危险预警仍在。战斗节奏不变。',13),this.infoBlock('real-version','平台 '+build.target+'\n版本 '+(build.app_version||'版本未写入')+' · '+(build.build_number||'未知')+'\n构建 '+build.build_id+'\n指纹 '+build.code_fingerprint.slice(0,16),13)];
  if(this.settingsNotice)blocks.push(this.infoBlock('settings-result',this.settingsNotice,13));this.list(blocks);this.footer(undefined,()=>g.show(this.settingsReturn));
 }
 private loadView(){const g=this.g;this.header(g.screen==='error'?'资源尚未就绪':'整装待发',g.screen==='error'?'进度已保留':'正在集结人马');drawState(this.p,{x:this.W/2-30,y:this.headBottom+22,w:60,h:60},g.screen==='error'?'error':'loading');
  const blocks=[this.infoBlock('load-state',g.screen==='error'?'资源没有载入。进度与编组都在，请再试一次。':'战场与图鉴即将就绪。')];if(g.screen==='error')blocks.push({id:'dev-detail',h:52,draw:(y:number)=>this.button('error-detail',this.errorExpanded?'收起详情':'查看详情',16,y,this.W-32,()=>{this.errorExpanded=!this.errorExpanded;g.drawMenu();})});if(this.errorExpanded)blocks.push(this.infoBlock('error-text',g.loadingError,13));this.list(blocks,this.headBottom+94);
  if(g.screen==='error')this.footer({id:'retry',label:'重新加载',action:()=>{g.show('loading');void g.load();}});else this.footer();
 }
 private saveError(){const g=this.g,y=g.size.H-g.size.bottom-202;this.activePaint=g.menuLayers?.overlay||null;this.inContent=false;this.p.fillStyle='rgba(8,18,28,.99)';this.p.fillRect(0,y,this.W,210);g.hits=[];
  const r=inset(drawCompactPanel(this.p,{x:12,y:y+4,w:this.W-24,h:184},'raised').content,8);this.text('还没保存成功。请重试，再继续。',{x:r.x,y:r.y,w:r.w,h:52},14);this.button('retry-save','重试保存',24,y+108,this.W-48,()=>{if(g.store.retry()&&g.store.data.pendingRewardPresentation){g.rewardReturn=g.screen==='result'?'result':'home';g.show('reward');}else g.drawMenu();},'gold');this.activePaint=null;
 }
}
