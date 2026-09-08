import * as THREE from 'three';
import type { MachineDefinition, PartCategory, Setup } from '../../types';
import { deriveVehicle, getPart } from '../../data/parts';

export interface CarVisual {
  root: THREE.Group;
  parts: Map<PartCategory, THREE.Group>;
  wheels: THREE.Object3D[];
  dispose: () => void;
  setExploded: (amount:number) => void;
  setFocus: (category?:PartCategory) => void;
  spinWheels: (angle:number) => void;
}

const EXPLODE: Record<PartCategory, THREE.Vector3> = {
  body:new THREE.Vector3(0,0.55,0), chassis:new THREE.Vector3(0,-0.32,0), motor:new THREE.Vector3(-0.55,0.02,0.15),
  gear:new THREE.Vector3(0.55,0.02,0.18), tire:new THREE.Vector3(0.70,0,0), roller:new THREE.Vector3(0.82,0,0.35),
  battery:new THREE.Vector3(0,0.25,-0.45), wing:new THREE.Vector3(0,0.35,-0.75), brake:new THREE.Vector3(0,-0.16,0.72),
};

function material(color:number, metalness=0.15, roughness=0.42, transparent=false){
  return new THREE.MeshStandardMaterial({color,metalness,roughness,transparent,opacity:1});
}
function mesh(g:THREE.BufferGeometry,m:THREE.Material,cast=true){const x=new THREE.Mesh(g,m);x.castShadow=cast;x.receiveShadow=true;return x;}

function profileBody(points:Array<[number,number]>, width:number, color:number):THREE.Mesh {
  const shape=new THREE.Shape(); shape.moveTo(points[0]![0],points[0]![1]); for(const p of points.slice(1))shape.lineTo(p[0],p[1]); shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSize:0.004,bevelThickness:0.004,bevelSegments:2,curveSegments:4});
  geo.translate(0,0,-width/2); geo.rotateY(Math.PI/2);
  return mesh(geo,material(color,0.25,0.30));
}

function addMachineShell(group:THREE.Group,machine:MachineDefinition,bodyVariant:number){
  const accent=machine.accent, secondary=machine.secondary;
  if(machine.id==='aero-falcon'){
    const b=profileBody([[-0.105,0],[-0.085,0.020],[-0.02,0.035],[0.08,0.030],[0.105,0.010],[0.10,0]],0.083,accent);b.position.y=0.025;group.add(b);
    const canopy=mesh(new THREE.SphereGeometry(0.032,20,12,0,Math.PI*2,0,Math.PI/2),material(0x89b8cc,0.45,0.17,true));canopy.scale.set(0.62,0.65,1.45);canopy.position.set(0,0.063,-0.005);group.add(canopy);
    for(const sx of [-1,1]){const fin=mesh(new THREE.BoxGeometry(0.006,0.035,0.06),material(secondary,0.1,0.38));fin.position.set(sx*0.034,0.052,-0.055);group.add(fin);}
  } else if(machine.id==='torque-bison'){
    const b=profileBody([[-0.095,0],[-0.08,0.026],[-0.035,0.052],[0.045,0.055],[0.092,0.032],[0.10,0]],0.088,accent);b.position.y=0.022;group.add(b);
    const pod=mesh(new THREE.BoxGeometry(0.074,0.035,0.07),material(secondary,0.35,0.34));pod.position.set(0,0.059,-0.005);pod.rotation.x=-0.08;group.add(pod);
    for(const sx of [-1,1]){const shoulder=mesh(new THREE.CapsuleGeometry(0.014,0.052,4,12),material(accent,0.2,0.35));shoulder.rotation.x=Math.PI/2;shoulder.position.set(sx*0.043,0.04,0.012);group.add(shoulder);}
  } else if(machine.id==='corner-lynx'){
    const b=profileBody([[-0.108,0],[-0.082,0.016],[-0.025,0.030],[0.064,0.026],[0.105,0.010],[0.10,0]],0.054,accent);b.position.y=0.026;group.add(b);
    const spine=mesh(new THREE.BoxGeometry(0.028,0.027,0.15),material(secondary,0.28,0.30));spine.position.set(0,0.055,-0.008);group.add(spine);
    for(const sx of [-1,1]){const blade=mesh(new THREE.BoxGeometry(0.014,0.012,0.12),material(accent,0.1,0.35));blade.position.set(sx*0.043,0.032,-0.002);blade.rotation.z=sx*0.10;group.add(blade);}
  } else {
    const belly=mesh(new THREE.CapsuleGeometry(0.035,0.135,7,18),material(accent,0.30,0.25));belly.rotation.x=Math.PI/2;belly.scale.x=1.15;belly.position.set(0,0.045,0);group.add(belly);
    const canopy=mesh(new THREE.SphereGeometry(0.033,20,14),material(0xc3e9f7,0.35,0.16,true));canopy.scale.set(0.72,0.55,1.3);canopy.position.set(0,0.073,-0.022);group.add(canopy);
    for(const sx of [-1,1]){const pod=mesh(new THREE.SphereGeometry(0.027,14,10),material(secondary,0.22,0.34));pod.scale.set(0.65,0.45,1.8);pod.position.set(sx*0.045,0.035,0.015);group.add(pod);}
  }
  if(bodyVariant===0) group.scale.set(0.98,0.93,1.01);
  if(bodyVariant===2) {group.scale.set(1.02,1.02,1.03); const keel=mesh(new THREE.BoxGeometry(0.075,0.008,0.12),material(secondary,0.1,0.48));keel.position.set(0,0.018,0.012);group.add(keel);}
}

function makePartGroup(category:PartCategory){const g=new THREE.Group();g.name=`part-${category}`;g.userData.base=g.position.clone();return g;}

export function createCarVisual(machine:MachineDefinition,setup:Setup,compact=false):CarVisual {
  const root=new THREE.Group(); root.name=`car-${machine.id}`;
  const parts=new Map<PartCategory,THREE.Group>();
  const add=(cat:PartCategory)=>{const g=makePartGroup(cat);parts.set(cat,g);root.add(g);return g;};
  const dv=deriveVehicle(machine,setup);
  const body=add('body'); addMachineShell(body,machine,getPart(setup.body).modelVariant);
  const chassis=add('chassis');
  const chassisMain=mesh(new THREE.BoxGeometry(0.082,0.014,0.175),material(0x202529,0.18,0.52));chassisMain.position.y=0.016;chassis.add(chassisMain);
  for(const z of [-0.072,0.072]){const bumper=mesh(new THREE.BoxGeometry(0.135,0.008,0.018),material(0x4c5257,0.6,0.28));bumper.position.set(0,0.014,z);chassis.add(bumper);}
  const motor=add('motor'); const motorMesh=mesh(new THREE.CylinderGeometry(0.013,0.013,0.052,18),material(0xb7b9bc,0.8,0.22));motorMesh.rotation.z=Math.PI/2;motorMesh.position.set(-0.012,0.029,0.025);motor.add(motorMesh);
  const gear=add('gear'); const gearMesh=mesh(new THREE.TorusGeometry(0.017,0.004,8,22),material(0xf0c34e,0.3,0.38));gearMesh.rotation.y=Math.PI/2;gearMesh.position.set(0.028,0.030,0.034);gear.add(gearMesh);
  const battery=add('battery');
  for(const x of [-0.016,0.016]){const cell=mesh(new THREE.CylinderGeometry(0.010,0.010,0.075,16),material(getPart(setup.battery).modelVariant===2?0xd85d45:0x7fb55d,0.35,0.32));cell.rotation.x=Math.PI/2;cell.position.set(x,0.028,-0.022);battery.add(cell);}
  const tire=add('tire'); const wheels:THREE.Object3D[]=[]; const r=dv.tireRadiusM*2.25; const wheelZ=0.062;
  for(const x of [-0.049,0.049]) for(const z of [-wheelZ,wheelZ]){
    const wheel=new THREE.Group();wheel.position.set(x,0.021,z);
    const rubber=mesh(new THREE.CylinderGeometry(r,r,0.012,24),material(0x151617,0.02,0.86));rubber.rotation.z=Math.PI/2;wheel.add(rubber);
    const rim=mesh(new THREE.CylinderGeometry(r*0.58,r*0.58,0.013,12),material(machine.secondary,0.65,0.24));rim.rotation.z=Math.PI/2;wheel.add(rim);tire.add(wheel);wheels.push(wheel);
  }
  const roller=add('roller'); const rv=getPart(setup.roller).modelVariant; const rr=[0.010,0.014,0.018][rv]??0.014; const rollerX=rv===2?0.076:0.069;
  for(const x of [-rollerX,rollerX]) for(const z of [-0.086,0.086]){const disk=mesh(new THREE.CylinderGeometry(rr,rr,0.006,20),material(0xbfc9d3,0.8,0.2));disk.position.set(x,0.025,z);roller.add(disk);}
  const wing=add('wing'); const wv=getPart(setup.wing).modelVariant; const wingWidth=[0.060,0.092,0.125][wv]??0.09;
  const wingMesh=mesh(new THREE.BoxGeometry(wingWidth,0.007,0.028),material(machine.secondary,0.25,0.34));wingMesh.position.set(0,0.078,-0.082);wingMesh.rotation.x=0.10;wing.add(wingMesh);
  for(const x of [-wingWidth*0.36,wingWidth*0.36]){const mount=mesh(new THREE.BoxGeometry(0.006,0.038,0.008),material(0x353a3e,0.4,0.4));mount.position.set(x,0.055,-0.074);wing.add(mount);}
  const brake=add('brake'); const bv=getPart(setup.brake).modelVariant; const pad=mesh(new THREE.BoxGeometry(0.064,0.006,0.016+0.005*bv),material([0x6b7a5c,0xc08b45,0xa64e42][bv]??0xc08b45,0.05,0.7));pad.position.set(0,0.006,0.082);brake.add(pad);
  if(compact) root.scale.setScalar(0.84);
  root.traverse((o)=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});

  const setExploded=(amount:number)=>{for(const [cat,g] of parts){const e=EXPLODE[cat];g.position.copy(e).multiplyScalar(amount);}};
  const setFocus=(category?:PartCategory)=>{for(const [cat,g] of parts){g.scale.setScalar(category===cat?1.24:1);g.traverse((o)=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial){o.material.emissive.setHex(category===cat?machine.accent:0x000000);o.material.emissiveIntensity=category===cat?0.15:0;}});}};
  const spinWheels=(angle:number)=>{for(const w of wheels)w.rotation.x=angle;};
  const dispose=()=>{root.traverse((o)=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.dispose();}});};
  return {root,parts,wheels,dispose,setExploded,setFocus,spinWheels};
}
