// Executes the archived build's own System.register game modules; engine transport is inert.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=process.cwd(),bundle='/Users/yvainair/Code/Codex/2026-09-30/campaign20-iphone-install/signed/CocosGame.app/assets/main/index.js';
const registry=new Map(),loaded=new Map(),noop=()=>{};
vm.runInNewContext(fs.readFileSync(bundle,'utf8'),{System:{register:(id,deps,fn)=>registry.set(id,{deps,fn})},console,Math,Date,Set,Map},{filename:'archived-2026093002-index.js'});
function get(id){if(id==='cc')return {cclegacy:{_RF:{push:noop,pop:noop}}};if(loaded.has(id))return loaded.get(id);const r=registry.get(id);if(!r)throw Error('missing '+id);const out={};loaded.set(id,out);const reg=r.fn((name,value)=>{if(typeof name==='object')Object.assign(out,name);else out[name]=value;return value;},{id});r.deps.forEach((dep,i)=>reg.setters[i](get(dep.startsWith('.')?'chunks:///_virtual/'+path.basename(dep):dep)));reg.execute();return out;}
const {createBattle}=get('chunks:///_virtual/battle.ts'),{MANIFEST}=get('chunks:///_virtual/manifest.ts');
const {FormalStore}=get('chunks:///_virtual/store.ts'),store=new FormalStore({getItem:()=>null,setItem:noop});
let begin=0,end=0,frames=0;
const renderer=new Proxy({begin:()=>begin++,end:()=>end++,measure:(s,n)=>String(s).length*n*.6,measureText:s=>({width:String(s).length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),frame:(k,x,y,h)=>{frames++;return{x,y:y-h,w:40,h};}},{get:(o,k)=>k in o?o[k]:noop});
const b=createBattle({chapter:10,lineup:{...store.loadout(),weapons:['spear','liannu'],startWeaponId:'liannu'},renderer,seed:19}),s=b.state;s.show=0;s.tier=2;s.ents=[];let failure;
for(let i=0;i<160;i++){b.step();try{b.render({W:402,H:874,top:62,bottom:34});}catch(e){failure={tick:i,weapon:s.weapon,tier:s.tier,message:String(e),stack:e.stack.split('\n').slice(0,5),begin,end,bodyAndSpriteSubmissions:frames,scope:'archived package JavaScript with inert renderer, not current device logs'};break;}}
if(!failure)throw Error('did not reproduce');console.log(JSON.stringify(failure,null,2));fs.writeFileSync(root+'/evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001/archived02-reproduction.json',JSON.stringify(failure,null,2));
