import type { CourseId, MachineId, Quality, Setup } from '../types';
import { PART_CATEGORIES } from '../types';
import { MACHINE_MAP } from '../data/machines';
import { PART_MAP } from '../data/parts';

const KEY='racegame-save-v1';
export interface SavedSlot {name:string;machineId:MachineId;setup:Setup;updatedAt:string;}
export interface SaveData {version:1;slots:Array<SavedSlot|null>;settings:{quality:Quality;volume:number;muted:boolean;reducedMotion:boolean};bests:Partial<Record<CourseId,number>>;}
export const DEFAULT_SAVE:SaveData={version:1,slots:[null,null,null],settings:{quality:'medium',volume:0.6,muted:false,reducedMotion:false},bests:{}};

function validSetup(setup:unknown):setup is Setup {if(!setup||typeof setup!=='object')return false;const r=setup as Record<string,unknown>;return PART_CATEGORIES.every((c)=>typeof r[c]==='string'&&PART_MAP.get(r[c] as string)?.category===c);}
function sanitize(x:unknown):SaveData {if(!x||typeof x!=='object')return structuredClone(DEFAULT_SAVE);const r=x as Partial<SaveData>;const slots=Array.from({length:3},(_,i)=>{const s=r.slots?.[i];if(!s||!MACHINE_MAP.has(s.machineId)||!validSetup(s.setup))return null;return {name:String(s.name||`SLOT ${i+1}`).slice(0,24),machineId:s.machineId,setup:{...s.setup},updatedAt:s.updatedAt||new Date().toISOString()};});const st=r.settings??DEFAULT_SAVE.settings;return {version:1,slots,settings:{quality:['low','medium','high'].includes(st.quality)?st.quality:'medium',volume:Number.isFinite(st.volume)?Math.max(0,Math.min(1,st.volume)):0.6,muted:Boolean(st.muted),reducedMotion:Boolean(st.reducedMotion)},bests:r.bests??{}};}
export function loadSave():{data:SaveData;available:boolean;warning?:string}{try{const raw=localStorage.getItem(KEY);if(!raw)return {data:structuredClone(DEFAULT_SAVE),available:true};return {data:sanitize(JSON.parse(raw)),available:true};}catch{return {data:structuredClone(DEFAULT_SAVE),available:false,warning:'端末保存を利用できません。現在のプレイはメモリ内で続行します。'};}}
export function storeSave(data:SaveData):boolean{try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
