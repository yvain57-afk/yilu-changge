# coding: utf-8
from pathlib import Path
import hashlib
p=Path('assets/scripts/formal/FormalGame.ts');s=p.read_text()
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5b805cb99e92414bc0d5cd52215bc930dbd419d5a3a0294d7bee1e945e9cf9f2'
s="import {MenuLayers} from './MenuLayers';\nimport {inset,layoutText} from './MenuLayout';\n"+s
s=s.replace('drawButton,drawPanel,drawTab','drawButton,drawCompactPanel,drawPanel,drawTab',1)
s=s.replace(" private reviewFixtureOpened=false;", " private menuLayers!:MenuLayers;private gestureDragged=false;private reviewMenuFault='';private faultOrigin:'battle'|'menu'='battle';private faultMenuScreen:Screen='home';private isolatedInsets:{top:number;bottom:number}|null=null;\n private reviewFixtureOpened=false;",1)
s=s.replace('top=Math.max(8,m?.safe.top||0),bottom=Math.max(8,(m?.height||H)-(m?.safe.bottom||H))','top=this.isolatedInsets?.top??Math.max(8,m?.safe.top||0),bottom=this.isolatedInsets?.bottom??Math.max(8,(m?.height||H)-(m?.safe.bottom||H))',1)
s=s.replace('this.menu=new NativePaint(this.ui);', 'this.menuLayers=new MenuLayers(this.ui);this.menu=this.menuLayers.fixed;',1)
s=s.replace('this.startY=this.lastY=p.y;this.mapDragging=false;', 'this.startY=this.lastY=p.y;this.mapDragging=false;this.gestureDragged=false;',1)
s=s.replace("this.uiSkin&&['prepare','person','item','reward','result'].includes(this.screen)&&this.startY>=this.fullMenu.contentTop&&this.startY<=this.fullMenu.contentBottom&&Math.abs(p.y-this.startY)>8", "this.uiSkin&&['prepare','person','item','reward','result','settings','confirm','error','loading'].includes(this.screen)&&this.startY>=this.fullMenu.contentTop&&this.startY<=this.fullMenu.contentBottom&&(this.gestureDragged||Math.hypot(p.y-this.startY,p.x-this.startX)>8)")
s=s.replace('this.pressed=null;this.fullMenu.scrollBy', 'this.gestureDragged=true;this.pressed=null;this.fullMenu.scrollBy',1)
s=s.replace('p=this.at(e),h=this.pressed;this.cancel();if(h&&', 'p=this.at(e),h=this.pressed,dragged=this.gestureDragged;this.cancel();if(h&&!dragged&&',1)
s=s.replace('this.hits=[];this.menu.begin(s);this.art.begin();', 'this.hits=[];try{if(this.menuLayers)this.menuLayers.begin(s);else this.menu.begin(s);this.art.begin();',1)
s=s.replace(" this.menu.end();this.art.end();if(sys.isNative)", " if(this.menuLayers)this.menuLayers.commit();else this.menu.end();this.art.end();}catch(error){this.hits=[];this.menuLayers?.abort();this.menu.abortFrame();this.art.begin();this.art.end();this.enterRenderError(error,'menu');return;}if(sys.isNative)",1)
# Map drawing uses a separate measured menu budget, preserving old terrain/site data and legacy path.
s=s.replace('mapMetrics(this.size,this.mapExpanded)', 'this.menuMapMetrics()')
s=s.replace('mapMetrics(this.size)', 'this.menuMapMetrics()')
s=s.replace("if(transition&&!this.mapDragging&&this.screenAge<1.2)", "if(transition&&!this.fullMenu.reducedMotion&&!this.mapDragging&&this.screenAge<1.2)",1)
s=s.replace("conquest=transition&&this.first;", "conquest=transition&&this.first&&!this.fullMenu.reducedMotion;",1)
a=s.index('  // Fixed chrome masks terrain;');b=s.index('\n  this.button(transition?',a)
old=s[a:b]
new=r'''  // A light measured chrome, independent from the retained five terrain panels.
  p.fillStyle='#122639';p.fillRect(0,0,W,m.y);
  if(this.uiSkin){
   const r=inset(drawCompactPanel(p,{x:12,y:top,w:W-24,h:m.y-top-8},'raised').content,8);
   this.menuText('天下征程',{x:68,y:r.y,w:W-136,h:26},22,'#E6CD93','center');
   this.menuText('征程进度 · '+this.store.completed+'/20',{x:r.x,y:r.y+29,w:r.w,h:18},13);
   const next=MILESTONES.find(v=>v.chapter>this.store.completed);this.menuText(next?'下一未领里程碑 · 第'+next.chapter+'关 '+next.title:'全部里程碑已领取',{x:r.x,y:r.y+49,w:r.w,h:18},12);
  }else{this.label('天下征程',W/2,top+18,21,'#E6CD93','center');this.label('已克 '+this.store.completed+'/'+CHAPTERS.length,W/2,top+40,12,'#D4D8CF','center');this.label(nextMilestoneHint(this.store.completed),W/2,top+60,11,'#D4D8CF','center');}
  this.hits.push({id:'map-back',label:'返回营地',x:0,y:top,w:52,h:48,action:()=>this.show('home')});this.label('‹',24,top+23,25);this.hits.push({id:'map-current',label:'回到当前',x:W-64,y:top,w:64,h:48,action:()=>{this.mapSelection=Math.min(CHAPTERS.length-1,this.store.completed);this.mapScroll=mapScrollFor(this.mapSelection,m);this.drawMenu();}});this.label('定位',W-32,top+24,12,'#E6CD93','center');
  const c=CHAPTERS[this.mapSelection],dy=m.bottom,owned=this.store.data.cleared.includes(c.id),available=this.store.unlocked(this.mapSelection);p.fillStyle='rgba(14,29,42,.98)';p.fillRect(0,dy,W,H-dy);
  const r=inset(drawCompactPanel(p,{x:12,y:dy+4,w:W-24,h:H-dy-bottom-66},'normal').content,8);
  this.menuText('当前选择 · 第'+(this.mapSelection+1)+'关 '+c.place,{x:r.x,y:r.y,w:r.w-72,h:24},16,'#E6CD93');
  this.menuText(chapterThreats(this.mapSelection),{x:r.x,y:r.y+28,w:r.w,h:24},13);
  const main=c.weapon?WEAPON_DATA[c.weapon].label:c.treasure?TREASURES[c.treasure].name:PEOPLE[c.boss];this.menuText((owned?'已获 · ':'首胜 · ')+main,{x:r.x,y:r.y+55,w:r.w,h:20},13,'#CFC1A1');
  this.label(this.mapExpanded?'收起 ▾':'详情 ▴',W-46,r.y+11,12,'#D1C5A8','center');this.hits.push({id:'map-detail',label:'展开关卡详情',x:W-78,y:dy+5,w:66,h:48,action:()=>{this.mapExpanded=!this.mapExpanded;this.drawMenu();}});
  if(this.mapExpanded){const rewards=[...c.capture.map(id=>'收 '+PEOPLE[id]),...c.visit.map(id=>'访 '+PEOPLE[id]),...c.allies.map(id=>'盟 '+PEOPLE[id]),c.treasure?TREASURES[c.treasure].name:''].filter(Boolean).join(' · ');this.menuText(rewards,{x:r.x,y:r.y+83,w:r.w,h:56},13);
   if(this.store.completed===CHAPTERS.length){const orders=[null,'elite','few-supplies','double-officers'],labels=['常规','精兵','少援','双将'],at=orders.indexOf((this.store.data.replayOrder as string)||null);this.menuText('重游军令 · '+labels[Math.max(0,at)]+'  ›',{x:r.x,y:r.y+145,w:r.w,h:22},14,'#E6CD93');this.hits.push({id:'replay-order',label:'切换重游军令',x:16,y:r.y+127,w:W-32,h:48,action:()=>{this.store.setReplayOrder(orders[(at+1)%orders.length]);this.drawMenu();}});}else this.menuText('架空征程示意 · '+mapPanelNames[Math.floor(this.mapSelection/4)],{x:r.x,y:r.y+145,w:r.w,h:22},12);
  }'''
s=s[:a]+new+s[b:]
# Publicly emitted hooks only exist in DEBUG fixture contexts.
s=s.replace("  if(cmd==='scroll')", "  if(cmd==='menu-fault'){this.reviewMenuFault=String(value);this.drawMenu();return true;}\n  if(cmd==='safe-insets'){this.isolatedInsets=value;this.drawMenu();return true;}\n  if(cmd==='settings-failure'){this.platform.book.persist=()=>false;return true;}\n  if(cmd==='long-content'){this.fullMenu.confirmTitle='长内容裁切验证';this.fullMenu.confirmText=String(value);this.fullMenu.confirmActions=[];this.fullMenu.confirmReturn='prepare';this.show('confirm');return true;}\n  if(cmd==='scroll')",1)
s=s.replace(" private enterRenderError(error:unknown){", " private enterRenderError(error:unknown,origin:'battle'|'menu'='battle'){\n  this.faultOrigin=origin;if(origin==='menu')this.faultMenuScreen=this.screen;this.menuLayers?.abort();this.paint?.abortFrame();",1)
start=s.index(' private async retryRender()');end=s.index('\n snapshot()',start)
s=s[:start]+r''' private async retryRender(){if(this.retryingRender)return;this.retryingRender=true;this.showSafeError();try{await NativePaint.load();if(this.disposed)return;
  if(this.faultOrigin==='battle'&&!this.battle?.retryRender(this.size))throw Error(this.battle?.diagnostics.renderFailure?.message||'画面仍未就绪');
  this.renderFault='';this.retryingRender=false;this.acc=0;this.show(this.faultOrigin==='menu'?this.faultMenuScreen:'battle');
 }catch(e){this.retryingRender=false;this.renderFault=String(e);if(!this.disposed)this.showSafeError();}}
 private menuProbe(stage:string){if(DEBUG&&this.reviewFixture&&this.reviewMenuFault===stage){this.reviewMenuFault='';throw Error('injected menu '+stage+' failure');}}
 private drawHomeArt(){const {W,H,top}=this.size;this.art.draw(this.bg,'home-hero','hero-home',0,H*.14,W*.96,H*.57,'contain');}
 private menuMapMetrics(){const m=mapMetrics(this.size,this.mapExpanded);if(!this.uiSkin)return m;
  const s=this.size,y=s.top+112,bottom=s.H-s.bottom-(this.mapExpanded?270:180),height=Math.max(120,bottom-y),step=Math.max(122,height/3.5),panel=step*4;
  return{y,bottom,height,step,panel,total:panel*5,maxScroll:Math.max(0,panel*5-height)};
 }
 private menuText(text:string,r:{x:number;y:number;w:number;h:number},size=14,color='#D5DAD7',align='left'){
  const v=layoutText(text,r.w,size,this.menu.measure.bind(this.menu));v.lines.forEach((t,i)=>{const x=align==='center'?r.x+r.w/2:r.x,y=r.y+v.lineHeight/2+i*v.lineHeight,w=this.menu.measure(t,size);this.label(t,x,y,size,color,align);this.fullMenu.textRecords.push({text:t,x,y,size,bounds:{x:align==='center'?x-w/2:x,y:y-size*.6,w,h:size*1.2},container:r,layer:'fixed'});});return v.height;
 }''' +s[end:]
s=s.replace("ui:{skin:this.uiSkin?'full':'legacy',scroll:this.fullMenu.scroll,maxScroll:this.fullMenu.maxScroll,texts:this.fullMenu.textRecords}", "ui:{skin:this.uiSkin?'full':'legacy',scroll:this.fullMenu.scroll,maxScroll:this.fullMenu.maxScroll,texts:this.fullMenu.textRecords,items:this.fullMenu.itemRecords,contentHeight:this.fullMenu.contentHeight,viewport:{top:this.fullMenu.contentTop,bottom:this.fullMenu.contentBottom},layers:this.menuLayers?.diagnostics,filter:this.fullMenu.filter,reducedMotion:this.fullMenu.reducedMotion}")
s=s.replace('this.paint?.destroy();this.menu?.destroy();','this.paint?.destroy();if(this.menuLayers)this.menuLayers.destroy();else this.menu?.destroy();',1)
p.write_text(s)
