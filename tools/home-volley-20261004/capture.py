"""Actual native simulator capture; no player save or device interaction."""
import pathlib, subprocess, json, time, signal
R=pathlib.Path(__file__).resolve().parents[2]
U='F9504D9B-8094-40EC-949F-925A31F707A8'; B='com.yvainair.yiluchangge'
O=R/'evidence/HOME-VOLLEY-20261004/final-native'; O.mkdir(exist_ok=True)
def run(*a): return subprocess.run(a,check=True,capture_output=True,text=True).stdout.strip()
run('xcrun','simctl','install',U,str(R/'build/ios-home-volley/proj/Debug-iphonesimulator/CocosGame.app'))
p=pathlib.Path(run('xcrun','simctl','get_app_container',U,B,'data'))/'Documents/yilu-diagnostics.json'
for name in ['UI:new','UI:complete','UI:volley:10-bow','UI:volley:80-bow','UI:volley:300-bow','UI:volley:80-fire','UI:volley:80-repeater','UI:regression']:
 subprocess.run(['xcrun','simctl','terminate',U,B],capture_output=True)
 start=time.time();run('xcrun','simctl','launch',U,B,'--yilu-review='+name)
 for _ in range(225):
  try:
   d=json.loads(p.read_text());ready=p.stat().st_mtime>start and d.get('verificationScope')=='isolated-native-visual-fixture:'+name and d.get('screen') not in ('loading','error')
  except Exception:ready=False
  if ready:break
  time.sleep(.2)
 else:raise RuntimeError('Not ready: '+name)
 stem=name.replace(':','-');time.sleep(.5)
 rec=None
 if d['screen']=='battle':
  rec=subprocess.Popen(['xcrun','simctl','io',U,'recordVideo','--codec=h264','--force',str(O/(stem+'.mp4'))],stdout=subprocess.DEVNULL,stderr=(O/(stem+'-record.log')).open('w'))
 samples=[];best=-1
 for _ in range(40 if rec else 1):
  time.sleep(.2)
  try:d=json.loads(p.read_text())
  except Exception:continue
  samples.append(d)
  drawn=(d.get('battle') or {}).get('armyVolley',{}).get('drawn',0)
  if drawn>best:
   best=drawn;run('xcrun','simctl','io',U,'screenshot',str(O/(stem+'.png')))
   # Keep the diagnostic adjacent to its screenshot; full timeline preserves timing context.
   (O/(stem+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2))
 if rec:rec.send_signal(signal.SIGINT);rec.wait(timeout=15)
 (O/(stem+'-timeline.json')).write_text(json.dumps(samples,ensure_ascii=False,indent=2))
 print(name,'samples',len(samples),'max drawn',best,flush=True)
run('xcrun','simctl','terminate',U,B)
run('xcrun','simctl','launch',U,B,'--yilu-review=UI:new')
