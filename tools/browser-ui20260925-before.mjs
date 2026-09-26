import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {open,reviewState,performanceSample,states,fixtureSpec,root} from './browser-ui20260925-common.mjs';
const dir=root+'/before';mkdirSync(dir,{recursive:true});
const performanceOnly=process.argv.includes('--performance-only'),selectedStates=process.argv.find(a=>a.startsWith('--states='))?.split('=')[1]?.split(',');
const t=await open('before',390,844,{before:true}),report=performanceOnly||selectedStates?JSON.parse(readFileSync(dir+'/states.json','utf8')):{version:'v09-rc1',isolated:true,viewport:{width:390,height:844},fixtureSpec,fixtureScriptSha256:createHash('sha256').update(readFileSync('tools/browser-ui20260925-common.mjs')).digest('hex'),buildMainSha256:createHash('sha256').update(readFileSync('.cache/UI-20260925-baseline/isolated-web/web-mobile/assets/main/index.js')).digest('hex'),states:[]};
try{for(const state of performanceOnly?[]:selectedStates??states){const snapshot=await reviewState(t,state);await t.p.screenshot({path:dir+'/'+state+'.png'});const index=report.states.findIndex(v=>v.state===state);if(index>=0)report.states[index]={state,snapshot};else report.states.push({state,snapshot});console.log('captured '+state);}
 if(!selectedStates){report.performance=await performanceSample(t,8);await t.p.screenshot({path:dir+'/density-8s.png'});}report.errors=t.errors;report.fixtureSpec=fixtureSpec;
 writeFileSync(dir+'/states.json',JSON.stringify(report,null,2));writeFileSync(dir+'/performance.json',JSON.stringify(report.performance,null,2));writeFileSync(dir+'/fixture-spec.json',JSON.stringify(fixtureSpec,null,2));
 console.log(JSON.stringify({states:report.states.length,version:report.version,performance:report.performance.frameTiming,errors:t.errors}));
}finally{await t.c.close();}
