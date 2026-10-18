"""거상풍 배경 소품 베이커 — 건물·나무·바위·가로등 등을 고정 각도로 한 장씩 굽습니다."""
import bpy, math, os
from mathutils import Vector, Matrix
OUT='/home/claude/bake2/raw_props'; os.makedirs(OUT, exist_ok=True)
SS=2; ELEV=30.0

def mat(n,c,rough=0.85,emit=None):
    m=bpy.data.materials.new(n); m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=rough
    b.inputs['Specular IOR Level'].default_value=0.12
    if emit:
        b.inputs['Emission Color'].default_value=(*emit,1); b.inputs['Emission Strength'].default_value=2.2
    return m

def cube(size,center,material,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    o=bpy.context.object; o.scale=Vector(size); bpy.ops.object.transform_apply(scale=True)
    o.rotation_euler=rot; o.data.materials.append(material); return o
def cyl(r,h,center,material,verts=12,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=h,vertices=verts,location=center)
    o=bpy.context.object; o.rotation_euler=rot; o.data.materials.append(material); return o
def ico(r,center,material,sub=1,scale=(1,1,1)):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r,subdivisions=sub,location=center)
    o=bpy.context.object; o.scale=scale; o.data.materials.append(material); return o

def scene(ortho, height_off=0.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc=bpy.context.scene
    sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=20; sc.cycles.use_denoising=True
    sc.render.film_transparent=True
    sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
    sc.view_settings.view_transform='Standard'
    bpy.ops.object.light_add(type='SUN'); k=bpy.context.object
    k.data.energy=2.8; k.data.angle=0.35; k.rotation_euler=(math.radians(52),0,math.radians(-40))
    bpy.ops.object.light_add(type='SUN'); f=bpy.context.object
    f.data.energy=0.9; f.data.color=(0.80,0.86,1.0); f.rotation_euler=(math.radians(65),0,math.radians(140))
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes['Background'].inputs[0].default_value=(0.46,0.49,0.60,1)
    w.node_tree.nodes['Background'].inputs[1].default_value=0.40
    bpy.ops.object.camera_add(); cam=bpy.context.object
    cam.data.type='ORTHO'; cam.data.ortho_scale=ortho; sc.camera=cam
    el=math.radians(ELEV); d=30.0
    cam.location=(0,-d*math.cos(el), d*math.sin(el)+height_off)
    cam.rotation_euler=(math.radians(90)-el,0,0)
    return sc

def render(sc, name, px, py):
    sc.render.resolution_x, sc.render.resolution_y = px*SS, py*SS
    sc.render.filepath=f'{OUT}/{name}.png'
    bpy.ops.render.render(write_still=True)
    print('saved', name, flush=True)

WOOD=(0.46,0.28,0.16); WOOD2=(0.32,0.19,0.11); PLASTER=(0.95,0.91,0.80)
TILE=(0.33,0.30,0.34); TILE2=(0.24,0.21,0.25); STONE=(0.60,0.57,0.54)
GREEN=(0.32,0.58,0.26); GREEN2=(0.24,0.46,0.22); RED=(0.70,0.18,0.16)

# ---------- 1) 한옥 상점 ----------
sc=scene(7.4, 1.7)
W_,W2,PL,TI,TI2 = mat('w',WOOD), mat('w2',WOOD2), mat('pl',PLASTER), mat('t',TILE), mat('t2',TILE2)
cube((3.4,2.6,0.25),(0,0,0.12), mat('base',STONE))               # 기단
cube((3.2,2.4,1.9),(0,0,1.2), PL)                                 # 벽
for x in (-1.4,-0.47,0.47,1.4):
    cube((0.16,2.5,1.9),(x,0,1.2), W_)                            # 기둥
cube((3.3,0.12,0.9),(0,-1.2,1.0), W2)                             # 문틀
cube((1.5,0.1,1.5),(0,-1.24,0.9), mat('door',(0.86,0.76,0.56)))   # 미닫이문
for i in range(4):
    cube((0.05,0.08,1.4),(-0.6+i*0.4,-1.3,0.9), W2)
cube((4.3,3.3,0.18),(0,0,2.28), TI)                               # 처마
for i in range(9):
    cyl(0.085,3.2,(-2.0+i*0.5,0,2.44), TI2, verts=10, rot=(math.radians(90),0,0))
cube((3.0,2.2,0.5),(0,0,2.62), TI)
cube((3.2,0.9,0.42),(0,0,2.95), TI2)
cube((1.9,0.18,0.42),(0,-1.32,2.0), mat('sign',(0.42,0.13,0.11)))  # 간판
render(sc,'hanok_shop',230,230)

# ---------- 2) 기와집 (민가) ----------
sc=scene(6.2, 1.5)
W_,PL,TI,TI2 = mat('w',WOOD), mat('pl',(0.93,0.88,0.78)), mat('t',TILE), mat('t2',TILE2)
cube((2.8,2.2,0.2),(0,0,0.1), mat('base',STONE))
cube((2.6,2.0,1.6),(0,0,1.0), PL)
for x in (-1.15,1.15):
    cube((0.14,2.1,1.6),(x,0,1.0), W_)
cube((1.1,0.1,1.2),(0,-1.04,0.75), mat('door',(0.70,0.60,0.44)))
cube((3.6,2.9,0.16),(0,0,1.9), TI)
for i in range(7):
    cyl(0.08,2.8,(-1.5+i*0.5,0,2.04), TI2, verts=10, rot=(math.radians(90),0,0))
cube((2.4,1.8,0.45),(0,0,2.22), TI)
render(sc,'hanok_house',200,200)

# ---------- 3) 소나무 ----------
sc=scene(5.0, 1.4)
BARK=mat('bark',(0.36,0.25,0.18)); LEAF=mat('leaf',GREEN); LEAF2=mat('leaf2',GREEN2)
cyl(0.16,2.4,(0,0,1.2),BARK,verts=8, rot=(0,math.radians(5),0))
for (x,y,z,r) in [(-0.5,0.1,2.0,0.75),(0.55,-0.1,2.25,0.68),(0,0.2,2.65,0.8),(0.15,-0.3,2.0,0.6)]:
    ico(r,(x,y,z), LEAF if (x+z)%2<1 else LEAF2, sub=1, scale=(1.15,1.1,0.62))
render(sc,'pine',170,170)

# ---------- 4) 바위 ----------
sc=scene(2.4, 0.5)
ROCK=mat('rock',(0.55,0.53,0.56))
ico(0.55,(0,0,0.45),ROCK,sub=1,scale=(1.3,1.1,0.85))
ico(0.3,(0.45,0.15,0.25),ROCK,sub=1,scale=(1.1,1,0.8))
render(sc,'rock',90,90)

# ---------- 5) 청사초롱 기둥 ----------
sc=scene(3.0, 1.0)
POLE=mat('pole',(0.30,0.20,0.14)); LAN=mat('lan',(0.95,0.35,0.30),0.5,(1.0,0.55,0.35))
cyl(0.07,2.3,(0,0,1.15),POLE,verts=8)
cube((0.5,0.12,0.08),(0.16,0,2.25),POLE)
cube((0.34,0.34,0.44),(0.3,0,1.95),LAN)
cube((0.4,0.4,0.07),(0.3,0,2.2),mat('cap',(0.20,0.25,0.52)))
render(sc,'lantern',120,170)

# ---------- 6) 좌판 (시장 가판대) ----------
sc=scene(3.6, 0.9)
W_=mat('w',WOOD); CLOTH=mat('cloth',(0.80,0.25,0.22)); SACK=mat('sack',(0.78,0.70,0.52))
cube((1.9,1.2,0.1),(0,0,0.75),W_)
for (x,y) in [(-0.85,-0.5),(0.85,-0.5),(-0.85,0.5),(0.85,0.5)]:
    cube((0.1,0.1,0.75),(x,y,0.37),W_)
cube((2.2,1.5,0.08),(0,0,1.55),CLOTH)
for (x,y) in [(-0.95,-0.65),(0.95,-0.65),(-0.95,0.65),(0.95,0.65)]:
    cyl(0.04,0.85,(x,y,1.15),W_,verts=6)
for i,(x,y) in enumerate([(-0.5,0.1),(0.1,-0.1),(0.6,0.15)]):
    ico(0.22,(x,y,0.95),SACK,sub=1,scale=(1,1,0.9))
render(sc,'stall',150,150)
print('PROPS DONE')
