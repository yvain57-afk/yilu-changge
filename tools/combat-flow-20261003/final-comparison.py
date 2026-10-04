from pathlib import Path
import json,hashlib,subprocess
base=Path('evidence/COMBAT-FLOW-20261003');out=[]
for tag in ['before','after']:
 for mode in ['stationary','lateral','normal']:
  data=json.loads((base/tag/f'{tag}-{mode}-record.json').read_text());tracks={}
  for row in data['rows']:
   for e in row['battle']['entities']:
    if not e.get('dead'):tracks.setdefault(e['id'],[]).append(dict(e,t=row['battle']['t'],dist=row['battle']['dist']))
  liveMax=[];waitPositive=[]
  for id,samples in tracks.items():
   if not samples:continue
   liveMax.append(dict(id=id,kind=samples[0]['kind'],observedAliveSeconds=samples[-1]['t']-samples[0]['t'],firstT=samples[0]['t'],lastT=samples[-1]['t']))
   for a,b in zip(samples,samples[1:]):
    if a['phase']==b['phase'] and a['phase'] in ['idle','warn'] and b['d']-a['d']>.001:waitPositive.append(dict(id=id,kind=a['kind'],phase=a['phase'],t0=a['t'],t1=b['t'],dDelta=b['d']-a['d'],distDelta=b['dist']-a['dist']))
  analysis=next(x for x in json.loads((base/tag/'motion-analysis.json').read_text()) if x['mode']==mode)
  last=data['rows'][-1];entry={k:analysis[k] for k in ['mode','simulationSeconds','finalTroops','damageSources','actualReleases','pinnedIdleCount']}
  entry.update(tag=tag,build=data['build'],finalScreen=last['screen'],maxObservedAlive=sorted(liveMax,key=lambda x:x['observedAliveSeconds'],reverse=True)[:8],aliveSecondsByKind={kind:max([x['observedAliveSeconds'] for x in liveMax if x['kind']==kind]) for kind in set(x['kind'] for x in liveMax)},waitForwardWorldPairs=len(waitPositive),waitForwardExamples=waitPositive[:8],maxNearTeamObserved=analysis['longNearPlayer'][0] if analysis['longNearPlayer'] else None,pageErrors=data['pageErrors'],renderErrors=list(set(x for row in data['rows'] for x in row['renderErrors'])),missingArt=list(set(x for row in data['rows'] for x in row['missingArt'])))
  out.append(entry)
comparison=base/'comparison-original-35s.mp4';clips=json.loads((base/'scene-clips.json').read_text())
manifest=dict(scope='Actual Cocos engine original clock and automatic input. Before old cd613, after434495. Fixed legal chapter17 loadout seed71. This data does not constitute all20 balance/human/iPhone/performance acceptance.',runs=out,clips=clips,comparison={'path':str(comparison.resolve()),'sha256':hashlib.sha256(comparison.read_bytes()).hexdigest(),'left':'before normal same loadout/seed, starting approximately scene5s','right':'after normal same loadout/seed, starting approximately scene5s','durationSeconds':34.92,'scope':'contiguous side-by-side original-speed segment. Original wall-clock matched, not frame/tick-exact rendering. Full source files retained.'},retry=json.loads((base/'after'/'after-retry-flow.json').read_text()))
(base/'runtime-comparison.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps([{k:x[k] for k in ['tag','mode','simulationSeconds','finalTroops','pinnedIdleCount','waitForwardWorldPairs','actualReleases','maxNearTeamObserved']} for x in out],ensure_ascii=False,indent=2))
