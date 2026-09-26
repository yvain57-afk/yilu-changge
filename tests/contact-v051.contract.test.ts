/**
 * Focused v0.5.1 regression contracts. Copy into the game's tests/ directory.
 * These are explicitly ISOLATED fixtures, not natural gameplay:
 * boss phase is initialized, boss HP is raised and hostile loss is set to zero
 * so the short test can observe repeated contact without terminating.
 * All damage/attack updates use the real Journey implementation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Journey, STEP, type Level, type Feedback } from '../assets/scripts/core/model';
import { V07_LEVELS as LEVELS } from '../assets/scripts/core/levels';
import type { PlayerWeapon, CompanionId } from '../assets/scripts/core/weapons';

function sample(index: number, weapon: PlayerWeapon, companion: CompanionId | null = null, x = 0) {
  const original = LEVELS[index];
  assert.ok(original, 'Required current campaign level is missing');
  const fixture: Level = {
    ...original,
    start: companion ? 2 : 1,
    bossHP: 1000000,
    rows: [], obstacles: [], eliteIds: [],
    bossAttacks: original.bossAttacks.map(a => ({ ...a, loss: 0 })),
  };
  const game = new Journey(fixture, { weapon, companion });
  game.phase = 'boss';
  game.x = game.target = x;
  const events: Feedback[] = [];
  for (let tick = 0; tick < 12 * 60; tick++) {
    game.advance(STEP);
    events.push(...game.drainFeedback());
  }
  return { game, events };
}

for (const index of [0, 1, 2]) {
  test(`v051 blade reaches Boss ${index + 1} by MELEE, not only wave`, () => {
    const { events } = sample(index, 'blade');
    assert.ok(events.some(e => e.kind === 'meleeHit' && e.sourceId === 'hero'
      && e.weaponId === 'blade' && e.targetId === 'boss' && e.amount > 0),
      'A successful wave or an overall victory cannot substitute for blade contact');
  });
}

for (const companion of ['xing_daorong', 'zhao_yun_guest'] as const) {
  test(`v051 ${companion} can physically contact the second Boss`, () => {
    const { game, events } = sample(1, 'blade', companion);
    assert.equal(game.companion, companion);
    assert.ok(events.some(e => e.kind === 'meleeHit' && e.sourceId === companion
      && e.targetId === 'boss' && e.amount > 0),
      'The named companion needs a model-reachable contact, not only an outgoing wave');
  });
}

test('v051 off-axis blade misses; do not globally widen the arena to pass', () => {
  const { events } = sample(1, 'blade', null, 0.91);
  assert.equal(events.filter(e => e.kind === 'meleeHit' && e.sourceId === 'hero'
    && e.targetId === 'boss').length, 0);
});

test('v051 contact and wave retain one per-source per-attack target ledger', () => {
  const { events } = sample(2, 'blade', 'xing_daorong');
  const damageEvents = events.filter(e => e.kind === 'meleeHit' || e.kind === 'waveHit');
  assert.ok(damageEvents.length > 0);
  const keys = damageEvents.map(e => `${e.sourceId}:${e.attackId}:${e.targetId}`);
  assert.equal(new Set(keys).size, keys.length, 'Contact and wave double-counted damage');
});

test('v051 pause still freezes approach, contact cycle and traveling waves', () => {
  const { game } = sample(1, 'blade', 'xing_daorong');
  game.pause();
  const snapshot = () => JSON.stringify({
    z: game.z, x: game.x, depth: game.bossDepth, bossTicks: game.bossTicks,
    hp: game.bossHP, elapsed: game.elapsed, hero: game.melee,
    companion: game.companionAttack, waves: game.waves, warnings: game.warnings,
  });
  const before = snapshot();
  for (let tick = 0; tick < 120; tick++) game.advance(STEP);
  assert.equal(snapshot(), before);
});
