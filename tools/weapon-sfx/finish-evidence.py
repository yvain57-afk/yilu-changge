from pathlib import Path
import json,hashlib,subprocess,numpy as np,difflib
R=Path(__file__).resolve().parents[2];E=R/'evidence/YILU-WEAPON-SFX-20260930';D=R/'deliverables/YILU-WEAPON-SFX-20260930';A=R/'art-source/weapon-sfx-20260930';result={}
for mode in ['normal','dense']:
 cap=json.loads((E/(mode+'-capture.json')).read_text());samples=json.loads((E/(mode+'-runtime-samples.json')).read_text());events=json.loads((E/(mode+'-events.json')).read_text());raw=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(E/(mode+'-raw.caf')),'-ar','48000','-ac','2','-f','f32le','-']),dtype=np.float32).reshape(-1,2);changes=[];last=None;pauses=[]
 for row in samples:
  s=row['state'];key=(s['screen'],s['battle']['weapon']);t=row['host_time']-cap['video_start_host']
  if key!=last:changes.append({'video_seconds':round(t,2),'screen':key[0],'weapon':key[1]});last=key
  if s['screen']=='pause' and t<40:pauses.append(row['host_time']-cap['audio_start_host'])
 window=raw[int((min(pauses)+.35)*48000):int((max(pauses)-.2)*48000)] if pauses else np.array([])
 final=samples[-1]['state'];val={'code_fingerprint':cap['code_fingerprint'],'build_id':cap['build_id'],'weapons':sorted({e['weaponId'] for e in events if e['source']=='hero' and e['weaponId']}),'materials':sorted({e['material'] for e in events if e['phase']=='impact'}),'arms':sorted({e['arms'] for e in events if e['arms']}),'counters':final['audio']['counters'],'pause_interior_peak':float(abs(window).max()) if window.size else None,'audio_peak_dBFS':float(20*np.log10(max(abs(raw).max(),1e-10))),'audio_rms_dBFS':float(20*np.log10(max(np.sqrt(np.mean(raw*raw)),1e-10))),'final_screen':final['screen'],'final_playing':final['audio']['playingEffects'],'final_pending':final['audio']['weaponSfx']['pending'],'transitions':changes,'render_errors':list({str(e) for row in samples for e in row['state'].get('renderErrors',[])})}
 result[mode]=val
(D/'native-listening-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False)[:3800])
# Exact task delta against protected dirty baseline, rather than against Git HEAD.
parts=[]
for path in ['assets/scripts/Platform.ts','assets/scripts/formal/battle.ts','assets/scripts/formal/FormalGame.ts']:
 before=(A/Path(path).name).read_text().splitlines(True);after=(R/path).read_text().splitlines(True);parts.extend(difflib.unified_diff(before,after,fromfile='dirty-baseline/'+path,tofile='current/'+path))
(E/'task-only.patch').write_text(''.join(parts));(D/'asset-manifest.json').write_bytes((A/'asset-manifest.json').read_bytes())
# Preserve all pre-existing reported visual findings verbatim; no visual patch.
request=(D/'REQUEST.md').read_text();(D/'VISUAL-BACKLOG.md').write_text('# 视觉问题登记，本轮未修改\n\n'+request[request.index('## 本次视觉核查记录'):])
