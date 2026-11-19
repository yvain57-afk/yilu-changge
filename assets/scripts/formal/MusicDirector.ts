export type MusicMode='menu'|'battle'|'silent';
export interface MusicVoice {playing:boolean;volume:number;play():void;pause():void;stop():void;}
export function musicModeForScreen(screen:string):MusicMode{
 if(screen==='battle')return 'battle';
 return ['loading','error','render-error','pause'].includes(screen)?'silent':'menu';
}
/** Two loop players only. Scene changes never restart an already active theme. */
export class MusicDirector {
 private mode:MusicMode='silent';private enabled=true;private gain=.6;private unlocked=false;private suspended=false;private dead=false;
 private voices:Partial<Record<'menu'|'battle',MusicVoice>>={};private starts=0;private running={menu:false,battle:false};
 private levels={menu:0,battle:0};private paused={menu:false,battle:false};
 private attempts={menu:0,battle:0};private waiting={menu:0,battle:0};private playErrors=0;
 constructor(private options:{crossfade?:boolean;recoverStart?:boolean}={}){}
 attach(mode:'menu'|'battle',voice:MusicVoice){if(this.dead){voice.stop();return;}this.voices[mode]=voice;voice.volume=0;this.reconcile();}
 setScene(screen:string){const next=musicModeForScreen(screen);if(next!==this.mode){if(this.options.crossfade===false)this.silence();if(next!=='silent'){this.attempts[next]=0;this.waiting[next]=0;}}this.mode=next;if(this.mode==='silent')this.silence();this.reconcile();}
 configure(enabled:boolean,gain:number){this.enabled=enabled;this.gain=Number.isFinite(gain)?Math.max(0,Math.min(1,gain)):.6;if(!enabled||!this.gain)this.silence();this.reconcile();}
 unlock(){this.unlocked=true;this.suspended=false;for(const k of ['menu','battle'] as const)if(this.voices[k]&&!this.voices[k]!.playing){this.running[k]=false;this.attempts[k]=0;this.waiting[k]=0;}this.reconcile();}
 suspend(){this.suspended=true;this.silence();}
 private wanted(k:string){return !this.dead&&this.enabled&&this.gain>0&&this.unlocked&&!this.suspended&&this.mode===k;}
 private reconcile(){for(const k of ['menu','battle'] as const){const v=this.voices[k];if(v&&this.wanted(k)&&!this.running[k]){v.volume=this.levels[k];this.start(k,v);}}}
 private start(k:'menu'|'battle',v:MusicVoice){this.attempts[k]++;this.waiting[k]=0;this.running[k]=true;this.paused[k]=false;this.starts++;try{v.play();}catch{this.playErrors++;}}
 private silence(){for(const k of ['menu','battle'] as const){const v=this.voices[k];this.levels[k]=0;if(v){v.volume=0;if(this.running[k]){v.pause();this.paused[k]=true;this.running[k]=false;}}}}
 tick(dt:number){
  if(this.dead)return;
  for(const k of ['menu','battle'] as const){const v=this.voices[k];if(!v)continue;
   const target=this.wanted(k)?this.gain*(k==='battle'?.65:.8):0;
   // Mini-game play is asynchronous: a request is not proof of actual playback.
   // Retry only three times per scene/explicit gesture; never queue a play every frame.
   if(this.options.recoverStart&&target>0&&this.running[k]&&!v.playing&&this.attempts[k]<3){this.waiting[k]+=Math.max(0,Math.min(.1,dt));if(this.waiting[k]>=.75)this.start(k,v);}
   const step=Math.max(0,Math.min(.1,dt))/.85;
   this.levels[k]+=Math.max(-step,Math.min(step,target-this.levels[k]));v.volume=this.levels[k];
   if(target===0&&this.levels[k]<.0001&&this.running[k]){v.pause();this.paused[k]=true;this.running[k]=false;}
  }
 }
 destroy(){this.dead=true;for(const v of Object.values(this.voices))v?.stop();this.levels={menu:0,battle:0};}
 get state(){return{mode:this.mode,enabled:this.enabled,volume:this.gain,unlocked:this.unlocked,suspended:this.suspended,starts:this.starts,playErrors:this.playErrors,attempts:{...this.attempts},ready:!!this.voices.menu&&!!this.voices.battle,playing:Object.entries(this.voices).filter(([,v])=>v?.playing).map(([k])=>k),levels:{...this.levels}};}
}
