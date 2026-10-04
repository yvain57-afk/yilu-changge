#!/usr/bin/env python3
"""Read-only physical iPhone native integration evidence; no input or save mutation."""
import argparse,json,pathlib,subprocess,time
p=argparse.ArgumentParser();p.add_argument('--device',required=True);p.add_argument('--out',required=True);a=p.parse_args();out=pathlib.Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
latest=out/'latest.json';seen=set();runs={};start=time.time();last_t=-1;last_progress=time.time();lengths=[210,224,238,244,252,260,268,276,284,292]
def cmd(args):return subprocess.run(['xcrun','devicectl',*args],capture_output=True,text=True,timeout=20)
def shot(stem):
 r=cmd(['device','capture','screenshot','--device',a.device,'--destination',str(out/(stem+'.png'))]);return r.returncode==0
while time.time()-start<2100:
 try:
  r=cmd(['device','copy','from','--device',a.device,'--domain-type','appDataContainer','--domain-identifier','com.yvainair.yiluchangge','--source','Documents/yilu-diagnostics.json','--destination',str(latest)])
  if r.returncode:time.sleep(1);continue
  d=json.loads(latest.read_text());b=d.get('battle') or {};ch=d.get('chapter',0)+1;screen=d.get('screen')
  if d.get('verificationScope')!='isolated-native-visual-fixture:R2:campaign':time.sleep(1);continue
  progress=(d.get('runId'),b.get('t'),screen)
  if progress!=last_t:last_t=progress;last_progress=time.time()
  if time.time()-last_progress>45:raise RuntimeError('game state stopped advancing for 45 seconds')
  if screen=='battle':
   phase='boss' if b.get('boss') else 'preboss' if b.get('dist',0)>lengths[ch-1]*.87 else 'march'
   if phase=='march' and b.get('t',0)<15:time.sleep(.4);continue
   key=(ch,phase)
   if key not in seen:
    seen.add(key);stem=f'c{ch:02}-{phase}';(out/(stem+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2));shot(stem);print('capture',ch,phase,flush=True)
  if b.get('phase') in ('won','lost'):
   rid=d['runId'];rec={'chapter':ch,'runId':rid,'scope':'physical iPhone, DEBUG native integration run, automatic legal lateral input, isolated memory save; not human touch','won':b['phase']=='won','foregroundSeconds':d.get('foregroundElapsedSeconds'),'simulationSeconds':b.get('t'),'phaseSeconds':b.get('timing'),'resultLatencySeconds':d.get('resultReadyLatencySeconds'),'fps':d.get('fps'),'performance':d.get('performance'),'renderErrors':d.get('renderErrors'),'invalidRects':d.get('invalidRects'),'missingArt':d.get('missingArt'),'createdNodes':d.get('createdNodes'),'troops':b.get('troops'),'crates':b.get('stats',{}).get('crates'),'cycles':(b.get('boss') or {}).get('cycleN'),'cleared':d.get('save',{}).get('cleared'),'saveNotice':d.get('saveNotice')}
   first=rid not in runs;runs[rid]=rec;(out/'results.json').write_text(json.dumps(list(runs.values()),ensure_ascii=False,indent=2));(out/f'c{ch:02}-result.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
   if first:print(json.dumps(rec,ensure_ascii=False),flush=True)
   if screen=='result' and (ch,'result') not in seen:seen.add((ch,'result'));shot(f'c{ch:02}-result')
   if not rec['won']:raise RuntimeError('chapter failed '+str(ch))
  if len(runs)==10 and screen=='result':break
  time.sleep(.35)
 except (json.JSONDecodeError,FileNotFoundError,subprocess.TimeoutExpired):time.sleep(.5)
else:raise RuntimeError('campaign timeout')
print('COMPLETE',len(runs),flush=True)
