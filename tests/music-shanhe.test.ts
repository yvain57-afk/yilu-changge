import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {MusicDirector,musicModeForScreen} from '../assets/scripts/formal/MusicDirector';
import {Book,KEY,defaults} from '../assets/scripts/core/save';
class Voice{playing=false;volume=0;starts=0;pauses=0;stops=0;play(){this.playing=true;this.starts++;}pause(){this.playing=false;this.pauses++;}stop(){this.playing=false;this.stops++;}}
function fixture(){const d=new MusicDirector(),menu=new Voice(),battle=new Voice();d.attach('menu',menu);d.attach('battle',battle);const tick=()=>{for(let i=0;i<60;i++)d.tick(1/60);};return{d,menu,battle,tick};}
test('all real screens route to the same-family arrangement; pause and errors silent',()=>{
 for(const s of ['home','settings','prepare','chapters','collection','person','item','confirm','result','reward','transition'])assert.equal(musicModeForScreen(s),'menu');
 assert.equal(musicModeForScreen('battle'),'battle');for(const s of ['loading','error','render-error','pause'])assert.equal(musicModeForScreen(s),'silent');
});
test('browser waits for gesture; menu navigation does not restart; battle crossfades',()=>{
 const {d,menu,battle,tick}=fixture();d.setScene('home');tick();assert.equal(menu.starts,0);d.unlock();tick();assert.ok(menu.volume>0);assert.equal(menu.starts,1);
 for(const s of ['settings','home','prepare','chapters','collection']){d.setScene(s);tick();}assert.equal(menu.starts,1);
 d.setScene('battle');d.tick(.1);assert.ok(menu.volume>0&&battle.volume>0);tick();assert.equal(menu.playing,false);assert.ok(battle.playing);assert.equal(battle.starts,1);
 d.setScene('battle');d.configure(true,.3);tick();assert.equal(battle.starts,1);assert.equal(battle.volume,.195);
 d.setScene('settings');tick();assert.equal(battle.playing,false);assert.equal(menu.starts,2);
});
test('pause, hide, mute, zero volume and destroy silence immediately; no hidden resume',()=>{
 const {d,menu,battle,tick}=fixture();d.unlock();d.setScene('battle');tick();d.setScene('pause');assert.equal(battle.playing,false);assert.equal(battle.volume,0);
 d.setScene('battle');tick();d.suspend();assert.equal(battle.playing,false);d.setScene('home');tick();assert.equal(menu.playing,false);d.unlock();tick();assert.ok(menu.playing);
 d.configure(false,.6);assert.equal(menu.playing,false);tick();assert.equal(menu.volume,0);d.configure(true,0);tick();assert.equal(menu.playing,false);
 d.configure(true,.6);tick();assert.ok(menu.playing);d.destroy();d.unlock();d.setScene('battle');tick();assert.equal(battle.playing,false);assert.equal(menu.stops,1);assert.equal(battle.stops,1);
});
test('resource loading and late scene changes cannot restart pending audio on every frame',()=>{
 const d=new MusicDirector();let starts=0;const delayed={playing:false,volume:0,play(){starts++;},pause(){},stop(){}};
 d.unlock();d.setScene('battle');d.attach('battle',delayed);for(let i=0;i<100;i++){d.configure(true,.6);d.setScene('battle');d.tick(1/60);}assert.equal(starts,1);
});
test('old saves keep progress, unknown fields and music opt-out; new volume survives reload',()=>{
 const old={...defaults(),otherFeature:{n:42}};old.best['trial-01']=88;old.cleared['trial-01']=true;old.settings.music=false;
 const mem=new Map([[KEY,JSON.stringify(old)]]),storage={getItem:(k:string)=>mem.get(k)||null,setItem:(k:string,v:string)=>{mem.set(k,v);}};
 const b=new Book(storage);assert.equal(b.data.settings.music,false);assert.equal(b.data.settings.musicVolume,undefined);b.data.settings.musicVolume=.3;b.persist();const b2=new Book(storage);
 assert.equal(b2.data.settings.musicVolume,.3);assert.equal(b2.data.best['trial-01'],88);assert.deepEqual(JSON.parse(mem.get(KEY)!).otherFeature,{n:42});
});
test('approved effects and battle rules remain byte identical to this task baseline',()=>{
 const before=JSON.parse(fs.readFileSync('evidence/MUSIC-SHANHE-20261004/workspace-before.json','utf8'));
 const keep=['assets/scripts/formal/battle.ts','assets/scripts/formal/data.ts','assets/scripts/formal/store.ts'];
 for(const row of before.files)if(row.path.startsWith('assets/resources/audio/')||keep.includes(row.path))assert.equal(createHash('sha256').update(fs.readFileSync(row.path)).digest('hex'),row.sha256,row.path);
});
