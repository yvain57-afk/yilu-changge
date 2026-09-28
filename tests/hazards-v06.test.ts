import{test}from'node:test';import assert from'node:assert/strict';
import{createBossDirector,tickBossDirector,hitBossHazard,hazardHit,hazardOutline,BOSS_HAZARD_ATTACKS,BossAttackId}from'../assets/scripts/core/hazards';
const bosses=['xing_daorong','chen_ying','yang_ling'];
function begin(boss:string,index:number,x:number){const d=createBossDirector(boss);d.attackIndex=index;for(let t=0;t<120;t++)tickBossDirector(d,{playerX:x,teamZ:10});assert.equal(d.phase,'telegraph');return d;}
test('H09: all six attacks freeze aim and wait 78 ticks; residual enemies/arrows block entry',()=>{
 for(const boss of bosses){const d=createBossDirector(boss);for(let i=0;i<200;i++)tickBossDirector(d,{playerX:0,teamZ:10,canAttack:false});assert.equal(d.groupId,0);tickBossDirector(d,{playerX:.5,teamZ:10,canAttack:true});assert.equal(d.groupId,1);const warnings=JSON.stringify(d.warningShapes);for(let i=0;i<77;i++){tickBossDirector(d,{playerX:-.91,teamZ:10});assert.equal(d.phase,'telegraph');assert.equal(d.aimX,.5);assert.equal(JSON.stringify(d.warningShapes),warnings);assert.equal(d.activeShapes.length,0);}tickBossDirector(d,{playerX:-.91,teamZ:10});assert.equal(d.phase,'active');}
 assert.ok(Object.values(BOSS_HAZARD_ATTACKS).every(a=>a.telegraph>=78));
});
test('H09: 0.25s reaction delay then legal 2.7/s movement has an actual moving-geometry escape for all 30 start/attack pairs',()=>{
 const paths:{attack:BossAttackId;start:number;direction:number;minX:number;maxX:number}[]=[];
 for(const boss of bosses)for(let index=0;index<2;index++)for(const start of[-.91,-.5,0,.5,.91]){
  let solved=false;for(const direction of[-1,1]){const d=begin(boss,index,start);let x=start,hit=false,minX=x,maxX=x;for(let t=0;t<78+BOSS_HAZARD_ATTACKS[d.attackId].active+2;t++){if(t>=15)x=Math.max(-.91,Math.min(.91,x+direction*2.7/60));tickBossDirector(d,{playerX:x,teamZ:10});hit=hit||hitBossHazard(d,x,10)>0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);}if(!hit){paths.push({attack:d.attackId,start,direction,minX,maxX});solved=true;break;}}assert.ok(solved,`${boss} attack ${index} start ${start}`);
 }assert.equal(paths.length,30);
});
test('H09: axe damages only current angular sweep, not the whole telegraph at once',()=>{
 const d=begin('xing_daorong',0,0);for(let i=0;i<78;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.equal(d.activeShapes[0].kind,'sector');assert.equal(hitBossHazard(d,0,10),0);let hit=false;for(let i=0;i<18;i++){tickBossDirector(d,{playerX:0,teamZ:10});hit=hit||hitBossHazard(d,0,10)>0;}assert.equal(hit,true);
});
test('H09: crack front travels forward and spent trail no longer damages',()=>{
 const d=begin('xing_daorong',1,0);for(let i=0;i<78+16;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.ok(d.activeShapes.length>0);const s=d.activeShapes[0];assert.equal(s.kind,'capsule');if(s.kind==='capsule'){assert.ok(s.b.z<9.4);assert.equal(hazardHit(s,{x:0,z:10.5}),false);assert.equal(hazardHit(s,s.b),true);assert.ok(hazardOutline(s).length>=40);}
});
test('H09: split forks are physically staggered, share group, and can hurt team only once',()=>{
 const d=begin('chen_ying',1,0);for(let i=0;i<78;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.equal(d.activeShapes.length,1);for(let i=0;i<8;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.equal(d.activeShapes.length,2);assert.equal(d.activeShapes[0].groupId,d.activeShapes[1].groupId);const first=d.activeShapes[0],second=d.activeShapes[1];if(first.kind==='capsule'&&second.kind==='capsule'){assert.equal(hitBossHazard(d,first.b.x/2.5,first.b.z),8);assert.equal(hitBossHazard(d,second.b.x/2.5,second.b.z),0);}
});
test('H09: fixed spear length, body reaches .38, no independent body-hit volume; .75 contact recovery and groups serialize',()=>{
 for(const boss of bosses)for(let index=0;index<2;index++){const d=begin(boss,index,0);const old=d.groupId,spec=BOSS_HAZARD_ATTACKS[d.attackId];let minDepth=4;for(let i=0;i<78+spec.active+spec.recovery-1;i++){tickBossDirector(d,{playerX:0,teamZ:10});minDepth=Math.min(minDepth,d.bossDepth);assert.equal(d.groupId,old);if(d.phase==='recovery'){assert.equal(d.activeShapes.length,0);if(d.attackId!=='spear_wave'||d.phaseTick>=15)assert.ok(d.bossDepth<=.75+1e-9);}if(d.attackId==='spear_thrust'&&d.weapon){assert.ok(Math.abs(Math.hypot(d.weapon.tip.x-d.weapon.grip.x,d.weapon.tip.z-d.weapon.grip.z)-90/104)<1e-9);}}
  if(d.attackId==='spear_thrust')assert.ok(Math.abs(minDepth-.38)<1e-9);for(let i=0;i<3;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.equal(d.groupId,old+1);assert.equal(d.activeShapes.length,0);
 }
});
test('H09 analytic shapes reject bounding box corners and sector inner hole',()=>{
 const s={kind:'capsule' as const,id:1,groupId:1,a:{x:0,z:0},b:{x:1,z:1},radius:.1};assert.equal(hazardHit(s,{x:0,z:1}),false);assert.equal(hazardHit(s,{x:.5,z:.5}),true);
 const sector={kind:'sector' as const,id:1,groupId:1,origin:{x:0,z:0},near:.22,far:1.12,fromAngle:-Math.PI/4,toAngle:Math.PI/4};assert.equal(hazardHit(sector,{x:0,z:-.1}),false);assert.equal(hazardHit(sector,{x:0,z:-.7}),true);assert.equal(hazardHit(sector,{x:1,z:-1}),false);
});

test('H09: spear wave departs from rigid tip after backswing and returns to contact range',()=>{const d=begin('yang_ling',1,0);for(let i=0;i<78;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.equal(d.bossDepth,1.65);assert.deepEqual(d.weapon?.tip,d.origin);assert.ok(Math.abs(Math.hypot(d.origin.x-d.releaseHand.x,d.origin.z-d.releaseHand.z)-90/104)<1e-9);const shape=d.activeShapes[0];assert.equal(shape.kind,'capsule');if(shape.kind==='capsule')assert.deepEqual(shape.a,d.origin);for(let i=0;i<BOSS_HAZARD_ATTACKS.spear_wave.active+15;i++)tickBossDirector(d,{playerX:0,teamZ:10});assert.equal(d.phase,'recovery');assert.ok(d.bossDepth<=.75+1e-9);});

test('H09: off-center thrust warning contains the entire actual parallel-translating shaft sweep',()=>{for(const x of[-.91,-.5,0,.5,.91]){const d=begin('yang_ling',0,x),warning=d.warningShapes;for(let i=0;i<78+18;i++){tickBossDirector(d,{playerX:x,teamZ:10});if(d.phase==='active')for(const shape of d.activeShapes)for(const p of hazardOutline(shape))assert.ok(warning.some(s=>hazardHit(s,p,1e-6)),`warning excludes active point at x=${x}`);}}});
