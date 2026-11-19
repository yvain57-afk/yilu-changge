import {MANIFEST} from './manifest';

/** The small Canvas-shaped subset implemented by NativePaint; no DOM or timers. */
export interface GrowthPaint {
 globalAlpha:number; globalCompositeOperation:string; fillStyle:any; strokeStyle:any;
 lineWidth:number; lineCap:string; font:string; textAlign:string; textBaseline:string;
 save():void; restore():void; beginPath():void; closePath():void;
 moveTo(x:number,y:number):void; lineTo(x:number,y:number):void;
 arcTo(x:number,y:number,x2:number,y2:number,r:number):void;
 arc(x:number,y:number,r:number,a:number,b:number):void;
 ellipse(x:number,y:number,rx:number,ry:number,rotation:number,a:number,b:number):void;
 fill():void; stroke():void; fillRect(x:number,y:number,w:number,h:number):void;
 fillText(text:string,x:number,y:number):void; measureText(text:string):{width:number};
 frame(key:string,x:number,y:number,h:number,options?:any):unknown;
}
type Point={x:number;y:number;s:number};
const FONT='"PingFang SC","Source Han Sans SC",sans-serif';
const COLORS={thunder:'#96E8F5',flame:'#FFD083',shield:'#A6E3D8',power:'#F6D78D'};
const NAMES:Record<string,string>={thunder:'连锁雷',flame:'烈焰',blade:'扇刃',shield:'护盾'};
export const GROWTH_PICKUP_SECONDS=3.2;
const finite=(n:number,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

function rounded(ctx:GrowthPaint,x:number,y:number,w:number,h:number,r=7){
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
 ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function font(ctx:GrowthPaint,size:number){ctx.font=`600 ${size}px ${FONT}`;ctx.textAlign='left';ctx.textBaseline='middle';}
function fit(ctx:GrowthPaint,value:string,width:number){
 if(ctx.measureText(value).width<=width)return value;
 let out='';for(const ch of value){if(ctx.measureText(out+ch+'…').width>width)break;out+=ch;}
 return out+'…';
}
function twoLines(ctx:GrowthPaint,value:string,width:number){
 const chars=Array.from(value.replace(/\s*\n\s*/g,' '));let first='';let i=0;
 for(;i<chars.length;i++){if(first&&ctx.measureText(first+chars[i]).width>width)break;first+=chars[i];}
 return i<chars.length?[first,fit(ctx,chars.slice(i).join(''),width)]:[first];
}

/** Reward receipt, shown under the fixed HUD. It never owns game state. */
export function drawGrowthPickup(ctx:GrowthPaint,o:{W:number;y:number;age:number;title:string;detail:string;icon:string|null;color:string}){
 if(!Number.isFinite(o.age)||o.age<=0||o.age>=GROWTH_PICKUP_SECONDS||o.W<160)return;
 const opacity=Math.min(1,o.age/.15,(GROWTH_PICKUP_SECONDS-o.age)/.35);
 const w=Math.min(o.W-108,270),x=(o.W-w)/2,y=o.y-5*(1-Math.min(1,o.age/.15));
 const hasIcon=!!(o.icon&&MANIFEST.frames[o.icon]),tx=x+(hasIcon?50:14),tw=w-(hasIcon?64:28);
 ctx.save();ctx.globalAlpha*=opacity;
 font(ctx,12);const lines=twoLines(ctx,o.detail,tw),h=lines.length>1?74:58;
 rounded(ctx,x,y,w,h);ctx.fillStyle='rgba(16,31,43,.95)';ctx.fill();
 ctx.strokeStyle=o.color;ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle=o.color;ctx.fillRect(x+9,y+11,3,h-22);
 if(hasIcon){
  const f=MANIFEST.frames[o.icon!],side=29,iconH=side/Math.max(1,f.r[2]/f.r[3]);
  ctx.frame(o.icon!,x+31,y+h/2,iconH,{center:true,role:'growth_pickup',actorId:o.icon});
 }
 font(ctx,14);ctx.fillStyle='#FFF0C9';ctx.fillText(fit(ctx,o.title,tw),tx,y+18);
 font(ctx,12);ctx.fillStyle='#D6E1DD';lines.forEach((line,i)=>ctx.fillText(line,tx,y+39+i*16));
 // The remaining display time is readable without a pulsing or moving label.
 ctx.globalAlpha*=.65;ctx.fillStyle=o.color;ctx.fillRect(x+12,y+h-5,(w-24)*(1-o.age/GROWTH_PICKUP_SECONDS),1);
 ctx.restore();
}

/** Persistent, numeric feedback. y is the top edge; callers reserve 44 px. */
export function drawGrowthStatus(ctx:GrowthPaint,o:{W:number;y:number;damage:number;speed:number;shield:number;effects:string[];generalName?:string}){
 if(o.W<160)return;
 const w=Math.min(o.W-74,270),x=o.W-w-8,h=43;
 const attack=Math.max(0,Math.round((finite(o.damage,1)-1)*100));
 const haste=Math.max(0,Math.round((finite(o.speed,1)-1)*100));
 const shield=Math.max(0,Math.round(finite(o.shield)));
 ctx.save();rounded(ctx,x,o.y,w,h,5);ctx.fillStyle='rgba(16,31,43,.82)';ctx.fill();
 ctx.strokeStyle='rgba(185,164,116,.35)';ctx.lineWidth=1;ctx.stroke();
 font(ctx,12);ctx.fillStyle='#EED6A3';
 ctx.fillText(fit(ctx,`本局  攻+${attack}%  速+${haste}%  护盾${shield}`,w-18),x+9,o.y+13);
 const effects=Array.from(new Set(o.effects)).filter(id=>NAMES[id]).map(id=>NAMES[id]);
 if(o.generalName)effects.push('援将·'+o.generalName);
 font(ctx,11);ctx.fillStyle=effects.length?'#A9E3D7':'#BAC4C3';
 ctx.fillText(fit(ctx,effects.join(' · ')||'击破宝箱，强化本局招式',w-18),x+9,o.y+31);
 ctx.restore();
}

/** All points come from actual resolved hits. Bounded geometry and deterministic
 * offsets keep effects cheap and leave combat randomness untouched. */
export function drawGrowthImpact(ctx:GrowthPaint,o:{kind:'thunder'|'flame'|'shield'|'power';age:number;life:number;points:Point[];color?:string}){
 if(!(o.life>0)||!Number.isFinite(o.age)||o.age<0||o.age>=o.life)return;
 const points=o.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.s)).slice(0,4);
 if(!points.length)return;
 const k=o.age/o.life,a=1-k,color=o.color||COLORS[o.kind];
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=a;ctx.lineCap='round';
 if(o.kind==='thunder'){
  // A single path for all arcs, drawn twice: translucent halo then a fine core.
  ctx.beginPath();
  for(let i=1;i<points.length;i++){
   const p=points[i-1],q=points[i],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1,scale=clamp((p.s+q.s)/2,.2,1.4);
   ctx.moveTo(p.x,p.y);
   for(let n=1;n<=7;n++){
    const t=n/7,jitter=n===7?0:Math.sin(n*2.7+i*1.3)*7*scale*(.7+.3*Math.cos(k*18));
    ctx.lineTo(p.x+dx*t-dy/len*jitter,p.y+dy*t+dx/len*jitter);
   }
  }
  ctx.strokeStyle=color;ctx.lineWidth=5;ctx.globalAlpha*=.32;ctx.stroke();
  ctx.globalAlpha/= .32;ctx.strokeStyle='#ECFFFF';ctx.lineWidth=1.4;ctx.stroke();
  for(const p of points.slice(1)){
   const r=(4+9*k)*clamp(p.s,.2,1.4);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
   ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
  }
 }else{
  const p=points[0],s=clamp(p.s,.2,1.4),r=(o.kind==='shield'?29:14+27*k)*s;
  ctx.strokeStyle=color;
  if(o.kind==='shield'){
   ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.69,0,Math.PI*1.04,Math.PI*1.96);ctx.lineWidth=(5-3*k)*s;ctx.stroke();
   ctx.beginPath();ctx.ellipse(p.x,p.y,r*.82,r*.56,0,Math.PI*1.1,Math.PI*1.9);ctx.lineWidth=1;ctx.stroke();
  }else{
   ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.48,0,0,Math.PI*2);ctx.lineWidth=(3-2*k)*s;ctx.stroke();
   ctx.beginPath();ctx.ellipse(p.x,p.y,r*.72,r*.35,0,0,Math.PI*2);ctx.globalAlpha*=.35;ctx.fillStyle=color;ctx.fill();ctx.globalAlpha/=.35;
   ctx.beginPath();
   const sparks=o.kind==='flame'?7:6;
   for(let i=0;i<sparks;i++){
    const theta=i/sparks*Math.PI*2+.16,rr=r*(.65+.40*k),xx=p.x+Math.cos(theta)*rr,yy=p.y+Math.sin(theta)*rr*.5-(o.kind==='flame'?k*16*s:0);
    const dx=Math.cos(theta)*5*s,dy=(o.kind==='flame'?-6:Math.sin(theta)*4)*s;
    ctx.moveTo(xx,yy);ctx.lineTo(xx+dx,yy+dy);
   }
   ctx.strokeStyle=o.kind==='flame'?'#FFF2C8':color;ctx.lineWidth=2*s;ctx.stroke();
  }
 }
 ctx.restore();
}

/** A narrow row under the growth strip, clear of all treasure/support slots. */
export function drawMomentumStatus(ctx:GrowthPaint,o:{W:number;y:number;active:boolean;remaining:number;charge:number;combo:number}){
 if(o.W<160)return;
 const w=Math.min(o.W-74,270),x=o.W-w-8,y=o.y+45,color=o.active?'#FFE1A1':'#A9E3D7';
 ctx.save();rounded(ctx,x,y,w,23,5);ctx.fillStyle='rgba(16,31,43,.90)';ctx.fill();
 font(ctx,11);ctx.fillStyle=color;
 ctx.fillText((o.active?'破阵 '+o.remaining.toFixed(1)+'秒':'战意 '+o.charge+'/12')+(o.combo>1?' · 连破 '+o.combo:''),x+9,y+10);
 ctx.fillStyle=color;ctx.fillRect(x+9,y+19,(w-18)*clamp(o.active?o.remaining/8:o.charge/12,0,1),2);ctx.restore();
}
