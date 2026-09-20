import { LEVELS, PLAYABLE_LEVELS } from './levels';
import { Book, IDS } from './save';
export type RankStage=0|1|2|3;
export function rankStage(book:Book):RankStage {let n=0;while(n<IDS.length&&book.data.cleared[IDS[n]])n++;return n as RankStage;}
export function nextUnfinished(book:Book){return LEVELS.findIndex((l,i)=>i<PLAYABLE_LEVELS&&book.unlock(i)&&!book.data.cleared[l.id]);}
/** Every production start, including replay and next, passes this guard. */
export function canStart(book:Book,index:number,resourcesReady:boolean){return resourcesReady&&Number.isInteger(index)&&index>=0&&index<PLAYABLE_LEVELS&&!!LEVELS[index]&&LEVELS[index].id===IDS[index]&&book.unlock(index);}
