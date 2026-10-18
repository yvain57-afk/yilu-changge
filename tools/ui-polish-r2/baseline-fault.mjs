import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import ts from 'typescript';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),cache=new Map(),stubs={
 cc:{Component:class{},_decorator:{ccclass:()=>c=>c},view:{getVisibleSize:()=>({width:375,height:667})},sys:{isNative:false}},
 'cc/env':{DEBUG:false},'./NativePaint':{NativePaint:class{}},'../ui/PresentationAssets':{PresentationAssets:class{}},
 './BridgeDiagnostics':{BridgeDiagnostics:class{}},'../Platform':{Platform:class{}}
};
function load(file){if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:file})(id=>stubs[id]??(id.startsWith('.')?load(path.resolve(path.dirname(file),id+'.ts')):req(id)),module,module.exports);return module.exports;}
const {FormalGame}=load(path.resolve('assets/scripts/formal/FormalGame.ts')),cases=[];
for(const stage of ['icon','label','viewport']){
 const g=Object.create(FormalGame.prototype),node=()=>({active:false,setScale(){}}),p={activeNodes:0,begin(){this.activeNodes=1;},abortFrame(){this.activeNodes=0;this.aborted=true;},end(){}};
 Object.assign(g,{screen:'home',uiSkin:true,root:node(),ui:node(),bg:node(),menu:p,platform:{windowMetrics:{width:375,height:667,safe:{top:0,bottom:667}}},art:{begin(){},draw(){},end(){}},hits:[],fullMenu:{draw(host){host.hits.push({id:'partial-action'});throw Error('injected-menu-'+stage);}}});
 let thrown='';try{g.drawMenu();}catch(e){thrown=String(e);}
 cases.push({stage,thrown,activeNodes:p.activeNodes,partialHits:g.hits.length,aborted:!!p.aborted});
}
const record={scope:'Actual baseline FormalGame.drawMenu method with failing menu transport; source fault reproduction, not pixels/device',cases};
fs.writeFileSync('evidence/YILU_UI_POLISH_R2/baseline-menu-fault.json',JSON.stringify(record,null,2));console.log(record);
if(!cases.every(c=>c.thrown&&c.activeNodes===1&&c.partialHits===1&&!c.aborted))throw Error('baseline behavior differs');
