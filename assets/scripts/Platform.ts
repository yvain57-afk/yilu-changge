import { game, Game as EngineGame, sys, resources, AudioClip, AudioSource, Node } from 'cc';
import { Book, Storage } from './core/save';
declare const wx: any;
/** The only platform-specific boundary. No network, identity, analytics or commerce. */
export class Platform {
 book: Book; music: AudioSource; sfx: AudioSource; clips:Record<string,AudioClip>={}; hidden=false;
 private onHide=()=>{this.hidden=true;this.music.pause();this.sfx.stop();this.pause();};
 private visibility=()=>{if(typeof document!=='undefined'&&document.hidden)this.onHide();else this.onShow();};
 private blur=()=>this.onHide();
 private onShow=()=>{this.hidden=false; /* Explicit continue required. */};
 constructor(root:Node,private pause:()=>void){
  // Native browser storage preserves errors; Cocos may replace unavailable storage with silent no-ops.
  const storage:Storage={getItem:k=>{if(typeof wx!=='undefined'&&wx.getStorageSync){const v=wx.getStorageSync(k);return typeof v==='string'&&v?v:null;}return (sys.isBrowser?window.localStorage:sys.localStorage).getItem(k);},setItem:(k,v)=>{if(typeof wx!=='undefined'&&wx.setStorageSync)wx.setStorageSync(k,v);else (sys.isBrowser?window.localStorage:sys.localStorage).setItem(k,v);}};
  this.book=new Book(storage);this.music=root.addComponent(AudioSource);this.sfx=root.addComponent(AudioSource);
  game.on(EngineGame.EVENT_HIDE,this.onHide);game.on(EngineGame.EVENT_SHOW,this.onShow);
  if(sys.isBrowser){document.addEventListener('visibilitychange',this.visibility);window.addEventListener('blur',this.blur);window.addEventListener('focus',this.onShow);}
  if(typeof wx!=='undefined'){wx.onHide?.(this.onHide);wx.onShow?.(this.onShow);}
 }
 async load(){await Promise.all(['music','gather','hit','break','hurt','warn'].map(k=>new Promise<void>(resolve=>resources.load(`audio/${k}`,AudioClip,(e,a)=>{if(!e)this.clips[k]=a;resolve()}))));this.music.clip=this.clips.music;this.music.loop=true;this.music.volume=.36;this.sfx.volume=.6;}
 syncAudio(active=true){if(active&&!this.hidden&&this.book.data.settings.music){if(!this.music.playing)this.music.play();}else {this.music.pause();if(!active)this.sfx.stop();}}
 sound(k:string){if(!this.hidden&&this.book.data.settings.sfx&&this.clips[k])this.sfx.playOneShot(this.clips[k],.65);}
 vibrate(){if(this.book.data.settings.vibration&&typeof wx!=='undefined'&&wx.vibrateShort)wx.vibrateShort({type:'light'});}
 destroy(){if(sys.isBrowser){document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('blur',this.blur);window.removeEventListener('focus',this.onShow);}if(typeof wx!=='undefined'){wx.offHide?.(this.onHide);wx.offShow?.(this.onShow);}game.off(EngineGame.EVENT_HIDE,this.onHide);game.off(EngineGame.EVENT_SHOW,this.onShow);this.music.stop();this.sfx.stop();}
}
