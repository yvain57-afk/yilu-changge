"""Original shared-theme score. Deterministic MIDI -> sampled instruments -> loop masters.
No reference melody, recording or third-party MIDI is used.
"""
from pathlib import Path
import math,struct,json,subprocess,hashlib
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'art-source/music-shanhe-20261004'; OUT=ROOT/'assets/resources/audio/shanhe'
OUT.mkdir(parents=True,exist_ok=True)
PPQ=480; RATE=44100
# D-minor/pentatonic family. One original eight-bar phrase, two arrangements.
THEME=[[(74,1),(69,.5),(72,.5),(74,2)],[(77,1.5),(76,.5),(74,1),(72,1)],
 [(69,1),(72,.5),(74,.5),(76,1),(72,1)],[(67,1.5),(69,.5),(72,2)],
 [(74,.75),(77,.75),(79,.5),(77,1),(74,1)],[(72,1),(69,1),(67,1),(65,1)],
 [(69,1.5),(72,.5),(74,1),(76,1)],[(72,1),(69,1),(74,1.5),(None,.5)]]
CHORDS=[[50,57,62,65,69],[46,53,58,62,65],[53,60,65,69,72],[48,55,60,64,67],
 [50,57,62,65,69],[46,53,58,62,65],[48,55,60,64,67],[45,52,57,60,64]]
def vlq(n):
 b=[n&127];n>>=7
 while n:b.insert(0,(n&127)|128);n>>=7
 return bytes(b)
def write_midi(path,events,bpm,end):
 tempo=int(60000000/bpm);events.append((0,bytes([255,81,3])+tempo.to_bytes(3,'big')))
 events.append((int(end*PPQ),b'\xff\x2f\x00'));events.sort(key=lambda x:x[0])
 data=b'';prev=0
 for tick,msg in events:data+=vlq(tick-prev)+msg;prev=tick
 path.write_bytes(b'MThd'+struct.pack('>IHHH',6,0,1,PPQ)+b'MTrk'+struct.pack('>I',len(data))+data)
def compose(mode):
 battle=mode=='battle';bpm=100 if battle else 75;bars=40 if battle else 32;beats=bars*4;events=[]
 def msg(beat,*v):events.append((round(beat*PPQ),bytes(v)))
 def cc(ch,k,v):msg(0,176+ch,k,v)
 def note(ch,key,t,d,v):
  if key is None:return
  msg(t,144+ch,key,max(1,min(110,round(v))));msg(t+d,128+ch,key,0)
 # Real sampled patches: flute, strings, koto, cello, horn, pizzicato, warm pad, taiko.
 programs=[73,48,107,42,60,45,89,116]
 for ch,prog in enumerate(programs):
  msg(0,192+ch,prog);cc(ch,7,[86,69,77,72,68,72,34,93][ch]);cc(ch,10,[76,47,30,57,83,95,64,48][ch]);cc(ch,91,[72,76,56,48,58,40,82,40][ch]);cc(ch,93,10)
 cc(9,7,72);cc(9,91,40)
 for cycle in range(3):
  for bar in range(bars):
   t=cycle*beats+bar*4;chord=CHORDS[bar%8];section=bar//8
   energy=([.70,.85,1,.80,.92] if battle else [.68,.76,.62,.8])[section]
   # The tonic / open fifth anchors, with inner voices avoiding the melody register.
   for k in chord[1:4]:note(1,k,t+.03,3.94,50*energy if battle else 44*energy)
   note(3,chord[0]-12,t,3.9,67*energy if battle else 49*energy)
   if not battle:
    for k in [chord[1],chord[3]]:note(6,k,t+.1,3.8,35)
   # Flowing plucked figure; sparse calm version, continuous battle movement.
   pattern=[1,2,3,2,4,3,2,1]
   for i,ix in enumerate(pattern):
    if not battle and section==2 and i%2:continue
    note(2,chord[ix]+12,t+i*.5+(i%2)*.013,.62,(43 if battle else 35)*energy+(i%3)*3)
   # Theme enters straight away. A breathing phrase alternates flute and horn in battle.
   phrase=THEME[bar%8];at=t+.04
   lead=4 if battle and section in (1,4) else 0
   for j,(k,d) in enumerate(phrase):
    pitch=None if k is None else k-(12 if lead==4 else 0)
    note(lead,pitch,at,d*.91,(77 if battle else 66)*energy+(j%2)*3);at+=d
   if battle:
    # Short string pulses leave the 1–4 kHz weapon-transient band relatively open.
    for i in range(8):note(5,chord[1]+(12 if i%4==2 else 0),t+i*.5,.26,55*energy+(9 if i%2==0 else 0))
    for beat,vel in [(0,84),(1.5,50),(2,72),(3.5,54)]:
     note(7,48 if beat in (0,2) else 55,t+beat,.38,vel*energy)
    for beat in [0,2]:note(9,36,t+beat,.22,65*energy)
    if bar%4==3:
     for i in range(4):note(7,55+i%2*3,t+3+i*.25,.2,46+i*7)
    if bar%8==0:note(9,49,t,.8,36)
   elif bar%4==0:
    note(7,43,t,.8,33);note(9,49,t,.8,18)
  # At cycle transitions the next first bar starts immediately, retaining reverb tails.
 midi=SRC/(mode+'.mid');write_midi(midi,events,bpm,beats*3+8)
 raw=SRC/(mode+'-render.wav')
 subprocess.run(['fluidsynth','-ni','-r',str(RATE),'-g','.55','-R','1','-C','0','-o','synth.reverb.room-size=0.78','-o','synth.reverb.damp=0.55','-o','synth.reverb.width=60','-o','synth.reverb.level=0.24','-F',str(raw),str(SRC/'GeneralUser-GS.sf2'),str(midi)],check=True,stdout=subprocess.DEVNULL)
 audio,sr=sf.read(raw,dtype='float32',always_2d=True);length=round(beats*60/bpm*sr);loop=audio[length:2*length].copy()
 # Sub-millisecond correction only at the boundary, below one waveform period.
 edge=48;delta=loop[0]-loop[-1];loop[-edge:]+=np.linspace(0,1,edge)[:,None]*delta
 peak=float(abs(loop).max());rms=float(np.sqrt(np.mean(loop**2)));target=10**((-23 if not battle else -20)/20)
 gain=min(target/max(rms,1e-8),.77/max(peak,1e-8));loop*=gain
 master=SRC/(mode+'-loop.wav');sf.write(master,loop,sr,subtype='PCM_16')
 # PCM avoids encoder padding at the Cocos loop boundary; no SoundFont ships in the game.
 import shutil
 shutil.copy2(master,OUT/(mode+'.wav'))
 preview=ROOT/'deliverables/MUSIC-SHANHE-20261004'/(mode+'.mp3')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(master),'-af','afade=t=in:d=0.8,afade=t=out:st='+str(length/sr-1.5)+':d=1.5','-codec:a','libmp3lame','-b:a','192k',str(preview)],check=True)
 return {'mode':mode,'bpm':bpm,'bars':bars,'seconds':length/sr,'frames':length,'channels':2,'sample_rate':sr,'peak_dbfs':20*math.log10(float(abs(loop).max())),'rms_dbfs':20*math.log10(float(np.sqrt(np.mean(loop**2)))),'loop_boundary_max_delta':float(abs(loop[0]-loop[-1]).max()),'sha256':hashlib.sha256(master.read_bytes()).hexdigest()}
if __name__=='__main__':
 records=[compose(x) for x in ['menu','battle']]
 manifest={'title':'山河长歌','tracks':records,'theme':THEME,'soundfont_sha256':hashlib.sha256((SRC/'GeneralUser-GS.sf2').read_bytes()).hexdigest(),'method':'original MIDI composition, sampled instruments, no reference audio or melody imported','license':'GeneralUser-LICENSE.txt'}
 (SRC/'score.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps(records,indent=2))
