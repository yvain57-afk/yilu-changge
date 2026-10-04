from pathlib import Path
import json,sys,subprocess,uuid
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tools/project-reader'))
from common import game_fingerprint,now
E=R/'evidence/COMBAT-FLOW-20261003';E.mkdir(exist_ok=True)
fp,rows=game_fingerprint(R)
stamp={'build_id':'combat-flow-'+uuid.uuid4().hex[:12],'code_fingerprint':fp,'produced_at':now(),'target':'browser_isolated','configuration':'Debug','app_version':'0.12.5','build_number':'2026100304'}
(R/'assets/scripts/formal/BridgeBuild.ts').write_text('// Generated before Cocos export.\nexport const BRIDGE_BUILD='+json.dumps(stamp)+';\n')
(E/'web-manifest.json').write_text(json.dumps({**stamp,'source_files':rows},indent=2))
cfg=json.loads((R/'.cache/ui-full-web.json').read_text());cfg['outputName']='combat-flow-web';p=R/'.cache/combat-flow-web.json';p.write_text(json.dumps(cfg))
with (E/'web-export.log').open('w') as log:
 proc=subprocess.run(['/Applications/CocosCreator/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator','--project',str(R),'--build','configPath='+str(p)],stdout=log,stderr=subprocess.STDOUT)
print('Creator exit',proc.returncode)
if proc.returncode not in (0,36):raise SystemExit(1)
data=R/'build/combat-flow-web/assets/main/config.json'
if not json.loads(data.read_text()).get('scenes'):raise SystemExit('missing scene')
print('build',stamp['build_id'],fp)
