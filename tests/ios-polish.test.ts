import test from 'node:test';import assert from 'node:assert/strict';
import {armyFormation,armySlots,prepareLayout,fitProjectedFormation,companionSlots,labelsOverlap,nearestLabelRect} from '../assets/scripts/formal/presentation';
import {routeFor,marchSpeed,PACING} from '../assets/scripts/formal/data';
test('army growth is bounded, distinct at every requested threshold, and does not create collision units',()=>{
 const count=[20,21,51,91,151].map(n=>armyFormation(n).count);for(let i=1;i<count.length;i++)assert.ok(count[i]>count[i-1]);assert.equal(armyFormation(0).count,0);assert.equal(armyFormation(9999).count,40);
 for(const n of [1,20,50,90,150,300])for(const hx of [-.82,0,.82])for(const side of [-1,0,1]){const a=armySlots(n,hx,side);assert.equal(a.length,armyFormation(n).count);assert.ok(a.every(p=>Number.isFinite(p.x)&&Math.abs(p.x)<=.95));if(side===1)assert.ok(a.every(p=>p.x<-.1));if(side===-1)assert.ok(a.every(p=>p.x>.1));}
});
test('preparation choices, pager, configuration and depart retain separate vertical space on five phone sizes',()=>{for(const [w,h,t,b] of [[360,640,20,8],[375,667,20,8],[390,844,47,34],[402,874,62,34],[430,932,59,34]]){const p=prepareLayout(w,h,t,b);assert.ok(t+154+p.rows*60+30<=p.y);assert.ok(p.y+p.h+16<=h-b-58);}});
test('every chapter has multiple formations and a hostile guard layer before the final fixed gate chain',()=>{for(let c=0;c<20;c++){const r=routeFor(c,['spear'],[]),squads=r.filter(e=>e.type==='squad');assert.ok(squads.length>Math.floor((PACING.marchSeconds[c]-8)/4.8));assert.ok(new Set(squads.map(e=>e.formation)).size>=3);assert.ok(squads.some(e=>e.formation==='guard'));const last=squads.find(e=>e.elite&&e.formation==='line'&&Math.abs(e.d/marchSpeed(c)-(PACING.marchSeconds[c]-8))<.001);assert.ok(last,'chapter '+(c+1)+' has authored final guard');assert.equal(last.n,8+Math.min(4,c));assert.ok(last.d<r.find(e=>e.fixed)!.d);assert.ok(squads.every(e=>e.n>0),'no zero-head formations');}});

test('rear ranks fit by rigid translation with unchanged spacing at both screen edges',()=>{
 for(const W of [375,402])for(const hx of [-.82,0,.82])for(const side of [-1,0,1]){
  const raw=armySlots(200,hx,side),v={W,cx:W/2,ppu:W*.4,c:24},f=fitProjectedFormation(raw,v,.19,.19);
  const shift=f[0].x-raw[0].x;
  for(let i=0;i<f.length;i++){assert.ok(Math.abs(f[i].x-raw[i].x-shift)<1e-10);const u=v.ppu*v.c/(v.c+f[i].z),x=v.cx+f[i].x*u;assert.ok(x-.19*u>=10-1e-8);assert.ok(x+.19*u<=W-10+1e-8);}
 }
});
test('companions keep a foreground-to-background gap above the hero and rear archers',()=>{for(const hx of [-.82,0,.82]){const a=companionSlots(hx,2);assert.equal(a.length,2);assert.ok(a.every(p=>p.z>=4.4));assert.ok(Math.abs(a[0].x-a[1].x)>.6);assert.ok(a.every(p=>Math.abs(p.x)<.8));}});

test('crate labels avoid final docked gate number, subtitle and troop rectangles',()=>{
 const blocked=[{x:103,y:450,w:60,h:53},{x:177,y:472,w:60,h:53},{x:142,y:545,w:92,h:33}];
 const wanted={x:109,y:475,w:93,h:46},r=nearestLabelRect(wanted,blocked,{x:49,y:152,w:345,h:666});
 assert.ok(blocked.every(b=>!labelsOverlap(r,b,4)));assert.equal(r.w,93);assert.equal(r.h,46);assert.ok(r.y>=152);
});
