#!/usr/bin/env python3
"""Capture actual Cocos reward motion using isolated in-memory fixtures, never player saves."""
import pathlib,subprocess,json,time,signal,hashlib,datetime
R=pathlib.Path(__file__).resolve().parents[2];E=R/'evidence/YILU-CAMPAIGN20-20260930';D=R/'deliverables/YILU-CAMPAIGN20-20260930/media';U='A0886547-6FCE-42E7-BC5A-104727CFBEEE';B='com.yvainair.yiluchangge';M=json.loads((E/'bridge-build-manifest.json').read_text())
C=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',U,B,'data'],text=True).strip());diag=C/'Documents/yilu-diagnostics.json'
for chapter,kind in [(0,'treasure'),(11,'weapon'),(19,'person')]:
 fixture=f'C20:reward:{chapter}';subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True);t=time.time();subprocess.run(['xcrun','simctl','launch',U,B,'--yilu-review='+fixture],check=True,capture_output=True)
 for _ in range(200):
  try:d=json.loads(diag.read_text());ready=diag.stat().st_mtime>t and d.get('verificationScope')=='isolated-native-visual-fixture:'+fixture and d.get('screen')=='reward'
  except (OSError,ValueError):ready=False
  if ready:break
  time.sleep(.05)
 else:raise RuntimeError('Reward not ready')
 raw=E/(f'reward-{kind}-{M["build_id"]}-{time.time_ns()}.mov');log=(E/f'reward-{kind}-capture.log').open('w');p=subprocess.Popen(['xcrun','simctl','io',U,'recordVideo','--codec=h264',str(raw)],stdout=log,stderr=subprocess.STDOUT);start=time.time();time.sleep(5);p.send_signal(signal.SIGINT);p.wait(timeout=20);log.close()
 if p.returncode != 0 or raw.stat().st_mtime < start or 'Recording started' not in (E/f'reward-{kind}-capture.log').read_text():raise RuntimeError('Reward framebuffer capture failed; never reuse a prior video')
 out=D/(f'reward-{kind}-original.mp4');subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-vf','scale=500:-2','-c:v','libx264','-crf','20','-preset','fast','-an','-movflags','+faststart',str(out)],check=True)
 meta={'_bridge_media':True,'capture_type':'simulator','speed':'original','produced_at':datetime.datetime.fromtimestamp(start,datetime.timezone.utc).isoformat(),'build':{k:M[k] for k in ['code_fingerprint','build_id','target','configuration','produced_at']},'fixture':fixture,'source_video':str(raw.relative_to(R)),'source_video_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'scope':'isolated seeded reward animation, not natural acquisition; reward screen has no audio','source_sha256':hashlib.sha256(out.read_bytes()).hexdigest()};out.with_suffix('.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2));print(kind,flush=True)
subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True)
