import { Node, Sprite, SpriteFrame, Texture2D, Rect, Size, Vec2, UITransform, Layers, resources, Color, UIOpacity } from 'cc';
import { ART_FRAMES } from './ArtAtlas';
export type Art = keyof typeof ART_FRAMES;
/** A shared atlas and one Sprite per actor; no individual skeleton/Graphics buffers. */
export class ArtSprites {
 static frames:Partial<Record<Art,SpriteFrame>>={};
 static async load(){await Promise.all(['actors','scenery'].map(sheet=>new Promise<void>((resolve,reject)=>resources.load(`v3/${sheet}/texture`,Texture2D,(e,t)=>{if(e){reject(e);return;}for(const name of Object.keys(ART_FRAMES) as Art[]){const d=ART_FRAMES[name];if(d.sheet!==sheet)continue;const [x,y,w,h]=d.rect,f=new SpriteFrame();f.texture=t;f.rect=new Rect(x,y,w,h);f.originalSize=new Size(w,h);f.offset=new Vec2();ArtSprites.frames[name]=f;}resolve();}))));}
 private pool=new Map<string,Node>();
 begin(){for(const n of this.pool.values())n.active=false;}
 draw(id:string,art:Art,parent:Node,x:number,y:number,scale:number,angle=0,alpha=255,tint='#ffffff'){
  let n=this.pool.get(id);if(!n){n=new Node(id);n.layer=Layers.Enum.UI_2D;n.addComponent(UITransform);n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;n.addComponent(UIOpacity);this.pool.set(id,n);}if(n.parent!==parent)parent.addChild(n);n.active=true;n.setSiblingIndex(parent.children.length-1);n.setPosition(x,y);n.setScale(scale,scale,1);n.angle=angle;
  const d=ART_FRAMES[art],[rx,ry,w,h]=d.rect,u=n.getComponent(UITransform)!;u.setAnchorPoint((d.pivot[0]-rx)/w,(ry+h-d.pivot[1])/h);u.setContentSize(w,h);const s=n.getComponent(Sprite)!;s.spriteFrame=ArtSprites.frames[art]!;s.color=new Color().fromHEX(tint);n.getComponent(UIOpacity)!.opacity=alpha;return n;
 }
 get size(){return this.pool.size;}
 get bounds(){return Array.from(this.pool.entries()).filter(([,n])=>n.activeInHierarchy).map(([id,n])=>{const r=n.getComponent(UITransform)!.getBoundingBoxToWorld();return{id,left:r.x,right:r.x+r.width,bottom:r.y,top:r.y+r.height};});}
}
