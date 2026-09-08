export class AudioManager {
  private ctx?:AudioContext;
  private gain?:GainNode;
  private motor?:OscillatorNode;
  private motorGain?:GainNode;
  private enabled=false;
  private volume=0.6;
  private muted=false;

  async enable(){
    if(this.enabled){if(this.ctx?.state==='suspended')await this.ctx.resume();return;}
    const Ctx=window.AudioContext ?? (window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!Ctx)return;
    this.ctx=new Ctx();this.gain=this.ctx.createGain();this.gain.connect(this.ctx.destination);this.motorGain=this.ctx.createGain();this.motorGain.gain.value=0.055;this.motorGain.connect(this.gain);
    this.motor=this.ctx.createOscillator();this.motor.type='sawtooth';this.motor.frequency.value=70;this.motor.connect(this.motorGain);this.motor.start();this.enabled=true;this.applyVolume();
  }
  setVolume(v:number){this.volume=Math.max(0,Math.min(1,v));this.applyVolume();}
  setMuted(m:boolean){this.muted=m;this.applyVolume();}
  get settings(){return {volume:this.volume,muted:this.muted};}
  private applyVolume(){if(this.gain)this.gain.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx?.currentTime??0,0.02);}
  updateMotor(rpm:number){if(!this.ctx||!this.motor||!this.motorGain)return;const f=55+Math.max(0,Math.min(320,rpm/95));this.motor.frequency.setTargetAtTime(f,this.ctx.currentTime,0.035);this.motorGain.gain.setTargetAtTime(rpm>100?0.05:0.008,this.ctx.currentTime,0.05);}
  effect(kind:'start'|'finish'|'landing'|'swap'){
    if(!this.ctx||!this.gain||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.connect(g);g.connect(this.gain);const now=this.ctx.currentTime;
    const freq={start:520,finish:880,landing:150,swap:330}[kind];o.frequency.setValueAtTime(freq,now);if(kind==='finish')o.frequency.exponentialRampToValueAtTime(1320,now+0.22);g.gain.setValueAtTime(0.11,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.18);o.start(now);o.stop(now+0.2);
  }
  pause(){if(this.ctx?.state==='running')void this.ctx.suspend();}
  resume(){if(this.ctx?.state==='suspended')void this.ctx.resume();}
  dispose(){try{this.motor?.stop();}catch{} void this.ctx?.close();this.enabled=false;}
}
