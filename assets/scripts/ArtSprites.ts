import { Node, Sprite, SpriteFrame, Texture2D, Rect, Size, Vec2, UITransform, Layers, resources, Color, UIOpacity } from 'cc';
import { BattleAssets } from './BattleAssets';
import { BATTLE_FRAMES, BATTLE_LEGACY_ALIASES } from './BattleAtlas';
import { ART_FRAMES as S2B_FRAMES } from './ArtAtlas';
import { V03_FRAMES } from './ArtAtlasV03';
import { V051_FRAMES } from './ArtAtlasV051';
import { V05_FRAMES } from './ArtAtlasV05';
import { V04_FRAMES } from './ArtAtlasV04';
import { V031_FRAMES } from './ArtAtlasV031';
const ALL_FRAMES={...S2B_FRAMES,...V03_FRAMES,...V031_FRAMES,...V04_FRAMES,...V05_FRAMES,...V051_FRAMES};
// Earlier rank artwork is superseded by the current spear/blade upper bodies.
export const ART_FRAMES=(Object.keys(ALL_FRAMES) as (keyof typeof ALL_FRAMES)[]).reduce((frames,key)=>{if(ALL_FRAMES[key].sheet!=='v4/heroes')Object.assign(frames,{[key]:BATTLE_LEGACY_ALIASES[key]?BATTLE_FRAMES[BATTLE_LEGACY_ALIASES[key]]:ALL_FRAMES[key]});return frames;},{} as typeof ALL_FRAMES);
export type Art = keyof typeof ART_FRAMES;
/** A shared atlas and one Sprite per actor; no individual skeleton/Graphics buffers. */
export class ArtSprites {
 static frames:Partial<Record<Art,SpriteFrame>>={};
 static get ready(){return BattleAssets.ready&&Object.keys(ART_FRAMES).every(k=>!!ArtSprites.frames[k as Art]);}
 private static loading:Promise<void>|null=null;
 static get diagnostics(){return {loading:!!this.loading,ready:this.ready,frames:Object.keys(this.frames).length,expectedFrames:Object.keys(ART_FRAMES).length,sheets:Array.from(new Set((Object.keys(ART_FRAMES) as Art[]).map(k=>ART_FRAMES[k].sheet)))};}
 static async load(){
  if(this.ready)return;
  if(this.loading)return this.loading;
  this.loading=this.loadMissing();
  try{await this.loading;}finally{this.loading=null;}
 }
 private static async loadMissing(){
  await BattleAssets.load();
  const sheets=Array.from(new Set((Object.keys(ART_FRAMES) as Art[]).filter(k=>!this.frames[k]).map(k=>ART_FRAMES[k].sheet)));
  const results=await Promise.all(sheets.map(sheet=>new Promise<unknown>(resolve=>resources.load(`${sheet.includes('/')?sheet:'v3/'+sheet}/texture`,Texture2D,(e,t)=>{
   if(e||!t){resolve(e||new Error(`Missing texture ${sheet}`));return;}
   for(const name of Object.keys(ART_FRAMES) as Art[]){const d=ART_FRAMES[name];if(d.sheet!==sheet||this.frames[name])continue;const [x,y,w,h]=d.rect,f=new SpriteFrame();f.texture=t;f.rect=new Rect(x,y,w,h);f.originalSize=new Size(w,h);f.offset=new Vec2();this.frames[name]=f;}
   resolve(null);
  }))));
  const failed=results.find(e=>e);if(failed)throw failed;
 }

 private pool=new Map<string,Node>();
 begin(){for(const n of this.pool.values())n.active=false;}
 draw(id:string,art:Art,parent:Node,x:number,y:number,scale:number,angle=0,alpha=255,tint='#ffffff'){
  let n=this.pool.get(id);if(!n){n=new Node(id);n.layer=Layers.Enum.UI_2D;n.addComponent(UITransform);n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;n.addComponent(UIOpacity);this.pool.set(id,n);}if(n.parent!==parent)parent.addChild(n);n.active=true;n.setSiblingIndex(parent.children.length-1);n.setPosition(x,y);n.setScale(scale,scale,1);n.angle=angle;
  const d=ART_FRAMES[art],[rx,ry,w,h]=d.rect,u=n.getComponent(UITransform)!;u.setAnchorPoint((d.pivot[0]-rx)/w,(ry+h-d.pivot[1])/h);u.setContentSize(w,h);const s=n.getComponent(Sprite)!;s.spriteFrame=ArtSprites.frames[art]!;s.color=new Color().fromHEX(tint);n.getComponent(UIOpacity)!.opacity=alpha;return n;
 }
 get size(){return this.pool.size;}
 get bounds(){return Array.from(this.pool.entries()).filter(([,n])=>n.activeInHierarchy).map(([id,n])=>{const r=n.getComponent(UITransform)!.getBoundingBoxToWorld();return{id,left:r.x,right:r.x+r.width,bottom:r.y,top:r.y+r.height};});}
}
