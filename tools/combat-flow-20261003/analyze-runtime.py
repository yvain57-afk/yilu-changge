from pathlib import Path
import json, math, csv, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'evidence/COMBAT-FLOW-20261003/before')
results=[]
for p in sorted(root.glob('*-record.json')):
 data=json.loads(p.read_text()); rows=data.get('rows',[])
 if not rows: continue
 tracks={}
 for r in rows:
  b=r['battle']
  if not b: continue
  for e in b['entities']:
   tracks.setdefault(e['id'],[]).append(dict(e,t=b['t'],dist=b['dist'],troops=b['troops'],wallSeconds=r['wallSeconds']))
 segments=[]; jumps=[]; summary=[]; pinned_windows=[]
 for id, samples in tracks.items():
  group=[]
  def finish():
   if len(group)<2:return
   a,b=group[0],group[-1]
   segments.append(dict(enemyId=id,kind=a['kind'],phase=a['phase'],start=a['t'],end=b['t'],seconds=b['t']-a['t'],worldDDelta=b['d']-a['d'],playerDistDelta=b['dist']-a['dist'],minZ=min(x['z'] for x in group),maxZ=max(x['z'] for x in group),startTroops=a['troops'],endTroops=b['troops'],samples=len(group)))
  for s in samples:
   if group and (s['phase']!=group[-1]['phase'] or s['t']-group[-1]['t']>.8 or bool(s.get('dead'))!=bool(group[-1].get('dead'))):finish();group=[]
   if group and s['z']-group[-1]['z']>1: jumps.append(dict(enemyId=id,kind=s['kind'],fromT=group[-1]['t'],toT=s['t'],fromZ=group[-1]['z'],toZ=s['z'],phase=s['phase']))
   group.append(s)
  finish()
  window=[]
  def flush_pin():
   if len(window)<2:return
   a,b=window[0],window[-1]
   if b['t']-a['t']>=.65 and b['dist']-a['dist']>1:pinned_windows.append(dict(enemyId=id,kind=a['kind'],phase=a['phase'],start=a['t'],end=b['t'],seconds=b['t']-a['t'],z=a['z'],worldDDelta=b['d']-a['d'],playerDistDelta=b['dist']-a['dist']))
  for a,b in zip(samples,samples[1:]):
   ok=a['phase']==b['phase']=='idle' and not a.get('dead') and not b.get('dead') and 0<b['t']-a['t']<.8 and abs(b['z']-a['z'])<.01
   if ok:
    if not window:window=[a]
    window.append(b)
   else:flush_pin();window=[]
  flush_pin()
  live=[x for x in samples if not x.get('dead')]
  summary.append(dict(enemyId=id,kind=samples[0]['kind'],lifetimeObserved=samples[-1]['t']-samples[0]['t'],nearPlayerSeconds=sum(max(0,b['t']-a['t']) for a,b in zip(live,live[1:]) if -.5<=a['z']<=6 and -.5<=b['z']<=6),phases=sorted(set(x['phase'] for x in live)),attackN=max(x.get('attackN') or 0 for x in live) if live else 0))
 pinned=[s for s in segments if s['phase']=='idle' and s['seconds']>=.65 and abs(s['worldDDelta']-s['playerDistDelta'])<.01 and s['maxZ']-s['minZ']<.01 and s['playerDistDelta']>1]
 pinned.sort(key=lambda s:s['seconds'],reverse=True)
 final=rows[-1]['battle'];lifecycle=final['enemyLifecycle']; releases={}
 for e in lifecycle:
  n=sum(x['stage']=='release' for x in e['events']);releases[e['enemyKind']]=releases.get(e['enemyKind'],0)+n
 result=dict(file=str(p),build=data['build'],mode=data['mode'],rows=len(rows),simulationSeconds=final['t'],finalTroops=final['troops'],damageSources=final['damageSources'],actualReleases=releases,entityCount=len(tracks),pinnedIdleCount=len(pinned_windows),pinnedIdleStrongest=sorted(pinned_windows,key=lambda s:s['seconds'],reverse=True)[:20],pinnedWindowsByKind={kind:sorted([s for s in pinned_windows if s['kind']==kind],key=lambda s:s['seconds'],reverse=True)[:5] for kind in sorted(set(s['kind'] for s in pinned_windows))},longNearPlayer=sorted(summary,key=lambda s:s['nearPlayerSeconds'],reverse=True)[:20],samePhaseForwardJumps=jumps,limitations='Pinned segments here are measured enemy d/world advance and player dist from actual runtime snapshots. They prove screen-relative pinning; they are not an on-device FPS/visual acceptance claim. Warn-phase locking excluded from main counter. A forward jump may cross a phase boundary not covered by this detector.')
 results.append(result)
 with (root/(p.stem+'-segments.csv')).open('w') as f:
  w=csv.DictWriter(f,fieldnames=list(segments[0]) if segments else []);w.writeheader();w.writerows(segments)
(root/'motion-analysis.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps([dict(mode=x['mode'],seconds=x['simulationSeconds'],pinned=x['pinnedIdleCount'],loss=x['damageSources'],top=x['pinnedIdleStrongest'][:3]) for x in results],ensure_ascii=False,indent=2))
