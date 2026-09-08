import type { PartDefinition, Setup, PartCategory, MachineDefinition, DerivedVehicle } from '../types';
import { PART_CATEGORIES } from '../types';

export const PARTS: PartDefinition[] = [
  { id:'body-light', category:'body', name:'フェザーシェル', description:'軽量化で加速を伸ばす。高速域では姿勢が乱れやすい。', modelVariant:0, massKg:0.018, drag:-0.012, cgDelta:0.004 },
  { id:'body-standard', category:'body', name:'ストリームシェル', description:'重量・抵抗・安定性の基準となる標準ボディー。', modelVariant:1, massKg:0.026, drag:0, cgDelta:0 },
  { id:'body-stable', category:'body', name:'ダウンフォースシェル', description:'低重心化と安定性を優先するが重量と抵抗が増える。', modelVariant:2, massKg:0.036, drag:0.018, cgDelta:-0.007, wingStability:0.08 },

  { id:'chassis-light', category:'chassis', name:'LZライト', description:'軽量だが剛性と駆動効率は控えめ。', modelVariant:0, massKg:0.042, cgDelta:0.004, driveEfficiency:0.94 },
  { id:'chassis-rigid', category:'chassis', name:'RXリジッド', description:'駆動ロスを抑えた高剛性仕様。', modelVariant:1, massKg:0.058, cgDelta:0.001, driveEfficiency:0.985 },
  { id:'chassis-low', category:'chassis', name:'LCGスラント', description:'低重心でコーナー安定性を高める。', modelVariant:2, massKg:0.064, cgDelta:-0.014, driveEfficiency:0.97 },

  { id:'motor-rev', category:'motor', name:'REV-28', description:'高回転型。長い直線で伸びるが低速トルクは弱い。', modelVariant:0, massKg:0.018, maxRpm:28000, stallTorqueNm:0.0105 },
  { id:'motor-torque', category:'motor', name:'TORQ-22', description:'高トルク型。登坂と再加速に強い。', modelVariant:1, massKg:0.021, maxRpm:22000, stallTorqueNm:0.0155 },
  { id:'motor-balance', category:'motor', name:'BAL-25', description:'回転数とトルクの中間設定。', modelVariant:2, massKg:0.020, maxRpm:25000, stallTorqueNm:0.0132 },

  { id:'gear-speed', category:'gear', name:'3.1:1 スピード', description:'最高速寄り。発進と登坂では負荷が大きい。', modelVariant:0, massKg:0.007, gearRatio:3.1, driveEfficiency:0.975 },
  { id:'gear-mid', category:'gear', name:'3.7:1 バランス', description:'標準的な減速比。', modelVariant:1, massKg:0.008, gearRatio:3.7, driveEfficiency:0.98 },
  { id:'gear-accel', category:'gear', name:'4.2:1 アクセル', description:'加速と登坂を優先し最高速を抑える。', modelVariant:2, massKg:0.009, gearRatio:4.2, driveEfficiency:0.972 },

  { id:'tire-small', category:'tire', name:'26mm ロープロ', description:'小径で加速しやすく低重心。', modelVariant:0, massKg:0.022, tireRadiusM:0.013, grip:0.82, rollingResistance:0.018, cgDelta:-0.004 },
  { id:'tire-large', category:'tire', name:'31mm ハイスピード', description:'大径で伸びるが加速と姿勢変化は鈍くなる。', modelVariant:1, massKg:0.028, tireRadiusM:0.0155, grip:0.78, rollingResistance:0.020, cgDelta:0.003 },
  { id:'tire-grip', category:'tire', name:'28mm グリップ', description:'コーナーと着地を重視。転がり抵抗は増える。', modelVariant:2, massKg:0.032, tireRadiusM:0.014, grip:1.05, rollingResistance:0.027, cgDelta:0 },

  { id:'roller-lowdrag', category:'roller', name:'9mm フリー', description:'低抵抗で直線向き。横支持力は低い。', modelVariant:0, massKg:0.010, rollerSupport:0.55, rollerDrag:0.005 },
  { id:'roller-standard', category:'roller', name:'13mm ガイド', description:'抵抗と支持力の標準設定。', modelVariant:1, massKg:0.015, rollerSupport:0.88, rollerDrag:0.010 },
  { id:'roller-stable', category:'roller', name:'17mm スタビ', description:'強い横支持で高速コーナー向き。抵抗と重量が増える。', modelVariant:2, massKg:0.025, rollerSupport:1.22, rollerDrag:0.018 },

  { id:'battery-light', category:'battery', name:'LITE 900', description:'軽量。電圧は控えめで終盤に出力が落ちる。', modelVariant:0, massKg:0.040, batteryVoltage:2.25, batteryCapacityWh:1.7 },
  { id:'battery-capacity', category:'battery', name:'ENDURE 1600', description:'容量重視。重量はあるが出力低下が緩やか。', modelVariant:1, massKg:0.058, batteryVoltage:2.35, batteryCapacityWh:3.2 },
  { id:'battery-power', category:'battery', name:'PUNCH 1100', description:'高電圧で加速と最高速を伸ばす。消費が大きい。', modelVariant:2, massKg:0.052, batteryVoltage:2.55, batteryCapacityWh:2.2 },

  { id:'wing-small', category:'wing', name:'ショートフィン', description:'抵抗を抑える軽量ウイング。', modelVariant:0, massKg:0.009, drag:-0.006, wingStability:0.04 },
  { id:'wing-standard', category:'wing', name:'ツインウイング', description:'扱いやすい標準ウイング。', modelVariant:1, massKg:0.015, drag:0.004, wingStability:0.10 },
  { id:'wing-stable', category:'wing', name:'ワイドスタビライザー', description:'ジャンプとループの姿勢安定を優先。', modelVariant:2, massKg:0.026, drag:0.018, wingStability:0.20, compatibleAny:['wide-rear','balanced-rear'], incompatibilityReason:'この機種の後部マウント幅では装着できません。' },

  { id:'brake-weak', category:'brake', name:'ソフトブレーキ', description:'減速量が小さく高速コース向き。', modelVariant:0, massKg:0.006, brakeStrength:0.16 },
  { id:'brake-mid', category:'brake', name:'ミドルブレーキ', description:'ジャンプ前の速度を適度に整える。', modelVariant:1, massKg:0.010, brakeStrength:0.33 },
  { id:'brake-strong', category:'brake', name:'ハードブレーキ', description:'強く減速して着地を安定させるがタイムロスが大きい。', modelVariant:2, massKg:0.016, brakeStrength:0.53 },
];

export const PART_MAP = new Map(PARTS.map((part) => [part.id, part]));
export const PARTS_BY_CATEGORY = Object.fromEntries(
  PART_CATEGORIES.map((category) => [category, PARTS.filter((part) => part.category === category)]),
) as Record<PartCategory, PartDefinition[]>;

export function getPart(id: string): PartDefinition {
  const part = PART_MAP.get(id);
  if (!part) throw new Error(`Unknown part: ${id}`);
  return part;
}

export function isCompatible(machine: MachineDefinition, part: PartDefinition): { ok: boolean; reason?: string } {
  if (!part.compatibleAny || part.compatibleAny.length === 0) return { ok: true };
  const ok = part.compatibleAny.some((tag) => machine.tags.includes(tag));
  return ok ? { ok: true } : { ok: false, reason: part.incompatibilityReason ?? '互換性がありません。' };
}

const clampRating = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function deriveVehicle(machine: MachineDefinition, setup: Setup): DerivedVehicle {
  const selected = PART_CATEGORIES.map((category) => {
    const p = getPart(setup[category]);
    if (p.category !== category) throw new Error(`Part category mismatch: ${p.id}`);
    return p;
  });
  const sum = (key: keyof PartDefinition) => selected.reduce((a, p) => a + (typeof p[key] === 'number' ? (p[key] as number) : 0), 0);
  const product = (key: keyof PartDefinition, fallback = 1) => selected.reduce((a, p) => a * (typeof p[key] === 'number' ? (p[key] as number) : fallback), 1);
  const motor = selected.find((p) => p.category === 'motor')!;
  const gear = selected.find((p) => p.category === 'gear')!;
  const tire = selected.find((p) => p.category === 'tire')!;
  const roller = selected.find((p) => p.category === 'roller')!;
  const battery = selected.find((p) => p.category === 'battery')!;
  const brake = selected.find((p) => p.category === 'brake')!;

  const massKg = machine.baseMassKg + sum('massKg');
  const drag = Math.max(0.035, machine.baseDrag + sum('drag'));
  const cgHeight = Math.max(0.018, machine.baseCgHeight + sum('cgDelta'));
  const driveEfficiency = Math.max(0.72, Math.min(0.99, machine.baseDriveEfficiency * product('driveEfficiency')));
  const maxRpm = motor.maxRpm ?? 24000;
  const stallTorqueNm = motor.stallTorqueNm ?? 0.012;
  const gearRatio = gear.gearRatio ?? 3.7;
  const tireRadiusM = tire.tireRadiusM ?? 0.014;
  const grip = tire.grip ?? 0.85;
  const rollingResistance = tire.rollingResistance ?? 0.022;
  const rollerSupport = roller.rollerSupport ?? 0.8;
  const rollerDrag = roller.rollerDrag ?? 0.01;
  const batteryVoltage = battery.batteryVoltage ?? 2.35;
  const batteryCapacityWh = battery.batteryCapacityWh ?? 2.5;
  const wingStability = sum('wingStability');
  const brakeStrength = brake.brakeStrength ?? 0.3;

  const wheelOmegaAtFree = (maxRpm * Math.PI * 2 / 60) / gearRatio;
  const freeSpeed = wheelOmegaAtFree * tireRadiusM * (batteryVoltage / 2.35);
  const launchForce = stallTorqueNm * gearRatio * driveEfficiency / tireRadiusM;
  const cornerCapacity = grip * 9.81 + rollerSupport * 7.2;
  const stabilityRaw = 52 + rollerSupport * 20 + wingStability * 72 - cgHeight * 520 - massKg * 10;
  const enduranceRaw = 30 + batteryCapacityWh * 19 - massKg * 18;
  return {
    massKg, drag, cgHeight, driveEfficiency, maxRpm, stallTorqueNm, gearRatio, tireRadiusM,
    grip, rollingResistance, rollerSupport, rollerDrag, batteryVoltage, batteryCapacityWh,
    wingStability, brakeStrength,
    ratings: {
      speed: clampRating(18 + freeSpeed * 13 - drag * 120),
      acceleration: clampRating(15 + launchForce * 8.5 - massKg * 24),
      cornering: clampRating(12 + cornerCapacity * 4.4 - cgHeight * 300),
      stability: clampRating(stabilityRaw),
      endurance: clampRating(enduranceRaw),
    },
  };
}
