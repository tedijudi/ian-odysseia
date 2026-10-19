"""구운 캐릭터 프레임을 거상풍으로 후처리하고 스프라이트 시트로 묶습니다."""
from PIL import Image, ImageFilter, ImageEnhance
import json, os

RAW = '/home/claude/bake4/raw'
DST = '/home/claude/ian-odysseia/images/sprites'
W, H = 108, 144
LEVELS = 11
ANIM_ORDER = ['idle', 'walk', 'attack', 'hurt', 'down']
DIRS = 8

LUT = [min(255, int(round(v / 255 * (LEVELS - 1)) / (LEVELS - 1) * 255)) for v in range(256)]

def posterize(im):
    r, g, b, a = im.split()
    r = r.point(LUT); g = g.point(LUT); b = b.point(LUT)
    a = a.point(lambda v: 255 if v > 112 else 0)
    return Image.merge('RGBA', (r, g, b, a))

def outline(im, col=(30, 21, 34, 235)):
    a = im.split()[3]
    inner = a.point(lambda v: 255 if v > 112 else 0)
    ring = inner.filter(ImageFilter.MaxFilter(3)).point(lambda v: 255 if v > 128 else 0)
    ring = Image.composite(Image.new('L', im.size, 0), ring, inner)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(Image.new('RGBA', im.size, col), (0, 0), ring)
    out.alpha_composite(im)
    return out

def process(path):
    im = Image.open(path).convert('RGBA').resize((W, H), Image.LANCZOS)
    rgb = Image.merge('RGB', im.split()[:3])
    rgb = ImageEnhance.Color(rgb).enhance(1.12)        # 살짝 쨍하게
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    im = Image.merge('RGBA', (*rgb.split(), im.split()[3]))
    return outline(posterize(im))

os.makedirs(DST, exist_ok=True)
meta = {'chars': {}, 'props': {}}
raw_meta = json.load(open(f'{RAW}/meta.json'))

for key, anims in raw_meta.items():
    order = [a for a in ANIM_ORDER if a in anims]
    col0 = {}; c = 0
    for a in order:
        col0[a] = c; c += anims[a]
    sheet = Image.new('RGBA', (W * c, H * DIRS * len(order)), (0, 0, 0, 0))
    info = {}
    for ai, a in enumerate(order):
        info[a] = {'row0': ai * DIRS, 'col0': col0[a], 'frames': anims[a]}
        for d in range(DIRS):
            for f in range(anims[a]):
                p = f'{RAW}/{key}_{a}_d{d}_f{f:02d}.png'
                if not os.path.exists(p): continue
                sheet.paste(process(p), ((col0[a] + f) * W, (ai * DIRS + d) * H))
    sheet.save(f'{DST}/{key}.png')
    meta['chars'][key] = {'w': W, 'h': H, 'anims': info}
    print('packed', key, sheet.size, flush=True)

# 기존 소품 메타는 images/props/meta.json 가 따로 들고 있어요
json.dump(meta, open(f'{DST}/meta.json', 'w'), ensure_ascii=False)
print('PACK DONE', list(meta['chars']))
