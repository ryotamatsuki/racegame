import type { CourseId, GameMode, MachineId, RaceEvent, RaceResult, RaceSnapshot, Setup, VehicleRaceState } from '../../types';
import { buildLaneTrack, findFeatureS, sampleTrack } from '../../data/courses';
import { getMachine } from '../../data/machines';
import { deriveVehicle } from '../../data/parts';
import { FIXED_DT, stepVehiclePhysics } from './physics';

export interface RaceConfig { courseId:CourseId; mode:GameMode; playerMachineId:MachineId; playerSetup:Setup; seed:number; }

function seeded(seed:number){ let x=seed|0; return ()=>{x=(x*1664525+1013904223)|0; return ((x>>>0)/4294967296);}; }

const cpuPresets: Record<CourseId, Array<{machineId:MachineId; patch:Partial<Setup>}>> = {
  'workshop-oval':[
    {machineId:'aero-falcon',patch:{motor:'motor-rev',gear:'gear-speed',tire:'tire-large',roller:'roller-lowdrag',brake:'brake-weak'}},
    {machineId:'torque-bison',patch:{motor:'motor-balance',gear:'gear-mid',tire:'tire-large'}},
    {machineId:'balance-orca',patch:{motor:'motor-rev',gear:'gear-speed',tire:'tire-small',wing:'wing-small'}},
  ],
  'technical-ridge':[
    {machineId:'corner-lynx',patch:{motor:'motor-balance',gear:'gear-mid',tire:'tire-grip',roller:'roller-stable',brake:'brake-mid'}},
    {machineId:'torque-bison',patch:{motor:'motor-torque',gear:'gear-accel',tire:'tire-grip',roller:'roller-standard',brake:'brake-strong'}},
    {machineId:'balance-orca',patch:{motor:'motor-balance',gear:'gear-mid',tire:'tire-grip',roller:'roller-stable'}},
  ],
  'sky-loop':[
    {machineId:'balance-orca',patch:{motor:'motor-torque',gear:'gear-mid',tire:'tire-grip',wing:'wing-stable',brake:'brake-mid'}},
    {machineId:'aero-falcon',patch:{motor:'motor-rev',gear:'gear-mid',tire:'tire-grip',roller:'roller-stable',wing:'wing-stable'}},
    {machineId:'torque-bison',patch:{motor:'motor-torque',gear:'gear-accel',tire:'tire-grip',roller:'roller-stable',wing:'wing-stable'}},
  ],
};

export class RaceEngine {
  readonly config:RaceConfig;
  readonly tracks = [0,1,2,3].map(()=>undefined as ReturnType<typeof buildLaneTrack>|undefined);
  private snapshotValue:RaceSnapshot;
  private finishResult?:RaceResult;
  private readonly landingS:number[]=[];
  private previousElapsed=0;

  constructor(config:RaceConfig){
    this.config=config;
    const rng=seeded(config.seed);
    const lanes=[0,1,2,3].sort(()=>rng()-0.5);
    const specs=[{machineId:config.playerMachineId,setup:config.playerSetup},...cpuPresets[config.courseId].map((p)=>{const m=getMachine(p.machineId); return {machineId:p.machineId,setup:{...m.defaultSetup,...p.patch}};})];
    const vehicles=specs.slice(0,config.mode==='time-attack'?1:4).map((spec,i)=>{
      const lane= config.mode==='time-attack'?1:lanes[i]!;
      const track=buildLaneTrack(config.courseId,lane); this.tracks[lane]=track;
      this.landingS[lane]=findFeatureS(track,'jumpLanding')??Number.POSITIVE_INFINITY;
      const dv=deriveVehicle(getMachine(spec.machineId),spec.setup);
      return {
        id:i===0?'player':`cpu-${i}`, machineId:spec.machineId, setup:spec.setup, lane,
        status:'onTrack',lap:0,s:0,prevS:0,speed:0,rpm:0,batteryWh:dv.batteryCapacityWh,recoveries:0,recoveryTimer:0,instability:0,
        lapStartTime:0,lapTimes:[],airTime:0,airY:0,launchSpeed:0,launchVy:0,lastJumpStartS:-999,
      } satisfies VehicleRaceState;
    });
    this.snapshotValue={state:'countdown',elapsed:0,countdown:3,vehicles,events:[]};
  }

  get snapshot():RaceSnapshot { return this.snapshotValue; }
  get result():RaceResult|undefined { return this.finishResult; }
  pause(){ if(this.snapshotValue.state==='running') this.snapshotValue.state='paused'; }
  resume(){ if(this.snapshotValue.state==='paused') this.snapshotValue.state='running'; }
  togglePause(){ this.snapshotValue.state==='paused'?this.resume():this.pause(); }

  step(dt=FIXED_DT){
    if(this.snapshotValue.state==='paused'||this.snapshotValue.state==='finished') return;
    if(this.snapshotValue.state==='countdown'){
      this.snapshotValue.countdown=Math.max(0,this.snapshotValue.countdown-dt);
      if(this.snapshotValue.countdown<=0) this.snapshotValue.state='running';
      return;
    }
    if(this.snapshotValue.state!=='running') return;
    this.previousElapsed=this.snapshotValue.elapsed;
    this.snapshotValue.elapsed+=dt;
    for(const state of this.snapshotValue.vehicles){
      if(state.status==='finished'||state.status==='dnf') continue;
      state.prevS=state.s;
      if(state.status==='recovering'){
        state.recoveryTimer-=dt;
        if(state.recoveryTimer<=0){state.status='onTrack';state.speed=0;state.instability=0;state.airY=0;state.airTime=0;}
        continue;
      }
      const machine=getMachine(state.machineId), vehicle=deriveVehicle(machine,state.setup), track=this.tracks[state.lane]??buildLaneTrack(this.config.courseId,state.lane);
      this.tracks[state.lane]=track;
      const point=sampleTrack(track,state.s);
      const outcome=stepVehiclePhysics(state,{dt,point,vehicle,raceTime:this.snapshotValue.elapsed,landingS:this.landingS[state.lane]});
      if(outcome.cornerSlow && outcome.cornerSlow>0.05) this.record(state,'corner-slow',outcome.cornerSlow);
      if(outcome.landingLoss) this.record(state,'landing-loss',outcome.landingLoss);
      if(outcome.courseOut){
        this.record(state,outcome.courseOut==='loop'?'loop-loss':'course-out',1);
        state.recoveries+=1;
        if(state.recoveries>=3){state.status='dnf';continue;}
        const loopEntry=track.points.find((p)=>p.loop)?.s;
        const safeS=outcome.courseOut==='loop'&&loopEntry!==undefined ? Math.max(0,loopEntry-13) : Math.max(0,state.s-2.2);
        state.s=safeS;state.speed=0;state.status='recovering';state.recoveryTimer=2;state.airY=0;state.airTime=0;state.instability=0;
        continue;
      }
      while(state.s>=track.length){
        state.s-=track.length;
        const crossing=this.snapshotValue.elapsed;
        state.lap+=1;
        const lapTime=crossing-state.lapStartTime; state.lapTimes.push(lapTime); state.lapStartTime=crossing;
        if(state.lap>=3){state.status='finished'; state.finishTime=crossing; this.record(state,'finish',0); break;}
      }
    }
    if(this.snapshotValue.elapsed>=180){for(const v of this.snapshotValue.vehicles) if(v.status!=='finished') v.status='dnf';}
    const allDone=this.snapshotValue.vehicles.every((v)=>v.status==='finished'||v.status==='dnf');
    if(allDone||this.snapshotValue.elapsed>=180) this.finish();
  }

  private record(v:VehicleRaceState,type:RaceEvent['type'],severity:number){
    const last=this.snapshotValue.events[this.snapshotValue.events.length-1];
    if(last&&last.vehicleId===v.id&&last.type===type&&this.snapshotValue.elapsed-last.time<0.35) return;
    this.snapshotValue.events.push({time:this.snapshotValue.elapsed,vehicleId:v.id,type,severity});
  }

  private finish(){
    if(this.snapshotValue.state==='finished') return;
    this.snapshotValue.state='finished';
    const sorted=[...this.snapshotValue.vehicles].sort((a,b)=>{
      if(a.finishTime!==undefined&&b.finishTime!==undefined) return a.finishTime-b.finishTime;
      if(a.finishTime!==undefined) return -1;if(b.finishTime!==undefined)return 1;
      if(a.lap!==b.lap)return b.lap-a.lap;
      const ta=this.tracks[a.lane]??buildLaneTrack(this.config.courseId,a.lane),tb=this.tracks[b.lane]??buildLaneTrack(this.config.courseId,b.lane);
      return (b.s/tb.length)-(a.s/ta.length);
    });
    this.finishResult={courseId:this.config.courseId,mode:this.config.mode,seed:this.config.seed,events:[...this.snapshotValue.events],rows:sorted.map((v,i)=>({id:v.id,machineId:v.machineId,position:i+1,status:v.status,totalTime:v.finishTime,lapTimes:[...v.lapTimes]}))};
  }

  getPosition(id:string):number {
    const active=[...this.snapshotValue.vehicles].sort((a,b)=>{
      const ta=this.tracks[a.lane]??buildLaneTrack(this.config.courseId,a.lane),tb=this.tracks[b.lane]??buildLaneTrack(this.config.courseId,b.lane);
      const pa=a.lap+a.s/ta.length,pb=b.lap+b.s/tb.length;
      if(a.finishTime!==undefined&&b.finishTime!==undefined)return a.finishTime-b.finishTime;
      if(a.finishTime!==undefined)return -1;if(b.finishTime!==undefined)return 1;
      return pb-pa;
    });
    return active.findIndex((v)=>v.id===id)+1;
  }

  get elapsedDelta(){return this.snapshotValue.elapsed-this.previousElapsed;}
}
