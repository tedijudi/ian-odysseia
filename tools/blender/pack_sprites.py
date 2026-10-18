"""구운 프레임을 거상풍으로 후처리하고 게임용 스프라이트 시트 + 메타로 묶습니다."""
from PIL import Image, ImageFilter
import json, os, sys

RAW='/home/claude/bake2/raw'; RAWP='/home/claude/bake2/raw_props'
DST='/home/claude/ian-odysseia/images/sprites'; DSTP='/home/claude/ian-odysseia/images/props'
W,H,SS=108,144,2
ANIM_ORDER=['idle','walk','attack','hurt','down']
DIRS=8

def posterize(im, levels=6):
    px=im.load()
    q=lambda v: min(255,int(round(v/255*(levels-1))/(levels-1)*255))
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if a<8: continue
            px[x,y]=(q(r),q(g),q(b),255 if a>110 else 0)
    return im

def outline(im, col=(24,16,30,255)):
    a=im.split()[3]
    inner=Image.eval(a, lambda v:255 if v>110 else 0)
    grown=inner.filter(ImageFilter.MaxFilter(3))
    ring=Image.eval(grown, lambda v:255 if v>128 else 0)
    ring=Image.composite(Image.new('L',im.size,0), ring, inner)
    out=Image.new('RGBA',im.size,(0,0,0,0))
    out.paste(Image.new('RGBA',im.size,col),(0,0),ring)
    out.alpha_composite(im)
    return out

def process(path, w, h):
    im=Image.open(path).convert('RGBA').resize((w,h), Image.LANCZOS)
    return outline(posterize(im,6))

os.makedirs(DST, exist_ok=True); os.makedirs(DSTP, exist_ok=True)
meta={'chars':{}, 'props':{}}

raw_meta=json.load(open(f'{RAW}/meta.json'))
for key, anims in raw_meta.items():
    rows=[]; col0={}; c=0
    order=[a for a in ANIM_ORDER if a in anims]
    maxf=max(anims[a] for a in order)
    for a in order:
        col0[a]=c; c+=anims[a]
    sheet=Image.new('RGBA',(W*c, H*DIRS*len(order)),(0,0,0,0))
    info={}
    for ai,a in enumerate(order):
        info[a]={'row0':ai*DIRS, 'col0':col0[a], 'frames':anims[a]}
        for d in range(DIRS):
            for f in range(anims[a]):
                p=f'{RAW}/{key}_{a}_d{d}_f{f:02d}.png'
                if not os.path.exists(p): continue
                sheet.paste(process(p,W,H), ((col0[a]+f)*W, (ai*DIRS+d)*H))
    sheet.save(f'{DST}/{key}.png')
    meta['chars'][key]={'w':W,'h':H,'anims':info}
    print('packed', key, sheet.size, flush=True)

# 소품
PROP_FOOT={'hanok_shop':34,'hanok_house':30,'pine':16,'rock':10,'lantern':12,'stall':18}
if os.path.isdir(RAWP):
    for f in sorted(os.listdir(RAWP)):
        if not f.endswith('.png'): continue
        key=f[:-4]
        im=Image.open(f'{RAWP}/{f}').convert('RGBA')
        im=im.resize((im.width//SS, im.height//SS), Image.LANCZOS)
        im=outline(posterize(im,6))
        im.save(f'{DSTP}/{key}.png')
        meta['props'][key]={'w':im.width,'h':im.height,'foot':PROP_FOOT.get(key,12)}
        print('packed prop', key, im.size, flush=True)

json.dump(meta, open(f'{DST}/meta.json','w'), ensure_ascii=False)
print('PACK DONE', {k:len(v) for k,v in meta.items()})
