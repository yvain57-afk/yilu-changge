import {Node,Sprite,SpriteFrame,Texture2D,Rect,Size,Vec2,UITransform,Layers,resources,Color,UIOpacity,isValid} from 'cc';
import {BATTLE_FRAMES,BattleFrame} from './BattleAtlas';
export type BattleDrawOptions={anchorX?:number;anchorY?:number;angle?:number;alpha?:number;tint?:string;flipY?:boolean};
/** Independently generated combat art. Cached frames and pooled nodes; coordinates remain renderer-owned. */
export class BattleAssets {
 private static frames:Record<string,SpriteFrame>={};private static loading:Promise<void>|null=null;
 static get ready(){const keys=Object.keys(BATTLE_FRAMES);return keys.length>0&&keys.every(k=>!!this.frames[k]);}
 static frame(key:string):SpriteFrame|null{return this.frames[key]||null;}
 static meta(key:string):BattleFrame|null{return BATTLE_FRAMES[key]||null;}
 static get diagnostics(){return{ready:this.ready,loading:!!this.loading,frames:Object.keys(this.frames).length,expectedFrames:Object.keys(BATTLE_FRAMES).length};}
 static async load(){if(this.ready)return;if(this.loading)return this.loading;this.loading=this.loadMissing();try{await this.loading;}finally{this.loading=null;}}
 private static async loadMissing(){
  const keys=Object.keys(BATTLE_FRAMES);if(!keys.length)throw Error('Battle art manifest is empty');
  const sheets=Array.from(new Set(keys.filter(k=>!this.frames[k]).map(k=>BATTLE_FRAMES[k].sheet)));
  const results=await Promise.all(sheets.map(sheet=>new Promise<unknown>(resolve=>resources.load(sheet+'/texture',Texture2D,(error,texture)=>{
   if(error||!texture){resolve(error||Error('Missing battle texture '+sheet));return;}
   keys.forEach(key=>{const d=BATTLE_FRAMES[key];if(d.sheet!==sheet||this.frames[key])return;const [x,y,w,h]=d.rect,f=new SpriteFrame();f.texture=texture;f.rect=new Rect(x,y,w,h);f.originalSize=new Size(w,h);f.offset=new Vec2();this.frames[key]=f;});resolve(null);
  }))));const failed=results.find(r=>r);if(failed)throw failed;
 }
 private pool=new Map<string,Node>();
 begin(){this.pool.forEach(n=>{if(isValid(n))n.active=false;});}
 draw(parent:Node,id:string,key:string,x:number,y:number,w:number,h:number,options:BattleDrawOptions={}):Node|null{
  const frame=BattleAssets.frame(key),d=BattleAssets.meta(key);if(!frame||!d)return null;
  let n=this.pool.get(id);if(!n||!isValid(n)){n=new Node(id);n.layer=Layers.Enum.UI_2D;n.addComponent(UITransform);n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;n.addComponent(UIOpacity);this.pool.set(id,n);}
  if(n.parent!==parent)parent.addChild(n);n.active=true;n.setSiblingIndex(parent.children.length-1);n.setPosition(x,y);n.setScale(1,options.flipY?-1:1,1);n.angle=options.angle||0;
  const u=n.getComponent(UITransform)!;u.setAnchorPoint(options.anchorX===undefined?d.anchor[0]:options.anchorX,options.anchorY===undefined?d.anchor[1]:options.anchorY);const logical=d.logicalSize||[d.rect[2],d.rect[3]];u.setContentSize(w*d.rect[2]/logical[0],h*d.rect[3]/logical[1]);
  const sprite=n.getComponent(Sprite)!;sprite.type=Sprite.Type.SIMPLE;sprite.spriteFrame=frame;sprite.color=new Color().fromHEX(options.tint||'#ffffff');n.getComponent(UIOpacity)!.opacity=options.alpha===undefined?255:options.alpha;return n;
 }
 drawHeight(parent:Node,id:string,key:string,x:number,y:number,height:number,options:BattleDrawOptions={}):Node|null{const d=BattleAssets.meta(key);return d?this.draw(parent,id,key,x,y,height*(d.logicalSize||[d.rect[2],d.rect[3]])[0]/(d.logicalSize||[d.rect[2],d.rect[3]])[1],height,options):null;}
 drawSlice(parent:Node,id:string,key:string,x:number,y:number,w:number,h:number,options:BattleDrawOptions={}):Node|null{const n=this.draw(parent,id,key,x,y,w,h,options),f=BattleAssets.frame(key),d=BattleAssets.meta(key);if(!n||!f||!d)return n;const ins=d.insets||[12,12,12,12];f.insetLeft=ins[0];f.insetRight=ins[1];f.insetTop=ins[2];f.insetBottom=ins[3];n.getComponent(Sprite)!.type=Sprite.Type.SLICED;n.getComponent(UITransform)!.setContentSize(w,h);return n;}
 end(){} hide(){this.begin();} destroy(){this.pool.forEach(n=>{if(isValid(n))n.destroy();});this.pool.clear();}
 get size(){return this.pool.size;}
 get bounds(){return Array.from(this.pool.entries()).filter(([,n])=>isValid(n)&&n.activeInHierarchy).map(([id,n])=>{const r=n.getComponent(UITransform)!.getBoundingBoxToWorld();return{id,left:r.x,right:r.x+r.width,bottom:r.y,top:r.y+r.height};});}
}
