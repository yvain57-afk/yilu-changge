/** Fixed first candidate, calibrated after restoring the old-number lifecycle. No player-dependent scaling. */
export const COMBAT_TUNING = [
 [8,12,2.8,3.5,0,24,1.6,1],[8,12,3,3.5,0,24,1.6,1],
 [12,16,3.2,3.3,.12,32,1.45,1],[12,16,3.4,3.3,.12,32,1.45,1],
 [14,18,3.4,3.1,.12,38,1.4,2],[14,18,3.6,3.1,.12,38,1.4,2],
 [16,20,3.6,3,.14,42,1.3,2],[16,20,3.8,3,.14,42,1.3,2],
 [18,22,3.8,2.9,.14,48,1.25,2],[18,22,4,2.9,.14,48,1.25,2],
 [18,24,4,2.8,.16,50,1.25,2],[18,24,4.3,2.8,.16,50,1.25,2],
 [20,24,4.2,2.7,.16,54,1.2,2],[20,24,4.5,2.7,.16,54,1.2,2],
 [22,26,4.6,2.6,.18,56,1.2,2],[22,26,4.8,2.6,.18,56,1.2,2],
 [24,28,4.8,2.5,.18,60,1.15,3],[24,28,5,2.5,.18,60,1.15,3],
 [24,30,5,2.5,.20,64,1.1,3],[24,30,5.2,2.5,.20,64,1.1,3]
].map(([waveMin,waveMax,lightSpeed,waveInterval,archerShare,activeCap,minimumTelegraph,maxThreats])=>({waveMin,waveMax,lightSpeed,waveInterval,archerShare,activeCap,minimumTelegraph,maxThreats}));
export const combatTuningFor=(chapter:number)=>COMBAT_TUNING[Math.max(0,Math.min(19,chapter))];
