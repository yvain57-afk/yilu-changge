#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Local delivery only. No commit, upload, signing change or private save export."""
from pathlib import Path
import json,hashlib,subprocess,zipfile,re,datetime
R=Path(__file__).resolve().parents[1];E=R/'evidence/IOS-PLAYABLE-FIX-20260928';D=R/'deliverables/IOS-PLAYABLE-FIX-20260928'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2))
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=R).decode().split('\0');files={R/p for p in tracked if p}
for root in ['assets','art-source/ios-fix20260928','native','docs/IOS-PLAYABLE-FIX-20260928','tools','tests']:
 files.update(p for p in (R/root).rglob('*') if p.is_file())
def allowed(p):
 rel=p.relative_to(R);s=str(rel)
 if not p.is_file() or p.is_symlink():return False
 if any(k in rel.parts for k in ['.git','.cache','node_modules','__pycache__','downloads','build','library','temp','profiles']):return False
 if rel.parts[0] in ['evidence','deliverables','release']:return False
 if p.suffix.lower() in ['.zip','.mp4','.webm','.mov','.p12','.pem','.key','.mobileprovision','.sqlite','.db']:return False
 if p.name.startswith('.env') or 'private.config' in p.name:return False
 if p.stat().st_size>25000000:return False
 return True
files=sorted(p for p in files if allowed(p))
# Abort if recognizable credential material appears; never print matched content.
secret=re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[A-Za-z0-9_-]{36,}|gh[pousr]_[A-Za-z0-9]{30,}')
for p in files:
 if p.suffix.lower() in ['.md','.json','.txt','.js','.ts','.py','.sh'] or p.name=='.npmrc':
  if secret.search(p.read_bytes()):raise RuntimeError('Credential-like content found; package stopped: '+str(p.relative_to(R)))
manifest={str(p.relative_to(R)):{'bytes':p.stat().st_size,'sha256':sha(p)} for p in files}
fingerprint={'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'branch':subprocess.check_output(['git','branch','--show-current'],cwd=R,text=True).strip(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'uncommitted':True,'files':manifest}
dump(E/'source-fingerprint.json',fingerprint);dump(D/'source-package-manifest.json',manifest)
print('source files',len(files),'bytes',sum(x['bytes'] for x in manifest.values()),flush=True)
# Source ZIP preserves every selected file, not only this turn's diff.
with zipfile.ZipFile(D/'源码开发包.zip','w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for p in files:z.write(p,str(p.relative_to(R)))
 z.write(D/'README.md','IOS_DELIVERY_README.md');z.write(D/'source-package-manifest.json','source-package-manifest.json')
print('source zipped',flush=True)
builds=[]
for folder,label in [('ios-simulator','iOS模拟器构建.zip'),('ios-device','iPhone开发签名构建.zip')]:
 cfg='Debug-iphonesimulator' if folder=='ios-simulator' else 'Release-iphoneos';app=R/'build'/folder/'proj'/cfg/'CocosGame.app'
 subprocess.run(['ditto','-c','-k','--sequesterRsrc','--keepParent',str(app),str(D/label)],check=True)
 entries={str(p.relative_to(app)):sha(p) for p in sorted(app.rglob('*')) if p.is_file() and not p.is_symlink()}
 builds.append({'artifact':label,'sha256':sha(D/label),'appContentFingerprint':hashlib.sha256(json.dumps(entries,sort_keys=True).encode()).hexdigest(),'executableSHA256':sha(app/'CocosGame'),'bundleId':'com.yvainair.yiluchangge','signingScope':'simulator unsigned' if folder=='ios-simulator' else 'development Release; install blocked by free provisioning app limit'})
dump(E/'build-manifest.json',builds);print('apps zipped',flush=True)
video=[]
for name,scope,version in [
 ('native-calibrated-ten-original-speed.mp4','full actual native ten first clears, raw uncut','calibration-round2-before/'),
 ('native-calibrated-ten-review.mp4','same full ten; 780-wide compressed original speed, uncut','calibration-round2-before/'),
 ('native-github-audit-fixture-full-original-speed.mp4','post-review isolated native fixture, raw; no input; not first clear; recording has a long simulator frame gap before the active segment','source-fingerprint.json'),
 ('native-github-audit-fixture-original-speed.mp4','post-review final native fixture, original-speed source seconds70–105; no gameplay input','source-fingerprint.json')]:
 p=E/name;probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height,avg_frame_rate','-of','json',str(p)]))
 video.append({'file':name,'bytes':p.stat().st_size,'sha256':sha(p),'scope':scope,'version':version,'probe':probe,'speedChanged':False,'audioVerified':False})
dump(E/'media-provenance.json',{'note':'Full second ten-level run predates the final Boss7 260→225 and Boss10 220→190 correction, full-body detail art/UI, support HUD, gate window and treasure collection fixes. Final seven pairs, all30 detail captures and final fixture video use the delivered final build. Natural final c7/c10 retest was not executed. Model cannot replace it. Raw video remains local; review ZIP includes compressed full ten and final35s excerpt.','screenshots':'comparison/S01..S07-after plus S01-person-after and Boss phase captures: post-review native Debug memory fixtures, no persistent save writes.','video':video,'builds':builds})
selected=[]
base=['index.html','03_ACCEPTANCE.json','ACCEPTANCE.md','TIMINGS.md','PARAMETER_DIFF.md','implementation-notes.md','character-state-matrix.json','frame-inventory.json','model-pacing.json','source-fingerprint.json','media-provenance.json','build-manifest.json','full-tests.log','typecheck.log','final-codesign.txt','native-calibrated-ten-review.mp4','native-github-audit-fixture-original-speed.mp4','native-settings-both-off.png','native-pause-before-background.json','native-pause-after-background.json','final-normal-home.json','video-decode-short.log','video-decode-ten.log']
for name in base:
 p=E/name
 if p.exists():selected.append(p)
for p in (E/'comparison').glob('S*'):
 if p.suffix in ['.png','.json']:selected.append(p)
for folder in ['calibration-before','calibration-round2-before']:
 selected.extend(p for p in (E/folder).rglob('*') if p.is_file())
for folder in ['native-calibrated-natural','native-final-natural']:
 for p in (E/folder).glob('*'):
  if p.suffix=='.json' or p.name.endswith(('-result.png','-yield.png','-to-c08-prepare.png')):selected.append(p)
# Remove device identifiers and account paths from install diagnostic copied to review.
p=E/'device-install-result.txt'
if p.exists():
 t=p.read_text();t=re.sub(r'\b[0-9A-Fa-f]{8}-[0-9A-Fa-f]{16}\b','[device-id-redacted]',t)
 (E/'device-install-summary.txt').write_text(t);selected.append(E/'device-install-summary.txt')
# Keep the existing link usable using sanitized content as the archive entry.
with zipfile.ZipFile(D/'核验小包.zip','w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted(set(selected)):
  name=str(p.relative_to(E));z.write(p,'device-install-result.txt' if name=='device-install-summary.txt' else name)
 z.write(D/'README.md','README.md');z.write(R/'docs/IOS-PLAYABLE-FIX-20260928/GITHUB_REVIEW.md','GITHUB_REVIEW.md')
print('review zipped',flush=True)
checks={}
for p in sorted(D.glob('*.zip')):
 with zipfile.ZipFile(p) as z:
  bad=z.testzip()
  if bad:raise RuntimeError('ZIP CRC failure '+str(p)+' '+bad)
  checks[p.name]={'bytes':p.stat().st_size,'sha256':sha(p),'entries':len(z.namelist()),'zipCRC':'pass'}
dump(D/'SHA256.json',checks);print(json.dumps(checks,ensure_ascii=False,indent=2))
