import {Book, Storage, IDS} from './save';
import {CAMPAIGN} from './campaignData';
export type TransitionId='rally'|'camp'|'garrison';
export type CampaignSave={schema:1;completed:Record<TransitionId,boolean>;seen:{zhaoyunMeeting:boolean}};
const transitions=CAMPAIGN.transitions;
export class Campaign {
 data:CampaignSave={schema:1,completed:{rally:false,camp:false,garrison:false},seen:{zhaoyunMeeting:false}};notice='';
 constructor(private storage:Storage,private book:Book){
  try {const raw=storage.getItem(CAMPAIGN.sidecarSaveKey);if(raw!==null){const v=JSON.parse(raw);if(v.schema!==1||!v.completed||!v.seen||transitions.some(t=>typeof v.completed[t.id]!=='boolean')||typeof v.seen.zhaoyunMeeting!=='boolean')throw Error('invalid campaign');this.data={...v,schema:1,completed:{...v.completed},seen:{...v.seen}};}else this.migrate();}
  catch{this.migrate();this.notice=CAMPAIGN.errors.save;}
  // A corrupt sidecar cannot unlock an uncleared base level.
  transitions.forEach(t=>{if(!book.data.cleared[t.afterLevelId])this.data.completed[t.id]=false;});
  if(!this.data.completed.garrison)this.data.seen.zhaoyunMeeting=false;
  this.persist();
 }
 private migrate(){transitions.forEach(t=>this.data.completed[t.id]=this.book.data.cleared[t.afterLevelId]);this.data.seen.zhaoyunMeeting=IDS.every(id=>this.book.data.cleared[id]);}
 persist(){try{this.storage.setItem(CAMPAIGN.sidecarSaveKey,JSON.stringify(this.data));}catch{this.notice=CAMPAIGN.errors.save;}}
 get pending(){return transitions.find(t=>this.book.data.cleared[t.afterLevelId]&&!this.data.completed[t.id])?.id??null;}
 complete(id:TransitionId){const t=transitions.find(t=>t.id===id);if(!t||!this.book.data.cleared[t.afterLevelId])return false;if(!this.data.completed[id]){this.data.completed[id]=true;this.persist();}return true;}
 meet(){if(!this.data.completed.garrison)return false;this.data.seen.zhaoyunMeeting=true;this.persist();return true;}
}
