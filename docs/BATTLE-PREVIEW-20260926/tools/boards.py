"""把 shots.mjs 的截图拼成交付图：python3 tools/boards.py [WORK 目录]
输出到 deliver/：still-3states.jpg、size-matrix.jpg、weapons-4x4.jpg、feedback-march.jpg、feedback-boss.jpg、battle-*@2x.png"""
import os, sys, shutil, tempfile
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
DELIVER = os.path.join(HERE, '..', 'deliver')
WORK = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('WORK', os.path.join(tempfile.gettempdir(), 'yilu-battle-preview-work'))
FONT = '/System/Library/Fonts/STHeiti Medium.ttc'
F = lambda s: ImageFont.truetype(FONT, s)
BG = (11, 17, 25); GOLD = (230, 205, 147); MID = (196, 190, 176)
W_ = lambda n: os.path.join(WORK, n)
D_ = lambda n: os.path.join(DELIVER, n)


def board(cells, cols, labels, out, th=900, pad=24, head=56, title=None, note=None):
    ims = [Image.open(c).convert('RGB') if isinstance(c, str) else c for c in cells]
    ims = [im.resize((round(im.width * th / im.height), th), Image.LANCZOS) for im in ims]
    rows = (len(ims) + cols - 1) // cols
    cw = max(i.width for i in ims)
    top = (70 if title else 0) + (40 if note else 0)
    W = cols * cw + (cols + 1) * pad; H = top + rows * (th + head) + (rows + 1) * pad
    B = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(B)
    if title: d.text((pad, 20), title, font=F(32), fill=GOLD)
    if note: d.text((pad, 70), note, font=F(22), fill=MID)
    for k, (im, lb) in enumerate(zip(ims, labels)):
        r, c = divmod(k, cols); x = pad + c * (cw + pad); y = top + pad + r * (th + head + pad)
        d.text((x, y + 8), lb, font=F(26), fill=GOLD); B.paste(im, (x, y + head))
    B.save(out, quality=88)
    print('->', os.path.relpath(out, os.path.join(HERE, '..')), B.size)


ST = ['normal', 'dense', 'general']; STN = {'normal': '正常战斗', 'dense': '密集连续门', 'general': '敌将交锋 · 预警'}
SIZES = ['360x640', '390x844', '430x932', '360x780', '375x667']
os.makedirs(DELIVER, exist_ok=True)
for s in ST: shutil.copyfile(W_(f'st-390x844-{s}.png'), D_(f'battle-{s}@2x.png'))
shutil.copyfile(W_('st-zones.png'), D_('battle-zones@2x.png'))
board([W_(f'st-390x844-{s}.png') for s in ST], 3, [STN[s] for s in ST], D_('still-3states.jpg'), th=1400,
      title='一路长歌：三国 · 战斗三态（390×844 pt，@2x）', note='长枪 2 阶 · 演示阵容：随军 赵云/张飞，支援 华佗（跨进度夹具，非新档默认）')
board([W_(f'st-{z}-{s}.png') for s in ST for z in SIZES], 5, [f'{z.replace("x", "×")} · {STN[s][:4]}' for s in ST for z in SIZES],
      D_('size-matrix.jpg'), th=900, title='屏幕尺寸矩阵 5 × 3（同高缩放；HUD 底与分区随安全区计算）')
WN = {'spear': '长枪', 'guandao': '偃月刀', 'shemao': '蛇矛', 'huaji': '画戟'}; PH = ['蓄力', '出手', '出手末', '收势']
crop = lambda p: Image.open(p).convert('RGB').crop((0, 480, 780, 1520))
board([crop(W_(f'wp-{w}-{i}.png')) for w in WN for i in range(4)], 4, [f'{WN[w]} · {p}' for w in WN for p in PH],
      D_('weapons-4x4.jpg'), th=640, title='四兵器攻击相位对比（2 阶，同一时刻采样，Z2–Z3 裁切）')
FM = [('fb-01-grain', '粮车 · 援兵 +6'), ('fb-02-tierup', '兵器匣 · 长枪升 2 阶'), ('fb-03-arms-fire', '军械箱 · 部曲换火箭齐射'),
      ('fb-04-treasure-trial', '宝匣 · 赤兔马本局试用'), ('fb-05-swap-unmatched', '换偃月刀 · 关羽未随军（无共鸣）'),
      ('fb-06-swap-resonance', '换蛇矛 · 张飞随军（共鸣）'), ('fb-07-tier3', '兵器匣 · 蛇矛升 3 阶'),
      ('fb-08-arms-repeater', '军械箱 · 连弩三连发'), ('fb-09-overflow', '满阶溢出 · 化为援兵 +4')]
board([W_(n + '.png') for n, _ in FM], 5, [l for _, l in FM], D_('feedback-march.jpg'), th=1000,
      title='行军反馈关键帧（正常战斗路线，自动选路，按事件日志触发截图）')
FB = [('fb-10-boss-hit', '中招 · 兵力 −10'), ('fb-11-hua-heal', '华佗 · 救回伤兵'), ('fb-12-boss-warn', '预警 · 目标带'),
      ('fb-13-boss-dodge', '闪开横扫'), ('fb-14-flag-break', '靠旗折断'), ('fb-15-boss-spent', '力竭 · 跪地'), ('fb-16-boss-yield', '收服 · 白旗与降印')]
board([W_(n + '.png') for n, _ in FB], 4, [l for _, l in FB], D_('feedback-boss.jpg'), th=1000,
      title='敌将交锋与败北（前两格：自动中招；其余：自动躲开）')
