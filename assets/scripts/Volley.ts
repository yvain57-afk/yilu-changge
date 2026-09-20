import { Arrow, Feedback, clamp } from './core/model';
import { formation, project } from './VisualConfig';

// Speed 9 minus camera speed <=1: lifetime < 7/8s. At 4 volleys/s,
// ceil(.875/.25)+1 = 5 groups, each <=48 arrows. One Graphics buffer.
export const VOLLEY_GROUPS=5, VOLLEY_CAPACITY=48*VOLLEY_GROUPS;
export const bowMouth=(hero:boolean)=>({x:hero?-28:-18,y:hero?82:53});
export type Volley={id:number;bornZ:number;aimZ:number;height:number;x:number;tick:number;origins:{x:number;y:number}[]};
export class Volleys {
 groups:Volley[]=[];peak=0;
 accept(events:readonly Feedback[]){for(const e of events){if(e.kind!=='shot'||!e.volley||e.projectileId===undefined||e.worldZ===undefined)continue;
  const center=project(e.x,.35);
  this.groups.push({id:e.projectileId,bornZ:e.worldZ,aimZ:e.volley.aimZ,height:e.volley.height,x:e.x,tick:e.simulationTick!,origins:formation(e.volley.count,e.x).map(u=>{const m=bowMouth(u.hero);return{x:u.x+m.x,y:u.y+m.y-center.y};})});
 }if(this.groups.length>VOLLEY_GROUPS)this.groups.splice(0,this.groups.length-VOLLEY_GROUPS);this.peak=Math.max(this.peak,this.groups.reduce((n,g)=>n+g.origins.length,0));}
 retain(arrows:readonly Arrow[]){this.groups=this.groups.filter(g=>arrows.some(a=>a.id===g.id));}
 clear(){this.groups=[];}
 /** Frozen launch positions converge continuously to the original firing lane. */
 points(a:Arrow,z:number){const g=this.groups.find(g=>g.id===a.id);if(!g)return[];
  const q=clamp((a.z-g.bornZ)/Math.max(.15,g.aimZ-g.bornZ),0,1),p=project(a.x,a.z-z),startScale=project(0,.35).s;
  return g.origins.map(o=>({x:p.x+(o.x-project(g.x,.35).x)*(1-q)*p.s/startScale,y:p.y+o.y*(1-q)+g.height*p.s*q}));
 }
}
