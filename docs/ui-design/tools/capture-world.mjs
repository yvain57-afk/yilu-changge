import {open} from '../../../tools/browser-v03-common.mjs';
import {writeFileSync} from 'node:fs';
const root='docs/ui-design',t=await open('ui-design-world',390,844,{version:'v051-rc1'}),report={version:'7ee7685 / v051-rc1',kind:'synthetic static design backgrounds, not campaign acceptance',worldProjection:'original 720 FIXED_WIDTH; no battle transform or actor scale changes',captures:[]};
try{
 await t.p.evaluate(async()=>{const {director}=await System.import('cc');const find=n=>n.getComponent('Game')||n.children.map(find).find(Boolean);const g=find(director.getScene());globalThis.g=g;g.enabled=false;for(let i=0;i<3;i++)g.platform.book.win(i,48);g.platform.growth.reconcile();g.platform.stopEffects();});
 for(const [w,h] of [[390,844],[360,640],[390,849],[360,800]]){
  await t.p.setViewportSize({width:w,height:h});await t.p.waitForTimeout(100);
  for(const state of ['home','run','boss','awaken']){
   const info=await t.p.evaluate(async({w,h,state})=>{const {Graphics}=await System.import('cc');const g=globalThis.g;g.ui.active=false;
    if(state==='home'){g.battle.begin();g.battle.ground(0,0,42,false);g.battle.use('home-design-hero');g.battle.hero('home-design',0,-70,310,0,'idle',1,10,undefined,'spear');}
    else{g.platform.growth.equipWeapon(state==='run'?'spear':'blade');g.platform.growth.equipCompanion(state==='awaken'?'zhao_yun_guest':'xing_daorong');g.begin(1);g.enabled=false;g.ui.active=false;const j=g.journey;j.x=j.target=state==='run'?.55:0;j.count=state==='run'?24:state==='boss'?48:256;j.tier=state==='run'?1:3;j.elapsed=state==='run'?5.4:60;j.z=state==='run'?j.level.duration*.1:j.level.duration;
     if(state!=='run'){j.phase='boss';j.bossTicks=180;j.bossDepth=j.bossPrevDepth=.75;j.bossHP=1361;if(state==='awaken'){j.awakeningUsed=true;j.awakeningRemaining=4.2;}}
     g.battle.render(j,1);for(const [id,n]of g.battle.layers){if(id==='boss'||id.startsWith('obstacle')){const gfx=n.getComponent(Graphics);if(gfx)gfx.clear();}} // UI health bars removed; actor sprites retain original transform.
    }
    for(const [id,n]of g.battle.labels)if(!id.startsWith('g'))n.active=false;
    const k=w/720, bounds=g.battle.art.bounds.map(b=>({id:b.id,left:b.left*k,top:h-b.top*k,right:b.right*k,bottom:h-b.bottom*k}));
    const j=g.journey;return{width:w,height:h,state,bounds,worldPosition:{x:g.world.position.x,y:g.world.position.y},worldScale:{x:g.world.scale.x,y:g.world.scale.y},obstacles:state==='run'?j.obstacles.filter(o=>!o.dead&&o.at-j.z>=0&&o.at-j.z<7).map(o=>({...o,depth:o.at-j.z,elite:j.level.eliteIds?.includes(o.id)})):[],snapshot:state==='home'?null:{level:j.level.id,count:j.count,x:j.x,z:j.z,weapon:j.weapon,tier:j.tier,bossHP:j.bossHP}};
   },{w,h,state});
   await t.p.waitForTimeout(70);await t.p.screenshot({path:`${root}/assets/world-${state}-${w}x${h}.png`});report.captures.push(info);
  }
 }
 report.errors=t.errors;writeFileSync(root+'/specs/world-captures.json',JSON.stringify(report,null,2));console.log(JSON.stringify({captures:report.captures.length,errors:t.errors}));
}finally{await t.c.close();}
