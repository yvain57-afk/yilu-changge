#!/usr/bin/env python3
"""One natural Cocos campaign with legal DEBUG input. Evidence capture never mutates gameplay."""
import argparse,pathlib,subprocess,time,json,signal,hashlib
P=argparse.ArgumentParser();P.add_argument('--device',default='09499CE2-E8CC-4470-A90D-DDD7F8946C21');P.add_argument('--out',default='evidence/YILU-CAMPAIGN20-20260930/native-campaign');a=P.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/a.out;OUT.mkdir(parents=True,exist_ok=True);U=a.device;B='com.yvainair.yiluchangge'
container=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',U,B,'data'],text=True).strip());diag=container/'Documents/yilu-diagnostics.json';manifest=json.loads((ROOT/'evidence/YILU-CAMPAIGN20-20260930/bridge-build-manifest.json').read_text())
subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True)
started=time.time();launch=subprocess.check_output(['xcrun','simctl','launch',U,B,'--yilu-review=C20:campaign'],text=True);pid=launch.strip().split(':')[-1].strip()
seen=set();runs={};clips=[];active=None;last_change=time.time();last_key=None;samples=0

def screenshot(name,d):
 p=OUT/(name+'.png');subprocess.run(['xcrun','simctl','io',U,'screenshot',str(p)],check=True,capture_output=True)
 side={'_bridge_media':True,'capture_type':'simulator','speed':'original','produced_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build':{k:manifest[k] for k in ['build_id','code_fingerprint','target','configuration','produced_at']},'run_id':d.get('runId'),'scope':'DEBUG legal lateral inputs, natural new-save campaign; not human touch','state':d,'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 p.with_suffix('.json').write_text(json.dumps(side,ensure_ascii=False,indent=2))

def start_clip(ch):
 stem=OUT/f'c{ch:02}-original';vlog=open(str(stem)+'-video.log','w');v=subprocess.Popen(['xcrun','simctl','io',U,'recordVideo','--codec=h264',str(stem)+'.mov'],stdout=vlog,stderr=subprocess.STDOUT)
 for _ in range(100):
  if 'Recording started' in pathlib.Path(str(stem)+'-video.log').read_text():break
  time.sleep(.02)
 vt=time.time();alog=open(str(stem)+'-audio.log','w');audio=subprocess.Popen([str(ROOT/'tools/weapon-sfx/capture-process-audio'),pid,str(stem)+'.caf','40'],stdout=alog,stderr=subprocess.STDOUT)
 return {'stem':str(stem),'chapter':ch,'v':v,'audio':audio,'vlog':vlog,'alog':alog,'start':vt}

def stop_clip(c):
 c['v'].send_signal(signal.SIGINT);c['v'].wait(timeout=20);
 if c['audio'].poll() is None and time.time()-c['start']<40:c['audio'].send_signal(signal.SIGINT)
 c['audio'].wait(timeout=10);c['vlog'].close();c['alog'].close();clips.append({k:v for k,v in c.items() if k in ['stem','chapter','start']});print('CLIP',c['chapter'],flush=True)
try:
 with (OUT/'progress.jsonl').open('w') as log:
  while time.time()-started<4800:
   try:d=json.loads(diag.read_text())
   except (OSError,ValueError):time.sleep(.3);continue
   if diag.stat().st_mtime<started or d.get('verificationScope')!='isolated-native-visual-fixture:C20:campaign':time.sleep(.3);continue
   b=d.get('battle') or {};ch=d.get('chapter',0)+1;screen=d.get('screen');phase=(b.get('boss') or {}).get('phase','march');k=(d.get('runId'),screen,b.get('t'))
   if k!=last_key:last_change=time.time();last_key=k
   if time.time()-last_change>50:raise RuntimeError('state stopped advancing: '+str(k))
   if d.get('renderErrors') or d.get('invalidRects') or d.get('missingArt') or d.get('saveNotice'):raise RuntimeError('runtime failure '+str({k:d.get(k) for k in ['renderErrors','invalidRects','missingArt','saveNotice']}))
   samples+=1
   if samples%3==0:log.write(json.dumps({'host_time':time.time(),'chapter':ch,'screen':screen,'runId':d.get('runId'),'t':b.get('t'),'phase':phase,'troops':b.get('troops'),'counts':d.get('diagnostics',{}).get('counts'),'audio':d.get('audio',{}).get('weaponSfx',{}).get('counters'),'performance':d.get('performance'),'bodyBudget':d.get('diagnostics',{}).get('bodyBudget')},ensure_ascii=False)+'\n');log.flush()
   key=(ch,screen,phase)
   capture=screen=='battle' and b.get('t',0)>15 and phase in ['march','warn','rec'] or screen=='reward' and ch in [1,2,10,12,18,20] or screen=='transition' and ch in [4,8,12,16]
   if capture and key not in seen:seen.add(key);screenshot(f'c{ch:02}-{screen}-{phase}',d)
   if active and time.time()-active['start']>=41:stop_clip(active);active=None
   if screen=='battle' and ch in [2,12,20] and ch not in [c['chapter'] for c in clips] and not active and (b.get('t',0)>18 if ch!=20 else bool(b.get('boss'))):active=start_clip(ch)
   if screen in ['reward','result'] and b.get('phase') in ['won','lost']:
    rid=d['runId'];first=rid not in runs;runs[rid]={'chapter':ch,'runId':rid,'won':b['phase']=='won','simulationSeconds':b.get('t'),'foregroundSeconds':d.get('foregroundElapsedSeconds'),'timing':b.get('timing'),'troops':b.get('troops'),'save':d.get('save'),'damageSources':b.get('damageSources'),'routeXP':b.get('routeXP'),'stats':b.get('stats'),'performance':d.get('performance'),'fps':d.get('fps'),'missingArt':d.get('missingArt'),'renderErrors':d.get('renderErrors'),'invalidRects':d.get('invalidRects'),'counts':d.get('diagnostics',{}).get('counts'),'build':{k:manifest[k] for k in ['build_id','code_fingerprint','target','configuration','produced_at']}}
    (OUT/'results.json').write_text(json.dumps(list(runs.values()),ensure_ascii=False,indent=2))
    if first:print('RESULT',ch,runs[rid]['won'],b.get('t'),b.get('troops'),flush=True);screenshot(f'c{ch:02}-completed',d)
    if b['phase']=='lost':raise RuntimeError('natural campaign failed c'+str(ch))
   if len(runs)==20 and screen=='result':break
   time.sleep(.4)
  else:raise RuntimeError('campaign timeout')
finally:
 if active:stop_clip(active)
 (OUT/'clips.json').write_text(json.dumps(clips,indent=2))
 runtime=container/'Documents/yilu-bridge-events.jsonl'
 if runtime.exists():(OUT/'runtime-events.jsonl').write_bytes(runtime.read_bytes())
print('COMPLETE',len(runs),flush=True)
