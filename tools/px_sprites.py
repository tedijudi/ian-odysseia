"""
실행: python3 tools/px_sprites.py  (images/px/*.png 를 다시 만들어요)

메이플풍 도트 스프라이트 — 세은 · 이안
부위마다 따로 그리고(자동 외곽선 + 입체 음영), 눈·입·머리결은 픽셀로 직접 찍어요.
"""
from PIL import Image, ImageDraw
import os, json

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'images', 'px')
os.makedirs(OUT, exist_ok=True)

def hx(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), a)

class Layer:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.im = Image.new('RGBA', (w, h), (0,0,0,0)); s.d = ImageDraw.Draw(s.im)
    def ell(s, box, c='#fff'): s.d.ellipse(box, fill=hx(c)); return s
    def poly(s, pts, c='#fff'): s.d.polygon(pts, fill=hx(c)); return s
    def rect(s, box, c='#fff'): s.d.rectangle(box, fill=hx(c)); return s
    def line(s, pts, c='#fff', w=1): s.d.line(pts, fill=hx(c), width=w); return s
    def cut(s, box):  # 투명하게 지우기
        s.d.rectangle(box, fill=(0,0,0,0)); return s
    def solid(s, x, y): return 0 <= x < s.w and 0 <= y < s.h and s.im.getpixel((x, y))[3] > 0

def shade(layer, base, dark, light, out, rim=2, hl=1):
    """한 부위를 입체적으로: 바깥 1px 외곽선, 오른쪽·아래 음영, 왼쪽 위 하이라이트"""
    im = layer.im; w, h = im.size
    src = [[layer.solid(x, y) for x in range(w)] for y in range(h)]
    S = lambda x, y: 0 <= x < w and 0 <= y < h and src[y][x]
    res = Image.new('RGBA', (w, h), (0,0,0,0))
    for y in range(h):
        for x in range(w):
            if not src[y][x]: continue
            edge = not (S(x-1,y) and S(x+1,y) and S(x,y-1) and S(x,y+1))
            if edge: c = out
            elif not (S(x+rim, y) and S(x, y+rim) and S(x+rim-1, y+rim-1)): c = dark
            elif hl and not (S(x-hl-1, y) and S(x, y-hl-1)): c = light
            else: c = base
            res.putpixel((x, y), hx(c))
    return res

def stamp(im, x0, y0, rows, pal):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in pal and pal[ch]:
                im.putpixel((x0+i, y0+j), hx(pal[ch]) if isinstance(pal[ch], str) else pal[ch])

def comp(w, h, layers):
    out = Image.new('RGBA', (w, h), (0,0,0,0))
    for l in layers: out.alpha_composite(l)
    return out

def outer_outline(im, col='#2a1a22'):
    """전체 실루엣 바깥 1px 테두리 (메이플식 짙은 외곽선)"""
    w, h = im.size; px = im.load(); res = im.copy(); r = res.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 0: continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                xx, yy = x+dx, y+dy
                if 0 <= xx < w and 0 <= yy < h and px[xx, yy][3] > 0:
                    r[x, y] = hx(col); break
    return res

# ============================================================
# 세은
# ============================================================
SW, SH = 46, 66
SK = dict(base='#fcdfcc', dark='#ecb9a0', light='#fff2e8', out='#b8786a')
HR = dict(base='#231d28', dark='#141019', light='#4c425c', out='#0b080e')
TOP = dict(base='#f8f3e8', dark='#ddd4c0', light='#ffffff', out='#94886f')
SKT = dict(base='#c8c5c2', dark='#a6a29f', light='#dedbd9', out='#6a6664')
SHO = dict(base='#f6f2ec', dark='#d2c9bd', light='#ffffff', out='#7a6e62')

EYE_S = {'K':'#211417','I':'#2e1d1e','m':'#664434','i':'#b08462','p':'#140a0c','H':'#ffffff','W':'#f7f3f3','L':'#c9938d'}
NEAR = ['..KKKKK.',
        '.KKKKKKK',
        'KKIIIIIK',
        'KIHHIIIK',
        'KIHHIppK',
        'KImmmppK',
        'KImiiimK',
        '.KiiiiK.',
        '..LLLL..']
FAR  = ['.KKKKK..',
        'KKKKKKK.',
        'KIIIIIKK',
        'KIHHIIIK',
        'KIHHIppK',
        'KImmmppK',
        'KImiiimK',
        '.KiiiiK.',
        '..LLLL..']

def seeun(frame='idle'):
    b = 1 if frame == 'breath' else 0
    L = []
    # 포니테일 (목덜미 뒤로 낮게)
    pt = Layer(SW, SH).poly([(5,26),(11,27),(11,33),(9,41),(7,48),(4,50),(2,45),(3,37),(4,31)], HR['base'])
    L.append(shade(pt, **HR))
    tie = Layer(SW, SH).rect((5,27,10,29), '#e8b4c4')
    L.append(shade(tie, base='#e8b4c4', dark='#c98aa0', light='#ffd8e4', out='#7a4658', rim=1, hl=0))
    # 뒷머리
    L.append(shade(Layer(SW, SH).ell((6,1,40,33), HR['base']), **HR))
    # 신발 · 스커트
    for x0 in (15, 24):
        L.append(shade(Layer(SW, SH).ell((x0,59,x0+8,64), SHO['base']).rect((x0,62,x0+8,64), SHO['base']), **SHO, rim=1))
    L.append(shade(Layer(SW, SH).poly([(16,46+b),(30,46+b),(33,60),(13,60)], SKT['base']), **SKT))
    # 팔 (자연스럽게 내린 팔)
    L.append(shade(Layer(SW, SH).poly([(11,39+b),(15,38+b),(15,46+b),(12,47+b)], SK['base']), **SK, rim=1))
    L.append(shade(Layer(SW, SH).poly([(31,38+b),(35,39+b),(34,47+b),(31,46+b)], SK['base']), **SK, rim=1))
    L.append(shade(Layer(SW, SH).ell((10,44+b,15,49+b), SK['base']), **SK, rim=1))
    L.append(shade(Layer(SW, SH).ell((31,44+b,36,49+b), SK['base']), **SK, rim=1))
    # 상의 (아이보리 랩 · 반팔)
    L.append(shade(Layer(SW, SH).poly([(16,36+b),(30,36+b),(34,39+b),(33,42+b),(31,42+b),(31,47+b),(15,47+b),(15,42+b),(12,42+b),(12,39+b)], TOP['base']), **TOP))
    # 목
    L.append(shade(Layer(SW, SH).rect((20,33,26,37+b), SK['base']), **SK, rim=1, hl=0))
    # 귀
    L.append(shade(Layer(SW, SH).ell((7,18,12,26), SK['base']), **SK, rim=1))
    # 얼굴 (크고 둥글게, 턱은 살짝 갸름)
    fc = Layer(SW, SH).ell((9,6,38,36), SK['base'])
    L.append(shade(fc, **SK))
    # 앞머리: 가르마를 타고 뒤로 넘긴 머리 + 양옆 잔머리
    hf = Layer(SW, SH)
    hf.poly([(7,21),(7,12),(11,5),(18,1),(28,1),(35,4),(39,11),(40,21),(38,19),(36,13),(31,9),(25,8),(22,10),(19,8),(14,10),(11,14),(9,20)], HR['base'])
    hf.poly([(36,14),(39,18),(39,29),(37,27)], HR['base'])
    hf.poly([(9,15),(11,18),(10,27),(8,24)], HR['base'])
    L.append(shade(hf, **HR))
    img = comp(SW, SH, L); px = img.load()
    # 머리 윤기 · 가르마
    stamp(img, 12, 5, ['..hhhh', '.h....', 'h.....'], {'h': '#62567a'})
    stamp(img, 26, 3, ['hhhh..', '....hh'], {'h': '#62567a'})
    for y in range(2, 8): px[22, y] = hx('#3c3446')
    # 눈
    if frame == 'blink':
        stamp(img, 13, 23, ['.KKKKK..', 'K.....K.'], EYE_S); stamp(img, 25, 23, ['..KKKKK.', '.K.....K'], EYE_S)
    elif frame == 'happy':
        stamp(img, 13, 22, ['..KKK...', '.K...K..', 'K.....K.'], EYE_S); stamp(img, 25, 22, ['...KKK..', '..K...K.', '.K.....K'], EYE_S)
    else:
        stamp(img, 12, 18, FAR, EYE_S); stamp(img, 26, 18, NEAR, EYE_S)
    # 눈썹
    stamp(img, 13, 15, ['..kkk', 'kk...'], {'k': '#3c2e34'})
    stamp(img, 27, 15, ['kkk..', '...kk'], {'k': '#3c2e34'})
    # 볼터치
    for (x, y) in [(11,28),(12,28),(13,28),(12,29),(33,28),(34,28),(35,28),(34,29)]: px[x, y] = hx('#f6a2a4')
    # 코 · 입
    px[24, 28] = hx('#e5a48e')
    if frame == 'talk':
        stamp(img, 22, 30, ['RRRR', 'RppR', '.RR.'], {'R':'#a8505a','p':'#f08090'})
    else:
        stamp(img, 21, 30, ['R....R', '.RHHR.', '..RR..'], {'R':'#b0585e','H':'#ffffff'})
    # 랩 상의 V 라인
    stamp(img, 20, 37+b, ['T....', '.T...', '..T..', '...T.'], {'T': '#b9ab91'})
    stamp(img, 23, 37+b, ['..t', '.t.', 't..'], {'t': '#d6cbb5'})
    for x in range(16, 31): px[x, 45+b] = hx('#e2d8c4')
    for (x, y) in [(15,40),(15,41),(31,40),(31,41)]: px[x, y+b] = hx('#cfc4ae')
    px[33, 46+b] = hx('#f2d072')     # 반지
    for y in range(49, 59): px[19, y] = hx('#b1ada9'); px[27, y] = hx('#b1ada9')
    return outer_outline(img)

# ============================================================
# 이안 (6개월 아기)
# ============================================================
IW, IH = 40, 50
BSK = dict(base='#fde1cf', dark='#f1b9a2', light='#fff3ea', out='#c07c6c')
YEL = dict(base='#ffe27a', dark='#f0c04a', light='#fff4b8', out='#a88020')
STR = dict(base='#d6ccba', dark='#b3a792', light='#e8e1d4', out='#6e6454')

EYE_B = {'K':'#1a1115','I':'#2c1d1c','i':'#62443a','p':'#120a0c','H':'#ffffff','L':'#d69d94'}
BEYE = ['.KKKK.',
        'KIIIIK',
        'KHHIIK',
        'KHIppK',
        'KIiiIK',
        'KIiiIK',
        '.KiiK.',
        '..LL..']

def ian(frame='idle'):
    q = 1 if frame == 'breath' else 0
    walk = {'walk1': (1, 0), 'walk2': (0, 1)}.get(frame, (0, 0))
    L = []
    for i, (x0, x1) in enumerate(((12,19),(21,28))):
        up = walk[i]
        L.append(shade(Layer(IW, IH).ell((x0, 40-up, x1, 48-up), BSK['base']), **BSK, rim=1))
    sh = shade(Layer(IW, IH).ell((10,35+q,30,46-q), STR['base']), **STR)
    for x in range(11, 30, 2):
        for y in range(36, 46):
            p = sh.getpixel((x, y))
            if p[3] and p[:3] != hx(STR['out'])[:3]: sh.putpixel((x, y), hx('#8f8573'))
    L.append(sh)
    L.append(shade(Layer(IW, IH).ell((4,29+q,11,39+q), BSK['base']), **BSK, rim=1))
    L.append(shade(Layer(IW, IH).ell((29,29+q,36,39+q), BSK['base']), **BSK, rim=1))
    L.append(shade(Layer(IW, IH).ell((9,27+q,31,41+q), YEL['base']), **YEL))
    fr = Layer(IW, IH)
    for cx, cy in ((8,29),(11,28),(29,28),(32,29)): fr.ell((cx-2,cy-2+q,cx+2,cy+2+q), YEL['base'])
    L.append(shade(fr, base='#fff0a8', dark='#f6d270', light='#ffffff', out='#a88020', rim=1))
    for box in ((1,14,6,22),(34,14,39,22)): L.append(shade(Layer(IW, IH).ell(box, BSK['base']), **BSK, rim=1))
    fc = Layer(IW, IH).ell((3,1,37,31), BSK['base']).ell((2,12,19,32), BSK['base']).ell((21,12,38,32), BSK['base'])
    L.append(shade(fc, **BSK))
    # 솜털 머리 (윗부분에 부드러운 모자처럼 + 삐죽 잔머리)
    hr = Layer(IW, IH).ell((5,1,35,19), '#8a6a56').cut((0,8,IW,IH))
    hr.poly([(5,8),(8,9),(10,8),(13,10),(16,8),(19,9),(22,8),(25,10),(28,8),(31,9),(35,8),(35,7),(5,7)], '#8a6a56')
    L.append(shade(hr, base='#8a6a56', dark='#6e5040', light='#b39079', out='#5a3e30', rim=1))
    img = comp(IW, IH, L); px = img.load()
    stamp(img, 17, 0, ['..hh.', '.h..h', '.h...', '..hh.'], {'h': '#5e4232'})    # 정수리 컬
    stamp(img, 10, 3, ['.ll...', 'l.....'], {'l': '#b89480'})                  # 윤기
    stamp(img, 23, 2, ['lll.', '...l'], {'l': '#b89480'})
    for (x, y) in [(7,10),(11,11),(17,11),(23,11),(29,11),(33,10),(4,11),(35,11)]: px[x, y] = hx('#b08c76')   # 잔머리
    stamp(img, 10, 14, ['...dd', '.dd..', 'd....'], {'d': '#8a6a58'})
    stamp(img, 25, 14, ['dd...', '..dd.', '....d'], {'d': '#8a6a58'})
    if frame == 'blink':
        stamp(img, 10, 21, ['.KKKK.', 'K....K'], EYE_B); stamp(img, 24, 21, ['.KKKK.', 'K....K'], EYE_B)
    elif frame == 'happy':
        stamp(img, 10, 19, ['..KK..', '.K..K.', 'K....K'], EYE_B); stamp(img, 24, 19, ['..KK..', '.K..K.', 'K....K'], EYE_B)
    else:
        stamp(img, 10, 17, BEYE, EYE_B); stamp(img, 24, 17, BEYE, EYE_B)
    for (x, y) in [(6,26),(7,26),(8,26),(7,27),(6,27),(32,26),(33,26),(34,26),(33,27),(32,27)]: px[x, y] = hx('#f7a09e')
    if frame == 'happy':
        stamp(img, 18, 27, ['R...R', '.RpR.', '..R..'], {'R':'#b0585e','p':'#f28a96'})
    else:
        stamp(img, 18, 27, ['.RR.', 'RppR', '.RR.'], {'R':'#c0606a','p':'#f39aa4'})
    return outer_outline(img)

def sheet(frames, fn):
    w, h = frames[0].size
    sh = Image.new('RGBA', (w*len(frames), h), (0,0,0,0))
    for i, f in enumerate(frames): sh.paste(f, (i*w, 0))
    sh.save(fn)
    return sh

S_FR = ['idle', 'breath', 'blink', 'talk']
I_FR = ['idle', 'breath', 'blink', 'walk1', 'walk2', 'happy']
s = sheet([seeun(f) for f in S_FR], f'{OUT}/seeun.png')
i = sheet([ian(f) for f in I_FR], f'{OUT}/ian.png')
json.dump({'seeun': {'w': SW, 'h': SH, 'frames': S_FR}, 'ian': {'w': IW, 'h': IH, 'frames': I_FR}},
          open(f'{OUT}/sprites.json', 'w'), ensure_ascii=False)
# 미리보기 (8배)
pv = Image.new('RGBA', (max(s.width, i.width)*8 + 16, (SH+IH)*8 + 24), (120,160,200,255))
pv.alpha_composite(s.resize((s.width*8, s.height*8), Image.NEAREST), (8, 8))
pv.alpha_composite(i.resize((i.width*8, i.height*8), Image.NEAREST), (8, SH*8+16))
pv.save(os.path.join(OUT, '_preview.png')) if os.environ.get('PREVIEW') else None
print('ok', s.size, i.size)
