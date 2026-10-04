import test from 'node:test';import assert from 'node:assert/strict';
import {host} from './ui-full-runtime.test';
import {intersection,clipHit,layoutText,MenuViewState} from '../assets/scripts/formal/MenuLayout';
import {Book,KEY,defaults} from '../assets/scripts/core/save';
test('Q01: partially visible card remains drawable at 1 and 8 pixels',()=>{
 const h=host();h.g.show('prepare');for(const n of [1,8,40])assert.equal((h.ui as any).visible(h.ui.contentTop-n,80),true);
});
test('Q02: a card taller than viewport stays drawable, never permanently invisible',()=>{
 const h=host();h.g.show('person');assert.equal((h.ui as any).visible(h.ui.contentTop-20,800),true);
});
test('Q03: clipped hit cannot escape viewport or expose tiny fragments',()=>{
 const v={x:0,y:100,w:375,h:200};assert.equal(clipHit({x:0,y:90,w:60,h:52},v),null);
 assert.deepEqual(clipHit({x:0,y:96,w:60,h:52},v),{x:0,y:100,w:60,h:48});
 assert.equal(intersection({x:0,y:0,w:10,h:10},{x:0,y:10,w:10,h:10}),null);
});
test('Q05: measured line layout used for long mixed names and growth height',()=>{
 const measure=(s:string,n:number)=>Array.from(s).reduce((a,c)=>a+(/[\u2e80-\uffff]/.test(c)?n:n*.6),0);
 const t=layoutText('诸葛连弩 Lv.123\n军功 123456789',90,15,measure);
 assert.equal(t.height,t.lines.length*t.lineHeight);assert.ok(t.lines.every(x=>measure(x,15)<=90));
});
test('Q07: details return to the exact originating tab scroll position',()=>{
 const h=host();h.g.show('prepare');h.click('tab-weapons');h.ui.scrollBy(120);h.g.drawMenu();const pos=h.ui.scroll;
 h.ui.detailKind='weapon';h.ui.detailId='liannu';h.ui.detailReturn='prepare';h.g.show('item');h.click('back');assert.equal(h.ui.scroll,pos);
});
test('Q07: independent views restore and new context resets',()=>{
 const v=new MenuViewState();assert.equal(v.enter('prepare:weapons:11',0,0).scroll,0);
 v.enter('item:liannu',123,2);assert.equal(v.enter('prepare:weapons:11',15,0).scroll,123);
 assert.equal(v.enter('prepare:weapons:12',123,2).scroll,0);
});
test('Q14: compatible motion settings reload without modifying growth records',()=>{
 const data=defaults(),map=new Map<string,string>([[KEY,JSON.stringify({...data,unknownField:17})]]),io={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}};
 const book=new Book(io);assert.equal(!!book.data.settings.reducedMotion,false);book.data.settings.reducedMotion=true;assert.equal(book.persist(),true);
 const reloaded=new Book(io);assert.equal(reloaded.data.settings.reducedMotion,true);assert.deepEqual(reloaded.data.cleared,data.cleared);assert.equal(JSON.parse(map.get(KEY)!).unknownField,17);
});
