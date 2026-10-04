#!/usr/bin/env python3
"""Actual simulator framebuffer + game-PID CoreAudio tap, same host clock; never asset dubbing."""
import pathlib,subprocess,time,json,signal,hashlib,sys,argparse,re
P=argparse.ArgumentParser();P.add_argument('--device',default='09499CE2-E8CC-4470-A90D-DDD7F8946C21');P.add_argument('modes',nargs='*');args=P.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[2];E=ROOT/'evidence/YILU-CAMPAIGN20-20260930';D=ROOT/'deliverables/YILU-CAMPAIGN20-20260930/media';D.mkdir(parents=True,exist_ok=True);U=args.device;B='com.yvainair.yiluchangge'
container=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',U,B,'data'],text=True).strip());diag=container/'Documents/yilu-diagnostics.json';manifest=json.loads((E/'bridge-build-manifest.json').read_text())
for mode in args.modes or ['normal','dense']:
 subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True);begin=time.time();launch=subprocess.check_output(['xcrun','simctl','launch',U,B,'--yilu-review=C20SFX:'+mode],text=True);pid=launch.strip().split(':')[-1].strip()
 for _ in range(150):
  try:d=json.loads(diag.read_text());ready=diag.stat().st_mtime>begin and d.get('audio',{}).get('counters',{}).get('played',0)>1
  except Exception:ready=False
  if ready:break
  time.sleep(.1)
 else:raise RuntimeError('native audio fixture not ready')
 raw_video=E/f'{mode}-{manifest["build_id"]}-{time.time_ns()}-raw.mov';raw_audio=raw_video.with_suffix('.caf')
 vf=open(E/(mode+'-video.log'),'w');video=subprocess.Popen(['xcrun','simctl','io',U,'recordVideo','--codec=h264',str(raw_video)],stdout=vf,stderr=subprocess.STDOUT)
 # simctl signals first framebuffer. Clock uncertainty is recorded, never hidden.
 for _ in range(50):
  if 'Recording started' in (E/(mode+'-video.log')).read_text():break
  time.sleep(.02)
 else:raise RuntimeError('Framebuffer recorder did not start; do not continue with stale video')
 video_clock=time.time();af=open(E/(mode+'-audio.log'),'w');audio=subprocess.Popen([str(ROOT/'tools/weapon-sfx/capture-process-audio'),pid,str(raw_audio),'58'],stdout=af,stderr=subprocess.STDOUT);records=[];seen=set();events=[]
 for i in range(235):
  try:
   state=json.loads(diag.read_text());records.append({'host_time':time.time(),'state':state})
   for event in state.get('audio',{}).get('weaponSfx',{}).get('trace',[]):
    key=(event['runId'],event['eventId'])
    if key not in seen:seen.add(key);events.append(event)
   if i==32:subprocess.run(['xcrun','simctl','io',U,'screenshot',str(E/(mode+'-runtime.png'))],capture_output=True)
  except Exception:pass
  time.sleep(.25)
 audio.wait(timeout=5);video.send_signal(signal.SIGINT);video.wait(timeout=15);af.close();vf.close()
 if video.returncode != 0 or audio.returncode != 0 or raw_video.stat().st_mtime < begin:raise RuntimeError('Native recording failed')
 levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(raw_audio),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True).stderr
 (E/(mode+'-audio-levels.log')).write_text(levels);peak=re.search(r'max_volume: ([\d.-]+) dB',levels)
 if not peak or float(peak[1])<=-80:raise RuntimeError('Actual capture is silent; do not deliver as audible evidence')
 lines=(E/(mode+'-audio.log')).read_text();audio_clock=float(lines.split('START ')[1].split()[0]);offset=max(0,audio_clock-video_clock)
 # Positive timestamp offset preserves actual capture start. No asset track is used.
 out=D/(mode+'-native-system-audio.mp4');subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw_video),'-itsoffset',str(offset),'-i',str(raw_audio),'-map','0:v','-map','1:a','-vf','scale=600:-2','-c:v','libx264','-crf','20','-preset','fast','-c:a','aac','-b:a','192k','-t','58','-movflags','+faststart',str(out)],check=True)
 (E/(mode+'-runtime-samples.json')).write_text(json.dumps(records,ensure_ascii=False));(E/(mode+'-events.json')).write_text(json.dumps(events,ensure_ascii=False,indent=2));(E/(mode+'-capture.json')).write_text(json.dumps({'code_fingerprint':manifest['code_fingerprint'],'build_id':manifest['build_id'],'capture_type':'simulator','scope':'isolated DEBUG audio fixture, memory store, not natural clear or physical touch','speed':'original','audio_origin':'CoreAudio process tap of actual CocosGame PID '+pid,'video_origin':'simctl framebuffer','video_start_host':video_clock,'audio_start_host':audio_clock,'sync_offset_seconds':offset,'sync_uncertainty_seconds':.06,'source_video':str((raw_video).relative_to(ROOT)),'source_video_sha256':hashlib.sha256(raw_video.read_bytes()).hexdigest(),'source_audio':str((raw_audio).relative_to(ROOT)),'output':str(out.relative_to(ROOT)),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'event_count':len(events)},ensure_ascii=False,indent=2));print(mode,len(events),'events',out,flush=True)
