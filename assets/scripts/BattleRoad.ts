import { Node } from 'cc';
import { project } from './VisualConfig';

export type BattleTextureDrawer = {
 draw(parent:Node,id:string,key:string,x:number,y:number,w:number,h:number,options?:{anchorX?:number;anchorY?:number;angle?:number;alpha?:number;tint?:string}):Node|null|undefined;
};
const mod=(n:number,m:number)=>((n%m)+m)%m;
/** Texture cells are fixed in world space. A recycled node never changes a
 * visible tile's UV, and no camera fractional remainder is rounded to pixels. */
export class BattleRoad {
 private facts={stripCount:0,horizonStripCount:0,horizonTextureRows:128,groundTiles:0,firstWorldStrip:0,lastWorldStrip:0,worldZ:0,tileWorldLength:8,projection:'VisualConfig.project',texture:'road-source'};
 draw(parent:Node,art:BattleTextureDrawer,z:number,bottom=-1900,top=1900){
  const length=8,rows=32,step=length/rows,near=(bottom+270)/104,far=(top+270)/104;
  const first=Math.floor((z+near)/step)-1,last=Math.ceil((z+far)/step)+1,capacity=last-first+1;
  // A full square grass texture is tiled at equal width and height. Unlike
  // the former narrow verge strip, its blades are never stretched sideways.
  const grassSize=512,grassLength=grassSize/104,firstGround=Math.floor((z+near)/grassLength)-1,lastGround=Math.ceil((z+far)/grassLength)+1,groundCapacity=lastGround-firstGround+1;
  for(let i=firstGround;i<=lastGround;i++){
   const a=project(0,i*grassLength-z),b=project(0,(i+1)*grassLength-z),slot=mod(i,groundCapacity);
   for(const column of [-1,0,1]){const node=art.draw(parent,`battle-grass-${column}-${slot}`,'grassGround',column*grassSize,(a.y+b.y)/2,grassSize+.5,b.y-a.y+.5,{anchorY:.5});if(node)node.setScale(mod(column,2)?-1:1,mod(i,2)?-1:1,1);}
  }
  for(let i=first;i<=last;i++){
   const d=i*step-z,a=project(0,d),b=project(0,d+step),mid=project(0,d+step/2),flipped=mod(Math.floor(i/rows),2)!==0,row=flipped?mod(i,rows):rows-1-mod(i,rows);
   // The source's stone corridor occupies its inner ~70%; the texture's total
   // span is wider than the playable corridor so grass lands beyond its edge.
   const node=art.draw(parent,`battle-road-${mod(i,capacity)}`,`roadStrip${('0'+row).slice(-2)}`,0,(a.y+b.y)/2,3.65*260*mid.s,b.y-a.y+.55,{anchorY:.5});if(node&&flipped)node.setScale(1,-1,1);
  }
  this.facts={...this.facts,stripCount:capacity,groundTiles:groundCapacity*3,firstWorldStrip:first,lastWorldStrip:last,worldZ:z};
 }
 /** Short transparent continuation over the distant artwork. Gameplay feet
  * retain a visible road beneath them; only this decorative texture fades. */
 drawHorizon(parent:Node,art:BattleTextureDrawer,z:number,bottom=340,top=620){
  const rows=128,step=8/rows,first=Math.floor((z+(bottom+270)/104)/step),last=Math.ceil((z+(top+270)/104)/step);
  for(let i=first;i<=last;i++){
   const d=i*step-z,a=project(0,d),b=project(0,d+step),mid=project(0,d+step/2),flipped=mod(Math.floor(i/rows),2)!==0,row=flipped?mod(i,rows):rows-1-mod(i,rows),alpha=Math.round(255*Math.max(0,Math.min(1,(top-mid.y)/(top-410))));
   const node=art.draw(parent,`battle-road-horizon-${mod(i,64)}`,`roadFine${('00'+row).slice(-3)}`,0,(a.y+b.y)/2,3.65*260*mid.s,b.y-a.y+.55,{anchorY:.5,alpha});if(node&&flipped)node.setScale(1,-1,1);
  }
  this.facts.horizonStripCount=last-first+1;
 }
 get diagnostics(){return this.facts;}
}
