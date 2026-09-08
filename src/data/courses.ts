import type { CourseId, LaneTrack, TrackPoint, Vec3 } from '../types';

export interface CourseDefinition {
  id: CourseId;
  name: string;
  subtitle: string;
  description: string;
  difficulty: string;
}

export const COURSES: CourseDefinition[] = [
  { id:'workshop-oval', name:'WORKSHOP OVAL', subtitle:'入門', description:'直線、緩いカーブ、小さな起伏。最高速と加速を比較する基準コース。', difficulty:'EASY' },
  { id:'technical-ridge', name:'TECHNICAL RIDGE', subtitle:'テクニカル', description:'連続コーナー、バンク、登坂、下り、ジャンプを組み合わせた技巧派コース。', difficulty:'HARD' },
  { id:'sky-loop', name:'SKY LOOP', subtitle:'ループ', description:'垂直ループ、立体交差、高架、ジャンプを持つ立体コース。', difficulty:'EXPERT' },
];

const v = (x:number,y:number,z:number):Vec3 => ({x,y,z});
const add = (a:Vec3,b:Vec3):Vec3 => v(a.x+b.x,a.y+b.y,a.z+b.z);
const sub = (a:Vec3,b:Vec3):Vec3 => v(a.x-b.x,a.y-b.y,a.z-b.z);
const mul = (a:Vec3,k:number):Vec3 => v(a.x*k,a.y*k,a.z*k);
const dot = (a:Vec3,b:Vec3) => a.x*b.x+a.y*b.y+a.z*b.z;
const cross = (a:Vec3,b:Vec3):Vec3 => v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const len = (a:Vec3) => Math.hypot(a.x,a.y,a.z);
const norm = (a:Vec3):Vec3 => { const l=Math.max(1e-9,len(a)); return mul(a,1/l); };
const dist = (a:Vec3,b:Vec3) => len(sub(a,b));
const clamp01 = (x:number) => Math.max(0,Math.min(1,x));

function rotateAroundAxis(vec:Vec3, axis:Vec3, angle:number):Vec3 {
  const a = norm(axis); const c=Math.cos(angle), s=Math.sin(angle);
  return add(add(mul(vec,c),mul(cross(a,vec),s)),mul(a,dot(a,vec)*(1-c)));
}

interface ParamSample { position:Vec3; normalHint?:Vec3; bank:number; section:string; brakeZone:number; jumpTakeoff:boolean; jumpLanding:boolean; loop:boolean; loopRadius?:number; }

function ovalParam(t:number):ParamSample {
  const a=Math.PI*2*t;
  const x=12*Math.sin(a), z=-7*Math.cos(a), y=0.18+0.22*Math.max(0,Math.sin(a*2));
  return { position:v(x,y,z), bank:0.08*Math.sin(a), section:t<0.12?'START STRAIGHT':t<0.38?'SOUTH ARC':t<0.62?'BACK STRAIGHT':t<0.88?'NORTH ARC':'FINISH STRAIGHT', brakeZone:0, jumpTakeoff:false,jumpLanding:false,loop:false };
}

function technicalParam(t:number):ParamSample {
  const a=Math.PI*2*t;
  const x=10.5*Math.sin(a)+2.2*Math.sin(a*3);
  const z=-6.8*Math.cos(a)+1.1*Math.sin(a*2);
  let y=0.25+0.65*Math.sin(a-0.35)+0.35*Math.sin(a*2.2);
  if (t>0.18&&t<0.30) y += 1.2*Math.sin(((t-0.18)/0.12)*Math.PI);
  if (t>0.58&&t<0.72) y += 0.9*Math.sin(((t-0.58)/0.14)*Math.PI);
  const jumpTakeoff=t>0.735&&t<0.742;
  const jumpLanding=t>0.79&&t<0.798;
  const bank = 0.24*Math.sin(a*3);
  const brakeZone = (t>0.67&&t<0.75)?1:(t>0.35&&t<0.40)?0.45:0;
  const section=t<0.16?'OPENING S':t<0.32?'RIDGE CLIMB':t<0.50?'BANKED S':t<0.67?'DESCENT':t<0.82?'JUMP GATE':'FINAL COMPLEX';
  return {position:v(x,y,z),bank,section,brakeZone,jumpTakeoff,jumpLanding,loop:false};
}

function skyParam(t:number):ParamSample {
  // The outer route comes first so a stopped car builds speed before entering the vertical loop.
  // Both segments share the same base point and tangent at their seam.
  const loopStart=0.78;
  if (t<loopStart) {
    const u=t/loopStart;
    const theta=-Math.PI/2 + u*Math.PI*2;
    const x=12*Math.cos(theta);
    const z=8*Math.sin(theta);
    let y=0.35;
    if (u>0.20&&u<0.46) y += 2.3*Math.sin(((u-0.20)/0.26)*Math.PI);
    if (u>0.55&&u<0.73) y += 1.1*Math.sin(((u-0.55)/0.18)*Math.PI);
    const jumpTakeoff=u>0.735&&u<0.742;
    const jumpLanding=u>0.805&&u<0.812;
    const brakeZone=(u>0.68&&u<0.75)?0.9:0;
    const section=u<0.18?'START ARC':u<0.48?'SKY BRIDGE':u<0.66?'CROSSOVER':u<0.84?'AIR GAP':'LOOP APPROACH';
    return {position:v(x,y,z),bank:0.10*Math.sin(theta*2),section,brakeZone,jumpTakeoff,jumpLanding,loop:false};
  }
  const u=(t-loopStart)/(1-loopStart);
  const phi=-Math.PI/2 + u*Math.PI*2;
  const r=1.35, baseY=0.35, centerY=baseY+r;
  const position=v(r*Math.cos(phi),centerY+r*Math.sin(phi),-8);
  // Inward normal keeps the loop contact-force sign convention continuous.
  const normalHint=norm(v(-Math.cos(phi),-Math.sin(phi),0));
  return {position,normalHint,bank:0,section:'VERTICAL LOOP',brakeZone:0,jumpTakeoff:false,jumpLanding:false,loop:true,loopRadius:r};
}

function param(courseId:CourseId,t:number):ParamSample {
  const wrapped=((t%1)+1)%1;
  if(courseId==='workshop-oval') return ovalParam(wrapped);
  if(courseId==='technical-ridge') return technicalParam(wrapped);
  return skyParam(wrapped);
}

const cache = new Map<string,LaneTrack>();

export function buildLaneTrack(courseId:CourseId,lane:number,samples=900):LaneTrack {
  const key=`${courseId}:${lane}:${samples}`;
  const existing=cache.get(key); if(existing) return existing;
  const laneOffset=(lane-1.5)*0.62;
  const raw: Array<ParamSample & {tangent:Vec3;normal:Vec3;side:Vec3;positionLane:Vec3}> = [];
  const eps=1/samples;
  for(let i=0;i<samples;i++){
    const t=i/samples;
    const p=param(courseId,t), pm=param(courseId,t-eps), pp=param(courseId,t+eps);
    const tangent=norm(sub(pp.position,pm.position));
    let normal=p.normalHint ? norm(p.normalHint) : v(0,1,0);
    if(!p.normalHint && Math.abs(p.bank)>1e-6) normal=norm(rotateAroundAxis(normal,tangent,p.bank));
    let side=norm(cross(normal,tangent));
    if(len(side)<0.5) side=v(1,0,0);
    normal=norm(cross(tangent,side));
    const positionLane=add(p.position,mul(side,laneOffset));
    raw.push({...p,tangent,normal,side,positionLane});
  }
  const cumulative:number[]=[0];
  for(let i=1;i<raw.length;i++) cumulative[i]=cumulative[i-1]!+dist(raw[i-1]!.positionLane,raw[i]!.positionLane);
  const closing=dist(raw[raw.length-1]!.positionLane,raw[0]!.positionLane);
  const total=cumulative[cumulative.length-1]!+closing;
  const points:TrackPoint[]=raw.map((r,i)=>{
    const prev=raw[(i-1+raw.length)%raw.length]!, next=raw[(i+1)%raw.length]!;
    const ds=Math.max(0.001,dist(prev.positionLane,next.positionLane)*0.5);
    const curvature=len(sub(next.tangent,prev.tangent))/(2*ds);
    return {s:cumulative[i]!,position:r.positionLane,tangent:r.tangent,normal:r.normal,side:r.side,curvature,bank:r.bank,section:r.section,brakeZone:r.brakeZone,jumpTakeoff:r.jumpTakeoff,jumpLanding:r.jumpLanding,loop:r.loop,loopRadius:r.loopRadius};
  });
  const track={courseId,lane,length:total,points}; cache.set(key,track); return track;
}

export function sampleTrack(track:LaneTrack,s:number):TrackPoint {
  const wrapped=((s%track.length)+track.length)%track.length;
  const pts=track.points;
  let lo=0,hi=pts.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2); if(pts[mid]!.s<=wrapped) lo=mid; else hi=mid-1;}
  const a=pts[lo]!, b=pts[(lo+1)%pts.length]!;
  const bS=lo===pts.length-1?track.length:b.s;
  const f=clamp01((wrapped-a.s)/Math.max(1e-6,bS-a.s));
  const mix=(x:number,y:number)=>x+(y-x)*f;
  const mixV=(x:Vec3,y:Vec3)=>norm(v(mix(x.x,y.x),mix(x.y,y.y),mix(x.z,y.z)));
  return {
    ...a,
    s:wrapped,
    position:v(mix(a.position.x,b.position.x),mix(a.position.y,b.position.y),mix(a.position.z,b.position.z)),
    tangent:mixV(a.tangent,b.tangent), normal:mixV(a.normal,b.normal), side:mixV(a.side,b.side),
    curvature:mix(a.curvature,b.curvature), bank:mix(a.bank,b.bank), brakeZone:Math.max(a.brakeZone,b.brakeZone),
    section:f<0.5?a.section:b.section,
    jumpTakeoff:a.jumpTakeoff||b.jumpTakeoff,jumpLanding:a.jumpLanding||b.jumpLanding,loop:a.loop||b.loop,loopRadius:a.loopRadius??b.loopRadius,
  };
}

export function findFeatureS(track:LaneTrack, feature:'jumpTakeoff'|'jumpLanding'):number|undefined {
  return track.points.find((p)=>p[feature])?.s;
}
