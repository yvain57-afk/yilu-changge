import test from 'node:test';
import assert from 'node:assert/strict';
import {drawMomentumStatus,drawGrowthImpact,drawGrowthPickup,drawGrowthStatus,GROWTH_PICKUP_SECONDS,GrowthPaint} from '../assets/scripts/formal/GrowthPresentation';
import {MANIFEST} from '../assets/scripts/formal/manifest';

/** Strict supported-surface probe: a Canvas-only method fails immediately. */
function surface(){
 const texts:{text:string;x:number;y:number;width:number;alpha:number}[]=[];
 const frames:{key:string;x:number;y:number;h:number;w:number}[]=[];
 const paths:{x:number;y:number}[]=[];
 let drawCalls=0;const stack:any[]=[];
 const p:GrowthPaint={
  globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#fff',strokeStyle:'#fff',lineWidth:1,lineCap:'round',font:'600 14px sans-serif',textAlign:'left',textBaseline:'middle',
  save(){stack.push({globalAlpha:p.globalAlpha,globalCompositeOperation:p.globalCompositeOperation,fillStyle:p.fillStyle,strokeStyle:p.strokeStyle,lineWidth:p.lineWidth,font:p.font,textAlign:p.textAlign,textBaseline:p.textBaseline});},
  restore(){assert.ok(stack.length);Object.assign(p,stack.pop());},
  beginPath(){},closePath(){},moveTo(x,y){paths.push({x,y});},lineTo(x,y){paths.push({x,y});},
  arcTo(x,y,x2,y2){paths.push({x,y},{x:x2,y:y2});},arc(x,y,r){paths.push({x:x-r,y:y-r},{x:x+r,y:y+r});},
  ellipse(x,y,rx,ry){paths.push({x:x-rx,y:y-ry},{x:x+rx,y:y+ry});},
  fill(){drawCalls++;},stroke(){drawCalls++;},fillRect(x,y,w,h){drawCalls++;paths.push({x,y},{x:x+w,y:y+h});},
  measureText(text){const size=Number(p.font.match(/([\d.]+)px/)?.[1]||14);return {width:Array.from(text).reduce((n,c)=>n+(/[\u0000-\u00ff]/.test(c)?.58:1)*size,0)};},
  fillText(text,x,y){drawCalls++;texts.push({text,x,y,width:p.measureText(text).width,alpha:p.globalAlpha});},
  frame(key,x,y,h){drawCalls++;const f=MANIFEST.frames[key];assert.ok(f,'missing icon '+key);frames.push({key,x,y,h,w:h*f.r[2]/f.r[3]});}
 };
 return {p,texts,frames,paths,get drawCalls(){return drawCalls;},get depth(){return stack.length;}};
}

test('pickup card respects narrow screens, wraps detail and fits atlas icons',()=>{
 for(const W of [320,360,402,430])for(const icon of ['g_tr_taiping','g_icon_spear',null]){
  const d=surface();drawGrowthPickup(d.p,{W,y:180,age:1,title:'太平要术 · 连锁雷觉醒',detail:'每三次出招连锁命中三名附近敌人，本局伤害增加百分之二十四',icon,color:'#96E8F5'});
  const w=Math.min(W-108,270),x=(W-w)/2;
  assert.ok(d.texts.length>=2&&d.texts.length<=3);
  for(const t of d.texts){assert.ok(t.x>=x+12);assert.ok(t.x+t.width<=x+w-12+.01,JSON.stringify({W,t}));}
  for(const f of d.frames){assert.ok(f.w<=29+.01&&f.h<=29+.01);assert.ok(f.x-f.w/2>=x+12);}
  assert.ok(d.drawCalls<=9);assert.equal(d.depth,0);
 }
});

test('reward receipts disappear at expiry and restore renderer state',()=>{
 for(const age of [-1,0,GROWTH_PICKUP_SECONDS,20,NaN]){
  const d=surface();drawGrowthPickup(d.p,{W:360,y:150,age,title:'升阶',detail:'攻击增强',icon:null,color:'#F6D78D'});assert.equal(d.drawCalls,0);
 }
 const d=surface();d.p.globalAlpha=.4;
 drawGrowthPickup(d.p,{W:360,y:150,age:.075,title:'强攻',detail:'全军伤害 +12%',icon:'unknown',color:'#F6D78D'});
 assert.ok(d.texts.every(t=>Math.abs(t.alpha-.2)<1e-8));assert.equal(d.p.globalAlpha,.4);assert.equal(d.p.globalCompositeOperation,'source-over');assert.equal(d.depth,0);
});

test('growth status shows real numeric bonuses and bounded passive labels',()=>{
 for(const W of [320,360,402]){
  const d=surface();drawGrowthStatus(d.p,{W,y:110,damage:1.36,speed:1.12,shield:4,effects:['thunder','flame','blade','thunder'],generalName:'赵云'});
  assert.equal(d.texts.length,2);assert.match(d.texts[0].text,/攻\+36%/);assert.match(d.texts[0].text,/速\+12%/);assert.match(d.texts[0].text,/护盾4/);
  for(const t of d.texts)assert.ok(t.x>=58&&t.x+t.width<=W-16);
  assert.equal(d.texts[1].text.split('连锁雷').length,2);
  assert.ok(d.drawCalls<=4);assert.equal(d.depth,0);
 }
});

test('resolved-hit effects have deterministic bounded geometry and no stale drawing',()=>{
 const points=Object.freeze(Array.from({length:20},(_,i)=>Object.freeze({x:60+i*20,y:180+i*13,s:.5+i*.02})));
 for(const kind of ['thunder','flame','shield','power'] as const){
  const d=surface(),e=surface();const o={kind,age:.1,life:.6,points:points as any};
  drawGrowthImpact(d.p,o);drawGrowthImpact(e.p,o);
  assert.ok(d.drawCalls>0&&d.drawCalls<=6);assert.ok(d.paths.length<55,kind+' geometry budget');
  assert.ok(d.paths.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.deepEqual(d.paths,e.paths);
  assert.equal(d.depth,0);assert.equal(d.p.globalAlpha,1);assert.equal(d.p.globalCompositeOperation,'source-over');
  const expired=surface();drawGrowthImpact(expired.p,{...o,age:.6});assert.equal(expired.drawCalls,0);
 }
 const empty=surface();drawGrowthImpact(empty.p,{kind:'thunder',age:0,life:1,points:[{x:NaN,y:0,s:1}]});assert.equal(empty.drawCalls,0);
});

test('momentum strip clears treasure slots and bounds both text and meter on narrow screens',()=>{
 for(const W of [320,360,402])for(const active of [false,true]){
  const d=surface();drawMomentumStatus(d.p,{W,y:110,active,remaining:7.9,charge:11,combo:300});
  for(const t of d.texts)assert.ok(t.x>54&&t.x+t.width<=W-8);
  for(const p of d.paths)assert.ok(p.x>54&&p.x<=W-8&&p.y>=155&&p.y<=178);
  assert.equal(d.depth,0);assert.ok(d.drawCalls<=3);
 }
});
