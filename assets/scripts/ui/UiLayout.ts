/** Logical window coordinates; only UI is converted to the centered Cocos design space. */
export type UiRect={left:number;top:number;right:number;bottom:number};
export type WindowMetrics={width:number;height:number;safe:UiRect;capsule:UiRect|null;source:string;safeSource:string;capsuleSource:string;revision:number};
export function uiLayout(m:WindowMetrics,designWidth:number,designHeight:number){
 const k=designWidth/m.width,L=m.safe.left+20,R=m.safe.right-20,T=Math.max(m.safe.top,m.capsule?.bottom??0)+8,B=m.safe.bottom-16;
 return {k,L,R,T,B,short:m.height<700,width:m.width,height:m.height,
  rect:(x:number,y:number,w:number,h:number)=>({x:(x+w/2-m.width/2)*k,y:designHeight/2-(y+h/2)*k,w:w*k,h:h*k}),
  point:(x:number,y:number)=>({x:(x-m.width/2)*k,y:designHeight/2-y*k})};
}
export const UI_THEME={ink:'#1E2F46',deep:'#142432',paper:'#F4EBDC',gold:'#D4B06A',red:'#C94537',muted:'#BFC9BE',danger:'#73382D'};

/** Separate preparation content regions in the same safe coordinates as hit targets. */
export function preparationLayout(a:ReturnType<typeof uiLayout>){
 const controls=a.B-278,portraitTop=a.T+98,portraitBottom=controls-12;
 return {header:{top:a.T,height:88},portrait:{top:portraitTop,bottom:portraitBottom,height:portraitBottom-portraitTop},controls,footer:a.B-56};
}
