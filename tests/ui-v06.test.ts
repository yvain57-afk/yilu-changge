import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uiLayout,preparationLayout,WindowMetrics} from '../assets/scripts/ui/UiLayout';
const fixtureData=JSON.parse(readFileSync(new URL('../docs/ui-design/source-brief/design-data/viewport-fixtures.json',import.meta.url),'utf8'));
const expected={ 'island-and-capsule':[107,794], 'short-screen-with-host':[70,608], 'short-web':[8,624], 'user-image-aspect-synthetic':[110,799], 'narrow-long-host':[84,760] };
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const fixture of fixtureData.fixtures){
 const m:WindowMetrics={width:fixture.width,height:fixture.height,safe:fixture.safeArea,capsule:fixture.capsule,source:'synthetic',safeSource:'synthetic',capsuleSource:'synthetic',revision:0};
 const designWidth=720,designHeight=fixture.height*720/fixture.width,a=uiLayout(m,designWidth,designHeight);
 test(`UI v06 ${fixture.id}: host exclusion is maximum, never doubled padding`,()=>{
  assert.deepEqual([a.T,a.B],expected[fixture.id as keyof typeof expected]);assert.equal(a.L,20);assert.equal(a.R,fixture.width-20);
  const header=a.rect(a.L,a.T,a.R-a.L,48),footer=a.rect(a.L,a.B-48,a.R-a.L,48);
  const top=fixture.height/2-(header.y+header.h/2)/a.k,bottom=fixture.height/2-(footer.y-footer.h/2)/a.k;
  close(top,a.T);close(bottom,a.B);assert.ok(top>=fixture.safeArea.top+8);if(fixture.capsule)assert.ok(top>=fixture.capsule.bottom+8);assert.ok(bottom<=fixture.safeArea.bottom-16);
 });
 test(`UI v06 ${fixture.id}: 48 logical hit stays 48 at both safe edges and maps back`,()=>{
  for(const [x,y] of [[a.L,a.T],[a.R-48,a.B-48]]){
   const r=a.rect(x,y,48,48);close(r.w/a.k,48);close(r.h/a.k,48);
   // The four visible corners and the hit rectangle share exactly the same transform.
   for(const [lx,ly] of [[x,y],[x+48,y],[x,y+48],[x+48,y+48]]){
    const p=a.point(lx,ly);assert.ok(Math.abs(p.x-r.x)<=r.w/2+1e-7);assert.ok(Math.abs(p.y-r.y)<=r.h/2+1e-7);
    close(p.x/a.k+fixture.width/2,lx);close(fixture.height/2-p.y/a.k,ly);
   }
  }
  close(a.point(0,0).x,-360);close(a.point(fixture.width,fixture.height).x,360);close(a.point(0,0).y,designHeight/2);close(a.point(fixture.width,fixture.height).y,-designHeight/2);
 });
}
test('UI v06 uses real horizontal safe edges and ignores capsule above safe top',()=>{
 const a=uiLayout({width:390,height:844,safe:{left:12,top:99,right:378,bottom:810},capsule:{left:280,top:40,right:370,bottom:72},source:'synthetic',safeSource:'synthetic',capsuleSource:'synthetic',revision:1},720,844*720/390);
 assert.deepEqual([a.L,a.R,a.T,a.B],[32,358,107,794]);
});

for(const f of fixtureData.fixtures)test(`v081 preparation regions stay separate: ${f.id}`,()=>{
 const a=uiLayout({width:f.width,height:f.height,safe:f.safeArea,capsule:f.capsule,source:'fixture',safeSource:'fixture',capsuleSource:'fixture',revision:0},720,f.height*720/f.width),p=preparationLayout(a);
 assert.ok(p.header.top+p.header.height<p.portrait.top);assert.ok(p.portrait.height>=110);assert.ok(p.portrait.bottom<p.controls);assert.ok(p.controls+208<p.footer);assert.equal(p.footer+56,a.B);
});
