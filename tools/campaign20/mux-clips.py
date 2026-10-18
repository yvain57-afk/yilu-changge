#!/usr/bin/env python3
"""Package the three clips from the single continuous native run, preserving capture clocks."""
import pathlib,subprocess,json,hashlib,datetime
R=pathlib.Path(__file__).resolve().parents[2];E=R/'evidence/YILU-CAMPAIGN20-20260930';N=E/'native-campaign';D=R/'deliverables/YILU-CAMPAIGN20-20260930/media';D.mkdir(parents=True,exist_ok=True)
M=json.loads((E/'bridge-build-manifest.json').read_text());clips=json.loads((N/'clips.json').read_text());runs=json.loads((N/'results.json').read_text());out=[]
assert len(clips)==3 and {c['chapter'] for c in clips}=={2,12,20}
for c in clips:
 stem=pathlib.Path(c['stem']);video=pathlib.Path(str(stem)+'.mov');audio=pathlib.Path(str(stem)+'.caf')
 log=pathlib.Path(str(stem)+'-audio.log').read_text();audio_clock=float(log.split('START ')[1].split()[0]);offset=max(0,audio_clock-c['start']);p=D/(stem.name+'.mp4')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-itsoffset',str(offset),'-i',str(audio),'-map','0:v','-map','1:a','-vf','scale=600:-2','-c:v','libx264','-crf','20','-preset','fast','-c:a','aac','-b:a','192k','-t','40','-movflags','+faststart',str(p)],check=True)
 meta={'_bridge_media':True,'capture_type':'simulator','speed':'original','produced_at':datetime.datetime.fromtimestamp(c['start'],datetime.timezone.utc).isoformat(),'build':{k:M[k] for k in ['code_fingerprint','build_id','target','configuration','produced_at']},'scope':'Single continuous new-save campaign; DEBUG legal lateral input with reaction delay, not human touch','chapter':c['chapter'],'video_source':str(video.relative_to(R)),'audio_source':str(audio.relative_to(R)),'audio_origin':'CoreAudio process tap of actual CocosGame, not asset dubbing','audio_video_start_offset_seconds':offset,'sync_uncertainty_seconds':.06,'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 run=next(r for r in runs if r['chapter']==c['chapter']);assert run['build']['code_fingerprint']==M['code_fingerprint'];meta['run_id']=run['runId']
 p.with_suffix('.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2));out.append({'path':str(p.relative_to(R)),**meta});print(p,flush=True)
(E/'packaged-clips.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
