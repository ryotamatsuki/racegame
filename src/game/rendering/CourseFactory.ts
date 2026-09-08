import * as THREE from 'three';
import type { CourseId, LaneTrack, Vec3 } from '../../types';
import { buildLaneTrack } from '../../data/courses';

const tv=(v:Vec3)=>new THREE.Vector3(v.x,v.y,v.z);

function ribbonGeometry(track:LaneTrack,width:number,height=0):THREE.BufferGeometry {
  const vertices:number[]=[];const normals:number[]=[];const indices:number[]=[];const n=track.points.length;
  for(const p of track.points){
    const pos=tv(p.position).addScaledVector(tv(p.normal),height),side=tv(p.side),normal=tv(p.normal);
    for(const sign of [-1,1]){const x=pos.clone().addScaledVector(side,sign*width/2);vertices.push(x.x,x.y,x.z);normals.push(normal.x,normal.y,normal.z);}
  }
  for(let i=0;i<n;i++){const j=(i+1)%n;const a=i*2,b=a+1,c=j*2,d=c+1;indices.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);g.computeBoundingSphere();return g;
}

function railGeometry(track:LaneTrack,sideSign:number):THREE.BufferGeometry{
  const vertices:number[]=[];const indices:number[]=[];const n=track.points.length;const half=0.29;
  for(const p of track.points){const pos=tv(p.position).addScaledVector(tv(p.side),sideSign*half),normal=tv(p.normal);const low=pos.clone().addScaledVector(normal,0.015),high=pos.clone().addScaledVector(normal,0.11);vertices.push(low.x,low.y,low.z,high.x,high.y,high.z);}
  for(let i=0;i<n;i++){const j=(i+1)%n;const a=i*2,b=a+1,c=j*2,d=c+1;indices.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function createCourseVisual(courseId:CourseId):{root:THREE.Group;tracks:LaneTrack[];dispose:()=>void}{
  const root=new THREE.Group(); const tracks=[0,1,2,3].map((lane)=>buildLaneTrack(courseId,lane));
  tracks.forEach((track,lane)=>{
    const surface=new THREE.Mesh(ribbonGeometry(track,0.56),new THREE.MeshStandardMaterial({color:[0xd6d6d0,0xe7e4d8,0xd6d6d0,0xe7e4d8][lane],roughness:0.66,metalness:0.03,side:THREE.DoubleSide}));surface.receiveShadow=true;root.add(surface);
    for(const sign of [-1,1]){const rail=new THREE.Mesh(railGeometry(track,sign),new THREE.MeshStandardMaterial({color:0xb73b35,roughness:0.45,metalness:0.18,side:THREE.DoubleSide}));rail.castShadow=true;root.add(rail);}
  });
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(42,32),new THREE.MeshStandardMaterial({color:0x303536,roughness:0.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-0.04;floor.receiveShadow=true;root.add(floor);
  const grid=new THREE.GridHelper(42,42,0x565d59,0x414845);grid.position.y=-0.025;root.add(grid);
  for(const [x,z] of [[-16,-11],[16,-11],[-16,11],[16,11]] as Array<[number,number]>){const stand=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.18,1.4,10),new THREE.MeshStandardMaterial({color:0x737b7d,metalness:0.65,roughness:0.3}));stand.position.set(x,0.7,z);root.add(stand);}
  const dispose=()=>root.traverse((o)=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});
  return {root,tracks,dispose};
}
