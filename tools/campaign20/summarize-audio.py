#!/usr/bin/env python3
"""Audit actual native audio captures, without accepting silent or stale tracks."""
import pathlib,json,hashlib,subprocess,re,collections,datetime
R=pathlib.Path(__file__).resolve().parents[2];E=R/'evidence/YILU-CAMPAIGN20-20260930';D=R/'deliverables/YILU-CAMPAIGN20-20260930/media'
read=lambda p:json.loads(p.read_text());M=read(E/'bridge-build-manifest.json');fp=M['code_fingerprint'];rows=[]
for mode in ['normal','dense']:
 cap=read(E/f'{mode}-capture.json');assert cap['code_fingerprint']==fp
 samples=read(E/f'{mode}-runtime-samples.json');events=read(E/f'{mode}-events.json');out=D/f'{mode}-native-system-audio.mp4'
 levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(out),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True).stderr
 (E/f'{mode}-encoded-audio-levels.log').write_text(levels)
 peak=float(re.search(r'max_volume: ([\d.-]+) dB',levels)[1]);assert peak>-80,'encoded track is silent'
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)],text=True));types=[s['codec_type'] for s in probe['streams']];assert 'audio' in types and 'video' in types
 releases=collections.Counter(e.get('weaponId') for e in events if e.get('phase')=='release')
 if not releases:
  releases=collections.Counter(e.get('weaponId') for e in events if e.get('kind')=='release')
 assert all(releases.get(k,0)>0 for k in ['duanji','tiesuodao','goulianqiang','dundao','yanlinggong','jiguannu']),str(events[:2])
 counters=samples[-1]['state']['audio']['weaponSfx']['counters'];assert counters['missing']==0 and counters['fallback']==0 and counters['peakVoices']<=3
 digest=hashlib.sha256(out.read_bytes()).hexdigest();assert digest==cap['sha256']
 row={'mode':mode,'code_fingerprint':fp,'event_count':len(events),'releases':dict(releases),'final_counters':counters,'stream_types':types,'duration':float(probe['format']['duration']),'peak_db':peak,'video_sha256':digest,'runtime_audio_origin':cap['audio_origin'],'sync_offset_seconds':cap['sync_offset_seconds']};rows.append(row)
 meta={'_bridge_media':True,'capture_type':'simulator','speed':'original','produced_at':datetime.datetime.fromtimestamp(cap['video_start_host'],datetime.timezone.utc).isoformat(),'build':{k:M[k] for k in ['code_fingerprint','build_id','target','configuration','produced_at']},'scope':cap['scope'],'audio_origin':cap['audio_origin'],'source_sha256':digest,'peak_db':peak}
 run_ids=sorted({e['runId'] for e in events});meta['run_ids']=run_ids;meta['run_id']=run_ids[0] if len(run_ids)==1 else None;row['run_ids']=run_ids
 out.with_suffix('.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
(E/'native-audio-summary.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False))
