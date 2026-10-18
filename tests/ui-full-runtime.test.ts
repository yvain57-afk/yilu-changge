import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';

/**
 * Business/menu callback acceptance. Real FullMenu, FormalGame.begin/show, FormalStore and battle model.
 * Only Cocos node/texture transport, audio hardware and diagnostic transport are replaced.
 * This does NOT prove rendered pixels, UIKit touch delivery, device performance or audible output.
 */
const root=path.resolve('assets/scripts/formal'),req=createRequire(import.meta.url),cache=new Map<string,any>();
const paint:any={font:'',fillStyle:'',textAlign:'',textBaseline:'',globalAlpha:1,
 createLinearGradient(){return{addColorStop(){}};},save(){},restore(){},fillRect(...v:any[]){this.calls?.push({kind:'rect',v});},drawImage(...v:any[]){this.calls?.push({kind:'image',v});},fillText(...v:any[]){this.calls?.push({kind:'label',v});},frame(key:string,...v:any[]){assert.ok(actual(path.join(root,'manifest.ts')).MANIFEST.frames[key],`missing frame ${key}`);this.calls?.push({kind:'frame',key,v});},
 measure(s:string,n:number){return Array.from(s).reduce((v,c)=>v+(/[\u2e80-\uffff]/.test(c)?1:.59)*n,0);}};
const stubs:Record<string,any>={
 './NativePaint':{NativePaint:class {static textures={ui_full_components:{}};}},
 '../Platform':{Platform:class {}},
 '../ui/PresentationAssets':{PresentationAssets:class {}},
 './SafeErrorOverlay':{SafeErrorOverlay:class {}},
 './BridgeDiagnostics':{BridgeDiagnostics:class {event(){} sample(){}}},
 'cc/env':{DEBUG:false},
 cc:{Component:class {},_decorator:{ccclass:()=>((c:any)=>c)},view:{getVisibleSize:()=>({width:402,height:874})},sys:{isNative:false,isBrowser:false}},
};
function actual(file:string):any{
 const f=path.resolve(file);if(cache.has(f))return cache.get(f).exports;
 const module={exports:{}};cache.set(f,module);
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
 const load=(id:string)=>stubs[id]??(id.startsWith('.')?actual(path.resolve(path.dirname(f),id+'.ts')):req(id));
 vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:f})(load,module,module.exports);
 return module.exports;
}
const {FormalStore,FORMAL_KEY}=actual(path.join(root,'store.ts'));
const {FullMenu,resultLossSummary}=actual(path.join(root,'FullMenu.ts'));
const {FormalGame}=actual(path.join(root,'FormalGame.ts'));
const {CHAPTERS,TREASURES,TUNING,requiredOfficers}=actual(path.join(root,'data.ts'));
function memory(){const map=new Map<string,string>();let fails=false;return{map,get fails(){return fails;},set fails(x:boolean){fails=x;},getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{if(fails)throw Error('test disk full');map.set(k,v);}};}
function win(store:any,i:number,id='win-'+i){return store.settle({id,chapter:i,won:true,troops:50,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:requiredOfficers(i)});}
test('music settings are independent from effects, scroll into view and roll back failed writes',()=>{
 const h=host(13),before=JSON.stringify(h.store.data);Object.defineProperty(h.g,'size',{value:{W:320,H:568,top:20,bottom:16},configurable:true});h.g.show('settings');
 h.click('music');assert.equal(h.g.platform.book.data.settings.music,false);assert.equal(h.g.platform.book.data.settings.sfx,true);
 h.reveal('music-volume');h.click('music-volume');assert.equal(h.g.platform.book.data.settings.musicVolume,.9);
 h.g.platform.book.persist=()=>false;h.click('music-volume');assert.equal(h.g.platform.book.data.settings.musicVolume,.9);assert.equal(JSON.stringify(h.store.data),before);
 h.reveal('motion');h.click('motion');assert.equal(h.g.platform.book.data.settings.reducedMotion,false);
});
export function host(n=10){
 const io=memory(),store=new FormalStore(io);for(let i=0;i<n;i++){assert.equal(win(store,i),true);store.acknowledgePresentation();}
 const ui=new FullMenu(),g:any=Object.create(FormalGame.prototype),audio:boolean[]=[];
 Object.assign(g,{uiSkin:true,fullMenu:ui,store,menu:{...paint,calls:[]},paint:{...paint,calls:[]},screen:'home',chapter:Math.min(19,n),tab:'companions',page:0,screenAge:0,personId:'',first:true,resultError:'',loadingError:'',runId:'test',battle:null,rewardReturn:'home',hits:[],pressed:null,resultReceipt:null,reviewFixture:'',rev:0,renderErrors:[],bridgeDiagnostics:{event(){}},platform:{windowMetrics:{width:402,height:874,safe:{top:44,bottom:840}},syncAudio:(b:boolean)=>audio.push(b),setMusicScene(){},stopEffects(){},book:{data:{settings:{music:true,musicVolume:.6,sfx:true,vibration:true}},persist(){}}},
 drawMenu(){g.hits=[];ui.draw(g);},drawMap(){},drawHomeArt(){},load:async()=>{}});
 const click=(id:string)=>{const hit=g.hits.find((h:any)=>h.id===id);assert.ok(hit,`missing action ${id} at ${g.screen}: ${g.hits.map((h:any)=>h.id)}`);hit.action();};
 const reveal=(id:string)=>{if(g.hits.some((h:any)=>h.id===id))return;for(let i=0;i<100;i++){if(!ui.scrollBy(50))break;g.drawMenu();if(g.hits.some((h:any)=>h.id===id))return;}assert.fail('not reachable by scrolling: '+id);};
 g.drawMenu();return{g,ui,io,store,click,reveal,audio};
}
test('real prepare selection transfers liannu and exact companions/support/treasures to real battle at tier1',()=>{
 const h=host();for(const id of h.store.data.captures.slice(0,2))h.store.equipCompanion(id);h.store.equipSupport(h.store.data.visits[0]);for(const slot of ['dian','qi','ma']){const id=h.store.data.treasures.find((id:string)=>TREASURES[id].slot===slot);if(id)h.store.equipTreasure(id);}h.g.show('prepare');h.click('tab-weapons');h.reveal('select-liannu');h.click('select-liannu');const loadout=h.store.loadout();assert.equal(loadout.startWeaponId,'liannu');h.click('depart');assert.equal(h.g.screen,'battle');assert.equal(h.g.battle.state.weapon,'liannu');assert.equal(h.g.battle.state.tier,1);assert.deepEqual(h.g.battle.snapshot().companions,loadout.companions);assert.equal(h.g.battle.state.support.id,loadout.support);assert.equal(h.store.data.selectedWeaponId,'liannu');for(const slot of ['dian','qi','ma'])assert.equal(h.g.battle.state.slots[slot].id,loadout.treasures[slot]);assert.ok(h.g.menu.calls.some((c:any)=>c.kind==='image'));
});
test('real permanent upgrade deducts actual cost, preserves selected weapon and leaves running tier unchanged',()=>{
 const h=host();h.store.selectWeapon('liannu');h.g.begin();h.g.battle.state.tier=2;const lv=h.store.data.weaponLevels.liannu,oldXP=h.store.data.xp;h.ui.detailKind='weapon';h.ui.detailId='liannu';h.g.show('item');h.click('upgrade-item');assert.equal(h.store.data.weaponLevels.liannu,lv+1);assert.equal(h.store.data.xp,oldXP-TUNING.upgradeCost(lv));assert.equal(h.g.battle.state.tier,2);assert.equal(h.store.data.selectedWeaponId,'liannu');h.g.begin();assert.equal(h.g.battle.state.tier,1);
});
test('unowned, insufficient XP and max-level weapon details expose no upgrade action',()=>{
 for(const mode of ['unowned','poor','max']){const h=host(mode==='unowned'?0:10);h.ui.detailKind='weapon';h.ui.detailId='liannu';if(mode==='poor')h.store.data.xp=0;if(mode==='max')h.store.data.weaponLevels.liannu=TUNING.weaponMaxLevel;const before=JSON.stringify(h.store.data);h.g.show('item');assert.ok(!h.g.hits.some((x:any)=>x.id==='upgrade-item'));assert.equal(JSON.stringify(h.store.data),before);}
});
test('companion slots add/remove normally, full lineup waits for explicit replacement, cancel preserves both',()=>{
 const h=host(),ids=h.store.data.captures.slice(0,3);assert.equal(ids.length,3);const person=(id:string)=>{h.g.personId=id;h.g.show('person');h.click('person-equip');};
 person(ids[0]);assert.deepEqual(h.store.loadout().companions,[ids[0]]);person(ids[1]);assert.deepEqual(h.store.loadout().companions,ids.slice(0,2));person(ids[2]);assert.equal(h.g.screen,'confirm');assert.deepEqual(h.store.loadout().companions,ids.slice(0,2));h.click('back');assert.equal(h.g.screen,'person');assert.deepEqual(h.store.loadout().companions,ids.slice(0,2));h.click('person-equip');h.click('replace-'+ids[0]);assert.deepEqual(h.store.loadout().companions,[ids[1],ids[2]]);person(ids[2]);assert.deepEqual(h.store.loadout().companions,[ids[1]]);
});
test('support identity follows visits; ally/seen cannot get equip; unopened treasure slot cannot equip',()=>{
 const h=host(),support=h.store.data.visits[0];h.g.personId=support;h.g.show('person');h.click('person-equip');assert.equal(h.store.loadout().support,support);assert.equal(h.store.equipSupport(h.store.data.captures[0]),false);
 for(const id of h.store.data.allies){h.g.personId=id;h.g.show('person');assert.ok(!h.g.hits.some((x:any)=>x.id==='person-equip'));}
 const z=host(0);z.store.data.treasures=['chitu'];z.ui.detailKind='treasure';z.ui.detailId='chitu';z.g.show('item');assert.ok(!z.g.hits.some((x:any)=>x.id==='equip-item'));assert.equal(z.store.loadout().treasures.ma,null);
});
test('treasure replacement requires confirmation and affects only its original slot',()=>{
 const h=host(20),slot='dian',ids=h.store.data.treasures.filter((id:string)=>TREASURES[id].slot===slot);h.store.equipTreasure(ids[0]);const before={...h.store.data.slots};h.ui.detailKind='treasure';h.ui.detailId=ids[1];h.g.show('item');h.click('equip-item');assert.equal(h.g.screen,'confirm');assert.deepEqual(h.store.data.slots,before);h.click('back');assert.deepEqual(h.store.data.slots,before);h.click('equip-item');h.click('replace-treasure');assert.deepEqual(h.store.data.slots,{...before,dian:ids[1]});
});
test('reward detail, return, repeated entry, skip and persisted reload never repeat grant',()=>{
 const h=host(0);assert.equal(win(h.store,0),true);const xp=h.store.data.xp,claimed=[...h.store.data.claimed],items=JSON.stringify(h.store.data.pendingRewardPresentation.items);h.g.rewardReturn='result';h.g.show('reward');h.click('reward-primary');assert.ok(['person','item'].includes(h.g.screen));h.click('back');assert.equal(h.g.screen,'reward');for(let i=0;i<5;i++)h.g.drawMenu();assert.equal(h.store.data.xp,xp);assert.deepEqual(h.store.data.claimed,claimed);assert.equal(JSON.stringify(h.store.data.pendingRewardPresentation.items),items);assert.ok(!h.g.hits.some((x:any)=>x.id==='reward-done'));h.g.screenAge=1;h.g.drawMenu();h.click('reward-done');assert.equal(h.store.data.pendingRewardPresentation,null);const reloaded=new FormalStore(h.io);assert.equal(reloaded.data.xp,xp);assert.equal(reloaded.data.pendingRewardPresentation,null);assert.equal(win(reloaded,0),false);
});
test('level10 and20 milestone routes and headings agree with persisted progress; replay grants no badge twice',()=>{
 for(const i of [9,19]){const h=host(i);assert.equal(win(h.store,i),true);h.g.chapter=i;h.g.show('reward');assert.equal(h.store.completed,i+1);assert.equal(h.store.data.badges.length,(i+1)/2);assert.ok(h.ui.textRecords.some((t:any)=>t.text.includes(i===9?'上篇完成':'二十关贯通')));h.store.acknowledgePresentation();const xp=h.store.data.xp,badges=[...h.store.data.badges],captures=[...h.store.data.captures];assert.equal(win(h.store,i,'replay-'+i),true);assert.equal(h.store.data.xp-xp,TUNING.replayXP);assert.deepEqual(h.store.data.badges,badges);assert.deepEqual(h.store.data.captures,captures);assert.equal(h.store.data.pendingRewardPresentation,null);}
});
test('failed settlement blocks departure; real retry persists once then allows reward acknowledgement',()=>{
 const h=host(0);h.io.fails=true;assert.equal(win(h.store,0),false);const xp=h.store.data.xp;assert.ok(h.store.notice);h.g.battle={state:{troops:50},cancel(){},pause(){},snapshot:()=>({damageSources:{}})};h.g.show('result');assert.deepEqual(h.g.hits.map((x:any)=>x.id),['retry-save']);h.io.fails=false;h.click('retry-save');assert.equal(h.g.screen,'reward');assert.equal(h.store.notice,'');assert.equal(h.store.data.xp,xp);assert.equal(new FormalStore(h.io).data.xp,xp);h.g.screenAge=1;h.g.drawMenu();h.click('reward-done');assert.equal(new FormalStore(h.io).data.pendingRewardPresentation,null);
});
test('failed acknowledgement retains pending reward, retry causes no duplicate award',()=>{
 const h=host(0);win(h.store,0);const xp=h.store.data.xp;h.g.show('reward');h.g.screenAge=1;h.g.drawMenu();h.io.fails=true;h.click('reward-done');assert.ok(h.store.data.pendingRewardPresentation);assert.deepEqual(h.g.hits.map((x:any)=>x.id),['retry-save']);h.io.fails=false;h.click('retry-save');assert.equal(h.store.data.xp,xp);h.g.screenAge=1;h.g.drawMenu();h.click('reward-done');assert.equal(h.store.data.pendingRewardPresentation,null);
});
test('pause, quit confirmation, cancel and continue use actual router and preserve real battle state',()=>{
 const h=host(0);h.g.begin();const b=h.g.battle,run=h.g.runId;b.state.troops=37;h.click('pause');assert.equal(b.snapshot().paused,true);assert.equal(h.audio.at(-1),false);h.click('quit');assert.equal(h.g.screen,'confirm');assert.equal(h.g.battle,b);h.click('back');assert.equal(h.g.screen,'pause');assert.equal(b.state.troops,37);assert.equal(h.g.runId,run);h.click('continue');assert.equal(h.g.screen,'battle');assert.equal(b.snapshot().paused,false);assert.equal(h.audio.at(-1),true);
});

test('restart requires confirmation, cancel retains current run, confirm starts tier1 with permanent loadout intact',()=>{
 const h=host(10);h.store.selectWeapon('liannu');const permanent=JSON.stringify(h.store.data);h.g.begin();const old=h.g.battle;old.state.tier=3;old.state.troops=17;h.click('pause');h.click('restart');assert.equal(h.g.screen,'confirm');assert.equal(h.g.battle,old);h.click('back');assert.equal(h.g.battle.state.tier,3);h.click('restart');h.click('confirm-restart');assert.notEqual(h.g.battle,old);assert.equal(h.g.screen,'battle');assert.equal(h.g.battle.state.tier,1);assert.equal(h.g.battle.state.weapon,'liannu');assert.equal(JSON.stringify(h.store.data),permanent);
});

test('defeat shows actual losses and offers retry or lineup without changing earned progress at both phone sizes',()=>{
 for(const [width,height] of [[375,667],[402,874]]){
  const h=host(16);h.g.platform.windowMetrics={width,height,safe:{top:44,bottom:height-34}};
  h.store.selectWeapon('huaji');h.g.begin();const old=h.g.battle,permanent=JSON.stringify(h.store.data);
  old.state.troops=0;old.state.ended=true;old.state.damageSources={archer:21,cavalry:6,light:2,shield:0};h.g.show('result');
  const labels=()=>h.ui.textRecords.map((t:any)=>t.text).join('\n');
  assert.ok(h.ui.textRecords.some((t:any)=>t.text==='失败'));
  assert.match(labels(),/累计战损 29 名/);assert.match(labels(),/敌方弓手 · 损失 21 名/);assert.match(labels(),/骑兵冲撞 · 损失 6 名/);assert.match(labels(),/其余来源 · 损失 2 名/);
  assert.doesNotMatch(labels(),/盾兵|此役未竟|再战本关/);assert.equal(JSON.stringify(h.store.data),permanent);
  assert.equal(h.g.hits.find((x:any)=>x.id==='next').label,'重试本关');assert.equal(h.g.hits.find((x:any)=>x.id==='back').label,'返回营地');
  h.reveal('view-reward');h.click('view-reward');assert.equal(h.g.screen,'prepare');assert.equal(h.g.chapter,16);assert.equal(h.store.loadout().startWeaponId,'huaji');assert.equal(JSON.stringify(h.store.data),permanent);
  h.g.show('result');h.click('next');assert.equal(h.g.screen,'battle');assert.notEqual(h.g.battle,old);assert.equal(h.g.chapter,16);assert.equal(h.g.battle.state.weapon,'huaji');assert.equal(h.g.battle.state.tier,1);assert.equal(JSON.stringify(h.store.data),permanent);
 }
});

test('loss diagnosis aggregates aliases, ignores prevented hits, and never invents a cause from missing data',()=>{
 const v=resultLossSummary({arrow:4,archer:3,cavalry:5,mechanism:0,boss:-1,gate:NaN,officer:Infinity});
 assert.match(v,/累计战损 12 名/);assert.match(v,/敌方弓手 · 损失 7 名/);assert.match(v,/骑兵冲撞 · 损失 5 名/);assert.doesNotMatch(v,/机关|敌将|负数门/);
 assert.match(resultLossSummary({archer:0,gate:'8'}),/没有完整的战损记录/);
 assert.match(resultLossSummary({new_source:8}),/其他攻击 · 损失 8 名/);assert.doesNotMatch(resultLossSummary({new_source:8}),/弓手|骑兵|箭雨/);
});
