import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {MusicDirector,musicModeForScreen} from '../assets/scripts/formal/MusicDirector';
import {SOUND_LIMITS} from '../assets/scripts/formal/WeaponSfx';
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
test('approved audio assets remain byte identical and mixer budgets stay unchanged',()=>{
 const audio=JSON.parse(fs.readFileSync('tests/fixtures/approved-audio-sha256.json','utf8'));
 assert.ok(audio.length>0,'the approved audio baseline must not be empty');
 for(const row of audio)assert.equal(createHash('sha256').update(fs.readFileSync(row.path)).digest('hex'),row.sha256,row.path);
 assert.deepEqual(SOUND_LIMITS,{perKind:1,globalVoices:3,globalVolume:.65,startsPerSecond:12,minStartGapMs:25});
});

test('mini-game switches music sequentially and recovers a dropped play request without per-frame replay',()=>{
 const trace:string[]=[],d=new MusicDirector({crossfade:false,recoverStart:true});
 const menu=new Voice();menu.pause=()=>{menu.playing=false;trace.push('menu-pause');};
 let attempts=0;const battle={playing:false,volume:0,play(){trace.push('battle-play');attempts++;if(attempts===2)this.playing=true;},pause(){this.playing=false;},stop(){this.playing=false;}};
 d.attach('menu',menu);d.attach('battle',battle);d.unlock();d.setScene('home');for(let i=0;i<60;i++)d.tick(1/60);
 d.setScene('battle');assert.ok(trace.indexOf('menu-pause')<trace.indexOf('battle-play'));assert.equal(menu.playing,false);assert.equal(attempts,1);
 for(let i=0;i<180;i++)d.tick(1/60);assert.equal(attempts,2);assert.equal(battle.playing,true);assert.ok(battle.volume>0);
 d.setScene('pause');for(let i=0;i<180;i++)d.tick(1/60);assert.equal(attempts,2);assert.equal(battle.playing,false);
});
test('mini-game failed start retries are bounded, including thrown platform errors, and mute stops retry',()=>{
 const d=new MusicDirector({crossfade:false,recoverStart:true});let attempts=0;
 d.attach('battle',{playing:false,volume:0,play(){attempts++;throw Error('native start failed');},pause(){},stop(){}});d.unlock();d.setScene('battle');
 for(let i=0;i<600;i++)d.tick(1/60);assert.equal(attempts,3);assert.equal(d.state.playErrors,3);
 d.configure(false,.6);for(let i=0;i<600;i++)d.tick(1/60);assert.equal(attempts,3);
});
