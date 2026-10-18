from pathlib import Path
import json,hashlib,subprocess
R=Path(__file__).resolve().parents[2];D=R/'deliverables/R3-COMBAT-PATCH-20261002';E=R/'evidence/R3-COMBAT-PATCH-20261002'
FP='cd613377a62aeddaff93ad9dbf39e72a272ab9305294bcf848694bde87beb0e1'
selected=[('menu/pixels/after-home-402x874.png','fixture'),('menu/pixels/after-lineup-402x874.png','fixture'),('menu/pixels/after-c16-lubu-machao-rec.png','fixture'),('runtime/pixels/dense-375-near.png','fixture'),('runtime/pixels/natural-mounted-checkpoint-60.png','natural_play'),('runtime/pixels/seven-route-archer.png','fixture'),('runtime/pixels/cavalry-stationary.png','fixture'),('runtime/pixels/natural20-c20-settlement.png','natural_play')]
rows=[]
def ingest(p,kind,build):
 assert build['code_fingerprint']==FP
 out=subprocess.run([str(R/'tools/project-reader/yilu-bridge'),'import-media',str(p),'--game-only','--capture-type',kind,'--speed','original','--code-fingerprint',FP],capture_output=True,text=True,timeout=240,check=True)
 d=json.loads(out.stdout);row={'id':d['id'],'file':str(p.relative_to(R)),'source_sha256':d['source_sha256'],'capture_type':kind,'code_fingerprint':FP,'build':build,'basis':'verified embedded runtime build plus exact file hash before import; local bridge assigns fingerprint'};rows.append(row)
 (D/'MCP-MEDIA.json').write_text(json.dumps({'project_id':'yilu-changge','code_fingerprint':FP,'media':rows,'audio':'Actual audio m4a delivered locally; MCP read_media does not support audio, no ChatGPT listening claimed.'},ensure_ascii=False,indent=2))
 print(row['id'],row['file'],flush=True)
for rel,kind in selected:
 p=E/rel;side=json.loads(p.with_suffix('.json').read_text());assert side['source_sha256']==hashlib.sha256(p.read_bytes()).hexdigest();ingest(p,kind,side['build'])
m=json.loads((D/'media-index.json').read_text())
for name,kind in [('actors-original-speed.mp4','fixture'),('natural-mounted-original-speed.mp4','natural_play'),('seven-route-original-speed.mp4','fixture'),('cavalry-hit-avoid-original-speed.mp4','fixture'),('natural20-original-speed.mp4','natural_play')]:
 v=next(v for v in m['videos'] if v['file'].endswith('/'+name));ingest(R/v['file'],kind,v['build'])
print('Imported actual final images and precomputed video frames; not a ChatGPT read receipt',flush=True)
