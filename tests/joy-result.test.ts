import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './ui-full-runtime.test';
test('result upgrade uses real earned currency, persists once and rolls back a failed save',()=>{
 for(const failure of [false,true]){
  const h=host(3);h.g.chapter=2;h.g.battle={cancel(){},pause(){},clearAudioEvents(){},state:{troops:30,momentum:{kills:90,bestCombo:12,bursts:4},stats:{crates:{power:3}}}};
  const xp=h.store.data.xp,level=h.store.data.weaponLevels.spear;h.io.fails=failure;h.g.show('result');h.reveal('quick-upgrade');h.click('quick-upgrade');
  assert.equal(h.store.data.xp,failure?xp:xp-60);assert.equal(h.store.data.weaponLevels.spear,failure?level:level+1);assert.equal(h.g.screen,'result');
 }
});
