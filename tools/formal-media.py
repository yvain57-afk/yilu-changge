"""Create audit contact sheets from actual native captures; does not alter gameplay pixels."""
from pathlib import Path
import json,subprocess
from PIL import Image,ImageDraw,ImageFont
r=Path('evidence/FORMAL-20260927');o=r/'video-frames';o.mkdir(exist_ok=True);x=json.loads((r/'natural-ten-result.json').read_text());font=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',18)
board=Image.new('RGB',(1000,924),'#101d2b');draw=ImageDraw.Draw(board)
for i in range(10):
 at=next(v['at'] for v in x['timeline'] if v['event']=='battle-start' and v.get('chapter')==i+1)+12
 p=o/f'chapter-{i+1}.jpg';subprocess.run(['ffmpeg','-loglevel','error','-ss',str(at),'-i',str(r/'natural-ten.mp4'),'-frames:v','1','-y',str(p)],check=True)
 im=Image.open(p).convert('RGB');im.thumbnail((194,420));xx=(i%5)*200+3;yy=(i//5)*462;board.paste(im,(xx,yy+32));draw.text((xx+5,yy+7),f'第{i+1}关 · {at:.1f}s',font=font,fill='#e6cd93')
board.save(r/'video-ten-contact.jpg',quality=90)
for name in ['normal','dense','general','guandao']:
 ims=[Image.open(r/f'comparison/{name}-{v}.png').convert('RGB') for v in ['preview','cocos']];b=Image.new('RGB',(800,914),'#101d2b');d=ImageDraw.Draw(b)
 for i,im in enumerate(ims):
  im.thumbnail((390,844));b.paste(im,(i*400+5,50));d.text((i*400+12,14),'交接预览' if i==0 else '实际 Cocos',font=font,fill='#e6cd93')
 b.save(r/f'comparison/{name}-pair.jpg',quality=92)
