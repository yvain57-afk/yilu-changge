import {uiLayout} from './UiLayout';
export type Screen='home'|'chapters'|'battle'|'pause'|'result'|'settings'|'preview'|'transition'|'camp'|'meeting'|'loadout'|'loading'|'error';
export type PageRect={x:number;y:number;w:number;h:number};
export function pageLayout(a:ReturnType<typeof uiLayout>,screen:Screen){
 const w=a.R-a.L,header={x:a.L,y:a.T,w,h:screen==='battle'?52:78},footer={x:a.L,y:a.B-52,w,h:52};
 const controls=screen==='loadout'?a.B-280:screen==='camp'?a.B-222:screen==='result'?a.B-238:screen==='transition'?a.B-260:screen==='meeting'?a.B-180:screen==='home'?a.B-190:a.B-68;
 const body={x:a.L,y:a.T+88,w,h:Math.max(96,controls-a.T-100)};
 return {safe:{x:a.L,y:a.T,w,h:a.B-a.T},header,body,controls,footer};
}
export function homeView(state:{pending:string|null;completed:boolean;rank:number;nextTitle:string}){
 const pendingName=state.pending==='rally'?'整军':state.pending==='camp'?'建营':'驻防';
 return {action:state.pending?'继续'+pendingName:state.completed?'返回白石':state.rank?'继续征程':'出征',target:state.pending?'尚待完成 · '+pendingName:state.completed?'白石初定 · 守望荆州':state.nextTitle};
}
export function resultView(state:{won:boolean;first:boolean;level:number;rankBefore:string;rankAfter:string;highestRank:string;saveFailed:boolean;cause:string}){
 const {won,first,level}=state;
 return {title:!won?'此战未竟':!first?'再次取胜':level===2?'白石初定':'晋升'+state.rankAfter,
 ending:won?['山道已清，队伍整装待发。','粮营已清，补给路线恢复。','白石已定，守住来之不易的安宁。'][level]:state.cause,
 identity:won&&first?`${state.rankBefore} → ${state.rankAfter}`:`当前身份 · ${state.highestRank}`,
 persistence:state.saveFailed?'本机保存失败 · 本次仍可继续':won?'战绩已保存':'本关免费重开'};
}
export const overlayScreen=(screen:Screen)=>screen==='pause'||screen==='settings';
