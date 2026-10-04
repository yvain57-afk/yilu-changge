/** Shared responsive measurements; gameplay occupancy remains in battle.ts. */
export function prepareLayout(W:number,H:number,top:number,bottom:number){
 const footer=H-bottom-58,h=Math.max(280,Math.min(306,H*.35)),y=footer-h-16;
 return {y,h,rows:Math.max(1,Math.min(3,Math.floor((y-(top+154)-36)/60)))};
}
export function armyFormation(troops:number){
 const n=Math.max(0,Math.round(troops));
 const band=n<=20?0:n<=50?1:n<=90?2:n<=150?3:4;
 const rows=[1,2,3,4,5][band],cols=[Math.min(4,Math.ceil(n/5)),4+Math.floor((n-21)/15),5+Math.floor((n-51)/20),6+Math.floor((n-91)/25),8][band];
 return {band,label:['小队','轻阵','中队','大队','军阵'][band],rows,cols,count:rows*cols};
}
export function armySlots(troops:number,heroX:number,wallSide=0){
 const f=armyFormation(troops),width=wallSide?.55:Math.min(1.58,(f.cols-1)*.21),half=width/2+.035;
 const center=wallSide?(wallSide>0?-.58:.58):Math.max(-.94+half,Math.min(.94-half,heroX));
 // Clamp the centre once: clipping each rank separately destroys column spacing.
 return Array.from({length:f.count},(_,i)=>{const row=Math.floor(i/f.cols),col=i%f.cols;return{x:center+(f.cols>1?(col/(f.cols-1)-.5)*width:0)+(row%2?.035:-.035),z:-1.35-row*.72-(col%2)*.14,row};});
}
/** One rigid world-space translation, using every rank's perspective and full sprite width. */
export function fitProjectedFormation<T extends {x:number,z:number}>(slots:T[],view:{W:number,cx:number,ppu:number,c:number},left:number,right:number,margin=10):T[]{
 let lo=-Infinity,hi=Infinity;
 for(const p of slots){const scale=view.c/(view.c+p.z),unit=view.ppu*scale;lo=Math.max(lo,(margin-view.cx)/unit+left-p.x);hi=Math.min(hi,(view.W-margin-view.cx)/unit-right-p.x);}
 const shift=lo<=hi?Math.max(lo,Math.min(hi,0)):(lo+hi)/2;
 return slots.map(p=>({...p,x:p.x+(Number.isFinite(shift)?shift:0)}));
}
export function companionSlots(heroX:number,count:number,wallSide=0){
 // Advance companions beyond the hero's torso, keeping them clear of both legs and the rear archer ranks.
 const center=wallSide?(wallSide>0?-.55:.55):Math.max(-.42,Math.min(.42,heroX));
 return Array.from({length:count},(_,i)=>({x:center+(count<2?0:(i?-.32:.32))*(wallSide?.45:1),z:4.4+i*.35,row:i}));
}

export type LabelRect={x:number,y:number,w:number,h:number};
export function labelsOverlap(a:LabelRect,b:LabelRect,gap=0){return a.x<b.x+b.w+gap&&a.x+a.w>b.x-gap&&a.y<b.y+b.h+gap&&a.y+a.h>b.y-gap;}
/** Candidate edges cover the nearest free placements around the actual, already docked labels. */
export function nearestLabelRect(wanted:LabelRect,blocked:LabelRect[],bounds:LabelRect){
 const clampX=(x:number)=>Math.max(bounds.x,Math.min(bounds.x+bounds.w-wanted.w,x)),clampY=(y:number)=>Math.max(bounds.y,Math.min(bounds.y+bounds.h-wanted.h,y));
 const xs=[wanted.x,bounds.x,bounds.x+bounds.w-wanted.w,...blocked.flatMap(b=>[b.x-wanted.w-5,b.x+b.w+5])].map(clampX),ys=[wanted.y,bounds.y,bounds.y+bounds.h-wanted.h,...blocked.flatMap(b=>[b.y-wanted.h-5,b.y+b.h+5])].map(clampY);
 const candidates=xs.flatMap(x=>ys.map(y=>({...wanted,x,y}))).sort((a,b)=>(a.x-wanted.x)**2+(a.y-wanted.y)**2-(b.x-wanted.x)**2-(b.y-wanted.y)**2);
 return candidates.find(r=>blocked.every(b=>!labelsOverlap(r,b,4)))||candidates[0];
}
