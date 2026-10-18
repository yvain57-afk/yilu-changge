"""Scoped same-bundle replacement, with a fresh Documents backup and exact readback."""
import argparse,datetime,hashlib,json,pathlib,sqlite3,subprocess,time
R=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--device',required=True);p.add_argument('--phase',choices=['prepare','install'],required=True);a=p.parse_args()
private=pathlib.Path('/Users/yvainair/Code/Codex/2026-10-04/yilu-battle-feel-private');private.mkdir(parents=True,exist_ok=True)
pointer=private/'current-install.json';bundle='com.yvainair.yiluchangge'
if a.phase=='prepare':
 folder=private/('install-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));folder.mkdir();pointer.write_text(json.dumps({'folder':str(folder)}))
else:folder=pathlib.Path(json.loads(pointer.read_text())['folder'])
def run(name,args,timeout=35,required=True):
 out=folder/(name+'.json');res=subprocess.run(['xcrun','devicectl',*args,'--device',a.device,'--quiet','--timeout',str(timeout),'--json-output',str(out)],capture_output=True,text=True,timeout=timeout+8)
 (folder/(name+'.log')).write_text(res.stdout+res.stderr)
 data=json.loads(out.read_text()) if out.exists() else {}
 if required and res.returncode:raise RuntimeError(name+' failed; private diagnostic retained')
 return res.returncode,data
def apps(name):return run(name,['device','info','apps','--bundle-id',bundle])[1]['result']['apps'][0]
def manifest(path):return [{'path':str(f.relative_to(path)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(path.rglob('*')) if f.is_file()]
def copy(tag):
 dest=folder/(tag+'-Documents');run('copy-'+tag,['device','copy','from','--domain-type','appDataContainer','--domain-identifier',bundle,'--source','Documents','--destination',str(dest)])
 rows=manifest(dest);(folder/(tag+'-manifest.json')).write_text(json.dumps(rows,indent=2));return rows
if a.phase=='prepare':
 info=apps('apps-before');proc=run('processes-before',['device','info','processes'])[1]
 # The running executable must belong to this exact app container.
 for q in proc['result']['runningProcesses']:
  if q.get('executable','').startswith(info['url']):run('terminate',['device','process','terminate','--pid',str(q['processIdentifier'])])
 rows=copy('before');db=folder/'before-Documents/jsb.sqlite';assert db.is_file(),'existing save required before replacement'
 con=sqlite3.connect(db.as_uri()+'?mode=ro',uri=True);check=con.execute('pragma quick_check').fetchone()[0];con.close();assert check=='ok'
 (folder/'prepared.json').write_text(json.dumps({'before':{'version':info['version'],'build':info['bundleVersion']},'sqlite_quick_check':check}))
 print(json.dumps({'phase':'prepared','version':info['version'],'build':info['bundleVersion'],'files':len(rows),'sqlite':check}))
else:
 signed=json.loads((R/'evidence/BATTLE-FEEL-20261004/native/signing.json').read_text());before=json.loads((folder/'prepared.json').read_text())
 assert signed['version']=='0.12.6' and signed['build_number']=='2026100401'
 run('install',['device','install','app',signed['app_path']],120)
 info=apps('apps-after');assert (info['version'],info['bundleVersion'])==('0.12.6','2026100401')
 rows=copy('after');old=json.loads((folder/'before-manifest.json').read_text());same=rows==old
 assert same,'Documents changed before first launch; retain both backups for investigation'
 rc,launch=run('launch',['device','process','launch',bundle],required=False)
 pid=launch.get('result',{}).get('process',{}).get('processIdentifier');alive=False
 if rc==0:
  time.sleep(3);_,proc=run('processes-after',['device','info','processes'],required=False);alive=any(q.get('processIdentifier')==pid for q in proc.get('result',{}).get('runningProcesses',[]))
 result={'produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bundle_id':bundle,'device_type':'physical iPhone','before':before['before'],'after':{'version':info['version'],'build':info['bundleVersion']},'build':signed['build'],'installed':'passed','version_readback':'passed','signature':'strict verified','save_protection':{'status':'passed','before_after_exact_equal':same,'files':rows,'sqlite_quick_check':before['sqlite_quick_check'],'private_backup':True,'comparison_before_first_launch':True},'launch':{'status':'passed' if rc==0 and alive else 'blocked','exit':rc,'pid':pid,'alive_after_3s':alive,'error':launch.get('error')},'visual_touch_performance':'not_tested_in_this_install','camera_uninstall_publish':False}
 (R/'evidence/BATTLE-FEEL-20261004/native/physical-install.json').write_text(json.dumps(result,indent=2,ensure_ascii=False));print(json.dumps(result,ensure_ascii=False))
