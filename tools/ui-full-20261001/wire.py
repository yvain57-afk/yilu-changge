from pathlib import Path
p=Path('assets/scripts/formal/FormalGame.ts');s=p.read_text()
s="import {FullMenu,MenuHost} from './FullMenu';\nimport {BRIDGE_BUILD} from './BridgeBuild';\n"+s
s=s.replace("|'render-error';","|'render-error'|'item'|'confirm';")
s=s.replace(' private safeLayer!'," private uiSkin=true;private fullMenu=new FullMenu();private resultReceipt:any=null;private reviewProbeStage='';\n private safeLayer!",1)
s=s.replace("this.reviewFixture=DEBUG?", "this.uiSkin=!(DEBUG&&sys.isBrowser&&new URLSearchParams(window.location.search).get('ui-skin')==='legacy');\n this.reviewFixture=DEBUG?",1)
s=s.replace("(globalThis as any).__YLCG__={snapshot:()=>this.snapshot()};","(globalThis as any).__YLCG__={snapshot:()=>this.snapshot(),...(DEBUG&&this.reviewFixture?{reviewCommand:(cmd:string,value?:any)=>this.reviewCommand(cmd,value)}:{})};")
s=s.replace("  if(this.reviewFixture.startsWith('REG:'))", "  if(this.reviewFixture.startsWith('UI:')){this.openUIFixture();return;}\n  if(this.reviewFixture.startsWith('REG:'))",1)
s=s.replace("this.platform.syncAudio(this.screen==='battle');}\n private move", "this.platform.syncAudio(this.screen==='battle');if(this.uiSkin&&this.screen!=='battle')this.drawMenu();}\n private move",1)
s=s.replace("this.lastY=p.y;this.lastX=p.x;}","if(this.uiSkin&&['prepare','person','item','reward','result'].includes(this.screen)&&this.startY>=this.fullMenu.contentTop&&this.startY<=this.fullMenu.contentBottom&&Math.abs(p.y-this.startY)>8){this.pressed=null;this.fullMenu.scrollBy(this.lastY-p.y);this.drawMenu();}this.lastY=p.y;this.lastX=p.x;}",1)
s=s.replace("private up(e:EventTouch){", "private up(e:EventTouch){",1)
s=s.replace("h.action();}\n private cancel", "{h.action();}else if(this.uiSkin&&this.screen!=='battle')this.drawMenu();}\n private cancel",1)
# Existing map chrome continues through the same low-level button/panel interfaces.
s=s.replace("const p=this.menu;p.fillStyle=primary?", "if(this.uiSkin){const r=this.fullMenuButton(id,title,x,y,w,action,primary,disabled);return r;}const p=this.menu;p.fillStyle=primary?",1)
s=s.replace(" private label(str:"," private fullMenuButton(id:string,title:string,x:number,y:number,w:number,action:()=>void,primary:boolean,disabled:boolean){drawButton(this.menu,{x,y,w,h:48},title,{tone:primary?'gold':'navy',state:disabled?'disabled':this.pressed?.id===id?'pressed':'normal',fontSize:16});if(!disabled)this.hits.push({id,label:title,x,y,w,h:48,action});}\n private label(str:",1)
s="import {drawButton,drawPanel,drawTab} from './UIComponents';\n"+s
s=s.replace(" const footer=H-bottom-58;\n if(this.screen==='loading')", " const footer=H-bottom-58;\n if(this.uiSkin){this.fullMenu.draw(this as unknown as MenuHost);}else{\n if(this.screen==='loading')",1)
s=s.replace(" if(this.store.notice){this.menu.fillStyle", " }\n if(!this.uiSkin&&this.store.notice){this.menu.fillStyle",1)
s=s.replace(" private card(x:number,y:number,w:number,h:number,tone='normal'){\n  const p=this.menu;", " private card(x:number,y:number,w:number,h:number,tone='normal'){\n  if(this.uiSkin){drawPanel(this.menu,{x,y,w,h},tone==='muted'?'muted':tone==='gold'?'raised':'normal');return;}const p=this.menu;",1)
# Result transaction captured from actual before/after state, never from current backpack guesses.
s=s.replace("if(!this.settled){try{this.store.settle(","if(!this.settled){const xpBefore=this.store.data.xp;try{const saved=this.store.settle(",1)
s=s.replace("routeXP:this.battle.snapshot().routeXP});}catch(e)","routeXP:this.battle.snapshot().routeXP});this.resultReceipt={runId:this.runId,won:st.troops>0,firstClear:this.first,saved,xp:this.store.data.xp-xpBefore,items:this.store.data.pendingRewardPresentation?.items||[]};}catch(e)",1)
s=s.replace("let probeArmed=DEBUG&&this.reviewFixture==='REG:fault';", "let probeArmed=DEBUG&&this.reviewFixture==='REG:fault';",1)
s=s.replace("if(probeArmed&&stage==='hud'){", "if((probeArmed&&stage==='hud')||(DEBUG&&this.reviewProbeStage===stage)){this.reviewProbeStage='';",1)
s=s.replace("this.renderFault='';this.retryingRender=false;this.acc=0;this.show('battle');", "this.renderFault='';this.retryingRender=false;this.acc=0;this.show('battle');",1)
s=s.replace("verificationScope:this.reviewFixture?", "ui:{skin:this.uiSkin?'full':'legacy',scroll:this.fullMenu.scroll,maxScroll:this.fullMenu.maxScroll,texts:this.fullMenu.textRecords},build:BRIDGE_BUILD,verificationScope:this.reviewFixture?",1)
s=s.replace("buttons:this.hits.map(({id,x,y,w,h})=>({id,x,y,w,h}))", "buttons:this.hits.map(({id,label,x,y,w,h})=>({id,label,x,y,w,h}))",1)
# Add isolated acceptance entry; settlement/collection rules remain authoritative.
marker=' /** Isolated visual checks may seed explicitly labelled fixtures; campaign mode never does. */'
new=''' /** UI acceptance uses memory storage and actual settle/equip APIs, excluded from Release. */
 private openUIFixture(){
  const [,kind,arg]=this.reviewFixture.split(':'),n=kind==='new'?0:kind==='complete'?20:kind==='milestone'||kind==='reward'?Math.max(0,Number(arg||1)):13;
  for(let i=0;i<n;i++)this.store.settle({id:'ui-isolated-'+i,chapter:i,won:true,troops:55,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:CHAPTERS[i].enemy});
  this.store.acknowledgePresentation();if(n>2){this.store.data.companions=['zhao','lubu'];this.store.data.support='diao';this.store.data.slots={dian:'taiping',qi:'yuxi',ma:null};if(this.store.data.weapons.includes('liannu'))this.store.selectWeapon('liannu');}
  this.chapter=Math.min(19,n);this.first=false;
  if(kind==='reward'||kind==='milestone'){const i=Number(arg||1);this.store.settle({id:'ui-present-'+i,chapter:i,won:true,troops:55,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:CHAPTERS[i].enemy});this.chapter=i;this.first=true;this.rewardReturn='home';this.show('reward');return;}
  if(kind==='prepare'){this.tab=arg||'weapons';this.show('prepare');return;}
  if(kind==='collection'){this.tab=arg||'people';this.show('collection');return;}
  if(kind==='person'){this.personId=arg||'zhao';this.show('person');return;}
  if(kind==='item'){this.fullMenu.detailId=arg||'liannu';this.fullMenu.detailKind=TREASURES[arg]?'treasure':'weapon';this.show('item');return;}
  if(kind==='loading'||kind==='error'){this.loadingError='隔离验证：资源加载失败，请重试';this.show(kind);return;}
  if(kind==='save-error'){this.show('home');this.store.notice='隔离验证：保存写入失败，原记录保留';this.drawMenu();return;}
  if(['result','defeat','pause','regression'].includes(kind)){this.chapter=10;this.begin();if(kind==='regression')return;const st=this.battle!.state;if(kind==='pause'){this.show('pause');return;}st.troops=kind==='defeat'?0:55;st.ended=true;st.defeatedOfficerIds=CHAPTERS[10].enemy.slice();st.defeatedBossId=CHAPTERS[10].boss;const before=this.store.data.xp;const saved=this.store.settle({id:this.runId,chapter:10,won:st.troops>0,troops:st.troops,defeatedBossId:st.defeatedBossId,defeatedOfficerIds:st.defeatedOfficerIds,practiceSegments:[1],effectiveHits:5});this.resultReceipt={runId:this.runId,saved,xp:this.store.data.xp-before,items:this.store.data.pendingRewardPresentation?.items||[]};this.settled=true;this.show('result');return;}
  this.show(kind==='map'?'chapters':kind==='settings'?'settings':'home');
 }
 private reviewCommand(cmd:string,value?:any){
  if(!DEBUG||!this.reviewFixture)return false;
  if(cmd==='scroll'){this.fullMenu.scrollBy(Number(value));this.drawMenu();return true;}
  if(cmd==='fault'){this.reviewProbeStage=String(value);return true;}
  if(cmd==='boss'&&this.battle){const st=this.battle.state;st.course=[];st.ents=[];st.dist=st.courseLen+6;st.defeatedOfficerIds=CHAPTERS[this.chapter].enemy.slice();this.battle.step();return true;}
  if(cmd==='review-target'&&this.battle){this.battle.move(reviewTarget(this.battle.snapshot()));return true;}
  return false;
 }
'''
s=s.replace(marker,new+marker,1)
p.write_text(s)
