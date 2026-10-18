import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_BUTTON_DEFAULTS,homeButtonLayout,validateHomeButtonConfig} from '../assets/scripts/formal/HomeButtonLayout';
import {homeLayout} from '../assets/scripts/formal/MenuLayout';
import {host} from './ui-full-runtime.test';
import {validateHomeEditorConfig} from '../assets/scripts/formal/HomeEditor';

test('home button defaults preserve approved geometry on small/tall screens and pending reward layouts',()=>{
 for(const [W,H] of [[320,568],[375,667],[402,874]])for(const pending of [false,true]){
  const old=homeLayout(W,H,20,16,pending),button=homeButtonLayout(W,H,20,16,pending,HOME_BUTTON_DEFAULTS);
  assert.deepEqual(button,{x:16,y:old.actionY,w:W-32,h:52,fontSize:15});
 }
});
test('adjusted home button keeps drawn label and clickable rectangle aligned without changing navigation or save data',()=>{
 const h=host(0),before=JSON.stringify(h.store.data),other=h.g.hits.filter((v:any)=>v.id!=='start').map(({action,...v}:any)=>v);
 h.ui.homeButtonOverride={offsetX:30,offsetY:-32,widthPercent:70,height:72,fontSize:22};h.g.drawMenu();
 const rect=homeButtonLayout(h.g.size.W,h.g.size.H,h.g.size.top,h.g.size.bottom,false,h.ui.homeButtonOverride),hit=h.g.hits.find((v:any)=>v.id==='start');
 assert.deepEqual({x:hit.x,y:hit.y,w:hit.w,h:hit.h},{x:rect.x,y:rect.y,w:rect.w,h:rect.h});
 const label=h.ui.textRecords.find((v:any)=>v.text==='开始征程')!;
 assert.equal(label.size,22);assert.equal(label.x,rect.x+rect.w/2);assert.equal(label.y,rect.y+rect.h/2);
 assert.ok(label.bounds.y>=label.container.y&&label.bounds.y+label.bounds.h<=label.container.y+label.container.h);
 assert.deepEqual(h.g.hits.filter((v:any)=>v.id!=='start').map(({action,...v}:any)=>v),other);
 assert.equal(JSON.stringify(h.store.data),before);h.click('start');assert.equal(h.g.screen,'prepare');assert.equal(JSON.stringify(h.store.data),before);
});
test('extreme adjustments remain on screen, avoid bottom navigation and reject invalid persistent settings',()=>{
 for(const [W,H]of [[320,568],[402,874]])for(const offsetX of[-160,160])for(const offsetY of[-160,80]){
  const r=homeButtonLayout(W,H,20,16,true,{offsetX,offsetY,widthPercent:45,height:96,fontSize:24});
  assert.ok(r.x>=16&&r.x+r.w<=W-16);assert.ok(r.y>=20&&r.y+r.h<=homeLayout(W,H,20,16,true).navY-8);
 }
 for(const input of[{...HOME_BUTTON_DEFAULTS,fontSize:Infinity},{...HOME_BUTTON_DEFAULTS,height:0},{...HOME_BUTTON_DEFAULTS,unknown:1},null])assert.throws(()=>validateHomeButtonConfig(input));
});
test('whole-home editing changes text, artwork and multiple buttons while retaining their real actions and progress',()=>{
 const h=host(0),before=JSON.stringify(h.store.data),drawn:any[]=[];h.g.drawHomeArt=(r:any)=>drawn.push(r);
 h.ui.homeEditorOverride={title:{offsetX:12,offsetY:8,fontSize:24,text:'一路长歌 · 试调'},hero:{offsetX:15,offsetY:12,widthPercent:80,heightPercent:90},progress:{text:'已通关 {通关数}，下一站第{关数}关'},settings:{offsetX:-30,widthPercent:150,text:'菜单'},chapters:{offsetY:-8,text:'看地图'},collection:{text:'看图鉴'},start:{text:'整备出发'}};
 h.g.drawMenu();assert.equal(h.ui.homeEditorItems.length,11);
 const title=h.ui.textRecords.find((r:any)=>r.text==='一路长歌 · 试调')!;assert.equal(title.size,24);
 assert.ok(h.ui.textRecords.some((r:any)=>r.text==='已通关 0，下一站第1关'));
 const hero=h.ui.homeEditorItems.find((r:any)=>r.id==='hero')!;assert.deepEqual(drawn.at(-1),hero.rect);assert.equal(hero.rect.x,hero.base.x+15);
 const settings=h.g.hits.find((r:any)=>r.id==='settings');assert.equal(settings.label,'菜单');assert.equal(settings.w,93);
 h.click('settings');assert.equal(h.g.screen,'settings');h.g.show('home');h.click('chapters');assert.equal(h.g.screen,'chapters');h.g.show('home');h.click('collection');assert.equal(h.g.screen,'collection');h.g.show('home');h.click('start');assert.equal(h.g.screen,'prepare');assert.equal(JSON.stringify(h.store.data),before);
});
test('homepage default templates follow actual progress and invalid text/settings cannot enter saved config',()=>{
 for(const n of[0,13,20]){const h=host(n);assert.ok(h.ui.textRecords.some((r:any)=>r.text==='三国 · 已克 '+n+'/20'));assert.equal(h.g.hits.find((r:any)=>r.id==='start').label,n===0?'开始征程':n===20?'重游山河':'继续征程');}
 const text='title: "文字" <不是网页>\\换行\n下一行';assert.deepEqual(validateHomeEditorConfig({title:{text}}),{title:{text}});
 for(const value of[{unrecognized:{offsetX:1}},{title:{fontSize:NaN}},{hero:{text:'不可编辑文字'}},{progress:{text:'{未知变量}'}},{title:{text:'x'.repeat(161)}}])assert.throws(()=>validateHomeEditorConfig(value));
});
