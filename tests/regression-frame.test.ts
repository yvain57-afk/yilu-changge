import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {MANIFEST} from '../assets/scripts/formal/manifest';
const size={W:402,H:874,top:62,bottom:34};
function rig(failStage=''){
 let active=0,commits=0,aborts=0,armed=!!failStage;const roles:any[]=[];const noop=()=>{};
 const renderer:any=new Proxy({begin(){active=0;roles.length=0;},end(){commits++;},abortFrame(){active=0;roles.length=0;aborts++;},measure:(s:any,n:number)=>String(s).length*n*.6,measureText:(s:any)=>({width:String(s).length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),frame(k:string,x:number,y:number,h:number,o:any={}){active++;roles.push({k,...o});const f=MANIFEST.frames[k];return f?{x:x-h/2,y:y-h,w:h,h}:null;}},{get:(o,k)=>k in o?o[k]:noop});
 const store=new FormalStore({getItem:()=>null,setItem:noop});const b=createBattle({chapter:10,lineup:{...store.loadout(),weapons:['spear','liannu'],startWeaponId:'liannu'},renderer,viewport:size,seed:123,renderProbe:(stage:string)=>{if(armed&&stage===failStage){armed=false;throw Error('injected '+stage);}}});
 b.state.show=0;b.state.shake=.8;return {b,roles,get active(){return active;},get commits(){return commits;},get aborts(){return aborts;}};
}
test('a failed frame aborts once, freezes simulation and input, and requires explicit recovery',()=>{
 for(const stage of ['world','hero','waves','hud']){const r=rig(stage);assert.throws(()=>r.b.render(size),/injected/);assert.equal(r.commits,0);assert.equal(r.aborts,1);assert.equal(r.active,0);const saved=JSON.stringify(r.b.snapshot());r.b.step();r.b.move(.5);r.b.render(size);assert.equal(JSON.stringify(r.b.snapshot()),saved);assert.equal(r.aborts,1);assert.equal(r.b.drainAudioEvents().length,0);assert.equal(r.b.retryRender(size),true);assert.equal(r.commits,1);r.b.pause(false);r.b.step();assert.ok(r.b.state.t>0);}
});
test('render success/failure leaves model randomness and damage unchanged at equal simulation ticks',()=>{
 const a=rig(),b=rig(),c=rig('waves');for(let i=0;i<600;i++){a.b.step();b.b.step();c.b.step();b.b.render(size);try{c.b.render(size);}catch{assert.ok(c.b.retryRender(size));c.b.pause(false);}}
 for(const r of [b,c]){assert.deepEqual(r.b.ledger,a.b.ledger);assert.deepEqual(r.b.totals,a.b.totals);assert.deepEqual(r.b.state.ents,a.b.state.ents);assert.equal(r.b.state.t,a.b.state.t);}
});
test('brandish submits exactly one hero body with explicit actor identity',()=>{const r=rig();r.b.state.show=.6;r.b.render(size);assert.equal(r.roles.filter(x=>x.role==='hero_body'&&x.actorId==='player').length,1);});

import {resolveWeaponPresentation,presentationBounds} from '../assets/scripts/formal/WeaponPresentation';
import {WEAPON_DATA} from '../assets/scripts/formal/data';
test('5760 actual battle draw combinations retain one identified body and valid weapon parts',()=>{
 let cases=0;const r=rig();
 for(const weapon of Object.keys(WEAPON_DATA))for(const tier of [1,2,3])for(const mount of [null,'chitu','dilu','jingfan','jueying'])for(const pose of ['run','wind','rel','rec'])for(const x of [-.82,0,.82])for(const viewport of [size,{W:375,H:667,top:20,bottom:0}]){
  const w:any=WEAPON_DATA[weapon as keyof typeof WEAPON_DATA],s=r.b.state;s.weapon=weapon;s.tier=tier;s.slots.ma.id=mount;s.heroX=s.targetX=x;s.show=0;s.atkT=pose==='run'?w.wind+w.rel+w.rec+.01:pose==='wind'?w.wind*.3:pose==='rel'?w.wind+w.rel*.5:w.wind+w.rel+w.rec*.8;
  r.b.render(viewport);const body=r.roles.filter(v=>v.role==='hero_body');assert.equal(body.length,1,[weapon,mount,pose].join(':'));assert.equal(body[0].actorId,'player');for(const role of r.roles)assert.ok(MANIFEST.frames[role.k],role.k);
  const v=resolveWeaponPresentation(weapon,pose,mount);assert.equal(v.weaponId,weapon);assert.ok(v.bodyContainsWeapon?v.heldWeaponParts.length===0:v.heldWeaponParts.length>0);const b=presentationBounds(v,75,150);assert.ok([b.x,b.y,b.w,b.h].every(Number.isFinite));cases++;
 }
 assert.equal(cases,5760);
});
