import {open,E} from './browser.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const plans=JSON.parse(fs.readFileSync('evidence/R3-COMBAT-PATCH-20261002/combat/normal-sequential20.json','utf8')).rows;
const t=await open('progression20',402,874),rows=[];
try{
 await t.goto('new');
 await t.p.evaluate(async()=>{const cc=await System.import('cc'),g=cc.director.getScene().getChildByName('Canvas').components.find(x=>x.constructor.name==='FormalGame');if(g.reviewFixture!=='UI:new')throw Error('memory_only');globalThis.__R3_GAME=g;const mem=new Map();g.store=new g.store.constructor({getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)});g.battle=null;g.chapter=0;g.show('home');});
 for(let chapter=0;chapter<20;chapter++){
  const before=await t.p.evaluate(({chapter,loadout})=>{const g=__R3_GAME,s=g.store;if(s.completed!==chapter)throw Error('nonsequential_unlock');if(!s.selectWeapon(loadout.startWeaponId))throw Error('weapon_not_owned');for(const [id,level] of Object.entries(loadout.weaponLevels))while((s.data.weaponLevels[id]||1)<level)if(!s.upgrade(id))throw Error('illegal_xp_upgrade');for(const id of [...s.data.companions])s.equipCompanion(id);for(const id of loadout.companions)if(!s.equipCompanion(id))throw Error('companion_unowned');if(s.data.support&&s.data.support!==loadout.support)s.equipSupport(s.data.support);if(loadout.support&&s.data.support!==loadout.support&&!s.equipSupport(loadout.support))throw Error('support_unowned');for(const [slot,id] of Object.entries(loadout.treasures)){const old=s.data.slots[slot];if(old!==id&&old)s.equipTreasure(old);if(id&&old!==id&&!s.equipTreasure(id))throw Error('treasure_unowned');}g.chapter=chapter;g.show('prepare');return{save:JSON.parse(JSON.stringify(s.data)),loadout:s.loadout()};},{chapter,loadout:plans[chapter].loadout});
  await t.tap('depart');await t.command('r3-pause',true);const first=await t.capture('progression-c'+String(chapter+1).padStart(2,'0')+'-battle');let ended=false;
  for(let chunk=0;chunk<75;chunk++){
   const r=await t.p.evaluate(()=>{const g=__R3_GAME,b=g.battle;b.pause(false);for(let n=0;n<240&&!b.state.ended;n++){if(n%6===0)g.reviewCommand('r3-policy','normal');b.step();}b.pause(true);return{ended:b.state.ended,t:b.state.t,troops:b.state.troops};});
   await t.p.waitForTimeout(18);if(r.ended){ended=true;break;}
  }
  assert.equal(ended,true,'chapter ended '+(chapter+1));await t.p.waitForTimeout(1800);const final=await t.capture('progression-c'+String(chapter+1).padStart(2,'0')+'-settlement');assert.ok(final.battle.troops>0,'chapter win '+(chapter+1));assert.equal(final.save.cleared.length,chapter+1);assert.deepEqual(final.renderErrors,[]);assert.deepEqual(final.missingArt,[]);rows.push({chapter:chapter+1,before,build:first.build,simulation_seconds:final.battle.t,scope:'actual Cocos scene; accelerated diagnostic fixed ticks with current-visible 300ms reaction policy; not original-speed play or device FPS',result:final.resultReadyLatencySeconds,receipt:final.reward,after:final.save,damageSources:final.battle.damageSources});
  if(final.screen==='reward')await t.tap('reward-done');assert.equal((await t.snap()).screen,'result');if(chapter<19){await t.tap('next');assert.equal((await t.snap()).screen,'transition');await t.tap('prepare-next');assert.equal((await t.snap()).screen,'prepare');}
  fs.writeFileSync(E+'/progression20.json',JSON.stringify({scope:'Actual Cocos WebGL on isolated fresh memory save; accelerated fixed-tick verification; no synthetic wins/unlocks/XP/invulnerability. Not original-speed video or physical play.',rows,pageErrors:t.errors},null,2));console.log(chapter+1,final.battle.t,final.battle.troops);
 }
 assert.equal(rows.length,20);assert.deepEqual(t.errors,[]);
}finally{await t.close();}
