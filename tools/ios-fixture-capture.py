#!/usr/bin/env python3
"""Launch isolated native visual fixtures and capture actual simulator pixels."""
import pathlib,subprocess,json,time,sys,argparse
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/IOS-PLAYABLE-FIX-20260928/comparison';OUT.mkdir(exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--device',default='0A71A441-B537-42F4-910C-1214E75A712B');parser.add_argument('fixtures',nargs='+');args=parser.parse_args();u=args.device;bundle='com.yvainair.yiluchangge'
container=subprocess.check_output(['xcrun','simctl','get_app_container',u,bundle,'data'],text=True).strip();p=pathlib.Path(container)/'Documents/yilu-diagnostics.json'
for name in args.fixtures:
 subprocess.run(['xcrun','simctl','terminate',u,bundle],capture_output=True)
 started=time.time();subprocess.run(['xcrun','simctl','launch',u,bundle,'--yilu-review='+name],check=True,capture_output=True)
 for _ in range(100):
  try:
   d=json.loads(p.read_text());ready=p.stat().st_mtime>started and d.get('verificationScope')=='isolated-native-visual-fixture:'+name and d.get('screen')!='loading'
  except Exception:ready=False
  if ready:break
  time.sleep(.2)
 else:raise RuntimeError('not ready '+name)
 stem=name.replace(':','-')+'-after';(OUT/(stem+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2));subprocess.run(['xcrun','simctl','io',u,'screenshot',str(OUT/(stem+'.png'))],check=True,capture_output=True);print(name,d['screen'],d['renderErrors'],d['invalidRects'],flush=True)
