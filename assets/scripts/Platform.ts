import { game, Game as EngineGame, sys, resources, AudioClip, AudioSource, Node } from 'cc';
import { Growth } from './core/growth';
import { Campaign } from './core/campaign';
import { Book, Storage } from './core/save';
declare const wx: any;
/** The only platform-specific boundary. No network, identity, analytics or commerce. */
export class Platform {
 growth:Growth; readonly bgmEnabled=false; campaign:Campaign; book: Book; music: AudioSource|null=null; private effects:Record<string,AudioSource>={};private active=false; clips:Record<string,AudioClip>={}; hidden=false;private musicRequested=false;
 private onHide=()=>{this.hidden=true;this.active=false;this.music?.pause();this.stopEffects();this.pause();};
 private visibility=()=>{if(typeof document!=='undefined'&&document.hidden)this.onHide();else this.onShow();};
 private blur=()=>this.onHide();
 private onShow=()=>{this.hidden=false; /* Explicit continue required. */};
 constructor(private root:Node,private pause:()=>void){
  // Native browser storage preserves errors; Cocos may replace unavailable storage with silent no-ops.
  const storage:Storage={getItem:k=>{if(typeof wx!=='undefined'&&wx.getStorageSync){const v=wx.getStorageSync(k);return typeof v==='string'&&v?v:null;}return (sys.isBrowser?window.localStorage:sys.localStorage).getItem(k);},setItem:(k,v)=>{if(typeof wx!=='undefined'&&wx.setStorageSync)wx.setStorageSync(k,v);else (sys.isBrowser?window.localStorage:sys.localStorage).setItem(k,v);}};
  this.book=new Book(storage);this.campaign=new Campaign(storage,this.book);this.growth=new Growth(storage,this.book);
  game.on(EngineGame.EVENT_HIDE,this.onHide);game.on(EngineGame.EVENT_SHOW,this.onShow);
  if(sys.isBrowser){document.addEventListener('visibilitychange',this.visibility);window.addEventListener('blur',this.blur);window.addEventListener('focus',this.onShow);}
  if(typeof wx!=='undefined'){wx.onHide?.(this.onHide);wx.onShow?.(this.onShow);}
 }
 async load(){
  // Product decision: BGM is not requested or allocated, even with an old music=true save.
  this.music?.stop();
  await Promise.all(['gather','hit','break','hurt','warn'].map(k=>new Promise<void>(resolve=>resources.load(`audio/${k}`,AudioClip,(e,a)=>{if(!e)this.clips[k]=a;resolve()}))));
  for(const k of ['gather','hit','break','hurt','warn']){const channel=this.effects[k]||this.root.addComponent(AudioSource);channel.clip=this.clips[k];channel.volume=.39;channel.loop=false;this.effects[k]=channel;}
 }

 syncAudio(active=true){this.active=active&&!this.hidden;this.music?.stop();if(!this.active||!this.book.data.settings.sfx)this.stopEffects();}
 /** Own every SFX player: AudioSource.stop does not stop playOneShot's detached player. */
 stopEffects(){for(const k of Object.keys(this.effects))this.effects[k].stop();}
 sound(k:string){const channel=this.effects[k];if(this.active&&!this.hidden&&this.book.data.settings.sfx&&channel){channel.stop();channel.play();}}
 get audioState(){return {active:this.active,hidden:this.hidden,bgmEnabled:false,musicRequested:false,musicReady:false,musicTrack:null,musicPlaying:false,effectChannels:Object.keys(this.effects).length,playingEffects:Object.keys(this.effects).filter(k=>this.effects[k].playing)};}
 vibrate(){if(this.book.data.settings.vibration&&typeof wx!=='undefined'&&wx.vibrateShort)wx.vibrateShort({type:'light'});}
 destroy(){if(sys.isBrowser){document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('blur',this.blur);window.removeEventListener('focus',this.onShow);}if(typeof wx!=='undefined'){wx.offHide?.(this.onHide);wx.offShow?.(this.onShow);}game.off(EngineGame.EVENT_HIDE,this.onHide);game.off(EngineGame.EVENT_SHOW,this.onShow);this.active=false;this.music?.stop();this.stopEffects();}
}
