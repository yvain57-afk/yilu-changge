import {open,E} from './browser.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const cases=[['U01','home'],['U01-new','new'],['U01-complete','complete'],['U02','map'],['U03','prepare:weapons'],['U03-support','prepare:support'],['U03-treasures','prepare:treasures'],['U04','collection:people'],['U04-weapons','collection:weapons'],['U05','person:zhao'],['U05-unknown','person:lukang'],['U06','item:liannu'],['U06-treasure','item:yuxi'],['U07','result'],['U08','reward:0'],['U09-upper','milestone:9'],['U09-final','milestone:19'],['U10','defeat'],['U11','pause'],['U12','settings'],['U13-migration','migration'],['U13-save','save-error'],['U13-resource','error']];
const prior=fs.existsSync(E+'/page-matrix.json')?JSON.parse(fs.readFileSync(E+'/page-matrix.json')).results:[],expected=JSON.parse(fs.readFileSync(E+'/web-final-manifest.json')).code_fingerprint;const results=[],t=await open('matrix');try{
 for(const [width,height] of [[375,667],[402,874],[360,640],[430,932]]){await t.p.setViewportSize({width,height});t.width=width;t.height=height;
  for(const [id,fixture] of cases){const kept=prior.find(r=>r.id===id&&r.width===width&&r.height===height&&r.build.code_fingerprint===expected);if(kept){results.push(kept);console.log(id,width,'reused same final build');continue;}await t.goto(fixture);await t.p.waitForTimeout(700);let s=await t.capture(`${id}-${width}x${height}`);
   const failures=[];for(const b of s.buttons){if(b.x<0||b.y<0||b.x+b.w>width+.2||b.y+b.h>height+.2)failures.push('outside '+b.id);if(b.w<48||b.h<48)failures.push('small '+b.id);}if(s.missingArt.length||s.renderErrors.length)failures.push('render errors');
   if(s.ui.maxScroll>0){await t.command('scroll',s.ui.maxScroll);s=await t.capture(`${id}-bottom-${width}x${height}`);}
   results.push({id,fixture,width,height,screen:s.screen,data_bound:true,interaction:'captured actual hit regions; page interactions in flow/video and model regression',small_screen_errors:failures,build:s.build,scope:s.verificationScope});console.log(id,width,failures.length?'FAIL '+failures.join(','):'ok');
  }
 }
 assert.deepEqual(results.flatMap(x=>x.small_screen_errors),[]);assert.deepEqual(t.errors,[]);
}finally{fs.writeFileSync(E+'/page-matrix.json',JSON.stringify({results,pageErrors:t.errors},null,2));await t.close();}
