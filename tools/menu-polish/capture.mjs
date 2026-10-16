/**
 * Replay the real FullMenu / map painter into Chrome.
 * Cocos Creator is not available here; pixels come from the same draw calls,
 * the real UI atlas, and the real menu strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';

const root=path.resolve('assets/scripts/formal');
const req=createRequire(path.resolve('tests/ui-full-runtime.test.ts'));
const cache=new Map();
const stubs={
 './NativePaint':{NativePaint:class{static textures={ui_full_components:{}};static mapWanted=new Set();static loadMapPanels(){return new Promise(()=>{});}}},
 '../Platform':{Platform:class{}},
 '../ui/PresentationAssets':{PresentationAssets:class{}},
 './SafeErrorOverlay':{SafeErrorOverlay:class{}},
 './BridgeDiagnostics':{BridgeDiagnostics:class{event(){} sample(){}}},
 'cc/env':{DEBUG:false},
 cc:{Component:class{},_decorator:{ccclass:()=>((c)=>c)},view:{getVisibleSize:()=>({width:390,height:844})},sys:{isNative:false,isBrowser:false}},
};
function actual(file){
 const f=path.resolve(file);if(cache.has(f))return cache.get(f).exports;
 const module={exports:{}};cache.set(f,module);
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
 const load=(id)=>stubs[id]??(id.startsWith('.')?actual(path.resolve(path.dirname(f),id+'.ts')):req(id));
 vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:f})(load,module,module.exports);
 return module.exports;
}
const {FormalStore}=actual(path.join(root,'store.ts'));
const {FullMenu}=actual(path.join(root,'FullMenu.ts'));
const {FormalGame}=actual(path.join(root,'FormalGame.ts'));
const {CHAPTERS,TREASURES,requiredOfficers}=actual(path.join(root,'data.ts'));
const {MANIFEST}=actual(path.join(root,'manifest.ts'));

const measure=(s,n)=>Array.from(String(s)).reduce((v,c)=>v+(/[\u2e80-\uffff]/.test(c)?1:/[il1 .·]/.test(c)?.33:.59)*n,0);
function sheetFile(sheet){
 const rel=MANIFEST.sheets[sheet];if(!rel)return null;
 for(const ext of ['.png','.jpg','.jpeg','.webp']){
  const file=path.resolve('assets/resources',rel+ext);
  if(fs.existsSync(file))return file;
 }
 return null;
}

class Recorder{
 constructor(){this.ops=[];this.stack=[];this.fillStyle='#fff';this.font='600 14px Arial';this.textAlign='left';this.textBaseline='middle';this.globalAlpha=1;this._images=new Map();}
 save(){this.stack.push({fillStyle:this.fillStyle,font:this.font,textAlign:this.textAlign,textBaseline:this.textBaseline,globalAlpha:this.globalAlpha});}
 restore(){const s=this.stack.pop();if(s)Object.assign(this,s);}
 measure(s,n){return measure(s,n);}
 createLinearGradient(){const stops=[];return{stops,addColorStop:(at,c)=>{stops.push([at,c]);stops.sort((a,b)=>a[0]-b[0]);}};}
 clipBox(x,y,w,h){
  if(!this.clipping||!this.clip)return {x,y,w,h,dx:0,dy:0};
  const c=this.clip,x2=Math.max(x,c.x),y2=Math.max(y,c.y),r=Math.min(x+w,c.x+c.w),b=Math.min(y+h,c.y+c.h);
  if(r<=x2||b<=y2)return null;return {x:x2,y:y2,w:r-x2,h:b-y2,dx:x2-x,dy:y2-y};
 }
 fillRect(x,y,w,h){
  const box=this.clipBox(x,y,w,h);if(!box)return;x=box.x;y=box.y;w=box.w;h=box.h;
  const style=this.fillStyle,alpha=this.globalAlpha;if(!w||!h||alpha<=0)return;
  if(style&&style.stops){
   const steps=24;for(let i=0;i<steps;i++){const t=(i+.5)/steps;let j=1;while(j<style.stops.length-1&&style.stops[j][0]<t)j++;const lo=style.stops[Math.max(0,j-1)],hi=style.stops[Math.min(j,style.stops.length-1)],k=Math.max(0,Math.min(1,(t-lo[0])/((hi[0]-lo[0])||1)));this.ops.push({op:'fill',x,y:y+h*i/steps,w,h:h/steps+0.2,color:mix(lo[1],hi[1],k),alpha});}
   return;
  }
  this.ops.push({op:'fill',x,y,w,h,color:String(style),alpha});
 }
 fillText(text,x,y){if(this.clipping&&this.clip&&(y<this.clip.y-2||y>this.clip.y+this.clip.h+2||x<this.clip.x-8||x>this.clip.x+this.clip.w+8))return;this.ops.push({op:'text',text:String(text),x,y,font:this.font,color:String(this.fillStyle),align:this.textAlign,baseline:this.textBaseline||'alphabetic',alpha:this.globalAlpha});}
 beginPath(){this._path=[];}
 ellipse(x,y,rx,ry){this._path.push({x,y,rx,ry});}
 fill(){for(const e of this._path||[])this.ops.push({op:'ellipse',x:e.x,y:e.y,rx:e.rx,ry:e.ry,color:String(this.fillStyle),alpha:this.globalAlpha});}
 drawImage(im,sx,sy,sw,sh,x,y,w,h){
  const box=this.clipBox(x,y,w,h);if(!box)return;
  if(box.w!==w||box.h!==h){sx+=box.dx/w*sw;sy+=box.dy/h*sh;sw*=box.w/w;sh*=box.h/h;x=box.x;y=box.y;w=box.w;h=box.h;}
  const sheet=typeof im==='string'?im:im?.sheet;if(!sheet||!(w>0)||!(h>0))return;
  const file=sheetFile(sheet);if(!file)return;
  let id=this._images.get(file);if(!id){id='img'+this._images.size;this._images.set(file,id);}
  this.ops.push({op:'image',id,sx,sy,sw,sh,x,y,w,h,alpha:this.globalAlpha});
 }
 frame(key,x,y,h,o={}){
  const f=MANIFEST.frames[key];if(!f)return;
  const [sx,sy,sw,sh]=f.r,sc=h/(o.refH||sh),w=sw*sc,hh=sh*sc;
  const cx=o.center?w/2:(f.a?.[0]??0.5)*w,cy=o.center?hh/2:hh*(1-(f.a?.[1]??0));
  const prev=this.globalAlpha;if(o.alpha!=null)this.globalAlpha*=o.alpha;
  this.drawImage({sheet:f.s},sx,sy,sw,sh,x-cx,y-cy,w,hh);this.globalAlpha=prev;
 }
 cover(file,x,y,w,h){this.ops.push({op:'cover',file,x,y,w,h});}
 contain(file,r){this.ops.push({op:'contain',file,...r});}
 images(){return [...this._images.keys()];}
}
function mix(a,b,k){
 const pa=parseColor(a),pb=parseColor(b);
 const c=pa.map((v,i)=>Math.round(v+(pb[i]-v)*k));
 return `rgba(${c[0]},${c[1]},${c[2]},${(c[3]/255).toFixed(3)})`;
}
function parseColor(v){
 if(typeof v!=='string')return [255,255,255,255];
 if(v.startsWith('#')){const h=v.slice(1);const n=h.length===3?h.split('').map(c=>c+c).join(''):h;const x=parseInt(n,16);return [(x>>16)&255,(x>>8)&255,x&255,255];}
 const m=v.match(/[\d.]+/g)?.map(Number)||[0,0,0,1];return [m[0],m[1],m[2],(m[3]??1)*255];
}
function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};}
function win(store,i,id='win-'+i){return store.settle({id,chapter:i,won:true,troops:48,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:requiredOfficers(i)});}
function makeHost(n=8){
 const io=memory(),store=new FormalStore(io);
 for(let i=0;i<n;i++){win(store,i);store.acknowledgePresentation();}
 const ui=new FullMenu(),paint=new Recorder();
 const g=Object.create(FormalGame.prototype);
 Object.assign(g,{uiSkin:true,fullMenu:ui,store,menu:paint,paint,screen:'home',chapter:Math.min(19,n),tab:'weapons',page:0,screenAge:3,personId:'',first:true,resultError:'',loadingError:'',runId:'shot',battle:null,rewardReturn:'home',hits:[],pressed:null,resultReceipt:null,reviewFixture:'',rev:0,renderErrors:[],bridgeDiagnostics:{event(){}},mapScroll:0,mapExpanded:false,mapSelection:Math.min(19,n),mapPanelKey:'',mapDragging:false,screenAge:3,
  platform:{windowMetrics:{width:390,height:844,safe:{top:47,bottom:810}},syncAudio(){},setMusicScene(){},stopEffects(){},book:{data:{settings:{music:true,musicVolume:.6,sfx:true,vibration:false,reducedMotion:false}},persist(){return true;}}},
  drawMenu(){g.hits=[];ui.draw(g);},
  drawHomeArt(r){paint.contain(path.resolve('assets/resources/ui20260925/hero-home.png'),r);},
 });
 Object.defineProperty(g,'size',{value:{W:390,H:844,top:47,bottom:34,k:1},configurable:true});
 const content=new Proxy(paint,{get(t,p){if(['fillRect','fillText','drawImage','frame','fill'].includes(p))return (...a)=>{t.clipping=true;const r=t[p](...a);t.clipping=false;return r;};return t[p];},set(t,p,v){t[p]=v;return true;}});
 g.menuLayers={measure:(s,n)=>paint.measure(s,n),setViewport(r){paint.clip=r;},content,fixed:paint,overlay:paint};
 return {g,ui,store,paint,io};
}
function backdrop(paint,screen,W,H){
 const file=screen==='home'?'home-bg':screen==='chapters'||screen==='transition'?'map-bg':screen==='result'||screen==='reward'?'result-bg':'camp-bg';
 paint.cover(path.resolve('assets/resources/ui20260925',file+'.jpg'),0,0,W,H);
}
function shoot(setup){
 const h=makeHost(setup.progress??8);
 setup.run(h);
 h.paint.ops=[];
 if(h.g.screen!=='chapters'&&h.g.screen!=='transition')backdrop(h.paint,h.g.screen,h.g.size.W,h.g.size.H);
 h.g.drawMenu();
 return h.paint;
}

const pages=[
 {id:'home',title:'首页',run(h){h.g.show('home');}},
 {id:'map',title:'山河地图',run(h){h.g.drawMap=FormalGame.prototype.drawMap;h.g.show('chapters');}},
 {id:'prepare',title:'整备出征',run(h){h.g.show('prepare');h.g.tab='weapons';h.g.drawMenu();}},
 {id:'collection',title:'图鉴',run(h){h.g.tab='people';h.g.show('collection');}},
 {id:'person',title:'人物',run(h){h.g.personId='zhuge';h.g.show('person');}},
 {id:'item',title:'兵器',run(h){h.ui.detailKind='weapon';h.ui.detailId='liannu';h.g.show('item');}},
 {id:'result-win',title:'胜利',run(h){h.g.chapter=8;h.g.first=true;h.g.battle={state:{troops:36},snapshot:()=>({damageSources:{}}),pause(){},cancel(){}};h.g.resultReceipt={xp:30,items:h.store.data.pendingRewardPresentation?.items||[]};h.g.show('result');}},
 {id:'reward',title:'封赏',progress:0,run(h){win(h.store,0,'shot-reward');h.g.chapter=0;h.g.screenAge=3;h.g.show('reward');h.g.screenAge=3;h.g.drawMenu();}},
 {id:'milestone',title:'里程碑',progress:9,run(h){win(h.store,9,'shot-mile');h.g.chapter=9;h.g.screenAge=3;h.g.show('reward');h.g.screenAge=3;h.g.drawMenu();}},
 {id:'result-loss',title:'战败',run(h){h.g.chapter=8;h.g.battle={state:{troops:0},snapshot:()=>({damageSources:{archer:12,cavalry:4}}),pause(){},cancel(){}};h.g.resultReceipt={xp:0,items:[]};h.g.show('result');}},
 {id:'pause',title:'暂停',run(h){h.g.show('pause');}},
 {id:'confirm',title:'确认',run(h){h.g.show('pause');const quit=h.g.hits.find(x=>x.id==='quit');quit.action();}},
 {id:'settings',title:'设置',run(h){h.g.show('settings');}},
 {id:'loading',title:'加载',run(h){h.g.show('loading');}},
 {id:'error',title:'异常',run(h){h.g.loadingError='isolated preview';h.g.show('error');}},
];

const phase=process.argv[2]||'before';
const out=path.resolve(process.argv[3]||`/tmp/menu-polish/${phase}`);
fs.mkdirSync(out,{recursive:true});
const shots=[];
for(const page of pages){
 const paint=shoot(page);
 const images={};
 for(const file of paint.images())images[paint._images.get(file)]=file;
 for(const op of paint.ops)if(op.file)images[op.file]=op.file;
 shots.push({id:page.id,title:page.title,ops:paint.ops,images});
 console.log(phase,page.id,paint.ops.length);
}
fs.writeFileSync(path.join(out,'scene.json'),JSON.stringify({W:390,H:844,shots}));

const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}canvas{display:block}</style><canvas id="c" width="780" height="1688"></canvas><script>
const scene=${JSON.stringify({W:390,H:844,shots:shots.map(s=>({...s,images:Object.fromEntries(Object.entries(s.images).map(([k,file])=>[k,'file://'+file]))}))})};
const files=[...new Set(scene.shots.flatMap(s=>Object.values(s.images)))];
const bitmaps={};
function load(src){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});}
(async()=>{
 for(const src of files)bitmaps[src]=await load(src);
 const c=document.getElementById('c'),g=c.getContext('2d');
 window.__shots=scene.shots.map(s=>s.id);
 window.render=function(id){
  const shot=scene.shots.find(x=>x.id===id);g.clearRect(0,0,c.width,c.height);g.setTransform(2,0,0,2,0,0);g.fillStyle='#101D2B';g.fillRect(0,0,scene.W,scene.H);
  for(const op of shot.ops){
   g.globalAlpha=op.alpha??1;
   if(op.op==='fill'){g.fillStyle=op.color;g.fillRect(op.x,op.y,op.w,op.h);}
   else if(op.op==='ellipse'){g.fillStyle=op.color;g.beginPath();g.ellipse(op.x,op.y,op.rx,op.ry,0,0,Math.PI*2);g.fill();}
   else if(op.op==='text'){g.font=op.font.replace('Arial','"WenQuanYi Micro Hei", sans-serif');g.fillStyle=op.color;g.textAlign=op.align||'left';g.textBaseline=op.baseline==='middle'?'middle':'alphabetic';g.fillText(op.text,op.x,op.y);}
   else if(op.op==='image'){const img=bitmaps[shot.images[op.id]];if(!img)continue;g.drawImage(img,op.sx,op.sy,op.sw,op.sh,op.x,op.y,op.w,op.h);}
   else if(op.op==='cover'||op.op==='contain'){const img=bitmaps[shot.images[op.file]||op.file];if(!img)continue;const r=op.op==='cover'?cover(img,op):contain(img,op);g.drawImage(img,r.sx,r.sy,r.sw,r.sh,r.x,r.y,r.w,r.h);}
  }
  g.globalAlpha=1;
 };
 function cover(img,op){const s=Math.max(op.w/img.width,op.h/img.height),w=op.w/s,h=op.h/s;return{sx:(img.width-w)/2,sy:(img.height-h)/2,sw:w,sh:h,x:op.x,y:op.y,w:op.w,h:op.h};}
 function contain(img,op){const s=Math.min(op.w/img.width,op.h/img.height),w=img.width*s,h=img.height*s;return{sx:0,sy:0,sw:img.width,sh:img.height,x:op.x+(op.w-w)/2,y:op.y+(op.h-h)/2,w,h};}
 window.__ready=true;
})();
</script>`;
const htmlPath=path.join(out,'replay.html');
fs.writeFileSync(htmlPath,html);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:780,height:1688},deviceScaleFactor:1});
await page.goto('file://'+htmlPath);
await page.waitForFunction(()=>window.__ready);
for(const shot of shots){
 await page.evaluate(id=>window.render(id),shot.id);
 const file=path.join(out,shot.id+'.png');
 await page.locator('#c').screenshot({path:file});
}
await browser.close();
console.log('wrote',out);
