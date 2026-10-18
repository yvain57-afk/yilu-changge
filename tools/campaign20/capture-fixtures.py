#!/usr/bin/env python3
import argparse,json,pathlib,subprocess,time,hashlib
P=argparse.ArgumentParser();P.add_argument('--device',required=True);P.add_argument('--out',required=True);P.add_argument('fixtures',nargs='+');a=P.parse_args();R=pathlib.Path(__file__).resolve().parents[2];O=R/a.out;O.mkdir(parents=True,exist_ok=True);B='com.yvainair.yiluchangge';U=a.device
M=json.loads((R/'evidence/YILU-CAMPAIGN20-20260930/bridge-build-manifest.json').read_text());C=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',U,B,'data'],text=True).strip());D=C/'Documents/yilu-diagnostics.json'
for name in a.fixtures:
 subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True);t=time.time();subprocess.run(['xcrun','simctl','launch',U,B,'--yilu-review='+name],check=True,capture_output=True)
 for _ in range(150):
  try:d=json.loads(D.read_text());ready=D.stat().st_mtime>t and d.get('verificationScope')=='isolated-native-visual-fixture:'+name and d.get('screen')!='loading'
  except (OSError,ValueError):ready=False
  if ready:break
  time.sleep(.2)
 else:raise RuntimeError('fixture not ready '+name)
 time.sleep(1.2);d=json.loads(D.read_text());assert not any(d.get(k) for k in ['missingArt','renderErrors','invalidRects','error']),str(d)
 p=O/(name.replace(':','-')+'-after.png');subprocess.run(['xcrun','simctl','io',U,'screenshot',str(p)],check=True,capture_output=True)
 p.with_suffix('.json').write_text(json.dumps({'_bridge_media':True,'capture_type':'simulator','produced_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build':{k:M[k] for k in ['build_id','code_fingerprint','target','configuration','produced_at']},'run_id':d.get('runId'),'scope':'isolated seeded native visual fixture; not natural progression','state':d,'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest()},ensure_ascii=False,indent=2));print(name,d['screen'],d.get('viewport'),flush=True)
