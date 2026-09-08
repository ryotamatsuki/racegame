import { describe, expect, test } from 'vitest';
import type { CourseId, MachineId, Setup, TrackPoint, VehicleRaceState } from '../src/types';
import { PART_CATEGORIES } from '../src/types';
import { MACHINES, getMachine } from '../src/data/machines';
import { PARTS_BY_CATEGORY, deriveVehicle, isCompatible } from '../src/data/parts';
import { buildLaneTrack } from '../src/data/courses';
import { FIXED_DT, stepVehiclePhysics } from '../src/game/simulation/physics';
import { RaceEngine } from '../src/game/simulation/race';

const levelPoint: TrackPoint = {
  s:0, position:{x:0,y:0,z:0}, tangent:{x:1,y:0,z:0}, normal:{x:0,y:1,z:0}, side:{x:0,y:0,z:1},
  curvature:0, bank:0, section:'BENCH STRAIGHT', brakeZone:0, jumpTakeoff:false, jumpLanding:false, loop:false,
};

function initialState(setup:Setup, machineId:MachineId='balance-orca'):VehicleRaceState {
  const vehicle=deriveVehicle(getMachine(machineId),setup);
  return {id:'bench',machineId,setup,lane:1,status:'onTrack',lap:0,s:0,prevS:0,speed:0,rpm:0,batteryWh:vehicle.batteryCapacityWh,
    recoveries:0,recoveryTimer:0,instability:0,lapStartTime:0,lapTimes:[],airTime:0,airY:0,launchSpeed:0,launchVy:0,lastJumpStartS:-999};
}

function straightBench(patch:Partial<Setup>, seconds:number):number {
  const machine=getMachine('balance-orca'); const setup={...machine.defaultSetup,...patch}; const vehicle=deriveVehicle(machine,setup); const state=initialState(setup);
  for(let i=0;i<Math.round(seconds/FIXED_DT);i++) stepVehiclePhysics(state,{dt:FIXED_DT,point:levelPoint,vehicle,raceTime:i*FIXED_DT});
  return state.speed;
}

function runTimeAttack(courseId:CourseId,setup:Setup){
  const e=new RaceEngine({courseId,mode:'time-attack',playerMachineId:'balance-orca',playerSetup:setup,seed:2408});
  for(let i=0;i<120*181&&e.snapshot.state!=='finished';i++)e.step(FIXED_DT);
  return e.result?.rows[0];
}

describe('A02/A03 data integrity',()=>{
  test('four silhouettes and at least three choices in all nine categories',()=>{
    expect(MACHINES).toHaveLength(4); expect(new Set(MACHINES.map(m=>m.id)).size).toBe(4);
    expect(PART_CATEGORIES).toHaveLength(9);
    for(const category of PART_CATEGORIES) expect(PARTS_BY_CATEGORY[category].length).toBeGreaterThanOrEqual(3);
  });
  test('compatibility restriction is explicit rather than silently accepted',()=>{
    const lynx=getMachine('corner-lynx'); const wide=PARTS_BY_CATEGORY.wing.find(p=>p.id==='wing-stable')!;
    const result=isCompatible(lynx,wide); expect(result.ok).toBe(false); expect(result.reason?.length).toBeGreaterThan(0);
  });
});

describe('A05 drive model direction',()=>{
  test('torque motor and acceleration gear lead early, rev motor and speed gear lead at speed',()=>{
    expect(straightBench({motor:'motor-torque'},0.5)).toBeGreaterThan(straightBench({motor:'motor-rev'},0.5));
    expect(straightBench({motor:'motor-rev'},3)).toBeGreaterThan(straightBench({motor:'motor-torque'},3));
    expect(straightBench({gear:'gear-accel'},0.5)).toBeGreaterThan(straightBench({gear:'gear-speed'},0.5));
    expect(straightBench({gear:'gear-speed'},3)).toBeGreaterThan(straightBench({gear:'gear-accel'},3));
  });
});

describe('A06 trade-off',()=>{
  test('same machine has an oval-oriented and technical-oriented setup with reversed ordering',()=>{
    const base=getMachine('balance-orca').defaultSetup;
    const speed:Setup={...base,motor:'motor-rev',gear:'gear-speed',tire:'tire-large',roller:'roller-stable',wing:'wing-standard',brake:'brake-strong'};
    const technical:Setup={...base,motor:'motor-torque',gear:'gear-mid',tire:'tire-small',roller:'roller-stable',wing:'wing-stable',brake:'brake-weak'};
    const speedOval=runTimeAttack('workshop-oval',speed), techOval=runTimeAttack('workshop-oval',technical);
    const speedTech=runTimeAttack('technical-ridge',speed), techTech=runTimeAttack('technical-ridge',technical);
    expect(speedOval?.status).toBe('finished');expect(techOval?.status).toBe('finished');expect(speedTech?.status).toBe('finished');expect(techTech?.status).toBe('finished');
    expect(speedOval!.totalTime!).toBeLessThan(techOval!.totalTime!);
    expect(techTech!.totalTime!).toBeLessThan(speedTech!.totalTime!);
  });
});

describe('A07/A08 tracks, loop and race termination',()=>{
  test('four lane lengths are finite and lane-specific for every course',()=>{
    for(const c of ['workshop-oval','technical-ridge','sky-loop'] as CourseId[]){
      const lengths=[0,1,2,3].map(l=>buildLaneTrack(c,l).length);
      lengths.forEach(x=>expect(Number.isFinite(x)&&x>10).toBe(true)); expect(new Set(lengths.map(x=>x.toFixed(5))).size).toBeGreaterThan(1);
    }
  });
  test('low speed loses contact near the top of the vertical loop',()=>{
    const track=buildLaneTrack('sky-loop',1); const top=track.points.filter(p=>p.loop).sort((a,b)=>a.normal.y-b.normal.y)[0]!;
    expect(top.normal.y).toBeLessThan(-0.9);
    const machine=getMachine('balance-orca'); const setup={...machine.defaultSetup}; const vehicle=deriveVehicle(machine,setup); const state=initialState(setup); state.s=top.s;state.speed=1;
    const out=stepVehiclePhysics(state,{dt:FIXED_DT,point:top,vehicle,raceTime:5}); expect(out.courseOut).toBe('loop');
  });
  test.each(['workshop-oval','technical-ridge','sky-loop'] as CourseId[])('%s reaches a four-row result in race mode',(courseId)=>{
    const machine=getMachine('balance-orca');
    const patch:Partial<Setup>=courseId==='workshop-oval'?{}:courseId==='technical-ridge'?{motor:'motor-torque',gear:'gear-mid',tire:'tire-small',roller:'roller-stable',wing:'wing-stable',brake:'brake-weak'}:{motor:'motor-balance',gear:'gear-speed',tire:'tire-grip',roller:'roller-stable',wing:'wing-stable',brake:'brake-weak'};
    const e=new RaceEngine({courseId,mode:'race',playerMachineId:machine.id,playerSetup:{...machine.defaultSetup,...patch},seed:2408});
    for(let i=0;i<120*181&&e.snapshot.state!=='finished';i++)e.step(FIXED_DT);
    expect(e.snapshot.state).toBe('finished'); expect(e.result?.rows).toHaveLength(4); expect(e.result?.rows.find(r=>r.id==='player')?.status).toBe('finished');
  });
});

describe('A09 fairness and A10 fixed timing',()=>{
  test('identical vehicle state receives identical physics without a player-only modifier',()=>{
    const machine=getMachine('aero-falcon'), setup={...machine.defaultSetup}, vehicle=deriveVehicle(machine,setup);
    const a=initialState(setup,'aero-falcon'), b=structuredClone(a); a.id='player'; b.id='cpu-same';
    for(let i=0;i<600;i++){stepVehiclePhysics(a,{dt:FIXED_DT,point:levelPoint,vehicle,raceTime:i*FIXED_DT});stepVehiclePhysics(b,{dt:FIXED_DT,point:levelPoint,vehicle,raceTime:i*FIXED_DT});}
    expect(a.speed).toBe(b.speed);expect(a.s).toBe(b.s);expect(a.batteryWh).toBe(b.batteryWh);expect(a.rpm).toBe(b.rpm);
  });
  test('30/60/120 render cadence feeds the same fixed-step result within one step',()=>{
    const machine=getMachine('aero-falcon');
    const run=(fps:number)=>{const e=new RaceEngine({courseId:'workshop-oval',mode:'time-attack',playerMachineId:machine.id,playerSetup:{...machine.defaultSetup},seed:99});let acc=0;for(let frame=0;frame<fps*12;frame++){acc+=1/fps;while(acc+1e-12>=FIXED_DT){e.step(FIXED_DT);acc-=FIXED_DT;}}return {elapsed:e.snapshot.elapsed,s:e.snapshot.vehicles[0]!.s};};
    const r30=run(30),r60=run(60),r120=run(120);expect(Math.abs(r30.elapsed-r120.elapsed)).toBeLessThanOrEqual(FIXED_DT+1e-9);expect(Math.abs(r60.elapsed-r120.elapsed)).toBeLessThanOrEqual(FIXED_DT+1e-9);expect(Math.abs(r30.s-r120.s)).toBeLessThan(0.15);
  });
});

describe('A11 pause semantics',()=>{
  test('paused engine does not advance time and resumes from the same state',()=>{
    const m=getMachine('aero-falcon'), e=new RaceEngine({courseId:'workshop-oval',mode:'time-attack',playerMachineId:m.id,playerSetup:{...m.defaultSetup},seed:1});
    for(let i=0;i<500;i++)e.step(FIXED_DT);const before=e.snapshot.elapsed;e.pause();for(let i=0;i<1000;i++)e.step(FIXED_DT);expect(e.snapshot.elapsed).toBe(before);e.resume();e.step(FIXED_DT);expect(e.snapshot.elapsed).toBeCloseTo(before+FIXED_DT,10);
  });
});
