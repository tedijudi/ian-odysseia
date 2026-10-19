"""그리스 소품을 후처리하고 images/props 로 묶습니다."""
from PIL import Image
import json, os, sys
sys.path.insert(0, '/home/claude/paint')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paint import painterly

RAW = '/home/claude/bake6/raw'
DST = '/home/claude/ian-odysseia/images/props'
SS = 3
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
    im = painterly(im, sat=1.38, con=1.08, levels=8, line=0.64,
                   rim=0.22, ground=0.16, outline=(32, 22, 30, 235))
    im, foot = trim_bottom(im, info['foot'])
    im.save(f'{DST}/{key}.png')
    meta[key] = {'w': im.width, 'h': im.height, 'foot': foot}
    print('packed', key, im.size, 'foot', foot, flush=True)

json.dump(meta, open(f'{DST}/meta.json', 'w'), ensure_ascii=False)
print('PROPS DONE', len(meta))
