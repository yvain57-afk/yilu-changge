import type {WeaponId} from './data';
export type SoundEvent={eventId:string;runId:string;tick:number;attackId:string;projectileId:number|null;source:'hero'|'companion'|'army'|'enemy';sourceActorId:string;weaponId:string|null;arms:string|null;phase:'release'|'impact'|'warn'|'hurt'|'load'|'block';targetKind:string;material:string;heavy:boolean;fallback?:string;eventTime?:number;logKind?:string;logMessage?:string};
export type LegacySoundContext={eventId:string;runId:string;tick:number;sourceActorId:string;eventTime:number;logKind:string;logMessage:string};
/** Reward audio follows the same authoritative log identity as the visible feedback. */
export function rewardSoundContext(runId:string,event:{t:number;kind:string;msg:string}):LegacySoundContext{return {eventId:runId+':reward:'+JSON.stringify([event.t,event.kind,event.msg]),runId,tick:Math.round(event.t*60),sourceActorId:'reward:'+event.kind,eventTime:event.t,logKind:event.kind,logMessage:event.msg};}
export const WEAPON_SFX:Record<WeaponId,string>={spear:'spear',guandao:'guandao',shemao:'shemao',huaji:'huaji',guding:'guding',shuangji:'shuangji',yitian:'yitian',qinggang:'qinggang',shuanggu:'shuanggu',liannu:'liannu',duanji:'duanji',tiesuodao:'tiesuodao',goulianqiang:'goulianqiang',dundao:'dundao',yanlinggong:'yanlinggong',jiguannu:'jiguannu'};
export const SFX_GROUPS=[...Object.values(WEAPON_SFX),'jiguannu-load','army-bow','army-fire','army-repeater','impact-soft','impact-metal','impact-wood','impact-generic'];
export const SFX_CLIPS=SFX_GROUPS.flatMap(g=>[0,1,2].map(i=>g+'-'+i));
export const SOUND_LIMITS={perKind:1,globalVoices:3,globalVolume:.65,startsPerSecond:12,minStartGapMs:25};
export type Voice={playing:boolean;volume:number;play():void;stop():void};
type Request={event:SoundEvent;group:string;kind:string;priority:number;volume:number;at:number;fixedClip?:string};
/** Audio-only scheduling. No battle RNG, no async loads, no historical replay. */
export class WeaponSoundMixer {
 private pending:Request[]=[];private recent=new Map<string,number>();private variants=new Map<string,number>();private starts:number[]=[];private active=new Map<string,{voice:Voice;kind:string;priority:number}>();
 readonly counters={played:0,suppressedBusy:0,suppressedRate:0,suppressedBudget:0,merged:0,expired:0,preempted:0,missing:0,fallback:0,peakVoices:0,peakVolume:0};
 readonly trace:any[]=[];
 constructor(private voices:Record<string,Voice>,private now:()=>number=()=>typeof performance!=='undefined'?performance.now():Date.now()){}
 enqueue(events:SoundEvent[]){const now=this.now();for(const event of events){
  const critical=event.phase==='warn'||event.phase==='hurt',contact=event.phase==='impact'||event.phase==='block';let group=critical?event.phase:event.phase==='block'?'impact-wood':event.phase==='impact'?'impact-'+event.material:event.phase==='load'?'jiguannu-load':event.source==='army'?'army-'+event.arms:event.weaponId||'spear';
  if(!critical&&!SFX_GROUPS.includes(group)){group=event.phase==='impact'?'impact-generic':'spear';this.counters.fallback++;}
  if(event.fallback)this.counters.fallback++;
  // Distinct actual subattacks 100 ms apart survive; simultaneous waves / volley arrows merge.
  const key=[event.runId,event.attackId,event.phase,event.phase==='impact'?event.material:''].join(':');
  const previous=this.recent.get(key);if(previous!==undefined&&event.tick-previous<(event.phase==='impact'?6:3)){this.counters.merged++;continue;}this.recent.set(key,event.tick);
  if(this.recent.size>512)this.recent.delete(this.recent.keys().next().value!);
  const priority=critical?4:event.source==='hero'&&(event.phase==='release'||event.phase==='block'||event.heavy)?3:event.source==='companion'?2:1;
  const volume=critical?.24:event.source==='hero'?(event.heavy?.21:.18):event.source==='companion'?.105:.07;
  this.pending.push({event,group,kind:critical?group:event.source+':'+(contact?'impact':event.phase),priority,volume,at:now});
 }if(this.pending.length>96){this.pending.sort((a,b)=>b.priority-a.priority);this.counters.suppressedBudget+=this.pending.length-96;this.pending.length=96;}}
 enqueueLegacy(k:string,context?:LegacySoundContext){if(!['gather','hit','break'].includes(k))return;const at=this.now();this.pending.push({event:{eventId:context?.eventId||'legacy:'+at,runId:context?.runId||'legacy',tick:context?.tick??Math.round(at/16.67),attackId:context?.eventId||'legacy:'+at,projectileId:null,source:'hero',sourceActorId:context?.sourceActorId||'legacy',weaponId:null,arms:null,phase:'release',targetKind:context?.logKind||'none',material:'none',heavy:false,...(context?{eventTime:context.eventTime,logKind:context.logKind,logMessage:context.logMessage}:{})},group:k,kind:k,priority:2,volume:k==='break'?.21:.16,at,fixedClip:k});this.pump();}
 pump(){const now=this.now();for(const [id,a] of this.active)if(!a.voice.playing)this.active.delete(id);
  this.pending=this.pending.filter(q=>{if(now-q.at>140){this.counters.expired++;return false;}return true;});this.pending.sort((a,b)=>b.priority-a.priority||a.at-b.at);
  this.starts=this.starts.filter(t=>now-t<1000);if(!this.pending.length)return;
  if(now-(this.starts[this.starts.length-1]??-Infinity)<25)return;
  const q=this.pending.shift()!;
  // Reserve two starts each second for danger/hurt. All sources still share the 12/s hard cap.
  if(this.starts.length>=(q.priority===4?12:10)){this.counters.suppressedRate++;return;}
  const same=Array.from(this.active.values()).filter(a=>a.kind===q.kind);if(same.some(a=>a.priority>=q.priority)){this.counters.suppressedBusy++;return;}
  for(const a of same){a.voice.stop();this.counters.preempted++;}for(const [id,a] of this.active)if(!a.voice.playing)this.active.delete(id);
  const fits=()=>this.active.size<3&&Array.from(this.active.values()).reduce((v,a)=>v+a.voice.volume,q.volume)<=.650001;
  const candidates=Array.from(this.active.entries()).filter(([,a])=>a.priority<q.priority).sort((a,b)=>a[1].priority-b[1].priority);
  while(!fits()&&candidates.length){const [id,a]=candidates.shift()!;a.voice.stop();this.active.delete(id);this.counters.preempted++;}
  if(!fits()){this.counters.suppressedBudget++;return;}
  const variant=(this.variants.get(q.group)??-1)+1,clip=q.fixedClip||(q.priority===4?q.group:q.group+'-'+variant%3),v=this.voices[clip];if(!v){this.counters.missing++;return;}
  if(v.playing){this.counters.suppressedBusy++;return;}this.variants.set(q.group,variant%3);v.volume=q.volume;v.play();this.active.set(clip,{voice:v,kind:q.kind,priority:q.priority});this.starts.push(now);this.counters.played++;
  this.counters.peakVoices=Math.max(this.counters.peakVoices,this.active.size);this.counters.peakVolume=Math.max(this.counters.peakVolume,Array.from(this.active.values()).reduce((v,a)=>v+a.voice.volume,0));
  this.trace.push({...q.event,clip,priority:q.priority,volume:q.volume,playedAtMs:now});if(this.trace.length>240)this.trace.shift();
 }
 clear(){this.pending=[];this.recent.clear();this.starts=[];for(const a of this.active.values())a.voice.stop();this.active.clear();}
 get state(){return{pending:this.pending.length,active:Array.from(this.active.keys()),counters:{...this.counters},trace:this.trace.slice(-60)};}
}
