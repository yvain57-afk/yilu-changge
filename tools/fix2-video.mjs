import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const root='evidence/BATTLE-FIX2-20260925',report=JSON.parse(readFileSync(root+'/natural-flow.json'));
if(!report.passed)throw Error('Only a passed complete natural run can supply the final media');
function ff(args,name){const r=spawnSync(process.env.FFMPEG??'ffmpeg',['-y',...args],{encoding:'utf8'});writeFileSync(`${root}/${name}.log`,r.stderr??'');if(r.status!==0)throw Error(name+' failed');}
const source='full-natural-three-levels.mp4';
ff(['-i',root+'/full-natural-three-levels.webm','-vf','fps=30','-c:v','libx264','-preset','fast','-crf','21','-c:a','aac','-b:a','128k','-movflags','+faststart',root+'/'+source],'encode-natural');
const offset=report.timeline.find(e=>e.type==='recording-start').seconds,end=report.timeline.find(e=>e.type==='ending').seconds-offset;
const specs=[['battle-start',2,8,1],['gate-converted',1,6,-1],['equipment',1,6,-2],['chain-passing',2,6,-1],['wall-end',2,6,-2],['large-combat',3,6,-1]];
let outputStart=0;const segments=specs.map(([event,level,duration,relative])=>{const e=report.timeline.find(e=>e.type===event&&e.level===level);if(!e)throw Error('Missing actual event '+event);const sourceStart=Math.min(Math.max(0,e.seconds-offset+relative),end-duration),s={event,level,sourceStart,duration,outputStart,speed:1,sourceFrame:Math.round(sourceStart*30)};outputStart+=duration;return s;});
const filters=segments.flatMap((s,i)=>[`[0:v]trim=start=${s.sourceStart}:duration=${s.duration},setpts=PTS-STARTPTS[v${i}]`,`[0:a]atrim=start=${s.sourceStart}:duration=${s.duration},asetpts=PTS-STARTPTS[a${i}]`]);
filters.push(segments.map((_,i)=>`[v${i}][a${i}]`).join('')+`concat=n=${segments.length}:v=1:a=1[v][a]`);
ff(['-i',root+'/'+source,'-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','21','-c:a','aac','-b:a','128k','-movflags','+faststart',root+'/showcase.mp4'],'encode-showcase');
ff(['-ss',String(segments[0].sourceStart),'-i',root+'/'+source,'-t','8','-c:v','libx264','-preset','fast','-crf','21','-c:a','aac','-movflags','+faststart',root+'/top-decoration-uncut.mp4'],'encode-top-uncut');
writeFileSync(root+'/CLIPS.json',JSON.stringify({source,rawSource:'full-natural-three-levels.webm',speed:1,seconds:outputStart,fps:30,timelineOffset:offset,segments,topUncut:{path:'top-decoration-uncut.mp4',sourceStart:segments[0].sourceStart,duration:8},extraAudio:false,music:false,scope:'One continuous natural three-level recording supplies all these excerpts. Showcase has disclosed cuts; top excerpt is eight continuous seconds. Weapon fixture media is separate.'},null,2));
console.log(JSON.stringify({source,showcaseSeconds:outputStart,segments}));
