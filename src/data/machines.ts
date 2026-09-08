import type { MachineDefinition, MachineId } from '../types';

const setup = (body:string, chassis:string, motor:string, gear:string, tire:string, roller:string, battery:string, wing:string, brake:string) => ({ body, chassis, motor, gear, tire, roller, battery, wing, brake });

export const MACHINES: MachineDefinition[] = [
  {
    id:'aero-falcon', name:'AERO FALCON', subtitle:'直線を裂く低床エアロ',
    description:'低いノーズと幅広い後翼を持つ直線重視の軽快な機体。', tags:['wide-rear','aero'], accent:0xe44735, secondary:0xf5f0e7,
    baseMassKg:0.056, baseDrag:0.060, baseCgHeight:0.042, baseDriveEfficiency:0.96,
    defaultSetup:setup('body-light','chassis-rigid','motor-rev','gear-speed','tire-large','roller-lowdrag','battery-power','wing-standard','brake-weak'),
  },
  {
    id:'torque-bison', name:'TORQUE BISON', subtitle:'登りを押し切る高トルク',
    description:'厚い中央ポッドと短い全長で、再加速と登坂を得意とする。', tags:['wide-rear','torque'], accent:0xf2a900, secondary:0x22262a,
    baseMassKg:0.067, baseDrag:0.078, baseCgHeight:0.049, baseDriveEfficiency:0.975,
    defaultSetup:setup('body-standard','chassis-rigid','motor-torque','gear-accel','tire-small','roller-standard','battery-power','wing-standard','brake-mid'),
  },
  {
    id:'corner-lynx', name:'CORNER LYNX', subtitle:'切り返し特化のワイドガイド',
    description:'細身の胴体と長いローラーステーで連続コーナーに強い。', tags:['narrow-rear','corner'], accent:0x45c7a7, secondary:0x19232a,
    baseMassKg:0.060, baseDrag:0.067, baseCgHeight:0.037, baseDriveEfficiency:0.955,
    defaultSetup:setup('body-standard','chassis-low','motor-balance','gear-mid','tire-grip','roller-stable','battery-light','wing-small','brake-mid'),
  },
  {
    id:'balance-orca', name:'BALANCE ORCA', subtitle:'安定性を磨いた万能型',
    description:'滑らかな一体シルエットと低重心設計で全セクションを安定してこなす。', tags:['balanced-rear','stable'], accent:0x4e78d6, secondary:0xf5f7fa,
    baseMassKg:0.064, baseDrag:0.064, baseCgHeight:0.035, baseDriveEfficiency:0.965,
    defaultSetup:setup('body-stable','chassis-low','motor-balance','gear-mid','tire-grip','roller-standard','battery-capacity','wing-stable','brake-mid'),
  },
];

export const MACHINE_MAP = new Map<MachineId, MachineDefinition>(MACHINES.map((m) => [m.id, m]));
export function getMachine(id: MachineId): MachineDefinition {
  const m = MACHINE_MAP.get(id);
  if (!m) throw new Error(`Unknown machine: ${id}`);
  return m;
}
