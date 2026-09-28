'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {FormalStore,FORMAL_KEY}=require('./compiled/formal/store.js');
const {CHAPTERS,WEAPON_DATA,PEOPLE,routeFor}=require('./compiled/formal/data.js');
const {harness}=require('./battle_extracts.cjs');
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
function state(){return {t:0,dist:0,heroX:-.48,troops:30,companions:[],ents:[],waves:[],boss:null,slots:{qi:{id:null},dian:{id:null},ma:{id:null}},support:{id:null,cd:0,pending:null,uses:0},stats:{supportSaved:0,taiping:0},deltas:[],redFlash:0,fx:[]};}
const report={review_commit:'c6aa92cf26b22a6682099c26e9203b70b6d14f6f',scope:'Node isolated function/data/store execution; NOT Cocos execution or a natural playthrough',sourceHashes:{},findings:[],sanity:[]};
for(const [f,sha]of Object.entries({'data.ts':'9104dabdbaafcec9b7a3f68b5e8868e826ed1b57','store.ts':'b293703fea3755c6572fe961b60cdf46a14b5334'})){const b=fs.readFileSync(path.join(__dirname,'source/formal',f)),got=crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');assert.equal(got,sha);report.sourceHashes[f]={expected:sha,actual:got,match:true};}
// A: Actual default L4 officer has 12 + 3*2 = 18HP. Merely touching a foot invokes the ordinary enemy exit.
{
 const s=state(),e={id:1,type:'enemy',elite:true,person:'xu',x:s.heroX,d:.2,hp:18,walk:0,dead:0};s.ents=[e];const h=harness(s);h.updateEnts(1/60);assert.equal(e.hp,18);assert.equal(e.dead,.01);assert.equal(s.troops,29);
 report.findings.push({id:'F1',case:'许褚满血接触',before:{hp:18,troops:30},after:{hp:e.hp,dead:e.dead,troops:s.troops},observed:'elite officer follows ordinary enemy contact exit, losing one troop without defeating its HP'});
}
// B: A full-HP missed named officer is removed behind the viewport; the actual settlement API has no defeat facts.
{
 const s=state(),e={id:2,type:'enemy',elite:true,person:'xu',x:.48,d:-4.1,hp:18,walk:0,dead:0};s.ents=[e];harness(s).updateEnts(1/60);assert.equal(s.ents.length,0);assert.equal(e.hp,18);
 const store=new FormalStore(memory());for(let i=0;i<3;i++)store.settle({id:`prior${i}`,chapter:i,won:true,troops:30,treasures:[]});store.settle({id:'boss-cleared',chapter:3,won:true,troops:30,treasures:[]});assert.ok(store.data.captures.includes('xu'));
 report.findings.push({id:'F2',case:'绕过满血许褚后提交第四关胜利',hpOnRemoval:e.hp,officerRemoved:true,settlementAcceptsNoOfficerDefeatFacts:true,captures:store.data.captures,observed:'rule functions permit the missed officer to leave while first-clear settlement grants its capture; engine should prove actual defeat in the revised path'});
}
// C: Legitimate replay combination after chapter10, 2 troops, -12 gate, 七星灯+华佗.
{
 const s=state();s.troops=2;s.slots.qi={id:'qixing',used:false};s.support.id='hua';const h=harness(s);h.addTroops(-12,'gate');assert.equal(s.troops,5);const pendingLoss=s.support.pending.loss;for(let i=0;i<61;i++)h.supportStep(1/60);assert.equal(s.troops,9);assert.equal(s.stats.supportSaved,4);
 report.findings.push({id:'F3',case:'剩2兵、−12门、七星灯与华佗',actualTroopsLost:2,healingLossRecorded:pendingLoss,qixingRestored:5,healed:4,finalTroops:s.troops,healingAt30PercentOfActualLoss:1,records:h.records,observed:'healing uses nominal requested loss, not actual casualties'});
}
// D: Collision unit case. A pierce=1 wave exhausts on an enemy and still damages a nearby boss in the same update.
{
 const s=state();s.heroX=0;s.ents=[{id:9,type:'enemy',x:0,d:16.8,hp:100,walk:0,dead:0}];s.boss={person:'jiao',hp:100,max:100,z:17,phase:'idle',flags:4,flagFx:[]};const w={source:'hero',x:0,x0:0,z:16.5,z0:.5,prevZ:16.5,speed:60,t:0,hits:new Set(),pierce:1,dmg:10,hw:.12,range:50};s.waves=[w];const h=harness(s);h.updateWaves(1/60);assert.equal(s.ents[0].hp,90);assert.equal(s.boss.hp,97);assert.equal(w.hits.size,2);
 report.findings.push({id:'F4',case:'同帧穿透1波先撞敌兵再到Boss',pierce:w.pierce,hits:[...w.hits],enemyDamage:10,bossDamage:3,observed:'spent wave proceeds into separate boss branch',boundary:'controlled collision-function case, not claimed observed in the recorded ten-level run'});
}
// E: Exact ten-level route composition, full unlocked pool.
{
 const base=routeFor(0,Object.keys(WEAPON_DATA),[]).filter(e=>['wall','gates','crate'].includes(e.type)).map(e=>`${e.d}:${e.type}:${e.kind||''}:${e.len||''}`).slice(0,11);
 const all=CHAPTERS.map((ch,i)=>({chapter:i+1,title:ch.title,faction:ch.faction,boss:PEOPLE[ch.boss],walls:routeFor(i,Object.keys(WEAPON_DATA),[]).filter(e=>e.type==='wall'),events:routeFor(i,Object.keys(WEAPON_DATA),[]).map(e=>({d:e.d,type:e.type,kind:e.kind,person:e.person}))}));
 assert.equal(all.length,10);assert.ok(all.every(r=>r.walls.length===1&&r.walls[0].d===83&&r.walls[0].len===23));report.findings.push({id:'D1',case:'十关模板深度检查',classification:'design completeness, not a runtime crash',wallAtAndLengthAllEqual:true,chapters:all});
}
// Sanity: preserve old source records, sequential unlock, capped deploy, replay first-clear rewards not doubled.
{
 const mem=memory();mem.setItem('yilu-changge-growth-v05','{"legacy":"keep-me"}');const s=new FormalStore(mem);assert.equal(s.unlocked(1),false);for(let i=0;i<10;i++)assert.equal(s.settle({id:`clear-${i}`,chapter:i,won:true,troops:30,treasures:[]}),true);assert.equal(s.completed,10);assert.equal(s.data.weapons.length,10);assert.equal(s.data.treasures.length,8);assert.equal(new FormalStore(mem).completed,10);assert.equal(mem.getItem('yilu-changge-growth-v05'),'{"legacy":"keep-me"}');const xp=s.data.xp;s.settle({id:'replay',chapter:0,won:true,troops:30,treasures:[]});assert.equal(s.data.xp,xp+10);const captures=s.data.captures.length;s.settle({id:'replay',chapter:0,won:true,troops:30,treasures:[]});assert.equal(s.data.captures.length,captures);assert.equal(s.data.xp,xp+10);
 report.sanity.push({name:'store-only sequential10 / reload / legacy raw preservation / idempotency',passed:true,weaponCount:s.data.weapons.length,treasureCount:s.data.treasures.length,relations:{captures:s.data.captures.length,visits:s.data.visits.length,allies:s.data.allies.length},note:'does not simulate the gameplay that precedes settlement'});
}
const out=path.join(__dirname,'INDEPENDENT_RESULTS.json');fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({sourceHashes:report.sourceHashes,findings:report.findings.filter(x=>x.id!=='D1'),routeSummary:{chapters:10,sameWallEveryChapter:true},sanity:report.sanity},null,2));
