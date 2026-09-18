export interface Save { cleared: boolean[]; clues: boolean[]; best: number[]; settings: {music:boolean; sfx:boolean; vibration:boolean} }
export interface Storage { getItem(key:string):string|null; setItem(key:string,value:string):void }
export const KEY='yilu-changge-v1';
export const defaults=():Save=>({cleared:[false,false,false],clues:[false,false,false],best:[0,0,0],settings:{music:true,sfx:true,vibration:true}});
export function valid(value:unknown):value is Save {
 const s=value as Save;
 return !!s && (['cleared','clues'] as const).every(k=>Array.isArray(s[k])&&s[k].length===3&&s[k].every((x:unknown)=>typeof x==='boolean')) && Array.isArray(s.best)&&s.best.length===3&&s.best.every(x=>Number.isInteger(x)&&x>=0&&x<=256)&&!!s.settings&&(['music','sfx','vibration'] as const).every(k=>typeof s.settings[k]==='boolean');
}
export class Book {
 data=defaults(); notice='';
 constructor(private storage:Storage) {try {const raw=storage.getItem(KEY); if(raw!==null){const parsed=JSON.parse(raw);if(!valid(parsed))throw Error('bad save');this.data={cleared:[...parsed.cleared],clues:[...parsed.clues],best:[...parsed.best],settings:{music:parsed.settings.music,sfx:parsed.settings.sfx,vibration:parsed.settings.vibration}};}}catch{this.notice='存档无法读取，已恢复默认；仍可继续游玩。';}}
 persist(){try{this.storage.setItem(KEY,JSON.stringify(this.data));}catch{this.notice='本机暂时无法保存，本次仍可游玩。';}}
 unlock(id:number){return id===0||this.data.cleared[id-1];}
 clue(id:number){this.data.clues[id]=true;this.persist();}
 win(id:number,count:number){this.data.cleared[id]=true;this.data.clues[id]=true;this.data.best[id]=Math.max(this.data.best[id],count);this.persist();}
}
