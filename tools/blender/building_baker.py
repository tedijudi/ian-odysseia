"""거상풍 한국 전통 건물 — 청기와 지붕, 돌담, 현판, 깃발."""
import bpy, math, os, random
from mathutils import Vector
OUT='/home/claude/bake3/raw'; os.makedirs(OUT, exist_ok=True)
SS=2; ELEV=30.0; random.seed(11)

def mat(n,c,rough=0.84,emit=None):
    m=bpy.data.materials.new(n); m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=rough
    b.inputs['Specular IOR Level'].default_value=0.10
    if emit:
        b.inputs['Emission Color'].default_value=(*emit,1); b.inputs['Emission Strength'].default_value=1.8
    return m
def cube(size,center,material,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    o=bpy.context.object; o.scale=Vector(size); bpy.ops.object.transform_apply(scale=True)
    o.rotation_euler=rot; o.data.materials.append(material); return o
def cyl(r,h,center,material,verts=10,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=h,vertices=verts,location=center)
    o=bpy.context.object; o.rotation_euler=rot; o.data.materials.append(material); return o
def ico(r,center,material,sub=1,scale=(1,1,1),rot=(0,0,0)):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r,subdivisions=sub,location=center)
    o=bpy.context.object; o.scale=scale; o.rotation_euler=rot; o.data.materials.append(material); return o

def scene(ortho,hoff=0.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc=bpy.context.scene
    sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=26; sc.cycles.use_denoising=True
    sc.render.film_transparent=True
    sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
    sc.view_settings.view_transform='Standard'
    bpy.ops.object.light_add(type='SUN'); k=bpy.context.object
    k.data.energy=2.7; k.data.angle=0.4; k.rotation_euler=(math.radians(50),0,math.radians(-42))
    bpy.ops.object.light_add(type='SUN'); f=bpy.context.object
    f.data.energy=1.0; f.data.color=(0.82,0.88,1.0); f.rotation_euler=(math.radians(62),0,math.radians(145))
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes['Background'].inputs[0].default_value=(0.50,0.53,0.60,1)
    w.node_tree.nodes['Background'].inputs[1].default_value=0.42
    bpy.ops.object.camera_add(); cam=bpy.context.object
    cam.data.type='ORTHO'; cam.data.ortho_scale=ortho; sc.camera=cam
    el=math.radians(ELEV); d=40.0
    cam.location=(0,-d*math.cos(el), d*math.sin(el)+hoff)
    cam.rotation_euler=(math.radians(90)-el,0,0)
    return sc
def render(sc,name,px,py):
    sc.render.resolution_x, sc.render.resolution_y = px*SS, py*SS
    sc.render.filepath=f'{OUT}/{name}.png'
    bpy.ops.render.render(write_still=True); print('saved',name,flush=True)

TEAL=(0.20,0.40,0.38); TEAL2=(0.13,0.28,0.27); TEAL3=(0.28,0.50,0.46)
WOOD=(0.44,0.27,0.16); WOOD2=(0.30,0.18,0.10); WOOD3=(0.56,0.38,0.22)
STONE=(0.52,0.50,0.47); STONE2=(0.40,0.38,0.36)
PLASTER=(0.90,0.86,0.76); RED=(0.66,0.14,0.12); GOLD=(0.80,0.64,0.26)

def tiled_roof(w, d, z, mt, mt2, layers=4, step=0.1):
    """기와 지붕 — 여러 겹 + 기왓골 + 치켜올라간 처마"""
    for i in range(layers):
        k=i/max(1,layers-1)
        ww=w*(1-k*0.26); dd=d*(1-k*0.26); zz=z+i*0.26
        cube((ww,dd,0.14),(0,0,zz), mt if i%2==0 else mt2)
        # 기왓골
        n=max(5,int(ww/0.32))
        for j in range(n):
            x=-ww/2+ (j+0.5)*(ww/n)
            cyl(0.06, dd, (x,0,zz+0.1), mt2, verts=8, rot=(math.radians(90),0,0))
    # 용마루
    cube((w*0.42,0.30,0.22),(0,0,z+layers*0.26+0.06), mt2)
    # 치켜올라간 네 귀
    for sx in (-1,1):
        for sy in (-1,1):
            cube((0.48,0.30,0.12),(sx*w*0.47, sy*d*0.44, z+0.16), mt2,
                 rot=(0,math.radians(-16*sx),0))

def banner(x,y,z,c,h=1.0,w=0.26):
    M=mat(f'ban{random.random()}',c)
    cube((w,0.05,h),(x,y,z-h/2), M)
    cube((w*1.2,0.07,0.08),(x,y,z), mat('bar',WOOD2))

# ---------- 1) 상점 (거상 화면의 가게 느낌) ----------
sc=scene(9.0, 2.2)
MST,MST2 = mat('st',STONE), mat('st2',STONE2)
MW,MW2,MW3 = mat('w',WOOD), mat('w2',WOOD2), mat('w3',WOOD3)
MT,MT2,MT3 = mat('t',TEAL), mat('t2',TEAL2), mat('t3',TEAL3)
MPL = mat('pl',PLASTER)
# 돌 기단 (돌 하나하나)
for ry in range(3):
    for rx in range(11):
        if (rx+ry)%7==3: continue
        cube((0.36,0.34,0.26),(-1.8+rx*0.36, -1.3+ry*1.3, 0.14+ry*0.0), MST if (rx+ry)%2 else MST2)
cube((4.2,3.0,0.30),(0,0,0.15), MST2)
# 벽
cube((3.9,2.7,1.9),(0,0,1.25), MPL)
# 기둥
for x in (-1.85,-0.62,0.62,1.85):
    cube((0.18,2.85,2.0),(x,0,1.3), MW)
# 창살문
cube((2.2,0.12,1.5),(0,-1.4,1.1), MW3)
for i in range(9):
    cube((0.05,0.14,1.3),(-0.95+i*0.24,-1.44,1.1), MW2)
for i in range(5):
    cube((2.1,0.14,0.05),(0,-1.44,0.5+i*0.3), MW2)
# 처마 밑 공포
for x in (-1.85,-0.62,0.62,1.85):
    cube((0.34,0.34,0.14),(x,-1.45,2.26), MW3)
    cube((0.34,0.34,0.14),(x, 1.45,2.26), MW3)
# 지붕
tiled_roof(5.4, 4.0, 2.42, MT, MT2, layers=4)
# 현판
cube((1.7,0.14,0.44),(0,-1.52,2.05), mat('sign',(0.24,0.10,0.08)))
cube((1.5,0.08,0.30),(0,-1.60,2.05), mat('signgold',GOLD))
# 깃발 · 등
banner(-2.3,-1.0,2.1,RED,h=1.4)
banner( 2.3,-1.0,2.1,RED,h=1.4)
cyl(0.05,2.6,(-2.6,-1.2,1.3), MW2, verts=6)
cube((0.34,0.34,0.44),(-2.6,-1.2,2.5), mat('lan',(0.94,0.40,0.30),0.5,(1.0,0.5,0.3)))
render(sc,'shop',300,300)

# ---------- 2) 민가 ----------
sc=scene(7.4,1.8)
MST,MST2=mat('st',STONE),mat('st2',STONE2)
MW,MW2,MW3=mat('w',WOOD),mat('w2',WOOD2),mat('w3',WOOD3)
MT,MT2=mat('t',(0.30,0.28,0.30)),mat('t2',(0.20,0.19,0.21))
MPL=mat('pl',(0.88,0.83,0.72))
for rx in range(9):
    cube((0.34,2.4,0.24),(-1.4+rx*0.34,0,0.12), MST if rx%2 else MST2)
cube((3.0,2.2,1.6),(0,0,1.02), MPL)
for x in (-1.4,1.4):
    cube((0.16,2.3,1.7),(x,0,1.05), MW)
cube((1.3,0.12,1.2),(0,-1.14,0.82), MW3)
for i in range(6):
    cube((0.05,0.14,1.0),(-0.5+i*0.2,-1.18,0.82), MW2)
tiled_roof(4.2,3.1,1.86,MT,MT2,layers=3)
# 굴뚝
cyl(0.16,0.8,(1.2,0.9,2.3), MST2, verts=8)
render(sc,'house',240,240)

# ---------- 3) 주막 (빨간 등, 평상) ----------
sc=scene(8.0,1.9)
MW,MW2,MW3=mat('w',WOOD),mat('w2',WOOD2),mat('w3',WOOD3)
MT,MT2=mat('t',(0.52,0.44,0.26)),mat('t2',(0.40,0.33,0.19))   # 초가
MPL=mat('pl',(0.86,0.80,0.68))
cube((3.4,2.4,0.24),(0,0,0.12), mat('st',STONE2))
cube((3.1,2.2,1.6),(0,0,1.04), MPL)
for x in (-1.45,0,1.45):
    cube((0.16,2.3,1.7),(x,0,1.05), MW)
# 초가 지붕 (둥글게)
for i in range(5):
    k=i/4
    ico(2.1*(1-k*0.3),(0,0,1.95+i*0.16), MT if i%2 else MT2, sub=1, scale=(1.0,0.76,0.22))
# 평상
cube((1.5,1.0,0.1),(2.2,-0.6,0.52), MW3)
for (x,y) in [(1.6,-1.0),(2.8,-1.0),(1.6,-0.2),(2.8,-0.2)]:
    cube((0.1,0.1,0.5),(x,y,0.25), MW2)
# 빨간 등
for x in (-1.5,1.5):
    cyl(0.05,0.9,(x,-1.3,2.2), MW2, verts=6)
    cube((0.3,0.3,0.4),(x,-1.3,1.6), mat(f'lan{x}',(0.92,0.26,0.22),0.5,(1.0,0.38,0.26)))
# 깃발
cube((0.07,0.07,2.6),(-2.0,-1.0,1.3), MW2)
cube((0.1,0.9,1.3),(-1.95,-0.55,1.9), mat('flag',(0.92,0.88,0.76)))
render(sc,'tavern',260,260)

# ---------- 4) 성문 · 관문 ----------
sc=scene(10.0,2.6)
MST,MST2=mat('st',STONE),mat('st2',STONE2)
MW,MW2=mat('w',WOOD),mat('w2',WOOD2)
MT,MT2=mat('t',TEAL),mat('t2',TEAL2)
for ry in range(2):
    for rx in range(16):
        if rx in (6,7,8): continue
        cube((0.38,1.4,0.42),(-2.9+rx*0.38,0,0.22+ry*0.44), MST if (rx+ry)%2 else MST2)
for ry in range(3):
    for rx in range(16):
        if rx in (6,7,8) and ry<2: continue
        cube((0.38,1.4,0.42),(-2.9+rx*0.38,0,1.1+ry*0.44), MST if (rx+ry+1)%2 else MST2)
# 홍예문 (아치)
for i in range(7):
    a=math.pi*(i/6)
    cube((0.3,1.5,0.3),(math.cos(a)*0.95, 0, 1.0+math.sin(a)*0.95), MST2)
# 문루
cube((5.4,1.8,1.3),(0,0,3.1), mat('pl',PLASTER))
for x in (-2.3,-0.78,0.78,2.3):
    cube((0.18,1.9,1.4),(x,0,3.1), MW)
tiled_roof(6.6,2.8,3.85,MT,MT2,layers=3)
cube((1.8,0.12,0.44),(0,-0.98,3.4), mat('sign',(0.24,0.10,0.08)))
render(sc,'gate',340,340)

# ---------- 5) 우물 · 장승 · 솟대 ----------
sc=scene(2.6,0.6)
MST=mat('st',STONE); MW2=mat('w2',WOOD2); MW=mat('w',WOOD)
for i in range(10):
    a=i/10*6.283
    cube((0.2,0.2,0.46),(math.cos(a)*0.52,math.sin(a)*0.52,0.23), MST, rot=(0,0,a))
cyl(0.42,0.08,(0,0,0.5), mat('water',(0.26,0.46,0.58)), verts=12)
for x in (-0.55,0.55):
    cube((0.08,0.08,1.0),(x,0,0.5), MW2)
cube((1.3,0.08,0.08),(0,0,1.0), MW2)
cube((0.22,0.22,0.2),(0,0,0.82), MW)
render(sc,'well',110,110)

sc=scene(2.4,0.9)
MW,MW2=mat('w',(0.46,0.32,0.20)),mat('w2',(0.30,0.20,0.12))
MRED=mat('r',(0.72,0.24,0.18))
cube((0.34,0.30,2.0),(0,0,1.0), MW)
cube((0.42,0.36,0.44),(0,0,1.85), MW2)      # 머리
cube((0.1,0.06,0.1),(-0.1,-0.19,1.92), MRED)
cube((0.1,0.06,0.1),( 0.1,-0.19,1.92), MRED)
cube((0.2,0.06,0.07),(0,-0.19,1.72), MRED)  # 입
render(sc,'jangseung',90,160)

print('BLDG DONE')
