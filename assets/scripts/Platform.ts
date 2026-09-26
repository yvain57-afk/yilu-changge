import { game, Game as EngineGame, sys, resources, AudioClip, AudioSource, Node } from 'cc';
import { Tactics } from './core/tactics';
import { WindowMetrics, UiRect } from './ui/UiLayout';
import { Growth } from './core/growth';
import { Campaign } from './core/campaign';
import { Book, Storage } from './core/save';
declare const wx: any;
/** The only platform-specific boundary. No network, identity, analytics or commerce. */
export class Platform {
 tactics:Tactics; growth:Growth; private metricsCache:WindowMetrics|null=null; private metricsRevision=0; private windowChanged=()=>{this.metricsCache=null;this.metricsRevision++;}; readonly bgmEnabled=false; campaign:Campaign; book: Book; music: AudioSource|null=null; private effects:Record<string,AudioSource>={};private effectLast:Record<string,number>={};private active=false; clips:Record<string,AudioClip>={}; hidden=false;private musicRequested=false; private loadPromise:Promise<void>|null=null; private disposed=false; private effectTimes:number[]=[]; private audioCounters={played:0,suppressedBusy:0,suppressedRate:0,suppressedBudget:0,loadFailures:0};
 private onHide=()=>{this.hidden=true;this.active=false;this.music?.pause();this.stopEffects();this.pause();};
 private visibility=()=>{if(typeof document!=='undefined'&&document.hidden)this.onHide();else this.onShow();};
 private blur=()=>this.onHide();
 private onShow=()=>{this.hidden=false;this.windowChanged(); /* Refresh safe area; explicit continue is still required. */};
 constructor(private root:Node,private pause:()=>void){
  // Native browser storage preserves errors; Cocos may replace unavailable storage with silent no-ops.
  const storage:Storage={getItem:k=>{if(typeof wx!=='undefined'&&wx.getStorageSync){const v=wx.getStorageSync(k);return typeof v==='string'&&v?v:null;}return (sys.isBrowser?window.localStorage:sys.localStorage).getItem(k);},setItem:(k,v)=>{if(typeof wx!=='undefined'&&wx.setStorageSync)wx.setStorageSync(k,v);else (sys.isBrowser?window.localStorage:sys.localStorage).setItem(k,v);}};
  this.book=new Book(storage);this.campaign=new Campaign(storage,this.book);this.growth=new Growth(storage,this.book);this.tactics=new Tactics(storage);
  game.on(EngineGame.EVENT_HIDE,this.onHide);game.on(EngineGame.EVENT_SHOW,this.onShow);
  if(sys.isBrowser){window.addEventListener('resize',this.windowChanged);document.addEventListener('visibilitychange',this.visibility);window.addEventListener('blur',this.blur);window.addEventListener('focus',this.onShow);}
  if(typeof wx!=='undefined'){wx.onWindowResize?.(this.windowChanged);wx.onHide?.(this.onHide);wx.onShow?.(this.onShow);}
 }
 get windowMetrics():WindowMetrics {
  if(this.metricsCache)return this.metricsCache;
  let info:any=null,source='browser-window',capsule:any=null,capsuleSource='not-available';
  if(typeof wx!=='undefined'){
   try{info=typeof wx.getWindowInfo==='function'?wx.getWindowInfo():wx.getSystemInfoSync?.();source=info?'wechat-window':'wechat-fallback';}catch{source='wechat-fallback';}
   try{if(typeof wx.getMenuButtonBoundingClientRect==='function'){capsule=wx.getMenuButtonBoundingClientRect();capsuleSource='wechat-menu';}}catch{capsuleSource='invalid';}
  }
  const width=Number(info?.windowWidth)||(typeof window!=='undefined'?window.innerWidth:720),height=Number(info?.windowHeight)||(typeof window!=='undefined'?window.innerHeight:1280);
  const valid=(r:any):r is UiRect=>!!r&&[r.left,r.top,r.right,r.bottom].every(Number.isFinite)&&r.left>=0&&r.top>=0&&r.right>r.left&&r.bottom>r.top&&r.right<=width&&r.bottom<=height;
  let safeSource='full-window-fallback',safe:UiRect={left:0,top:0,right:width,bottom:height};
  if(valid(info?.safeArea)){safe={left:info.safeArea.left,top:info.safeArea.top,right:info.safeArea.right,bottom:info.safeArea.bottom};safeSource='wechat-safe-area';}
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
  this.loadPromise=this.loadEffects();
  try{await this.loadPromise;}finally{this.loadPromise=null;}
 }
 private async loadEffects(){
  this.music?.stop();
  const kinds=['gather','hit','break','hurt','warn'];
  const results=await Promise.all(kinds.map(k=>this.clips[k]?Promise.resolve(true):new Promise<boolean>(resolve=>resources.load(`audio/${k}`,AudioClip,(e,a)=>{if(!e&&a&&!this.disposed){this.clips[k]=a;resolve(true);}else{this.audioCounters.loadFailures++;resolve(false);}}))));
  if(this.disposed)return;
  for(const k of kinds){if(!this.clips[k]||this.effects[k])continue;const channel=this.root.addComponent(AudioSource);channel.clip=this.clips[k];channel.volume=k==='hurt'?.24:k==='break'?.21:.16;channel.loop=false;this.effects[k]=channel;}
  if(results.some(ok=>!ok))throw Error('SFX resource load failed; retry retains successful channels');
 }

 syncAudio(active=true){this.active=active&&!this.hidden;this.music?.stop();if(!this.active||!this.book.data.settings.sfx)this.stopEffects();}
 /** Own every SFX player; pause stops them and requires explicit resume. */
 stopEffects(){this.effectLast={};this.effectTimes=[];for(const k of Object.keys(this.effects))if(this.effects[k].playing)this.effects[k].stop();}
 sound(k:string){
  const channel=this.effects[k];if(!this.active||this.hidden||!this.book.data.settings.sfx||!channel)return;
  const now=typeof performance!=='undefined'?performance.now():Date.now();
  // Let a clip finish. Never stop/restart the same sound for each projectile hit.
  if(channel.playing){this.audioCounters.suppressedBusy++;return;}
  const interval=k==='hit'?130:k==='warn'?350:k==='hurt'?180:120;
  this.effectTimes=this.effectTimes.filter(t=>now-t<1000);
  if(now-(this.effectLast[k]??-Infinity)<interval||this.effectTimes.length>=12||now-(this.effectTimes[this.effectTimes.length-1]??-Infinity)<25){this.audioCounters.suppressedRate++;return;}
  const playing=Object.keys(this.effects).map(k=>this.effects[k]).filter(c=>c.playing);
  if(playing.length>=3||playing.reduce((v,c)=>v+c.volume,channel.volume)>.65){this.audioCounters.suppressedBudget++;return;}
  this.effectLast[k]=now;this.effectTimes.push(now);channel.play();this.audioCounters.played++;
 }
 get audioState(){return {active:this.active,hidden:this.hidden,bgmEnabled:false,musicRequested:false,musicReady:false,musicTrack:null,musicPlaying:false,effectChannels:Object.keys(this.effects).length,playingEffects:Object.keys(this.effects).filter(k=>this.effects[k].playing),limits:{perKind:1,globalVoices:3,globalVolume:.65,startsPerSecond:12,minStartGapMs:25},counters:{...this.audioCounters},loading:!!this.loadPromise};}

 vibrate(){if(this.book.data.settings.vibration&&typeof wx!=='undefined'&&wx.vibrateShort)wx.vibrateShort({type:'light'});}
 destroy(){this.disposed=true;if(sys.isBrowser){window.removeEventListener('resize',this.windowChanged);document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('blur',this.blur);window.removeEventListener('focus',this.onShow);}if(typeof wx!=='undefined'){wx.offWindowResize?.(this.windowChanged);wx.offHide?.(this.onHide);wx.offShow?.(this.onShow);}game.off(EngineGame.EVENT_HIDE,this.onHide);game.off(EngineGame.EVENT_SHOW,this.onShow);this.active=false;this.music?.stop();this.stopEffects();}
}
