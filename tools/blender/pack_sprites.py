"""3등신 캐릭터 프레임을 후처리하고 스프라이트 시트로 묶습니다."""
from PIL import Image
import json, os, sys
sys.path.insert(0, '/home/claude/paint')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paint import painterly

RAW = '/home/claude/bake5/raw'
DST = '/home/claude/ian-odysseia/images/sprites'
SS = 3
ANIM_ORDER = ['idle', 'walk', 'attack', 'hurt', 'down']
DIRS = 8
raw = json.load(open(f'{RAW}/meta.json'))
W, H, FOOT = raw['_w'], raw['_h'], raw['_foot']

def process(path):
    im = Image.open(path).convert('RGBA').resize((W, H), Image.LANCZOS)
    return painterly(im, sat=1.42, con=1.10, levels=7, line=0.60,
                     rim=0.26, ground=0.20, outline=(30, 20, 28, 240))

os.makedirs(DST, exist_ok=True)
meta = {'chars': {}}
for key, anims in raw.items():
    if key.startswith('_'): continue
    order = [a for a in ANIM_ORDER if a in anims]
    col0 = {}; c = 0
    for a in order:
        col0[a] = c; c += anims[a]
    sheet = Image.new('RGBA', (W*c, H*DIRS*len(order)), (0, 0, 0, 0))
    info = {}
    for ai, a in enumerate(order):
        info[a] = {'row0': ai*DIRS, 'col0': col0[a], 'frames': anims[a]}
        for d in range(DIRS):
            for f in range(anims[a]):
                p = f'{RAW}/{key}_{a}_d{d}_f{f:02d}.png'
                if not os.path.exists(p): continue
                sheet.paste(process(p), ((col0[a]+f)*W, (ai*DIRS+d)*H))
    sheet.save(f'{DST}/{key}.png')
    meta['chars'][key] = {'w': W, 'h': H, 'foot': FOOT, 'anims': info}
    print('packed', key, sheet.size, flush=True)

json.dump(meta, open(f'{DST}/meta.json', 'w'), ensure_ascii=False)
print('PACK DONE foot=', FOOT, list(meta['chars']))
