"""오디세이아풍 그리스 소품 베이커 — 신전·흰회벽집·대리석 기둥·올리브·사이프러스.

크기 규약 (캐릭터와 원근감을 맞추기 위한 기준)
  · 한 칸(타일) = 1.23 units,  포장 후 가로 픽셀/units = 51.9
  · 어른 키 1.60 units = 화면 72px
  · 건물 한 채(3칸) = 3.69 units 폭 → 화면 192px
"""
import bpy, math, os, json, random
from mathutils import Vector

OUT = '/home/claude/bake6/raw'
os.makedirs(OUT, exist_ok=True)
SS = 3
UPU = 51.9                 # 포장 후 units 당 픽셀
TILE = 1.23
ELEV = 30.0
COS = math.cos(math.radians(ELEV))
SAMPLES = int(os.environ.get('BK_SAMPLES', '24'))
ONLY = set(filter(None, os.environ.get('BK_ONLY', '').split(',')))
random.seed(7)

# ---------- 색 ----------
MARBLE  = (0.90,0.88,0.83); MARBLE2 = (0.76,0.74,0.69); MARBLE3 = (0.97,0.96,0.93)
PLASTER = (0.95,0.92,0.86); PLASTER2= (0.84,0.80,0.73)
TERRA   = (0.62,0.27,0.16); TERRA2  = (0.46,0.18,0.11); TERRA3  = (0.76,0.38,0.22)
AEGEAN  = (0.14,0.40,0.62); AEGEAN2 = (0.09,0.28,0.46); AEGEAN3 = (0.26,0.56,0.76)
STONE   = (0.70,0.66,0.58); STONE2  = (0.57,0.53,0.46); STONE3  = (0.79,0.75,0.67)
WOOD    = (0.46,0.31,0.18); WOOD2   = (0.31,0.20,0.12)
BRONZE  = (0.58,0.42,0.20); GOLD    = (0.86,0.70,0.30)
OLIVE   = (0.47,0.55,0.37); OLIVE2  = (0.60,0.67,0.47); OLIVE3 = (0.36,0.43,0.28)
CYPR    = (0.17,0.32,0.22); CYPR2   = (0.24,0.41,0.27)
FIG     = (0.30,0.48,0.24); FIG2    = (0.40,0.58,0.30)
DRY     = (0.76,0.68,0.40); DRY2    = (0.66,0.58,0.33)

_n = [0]
def mat(c, rough=0.84, emit=None, es=2.4):
    _n[0] += 1
    m = bpy.data.materials.new(f'm{_n[0]}'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*c, 1)
    b.inputs['Roughness'].default_value = rough
    try: b.inputs['Specular IOR Level'].default_value = 0.11
    except Exception: pass
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = es
    return m

def bev(o, w=0.016, segs=2):
    md = o.modifiers.new('b', 'BEVEL'); md.width = w; md.segments = segs
    md.limit_method = 'ANGLE'; md.angle_limit = math.radians(34)

def cube(size, center, m, rot=(0,0,0), b=0.016):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.object; o.scale = Vector(size)
    bpy.ops.object.transform_apply(scale=True)
    o.rotation_euler = rot; o.data.materials.append(m)
    if b: bev(o, b)
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(36))
    except Exception: pass
    return o

def cyl(r, h, center, m, verts=20, rot=(0,0,0), b=0.012, taper=None):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=(taper if taper is not None else r),
                                    depth=h, vertices=verts, location=center)
    o = bpy.context.object; o.rotation_euler = rot; o.data.materials.append(m)
    if b: bev(o, b, 1)
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(44))
    except Exception: pass
    return o

def ico(r, center, m, sub=1, scale=(1,1,1), rot=(0,0,0)):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=sub, location=center)
    o = bpy.context.object; o.scale = scale; o.rotation_euler = rot
    o.data.materials.append(m); return o

def uv(r, center, m, scale=(1,1,1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=20, ring_count=12, location=center)
    o = bpy.context.object; o.scale = scale; o.data.materials.append(m)
    bpy.ops.object.shade_smooth(); return o

# ---------- 장면 ----------
META = {}
def scene(wu, hu, margin=1.14):
    """wu: 가로 폭(units), hu: 높이(units). ortho·해상도·접지점을 규약대로 계산."""
    ortho = max(wu, hu*COS) * margin
    px = int(round(ortho * UPU))
    hoff = hu * 0.5
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4
    sc.render.resolution_x = sc.render.resolution_y = px * SS
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'

    bpy.ops.object.light_add(type='SUN'); k = bpy.context.object
    k.data.energy = 3.1; k.data.angle = 0.36; k.data.color = (1.0,0.97,0.88)
    k.rotation_euler = (math.radians(48), 0, math.radians(-38))
    bpy.ops.object.light_add(type='SUN'); f = bpy.context.object
    f.data.energy = 0.82; f.data.color = (0.70,0.80,1.0)
    f.rotation_euler = (math.radians(66), 0, math.radians(144))
    bpy.ops.object.light_add(type='SUN'); r = bpy.context.object
    r.data.energy = 0.9; r.data.color = (1.0,0.88,0.70)
    r.rotation_euler = (math.radians(104), 0, math.radians(198))

    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.60,0.66,0.74,1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.33

    bpy.ops.object.camera_add(); cam = bpy.context.object
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = ortho; sc.camera = cam
    el = math.radians(ELEV); d = 60.0
    cam.location = (0, -d*math.cos(el), d*math.sin(el) + hoff)
    cam.rotation_euler = (math.radians(90) - el, 0, 0)
    global _PX, _HOFF
    _PX, _HOFF = px, hoff
    return sc

_PX, _HOFF = 100, 1.0
def render(sc, name):
    px, hoff = _PX, _HOFF
    sc.render.filepath = f'{OUT}/{name}.png'
    bpy.ops.render.render(write_still=True)
    foot = round(px/2 - hoff*COS*UPU)
    META[name] = {'w': px, 'h': px, 'foot': foot}
    print('saved', name, px, 'foot', foot, flush=True)

def want(n): return (not ONLY) or (n in ONLY)

# ---------- 조각들 ----------
def column(x, y, z0, h, r=0.14, m=None, m2=None):
    """도리아식 기둥 — 받침·몸통(위로 갈수록 가늘게)·주두"""
    m = m or mat(MARBLE); m2 = m2 or mat(MARBLE2)
    cube((r*2.5, r*2.5, h*0.045), (x, y, z0 + h*0.022), m2, b=0.010)
    cyl(r, h*0.90, (x, y, z0 + h*0.50), m, verts=16, taper=r*0.82, b=0.008)
    cyl(r*1.02, h*0.045, (x, y, z0 + h*0.935), m2, verts=16, b=0.006)
    cube((r*2.7, r*2.7, h*0.055), (x, y, z0 + h*0.975), m, b=0.010)

def tiled_roof_terra(w, d, z, m, m2, pitch=0.40, over=0.11, steps=6):
    """기와 지붕 — 가로 단을 쌓아 올려 쿼터뷰에서 기왓장 결이 보이게.
    단을 쌓는 방식이라 벽이 비칠 틈이 생기지 않습니다."""
    D = d + over*2
    Wd = w + over*1.6
    th = pitch/steps
    for i in range(steps):
        k = i/steps
        dd = D*(1 - k*0.90)
        ww = Wd*(1 - k*0.055)
        cube((ww, dd, th*1.45), (0, 0, z + i*th + th*0.5), m if i % 2 == 0 else m2, b=0.010)
    cube((Wd*0.52, D*0.10, th*1.5), (0, 0, z + pitch + th*0.3), m2, b=0.010)     # 용마루
    for sx in (-1, 1):                                                           # 끝기와
        cube((0.16, D*0.12, th*1.2), (sx*Wd*0.47, -D*0.42, z + th*0.6), m2, b=0.008)

def pediment(w, d, z, m, m2):
    """삼각 박공 — 계단식으로 쌓아 삼각형을 흉내"""
    steps = 7
    for i in range(steps):
        k = i/steps
        cube((w*(1-k*0.92), d, 0.115), (0, 0, z + i*0.105), m if i%2 else m2, b=0.010)

def flame(x, y, z, s=1.0):
    F1 = mat((0.92,0.40,0.10), 0.5, emit=(1.0,0.34,0.06), es=1.1)
    F2 = mat((1.0,0.68,0.20), 0.5, emit=(1.0,0.56,0.14), es=1.5)
    ico(0.135*s, (x, y, z+0.08*s), F1, sub=1, scale=(1,1,1.6))
    ico(0.090*s, (x, y, z+0.17*s), F2, sub=1, scale=(1,1,1.7))
    ico(0.052*s,(x+0.025*s, y, z+0.27*s), F2, sub=1, scale=(1,1,1.8))

# ============================================================
# 1) 신전
# ============================================================
if want('temple'):
    W_, D_, H_ = 5*TILE, 4*TILE, 4.7
    sc = scene(W_*1.06, H_)
    MM, MM2, MM3 = mat(MARBLE), mat(MARBLE2), mat(MARBLE3)
    MT, MT2 = mat(TERRA), mat(TERRA2)
    base = 0.0
    for i in range(3):                                  # 기단 3단
        cube((W_*1.02 - i*0.34, D_*1.02 - i*0.30, 0.17), (0,0,0.085 + i*0.17), MM3 if i%2 else MM2, b=0.012)
    z0 = 0.51
    cube((W_*0.90, D_*0.86, 0.09), (0,0,z0+0.045), MM2, b=0.010)
    colh = 2.35
    xs = [-1,-0.6,-0.2,0.2,0.6,1]
    for t in xs:
        column(t*W_*0.40, -D_*0.36, z0, colh, r=0.145, m=MM, m2=MM2)
        column(t*W_*0.40,  D_*0.36, z0, colh, r=0.145, m=MM2, m2=MM2)
    cube((W_*0.80, D_*0.60, 1.55), (0, D_*0.04, z0+0.86), MM3, b=0.014)   # 신실
    cube((1.05, 0.12, 1.45), (0, -D_*0.27, z0+0.76), mat(AEGEAN2), b=0.010)  # 문
    cube((0.12, 0.12, 1.45), (0, -D_*0.29, z0+0.76), mat(GOLD), b=0.008)
    ent = z0 + colh
    cube((W_*0.96, D_*0.86, 0.20), (0,0,ent+0.10), MM, b=0.012)           # 아키트레이브
    for j in range(13):                                                    # 트리글리프
        cube((0.10,D_*0.88,0.16),( -W_*0.44 + j*(W_*0.88/12), 0, ent+0.30), MM2, b=0.006)
    cube((W_*0.98, D_*0.88, 0.10), (0,0,ent+0.43), MM3, b=0.010)
    pediment(W_*0.94, D_*0.80, ent+0.50, MM3, MM)
    tiled_roof_terra(W_*1.02, D_*0.92, ent+1.26, MT, MT2, pitch=0.46)
    for sx in (-1,1):                                                      # 성화 화로
        cube((0.30,0.30,0.34),(sx*W_*0.56, -D_*0.40, 0.17), MM2, b=0.012)
        flame(sx*W_*0.56, -D_*0.40, 0.34, 1.1)
    render(sc, 'temple')

# ============================================================
# 2) 흰 회벽집
# ============================================================
if want('house'):
    W_, D_, H_ = 3*TILE, 3*TILE, 3.2
    sc = scene(W_*1.12, H_)
    MP, MP2 = mat(PLASTER), mat(PLASTER2)
    MS, MS2 = mat(STONE), mat(STONE2)
    MT, MT2 = mat(TERRA), mat(TERRA2)
    MA, MA2 = mat(AEGEAN), mat(AEGEAN2)
    for rx in range(-5, 6):                              # 돌 기단
        cube((0.36,D_*0.90,0.17),(rx*0.36,0,0.085), MS if rx%2 else MS2, b=0.012)
    cube((W_*0.90, D_*0.84, 2.02), (0,0,1.23), MP, b=0.016)
    cube((W_*0.92, D_*0.86, 0.09), (0,0,0.26), MP2, b=0.010)
    cube((0.66,0.10,1.18),(0,-D_*0.43,0.81), MA2, b=0.010)          # 파란 문
    cube((0.74,0.07,0.09),(0,-D_*0.45,1.44), mat(WOOD), b=0.008)
    cube((0.07,0.07,0.07),(0.20,-D_*0.47,0.80), mat(BRONZE), b=0.006)
    for sx in (-1,1):                                               # 창 + 덧문
        cube((0.44,0.08,0.44),(sx*0.86,-D_*0.43,1.46), mat((0.16,0.16,0.20)), b=0.008)
        for s2 in (-1,1):
            cube((0.21,0.06,0.48),(sx*0.86 + s2*0.22,-D_*0.46,1.46), MA, b=0.008)
        cube((0.58,0.10,0.07),(sx*0.86,-D_*0.46,1.20), mat(WOOD2), b=0.006)
        ico(0.10,(sx*0.86,-D_*0.50,1.24), mat((0.86,0.34,0.36)), sub=1, scale=(1.3,1,0.9))
    tiled_roof_terra(W_*0.94, D_*0.88, 2.24, MT, MT2, pitch=0.42, over=0.12)
    cube((0.22,0.22,0.44),(W_*0.30, D_*0.20, 2.54), MP2, b=0.012)   # 굴뚝
    cube((0.28,0.28,0.08),(W_*0.30, D_*0.20, 2.78), MT2, b=0.008)
    render(sc, 'house')

# ============================================================
# 3) 저택 (2층 + 차양)
# ============================================================
if want('villa'):
    W_, D_, H_ = 3*TILE, 3*TILE, 3.7
    sc = scene(W_*1.18, H_)
    MP, MP2 = mat(PLASTER), mat(PLASTER2)
    MT, MT2 = mat(TERRA), mat(TERRA2)
    MA = mat(AEGEAN); MM, MM2 = mat(MARBLE), mat(MARBLE2)
    cube((W_*0.98, D_*0.94, 0.20), (0,0,0.10), MM2, b=0.012)
    cube((W_*0.88, D_*0.82, 1.35), (0,0,0.88), MP, b=0.016)
    cube((W_*0.92, D_*0.86, 0.10), (0,0,1.60), MM2, b=0.010)
    cube((W_*0.70, D_*0.70, 1.05), (0, D_*0.06, 2.18), MP, b=0.016)   # 2층
    for sx in (-1,1):                                                  # 1층 주랑
        column(sx*W_*0.36, -D_*0.40, 0.20, 1.34, r=0.105, m=MM, m2=MM2)
    cube((W_*0.86,0.10,0.09),(0,-D_*0.40,1.56), MM, b=0.008)
    for i in range(9):                                                 # 줄무늬 차양
        c = (0.76,0.30,0.22) if i%2 else (0.96,0.93,0.87)
        cube((W_*0.84/9, D_*0.30, 0.055), (-W_*0.42 + (i+0.5)*(W_*0.84/9), -D_*0.52, 1.44),
             mat(c), rot=(math.radians(-13),0,0), b=0.006)
    for i in range(11):                                                # 2층 난간
        cyl(0.035,0.26,(-W_*0.32 + i*(W_*0.64/10), -D_*0.30, 1.78), MM, verts=8, b=0)
    cube((W_*0.70,0.07,0.06),(0,-D_*0.30,1.93), MM, b=0.006)
    cube((0.52,0.09,0.86),(0,-D_*0.40,0.70), mat(AEGEAN2), b=0.010)
    for sx in (-1,1):
        cube((0.34,0.07,0.38),(sx*0.42, D_*0.0-D_*0.36, 2.28), mat((0.16,0.16,0.20)), b=0.008)
    tiled_roof_terra(W_*0.80, D_*0.78, 2.70, MT, MT2, pitch=0.44)
    for sx in (-1,1):                                                  # 항아리
        cyl(0.13,0.34,(sx*W_*0.44,-D_*0.44,0.37), mat(TERRA2), verts=12, taper=0.07, b=0.010)
    render(sc, 'villa')

# ============================================================
# 4) 아고라 가판 (스토아)
# ============================================================
if want('stoa'):
    W_, D_, H_ = 3*TILE, 2*TILE, 2.7
    sc = scene(W_*1.16, H_)
    MM, MM2 = mat(MARBLE), mat(MARBLE2); MW, MW2 = mat(WOOD), mat(WOOD2)
    cube((W_*0.98, D_*0.94, 0.16), (0,0,0.08), MM2, b=0.012)
    for t in (-1,-0.33,0.33,1):
        column(t*W_*0.40, D_*0.22, 0.16, 1.70, r=0.105, m=MM, m2=MM2)
    cube((W_*0.92, D_*0.56, 0.14), (0, D_*0.22, 1.93), MM, b=0.012)
    tiled_roof_terra(W_*0.86, D_*0.50, 2.00, mat(TERRA), mat(TERRA2), pitch=0.28, over=0.08, steps=4)
    for i in range(11):                                                # 차양
        c = (0.74,0.28,0.20) if i%2 else (0.97,0.94,0.88)
        cube((W_*0.94/11, D_*0.62, 0.05), (-W_*0.47 + (i+0.5)*(W_*0.94/11), -D_*0.20, 1.66),
             mat(c), rot=(math.radians(-15),0,0), b=0.005)
    cube((W_*0.84, D_*0.34, 0.12), (0, -D_*0.30, 0.86), MW, b=0.012)   # 좌판
    for sx in (-1,1):
        cube((0.10,0.10,0.80),(sx*W_*0.36,-D_*0.30,0.40), MW2, b=0.008)
    for i,(dx,c) in enumerate([(-0.52,(0.84,0.26,0.22)),(-0.18,(0.92,0.72,0.24)),
                               (0.18,(0.40,0.56,0.26)),(0.52,(0.62,0.30,0.52))]):
        for j in range(3):
            ico(0.075,(dx + (j-1)*0.085, -D_*0.30 + (j%2)*0.06, 0.97), mat(c), sub=1, scale=(1,1,0.85))
    for sx in (-1,1):                                                  # 항아리
        cyl(0.145,0.40,(sx*W_*0.46,-D_*0.12,0.36), mat(TERRA2), verts=12, taper=0.075, b=0.010)
        cyl(0.055,0.10,(sx*W_*0.46,-D_*0.12,0.60), mat(TERRA), verts=10, b=0.006)
    render(sc, 'stoa')

# ============================================================
# 5) 폐허
# ============================================================
if want('ruin'):
    W_, H_ = 2*TILE, 2.5
    sc = scene(W_*1.2, H_)
    MM, MM2 = mat(MARBLE2), mat(STONE2); MIV = mat((0.26,0.44,0.24))
    cube((W_*1.0, W_*0.8, 0.18), (0,0,0.09), MM2, b=0.012)
    column(-0.62, 0.10, 0.18, 2.10, r=0.125, m=mat(MARBLE), m2=MM)
    for i in range(4):                                                 # 부러진 기둥
        cyl(0.118, 0.30, (0.30, -0.12, 0.33 + i*0.30), mat(MARBLE) if i%2 else MM, verts=16, b=0.008)
    cyl(0.112, 0.26, (0.86, 0.22, 0.14), mat(MARBLE), verts=16,
        rot=(math.radians(90), 0, math.radians(26)), b=0.008)           # 쓰러진 토막
    cube((0.78,0.26,0.20),(0.74,-0.34,0.28), MM, rot=(0,math.radians(7),math.radians(-12)), b=0.012)
    for i in range(7):
        a = random.random()*6.283
        ico(0.10+random.random()*0.08, (math.cos(a)*0.7, math.sin(a)*0.5, 0.22), MIV,
            sub=1, scale=(1.3,1.1,0.6), rot=(0,0,random.random()*3))
    render(sc, 'ruin')

# ============================================================
# 6) 제단 · 7) 우물 · 8) 조각상 · 9) 경계석 · 10) 항아리 · 11) 화로 · 12) 기둥
# ============================================================
if want('altar'):
    sc = scene(TILE*1.5, 1.45)
    MM, MM2 = mat(MARBLE), mat(MARBLE2)
    cube((0.86,0.70,0.14),(0,0,0.07), MM2, b=0.012)
    cube((0.68,0.56,0.62),(0,0,0.45), MM, b=0.016)
    for sx in (-1,1):
        cyl(0.055,0.50,(sx*0.30,0,0.45), MM2, verts=12, b=0.006)
    cube((0.80,0.64,0.12),(0,0,0.82), MM2, b=0.012)
    cyl(0.26,0.14,(0,0,0.94), mat(BRONZE), verts=18, taper=0.20, b=0.010)
    flame(0,0,0.99,1.25)
    render(sc, 'altar')

if want('well'):
    sc = scene(TILE*1.6, 1.80)
    MS, MS2 = mat(STONE), mat(STONE2); MW = mat(WOOD2)
    for i in range(12):
        a = i/12*6.283
        cube((0.20,0.20,0.46),(math.cos(a)*0.46, math.sin(a)*0.46, 0.23),
             MS if i%2 else MS2, rot=(0,0,a), b=0.010)
    cyl(0.40,0.06,(0,0,0.47), mat((0.22,0.44,0.56), 0.26), verts=20, b=0)
    for sx in (-1,1):
        cube((0.07,0.07,1.00),(sx*0.48,0,0.50), MW, b=0.008)
    cube((1.14,0.08,0.08),(0,0,1.00), MW, b=0.008)
    cyl(0.085,0.26,(0,0,0.84), mat(WOOD), verts=10, rot=(0,math.radians(90),0), b=0.008)
    cube((0.16,0.16,0.18),(0.16,0,0.70), mat(BRONZE), b=0.010)
    render(sc, 'well')

if want('statue'):
    sc = scene(TILE*1.5, 2.70)
    MM, MM2, MM3 = mat(MARBLE3), mat(MARBLE), mat(MARBLE2)
    cube((0.78,0.70,0.18),(0,0,0.09), MM3, b=0.012)
    cube((0.62,0.56,0.52),(0,0,0.44), MM2, b=0.014)
    cube((0.70,0.62,0.10),(0,0,0.75), MM3, b=0.010)
    cyl(0.30,1.02,(0,0,1.33), MM, verts=20, taper=0.19, b=0.012)        # 주름 치마
    for i in range(11):
        a = i/11*6.283
        cyl(0.030,0.98,(math.cos(a)*0.235, math.sin(a)*0.235, 1.34), MM3, verts=6, b=0)
    cube((0.40,0.26,0.44),(0,0,2.03), MM, b=0.016)                      # 상체
    cube((0.30,0.22,0.16),(0,-0.03,1.90), MM3, b=0.012)                 # 허리 띠
    cube((0.56,0.28,0.12),(0,0,2.26), MM3, b=0.012)                     # 어깨
    uv(0.145,(0,-0.012,2.44), MM, (1,0.94,1.06))                        # 머리
    uv(0.152,(0,0.030,2.48), MM3, (1.04,0.96,0.86))                     # 머리카락
    cube((0.090,0.100,0.46),(-0.25,0.01,2.03), MM, rot=(math.radians(6),0,0), b=0.014)
    cube((0.090,0.100,0.40),( 0.25,-0.05,2.13), MM, rot=(math.radians(-44),0,0), b=0.014)
    cyl(0.050,0.60,(0.285,-0.24,2.42), mat(GOLD), verts=10, rot=(math.radians(-16),0,0), b=0.008)
    ico(0.075,(0.33,-0.32,2.70), mat(GOLD), sub=1, scale=(1,0.8,1.2))
    render(sc, 'statue')

if want('herm'):
    sc = scene(TILE*1.2, 2.00)
    MM, MM2 = mat(MARBLE2), mat(STONE2)
    cube((0.46,0.42,0.14),(0,0,0.07), MM2, b=0.010)
    cube((0.30,0.26,1.42),(0,0,0.85), MM, b=0.014)
    uv(0.155,(0,-0.02,1.70), mat(MARBLE), (1,0.94,1.06))
    uv(0.160,(0,0.04,1.74), MM2, (1.02,0.96,0.80))
    cube((0.085,0.05,0.16),(0,-0.14,1.60), mat((0.72,0.70,0.66)), b=0.008)   # 수염
    for sx in (-1,1):
        cube((0.05,0.05,0.05),(sx*0.055,-0.145,1.74), mat((0.30,0.28,0.30)), b=0.004)
    cube((0.36,0.30,0.08),(0,0,1.52), MM2, b=0.008)
    render(sc, 'herm')

if want('amphora'):
    sc = scene(TILE*0.9, 1.05)
    MT, MT2 = mat(TERRA2), mat((0.14,0.12,0.12))
    cyl(0.055,0.14,(0,0,0.07), MT, verts=12, taper=0.14, b=0.008)
    uv(0.21,(0,0,0.40), MT, (1,1,1.25))
    cyl(0.12,0.26,(0,0,0.70), MT, verts=14, taper=0.085, b=0.008)
    cyl(0.105,0.07,(0,0,0.86), MT, verts=14, b=0.006)
    for sx in (-1,1):
        cube((0.045,0.045,0.26),(sx*0.19,0,0.62), MT, rot=(0,math.radians(sx*16),0), b=0.008)
    cyl(0.212,0.07,(0,0,0.42), MT2, verts=16, b=0)                      # 검은 띠
    render(sc, 'amphora')

if want('brazier'):
    sc = scene(TILE*1.1, 1.60)
    MB, MB2 = mat(BRONZE, 0.42), mat((0.40,0.28,0.14), 0.46)
    for i in range(3):
        a = i/3*6.283
        cube((0.055,0.055,1.00),(math.cos(a)*0.17, math.sin(a)*0.17, 0.50), MB2,
             rot=(math.radians(math.sin(a)*9), math.radians(-math.cos(a)*9), 0), b=0.008)
    cyl(0.28,0.16,(0,0,1.04), MB, verts=18, taper=0.21, b=0.010)
    cyl(0.29,0.045,(0,0,1.13), MB2, verts=18, b=0.006)
    flame(0,0,1.10,1.3)
    render(sc, 'brazier')

if want('column'):
    sc = scene(TILE*1.1, 2.80)
    column(0, 0, 0, 2.76, r=0.155, m=mat(MARBLE), m2=mat(MARBLE2))
    render(sc, 'column')

# ============================================================
# 초목
# ============================================================
def tree(name, h, trunk_c, leaf_cs, spread, blobs, drop=0.58, gnarl=0.0, spire=False):
    """나무 — 잎덩이를 작고 많게, 아래는 어둡고 위는 밝게 쌓아 입체감을 냅니다."""
    sc = scene(max(spread*2.5, 1.5), h)
    BK, BK2 = mat(trunk_c), mat(tuple(min(1, c*1.34) for c in trunk_c))
    MS = [mat(c) for c in leaf_cs]           # 어두운 색 → 밝은 색 순서
    if gnarl:
        cyl(0.165, h*drop*0.70, (0,0,h*drop*0.35), BK, verts=11, taper=0.125, b=0.012)
        for i in range(3):
            a_ = i/3*6.283 + 0.4
            cyl(0.080, h*0.40, (math.cos(a_)*0.16, math.sin(a_)*0.13, h*drop*0.86), BK,
                verts=8, rot=(math.radians(math.sin(a_)*24), math.radians(-math.cos(a_)*24), 0), b=0.010)
        cyl(0.235, 0.19, (0,0,0.085), BK2, verts=12, taper=0.185, b=0.012)
    else:
        cyl(0.135, h*(drop+0.14), (0,0,h*(drop+0.14)*0.5), BK, verts=11, taper=0.098, b=0.010)
        cyl(0.195, 0.16, (0,0,0.075), BK2, verts=12, taper=0.155, b=0.010)
    if spire:
        for i in range(blobs):
            k = i/(blobs-1)
            z = h*0.26 + k*h*0.70
            r = spread*(1.0 - k*0.70) * (0.80 + random.random()*0.26)
            m = MS[min(len(MS)-1, int((0.25 + k*0.75)*len(MS)))]
            ico(r, ((random.random()-0.5)*0.09, (random.random()-0.5)*0.07, z),
                m, sub=2, scale=(1,0.95,1.30), rot=(0,0,random.random()*3))
    else:
        span = h*0.40
        for i in range(blobs):
            a_ = random.random()*6.283
            rr = (random.random()**0.65)*spread
            zz = h*drop + random.random()*span
            frac = (zz - h*drop)/span
            lift = 1 - (rr/spread)*0.35
            m = MS[max(0, min(len(MS)-1, int((frac*0.82 + (lift-0.65)*0.5)*len(MS))))]
            ico(spread*(0.30 + random.random()*0.20),
                (math.cos(a_)*rr, math.sin(a_)*rr*0.78, zz),
                m, sub=2, scale=(1.26,1.14,0.76), rot=(0,0,random.random()*3))
    render(sc, name)

if want('olive'):    tree('olive',    2.55, (0.40,0.34,0.26), [(0.20,0.26,0.16),(0.31,0.38,0.24),(0.43,0.50,0.33),(0.54,0.61,0.42)], 0.92, 22, drop=0.50, gnarl=1)
if want('cypress'):  tree('cypress',  3.40, (0.32,0.25,0.18), [(0.05,0.15,0.09),(0.09,0.22,0.13),(0.14,0.29,0.18),(0.19,0.36,0.22)], 0.44, 14, drop=0.20, spire=True)
if want('pine_umb'): tree('pine_umb', 3.05, (0.44,0.31,0.20), [(0.08,0.20,0.11),(0.14,0.29,0.16),(0.21,0.38,0.21),(0.28,0.46,0.26)], 1.16, 24, drop=0.74)
if want('fig'):      tree('fig',      2.25, (0.46,0.40,0.32), [(0.10,0.23,0.10),(0.17,0.33,0.15),(0.24,0.42,0.20),(0.31,0.50,0.25)], 0.90, 21, drop=0.48)
if want('laurel'):   tree('laurel',   2.05, (0.34,0.27,0.20), [(0.07,0.20,0.11),(0.13,0.28,0.16),(0.19,0.36,0.21),(0.26,0.43,0.27)], 0.82, 20, drop=0.42)

def bush(name, cs, h=0.80, n=6, sz=0.40, flowers=None):
    sc = scene(1.25, h)
    MS = [mat(c) for c in cs]
    for i in range(n):
        a_ = random.random()*6.283; r = (random.random()**0.6)*0.34
        zz = h*0.38 + random.random()*h*0.28
        frac = (zz - h*0.38)/(h*0.28)
        m = MS[max(0, min(len(MS)-1, int(frac*len(MS))))]
        ico(sz*(0.62+random.random()*0.42), (math.cos(a_)*r, math.sin(a_)*r*0.8, zz),
            m, sub=2, scale=(1.20,1.08,0.84), rot=(0,0,random.random()*3))
    if flowers:
        MF = mat(flowers)
        for i in range(9):
            a_ = random.random()*6.283; r = random.random()*0.36
            ico(0.046,(math.cos(a_)*r, math.sin(a_)*r*0.8, h*0.56 + random.random()*h*0.26), MF, sub=1)
    render(sc, name)

if want('shrub_laurel'): bush('shrub_laurel', [(0.08,0.20,0.12),(0.15,0.30,0.18),(0.23,0.39,0.24)], 0.86, n=10)
if want('shrub_myrtle'): bush('shrub_myrtle', [(0.11,0.25,0.15),(0.19,0.35,0.22),(0.27,0.44,0.28)], 0.82, n=10, flowers=(0.99,0.96,0.92))
if want('shrub_thyme'):  bush('shrub_thyme',  [(0.22,0.28,0.17),(0.33,0.38,0.25),(0.43,0.48,0.32)], 0.58, n=9, sz=0.32, flowers=(0.62,0.42,0.80))
if want('shrub_dry'):    bush('shrub_dry',    [(0.40,0.34,0.19),(0.54,0.47,0.27),(0.67,0.60,0.36)], 0.66, n=9, sz=0.32)

def tuft(name, c, c2, h=0.55, n=11):
    sc = scene(0.95, h)
    M, M2 = mat(c), mat(c2)
    for i in range(n):
        a = random.random()*6.283; r = random.random()*0.20
        cube((0.036,0.036,h*(0.55+random.random()*0.5)),
             (math.cos(a)*r, math.sin(a)*r, h*0.34), M if i%2 else M2,
             rot=(math.radians(random.uniform(-18,18)), math.radians(random.uniform(-18,18)), 0), b=0.006)
    render(sc, name)

if want('grass_green'): tuft('grass_green', (0.38,0.58,0.28), (0.48,0.66,0.34))
if want('grass_dry'):   tuft('grass_dry',   DRY, DRY2, h=0.60)
if want('wheat'):       tuft('wheat',       (0.82,0.72,0.36), (0.90,0.82,0.46), h=0.72, n=13)

def rock(name, c, n=2, big=0.42, h=None):
    h = h or big*1.5
    sc = scene(big*3.0, h)
    M = mat(c); M2 = mat(tuple(min(1,x*1.14) for x in c))
    ico(big,(0,0,big*0.72), M, sub=1, scale=(1.32,1.10,0.86), rot=(random.random(),random.random(),random.random()))
    for i in range(n):
        a = random.random()*6.283
        ico(big*0.52,(math.cos(a)*big*0.92, math.sin(a)*big*0.70, big*0.40), M2, sub=1,
            scale=(1.1,1,0.82), rot=(random.random(),random.random(),random.random()))
    render(sc, name)

if want('rock_lime'):   rock('rock_lime',   (0.72,0.68,0.60))
if want('rock_marble'): rock('rock_marble', (0.86,0.84,0.80), n=3, big=0.36)
if want('rock_big'):    rock('rock_big',    (0.64,0.60,0.54), n=3, big=0.70)

# ---------- 메타 병합 ----------
mp = f'{OUT}/meta_raw.json'
old = {}
if os.path.exists(mp):
    try: old = json.load(open(mp))
    except Exception: old = {}
old.update(META)
json.dump(old, open(mp, 'w'))
print('GREEK DONE', len(META))
