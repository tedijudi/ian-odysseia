"""거상풍 캐릭터 베이커 v3 — 3등신 귀여운 비율.

크기 규약 (원근감을 거상에 맞추기 위한 기준)
  · 월드 1칸(타일) = 1.23 units
  · 포장 후 픽셀/units = 51.9 (가로), 높이는 cos30 이 곱해져 45
  · 어른 키 1.60 units → 화면에서 72px (타일 두 칸 조금 넘음)
"""
import bpy, math, os, json
from mathutils import Vector, Matrix

OUT = '/home/claude/bake5/raw'
SS = 3
PW, PH = 80, 104                    # 포장 후 스프라이트 칸 크기
W, H = PW * SS, PH * SS
ORTHO = 2.0                         # 세로 2.0 units 가 화면에 꽉
HOFF = 0.80                         # 카메라가 보는 중심 높이
DIRS = 8
ELEV = 30.0
SAMPLES = int(os.environ.get('BK_SAMPLES', '20'))
ONLY = os.environ.get('BK_ONLY', '')

CHARS = {
 'dad': dict(scale=1.00, skin=(0.95,0.76,0.62), skin2=(0.84,0.63,0.50),
             hair=(0.10,0.075,0.085), hair2=(0.19,0.14,0.15),
             top=(0.16,0.40,0.78), top2=(0.28,0.54,0.90), top3=(0.10,0.26,0.56),
             bottom=(0.22,0.24,0.36), bottom2=(0.30,0.32,0.45),
             shoe=(0.30,0.20,0.14), accent=(0.72,0.52,0.24),
             hairstyle='swept', build='man'),
 'mom': dict(scale=0.955, skin=(0.98,0.83,0.73), skin2=(0.88,0.71,0.62),
             hair=(0.12,0.085,0.09), hair2=(0.22,0.16,0.16),
             top=(0.98,0.96,0.92), top2=(1.00,1.00,0.98), top3=(0.86,0.82,0.78),
             bottom=(0.52,0.60,0.76), bottom2=(0.64,0.72,0.86),
             shoe=(0.86,0.74,0.56), accent=(0.92,0.54,0.60),
             hairstyle='ponytail', build='woman'),
 'ian': dict(scale=0.760, skin=(1.00,0.87,0.79), skin2=(0.93,0.76,0.68),
             hair=(0.46,0.33,0.24), hair2=(0.60,0.45,0.32),
             top=(1.00,0.84,0.30), top2=(1.00,0.93,0.56), top3=(0.88,0.68,0.20),
             bottom=(0.84,0.80,0.72), bottom2=(0.92,0.89,0.82),
             shoe=(0.98,0.97,0.95), accent=(0.46,0.72,0.92),
             hairstyle='fuzz', build='baby'),
}
ANIMS = {'idle':4, 'walk':8, 'attack':6, 'hurt':3, 'down':4}

# ---------- 이타카 사람들 (서 있기 · 걷기만) ----------
CHARS.update({
 'merchant': dict(scale=1.00, skin=(0.88,0.68,0.52), skin2=(0.77,0.56,0.42),
   hair=(0.14,0.10,0.08), hair2=(0.26,0.19,0.14),
   top=(0.74,0.26,0.22), top2=(0.88,0.40,0.32), top3=(0.56,0.17,0.15),
   bottom=(0.92,0.88,0.80), bottom2=(0.98,0.95,0.88),
   shoe=(0.38,0.26,0.16), accent=(0.84,0.68,0.26), hairstyle='swept', build='man'),
 'fisher': dict(scale=0.98, skin=(0.84,0.62,0.46), skin2=(0.72,0.50,0.36),
   hair=(0.30,0.28,0.26), hair2=(0.46,0.44,0.42),
   top=(0.34,0.52,0.60), top2=(0.46,0.64,0.72), top3=(0.24,0.38,0.46),
   bottom=(0.56,0.50,0.40), bottom2=(0.66,0.60,0.48),
   shoe=(0.30,0.24,0.18), accent=(0.70,0.62,0.44), hairstyle='swept', build='man'),
 'elder': dict(scale=0.96, skin=(0.86,0.70,0.58), skin2=(0.74,0.58,0.47),
   hair=(0.84,0.82,0.80), hair2=(0.92,0.91,0.89),
   top=(0.90,0.88,0.84), top2=(0.97,0.96,0.93), top3=(0.76,0.73,0.68),
   bottom=(0.74,0.70,0.64), bottom2=(0.84,0.80,0.74),
   shoe=(0.44,0.34,0.24), accent=(0.62,0.50,0.70), hairstyle='swept', build='man'),
 'woman': dict(scale=0.95, skin=(0.94,0.76,0.64), skin2=(0.84,0.64,0.52),
   hair=(0.22,0.14,0.10), hair2=(0.36,0.24,0.16),
   top=(0.96,0.78,0.42), top2=(1.00,0.88,0.58), top3=(0.82,0.62,0.28),
   bottom=(0.46,0.34,0.52), bottom2=(0.58,0.44,0.64),
   shoe=(0.62,0.48,0.32), accent=(0.86,0.42,0.38), hairstyle='ponytail', build='woman'),
 'girl': dict(scale=0.80, skin=(0.98,0.84,0.74), skin2=(0.88,0.72,0.62),
   hair=(0.34,0.20,0.12), hair2=(0.50,0.33,0.20),
   top=(0.52,0.74,0.60), top2=(0.66,0.86,0.72), top3=(0.38,0.58,0.46),
   bottom=(0.90,0.86,0.78), bottom2=(0.96,0.93,0.86),
   shoe=(0.74,0.60,0.42), accent=(0.96,0.72,0.34), hairstyle='ponytail', build='woman'),
 'boy': dict(scale=0.82, skin=(0.96,0.80,0.68), skin2=(0.86,0.68,0.56),
   hair=(0.18,0.12,0.09), hair2=(0.32,0.22,0.15),
   top=(0.40,0.46,0.72), top2=(0.54,0.60,0.84), top3=(0.28,0.33,0.56),
   bottom=(0.78,0.72,0.60), bottom2=(0.88,0.83,0.72),
   shoe=(0.46,0.34,0.22), accent=(0.90,0.56,0.26), hairstyle='swept', build='man'),
})
NPC_KEYS = ['merchant', 'fisher', 'elder', 'woman', 'girl', 'boy']

# ---------- 동물 ----------
ANIMALS = {
 'goat':  dict(body=(0.42,0.23,0.25), legh=0.25, headr=0.140, tall=0.80,
               c=(0.93,0.91,0.87), c2=(0.70,0.67,0.61), horn=(0.56,0.50,0.38),
               ear=1, tail=0.10, scale=1.12),
 'cat':   dict(body=(0.34,0.17,0.16), legh=0.14, headr=0.115, tail=0.30,
               c=(0.52,0.42,0.32), c2=(0.38,0.30,0.22), horn=None,
               ear=2, scale=1.14),
 'dove':  dict(body=(0.19,0.15,0.16), legh=0.05, headr=0.080, tail=0.11,
               c=(0.93,0.92,0.90), c2=(0.74,0.74,0.76), horn=None,
               ear=0, scale=1.22),
}
ANIM_SETS = {}
for _k in NPC_KEYS: ANIM_SETS[_k] = {'idle': 4, 'walk': 8}
for _k in ANIMALS: ANIM_SETS[_k] = {'idle': 4, 'walk': 8}


def build_animal(key):
    A = ANIMALS[key]
    C1 = mat('c', A['c'], 0.74); C2 = mat('c2', A['c2'], 0.76)
    DK = mat('dk', tuple(c*0.55 for c in A['c2']), 0.70)
    EYE = mat('eye', (0.08,0.06,0.08), 0.24, 0.42)
    WHT = mat('w', (0.99,0.98,0.96), 0.40)
    PINK = mat('p', (0.92,0.62,0.60), 0.72)
    root = bpy.data.objects.new('root', None); bpy.context.collection.objects.link(root)
    parts = []
    bw, bd, bh = A['body']; lh = A['legh']; hr = A['headr']
    bz = lh + bh*0.5
    body = box('body', (bd, bw, bh), (0, 0, bz), C1, taper=0.94, bev=0.030)
    rump = ball('rump', bh*0.56, (0, bw*0.34, bz+0.012), C1, (1.0,1.0,0.94)); attach(rump, body)
    parts.append(body)
    # 다리 넷
    legs = {}
    for i, (sx, sy) in enumerate([(-1,-1),(1,-1),(-1,1),(1,1)]):
        lx, ly = sx*bd*0.34, sy*bw*0.32
        lg = box(f'leg{i}', (bd*0.26, bd*0.26, lh), (lx, ly, lh*0.5), C2,
                 pivot=(lx, ly, lh), taper=0.84, bev=0.016)
        hf = box(f'hf{i}', (bd*0.30, bd*0.30, lh*0.22), (lx, ly, lh*0.10), DK, bev=0.012)
        attach(hf, lg); legs[f'l{i}'] = lg; parts.append(lg)
    # 목과 머리
    nz = bz + bh*0.62
    neck = box('neck', (bd*0.46, bd*0.48, bh*0.86), (0, -bw*0.44, nz), C1,
               pivot=(0, -bw*0.40, bz), lean=-0.07, bev=0.020)
    attach(neck, body); parts.append(neck)
    hz = nz + bh*0.56
    head = ball('head', hr, (0, -bw*0.58, hz), C1, (1.0,1.14,0.98), pivot=(0,-bw*0.40,nz))
    attach(head, neck); parts.append(head)
    snout = ball('snout', hr*0.58, (0, -bw*0.58-hr*0.80, hz-hr*0.26), C2, (0.9,1.15,0.8)); attach(snout, head)
    nose = ball('nose', hr*0.22, (0, -bw*0.58-hr*1.24, hz-hr*0.22), PINK); attach(nose, head)
    for sx in (-1,1):
        e = ball(f'eye{sx}', hr*0.28, (sx*hr*0.50, -bw*0.58-hr*0.64, hz+hr*0.16), EYE, (1,0.55,1.1)); attach(e, head)
        g = ball(f'gl{sx}', hr*0.11, (sx*hr*0.44, -bw*0.58-hr*0.78, hz+hr*0.30), WHT); attach(g, head)
        if A['ear'] == 1:        # 늘어진 귀
            er = box(f'ear{sx}', (hr*0.28, hr*0.36, hr*0.62), (sx*hr*0.84, -bw*0.52, hz+hr*0.12), C2,
                     bev=0.012); attach(er, head)
        elif A['ear'] == 2:      # 쫑긋 귀
            er = box(f'ear{sx}', (hr*0.38, hr*0.20, hr*0.70), (sx*hr*0.54, -bw*0.52, hz+hr*0.86), C1,
                     taper=0.15, bev=0.010); attach(er, head)
            ei = box(f'ei{sx}', (hr*0.20, hr*0.10, hr*0.38), (sx*hr*0.54, -bw*0.57, hz+hr*0.80), PINK,
                     taper=0.2, bev=0.006); attach(ei, head)
    if A.get('horn'):
        MH = mat('horn', A['horn'], 0.58)
        for sx in (-1,1):
            hn = box(f'horn{sx}', (hr*0.22, hr*0.24, hr*1.00), (sx*hr*0.42, -bw*0.46, hz+hr*0.94), MH,
                     lean=0.055, taper=0.30, bev=0.010); attach(hn, head)
    # 꼬리
    tl = A.get('tail', 0.10)
    tail = box('tail', (bd*0.20, bd*0.20, tl), (0, bw*0.50, bz+bh*0.26), C2,
               pivot=(0, bw*0.46, bz+bh*0.26), lean=0.03, taper=0.5, bev=0.014)
    attach(tail, body); parts.append(tail)
    if key == 'dove':            # 날개
        for sx in (-1,1):
            wg = box(f'wing{sx}', (bd*0.16, bw*0.86, bh*0.62), (sx*bd*0.50, 0, bz+0.01), C2,
                     taper=0.75, bev=0.016); attach(wg, body)
        beak = box('beak', (hr*0.24, hr*0.50, hr*0.24), (0, -bw*0.58-hr*0.90, hz-hr*0.12),
                   mat('bk',(0.88,0.66,0.26)), taper=0.2, bev=0.008); attach(beak, head)
    for o in parts:
        if o.parent is None: attach(o, root)
    root.scale = (A['scale'],)*3
    P = dict(root=root, head=head, torso=body, neck=neck, tail=tail, **legs)
    return P


def pose_animal(P, anim, f, n):
    root = P['root']; t = f/n*math.tau
    for k in ('l0','l1','l2','l3'):
        P[k].rotation_euler = (0,0,0)
    P['head'].rotation_euler = (0,0,0); P['torso'].rotation_euler = (0,0,0)
    P['tail'].rotation_euler = (0,0,0); P['neck'].rotation_euler = (0,0,0)
    root.location = (0,0,0); root.rotation_euler = (0,0,0)
    if anim == 'walk':
        sw = math.sin(t)*0.58
        P['l0'].rotation_euler = (sw,0,0);  P['l3'].rotation_euler = (sw,0,0)
        P['l1'].rotation_euler = (-sw,0,0); P['l2'].rotation_euler = (-sw,0,0)
        root.location.z = abs(math.sin(t*2))*0.016
        P['tail'].rotation_euler = (0,0,math.sin(t*2)*0.30)
        P['head'].rotation_euler = (math.sin(t*2)*0.07,0,0)
    else:
        br = math.sin(t)
        root.location.z = br*0.010
        P['head'].rotation_euler = (br*0.09, 0, math.sin(t*0.5)*0.12)
        P['tail'].rotation_euler = (0,0,br*0.22)
        P['neck'].rotation_euler = (br*0.05,0,0)


# ---------- 도구 ----------
def mat(name, color, rough=0.76, spec=0.10):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    try: b.inputs['Specular IOR Level'].default_value = spec
    except Exception: pass
    return m

def _smooth(ang=38):
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(ang))
    except Exception:
        try: bpy.ops.object.shade_smooth()
        except Exception: pass

def _bevel(o, w, segs=2):
    md = o.modifiers.new('bev', 'BEVEL')
    md.width = w; md.segments = segs
    md.limit_method = 'ANGLE'; md.angle_limit = math.radians(32)

def box(name, size, center, material, pivot=None, taper=1.0, lean=0.0,
        bev=0.018, segs=2, round_top=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
    o = bpy.context.object; o.name = name; me = o.data
    if taper != 1.0 or lean or round_top:
        for v in me.vertices:
            t = v.co.z + 0.5
            s = 1 + (taper - 1) * t
            v.co.x *= s; v.co.y *= s; v.co.y += lean * t
            if round_top and t > 0.5:
                v.co.x *= 1 - round_top; v.co.y *= 1 - round_top
    o.scale = Vector(size); bpy.ops.object.transform_apply(scale=True)
    p = Vector(pivot) if pivot else Vector(center)
    me.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    me.materials.append(material)
    if bev: _bevel(o, bev, segs)
    _smooth()
    return o

def ball(name, r, center, material, scale=(1,1,1), pivot=None, seg=24, ring=16):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring, location=(0,0,0))
    o = bpy.context.object; o.name = name
    o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    p = Vector(pivot) if pivot else Vector(center)
    o.data.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    o.data.materials.append(material); bpy.ops.object.shade_smooth()
    return o

def cyl(name, r, h, center, material, rot=(0,0,0), pivot=None, verts=18, bev=0.010):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=(0,0,0))
    o = bpy.context.object; o.name = name
    o.rotation_euler = rot; bpy.ops.object.transform_apply(rotation=True)
    p = Vector(pivot) if pivot else Vector(center)
    o.data.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    o.data.materials.append(material)
    if bev: _bevel(o, bev, 1)
    _smooth(46)
    return o

def attach(c, p):
    bpy.context.view_layer.update()
    c.parent = p; c.matrix_parent_inverse = p.matrix_world.inverted()

# ---------- 조립 (3등신) ----------
def build(key):
    C = CHARS[key]
    SKIN = mat('skin', C['skin'], 0.66); SKIN2 = mat('skin2', C['skin2'], 0.70)
    HAIR = mat('hair', C['hair'], 0.52, 0.26); HAIR2 = mat('hair2', C['hair2'], 0.46, 0.34)
    TOP = mat('top', C['top'], 0.84); TOP2 = mat('top2', C['top2'], 0.82); TOP3 = mat('top3', C['top3'], 0.86)
    BOT = mat('bot', C['bottom'], 0.86); BOT2 = mat('bot2', C['bottom2'], 0.84)
    SHOE = mat('shoe', C['shoe'], 0.58, 0.18); ACC = mat('acc', C['accent'], 0.72)
    EYE = mat('eye', (0.08,0.06,0.10), 0.22, 0.46)
    IRIS = mat('iris', (0.26,0.20,0.34), 0.26, 0.42)
    WHITE = mat('wht', (0.99,0.98,0.97), 0.40)
    MOUTH = mat('mouth', (0.62,0.28,0.30), 0.60)
    BLUSH = mat('blush', (0.98,0.66,0.62), 0.84)

    root = bpy.data.objects.new('root', None); bpy.context.collection.objects.link(root)
    parts = []; P = {}
    b = C['build']
    baby = (b == 'baby'); fem = (b == 'woman')

    # 아기는 더 짧고 더 동글 (2.6등신)
    if baby:
        HPZ, SHZ, NKZ = 0.48, 0.86, 0.95
        HEADZ, HEADR, HEADS = 1.26, 0.290, (1.02,0.95,1.00)
        TW_, SHW = 0.44, 0.50
        THL, SHL, ARL, FRL = 0.26, 0.22, 0.22, 0.20
        AX, LX = 0.255, 0.105
    else:
        HPZ, SHZ, NKZ = 0.56, 0.97, 1.06
        HEADZ, HEADR, HEADS = 1.33, 0.265, (1.00,0.94,1.02)
        TW_, SHW = (0.44 if not fem else 0.41), (0.50 if not fem else 0.455)
        THL, SHL, ARL, FRL = 0.30, 0.26, 0.26, 0.24
        AX, LX = (0.252 if not fem else 0.236), 0.105

    # 몸통
    hips  = box('hips', (TW_*0.95, 0.25, 0.20), (0,0,HPZ-0.03), BOT if not baby else TOP, taper=1.03, bev=0.024)
    torso = box('torso',(TW_, 0.26, SHZ-HPZ-0.12), (0,0,(HPZ+SHZ)/2-0.02), TOP,
                pivot=(0,0,HPZ), taper=1.05, bev=0.026)
    shdr  = box('shdr', (SHW, 0.275, 0.145), (0,0,SHZ+0.01), TOP, pivot=(0,0,HPZ), taper=0.86, bev=0.028)
    attach(torso, hips); attach(shdr, torso)
    for sx in (-1,1):
        c = ball(f'cap{sx}', 0.078, (sx*(SHW*0.49), 0, SHZ+0.025), TOP, (1.05,1.02,0.66)); attach(c, shdr)

    # 옷 디테일
    if fem:
        cl_l = box('cl_l',(0.115,0.135,0.062),(-0.058,-0.056,NKZ+0.012), TOP2, bev=0.008); attach(cl_l, shdr)
        cl_r = box('cl_r',(0.115,0.135,0.062),( 0.058,-0.056,NKZ+0.012), TOP2, bev=0.008); attach(cl_r, shdr)
        plk  = box('plk',(0.030,0.034,0.22),(0,-0.140,SHZ-0.17), TOP3, bev=0.006); attach(plk, torso)
        sash = box('sash',(TW_*1.04,0.27,0.070),(0,0,HPZ+0.08), ACC, bev=0.012); attach(sash, hips)
        bow  = box('bow',(0.115,0.062,0.062),(-0.125,-0.142,HPZ+0.08), ACC, bev=0.015); attach(bow, hips)
        skirt= box('skirt',(0.56,0.40,0.34),(0,0,HPZ-0.14), BOT, pivot=(0,0,HPZ), taper=0.62, bev=0.020); attach(skirt, hips)
        hemr = box('hemr',(0.575,0.415,0.040),(0,0,HPZ-0.30), BOT2, bev=0.010); attach(hemr, skirt)
    elif baby:
        plk  = box('plk',(0.055,0.042,0.24),(0,-0.142,SHZ-0.18), TOP3, bev=0.007); attach(plk, torso)
        for i,z in enumerate((0.10, 0.20)):
            bt = ball(f'bt{i}',0.023,(0,-0.156,SHZ-0.30+z), TOP2); attach(bt, torso)
        bib  = box('bib',(0.24,0.045,0.14),(0,-0.150,SHZ-0.10), ACC, bev=0.014); attach(bib, torso)
        hem  = box('hem',(TW_*1.02,0.265,0.055),(0,0,HPZ-0.09), TOP3, bev=0.012); attach(hem, hips)
    else:
        cl_l = box('cl_l',(0.135,0.150,0.068),(-0.070,-0.058,NKZ+0.010), TOP2, bev=0.009); attach(cl_l, shdr)
        cl_r = box('cl_r',(0.135,0.150,0.068),( 0.070,-0.058,NKZ+0.010), TOP2, bev=0.009); attach(cl_r, shdr)
        plk  = box('plk',(0.050,0.042,0.20),(0,-0.140,SHZ-0.16), TOP3, bev=0.006); attach(plk, torso)
        for i,z in enumerate((0.06, 0.15)):
            bt = ball(f'bt{i}',0.020,(0,-0.154,SHZ-0.26+z), TOP2); attach(bt, torso)
        hem  = box('hem',(TW_*1.03,0.265,0.058),(0,0,HPZ+0.10), TOP3, bev=0.012); attach(hem, hips)
        belt = box('belt',(TW_*1.02,0.268,0.050),(0,0,HPZ+0.05), ACC, bev=0.011); attach(belt, hips)
        buck = box('buck',(0.068,0.040,0.050),(0,-0.138,HPZ+0.05), TOP2, bev=0.009); attach(buck, hips)

    # 옷 주름 — 얕게 파인 선이 덧칠 단계에서 손으로 그은 선이 됩니다
    for i, (fx, fz, fw) in enumerate([(-0.10, 0.34, 0.012), (0.12, 0.22, 0.010), (-0.04, 0.12, 0.011)]):
        fold = box(f'fold{i}', (fw, 0.030, (SHZ-HPZ)*0.34),
                   (fx*TW_, -0.132, HPZ + (SHZ-HPZ)*fz), TOP3,
                   lean=0.004, bev=0.004); attach(fold, torso)
    neck = cyl('neck', 0.064 if not baby else 0.074, 0.12, (0,0.010,NKZ-0.02), SKIN2); attach(neck, shdr)
    nsh  = cyl('nsh', 0.082 if not baby else 0.092, 0.035, (0,0.010,NKZ+0.03), SKIN2); attach(nsh, shdr)

    # 머리 — 크고 동글게
    head = ball('head', HEADR, (0,0,HEADZ), SKIN, HEADS, pivot=(0,0,NKZ))
    hy = HEADR*HEADS[1]                       # 얼굴 앞면 거리
    jaw  = ball('jaw', HEADR*0.80, (0,-0.022,HEADZ-0.075), SKIN, (1.0,0.98,0.78)); attach(jaw, head)
    chin = ball('chin',HEADR*0.44,(0,-0.050,HEADZ-0.125), SKIN, (1.0,0.94,0.70)); attach(chin, head)
    for sx in (-1,1):
        e = ball(f'ear{sx}', HEADR*0.175, (sx*HEADR*0.95, 0.006, HEADZ-0.050), SKIN, (0.50,0.90,1.18)); attach(e, head)

    # 팔
    arm_l = box('arm_l',(0.118,0.126,ARL),(-AX,0,SHZ-ARL/2), SKIN, pivot=(-AX,0,SHZ), taper=0.86, bev=0.022)
    arm_r = box('arm_r',(0.118,0.126,ARL),( AX,0,SHZ-ARL/2), SKIN, pivot=( AX,0,SHZ), taper=0.86, bev=0.022)
    sl = ARL*(0.62 if not fem else 0.50)
    SLM = TOP if not fem else TOP2
    for o, sx in ((arm_l,-1), (arm_r,1)):
        s = box(f'slv{sx}',(0.155,0.165,sl),(sx*AX,0,SHZ-sl/2+0.012), SLM, pivot=(sx*AX,0,SHZ), taper=0.93, bev=0.024); attach(s, o)
        c = box(f'cuf{sx}',(0.160,0.170,0.028),(sx*AX,0,SHZ-sl+0.012), TOP3, bev=0.009); attach(c, o)
    ELB = SHZ - ARL
    fore_l= box('fore_l',(0.102,0.110,FRL),(-AX,0,ELB-FRL/2), SKIN, pivot=(-AX,0,ELB), taper=0.92, bev=0.020); attach(fore_l, arm_l)
    fore_r= box('fore_r',(0.102,0.110,FRL),( AX,0,ELB-FRL/2), SKIN, pivot=( AX,0,ELB), taper=0.92, bev=0.020); attach(fore_r, arm_r)
    WZ = ELB - FRL
    for o, sx in ((fore_l,-1), (fore_r,1)):
        h = box(f'hand{sx}',(0.104,0.124,0.105),(sx*AX,-0.006,WZ-0.048), SKIN, bev=0.030, round_top=0.12); attach(h, o)
        t = box(f'thb{sx}',(0.034,0.046,0.058),(sx*(AX-0.056),-0.028,WZ-0.030), SKIN, bev=0.015); attach(t, o)
        for fi in (-1, 1):                                  # 손가락 마디
            fg = box(f'fg{sx}{fi}',(0.030,0.044,0.050),
                     (sx*AX + fi*0.026, -0.012, WZ-0.112), SKIN, bev=0.013); attach(fg, o)

    # 다리
    legM = BOT if (not fem and not baby) else SKIN
    thw = 0.152 if not baby else 0.158
    leg_l = box('leg_l',(thw,thw*1.07,THL),(-LX,0,HPZ-THL/2), legM, pivot=(-LX,0,HPZ), taper=0.86, bev=0.022)
    leg_r = box('leg_r',(thw,thw*1.07,THL),( LX,0,HPZ-THL/2), legM, pivot=( LX,0,HPZ), taper=0.86, bev=0.022)
    if baby:
        for o, sx in ((leg_l,-1), (leg_r,1)):
            s = box(f'sht{sx}',(0.184,0.194,0.13),(sx*LX,0,HPZ-0.065), TOP, pivot=(sx*LX,0,HPZ), bev=0.022); attach(s, o)
    KN = HPZ - THL
    shw = thw*0.86
    shin_l= box('shin_l',(shw,shw*1.07,SHL),(-LX,0,KN-SHL/2), legM, pivot=(-LX,0,KN), taper=0.90, bev=0.020); attach(shin_l, leg_l)
    shin_r= box('shin_r',(shw,shw*1.07,SHL),( LX,0,KN-SHL/2), legM, pivot=( LX,0,KN), taper=0.90, bev=0.020); attach(shin_r, leg_r)
    sole = mat('sole', tuple(min(1, c*1.45+0.10) for c in C['shoe']), 0.68)
    for o, sx in ((shin_l,-1), (shin_r,1)):
        sh = box(f'shoe{sx}',(0.150,0.235,0.090),(sx*LX,-0.036,0.048), SHOE, bev=0.030, round_top=0.14); attach(sh, o)
        so = box(f'sol{sx}',(0.156,0.244,0.028),(sx*LX,-0.036,0.014), sole, bev=0.011); attach(so, o)
        if not fem and not baby:
            pc = box(f'pc{sx}',(thw*0.90,thw*0.98,0.048),(sx*LX,0,0.072), BOT2, bev=0.011); attach(pc, o)

    parts += [hips, head, arm_l, arm_r, leg_l, leg_r]

    # ---------- 머리카락 ----------
    HT = HEADZ + HEADR*HEADS[2]            # 정수리
    hair_objs = []
    hs = C['hairstyle']
    capY = hy + 0.014                      # 얼굴보다 아주 조금만 크게 → 이마선에서 끊김
    capR = HEADR*HEADS[0] + 0.014
    if hs == 'swept':
        capZ = HEADZ + HEADR*0.52
        c = ball('cap', capR, (0,0.010,capZ), HAIR, (1.0, capY/capR, (HT+0.052-capZ)/capR)); hair_objs.append(c)
        hair_objs.append(ball('bk', HEADR*0.98, (0,0.060,HEADZ+0.070), HAIR, (0.99,0.86,0.76)))
        hair_objs.append(box('fr',(HEADR*1.66,HEADR*0.80,0.100),(0.020,-hy*0.66,HEADZ+HEADR*0.60), HAIR, lean=-0.040, bev=0.020))
        hair_objs.append(box('fr2',(HEADR*0.76,HEADR*0.62,0.080),(-HEADR*0.52,-hy*0.74,HEADZ+HEADR*0.47), HAIR2, lean=-0.032, bev=0.016))
        hair_objs.append(box('sw',(HEADR*0.56,HEADR*0.66,0.062),(HEADR*0.62,-hy*0.50,HEADZ+HEADR*0.80), HAIR2, bev=0.016))
        for sx in (-1,1):
            hair_objs.append(box(f'sb{sx}',(0.040,HEADR*0.52,HEADR*0.56),(sx*HEADR*0.90,-0.006,HEADZ-0.025), HAIR, bev=0.012))
        hair_objs.append(box('nape',(HEADR*1.10,0.088,HEADR*0.64),(0,HEADR*0.80,HEADZ-0.095), HAIR, bev=0.016))
    elif hs == 'ponytail':
        capZ = HEADZ + HEADR*0.50
        c = ball('cap', capR, (0,0.008,capZ), HAIR, (1.0, capY/capR, (HT+0.055-capZ)/capR)); hair_objs.append(c)
        hair_objs.append(ball('bk', HEADR*1.00, (0,0.056,HEADZ+0.064), HAIR, (0.99,0.88,0.78)))
        hair_objs.append(box('fr',(HEADR*1.74,HEADR*0.76,0.118),(0,-hy*0.66,HEADZ+HEADR*0.56), HAIR, lean=-0.044, bev=0.020))
        for sx in (-1,1):
            hair_objs.append(box(f'pt{sx}',(HEADR*0.42,HEADR*0.60,0.082),(sx*HEADR*0.60,-hy*0.74,HEADZ+HEADR*0.52), HAIR2, bev=0.016))
            hair_objs.append(box(f'sd{sx}',(0.070,HEADR*0.72,HEADR*1.62),(sx*HEADR*0.92,0.012,HEADZ-HEADR*0.52), HAIR, taper=1.10, bev=0.016))
        hair_objs.append(ball('knot', 0.072, (0,HEADR*0.96,HEADZ+0.040), HAIR))
        hair_objs.append(cyl('tie', 0.066, 0.042, (0,HEADR*0.96,HEADZ-0.006), ACC, rot=(math.radians(90),0,0)))
        hair_objs.append(box('tl1',(0.128,0.165,0.30),(0,HEADR*1.06,HEADZ-0.185), HAIR, taper=0.80, lean=0.046, bev=0.018))
        hair_objs.append(box('tl2',(0.100,0.128,0.20),(0,HEADR*1.20,HEADZ-0.385), HAIR2, taper=0.55, lean=0.036, bev=0.014))
    else:   # fuzz
        capZ = HEADZ + HEADR*0.40
        c = ball('cap', capR, (0,0.008,capZ), HAIR, (1.0, capY/capR, (HT+0.048-capZ)/capR)); hair_objs.append(c)
        hair_objs.append(ball('bk', HEADR*1.02, (0,0.058,HEADZ+0.074), HAIR, (0.99,0.86,0.70)))
        hair_objs.append(box('fr',(HEADR*1.62,HEADR*0.74,0.090),(0,-hy*0.70,HEADZ+HEADR*0.52), HAIR, lean=-0.036, bev=0.020))
        hair_objs.append(box('curl',(0.050,0.050,0.082),(0.026,0.016,HT+0.046), HAIR, lean=0.040, taper=0.6, bev=0.014))
        hair_objs.append(ball('curl2',0.034,(0.044,0.024,HT+0.094), HAIR2))
        for sx in (-1,1):
            hair_objs.append(box(f'sb{sx}',(0.042,HEADR*0.50,HEADR*0.40),(sx*HEADR*0.96,-0.006,HEADZ-0.030), HAIR, bev=0.012))
    # 가닥 몇 개를 삐죽 내어 실루엣을 깨요 (덩어리로 안 보이게)
    import random as _r
    _r.seed({'man': 3, 'woman': 7, 'baby': 11}[b])
    for i in range(5):
        ang = _r.uniform(0, 6.283)
        rr = HEADR * _r.uniform(0.45, 0.92)
        zz = HEADZ + HEADR * _r.uniform(0.30, 0.74)
        hair_objs.append(box(f'wisp{i}',
            (0.034, 0.040, HEADR*_r.uniform(0.26, 0.46)),
            (math.cos(ang)*rr, math.sin(ang)*rr*0.85, zz), HAIR2,
            lean=_r.uniform(-0.03, 0.03), taper=0.55, bev=0.010))
    for o in hair_objs: attach(o, head)
    parts += hair_objs

    # ---------- 얼굴 — 큰 눈 ----------
    eyeR = HEADR * (0.275 if not baby else 0.300)
    eyeX = HEADR * 0.415
    eyeZ = HEADZ - HEADR*0.175
    eyeY = -hy + 0.012
    face = []
    for sx in (-1,1):
        # 흰자 테두리를 없앴어요 — 작게 줄이면 고글처럼 보이거든요.
        # 짙은 눈 + 반짝이 하나 + 아래쪽 홍채빛. 이게 거상·도트 게임의 귀여운 눈입니다.
        face.append(ball(f'ep{sx}', eyeR, (sx*eyeX, eyeY+0.012, eyeZ), EYE, (1.0,0.26,1.06)))
        face.append(ball(f'ei{sx}', eyeR*0.52, (sx*eyeX, eyeY-0.004, eyeZ-eyeR*0.34), IRIS, (1.0,0.22,0.64)))
        face.append(ball(f'eg{sx}', eyeR*0.34, (sx*eyeX-eyeR*0.30, eyeY-0.014, eyeZ+eyeR*0.40), WHITE))
        face.append(ball(f'eg2{sx}', eyeR*0.16, (sx*eyeX+eyeR*0.34, eyeY-0.010, eyeZ-eyeR*0.46), WHITE))
        face.append(box(f'br{sx}', (eyeR*1.55, 0.024, 0.018), (sx*eyeX, eyeY+0.034, eyeZ+eyeR*2.05), HAIR2, lean=-0.004, bev=0.004))
        face.append(ball(f'bl{sx}', eyeR*0.60, (sx*HEADR*0.88, eyeY+0.052, eyeZ-eyeR*1.40), BLUSH, (1.22,0.18,0.48)))
    face.append(ball('nose', eyeR*0.24, (0, eyeY-0.006, eyeZ-eyeR*0.78), SKIN2, (1.0,0.9,0.8)))
    face.append(box('mouth', (eyeR*0.72, 0.024, 0.016), (0, eyeY+0.014, eyeZ-eyeR*1.28), MOUTH, bev=0.005))
    for o in face: attach(o, head)
    parts += face

    for o in parts:
        if o.parent is None: attach(o, root)
    root.scale = (C['scale'],)*3
    P.update(root=root, head=head, torso=torso,
             arm_l=arm_l, arm_r=arm_r, fore_l=fore_l, fore_r=fore_r,
             leg_l=leg_l, leg_r=leg_r, shin_l=shin_l, shin_r=shin_r)
    return P

# ---------- 포즈 ----------
def pose(P, anim, f, n):
    root, head, torso = P['root'], P['head'], P['torso']
    al, ar, fl, fr = P['arm_l'], P['arm_r'], P['fore_l'], P['fore_r']
    ll, lr, sl, sr = P['leg_l'], P['leg_r'], P['shin_l'], P['shin_r']
    for o in (al, ar, fl, fr, ll, lr, sl, sr, torso, head): o.rotation_euler = (0,0,0)
    root.location = (0,0,0); root.rotation_euler.x = 0; root.rotation_euler.y = 0
    t = f / n * math.tau

    if anim == 'walk':
        sw = math.sin(t) * 0.52
        ll.rotation_euler = (sw, 0, 0.03); lr.rotation_euler = (-sw, 0, -0.03)
        sl.rotation_euler = (max(0.0, -math.sin(t - 0.75)) * 0.76 + 0.06, 0, 0)
        sr.rotation_euler = (max(0.0,  math.sin(t - 0.75)) * 0.76 + 0.06, 0, 0)
        al.rotation_euler = (-sw*0.78, 0, 0.11); ar.rotation_euler = (sw*0.78, 0, -0.11)
        fl.rotation_euler = (-0.34 - max(0.0, -sw)*0.48, 0, 0)
        fr.rotation_euler = (-0.34 - max(0.0,  sw)*0.48, 0, 0)
        root.location.z = abs(math.sin(t)) * 0.040
        torso.rotation_euler = (0, 0, math.sin(t)*0.085)
        head.rotation_euler = (math.sin(t*2)*0.030, 0, -math.sin(t)*0.060)

    elif anim == 'idle':
        br = math.sin(t) * 0.045
        root.location.z = br * 0.40
        al.rotation_euler = ( br*0.36, 0,  0.125 + br*0.11)
        ar.rotation_euler = (-br*0.36, 0, -0.125 - br*0.11)
        fl.rotation_euler = (-0.30 - br*0.32, 0, 0); fr.rotation_euler = (-0.30 + br*0.32, 0, 0)
        sl.rotation_euler = (0.05, 0, 0); sr.rotation_euler = (0.05, 0, 0)
        torso.rotation_euler = (0, 0, br*0.44)
        head.rotation_euler = (br*0.22, 0, -br*0.58)

    elif anim == 'attack':
        k = f / (n - 1)
        wind = math.sin(min(1, k*1.55) * math.pi * 0.5)
        swing = 0 if k < 0.42 else (k - 0.42) / 0.58
        ar.rotation_euler = (-2.35*wind + 3.2*swing, 0, 0.36*wind - 0.22*swing)
        fr.rotation_euler = (-1.30*wind + 1.10*swing, 0, 0)
        al.rotation_euler = (0.60*wind - 0.32*swing, 0, -0.28*wind)
        fl.rotation_euler = (-0.80 - 0.36*wind, 0, 0)
        torso.rotation_euler = (0, 0, -0.44*wind + 0.50*swing)
        head.rotation_euler = (0.06*swing, 0, -0.16*wind + 0.20*swing)
        root.location.y = -0.06*wind + 0.09*swing
        ll.rotation_euler = (0.24*wind - 0.18*swing, 0, 0); sl.rotation_euler = (0.20, 0, 0)
        lr.rotation_euler = (-0.26*wind + 0.32*swing, 0, 0); sr.rotation_euler = (0.32*swing + 0.08, 0, 0)

    elif anim == 'hurt':
        k = f / (n - 1); g = 1 - k
        torso.rotation_euler = (-0.28*g, 0, 0); head.rotation_euler = (-0.38*g, 0, 0.07*g)
        al.rotation_euler = (0.66*g, 0, -0.32*g); ar.rotation_euler = (0.66*g, 0, 0.32*g)
        fl.rotation_euler = (-1.05*g, 0, 0); fr.rotation_euler = (-1.05*g, 0, 0)
        ll.rotation_euler = (-0.20*g, 0, 0); lr.rotation_euler = (0.13*g, 0, 0)
        sl.rotation_euler = (0.32*g, 0, 0); sr.rotation_euler = (0.13*g, 0, 0)
        root.location.y = 0.09*g; root.location.z = 0.025*g

    elif anim == 'down':
        k = f / (n - 1); e = k*k*(3 - 2*k)
        root.rotation_euler.x = -math.radians(80)*e
        root.location.z = -0.20*e
        al.rotation_euler = (0.74*e, 0, -0.38*e); ar.rotation_euler = (0.88*e, 0, 0.32*e)
        fl.rotation_euler = (-0.58*e, 0, 0); fr.rotation_euler = (-0.42*e, 0, 0)
        ll.rotation_euler = (-0.36*e, 0, 0); lr.rotation_euler = (-0.20*e, 0, 0)
        sl.rotation_euler = (0.58*e, 0, 0); sr.rotation_euler = (0.32*e, 0, 0)
        head.rotation_euler = (0.26*e, 0, 0)

# ---------- 장면 ----------
def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 3
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'

    bpy.ops.object.light_add(type='SUN'); k = bpy.context.object
    k.data.energy = 3.0; k.data.angle = 0.30; k.data.color = (1.0,0.97,0.90)
    k.rotation_euler = (math.radians(48), 0, math.radians(-36))
    bpy.ops.object.light_add(type='SUN'); fi = bpy.context.object
    fi.data.energy = 1.10; fi.data.color = (0.74,0.83,1.0)
    fi.rotation_euler = (math.radians(68), 0, math.radians(142))
    bpy.ops.object.light_add(type='SUN'); ri = bpy.context.object
    ri.data.energy = 1.6; ri.data.color = (1.0,0.90,0.74)
    ri.rotation_euler = (math.radians(104), 0, math.radians(196))
    bpy.ops.object.light_add(type='SUN'); bo = bpy.context.object
    bo.data.energy = 0.50; bo.data.color = (0.90,0.86,0.70)
    bo.rotation_euler = (math.radians(-24), 0, 0)

    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.56,0.58,0.64,1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.44

    bpy.ops.object.camera_add(); cam = bpy.context.object
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = ORTHO; sc.camera = cam
    el = math.radians(ELEV); d = 16.0
    cam.location = (0, -d*math.cos(el), d*math.sin(el) + HOFF)
    cam.rotation_euler = (math.radians(90) - el, 0, 0)
    return sc

# 바닥(z=0)이 포장 후 아래에서 몇 px 위인지
FOOT = round((H/2 - HOFF*math.cos(math.radians(ELEV))*(max(W, H)/ORTHO)) / SS)

os.makedirs(OUT, exist_ok=True)
only = None
if ONLY:
    p = ONLY.split(':'); only = (p[0], p[1], int(p[2]), int(p[3]))

meta = {'_foot': FOOT, '_w': PW, '_h': PH}
ALL = list(CHARS.keys()) + list(ANIMALS.keys())
for key in ALL:
    if only and key != only[0]: continue
    sc = setup_scene()
    animal = key in ANIMALS
    P = build_animal(key) if animal else build(key)
    anims = ANIM_SETS.get(key, ANIMS)
    meta[key] = dict(anims)
    for anim, n in anims.items():
        if only and anim != only[1]: continue
        for d in range(DIRS):
            if only and d != only[2]: continue
            for f in range(n):
                if only and f != only[3]: continue
                (pose_animal if animal else pose)(P, anim, f, n)
                P['root'].rotation_euler.z = math.radians(d * (360 / DIRS))
                bpy.context.view_layer.update()
                sc.render.filepath = f'{OUT}/{key}_{anim}_d{d}_f{f:02d}.png'
                bpy.ops.render.render(write_still=True)
        print(f'{key} {anim} done', flush=True)
if not only:
    json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('ALL DONE foot=', FOOT)
