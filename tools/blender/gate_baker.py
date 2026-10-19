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


# ---------- 성문 (재작업) ----------
sc=scene(10.0,2.6)
MST,MST2 = mat('st',STONE), mat('st2',STONE2)
MST3 = mat('st3',(0.46,0.44,0.41))
MW,MW2 = mat('w',WOOD), mat('w2',WOOD2)
MT,MT2 = mat('t',TEAL), mat('t2',TEAL2)
STS=[MST,MST2,MST3]
R = 1.10          # 아치 반지름
SPR = 1.05        # 아치가 시작되는 높이

BW, BH = 0.40, 0.40
for ry in range(8):
    z = 0.24 + ry*BH
    off = (ry%2)*BW*0.5
    for rx in range(-9, 10):
        x = rx*BW + off
        if abs(x) > 3.3: continue
        inside = (abs(x) < R + 0.02 and z < SPR) or \
                 (z >= SPR and (x*x)/(R*R) + ((z-SPR)*(z-SPR))/(R*R) < 1.0)
        if inside: continue
        cube((BW*0.95, 1.5, BH*0.90), (x, 0, z), STS[(rx*3+ry*5) % 3])

# 홍예 테두리 — 회전 없이 촘촘한 작은 돌로 둘러요
for i in range(30):
    a = math.pi*(i/29)
    cube((0.22,1.52,0.22),(math.cos(a)*(R+0.14), 0, SPR+math.sin(a)*(R+0.14)),
         MST3 if i%2 else MST2)
for sx in (-1,1):                                  # 아치 기둥
    for j in range(4):
        cube((0.24,1.52,0.24),(sx*(R+0.14), 0, 0.26+j*0.22), MST3 if j%2 else MST2)

# 문짝 (닫힌 널문 + 쇠장식)
cube((2.08,0.14,1.82),(0,0.44,0.98), MW)
for j in range(8):
    cube((0.055,0.18,1.74),(-0.90+j*0.257, 0.37, 0.98), MW2)
for zz in (0.52,1.42):
    cube((2.02,0.10,0.10),(0,0.35,zz), mat(f'band{zz}',(0.26,0.24,0.26)))
cube((0.16,0.14,0.16),(0,0.33,1.02), mat('ring',(0.74,0.60,0.28)))

# 기단
cube((7.2,1.95,0.26),(0,0,0.13), MST2)
for rx in range(-8,9):
    cube((0.42,2.05,0.10),(rx*0.42,0,0.28), MST if rx%2 else MST3)

# 문루
cube((5.6,1.8,1.25),(0,0,3.70), mat('pl',PLASTER))
for x in (-2.4,-0.82,0.82,2.4):
    cube((0.20,1.96,1.36),(x,0,3.70), MW)
for x in (-1.62,0.0,1.62):                        # 살창
    cube((1.10,0.10,0.70),(x,-0.92,3.92), MW2)
    for k in range(5):
        cube((0.05,0.14,0.62),(x-0.44+k*0.22,-0.96,3.92), MW)
cube((6.0,2.05,0.16),(0,0,3.03), MW2)             # 마루
for i in range(13):                                # 난간
    cube((0.07,0.07,0.36),(-2.7+i*0.45,-1.04,3.29), MW2)
cube((6.0,0.09,0.09),(0,-1.04,3.47), MW2)
tiled_roof(7.0,2.9,4.42,MT,MT2,layers=3)

# 현판
cube((2.0,0.13,0.48),(0,-0.95,3.98), mat('sign',(0.22,0.09,0.07)))
cube((1.84,0.06,0.33),(0,-1.02,3.98), mat('sign2',(0.80,0.66,0.30)))

# 깃대
for sx in (-1,1):
    cube((0.10,0.10,3.2),(sx*3.62,-0.25,1.60), MW2)
    cube((0.14,0.86,1.15),(sx*3.62-0.02,-0.66,2.62), mat(f'flag{sx}',(0.70,0.18,0.16)))
render(sc,'gate',340,340)
print('GATE DONE')
