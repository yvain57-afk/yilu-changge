/** Pure IMPLEMENTATION-DEFAULT reference helpers; not Last War source and not a Cocos replacement. */
function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
function integer(value, name, min = 0) {
  if (!Number.isSafeInteger(value) || value < min) throw new TypeError(`${name} must be an integer >= ${min}`);
  return value;
}
function assertDamage(damage) {
  finite(damage, 'damage');
  if (damage < 0) throw new RangeError('damage must be nonnegative');
}
export function createGate({ id, value, damagePerPoint = 2, maxPositive = 64, mutable = true }) {
  if (!id || typeof id !== 'string') throw new TypeError('gate.id required');
  integer(value, 'value', -Number.MAX_SAFE_INTEGER);
  integer(maxPositive, 'maxPositive'); finite(damagePerPoint, 'damagePerPoint');
  if (damagePerPoint <= 0) throw new RangeError('damagePerPoint must be positive');
  return { id, value, damagePerPoint, maxPositive, mutable, progress: 0, consumed: false, hitKeys: new Set() };
}
export function damageGate(gate, damage, hitKey) {
  assertDamage(damage);
  if (!hitKey) throw new TypeError('stable hitKey required');
  if (!gate.mutable || gate.consumed || gate.hitKeys.has(hitKey)) return 0;
  gate.hitKeys.add(hitKey);
  if (damage === 0 || gate.value >= gate.maxPositive) return 0;
  gate.progress += damage;
  const points = Math.floor((gate.progress + 1e-9) / gate.damagePerPoint);
  const gain = Math.min(points, gate.maxPositive - gate.value);
  gate.value += gain;
  gate.progress = gate.value === gate.maxPositive ? 0 : Math.max(0, gate.progress - points * gate.damagePerPoint);
  return gain;
}
export function gateLabel(gate) { return gate.value >= 0 ? `+${gate.value}` : String(gate.value); }
export function gateIsSafe(gate) { return gate.value >= 0; }
/** Caller must establish true contact; no row mutex. Later events must stop once lost. */
export function consumeGate(gate, count, cap = 256) {
  integer(count, 'count'); integer(cap, 'cap', 1);
  if (count > cap) throw new RangeError('count exceeds cap');
  if (gate.consumed || count === 0) return { count, delta: 0, consumed: false, lost: count === 0 };
  gate.consumed = true;
  const next = Math.max(0, Math.min(cap, count + gate.value));
  return { count: next, delta: next - count, consumed: true, lost: next === 0 };
}
export function createCrate({ id, hp, reward }) {
  finite(hp, 'hp'); if (hp <= 0 || !id || !reward) throw new TypeError('valid crate required');
  return { id, hp, maxHp: hp, reward: structuredClone(reward), claimed: false, hitKeys: new Set() };
}
export function damageCrate(crate, damage, hitKey) {
  assertDamage(damage); if (!hitKey) throw new TypeError('stable hitKey required');
  if (crate.claimed || crate.hitKeys.has(hitKey)) return { actualDamage: 0, reward: null };
  crate.hitKeys.add(hitKey);
  const actualDamage = Math.min(crate.hp, damage); crate.hp -= actualDamage;
  if (crate.hp <= 1e-9) { crate.hp = 0; crate.claimed = true; return { actualDamage, reward: structuredClone(crate.reward) }; }
  return { actualDamage, reward: null };
}
export function equipmentStage(current, rewardStage) {
  integer(current, 'current'); integer(rewardStage, 'rewardStage');
  if (current > 2 || rewardStage > 2) throw new RangeError('unknown equipment stage');
  return Math.max(current, rewardStage);
}
export function chainTokens(ownerId, count, x, firstZ, spacing = .5) {
  integer(count, 'chain count', 1);
  if (count > 12 || !ownerId || !Number.isFinite(x) || !Number.isFinite(firstZ) || spacing <= 0) throw new RangeError('invalid chain config');
  return Array.from({ length: count }, (_, i) => ({ ...createGate({ id: `${ownerId}:token:${i}`, value: 1, mutable: false }), x, z: firstZ + i * spacing }));
}
/** Instantaneous exact circle/rectangle union check. Cocos integration also needs swept contact. */
export function feetOverlapGate(feet, rect) {
  return feet.some(p => {
    const x = Math.max(rect.left, Math.min(p.x, rect.right));
    const z = Math.max(rect.back, Math.min(p.z, rect.front));
    return (p.x - x) ** 2 + (p.z - z) ** 2 <= p.radius ** 2 + 1e-12;
  });
}
/** Unit weights preserve total fire budget with capped visible representations. */
export function emitterWeights(totalCount, maxVisible = 48, companion = false) {
  integer(totalCount, 'totalCount'); integer(maxVisible, 'maxVisible', 2);
  if (totalCount > 256) throw new RangeError('prototype cap exceeded');
  if (!totalCount) return [];
  const visible = Math.min(totalCount, maxVisible), special = Math.min(visible, companion ? 2 : 1);
  const result = Array.from({ length: special }, (_, i) => ({ role: i === 0 ? 'hero' : 'companion', weight: 1 }));
  const n = visible - special, mass = totalCount - special;
  if (!n) return result;
  const base = Math.floor(mass / n), extras = mass % n;
  for (let i = 0; i < n; i++) result.push({ role: 'soldier', weight: base + (i < extras ? 1 : 0) });
  return result;
}
export function chooseNearest(candidates) {
  const valid = candidates.filter(c => Number.isFinite(c.t) && c.t >= 0 && c.t <= 1);
  return valid.sort((a, b) => a.t - b.t || String(a.id).localeCompare(String(b.id)))[0] ?? null;
}
export function snapshotShot(shot) {
  for (const key of ['x', 'z', 'damage', 'stage', 'tick']) finite(shot[key], key);
  return Object.freeze({ ...shot });
}
