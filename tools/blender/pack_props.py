"""그리스 소품을 후처리하고 images/props 로 묶습니다."""
from PIL import Image, ImageFilter, ImageEnhance
import json, os

RAW = '/home/claude/bake6/raw'
DST = '/home/claude/ian-odysseia/images/props'
SS = 3
LEVELS = 11
LUT = [min(255, int(round(v/255*(LEVELS-1))/(LEVELS-1)*255)) for v in range(256)]

def posterize(im):
    r, g, b, a = im.split()
    return Image.merge('RGBA', (r.point(LUT), g.point(LUT), b.point(LUT),
                                a.point(lambda v: 255 if v > 110 else 0)))

def outline(im, col=(34, 24, 30, 230)):
    a = im.split()[3]
    inner = a.point(lambda v: 255 if v > 110 else 0)
    ring = inner.filter(ImageFilter.MaxFilter(3)).point(lambda v: 255 if v > 128 else 0)
    ring = Image.composite(Image.new('L', im.size, 0), ring, inner)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(Image.new('RGBA', im.size, col), (0, 0), ring)
    out.alpha_composite(im)
    return out

def trim_bottom(im, foot):
    """바닥선 아래로 남는 빈 공간을 잘라 메모리를 아껴요 (foot 은 그대로 유지)."""
    bb = im.getbbox()
    if not bb: return im, foot
    keep_bottom = im.height - foot
    bottom = max(bb[3], keep_bottom)
    top = min(bb[1], bottom - 1)
    cropped = im.crop((0, top, im.width, bottom))
    return cropped, foot - (im.height - bottom)

os.makedirs(DST, exist_ok=True)
for f in os.listdir(DST):
    if f.endswith('.png') or f == 'meta.json':
        os.remove(os.path.join(DST, f))

raw_meta = json.load(open(f'{RAW}/meta_raw.json'))
meta = {}
for key, info in sorted(raw_meta.items()):
    p = f'{RAW}/{key}.png'
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGBA')
    im = im.resize((im.width // SS, im.height // SS), Image.LANCZOS)
    rgb = Image.merge('RGB', im.split()[:3])
    rgb = ImageEnhance.Color(rgb).enhance(1.10)
    im = Image.merge('RGBA', (*rgb.split(), im.split()[3]))
    im = outline(posterize(im))
    im, foot = trim_bottom(im, info['foot'])
    im.save(f'{DST}/{key}.png')
    meta[key] = {'w': im.width, 'h': im.height, 'foot': foot}
    print('packed', key, im.size, 'foot', foot, flush=True)

json.dump(meta, open(f'{DST}/meta.json', 'w'), ensure_ascii=False)
print('PROPS DONE', len(meta))
