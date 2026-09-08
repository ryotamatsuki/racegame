import type { DerivedVehicle, TrackPoint, VehicleRaceState } from '../../types';

export const FIXED_DT = 1/120;
export const GRAVITY = 9.81;

export interface PhysicsStepContext {
  dt:number;
  point:TrackPoint;
  vehicle:DerivedVehicle;
  raceTime:number;
  landingS?:number;
}

export interface PhysicsOutcome {
  courseOut?: 'corner'|'loop'|'landing';
  cornerSlow?: number;
  landingLoss?: number;
}

function clamp(x:number,a:number,b:number){return Math.max(a,Math.min(b,x));}

export function stepVehiclePhysics(state:VehicleRaceState, ctx:PhysicsStepContext):PhysicsOutcome {
  const {dt,point,vehicle}=ctx;
  const outcome:PhysicsOutcome={};
  if(state.status==='recovering'||state.status==='finished'||state.status==='dnf') return outcome;

  const charge=Math.max(0,state.batteryWh)/Math.max(0.1,vehicle.batteryCapacityWh);
  const voltageFactor=(vehicle.batteryVoltage/2.35)*(0.78+0.22*Math.sqrt(clamp(charge,0,1))); // game approximation: nominal voltage scales available torque
  const wheelOmega=state.speed/Math.max(0.005,vehicle.tireRadiusM);
  const motorOmega=wheelOmega*vehicle.gearRatio;
  const motorRpm=motorOmega*60/(Math.PI*2);
  const rpmRatio=clamp(motorRpm/vehicle.maxRpm,0,1.2);
  const torque=vehicle.stallTorqueNm*Math.max(0,1-rpmRatio)*voltageFactor;
  const driveForce=torque*vehicle.gearRatio*vehicle.driveEfficiency/vehicle.tireRadiusM;
  const rolling=vehicle.massKg*GRAVITY*vehicle.rollingResistance;
  const aero=0.5*1.2*vehicle.drag*0.0045*state.speed*state.speed;
  const roller=vehicle.rollerDrag*state.speed*0.7;
  const grade=-vehicle.massKg*GRAVITY*point.tangent.y;
  const brake=point.brakeZone*vehicle.brakeStrength*vehicle.massKg*GRAVITY*1.6;
  const accel=(driveForce-rolling-aero-roller+grade-brake)/vehicle.massKg;
  state.speed=Math.max(0,state.speed+accel*dt);
  state.speed=Math.min(state.speed,13.5);
  state.rpm=Math.max(0,Math.min(vehicle.maxRpm*1.05,(state.speed/vehicle.tireRadiusM)*vehicle.gearRatio*60/(Math.PI*2)));

  const mechPower=Math.max(0,driveForce*state.speed)/Math.max(0.55,vehicle.driveEfficiency);
  state.batteryWh=Math.max(0,state.batteryWh-(mechPower*dt/3600)*1.65);

  if(state.status==='airborne'){
    state.airTime+=dt;
    state.s+=state.speed*dt;
    state.airY=state.launchVy*state.airTime-0.5*GRAVITY*state.airTime*state.airTime;
    const landingS=ctx.landingS;
    if(landingS!==undefined && state.s>=landingS){
      const miss=Math.abs(state.airY);
      const safe=0.34+vehicle.wingStability*0.85+vehicle.grip*0.08;
      if(miss<=safe){
        const loss=clamp(miss/safe,0,1)*0.24;
        state.speed*=1-loss;
        if(loss>0.08) outcome.landingLoss=loss;
        state.status='onTrack'; state.airY=0; state.airTime=0;
      }else outcome.courseOut='landing';
    }else if(state.airTime>1.4) outcome.courseOut='landing';
    return outcome;
  }

  const lateralNeed=state.speed*state.speed*point.curvature;
  const lateralCapacity=vehicle.grip*GRAVITY+vehicle.rollerSupport*7.2+vehicle.wingStability*state.speed*0.65;
  const overload=Math.max(0,lateralNeed-lateralCapacity);
  if(overload>0){
    const reduction=clamp(overload/(lateralCapacity+1),0,0.24);
    state.speed*=1-reduction*dt*8;
    state.instability+=overload*dt*(0.075+vehicle.cgHeight*1.8);
    outcome.cornerSlow=reduction;
  }else state.instability=Math.max(0,state.instability-dt*(0.55+vehicle.rollerSupport*0.2));
  const stabilityLimit=1.05+vehicle.rollerSupport*0.4+vehicle.wingStability*1.55-vehicle.cgHeight*2.3;
  if(state.instability>stabilityLimit){ outcome.courseOut='corner'; return outcome; }

  if(point.loop && point.loopRadius){
    const inwardGravity=-GRAVITY*point.normal.y;
    const normalForcePerMass=state.speed*state.speed/point.loopRadius-inwardGravity;
    if(normalForcePerMass<0.18){ outcome.courseOut='loop'; return outcome; }
  }

  state.s+=state.speed*dt;
  if(point.jumpTakeoff && state.speed>2.0 && Math.abs(state.s-state.lastJumpStartS)>1.0){
    state.status='airborne'; state.airTime=0; state.airY=0; state.launchSpeed=state.speed;
    const launchAngle=0.13+vehicle.wingStability*0.02;
    state.launchVy=state.speed*Math.sin(launchAngle);
    state.lastJumpStartS=state.s;
  }
  return outcome;
}
