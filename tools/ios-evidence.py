#!/usr/bin/env python3
"""Read-only simulator evidence capture. Never writes game state or drives input."""
import json,time,subprocess,pathlib,shutil,argparse
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--out',default='native-natural');p.add_argument('--device',default='0A71A441-B537-42F4-910C-1214E75A712B');args=p.parse_args()
OUT=ROOT/'evidence/IOS-PLAYABLE-FIX-20260928'/args.out;OUT.mkdir(parents=True,exist_ok=True)
UDID=args.device
container=subprocess.check_output(['xcrun','simctl','get_app_container',UDID,'com.yvainair.yiluchangge','data'],text=True).strip()
source=pathlib.Path(container)/'Documents/yilu-diagnostics.json';seen=set();previous=json.loads((OUT/'results.json').read_text()) if (OUT/'results.json').exists() else [];runs={r['runId']:r for r in previous};start=time.time()
while time.time()-start<2700:
 try:d=json.loads(source.read_text())
 except Exception:time.sleep(.5);continue
 if d.get('verificationScope')!='normal-gameplay':time.sleep(.5);continue
 b=d.get('battle') or {};chapter=b.get('chapter',d.get('chapter',0))+1;screen=d.get('screen');phase=(b.get('boss') or {}).get('phase','march')
 if screen=='battle':
  key=(chapter,phase)
  if key not in seen:
   seen.add(key);stem=f'c{chapter:02}-{phase}';(OUT/(stem+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2));subprocess.run(['xcrun','simctl','io',UDID,'screenshot',str(OUT/(stem+'.png'))],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 if screen=='result' and d.get('runId') not in runs:
  run={'chapter':chapter,'runId':d['runId'],'scope':'actual native simulator, external accessibility touch controls','won':b.get('phase')=='won','foregroundSeconds':d.get('foregroundElapsedSeconds'),'simulationSeconds':b.get('t'),'phaseSeconds':b.get('timing'),'resultLatencySeconds':d.get('resultReadyLatencySeconds'),'fps':d.get('fps'),'performance':d.get('performance'),'renderErrors':d.get('renderErrors'),'invalidRects':d.get('invalidRects'),'createdNodes':d.get('createdNodes'),'troops':b.get('troops'),'crates':b.get('stats',{}).get('crates'),'cycles':(b.get('boss') or {}).get('cycleN'),'save':d.get('save')}
  runs[d['runId']]=run;(OUT/f'c{chapter:02}-result.json').write_text(json.dumps(d,ensure_ascii=False,indent=2));(OUT/'results.json').write_text(json.dumps(list(runs.values()),ensure_ascii=False,indent=2));subprocess.run(['xcrun','simctl','io',UDID,'screenshot',str(OUT/f'c{chapter:02}-result.png')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);print(json.dumps({k:v for k,v in run.items() if k!='save'},ensure_ascii=False),flush=True)
 if len({r['chapter'] for r in runs.values() if r['won']})==10:break
 time.sleep(.5)
