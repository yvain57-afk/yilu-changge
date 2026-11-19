import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './ui-full-runtime.test';

function runtime(){
 const h=host(0),g=h.g;g.touch=-1;g.menuAnimAcc=0;
 Object.assign(g.platform,{updateMusic(){},pumpSound(){},consumeSoundEvents(){},sound(){},unlockAudio(){}});
 g.at=(e:any)=>({x:e.x,y:e.y});
 return h;
}
const touch=(id:number,x=160,y=400)=>({getID:()=>id,x,y});

test('secondary finger cancellation cannot steal the active battle drag',()=>{
 const {g}=runtime();g.begin();g.down(touch(1));g.move(touch(1,190));
 const before=g.battle.state.targetX;
 // Use the registered touch-cancel handler, falling back to the old handler for the baseline.
 (g.touchCancelled||g.cancel).call(g,touch(2));g.move(touch(1,220));
 assert.ok(g.battle.state.targetX>before,'the original finger must keep steering');
 (g.touchCancelled||g.cancel).call(g,touch(1));
 assert.equal(g.touch,-1);assert.equal(g.battle.state.targetX,g.battle.state.heroX);
});

test('cancelled menu press clears the pressed appearance without invoking its action',()=>{
 const {g}=runtime();let draws=0,actions=0;
 g.drawMenu=()=>{draws++;};g.hits=[{id:'test',x:100,y:350,w:100,h:100,action:()=>actions++}];
 g.down(touch(1));const pressedDraws=draws;
 (g.touchCancelled||g.cancel).call(g,touch(1));
 assert.equal(g.pressed,null);assert.equal(actions,0);assert.equal(draws,pressedDraws+1);
});

test('dragging at a scroll boundary clears the button highlight even if the scroll offset stays still',()=>{
 const {g}=runtime();g.screen='settings';let paintedPressed=false;
 g.fullMenu.contentTop=300;g.fullMenu.contentBottom=500;g.fullMenu.scrollBy=()=>false;
 g.drawMenu=()=>{paintedPressed=!!g.pressed;};
 g.hits=[{id:'test',x:100,y:350,w:100,h:100,action(){}}];
 g.down(touch(1));assert.equal(paintedPressed,true);
 g.move(touch(1,160,420));assert.equal(paintedPressed,false);
 g.touchCancelled(touch(1));assert.equal(paintedPressed,false);
});

test('paused battle reuses its frame; resize and resume still repaint',()=>{
 const {g}=runtime();g.begin();let renders=0;g.battle.render=()=>renders++;
 g.show('pause');const state=JSON.stringify(g.battle.snapshot());
 for(let i=0;i<120;i++)g.update(1/60);
 assert.equal(renders,1,'static paused scene only needs one render');
 assert.equal(JSON.stringify(g.battle.snapshot()),state);
 g.platform.windowMetrics.revision=1;g.update(1/60);assert.equal(renders,2);
 g.show('battle');g.update(1/60);g.update(1/60);assert.equal(renders,4);
});

test('battle timing samples remain bounded across long sessions and reset on restart',()=>{
 const {g}=runtime();g.begin();g.battle.render=()=>{};g.battle.step=()=>{};
 for(let i=0;i<1800;i++)g.update(1/60);
 assert.ok(g.frames.length<=600,'recent timing samples have a fixed memory budget');
 assert.equal(g.frameCount,1800);assert.ok(Math.abs(g.frameSeconds-30)<.001);
 g.begin();assert.equal(g.frameCount,0);assert.equal(g.frames.length,0);
});
