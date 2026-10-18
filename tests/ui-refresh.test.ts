import './r3-menu.test';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {host} from './ui-full-runtime.test';
import {visibleMapPanels} from '../assets/scripts/formal/CampaignMap';
import {TUNING} from '../assets/scripts/formal/data';

test('UI refresh: no-action item pages reclaim footer space and preserve owned weapon selection',()=>{
 for(const mode of ['unowned','poor','max','ready']){
  const h=host(mode==='unowned'?0:10);h.ui.detailKind='weapon';h.ui.detailId='liannu';
  if(mode==='poor')h.store.data.xp=0;
  if(mode==='max')h.store.data.weaponLevels.liannu=TUNING.weaponMaxLevel;
  h.g.show('item');const {H,bottom}=h.g.size;
  assert.equal(h.ui.contentBottom,H-bottom-(mode==='ready'?80:24),mode);
  assert.equal(h.g.hits.some((x:any)=>x.id==='upgrade-item'),mode==='ready');
  if(mode!=='unowned'){h.reveal('choose-item');h.click('choose-item');assert.equal(h.store.data.selectedWeaponId,'liannu');}
 }
});

test('UI refresh: real map method supports four sizes and navigation with mocked painting',()=>{
 for(const [W,H] of [[360,640],[375,667],[402,874],[430,932]])for(const n of [0,10,20]){
  const h=host(n),g=h.g;Object.defineProperty(g,'size',{value:{W,H,top:44,bottom:34},configurable:true});
  const dashes:number[][]=[];
  Object.assign(g.menu,{beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},ellipse(){},setLineDash(v:number[]){dashes.push(v);}});
  const original=Object.getPrototypeOf(g).drawMap;
  g.drawMap=()=>{g.mapPanelKey=visibleMapPanels(g.mapScroll,g.menuMapMetrics()).join(',');original.call(g);};
  g.show('chapters');
  for(const id of ['map-back','map-current','map-detail','map-depart'])assert.ok(g.hits.some((h:any)=>h.id===id),id);
  assert.ok(dashes.length>0);
  assert.ok(h.ui.textRecords.some((r:any)=>r.text==='天下征程'));
  h.click('map-current');h.click('map-detail');assert.equal(g.mapExpanded,true);
  h.click('map-depart');assert.equal(g.screen,'prepare');
  g.show('chapters');h.click('map-back');assert.equal(g.screen,'home');
 }
});

test('UI refresh: ellipse area, dash gaps and saved dash state',()=>{
 const module={exports:{} as any};const source=fs.readFileSync('assets/scripts/formal/NativePaint.ts','utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:()=>({})});
 const {NativePaint,strokeDashedSubpath}=module.exports,p=new NativePaint({});
 p.begin({W:0,H:0});p.beginPath();p.ellipse(0,0,10,10,0,0,Math.PI*2);
 const pts=p.path[0].p;const area=Math.abs(pts.reduce((a:number,v:number[],i:number)=>{const n=pts[(i+1)%pts.length];return a+v[0]*n[1]-n[0]*v[1]},0)/2);
 assert.ok(area>310&&area<315,String(area));
 for(const [pattern,expected] of [[[6,4],6],[[6,0],8]] as const){let last:number[]=[];let length=0;strokeDashedSubpath([[0,0],[4,0],[8,0]],false,pattern,(x:number,y:number)=>last=[x,y],(x:number,y:number)=>{length+=Math.hypot(x-last[0],y-last[1]);last=[x,y];});assert.equal(length,expected);}
 p.setLineDash([6,4]);p.save();p.setLineDash([2]);p.restore();assert.equal(JSON.stringify(p.getLineDash()),'[6,4]');
 p.begin({W:0,H:0});assert.equal(JSON.stringify(p.getLineDash()),'[]');
});

test('UI refresh: title measurement uses the same width as the navigation bar',()=>{
 const h=host(13);Object.defineProperty(h.g,'size',{value:{W:360,H:640,top:44,bottom:34},configurable:true});
 // The general host uses deliberately wide Latin spacing. Match the painter here to exercise the one-line boundary.
 h.ui.measure=(s:string,n:number)=>Array.from(s).reduce((w,c)=>w+(/[\u2e80-\uffff]/.test(c)?1:/[il1 .·]/.test(c)?.33:.59)*n,0);
 h.g.personId='zhuge';h.g.show('person');
 const title=h.ui.textRecords.find((r:any)=>r.text.includes('诸葛亮'));
 assert.ok(title);
 // A single measured title line must not reserve an extra empty line above the subtitle.
 const subtitle=h.ui.textRecords.find((r:any)=>r.text.includes('已寻访'));
 assert.ok(subtitle);
 assert.ok(subtitle.y-title.y<40);
});
