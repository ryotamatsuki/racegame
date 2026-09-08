import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { CameraMode, CourseId, DerivedVehicle, GameMode, MachineId, PartCategory, Quality, RaceResult, Setup } from '../types';
import { PART_CATEGORIES, PART_CATEGORY_LABELS } from '../types';
import { MACHINES, getMachine } from '../data/machines';
import { COURSES } from '../data/courses';
import { PARTS_BY_CATEGORY, deriveVehicle, isCompatible } from '../data/parts';
import { GarageScene } from '../game/rendering/GarageScene';
import { RaceScene, type HudInfo } from '../game/rendering/RaceScene';
import { RaceEngine } from '../game/simulation/race';
import { AudioManager } from '../game/audio/AudioManager';
import { loadSave, storeSave, type SaveData } from '../storage/save';

const fmt=(s:number)=>`${Math.floor(s/60)}:${(s%60).toFixed(3).padStart(6,'0')}`;
const ratingLabels: Array<[keyof DerivedVehicle['ratings'],string]>=[['speed','最高速'],['acceleration','加速'],['cornering','コーナー'],['stability','安定性'],['endurance','持久力']];

function hasWebGL2(){try{const c=document.createElement('canvas');return Boolean(c.getContext('webgl2'));}catch{return false;}}

function GarageCanvas({machineId,setup,quality,exploded,focus,wheelTest,onLost}:{machineId:MachineId;setup:Setup;quality:Quality;exploded:boolean;focus?:PartCategory;wheelTest:boolean;onLost:()=>void}){
  const host=useRef<HTMLDivElement>(null);const scene=useRef<GarageScene|null>(null);
  useEffect(()=>{if(!host.current)return;const s=new GarageScene(host.current,quality,onLost);scene.current=s;s.setCar(getMachine(machineId),setup);return()=>{s.dispose();scene.current=null;};},[quality,onLost]);
  useEffect(()=>{scene.current?.setCar(getMachine(machineId),setup);},[machineId,setup]);
  useEffect(()=>scene.current?.setExploded(exploded),[exploded]);
  useEffect(()=>scene.current?.setFocus(focus),[focus]);
  useEffect(()=>scene.current?.setWheelTest(wheelTest),[wheelTest]);
  return <div className="viewport" ref={host} data-testid="garage-3d"/>;
}

function MiniMap({courseId}:{courseId:CourseId}){
  const path=courseId==='workshop-oval'?'M12 40 C12 10 88 10 88 40 C88 70 12 70 12 40Z':courseId==='technical-ridge'?'M10 44 C18 6 38 16 44 38 S67 76 74 42 S91 10 92 42 S72 74 58 50 S32 12 10 44Z':'M50 42 C25 42 12 25 20 14 C28 2 45 13 39 27 C32 45 55 62 77 56 C94 51 94 22 76 17 C61 12 51 22 50 42Z';
  return <svg className="mini-map" viewBox="0 0 100 80" aria-label="コース図"><path d={path}/></svg>;
}

function RaceCanvas({courseId,mode,machineId,setup,seed,quality,reducedMotion,audio,onHud,onDone,onPaused,onLost,controlRef}:{courseId:CourseId;mode:GameMode;machineId:MachineId;setup:Setup;seed:number;quality:Quality;reducedMotion:boolean;audio:AudioManager;onHud:(h:HudInfo)=>void;onDone:(r:RaceResult,p:{samples:number;medianMs:number;p95Ms:number})=>void;onPaused:()=>void;onLost:()=>void;controlRef:MutableRefObject<RaceScene|null>}){
  const host=useRef<HTMLDivElement>(null);
  const callbacks=useRef({onHud,onDone,onPaused,onLost});
  callbacks.current={onHud,onDone,onPaused,onLost};
  useEffect(()=>{if(!host.current)return;const engine=new RaceEngine({courseId,mode,playerMachineId:machineId,playerSetup:setup,seed});let scene:RaceScene;scene=new RaceScene(host.current,engine,audio,quality,reducedMotion,(h)=>callbacks.current.onHud(h),(r)=>callbacks.current.onDone(r,scene.getPerformance()),()=>callbacks.current.onPaused(),()=>callbacks.current.onLost());controlRef.current=scene;return()=>{scene.dispose();controlRef.current=null;};},[courseId,mode,machineId,setup,seed,quality,reducedMotion,audio,controlRef]);
  return <div className="viewport race-viewport" ref={host} data-testid="race-3d"/>;
}

export function App(){
  const initial=useMemo(()=>loadSave(),[]);
  const [save,setSave]=useState<SaveData>(initial.data);const [storageWarning,setStorageWarning]=useState(initial.warning);
  const [screen,setScreen]=useState<'title'|'garage'|'course'|'race'|'result'>('title');
  const [machineId,setMachineId]=useState<MachineId>('aero-falcon');const [setup,setSetup]=useState<Setup>({...getMachine('aero-falcon').defaultSetup});
  const [selectedCat,setSelectedCat]=useState<PartCategory>('motor');const [before,setBefore]=useState<DerivedVehicle|null>(null);const [exploded,setExploded]=useState(false);const [wheelTest,setWheelTest]=useState(false);
  const [courseId,setCourseId]=useState<CourseId>('workshop-oval');const [mode,setMode]=useState<GameMode>('race');const [seed,setSeed]=useState(2408);
  const [hud,setHud]=useState<HudInfo>({elapsed:0,countdown:3,lap:1,speedKmh:0,rpm:0,position:1,section:'START',status:'onTrack'});const [result,setResult]=useState<RaceResult>();const [perf,setPerf]=useState<{samples:number;medianMs:number;p95Ms:number}>();const [paused,setPaused]=useState(false);const [fatal,setFatal]=useState<string>();
  const [webglOk]=useState(()=>hasWebGL2());const audio=useMemo(()=>new AudioManager(),[]);const raceControl=useRef<RaceScene|null>(null);
  const currentMachine=getMachine(machineId);const stats=useMemo(()=>deriveVehicle(currentMachine,setup),[currentMachine,setup]);
  const settings=save.settings;
  useEffect(()=>()=>audio.dispose(),[audio]);
  useEffect(()=>{audio.setVolume(settings.volume);audio.setMuted(settings.muted);},[audio,settings.volume,settings.muted]);

  const persist=(next:SaveData)=>{setSave(next);if(!storeSave(next))setStorageWarning('端末保存を利用できません。現在のプレイはメモリ内で続行します。');};
  const updateSettings=(patch:Partial<SaveData['settings']>)=>persist({...save,settings:{...save.settings,...patch}});
  const chooseMachine=(id:MachineId)=>{setMachineId(id);setSetup({...getMachine(id).defaultSetup});setBefore(null);setExploded(false);};
  const choosePart=(cat:PartCategory,id:string)=>{const part=PARTS_BY_CATEGORY[cat].find(p=>p.id===id);if(!part)return;const compat=isCompatible(currentMachine,part);if(!compat.ok)return;setBefore(stats);setSetup(s=>({...s,[cat]:id}));audio.effect('swap');};
  const resetSetup=()=>{setBefore(stats);setSetup({...currentMachine.defaultSetup});};
  const saveSlot=(i:number)=>{const slots=[...save.slots];slots[i]={name:`SETUP ${i+1}`,machineId,setup:{...setup},updatedAt:new Date().toISOString()};persist({...save,slots});};
  const loadSlot=(i:number)=>{const slot=save.slots[i];if(!slot)return;setMachineId(slot.machineId);setSetup({...slot.setup});setBefore(null);};
  const startGarage=async()=>{await audio.enable();setScreen('garage');};
  const beginRace=()=>{setResult(undefined);setPerf(undefined);setPaused(false);setHud({elapsed:0,countdown:3,lap:1,speedKmh:0,rpm:0,position:1,section:'READY',status:'onTrack'});audio.effect('start');setScreen('race');};
  const onDone=(r:RaceResult,p:{samples:number;medianMs:number;p95Ms:number})=>{setResult(r);setPerf(p);const player=r.rows.find(x=>x.id==='player');if(player?.totalTime){const old=save.bests[r.courseId];if(old===undefined||player.totalTime<old)persist({...save,bests:{...save.bests,[r.courseId]:player.totalTime}});}setScreen('result');};
  const retry=()=>{setSeed(s=>s);beginRace();};
  const onLost=()=>setFatal('WebGLコンテキストが失われました。安全のため走行を停止しました。ページを再読込してください。');
  const setCam=(m:CameraMode)=>raceControl.current?.setCamera(m);
  const resume=()=>{raceControl.current?.resume();setPaused(false);};

  if(!webglOk) return <main className="fallback"><div className="fallback-card"><p className="eyebrow">WEBGL 2 REQUIRED</p><h1>3D描画を開始できません</h1><p>このブラウザまたは端末ではWebGL 2を利用できません。GPUアクセラレーションを有効にした対応ブラウザで再試行してください。</p><button onClick={()=>location.reload()}>再試行</button></div></main>;

  return <main className={`app screen-${screen}`}>
    {fatal&&<div className="fatal" role="alert"><strong>描画エラー</strong><span>{fatal}</span><button onClick={()=>location.reload()}>再読込</button></div>}
    {storageWarning&&<div className="notice" role="status">{storageWarning}<button aria-label="閉じる" onClick={()=>setStorageWarning(undefined)}>×</button></div>}

    {screen==='title'&&<section className="title-screen">
      <div className="title-glow"/><div className="title-copy"><p className="eyebrow">MICRO SCALE / MAXIMUM TUNING</p><h1>MICRO RACER<br/><span>WORKSHOP</span></h1><p>選ぶ。組む。走らせる。パーツの違いを3Dとラップタイムで確かめる、オリジナル模型レーシングゲーム。</p><button className="primary hero-button" onClick={startGarage}>WORKSHOPを開く</button><small>ログイン不要・端末内保存 / PC・タッチ対応</small></div>
      <div className="title-machine"><div className="silhouette"><i/><i/><i/><i/></div></div>
    </section>}

    {screen==='garage'&&<section className="garage-layout">
      <header className="topbar"><div><span className="brand-dot"/> MICRO RACER WORKSHOP</div><div className="top-actions"><button onClick={()=>setScreen('title')}>TITLE</button><button onClick={()=>setScreen('course')} className="primary">レースへ</button></div></header>
      <div className="garage-stage"><GarageCanvas machineId={machineId} setup={setup} quality={settings.quality} exploded={exploded} focus={selectedCat} wheelTest={wheelTest} onLost={onLost}/><div className="stage-label"><span>GARAGE / LIVE MODEL</span><strong>{currentMachine.name}</strong><small>{currentMachine.subtitle}</small></div><div className="stage-tools"><button className={exploded?'active':''} onClick={()=>setExploded(v=>!v)}>{exploded?'組み立て':'分解表示'}</button><button className={wheelTest?'active':''} onClick={()=>setWheelTest(v=>!v)}>車輪テスト</button></div></div>
      <aside className="performance-panel"><p className="eyebrow">PERFORMANCE</p><h2>{currentMachine.name}</h2><p className="machine-desc">{currentMachine.description}</p>{ratingLabels.map(([key,label])=><div className="rating" key={key}><div><span>{label}</span><b>{stats.ratings[key]}</b>{before&&<em className={stats.ratings[key]-before.ratings[key]>=0?'plus':'minus'}>{stats.ratings[key]-before.ratings[key]>=0?'+':''}{stats.ratings[key]-before.ratings[key]}</em>}</div><div className="bar"><i style={{width:`${stats.ratings[key]}%`}}/></div></div>)}<div className="spec-grid"><span>重量<b>{(stats.massKg*1000).toFixed(0)} g</b></span><span>ギヤ<b>{stats.gearRatio.toFixed(1)}:1</b></span><span>電圧<b>{stats.batteryVoltage.toFixed(2)} V</b></span><span>タイヤ<b>{(stats.tireRadiusM*2000).toFixed(0)} mm</b></span></div></aside>
      <div className="machine-strip"><span className="strip-title">MACHINE</span>{MACHINES.map(m=><button key={m.id} className={m.id===machineId?'selected':''} onClick={()=>chooseMachine(m.id)}><i style={{background:`#${m.accent.toString(16).padStart(6,'0')}`}}/><span>{m.name}</span><small>{m.subtitle}</small></button>)}</div>
      <div className="parts-dock"><div className="category-tabs">{PART_CATEGORIES.map(c=><button key={c} className={selectedCat===c?'selected':''} onClick={()=>setSelectedCat(c)}>{PART_CATEGORY_LABELS[c]}</button>)}</div><div className="part-list">{PARTS_BY_CATEGORY[selectedCat].map(p=>{const comp=isCompatible(currentMachine,p);const selected=setup[selectedCat]===p.id;return <button key={p.id} className={selected?'selected':''} disabled={!comp.ok} title={comp.reason} onClick={()=>choosePart(selectedCat,p.id)}><span className="part-icon">{String(p.modelVariant+1).padStart(2,'0')}</span><strong>{p.name}</strong><small>{comp.ok?p.description:comp.reason}</small>{selected&&<em>装着中</em>}</button>})}</div><div className="dock-actions"><button onClick={resetSetup}>標準構成に戻す</button><div className="slots">{save.slots.map((slot,i)=><span key={i}><button onClick={()=>saveSlot(i)}>保存{i+1}</button><button disabled={!slot} onClick={()=>loadSlot(i)}>{slot?`読込 ${slot.name}`:'空き'}</button></span>)}</div></div></div>
    </section>}

    {screen==='course'&&<section className="course-screen"><header className="topbar"><button onClick={()=>setScreen('garage')}>← 改造へ戻る</button><strong>COURSE SELECT</strong><span/></header><div className="course-content"><div className="mode-switch"><button className={mode==='race'?'selected':''} onClick={()=>setMode('race')}>4台・3周レース</button><button className={mode==='time-attack'?'selected':''} onClick={()=>setMode('time-attack')}>タイムアタック</button></div><div className="course-grid">{COURSES.map(c=><button key={c.id} className={`course-card ${courseId===c.id?'selected':''}`} onClick={()=>setCourseId(c.id)}><div className="course-preview"><MiniMap courseId={c.id}/><span>{c.difficulty}</span></div><small>{c.subtitle}</small><h2>{c.name}</h2><p>{c.description}</p>{save.bests[c.id]&&<b>BEST {fmt(save.bests[c.id]!)}</b>}</button>)}</div><div className="preflight"><div><span>MACHINE</span><b>{currentMachine.name}</b></div><div><span>MODE</span><b>{mode==='race'?'4台レース':'タイムアタック'}</b></div><div><span>SEED</span><b>{seed}</b></div><button className="primary launch" onClick={beginRace}>START RACE</button></div></div></section>}

    {screen==='race'&&<section className="race-screen"><RaceCanvas courseId={courseId} mode={mode} machineId={machineId} setup={setup} seed={seed} quality={settings.quality} reducedMotion={settings.reducedMotion} audio={audio} onHud={setHud} onDone={onDone} onPaused={()=>setPaused(true)} onLost={onLost} controlRef={raceControl}/><div className="race-hud"><div className="rank"><small>POSITION</small><strong>{hud.position}<sup> / {mode==='race'?4:1}</sup></strong></div><div className="lap"><small>LAP</small><strong>{hud.lap}<sup> / 3</sup></strong></div><div className="time"><small>TIME</small><strong>{fmt(hud.elapsed)}</strong></div><div className="speed"><small>SPEED</small><strong>{hud.speedKmh.toFixed(1)}<sup> km/h</sup></strong></div><div className="section"><MiniMap courseId={courseId}/><span>{hud.section}</span></div></div>{hud.countdown>0&&<div className="countdown">{Math.ceil(hud.countdown)}</div>}<div className="camera-dock">{(['chase','onboard','trackside','overview','auto'] as CameraMode[]).map((m,i)=><button key={m} onClick={()=>setCam(m)}><span>{i+1}</span>{['追尾','車載','沿道','全景','AUTO'][i]}</button>)}<button onClick={()=>{raceControl.current?.togglePause();setPaused(true)}}>Ⅱ PAUSE</button></div>{paused&&<div className="pause-overlay"><div><p className="eyebrow">RACE PAUSED</p><h2>一時停止中</h2><p>タブ非表示や手動停止では時計を進めません。</p><button className="primary" onClick={resume}>レースを再開</button><button onClick={()=>setScreen('garage')}>改造へ戻る</button></div></div>}</section>}

    {screen==='result'&&result&&<ResultScreen result={result} machineId={machineId} courseId={courseId} perf={perf} best={save.bests[courseId]} onRetry={retry} onGarage={()=>setScreen('garage')} onCourse={()=>setScreen('course')}/>} 

    {(screen==='garage'||screen==='course')&&<SettingsPanel settings={settings} onChange={updateSettings}/>} 
  </main>;
}

function SettingsPanel({settings,onChange}:{settings:SaveData['settings'];onChange:(p:Partial<SaveData['settings']>)=>void}){
  const [open,setOpen]=useState(false);return <div className={`settings ${open?'open':''}`}><button className="settings-toggle" onClick={()=>setOpen(v=>!v)}>設定</button>{open&&<div className="settings-body"><label>画質<select value={settings.quality} onChange={e=>onChange({quality:e.target.value as Quality})}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label><label>音量<input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e=>onChange({volume:Number(e.target.value)})}/></label><label className="check"><input type="checkbox" checked={settings.muted} onChange={e=>onChange({muted:e.target.checked})}/> ミュート</label><label className="check"><input type="checkbox" checked={settings.reducedMotion} onChange={e=>onChange({reducedMotion:e.target.checked})}/> 動きを減らす</label></div>}</div>;
}

function ResultScreen({result,machineId,courseId,perf,best,onRetry,onGarage,onCourse}:{result:RaceResult;machineId:MachineId;courseId:CourseId;perf?:{samples:number;medianMs:number;p95Ms:number};best?:number;onRetry:()=>void;onGarage:()=>void;onCourse:()=>void}){
  const player=result.rows.find(r=>r.id==='player')!;const events=result.events.filter(e=>e.vehicleId==='player');const corner=events.filter(e=>e.type==='corner-slow').length,landing=events.filter(e=>e.type==='landing-loss'||e.type==='course-out').length,loop=events.filter(e=>e.type==='loop-loss').length;
  const advice=loop?'ループで接触を失っています。トルク・進入速度・安定系パーツの組合せを見直してください。':landing?'着地イベントで速度損失またはコースアウトが記録されています。ブレーキとウイングの安定側を比較してください。':corner?'コーナーで横加速度限界による減速が記録されています。グリップタイヤや支持力の高いローラーが候補です。':'大きな失速イベントはありません。直線向けに抵抗と減速比を詰める余地があります。';
  return <section className="result-screen"><div className="result-card"><p className="eyebrow">RACE RESULT / {COURSES.find(c=>c.id===courseId)?.name}</p><div className="result-hero"><div><small>YOUR RESULT</small><strong>{player.status==='finished'?`#${player.position}`:'DNF'}</strong><span>{player.totalTime?fmt(player.totalTime):'NOT FINISHED'}</span></div><div className="result-machine"><b>{getMachine(machineId).name}</b>{best&&player.totalTime===best&&<em>NEW BEST</em>}</div></div><div className="result-table">{result.rows.map(r=><div key={r.id} className={r.id==='player'?'player':''}><b>{r.position}</b><span>{getMachine(r.machineId).name}</span><em>{r.status==='finished'&&r.totalTime?fmt(r.totalTime):'DNF'}</em></div>)}</div><div className="laps"><h3>LAP TIMES</h3>{player.lapTimes.map((t,i)=><span key={i}><small>LAP {i+1}</small><b>{fmt(t)}</b></span>)}</div><div className="advice"><h3>SETUP NOTE</h3><p>{advice}</p><small>助言はこの走行で記録されたイベントに基づきます。</small></div>{perf&&<div className="perf"><span>描画フレーム時間（このセッション）</span><b>median {perf.medianMs.toFixed(1)} ms</b><b>p95 {perf.p95Ms.toFixed(1)} ms</b><small>{perf.samples} samples / 実端末性能保証ではありません</small></div>}<div className="result-actions"><button className="primary" onClick={onRetry}>同じseedで再挑戦</button><button onClick={onCourse}>コース選択</button><button onClick={onGarage}>改造へ戻る</button></div></div></section>;
}
