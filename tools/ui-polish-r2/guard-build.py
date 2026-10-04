"""Preserve the exact dirty metadata around Creator's importer normalization.
Only importer-produced changes with the same resource UUID are restored. Unknown
identity changes fail loudly and are retained for diagnosis rather than overwritten.
"""
from pathlib import Path
import subprocess,sys,json,hashlib
R=Path(__file__).resolve().parents[2];before={p:p.read_bytes() for p in (R/'assets').rglob('*.meta') if p.is_file()}
proc=subprocess.run(sys.argv[1:],cwd=R);rows=[]
for p,data in before.items():
 current=p.read_bytes()
 if current==data:continue
 if json.loads(data).get('uuid')!=json.loads(current).get('uuid'):raise SystemExit('Metadata identity changed; retained: '+str(p))
 rows.append({'path':str(p.relative_to(R)),'entry_sha256':hashlib.sha256(data).hexdigest(),'importer_sha256':hashlib.sha256(current).hexdigest()});p.write_bytes(data)
(R/'evidence/YILU_UI_POLISH_R2'/('importer-restored-'+str(proc.pid if hasattr(proc,'pid') else len(rows))+'.json')).write_text(json.dumps(rows,indent=2))
raise SystemExit(proc.returncode)
