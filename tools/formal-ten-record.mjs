import {open,out,steer} from './formal-browser.mjs';
import {appendFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const tag=process.argv[2]||Date.now().toString(36),t=await open('natural-ten-'+tag),timeline=[],runs=[];let started=0,recordStopped=false;
const dest=out+'/natural-ten.webm';writeFileSync(dest,'');
await t.p.exposeBinding('recordChunk',(_,b64)=>appendFileSync(dest,Buffer.from(b64,'base64')));
await t.p.evaluate(()=>{const canvas=document.querySelector('canvas'),stream=canvas.captureStream(30),rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:3000000});globalThis.__recording={rec,chain:Promise.resolve(),start:performance.now()};rec.ondataavailable=e=>{if(e.data.size)__recording.chain=__recording.chain.then(async()=>{const b=await e.data.arrayBuffer(),a=new Uint8Array(b);let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));await globalThis.recordChunk(btoa(s));});};rec.start(1000);});
async function stopRecording(){if(recordStopped)return;await t.p.evaluate(async()=>{if(!globalThis.__recording)return;await new Promise(r=>{__recording.rec.onstop=r;__recording.rec.stop();});await __recording.chain;});recordStopped=true;}
started=Date.now();const at=()=>+( (Date.now()-started)/1000).toFixed(2),mark=(event,data={})=>{timeline.push({at:at(),event,...data});console.log(timeline.at(-1));};
async function choose(tab,id){await t.tap('tab-'+tab);for(let n=0;n<8;n++){const s=await t.snap();if(s.buttons.some(b=>b.id===id)){await t.tap(id);return;}if(!s.buttons.some(b=>b.id==='next-page'))break;await t.tap('next-page');}throw Error('Not reachable UI item '+id);}
async function equip(){let s=await t.snap(),d=s.save;
 if(d.visits.includes('hua')&&d.support!=='hua')await choose('support','support-hua');
 const desired=['lubu',d.captures.at(-1)].filter((v,i,a)=>v&&d.captures.includes(v)&&a.indexOf(v)===i).slice(-2);for(const id of desired){s=await t.snap();if(!s.save.companions.includes(id))await choose('companions','comp-'+id);}
 for(const [slot,id] of [['dian','taiping'],['qi','yuxi'],['ma','chitu']]){s=await t.snap();if(s.save.treasures.includes(id)&&s.save.slots[slot]!==id)await choose('treasures','treasure-'+id);}
 await t.tap('tab-companions');
}
try{
 assert.equal((await t.snap()).save.cleared.length,0,'Recording requires a fresh isolated test profile');mark('fresh-home');await t.tap('start');
 for(let i=0;i<10;i++){
  await equip();await t.p.screenshot({path:out+`/natural-${i+1}-prepare.png`});mark('prepare',{chapter:i+1,loadout:(await t.snap()).save});await t.tap('depart');mark('battle-start',{chapter:i+1});const begin=Date.now();let nextLog=begin,seen=new Set();
  while(true){const s=await t.snap();if(s.screen==='result'){await t.release();assert.equal(s.battle.phase,'won','Natural run lost chapter '+(i+1));assert.equal(s.save.cleared.length,i+1);assert.equal(s.saveNotice,'');assert.deepEqual(s.missingArt,[]);runs.push({chapter:i+1,at:at(),state:s});await t.p.screenshot({path:out+`/natural-${i+1}-result.png`});mark('saved-result',{chapter:i+1,troops:s.battle.troops,fps:s.fps,seconds:s.battle.t});break;}
   assert.equal(s.screen,'battle');assert.ok(Date.now()-begin<150000,'chapter timeout');await t.target(steer(s.battle));
   const b=s.battle,phase=b.boss?'boss-'+b.boss.phase:b.entities.some(e=>e.type==='wall'&&e.z<12&&e.z>-12)?'wall':b.weapon!=='spear'?'weapon-'+b.weapon:b.tier>1?'tier-up':null;
   if(phase&&!seen.has(phase)){seen.add(phase);await t.p.screenshot({path:out+`/natural-${i+1}-${phase}.png`});mark(phase,{chapter:i+1,t:b.t,weapon:b.weapon,tier:b.tier,arms:b.arms});}
   if(Date.now()>nextLog){console.log('progress',i+1,Math.round(b.t),b.phase,Math.round(b.troops),b.boss?.hp);nextLog=Date.now()+10000;}await t.p.waitForTimeout(80);
  }
  writeFileSync(out+'/natural-ten-progress.json',JSON.stringify({version:'formal-20260927.1',scope:'Native Cocos; fresh isolated save; external touch steering; no state injection or win/HP cheats; canvas recording real time 30 fps, silent video',timeline,runs,errors:t.errors},null,2));
  await t.p.waitForTimeout(700);await t.tap('next');if(i<9){await t.p.waitForTimeout(500);await t.tap('prepare-next');}
 }
 const before=(await t.snap()).save;await stopRecording();await t.p.reload();await t.p.waitForFunction(()=>globalThis.__YLCG__?.snapshot().screen==='home');const after=(await t.snap()).save;assert.deepEqual(after,before);mark('reload-save-verified',{cleared:after.cleared.length});await t.p.screenshot({path:out+'/natural-ten-reloaded.png'});await t.p.waitForTimeout(1000);assert.deepEqual(t.errors,[]);
 writeFileSync(out+'/natural-ten-result.json',JSON.stringify({passed:true,version:'formal-20260927.1',duration:at(),scope:'Real-time native Cocos via ordinary CDP touch gestures, fresh test profile, no injected HP/troops/progress. No human/device claim. Silent canvas recording; audio state separately observed.',timeline,runs,saveReloadEqual:true,errors:t.errors},null,2));
}catch(e){console.error(e);await t.p.screenshot({path:out+'/natural-ten-failure.png'});writeFileSync(out+'/natural-ten-result.json',JSON.stringify({passed:false,error:String(e),duration:at(),timeline,runs,state:await t.snap(),errors:t.errors},null,2));process.exitCode=1;}
finally{await t.release();await stopRecording();await t.c.close();}
