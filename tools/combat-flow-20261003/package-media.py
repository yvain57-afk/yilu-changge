from pathlib import Path
import json, subprocess,hashlib,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'evidence/COMBAT-FLOW-20261003/before');out=root/'media';out.mkdir(exist_ok=True)
manifest=[]
for p in sorted(root.glob('*-record.json')):
 data=json.loads(p.read_text());video=data.get('video')
 if not video or not Path(video).exists():continue
 target=out/(p.stem.replace('-record','')+'.mp4')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',video,'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],check=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',str(target)]))
 item=dict(path=str(target.resolve()),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),sourceVideo=video,sourceSha256=hashlib.sha256(Path(video).read_bytes()).hexdigest(),build=data['build'],scene=data['scene'],mode=data['mode'],speed='original',audio='silent Playwright capture',scope=data['scope'],probe=probe)
 manifest.append(item)
(root/'media-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps([{'path':x['path'],'duration':x['probe']['format']['duration']} for x in manifest],ensure_ascii=False))
