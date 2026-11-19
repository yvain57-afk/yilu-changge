/** Fixed chapter curves. The opening leaves room to earn upgrades before the final ranks. */
export const COMBAT_TUNING = [
 [5,10,2.4,3.8,0,24,1.6,1],[6,11,2.6,3.7,0,24,1.6,1],
 [6,12,2.8,3.6,.10,28,1.6,1],[7,14,3,3.5,.10,30,1.55,1],
 [8,16,3.2,3.4,.12,38,1.5,2],[8,17,3.3,3.4,.12,38,1.45,2],
 [9,18,3.4,3.3,.12,42,1.4,2],[9,19,3.5,3.3,.12,42,1.35,2],
 [10,20,3.6,3.2,.14,48,1.3,2],[10,21,3.7,3.2,.14,48,1.3,2],
 [11,22,3.8,3.1,.14,50,1.3,2],[11,23,4,3.1,.14,50,1.3,2],
 [12,24,4.1,3,.16,54,1.25,2],[12,25,4.3,3,.16,54,1.25,2],
 [13,26,4.4,2.9,.16,56,1.25,2],[13,27,4.6,2.9,.16,56,1.25,2],
 [14,28,4.7,2.8,.18,60,1.2,3],[14,29,4.9,2.8,.18,60,1.2,3],
 [15,30,5,2.7,.18,64,1.15,3],[15,32,5.2,2.7,.18,64,1.15,3]
].map(([waveMin,waveMax,lightSpeed,waveInterval,archerShare,activeCap,minimumTelegraph,maxThreats])=>({waveMin,waveMax,lightSpeed,waveInterval,archerShare,activeCap,minimumTelegraph,maxThreats}));
export const combatTuningFor=(chapter:number)=>COMBAT_TUNING[Math.max(0,Math.min(19,chapter))];
