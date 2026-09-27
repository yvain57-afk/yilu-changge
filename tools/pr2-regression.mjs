import {open,out} from './formal-browser.mjs';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const mode=process.argv[2]||'after',t=await open('pr2-'+mode+'-'+Date.now()),rows=[];
try {
 await t.tap('start');await t.tap('depart');
 for(const kind of ['officer-contact','officer-missed','healing','pierce','behind-boss']){
  const result=await t.p.evaluate(async({kind,mode})=>{
   const cc=await System.import('cc');function find(n){for(const c of n.components)if(c.battle&&typeof c.snapshot==='function')return c;for(const x of n.children){const r=find(x);if(r)return r;}}
   const g=find(cc.director.getScene());g.begin();const b=g.battle,s=b.state;
   s.course=[];s.speed=0;s.ents=[];s.volleyT=100;s.show=100;s.heroX=s.targetX=0;s.minT=100;s.companions=[];
   const wave=()=>({source:'fixture',x:0,x0:0,z:16,prevZ:16,z0:16,speed:100,range:50,t:0,hits:new Set(),pierce:1,dmg:10,hw:.2});
   if(kind.startsWith('officer'))s.ents=[{id:9001,type:mode==='before'?'enemy':'officer',elite:true,person:'xu',x:0,d:kind==='officer-contact'?.2:-5,hp:18,max:18,walk:0,dead:0,phase:'approach',pt:0,band:[-.3,.3]}];
   if(kind==='healing'){s.troops=2;s.support={id:'hua',cd:0,pending:null,uses:0};s.slots.qi={id:'qixing',used:false,st:'worn',flash:0,n:0};s.ents=[{id:9002,type:'gate',x:0,d:0,val:-12,passed:false}];}
   if(kind==='pierce'||kind==='behind-boss'){s.state='general';s.boss={person:'jiao',name:'张角',hp:100,max:100,trail:100,phase:'idle',pt:0,band:[-1,0],z:17,hit:0,flags:4,flagFx:[],cycleN:0};s.ents=kind==='pierce'?[{id:9003,type:'enemy',x:0,d:16.8,hp:20,walk:0,dead:0}]:[];s.waves=[wave()];if(kind==='behind-boss')s.waves[0].z=20;}
   const before=b.snapshot();for(let i=0;i<(kind==='healing'?65:1);i++)b.step();b.pause(true);return {kind,before,after:b.snapshot(),ledger:b.ledger};
  },{kind,mode});rows.push(result);await t.p.waitForTimeout(250);await t.p.screenshot({path:out+'/'+mode+'-'+kind+'.png'});
 }
 if(mode==='after'){
  for(const r of rows.filter(x=>x.kind.startsWith('officer'))){assert.equal(r.after.entities[0].hp,18);assert.equal(r.after.entities[0].dead,0);assert.equal(r.after.troops,30);}
  assert.equal(rows.find(x=>x.kind==='healing').after.troops,6);
  assert.equal(rows.find(x=>x.kind==='pierce').after.boss.hp,100);
  assert.equal(rows.find(x=>x.kind==='behind-boss').after.boss.hp,100);
 }
 assert.deepEqual(t.errors,[]);
 writeFileSync(out+'/'+mode+'-regression.json',JSON.stringify({mode,scope:'Explicit fixtures in the real Cocos scene; production battle.step, native rendering. Not a natural playthrough.',rows,errors:t.errors},null,2));
 console.log(mode,rows.map(r=>({kind:r.kind,troops:r.after.troops,boss:r.after.boss?.hp,entities:r.after.entities.length})));
}finally{await t.c.close();}
