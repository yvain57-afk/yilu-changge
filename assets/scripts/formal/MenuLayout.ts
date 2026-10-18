import {UIRect} from './UIComponents';

export function intersection(a:UIRect,b:UIRect):UIRect|null {
 const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.x+a.w,b.x+b.w),bottom=Math.min(a.y+a.h,b.y+b.h);
 return right>x&&bottom>y?{x,y,w:right-x,h:bottom-y}:null;
}
export function inset(r:UIRect,p=8):UIRect {return{x:r.x+p,y:r.y+p,w:Math.max(0,r.w-p*2),h:Math.max(0,r.h-p*2)};}
export function clipHit(r:UIRect,viewport:UIRect,min=48):UIRect|null {
 const v=intersection(r,viewport);return v&&v.w>=min&&v.h>=min?v:null;
}
export interface TextLayout {lines:string[];size:number;lineHeight:number;width:number;height:number;}
/** The same measured lines drive both content height and Label emission. No character-count estimate. */
export function layoutText(text:string,width:number,size:number,measure:(s:string,n:number)=>number):TextLayout {
 const lines:string[]=[];
 for(const paragraph of String(text).split('\n')){
  let line='';for(const c of paragraph){if(line&&measure(line+c,size)>width){lines.push(line);line='';}line+=c;}
  lines.push(line);
 }
 return{lines,size,lineHeight:size+6,width,height:lines.length*(size+6)};
}
export class MenuViewState {
 private views=new Map<string,{scroll:number;page:number;focus:string}>();key='';
 enter(key:string,scroll:number,page:number,focus=''){
  if(key===this.key)return{scroll,page,focus};
  if(this.key)this.views.set(this.key,{scroll,page,focus});
  this.key=key;return this.views.get(key)||{scroll:0,page:0,focus:''};
 }
 remember(scroll:number,page:number,focus=''){if(this.key)this.views.set(this.key,{scroll,page,focus});}
}

/** Screen-space slots are computed before drawing either artwork or controls. */
export function homeLayout(W:number,H:number,top:number,bottom:number,reward=false){
 const extra=reward?58:0, navY=H-bottom-66-extra,actionY=navY-62;
 const actionTop=actionY-98,header={x:20,y:top+8,w:W-40,h:70};
 const hero={x:8,y:top+68,w:W-16,h:Math.max(110,actionTop-top-76)};
 return{header,hero,actionY,actionTop,navY,rewardY:H-bottom-62,titleWidth:W-112,
  fadeTop:actionTop-74,composition:'continuous-landscape' as const};
}
