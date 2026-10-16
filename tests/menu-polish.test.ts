import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutMapChrome,mapHeaderCopy,chapterThreats} from '../assets/scripts/formal/CampaignMap';
import {host} from './ui-full-runtime.test';

const measure=(s:string,n:number)=>Array.from(s).reduce((v,c)=>v+(/[\u2e80-\uffff]/.test(c)?1:.59)*n,0);
const overlaps=(a:{x:number;y:number;w:number;h:number},b:{x:number;y:number;w:number;h:number})=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

test('map chrome keeps title, drawer and buttons apart on small phones',()=>{
 for(const [W,H,top,bottom] of [[360,640,20,16],[390,844,47,34],[320,568,20,16]])for(const expanded of [false,true]){
  const chrome=layoutMapChrome({W,H,top,bottom},{expanded,copy:mapHeaderCopy(8),chapterTitle:'第9关 · 街亭',threat:chapterThreats(8),reward:'首胜可得 · 连环弩',rewards:expanded?'收服 赵云 · 寻访 貂蝉 · 盟约 孙权':'',region:'荆楚东行 · 江岸',replay:null},measure);
  assert.ok(chrome.height>=120);
  assert.ok(chrome.back.y>=top&&chrome.back.h>=48&&chrome.current.h>=48&&chrome.depart.h>=48);
  assert.ok(chrome.depart.y+chrome.depart.h<=H-bottom);
  assert.ok(!overlaps(chrome.title,chrome.back)&&!overlaps(chrome.title,chrome.current));
  assert.ok(!overlaps(chrome.progress,chrome.back)&&!overlaps(chrome.hint,chrome.current));
  assert.ok(!overlaps(chrome.drawerTitle,chrome.detail));
  assert.ok(!overlaps(chrome.threat,chrome.detail)&&!overlaps(chrome.reward,chrome.detail));
  assert.ok(!overlaps(chrome.drawer,chrome.depart));
  assert.equal(chrome.progress.text,'已克 8/20');
  const open=layoutMapChrome({W,H,top,bottom},{expanded:true,copy:mapHeaderCopy(20),chapterTitle:'第20关 · 洛阳',threat:'终局三段',reward:'已得 · 古锭刀',rewards:'收服 赵云',region:'西关归一 · 山关',replay:'重游 · 常规'},measure);
  assert.equal(open.step,layoutMapChrome({W,H,top,bottom},{expanded:false,copy:mapHeaderCopy(20),chapterTitle:'第20关 · 洛阳',threat:'终局三段',reward:'已得 · 古锭刀',rewards:'收服 赵云',region:'西关归一 · 山关',replay:'重游 · 常规'},measure).step);
  if(open.replay)assert.ok(!overlaps(open.replay,open.depart));
 }
 assert.equal(chapterThreats(0),'正负门，留意预警');
 assert.equal(mapHeaderCopy(20).hint,'里程碑已齐');
});

test('prepare summary and collection pager keep copy off neighboring controls',()=>{
 for(const [W,H] of [[360,640],[390,844]]){
  const h=host(8);Object.defineProperty(h.g,'size',{value:{W,H,top:20,bottom:16,k:1},configurable:true});
  h.g.tab='weapons';h.g.show('prepare');
  const lineup=h.g.hits.find((x:any)=>x.id==='view-lineup');
  assert.ok(lineup.w>=44&&lineup.h>=44);
  for(const record of h.ui.textRecords)if(record.text.includes('永久 Lv.')||record.text.includes('典籍')||record.text.includes('器物'))assert.ok(!overlaps(record.bounds,lineup),record.text);
  assert.ok(h.ui.textRecords.some((x:any)=>x.text.includes('永久 Lv.')));
  assert.ok(h.ui.textRecords.some((x:any)=>/典籍|器物|坐骑/.test(x.text)));
  h.g.show('collection');
  const prev=h.g.hits.find((x:any)=>x.id==='prev-page'),next=h.g.hits.find((x:any)=>x.id==='next-page');
  const page=h.ui.textRecords.find((x:any)=>/^\d+ \/ \d+$/.test(x.text));
  assert.ok(page);assert.ok(!overlaps(page.bounds,prev)&&!overlaps(page.bounds,next));
  for(const hit of h.g.hits)assert.ok(hit.y>=20&&hit.y+hit.h<=H-16&&hit.w>=44&&hit.h>=44,hit.id);
 }
});
