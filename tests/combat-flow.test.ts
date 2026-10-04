import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import ts from 'typescript';
import {createBattle as currentBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {ENEMY_PROFILES} from '../assets/scripts/formal/EnemyProfiles';
import {footAtRisk, formationFeet, formationSafety, type RiskFootprint} from '../assets/scripts/formal/CombatFootprint';

// A saved source can reproduce the regression while the working tree is repaired.
// Its relative imports resolve at the original formal source directory, not evidence/.
const baseline = process.env.COMBAT_FLOW_BASELINE;
function savedBattle() {
  if (!baseline) return currentBattle;
  const source = readFileSync(resolve(baseline), 'utf8');
  console.log('combat-flow baseline SHA256 ' + createHash('sha256').update(source).digest('hex'));
  const filename = resolve('assets/scripts/formal/battle.ts');
  const module = {exports: {} as any};
  const compiled = ts.transpileModule(source, {fileName: filename, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  }}).outputText;
  new Function('require', 'module', 'exports', compiled)(createRequire(filename), module, module.exports);
  return module.exports.createBattle as typeof currentBattle;
}
const createBattle = savedBattle();

function fixture(kind?: string, extra: {speed?: number; troops?: number; companions?: string[]} = {}) {
  const store = new FormalStore({getItem: () => null, setItem: () => {}});
  const battle = createBattle({chapter: 16, seed: 71, diagnostic: true, noFriendlyFire: true,
    lineup: {...store.loadout(), companions: extra.companions || [], support: null}});
  const state = battle.state;
  state.course = []; state.courseLen = 1e8; state.ci = 0;
  state.speed = extra.speed ?? 4.75;
  state.troops = extra.troops ?? 30; state.heroX = state.targetX = 0;
  if (kind) state.ents = [{id: 991, waveId: 'flow-fixture', type: 'enemy', enemyKind: kind,
    x: 0, d: 30, hp: 1e5, dead: 0, phase: 'approach', pt: 0, walk: 0, attackN: 0}];
  return battle;
}
function until(battle: any, predicate: () => boolean, max = 1800) {
  for (let i = 0; i < max && !predicate() && !battle.state.ended; i++) battle.step();
  assert.ok(predicate(), 'expected state was not reached within ' + max + ' ticks');
}
function ticks(battle: any, count: number) {
  for (let i = 0; i < count && !battle.state.ended; i++) battle.step();
}

test('ordinary enemies never gain world distance just because the runner advances', () => {
  for (const kind of Object.keys(ENEMY_PROFILES)) {
    const battle = fixture(kind, {troops: 300}), state = battle.state;
    let previous = state.ents[0].d;
    for (let i = 0; i < 1200; i++) {
      battle.step(); const enemy = state.ents.find(e => e.id === 991);
      if (!enemy) break;
      assert.ok(enemy.d <= previous + 1e-8,
        JSON.stringify({kind, phase: enemy.phase, t: state.t, previousWorldD: previous,
          worldD: enemy.d, cameraD: state.dist, z: enemy.d - state.dist}));
      previous = enemy.d;
    }
  }
});

test('a crowded firing queue keeps moving through the world and eventually passes the rear boundary', () => {
  const battle = fixture(undefined, {troops: 300}), state = battle.state;
  state.course = [{type: 'squad', enemyKind: 'archer', n: 40, d: 40, x: 0, formation: 'line'}];
  const worldPositions = new Map<number, number>();
  let gainedWorldDistance: any = null;
  for (let i = 0; i < 1800 && !state.ended; i++) {
    battle.step();
    for (const enemy of state.ents.filter(e => e.type === 'enemy')) {
      const previous = worldPositions.get(enemy.id);
      if (previous !== undefined && enemy.d > previous + 1e-8 && !gainedWorldDistance) {
        gainedWorldDistance = {id: enemy.id, phase: enemy.phase, t: state.t,
          previous, worldD: enemy.d, z: enemy.d - state.dist};
      }
      worldPositions.set(enemy.id, enemy.d);
    }
  }
  const result = battle.snapshot();
  assert.ok(result.director.deferred > 0, 'fixture must actually saturate the firing budget');
  assert.equal(gainedWorldDistance, null, 'queued enemies followed the runner: ' + JSON.stringify(gainedWorldDistance));
  assert.equal(result.waveAccounting[0].spawned, 40);
  assert.equal(result.pendingSquads.length, 0);
  assert.equal(result.entities.filter(e => e.type === 'enemy' && !e.dead).length, 0);
  for (const life of result.enemyLifecycle) {
    assert.ok(life.events.some(e => e.stage === 'visible'), String(life.enemyId));
    assert.ok(life.events.some(e => e.stage === 'despawnReason' && e.reason === 'passed-rear-boundary'),
      'a living enemy must pass out of view with an explicit reason: ' + life.enemyId);
  }
});

test('left/right input does not drag a winding-up enemy or retarget its locked arrow', () => {
  const battle = fixture('archer'), state = battle.state;
  until(battle, () => state.ents.some(e => e.phase === 'warn'));
  const enemy = state.ents.find(e => e.id === 991), worldD = enemy.d, x = enemy.x;
  const aim = {...enemy.lockedTarget};
  for (let i = 0; i < 90 && !state.hostileShots.length; i++) {
    battle.move(i < 25 ? -.68 : .68); battle.step();
    assert.equal(enemy.x, x, 'aim changes must not move the archer sideways');
    assert.ok(enemy.d <= worldD + 1e-8, 'aim changes must not carry the archer with the camera');
    assert.deepEqual(enemy.lockedTarget, aim);
  }
  assert.ok(state.hostileShots.length, 'archer actually released its committed arrow');
  assert.equal(state.hostileShots[0].lockedTarget.x, aim.x);
});

test('an already released arrow survives its firing source death and keeps its original aim', () => {
  const battle = fixture('archer'), state = battle.state;
  until(battle, () => state.hostileShots.length > 0);
  const shot = state.hostileShots[0], origin = {...shot.origin}, aim = {...shot.lockedTarget};
  const enemy = state.ents.find(e => e.id === shot.sourceEnemyId);
  enemy.hp = 0; enemy.dead = .01; battle.move(.68);
  const priorTime = shot.t;
  battle.step();
  assert.ok(shot.t > priorTime, 'arrow flight did not stop with source death');
  assert.deepEqual(shot.origin, origin); assert.deepEqual(shot.lockedTarget, aim);
  assert.ok(battle.snapshot().telegraphs.some(t => t.id === shot.attackId && t.released));
  until(battle, () => shot.done, 120);
  assert.ok(state.damageHistory.filter(hit => hit.attackId === shot.attackId).length <= 1);
});

test('an archer killed during preparation cannot release a ghost arrow', () => {
  const battle = fixture('archer'), state = battle.state;
  until(battle, () => state.ents.some(e => e.phase === 'warn'));
  const enemy = state.ents.find(e => e.id === 991);
  enemy.hp = 0; enemy.dead = .01; ticks(battle, 180);
  assert.equal(state.hostileShots.length, 0);
  assert.ok(!battle.snapshot().enemyLifecycle[0].events.some(e => e.stage === 'release'));
  assert.ok(!battle.snapshot().telegraphs.some(t => t.source === 'enemy:991'));
});

test('a cavalry charge crosses the rear ranks without stopping at the commander and hits once', () => {
  const battle = fixture('cavalry'), state = battle.state;
  until(battle, () => state.hostileShots.some(s => s.kind === 'cavalry'));
  const shot = state.hostileShots.find(s => s.kind === 'cavalry');
  const rear = Math.min(...battle.snapshot().teamFeet.map(p => p.z));
  assert.ok(shot.lockedTarget.z < rear - .36,
    JSON.stringify({chargeEnd: shot.lockedTarget.z, rearmostTeamFoot: rear}));
  until(battle, () => !state.ents.some(e => e.id === 991), 1200);
  // The trajectory itself, rather than a removal at z=-.3, must pass the formation.
  assert.ok(shot.z < rear - .36, 'charge stopped before crossing the rear rank');
  const life = battle.snapshot().enemyLifecycle.find(e => e.enemyId === 991);
  assert.equal(life.events.filter(e => e.stage === 'release').length, 1);
  assert.ok(life.events.some(e => e.stage === 'despawnReason' && e.reason === 'passed-rear-boundary'));
  assert.ok(state.damageHistory.filter(hit => hit.attackId === shot.attackId).length <= 1);
});

test('melee preparation anticipates closing speed and only causes losses at real foot contact', () => {
  for (const kind of ['light', 'guard', 'shield', 'banner']) {
    const battle = fixture(kind), state = battle.state, profile = ENEMY_PROFILES[kind];
    const reach = kind === 'light' || kind === 'banner' ? .8 : 1.15;
    let firstWarning: any = null;
    const impacts: any[] = [];
    for (let i = 0; i < 1200; i++) {
      const count = state.damageHistory.length;
      battle.step();
      const enemy = state.ents.find(e => e.id === 991);
      if (enemy?.phase === 'warn' && !firstWarning) {
        firstWarning = {z: enemy.d - state.dist, t: state.t, execute: enemy.telegraph.execute};
        const front = Math.max(...battle.snapshot().teamFeet.map(p => p.z));
        assert.ok(firstWarning.z > front + reach + .2,
          kind + ' must prepare before arriving at the moving formation: ' + JSON.stringify(firstWarning));
      }
      for (const hit of state.damageHistory.slice(count).filter(h => h.enemyId === 991 && h.actual > 0)) {
        impacts.push(hit);
        assert.equal(hit.raw, profile.damage * (kind === 'banner' ? 1.15 : 1),
          'movement repair must preserve base damage and the existing banner aura');
        assert.ok(battle.snapshot().teamFeet.some(p => Math.abs(p.x - hit.impactX) < profile.width + .11
          && Math.abs(p.z - hit.impactZ) <= reach + 1e-8),
        kind + ' dealt damage without a foot in its real reach: ' + JSON.stringify(hit));
      }
      if (!enemy) break;
    }
    assert.ok(firstWarning, kind + ' never prepared an attack');
    assert.ok(impacts.length > 0, kind + ' never reached the stationary formation after preparing');
  }
});

test('melee can meet a stationary formation while the march is moving or stopped, with zero or two companions', () => {
  for (const speed of [0, 4.75]) for (const companions of [[], ['lubu', 'machao']]) {
    for (const kind of ['light', 'guard', 'shield', 'banner']) {
      const battle = fixture(kind, {speed, companions}), state = battle.state;
      // Start visibly nearby; even the slow banner can approach during a stopped march.
      // One side of the road is deliberately left as a reachable escape route.
      // With two forward companions, x=0 is not a valid always-fire fixture.
      state.heroX = state.targetX = -.45;
      state.ents[0].x = -.45; state.ents[0].d = 12;
      const reach = kind === 'light' || kind === 'banner' ? .8 : 1.15;
      const profile = ENEMY_PROFILES[kind];
      for (let i = 0; i < 1800 && state.ents.some(e => e.id === 991); i++) {
        const count = state.damageHistory.length;
        battle.step();
        for (const hit of state.damageHistory.slice(count).filter(h => h.enemyId === 991 && h.actual > 0)) {
          assert.ok(battle.snapshot().teamFeet.some(p => Math.abs(p.x - hit.impactX) < profile.width + .11
            && Math.abs(p.z - hit.impactZ) <= reach + 1e-8), JSON.stringify({speed, companions, kind, hit}));
        }
      }
      assert.ok(state.damageHistory.some(h => h.enemyId === 991 && h.actual > 0),
        'approaching melee never met the feet: ' + JSON.stringify({speed, companions, kind,
          lifecycle: battle.snapshot().enemyLifecycle}));
    }
  }
});

test('an unsafe middle lane encounter defers without forced damage and passes fully behind the formation', () => {
  const battle = fixture('light', {speed: 4.75, companions: ['lubu', 'machao']}), state = battle.state;
  state.ents[0].d = 12;
  ticks(battle, 900);
  const result = battle.snapshot(), life = result.enemyLifecycle.find(e => e.enemyId === 991);
  assert.ok(result.director.deferred > 0, 'middle lane must actually have no whole-formation escape');
  assert.ok(life.events.some(e => e.stage === 'delayed' && e.reason === 'no-reachable-safe-footprint'));
  assert.ok(!life.events.some(e => e.stage === 'release'), 'unsafe warning must not be forced through');
  assert.ok(!state.damageHistory.some(h => h.enemyId === 991 && h.actual > 0));
  assert.ok(!state.ents.some(e => e.id === 991));
  assert.ok(life.events.some(e => e.stage === 'despawnReason' && e.reason === 'passed-rear-boundary'));
});

test('both wall sides keep real melee contact or an explicit safety deferral, without pinning enemies to the camera', () => {
  for (const side of [-1, 1]) for (const speed of [0, 4.75]) for (const companions of [[], ['lubu', 'machao']]) {
    const battle = fixture('light', {speed, companions}), state = battle.state;
    state.heroX = state.targetX = -side * .42;
    const enemy = state.ents[0]; enemy.x = state.heroX; enemy.d = 12;
    state.ents.push({id: 990, type: 'wall', d: 0, len: 200, x: 0, side});
    let previous = enemy.d;
    for (let i = 0; i < 1500 && state.ents.includes(enemy); i++) {
      const count = state.damageHistory.length;
      battle.step();
      assert.ok(enemy.d <= previous + 1e-8); previous = enemy.d;
      for (const hit of state.damageHistory.slice(count).filter(h => h.enemyId === 991 && h.actual > 0)) {
        assert.ok(battle.snapshot().teamFeet.some(p => Math.abs(p.x - hit.impactX) < .21
          && Math.abs(p.z - hit.impactZ) <= .8 + 1e-8), JSON.stringify({side, speed, companions, hit}));
      }
    }
    assert.ok(!state.ents.includes(enemy), JSON.stringify({side, speed, companions}));
    const result = battle.snapshot(), life = result.enemyLifecycle.find(e => e.enemyId === 991);
    const hit = state.damageHistory.some(h => h.enemyId === 991 && h.actual > 0);
    assert.ok(hit || (result.director.deferred > 0 && life.events.some(e => e.stage === 'delayed')),
      'no contact and no genuine safety deferral: ' + JSON.stringify({side, speed, companions, life}));
  }
});

test('a moving arrow source risk includes every intermediate release ray but remains a local corridor', () => {
  for (const direction of [-1, 1]) {
    const risk: RiskFootprint = {shape: 'segment', bands: [[-.3, .3]], zMin: -.66, zMax: 20.36,
      width: .09, origin: {x: direction * .65, z: 20}, originEnd: {x: direction * .65, z: 4},
      target: {x: -direction * .4, z: -.3}, wallSides: [0]};
    for (let i = 0; i <= 20; i++) {
      const source = {x: risk.origin!.x, z: 20 - 16 * i / 20};
      const actual = {...risk, origin: source, originEnd: undefined};
      for (let j = 0; j <= 30; j++) for (const dx of [-.08, 0, .08]) for (const dz of [-.3, 0, .3]) {
        const u = j / 30, point = {x: source.x + (risk.target!.x - source.x) * u + dx,
          z: source.z + (risk.target!.z - source.z) * u + dz};
        if (footAtRisk(point, actual)) assert.ok(footAtRisk(point, risk), JSON.stringify({source, point, direction}));
      }
    }
    assert.ok(!footAtRisk({x: direction * -.85, z: 12}, risk), 'envelope must not fill the whole road');
    assert.ok(!footAtRisk({x: 0, z: -2}, risk), 'arrow must not threaten rear ranks it cannot reach');
  }
  const envelope: RiskFootprint = {shape: 'segment', bands: [[-.8, .8]], zMin: -.66, zMax: 10.36,
    width: .09, origin: {x: .6, z: 10}, originEnd: {x: .6, z: 4}, target: {x: -.6, z: -.3}, wallSides: [0]};
  const intermediateSource = {x: .6, z: 4.7};
  assert.ok(!footAtRisk(intermediateSource, {...envelope, originEnd: undefined}));
  assert.ok(!footAtRisk(intermediateSource, {...envelope, origin: envelope.originEnd, originEnd: undefined}));
  assert.ok(footAtRisk(intermediateSource, envelope), 'checking only the two end rays loses an intermediate source');
});

test('every promised safe formation also avoids intermediate diagonal release rays', () => {
  const risk: RiskFootprint = {shape: 'segment', bands: [[-.19, .19]], zMin: -.66, zMax: 20.36,
    width: .09, origin: {x: .7, z: 20}, originEnd: {x: .7, z: 5}, target: {x: 0, z: -.3}, wallSides: [0]};
  const proof = formationSafety(0, 0, 1.15, 3, [-.68, .68], 30, 2, [risk]);
  assert.ok(proof.safe, 'a narrow diagonal arrow should leave a reachable safe position');
  for (const [lo, hi] of proof.intervals) for (const x of [lo, (lo + hi) / 2, hi]) {
    for (let i = 0; i <= 30; i++) {
      const actual = {...risk, origin: {x: .7, z: 20 - 15 * i / 30}, originEnd: undefined};
      assert.ok(formationFeet(30, 2, x).every(p => !footAtRisk(p, actual)), JSON.stringify({x, source: actual.origin}));
    }
  }
});
