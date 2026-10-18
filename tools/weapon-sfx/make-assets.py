#!/usr/bin/env python3
"""Edit licensed recorded foley into short game samples; no synthesized primary layer."""
from pathlib import Path
import numpy as np,subprocess,json,hashlib,uuid,wave
ROOT=Path(__file__).resolve().parents[2];SRC=ROOT/'art-source/weapon-sfx-20260930';OUT=ROOT/'assets/resources/audio/weapons';OUT.mkdir(parents=True,exist_ok=True)
RATE=44100;cache={};rows=[]
def raw(file):
 if file not in cache:cache[file]=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(SRC/file),'-ar',str(RATE),'-ac','1','-f','f32le','-']),dtype=np.float32).copy()
 return cache[file]
def take(file,variant,duration,offset=.09):
 a=raw(file);hop=441;env=np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0,len(a),hop)])
 peaks=[]
 for ix in np.argsort(env)[::-1]:
  if all(abs(ix-x)>max(duration,.4)*100 for x in peaks):peaks.append(int(ix))
  if len(peaks)==3:break
 peaks.sort();peak=peaks[variant%len(peaks)]/100;start=max(0,peak-offset);clip=a[round(start*RATE):round((start+duration)*RATE)].copy()
 return clip,{'file':file,'start':round(start,4),'duration':duration,'sha256':hashlib.sha256((SRC/file).read_bytes()).hexdigest()}
def edit(a,low=9000,high=100):
 # Real recording only: band shaping, short fade, remove DC; no generated noise/tones.
 a=a-np.mean(a);f=np.fft.rfftfreq(len(a),1/RATE);spec=np.fft.rfft(a);spec*=1/(1+(f/low)**6);spec*=np.minimum(1,(f/high)**2);a=np.fft.irfft(spec,n=len(a));fade=min(round(.012*RATE),len(a)//4);a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade);return a
# Each variant is a separate captured gesture, with individual transient selection.
recipes={
 'spear':('Spear Swing',.24,6500,130), 'guandao':('Axe Swing',.42,4500,80),
 'shemao':('Scythian Recurve Heavy Arrow Pass',.19,7500,270),
 'huaji':('Sabre Swing',.34,6500,140), 'guding':('Seax Swing',.25,4700,95),
 'shuangji':('Axe Swing',.27,4000,160), 'yitian':('Katana Swing',.30,7300,170),
 'qinggang':('Dagger Swing',.18,7800,330), 'shuanggu':('Sabre Swing',.21,9000,450),
 'liannu':('Crossbow Shoot',.23,7000,150),
 'army-bow':('English Longbow Shoot',.26,6000,160),
 'army-fire':('Scythian Recurve Shoot',.32,5000,120),
 'army-repeater':('Crossbow Lever Trigger',.18,4800,200)}
def write(name,a,source,filters):
 # Match RMS at -21 dBFS; peak guard -3 dBFS. Audition further equalises gated loudness.
 rms=float(np.sqrt(np.mean(a*a)));gain=min(10**(-21/20)/max(rms,1e-8),10**(-3/20)/max(abs(a).max(),1e-8));a*=gain
 path=OUT/(name+'.wav');pcm=(np.clip(a,-1,1)*32767).astype('<i2')
 with wave.open(str(path),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
 meta={'ver':'1.0.0','importer':'audio-clip','imported':True,'uuid':str(uuid.uuid5(uuid.NAMESPACE_URL,'yilu-sfx:'+name)),'files':['.json','.wav'],'subMetas':{},'userData':{'downloadMode':0}};(Path(str(path)+'.meta')).write_text(json.dumps(meta,indent=2))
 rows.append({'id':name,'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'decoded_pcm16_bytes':len(pcm)*2,'decoded_float32_bytes':len(pcm)*4,'seconds':len(a)/RATE,'peak_dBFS':20*np.log10(max(abs(a).max(),1e-10)),'rms_dBFS':20*np.log10(max(float(np.sqrt(np.mean(a*a))),1e-10)),'sources':source,'edit':filters,'listen_status':'pending human listening; real recorded foley composite, not historical Chinese weapon recording'})
for group,(name,dur,low,high) in recipes.items():
 for v in range(3):
  a,info=take('raw/'+name+'.wav',v,dur);sources=[info]
  # Layer only mechanism/air, never contact into a release; simultaneous layers do not add hits.
  extra={'shuangji':('Spear Swing',.22,.40),'huaji':('Spear Swing',.24,.3),'shemao':('Spear Swing',.18,.35),'shuanggu':('Dagger Swing',.18,.25),'liannu':('Crossbow Lever Trigger',.18,.25),'army-fire':('Arrow Fletching',.28,.18)}.get(group)
  if extra:
   b,bi=take('raw/'+extra[0]+'.wav',v,extra[1]);sources.append(bi);b=edit(b,low,high);a=a.copy();n=min(len(a),len(b));a[:n]+=b[:n]*extra[2]
  a=edit(a,low,high);write(group+'-'+str(v),a,sources,{'lowpass':low,'highpass':high,'fade_ms':12,'layers':extra,'note':'fire uses quiet recorded fletching friction for light rustle tail; no fabricated combustion recording'})
for material,file in [('soft','impactSoft_medium'),('metal','impactMetal_light'),('wood','impactWood_medium'),('generic','impactGeneric_light')]:
 for v in range(3):
  fileid=f'kenney/Audio/{file}_{v:03}.ogg';a=raw(fileid)[:round(.24*RATE)];a=edit(a,5500 if material!='metal' else 7500,100);write('impact-'+material+'-'+str(v),a,[{'file':fileid,'sha256':hashlib.sha256((SRC/fileid).read_bytes()).hexdigest(),'start':0}],{'fade_ms':12,'duration_max':.24})
manifest={'task':'YILU-WEAPON-SFX-20260930','license':'CC0 1.0','sources':[{'author':'Still North Media: Ben Jaszczak and Brian Nelson, mirror MedicineStorm','url':'https://opengameart.org/content/medieval-sound-effects-weapon-textures','license':'CC0 1.0','use':'recorded weapon movement, bow and crossbow gestures'},{'author':'Kenney','url':'https://kenney.nl/assets/impact-sounds','license':'CC0 1.0','use':'material contact foley'}],'process':'tools/weapon-sfx/make-assets.py; select separate gestures, layer recorded air/mechanism, band shape, fade, RMS normalise and peak limit. No synthesized main sounds.','files':rows,'total_bytes':sum(x['bytes'] for x in rows),'pcm16_bytes':sum(x['decoded_pcm16_bytes'] for x in rows),'float32_bytes':sum(x['decoded_float32_bytes'] for x in rows)}
(SRC/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2,default=float))
print(len(rows),'clips',manifest['total_bytes'],'bytes')
