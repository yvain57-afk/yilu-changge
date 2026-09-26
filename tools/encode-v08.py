from pathlib import Path
import json,subprocess
root=Path('evidence/v08');report=json.loads((root/'delivery.json').read_text());assert report['passed']
def encode(source,dest,extra=None):
    cmd=['ffmpeg','-y']+(extra or [])+['-i',str(source),'-r','30','-c:v','libx264','-preset','fast','-crf','23','-c:a','aac','-b:a','128k','-movflags','+faststart',str(dest)]
    with (root/(dest.stem+'-encode.log')).open('w') as log:subprocess.run(cmd,stdout=log,stderr=log,check=True)
encode(root/'three-levels-live-audio.webm',root/'three-levels-live-audio.mp4')
base=report['timeline'][0]['seconds'];clips=[]
for name,kind,level,lead,duration in [('01-gate-change','gate-converted',1,2,8),('02-durability-equipment','equipment',1,4,9),('03-chain-gates','chain-passing',2,3,9),('04-wide-squad-risk','wide-squad-negative',3,3,9),('05-large-enemy','large-combat',3,2,12)]:
    event=next(e for e in report['timeline'] if e['type']==kind and e['level']==level)
    start=max(0,event['seconds']-base-lead);out=root/(name+'.mp4')
    encode(root/'three-levels-live-audio.mp4',out,['-ss',str(start),'-t',str(duration)])
    clips.append({'file':out.name,'source':'three-levels-live-audio.mp4','start':start,'duration':duration,'level':level,'mechanism':kind,'speed':1})
encode(root/'isolated-edge-risk.webm',root/'isolated-edge-risk.mp4')
(root/'clips.json').write_text(json.dumps({'oneNaturalSource':True,'clips':clips,'isolatedFixture':'isolated-edge-risk.mp4'},indent=2))
probe=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate','-of','json',str(root/'three-levels-live-audio.mp4')]);(root/'video-probe.json').write_bytes(probe)
print(probe.decode())
