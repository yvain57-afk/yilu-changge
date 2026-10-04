"""Restore only metadata whose exact pre-build content is available and hash verified."""
import json,hashlib,subprocess
from pathlib import Path
E=Path('evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001');O=Path.home()/'Library/Application Support/YiluProjectReader/yilu-changge/objects';P=Path('/Users/yvainair/Code/Codex/2026-10-01/yilu-regression-private/failed-import-meta')
rows=dict(json.loads((E/'entry-code.json').read_text())['files']);d=json.loads((E/'device-A/bridge-build-manifest.json').read_text())
for rel,h in d['source_files']:
 if rel not in rows:rows[rel]=h
restored=[]
for rel,h in rows.items():
 p=Path(rel)
 if p.suffix!='.meta' or not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()==h:continue
 assert json.loads(p.read_text()).get('importer')=='*',rel+' is not the known importer corruption'
 blob=O/h;b=blob.read_bytes() if blob.exists() else subprocess.check_output(['git','show','HEAD:'+rel])
 assert hashlib.sha256(b).hexdigest()==h,rel
 backup=P/rel;backup.parent.mkdir(parents=True,exist_ok=True)
 if not backup.exists():backup.write_bytes(p.read_bytes())
 p.write_bytes(b);restored.append({'path':rel,'sha256':h})
(E/'metadata-recovery.json').write_text(json.dumps({'method':'exact pre-build hash from immutable MCP object or identical Git blob; corrupt copy preserved privately','restored':restored},indent=2));print('Restored',len(restored),'known build-corrupted metadata files')
