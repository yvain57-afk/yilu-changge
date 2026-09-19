// Reproduce the reviewed excerpts from evidence/v02/session.webm captured this turn.
// Start excludes cold boot; crop removes recorder padding. No speed change or synthetic game states.
import {spawnSync} from 'node:child_process';import {writeFileSync} from 'node:fs';
const source='evidence/v02/session.webm',start=5.5,crop='304:632:0:0';
for(const [name,frames] of [['first-ten-seconds',250],['first-level',1700]]){const args=['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',source,'-vf',`crop=${crop},setpts=PTS-STARTPTS,fps=25`,'-frames:v',String(frames),'-c:v','libx264','-threads','1','-crf','18','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart','-an',`evidence/v02/${name}.mp4`];const r=spawnSync('ffmpeg',args,{stdio:'inherit'});if(r.status!==0)throw Error(`ffmpeg ${name} failed`);}
writeFileSync('evidence/v02/video-edit.json',JSON.stringify({source,startSeconds:start,crop,rate:1,fps:25,audio:'Recorder provided no audio track',outputs:[{file:'first-ten-seconds.mp4',seconds:10},{file:'first-level.mp4',seconds:68}]},null,2));
