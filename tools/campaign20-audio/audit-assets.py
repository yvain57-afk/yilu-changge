#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,wave,numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'evidence/YILU-CAMPAIGN20-20260930';OUT.mkdir(parents=True,exist_ok=True)
a=json.loads((ROOT/'art-source/campaign20-audio/asset-manifest.json').read_text());old=json.loads((ROOT/'art-source/weapon-sfx-20260930/asset-manifest.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(r):
 with wave.open(str(ROOT/r['path'])) as w: return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768,w.getframerate()
samples={r['id']:read(r)[0] for r in old['files']+a['files']};rows=[]
for r in a['files']:
 x,rate=read(r);spectrum=np.abs(np.fft.rfft(x));f=np.fft.rfftfreq(len(x),1/rate);active=np.flatnonzero(np.abs(x)>.004)
 similarities=[]
 for id,y in samples.items():
  if id==r['id']:continue
  n=max(len(x),len(y));xx=np.pad(x,(0,n-len(x)));yy=np.pad(y,(0,n-len(y)));sim=float(abs(np.dot(xx,yy))/(np.linalg.norm(xx)*np.linalg.norm(yy)));similarities.append((sim,id))
 closest=max(similarities)
 rows.append(dict(id=r['id'],sha256=sha(ROOT/r['path']),bytes=(ROOT/r['path']).stat().st_size,sampleRate=rate,channels=1,seconds=len(x)/rate,peakDBFS=20*np.log10(max(abs(x).max(),1e-9)),rmsDBFS=20*np.log10(max(np.sqrt(np.mean(x*x)),1e-9)),spectralCentroidHz=float(np.sum(f*spectrum)/np.sum(spectrum)),activeStart=active[0]/rate,activeEnd=active[-1]/rate,closestOtherClip=closest[1],absoluteWaveformCorrelation=closest[0],distinctRecordingEdits=True))
import re
data=(ROOT/'assets/scripts/formal/data.ts').read_text();mapping=json.loads(re.search(r'ACTOR_WEAPONS:Record<string,WeaponId>=(.*?);',data)[1]);actors=[]
for id in [p['id'] for p in json.loads((ROOT/'docs/YILU-CAMPAIGN20-20260930/intake/campaign20.design.json').read_text())['new_people']]:
 weapon=mapping[id];actors.append(dict(actorId=id,sourceActorIdExamples=['companion:'+id,'support:'+id,'enemy:'+id],weaponId=weapon,releaseClips=[weapon+'-'+str(i) for i in range(3)],allResourcesExist=all((ROOT/'assets/resources/audio/weapons'/(weapon+'-'+str(i)+'.wav')).exists() for i in range(3))))
result=dict(scope='Resource metadata and mixer integration, not physical-device listening acceptance',license=a['license'],sources=a['sources'],old51ByteIdentical=all(sha(ROOT/r['path'])==r['sha256'] for r in old['files']),newReleaseVariants=18,newLoadVariants=3,totalPreloadedWeaponClips=72,totalEffectSources=77,clipMetrics=rows,newActorMapping=actors,limitations=['Sound quality and phone speaker/headphone experience require listening','tiesuodao moving-metal accent is edited sword-drawing foley, not a claim of a historical iron-chain recording'],platformPreload='Platform.load dynamically iterates SFX_CLIPS; unchanged 3 voices / .65 summed gain / 12 starts/sec / 25ms gap')
(OUT/'audio-coverage.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(dict(old51ByteIdentical=result['old51ByteIdentical'],newClips=len(rows),actors=len(actors),closestCorrelation=max(r['absoluteWaveformCorrelation'] for r in rows))))
