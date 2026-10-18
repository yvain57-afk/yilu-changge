/** QA helper: call only against an isolated fresh test FormalStore, never the user's player save. */
export function configureLegalLoadout(store:any){
 const owned=store.data.weapons,w=['guandao','shuangji','huaji','guding','spear'].find(w=>owned.includes(w))!;store.selectWeapon(w);
 while((store.data.weaponLevels[w]||1)<3&&store.upgrade(w)){}
 store.data.companions=['lubu','zhao','zhang','machao','xu','liao'].filter(id=>store.data.captures.includes(id)).sort((a,b)=>['lubu','machao','zhang','zhao','xu','liao'].indexOf(a)-['lubu','machao','zhang','zhao','xu','liao'].indexOf(b)).slice(0,store.companionLimit);
 store.data.support=store.data.visits.includes('hua')?'hua':null;
 for(const slot of ['dian','qi','ma'])store.data.slots[slot]=({dian:['taiping','mengde'],qi:['yuxi','huxinjing'],ma:['chitu','dilu']})[slot].find(t=>store.data.treasures.includes(t))||null;
 return store.loadout();
}
