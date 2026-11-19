import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';

function quietBattle() {
  const store = new FormalStore({getItem: () => null, setItem: () => {}});
  const battle = createBattle({chapter: 0, lineup: store.loadout(), seed: 71});
  const state = battle.state;
  state.course = []; state.ents = []; state.speed = 0;
  state.volleyT = 1e6; state.show = 1e6;
  return {battle, state};
}

function wave(state: any, values: any = {}) {
  state.waves.push({projectileId: 1, attackId: 'test', source: 'hero', weaponId: 'spear',
    x: 0, x0: 0, z: 1, z0: 1, speed: 60, vx: 0, range: 5, t: 0,
    hits: new Set(), pierce: 1, dmg: 1, hw: .01, ...values});
}

function crate(id: number, x: number, d: number) {
  return {id, type: 'crate', kind: 'grain', x, d, hp: 10, max: 10, open: 0, hitT: 0};
}

test('practice milestones stay unique during long encounters and include every crossed segment', () => {
  const {battle, state} = quietBattle();
  for (const [fraction, expected] of [[.249, []], [.25, [1]], [.5, [1, 2]], [.9, [1, 2, 3]]] as const) {
    state.dist = state.courseLen * fraction;
    for (let i = 0; i < 600; i++) battle.step();
    assert.equal(battle.snapshot().progressEligible.length, expected.length);
    assert.deepEqual(battle.snapshot().progressEligible, expected);
  }
  state.dist = state.courseLen + 6;
  battle.step();
  for (let i = 0; i < 120; i++) battle.step();
  assert.deepEqual(battle.snapshot().progressEligible, [1, 2, 3, 4]);
});

test('a diagonal projectile uses its real range endpoint for collision', () => {
  const {battle, state} = quietBattle();
  // Full step would end at (1, 2); actual range ends halfway at (.5, 1.5).
  // The far-right crate is outside the entire in-range segment.
  const missed = crate(1, .9, 1.8);
  state.ents = [missed];
  wave(state, {vx: 60, range: .5});
  battle.step();
  assert.equal(missed.hp, 10);
  assert.equal(battle.totals.damage, 0);
  assert.equal(state.waves.length, 0);
});

test('a diagonal projectile hits when it enters the target from the side', () => {
  const {battle, state} = quietBattle();
  // At the front of the crate the shot is still left of it, but crosses the
  // hit rectangle before leaving its depth interval.
  const hit = crate(1, .6, 1.5);
  state.ents = [hit];
  wave(state, {vx: 60});
  battle.step();
  assert.equal(hit.hp, 9);
  assert.equal(battle.totals.damage, 1);
});

test('a target at the exact range endpoint is hit if the segment reaches its interior width', () => {
  for (const direction of [-1, 1]) {
    const {battle, state} = quietBattle();
    const hit = crate(1, direction * .5, 1.8);
    state.ents = [hit];
    wave(state, {vx: direction * 60, range: .5});
    battle.step();
    assert.equal(hit.hp, 9);
  }
});

test('pierce budget selects the first actual intersection and skips expired targets', () => {
  const {battle, state} = quietBattle();
  const near = crate(2, 0, 1.6), far = crate(1, 0, 1.9);
  state.ents = [far, near, {...crate(3, 0, 1.3), open: .01}];
  wave(state);
  battle.step();
  assert.equal(near.hp, 9);
  assert.equal(far.hp, 10);
  assert.deepEqual(battle.ledger.filter(e => e.kind === 'damage').map(e => e.target), [2]);
});
