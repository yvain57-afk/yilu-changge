"""素材帧总览：按前缀列出 assets/gen 中的切片帧，三种底色各一行，红线标躯干参考高 bh 与脚底锚点。
用法：python3 tools/contact.py g_lubu,g_flag out.jpg"""
import json, sys, os
from PIL import Image, ImageDraw
G = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
t = open(os.path.join(G, 'assets/gen/manifest-gen.js')).read(); man = json.loads(t[t.index('{'):t.rindex('}') + 1])
sheets = {k: Image.open(os.path.join(G, v)).convert('RGBA') for k, v in man['sheets'].items()}
pref = sys.argv[1].split(','); out = sys.argv[2]
keys = [k for k in man['frames'] if any(k.startswith(p) for p in pref)]
bgs = [(236, 226, 204), (20, 30, 44), (92, 110, 62)]
cell = 150; im = Image.new('RGB', (cell * len(keys), cell * 3 + 14), (0, 0, 0)); d = ImageDraw.Draw(im)
for i, k in enumerate(keys):
    f = man['frames'][k]; x, y, w, h = f['r']; spr = sheets[f['s']].crop((x, y, x + w, y + h))
    sc = min((cell - 16) / w, (cell - 16) / h); spr2 = spr.resize((max(1, int(w * sc)), max(1, int(h * sc))), Image.LANCZOS)
    for j, bg in enumerate(bgs):
        tile = Image.new('RGBA', (cell, cell), bg + (255,)); ox = (cell - spr2.width) // 2; oy = cell - 8 - spr2.height
        tile.alpha_composite(spr2, (ox, oy))
        if 'bh' in f and j == 0:
            dd = ImageDraw.Draw(tile); yy = cell - 8 - int(f['bh'] * sc); dd.line([(0, yy), (cell, yy)], fill=(255, 0, 0), width=1)
            ax = ox + int(f['a'][0] * spr2.width); dd.line([(ax, cell - 12), (ax, cell - 4)], fill=(255, 0, 0), width=2)
        im.paste(tile.convert('RGB'), (i * cell, j * cell))
    d.text((i * cell + 2, cell * 3), k[:22], fill=(255, 255, 255))
im.save(out, quality=88)
print(len(keys), '→', out)
