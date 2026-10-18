import {MusicDirector} from './formal/MusicDirector';
import {SFX_CLIPS,WeaponSoundMixer,SoundEvent,SOUND_LIMITS,LegacySoundContext} from './formal/WeaponSfx';
import { game, Game as EngineGame, sys, resources, AudioClip, AudioSource, Node, view, screen, native } from 'cc';
import { Tactics } from './core/tactics';
import { WindowMetrics, UiRect } from './ui/UiLayout';
import { Growth } from './core/growth';
import { Campaign } from './core/campaign';
import { Book, Storage } from './core/save';
declare const wx: any;
/** The only platform-specific boundary. No network, identity, analytics or commerce. */
export class Platform {
 tactics:Tactics; growth:Growth; private metricsCache:WindowMetrics|null=null; private metricsRevision=0; private windowChanged=()=>{this.metricsCache=null;this.metricsRevision++;}; readonly bgmEnabled=true; campaign:Campaign; book: Book; music: AudioSource|null=null; private effects:Record<string,AudioSource>={};private mixer=new WeaponSoundMixer(this.effects);private legacySoundId=0;private effectLast:Record<string,number>={};private active=false; clips:Record<string,AudioClip>={}; hidden=false;private score=new MusicDirector();private musicFailures:string[]=[];private musicSources:Record<string,AudioSource>={}; private loadPromise:Promise<void>|null=null; private disposed=false; private effectTimes:number[]=[]; private audioCounters={played:0,suppressedBusy:0,suppressedRate:0,suppressedBudget:0,loadFailures:0};
 private onHide=()=>{this.hidden=true;this.active=false;this.score.suspend();this.stopEffects();this.pause();};
 private visibility=()=>{if(typeof document!=='undefined'&&document.hidden)this.onHide();else this.onShow();};
 private blur=()=>this.onHide();
 private onShow=()=>{this.hidden=false;this.windowChanged(); /* Refresh safe area; explicit continue is still required. */};
 constructor(private root:Node,private pause:()=>void,protectLegacy=false){
  // Native browser storage preserves errors; Cocos may replace unavailable storage with silent no-ops.
  const storage:Storage={getItem:k=>{if(typeof wx!=='undefined'&&wx.getStorageSync){const v=wx.getStorageSync(k);return typeof v==='string'&&v?v:null;}return (sys.isBrowser?window.localStorage:sys.localStorage).getItem(k);},setItem:(k,v)=>{if(typeof wx!=='undefined'&&wx.setStorageSync)wx.setStorageSync(k,v);else (sys.isBrowser?window.localStorage:sys.localStorage).setItem(k,v);}};
  // Formal mode reads legacy settings but every legacy helper writes to a separate shadow key.
  // In particular Campaign's eager constructor persist must never rewrite the original record.
  const scoped:Storage=protectLegacy?{getItem:k=>storage.getItem('formal-platform:'+k)??storage.getItem(k),setItem:(k,v)=>storage.setItem('formal-platform:'+k,v)}:storage;
  this.book=new Book(scoped);this.campaign=new Campaign(scoped,this.book);this.growth=new Growth(scoped,this.book);this.tactics=new Tactics(scoped);
  game.on(EngineGame.EVENT_HIDE,this.onHide);game.on(EngineGame.EVENT_SHOW,this.onShow);
  if(sys.isBrowser){window.addEventListener('resize',this.windowChanged);document.addEventListener('visibilitychange',this.visibility);window.addEventListener('blur',this.blur);window.addEventListener('focus',this.onShow);}
  if(typeof wx!=='undefined'){wx.onWindowResize?.(this.windowChanged);wx.onHide?.(this.onHide);wx.onShow?.(this.onShow);}
 }
 get windowMetrics():WindowMetrics {
  if(this.metricsCache)return this.metricsCache;
  let info:any=null,source='browser-window',capsule:any=null,capsuleSource='not-available';
  if(sys.isNative){
   const pixels=screen.windowSize,ratio=screen.devicePixelRatio||1,v=view.getVisibleSize(),safe=sys.getSafeAreaRect(false),w=pixels.width/ratio,h=pixels.height/ratio;
   info={windowWidth:w,windowHeight:h,safeArea:{left:safe.x/v.width*w,top:h-(safe.y+safe.height)/v.height*h,right:(safe.x+safe.width)/v.width*w,bottom:h-safe.y/v.height*h}};source='cocos-native';
  }
  if(typeof wx!=='undefined'){
   try{info=typeof wx.getWindowInfo==='function'?wx.getWindowInfo():wx.getSystemInfoSync?.();source=info?'wechat-window':'wechat-fallback';}catch{source='wechat-fallback';}
   try{if(typeof wx.getMenuButtonBoundingClientRect==='function'){capsule=wx.getMenuButtonBoundingClientRect();capsuleSource='wechat-menu';}}catch{capsuleSource='invalid';}
  }
  const width=Number(info?.windowWidth)||(typeof window!=='undefined'?window.innerWidth:720),height=Number(info?.windowHeight)||(typeof window!=='undefined'?window.innerHeight:1280);
  const valid=(r:any):r is UiRect=>!!r&&[r.left,r.top,r.right,r.bottom].every(Number.isFinite)&&r.left>=0&&r.top>=0&&r.right>r.left&&r.bottom>r.top&&r.right<=width&&r.bottom<=height;
  let safeSource='full-window-fallback',safe:UiRect={left:0,top:0,right:width,bottom:height};
  if(valid(info?.safeArea)){safe={left:info.safeArea.left,top:info.safeArea.top,right:info.safeArea.right,bottom:info.safeArea.bottom};safeSource=sys.isNative?'cocos-native-safe-area':'wechat-safe-area';}
  else if(typeof document!=='undefined'){
   const probe=document.createElement('div');probe.style.cssText='position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.appendChild(probe);
   const c=getComputedStyle(probe);safeSource='browser-css-env';safe={left:parseFloat(c.paddingLeft)||0,top:parseFloat(c.paddingTop)||0,right:width-(parseFloat(c.paddingRight)||0),bottom:height-(parseFloat(c.paddingBottom)||0)};probe.remove();
  }
  if(!valid(capsule)){capsule=null;if(capsuleSource==='wechat-menu')capsuleSource='invalid';}
  return this.metricsCache={width,height,safe,capsule:capsule?{left:capsule.left,top:capsule.top,right:capsule.right,bottom:capsule.bottom}:null,source,safeSource,capsuleSource,revision:this.metricsRevision};
 }
 async load(){
  if(this.loadPromise)return this.loadPromise;
  // Keep successful clips/players across retries; await all callbacks before allowing a retry.
  this.loadPromise=Promise.all([this.loadEffects(),this.loadMusic()]).then(()=>{});
  try{await this.loadPromise;}finally{this.loadPromise=null;}
 }
 private async loadEffects(){
  const kinds=['gather','hit','break','hurt','warn',...SFX_CLIPS];
  const results=await Promise.all(kinds.map(k=>this.clips[k]?Promise.resolve(true):new Promise<boolean>(resolve=>resources.load(SFX_CLIPS.includes(k)?`audio/weapons/${k}`:`audio/${k}`,AudioClip,(e,a)=>{if(!e&&a&&!this.disposed){this.clips[k]=a;resolve(true);}else{this.audioCounters.loadFailures++;resolve(false);}}))));
  if(this.disposed)return;
  for(const k of kinds){if(!this.clips[k]||this.effects[k])continue;const channel=this.root.addComponent(AudioSource);channel.clip=this.clips[k];channel.volume=k==='hurt'?.24:k==='break'?.21:.16;channel.loop=false;this.effects[k]=channel;}
  if(results.some(ok=>!ok))throw Error('SFX resource load failed; retry retains successful channels');
 }

 private async loadMusic(){
  this.musicFailures=[];
  await Promise.all((['menu','battle'] as const).map(k=>this.clips['score-'+k]?Promise.resolve():new Promise<void>(resolve=>{
   resources.load('audio/shanhe/'+k,AudioClip,(err,clip)=>{if(this.disposed){resolve();return;}if(err||!clip){this.musicFailures.push(k);resolve();return;}
    this.clips['score-'+k]=clip;const v=this.root.addComponent(AudioSource);v.clip=clip;v.loop=true;v.volume=0;this.musicSources[k]=v;this.score.attach(k,v);resolve();});
  })));
  this.score.configure(this.book.data.settings.music,this.book.data.settings.musicVolume??.6);
  if(sys.isNative)this.score.unlock();
 }
 setMusicScene(screen:string){this.score.setScene(screen);}
 unlockAudio(){if(!this.hidden)this.score.unlock();}
 updateMusic(dt:number){this.score.tick(dt);}

 syncAudio(active=true){this.active=active&&!this.hidden;this.score.configure(this.book.data.settings.music,this.book.data.settings.musicVolume??.6);if(!this.active||!this.book.data.settings.sfx)this.stopEffects();}
 /** Own every SFX player; pause stops them and requires explicit resume. */
 stopEffects(){this.mixer.clear();this.effectLast={};this.effectTimes=[];for(const k of Object.keys(this.effects))if(this.effects[k].playing)this.effects[k].stop();}
 consumeSoundEvents(events:SoundEvent[]){if(!this.active||this.hidden||!this.book.data.settings.sfx){this.stopEffects();return;}this.mixer.enqueue(events);}
 pumpSound(){if(!this.active||this.hidden||!this.book.data.settings.sfx){this.stopEffects();return;}this.mixer.pump();}
 sound(k:string,context?:LegacySoundContext){
  if(k==='hurt'||k==='warn'){this.consumeSoundEvents([{eventId:'platform:'+ ++this.legacySoundId,runId:'platform',tick:this.legacySoundId*60,attackId:'platform:'+this.legacySoundId,projectileId:null,source:'enemy',sourceActorId:'platform',weaponId:null,arms:null,phase:k,targetKind:'none',material:'none',heavy:false}]);return;}
  // Legacy game / reward clips share the same scheduler and hard budget.
  if(!this.active||this.hidden||!this.book.data.settings.sfx)return;
  this.mixer.enqueueLegacy(k,context);
 }

 get audioState(){let session:unknown=null;if(sys.isNative){try{session=JSON.parse(native.reflection.callStaticMethod('YiluNativeBridge','audioSessionState:',''));}catch{}}return {nativeAudioSession:session,musicPlayers:Object.fromEntries(Object.entries(this.musicSources).map(([k,v])=>[k,{playing:v.playing,currentTime:v.currentTime,duration:v.duration,volume:v.volume}])) ,active:this.active,hidden:this.hidden,bgmEnabled:true,musicRequested:this.book.data.settings.music,musicReady:this.score.state.ready,musicTrack:this.score.state.mode,musicPlaying:this.score.state.playing.length>0,score:this.score.state,musicFailures:[...this.musicFailures],effectChannels:Object.keys(this.effects).length,playingEffects:Object.keys(this.effects).filter(k=>this.effects[k].playing),limits:{perKind:1,globalVoices:3,globalVolume:.65,startsPerSecond:12,minStartGapMs:25},counters:{...this.audioCounters,...this.mixer.state.counters},weaponSfx:this.mixer.state,loading:!!this.loadPromise};}

 vibrate(){if(sys.isNative&&this.book.data.settings.vibration){native.reflection.callStaticMethod('YiluNativeBridge','impact:','light');return;}if(this.book.data.settings.vibration&&typeof wx!=='undefined'&&wx.vibrateShort)wx.vibrateShort({type:'light'});}
 destroy(){this.disposed=true;if(sys.isBrowser){window.removeEventListener('resize',this.windowChanged);document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('blur',this.blur);window.removeEventListener('focus',this.onShow);}if(typeof wx!=='undefined'){wx.offWindowResize?.(this.windowChanged);wx.offHide?.(this.onHide);wx.offShow?.(this.onShow);}game.off(EngineGame.EVENT_HIDE,this.onHide);game.off(EngineGame.EVENT_SHOW,this.onShow);this.active=false;this.score.destroy();this.stopEffects();}
}
