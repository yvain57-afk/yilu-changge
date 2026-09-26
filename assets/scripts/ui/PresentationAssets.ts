import { Art, ArtSprites } from '../ArtSprites';
import { Color, Layers, Node, Rect, Size, Sprite, SpriteFrame, Texture2D, UIOpacity, UITransform, Vec2, resources } from 'cc';

/** Independent artwork only: no live values, hit areas, or gameplay state is baked in; the brand wordmark is separate. */
export const PRESENTATION_KEYS = ['home-bg','map-bg','camp-bg','result-bg','hero-home','hero-blade','brand-title','gold-button'] as const;
export type PresentationKey = typeof PRESENTATION_KEYS[number];
export type PresentationFit = 'cover'|'contain';
type Display = {node:Node;sprite:Sprite;transform:UITransform;opacity:UIOpacity;crop:SpriteFrame|null;signature:string};
export class PresentationAssets {
 private static frames:Partial<Record<PresentationKey,SpriteFrame>>={};
 private static loading:Promise<void>|null=null;
 private static errors:Partial<Record<PresentationKey,string>>={};
 static get ready(){return PRESENTATION_KEYS.every(k=>!!this.frames[k]);}
 static frame(key:PresentationKey){return this.frames[key]||null;}
 static get diagnostics(){return {ready:this.ready,loading:!!this.loading,loaded:Object.keys(this.frames),required:PRESENTATION_KEYS.slice(),errors:{...this.errors}};}
 static async load(){
  if(this.ready)return;if(this.loading)return this.loading;
  this.loading=this.loadMissing();try{await this.loading;}finally{this.loading=null;}
 }
 private static async loadMissing(){
  const missing=PRESENTATION_KEYS.filter(k=>!this.frames[k]);
  const results=await Promise.all(missing.map(key=>new Promise<string|null>(resolve=>resources.load(`ui20260925/${key}/texture`,Texture2D,(error,texture)=>{
   if(error||!texture){this.errors[key]=String(error||'Missing texture');resolve(key);return;}
   const frame=new SpriteFrame();frame.texture=texture;frame.rect=new Rect(0,0,texture.width,texture.height);frame.originalSize=new Size(texture.width,texture.height);frame.offset=new Vec2();if(key==='gold-button'){frame.insetLeft=60;frame.insetRight=60;frame.insetTop=16;frame.insetBottom=16;}this.frames[key]=frame;delete this.errors[key];resolve(null);
  }))));
  const failed=results.filter(Boolean);if(failed.length)throw Error(`Presentation artwork unavailable: ${failed.join(', ')}`);
 }
 private pool=new Map<string,Display>();
 private portraits=new Map<Art,SpriteFrame>();
 /** Start a page/scene update; draw reactivates only the objects owned by that page. */
 begin(){this.pool.forEach(d=>d.node.active=false);}
 /** All coordinates are parent-local Cocos units. contain retains the whole hero; cover crops UVs, never UI geometry. */
 draw(parent:Node,id:string,key:PresentationKey,x:number,y:number,w:number,h:number,mode:PresentationFit='cover',opacity=255,tint='#ffffff'):Node|null {
  return this.drawFrame(parent,id,key,PresentationAssets.frame(key),x,y,w,h,mode,opacity,tint);
 }
 /** Source corners stay 60/16 pixels; the visible rectangle exactly matches the requested button rectangle. */
 drawSlice(parent:Node,id:string,key:'gold-button',x:number,y:number,w:number,h:number,tint='#ffffff'):Node|null {
  return this.drawFrame(parent,id,key,PresentationAssets.frame(key),x,y,w,h,'slice',255,tint);
 }
 /** A real existing actor UV, cropped to its upper 64% for a portrait card. Not a new character asset. */
 drawPortrait(parent:Node,id:string,art:Art,x:number,y:number,w:number,h:number,opacity=255):Node|null {
  const original=ArtSprites.frames[art];if(!original)return null;
  let frame=this.portraits.get(art);if(!frame){const r=original.rect;frame=new SpriteFrame();frame.texture=original.texture;frame.rect=new Rect(r.x,r.y,r.width,r.height*.64);frame.originalSize=new Size(r.width,r.height*.64);frame.offset=new Vec2();this.portraits.set(art,frame);}
  return this.drawFrame(parent,id,`portrait:${art}`,frame,x,y,w,h,'contain',opacity,'#ffffff');
 }
 private drawFrame(parent:Node,id:string,key:string,full:SpriteFrame|null,x:number,y:number,w:number,h:number,mode:PresentationFit|'slice',opacity:number,tint:string):Node|null {
  if(!full||w<=0||h<=0){const old=this.pool.get(id);if(old)old.node.active=false;return null;}
  let d=this.pool.get(id);if(!d){const node=new Node(id);node.layer=Layers.Enum.UI_2D;const transform=node.addComponent(UITransform);transform.setAnchorPoint(.5,.5);const sprite=node.addComponent(Sprite);sprite.sizeMode=Sprite.SizeMode.CUSTOM;d={node,sprite,transform,opacity:node.addComponent(UIOpacity),crop:null,signature:''};this.pool.set(id,d);}
  if(d.node.parent!==parent)parent.addChild(d.node);d.node.active=true;d.node.setPosition(x,y);d.node.setScale(1,1,1);d.node.angle=0;d.sprite.type=mode==='slice'?Sprite.Type.SLICED:Sprite.Type.SIMPLE;d.opacity.opacity=opacity;d.sprite.color=new Color().fromHEX(tint);
  const signature=`${key}:${w}:${h}:${mode}`;
  if(d.signature!==signature){const fw=full.rect.width,fh=full.rect.height;if(mode==='slice'){d.sprite.spriteFrame=full;d.transform.setContentSize(w,h);}else if(mode==='contain'){const scale=Math.min(w/fw,h/fh);d.sprite.spriteFrame=full;d.transform.setContentSize(fw*scale,fh*scale);}else{const scale=Math.max(w/fw,h/fh),cw=w/scale,ch=h/scale;if(!d.crop)d.crop=new SpriteFrame();d.crop.texture=full.texture;d.crop.rect=new Rect(full.rect.x+(fw-cw)/2,full.rect.y+(fh-ch)/2,cw,ch);d.crop.originalSize=new Size(cw,ch);d.crop.offset=new Vec2();d.sprite.spriteFrame=d.crop;d.transform.setContentSize(w,h);}d.signature=signature;}
  return d.node;
 }
 hide(id:string){const d=this.pool.get(id);if(d)d.node.active=false;}
 end(){/* The pool retains inactive objects for the next visit; no allocation on ordinary frames. */}
 get diagnostics(){const active:string[]=[];this.pool.forEach((d,id)=>{if(d.node.activeInHierarchy)active.push(id);});return {nodes:this.pool.size,active};}
 destroy(){this.pool.forEach(d=>{d.node.destroy();d.crop?.destroy();});this.pool.clear();this.portraits.forEach(frame=>frame.destroy());this.portraits.clear();}
}
