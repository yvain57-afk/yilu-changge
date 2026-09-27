"""视频抽帧总览：按给定秒数从 mp4 抽帧拼成一张图（核对视频与代码一致）。
用法：python3 tools/videosheet.py deliver/battle-preview.mp4 out.jpg 1,5,9,...   （FFMPEG 环境变量可指定 ffmpeg）"""
import os, sys, subprocess, tempfile
from PIL import Image, ImageDraw
src, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3].split(',')]
ff = os.environ.get('FFMPEG') or (os.path.expanduser('~/.local/bin/ffmpeg') if os.path.exists(os.path.expanduser('~/.local/bin/ffmpeg')) else 'ffmpeg')
tmp = tempfile.mkdtemp(); tiles = []
for i, t in enumerate(ts):
    f = os.path.join(tmp, f'{i}.jpg')
    subprocess.run([ff, '-y', '-loglevel', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-vf', 'scale=300:-2', f], check=True)
    tiles.append((t, Image.open(f).convert('RGB')))
cols = min(6, len(tiles)); rows = (len(tiles) + cols - 1) // cols; w, h = tiles[0][1].size
im = Image.new('RGB', (cols * w, rows * (h + 16)), (11, 17, 25)); d = ImageDraw.Draw(im)
for i, (t, tile) in enumerate(tiles):
    x, y = i % cols * w, i // cols * (h + 16); im.paste(tile, (x, y)); d.text((x + 4, y + h + 2), f'{t:.1f}s', fill=(230, 205, 147))
    os.remove(os.path.join(tmp, f'{i}.jpg'))
os.rmdir(tmp); im.save(out, quality=86); print(len(tiles), '→', out)
