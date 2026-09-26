import {Storage} from './save';
export type TacticId='guanzhen'|'zhenjun';
export const TACTICS={guanzhen:{label:'贯阵',description:'贯穿更多敌兵'},zhenjun:{label:'震军',description:'击退并迟滞敌兵'}} as const;
export const TACTICS_KEY='yilu-changge-tactics-v06';
export class Tactics {
 data:{schemaVersion:1;equipped:TacticId}={schemaVersion:1,equipped:'guanzhen'};notice='';
 constructor(private storage:Storage){try{const raw=storage.getItem(TACTICS_KEY);if(raw!==null){const value=JSON.parse(raw);if(value.schemaVersion!==1||['guanzhen','zhenjun'].indexOf(value.equipped)<0)throw Error('invalid tactic');this.data.equipped=value.equipped;}}catch{this.notice='兵法已恢复为贯阵，其他进度不变。';}}
 equip(id:TacticId){if(id!=='guanzhen'&&id!=='zhenjun')return false;this.data.equipped=id;try{this.storage.setItem(TACTICS_KEY,JSON.stringify(this.data));this.notice='';}catch{this.notice='本机暂时无法保存，本次仍可继续。';}return true;}
}
export function ordinaryBudget(weapon:string,tier:number,tactic:TacticId){return (weapon==='blade'?[5,7,10]:[4,6,8])[tier-1]+(tactic==='guanzhen'?[2,3,4][tier-1]:0);}
