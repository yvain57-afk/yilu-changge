import { project } from './VisualConfig';
/** World-indexed strip: replacement happens only behind the entire viewport.
 * Stable world IDs/textures while visible; fixed slots bound the node pool. */
export function worldStrip(z:number,spacing=1.25,slots=24){
 const first=Math.floor((z-10)/spacing);
 return Array.from({length:slots},(_,i)=>{const id=first+i,worldZ=id*spacing;return{id,slot:((id%slots)+slots)%slots,worldZ,...project(0,worldZ-z)};});
}
/** Six distinct foot-contact/pass keys; upper-body archery runs independently. */
export function gaitFrame(time:number,index=0){return Math.floor(((time/.66+index*.137)%1+1)%1*6);}
export function shootFrame(age:number){return age<.075?2:age<.145?3:age<.205?0:1;}

/** Battle-only dressing; inner edges are placed outside the model's legal
 * x=±1.16 corridor by the renderer using the actual frame's displayed width. */
export function battleScenery(z:number,scene:number){
 const spacing=2.5,slots=16,first=Math.floor((z-10)/spacing);
 return Array.from({length:slots},(_,index)=>{
  const id=first+index,variant=((id%6)+6)%6,side=(id%2?-1:1),worldZ=id*spacing;
  const key=scene===0?(variant===0?'granary':variant===3?'tower':'rocks'):scene===1?(variant===0?'tower':variant===3?'palisade':'tent'):(variant===0?'tower':variant===3?'granary':'palisade');
  const height=key==='tower'?296:key==='tent'?202:key==='granary'?224:key==='rocks'?126:106;
  return{id,slot:((id%slots)+slots)%slots,side,worldZ,key,height,...project(side*1.22,worldZ-z)};
 }).sort((a,b)=>b.worldZ-a.worldZ);
}
