import {CHAPTERS} from './data';
export type MapViewport={W:number;H:number;top:number;bottom:number};
export function mapMetrics(s:MapViewport,expanded=false){const y=s.top+72,bottom=s.H-s.bottom-(expanded?244:136),height=Math.max(160,bottom-y),step=Math.max(122,height/3.5),panel=step*4;return {y,bottom,height,step,panel,total:panel*5,maxScroll:Math.max(0,panel*5-height)};}
export function mapPosition(index:number,metrics:ReturnType<typeof mapMetrics>,W:number){return{x:W*([.32,.69,.57,.28][index%4]),y:(index+.5)*metrics.step};}
export function mapScrollFor(index:number,m:ReturnType<typeof mapMetrics>){return Math.max(0,Math.min(m.maxScroll,(index+.5)*m.step-m.height*.45));}
export function visibleMapPanels(scroll:number,m:ReturnType<typeof mapMetrics>){const mid=Math.min(4,Math.max(0,Math.floor((scroll+m.height/2)/m.panel)));return [mid-1,mid,mid+1].filter(i=>i>=0&&i<5);}
export const mapPanelNames=['群雄初起 · 河谷','江河进军 · 丘陵','荆楚东行 · 江岸','中原争雄 · 石城','西关归一 · 山关'];
/** Curved marching footprints, separate from the painted terrain roads. */
export function marchPath(a:{x:number;y:number},b:{x:number;y:number},count=12){return Array.from({length:count},(_,i)=>{const t=i/count,u=1-t,mid=(a.y+b.y)/2;return{x:u*u*u*a.x+3*u*u*t*(a.x+18)+3*u*t*t*(b.x-18)+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*mid+3*u*t*t*mid+t*t*t*b.y};});}
export function chapterThreats(index:number){const c=CHAPTERS[index];return c.keyMechanic||'敌阵推进 · 数值门';}
