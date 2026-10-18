// === FILE START: assets/scripts/formal/UIComponents.ts ===
import {UI_FRAMES, UI_PIXELS_PER_UNIT, UI_SHEET, UIFrame, UIFrameKey} from './UIFrames';

/** NativePaint's retained sprite/label surface; structural type also permits isolated geometry tests. */
export interface UIPaint {
 drawImage(image: {sheet:string;tint?:string;visualMode?:string;grayscale?:boolean;silhouette?:boolean},sx:number,sy:number,sw:number,sh:number,x:number,y:number,w:number,h:number):void;
 save():void; restore():void;
 font:string; fillStyle:unknown; textAlign:string; textBaseline:string;
 fillText(text:string,x:number,y:number):void;
 fillRect?(x:number,y:number,w:number,h:number):void;
 strokeRect?(x:number,y:number,w:number,h:number):void;
 beginPath?():void; moveTo?(x:number,y:number):void; lineTo?(x:number,y:number):void; closePath?():void; fill?():void; stroke?():void;
 strokeStyle?:unknown; lineWidth?:number;
}
export interface UIRect {x:number;y:number;w:number;h:number;}
export interface UIPatch {source: UIRect;target: UIRect;}
export type ButtonState='normal'|'pressed'|'disabled';
export type ButtonTone='gold'|'navy'|'warning';
export type PanelState='normal'|'raised'|'muted';
export type TabState='normal'|'selected'|'disabled';
export type CardState='normal'|'selected'|'locked';
export type StateIcon='locked'|'empty'|'loading'|'error';
export type MapPlaqueState='selected'|'current'|'cleared'|'locked';
export interface ButtonOptions {tone?:ButtonTone;state?:ButtonState;fontSize?:number;}
export interface UIResult {bounds:UIRect;content:UIRect;enabled:boolean;}
export interface NavBarOptions {
 backLabel?:string;
 showBack?:boolean;
 rightLabel?:string;
 pressedBack?:boolean;
 pressedRight?:boolean;
}
export interface NavBarResult extends UIResult {
 backHit:UIRect|null;
 rightHit:UIRect|null;
 titleRect:UIRect;
}

const copy=(r:UIRect):UIRect=>({...r});
function valid(r:UIRect){if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)throw Error('ui_invalid_rect');}
function get(key:UIFrameKey):UIFrame {return UI_FRAMES[key];}
function border(f:UIFrame,r:UIRect,density=1):number[] {
 if(!f.m)return [0,0,0,0];
 const [l,t,rr,b]=f.m;
 // If the target is unusually small, scale all corner dimensions uniformly instead of inverting center rects.
 const scale=Math.min(density/UI_PIXELS_PER_UNIT,r.w/(l+rr||1),r.h/(t+b||1));
 return [l*scale,t*scale,rr*scale,b*scale];
}
function content(f:UIFrame,r:UIRect,density=1):UIRect {
 const [l,t,rr,b]=border(f,r,density);return{x:r.x+l,y:r.y+t,w:Math.max(0,r.w-l-rr),h:Math.max(0,r.h-t-b)};
}
/** Pure geometry: true nine-slice, source corners never borrow pixels from a neighbouring atlas frame. */
export function planNineSlice(key:UIFrameKey,r:UIRect,density=1):UIPatch[] {
 valid(r);const f=get(key),[sx,sy,sw,sh]=f.r;
 if(!f.m)return[{source:{x:sx,y:sy,w:sw,h:sh},target:copy(r)}];
 const [l,t,rr,b]=f.m,[dl,dt,dr,db]=border(f,r,density);
 const xs=[sx,sx+l,sx+sw-rr,sx+sw],ys=[sy,sy+t,sy+sh-b,sy+sh];
 const xd=[r.x,r.x+dl,r.x+r.w-dr,r.x+r.w],yd=[r.y,r.y+dt,r.y+r.h-db,r.y+r.h];
 const patches:UIPatch[]=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const source={x:xs[col],y:ys[row],w:xs[col+1]-xs[col],h:ys[row+1]-ys[row]};
  const target={x:xd[col],y:yd[row],w:xd[col+1]-xd[col],h:yd[row+1]-yd[row]};
  if(source.w>0&&source.h>0&&target.w>1e-8&&target.h>1e-8)patches.push({source,target});
 }
 return patches;
}
function emit(p:UIPaint,patches:UIPatch[],clip?:UIRect){
 for(const patch of patches){let source=patch.source,target=patch.target;
  if(clip){
   const x=Math.max(target.x,clip.x),y=Math.max(target.y,clip.y),right=Math.min(target.x+target.w,clip.x+clip.w),bottom=Math.min(target.y+target.h,clip.y+clip.h);
   if(right<=x||bottom<=y)continue;
   source={x:source.x+(x-target.x)/target.w*source.w,y:source.y+(y-target.y)/target.h*source.h,w:(right-x)/target.w*source.w,h:(bottom-y)/target.h*source.h};target={x,y,w:right-x,h:bottom-y};
  }
  p.drawImage({sheet:UI_SHEET},source.x,source.y,source.w,source.h,target.x,target.y,target.w,target.h);
 }
}
export function drawNineSlice(p:UIPaint,key:UIFrameKey,r:UIRect):UIResult {
 emit(p,planNineSlice(key,r));return{bounds:copy(r),content:content(get(key),r),enabled:true};
}
function label(p:UIPaint,text:string,r:UIRect,size:number,color:string){
 if(!text)return;p.save();p.font=`700 ${size}px sans-serif`;p.fillStyle=color;p.textAlign='center';p.textBaseline='middle';p.fillText(text,r.x+r.w/2,r.y+r.h/2);p.restore();
}
export function drawPanel(p:UIPaint,r:UIRect,state:PanelState='normal'):UIResult {
 return drawNineSlice(p,`ui_panel_navy__${state}`,r);
}
/** Caller owns hit testing and state. A disabled return must never be registered as an actionable button. */
export function drawButton(p:UIPaint,r:UIRect,text='',options:ButtonOptions={}):UIResult {
 const {tone='gold',state='normal',fontSize=16}=options;
 const face=state==='pressed'?{...r,y:r.y+1,h:r.h-1}:r;
 const result=drawNineSlice(p,`ui_button_${tone}__${state}`,face);
 label(p,text,result.content,fontSize,state==='disabled'?'#C0BEC0':tone==='gold'?'#302419':'#F3EEE1');
 return{...result,bounds:copy(r),content:result.content,enabled:state!=='disabled'};
}
export function drawTab(p:UIPaint,r:UIRect,text='',state:TabState='normal'):UIResult {
 const result=drawNineSlice(p,`ui_tab__${state}`,r);label(p,text,result.content,15,state==='disabled'?'#B5BEC6':'#F3EEE1');return{...result,enabled:state!=='disabled'};
}
export function drawCard(p:UIPaint,r:UIRect,state:CardState='normal'):UIResult {
 return drawNineSlice(p,`ui_card_item__${state}`,r);
}
/** Smaller uniform corners for dense menu rows; source corners retain aspect ratio. */
export function drawCompactCard(p:UIPaint,r:UIRect,state:CardState='normal'):UIResult {
 const key: UIFrameKey=`ui_card_item__${state}`;
 emit(p,planNineSlice(key,r,.42));return{bounds:copy(r),content:content(get(key),r,.42),enabled:true};
}
export function drawCompactPanel(p:UIPaint,r:UIRect,state:PanelState='normal'):UIResult {
 const key:UIFrameKey=`ui_panel_navy__${state}`;
 emit(p,planNineSlice(key,r,.42));return{bounds:copy(r),content:content(get(key),r,.42),enabled:true};
}
export function drawDialog(p:UIPaint,r:UIRect,warning=false):UIResult {
 return drawNineSlice(p,warning?'ui_dialog__warning':'ui_dialog__normal',r);
}
export function drawRewardSocket(p:UIPaint,r:UIRect,highlight=false):UIResult {
 return drawNineSlice(p,highlight?'ui_reward_socket__highlight':'ui_reward_socket__normal',r);
}
/** Fit both axes once, then stretch only the middle horizontally: side-tail art preserves aspect ratio. */
export function drawBanner(p:UIPaint,r:UIRect,kind:'victory'|'milestone'='victory'):UIResult {
 valid(r);const f=get(`ui_banner_${kind}__normal`),[sx,sy,sw,sh]=f.r,[left,,right]=f.m!;
 const scale=Math.min(r.h/sh,r.w/(left+right));const h=sh*scale,y=r.y+(r.h-h)/2,l=left*scale,rr=right*scale;
 const widths=[left,sw-left-right,right],targets=[l,r.w-l-rr,rr];let ax=sx,bx=r.x;
 for(let i=0;i<3;i++){if(targets[i]>1e-8)emit(p,[{source:{x:ax,y:sy,w:widths[i],h:sh},target:{x:bx,y,w:targets[i],h}}]);ax+=widths[i];bx+=targets[i];}
 return{bounds:copy(r),content:{x:r.x+l,y:y+h*.17,w:Math.max(0,r.w-l-rr),h:h*.45},enabled:true};
}
export function drawState(p:UIPaint,r:UIRect,state:StateIcon):UIResult {
 return drawFitted(p,`ui_lock_empty__${state}`,r);
}
export function drawMedal(p:UIPaint,r:UIRect):UIResult {return drawFitted(p,'ui_medal_base__normal',r);}
function drawFitted(p:UIPaint,key:UIFrameKey,r:UIRect):UIResult {
 valid(r);const [sx,sy,sw,sh]=get(key).r,scale=Math.min(r.w/sw,r.h/sh),w=sw*scale,h=sh*scale;
 const target={x:r.x+(r.w-w)/2,y:r.y+(r.h-h)/2,w,h};emit(p,[{source:{x:sx,y:sy,w:sw,h:sh},target}]);return{bounds:copy(r),content:target,enabled:true};
}
/** Null means indeterminate: show only the track, never fabricate a percentage. Fill clips the full-sized material. */
export function drawProgress(p:UIPaint,r:UIRect,fraction:number|null):UIResult {
 const result=drawNineSlice(p,'ui_progress_track__normal',r);
 if(fraction===null)return result;
 if(!Number.isFinite(fraction))throw Error('ui_invalid_progress');
 const n=Math.max(0,Math.min(1,fraction));if(n===0)return result;
 const pad=Math.min(3,r.h/4),inside={x:r.x+pad,y:r.y+pad,w:r.w-2*pad,h:r.h-2*pad};
 emit(p,planNineSlice('ui_progress_fill__normal',inside),{...inside,w:inside.w*n});return result;
}

/**
 * Unified Top Navigation Bar (`drawNavBar`):
 * Renders the raised header panel, optional top-left lightweight back trigger (`‹ 返回`),
 * optional top-right action pill (e.g. `定位`), and returns safe centered title bounds.
 */
export function drawNavBar(p:UIPaint,r:UIRect,options:NavBarOptions={}):NavBarResult {
 valid(r);
 const {backLabel='‹ 返回',showBack=true,rightLabel='',pressedBack=false,pressedRight=false}=options;
 const panel=drawCompactPanel(p,r,'raised');
 const sideReserve=(showBack||rightLabel)?62:14;
 const backHit:UIRect|null=showBack?{x:r.x,y:r.y,w:68,h:Math.max(48,Math.min(56,r.h))}:null;
 const rightHit:UIRect|null=rightLabel?{x:r.x+r.w-68,y:r.y,w:68,h:Math.max(48,Math.min(56,r.h))}:null;
 if(backHit){
  p.save();
  if(p.fillRect){
   p.fillStyle=pressedBack?'rgba(217,185,120,0.22)':'rgba(12,24,36,0.38)';
   p.fillRect(backHit.x+6,backHit.y+8,54,32);
  }
  p.restore();
  label(p,backLabel,{x:backHit.x+6,y:backHit.y+8,w:54,h:32},13,'#F1D9A0');
 }
 if(rightHit){
  p.save();
  if(p.fillRect){
   p.fillStyle=pressedRight?'rgba(217,185,120,0.22)':'rgba(12,24,36,0.38)';
   p.fillRect(rightHit.x+8,rightHit.y+8,54,32);
  }
  p.restore();
  label(p,rightLabel,{x:rightHit.x+8,y:rightHit.y+8,w:54,h:32},13,'#F1D9A0');
 }
 const titleRect:UIRect={
  x:r.x+sideReserve,
  y:panel.content.y+2,
  w:Math.max(60,r.w-sideReserve*2),
  h:Math.max(24,panel.content.h-4),
 };
 return{
  bounds:panel.bounds,
  content:panel.content,
  enabled:true,
  backHit,
  rightHit,
  titleRect,
 };
}

/**
 * Primary L1 Segmented Bar: shared navy dock with highlighted active segment.
 */
export function drawSegmentedBar(p:UIPaint,r:UIRect,items:{id:string;label:string}[],activeId:string):{bounds:UIRect;segments:{id:string;label:string;rect:UIRect}[]} {
 valid(r);
 drawCompactPanel(p,r,'muted');
 const pad=4,gap=4,n=Math.max(1,items.length);
 const innerW=r.w-pad*2-gap*(n-1),segW=innerW/n,segH=r.h-pad*2;
 const segments:{id:string;label:string;rect:UIRect}[]=[];
 items.forEach((it,i)=>{
  const sx=r.x+pad+i*(segW+gap),sy=r.y+pad,sr={x:sx,y:sy,w:segW,h:segH};
  const selected=it.id===activeId;
  if(selected){
   emit(p,planNineSlice('ui_tab__selected',sr,.38));
   if(p.fillRect){
    p.save();p.fillStyle='#D9B978';p.fillRect(sx+segW*.24,sy+segH-3,segW*.52,2);p.restore();
   }
  }else if(p.fillRect){
   p.save();p.fillStyle='rgba(12,24,36,0.35)';p.fillRect(sx,sy,segW,segH);p.restore();
  }
  label(p,it.label,sr,15,selected?'#F5E0AC':'#B8C4CC');
  segments.push({id:it.id,label:it.label,rect:sr});
 });
 return{bounds:copy(r),segments};
}

/**
 * Secondary L2 Filter Pill: lightweight semi-transparent capsule/underline indicator.
 */
export function drawFilterPill(p:UIPaint,r:UIRect,text:string,selected=false):UIResult {
 valid(r);
 p.save();
 if(p.fillRect){
  p.fillStyle=selected?'rgba(212,178,106,0.18)':'rgba(15,29,43,0.55)';
  if(p.beginPath&&p.moveTo&&p.lineTo&&p.closePath&&p.fill){
   const radius=Math.min(r.h/2,r.w/2);
   p.beginPath();
   for(let corner=0;corner<4;corner++)for(let step=0;step<=6;step++){
    const angle=(-Math.PI/2+corner*Math.PI/2)+step*Math.PI/12;
    const cx=r.x+(corner<2?r.w-radius:radius),cy=r.y+(corner===0||corner===3?radius:r.h-radius);
    const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;
    if(corner===0&&step===0)p.moveTo(x,y);else p.lineTo(x,y);
   }
   p.closePath();p.fill();
  }else p.fillRect(r.x,r.y,r.w,r.h);
  p.fillStyle=selected?'#E8C982':'rgba(140,156,168,0.28)';
  p.fillRect(r.x+6,r.y+r.h-(selected?2.5:1),Math.max(4,r.w-12),selected?2.5:1);
 }else{
  emit(p,planNineSlice(selected?'ui_tab__selected':'ui_tab__normal',r,.3));
 }
 p.restore();
 label(p,text,r,13,selected?'#F4DDA4':'#BAC6CE');
 return{bounds:copy(r),content:copy(r),enabled:true};
}

/**
 * Ancient-style chamfered Map Plaque for chapter nodes on the Shanhe campaign map.
 */
export function drawMapPlaque(p:UIPaint,r:UIRect,text:string,state:MapPlaqueState='cleared'):UIResult {
 valid(r);
 const c=Math.min(6,r.h*.22);
 const bg=state==='selected'?'rgba(20,36,50,0.96)':state==='current'?'rgba(28,44,58,0.95)':state==='locked'?'rgba(24,34,44,0.78)':'rgba(242,234,212,0.94)';
 const borderCol=state==='selected'?'#E8C67A':state==='current'?'#D4B06A':state==='locked'?'rgba(120,134,146,0.45)':'#8C764C';
 const textCol=state==='selected'||state==='current'?'#F5E2B2':state==='locked'?'#9AA6B0':'#2E271E';
 p.save();
 if(p.beginPath&&p.moveTo&&p.lineTo&&p.closePath&&p.fill&&p.stroke){
  const trace=()=>{
   p.beginPath!();
   p.moveTo!(r.x+c,r.y);
   p.lineTo!(r.x+r.w-c,r.y);
   p.lineTo!(r.x+r.w,r.y+c);
   p.lineTo!(r.x+r.w,r.y+r.h-c);
   p.lineTo!(r.x+r.w-c,r.y+r.h);
   p.lineTo!(r.x+c,r.y+r.h);
   p.lineTo!(r.x,r.y+r.h-c);
   p.lineTo!(r.x,r.y+c);
   p.closePath!();
  };
  p.fillStyle=bg;trace();p.fill!();
  p.strokeStyle=borderCol;p.lineWidth=state==='selected'?1.8:1;trace();p.stroke!();
  if((state==='selected'||state==='current')&&p.fillRect){
   p.fillStyle='#E8C67A';
   p.fillRect(r.x+3,r.y+r.h/2-4,2,8);
   p.fillRect(r.x+r.w-5,r.y+r.h/2-4,2,8);
  }
 }else if(p.fillRect){
  p.fillStyle=bg;p.fillRect(r.x,r.y,r.w,r.h);
 }
 p.restore();
 label(p,text,r,13,textCol);
 return{bounds:copy(r),content:{x:r.x+6,y:r.y+2,w:r.w-12,h:r.h-4},enabled:true};
}
// === FILE END: assets/scripts/formal/UIComponents.ts ===
