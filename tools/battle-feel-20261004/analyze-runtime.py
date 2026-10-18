from pathlib import Path
import json,sys,collections,hashlib
record=Path(sys.argv[1]);data=json.loads(record.read_text());rows=data['rows'];last={};deaths={};observed_hits=[];ledger={};poses=collections.defaultdict(collections.Counter);frames=collections.defaultdict(collections.Counter);corpses=collections.defaultdict(collections.Counter);hero_rects=[];kinds={};footdepth={};fps=[]
for row in rows:
 b=row.get('battle') or {};t=b.get('t',0)
 for e in b.get('entities',[]):
  i=str(e['id']);kinds[i]=e.get('kind','light');old=last.get(i)
  if old and old['hp']>e['hp'] and e['hp']>0:observed_hits.append({'enemyId':e['id'],'kind':e.get('kind'),'simulation_seconds':t,'wall_seconds':row['wallSeconds'],'hp_before_sample':old['hp'],'hp_after_sample':e['hp'],'scope':'observed hp drop between samples, possibly more than one hit'})
  if e.get('dead',0)>0:deaths.setdefault(i,{'enemyId':e['id'],'kind':e.get('kind'),'simulation_seconds':t,'wall_seconds':row['wallSeconds'],'deathAge':e['dead']})
  last[i]=e
 for life in b.get('enemyLifecycle',[]):
  i=str(life['enemyId']);kinds[i]=life['enemyKind']
  for ev in life.get('events',[]):
   if ev['stage']=='death':deaths.setdefault(i,{'enemyId':life['enemyId'],'kind':life['enemyKind'],'simulation_seconds':ev['t'],'source':ev.get('source'),'scope':'exact battle lifecycle death event'})
 for d in row.get('actorDraws',row.get('enemyDraws',[])):
  i=str(d.get('actorId'));kind=kinds.get(i)
  if kind:frames[kind][d['frameKey']]+=1
  if kind and last.get(i,{}).get('dead',0)>0:corpses[kind][d['frameKey']]+=1
  if d.get('role')=='hero_body':hero_rects.append({'t':t,'frameKey':d['frameKey'],'height':d['rect']['h'],'width':d['rect']['w'],'x':d['rect']['x'],'y':d['rect']['y']})
 for p in row.get('actorPoses') or []:
  if p.get('actorId')=='player':poses['player'][p.get('pose')]+=1
 for ev in row.get('ledger') or []:
  if ev.get('kind')=='damage':ledger[json.dumps(ev,sort_keys=True)]=ev
summary={'source_record':str(record.resolve()),'source_sha256':hashlib.sha256(record.read_bytes()).hexdigest(),'build':data.get('build'),'scene':data.get('scene'),'scope':data.get('scope'),'sampleCount':len(rows),'simulated_seconds':(rows[-1].get('battle') or {}).get('t'),'wall_seconds':rows[-1].get('wallSeconds'),'pageErrors':data.get('pageErrors'),'nonfatal_observations_by_kind':dict(collections.Counter(x['kind'] for x in observed_hits)),'lifecycle_deaths_by_kind':dict(collections.Counter(x['kind'] for x in deaths.values())),'observed_nonfatal_hp_drops':observed_hits,'deaths':list(deaths.values()),'unique_observed_damage_ledger_records':len(ledger),'sampled_frames_by_kind':dict(frames),'sampled_dead_frames_by_kind':dict(corpses),'hero_poses':dict(poses),'hero_frames':dict(collections.Counter(x['frameKey'] for x in hero_rects)),'hero_body_rect_height_range':[min((x['height'] for x in hero_rects),default=0),max((x['height'] for x in hero_rects),default=0)],'hero_body_rect_width_range':[min((x['width'] for x in hero_rects),default=0),max((x['width'] for x in hero_rects),default=0)],'evidence_boundary':'Observed frame/state diagnostics; distinct hp drops may combine several simultaneous hits. Counts do not prove artistic quality, native performance, sound or physical-device acceptance.'}
out=record.with_name(record.stem+'-analysis.json');out.write_text(json.dumps(summary,indent=2,ensure_ascii=False));print(json.dumps({k:summary[k] for k in ['source_record','sampleCount','simulated_seconds','wall_seconds','nonfatal_observations_by_kind','lifecycle_deaths_by_kind','hero_frames','hero_body_rect_height_range']},ensure_ascii=False))
