import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {companionSlots} from '../assets/scripts/formal/presentation';
function fixture(){const db=new Map<string,string>(),store=new FormalStore({getItem:k=>db.get(k)||null,setItem:(k,v)=>{db.set(k,v);}}),b=createBattle({chapter:2,lineup:store.loadout(),seed:7}),s=b.state;s.course=[];s.speed=0;s.show=1e6;s.volleyT=1e6;s.heroX=s.targetX=0;return {b,s,store,db};}
const tick=(b:any,n=1)=>{for(let i=0;i<n;i++)b.step();};
let id=10000;
function open(b:any,kind:string,gives?:string,extra={}){const s=b.state,e={id:++id,type:'crate',kind,gives,x:0,d:s.dist+1.8,hp:1,max:1,open:0,...extra};s.ents=[e];s.waves=[{source:'fixture',x:0,x0:0,z:1,z0:1,speed:100,range:5,t:0,hits:new Set(),pierce:1,dmg:2,hw:.1}];tick(b);return e;}
function enemy(n:number,x:number,d:number,hp=20,phase='approach'){return {id:n,type:'enemy',enemyKind:'light',x,d,hp,max:hp,dead:0,walk:0,phase,pt:0};}
function heroWave(s:any,extra={}){s.waves=[{projectileId:88,source:'hero',weaponId:'spear',attackId:'hero:test',attackIndex:2,x:0,x0:0,z:1,z0:1,speed:100,range:20,t:0,hits:new Set(),pierce:1,dmg:3,hw:.1,...extra}];}

test('a box immediately improves actual hero and troop damage; restarting keeps the save unchanged',()=>{
 const {b,s,store,db}=fixture(),saved=JSON.stringify(store.data);open(b,'power');assert.equal(s.growthStats.damage,1.12);s.ents=[];s.show=0;s.atkT=.135;s.volleyT=0;tick(b);
 assert.ok(s.waves.some((w:any)=>w.source==='hero'&&Math.abs(w.dmg-3*1.12)<1e-8));assert.ok(s.arrows.every((a:any)=>a.dmg===1.12));
 assert.equal(JSON.stringify(store.data),saved);assert.equal(db.size,0);assert.equal(createBattle({chapter:2,lineup:store.loadout()}).state.growthStats.damage,1);
});
test('full-tier weapons and duplicate relics grow damage instead of only adding troops',()=>{
 const {b,s}=fixture();s.tier=3;const troops=s.troops;open(b,'weapon','spear');assert.equal(s.growth.power,1);assert.equal(s.troops,troops);open(b,'treasure','taiping',{trial:true});open(b,'treasure','taiping',{trial:true});assert.equal(s.growth.power,2);assert.deepEqual(s.growthStats.effects,['thunder']);assert.deepEqual(s.runGot,['taiping']);assert.equal(s.troops,troops);
});
test('different treasure activates its passive immediately without replacing a worn slot',()=>{
 const {b,s}=fixture();s.slots.dian.id='taiping';s.slots.dian.st='worn';open(b,'treasure','mengde',{trial:true});assert.equal(s.slots.dian.id,'taiping');assert.ok(s.growthStats.effects.includes('blade'));assert.deepEqual(s.runGot,['mengde']);assert.ok(s.growthNotices.some((n:any)=>n.title.includes('孟德')));
});
test('the imperial seal picked up mid-run grants its original troops and its new passive now',()=>{
 const {b,s}=fixture();s.t=28;open(b,'treasure','yuxi',{trial:true});assert.equal(s.troops,36);assert.ok(s.growthStats.effects.includes('thunder'));assert.equal(s.slots.qi.used,true);open(b,'treasure','yuxi',{trial:true});assert.equal(s.troops,36);
});
test('trial general joins immediately, retains selected companions, and matching weapon boosts real damage',()=>{
 const {b,s,store}=fixture();s.companions=[{id:'zhang',dx:.34,t:0,pose:0,fired:true},{id:'dian',dx:-.34,t:0,pose:0,fired:true}];open(b,'general','zhao',{trial:true});assert.deepEqual(s.companions.map((c:any)=>c.id),['zhang','dian','zhao']);open(b,'weapon','qinggang',{trial:true});assert.equal(s.weapon,'qinggang');s.ents=[];s.show=0;s.atkT=.135;tick(b);assert.ok(s.waves.some((w:any)=>w.source==='hero'&&w.dmg===3*1.25));assert.equal(store.data.captures.includes('zhao'),false);assert.equal(store.data.weapons.includes('qinggang'),false);const slots=companionSlots(0,3);assert.equal(new Set(slots.map(p=>p.x+':'+p.z)).size,3);
});
test('upgrading after a trial weapon preserves that weapon, and tier-three blade adds real side projectiles',()=>{
 const {b,s}=fixture();open(b,'weapon','guandao',{trial:true});open(b,'weapon','spear',{upgrade:true});assert.equal(s.weapon,'guandao');assert.equal(s.tier,2);open(b,'treasure','mengde',{trial:true});s.ents=[];s.show=0;s.atkN=2;s.atkT=.355;tick(b);const extra=s.waves.filter((w:any)=>w.growthPassive);assert.equal(extra.length,2);assert.ok(extra.every((w:any)=>w.dmg>0&&w.vx!==0));
});
test('thunder chains actual damage to at most three nearby enemies, once per attack',()=>{
 const {b,s}=fixture();open(b,'treasure','taiping',{trial:true});s.ents=[enemy(1,0,2),enemy(2,.3,2.4),enemy(3,-.3,2.6),enemy(4,.5,3),enemy(5,.6,4),enemy(6,.85,8)];heroWave(s);tick(b);assert.ok(s.ents[1].hp<20);assert.ok(s.ents[2].hp<20);assert.ok(s.ents[3].hp<20);assert.equal(s.ents[4].hp,20);assert.equal(s.ents[5].hp,20);assert.equal(b.ledger.filter((r:any)=>r.kind==='passive'&&r.source==='thunder').length,1);const hp=s.ents[1].hp;heroWave(s);tick(b);assert.equal(s.ents[1].hp,hp);
});
test('flame splash has a local area and cannot recursively trigger itself',()=>{
 const {b,s}=fixture();open(b,'treasure','muniu',{trial:true});s.ents=[enemy(1,0,2),enemy(2,.3,2.4),enemy(3,.6,3)];heroWave(s);tick(b);assert.ok(s.ents[1].hp<20);assert.equal(s.ents[2].hp,20);assert.equal(b.ledger.filter((r:any)=>r.kind==='passive').length,1);
});
test('shield absorbs real combat loss once, recharges after ten seconds, and does not erase a negative gate',()=>{
 const {b,s}=fixture();open(b,'guard');s.troops=30;s.ents=[];s.boss={person:'lubu',name:'吕布',hp:100,max:100,trail:100,phase:'strike',pt:0,band:[-.5,.5],z:17,hit:0,flags:4,flagFx:[],cycleN:0};s.minT=100;
 s.waves=[{boss:true,attackId:'test-attack',damage:3,x:0,z:.2,z0:17,speed:-40,t:0,hits:new Set(),range:99}];tick(b);assert.equal(s.troops,28);assert.equal(s.growthShield,0);assert.ok(b.ledger.some((r:any)=>r.kind==='shield'&&r.amount===1));s.boss=null;s.ents=[{id:99,type:'gate',x:0,d:0,val:-3,passed:false}];s.growthShield=1;tick(b);assert.equal(s.troops,25);assert.equal(s.growthShield,1);s.growthShield=0;s.t=s.shieldRefresh-.01;s.ents=[];tick(b);assert.equal(s.growthShield,1);
});
test('arrows lead advancing infantry in every attack phase rather than landing behind them',()=>{
 for(const phase of ['idle','warn','strike','rec']){
  const {b,s}=fixture();s.ents=[enemy(7,0,10,10,phase)];s.ents[0].pt=-100;s.ents[0].telegraph={execute:1e6,end:1e6+1,bands:[[-.1,.1]]};s.volleyT=0;tick(b);const a=s.arrows[0],expectedV=3.1;assert.ok(a.tz<10-expectedV*.4,phase+' omitted movement');tick(b,50);assert.ok(s.ents[0].hp<10,phase+' arrows never connected');
 }
});
