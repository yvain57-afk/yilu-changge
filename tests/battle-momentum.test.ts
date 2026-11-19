import test from 'node:test';
import assert from 'node:assert/strict';
import {createMomentum,earnMomentum,momentumView} from '../assets/scripts/formal/BattleMomentum';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {createRunGrowth,grantRunGrowth,runGrowthStats} from '../assets/scripts/formal/RunGrowth';
import {chapterRewardHint} from '../assets/scripts/formal/RewardFlow';
import {CHAPTERS} from '../assets/scripts/formal/data';
test('charge persists across missed chains; burst expires and cannot be permanently sustained by kills',()=>{
 const m=createMomentum();for(let i=0;i<11;i++)earnMomentum(m,'kill',i);assert.equal(m.bursts,0);
 assert.equal(earnMomentum(m,'kill',20),true);assert.equal(m.bestCombo,11);assert.equal(m.combo,1);
 for(let i=0;i<100;i++)earnMomentum(m,'kill',21+i/100);assert.equal(m.until,26);assert.equal(m.bursts,1);
 assert.equal(momentumView(m,26).damage,1);assert.equal(momentumView(m,26).combo,0);
});
test('boss multi-projectile hits grant at most one charge per second and pickup extension stays bounded',()=>{
 const m=createMomentum();for(let i=0;i<50;i++)earnMomentum(m,'boss-hit',0);assert.equal(m.charge,1);
 for(let i=1;i<12;i++)earnMomentum(m,'boss-hit',i);assert.equal(m.bursts,1);
 for(let i=0;i<100;i++)earnMomentum(m,'pickup',12);assert.equal(m.until,20);assert.equal(m.bursts,1);
});
test('real enemy death triggers once, burst raises resolved damage, pause freezes duration, restart resets',()=>{
 const store=new FormalStore({getItem:()=>null,setItem(){}}),b=createBattle({chapter:2,lineup:store.loadout(),seed:7}),s=b.state;
 s.course=[];s.speed=0;s.show=1e6;s.volleyT=1e6;s.heroX=s.targetX=0;
 const strike=(id:number,hp:number)=>{const e={id,type:'enemy',enemyKind:'light',x:0,d:s.dist+1.8,hp,max:hp,dead:0,walk:0,phase:'approach',pt:0};s.ents=[e];s.waves=[{source:'hero',weaponId:'spear',attackId:'test:'+id,x:0,x0:0,z:1,z0:1,speed:100,range:5,t:0,hits:new Set(),pierce:1,dmg:2,hw:.1}];b.step();return e;};
 for(let i=1;i<=12;i++)strike(i,1);assert.equal(s.momentum.kills,12);assert.equal(s.momentum.bursts,1);b.step();assert.equal(s.momentum.kills,12);
 const e=strike(99,20);assert.ok(Math.abs(e.hp-(20-2*1.18))<1e-8);
 const before=b.snapshot().momentum.remaining;b.pause(true);for(let i=0;i<600;i++)b.step();assert.equal(b.snapshot().momentum.remaining,before);
 b.pause(false);s.ents=[];for(let i=0;i<400;i++)b.step();assert.equal(b.snapshot().momentum.active,false);
 assert.equal(createBattle({chapter:2,lineup:store.loadout()}).state.momentum.bursts,0);assert.equal(store.data.xp,0);
});
test('saturated power converts to actual speed once per pickup, all chapters describe their real rewards',()=>{
 const g=createRunGrowth([]);g.power=8;const r=grantRunGrowth(g,'power');assert.match(r.detail,/速度/);assert.equal(runGrowthStats(g).speed,1.06);assert.equal(g.pickups,1);
 for(let i=0;i<CHAPTERS.length;i++)assert.ok(chapterRewardHint(i).length>8);assert.equal(chapterRewardHint(20),'');
});
