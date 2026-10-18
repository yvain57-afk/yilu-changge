from pathlib import Path
import json,zipfile,hashlib
R=Path(__file__).resolve().parents[2];D=R/'deliverables/R3-COMBAT-PATCH-20261002';E=R/'evidence/R3-COMBAT-PATCH-20261002'
P=D/'packages';P.mkdir(exist_ok=True)
media=json.loads((D/'media-index.json').read_text());natural=json.loads((E/'runtime/natural20-record.json').read_text())
assert len(media['pairs'])==3 and not media['missing']
assert len(natural['rows'])==20 and not natural['pageErrors']
assert all((R/v['file']).stat().st_size>1024 for v in media['videos'])
files=[]
for p in D.rglob('*'):
 if p.is_file() and 'packages' not in p.relative_to(D).parts and 'archive' not in p.relative_to(D).parts and p.name!='natural20-original-speed.mp4':files.append(p)
for name in ['mcp-final-binding-check.json','mcp-current-pixels-check.json','mcp-doctor.json','mcp-status-connected.json','delivery-http-check.json','runtime/playable-entry-review-check.json','importer-recovery.json','friendly-invariants.json','bridge-targeted-restored-check.json','bridge-timing-gate-check.json','authored-timing-gate.tap','bridge-reader-regression-receipt.json','full-tests.tap','native/signing.json','native/physical-final-preflight.json','native/bridge-build-manifest.json','runtime/natural20-record.json','runtime/natural20-progress.json','runtime/natural-mounted-ledger-summary.json','runtime/cavalry-hit-avoid-record.json','runtime/seven-route-runtime.json','runtime/mount-cycles-metrics.json','runtime/released-arrows-survive-source-death.json','runtime/natural20-summary.json','runtime/audio-runtime.json','runtime/final-audio-measurement.log','combat/parameters-old-new.json','combat/legacy-timing-current-reference.json','combat/matrix-summary.json']:
 p=E/name
 if p.is_file():files.append(p)
for p in (E/'menu/pixels').glob('*.png'):
 if any(p.name==prefix+k+'.png' for prefix in ['before-','after-'] for k in ['home-402x874','lineup-402x874','c16-lubu-machao-rec']):
  files.extend([p,p.with_suffix('.json')])
files.extend(p for p in (E/'mcp-pixels').glob('*.png') if p.is_file())
out=P/'YILU_R3_2026100303_REVIEW.zip'
index=[{'path':str(p.relative_to(R)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(set(files))]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted(set(files)):z.write(p,str(p.relative_to(R)))
 z.writestr('MANIFEST.json',json.dumps(index,ensure_ascii=False,indent=2))
 full=R/next(v['file'] for v in media['videos'] if v['file'].endswith('natural20-original-speed.mp4'))
 z.writestr('FULL-VIDEO-SEPARATE.json',json.dumps({'actual_delivered_file':str(full.relative_to(R)),'bytes':full.stat().st_size,'sha256':hashlib.sha256(full.read_bytes()).hexdigest(),'scope':'Full original-speed twenty-chapter video is delivered as a separate large MP4. This review ZIP contains actual before/after pixels and all original-speed short clips, not merely a path list.'},indent=2))
with zipfile.ZipFile(out) as z:assert z.testzip() is None
receipt={'file':str(out.relative_to(R)),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'file_count':len(index),'actual_pixels_and_videos_included':True,'private_profile_and_device_save_excluded':True}
(D/'proof-package-manifest.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));print(json.dumps(receipt))
