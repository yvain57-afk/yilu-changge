#!/usr/bin/env python3
"""Additional licensed recorded gestures; never writes baseline assets."""
from pathlib import Path
import numpy as np,subprocess,json,hashlib,uuid,wave
ROOT=Path(__file__).resolve().parents[2]; SRC=ROOT/'art-source/weapon-sfx-20260930';OUT=ROOT/'assets/resources/audio/weapons';DEST=ROOT/'art-source/campaign20-audio';DEST.mkdir(parents=True,exist_ok=True)
RATE=44100;cache={};rows=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((SRC/'asset-manifest.json').read_text())['files'];before={r['path']:sha(ROOT/r['path']) for r in baseline}
def raw(file):
 if file not in cache:cache[file]=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(SRC/file),'-ar',str(RATE),'-ac','1','-f','f32le','-']),dtype=np.float32).copy()
 return cache[file]
def take(file,v,duration):
 a=raw(file);hop=441;env=np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0,len(a),hop)]);peaks=[]
 for ix in np.argsort(env)[::-1]:
  if all(abs(ix-x)>max(duration,.4)*100 for x in peaks):peaks.append(int(ix))
  if len(peaks)==3:break
 peaks.sort();start=max(0,peaks[v%len(peaks)]/100-.025);a=a[round(start*RATE):round((start+duration)*RATE)].copy()
 return a,dict(file=file,start=round(start,4),duration=duration,sha256=sha(SRC/file))
def shape(a,low,high):
 a=a-a.mean();f=np.fft.rfftfreq(len(a),1/RATE);sp=np.fft.rfft(a);sp*=1/(1+(f/low)**6)*np.minimum(1,(f/high)**2);a=np.fft.irfft(sp,n=len(a));n=min(265,len(a)//4);a[:n]*=np.linspace(0,1,n);a[-n:]*=np.linspace(1,0,n);return a
# Delays are within one gesture, not fictional extra game hits. Double blades are two real release events.
recipes={
 'duanji':(.16,8500,420,[('Dagger Swing',.16,0,1),('Seax Swing',.12,.015,.28)]),
 'tiesuodao':(.32,6200,230,[('Sabre Swing',.30,0,1),('Sabre Draw Fast',.11,.015,.35),('Sabre Draw Slow',.10,.075,.2)]),
 'goulianqiang':(.26,7600,280,[('Spear Swing',.24,0,1),('Dagger Draw Fast',.10,.06,.26)]),
 'dundao':(.22,4000,170,[('Seax Swing',.22,0,1),('Dagger Swing',.14,.02,.23)]),
 'yanlinggong':(.37,4700,90,[('English Longbow Shoot',.28,0,1),('Scythian Recurve Heavy Arrow Pass',.20,.14,.32),('Arrow Fletching',.10,.26,.12)]),
 'jiguannu':(.32,5400,140,[('Crossbow Set Nut Against Sear',.08,0,.35),('Crossbow Shoot',.24,.025,1),('Crossbow Bolt Pass',.18,.13,.3)]),
 'jiguannu-load':(.22,4300,180,[('Crossbow Place Bolt',.14,0,.6),('Crossbow Lever Trigger',.10,.11,.45)])}
for group,(dur,low,high,layers) in recipes.items():
 for v in range(3):
  a=np.zeros(round(dur*RATE));src=[]
  for name,length,offset,gain in layers:
   b,meta=take('raw/'+name+'.wav',v,length);b=shape(b,low,high);at=round(offset*RATE);n=min(len(a)-at,len(b));a[at:at+n]+=b[:n]*gain;meta.update(delay=offset,gain=gain);src.append(meta)
  a=shape(a,low,high);rms=np.sqrt(np.mean(a*a));a*=min(10**(-21/20)/max(rms,1e-8),10**(-3/20)/max(abs(a).max(),1e-8));name=group+'-'+str(v);p=OUT/(name+'.wav');pcm=(np.clip(a,-1,1)*32767).astype('<i2')
  with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
  Path(str(p)+'.meta').write_text(json.dumps({'ver':'1.0.0','importer':'audio-clip','imported':True,'uuid':str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu-campaign20-sfx:'+name)),'files':['.json','.wav'],'subMetas':{},'userData':{'downloadMode':0}},indent=2))
  rows.append(dict(id=name,path=str(p.relative_to(ROOT)),sha256=sha(p),bytes=p.stat().st_size,seconds=len(a)/RATE,peak_dBFS=float(20*np.log10(max(abs(a).max(),1e-10))),rms_dBFS=float(20*np.log10(max(np.sqrt(np.mean(a*a)),1e-10))),sources=src,edit=dict(lowpass=low,highpass=high,fade_ms=6),listen_status='human listening pending'))
assert before=={r['path']:sha(ROOT/r['path']) for r in baseline},'Baseline files changed'
manifest=dict(task='YILU-CAMPAIGN20-20260930',license='CC0 1.0',sources=json.loads((SRC/'asset-manifest.json').read_text())['sources'][:1],process='Recorded gestures only; separate transient selections, layered, filtered, short fades; never copy/rename old clips. Chain-like moving-metal accent uses sword drawing foley, not falsely described as an authentic chain recording.',files=rows,baseline_preserved_sha256=before,total_bytes=sum(r['bytes'] for r in rows))
(DEST/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
# Audition 6 weapons x 3 gestures, then mechanical loading separately; each gap is intentionally silent.
combined=[];timeline=[];t=0
for r in rows:
 p=ROOT/r['path'];w=wave.open(str(p),'rb');a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2');w.close();timeline.append(dict(id=r['id'],start=round(t,3),end=round(t+len(a)/RATE,3)));combined.extend([a,np.zeros(round(.38*RATE),dtype='<i2')]);t+=(len(a)+round(.38*RATE))/RATE
out=ROOT/'deliverables/YILU-CAMPAIGN20-20260930/audio';out.mkdir(parents=True,exist_ok=True)
with wave.open(str(out/'new-weapons-audition.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(np.concatenate(combined).tobytes())
(out/'audition-timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2));print(json.dumps(dict(clips=len(rows),bytes=manifest['total_bytes'],baseline_preserved=len(before),audition_seconds=t)))
