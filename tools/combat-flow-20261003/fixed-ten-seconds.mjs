import {open,E} from './browser.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const scene={chapter:16,weapon:'huaji',level:1,companions:['lubu','machao'],support:'diao',slots:{dian:'taiping',qi:'huxinjing',ma:'jingfan'},seed:71};
const results=[];
for(const [tag,url,fp] of [['before','http://127.0.0.1:43216/','cd613377a62aeddaff93ad9dbf39e72a272ab9305294bcf848694bde87beb0e1'],['after','http://127.0.0.1:43218/','434495b2036b2458f1a9914cc7e2bc18c7db92f23eebeaeab2e93ce8438a00a5']]){
 process.env.YILU_FLOW_URL=url;
 const t=await open(tag+'-fixed-10s',402,874,false);
 try{
  await t.goto('new');
  await t.p.evaluate(scene=>{
   if(!__YLCG__.reviewCommand('r3-scene',scene))throw Error('scene rejected');
   if(!__YLCG__.reviewCommand('r3-pause',true))throw Error('pause rejected');
   if(!__YLCG__.reviewCommand('r3-ticks',600))throw Error('ticks rejected');
  },scene);
  await t.p.waitForTimeout(180);
  const s=await t.capture(tag+'-fixed-10s');
  assert.equal(s.build.code_fingerprint,fp);assert.ok(Math.abs(s.battle.t-10)<1e-7);assert.equal(s.battle.paused,true);assert.deepEqual(s.renderErrors,[]);assert.deepEqual(s.missingArt,[]);assert.deepEqual(t.errors,[]);
  const path=E+'/pixels/'+tag+'-fixed-10s.json',meta=JSON.parse(fs.readFileSync(path,'utf8'));
  meta.scope='Actual Cocos WebGL fixed 600 ticks / 10.0 simulated seconds. Same legal loadout, seed, viewport and stationary input. Isolated memory save. State differs because gameplay logic was repaired. Not a natural-speed recording or physical device evidence.';meta.fixed_fixture={scene,ticks:600,simulation_seconds:s.battle.t,input:'stationary',viewport:{width:402,height:874}};fs.writeFileSync(path,JSON.stringify(meta,null,2));
  results.push({tag,build:s.build,t:s.battle.t,troops:s.battle.troops,source_sha256:meta.source_sha256,scene,pageErrors:t.errors});
 }finally{await t.close();}
}
fs.writeFileSync(E+'/fixed-ten-seconds.json',JSON.stringify({scope:'paired controlled fixture; not natural recording',results},null,2));console.log(JSON.stringify(results));
