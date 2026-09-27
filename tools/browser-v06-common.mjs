import {open as baseOpen} from './browser-v03-common.mjs';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {hazardHit}=createRequire(import.meta.url)('../.cache/logic/hazards.js');
export const root='evidence/v06';
export const open=(name,width=390,height=844,options={})=>baseOpen('v06-'+name,width,height,{version:'v06-rc1',audio:true,...options});
export function steer(j,policy='hard'){
 if(j.phase==='boss'){
  const d=j.bossDirector;
  if(d&&(d.phase==='telegraph'||d.phase==='active')){if(d.phase==='telegraph'&&d.phaseTick<15)return j.target;return [0,-.3,.3,-.5,.5,-.7,.7,-.88,.88].find(x=>!d.warningShapes.some(shape=>hazardHit(shape,{x:x*2.5,z:j.z},.07)))??(d.aimX<=0?.88:-.88);}
  return 0;
 }
 const next=(j.forks||[]).find(f=>j.z>=f.previewAt-.35&&j.z<f.commitAt+.02);
 if(next)return next[policy==='safe'?'safeSide':'hardSide']==='left'?-.48:.48;
 const row=j.rows.find(r=>r.at-j.z<1.05&&r.at>=j.z);
 if(row){const result=g=>g.kind==='double'?j.count*2:j.count+g.value;return result(row.left)>result(row.right)?-.48:.48;}
 const enemies=j.obstacles.filter(o=>o.at>j.z+.15&&o.at<j.z+5.5);let x=j.x,score=-Infinity;
 for(const candidate of [-.64,-.48,-.30,0,.30,.48,.64]){let value=0;for(const o of enemies)if(Math.abs(candidate-o.x)<(j.weapon==='blade'?.29:.15))value+=1/(.8+Math.abs(o.at-j.z-2.3));value-=Math.abs(candidate-j.x)*.12;if(value>score){score=value;x=candidate;}}
 for(const w of j.warnings)if(!w.hit&&Math.abs(x-w.x)<w.width+.08)x=w.x>0?-.38:.38;
 return Math.max(-.91,Math.min(.91,x));
}
export async function startCapture(t){
 return t.p.evaluate(()=>{const canvas=document.querySelector('canvas'),bus=Array.from(globalThis.__audioCapture.buses.values())[0];if(!bus)throw Error('No live audio bus');const stream=canvas.captureStream(30);for(const track of bus.stream.getAudioTracks())stream.addTrack(track);const analyser=bus.context.createAnalyser();bus.context.createMediaStreamSource(bus.stream).connect(analyser);const sound=[];const timer=setInterval(()=>{const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);sound.push(Math.sqrt(a.reduce((v,n)=>v+n*n,0)/a.length));},60);const chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:3000000});rec.ondataavailable=e=>chunks.push(e.data);rec.start(1000);globalThis.__v06Recording={rec,chunks,sound,timer};return {audioTracks:stream.getAudioTracks().length,mime:rec.mimeType};});
}
export async function stopCapture(t,path){const result=await t.p.evaluate(async()=>{const{rec,chunks,sound,timer}=globalThis.__v06Recording;clearInterval(timer);await new Promise(r=>{rec.onstop=r;rec.stop();});const a=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return {base64:btoa(s),audio:{peak:Math.max(...sound),audibleSamples:sound.filter(x=>x>.00001).length,samples:sound.length}};});writeFileSync(path,Buffer.from(result.base64,'base64'));return result.audio;}
export async function fixtureGame(t){await t.p.evaluate(async()=>{const{director}=await System.import('cc'),find=n=>n.getComponent('Game')||n.children.map(find).find(Boolean);globalThis.__fixtureGame=find(director.getScene());});}
export async function freshSave(t){await t.p.evaluate(()=>{for(const k of ['yilu-changge-prototype-v2','yilu-changge-campaign-v04','yilu-changge-growth-v05','yilu-changge-tactics-v06'])localStorage.removeItem(k);});await t.p.reload();await t.ready();}
