import {open,fixtureGame,root} from './browser-v06-common.mjs';
import assert from 'node:assert/strict';import{writeFileSync,readFileSync}from'node:fs';
const t=await open('fixture'),report={passed:false,scope:'isolated render/density states; not campaign or phone acceptance',screens:[],restarts:[]},requests=[];
t.p.on('request',r=>requests.push(r.url()));
try{
 await fixtureGame(t);
 const fixtures=JSON.parse(readFileSync('docs/ui-design/source-brief/design-data/viewport-fixtures.json')).fixtures;
 for(const f of fixtures.filter(f=>['island-and-capsule','short-screen-with-host','short-web'].includes(f.id))){
  await t.p.setViewportSize({width:f.width,height:Math.round(f.height)});
  await t.p.evaluate(f=>{const g=globalThis.__fixtureGame;g.platform.metricsCache={width:f.width,height:f.height,safe:f.safeArea,capsule:f.capsule??null,source:'synthetic-fixture',capsuleSource:'synthetic-fixture',revision:900};g.show('home');},f);
  await t.p.screenshot({path:`${root}/home-${f.id}.png`});
  for(const screen of ['home','loadout','settings']){
   await t.p.evaluate(screen=>globalThis.__fixtureGame.show(screen),screen);const s=await t.snap();
   for(const b of s.buttons){const a=await t.pos(b.x,b.y),w=b.w*a.s,h=b.h*a.s;assert.ok(w>=43.5&&h>=43.5,`${screen}/${b.id} target ${w}x${h}`);assert.ok(a.y-h/2>=f.safeArea.top-.6&&a.y+h/2<=f.safeArea.bottom+.6,`${f.id}/${screen}/${b.id} outside safe`);if(f.capsule)assert.ok(a.y-h/2>=f.capsule.bottom+7.4||a.x+w/2<=f.capsule.left-8||a.x-w/2>=f.capsule.right+8,`${b.id} capsule`);}
   report.screens.push({fixture:f.id,screen,buttons:s.buttons.length,metrics:s.ui.metrics});
  }
  await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.platform.growth.equipWeapon('spear');g.begin(0);g.journey.pause();});await t.p.screenshot({path:`${root}/battle-${f.id}.png`});
  const frozen=(await t.snap()).journey;await t.p.waitForTimeout(120);assert.deepEqual((await t.snap()).journey,frozen);
 }
 await t.p.setViewportSize({width:390,height:844});await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.platform.metricsCache=null;g.begin(0);g.screen='pause';const old=g.journey;const cfg={...old.horde.config,runDuration:200,forks:[],commonWaves:Array.from({length:6},(_,i)=>({id:'stress'+i,at:1+i*3,count:24,kind:'footman',formation:i%2?'columns':'wide',spawnDepth:6.5,rowSpacing:.28}))};g.journey=new old.constructor({...old.level,duration:200,horde:cfg},{weapon:'blade',tactic:'zhenjun',companion:'xing_daorong'});const j=g.journey;j.count=256;j.tier=3;const base=j.obstacles[0];j.obstacles=Array.from({length:64},(_,i)=>({...base,id:9000+i,generation:9000+i,poolSlot:i,x:(i%8-3.5)*.19,previousX:(i%8-3.5)*.19,at:2+Math.floor(i/8)*.55,previousZ:2+Math.floor(i/8)*.55,hp:10,maxHp:10}));g.battle.clear();});
 const density=await t.p.evaluate(async()=>{const g=globalThis.__fixtureGame,j=g.journey,samples=[],frames=[];let before=performance.now(),last=0;await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('20s fixture timed out')),26000);function frame(now){const dt=(now-before)/1000;before=now;j.move(Math.sin(j.elapsed*.9)*.55);j.advance(dt);const ev=j.drainFeedback();g.battle.effects.accept(ev,j.elapsed);g.battle.volleys.accept(ev);g.battle.render(j,0);if(j.elapsed>1)frames.push(dt*1000);if(j.elapsed>=last){last+=.5;samples.push({t:j.elapsed,pool:g.battle.poolSize,sprites:g.battle.diagnostics.sprites,active:j.stageInfo.active,pending:j.stageInfo.pending,arrows:g.battle.diagnostics.visualArrows,waves:j.waves.length,effects:g.battle.diagnostics.effects});}if(j.elapsed<20)requestAnimationFrame(frame);else{clearTimeout(timeout);resolve();}}requestAnimationFrame(frame);});return{samples,frames,stageInfo:j.stageInfo};});
 assert.ok(density.samples.every(s=>s.active<=64&&s.pending<=32&&s.arrows<=240&&s.effects<=64&&s.waves<=24));density.frames.sort((a,b)=>a-b);report.density={...density,frames:undefined,p99Ms:density.frames[Math.floor(density.frames.length*.99)],over33ms:density.frames.filter(t=>t>33.34).length,meanFPS:1000/(density.frames.reduce((a,b)=>a+b,0)/density.frames.length)};await t.p.screenshot({path:root+'/density-20s.png'});
 for(let i=0;i<3;i++){await t.p.evaluate(()=>globalThis.__fixtureGame.begin(0));await t.p.waitForTimeout(450);await t.tap('pause');const s=await t.snap();report.restarts.push({nodes:s.nodes,pool:s.pool,...await t.metrics()});}
 assert.equal(new Set(report.restarts.map(s=>s.nodes)).size,1);assert.equal(new Set(report.restarts.map(s=>s.pool)).size,1);
 const audio=(await t.snap()).audio;assert.equal(audio.musicRequested,false);assert.equal(audio.effectChannels,5);report.audio=audio;
 const musicIds=['assets/resources/audio/music.mp3.meta','assets/resources/audio-v031/music-battle.m4a.meta'].map(f=>JSON.parse(readFileSync(f)).uuid);assert.ok(!requests.some(u=>u.endsWith('.m4a')||musicIds.some(id=>u.includes(id))));report.musicRequests=0;
 assert.deepEqual(t.errors,[]);report.passed=true;
}catch(e){report.error=String(e);console.error(e);process.exitCode=1;}finally{report.errors=t.errors;writeFileSync(root+'/fixture.json',JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify({passed:report.passed,error:report.error,density:report.density&&{meanFPS:report.density.meanFPS,p99Ms:report.density.p99Ms}}));}
