import {open,E} from './browser.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const mode=process.argv[2]||'stationary',seconds=Number(process.argv[3]||40),tag=process.argv[4]||'before';
const scene={chapter:16,weapon:'huaji',level:1,companions:['lubu','machao'],support:'diao',slots:{dian:'taiping',qi:'huxinjing',ma:'jingfan'},seed:71};
const t=await open(tag+'-'+mode,402,874,true),rows=[],events=[];let initialized=false,lastShot=-1,build;
try{
 await t.goto('new');assert.equal(await t.command('r3-scene',scene),true);await t.p.waitForTimeout(250);initialized=true;
 await t.p.evaluate(async()=>{const cc=await System.import('cc'),g=cc.director.getScene().getChildByName('Canvas').components.find(x=>x.constructor.name==='FormalGame');if(!g.reviewFixture)throw Error('isolated_only');globalThis.__FLOW_GAME=g;globalThis.__FLOW_DRAWS=[];const paint=g.paint,frame=paint.frame.bind(paint),begin=paint.begin.bind(paint);paint.begin=function(...args){globalThis.__FLOW_DRAWS=[];return begin(...args);};paint.frame=function(key,x,y,h,o){const rect=frame(key,x,y,h,o);if(/^c20_enemy_|^r3_enemy_|^g_red|^g_elite/.test(key)||o?.role==='enemy_body')globalThis.__FLOW_DRAWS.push({frameKey:key,actorId:o?.actorId||null,role:o?.role||'decoration',anchorX:x,anchorY:y,height:h,rect});return rect;};});
 build=(await t.snap()).build;
 if(tag==='before')assert.equal(build.code_fingerprint,'cd613377a62aeddaff93ad9dbf39e72a272ab9305294bcf848694bde87beb0e1');
 const begin=Date.now();
 while(Date.now()-begin<seconds*1000){
  if(mode==='normal')await t.command('r3-policy','normal');
  else if(mode==='lateral')await t.command('r3-move',Math.floor((Date.now()-begin)/3500)%2===0?-.65:.65);
  const s=await t.p.evaluate(()=>{const s=__YLCG__.snapshot(),b=s.battle;return {screen:s.screen,build:s.build,viewport:s.viewport,enemyDraws:globalThis.__FLOW_DRAWS||[],battle:b?{t:b.t,dist:b.dist,phase:b.phase,x:b.x,target:b.target,troops:b.troops,weapon:b.weapon,tier:b.tier,entities:b.entities.filter(e=>e.type==='enemy').map(e=>({id:e.id,waveId:e.waveId,kind:e.enemyKind,phase:e.phase,pt:e.pt,d:e.d,z:e.z,x:e.x,hp:e.hp,dead:e.dead,attackN:e.attackN,holdZ:e.holdZ,charge:e.charge,visibleAt:e.visibleAt})),shots:b.hostileShots,telegraphs:b.telegraphs,damageHistory:b.damageHistory,damageSources:b.damageSources,enemyLifecycle:b.enemyLifecycle,teamFeet:b.teamFeet}:null,texts:s.diagnostics?.texts,submissions:s.frameState?.submissions,renderErrors:s.renderErrors,missingArt:s.missingArt,fps:s.fps};});
  rows.push({wallSeconds:(Date.now()-begin)/1000,...s});
  assert.deepEqual(s.renderErrors,[]);assert.deepEqual(s.missingArt,[]);
  const shot=Math.floor((Date.now()-begin)/5000);if(shot!==lastShot){lastShot=shot;await t.capture(tag+'-'+mode+'-t'+(shot*5));}
  if(s.screen!=='battle')break;
  await t.p.waitForTimeout(90);
 }
 await t.capture(tag+'-'+mode+'-final');assert.deepEqual(t.errors,[]);
}finally{
 const video=await t.close();const result={tag,mode,scene,build,initialized,speed:'original browser wall time',scope:'Actual Cocos WebGL chapter17 authored route, isolated memory save with legitimate prior-unlocked loadout. Friendly attacks active. Only normal game movement supplied by stationary/current-visible-policy/alternating lateral input. No altered route, time acceleration, extra health, injected damage or invulnerability. Not a native or human input performance claim.',audio:'No audio in Playwright video; not listening evidence.',rows,events,pageErrors:t.errors,video};fs.writeFileSync(E+'/'+tag+'-'+mode+'-record.json',JSON.stringify(result,null,2));console.log(JSON.stringify({mode,video,rows:rows.length,build,final:rows.at(-1)?.battle?.damageSources}));
}
