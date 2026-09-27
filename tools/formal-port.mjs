// One-time reproducible intake transform. Never edits the frozen reference.
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
if(fs.existsSync('assets/scripts/formal/battle.ts'))throw Error('Intake-only transform: refusing to overwrite integrated production battle or manifest.');
const root='docs/BATTLE-PREVIEW-20260926',box={window:{}};vm.runInNewContext(fs.readFileSync(root+'/assets/manifest.js','utf8'),box);vm.runInNewContext(fs.readFileSync(root+'/assets/gen/manifest-gen.js','utf8'),box);
const m=box.window.MANIFEST,g=box.window.GEN_MANIFEST;Object.assign(m.sheets,g.sheets);Object.assign(m.frames,g.frames);
for(const [id,p] of Object.entries(m.sheets)){const dest='assets/resources/formal20260927/'+id+'.png';if(!fs.existsSync(dest))fs.copyFileSync(path.join(root,p),dest);m.sheets[id]='formal20260927/'+id;}
fs.writeFileSync('assets/scripts/formal/manifest.ts','// Imported source frame geometry; do not hand-edit.\nexport const MANIFEST:any='+JSON.stringify(m)+';\n');
let s=fs.readFileSync(root+'/preview.js','utf8');s=s.slice(s.indexOf('// ───────────────────────── 尺寸'),s.indexOf('// ───────────────────────── 自检报告'));
function replace(a,b){if(!s.includes(a))throw Error('Missing transform '+a.slice(0,80));s=s.replace(a,b);}
// Native drawing is injected. No HTML canvas, browser Image, demo buttons, or RAF survive this port.
s=s.slice(0,s.indexOf('// ───────────────────────── 素材'))+s.slice(s.indexOf('const has ='));
replace("const has = k => !!(k && M.frames[k] && IMG[M.frames[k].s]);","const has = k => !!(k && M.frames[k]);");
let start=s.indexOf('function drawFrame('),end=s.indexOf('// ───────────────────────── 文字');
s=s.slice(0,start)+`function drawFrame(k,x,y,h,o={}){return ctx.frame(k,x,y,h,o);}\n`+s.slice(end);
start=s.indexOf('const WEAPONS =');end=s.indexOf('const TIER_MAX');s=s.slice(0,start)+'const WEAPONS=WEAPON_DATA;\n'+s.slice(end);
replace("const PEOPLE = {zhao: '赵云', zhang: '张飞', guan: '关羽', lubu: '吕布', hua: '华佗'};",'');
replace('function heroFrames(w) {','function heroFrames(w) {\n  w=WEAPONS[w].family;');
start=s.indexOf('const DEMO_LINEUP =');end=s.indexOf('const SLOT_CN');s=s.slice(0,start)+'const TREASURE=TREASURES;\n'+s.slice(end);
replace('const L0 = DEMO_LINEUP;','const L0 = options.lineup;');
replace("stage: '第三关 · 下邳', progress: .18,","stage: '第'+(options.chapter+1)+'关 · '+CHAPTERS[options.chapter].place, progress: 0,");
replace("weapon: state === 'normal' ? 'spear' : (S ? S.weapon : 'spear'), tier: state === 'normal' ? 1 : (S ? S.tier : 2),","weapon:'spear',tier:1,");
replace("if (DEMO_LINEUP.allies.includes(o))","if (options.lineup.allies.includes(o))");
start=s.indexOf('function buildCourse()');end=s.indexOf('let EID =');s=s.slice(0,start)+`function buildCourse(){S.course=routeFor(options.chapter,options.lineup.weapons,options.lineup.treasurePool);S.courseLen=CHAPTERS[options.chapter].length;S.ci=0;S.lap=0;}\nconst SPAWN_Z=()=>Math.max(60,L.zP0*.82);\nfunction spawnCourse(){while(S.ci<S.course.length&&S.course[S.ci].d<=S.dist+SPAWN_Z()){const e=S.course[S.ci++];spawn(e,e.d);}}\n`+s.slice(end);
replace("if (e.type === 'squad') {","if(e.type==='officer'){S.ents.push({id:EID++,type:'enemy',elite:true,person:e.person,x:e.x,d,hp:12+options.chapter*2,walk:0,dead:0});}\n  else if (e.type === 'squad') {");
replace("S.stage = '第三关 · 下邳'; S.progress = 1;","S.progress=1;S.speed=0;S.state='general';");
replace("name: '吕布', weapon: '方天画戟', z: 17, hp: 100, trail: 100,","name: PEOPLE[CHAPTERS[options.chapter].boss], person:CHAPTERS[options.chapter].boss,weapon: bossWeapon(),z:17,hp:CHAPTERS[options.chapter].bossHP,max:CHAPTERS[options.chapter].bossHP,trail:CHAPTERS[options.chapter].bossHP,");
replace("if (S.ctrl !== 'manual') autopilot();",'');
replace("if (S.state !== 'general') S.progress = Math.min(.96, S.progress + dt * .004);","if(S.state!=='general'){S.progress=Math.min(1,S.dist/S.courseLen);if(S.dist>=S.courseLen+5)setupGeneral();}");
replace("if (S.routed !== undefined && (S.routed += dt) > 3) { const st = S.state, c = S.ctrl; setState(st); S.ctrl = c; return; }",'');
replace("logEv('run', '溃散 · 3 秒后重开');","logEv('run','战败，等待结算');");
replace('if (auto) auto(S.t);','');
start=s.indexOf('// 预览控制');end=s.indexOf('// ───────────────────────── 场景');s=s.slice(0,start)+s.slice(end);
replace("const W = WEAPONS[S.weapon], T = S.tier, D = TIER_DMG[T - 1];","const W=WEAPONS[S.weapon],family=W.family,T=S.tier,D=TIER_DMG[T-1]*(1+((options.lineup.weaponLevels[S.weapon]||1)-1)*TUNING.weaponLevelDamage)*(resonance(S.weapon).state==='pact'?1.5:1);");
s=s.replaceAll("S.weapon === 'spear' && crossed","family === 'spear' && crossed").replaceAll("S.weapon === 'guandao' && crossed","family === 'guandao' && crossed").replaceAll("S.weapon === 'shemao')","family === 'shemao')").replaceAll("S.weapon === 'huaji' &&","family === 'huaji' &&");
replace('const P = COMP[c.id], x = S.heroX + c.dx;','const P = COMP[c.id]||{k:"f2_spearWave",speed:50,range:30,hw:.1,dmg:2,h:.28}, x = S.heroX + c.dx;');
replace('S.resUsed[r.who] = false;','/* Once per owner per run; swapping never resets the special. */');
replace('S.waves.push({...o,','S.waves.push({source:activeSource,...o,');
replace('heroAttack(dt); if (companionsOn) companionsAttack(dt); troopVolley(dt);','activeSource="hero";heroAttack(dt); activeSource="companion";if(companionsOn)companionsAttack(dt);activeSource="troop";troopVolley(dt);');
replace("const targets = S.ents.filter(e => (e.type === 'enemy' && !e.dead) || (e.type === 'crate' && !e.open));","const targets=S.ents.filter(e=>(e.type==='enemy'&&!e.dead)||(e.type==='crate'&&!e.open)||(e.type==='gate'&&!e.passed&&e.d-S.dist>0&&e.d-S.dist<=TUNING.gateHitWindow)).sort((a,b)=>a.d-b.d);");
replace('w.hits.add(e.id); hitEnt(e, w.dmg, w);','w.hits.add(e.id);if(e.type==="gate")gateHit(e,w.source);else hitEnt(e,w.dmg,w);');
replace('e.hp -= dmg; e.hitT = .12;','const actual=Math.min(Math.max(0,e.hp),dmg);e.hp-=actual;e.hitT=.12;record("damage",w?.source||"troop",e.id,actual);');
replace('b.hp = Math.max(0, b.hp - dmg * mul * BOSS_DMG); b.hit = .12;','const actual=Math.min(b.hp,dmg*mul*BOSS_DMG);b.hp-=actual;record("damage","boss-hit",b.person,actual);b.hit=.12;');
replace('Math.ceil(b.hp / 25)','Math.ceil(b.hp / b.max * 4)');
replace("if (e.kind === 'grain') { addTroops(6);","if (e.kind === 'grain') { addTroops(S.slots.qi.id==='muniu'?9:6);");
replace('S.troops = Math.max(0, S.troops + n);','const before=S.troops;S.troops=Math.max(0,Math.min(999999,S.troops+n));record("troops",src||"event","team",S.troops-before);if(S.troops===0&&S.slots.qi.id==="qixing"&&!S.slots.qi.used){S.troops=5;S.slots.qi.used=true;record("revive","qixing","team",5);toast("七星灯 · 留住 5 人","gold");}');
replace('sp.pending.loss * SUPPORT.share','sp.pending.loss * (SUPPORT.share+(S.slots.dian.id==="qingnang"?.1:0))');
replace('supportStep(dt);','if(!S.ended)supportStep(dt);extraSupport(dt);');
replace('e.claim = .01; let v = e.val, extra = 0;','e.claim=.01;let v=e.val,extra=0;if(v<0&&S.slots.dian.id==="mengde"&&S.t>= (S.bookReady||0)){v=Math.ceil(v/2);S.bookReady=S.t+20;S.slots.dian.flash=.8;record("treasure","mengde",e.id,v);}');
replace("toast('吕布 力竭', 'gold');","toast(b.name+' 力竭','gold');");
replace("who: 'lubu', ch: '降'","who:b.person,ch:'降'");
replace("toast('收服 吕布 · 画戟共鸣可用', 'gold');","toast(b.name+' · '+(CHAPTERS[options.chapter].capture.includes(b.person)?'已收服':'胜利'),'gold');");
replace('const inBand = S.heroX > b.band[0] - .05 && S.heroX < b.band[1] + .05;','let inBand=S.heroX>b.band[0]-.05&&S.heroX<b.band[1]+.05;if(inBand&&S.slots.ma.id==="dilu"&&S.t>=(S.mountReady||0)){const edge=Math.min(Math.abs(S.heroX-b.band[0]),Math.abs(S.heroX-b.band[1]));if(edge<=.15){S.heroX=S.targetX=Math.max(-.82,Math.min(.82,Math.abs(S.heroX-b.band[0])<Math.abs(S.heroX-b.band[1])?b.band[0]-.16:b.band[1]+.16));inBand=S.heroX>b.band[0]-.05&&S.heroX<b.band[1]+.05;if(!inBand){S.mountReady=S.t+15;record("treasure","dilu","team",1);}}}');
// Replace raster slicing with native textured strips, no runtime canvas.
start=s.indexOf('let groundStrip =');end=s.indexOf('function shadow(');s=s.slice(0,start)+`function drawBackdrop(){ctx.backdrop(L,S);}\nfunction drawGround(){ctx.ground(L,S);}\n`+s.slice(end);
replace("const MC = document.createElement('canvas').getContext('2d');",'');replace('MC.font = `600 ${size}px ${fam}`; return MC.measureText(str).width;','return ctx.measure(str,size);');
start=s.indexOf('  // 状态栏 & 胶囊');end=s.indexOf('  // Row1',start);s=s.slice(0,start)+'  const cp=L.capsule;\n'+s.slice(end);
replace("text('吕', 33,","text(b.name[0], 33,");replace("done ? '已收服 · 画戟本主'", "done ? '交锋结束'");
replace('b.hp / 20 - i','b.hp / b.max * 5 - i');replace('b.trail / 20 - i','b.trail / b.max * 5 - i');
// Long weapon names and resonance occupy their own rows inside the same header footprint.
replace('Math.min(196, cp.x - 8 - chipX)','Math.max(220,cp.x-8-chipX)');
replace("text(str, chipX + chipW - 8, y1 + 16,","text(str, chipX + chipW - 8, y1 + 29,");
replace('text(Wp.label, chipX + 36, y1 + 16,','text(Wp.label, chipX + 36, y1 + 12,');
replace("hudRect('平台胶囊', cp.x, cp.y, cp.w, cp.h);",'');
// TypeScript wrapper keeps the audited imperative state machine scoped to one run.
const prefix=`// @ts-nocheck\n/** Port of approved preview state and projection to the real Cocos scene.\n * Native renderer is injected; no DOM, Canvas, demo lineup, autopilot or debug progression.\n * Source provenance: docs/BATTLE-PREVIEW-20260926/preview.js. */\nimport {WEAPON_DATA,PEOPLE,TREASURES,CHAPTERS,TUNING,routeFor} from './data';\nimport {MANIFEST} from './manifest';\nexport function createBattle(options){\nconst M=MANIFEST;let ctx=options.renderer;let activeSource='hero';const ledger=[];const totals={damage:0,gate:0,troops:0};\nfunction record(kind,source,target,amount){if(totals[kind]!==undefined)totals[kind]+=amount;ledger.push({tick:Math.round((S?.t||0)*60),kind,source,target,amount});if(ledger.length>1200)ledger.shift();}\nfunction bossWeapon(){const id=CHAPTERS[options.chapter].boss;const w=Object.values(WEAPON_DATA).find(w=>w.owner===id);return w?.label||'兵阵';}\nfunction gateHit(e,source){if(e.passed||e.d-S.dist<=0||e.d-S.dist>TUNING.gateHitWindow)return;e.val=Math.min(TUNING.gateSafetyLimit,e.val+TUNING.gateHitStep);e.flip=.15;record('gate',source,e.id,1);}\nfunction extraSupport(dt){if(S.ended||!S.support.id||S.support.id==='hua')return;const sp=S.support;sp.cd=Math.max(0,sp.cd-dt);if(sp.cd>0)return;sp.cd=12;sp.uses++;sp.flash=1;const id=sp.id;activeSource='support';if(['diao','xun','sunjian'].includes(id)){addTroops(2,'support');toast(PEOPLE[id]+' · 鼓舞 +2','good');}else{wave({k:'f2_bladeWave',x:S.heroX,z:.5,speed:40,range:40,hw:.5,pierce:6,dmg:4,h:.4,wide:2});toast(PEOPLE[id]+' · 策应','gold');}record('support',id,'team',1);}\n`;
const suffix=`\nL=layout({W:390,H:844,top:0,bottom:0});newWorld('normal');\nreturn {get state(){return S;},get ledger(){return ledger;},get totals(){return {...totals};},\n move(x){if(Number.isFinite(x))S.targetX=Math.max(-.82,Math.min(.82,x));},cancel(){S.targetX=S.heroX;},\n step(dt=DT){if(paused||S.ended)return;step(Math.min(DT,Math.max(0,dt)));},pause(value){paused=!!value;},\n render(sz){if(!ctx)return;L=layout(sz);L.capsule=sz.capsule||{x:L.W-8,y:0,w:0,h:0};const simSeed=seed;ctx.begin(L);render();ctx.end();seed=simSeed;},\n snapshot(){return {chapter:options.chapter,t:S.t,dist:S.dist,phase:S.ended?(S.troops>0?'won':'lost'):S.boss?'boss':'run',x:S.heroX,target:S.targetX,troops:S.troops,weapon:S.weapon,tier:S.tier,arms:S.arms,companions:S.companions.map(c=>c.id),support:{...S.support},slots:S.slots,boss:S.boss?{...S.boss}:null,entities:S.ents.map(e=>({...e,z:e.d-S.dist})),stats:S.stats,totals:{...totals},paused,runGot:[...S.runGot],log:[...S.log]};},\n get diagnostics(){return {texts:TXT,hud:HUDR,gate:GATE_STAT,used:Array.from(USED.entries())};}};\n}\n`;
fs.writeFileSync('assets/scripts/formal/battle.ts',prefix+s+suffix);
console.log('Imported native battle port and',Object.keys(m.frames).length,'frames');
