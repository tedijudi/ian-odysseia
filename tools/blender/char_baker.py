"""거상풍 캐릭터 베이커 v2 — 관절·의상 레이어·베벨을 넣어 '로블록스 느낌'을 지웁니다."""
import bpy, math, os, sys, json
from mathutils import Vector, Matrix

OUT = '/home/claude/bake4/raw'
SS  = 3                      # 슈퍼샘플 배율 (렌더 → 다운샘플)
W, H = 108 * SS, 144 * SS
DIRS = 8
ELEV = 30.0
SAMPLES = int(os.environ.get('BK_SAMPLES', '26'))
ONLY = os.environ.get('BK_ONLY', '')      # 테스트용: 'dad:idle:0:0'

# ---------- 캐릭터 정의 ----------
CHARS = {
 'dad': dict(scale=1.00, skin=(0.92,0.72,0.58), skin2=(0.80,0.60,0.47),
             hair=(0.08,0.062,0.07), hair2=(0.16,0.12,0.13),
             top=(0.13,0.31,0.63), top2=(0.20,0.42,0.76), top3=(0.08,0.21,0.46),
             bottom=(0.17,0.18,0.27), bottom2=(0.23,0.24,0.34),
             shoe=(0.07,0.07,0.10), accent=(0.26,0.17,0.12),
             hairstyle='swept', outfit='polo', build='man'),
 'mom': dict(scale=0.945, skin=(0.96,0.80,0.70), skin2=(0.86,0.69,0.60),
             hair=(0.07,0.055,0.065), hair2=(0.15,0.11,0.12),
             top=(0.94,0.92,0.87), top2=(1.00,0.99,0.95), top3=(0.80,0.77,0.73),
             bottom=(0.47,0.52,0.63), bottom2=(0.56,0.61,0.72),
             shoe=(0.88,0.85,0.80), accent=(0.84,0.60,0.66),
             hairstyle='ponytail', outfit='blouse_skirt', build='woman'),
 'ian': dict(scale=0.72, skin=(0.99,0.85,0.77), skin2=(0.92,0.74,0.66),
             hair=(0.42,0.30,0.22), hair2=(0.54,0.40,0.29),
             top=(1.00,0.83,0.32), top2=(1.00,0.91,0.52), top3=(0.86,0.66,0.20),
             bottom=(0.80,0.76,0.68), bottom2=(0.88,0.85,0.78),
             shoe=(0.98,0.97,0.95), accent=(1.00,0.95,0.70),
             hairstyle='fuzz', outfit='romper', build='baby'),
}

ANIMS = {'idle':4, 'walk':8, 'attack':6, 'hurt':3, 'down':4}

# ---------- 재질 ----------
def mat(name, color, rough=0.78, spec=0.10):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    try: b.inputs['Specular IOR Level'].default_value = spec
    except Exception: pass
    return m

def _smooth(o, ang=38):
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(ang))
    except Exception:
        try: bpy.ops.object.shade_smooth()
        except Exception: pass

def _bevel(o, w=0.016, segs=2):
    md = o.modifiers.new('bev', 'BEVEL')
    md.width = w; md.segments = segs; md.limit_method = 'ANGLE'
    md.angle_limit = math.radians(32); md.harden_normals = False

# size=(x,y,z) 전체 크기. taper: 윗면 폭 배율. lean: 윗면을 +Y로 미는 양.
def box(name, size, center, material, pivot=None, taper=1.0, lean=0.0,
        bev=0.016, segs=2, round_top=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
    o = bpy.context.object; o.name = name
    me = o.data
    if taper != 1.0 or lean != 0.0 or round_top:
        for v in me.vertices:
            t = v.co.z + 0.5                       # 0 아래 ~ 1 위
            s = 1 + (taper - 1) * t
            v.co.x *= s; v.co.y *= s
            v.co.y += lean * t
            if round_top and t > 0.5:
                v.co.x *= 1 - round_top; v.co.y *= 1 - round_top
    o.scale = Vector(size); bpy.ops.object.transform_apply(scale=True)
    p = Vector(pivot) if pivot else Vector(center)
    me.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    me.materials.append(material)
    if bev: _bevel(o, bev, segs)
    _smooth(o)
    return o

def ball(name, r, center, material, scale=(1,1,1), pivot=None, seg=22, ring=14):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring, location=(0,0,0))
    o = bpy.context.object; o.name = name
    o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    p = Vector(pivot) if pivot else Vector(center)
    o.data.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    o.data.materials.append(material); bpy.ops.object.shade_smooth()
    return o

def cyl(name, r, h, center, material, material_rot=(0,0,0), pivot=None, verts=16, bev=0.010):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=(0,0,0))
    o = bpy.context.object; o.name = name
    o.rotation_euler = material_rot; bpy.ops.object.transform_apply(rotation=True)
    p = Vector(pivot) if pivot else Vector(center)
    o.data.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    o.data.materials.append(material)
    if bev: _bevel(o, bev, 1)
    _smooth(o, 46)
    return o

def attach(c, p):
    bpy.context.view_layer.update()
    c.parent = p; c.matrix_parent_inverse = p.matrix_world.inverted()

# ---------- 조립 ----------
def build(key):
    C = CHARS[key]
    SKIN  = mat('skin',  C['skin'],  0.70)
    SKIN2 = mat('skin2', C['skin2'], 0.72)
    HAIR  = mat('hair',  C['hair'],  0.58, 0.22)
    HAIR2 = mat('hair2', C['hair2'], 0.52, 0.30)
    TOP   = mat('top',   C['top'],   0.86)
    TOP2  = mat('top2',  C['top2'],  0.84)
    TOP3  = mat('top3',  C['top3'],  0.88)
    BOT   = mat('bot',   C['bottom'],0.88)
    BOT2  = mat('bot2',  C['bottom2'],0.86)
    SHOE  = mat('shoe',  C['shoe'],  0.60, 0.20)
    ACC   = mat('acc',   C['accent'],0.74)
    EYE   = mat('eye',   (0.06,0.05,0.07), 0.30, 0.40)
    WHITE = mat('wht',   (0.97,0.96,0.95), 0.45)
    MOUTH = mat('mouth', (0.56,0.26,0.28), 0.62)
    BLUSH = mat('blush', (0.96,0.64,0.60) if C['build']=='baby' else tuple(min(1,c*0.90+0.10) for c in C['skin']), 0.82)

    root = bpy.data.objects.new('root', None); bpy.context.collection.objects.link(root)
    parts = []; P = {}
    b = C['build']

    # ========== 아기 ==========
    if b == 'baby':
        HPZ, SHZ = 0.40, 0.86
        hips  = box('hips',  (0.44,0.32,0.28), (0,0,0.40), TOP, taper=0.96, bev=0.030)
        torso = box('torso', (0.47,0.325,0.46), (0,0,0.70), TOP, pivot=(0,0,HPZ), taper=1.05, bev=0.030)
        placket = box('plk', (0.07,0.05,0.30), (0,-0.155,0.72), TOP3, bev=0.008); attach(placket, torso)
        btn1 = ball('btn1', 0.026, (0,-0.175,0.80), TOP2); attach(btn1, torso)
        btn2 = ball('btn2', 0.026, (0,-0.175,0.66), TOP2); attach(btn2, torso)
        frill = box('frill',(0.468,0.325,0.065), (0,0,0.925), TOP2, pivot=(0,0,HPZ), taper=0.94, bev=0.018)
        attach(frill, torso)
        hem   = box('hem',  (0.455,0.332,0.06), (0,0,0.295), TOP3, bev=0.016); attach(hem, hips)
        bib   = box('bib',  (0.26,0.05,0.17), (0,-0.158,0.845), ACC, bev=0.014); attach(bib, torso)
        neck  = cyl('neck', 0.082, 0.10, (0,0,0.96), SKIN2)
        head  = ball('head', 0.335, (0,0,1.21), SKIN, (1.0,0.93,1.00), pivot=(0,0,0.97))
        cheek = ball('cheek',0.30, (0,-0.035,1.14), SKIN, (1.03,0.86,0.72)); attach(cheek, head)
        chin  = ball('chin', 0.17, (0,-0.075,1.03), SKIN, (1.0,0.80,0.62)); attach(chin, head)
        ear_l = ball('ear_l',0.072,(-0.315,0.00,1.19), SKIN,(0.52,0.94,1.12)); attach(ear_l, head)
        ear_r = ball('ear_r',0.072,( 0.315,0.00,1.19), SKIN,(0.52,0.94,1.12)); attach(ear_r, head)

        arm_l = box('arm_l',(0.142,0.152,0.26), (-0.288,0,0.74), SKIN, pivot=(-0.288,0,SHZ), taper=0.92, bev=0.028)
        arm_r = box('arm_r',(0.142,0.152,0.26), ( 0.288,0,0.74), SKIN, pivot=( 0.288,0,SHZ), taper=0.92, bev=0.028)
        slv_l = box('slv_l',(0.172,0.182,0.175), (-0.288,0,0.808), TOP, pivot=(-0.288,0,SHZ), bev=0.022); attach(slv_l, arm_l)
        scp_l = ball('scp_l',0.092,(-0.286,0,0.872), TOP,(1.0,1.0,0.70)); attach(scp_l, arm_l)
        slv_r = box('slv_r',(0.172,0.182,0.175), ( 0.288,0,0.808), TOP, pivot=( 0.288,0,SHZ), bev=0.022); attach(slv_r, arm_r)
        scp_r = ball('scp_r',0.092,( 0.286,0,0.872), TOP,(1.0,1.0,0.70)); attach(scp_r, arm_r)
        fore_l= box('fore_l',(0.126,0.136,0.24),(-0.288,0,0.49), SKIN, pivot=(-0.288,0,0.61), taper=0.94, bev=0.026); attach(fore_l, arm_l)
        fore_r= box('fore_r',(0.126,0.136,0.24),( 0.288,0,0.49), SKIN, pivot=( 0.288,0,0.61), taper=0.94, bev=0.026); attach(fore_r, arm_r)
        hand_l= ball('hand_l',0.086,(-0.288,-0.005,0.345),SKIN,(1,1.05,1.0)); attach(hand_l, fore_l)
        hand_r= ball('hand_r',0.086,( 0.288,-0.005,0.345),SKIN,(1,1.05,1.0)); attach(hand_r, fore_r)

        leg_l = box('leg_l',(0.165,0.175,0.24), (-0.125,0,0.28), SKIN, pivot=(-0.125,0,HPZ), taper=0.92, bev=0.028)
        leg_r = box('leg_r',(0.165,0.175,0.24), ( 0.125,0,0.28), SKIN, pivot=( 0.125,0,HPZ), taper=0.92, bev=0.028)
        sht_l = box('sht_l',(0.195,0.205,0.13), (-0.125,0,0.345), TOP, pivot=(-0.125,0,HPZ), bev=0.022); attach(sht_l, leg_l)
        sht_r = box('sht_r',(0.195,0.205,0.13), ( 0.125,0,0.345), TOP, pivot=( 0.125,0,HPZ), bev=0.022); attach(sht_r, leg_r)
        shin_l= box('shin_l',(0.145,0.155,0.22),(-0.125,0,0.05), SKIN, pivot=(-0.125,0,0.16), taper=0.96, bev=0.026); attach(shin_l, leg_l)
        shin_r= box('shin_r',(0.145,0.155,0.22),( 0.125,0,0.05), SKIN, pivot=( 0.125,0,0.16), taper=0.96, bev=0.026); attach(shin_r, leg_r)
        sock_l= box('sock_l',(0.162,0.172,0.10),(-0.125,0,0.00), SHOE, bev=0.022); attach(sock_l, shin_l)
        sock_r= box('sock_r',(0.162,0.172,0.10),( 0.125,0,0.00), SHOE, bev=0.022); attach(sock_r, shin_r)
        foot_l= box('foot_l',(0.155,0.22,0.085),(-0.125,-0.040,-0.045),SHOE, bev=0.030); attach(foot_l, shin_l)
        foot_r= box('foot_r',(0.155,0.22,0.085),( 0.125,-0.040,-0.045),SHOE, bev=0.030); attach(foot_r, shin_r)

        parts += [hips,torso,frill,neck,head,arm_l,arm_r,leg_l,leg_r]
        eyeZ, eyeY, eyeX, eyeR = 1.178, -0.296, 0.112, 0.048
        noseZ, mouthZ, browZ = 1.115, 1.045, 1.258
        blushX, blushZ = 0.205, 1.112
        P['hipsz'] = HPZ

    # ========== 어른 ==========
    else:
        fem = (b == 'woman')
        HPZ, SHZ = 0.96, 1.70
        pw = 0.415 if not fem else 0.405
        hips  = box('hips', (pw,0.255,0.26), (0,0,1.02), BOT, taper=1.04, bev=0.022)
        waist = box('waist',(pw*0.97,0.245,0.22),(0,0,1.22), TOP, pivot=(0,0,HPZ), taper=1.06, bev=0.022)
        chest = box('chest',(0.50 if not fem else 0.455,0.272,0.34),(0,0,1.50), TOP,
                    pivot=(0,0,HPZ), taper=1.08, bev=0.024)
        shdr  = box('shdr', (0.585 if not fem else 0.505,0.285,0.17),(0,0,1.675), TOP,
                    pivot=(0,0,HPZ), taper=0.86, bev=0.028)
        torso = chest
        attach(waist, hips); attach(chest, waist); attach(shdr, chest)

        # 어깨 둥글림
        if not fem:
            cap_l = ball('cap_l', 0.086, (-0.278,0,1.700), TOP,(1.05,1.02,0.62)); attach(cap_l, shdr)
            cap_r = ball('cap_r', 0.086, ( 0.278,0,1.700), TOP,(1.05,1.02,0.62)); attach(cap_r, shdr)

        # 옷 디테일
        if fem:
            bust = ball('bust', 0.092, (0,-0.118,1.545), TOP, (1.52,0.34,0.52)); attach(bust, chest)
            cl_l  = box('cl_l',(0.135,0.155,0.070),(-0.070,-0.058,1.768), TOP2, bev=0.009); attach(cl_l, shdr)
            cl_r  = box('cl_r',(0.135,0.155,0.070),( 0.070,-0.058,1.768), TOP2, bev=0.009); attach(cl_r, shdr)
            plk   = box('plk', (0.034,0.038,0.30),(0,-0.146,1.575), TOP3, bev=0.006); attach(plk, chest)
            pbt1  = ball('pbt1',0.019,(0,-0.158,1.645), TOP3); attach(pbt1, chest)
            pbt2  = ball('pbt2',0.019,(0,-0.158,1.560), TOP3); attach(pbt2, chest)
            sash  = box('sash',(0.44,0.27,0.075),(0,0,1.105), ACC, bev=0.014); attach(sash, hips)
            bow   = box('bow', (0.13,0.07,0.07),(-0.14,-0.145,1.105), ACC, bev=0.016); attach(bow, hips)
            skirt = box('skirt',(0.56,0.40,0.42),(0,0,0.88), BOT, pivot=(0,0,HPZ),
                        taper=0.70, bev=0.020); attach(skirt, hips)
            hemline= box('hemln',(0.575,0.415,0.045),(0,0,0.685), BOT2, bev=0.012); attach(hemline, skirt)
            parts += [bust]
        else:
            collar_l = box('col_l',(0.155,0.17,0.075),(-0.082,-0.062,1.788), TOP2, bev=0.010); attach(collar_l, shdr)
            collar_r = box('col_r',(0.155,0.17,0.075),( 0.082,-0.062,1.788), TOP2, bev=0.010); attach(collar_r, shdr)
            plk   = box('plk', (0.058,0.045,0.30),(0,-0.142,1.60), TOP3, bev=0.008); attach(plk, chest)
            btn1  = ball('btn1',0.022,(0,-0.158,1.665), TOP2); attach(btn1, chest)
            btn2  = ball('btn2',0.022,(0,-0.158,1.575), TOP2); attach(btn2, chest)
            hem   = box('hem', (pw*1.03,0.262,0.065),(0,0,1.115), TOP3, bev=0.012); attach(hem, hips)
            belt  = box('belt',(pw*1.02,0.265,0.055),(0,0,1.055), ACC, bev=0.012); attach(belt, hips)
            buck  = box('buck',(0.075,0.045,0.055),(0,-0.138,1.055), TOP2, bev=0.010); attach(buck, hips)
            pock_l= box('pk_l',(0.012,0.055,0.14),(-0.175,-0.122,0.96), BOT2, bev=0.006); attach(pock_l, hips)
            pock_r= box('pk_r',(0.012,0.055,0.14),( 0.175,-0.122,0.96), BOT2, bev=0.006); attach(pock_r, hips)

        neck  = cyl('neck', 0.070, 0.17, (0,0.012,1.825), SKIN2); attach(neck, shdr)
        head  = ball('head', 0.238, (0,0,2.075), SKIN, (1.0,0.95,1.10), pivot=(0,0,1.87))
        jaw   = ball('jaw',  0.182, (0,-0.028,1.988), SKIN, (1.0,0.98,0.80)); attach(jaw, head)
        chin  = ball('chin', 0.102, (0,-0.062,1.935), SKIN, (1.0,0.94,0.72)); attach(chin, head)
        ear_l = ball('ear_l',0.055,(-0.222,0.005,2.062), SKIN,(0.54,0.92,1.25)); attach(ear_l, head)
        ear_r = ball('ear_r',0.055,( 0.222,0.005,2.062), SKIN,(0.54,0.92,1.25)); attach(ear_r, head)

        ax = 0.283 if not fem else 0.263
        aw = 0.122 if not fem else 0.108
        arm_l = box('arm_l',(aw,aw*1.06,0.36),(-ax,0,1.53), SKIN, pivot=(-ax,0,SHZ), taper=0.86, bev=0.022)
        arm_r = box('arm_r',(aw,aw*1.06,0.36),( ax,0,1.53), SKIN, pivot=( ax,0,SHZ), taper=0.86, bev=0.022)
        sl = 0.22 if not fem else 0.175
        SLM = TOP if not fem else TOP2
        slv_l = box('slv_l',(aw*1.33,aw*1.40,sl),(-ax,0,SHZ-sl/2+0.022), SLM, pivot=(-ax,0,SHZ), taper=0.92, bev=0.024); attach(slv_l, arm_l)
        slv_r = box('slv_r',(aw*1.33,aw*1.40,sl),( ax,0,SHZ-sl/2+0.022), SLM, pivot=( ax,0,SHZ), taper=0.92, bev=0.024); attach(slv_r, arm_r)
        cuf_l = box('cuf_l',(aw*1.36,aw*1.43,0.035),(-ax,0,SHZ-sl+0.015), TOP3, bev=0.010); attach(cuf_l, arm_l)
        cuf_r = box('cuf_r',(aw*1.36,aw*1.43,0.035),( ax,0,SHZ-sl+0.015), TOP3, bev=0.010); attach(cuf_r, arm_r)
        elb   = SHZ - 0.36
        fore_l= box('fore_l',(aw*0.90,aw*0.96,0.34),(-ax,0,elb-0.17), SKIN, pivot=(-ax,0,elb), taper=0.92, bev=0.020); attach(fore_l, arm_l)
        fore_r= box('fore_r',(aw*0.90,aw*0.96,0.34),( ax,0,elb-0.17), SKIN, pivot=( ax,0,elb), taper=0.92, bev=0.020); attach(fore_r, arm_r)
        wz = elb - 0.34
        hand_l= box('hand_l',(aw*0.96,aw*1.22,0.145),(-ax,-0.006,wz-0.065), SKIN, bev=0.030, round_top=0.10); attach(hand_l, fore_l)
        hand_r= box('hand_r',(aw*0.96,aw*1.22,0.145),( ax,-0.006,wz-0.065), SKIN, bev=0.030, round_top=0.10); attach(hand_r, fore_r)
        thb_l = box('thb_l',(0.038,0.052,0.075),(-ax+0.062,-0.030,wz-0.040), SKIN, bev=0.016); attach(thb_l, fore_l)
        thb_r = box('thb_r',(0.038,0.052,0.075),( ax-0.062,-0.030,wz-0.040), SKIN, bev=0.016); attach(thb_r, fore_r)

        lx = 0.118
        legM = BOT if not fem else SKIN
        thw  = 0.172 if not fem else 0.162
        leg_l = box('leg_l',(thw,thw*1.08,0.48),(-lx,0,HPZ-0.24), legM, pivot=(-lx,0,HPZ), taper=0.86, bev=0.022)
        leg_r = box('leg_r',(thw,thw*1.08,0.48),( lx,0,HPZ-0.24), legM, pivot=( lx,0,HPZ), taper=0.86, bev=0.022)
        kn = HPZ - 0.48
        shw = thw*0.84
        shin_l= box('shin_l',(shw,shw*1.08,0.46),(-lx,0,kn-0.23), legM, pivot=(-lx,0,kn), taper=0.90, bev=0.020); attach(shin_l, leg_l)
        shin_r= box('shin_r',(shw,shw*1.08,0.46),( lx,0,kn-0.23), legM, pivot=( lx,0,kn), taper=0.90, bev=0.020); attach(shin_r, leg_r)
        if not fem:
            cuff_l= box('pc_l',(thw*0.90,thw*0.99,0.055),(-lx,0,0.075), BOT2, bev=0.012); attach(cuff_l, shin_l)
            cuff_r= box('pc_r',(thw*0.90,thw*0.99,0.055),( lx,0,0.075), BOT2, bev=0.012); attach(cuff_r, shin_r)
        sole  = mat('sole', tuple(min(1,c*1.5+0.08) for c in C['shoe']), 0.70)
        shoe_l= box('shoe_l',(0.165,0.275,0.095),(-lx,-0.042,0.052), SHOE, bev=0.032, round_top=0.14); attach(shoe_l, shin_l)
        shoe_r= box('shoe_r',(0.165,0.275,0.095),( lx,-0.042,0.052), SHOE, bev=0.032, round_top=0.14); attach(shoe_r, shin_r)
        sol_l = box('sol_l',(0.172,0.285,0.030),(-lx,-0.042,0.014), sole, bev=0.012); attach(sol_l, shin_l)
        sol_r = box('sol_r',(0.172,0.285,0.030),( lx,-0.042,0.014), sole, bev=0.012); attach(sol_r, shin_r)

        parts += [hips,waist,chest,shdr,neck,head,arm_l,arm_r,leg_l,leg_r]
        eyeZ, eyeY, eyeX, eyeR = 2.034, -0.214, 0.095, 0.043
        noseZ, mouthZ, browZ = 1.996, 1.950, 2.108
        blushX, blushZ = 0.160, 1.984

    # ---------- 머리 모양 ----------
    hs = C['hairstyle']
    hair_objs = []
    if hs == 'swept':
        # 정수리 캡은 이마선(눈썹) 위에서 끊기도록 Y반경을 머리보다 아주 조금만 크게
        cap = ball('cap', 0.250, (0,0.012,2.190), HAIR, (1.00,0.96,0.78)); hair_objs.append(cap)
        bk  = ball('bk',  0.242, (0,0.062,2.098), HAIR, (0.99,0.88,0.84)); hair_objs.append(bk)
        fr  = box('fringe',(0.430,0.200,0.105),(0.022,-0.138,2.172), HAIR, lean=-0.040, bev=0.020); hair_objs.append(fr)
        fr2 = box('fringe2',(0.195,0.155,0.080),(-0.135,-0.158,2.142), HAIR2, lean=-0.030, bev=0.016); hair_objs.append(fr2)
        sw  = box('swept',(0.145,0.165,0.060),(0.150,-0.112,2.212), HAIR2, bev=0.016); hair_objs.append(sw)
        sb_l= box('sb_l',(0.042,0.135,0.150),(-0.228,-0.008,2.038), HAIR, bev=0.012); hair_objs.append(sb_l)
        sb_r= box('sb_r',(0.042,0.135,0.150),( 0.228,-0.008,2.038), HAIR, bev=0.012); hair_objs.append(sb_r)
        nape= box('nape',(0.290,0.100,0.185),(0,0.188,1.972), HAIR, bev=0.016); hair_objs.append(nape)
    elif hs == 'ponytail':
        cap = ball('cap', 0.254, (0,0.010,2.188), HAIR, (1.01,0.97,0.80)); hair_objs.append(cap)
        bk  = ball('bk',  0.246, (0,0.058,2.094), HAIR, (1.00,0.90,0.86)); hair_objs.append(bk)
        fr  = box('fringe',(0.448,0.195,0.118),(0,-0.138,2.168), HAIR, lean=-0.044, bev=0.020); hair_objs.append(fr)
        pt_l= box('pt_l',(0.105,0.150,0.085),(-0.160,-0.142,2.162), HAIR2, bev=0.016); hair_objs.append(pt_l)
        pt_r= box('pt_r',(0.105,0.150,0.085),( 0.160,-0.142,2.162), HAIR2, bev=0.016); hair_objs.append(pt_r)
        sd_l= box('sd_l',(0.062,0.178,0.44),(-0.232,0.016,1.902), HAIR, taper=1.08, bev=0.016); hair_objs.append(sd_l)
        sd_r= box('sd_r',(0.062,0.178,0.44),( 0.232,0.016,1.902), HAIR, taper=1.08, bev=0.016); hair_objs.append(sd_r)
        knot= ball('knot',0.080,(0,0.242,2.050), HAIR, (1,1,1)); hair_objs.append(knot)
        tie = cyl('tie', 0.074, 0.045,(0,0.242,2.014), ACC, (math.radians(90),0,0)); hair_objs.append(tie)
        tl1 = box('tail1',(0.138,0.178,0.34),(0,0.270,1.860), HAIR, taper=0.80, lean=0.048, bev=0.018); hair_objs.append(tl1)
        tl2 = box('tail2',(0.108,0.138,0.23),(0,0.310,1.632), HAIR2, taper=0.55, lean=0.038, bev=0.014); hair_objs.append(tl2)
    elif hs == 'fuzz':
        cap = ball('cap', 0.340, (0,0.010,1.368), HAIR, (1.00,0.955,0.62)); hair_objs.append(cap)
        bk  = ball('bk',  0.338, (0,0.062,1.330), HAIR, (0.99,0.86,0.58)); hair_objs.append(bk)
        fr  = box('fringe',(0.445,0.205,0.108),(0,-0.182,1.322), HAIR, lean=-0.038, bev=0.020); hair_objs.append(fr)
        cl  = box('curl', (0.058,0.058,0.112),(0.030,0.020,1.588), HAIR, lean=0.045, taper=0.6, bev=0.016); hair_objs.append(cl)
        cl2 = ball('curl2',0.040,(0.050,0.028,1.640), HAIR2); hair_objs.append(cl2)
        sb_l= box('sb_l',(0.046,0.140,0.115),(-0.308,-0.008,1.238), HAIR, bev=0.012); hair_objs.append(sb_l)
        sb_r= box('sb_r',(0.046,0.140,0.115),( 0.308,-0.008,1.238), HAIR, bev=0.012); hair_objs.append(sb_r)
    for o in hair_objs: attach(o, head)
    parts += hair_objs

    # ---------- 얼굴 ----------
    face = []
    for sx in (-1, 1):
        w_ = ball(f'ew{sx}', eyeR*1.16, (sx*eyeX, eyeY+0.016, eyeZ), WHITE, (1.0,0.42,1.08)); face.append(w_)
        p_ = ball(f'ep{sx}', eyeR*0.76, (sx*eyeX, eyeY+0.008, eyeZ-0.002), EYE, (1.0,0.46,1.10)); face.append(p_)
        g_ = ball(f'eg{sx}', eyeR*0.24, (sx*eyeX-0.013, eyeY-0.004, eyeZ+0.016), WHITE); face.append(g_)
        br = box(f'br{sx}', (eyeR*2.30, 0.028, 0.020), (sx*eyeX, eyeY+0.024, eyeZ + eyeR*2.05),
                 HAIR2, lean=-0.004, bev=0.005); face.append(br)
        bl = ball(f'bl{sx}', eyeR*(1.45 if b=='baby' else 1.05), (sx*blushX, eyeY+0.050, blushZ), BLUSH, (1.3,0.26,0.62)); face.append(bl)
    nose = ball('nose', eyeR*0.62, (0, eyeY-0.012, noseZ), SKIN2, (0.95,0.95,0.80)); face.append(nose)
    mth  = box('mouth', (eyeR*1.85, 0.030, 0.020), (0, eyeY+0.012, mouthZ), MOUTH, bev=0.006); face.append(mth)
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
        sw = math.sin(t) * 0.46
        ll.rotation_euler = (sw, 0, 0.03); lr.rotation_euler = (-sw, 0, -0.03)
        sl.rotation_euler = (max(0.0, -math.sin(t - 0.75)) * 0.72 + 0.06, 0, 0)
        sr.rotation_euler = (max(0.0,  math.sin(t - 0.75)) * 0.72 + 0.06, 0, 0)
        al.rotation_euler = (-sw*0.72, 0, 0.10); ar.rotation_euler = (sw*0.72, 0, -0.10)
        fl.rotation_euler = (-0.30 - max(0.0, -sw)*0.45, 0, 0)
        fr.rotation_euler = (-0.30 - max(0.0,  sw)*0.45, 0, 0)
        root.location.z = abs(math.sin(t)) * 0.048
        torso.rotation_euler = (0, 0, math.sin(t)*0.075)
        head.rotation_euler = (math.sin(t*2)*0.02, 0, -math.sin(t)*0.055)

    elif anim == 'idle':
        br = math.sin(t) * 0.040
        root.location.z = br * 0.42
        al.rotation_euler = ( br*0.34, 0,  0.115 + br*0.10)
        ar.rotation_euler = (-br*0.34, 0, -0.115 - br*0.10)
        fl.rotation_euler = (-0.26 - br*0.30, 0, 0); fr.rotation_euler = (-0.26 + br*0.30, 0, 0)
        sl.rotation_euler = (0.045, 0, 0); sr.rotation_euler = (0.045, 0, 0)
        torso.rotation_euler = (0, 0, br*0.42)
        head.rotation_euler = (br*0.18, 0, -br*0.55)

    elif anim == 'attack':
        k = f / (n - 1)
        wind = math.sin(min(1, k*1.55) * math.pi * 0.5)
        swing = 0 if k < 0.42 else (k - 0.42) / 0.58
        a = -2.25*wind + 3.1*swing
        ar.rotation_euler = (a, 0, 0.34*wind - 0.20*swing)
        fr.rotation_euler = (-1.25*wind + 1.05*swing, 0, 0)
        al.rotation_euler = (0.58*wind - 0.30*swing, 0, -0.26*wind)
        fl.rotation_euler = (-0.75 - 0.35*wind, 0, 0)
        torso.rotation_euler = (0, 0, -0.42*wind + 0.46*swing)
        head.rotation_euler = (0.05*swing, 0, -0.15*wind + 0.18*swing)
        root.location.y = -0.07*wind + 0.10*swing
        ll.rotation_euler = (0.22*wind - 0.16*swing, 0, 0); sl.rotation_euler = (0.18, 0, 0)
        lr.rotation_euler = (-0.24*wind + 0.30*swing, 0, 0); sr.rotation_euler = (0.30*swing + 0.08, 0, 0)

    elif anim == 'hurt':
        k = f / (n - 1); g = 1 - k
        torso.rotation_euler = (-0.26*g, 0, 0); head.rotation_euler = (-0.34*g, 0, 0.06*g)
        al.rotation_euler = (0.62*g, 0, -0.30*g); ar.rotation_euler = (0.62*g, 0, 0.30*g)
        fl.rotation_euler = (-1.0*g, 0, 0); fr.rotation_euler = (-1.0*g, 0, 0)
        ll.rotation_euler = (-0.18*g, 0, 0); lr.rotation_euler = (0.12*g, 0, 0)
        sl.rotation_euler = (0.30*g, 0, 0); sr.rotation_euler = (0.12*g, 0, 0)
        root.location.y = 0.11*g; root.location.z = 0.03*g

    elif anim == 'down':
        k = f / (n - 1); e = k*k*(3 - 2*k)
        root.rotation_euler.x = -math.radians(80)*e
        root.location.z = -0.26*e
        al.rotation_euler = (0.70*e, 0, -0.36*e); ar.rotation_euler = (0.85*e, 0, 0.30*e)
        fl.rotation_euler = (-0.55*e, 0, 0); fr.rotation_euler = (-0.40*e, 0, 0)
        ll.rotation_euler = (-0.34*e, 0, 0); lr.rotation_euler = (-0.18*e, 0, 0)
        sl.rotation_euler = (0.55*e, 0, 0); sr.rotation_euler = (0.30*e, 0, 0)
        head.rotation_euler = (0.25*e, 0, 0)

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
    k.data.energy = 2.9; k.data.angle = 0.30
    k.rotation_euler = (math.radians(50), 0, math.radians(-38))
    bpy.ops.object.light_add(type='SUN'); fi = bpy.context.object
    fi.data.energy = 1.05; fi.data.color = (0.74,0.82,1.0)
    fi.rotation_euler = (math.radians(68), 0, math.radians(142))
    bpy.ops.object.light_add(type='SUN'); ri = bpy.context.object      # 림라이트
    ri.data.energy = 1.5; ri.data.color = (1.0,0.90,0.78)
    ri.rotation_euler = (math.radians(104), 0, math.radians(196))
    bpy.ops.object.light_add(type='SUN'); bo = bpy.context.object      # 바닥 반사
    bo.data.energy = 0.45; bo.data.color = (0.82,0.92,0.72)
    bo.rotation_euler = (math.radians(-22), 0, math.radians(0))

    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.52,0.56,0.66,1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.42

    bpy.ops.object.camera_add(); cam = bpy.context.object
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.78; sc.camera = cam
    el = math.radians(ELEV); d = 16.0
    cam.location = (0, -d*math.cos(el), d*math.sin(el) + 1.18)
    cam.rotation_euler = (math.radians(90) - el, 0, 0)
    return sc

# ---------- 실행 ----------
os.makedirs(OUT, exist_ok=True)
only = None
if ONLY:
    p = ONLY.split(':'); only = (p[0], p[1], int(p[2]), int(p[3]))

meta = {}
for key in CHARS:
    if only and key != only[0]: continue
    sc = setup_scene()
    P = build(key)
    meta[key] = {a: n for a, n in ANIMS.items()}
    for anim, n in ANIMS.items():
        if only and anim != only[1]: continue
        for d in range(DIRS):
            if only and d != only[2]: continue
            for f in range(n):
                if only and f != only[3]: continue
                pose(P, anim, f, n)
                P['root'].rotation_euler.z = math.radians(d * (360 / DIRS))
                bpy.context.view_layer.update()
                sc.render.filepath = f'{OUT}/{key}_{anim}_d{d}_f{f:02d}.png'
                bpy.ops.render.render(write_still=True)
        print(f'{key} {anim} done', flush=True)
if not only:
    json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('ALL DONE')
