"""把生成的整张素材表切成帧：透明/洋红底 → 连通域 → 按行聚类 → 命名 → 输出紧凑 PNG 与 manifest-gen.js。
用法：python3 slice.py            （处理下方 SHEETS 中存在的源图）"""
import json, os, sys
import numpy as np
from PIL import Image
from PIL import ImageFilter
from collections import deque


def _label(mask, dil):
    # 1/4 分辨率上膨胀 + 四连通标记，再放大回原尺寸
    k = 4
    h, w = mask.shape
    small = Image.fromarray((mask * 255).astype(np.uint8)).resize((w // k, h // k), Image.BOX)
    sm = np.array(small) > 8
    r = max(1, dil // k)
    sm = np.array(Image.fromarray((sm * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0
    lab = np.zeros(sm.shape, np.int32); n = 0
    H, W = sm.shape
    for y0 in range(H):
        for x0 in range(W):
            if sm[y0, x0] and not lab[y0, x0]:
                n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n
                while q:
                    y, x = q.popleft()
                    for yy, xx in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
                        if 0 <= yy < H and 0 <= xx < W and sm[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n; q.append((yy, xx))
    big = np.kron(lab, np.ones((k, k), np.int32))
    full = np.zeros((h, w), np.int32); full[:big.shape[0], :big.shape[1]] = big
    return full, n


def _objects(lab, n):
    out = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        out.append((slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)) if len(ys) else None)
    return out

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '../../docs/BATTLE-PREVIEW-20260926/assets/gen')
A2 = os.path.join(HERE, '../battle-actions-20260927')
os.makedirs(OUT, exist_ok=True)

# 每张表：行 → 名称（从左到右）。foot=True 时锚点取底部躯干中心；center=True 时居中锚点。
SHEETS = {
    'hero-weapons': dict(rows=[['g_guandaoRun', 'g_guandaoWind', 'g_guandaoRel', 'g_guandaoRec'],
                               ['g_shemaoRun', 'g_shemaoWind', 'g_shemaoRel', 'g_shemaoRec'],
                               ['g_huajiRun', 'g_huajiWind', 'g_huajiRel', 'g_huajiRec']], foot=True, dil=10),
    'enemy-lubu': dict(rows=[['g_lubuIdle', 'g_lubuWind', 'g_lubuStrike', 'g_lubuRec', 'g_lubuDown'],
                             [None, 'g_warBanner', 'g_warDrum']], foot=True, dil=8,
                       # 手工切线（姿势相互粘连）：每行 y 范围 + 各分界折线 [(y 上限, x), ...]
                       manual=[(0, 600, [[(9999, 340)], [(350, 640), (440, 528), (9999, 610)], [(9999, 975)], [(9999, 1255)]]),
                               (592, 1024, [[(9999, 430)], [(9999, 795)]])], thin=5,
                       # 蓄力帧后腿：源图 alpha 断成碎片（腿下无颜色），闭运算补洞并按邻域取色，仅限腿部多边形
                       heal=[((470, 380, 640, 600), [(518, 452), (540, 446), (556, 450), (568, 470), (585, 525), (598, 550),
                                                     (540, 552), (545, 510), (530, 484), (518, 474)], 13)]),
    'gate-parts2': dict(rows=[['g_post', 'g_beam', 'g_pennant', 'g_arrow'],
                              ['g_bannerBlue', 'g_bannerRed', 'g_bannerPaper']], foot=False, dil=8),
    'wall-parts': dict(rows=[['g_stake0', 'g_stake1', 'g_stake2', 'g_rail'],
                             ['g_pier0', 'g_pier1', 'g_debris']], foot=True, dil=22),
    'crates2': dict(rows=[['g_grainCart', 'g_weaponCase', 'g_arrowCrate', 'g_treasureBox'],
                          ['g_grainCartOpen', 'g_weaponCaseOpen', 'g_arrowCrateOpen', 'g_treasureBoxOpen']], foot=True, dil=18),
    'weapon-icons': dict(rows=[['g_icon_spear', 'g_icon_guandao'], ['g_icon_shemao', 'g_icon_huaji']], foot=False, center=True, dil=14),
    # —— 2026-09-27 动作补表（源图在 ../battle-actions-20260927/，提示词同目录 prompts/）——
    # bh：每行躯干参考高（源像素，头顶到脚底，不含高举兵器）；预览按 bh 对齐体量，同一人物各帧不会忽大忽小
    'hero-run': dict(dir=A2, rows=[[f'g_run_{w}{i}' for i in range(4)] for w in ('spear', 'guandao', 'shemao', 'huaji')], foot=True, dil=10, bh='auto'),
    'hero-spear': dict(dir=A2, rows=[['g_spearWind', 'g_spearRel', 'g_spearRec', 'g_brandish_spear'],
                                     ['g_brandish_guandao', 'g_brandish_shemao', 'g_brandish_huaji']], foot=True, dil=10, bh='auto'),
    'troops': dict(dir=A2, rows=[['g_archerWalk0', 'g_archerWalk1', 'g_archerDraw', 'g_archerRel'],
                                 ['g_redWalk0', 'g_redWalk1', 'g_redHit', 'g_redFallen'],
                                 ['g_eliteWalk0', 'g_eliteWalk1', 'g_eliteHit', 'g_eliteFallen']], foot=True, dil=12, bh='auto', bhref=[0, 1],
                   manual=[(0, 336, [[(9999, 380)], [(9999, 750)], [(9999, 1110)]]),
                           (336, 658, [[(9999, 370)], [(9999, 730)], [(9999, 1120)]]),
                           (658, 1024, [[(9999, 370)], [(9999, 750)], [(9999, 1104)]])]),
    'companions': dict(dir=A2, rows=[['g_zhaoRun0', 'g_zhaoRun1', 'g_zhaoWind', 'g_zhaoThrust'],
                                     ['g_zhangRun0', 'g_zhangRun1', 'g_zhangWind', 'g_zhangThrust']], foot=True, dil=10, bh='auto'),
    'lubu2': dict(dir=A2, rows=[['g_lubuHit', 'g_lubuSpent', 'g_lubuYield'], ['g_flagIntact', 'g_flagTorn', 'g_flagWhite']], foot=True, dil=18, bh='auto', bhref=[1],
                  manual=[(0, 566, [[(9999, 636)], [(9999, 976)]]), (566, 1024, [[(9999, 600)], [(9999, 1090)]])], thin=5),
    'treasure-icons': dict(dir=A2, rows=[['g_tr_taiping', 'g_tr_mengde', 'g_tr_qingnang', 'g_tr_yuxi'],
                                         ['g_tr_qixing', 'g_tr_muniu', 'g_tr_chitu', 'g_tr_dilu']], foot=False, center=True, dil=14),
    'props2': dict(dir=A2, rows=[['g_gatePost0', 'g_gatePost1', 'g_tower', 'g_tent'], ['g_granary', 'g_rocks', 'g_juma', 'g_rack']], foot=True, dil=14),
}


def load_keyed(path):
    im = np.array(Image.open(path).convert('RGBA')).astype(np.int16)
    r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
    if (a < 250).mean() < .2:  # 不透明底：按洋红抠像
        mag = (r - g > 110) & (b - g > 110)
        near = (r - g > 60) & (b - g > 60) & ~mag
        a = np.where(mag, 0, 255)
        a = np.where(near, 110, a)
        # 去洋红溢色
        spill = np.minimum(r, b) - g
        fix = (a > 0) & (spill > 20)
        r = np.where(fix, r - spill // 2, r); b = np.where(fix, b - spill // 2, b)
    out = np.stack([r, g, b, a], -1).clip(0, 255).astype(np.uint8)
    return out


def slice_sheet(name, cfg):
    src = os.path.join(cfg.get('dir', HERE), name + '.png')
    if not os.path.exists(src):
        return None
    im = load_keyed(src)
    for box, poly, k in cfg.get('heal', []):
        im = heal(im, box, poly, k)
    a = im[..., 3]
    mask = a > 24
    if cfg.get('manual'):
        return pack(name, cfg, manual_crops(im, cfg))
    lab, n = _label(mask, cfg['dil'])
    objs = []
    for i, sl in enumerate(_objects(lab, n)):
        if sl is None: continue
        m = (lab[sl] == i + 1) & mask[sl]
        area = int(m.sum())
        if area < 2500:
            continue
        ys, xs = np.nonzero(m)
        y0, y1 = sl[0].start + ys.min(), sl[0].start + ys.max() + 1
        x0, x1 = sl[1].start + xs.min(), sl[1].start + xs.max() + 1
        objs.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, cy=(y0 + y1) / 2, cx=(x0 + x1) / 2, lab=i + 1, area=area))
    # 行聚类：按纵向中心排序，间隔 > 行高 1/3 则断行
    objs.sort(key=lambda o: o['cy'])
    rows, cur = [], []
    for o in objs:
        if cur and o['cy'] - np.mean([c['cy'] for c in cur]) > 150:
            rows.append(cur); cur = []
        cur.append(o)
    if cur: rows.append(cur)
    want = cfg['rows']
    # 行内件数不足：对最宽的件用最小代价竖向接缝切开（粘连姿势）
    for ri, row in enumerate(rows[:len(want)]):
        while len(row) < len(want[ri]):
            o = max(row, key=lambda q: q['x1'] - q['x0'])
            sub = (lab[o['y0']:o['y1'], o['x0']:o['x1']] == o['lab']) * a[o['y0']:o['y1'], o['x0']:o['x1']].astype(float)
            h, w = sub.shape; lo, hi = int(w * .3), int(w * .7)
            cost = sub[:, lo:hi] + 1.0
            acc = cost.copy(); back = np.zeros(acc.shape, np.int8)
            for y in range(1, h):
                prev = acc[y - 1]
                cand = np.stack([np.r_[np.inf, prev[:-1]], prev, np.r_[prev[1:], np.inf]])
                j = cand.argmin(0); acc[y] += cand[j, np.arange(len(prev))]; back[y] = j - 1
            x = int(acc[-1].argmin()); seam = np.zeros(h, int)
            for y in range(h - 1, -1, -1):
                seam[y] = x + lo; x += int(back[y, x])
            n += 1
            region = lab[o['y0']:o['y1'], o['x0']:o['x1']]
            cols = np.arange(w)[None, :] > seam[:, None]
            region[(region == o['lab']) & cols] = n
            row.remove(o)
            for L in (o['lab'], n):
                ys, xs = np.nonzero(region == L)
                row.append(dict(x0=o['x0'] + xs.min(), x1=o['x0'] + xs.max() + 1, y0=o['y0'] + ys.min(), y1=o['y0'] + ys.max() + 1,
                                cx=o['x0'] + (xs.min() + xs.max()) / 2, cy=o['y0'] + (ys.min() + ys.max()) / 2, lab=L, area=len(ys)))
    got = [len(r) for r in rows]
    if got != [len(r) for r in want]:
        print(f'!! {name}: 行结构 {got} ≠ 预期 {[len(r) for r in want]}', file=sys.stderr)
    frames, crops = {}, []
    for ri, row in enumerate(rows[:len(want)]):
        row.sort(key=lambda o: o['cx'])
        for ci, o in enumerate(row[:len(want[ri])]):
            key = want[ri][ci]
            sub = im[o['y0']:o['y1'], o['x0']:o['x1']].copy()
            keep = (lab[o['y0']:o['y1'], o['x0']:o['x1']] == o['lab'])
            sub[..., 3] = np.where(keep, sub[..., 3], 0)
            sub = despeckle(sub)
            h, w = sub.shape[:2]
            if cfg.get('center'):
                ax, ay = .5, .5
            elif cfg['foot']:
                band = sub[int(h * .86):, :, 3] > 60
                xs = np.nonzero(band.any(0))[0]
                # 躯干中心：底部带的质量中心（排除细长兵器尾端的影响：取列权重中位数）
                wcol = band.sum(0).astype(float)
                cum = np.cumsum(wcol); mid = np.searchsorted(cum, cum[-1] / 2) if cum[-1] else w // 2
                ax, ay = float(mid) / w, 0.0
            else:
                ax, ay = .5, 0.0
            crops.append((key, sub, ax, ay, ri, ci))
    return pack(name, cfg, crops)


def _box(c, r=3):
    p = np.pad(c, r, mode='edge'); cs = np.pad(p.cumsum(0).cumsum(1), ((1, 0), (1, 0))); k = 2 * r + 1
    return (cs[k:, k:] - cs[:-k, k:] - cs[k:, :-k] + cs[:-k, :-k]) / (k * k)


def heal(im, box, poly, k=11):
    # 在 poly 内对 alpha 做闭运算补洞；新增像素颜色由邻域加权扩散得到
    from PIL import ImageDraw
    x0, y0, x1, y1 = box; sub = im[y0:y1, x0:x1].astype(float); a = sub[..., 3] > 24
    m = Image.fromarray((a * 255).astype(np.uint8))
    closed = np.array(m.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))) > 0
    pm = Image.new('L', (x1 - x0, y1 - y0), 0); ImageDraw.Draw(pm).polygon([(px - x0, py - y0) for px, py in poly], fill=255)
    new = closed & ~a & (np.array(pm) > 0)
    rgb = sub[..., :3] * a[..., None]; w = a.astype(float)
    for _ in range(12):
        num = np.stack([_box(rgb[..., i] * w) for i in range(3)], -1); den = _box(w)
        upd = new & (den > 1e-3) & (w == 0)
        rgb[upd] = (num / np.maximum(den, 1e-6)[..., None])[upd]; w = np.where(upd, 1.0, w)
    sub[..., :3] = np.where(new[..., None], rgb, sub[..., :3]); sub[..., 3] = np.where(new, 255, sub[..., 3])
    im = im.copy(); im[y0:y1, x0:x1] = sub.clip(0, 255).astype(np.uint8)
    return im


def dethin(sub, k=5):
    # 去掉宽度 < k 像素的细碎残片（抠像残留的披风碎丝、杂刺）：开运算得实体，再稍放宽保留原边缘
    a = sub[..., 3]; m = Image.fromarray(((a > 24) * 255).astype(np.uint8))
    solid = np.array(m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k + 4))) > 0
    sub = sub.copy(); sub[..., 3] = np.where(solid, a, 0)
    return sub


def despeckle(sub, frac=.02, thin=0):
    sub = np.pad(sub, ((4, 4), (4, 4), (0, 0)))  # 防止 1/4 缩放时丢掉边缘像素（脚底）
    if thin: sub = dethin(sub, thin)
    a = sub[..., 3]; m = a > 24
    if m.sum() == 0: return sub
    lab, n = _label(m, 4)
    if n <= 1: return sub
    areas = np.bincount(lab[m].ravel(), minlength=n + 1)
    keep = areas >= max(400, areas.max() * frac)
    ok = keep[lab]
    sub = sub.copy(); sub[..., 3] = np.where(ok, a, 0)
    ys, xs = np.nonzero(sub[..., 3] > 8)
    return sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def anchor(sub, cfg):
    h, w = sub.shape[:2]
    if cfg.get('center'):
        return .5, .5
    if not cfg['foot']:
        return .5, 0.0
    band = sub[int(h * .86):, :, 3] > 60
    wcol = band.sum(0).astype(float); cum = np.cumsum(wcol)
    mid = np.searchsorted(cum, cum[-1] / 2) if cum[-1] else w // 2
    return float(mid) / w, 0.0


def manual_crops(im, cfg):
    a = im[..., 3]; H, W = a.shape; crops = []
    yy = np.arange(H)[:, None]
    for ri, ((ry0, ry1, cuts), names) in enumerate(zip(cfg['manual'], cfg['rows'])):
        def xcut(poly):  # 每行像素对应的分界 x
            xs = np.zeros(H)
            for y in range(H):
                for ylim, x in poly:
                    if y < ylim: xs[y] = x; break
            return xs[:, None]
        bounds = [np.zeros((H, 1))] + [xcut(p) for p in cuts] + [np.full((H, 1), W)]
        xx = np.arange(W)[None, :]
        for i, key in enumerate(names):
            if key is None: continue
            cell = (xx >= bounds[i]) & (xx < bounds[i + 1]) & (yy >= ry0) & (yy < ry1) & (a > 8)
            ys, xs = np.nonzero(cell)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            sub = im[y0:y1, x0:x1].copy(); sub[..., 3] = np.where(cell[y0:y1, x0:x1], sub[..., 3], 0)
            sub = despeckle(sub, thin=cfg.get('thin', 0))
            ax, ay = anchor(sub, cfg); crops.append((key, sub, ax, ay, ri, i))
    return crops


def body_h(sub):
    # 躯干高：自下而上，取「不透明宽度 ≥ 本帧中位行宽 45%」的最高一行——细长兵器杆、飘带不计入
    a = sub[..., 3] > 60; wr = a.sum(1); nz = wr[wr > 0]
    if not len(nz): return sub.shape[0]
    rows = np.nonzero(wr >= np.median(nz) * .45)[0]
    return int(sub.shape[0] - rows.min())


def pack(name, cfg, crops):
    frames = {}
    crops = [c if len(c) == 6 else (*c, 0, 0) for c in crops]
    bh = {}
    if cfg.get('bh') == 'auto':  # 每行取参考列（默认全部；倒地/受击帧不作参考）躯干高中位数
        ref = cfg.get('bhref')
        for ri in set(c[4] for c in crops):
            bh[ri] = int(np.median([body_h(c[1]) for c in crops if c[4] == ri and (ref is None or c[5] in ref)]))
    # 装箱：简单行式
    pad = 4; maxw = 2048
    x = y = pad; rowh = 0; places = []
    for key, sub, ax, ay, ri, _ in crops:
        h, w = sub.shape[:2]
        if x + w + pad > maxw:
            x = pad; y += rowh + pad; rowh = 0
        places.append((key, sub, ax, ay, x, y, ri)); x += w + pad; rowh = max(rowh, h)
    H = y + rowh + pad; Wd = min(maxw, max(p[4] + p[1].shape[1] for p in places) + pad)
    sheet = np.zeros((H, Wd, 4), np.uint8)
    skey = 'gen_' + name.replace('-', '_')
    for key, sub, ax, ay, px, py, ri in places:
        h, w = sub.shape[:2]
        sheet[py:py + h, px:px + w] = sub
        frames[key] = {'s': skey, 'r': [px, py, w, h], 'a': [round(ax, 4), round(ay, 4)]}
        if ri in bh: frames[key]['bh'] = bh[ri]
    Image.fromarray(sheet).save(os.path.join(OUT, name + '.png'), optimize=True)
    return skey, 'assets/gen/' + name + '.png', frames


def main():
    manifest_path = os.path.join(OUT, 'manifest-gen.js')
    man = {'sheets': {}, 'frames': {}}
    if os.path.exists(manifest_path):
        txt = open(manifest_path).read()
        man = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    only = sys.argv[1:] or list(SHEETS)
    for name in only:
        r = slice_sheet(name, SHEETS[name])
        if not r:
            print('-- 跳过（源图不存在）', name); continue
        skey, path, frames = r
        man['frames'] = {k: v for k, v in man['frames'].items() if v['s'] != skey}
        man['sheets'][skey] = path; man['frames'].update(frames)
        print('ok', name, len(frames), 'frames')
    open(manifest_path, 'w').write('window.GEN_MANIFEST=' + json.dumps(man, ensure_ascii=False) + ';\n')


if __name__ == '__main__':
    main()
