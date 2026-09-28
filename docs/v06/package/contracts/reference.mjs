/**
 * Small deterministic, engine-free reference contracts. NOT the game model.
 * Geometry input uses a common planar unit (X=2.5*normalizedX, Z=worldDepth).
 * Integrate equivalents into the real model and test that model separately.
 */
function finite(v, name) { if (!Number.isFinite(v)) throw new TypeError(`${name} must be finite`); return v; }
function whole(v, name) { if (!Number.isInteger(v) || v < 0) throw new RangeError(`${name} must be a non-negative integer`); return v; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function tierForKills(kills, thresholds=[30,80]) {
  whole(kills,'kills');
  if (thresholds.length!==2 || thresholds.some(v=>!Number.isInteger(v)||v<=0) || thresholds[0]>=thresholds[1]) throw new RangeError('invalid thresholds');
  return kills>=thresholds[1]?3:kills>=thresholds[0]?2:1;
}
export function newRunState() {
  return { choices:new Map(), exitConsumed:new Set(), kills:new Set(), contactIds:new Set(), recentContacts:[] };
}
export function commitFork(state, fork, previousZ, z, x) {
  [previousZ,z,x].forEach((v,i)=>finite(v,`coordinate ${i}`));
  if (state.choices.has(fork.id)) return state.choices.get(fork.id);
  if (!(previousZ<fork.commitAt && z>=fork.commitAt)) return null;
  const side=x<0?'left':'right';
  const mode=side===fork.safeSide?'safe':'hard';
  const choice=Object.freeze({forkId:fork.id,side,mode,reward:fork.routes[mode].exitReinforcements});
  state.choices.set(fork.id,choice); return choice;
}
export function grantExit(state, fork, previousZ, z, count, max=256) {
  whole(count,'count'); whole(max,'max');
  if (count>max) throw new RangeError('army already above limit');
  const c=state.choices.get(fork.id);
  if (!c || state.exitConsumed.has(fork.id) || !(previousZ<fork.endAt && z>=fork.endAt)) return {count,granted:0};
  state.exitConsumed.add(fork.id); // A failed crossing cannot be retried after external revival.
  if (count===0) return {count:0,granted:0};
  const result=Math.min(max,count+c.reward);return {count:result,granted:result-count};
}
export function recordKill(state, id, {wasAlive, isEnemy, disposition}) {
  if (typeof id!=='string'||!id) throw new TypeError('unique spawn id required');
  const previousTier=tierForKills(state.kills.size);
  if (!wasAlive||!isEnemy||disposition!=='killed'||state.kills.has(id)) return {credited:false,kills:state.kills.size,tier:previousTier,upgrades:[]};
  state.kills.add(id); const tier=tierForKills(state.kills.size);
  return {credited:true,kills:state.kills.size,tier,upgrades:Array.from({length:tier-previousTier},(_,i)=>previousTier+i+1)};
}
export function ordinaryBudget(config, weapon, tier, tactic) {
  if (![1,2,3].includes(tier)||!config.weapons[weapon]||!config.tactics[tactic]) throw new RangeError('invalid build');
  return config.weapons[weapon].ordinaryTargetBudgetByTier[tier-1]+(tactic==='guanzhen'?config.tactics.guanzhen.extraOrdinaryTargetsByTier[tier-1]:0);
}
export function newHitLedger(ordinary, special) {
  whole(ordinary,'ordinary'); whole(special,'special');
  return { hitIds:new Set(), ordinary, special, stopped:false };
}
/** Call AFTER the actual shape intersects a living target. It never selects a target. */
export function claimHit(ledger, id, category) {
  if (!['ordinary','special','boss','rock'].includes(category)) throw new RangeError('unknown category');
  if (ledger.stopped || ledger.hitIds.has(id)) return false;
  if (category==='rock') {ledger.stopped=true;return false;}
  const field=category==='ordinary'?'ordinary':'special';
  if (ledger[field]<=0) return false;
  ledger[field]--;ledger.hitIds.add(id);return true;
}
/** Sliding 12-tick normal-contact window, not a periodic bucket with boundary bursts. */
export function ordinaryContact(state, id, tick, count, window=12, limit=2) {
  whole(tick,'tick');whole(count,'count');whole(window,'window');whole(limit,'limit');
  if (state.contactIds.has(id) || count===0) return {count,loss:0};
  state.contactIds.add(id);
  state.recentContacts=state.recentContacts.filter(h=>h.tick>tick-window);
  const used=state.recentContacts.reduce((s,h)=>s+h.loss,0);
  const loss=Math.min(count,1,Math.max(0,limit-used));
  if (loss) state.recentContacts.push({tick,loss});
  return {count:count-loss,loss};
}
export function pointSegmentDistance(p,a,b) {
  const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
  const t=den===0?0:clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/den,0,1);
  return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);
}
export function capsuleContains(p,a,b,radius) {finite(radius,'radius');if(radius<0)throw new RangeError('radius');return pointSegmentDistance(p,a,b)<=radius+1e-10;}
/** Earliest collision of two linearly moving centers with a combined radius. */
export function sweptCircleTime(a0,a1,b0,b1,radius) {
  finite(radius,'radius');if(radius<0)throw new RangeError('radius');
  const px=a0.x-b0.x,pz=a0.z-b0.z;
  const vx=(a1.x-a0.x)-(b1.x-b0.x),vz=(a1.z-a0.z)-(b1.z-b0.z);
  const c=px*px+pz*pz-radius*radius;if(c<=0)return 0;
  const a=vx*vx+vz*vz;if(a<1e-15)return null;
  const b=2*(px*vx+pz*vz),disc=b*b-4*a*c;if(disc<0)return null;
  const t=(-b-Math.sqrt(disc))/(2*a);return t>=-1e-10&&t<=1+1e-10?clamp(t,0,1):null;
}
export function pointInSector(p,origin,headingRadians,innerRadius,outerRadius,halfAngleRadians) {
  const dx=p.x-origin.x,dz=p.z-origin.z,r=Math.hypot(dx,dz);
  if(r<innerRadius-1e-10||r>outerRadius+1e-10)return false;
  const angle=Math.atan2(dz,dx)-headingRadians;
  return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=halfAngleRadians+1e-10;
}
export function forkEndpoints(gapCenterNormalized) {
  finite(gapCenterNormalized,'gap center'); const c=clamp(gapCenterNormalized,-.55,.55);
  return [c-.30,c+.30];
}
/** Deterministic layout suggestion. Preserve count and genuine per-enemy identities. */
export function makeFormation(count, kind, seed=1, rowSpacing=.28) {
  whole(count,'count');if(count>64)throw new RangeError('too many enemies');
  if(!['scattered','columns','wide'].includes(kind))throw new RangeError('formation');
  let r=(seed>>>0)||1;const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
  const columns=kind==='columns'?3:kind==='wide'?8:5;
  return Array.from({length:count},(_,i)=>{
    const row=Math.floor(i/columns),col=i%columns;
    const spacing=kind==='columns'?.48:kind==='wide'?.185:.30;
    return {x:clamp((col-(columns-1)/2)*spacing+(kind==='scattered'?(random()-.5)*.07:0),-.82,.82),depthOffset:row*rowSpacing+(kind==='scattered'?random()*.06:0)};
  });
}
