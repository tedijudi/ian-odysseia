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


def leafy(name, trunk_c, leaf_cs, h=2.4, spread=0.95, blobs=6, ortho=5.0, lean=0.0, drop=0.62):
    """나무 — 수관을 낮고 두껍게 (거상 느낌)"""
    sc=scene(ortho, h*0.52)
    BARK=mat('bark',trunk_c); BARK2=mat('bark2',tuple(min(1,c*1.35) for c in trunk_c))
    cyl(0.16,h,(0,0,h/2),BARK,verts=9,rot=(0,math.radians(lean),0))
    cyl(0.21,0.26,(0,0,0.11),BARK,verts=9)                      # 밑동
    for a in (0.5, 2.3, 4.1, 5.4):                               # 가지
        cyl(0.075,0.95,(math.cos(a)*0.34,math.sin(a)*0.28,h*drop+0.18),BARK2,verts=6,
            rot=(math.radians(58),0,a))
    MATS=[mat(f'l{i}',c) for i,c in enumerate(leaf_cs)]
    for i in range(blobs):
        a=random.random()*6.283; r=random.random()*spread
        x,y = math.cos(a)*r, math.sin(a)*r*0.8
        z = h*drop + random.random()*h*0.34
        ico(0.46+random.random()*0.34,(x,y,z),MATS[i%len(MATS)],sub=1,
            scale=(1.25,1.15,0.74),rot=(0,0,random.random()*3))
    render(sc,name,int(ortho*34),int(ortho*34))

leafy('tree_pine',   (0.34,0.24,0.17), [(0.20,0.42,0.22),(0.26,0.50,0.26),(0.16,0.34,0.19)], h=2.8, blobs=11, spread=1.05)
leafy('tree_cherry', (0.40,0.30,0.24), [(0.96,0.76,0.84),(1.00,0.86,0.90),(0.92,0.68,0.78)], h=2.3, blobs=11, spread=1.00)
leafy('tree_maple',  (0.36,0.25,0.17), [(0.84,0.42,0.18),(0.92,0.56,0.22),(0.72,0.30,0.14)], h=2.4, blobs=10, spread=0.98)
leafy('tree_green',  (0.33,0.24,0.16), [(0.38,0.60,0.26),(0.46,0.68,0.30),(0.28,0.50,0.22)], h=2.6, blobs=11, lean=4, spread=1.02)
leafy('tree_willow', (0.38,0.30,0.20), [(0.56,0.70,0.32),(0.64,0.78,0.38)], h=2.2, spread=1.25, blobs=12, drop=0.55)
leafy('tree_dark',   (0.28,0.20,0.14), [(0.18,0.34,0.20),(0.22,0.40,0.22)], h=3.0, blobs=12, spread=1.05, drop=0.66)
print('TREES DONE')
