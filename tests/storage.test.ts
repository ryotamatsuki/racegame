import { beforeEach, describe, expect, test } from 'vitest';
import { DEFAULT_SAVE, loadSave, storeSave } from '../src/storage/save';

class MemoryStorage {
  data=new Map<string,string>();
  getItem(k:string){return this.data.get(k)??null;} setItem(k:string,v:string){this.data.set(k,v);} removeItem(k:string){this.data.delete(k);} clear(){this.data.clear();}
}

describe('save schema',()=>{
  beforeEach(()=>Object.defineProperty(globalThis,'localStorage',{value:new MemoryStorage(),configurable:true}));
  test('round trips three slots/settings/bests schema',()=>{const x=structuredClone(DEFAULT_SAVE);x.settings.quality='high';x.bests['workshop-oval']=12.34;expect(storeSave(x)).toBe(true);const y=loadSave();expect(y.available).toBe(true);expect(y.data.settings.quality).toBe('high');expect(y.data.bests['workshop-oval']).toBe(12.34);expect(y.data.slots).toHaveLength(3);});
  test('corrupt JSON safely falls back',()=>{localStorage.setItem('racegame-save-v1','{broken');const y=loadSave();expect(y.available).toBe(false);expect(y.data.version).toBe(1);});
});
