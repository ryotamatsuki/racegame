import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { MachineDefinition, PartCategory, Quality, Setup } from '../../types';
import { createCarVisual, type CarVisual } from './CarFactory';

export class GarageScene {
  private renderer:THREE.WebGLRenderer;
  private scene=new THREE.Scene();
  private camera=new THREE.PerspectiveCamera(42,1,0.01,100);
  private controls:OrbitControls;
  private car?:CarVisual;
  private raf=0;
  private resizeObserver:ResizeObserver;
  private explode=0;
  private wheelAngle=0;
  private wheelTest=false;
  private contextLostHandler:(e:Event)=>void;

  constructor(private container:HTMLElement,quality:Quality,onContextLost:()=>void){
    this.renderer=new THREE.WebGLRenderer({antialias:quality!=='low',alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,quality==='high'?2:quality==='medium'?1.5:1));
    this.renderer.shadowMap.enabled=quality!=='low';this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;
    this.renderer.domElement.className='three-canvas';container.appendChild(this.renderer.domElement);
    this.scene.background=new THREE.Color(0x171c19);this.scene.fog=new THREE.Fog(0x171c19,6,12);
    this.camera.position.set(0.43,0.34,0.48);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=false;this.controls.minDistance=0.28;this.controls.maxDistance=0.9;this.controls.target.set(0,0.05,0);this.controls.enableDamping=true;
    this.buildWorkshop(quality);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.contextLostHandler=(e)=>{e.preventDefault();onContextLost();};this.renderer.domElement.addEventListener('webglcontextlost',this.contextLostHandler);
    this.loop();
  }

  private buildWorkshop(quality:Quality){
    const hemi=new THREE.HemisphereLight(0xb9d2c1,0x3a2e28,1.55);this.scene.add(hemi);
    const key=new THREE.DirectionalLight(0xfff1d9,quality==='low'?1.7:2.3);key.position.set(1.8,2.5,1.4);key.castShadow=quality!=='low';key.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);this.scene.add(key);
    const rim=new THREE.PointLight(0x6ad5c0,5,3);rim.position.set(-1.2,0.9,-1);this.scene.add(rim);
    const table=new THREE.Mesh(new THREE.BoxGeometry(3.5,0.16,2.2),new THREE.MeshStandardMaterial({color:0x70462d,roughness:0.72,metalness:0.02}));table.position.y=-0.12;table.receiveShadow=true;this.scene.add(table);
    const mat=new THREE.Mesh(new THREE.BoxGeometry(1.55,0.018,1.0),new THREE.MeshStandardMaterial({color:0x1d6a53,roughness:0.82}));mat.position.set(0,-0.025,0);mat.receiveShadow=true;this.scene.add(mat);
    const grid=new THREE.GridHelper(1.45,24,0xb3cfbe,0x3c846f);grid.position.y=-0.014;grid.scale.z=0.66;this.scene.add(grid);
    const tray=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.035,0.24),new THREE.MeshStandardMaterial({color:0x33383a,roughness:0.5,metalness:0.2}));tray.position.set(-0.72,0,0.28);this.scene.add(tray);
    for(let i=0;i<5;i++){const part=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.012,12),new THREE.MeshStandardMaterial({color:i%2?0xd1b14d:0xb9c2c6,metalness:0.55,roughness:0.3}));part.position.set(-0.84+i*0.06,0.03,0.28+(i%2)*0.05);tray.add(part);}
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.022,0.34,16),new THREE.MeshStandardMaterial({color:0xc44135,roughness:0.55}));handle.rotation.z=Math.PI/2;handle.position.set(0.72,0.035,0.30);this.scene.add(handle);
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.25,10),new THREE.MeshStandardMaterial({color:0xb9bfc2,metalness:0.8,roughness:0.2}));shaft.rotation.z=Math.PI/2;shaft.position.set(0.46,0.035,0.30);this.scene.add(shaft);
    const peg=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.7),new THREE.MeshStandardMaterial({color:0x2b302e,roughness:0.9}));peg.position.set(0,0.75,-0.8);this.scene.add(peg);
  }

  setCar(machine:MachineDefinition,setup:Setup){if(this.car){this.scene.remove(this.car.root);this.car.dispose();}this.car=createCarVisual(machine,setup,false);this.car.root.scale.setScalar(1.8);this.car.root.position.y=0.018;this.scene.add(this.car.root);this.car.setExploded(this.explode);}
  setExploded(on:boolean){this.explode=on?0.22:0;this.car?.setExploded(this.explode);}
  setFocus(category?:PartCategory){this.car?.setFocus(category);}
  setWheelTest(on:boolean){this.wheelTest=on;}
  resetView(){this.camera.position.set(0.43,0.34,0.48);this.controls.target.set(0,0.05,0);this.controls.update();}
  private loop=()=>{this.raf=requestAnimationFrame(this.loop);this.controls.update();if(this.wheelTest){this.wheelAngle-=0.14;this.car?.spinWheels(this.wheelAngle);}this.renderer.render(this.scene,this.camera);};
  private resize(){const w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  dispose(){cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.controls.dispose();this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLostHandler);if(this.car)this.car.dispose();this.scene.traverse((o)=>{if(o instanceof THREE.Mesh&&!this.car?.root.getObjectById(o.id)){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});this.renderer.dispose();this.renderer.domElement.remove();}
}
