import {open} from './browser-v03-common.mjs';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
const root='evidence/v04',t=await open('v04-fixture',390,844,{version:'v04-rc1'});const report={passed:false,checks:[],screens:[]};
async function save(name){await t.p.screenshot({path:`${root}/${name}.png`});report.screens.push(name);}
try{
 await t.tap('start');await t.p.evaluate(async()=>{const{director}=await System.import('cc'),find=n=>n.getComponent('Game')||n.children.map(find).find(Boolean);globalThis.__fixtureGame=find(director.getScene());});
 // All states below synthetic. No synthetic win is a natural playthrough.
 for(const [width,height] of [[360,780],[390,844],[360,640]]){
  await t.p.setViewportSize({width,height});await t.p.waitForTimeout(200);
  await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.begin(0);});await t.p.waitForTimeout(1920);await save(`spear-${width}-${height}`);
  assert.ok((await t.snap()).combatStats.meleeHits>=1);
  for(let i=0;i<3;i++){
   await t.p.evaluate(i=>{const g=globalThis.__fixtureGame;for(let k=0;k<i;k++)g.platform.book.win(k,40);g.begin(i);const j=g.journey;j.phase='boss';j.z=j.level.duration;j.bossTicks=60;j.bossDepth=j.bossPrevDepth=.9;j.count=48;},i);await t.p.waitForTimeout(350);await save(`boss${i+1}-${width}-${height}`);
   await t.p.evaluate(i=>{const g=globalThis.__fixtureGame;g.platform.book.win(i,48);g.platform.campaign.data.seen.zhaoyunMeeting=false;g.openTransition(['rally','camp','garrison'][i]);},i);await t.p.waitForTimeout(100);await save(`transition${i+1}-${width}-${height}`);
   if(i===0&&width===390){const a=await t.pos(-215,-105),b=await t.pos(0,-170);await t.cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y,id:2}]});await t.cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x,y:b.y,id:2}]});await t.cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await t.tap('complete-transition',100);
   assert.equal((await t.snap()).transition.done,true);await save(`settled${i+1}-${width}-${height}`);await t.p.waitForTimeout(1300);assert.equal((await t.snap()).screen,i<2?'battle':'meeting');
  }
  await save(`meeting-${width}-${height}`);await t.tap('return-camp');await save(`camp-${width}-${height}`);assert.equal((await t.snap()).screen,'camp');
 }
 report.checks.push('360x780,390x844,360x640: spear actual opening hit; 3 bosses; drag/tap transitions; meeting; camp');
 // No old touchEnd can activate a new screen, and failed drag leaves transition pending.
 await t.p.evaluate(()=>globalThis.__fixtureGame.openTransition('rally'));
 const a=await t.pos(-215,-105),outside=await t.pos(290,100);
 await t.cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y,id:4}]});await t.cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:outside.x,y:outside.y,id:4}]});await t.cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await t.snap()).transition.done,false);
 await t.cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y,id:5}]});await t.p.evaluate(()=>globalThis.__fixtureGame.show('transition'));const target=await t.pos(0,-170);await t.cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await t.snap()).transition.done,false);report.checks.push('failed drag and stale release rejected');
 // Background gate: no automatic transition/start until explicit continue.
 await t.p.evaluate(()=>globalThis.__fixtureGame.platform.onHide());await t.p.evaluate(()=>globalThis.__fixtureGame.platform.onShow());await t.p.waitForTimeout(200);assert.ok((await t.snap()).buttons.some(b=>b.id==='resume-camp'));await t.tap('resume-camp');report.checks.push('camp hide/show explicit continue');
 await t.p.setViewportSize({width:390,height:844});
 const density=[];
 for(const count of [48,256]){
  const d=await t.p.evaluate(async count=>{const {director}=await System.import('cc'),g=globalThis.__fixtureGame;g.begin(0);g.screen='pause';const j=g.journey;j.count=count;j.level={...j.level,duration:200,rows:[],obstacles:[]};j.obstacles=[];g.battle.clear();const timings=[],samples=[];let last=performance.now(),frames=0;await new Promise(resolve=>{function step(now){const dt=(now-last)/1000;last=now;j.advance(dt);const e=j.drainFeedback();g.battle.effects.accept(e,j.elapsed);g.battle.volleys.accept(e);g.battle.render(j,0);if(j.elapsed>1)timings.push(dt*1000);if(frames++%30===0)samples.push({t:j.elapsed,pool:g.battle.poolSize,arrows:g.battle.diagnostics.visualArrows,groups:g.battle.diagnostics.volleyGroups,gpu:director.root.device.memoryStatus.bufferSize});if(j.elapsed<5)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});return{count,timings,samples};},count);
  assert.ok(d.samples.every(s=>s.arrows<=235&&s.groups<=5));assert.equal(new Set(d.samples.filter(s=>s.t>2).map(s=>s.pool)).size,1);assert.equal(new Set(d.samples.filter(s=>s.t>2).map(s=>s.gpu)).size,1);const sorted=d.timings.toSorted((a,b)=>a-b);d.perf={p99:sorted[Math.floor(sorted.length*.99)],over33ms:sorted.filter(x=>x>33.34).length};density.push(d);await save(`density-${count}`);
 }
 const restarts=[];for(let i=0;i<3;i++){await t.p.evaluate(()=>globalThis.__fixtureGame.begin(0));await t.p.waitForTimeout(350);await t.tap('pause');const s=await t.snap();restarts.push({nodes:s.nodes,pool:s.pool,...await t.metrics()});}assert.equal(new Set(restarts.map(s=>s.nodes)).size,1);assert.equal(new Set(restarts.map(s=>s.pool)).size,1);assert.equal(new Set(restarts.map(s=>s.gpuBuffers)).size,1);
 report.density=density;report.restarts=restarts;assert.deepEqual(t.errors,[]);report.passed=true;
}catch(e){report.error=String(e);process.exitCode=1;console.error(e);}finally{report.errors=t.errors;writeFileSync(root+'/fixture.json',JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify({passed:report.passed,error:report.error,checks:report.checks}));}
