import {CHAPTERS,MILESTONES} from './data';
import {layoutText} from './MenuLayout';
export type MapViewport={W:number;H:number;top:number;bottom:number};
export function mapMetrics(s:MapViewport,expanded=false){const y=s.top+72,bottom=s.H-s.bottom-(expanded?244:136),height=Math.max(160,bottom-y),step=Math.max(122,height/3.5),panel=step*4;return {y,bottom,height,step,panel,total:panel*5,maxScroll:Math.max(0,panel*5-height)};}
export function mapPosition(index:number,metrics:ReturnType<typeof mapMetrics>,W:number){return{x:W*([.32,.69,.57,.28][index%4]),y:(index+.5)*metrics.step};}
export function mapScrollFor(index:number,m:ReturnType<typeof mapMetrics>){return Math.max(0,Math.min(m.maxScroll,(index+.5)*m.step-m.height*.45));}
export function visibleMapPanels(scroll:number,m:ReturnType<typeof mapMetrics>){const mid=Math.min(4,Math.max(0,Math.floor((scroll+m.height/2)/m.panel)));return [mid-1,mid,mid+1].filter(i=>i>=0&&i<5);}
export const mapPanelNames=['群雄初起 · 河谷','江河进军 · 丘陵','荆楚东行 · 江岸','中原争雄 · 石城','西关归一 · 山关'];
/** Curved marching footprints, separate from the painted terrain roads. */
export function marchPath(a:{x:number;y:number},b:{x:number;y:number},count=12){return Array.from({length:count},(_,i)=>{const t=i/count,u=1-t,mid=(a.y+b.y)/2;return{x:u*u*u*a.x+3*u*u*t*(a.x+18)+3*u*t*t*(b.x-18)+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*mid+3*u*t*t*mid+t*t*t*b.y};});}
const THREAT_COPY:Record<string,string>={
 '正负门与单线预警':'正负门，留意预警',
 '第一场两段式考核':'敌将分两段出手',
 '旗手增益':'旗手鼓舞敌军',
 '上篇综合战':'上篇总攻',
 '双短戟快速二连':'双戟连斩',
 '高台射手与扇形箭雨':'高台箭雨',
 '三段终局':'终局三段',
};
/** Display copy only. Stored chapter data stays unchanged. */
export function chapterThreats(index:number){const raw=CHAPTERS[index]?.keyMechanic;return raw?(THREAT_COPY[raw]||raw):'敌阵迎面而来';}
export function mapHeaderCopy(completed:number){const next=MILESTONES.find(v=>v.chapter>completed);return {title:'天下征程',progress:'已克 '+completed+'/20',hint:next?'下一里程碑 · 第'+next.chapter+'关 '+next.title:'里程碑已齐'};}
export interface MapTextSlot {x:number;y:number;w:number;h:number;size:number;text:string;}
export interface MapChromeLayout {
 y:number;bottom:number;height:number;step:number;panel:number;total:number;maxScroll:number;
 back:{x:number;y:number;w:number;h:number};current:{x:number;y:number;w:number;h:number};
 title:MapTextSlot;progress:MapTextSlot;hint:MapTextSlot;
 drawer:{x:number;y:number;w:number;h:number};
 drawerTitle:MapTextSlot;threat:MapTextSlot;reward:MapTextSlot;
 detail:{x:number;y:number;w:number;h:number};
 rewards:MapTextSlot|null;region:MapTextSlot|null;replay:{x:number;y:number;w:number;h:number;text:string}|null;
 depart:{x:number;y:number;w:number;h:number};
}
/** Header, drawer and depart button. City spacing uses the collapsed drawer so opening details does not jump the map. */
export function layoutMapChrome(s:MapViewport,input:{expanded:boolean;copy:{title:string;progress:string;hint:string};chapterTitle:string;threat:string;reward:string;rewards:string;region:string;replay:string|null;},measure:(text:string,size:number)=>number):MapChromeLayout {
 const slot=(text:string,x:number,y:number,w:number,size:number):MapTextSlot=>({text,x,y,w,h:layoutText(text,w,size,measure).height,size});
 const back={x:16,y:s.top+8,w:72,h:48},current={x:s.W-88,y:s.top+8,w:72,h:48};
 const titleW=Math.max(48,current.x-8-(back.x+back.w+8));
 const title=slot(input.copy.title,back.x+back.w+8,s.top+8,titleW,20);
 title.y=s.top+8+Math.max(0,(48-title.h)/2);
 let y=s.top+56+8;
 const progress=slot(input.copy.progress,20,y,s.W-40,13);y+=progress.h+4;
 const hint=slot(input.copy.hint,20,y,s.W-40,12);y+=hint.h+12;
 const mapY=y,depart={x:16,y:s.H-s.bottom-64,w:s.W-32,h:48};
 const textX=28,fullW=Math.max(40,s.W-56),detail={x:s.W-92,y:0,w:72,h:48};
 const titleWDrawer=Math.max(40,detail.x-8-textX);
 const drawerTitle=slot(input.chapterTitle,textX,0,titleWDrawer,16);
 const threat=slot(input.threat,textX,0,fullW,13),reward=slot(input.reward,textX,0,fullW,13);
 const rewards=input.expanded&&input.rewards?slot(input.rewards,textX,0,fullW,13):null;
 const region=input.expanded&&!input.replay?slot(input.region,textX,0,fullW,12):null;
 const head=Math.max(drawerTitle.h,48);
 const stack=(expanded:boolean)=>{let h=12+head+6+threat.h+6+reward.h+12;if(expanded){if(input.rewards)h+=(rewards?.h||layoutText(input.rewards,fullW,13,measure).height)+6;if(input.replay)h+=56;else h+=(region?.h||layoutText(input.region,fullW,12,measure).height)+6;}return h;};
 const collapsed=stack(false),wanted=stack(input.expanded),maxDrawer=Math.max(88,depart.y-12-mapY-120);
 const drawerH=Math.min(wanted,maxDrawer),drawerY=depart.y-12-drawerH,collapsedH=Math.min(collapsed,maxDrawer);
 const step=Math.max(122,(depart.y-12-collapsedH-mapY)/3.5),panel=step*4,height=drawerY-mapY;
 drawerTitle.y=drawerY+12+(head-drawerTitle.h)/2;detail.y=drawerY+12;
 threat.y=drawerY+12+head+6;reward.y=threat.y+threat.h+6;let cursor=reward.y+reward.h+6;
 if(rewards){rewards.y=cursor;cursor+=rewards.h+6;}
 if(region){region.y=cursor;cursor+=region.h+6;}
 const replay=input.expanded&&input.replay?{x:textX,y:cursor,w:fullW,h:48,text:input.replay}:null;
 return {y:mapY,bottom:drawerY,height,step,panel,total:panel*5,maxScroll:Math.max(0,panel*5-height),back,current,title,progress,hint,drawer:{x:12,y:drawerY,w:s.W-24,h:drawerH},drawerTitle,threat,reward,detail,rewards,region,replay,depart};
}
