export type Vec3 = { x: number; y: number; z: number };
export type MachineId = 'aero-falcon' | 'torque-bison' | 'corner-lynx' | 'balance-orca';
export type CourseId = 'workshop-oval' | 'technical-ridge' | 'sky-loop';
export type GameMode = 'race' | 'time-attack';
export type CameraMode = 'chase' | 'onboard' | 'trackside' | 'overview' | 'auto';
export type Quality = 'low' | 'medium' | 'high';
export type PartCategory =
  | 'body'
  | 'chassis'
  | 'motor'
  | 'gear'
  | 'tire'
  | 'roller'
  | 'battery'
  | 'wing'
  | 'brake';

export const PART_CATEGORIES: PartCategory[] = [
  'body', 'chassis', 'motor', 'gear', 'tire', 'roller', 'battery', 'wing', 'brake',
];

export const PART_CATEGORY_LABELS: Record<PartCategory, string> = {
  body: 'ボディー', chassis: 'シャーシ', motor: 'モーター', gear: 'ギヤ', tire: 'タイヤ',
  roller: 'ローラー', battery: '電池', wing: 'ウイング', brake: 'ブレーキ',
};

export interface MachineDefinition {
  id: MachineId;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  accent: number;
  secondary: number;
  baseMassKg: number;
  baseDrag: number;
  baseCgHeight: number;
  baseDriveEfficiency: number;
  defaultSetup: Setup;
}

export interface PartDefinition {
  id: string;
  category: PartCategory;
  name: string;
  description: string;
  modelVariant: number;
  massKg: number;
  compatibleAny?: string[];
  incompatibilityReason?: string;
  drag?: number;
  cgDelta?: number;
  driveEfficiency?: number;
  maxRpm?: number;
  stallTorqueNm?: number;
  gearRatio?: number;
  tireRadiusM?: number;
  grip?: number;
  rollingResistance?: number;
  rollerSupport?: number;
  rollerDrag?: number;
  batteryVoltage?: number;
  batteryCapacityWh?: number;
  wingStability?: number;
  brakeStrength?: number;
}

export type Setup = Record<PartCategory, string>;

export interface DerivedVehicle {
  massKg: number;
  drag: number;
  cgHeight: number;
  driveEfficiency: number;
  maxRpm: number;
  stallTorqueNm: number;
  gearRatio: number;
  tireRadiusM: number;
  grip: number;
  rollingResistance: number;
  rollerSupport: number;
  rollerDrag: number;
  batteryVoltage: number;
  batteryCapacityWh: number;
  wingStability: number;
  brakeStrength: number;
  ratings: {
    speed: number;
    acceleration: number;
    cornering: number;
    stability: number;
    endurance: number;
  };
}

export interface TrackPoint {
  s: number;
  position: Vec3;
  tangent: Vec3;
  normal: Vec3;
  side: Vec3;
  curvature: number;
  bank: number;
  section: string;
  brakeZone: number;
  jumpTakeoff: boolean;
  jumpLanding: boolean;
  loop: boolean;
  loopRadius?: number;
}

export interface LaneTrack {
  courseId: CourseId;
  lane: number;
  length: number;
  points: TrackPoint[];
}

export type VehicleStatus = 'onTrack' | 'airborne' | 'recovering' | 'finished' | 'dnf';

export interface RaceEvent {
  time: number;
  vehicleId: string;
  type: 'corner-slow' | 'landing-loss' | 'course-out' | 'loop-loss' | 'finish';
  severity: number;
}

export interface VehicleRaceState {
  id: string;
  machineId: MachineId;
  setup: Setup;
  lane: number;
  status: VehicleStatus;
  lap: number;
  s: number;
  prevS: number;
  speed: number;
  rpm: number;
  batteryWh: number;
  recoveries: number;
  recoveryTimer: number;
  instability: number;
  lapStartTime: number;
  lapTimes: number[];
  finishTime?: number;
  airTime: number;
  airY: number;
  launchSpeed: number;
  launchVy: number;
  lastJumpStartS: number;
}

export interface RaceSnapshot {
  state: 'loading' | 'ready' | 'countdown' | 'running' | 'paused' | 'finished';
  elapsed: number;
  countdown: number;
  vehicles: VehicleRaceState[];
  events: RaceEvent[];
}

export interface RaceResultRow {
  id: string;
  machineId: MachineId;
  position: number;
  status: VehicleStatus;
  totalTime?: number;
  lapTimes: number[];
}

export interface RaceResult {
  courseId: CourseId;
  mode: GameMode;
  seed: number;
  rows: RaceResultRow[];
  events: RaceEvent[];
}
