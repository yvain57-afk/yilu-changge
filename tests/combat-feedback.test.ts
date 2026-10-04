import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {MANIFEST} from '../assets/scripts/formal/manifest';
import {enemyFallPose,enemyHitPose,hitReadout,casualtySlotPose} from '../assets/scripts/formal/CombatFeedback';

const size={W:375,H:667,top:20,bottom:0};
function rig(kind='cavalry',hp=8){
 const roles:any[]=[],noop=()=>{};
 const renderer:any=new Proxy({begin(){roles.length=0;},end:noop,measure:(s:any,n:number)=>String(s).length*n*.6,measureText:(s:any)=>({width:String(s).length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),frame(k:string,x:number,y:number,h:number,o:any={}){assert.ok(MANIFEST.frames[k],k);roles.push({k,x,y,h,...o});return{x:x-h/2,y:y-h,w:h,h};}},{get:(o,k)=>k in o?o[k]:noop});
 const store=new FormalStore({getItem:()=>null,setItem:noop});
 const b=createBattle({chapter:16,seed:71,diagnostic:true,noFriendlyFire:true,renderer,viewport:size,lineup:{...store.loadout(),companions:[],support:null}}),s=b.state;
 s.course=[];s.courseLen=1e8;s.ci=0;s.speed=0;s.heroX=s.targetX=0;
 s.ents=[{id:991,type:'enemy',enemyKind:kind,x:0,d:9,hp,max:hp,dead:0,phase:'approach',pt:0,walk:0,attackN:0}];
 return {b,s,roles};
}
function shoot(r:ReturnType<typeof rig>,damage:number){
 const e=r.s.ents[0],z=e.d-r.s.dist-.5;
 r.s.waves.push({projectileId:100+r.s.t*60,attackId:'test:'+r.s.t,source:'hero',weaponId:'spear',x:e.x,x0:e.x,z,z0:z,prevZ:z,speed:60,range:40,hw:.2,pierce:1,dmg:damage,t:0,hits:new Set(),k:'g_wave_spear',h:.3});r.b.step();
}
test('nonlethal hit shows exact damage health with local recoil and cannot count a kill',()=>{
 const r=rig();shoot(r,2);const e=r.s.ents[0];
 assert.equal(e.hp,6);assert.equal(e.feedback.hpBefore,8);assert.equal(e.feedback.hpAfter,6);
 assert.equal(e.dead,0);assert.ok(!r.b.ledger.some(e=>e.kind==='enemy-defeated'));
 const p=enemyHitPose(e.feedback,r.s.t+.1);assert.equal(p.health,.75);assert.ok(p.rotation!==0);assert.ok(p.trail>p.health);
 r.b.render(size);assert.equal(r.roles.filter(x=>x.role==='enemy_body'&&x.actorId===991).length,1);
 assert.equal(r.s.hitStop,0);
});
test('shield readout uses armor-adjusted actual loss rather than nominal weapon damage',()=>{
 const r=rig('shield',8);shoot(r,2);const e=r.s.ents[0];assert.equal(e.hp,7.1);assert.ok(Math.abs(e.feedback.actual-.9)<1e-9);
 const p=enemyHitPose(e.feedback,r.s.t+.15);assert.equal(p.armor,true);assert.equal(p.health,7.1/8);
});
test('a defeated cavalry is removed from standing body submissions immediately and falls in its world position',()=>{
 const r=rig();shoot(r,20);const e=r.s.ents[0],worldD=e.d;
 assert.equal(e.hp,0);assert.equal(r.b.ledger.filter(e=>e.kind==='enemy-defeated').length,1);
 for(let i=0;i<22;i++)r.b.step();r.b.render(size);
 assert.equal(e.d,worldD);assert.equal(r.roles.filter(x=>x.role==='enemy_body'&&x.actorId===991).length,0);
 const body=r.roles.find(x=>x.role==='enemy_defeated_body'&&x.actorId===991);assert.ok(body);
 assert.ok(body.k==='bf_enemy_cavalry_fallen'||Math.abs(body.rot)>1,'no upright recovery-pose fade');
 assert.equal(r.b.diagnostics.counts.visible_enemies,0);
 for(let i=0;i<60;i++)r.b.step();assert.ok(!r.s.ents.some(e=>e.id===991));
 assert.equal(r.b.ledger.filter(e=>e.kind==='enemy-defeated').length,1);
});
test('all seven enemy kinds submit their own real fallen asset with fixed standing scale',()=>{
 for(const kind of ['light','guard','shield','archer','cavalry','banner','mechanism']){
  const r=rig(kind,3);shoot(r,20);for(let i=0;i<18;i++)r.b.step();r.b.render(size);
  const body=r.roles.find(x=>x.role==='enemy_defeated_body'&&x.actorId===991),hit=MANIFEST.frames['bf_enemy_'+kind+'_hit'],fallen=MANIFEST.frames['bf_enemy_'+kind+'_fallen'];
  assert.ok(body,kind);assert.equal(body.k,'bf_enemy_'+kind+'_fallen');assert.equal(fallen.bh,hit.bh,kind+' must not enlarge a horizontal corpse to standing crop height');assert.ok(Math.abs(body.rot)<.01);
 }
});
test('single actual friendly loss is visible even while the formation count remains in the same band',()=>{
 const r=rig();r.s.ents=[];const before=r.b.snapshot().formation.count;
 r.s.hostileShots.push({attackId:'single-loss',kind:'light',damage:1,x:0,z:.2,origin:{x:0,z:.2},lockedTarget:{x:0,z:-.2},duration:1/60,t:0});
 r.b.step();assert.equal(r.s.troops,29);assert.equal(r.b.snapshot().formation.count,before);
 assert.equal(r.s.casualties.length,1);const casualty=r.s.casualties[0],worldD=casualty.d;
 assert.equal(casualtySlotPose(r.s.casualties,casualty.slot,r.s.t).alpha,0);
 r.b.render(size);assert.ok(r.roles.some(x=>x.role==='soldier_casualty'));
 r.s.speed=4.75;for(let i=0;i<25;i++)r.b.step();assert.equal(casualty.d,worldD);r.b.render(size);
 assert.ok(r.roles.some(x=>x.role==='soldier_casualty'&&x.k==='bf_friendly_archer_fallen'&&Math.abs(x.rot)<.01));
 assert.ok(casualtySlotPose(r.s.casualties,casualty.slot,casualty.at+.75).alpha>0);
 assert.equal(casualtySlotPose(r.s.casualties,casualty.slot,casualty.at+1).alpha,1);
});
test('zero damage has no casualty and one attack cannot manufacture repeated losses',()=>{
 const r=rig();r.s.ents=[];
 for(const damage of [0,1,1]){r.s.hostileShots.push({attackId:damage?'once':'blocked',kind:'light',damage,x:0,z:.2,origin:{x:0,z:.2},lockedTarget:{x:0,z:-.2},duration:1/60,t:0});r.b.step();}
 assert.equal(r.s.troops,29);assert.equal(r.s.casualties.length,1);
});
test('the last friendly casualty finishes its fall after defeat without advancing combat or rewards',()=>{
 const r=rig();r.s.ents=[];r.s.troops=1;r.s.troopShown=1;
 r.s.hostileShots.push({attackId:'last-loss',kind:'light',damage:1,x:0,z:.2,origin:{x:0,z:.2},lockedTarget:{x:0,z:-.2},duration:1/60,t:0});r.b.step();
 assert.equal(r.s.ended,true);assert.equal(r.s.casualties.length,1);const simTime=r.s.t,damage=r.b.totals.damage,troops=r.b.totals.troops;
 for(let i=0;i<70;i++)r.b.step();assert.equal(r.s.casualties.length,0);assert.equal(r.s.t,simTime);assert.equal(r.b.totals.damage,damage);assert.equal(r.b.totals.troops,troops);
});
test('rapid hit readouts preserve a real damage trail and fall timing does not change combat state',()=>{
 const first=hitReadout(undefined,0,12,10,12,1,1),next=hitReadout(first,.1,10,6,12,1,1);
 assert.equal(next.hpBefore,12);assert.equal(next.hpAfter,6);assert.equal(enemyHitPose(next,.7).trail,.5);
 assert.equal(enemyFallPose(.4,1,true).fallen,true);assert.equal(enemyFallPose(.4,-1,false).rotation,-1.36);
 assert.equal(enemyFallPose(1,1,false).alpha,0);
});
