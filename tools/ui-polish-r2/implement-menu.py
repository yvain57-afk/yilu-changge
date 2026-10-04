# coding: utf-8
from pathlib import Path
import hashlib, zipfile
p=Path('assets/scripts/formal/FullMenu.ts')
with zipfile.ZipFile('evidence/YILU_UI_POLISH_R2/entry-source.zip') as z:s=z.read(str(p)).decode()
assert hashlib.sha256(s.encode()).hexdigest()=='3dd2174876146d1f18955a29e64f783be628f2b265e878ebab520b8a550cae47'
s=s.replace("import {NativePaint}","import {intersection,clipHit,inset,layoutText,MenuViewState} from './MenuLayout';\nimport {MenuLayers} from './MenuLayers';\nimport {NativePaint}",1)
s=s.replace('drawPanel,drawButton,drawTab,drawCard,drawBanner','drawPanel,drawCompactPanel,drawCompactCard,drawButton,drawTab,drawCard,drawBanner',1)
s=s.replace('size:{W:number;H:number;top:number;bottom:number};menu:NativePaint;', 'size:{W:number;H:number;top:number;bottom:number};menu:NativePaint;menuLayers?:MenuLayers;')
s=s.replace('show(s:MenuScreen):void;', 'drawHomeArt?():void;show(s:MenuScreen):void;')
a=s.index(' reducedMotion=');b=s.index(' private relation(',a)
s=s[:a]+r''' reducedMotion=false;lastScreen='';lastTab='';filter='all';focus='';rewardClock=new Map<string,number>();
 textRecords:{text:string;x:number;y:number;size:number;bounds:any;container?:any;layer:string}[]=[];
 itemRecords:{id:string;bounds:any}[]=[];contentHeight=0;private views=new MenuViewState();private headBottom=0;
 private g!:MenuHost;private activePaint:NativePaint|null=null;private inContent=false;private settingsNotice='';private errorExpanded=false;
 private get p(){return this.activePaint||this.g.menu;} private get W(){return this.g.size.W;} private get bottom(){return this.g.size.H-this.g.size.bottom-72;}
 scrollBy(delta:number){const next=Math.max(0,Math.min(this.maxScroll,this.scroll+delta));if(next===this.scroll)return false;this.scroll=next;return true;}
 private measure=(s:string,n:number)=>this.g.menu.measure(s,n);
 private label(t:string,x:number,y:number,size=15,color='#F3EEE1',align='left',container?:any){
  const w=this.measure(t,size),bounds={x:align==='center'?x-w/2:align==='right'?x-w:x,y:y-size*.6,w,h:size*1.2};
  this.textRecords.push({text:t,x,y,size,bounds,container,layer:this.inContent?'content':this.activePaint?'overlay':'fixed'});
  this.p.font=`600 ${size}px Arial`;this.p.fillStyle=color;this.p.textAlign=align;this.p.fillText(t,x,y);
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
 private footer(main?:{id:string;label:string;action:()=>void;disabled?:boolean},back:()=>void=()=>this.g.show('home'),hint=''){
  this.activePaint=null;this.inContent=false;this.p.fillStyle='#101D2B';this.p.fillRect(0,this.bottom-4,this.W,this.g.size.H-this.bottom+4);
  this.button('back','返回',16,this.bottom,84,back);if(main)this.button(main.id,main.label,112,this.bottom,this.W-128,main.action,'gold',!!main.disabled);
  if(hint)this.label(hint,this.W/2,this.bottom+64,12,'#B5BEC6','center');
 }
 private visible(y:number,h:number){return !!intersection({x:12,y,w:this.W-24,h},{x:12,y:this.contentTop,w:this.W-24,h:this.contentBottom-this.contentTop});}
 private surface(y:number,h:number,selected=false,locked=false){return inset(drawCompactCard(this.p,{x:16,y,w:this.W-32,h},locked?'locked':selected?'selected':'normal').content,8);}
 private list(blocks:{id:string;h:number;draw:(y:number)=>void}[],top=this.headBottom){
  this.contentTop=top;this.contentBottom=this.bottom-8;this.contentHeight=blocks.reduce((n,b)=>n+b.h+8,0);
  this.maxScroll=Math.max(0,this.contentHeight-(this.contentBottom-this.contentTop));this.scroll=Math.max(0,Math.min(this.scroll,this.maxScroll));
  this.g.menuLayers?.setViewport({x:12,y:top,w:this.W-24,h:this.contentBottom-top});this.activePaint=this.g.menuLayers?.content||null;this.inContent=true;
  let y=top-this.scroll;for(const b of blocks){if(this.visible(y,b.h)){this.itemRecords.push({id:b.id,bounds:{x:16,y,w:this.W-32,h:b.h}});b.draw(y);}y+=b.h+8;}
  this.activePaint=null;this.inContent=false;
 }
 private infoBlock(id:string,body:string,size=14){
  const h=layoutText(body,this.W-64,size,this.measure).height+28;
  return{id,h,draw:(y:number)=>{this.p.fillStyle='rgba(15,29,42,.92)';this.p.fillRect(16,y,this.W-32,h);this.p.fillStyle='#6A654E';this.p.fillRect(28,y+3,this.W-56,1);this.text(body,{x:30,y:y+14,w:this.W-60,h:h-28},size);}};
 }
''' + s[b:]
s=s.replace("'g_front_'+id+'Run0','g_portrait_'+id", "'g_front_'+id+'Run0','g_boss_'+id+'_idle','g_portrait_'+id")
s=s.replace("if(!key)return;const f=MANIFEST.frames[key]", "if(!key){if(unknown){drawState(this.p,{x:x-w/2,y:y-h,w,h},'locked');return;}throw Error('menu_required_person:'+id);}const f=MANIFEST.frames[key]",1)
s=s.replace("if(!f)return;const sc=", "if(!f)throw Error('menu_required_icon:'+key);const sc=",1)
a=s.index(' draw(g:MenuHost)');b=s.index(' private home()',a)
s=s[:a]+r''' draw(g:MenuHost){this.g=g;this.activePaint=null;this.inContent=false;this.textRecords=[];this.itemRecords=[];
  const key=[g.screen,g.screen==='prepare'?g.chapter:'',g.tab,this.filter,g.screen==='person'?g.personId:'',g.screen==='item'?this.detailId:'',g.screen==='reward'?g.store.data.pendingRewardPresentation?.key:''].join(':');
  const oldKey=this.views.key,v=this.views.enter(key,this.scroll,g.page,this.focus);if(key!==oldKey){this.scroll=v.scroll;g.page=v.page;this.focus=v.focus;}
  this.lastScreen=g.screen;this.lastTab=g.tab;this.maxScroll=0;this.contentTop=g.size.top+108;this.contentBottom=this.bottom-8;
  this.reducedMotion=!!g.platform.book.data.settings.reducedMotion;
  if(!NativePaint.textures.ui_full_components){
   this.p.fillStyle='#101D2B';this.p.fillRect(0,0,this.W,g.size.H);this.label(g.screen==='error'?'资源尚未就绪':'一路长歌：三国',this.W/2,g.size.H*.35,25,'#F1D9A0','center');
   this.wrap(g.screen==='error'?'加载失败，已保留进度。':'正在加载人物、战场与界面组件',24,g.size.H*.47,this.W-48,14);
   if(g.screen==='error'){this.label('重新加载',this.W/2,this.bottom+24,18,'#F1D9A0','center');this.hit('retry','重新加载',16,this.bottom,this.W-32,52,()=>{g.show('loading');void g.load();});}return;
  }
  if(g.screen==='home')this.home();
  if(g.screen==='chapters'||g.screen==='transition')g.drawMap();
  if(g.screen==='prepare')this.prepare();if(g.screen==='collection')this.collection();if(g.screen==='person')this.person();if(g.screen==='item')this.item();
  if(g.screen==='reward')this.reward();if(g.screen==='result')this.result();if(g.screen==='pause')this.pause();if(g.screen==='confirm')this.confirmView();if(g.screen==='settings')this.settings();
  if(g.screen==='loading'||g.screen==='error')this.loadView();if(g.screen==='battle')this.hit('pause','暂停战斗',4,g.size.top,48,48,()=>g.show('pause'));
  this.views.remember(this.scroll,g.page,this.focus);if(g.store.notice)this.saveError();
 }
''' + s[b:]
def replace(name,next,body):
 global s
 a=s.index(' private '+name+'(');b=s.index(' private '+next+'(',a);s=s[:a]+body+'\n'+s[b:]
replace('home','tabs',r''' private home(){const g=this.g,{W,H,top,bottom}=g.size,n=g.store.completed;g.drawHomeArt?.();
  this.p.fillStyle='rgba(8,23,35,.76)';this.p.fillRect(0,top,W,92);
  this.text('一路长歌：三国',{x:20,y:top+12,w:W-88,h:28},25,'#F1D9A0');this.text('已克 '+n+'/20 · '+(n===20?'九州贯通':'下一关 '+CHAPTERS[n].place),{x:20,y:top+48,w:W-40,h:20},14);
  this.button('settings','设置',W-78,top+10,64,()=>{this.settingsReturn='home';g.show('settings');});
  const yy=H-bottom-214,l=g.store.loadout(),weapon=WEAPON_DATA[l.startWeaponId as WeaponId];
  this.p.fillStyle='rgba(12,27,40,.94)';this.p.fillRect(0,yy-104,W,H-yy+104);
  this.text(n===20?'故地重游，再聚同袍':'下一站 · '+CHAPTERS[n].title,{x:20,y:yy-90,w:W-40,h:26},20,'#F1D9A0');
  this.icon(this.weaponIcon(l.startWeaponId),34,yy-40,32,36);this.text('出征 '+weapon.label+' · 永久 Lv.'+(g.store.data.weaponLevels[l.startWeaponId]||1),{x:60,y:yy-56,w:W-80,h:22},14);
  this.text(nextMilestoneHint(n),{x:20,y:yy-23,w:W-40,h:22},12);
  this.button('start',n===0?'开始征程':n===20?'重游山河':'继续征程',16,yy+8,W-32,()=>{g.chapter=Math.min(19,n);g.tab='weapons';g.page=0;g.show('prepare');},'gold');
  this.button('chapters','山河地图',16,yy+76,(W-44)/2,()=>g.show('chapters'));this.button('collection','军中图鉴',28+(W-44)/2,yy+76,(W-44)/2,()=>{g.tab='people';g.page=0;g.show('collection');});
  this.label('主视觉 · 品牌插画，配装以兵器栏为准',W/2,top+110,12,'#F1D9A0','center');
  if(g.store.data.pendingRewardPresentation)this.button('recover-reward','继续查看已存奖励',16,yy+140,W-32,()=>{g.rewardReturn='home';g.show('reward');});
 }''')
replace('tabs','prepare',r''' private tabs(ids:string[],names:string[],y=this.headBottom){const w=(this.W-32-8*(ids.length-1))/ids.length;
  ids.forEach((id,i)=>{const x=16+i*(w+8);drawTab(this.p,{x,y,w,h:48},names[i],this.g.tab===id?'selected':'normal');this.hit('tab-'+id,names[i],x,y,w,48,()=>{this.g.tab=id;this.g.drawMenu();});});this.contentTop=y+56;
 }''')
replace('prepare','collection',r''' private prepare(){const g=this.g,l=g.store.loadout(),W=this.W,c=CHAPTERS[g.chapter];this.header('第'+(g.chapter+1)+'关 · '+c.place,'敌将 '+PEOPLE[c.boss]+' · '+(c.keyMechanic||'数值门与敌阵推进'));
  const y=this.headBottom,box=drawCompactPanel(this.p,{x:16,y,w:W-32,h:112},'raised'),r=inset(box.content,6),selected=l.startWeaponId as WeaponId,lv=g.store.data.weaponLevels[selected]||1;
  this.hero(r.x,r.y,46,42);this.text(WEAPON_DATA[selected].label,{x:r.x+58,y:r.y,w:r.w-136,h:22},15,'#F1D9A0');
  this.text('永久 Lv.'+lv+' · 本局Ⅰ阶',{x:r.x+58,y:r.y+24,w:r.w-60,h:18},12);
  this.button('view-lineup','编组',W-84,y+14,64,()=>{this.confirm('当前编组','主将 '+WEAPON_DATA[selected].label+'\n随军 '+(l.companions.map(id=>PEOPLE[id]).join('、')||'未编入')+' · 支援 '+(PEOPLE[l.support||'']||'未编入'),[{id:'lineup-weapon',label:'查看当前兵器',action:()=>this.detail('weapon',selected,'prepare')}],'prepare');});
  this.text('随军 '+(l.companions.map(id=>PEOPLE[id]).join('、')||'未编入')+' · 支援 '+(PEOPLE[l.support||'']||'未编入'),{x:r.x,y:r.y+46,w:r.w,h:18},12);
  const slots=(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典',qi:'器',ma:'骑'}[slot])+' '+(l.treasures[slot]?TREASURES[l.treasures[slot]!].name:g.store.slotOpen(slot)?'空':'锁'));
  this.text(slots.join(' · '),{x:r.x,y:r.y+66,w:r.w,h:18},12);
  this.tabs(['companions','support','treasures','weapons'],['随军','支援','宝物','兵器'],y+120);
  const weapon=g.tab==='weapons',treasure=g.tab==='treasures',owned=(id:string)=>weapon?g.store.data.weapons.includes(id):treasure?g.store.data.treasures.includes(id):true;
  let rows=weapon?Object.keys(WEAPON_DATA):treasure?Object.keys(TREASURES):g.tab==='support'?g.store.data.visits:g.store.data.captures;
  const isSelected=(id:string)=>weapon?l.startWeaponId===id:treasure?l.treasures[TREASURES[id].slot]===id:g.tab==='support'?l.support===id:l.companions.includes(id);
  rows=rows.map((id,i)=>({id,i,priority:isSelected(id)?0:owned(id)?1:2})).sort((a,b)=>a.priority-b.priority||a.i-b.i).map(v=>v.id);
  const blocks=rows.map(id=>{const name=weapon?WEAPON_DATA[id as WeaponId].label:treasure?TREASURES[id].name:PEOPLE[id],desc=weapon?(owned(id)?'永久 Lv.'+(g.store.data.weaponLevels[id]||1)+' · 本局Ⅰ阶':'第'+(CHAPTERS.findIndex(c=>c.weapon===id)+1)+'关首通'):treasure?({dian:'典籍',qi:'器物',ma:'坐骑'}[TREASURES[id].slot])+' · '+(owned(id)?'已收藏':'未获得'):personRole(id);
   const titleH=layoutText(name,W-190,15,this.measure).height,descH=layoutText(desc,W-190,12,this.measure).height,h=Math.max(80,titleH+descH+34);
   return{id,h,draw:(y:number)=>{const r=this.surface(y,h,isSelected(id),!owned(id));if(weapon)this.icon(this.weaponIcon(id),r.x+21,y+h/2,40,48);else if(treasure)this.icon(TREASURES[id].icon,r.x+21,y+h/2,40,48);else this.figure(id,r.x+21,r.y+r.h,42,r.h);
    this.text((isSelected(id)?'✓ ':'')+name,{x:82,y:r.y,w:W-180,h:titleH},15,'#F1D9A0');this.text(desc,{x:82,y:r.y+titleH+2,w:W-180,h:descH},12);
    this.hit((weapon?'select-':treasure?'treasure-':g.tab==='support'?'support-':'comp-')+id,name,16,y,W-104,h,()=>{
     if(!owned(id)){this.detail(weapon?'weapon':'treasure',id,'prepare');return;}
     if(weapon)g.store.selectWeapon(id);else if(treasure){const t=TREASURES[id],old=l.treasures[t.slot];if(!g.store.slotOpen(t.slot)){this.detail('treasure',id,'prepare');return;}if(old&&old!==id){this.confirm('替换'+({dian:'典籍',qi:'器物',ma:'坐骑'}[t.slot]),TREASURES[old].name+' → '+t.name,[{id:'replace-treasure',label:'确认佩戴',action:()=>{g.store.equipTreasure(id);g.show('prepare');}}],'prepare');return;}g.store.equipTreasure(id);}else this.equipPerson(id);g.drawMenu();
    });this.button('detail-'+id,'详情',W-84,y+(h-52)/2,68,()=>{if(weapon||treasure)this.detail(weapon?'weapon':'treasure',id,'prepare');else{g.personId=id;this.detailReturn='prepare';g.show('person');}});
   }};});
  if(!rows.length)blocks.push(this.infoBlock('empty',g.tab==='support'?'第二关寻访后开放支援。主将已整装，可直接出征。':'通关后可邀请同袍。主将已整装，可直接出征。'));
  blocks.push({id:'tactic',h:64,draw:(y:number)=>{const r=this.surface(y,64);this.text('兵法 · '+(l.tactic==='zhenjun'?'震军':'贯阵')+' · 点击切换',{x:r.x,y:r.y,w:r.w,h:r.h},14,'#F1D9A0');this.hit('tactic','切换兵法',16,y,W-32,64,()=>{g.store.equipTactic();g.drawMenu();});}});
  if(g.store.data.weaponTrialPrevious&&g.store.data.weaponTrialPrevious!==selected)blocks.push({id:'restore',h:52,draw:(y:number)=>this.button('restore-weapon','恢复原兵器',16,y,W-32,()=>{const id=String(g.store.data.weaponTrialPrevious);g.store.data.weaponTrialPrevious=null;g.store.selectWeapon(id);g.drawMenu();})});
  blocks.push(this.infoBlock('treasure-summary',(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'：'+(l.treasures[slot]?TREASURES[l.treasures[slot]!].name:g.store.slotOpen(slot)?'未佩戴':'槽未开')).join('\n')));
  this.list(blocks,this.contentTop);this.footer({id:'depart',label:'出征',action:()=>g.begin(),disabled:!!g.store.notice},undefined,this.maxScroll?'上滑查看 · 详情返回保留位置':'编组已就绪');
 }''')
replace('collection','person',r''' private collection(){const g=this.g,d=g.store.data;this.header('军中图鉴','已遇 '+Object.keys(PEOPLE).filter(id=>this.relation(id)!=='未遇').length+'/42 · 收服 '+d.captures.length+' · 支援 '+d.visits.length+' · 盟约 '+d.allies.length);
  this.tabs(['people','weapons','treasures'],['人物','兵器','宝物']);const filters=g.tab==='people'?['all','seen','companion','support','ally']:['all','owned'],names=g.tab==='people'?['全部','已遇','随军','支援','盟约']:['全部','已拥有'];
  const active=filters.includes(this.filter)?this.filter:'all',fy=this.contentTop,w=(this.W-32-8*(filters.length-1))/filters.length;
  filters.forEach((f,i)=>{const x=16+i*(w+8);drawTab(this.p,{x,y:fy,w,h:48},names[i],active===f?'selected':'normal');this.hit('filter-'+f,names[i],x,fy,w,48,()=>{this.filter=f;g.drawMenu();});});
  let ids=g.tab==='people'?Object.keys(PEOPLE):g.tab==='weapons'?Object.keys(WEAPON_DATA):Object.keys(TREASURES);
  ids=ids.filter(id=>g.tab==='people'?active==='all'||active==='seen'&&this.relation(id)!=='未遇'||active==='companion'&&d.captures.includes(id)||active==='support'&&d.visits.includes(id)||active==='ally'&&d.allies.includes(id):active==='all'||(g.tab==='weapons'?d.weapons:d.treasures).includes(id));
  const start=fy+58,end=this.bottom-62,rowH=134,rows=Math.max(1,Math.floor((end-start)/(rowH+8))),per=rows*2,pages=Math.max(1,Math.ceil(ids.length/per));g.page=Math.max(0,Math.min(g.page,pages-1));const cw=(this.W-44)/2;
  this.contentTop=start;this.contentBottom=end;g.menuLayers?.setViewport({x:12,y:start,w:this.W-24,h:end-start});this.activePaint=g.menuLayers?.content||null;this.inContent=true;
  ids.slice(g.page*per,(g.page+1)*per).forEach((id,i)=>{const x=16+i%2*(cw+12),y=start+Math.floor(i/2)*(rowH+8),person=g.tab==='people',weapon=g.tab==='weapons',rel=person?this.relation(id):'',owned=person?rel!=='未遇':(weapon?d.weapons:d.treasures).includes(id),r=inset(drawCompactCard(this.p,{x,y,w:cw,h:rowH},owned?'normal':'locked').content,8);
   if(person)this.figure(id,x+cw/2,r.y+70,r.w,70,!owned);else this.icon(weapon?this.weaponIcon(id):TREASURES[id].icon,x+cw/2,r.y+34,60,66);
   this.text(person?owned?PEOPLE[id]:'未遇之人':weapon?WEAPON_DATA[id as WeaponId].label:TREASURES[id].name,{x:r.x,y:r.y+72,w:r.w,h:20},14,'#F1D9A0','center');
   const badge=person?({收:'收服 · 可随军',访:'寻访 · 可支援',盟:'盟约 · 不占槽',遇:'已遇 · 待结缘',未遇:'未遇'}[rel]):owned?weapon?'永久 Lv.'+(d.weaponLevels[id]||1):'已收藏':'未获得';
   this.text(badge,{x:r.x,y:r.y+93,w:r.w,h:18},12,'#BAC8D0','center');this.hit((person?'person-':'item-')+id,'查看详情',x,y,cw,rowH,()=>{this.detailReturn='collection';if(person){g.personId=id;g.show('person');}else this.detail(weapon?'weapon':'treasure',id,'collection');});
  });this.activePaint=null;this.inContent=false;const py=this.bottom-58;this.button('prev-page','上一页',16,py,100,()=>{g.page=(g.page+pages-1)%pages;g.drawMenu();});this.button('next-page','下一页',this.W-116,py,100,()=>{g.page=(g.page+1)%pages;g.drawMenu();});this.label((g.page+1)+' / '+pages+' · '+ids.length+'项',this.W/2,py+26,12,'#F1D9A0','center');this.footer();
 }''')
replace('person','item',r''' private person(){const g=this.g,id=g.personId,rel=this.relation(id),known=rel!=='未遇',info=PERSON_PROFILES[id],c=CHAPTERS.find(c=>c.boss===id||c.enemy.includes(id)||c.capture.includes(id)||c.visit.includes(id)||c.allies.includes(id));
  this.header(known?PEOPLE[id]+(info?.[0]?' · '+info[0]:''):'未遇之人',known?(info?.[1]||'')+' · '+({收:'可随军',访:'可支援',盟:'盟约常驻',遇:'已遇',未遇:'未遇'}[rel]):'循征程前行，再会天下英杰');
  const lines=[known?personRole(id):'人物剪影 · 尚未遇见',c?'相逢 · 第'+(CHAPTERS.indexOf(c)+1)+'关 '+(known?c.title:c.faction+'篇'):'继续推进征程'];
  if(known){const owner=Object.values(WEAPON_DATA).find(w=>w.owner===id);if(owner)lines.push('共鸣兵器 · '+owner.label);if(info)lines.push(info[2]+'\n'+info[3]);}if(rel==='盟')lines.push('盟约常驻，无需占用随军或支援位。');
  const blocks=[{id:'portrait',h:180,draw:(y:number)=>{const r=inset(drawCompactPanel(this.p,{x:16,y,w:this.W-32,h:180},'raised').content,8);this.figure(id,this.W/2,r.y+r.h,this.W*.6,r.h,!known);}},this.infoBlock('biography',lines.join('\n\n'))];
  this.list(blocks);const equipped=rel==='收'?g.store.data.companions.includes(id):g.store.data.support===id;
  this.footer(rel==='收'||rel==='访'?{id:'person-equip',label:equipped?'移出'+(rel==='收'?'随军':'支援'):'编入'+(rel==='收'?'随军':'支援'),action:()=>this.equipPerson(id),disabled:rel==='访'&&g.store.completed<2}:undefined,()=>g.show(this.detailReturn==='reward'?'reward':this.detailReturn==='prepare'?'prepare':'collection'),this.maxScroll?'上滑查看经历 · 返回保留原位置':'关系与操作按实际资格');
 }''')
replace('item','reward',r''' private item(){const g=this.g,id=this.detailId,weapon=this.detailKind==='weapon',w=WEAPON_DATA[id as WeaponId],t=TREASURES[id],owned=(weapon?g.store.data.weapons:g.store.data.treasures).includes(id),lv=g.store.data.weaponLevels[id]||1,slot=t?.slot,cost=TUNING.upgradeCost(lv);
  this.header(weapon?w.label:t.name,weapon?'兵器册 · 永久成长 / 本局阶位':({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+' · '+(owned?'已收藏':'未获得'));
  const blocks=[{id:'item-body',h:104,draw:(y:number)=>{const r=inset(drawCompactPanel(this.p,{x:16,y,w:this.W-32,h:104},'raised').content,8);this.icon(weapon?this.weaponIcon(id):t.icon,this.W/2,r.y+r.h/2,r.w*.7,r.h);}}];
  const body=weapon?['永久 Lv.'+lv+' · 伤害 +'+Math.round((lv-1)*TUNING.weaponLevelDamage*100)+'%','本局Ⅰ阶 · 同兵器匣升Ⅱ/Ⅲ阶',lv<TUNING.weaponMaxLevel?'下一永久等级：伤害 +'+Math.round(lv*TUNING.weaponLevelDamage*100)+'%':'永久已满级','共鸣 · '+(w.owner?PEOPLE[w.owner]+' / '+w.label:'无专属共鸣'),owned?'当前军功 '+g.store.data.xp+(lv<TUNING.weaponMaxLevel?' · 升级需 '+cost:''):'第'+(CHAPTERS.findIndex(c=>c.weapon===id)+1)+'关首通获得'].join('\n'):t.effect+'\n'+(owned?g.store.data.slots[slot]===id?'已佩戴':g.store.slotOpen(slot)?'可以佩戴':'槽位尚未开启':'继续征程获取本件宝物');
  blocks.push(this.infoBlock('growth-ability',body));
  if(weapon&&owned)blocks.push({id:'choose',h:52,draw:(y:number)=>this.button('choose-item',g.store.loadout().startWeaponId===id?'已选为出征兵器':'设为出征兵器',16,y,this.W-32,()=>{g.store.selectWeapon(id);g.drawMenu();})});
  this.list(blocks);
  this.footer({id:weapon?'upgrade-item':'equip-item',label:weapon?!owned?'尚未获得':lv>=TUNING.weaponMaxLevel?'永久已满级':g.store.data.xp<cost?'军功不足 '+(cost-g.store.data.xp):'升级 · '+cost+'军功':!owned?'尚未获得':!g.store.slotOpen(slot)?'槽位未开':g.store.data.slots[slot]===id?'移出当前槽':'佩戴到'+({dian:'典籍',qi:'器物',ma:'坐骑'}[slot]),disabled:!owned||(weapon?(lv>=TUNING.weaponMaxLevel||g.store.data.xp<cost):!g.store.slotOpen(slot)),action:()=>{if(weapon){g.store.upgrade(id);g.drawMenu();}else{const old=g.store.data.slots[slot];if(old&&old!==id)this.confirm('替换'+({dian:'典籍',qi:'器物',ma:'坐骑'}[slot]),TREASURES[old].name+' → '+t.name,[{id:'replace-treasure',label:'确认佩戴',action:()=>{g.store.equipTreasure(id);g.show('item');}}],'item');else{g.store.equipTreasure(id);g.drawMenu();}}}},()=>g.show(this.detailReturn),weapon?'升级与选择分开 · 不改变本局阶位':'替换需确认 · 取消保留原配装');
 }''')
replace('reward','result',r''' private reward(){const g=this.g,r=g.store.data.pendingRewardPresentation;if(!r){g.show(g.rewardReturn);return;}const previous=this.rewardClock.get(r.key)||0,age=this.reducedMotion?3:Math.max(previous,g.screenAge);this.rewardClock.set(r.key,age);
  const title=r.kind==='migration'?'征程更新':r.chapter===9&&r.kind==='milestone'?'上篇完成 · 下篇开启':r.chapter===19?'二十关贯通 · 九州长歌':r.title;
  const unique=Array.from(new Map(r.items.map(i=>[i.kind+':'+i.id,i])).values()),primary=unique.find(i=>i.kind==='weapon'&&i.isNew)||unique.find(i=>i.kind==='person'&&i.isNew)||unique[0],remaining=unique.filter(i=>i!==primary);
  this.header(title,r.kind==='migration'?'原收藏与配装保留':(g.store.notice?'保存未完成':'已入库')+' · 本次共'+unique.length+'项 · 军功 +'+r.xp);
  const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[];
  if(r.kind==='migration')blocks.push(this.infoBlock('migration','补齐 '+r.backfilled+' 座里程碑\n军功 +'+r.xp+' · 原收藏与配装保留'));
  if(primary){blocks.push({id:'primary',h:124,draw:(y:number)=>{const r0=this.surface(y,124,true);const progress=this.reducedMotion?1:Math.max(.15,Math.min(1,(age-.18)/.47));this.p.save();this.p.globalAlpha=progress;const cy=r0.y+34;if(primary.kind==='person')this.figure(primary.id,this.W/2,cy+30,98,65);else this.icon(primary.kind==='weapon'?this.weaponIcon(primary.id):primary.kind==='treasure'?TREASURES[primary.id].icon:'c20_stamp_'+Number(primary.id.replace('badge_m','')),this.W/2,cy,100,62);this.p.restore();this.text(rewardLabel(primary),{x:r0.x,y:r0.y+69,w:r0.w,h:24},18,'#F1D9A0','center');this.hit('reward-primary','查看主要奖励',16,y,this.W-32,124,()=>{this.detailReturn='reward';if(primary.kind==='person'){g.personId=primary.id;g.show('person');}else if(primary.kind==='weapon'||primary.kind==='treasure')this.detail(primary.kind,primary.id,'reward');});}});}
  for(let i=0;i<remaining.length;i+=2){const group=remaining.slice(i,i+2),w=(this.W-44)/2,h=Math.max(72,...group.map(it=>layoutText(rewardLabel(it),w-62,14,this.measure).height+44));blocks.push({id:'tray-'+i,h,draw:(y:number)=>group.forEach((it,j)=>{const x=16+j*(w+12),r0=inset(drawCompactCard(this.p,{x,y,w,h},'normal').content,8);this.p.save();this.p.globalAlpha=this.reducedMotion?1:Math.max(.18,Math.min(1,(age-.55-j*.06)/.5));if(it.kind==='person')this.figure(it.id,r0.x+15,r0.y+r0.h,30,r0.h);else this.icon(it.kind==='weapon'?this.weaponIcon(it.id):it.kind==='treasure'?TREASURES[it.id].icon:'c20_stamp_'+Number(it.id.replace('badge_m','')),r0.x+15,y+h/2,28,34);this.p.restore();this.text(rewardLabel(it),{x:r0.x+38,y:r0.y,w:r0.w-38,h:h-42},14,'#F1D9A0');this.text(it.relation?({收:'可随军',访:'可支援',盟:'盟约'}[it.relation]):it.isNew?'新收藏':'已有收藏',{x:r0.x+38,y:r0.y+h-52,w:r0.w-38,h:16},12);this.hit('reward-item-'+it.id,'查看奖励详情',x,y,w,h,()=>{if(it.kind==='person'){g.personId=it.id;this.detailReturn='reward';g.show('person');}else if(it.kind==='weapon'||it.kind==='treasure')this.detail(it.kind,it.id,'reward');});})});}
  if(r.kind==='milestone')blocks.push(this.infoBlock('next-milestone',nextMilestoneHint(g.store.completed),13));
  this.list(blocks);this.footer({id:'reward-done',label:age<1.8?'收下 · 跳过演出':'全部收下',disabled:age<.3||!!g.store.notice,action:()=>{if(g.store.acknowledgePresentation())g.show(g.rewardReturn);else g.drawMenu();}},()=>g.show(g.rewardReturn),this.maxScroll?'上滑查看余项 · 本次'+unique.length+'项':'已保存 · 收下仅结束演出');
 }''')
replace('result','pause',r''' private result(){const g=this.g,st=g.battle?.state,won=(st?.troops||0)>0,receipt=g.resultReceipt,c=CHAPTERS[g.chapter],next=Math.min(19,g.chapter+1),xp=receipt?.xp??Number(won?g.store.data.lastRewardXP||0:g.store.data.lastPracticeXP||0);
  this.header(won?'凯旋 · '+c.place:'此役未竟','本役 第'+(g.chapter+1)+'关 · 全局已克 '+g.store.completed+'/20');
  const blocks:{id:string;h:number;draw:(y:number)=>void}[]=[];
  if(won)blocks.push({id:'victory-focus',h:128,draw:(y:number)=>{const banner=drawBanner(this.p,{x:16,y,w:this.W-32,h:58},'victory');this.text(c.place+' · 凯旋',{...banner.content,y:banner.content.y+2,h:24},18,'#F1D9A0','center');this.p.frame('c20_site_city',this.W/2,y+123,65);this.p.frame('c20_flag_done',this.W/2+42,y+107,43);}});
  blocks.push(this.infoBlock('battle-result','归营兵力 '+Math.round(st?.troops||0)+' · 军功 +'+xp+'\n累计军功 '+g.store.data.xp+(g.store.notice?' · 保存未完成':' · 已保存'),15));
  if(won){const items=Array.from(new Map((receipt?.items||[]).map((i:any)=>[i.kind+':'+i.id,i])).values()) as any[];blocks.push(this.infoBlock('new-collection',g.first?items.map(i=>rewardLabel(i)).join(' · ')||'首通进度已记录':'重游战果已记录 · 首通收藏不重复授予'));
   blocks.push(this.infoBlock('next-target',g.chapter===19?'二十关贯通 · 可回山河重游':'下一出征 · 第'+(next+1)+'关 '+CHAPTERS[next].place+'\n全局下一里程碑 · '+nextMilestoneHint(g.store.completed),13));
  }else{const sources=g.battle?.snapshot().damageSources||{},worst=Object.entries(sources).filter(([,v])=>typeof v==='number').sort((a,b)=>Number(b[1])-Number(a[1]))[0],labels:Record<string,string>={gate:'负数门',negative_gate:'负数门',arrow:'敌军箭矢',archer:'弓手射击',rain:'箭雨',enemy:'敌军接触',boss:'敌将攻击',officer:'途中名将',wall:'隔离墙'};
   const name=worst?(labels[worst[0]]||(/gate/.test(worst[0])?'数值门':/arrow|archer|rain/.test(worst[0])?'敌军箭矢':/boss|officer/.test(worst[0])?'敌将攻击':'敌阵损耗')):'';
   blocks.push(this.infoBlock('losses',worst?'主要战损 · '+name+' '+worst[1]+'名\n'+(/gate/.test(worst[0])?'提前对准援兵门，绕开负数门。':/arrow|archer|rain/.test(worst[0])?'移出射线和地面预警区域。':'观察预警，移到攻击带外再反击。'):'本次未记录完整战损归因，无法给出具体原因。'));
  }
  blocks.push({id:'adjust',h:52,draw:(y:number)=>this.button('view-reward',won?'整备查看':'调整编组',16,y,this.W-32,()=>{g.tab='companions';g.show('prepare');})});
  if(won&&c.weapon)blocks.push({id:'try',h:52,draw:(y:number)=>this.button('try-weapon','下关试用 · '+WEAPON_DATA[c.weapon!].label,16,y,this.W-32,()=>{g.store.data.weaponTrialPrevious=g.store.data.selectedWeaponId;if(g.store.selectWeapon(c.weapon!)){g.chapter=next;g.tab='weapons';g.show('prepare');}})});
  this.list(blocks);this.footer({id:'next',label:won?g.chapter===19?'重游山河':'整军 · 第'+(next+1)+'关':'再战本关',disabled:!!g.store.notice,action:()=>{if(!won)g.begin();else g.show(g.chapter===19?'chapters':'transition');}});
 }''')
replace('confirmView','settings',r''' private confirmView(){const g=this.g;this.p.fillStyle='rgba(8,18,28,.98)';this.p.fillRect(0,0,this.W,g.size.H);this.header(this.confirmTitle,this.confirmTitle==='当前编组'?'当前配装 · 出征以此为准':'确认前不会执行操作');
  const body=this.confirmText+(this.confirmTitle==='当前编组'?'\n'+(['dian','qi','ma'] as Slot[]).map(slot=>({dian:'典籍',qi:'器物',ma:'坐骑'}[slot])+'：'+(g.store.loadout().treasures[slot]?TREASURES[g.store.loadout().treasures[slot]!].name:'未佩戴')).join('\n'):'');
  const blocks=[this.infoBlock('confirm-context',body)];if(this.confirmTitle==='当前编组')blocks.unshift({id:'lineup',h:182,draw:(y:number)=>this.hero(30,y+12,this.W-60,156)});
  for(const a of this.confirmActions)blocks.push({id:a.id,h:52,draw:(y:number)=>this.button(a.id,a.label,24,y,this.W-48,a.action,this.confirmTitle==='当前编组'?'navy':'warning')});this.list(blocks);this.footer(undefined,()=>g.show(this.confirmReturn));
 }''')
replace('settings','loadView',r''' private settings(){const g=this.g,b=g.platform.book;this.header('行军设置','音乐保持关闭 · 设置独立于成长存档');
  const setting=(key:'sfx'|'vibration'|'reducedMotion',name:string)=>({id:key,h:52,draw:(y:number)=>this.button(key==='reducedMotion'?'motion':key,name+' · '+(b.data.settings[key]?'开':'关'),16,y,this.W-32,()=>{const old=b.data.settings[key];b.data.settings[key]=!old;if(b.persist()===false){b.data.settings[key]=old;this.settingsNotice='设置保存失败，仍使用原值；请重试。';}else this.settingsNotice='设置已保存';g.platform.syncAudio(false);g.battle?.clearAudioEvents();g.drawMenu();})});
  const build=BRIDGE_BUILD as any,blocks=[setting('sfx','音效'),setting('vibration','震动'),setting('reducedMotion','降低动态'),this.infoBlock('motion-help','降低动态减少非必要位移、闪烁与缩放；保留信息和危险预警，不改变战斗节奏。',13),this.infoBlock('real-version','运行平台 '+build.target+'\n应用版本 '+(build.app_version||'包未写入')+' / '+(build.build_number||'unknown')+'\n构建 '+build.build_id+'\n代码 '+build.code_fingerprint.slice(0,16),13)];
  if(this.settingsNotice)blocks.push(this.infoBlock('settings-result',this.settingsNotice,13));this.list(blocks);this.footer(undefined,()=>g.show(this.settingsReturn),this.settingsNotice);
 }''')
replace('loadView','saveError',r''' private loadView(){const g=this.g;this.header(g.screen==='error'?'资源尚未就绪':'整装待发',g.screen==='error'?'已保留本机存档':'正在加载资源 · 不显示未知百分比');drawState(this.p,{x:this.W/2-30,y:this.headBottom+22,w:60,h:60},g.screen==='error'?'error':'loading');
  const blocks=[this.infoBlock('load-state',g.screen==='error'?'资源加载失败，请重试。原进度与配装保留。':'战场、人物、界面组件加载中')];if(g.screen==='error')blocks.push({id:'dev-detail',h:52,draw:(y:number)=>this.button('error-detail',this.errorExpanded?'收起诊断信息':'查看诊断信息',16,y,this.W-32,()=>{this.errorExpanded=!this.errorExpanded;g.drawMenu();})});if(this.errorExpanded)blocks.push(this.infoBlock('error-text',g.loadingError,13));this.list(blocks,this.headBottom+94);
  if(g.screen==='error')this.footer({id:'retry',label:'重新加载',action:()=>{g.show('loading');void g.load();}});else this.footer();
 }''')
a=s.index(' private saveError(')
s=s[:a]+r''' private saveError(){const g=this.g,y=g.size.H-g.size.bottom-202;this.activePaint=g.menuLayers?.overlay||null;this.inContent=false;this.p.fillStyle='rgba(8,18,28,.99)';this.p.fillRect(0,y,this.W,210);g.hits=[];
  const r=inset(drawCompactPanel(this.p,{x:12,y:y+4,w:this.W-24,h:184},'raised').content,8);this.text('保存未完成，进度仍在本次运行中。\n请重试后再继续。',{x:r.x,y:r.y,w:r.w,h:52},14);this.button('retry-save','重试保存',24,y+108,this.W-48,()=>{if(g.store.retry()&&g.store.data.pendingRewardPresentation){g.rewardReturn=g.screen==='result'?'result':'home';g.show('reward');}else g.drawMenu();},'gold');this.activePaint=null;
 }
}
'''
# Python strings must leave explicit newlines within TypeScript string literals escaped.
# All intended TS source structure uses real newlines; only quoted values use \n in the recipe.
p.write_text(s)
