from pathlib import Path
import subprocess,json,numpy as np,wave,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'deliverables/YILU-WEAPON-SFX-20260930';tmp=ROOT/'art-source/weapon-sfx-20260930/audition';tmp.mkdir(exist_ok=True)
ids=['spear','guandao','shemao','huaji','guding','shuangji','yitian','qinggang','shuanggu','liannu'];names=['长枪','偃月刀','蛇矛','方天画戟','古锭刀','双铁戟','倚天剑','青釭剑','双股剑','诸葛连弩'];allpcm=[];rows=[]
for ix,(id,label) in enumerate(zip(ids,names)):
 variants=[]
 for v in range(3):
  src=ROOT/f'assets/resources/audio/weapons/{id}-{v}.wav';prefix='apad=whole_dur=1,atrim=duration=1,'
  result=subprocess.run(['ffmpeg','-hide_banner','-i',str(src),'-af',prefix+'loudnorm=I=-34:TP=-3:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True)
  data=json.loads(result.stderr[result.stderr.rfind('{'):]);gain=min(-34-float(data['input_i']),-3-float(data['input_tp']));flt=prefix+f"volume={gain}dB"
  target=tmp/f'{id}-{v}.wav';r=subprocess.run(['ffmpeg','-v','info','-y','-i',str(src),'-af',flt,'-ar','44100','-ac','1',str(target)],capture_output=True,text=True,check=True)
  measure=subprocess.run(['ffmpeg','-hide_banner','-i',str(target),'-af','loudnorm=I=-34:TP=-3:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True);measured=json.loads(measure.stderr[measure.stderr.rfind('{'):]);measured['audition_gain_dB']=gain;
  with wave.open(str(target),'rb') as w:pcm=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').copy()
  allpcm.append(pcm);variants.append({'source':str(src.relative_to(ROOT)),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'audition_start':ix*5+v,'loudness':measured})
 allpcm.append(np.zeros(88200,dtype='<i2'));rows.append({'weapon_id':id,'label':label,'start_seconds':ix*5,'end_seconds':ix*5+3,'variants':variants})
with wave.open(str(OUT/'resource-audition.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(44100);w.writeframes(np.concatenate(allpcm).tobytes())
(OUT/'audition-timeline.json').write_text(json.dumps({'type':'final-resource comparison; not gameplay recording','normalisation':'EBU R128 measurement + fixed gain to -34 LUFS, peak guard -3 dBTP; padding to 1 s; audition gain only','rows':rows},ensure_ascii=False,indent=2));print('50 second resource audition ready')
