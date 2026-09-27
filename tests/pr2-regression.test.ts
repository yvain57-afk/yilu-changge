import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {CHAPTERS,requiredOfficers,routeFor} from '../assets/scripts/formal/data';
const memory=()=>{const m=new Map<string,string>();return{getItem:(k:string)=>m.get(k)||null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
const make=(chapter=3)=>{const store=new FormalStore(memory()),b=createBattle({chapter,lineup:store.loadout()}),s=b.state;s.course=[];s.speed=0;s.show=100;s.volleyT=100;s.minT=100;s.heroX=s.targetX=0;return{b,s,store};};
const tick=(b:any,n=1)=>{for(let i=0;i<n;i++)b.step();};
const shot=(z=1,pierce=1)=>({source:'test',x:0,x0:0,z,prevZ:z,z0:z,speed:100,range:50,t:0,hits:new Set(),pierce,dmg:10,hw:.2});
const general=(z=17)=>({person:'dian',name:'典韦',hp:100,max:100,trail:100,phase:'idle',pt:0,band:[-1,0],z,hit:0,flags:4,flagFx:[],cycleN:0});
test('F1 named officer contact and missed viewport both retain life and start an encounter',()=>{
 for(const d of [.2,-5]){const {b,s}=make();s.course=[{d,type:'officer',person:'xu',x:0}];tick(b);const e=s.ents[0];assert.equal(e.type,'officer');assert.equal(e.dead,0);assert.equal(s.troops,30);assert.equal(e.hp,e.max);assert.equal(e.d-s.dist,12);tick(b,40);assert.equal(e.phase,'warn');tick(b,60);assert.equal(s.troops,26);tick(b,10);assert.equal(e.phase,'rec');}
});
test('F1/F2 only actual attacks defeat officers, recorded once, road resumes and settlement requires proof',()=>{
 const {b,s}=make();s.speed=11;s.course=[{d:8,type:'officer',person:'xu',x:0}];tick(b,4);const e=s.ents[0];assert.equal(s.speed,0);e.phase='rec';e.pt=0;s.waves=[{...shot(10,1),speed:200,dmg:100}];tick(b,2);assert.equal(e.hp,0);assert.deepEqual(s.defeatedOfficerIds,['xu']);tick(b,100);assert.equal(s.ents.length,0);assert.equal(s.speed,11);
 const store=new FormalStore(memory());store.data.cleared=CHAPTERS.slice(0,3).map(c=>c.id);
 const run={id:'r4',chapter:3,won:true,troops:20,treasures:[],defeatedBossId:'dian',defeatedOfficerIds:[]};
 assert.equal(store.settle(run),false);assert.deepEqual(store.data.captures,[]);assert.equal(store.data.claimed.length,0);
 assert.equal(store.settle({...run,defeatedOfficerIds:['xu']}),true);assert.deepEqual(store.data.captures,['dian','xu']);const xp=store.data.xp;assert.equal(store.settle({...run,defeatedOfficerIds:['xu']}),false);assert.equal(store.data.xp,xp);
 assert.deepEqual(requiredOfficers(6),['luxun']);assert.deepEqual(requiredOfficers(9),['pang','machao']);
});
test('F3 Qixing rescue and Hua record only two real casualties, never twelve intended casualties',()=>{
 const {b,s}=make();s.troops=2;s.support={id:'hua',cd:0,pending:null,uses:0};s.slots.qi={id:'qixing',used:false};s.ents=[{id:1,type:'gate',x:0,d:0,val:-12}];tick(b);assert.equal(s.support.pending.loss,2);assert.equal(s.troops,5);assert.deepEqual(s.deltas.map((d:any)=>d.v),[-2,5]);tick(b,65);assert.equal(s.troops,6);assert.equal(s.stats.supportSaved,1);assert.equal(b.ledger.find((r:any)=>r.kind==='troops'&&r.source==='gate').amount,-2);
});
test('F3 no rescue or used rescue ends defeat; pending healing cannot resurrect it',()=>{
 for(const qi of [{id:null},{id:'qixing',used:true}]){const {b,s}=make();s.troops=2;s.slots.qi=qi;s.support={id:'hua',cd:0,pending:{loss:8,t:.8},uses:0};s.ents=[{id:1,type:'gate',x:0,d:0,val:-12}];tick(b,120);assert.equal(s.troops,0);assert.equal(s.ended,true);assert.equal(s.support.pending,null);assert.equal(s.support.uses,0);}
});
test('F3 continuous loss, Qingnang and cooldown use actual casualties once',()=>{
 const {b,s}=make();s.support={id:'hua',cd:0,pending:null,uses:0};s.slots.dian={id:'qingnang'};
 for(let i=0;i<2;i++){s.ents=[{id:i,type:'gate',x:0,d:0,val:-5}];tick(b);}
 assert.equal(s.support.pending.loss,10);tick(b,65);assert.equal(s.troops,24);s.ents=[{id:3,type:'gate',x:0,d:0,val:-5}];tick(b,65);assert.equal(s.troops,19);assert.equal(s.support.uses,1);assert.equal(s.support.pending,null);
});
test('F4 one budget covers enemy and boss; behind or beyond-range waves never hit',()=>{
 for(const [z,pierce,enemyZ,expected] of [[16,1,16.8,100],[16,2,16.8,97],[20,1,99,100],[16,1,18,97]]){const {b,s}=make();s.boss=general();s.ents=[{id:1,type:'enemy',x:0,d:enemyZ,hp:20,walk:0,dead:0}];s.waves=[shot(z,pierce)];tick(b);assert.equal(s.boss.hp,expected);if(enemyZ===18)assert.equal(s.ents[0].hp,20);}
 const {b,s}=make();s.boss=general();s.waves=[{...shot(16),range:.1}];tick(b);assert.equal(s.boss.hp,100);
});
test('D1 four faction routes differ and every required officer is beyond blocking walls',()=>{
 const walls=[0,3,5,7].map(i=>routeFor(i,['spear'],[]).filter(e=>e.type==='wall'));
 assert.equal(new Set(walls.map(w=>JSON.stringify(w))).size,4);
 for(let i=0;i<10;i++){const r=routeFor(i,['spear'],[]);assert.deepEqual(r.filter(e=>e.type==='officer').map(e=>e.person),requiredOfficers(i));for(const o of r.filter(e=>e.type==='officer'))assert.ok(r.filter(e=>e.type==='wall').every(w=>o.d>w.d+w.len!+12));}
});
test('D1 boss patterns launch distinct immutable attack bands',()=>{
 const patterns:any[]=[];
 for(const person of ['jiao','lubu','zhou']){const {b,s}=make();s.boss={...general(),person,phase:'warn',pt:10,bands:person==='jiao'?[[-1,-.28],[.28,1]]:[[-1,0]]};tick(b);const waves=s.waves.filter((w:any)=>w.boss);patterns.push(waves.map((w:any)=>({speed:w.speed,damage:w.damage,band:w.band})));assert.equal(waves.length,person==='zhou'?1:2);const old=[...waves[0].band];s.boss.band=[0,1];assert.deepEqual(waves[0].band,old);}
 assert.equal(new Set(patterns.map(p=>JSON.stringify(p))).size,3);
});
test('D3 Lu Bu and Dian Wei fire actual paired halberd projectiles',()=>{
 for(const id of ['lubu','dian']){const {b,s}=make();s.companions=[{id,dx:.3,t:2,pose:0,fired:true}];tick(b,12);const waves=s.waves.filter((w:any)=>w.source==='companion:'+id);assert.equal(waves.length,2);assert.ok(waves.every((w:any)=>w.k==='g_wave_huaji'&&w.pierce===2));assert.notEqual(waves[0].x,waves[1].x);}
});
