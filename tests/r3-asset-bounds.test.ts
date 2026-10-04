import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {R3_ART} from '../assets/scripts/formal/R3Art';
test('every R3 source rectangle fits the actual exported PNG, including nondivisible final rows',()=>{
 let n=0;for(const [key,f] of Object.entries(R3_ART.frames) as any[]){const file='assets/resources/'+R3_ART.sheets[f.s]+'.png',png=fs.readFileSync(file);assert.equal(png.subarray(1,4).toString(),'PNG');const W=png.readUInt32BE(16),H=png.readUInt32BE(20),[x,y,w,h]=f.r;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=W&&y+h<=H,key+': '+JSON.stringify({rect:f.r,texture:[W,H]}));n++;}assert.ok(n>=238);
});
