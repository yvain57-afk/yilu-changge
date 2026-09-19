import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Journey,STEP,Level} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {Book,KEY} from '../assets/scripts/core/save';
const empty=(over:Partial<Level>={}):Level=>({...LEVELS[0],rows:[],obstacles:[],duration:1000,...over});
function step(g:Journey,n:number){for(let i=0;i<n;i++) {g.advance(STEP);g.drainFeedback();}}
function bot(g:Journey){
 if(g.phase==='boss')g.move(g.bossWarning?(g.bossWarning.x<=0?.72:-.72):0);
 else {
  let x=-.48;
  const row=g.level.rows.find(r=>!g.usedRows.has(r.id)&&r.at-g.z<3.5);
  if(row)x=row.left.kind==='double'||row.left.value>g.count?-.48:.48;
  const danger=g.obstacles.find(o=>!o.dead&&!o.resolved&&o.at-g.z<2.8&&o.at-g.z>0&&Math.abs(o.x-x)<o.width);
  if(danger&&(danger.kind!=='wood'||danger.hp>g.damage*4*(danger.at-g.z-.3)))x=-danger.x;
  g.move(x);
 }
 g.advance(STEP);g.drainFeedback();
}
test('R01 首关8兵、人数上下界及真实火力不被48截断',()=>{const g=new Journey(LEVELS[0]);assert.equal(g.count,8);g.count=200;g.choose({id:8,at:0,left:{kind:'double',value:2},right:{kind:'double',value:2}});assert.equal(g.count,256);assert.equal(g.visibleCount,48);assert.equal(g.damage,51.2);g.hurt(999,'边界损失');assert.equal(g.phase,'lost');assert.equal(g.count,0);});
test('R02 同排中心选择一次，极速横移不重复加兵',()=>{const g=new Journey(LEVELS[0]);const r=g.level.rows[0];g.x=-.1;g.choose(r);assert.equal(g.count,20);for(let i=0;i<100;i++){g.x=i%2?-.9:.9;g.choose(r)}assert.equal(g.count,20);assert.equal(g.usedRows.size,1);});
test('R02 穿门步只结算一次，左右每排互斥、射击不改门值',()=>{const g=new Journey(empty({rows:[LEVELS[0].rows[0]]}));const original=JSON.stringify(g.level.rows);g.move(-.8);step(g,7*60);assert.equal(g.count,20);g.move(.8);step(g,2*60);assert.equal(g.count,20);assert.equal(JSON.stringify(g.level.rows),original);});
test('R03 射击位置真实决定清障、人数增多火力更大',()=>{const o={id:1,at:4,x:.5,width:.25,kind:'wood' as const,hp:50,loss:12};const hit=new Journey(empty({obstacles:[o]}));hit.move(.5);step(hit,90);const miss=new Journey(empty({obstacles:[o]}));miss.move(-.5);step(miss,90);assert.ok(hit.obstacles[0].hp<50);assert.equal(miss.obstacles[0].hp,50);const many=new Journey(empty({obstacles:[o]}));many.count=80;many.move(.5);step(many,90);assert.ok(many.obstacles[0].dead);});
test('R03 地形不可射毁，接触损失及失败原因',()=>{const g=new Journey(empty({obstacles:[{id:1,at:4,x:0,width:.3,kind:'rock',hp:1,loss:10}]}));step(g,5*60);assert.equal(g.obstacles[0].hp,1);assert.equal(g.phase,'lost');assert.match(g.cause,/山石/);});
test('R04 墨影有至少1秒预告，避开不损兵',()=>{const g=new Journey(empty({obstacles:[{id:1,at:4,x:0,width:.3,kind:'ink',hp:1,loss:8}]}));step(g,122);assert.ok(g.obstacles[0].warn!>1);assert.equal(g.count,8);g.move(.8);step(g,90);assert.equal(g.count,8);});
test('R05 守关停止前进、低兵力不超时判负、击破才胜',()=>{const g=new Journey(empty({duration:1,bossHP:100000,bossLoss:0}));g.count=1;step(g,60*600);assert.equal(g.phase,'boss');assert.equal(g.z,1);assert.ok(g.bossHP>0);g.bossHP=.1;step(g,60);assert.equal(g.phase,'won');});
for(const level of LEVELS){test(`R06 ${level.title}真实规则有可通路线`,()=>{const g=new Journey(level);for(let i=0;i<60*240&&!g.finished;i++)bot(g);assert.equal(g.phase,'won');assert.ok(g.count>0);assert.ok(g.elapsed>=level.duration);});test(`R06 ${level.title}损兵为0即失败、无重开费用`,()=>{const g=new Journey(level);g.move(0);for(let i=0;i<60*240&&!g.finished;i++) {if(g.phase==='boss')g.move(.9);g.advance(STEP);g.drainFeedback();}assert.equal(g.phase,'lost');assert.ok(g.cause.length>0);assert.equal(new Journey(level).count,8);});}
test('R07 暂停冻结，显式继续才恢复',()=>{const g=new Journey(LEVELS[0]);step(g,120);g.pause();const z=g.z;step(g,120);assert.equal(g.z,z);g.resume();step(g,60);assert.ok(g.z>z);});
test('R08 坏档回默认并告知、存储异常仍可游玩',()=>{const bad=new Book({getItem:()=>'{oops',setItem:()=>{}});assert.equal(bad.data.cleared[0],false);assert.match(bad.notice,/默认/);const fail=new Book({getItem:()=>null,setItem:()=>{throw Error('quota')}});fail.win(0,8);assert.ok(fail.unlock(1));assert.match(fail.notice,/仍可游玩/);});
test('R08 只保存允许字段、失败不丢线索、成绩和设置可恢复',()=>{let raw:string|null=null;const storage={getItem:()=>raw,setItem:(k:string,v:string)=>{assert.equal(k,KEY);raw=v}};const b=new Book(storage);b.clue(0);b.win(0,23);b.data.settings.music=false;b.persist();const b2=new Book(storage);assert.equal(b2.data.clues[0],true);assert.equal(b2.data.best[0],23);assert.equal(b2.data.settings.music,false);assert.deepEqual(Object.keys(JSON.parse(raw!)).sort(),['best','cleared','clues','settings']);});
test('R09 仅三关，立即解锁不依赖阅读；100–180字线索',()=>{const b=new Book({getItem:()=>null,setItem:()=>{}});assert.equal(LEVELS.length,3);assert.equal(b.unlock(1),false);b.win(0,8);assert.equal(b.unlock(1),true);for(const l of LEVELS){assert.ok(l.intro.length<=2);assert.ok(l.clue.length>=100&&l.clue.length<=180,`${l.title}: ${l.clue.length}`)}});
test('R11 模型10局无永久对象累积',()=>{const results=[];for(let run=0;run<10;run++){const g=new Journey(LEVELS[run%3]);let max=0;for(let i=0;i<14400&&!g.finished;i++){bot(g);max=Math.max(max,g.arrows.length);assert.ok(g.visibleCount<=48);}assert.equal(g.phase,'won');assert.equal(g.arrows.length,0);assert.equal(g.feedback.length,0);assert.ok(max<35);results.push({run,seconds:Math.round(g.elapsed*100)/100,count:g.count,maxArrows:max});}console.log(JSON.stringify({modelRuns:results}));});
