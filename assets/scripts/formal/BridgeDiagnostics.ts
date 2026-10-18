import {DEBUG} from 'cc/env';
import {native,sys} from 'cc';
import {BRIDGE_BUILD} from './BridgeBuild';

/** Development-only, local capped JSONL. Does not access saves or send telemetry. */
export class BridgeDiagnostics {
 private enabled=DEBUG&&sys.isNative;
 private run='dev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 private age=0;private intervals:number[]=[];private pending:string[]=[];private rows:string[]=[];private bytes=0;private initialized=false;
 event(event:string,data:Record<string,unknown>={}){
  if(!this.enabled)return;
  try{this.pending.push(JSON.stringify({event,run_id:this.run,produced_at:new Date().toISOString(),build:BRIDGE_BUILD,platform:'iOS native',device_class:BRIDGE_BUILD.target,build_type:'Debug',...data}));if(this.pending.length>64)this.pending.shift();}catch(_){/* Diagnostics never abort gameplay. */}
 }
 sample(dt:number,screen:string,chapter:number,counts:any,viewport:any){
  if(!this.enabled)return;
  if(!this.initialized){this.initialized=true;this.event('startup',{screen,viewport:{width:viewport.width,height:viewport.height},safe_area:viewport.safe,scope:'local development diagnostic'});}
  this.age+=dt;this.intervals.push(dt*1000);
  if(this.intervals.length>2400)this.intervals.shift();
  if(this.age<1)return;
  const values=this.intervals.slice().sort((a,b)=>a-b),sum=values.reduce((a,b)=>a+b,0);
  this.event('interval',{screen,chapter,counts,interval:{seconds:this.age,unit:'milliseconds',sample_count:values.length,fps:sum?1000*values.length/sum:0,p50:values[Math.floor(values.length*.5)]||0,p95:values[Math.floor(values.length*.95)]||0,max:values[values.length-1]||0,over50ms:values.filter(v=>v>50).length,over100ms:values.filter(v=>v>100).length},scope:'foreground frame intervals; not GPU/CPU rendering time',missing:{gpu_ms:'unavailable',cpu_ms:'unavailable',draw_calls:'unavailable',memory_bytes:'unavailable',occlusion_visibility:'unavailable'}});
  this.age=0;this.intervals=[];this.flush();
 }
 flush(){
  if(!this.enabled||!this.pending.length)return;
  try{
   // Keep a bounded session ring, at most one write/second. UTF-8 conservative size bound.
   for(const line of this.pending){this.rows.push(line);this.bytes+=(line.length+1)*3;}
   this.pending=[];while(this.bytes>2*1024*1024&&this.rows.length>1)this.bytes-=(this.rows.shift()!.length+1)*3;
   native.fileUtils.writeStringToFile(this.rows.join('\n')+'\n',native.fileUtils.getWritablePath()+'yilu-bridge-events.jsonl');
  }catch(_){this.enabled=false;}
 }
 close(){this.event('shutdown');this.flush();}
}
