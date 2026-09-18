import math,wave,struct,random,subprocess
from pathlib import Path
random.seed(4)
Path("art-source/audio").mkdir(parents=True,exist_ok=True)
def wav(name,secs,fun):
 with wave.open('art-source/audio/'+name+'.wav','w') as w:
  w.setparams((1,2,22050,0,'NONE','not compressed'))
  w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,fun(i/22050)))*26000)) for i in range(int(secs*22050))))
 subprocess.run(['ffmpeg','-v','error','-y','-i','art-source/audio/'+name+'.wav','-codec:a','libmp3lame','-b:a','64k','assets/resources/audio/'+name+'.mp3'],check=True)
def pluck(t,f):return math.sin(2*math.pi*f*t)*math.exp(-t*6)+.18*math.sin(2*math.pi*2*f*t)*math.exp(-t*9)
notes=[261.63,329.63,392,440,392,329.63,293.66,261.63,196,261.63,329.63,392,329.63,293.66,261.63,196]
wav('music',16,lambda t:.12*pluck(t%1,notes[int(t)%16])+.035*math.sin(2*math.pi*130.815*t)*(.4+.6*math.sin(math.pi*(t%4)/4)**2))
wav('gather',.7,lambda t:.25*pluck(t,523.25)+(.22*pluck(t-.12,659.25) if t>.12 else 0)+(.18*pluck(t-.24,783.99) if t>.24 else 0))
wav('hit',.1,lambda t: .17*(random.random()*2-1)*math.exp(-t*38))
wav('break',.25,lambda t:.28*(random.random()*2-1)*math.exp(-t*14))
wav('hurt',.35,lambda t:.25*math.sin(2*math.pi*(170-160*t)*t)*math.exp(-t*8))
wav('warn',.4,lambda t:.15*math.sin(2*math.pi*440*t)*math.sin(math.pi*t/.4)**2)
print('6 original synthesized WAVs')
