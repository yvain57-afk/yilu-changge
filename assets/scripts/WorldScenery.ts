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
