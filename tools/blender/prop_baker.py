"""거상풍 배경 소품 — 나무·수풀·바위·건물을 다양하게. 고정 쿼터뷰 각도로 굽습니다."""
import bpy, math, os, random
from mathutils import Vector
OUT='/home/claude/bake3/raw'; os.makedirs(OUT, exist_ok=True)
SS=2; ELEV=30.0
random.seed(7)

def mat(n,c,rough=0.86,emit=None):
    m=bpy.data.materials.new(n); m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=rough
    b.inputs['Specular IOR Level'].default_value=0.10
    if emit:
        b.inputs['Emission Color'].default_value=(*emit,1); b.inputs['Emission Strength'].default_value=2.0
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

def scene(ortho, hoff=0.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc=bpy.context.scene
    sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=22; sc.cycles.use_denoising=True
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
    el=math.radians(ELEV); d=34.0
    cam.location=(0,-d*math.cos(el), d*math.sin(el)+hoff)
    cam.rotation_euler=(math.radians(90)-el,0,0)
    return sc
def render(sc,name,px,py):
    sc.render.resolution_x, sc.render.resolution_y = px*SS, py*SS
    sc.render.filepath=f'{OUT}/{name}.png'
    bpy.ops.render.render(write_still=True); print('saved',name,flush=True)

# ============ 나무들 ============
def leafy(name, trunk_c, leaf_cs, h=2.4, spread=0.95, blobs=6, ortho=5.0, lean=0.0):
    sc=scene(ortho, h*0.52)
    BARK=mat('bark',trunk_c)
    cyl(0.15,h,(0,0,h/2),BARK,verts=8,rot=(0,math.radians(lean),0))
    # 굵은 가지
    for a in (0.6, 2.6, 4.4):
        cyl(0.07,0.8,(math.cos(a)*0.3,math.sin(a)*0.25,h*0.72),BARK,verts=6,
            rot=(math.radians(60),0,a))
    MATS=[mat(f'l{i}',c) for i,c in enumerate(leaf_cs)]
    for i in range(blobs):
        a=random.random()*6.283; r=random.random()*spread
        x,y = math.cos(a)*r, math.sin(a)*r*0.8
        z = h*0.82 + (random.random()-0.4)*0.55
        ico(0.42+random.random()*0.3,(x,y,z),MATS[i%len(MATS)],sub=1,
            scale=(1.2,1.1,0.68),rot=(0,0,random.random()*3))
    render(sc,name,int(ortho*34),int(ortho*34))

leafy('tree_pine',   (0.34,0.24,0.17), [(0.20,0.42,0.22),(0.26,0.50,0.26),(0.16,0.34,0.19)], h=2.8, blobs=7)
leafy('tree_cherry', (0.40,0.30,0.24), [(0.96,0.76,0.84),(1.00,0.86,0.90),(0.92,0.68,0.78)], h=2.3, blobs=7)
leafy('tree_maple',  (0.36,0.25,0.17), [(0.84,0.42,0.18),(0.92,0.56,0.22),(0.72,0.30,0.14)], h=2.4, blobs=6)
leafy('tree_green',  (0.33,0.24,0.16), [(0.38,0.60,0.26),(0.46,0.68,0.30),(0.28,0.50,0.22)], h=2.6, blobs=7, lean=4)
leafy('tree_willow', (0.38,0.30,0.20), [(0.56,0.70,0.32),(0.64,0.78,0.38)], h=2.2, spread=1.2, blobs=8)
leafy('tree_dark',   (0.28,0.20,0.14), [(0.18,0.34,0.20),(0.22,0.40,0.22)], h=3.0, blobs=8)

# ============ 수풀 · 풀포기 ============
def bush(name, cs, n=5, sz=0.44, ortho=2.2):
    sc=scene(ortho,0.45)
    MATS=[mat(f'b{i}',c) for i,c in enumerate(cs)]
    for i in range(n):
        a=random.random()*6.283; r=random.random()*0.42
        ico(sz*(0.7+random.random()*0.5),(math.cos(a)*r,math.sin(a)*r*0.8,0.3+random.random()*0.2),
            MATS[i%len(MATS)],sub=1,scale=(1.2,1.1,0.8),rot=(0,0,random.random()*3))
    render(sc,name,int(ortho*34),int(ortho*34))
bush('bush_green',[(0.30,0.52,0.24),(0.38,0.60,0.28)])
bush('bush_flower',[(0.32,0.54,0.26),(0.90,0.46,0.58),(0.96,0.70,0.40)],n=6)
bush('bush_dry',[(0.56,0.52,0.30),(0.64,0.58,0.34)],n=4,sz=0.36)

def grasstuft(name, c, ortho=1.3):
    sc=scene(ortho,0.26)
    M=mat('g',c)
    for i in range(9):
        a=random.random()*6.283; r=random.random()*0.22
        cube((0.04,0.04,0.3+random.random()*0.25),(math.cos(a)*r,math.sin(a)*r,0.18),M,
             rot=(math.radians(random.uniform(-16,16)),math.radians(random.uniform(-16,16)),0))
    render(sc,name,int(ortho*34),int(ortho*34))
grasstuft('grass_a',(0.36,0.60,0.26))
grasstuft('grass_b',(0.52,0.62,0.30))

# ============ 바위 ============
def rock(name, c, n=2, ortho=2.0, big=0.52):
    sc=scene(ortho,0.4)
    M=mat('r',c)
    ico(big,(0,0,big*0.75),M,sub=1,scale=(1.3,1.1,0.85),rot=(random.random(),random.random(),random.random()))
    for i in range(n):
        a=random.random()*6.283
        ico(big*0.5,(math.cos(a)*big*0.9,math.sin(a)*big*0.7,big*0.4),M,sub=1,
            scale=(1.1,1,0.8),rot=(random.random(),random.random(),random.random()))
    render(sc,name,int(ortho*34),int(ortho*34))
rock('rock_gray',(0.54,0.52,0.55))
rock('rock_moss',(0.42,0.48,0.38))
rock('rock_big',(0.50,0.48,0.52),n=3,ortho=3.2,big=0.85)

print('TREES DONE')
