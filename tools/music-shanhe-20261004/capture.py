"""One actual Cocos simulator flow, capture only its process audio and framebuffer."""
from pathlib import Path
import subprocess,time,json,signal,hashlib,re
import soundfile as sf
import numpy as np
R=Path(__file__).resolve().parents[2];E=R/'evidence/MUSIC-SHANHE-20261004';D=R/'deliverables/MUSIC-SHANHE-20261004'
U='F9504D9B-8094-40EC-949F-925A31F707A8';B='com.yvainair.yiluchangge'
def run(*args):return subprocess.check_output(args,text=True).strip()
run('xcrun','simctl','install',U,str(R/'build/ios-music-shanhe/proj/Debug-iphonesimulator/CocosGame.app'))
p=Path(run('xcrun','simctl','get_app_container',U,B,'data'))/'Documents/yilu-diagnostics.json'
subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True)
start=time.time();pid=run('xcrun','simctl','launch',U,B,'--yilu-review=MUSIC:flow').split(':')[-1].strip()
for _ in range(225):
 try:d=json.loads(p.read_text());ready=p.stat().st_mtime>start and d['verificationScope']=='isolated-native-visual-fixture:MUSIC:flow' and d['audio']['musicPlaying']
 except Exception:ready=False
 if ready:break
 time.sleep(.2)
else:raise RuntimeError('Native score did not start; inspect diagnostics instead of claiming audio success')
vf=(E/'video.log').open('w');video=subprocess.Popen(['xcrun','simctl','io',U,'recordVideo','--codec=h264','--force',str(E/'runtime-raw.mov')],stdout=vf,stderr=subprocess.STDOUT)
for _ in range(100):
 if 'Recording started' in (E/'video.log').read_text():break
 time.sleep(.02)
else:raise RuntimeError('simulator recording did not start')
vclock=time.time();af=(E/'audio.log').open('w');audio=subprocess.Popen([str(R/'tools/weapon-sfx/capture-process-audio'),pid,str(E/'runtime.caf'),'42'],stdout=af,stderr=subprocess.STDOUT)
samples=[];shots=set()
for _ in range(168):
 try:
  d=json.loads(p.read_text());samples.append({'host_time':time.time(),'state':d});stage=d.get('musicReview',{}).get('stage',-1)
  if stage not in shots and stage in (1,2,3,5,6,7,8,9):
   shots.add(stage);subprocess.run(['xcrun','simctl','io',U,'screenshot',str(D/f'runtime-stage-{stage}.png')],capture_output=True,check=True)
 except (ValueError,OSError):pass
 time.sleep(.25)
audio.wait(timeout=8);video.send_signal(signal.SIGINT);video.wait(timeout=15);af.close();vf.close()
(E/'runtime-samples.json').write_text(json.dumps(samples,ensure_ascii=False))
if audio.returncode or video.returncode:raise RuntimeError('Capture failed, raw logs retained')
pcm,rate=sf.read(E/'runtime.caf',always_2d=True)
peak=float(np.max(np.abs(pcm)))
(E/'capture-signal.json').write_text(json.dumps({'peak':peak,'rms':float(np.sqrt(np.mean(pcm*pcm))),'sample_rate':rate,'frames':len(pcm)}))
if peak<0.00001:
 (E/'capture.json').write_text(json.dumps({'audible_acceptance':'FAILED: all-zero or inaudible captured signal','code_fingerprint':d['build']['code_fingerprint'],'peak':peak}))
 raise RuntimeError('Captured game audio is silent; do not publish a dubbed or silent video as audible evidence')
log=(E/'audio.log').read_text();aclock=float(re.search(r'START ([0-9.]+)',log)[1]);offset=max(0,aclock-vclock)
out=D/'cocos-native-music-flow.mp4'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(E/'runtime-raw.mov'),'-itsoffset',str(offset),'-i',str(E/'runtime.caf'),'-map','0:v','-map','1:a','-vf','scale=600:-2','-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-b:a','192k','-t','42','-movflags','+faststart',str(out)],check=True)
receipt={'scope':'Actual Cocos native DEBUG automatic scene/settings flow, not human touch or physical iPhone','code_fingerprint':d['build']['code_fingerprint'],'build':d['build'],'audio_origin':'CoreAudio private tap of CocosGame PID '+pid,'audio_start_host':aclock,'video_start_host':vclock,'sync_offset_seconds':offset,'sync_uncertainty_seconds':.08,'file':str(out.relative_to(R)),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'samples':len(samples)}
(E/'capture.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));print(json.dumps(receipt,ensure_ascii=False))
