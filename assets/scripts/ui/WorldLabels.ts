/** Passive world labels. A label never travels away from its object's anchor to
 * squeeze under the HUD. Targets claim space first; grouped crate cards may
 * use their own adjacent side/bottom anchors, and the team badge uses free space. */
export type WorldLabel={id:string;text:string;x:number;y:number;width:number;size:number;color:string;fill?:string;priority:number;depth:number;anchorY?:number;leaderX?:number;leaderY?:number;height?:number;scale?:number;alternatives?:{x:number;y:number}[];avoid?:{x:number;y:number;width:number;height:number}[];secondary?:string;ratio?:number;icon?:string;locked?:boolean;compactText?:string;compactWidth?:number};
export type WorldLabelPlaced=WorldLabel&{sourceX:number;sourceY:number;shifted:boolean;compact?:boolean};
export class WorldLabels {
 private pending:WorldLabel[]=[];
 placed:WorldLabelPlaced[]=[];
 hidden:{id:string;reason:'outside-viewport'|'crowded'}[]=[];
 begin(){this.pending=[];this.placed=[];this.hidden=[];}
 add(label:WorldLabel){this.pending.push(label);}
 layout(bounds={left:-344,right:344,bottom:-590,top:490}){
  this.placed=[];this.hidden=[];
  const important=(l:WorldLabel)=>l.priority>=10?1:0;
  const ordered=this.pending.sort((a,b)=>important(b)-important(a)||a.depth-b.depth||b.priority-a.priority||a.id.localeCompare(b.id));
  for(const source of ordered){
   // Do not pin distant labels to the safe-area edge: that produced stacked,
   // disconnected labels for targets which were still behind the top HUD.
   if(source.y>bounds.top||source.y<bounds.bottom||(source.anchorY!==undefined&&(source.anchorY>bounds.top||source.anchorY<bounds.bottom))){this.hidden.push({id:source.id,reason:'outside-viewport'});continue;}
   const variants=[source];
   if(source.compactText)variants.push({...source,text:source.compactText,width:source.compactWidth??source.width*.76,size:Math.max(24,source.size-3)});
   let placed:WorldLabelPlaced|undefined;
   for(const variant of variants){for(const l of [variant,...(variant.alternatives??[]).map(pos=>({...variant,...pos}))]){const width=Math.min(l.width,bounds.right-bounds.left),x=Math.max(bounds.left+width/2,Math.min(bounds.right-width/2,l.x)),h=l.height??l.size*1.3+8;
    if(Math.abs(x-l.x)>24)continue;
    // Small vertical correction only; any side/bottom anchor is explicit per object.
    // Never retain an unresolved overlap as the old allocator did.
    for(const dy of l.locked?[0]:[0,10,-10,20,-20]){const y=l.y+dy;if(y-h/2<bounds.bottom||y+h/2>bounds.top)continue;
     const overlap=this.placed.some(p=>Math.abs(p.x-x)<(p.width+width)/2+5&&Math.abs(p.y-y)<((p.height??p.size*1.3+8)+h)/2+3);
     if(overlap||(source.avoid??[]).some(p=>Math.abs(p.x-x)<(p.width+width)/2+4&&Math.abs(p.y-y)<(p.height+h)/2+4))continue;
     placed={...l,x,y,width,sourceX:source.x,sourceY:source.y,shifted:Math.abs(dy)>4||Math.abs(x-source.x)>4,compact:variant!==source};break;
    }
    if(placed)break;
   }if(placed)break;}
   if(placed)this.placed.push(placed);else this.hidden.push({id:source.id,reason:'crowded'});
  }
  return this.placed;
 }
}
