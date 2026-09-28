'use strict';
/** Isolated harness. The functions below are transcribed from PR2 c6aa92c
 * assets/scripts/formal/battle.ts. Visual/audio/logging are stubs. No Cocos
 * runtime is present. These probes verify local transition logic, not a playthrough.
 */
const {PEOPLE}=require('./compiled/formal/data.js');
function harness(initial){
 let S=initial;
 const records=[],notices=[];
 const SUPPORT={cd:12,delay:1.0,share:.30},BOSS_DMG=.30;
 const TUNING={gateSafetyLimit:9999,gateHitStep:1,gateHitWindow:30};
 function record(...args){records.push(args);}
 function toast(...args){notices.push(args);}
 function logEv(...args){notices.push(args);}
 function fx(){}
 function openCrate(){throw Error('This probe does not exercise crate opening');}
 function gateHit(){throw Error('This probe does not exercise gate shooting');}
 function footXs(){const n=Math.min(12,Math.round(S.troops/3)),xs=[S.heroX,...S.companions.map(c=>S.heroX+c.dx)];for(let i=0;i<n;i++)xs.push(S.heroX+((i%4)-1.5)*.17+(Math.floor(i/4)%2)*.08);return xs.map(x=>wallSafeX(x));}
 function wallSafeX(x){const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4);return Math.max(-.95,Math.min(.95,wall?(wall.side>0?Math.min(x,-.10):Math.max(x,.10)):x));}
 function addTroops(n, src) {
  const before=S.troops;S.troops=Math.max(0,Math.min(999999,S.troops+n));record("troops",src||"event","team",S.troops-before);if(S.troops===0&&S.slots.qi.id==="qixing"&&!S.slots.qi.used){S.troops=5;S.slots.qi.used=true;record("revive","qixing","team",5);toast("七星灯 · 留住 5 人","gold");}
  const last = S.deltas[S.deltas.length - 1];
  if (last && last.t < .3 && Math.sign(last.v) === Math.sign(n) && !src) { last.v += n; last.t = 0; } else S.deltas.push({v: n, t: 0, src});
  // 华佗（支援位）：减员事件触发，冷却中不触发
  if (n < 0 && S.support.id === 'hua' && S.support.cd <= 0 && !S.support.pending) S.support.pending = {loss: -n, t: SUPPORT.delay};
  else if (n < 0 && S.support.pending) S.support.pending.loss += -n;
 }
 function supportStep(dt) {
  const sp = S.support; sp.cd = Math.max(0, sp.cd - dt);
  if (sp.pending) {
    sp.pending.t -= dt;
    if (sp.pending.t <= 0) {
      const back = Math.max(1, Math.round(sp.pending.loss * (SUPPORT.share+(S.slots.dian.id==="qingnang"?.1:0))));
      sp.pending = null; sp.cd = SUPPORT.cd; sp.uses++; S.stats.supportSaved += back; sp.flash = 1;
      addTroops(back, 'hua'); toast('华佗 · 救回伤兵 +' + back, 'good'); logEv('support', '华佗 +' + back);
    }
  }
  sp.flash = Math.max(0, (sp.flash || 0) - dt);
 }
 function updateEnts(dt) {
  for (const e of S.ents) {
    const z = e.d - S.dist;
    if(e.type==='cameo'&&!e.announced&&z<28){e.announced=true;const name=PEOPLE[e.person]||({xing:'邢道荣',chen:'陈应',yang:'杨龄'}[e.person]);toast(name+(e.person==='lubu'?'率亲兵观阵 · 此役不交手':' · 荆州旧将观阵'),'info');logEv('cameo',name+'观阵');}
    if (e.type === 'enemy') {
      if (!e.dead) {
        e.slow=Math.max(0,(e.slow||0)-dt);e.d -= dt * (e.elite && S.boss && S.boss.phase === 'yield' ? -3 : e.slow>0?1.1:2.2); e.walk += dt * 2.6; e.hitT = Math.max(0, (e.hitT || 0) - dt);
        if (z < .35 && z > -.4 && footXs().some(x=>Math.abs(e.x-x)<.10) && !(S.boss && S.boss.phase === 'yield')) { e.dead = .01; e.fallDir = e.x < S.heroX ? -1 : 1; addTroops(-1); S.redFlash = Math.max(S.redFlash, .25); logEv('contact', '敌兵接触 −1'); }
      } else e.dead += dt;
    }
    if (e.type === 'crate') { e.hitT = Math.max(0, e.hitT - dt); if (e.open) e.open += dt; }
    if (e.type === 'gate' && !e.passed && z <= 0) {
      e.passed = true;
      const inside = Math.abs(S.heroX - e.x) < .46;
      if (inside) {
        e.claim=.01;let v=e.val,extra=0;if(v<0&&S.slots.dian.id==="mengde"&&S.t>= (S.bookReady||0)){v=Math.ceil(v/2);S.bookReady=S.t+20;S.slots.dian.flash=.8;record("treasure","mengde",e.id,v);}
        // 太平要术（典籍）：通过援兵门时额外 +10%（至少 +1），调试初值
        if (v > 0 && S.slots.dian.id === 'taiping') { extra = Math.max(1, Math.round(v * .1)); S.stats.taiping += extra; S.slots.dian.flash = .8; S.slots.dian.n++; }
        addTroops(v, 'gate'); if (extra) addTroops(extra, 'taiping');
        S.stats.gates = (S.stats.gates || 0) + 1;
        toast(v > 0 ? `援兵 +${v}` + (extra ? ` · 太平要术 +${extra}` : '') : v < 0 ? `伏兵 ${v}` : '空营 · 无增减', v > 0 ? 'good' : v < 0 ? 'bad' : 'info');
        logEv('gate', (v > 0 ? '援兵门 +' : v < 0 ? '伏兵门 ' : '空营门 ') + v + (extra ? ' 太平 +' + extra : ''));
        if (v < 0) S.redFlash = .4;
      } else e.miss = .01;
    }
    if (e.claim) e.claim += dt;
    if (e.miss) e.miss += dt;
  }
  S.ents = S.ents.filter(e => {
    const z = e.d - S.dist;
    if (e.type === 'wall') return e.d + e.len - S.dist > -6;
    if (e.type === 'enemy' && e.dead > 1.0) return false;
    if (e.type === 'enemy' && e.elite && z > 40) return false;
    if (e.type === 'crate' && e.open > 1.2) return false;
    if (e.type === 'gate' && (e.claim > .6 || e.miss > .5)) return false;
    return z > -4;
  });
 }
 function hitEnt(e, dmg, w) {
  const actual=Math.min(Math.max(0,e.hp),dmg);e.hp-=actual;e.hitT=.12;record("damage",w?.source||"troop",e.id,actual);
  if(e.type==='enemy'&&e.hp>0&&w?.control){e.slow=.65;e.d+=1;record('control','zhenjun',e.id,.65);}
  const z = e.d - S.dist;
  fx('f2_hitFlash', e.x, z, e.type === 'crate' ? .3 : .22, .16);
  if (e.type === 'enemy' && e.hp <= 0 && !e.dead) { e.dead = .01; e.fallDir = e.x < S.heroX ? -1 : 1; }
  if (e.type === 'crate' && e.hp <= 0 && !e.open) { e.open = .01; openCrate(e); }
 }
 function bossDamage(dmg, x) {
  const b = S.boss; const mul = b.phase === 'rec' ? 2 : 1;
  const actual=Math.min(b.hp,dmg*mul*BOSS_DMG);b.hp-=actual;record("damage","boss-hit",b.person,actual);b.hit=.12;
  if (mul > 1 && dmg >= 2) b.bigHit = .22;
  fx('f2_hitFlash', x * .5, b.z - .2, .28 * mul, .16);
  if (mul > 1) S.fx.push({k: 'crit', x: x * .4, z: b.z, life: .5, t: 0, v: Math.round(dmg * mul)});
  const flags = Math.ceil(b.hp / b.max * 4);
  while (b.flags > flags) { b.flags--; b.flagFx.push({i: b.flags, t: 0}); logEv('boss', '靠旗断 余 ' + b.flags); }
 }
 function updateWaves(dt) {
  for (const w of S.waves) {
    w.prevZ = w.z; w.z += w.speed * dt; w.t += dt;
    if (w.snake) w.x = w.x0 + w.snake * SNAKE.amp * Math.sin((w.z - w.z0) * SNAKE.k);
    if (w.boss) continue;
    const targets=S.ents.filter(e=>(e.type==='enemy'&&!e.dead)||(e.type==='crate'&&!e.open)||(e.type==='gate'&&!e.passed&&e.d-S.dist>0&&e.d-S.dist<=TUNING.gateHitWindow)).sort((a,b)=>a.d-b.d);
    for (const e of targets) {
      if (w.hits.has(e.id)) continue;
      const ez = e.d - S.dist;
      const ehw = e.type === 'crate' ? .2 : .1;
      if (ez >= w.prevZ - .5 && ez <= w.z + .3 && Math.abs(e.x - w.x) < w.hw + ehw) {
        w.hits.add(e.id);if(e.type==="gate")gateHit(e,w.source);else hitEnt(e,w.dmg,w);
        if (w.hits.size >= w.pierce) { w.spent = true; break; }
      }
    }
    if (S.boss && !['spent', 'yield'].includes(S.boss.phase) && !w.hits.has('boss') && w.z >= S.boss.z - .5 && Math.abs(w.x) < w.hw + .35) {
      w.hits.add('boss'); bossDamage(w.dmg, w.x);
      if (w.pierce < 99) w.spent = true;
    }
  }
  S.waves = S.waves.filter(w => !w.spent && (w.boss || w.z - w.z0 < w.range));
 }
 return {state:S,records,notices,updateEnts,addTroops,supportStep,updateWaves};
}
module.exports={harness};
