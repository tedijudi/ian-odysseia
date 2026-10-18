"""거상풍 스프라이트 베이커 — 캐릭터 정의 + 동작 정의를 받아 8방향 스프라이트를 굽습니다."""
import bpy, math, os, sys, json
from mathutils import Vector, Matrix

OUT = '/home/claude/bake2/raw'
SS = 2
W, H = 108 * SS, 144 * SS
DIRS = 8
ELEV = 30.0

# ---------- 캐릭터 정의 ----------
CHARS = {
 'dad': dict(scale=1.00, skin=(0.94,0.74,0.60), hair=(0.07,0.055,0.065), top=(0.11,0.30,0.64),
             bottom=(0.16,0.17,0.26), shoe=(0.06,0.06,0.09), accent=(0.22,0.15,0.11),
             hairstyle='swept', outfit='polo', build='man'),
 'mom': dict(scale=0.94, skin=(0.96,0.80,0.70), hair=(0.06,0.05,0.06), top=(0.93,0.91,0.86),
             bottom=(0.62,0.64,0.70), shoe=(0.90,0.88,0.84), accent=(0.86,0.70,0.76),
             hairstyle='ponytail', outfit='tee_skirt', build='woman'),
 'ian': dict(scale=0.52, skin=(0.99,0.84,0.76), hair=(0.42,0.30,0.22), top=(1.00,0.84,0.34),
             bottom=(0.78,0.74,0.66), shoe=(0.99,0.84,0.76), accent=(1.00,0.92,0.60),
             hairstyle='fuzz', outfit='romper', build='baby'),
}

# ---------- 동작 정의 (프레임 수, 포즈 함수 이름) ----------
ANIMS = {'idle':4, 'walk':8, 'attack':6, 'hurt':3, 'down':4}

def mat(name, color, rough=0.82):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 0.12
    return m

def cube(name, size, center, material, pivot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
    o = bpy.context.object; o.name = name
    o.scale = Vector(size); bpy.ops.object.transform_apply(scale=True)
    p = Vector(pivot) if pivot else Vector(center)
    o.data.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    o.data.materials.append(material); return o

def ball(name, r, center, material, scale=(1,1,1), pivot=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=18, ring_count=12, location=(0,0,0))
    o = bpy.context.object; o.name = name
    o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    p = Vector(pivot) if pivot else Vector(center)
    o.data.transform(Matrix.Translation(Vector(center) - p)); o.location = p
    o.data.materials.append(material); bpy.ops.object.shade_smooth(); return o

def attach(c, p):
    c.parent = p; c.matrix_parent_inverse = p.matrix_world.inverted()

def build(key):
    C = CHARS[key]
    SKIN, HAIR = mat('skin', C['skin']), mat('hair', C['hair'])
    TOP, BOT = mat('top', C['top']), mat('bot', C['bottom'])
    SHOE, ACC = mat('shoe', C['shoe']), mat('acc', C['accent'])
    EYE = mat('eye', (0.05,0.04,0.05)); MOUTH = mat('mouth', (0.52,0.26,0.27))
    root = bpy.data.objects.new('root', None); bpy.context.collection.objects.link(root)
    P = {}
    b = C['build']

    if b == 'baby':   # 이안이 — 앉아 있는 아기, 머리가 큰 2.5등신
        hips  = cube('hips', (0.46,0.34,0.26), (0,0,0.30), BOT)
        torso = cube('torso',(0.48,0.34,0.44), (0,0,0.62), TOP)
        head  = ball('head', 0.36, (0,0,1.14), SKIN, (1,0.95,0.98))
        hair  = ball('hair', 0.375, (0,0.02,1.22), HAIR, (1,0.96,0.72))
        ear_l = ball('ear_l',0.08, (-0.34,0,1.10), SKIN,(0.55,1,1.15))
        ear_r = ball('ear_r',0.08, ( 0.34,0,1.10), SKIN,(0.55,1,1.15))
        SH, HP = 0.80, 0.34
        arm_l = cube('arm_l',(0.15,0.16,0.42),(-0.30,0,0.60),SKIN,pivot=(-0.30,0,SH))
        arm_r = cube('arm_r',(0.15,0.16,0.42),( 0.30,0,0.60),SKIN,pivot=( 0.30,0,SH))
        leg_l = cube('leg_l',(0.17,0.18,0.40),(-0.13,0,0.16),SKIN,pivot=(-0.13,0,HP))
        leg_r = cube('leg_r',(0.17,0.18,0.40),( 0.13,0,0.16),SKIN,pivot=( 0.13,0,HP))
        hand_l= ball('hand_l',0.095,(-0.30,0,0.40),SKIN); attach(hand_l,arm_l)
        hand_r= ball('hand_r',0.095,( 0.30,0,0.40),SKIN); attach(hand_r,arm_r)
        foot_l= ball('foot_l',0.10,(-0.13,-0.03,-0.01),SKIN,(1,1.3,0.7)); attach(foot_l,leg_l)
        foot_r= ball('foot_r',0.10,( 0.13,-0.03,-0.01),SKIN,(1,1.3,0.7)); attach(foot_r,leg_r)
        frill = cube('frill',(0.56,0.38,0.09),(0,0,0.82), ACC)
        parts = [hips,torso,head,hair,ear_l,ear_r,arm_l,arm_r,leg_l,leg_r,frill]
        eyeZ, eyeY, eyeX, eyeR = 1.10, -0.315, 0.125, 0.052
        mouthZ = 1.00
    else:
        fem = (b == 'woman')
        hips  = cube('hips', (0.46 if not fem else 0.48, 0.27, 0.30), (0,0,0.98), BOT)
        torso = cube('torso',(0.52 if not fem else 0.46, 0.28, 0.70), (0,0,1.46), TOP)
        chest = cube('chest',(0.64 if not fem else 0.56, 0.30, 0.26), (0,0,1.70), TOP)
        belt  = cube('belt', (0.48, 0.29, 0.07), (0,0,1.12), ACC)
        neck  = cube('neck', (0.16, 0.16, 0.12), (0,0,1.87), SKIN)
        head  = ball('head', 0.29, (0,0,2.07), SKIN, (1,0.95,1.06))
        ear_l = ball('ear_l',0.06,(-0.27,0,2.04), SKIN,(0.6,1,1.2))
        ear_r = ball('ear_r',0.06,( 0.27,0,2.04), SKIN,(0.6,1,1.2))
        SH, HP = 1.72, 0.94
        armM = SKIN
        arm_l = cube('arm_l',(0.14,0.15,0.60),(-0.37,0,1.44),armM,pivot=(-0.37,0,SH))
        arm_r = cube('arm_r',(0.14,0.15,0.60),( 0.37,0,1.44),armM,pivot=( 0.37,0,SH))
        hand_l= ball('hand_l',0.09,(-0.37,0,1.13),SKIN); attach(hand_l,arm_l)
        hand_r= ball('hand_r',0.09,( 0.37,0,1.13),SKIN); attach(hand_r,arm_r)
        slv_l = cube('slv_l',(0.19,0.20,0.26),(-0.36,0,1.62),TOP,pivot=(-0.37,0,SH)); attach(slv_l,arm_l)
        slv_r = cube('slv_r',(0.19,0.20,0.26),( 0.36,0,1.62),TOP,pivot=( 0.37,0,SH)); attach(slv_r,arm_r)
        leg_l = cube('leg_l',(0.19,0.20,0.96),(-0.12,0,0.48),BOT,pivot=(-0.12,0,HP))
        leg_r = cube('leg_r',(0.19,0.20,0.96),( 0.12,0,0.48),BOT,pivot=( 0.12,0,HP))
        shoe_l= cube('shoe_l',(0.21,0.30,0.13),(-0.12,-0.05,0.06),SHOE); attach(shoe_l,leg_l)
        shoe_r= cube('shoe_r',(0.21,0.30,0.13),( 0.12,-0.05,0.06),SHOE); attach(shoe_r,leg_r)
        parts = [hips,torso,chest,belt,neck,head,ear_l,ear_r,arm_l,arm_r,leg_l,leg_r]
        if fem:   # 치마
            skirt = cube('skirt',(0.54,0.34,0.46),(0,0,0.90), BOT); parts.append(skirt)
        eyeZ, eyeY, eyeX, eyeR = 2.025, -0.245, 0.105, 0.042
        mouthZ = 1.945

    # 머리 모양
    hs = C['hairstyle']
    if hs == 'swept':
        hair = ball('hair',0.305,(0,0.02,2.12),HAIR,(1,0.97,0.95))
        fr   = cube('fringe',(0.54,0.26,0.11),(0,-0.10,2.20),HAIR); parts += [hair,fr]
    elif hs == 'ponytail':
        hair = ball('hair',0.315,(0,0.01,2.11),HAIR,(1,1.0,1.0))
        fr   = cube('fringe',(0.56,0.26,0.13),(0,-0.11,2.19),HAIR)
        side_l=cube('side_l',(0.09,0.22,0.42),(-0.27,0.02,1.92),HAIR)
        side_r=cube('side_r',(0.09,0.22,0.42),( 0.27,0.02,1.92),HAIR)
        tail = cube('tail',(0.16,0.17,0.52),(0,0.30,1.86),HAIR)
        parts += [hair,fr,side_l,side_r,tail]
    elif hs == 'fuzz':
        hair = ball('hair',0.372,(0,0.02,1.26),HAIR,(1,0.96,0.52))
        curl = ball('curl',0.07,(0,0.02,1.52),HAIR,(1,0.8,1.2)); parts += [hair,curl]

    # 얼굴
    eye_l = ball('eye_l',eyeR,(-eyeX,eyeY,eyeZ),EYE,(1,0.6,1.2))
    eye_r = ball('eye_r',eyeR,( eyeX,eyeY,eyeZ),EYE,(1,0.6,1.2))
    brow_l= cube('brow_l',(eyeR*2.4,0.03,0.02),(-eyeX,eyeY+0.01,eyeZ+0.065),HAIR)
    brow_r= cube('brow_r',(eyeR*2.4,0.03,0.02),( eyeX,eyeY+0.01,eyeZ+0.065),HAIR)
    mouth = cube('mouth',(eyeR*1.8,0.03,0.016),(0,eyeY+0.004,mouthZ),MOUTH)
    for o in (eye_l,eye_r,brow_l,brow_r,mouth): attach(o, head)
    parts += [eye_l,eye_r,brow_l,brow_r,mouth]

    for o in parts:
        if o.parent is None: attach(o, root)
    root.scale = (C['scale'],)*3
    P.update(root=root, head=head,
             arm_l=arm_l, arm_r=arm_r, leg_l=leg_l, leg_r=leg_r, torso=torso)
    return P

# ---------- 포즈 ----------
def pose(P, anim, f, n):
    root, head = P['root'], P['head']
    al, ar, ll, lr, torso = P['arm_l'], P['arm_r'], P['leg_l'], P['leg_r'], P['torso']
    for o in (al, ar, ll, lr, torso, head): o.rotation_euler = (0,0,0)
    root.location = (0,0,0); root.rotation_euler.x = 0; root.rotation_euler.y = 0
    t = f / n * math.tau
    if anim == 'walk':
        sw = math.sin(t)*0.40
        ll.rotation_euler=(sw,0,0); lr.rotation_euler=(-sw,0,0)
        al.rotation_euler=(-sw*0.7,0,0); ar.rotation_euler=(sw*0.7,0,0)
        root.location.z = abs(math.sin(t))*0.045
        torso.rotation_euler=(0,0,math.sin(t)*0.07); head.rotation_euler=(0,0,-math.sin(t)*0.05)
    elif anim == 'idle':
        br = math.sin(t)*0.035
        root.location.z = br*0.4
        al.rotation_euler=(br*0.3,0,0); ar.rotation_euler=(-br*0.3,0,0)
        torso.rotation_euler=(0,0,br*0.4); head.rotation_euler=(0,0,-br*0.5)
    elif anim == 'attack':
        k = f/(n-1)
        wind = math.sin(min(1,k*1.5)*math.pi*0.5)
        ar.rotation_euler=(-2.2*wind,0,0.3*wind); al.rotation_euler=(0.5*wind,0,-0.2*wind)
        torso.rotation_euler=(0,0,-0.35*wind); head.rotation_euler=(0,0,-0.12*wind)
        root.location.y = -0.06*wind
        ll.rotation_euler=(0.18*wind,0,0); lr.rotation_euler=(-0.2*wind,0,0)
    elif anim == 'hurt':
        k = f/(n-1)
        torso.rotation_euler=(-0.22*(1-k),0,0); head.rotation_euler=(-0.3*(1-k),0,0)
        al.rotation_euler=(0.5*(1-k),0,0); ar.rotation_euler=(0.5*(1-k),0,0)
        root.location.y = 0.1*(1-k)
    elif anim == 'down':
        k = f/(n-1)
        root.rotation_euler.x = -math.radians(78)*k
        root.location.z = -0.25*k
        al.rotation_euler=(0.6*k,0,0); ar.rotation_euler=(0.7*k,0,0)
        ll.rotation_euler=(-0.3*k,0,0); lr.rotation_euler=(-0.2*k,0,0)

# ---------- 장면 ----------
def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=18; sc.cycles.use_denoising=True
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.film_transparent = True
    sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
    sc.view_settings.view_transform='Standard'
    bpy.ops.object.light_add(type='SUN'); k=bpy.context.object
    k.data.energy=2.6; k.data.angle=0.35; k.rotation_euler=(math.radians(52),0,math.radians(-40))
    bpy.ops.object.light_add(type='SUN'); fi=bpy.context.object
    fi.data.energy=0.9; fi.data.color=(0.80,0.86,1.0); fi.rotation_euler=(math.radians(65),0,math.radians(140))
    bpy.ops.object.light_add(type='SUN'); ri=bpy.context.object
    ri.data.energy=0.7; ri.data.color=(1.0,0.92,0.84); ri.rotation_euler=(math.radians(100),0,math.radians(190))
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes['Background'].inputs[0].default_value=(0.45,0.48,0.60,1)
    w.node_tree.nodes['Background'].inputs[1].default_value=0.38
    bpy.ops.object.camera_add(); cam=bpy.context.object
    cam.data.type='ORTHO'; cam.data.ortho_scale=2.75; sc.camera=cam
    el=math.radians(ELEV); d=14.0
    cam.location=(0,-d*math.cos(el), d*math.sin(el)+1.15)
    cam.rotation_euler=(math.radians(90)-el,0,0)
    return sc

os.makedirs(OUT, exist_ok=True)
meta = {}
for key in CHARS:
    sc = setup_scene()
    P = build(key)
    meta[key] = {a: n for a, n in ANIMS.items()}
    for anim, n in ANIMS.items():
        for d in range(DIRS):
            P['root'].rotation_euler.z = math.radians(d*(360/DIRS))
            for f in range(n):
                pose(P, anim, f, n)
                P['root'].rotation_euler.z = math.radians(d*(360/DIRS))
                bpy.context.view_layer.update()
                sc.render.filepath = f'{OUT}/{key}_{anim}_d{d}_f{f:02d}.png'
                bpy.ops.render.render(write_still=True)
        print(f'{key} {anim} done', flush=True)
json.dump(meta, open(f'{OUT}/meta.json','w'))
print('ALL DONE')
