"""Ear-only, low-cost preview. Does not load the rejected Buddy scene."""
import bpy, math
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'design/buddy3d/ear_spike'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 16
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
sc.cycles.time_limit = 65
sc.render.resolution_x = sc.render.resolution_y = 360
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.world = bpy.data.worlds.new('Warm soft studio')
sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (.82,.80,.87,1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value = .5

def color(hexcode):
    vals = [int(hexcode[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)+(1,)

def material(name, tint, hair=False):
    m=bpy.data.materials.new(name); m.use_nodes=True
    n=m.node_tree.nodes; l=m.node_tree.links
    if hair:
        n.clear(); out=n.new('ShaderNodeOutputMaterial')
        p=n.new('ShaderNodeBsdfHairPrincipled'); p.parametrization='COLOR'
        p.inputs['Color'].default_value=color(tint)
        p.inputs['Roughness'].default_value=.72
        l.new(p.outputs[0],out.inputs['Surface'])
    else:
        p=n.get('Principled BSDF'); p.inputs['Base Color'].default_value=color(tint)
        p.inputs['Roughness'].default_value=.88
        p.inputs['Specular IOR Level'].default_value=.12
    return m

purple=material('Lavender undercoat','BA96FA')
pink=material('Pink recessed velvet','ED98EB')
purple_hair=material('Lavender plush fibers','BA96FA',True)
pink_hair=material('Pink velvet fibers','ED98EB',True)

# Front points toward -Y. This profile is a continuous padded bowl:
# the pink floor is behind the thick rounded lip, never a pasted disc.
profile=[(0,.055),(.15,.045),(.30,.010),(.43,-.075),(.49,-.17),
         (.53,-.24),(.60,-.335),(.70,-.385),(.80,-.35),(.90,-.24),
         (.97,-.08),(1.0,.055),(.98,.18),(.90,.28),(.70,.31),(.40,.29),(0,.27)]

def smooth_profile(points, subdivisions=5):
    result=[]
    for i in range(len(points)-1):
        p0=points[max(0,i-1)];p1=points[i];p2=points[i+1];p3=points[min(len(points)-1,i+2)]
        for j in range(subdivisions):
            t=j/subdivisions
            result.append(tuple(.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t) for k in (0,1)))
    result.append(points[-1]); return result

prof=smooth_profile(profile)
verts=[];faces=[];segments=128
angle=math.radians(-14)
for r,y in prof:
    for j in range(segments):
        a=2*pi*j/segments
        x=r*cos(a)+.06*(1-r)
        z=1.015*r*sin(a)-.08*(1-r)
        verts.append((x*cos(angle)-z*sin(angle),y,x*sin(angle)+z*cos(angle)))
for i in range(len(prof)-1):
    for j in range(segments):
        faces.append((i*segments+j,i*segments+(j+1)%segments,(i+1)*segments+(j+1)%segments,(i+1)*segments+j))
mesh=bpy.data.meshes.new('Continuous upholstered cup');mesh.from_pydata(verts,[],faces);mesh.update()
ear=bpy.data.objects.new('Viewer-left ear only',mesh);sc.collection.objects.link(ear)
ear.data.materials.append(purple);ear.data.materials.append(pink)
for p in mesh.polygons:
    p.use_smooth=True
    ring=p.index//segments
    if ring<25:p.material_index=1
bpy.context.view_layer.objects.active=ear;ear.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')

def fur(name, mat, count, length, pink_region):
    vg=ear.vertex_groups.new(name=name)
    for i,(r,y) in enumerate(prof):
        is_front=i<50
        w=(1 if r<.49 and is_front else 0) if pink_region else (1 if r>=.50 else 0)
        for j in range(segments):vg.add([i*segments+j],w,'REPLACE')
    ear.data.materials.append(mat)
    bpy.ops.object.particle_system_add();ps=ear.particle_systems[-1]
    s=ps.settings;s.type='HAIR';s.count=count;s.hair_length=length;s.hair_step=3
    s.child_type='INTERPOLATED';s.rendered_child_count=8;s.child_percent=2
    s.root_radius=.65;s.tip_radius=.08;s.radius_scale=.0012
    s.roughness_1=.006;s.roughness_1_size=.15;s.roughness_2=.004
    s.kink='WAVE';s.kink_amplitude=.0025;s.kink_frequency=1.5
    s.clump_factor=.035;s.material=len(ear.data.materials)
    ps.vertex_group_density=vg.name;ps.seed=29 if pink_region else 17
fur('Outer short plush',purple_hair,14000,.026,False)
fur('Pink short velvet',pink_hair,4000,.014,True)

def aim(obj,point):obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);sc.collection.objects.link(o);o.location=loc;aim(o,(0,0,0))
area('Large upper-left softbox',(-3,-4,5),220,4)
area('Broad fill',(3,-3,1),65,4)
area('Soft top edge',(-1,2,3),100,3)
bpy.ops.object.camera_add(location=(.10,-7,.32));cam=bpy.context.object
aim(cam,(0,0,0));cam.data.type='ORTHO';cam.data.ortho_scale=2.72;sc.camera=cam
# Background plane only; no head, face, body, skeleton or animation.
bg=material('Warm ivory background','FCFAF3')
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,2,0),rotation=(pi/2,0,0))
bpy.context.object.data.materials.append(bg)
sc.render.filepath=str(OUT/'ear_preview.png')
bpy.ops.render.render(write_still=True)
print('EAR_ONLY_PREVIEW_COMPLETE',flush=True)
