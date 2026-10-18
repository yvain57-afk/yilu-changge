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
 attach(mode:'menu'|'battle',voice:MusicVoice){if(this.dead){voice.stop();return;}this.voices[mode]=voice;voice.volume=0;this.reconcile();}
 setScene(screen:string){this.mode=musicModeForScreen(screen);if(this.mode==='silent')this.silence();this.reconcile();}
 configure(enabled:boolean,gain:number){this.enabled=enabled;this.gain=Number.isFinite(gain)?Math.max(0,Math.min(1,gain)):.6;if(!enabled||!this.gain)this.silence();this.reconcile();}
 unlock(){this.unlocked=true;this.suspended=false;for(const k of ['menu','battle'] as const)if(this.voices[k]&&!this.voices[k]!.playing)this.running[k]=false;this.reconcile();}
 suspend(){this.suspended=true;this.silence();}
 private wanted(k:string){return !this.dead&&this.enabled&&this.gain>0&&this.unlocked&&!this.suspended&&this.mode===k;}
 private reconcile(){for(const k of ['menu','battle'] as const){const v=this.voices[k];if(v&&this.wanted(k)&&!this.running[k]){v.volume=this.levels[k];v.play();this.paused[k]=false;this.running[k]=true;this.starts++;}}}
 private silence(){for(const k of ['menu','battle'] as const){const v=this.voices[k];this.levels[k]=0;if(v){v.volume=0;if(this.running[k]){v.pause();this.paused[k]=true;this.running[k]=false;}}}}
 tick(dt:number){
  if(this.dead)return;
  for(const k of ['menu','battle'] as const){const v=this.voices[k];if(!v)continue;
   const target=this.wanted(k)?this.gain*(k==='battle'?.65:.8):0;
   const step=Math.max(0,Math.min(.1,dt))/.85;
   this.levels[k]+=Math.max(-step,Math.min(step,target-this.levels[k]));v.volume=this.levels[k];
   if(target===0&&this.levels[k]<.0001&&this.running[k]){v.pause();this.paused[k]=true;this.running[k]=false;}
  }
 }
 destroy(){this.dead=true;for(const v of Object.values(this.voices))v?.stop();this.levels={menu:0,battle:0};}
 get state(){return{mode:this.mode,enabled:this.enabled,volume:this.gain,unlocked:this.unlocked,suspended:this.suspended,starts:this.starts,ready:!!this.voices.menu&&!!this.voices.battle,playing:Object.entries(this.voices).filter(([,v])=>v?.playing).map(([k])=>k),levels:{...this.levels}};}
}
