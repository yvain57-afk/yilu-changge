import {createRequire} from 'node:module';
export const {runnerSteer:steer}=createRequire(import.meta.url)('../.cache/v09-logic/v09-model-policy.js');
import {open as baseOpen} from './browser-v03-common.mjs';
import {freshSave,fixtureGame} from './browser-v06-common.mjs';
export {freshSave,fixtureGame,startCapture,stopCapture} from './browser-v06-common.mjs';
export const root='evidence/UI-20260925';
export const states=['home','chapters','loadout','battle-normal','battle-contact','result','camp'];
export const viewports=[{width:360,height:780},{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:768,height:1024}];
export const open=(name,width=390,height=844,{before=false,audio=false,...options}={})=>baseOpen('ui20260925-'+name,width,height,{version:before?'v09-rc1':'ui-20260925',baseURL:before?'http://127.0.0.1:43205/':process.env.YILU_PREVIEW_URL??'http://127.0.0.1:43197/',audio,...options});
export const fixtureSpec={schema:1,view:'390x844',home:'new save',chapters:'first level won, transition pending, second unlocked, third locked',loadout:'three cleared, blade + chen_ying',battle:{level:2,count:24,progress:12,elapsed:12,stage:1,weapon:'blade',companion:'xing_daorong',paused:true},contact:{enemies:12,hp:100,positions:'six across at .09 ahead, second row +.30'},result:{level:2,phase:'won',count:17,elapsed:44,firstVictory:false,newUnlocks:[]},camp:'three cleared, all transitions/meeting completed',scope:'Explicit isolated deterministic view fixtures; not natural play or a phone test'};
export async function reviewState(t,state){
 await freshSave(t);await fixtureGame(t);
 await t.p.evaluate(state=>{const g=globalThis.__fixtureGame;
  if(state==='home'){g.show('home');return;}
  if(state==='chapters'){g.platform.book.win(0,13,'runnerVideoV2');g.platform.growth.reconcile();g.show('chapters');return;}
  for(let i=0;i<3;i++)g.platform.book.win(i,17,'runnerVideoV2');g.platform.growth.reconcile();g.platform.growth.equipWeapon('blade');g.platform.growth.equipCompanion('chen_ying');g.platform.campaign.data.completed={rally:true,camp:true,garrison:true};g.platform.campaign.data.seen.zhaoyunMeeting=true;
  if(state==='loadout'||state==='camp'){g.show(state);return;}
  if(state==='battle-normal'||state==='battle-contact')g.platform.growth.equipCompanion('xing_daorong');
  g.begin(1);const j=g.journey;j.pause();
  if(state==='result'){j.phase='won';j.count=17;j.elapsed=44;g.firstVictory=false;g.newUnlocks=[];g.newRecruit=null;g.show('result');return;}
  j.count=24;j.z=12;j.elapsed=12;j.simulationTick=720;j.x=j.target=0;j.runner.stage=1;j.tier=2;
  if(state==='battle-contact')j.runner.enemies=Array.from({length:12},(_,i)=>({id:'review'+i,numericId:200+i,slot:i,x:(i%6-2.5)*.13,at:j.z+.09+Math.floor(i/6)*.3,previousX:(i%6-2.5)*.13,previousZ:j.z+.09+Math.floor(i/6)*.3,hp:100,maxHp:100,speed:0,halfWidth:.045,depth:.085,large:false,dead:false,lastHit:-100,attackClock:.8,contacting:false}));
  g.show('battle');g.battle.render(j,3);
 },state);
 await t.p.waitForTimeout(180);
 return t.snap();
}
export async function densityState(t){
 await fixtureGame(t);await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;for(let i=0;i<3;i++)g.platform.book.win(i,17,'runnerVideoV2');g.platform.growth.reconcile();g.begin(1);const old=g.journey,cfg={...old.level.runner,startCount:256,routeEnd:100,objects:[],enemyWaves:[{id:'ui20260925-density',spawnAt:0,count:64,formation:'wide',centerX:0,spawnAhead:6.5,hpEach:1000000,approachSpeed:1,enemyKind:'fighter'}],objective:{kind:'clearEnemies',plannedEnemyCount:64},largeEnemy:undefined,dividers:[]};g.journey=new old.constructor({...old.level,runner:cfg},{weapon:'blade',companion:'chen_ying'});old.dispose();g.journey.runner.stage=1;g.journey.tier=2;g.frameTimes=[];g.finishAge=0;g.notices.clear();g.message='';g.battle.clear();g.show('battle');});
}
export async function performanceSample(t,seconds=8){
 const before=await t.metrics();await densityState(t);const start=Date.now(),samples=[];
 while(Date.now()-start<seconds*1000){const s=await t.snap();samples.push({elapsed:s.journey.elapsed,count:s.journey.count,nodes:s.nodes,pool:s.pool,frameTiming:s.frameTiming,...await t.metrics()});await t.p.waitForTimeout(500);}
 await t.p.evaluate(()=>globalThis.__fixtureGame.journey.pause());const s=await t.snap(),after=await t.metrics();
 const frames=await t.p.evaluate(()=>[...globalThis.__fixtureGame.frameTimes]),ordered=frames.filter(Number.isFinite).map(v=>v*1000).sort((a,b)=>a-b),percentile=q=>ordered[Math.min(ordered.length-1,Math.floor(ordered.length*q))]??null;
 const measuredFrameTiming={unit:'milliseconds',p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),worst:ordered.length?ordered[ordered.length-1]:null,frames:ordered.length,over33:ordered.filter(x=>x>33).length};
 return {scope:'Desktop Chrome isolated 256 weighted troops / 48 visible + 64 durable enemies. Same device/build-local scene; does not establish phone performance or long-run leak freedom.',wallSeconds:(Date.now()-start)/1000,simulationSeconds:s.journey.elapsed,version:s.version,viewport:t.p.viewportSize(),frameTiming:measuredFrameTiming,engineFrameTiming:s.frameTiming,meanFPS:s.meanFPS,nodes:s.nodes,pool:s.pool,stats:s.journey.runner.stats,before,after,heapDeltaBytes:after.jsHeap-before.jsHeap,samples};
}

// Real touch scrolling: no assignment to Game.scrollY or hidden-button dispatch.
export async function revealButton(t,id){
 for(let attempt=0;attempt<8;attempt++){
  const s=await t.snap(),b=s.buttons.find(v=>v.id===id);if(!b)throw Error('Missing button '+id);
  const clip=s.scroll?.clip;
  if(b.visible!==false&&(!b.scroll||clip&&Math.abs(b.y-clip.y)+b.h/2<=clip.h/2+.5))return {snapshot:s,button:b};
  if(!clip)throw Error('No scroll region for '+id);
  const direction=b.y<clip.y?1:-1,start=await t.pos(clip.x,clip.y-direction*clip.h*.27),end=await t.pos(clip.x,clip.y+direction*clip.h*.27);
  await t.cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y,id:91}]});
  for(let i=1;i<=5;i++){await t.cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/5,y:start.y+(end.y-start.y)*i/5,id:91}]});await t.p.waitForTimeout(20);}
  await t.cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await t.p.waitForTimeout(100);
 }
 throw Error('Button remains clipped after bounded real scroll: '+id);
}
export async function tapVisible(t,id){const v=await revealButton(t,id);if(v.button.disabled)throw Error('Disabled button '+id);await t.tap(id);return v;}
export async function extraReviewState(t,state){
 await reviewState(t,state==='settings'?'home':'camp');
 await t.p.evaluate(state=>{const g=globalThis.__fixtureGame;if(state==='transition'){g.platform.campaign.data.completed.camp=false;g.openTransition('camp');}else if(state==='settings'){g.returnScreen='home';g.show('settings');}else{g.meetingLine=0;g.show(state);}},state);
 await t.p.waitForTimeout(180);return t.snap();
}
