import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {open,reviewState,performanceSample,extraReviewState,states,viewports,fixtureSpec,root} from './browser-ui20260925-common.mjs';
for(const folder of ['after','adaptation'])mkdirSync(`${root}/${folder}`,{recursive:true});
const t=await open('matrix'),report={taskId:'UI-20260925',buildId:'ui-20260925',runKind:'fixture',device:'Desktop Chrome touch emulation; no physical phone',fixtureSpec,visualStatus:'not_reviewed',pages:[],checks:[],failures:[],performance:null};
const check=(name,fn)=>{try{fn();report.checks.push({name,status:'pass'});}catch(e){report.failures.push({name,error:String(e)});}};
async function inspect(name,s){
 check(name+' single hero owner',()=>assert.ok(s.presentation.activeHeroDisplayIds.length<=1));
 check(name+' no duplicate result portrait',()=>assert.equal(s.portrait,null));
 check(name+' music remains off',()=>assert.equal(s.audio.musicRequested,false));
 const buttons=[];
 for(const b of s.buttons.filter(b=>b.visible!==false)){const p=await t.pos(b.x,b.y),box={id:b.id,left:p.x-b.w*p.s/2,right:p.x+b.w*p.s/2,top:p.y-b.h*p.s/2,bottom:p.y+b.h*p.s/2,width:b.w*p.s,height:b.h*p.s};buttons.push(box);
  check(name+' '+b.id+' 44px touch area',()=>assert.ok(box.width>=43.99&&box.height>=43.99,JSON.stringify(box)));
  check(name+' '+b.id+' safe area',()=>assert.ok(box.left>=s.ui.metrics.safe.left-.6&&box.right<=s.ui.metrics.safe.right+.6&&box.top>=s.ui.layout.T-.6&&box.bottom<=s.ui.layout.B+.6,JSON.stringify({box,layout:s.ui.layout})));
 }
 if(s.journey?.runner&&s.screen==='battle')check(name+' physical roster budget',()=>{const r=s.journey.runner;assert.equal(r.members.length,Math.min(s.journey.count,48));assert.equal(r.members.reduce((n,m)=>n+m.weight,0),s.journey.count);});
 return{name,screen:s.screen,version:s.version,viewport:t.p.viewportSize(),buttons,ui:s.ui,presentation:s.presentation,texts:s.texts,journey:s.journey?.runner?{count:s.journey.count,x:s.journey.x,z:s.journey.z,members:s.journey.runner.members}:null};
}
try{
 for(const viewport of viewports){await t.p.setViewportSize(viewport);await t.p.waitForTimeout(220);for(const state of states){const s=await reviewState(t,state),id=`${viewport.width}x${viewport.height}-${state}`,file=`${root}/adaptation/${id}.png`;await t.p.screenshot({path:file});report.pages.push({...await inspect(id,s),evidencePath:file});if(viewport.width===390&&viewport.height===844){await t.p.screenshot({path:`${root}/after/${state}.png`});writeFileSync(`${root}/after/${state}.json`,JSON.stringify(s,null,2));}console.log(id);}}
 for(const viewport of [{width:375,height:667},{width:430,height:932}]){await t.p.setViewportSize(viewport);for(const state of ['transition','meeting','settings','error']){const s=await extraReviewState(t,state),id=`${viewport.width}x${viewport.height}-${state}`,file=`${root}/adaptation/${id}.png`;await t.p.screenshot({path:file});report.pages.push({...await inspect(id,s),evidencePath:file});writeFileSync(`${root}/adaptation/${id}.json`,JSON.stringify(s,null,2));console.log(id);}}
 await t.p.setViewportSize({width:390,height:844});await t.p.waitForTimeout(220);report.performance=await performanceSample(t,8);writeFileSync(root+'/performance-after.json',JSON.stringify(report.performance,null,2));
 check('console errors',()=>assert.deepEqual(t.errors,[]));
}catch(e){report.failures.push({name:'execution',error:String(e),stack:e.stack});}
finally{report.errors=t.errors;report.structuralPassed=report.failures.length===0;report.fixtureFunctionSha256=createHash('sha256').update(reviewState.toString()).digest('hex');writeFileSync(root+'/matrix-checks.json',JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify({structuralPassed:report.structuralPassed,visualStatus:report.visualStatus,checks:report.checks.length,failures:report.failures,performance:report.performance?.frameTiming}));if(!report.structuralPassed)process.exitCode=1;}
