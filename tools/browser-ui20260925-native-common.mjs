// Native Chrome CDP for actual tab lifecycle: no Playwright forced-focus sessions.
import{spawn}from'node:child_process';import{resolve}from'node:path';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function openNative(){
 const port=43219,proc=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[`--remote-debugging-port=${port}`,`--user-data-dir=${resolve('.cache/UI-20260925-native-tab-'+Date.now())}`,'--no-first-run','--no-default-browser-check','--window-size=500,940','about:blank'],{stdio:'ignore'});let endpoint;
 for(let n=0;n<100;n++){try{endpoint=(await(await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl;break;}catch{await delay(100);}}
 if(!endpoint)throw Error('Native Chrome CDP unavailable');const ws=new WebSocket(endpoint);await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});let seq=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',event=>{const v=JSON.parse(event.data);if(v.id){const p=pending.get(v.id);if(p){pending.delete(v.id);v.error?p.reject(Error(JSON.stringify(v.error))):p.resolve(v.result);}}else if(v.method==='Runtime.exceptionThrown')errors.push(v.params.exceptionDetails.text);});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...sessionId?{sessionId}:{}}));});
 async function page(url='about:blank'){
  const {targetId}=await send('Target.createTarget',{url,background:true}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true}),cd={send:(method,params)=>send(method,params,sessionId)};await cd.send('Page.enable');await cd.send('Runtime.enable');
  const evaluate=async(fn,arg)=>{const r=await cd.send('Runtime.evaluate',{expression:`(${fn.toString()})(${JSON.stringify(arg)??''})`,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const waitForFunction=async(fn,arg,options={})=>{const until=Date.now()+(options.timeout??20000);let last;while(Date.now()<until){try{if(await evaluate(fn,arg))return;}catch(e){last=e;}await delay(options.polling??50);}throw Error('Native page condition timeout: '+fn.toString()+' '+(last??''));};
  return{targetId,cd,evaluate,waitForFunction,waitForTimeout:delay,goto:async url=>{await cd.send('Page.navigate',{url});await delay(200);},reload:async()=>{await cd.send('Page.reload',{ignoreCache:false});await delay(300);},bringToFront:async()=>{await send('Target.activateTarget',{targetId});await cd.send('Page.bringToFront');await delay(150);},close:()=>send('Target.closeTarget',{targetId})};
 }
 const p=await page(),cd=p.cd;await cd.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await cd.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await p.goto('http://127.0.0.1:43197/');await p.bringToFront();
 const ready=()=>p.waitForFunction(()=>globalThis.__YLCG__?.snapshot().version==='ui-20260925'&&globalThis.__YLCG__.snapshot().resourcesReady);await ready();const snap=()=>p.evaluate(()=>globalThis.__YLCG__.snapshot()),pos=(x,y)=>p.evaluate(({x,y})=>{const r=document.querySelector('canvas').getBoundingClientRect(),s=r.width/720;return{x:r.x+r.width/2+x*s,y:r.y+r.height/2-y*s,s};},{x,y});
 const event=(type,touchPoints=[])=>cd.send('Input.dispatchTouchEvent',{type,touchPoints});let touching=false,cursor;
 const release=async()=>{if(touching)await event('touchEnd');touching=false;};
 const tap=async id=>{const b=(await snap()).buttons.find(b=>b.id===id);if(!b)throw Error('Missing '+id);const a=await pos(b.x,b.y);await event('touchStart',[{x:a.x,y:a.y,id:1}]);await event('touchEnd');await delay(120);};
 const target=async x=>{const j=(await snap()).journey,a=await pos(0,-160);if(!touching){cursor=a.x;await event('touchStart',[{x:cursor,y:a.y,id:1}]);touching=true;}cursor+=(x-j.target)*260*a.s;await event('touchMove',[{x:cursor,y:a.y,id:1}]);};
 const metrics=()=>p.evaluate(async()=>{const {director}=await System.import('cc'),d=director.root.device;return{drawCalls:d.numDrawCalls,triangles:d.numTris,gpuBuffers:d.memoryStatus.bufferSize,gpuTextures:d.memoryStatus.textureSize,jsHeap:performance.memory?.usedJSHeapSize};});
 return{p,cd,snap,pos,ready,tap,target,release,metrics,errors,c:{newPage:page,newCDPSession:async p=>p.cd,close:async()=>{await send('Browser.close').catch(()=>{});ws.close();await delay(150);if(proc.exitCode===null)proc.kill();}}};
}
