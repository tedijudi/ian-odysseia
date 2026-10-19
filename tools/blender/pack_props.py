from PIL import Image, ImageFilter
import json, os
RAW='/home/claude/bake3/raw'; DST='/home/claude/ian-odysseia/images/props'
SS=2
os.makedirs(DST, exist_ok=True)
def posterize(im, levels=7):
    px=im.load()
    q=lambda v: min(255,int(round(v/255*(levels-1))/(levels-1)*255))
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if a<8: continue
            px[x,y]=(q(r),q(g),q(b),255 if a>110 else 0)
    return im
def outline(im,col=(28,20,32,255)):
    a=im.split()[3]
    inner=Image.eval(a,lambda v:255 if v>110 else 0)
    grown=inner.filter(ImageFilter.MaxFilter(3))
    ring=Image.eval(grown,lambda v:255 if v>128 else 0)
    ring=Image.composite(Image.new('L',im.size,0),ring,inner)
    out=Image.new('RGBA',im.size,(0,0,0,0))
    out.paste(Image.new('RGBA',im.size,col),(0,0),ring)
    out.alpha_composite(im); return out
# foot: 바닥 접지점이 그림 아래에서 몇 px 위인지
FOOT={'shop': 86, 'house': 69, 'tavern': 77, 'gate': 93, 'well': 33, 'jangseung': 28, 'tree_pine': 42, 'tree_cherry': 50, 'tree_maple': 48, 'tree_green': 45, 'tree_willow': 51, 'tree_dark': 39, 'bush_green': 24, 'bush_flower': 24, 'bush_dry': 24, 'grass_a': 14, 'grass_b': 14, 'rock_gray': 22, 'rock_moss': 22, 'rock_big': 42}
meta={}
for f in sorted(os.listdir(RAW)):
    if not f.endswith('.png'): continue
    key=f[:-4]
    im=Image.open(f'{RAW}/{f}').convert('RGBA')
    im=im.resize((im.width//SS, im.height//SS), Image.LANCZOS)
    im=outline(posterize(im,9))
    im.save(f'{DST}/{key}.png')
    meta[key]={'w':im.width,'h':im.height,'foot':FOOT.get(key,10)}
    print('packed',key,im.size,flush=True)
json.dump(meta, open(f'{DST}/meta.json','w'), ensure_ascii=False)
print('DONE',len(meta))
