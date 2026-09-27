import {RUNNER_NUMERIC_LIMIT} from './runnerConfig';
export const IDS = ['trial-01','trial-02','trial-03'] as const;
export interface Save { cleared: Record<string,boolean>; best: Record<string,number>; settings: {music:boolean; sfx:boolean; vibration:boolean} }
export interface Storage { getItem(key:string):string|null; setItem(key:string,value:string):void }
export const KEY='yilu-changge-prototype-v2';
export const LEGACY_KEY='yilu-changge-v1';
export const defaults=():Save=>({cleared:{'trial-01':false,'trial-02':false,'trial-03':false},best:{'trial-01':0,'trial-02':0,'trial-03':0},settings:{music:true,sfx:true,vibration:true}});
const settingsValid=(s:any):s is Save['settings']=>!!s&&(['music','sfx','vibration'] as const).every(k=>typeof s[k]==='boolean');
export function valid(value:unknown):value is Save {
 const s=value as Save;
 return !!s && !!s.cleared && !!s.best && IDS.every(id=>typeof s.cleared[id]==='boolean'&&Number.isInteger(s.best[id])&&s.best[id]>=0&&s.best[id]<=256)&&settingsValid(s.settings);
}
export class Book {
 private extras:Record<string,unknown>={}; runnerBest:Record<string,number>={};data=defaults(); notice='';
 constructor(private storage:Storage) {
  try {
   const raw=storage.getItem(KEY);
   if(raw!==null){const parsed=JSON.parse(raw);if(!valid(parsed))throw Error('bad save');this.extras={...parsed};const best=(parsed as any).runnerVideoV2?.best;for(const id of IDS)if(Number.isInteger(best?.[id])&&best[id]>=0&&best[id]<=RUNNER_NUMERIC_LIMIT)this.runnerBest[id]=best[id];for(const id of IDS){this.data.cleared[id]=parsed.cleared[id];this.data.best[id]=parsed.best[id];}this.data.settings={music:parsed.settings.music,sfx:parsed.settings.sfx,vibration:parsed.settings.vibration};}
   else {const old=storage.getItem(LEGACY_KEY);if(old!==null){try{const parsed=JSON.parse(old);if(settingsValid(parsed.settings))this.data.settings={music:parsed.settings.music,sfx:parsed.settings.sfx,vibration:parsed.settings.vibration};}catch{/* Keep unreadable legacy data untouched. */}this.notice='旧版记录已保留，新试玩从第一关开始';this.persist();}}
  }catch{this.notice='存档无法读取，已恢复默认；仍可继续游玩。';}
 }
 persist():boolean{try{this.storage.setItem(KEY,JSON.stringify({...this.extras,...this.data,...(Object.keys(this.runnerBest).length?{runnerVideoV2:{...(this.extras.runnerVideoV2 as object??{}),best:{...((this.extras.runnerVideoV2 as any)?.best??{}),...this.runnerBest}}}:{}),settings:{...(this.extras.settings as object??{}),...this.data.settings},cleared:{...(this.extras.cleared as object??{}),...this.data.cleared},best:{...(this.extras.best as object??{}),...this.data.best}}));this.notice='';return true;}catch{this.notice='本机暂时无法保存，本次数据仍保留，请重试。';return false;}}
 unlock(index:number){return Number.isInteger(index)&&index>=0&&index<IDS.length&&IDS.slice(0,index).every(id=>this.data.cleared[id]);}
 get rank(){let n=0;while(n<IDS.length&&this.data.cleared[IDS[n]])n++;return ['布衣','头领','统领','城主'][n];}
 win(index:number,count:number,profile?:string){const id=IDS[index];if(!id||!Number.isFinite(count)||count<1)return;if(profile==='runnerVideoV2'&&count>RUNNER_NUMERIC_LIMIT){this.notice='兵力纪录超出数值保护范围，原纪录已保留';return;}this.data.cleared[id]=true;if(profile==='runnerVideoV2')this.runnerBest[id]=Math.max(this.runnerBest[id]??0,Math.floor(count));else this.data.best[id]=Math.max(this.data.best[id],Math.min(256,Math.floor(count)));this.persist();}
}
