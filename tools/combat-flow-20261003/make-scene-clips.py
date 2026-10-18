from pathlib import Path
import json, subprocess,hashlib,sys
from PIL import Image
import numpy as np
base=Path('evidence/COMBAT-FLOW-20261003');items=[]
for tag,mode in [('before','normal'),('after','normal'),('after','lateral'),('after','stationary')]:
 root=base/tag;rec=json.loads((root/f'{tag}-{mode}-record.json').read_text());source=root/'media'/f'{tag}-{mode}.mp4'
 raw=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(source),'-t','14','-vf','fps=10,scale=100:218','-f','rawvideo','-pix_fmt','rgb24','-'])
 frames=np.frombuffer(raw,dtype=np.uint8).reshape((-1,218,100,3));target=np.array(Image.open(root/'pixels'/f'{tag}-{mode}-t0.png').convert('RGB').resize((100,218)))
 diffs=((frames.astype(np.float32)-target.astype(np.float32))**2).mean(axis=(1,2,3));idx=int(diffs.argmin());first=idx/10
 # Direct full-screen match to the initial actual running screenshot selects the
 # scene start in the original capture. No synthesis/retiming/overlays.
 offset=first+5 if mode=='normal' else first
 seconds=min(40,rec['rows'][-1]['wallSeconds']-(5 if mode=='normal' else 0))
 targetFile=root/'media'/f'{tag}-{mode}-scene.mp4'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(offset),'-i',str(source),'-t',str(seconds),'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(targetFile)],check=True)
 item={'path':str(targetFile.resolve()),'sha256':hashlib.sha256(targetFile.read_bytes()).hexdigest(),'source':str(source.resolve()),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'first_scene_screenshot_video_seconds':first,'first_scene_screenshot_match_mse':float(diffs[idx]),'clip_start_source_seconds':offset,'clip_requested_duration':seconds,'code_fingerprint':rec['build']['code_fingerprint'],'speed':'original, contiguous trim only, no acceleration or transitions','scope':rec['scope']}
 items.append(item)
 print(json.dumps(item,ensure_ascii=False))
(base/'scene-clips.json').write_text(json.dumps(items,ensure_ascii=False,indent=2))
# Natural defeat -> actual retry additional full clip.
root=base/'after';d=json.loads((root/'after-retry-flow.json').read_text());source=d['video'];dest=root/'media'/'after-defeat-retry.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',source,'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)],check=True)
d['media']={'path':str(dest.resolve()),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'source_sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest()};(root/'after-retry-flow.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
