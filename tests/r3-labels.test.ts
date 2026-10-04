import test from 'node:test';
import assert from 'node:assert/strict';
import {crateLabelPlan} from '../assets/scripts/formal/CombatLabels';
const measure=(s:string,n:number)=>[...s].length*n;
test('distant pickup is compact, contents remain readable in the choice window',()=>{
 const far=crateLabelPlan('粮车','挑战 · 援兵 +6',26,measure);
 const near=crateLabelPlan('粮车','挑战 · 援兵 +6',10,measure);
 assert.equal(far.detailed,false);assert.equal(far.h,26);
 assert.equal(near.detailed,true);assert.equal(near.lines.join(''),'挑战 · 援兵 +6');
 assert.ok(near.h>far.h);
});
test('long pickup names wrap instead of clipping or dropping their reward',()=>{
 const name='挑战路线获得诸葛连弩并保留现有阶位';
 const p=crateLabelPlan('兵器匣',name,4,measure);
 assert.equal(p.lines.join(''),name);assert.ok(p.lines.length>1);
 for(const s of p.lines)assert.ok(measure(s,12)<=p.w-16);
});
