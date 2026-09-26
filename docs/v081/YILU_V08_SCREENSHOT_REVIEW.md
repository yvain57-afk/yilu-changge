# 《一路长歌》v0.8：四张手机截图与源码核对

## 核对范围

本记录依据本轮上传的四张手机截图、`发给GPT_当前版本核验说明(1).md`、完整开发ZIP、核验补充ZIP、包内最新评审文档和原始参考分析。
读取了 `Game.ts`、`BattleView.ts`、`runner.ts`、`runnerConfig.ts`、`levels.ts`、相关存档与UI模块及相关测试内容。查看了包内连续录像54、58、62、85.5秒的关键帧，未把这些抽帧称为全片观看或本轮亲自试玩。未修改源码，未重新构建、未重跑完整三关、未进行微信真机验收。

开发包SHA256重新计算为 `a55a0c8b3a2a7126621dbcf07cde236ff036c04a8f8697173071d653e53f7f5b`，与核验说明一致。补充材料所列9项关键源码/配置与2项主构建文件，共11项指纹均重新计算一致。这确认本次读到的是所述交付包，不等于所有机制已经独立验收通过。

用户截图按消息顺序编号：
1. `IMG_4115(1).PNG`：行军整备。
2. `IMG_4116(1).PNG`：第一关＋4门与同袍＋6奖励箱。
3. `IMG_4117(1).PNG`：第二关连续＋1门与敌军贴近。
4. `IMG_4118(1).PNG`：第二关重玩胜利。

第三张截图的系统临时通知不属于游戏界面，未复制其个人内容。本记录不把临时系统通知覆盖等同于刘海/胶囊避让失效。

## 1. 已确认：胜利页同时绘制两套主角

截图4可见大小不同的主角、两套兵器与影子叠放。

代码调用链：`Game.show('result')`先执行通用非战斗分支的 `battle.render(null, ...)`；该方法在World里绘制310设计单位的首页主角。随后结果分支另建 `promotion-hero`，通过独立BattleView绘制170单位结果肖像。两个BattleView拥有不同父节点，两套人物同时保留。`clear()`目前只清效果/齐射数据，并不隐藏World角色Sprite。

这是确定的渲染集成缺陷，不需要用进一步加特效掩盖。

最小修复：结果页使用背景专用渲染，关闭World中的首页主角层，只让一个结果肖像负责角色；返回页面时按该页面状态恢复。不要只把多余人物调透明。检查首次胜利、重复胜利和失败页。


### 源码：`assets/scripts/Game.ts`，L105–L106

```text
105:  private show(screen:Screen){this.screen=screen;this.uiRevision=this.platform.windowMetrics.revision;this.promotionView=null;this.promotionTime=0;this.touchCancel();for(const n of [...this.ui.children]){n.removeFromParent();n.destroy();}this.hits=[];const l=LEVELS[this.level],b=this.platform.book,edge=Math.max(0,(view.getVisibleSize().height-1280)/2);
106:   if(screen!=='battle'&&screen!=='pause'&&screen!=='settings'&&screen!=='preview')this.battle.render(null,rankStage(b),0,this.platform.growth.data.equippedWeapon);
```


### 源码：`assets/scripts/Game.ts`，L126–L133

```text
126:   }else if(screen==='result'){
127:    const j=this.journey!,won=j.phase==='won',last=this.level===PLAYABLE_LEVELS-1,a=this.layout,w=a.R-a.L;
128:    const title=!won?'胜败乃兵家常事':!this.firstVictory?'再次取胜':last?'白石初定':`晋升${l.rankAfter}`;
129:    this.logicalText('title',title,a.L,a.T,w,35,25,INK);this.logicalText('ending',won?l.ending:this.level===2&&j.z===j.level.duration?j.cause.replace('弩箭','羽箭'):j.cause,a.L,a.T+39,w,46,14,INK);
130:    this.logicalText('identity',won?(this.firstVictory?`${l.rankBefore} → ${l.rankAfter} · ${b.notice?'本次战绩已记录':'进度已保存'}`:`当前身份：${CAMPAIGN.rankLabels[rankStage(b)]} · ${b.notice?'本次战绩已记录':'战绩已保存'}`):`当前身份：${CAMPAIGN.rankLabels[rankStage(b)]} · 本关免费重开`,a.L,a.T+89,w,28,13,INK);
131:    if(won){const portrait=this.make('promotion-hero',this.ui),p=a.point(a.width/2,(a.T+120+a.B-238)/2-30);portrait.setPosition(p.x,p.y);this.promotionView=new BattleView(portrait);this.promotionView.portrait(rankStage(b),0,this.level,this.platform.growth.data.equippedWeapon);}
132:    this.logicalText('stats',`剩余兵力：${j.count}  /  最佳：${(j.runner?b.runnerBest[l.id]??0:b.data.best[l.id])} 人\n用时：${j.elapsed.toFixed(1)} 秒`,a.L,a.B-235,w,38,13,INK);
133:    if(won&&this.newUnlocks.length)this.logicalText('new-unlocks','获得：'+this.newUnlocks.join(' · '),a.L,a.B-193,w,27,12,INK);
```


### 源码：`assets/scripts/BattleView.ts`，L116–L117

```text
116:  render(j:Journey|null,rank:RankStage=0,finishAge=0,equipped:WeaponId='spear'){this.begin();this.currentRank=rank;this.currentScene=j?Math.max(0,Number(j.level.id.slice(-2))-1):rank===3?2:rank===2?1:0;this.ground(j?.z||0,this.currentScene,j?j.level.duration:6,j?.phase==='won'||!j&&rank>0);if(!j){this.use('hero-home');this.hero('home',0,-70,310,0,'idle',rank,10,undefined,equipped);return;}
117:   this.effects.advance(j.elapsed);if(j.runner){this.runnerBattle(j,rank);return;}if(j.horde)this.branchGround(j);this.use('danger-ground');
```


### 源码：`assets/scripts/BattleView.ts`，L270–L270

```text
270:  portrait(rank:RankStage,time=1.5,level=0,equipped:WeaponId='spear'){this.begin();this.use('portrait');if(level>0)this.sprite('victory-place',level===2?'cityOpen':'campOpen',0,5,.58,0,140);this.sprite('victory-flag','blueFlag',-145,Math.min(time/.7,1)*30-45,.42);this.hero('victory-hero',0,-55,170,time,'idle',rank,10,undefined,equipped);}
```


### 源码：`assets/scripts/BattleView.ts`，L285–L285

```text
285:  clear(){this.effects.clear();this.volleys.clear();}
```


## 2. 已确认：整备文字和营地场景没有分配独立布局区域

截图1中“行军整备”和说明文字压在城楼屋顶/门洞上，深色字失去对比。上方城楼、下方城与地图、旗帜、人物和整排按钮同时争夺画面。这里不仅是z序：文字在场景上层仍可因同色与纹理背景而难以辨认。

代码中UI跟随逻辑安全区布局；`BattleView.camp()`仍用固定世界坐标，同时通过`ground()`绘制目的地，再画驻地建筑。两者没有共享内容区。整备页每帧仍调用这套camp场景。

此外，副标题“选好兵器与兵法，再踏征途”仍提兵法，但默认runner整备只有武器/同袍选择。这是旧玩法文案遗留，不能让玩家寻找已经退出当期玩法的选项。

最小修复：整备页明确标题区、人物展示区、武器与同袍选择区、返回区；背景只保留一套有节制的营地布景。内容放在有对比的底衬上，地图仅在需要看驻地关系的页面展示。更新当前模式副标题，不恢复兵法系统。


### 源码：`assets/scripts/Game.ts`，L144–L150

```text
144:   }else if(screen==='loadout'){
145:    const a=this.layout;this.logicalText('title','行军整备',a.L,a.T,a.R-a.L,52,29,INK);this.logicalText('context','选好兵器与兵法，再踏征途。',a.L,a.T+58,a.R-a.L,32,14,INK);this.loadout(170);this.logicalButton('home','返回出征',a.L,a.B-56,a.R-a.L,56,()=>this.show('home'),true);
146:   }else if(screen==='camp'){
147:    const a=this.layout;this.logicalText('title',CAMPAIGN.camp.title,a.L,a.T,a.R-a.L,52,29,INK);this.logicalText('status',CAMPAIGN.camp.status,a.L,a.T+58,a.R-a.L,44,14,INK);this.loadout(170);this.logicalButton('chapters',CAMPAIGN.home.replay,a.L,a.B-116,a.R-a.L,56,()=>this.show('chapters'),true);this.logicalButton('settings','设置',a.L,a.B-48,a.R-a.L,44,()=>{this.returnScreen='camp';this.show('settings')});
148:   }else if(screen==='meeting'){
149:    const e=CAMPAIGN.encounters[0],a=this.layout,w=a.R-a.L;this.logicalText('title',e.name,a.L,a.T,w,40,25,INK);this.logicalText('dialogue',e.lines.map(l=>l.speaker+'：'+l.line).join('\n\n'),a.L,a.T+48,w,125,14,INK);
150:    this.logicalText('ending','与赵云并肩一战',a.L,a.B-100,w,32,18,INK);this.logicalButton('return-camp',e.primaryAction,a.L,a.B-56,w,56,()=>{this.platform.campaign.meet();this.show('camp');},true);
```


### 源码：`assets/scripts/Game.ts`，L160–L165

```text
160:  private loadout(y:number){const g=this.platform.growth,a=this.layout;
161:   const top=this.screen==='transition'?a.T+124:a.T+130,w=(a.R-a.L-8)/2;
162:   g.data.unlockedWeapons.forEach((id,i)=>this.logicalButton('weapon-'+id,(g.data.equippedWeapon===id?'✓ ':'')+WEAPONS[id].label,a.L+i*(w+8),top,w,44,()=>{g.equipWeapon(id);this.show(this.screen);}));
163:   this.logicalText('tactic-description','兵器与同袍保留 · 本局火力由途中补给获得',a.L,top+59,a.R-a.L,43,12,INK);
164:   const n=g.data.unlockedCompanions.length,cw=(a.R-a.L-Math.max(0,n-1)*8)/Math.max(1,n);
165:   g.data.unlockedCompanions.forEach((id,i)=>this.logicalButton('companion-'+id,(g.data.equippedCompanion===id?'✓ ':'')+CAST[id].name,a.L+i*(cw+8),top+132,cw,44,()=>{g.equipCompanion(id);this.show(this.screen);}));
```


### 源码：`assets/scripts/Game.ts`，L174–L177

```text
174:   if(this.screen==='transition'||this.screen==='camp'||this.screen==='meeting'||this.screen==='loadout'){
175:    if(!this.platform.hidden&&!this.campPaused)this.transitionAge+=dt;
176:    const stage=this.screen==='transition'?this.level:this.screen==='loadout'?Math.max(0,Math.min(2,rankStage(this.platform.book)-1)):2;
177:    this.battle.camp(stage,this.screen!=='transition'||this.transitionDone,this.transitionAge,this.flagDrag,this.screen==='meeting',this.platform.growth.data.equippedWeapon);
```


### 源码：`assets/scripts/BattleView.ts`，L271–L280

```text
271:  camp(stage:number,settled:boolean,time:number,flag?:{x:number;y:number},meeting=false,equipped:WeaponId='spear'){
272:   this.begin();this.currentScene=stage;this.ground([42,54,66][stage],stage,[42,54,66][stage],true);
273:   this.use('camp-scene');if(meeting){this.sprite('zhaoyun','zhaoyun',0,-305,.35);return;}if(stage===1){this.sprite('secured-gate','campOpen',0,-110,.45);this.line(0,-170,0,30,'#756044',5);}if(stage===2)this.sprite('secured-city','cityOpen',0,-100,.4);this.ellipse(0,-235,190,85,'#c1b78e');
274:   if(stage===1){this.sprite('camp-tent','tent',-225,-110,.38);this.sprite('camp-rack','wood',200,-115,.26);}
275:   if(stage===2){this.rect(-245,-260,490,260,'#c7b58a');for(const [i,name] of ['曹操','刘备','孙权'].entries()){const x=-170+i*170;this.line(0,-220,x,-30,'#8f8e6d',5);this.text('map'+i,name,x,-10,23);this.sprite('direction'+i,i===1?'blueFlag':'redFlag',x,-50,.12,0,150);}this.text('baishi','白石',0,-265,25);}
276:   else {this.line(-100,-180,100,-180,'#a18f60',5);this.text('target','立旗处',0,-205,25);}
277:   const count=stage===0?12:16;
278:   for(let i=0;i<count;i++){const row=Math.floor(i/8),col=i%8,q=settled?1:Math.min(1,time*.8),x=(col-3.5)*45+(1-q)*(i%2?55:-55),y=-365-row*45;
279:    this.archer('camp-soldier'+i,x,y,64,time,3,10,!settled&&time<1.2,i);}
280:   this.hero('camp-hero',-200,-240,108,time,'idle',Math.min(stage+1,2) as RankStage,10,undefined,equipped);
```


## 3. 已确认：重复胜利仍说“陈应加入”

截图4顶部为“再次取胜”，身份已经是白石驻将，结束句仍说“陈应加入，可在营中安排随军”。结果标题已经分首次与重玩；结果正文仍无条件采用`l.ending`。`levels.ts`又把旧故事结束句映射给默认runner关卡。

证据目前支持“重复招募文案错误”，不支持“存档又发了一个陈应”。新增解锁列表由另一处差集计算，二者应当区分。

最小修复：通关概述与本次新增奖励分开。重玩第二关显示“粮营已清”或“再次夺回粮营”，新伙伴仅在newUnlocks确有新增时显示。保持永久奖励幂等。新模式best与旧best分栏保存，截图的最佳7本身不是旧存档丢失的证据。


### 源码：`assets/scripts/core/levels.ts`，L543–L544

```text
543: import { CAMPAIGN } from './campaignData';
544: LEGACY_LEVELS.forEach((l,i)=>{const c=CAMPAIGN.levels[i];l.title=c.title;l.scene=c.location;l.bossName=c.bossName;l.rankBefore=CAMPAIGN.rankLabels[i];l.rankAfter=CAMPAIGN.rankLabels[i+1];l.opening=c.opening.map(v=>v.speaker+'：'+v.line).join('\n');l.ending=c.ending;});
```


### 源码：`assets/scripts/Game.ts`，L198–L198

```text
198:    if(j.finished){if(this.finishAge===0){this.platform.stopEffects();if(j.phase==='won'){this.firstVictory=!this.platform.book.data.cleared[j.level.id];this.platform.book.win(this.level,j.count,j.level.profile);const oldWeapons=[...this.platform.growth.data.unlockedWeapons],oldCompanions=[...this.platform.growth.data.unlockedCompanions];this.platform.growth.reconcile();this.newUnlocks=[...this.platform.growth.data.unlockedWeapons.filter(id=>oldWeapons.indexOf(id)<0).map(id=>WEAPONS[id].label),...this.platform.growth.data.unlockedCompanions.filter(id=>oldCompanions.indexOf(id)<0).map(id=>CAST[id].name+(id==='zhao_yun_guest'?'同行助阵':'随军'))];}}this.finishAge+=dt;if(j.phase==='won'&&this.finishAge<.7)return;this.battle.clear();if(j.phase==='won')this.platform.sound('gather');this.show('result');}
```


## 4. 已确认画面拥挤；接触扣血是否错误仍待局部核对

截图2主将与赵云挤在普通兵前排；截图3敌群在我军侧前方堆成连片，攻击者/受击者关系不清。54/58/62秒的包内关键帧也显示接近后混在一起。

源码线索：runnerFormation把主将、队友与普通兵按相同网格依次摆入，间距0.135世界横向单位；渲染时主将/队友/士兵高度分别92/82/66设计单位乘透视比例。大轮廓没有专门的占位空间。敌兵近身被钳到队伍前方至少0.09深度，再追逐最近的成员横向位置；这段函数没有敌兵之间的分离步骤，容易在接触前沿排挤堆叠。

最小方向：保留“未清掉的敌人接近并产生损耗”的参考玩法，整理前排特殊角色占位与敌我接触前沿，增加与真实伤害事件同步的受击反馈。成员实际位置、发射位置、碰撞位置需要一起更新；不能仅把渲染人物挪开，留下隐形碰撞。不要用删除活敌、自动清怪或改变伤害逃避问题。

尚未确认：单次截图无法判断是否有漏伤、重复扣兵或穿模无伤。本次没有重新跑接触控制实验，不将视觉重叠直接等同于伤害算法错误。


### 源码：`assets/scripts/core/runner.ts`，L22–L30

```text
22: export function runnerFormation(count:number,x:number,z:number,companion=false):Member[]{
23:  const visible=Math.min(48,Math.max(0,count));if(!visible)return [];
24:  const special=companion&&visible>1?2:1,n=visible-special,mass=count-special;
25:  const columns=Math.min(7,Math.max(1,Math.ceil(Math.sqrt(visible)))),spacing=.135;
26:  return Array.from({length:visible},(_,i)=>{
27:   const row=Math.floor(i/columns),col=i%columns,cols=Math.min(columns,visible-row*columns);
28:   const center=clamp(x,-1.16+(cols-1)*spacing/2,1.16-(cols-1)*spacing/2);
29:   return {id:i,x:center+(col-(cols-1)/2)*spacing,z:z-row*.22,radius:.025,weight:i<special?1:Math.floor(mass/n)+(i-special<mass%n?1:0),role:i===0?'hero':i===1&&companion?'companion':'soldier'};
30:  });
```


### 源码：`assets/scripts/core/runner.ts`，L105–L109

```text
105:  private moveEnemies(){const j=this.host;for(const e of this.enemies){if(e.dead)continue;e.previousX=e.x;e.previousZ=e.at;
106:   if(e.large){e.at=Math.max(j.z+(this.config.largeEnemy?.minimumCombatAhead??4.5),e.at-e.speed*DT);continue;}
107:   e.at=Math.max(j.z+.09,e.at-e.speed*DT);
108:   if(e.at-j.z<1.2){const foot=this.members.reduce((a,b)=>Math.abs(a.x-e.x)<Math.abs(b.x-e.x)?a:b);e.x+=clamp(foot.x-e.x,-DT*.45,DT*.45);}
109:  }}
```


### 源码：`assets/scripts/core/runner.ts`，L147–L149

```text
147:  private contacts(){const j=this.host;const feet=this.members;
148:   for(const e of this.enemies){if(e.dead)continue;if(e.large){e.attackClock-=DT;if(e.attackClock<=0){e.attackClock=2.2;const aim=j.x;j.warnings.push({id:e.numericId*1000+j.simulationTick,source:e.numericId,weaponId:'spear',profile:'runner-arrow',x:aim,width:.075,loss:1,remaining:1.1,duration:1.1,flight:.4,impact:.15,stage:'charge',hit:false,originX:e.x,originZ:e.at});this.emit({kind:'warn',x:aim,amount:1,worldZ:e.at,weaponId:'spear'});}continue;}
149:    e.contacting=feet.some(m=>Math.hypot((m.x-e.x)*2.5,m.z-e.at)<m.radius+e.depth+.015);if(e.contacting){e.attackClock-=DT;if(e.attackClock<=0&&j.elapsed>=this.graceUntil){e.attackClock=.8;this.graceUntil=j.elapsed+.2;this.lose(1,e.id,'enemyContact');if(j.finished)return;}}else e.attackClock=Math.max(.2,e.attackClock);
```


### 源码：`assets/scripts/BattleView.ts`，L200–L208

```text
200:   for(const m of r.members){const p=project(m.x,m.z-j.z),mout=muzzle(m),tip=project(mout.x,mout.z-j.z),hurt=r.lastDamage&&j.simulationTick-r.lastDamage.tick<12;
201:    jobs.push({id:'runner-member-'+m.id,y:p.y,draw:()=>{
202:     this.ellipse(p.x,p.y,9*p.s,3*p.s,hurt?'#c78d66':'#778775');
203:     if(m.role==='hero'){this.hero('runner-hero',p.x,p.y,92*p.s,j.elapsed,'walk',rank,0,undefined,j.weapon);this.weaponSprite('runner-hero-weapon',j.weapon,p.x+12*p.s,p.y+35*p.s,tip.x,tip.y+mout.height*p.s,Math.hypot(tip.x-p.x-12*p.s,tip.y+mout.height*p.s-p.y-35*p.s)/WEAPON_LENGTH[j.weapon]);}
204:     else if(m.role==='companion'){this.cast('runner-companion',j.companion!,p.x,p.y,82*p.s,'idle',j.elapsed,true,false);this.weaponSprite('runner-companion-weapon',CAST[j.companion!].weapon,p.x+10*p.s,p.y+31*p.s,tip.x,tip.y+mout.height*p.s,Math.hypot(tip.x-p.x-10*p.s,tip.y+mout.height*p.s-p.y-31*p.s)/WEAPON_LENGTH[CAST[j.companion!].weapon]);}
205:     else this.archer('runner-soldier-'+m.id,p.x,p.y,66*p.s,j.elapsed,3,(j.elapsed+m.id*.013)%[.25,.2,.45][r.stage],j.z<j.level.duration,m.id,hurt?190:255);
206:     // Issued crossbows/fire-arrow fittings visibly change for every soldier.
207:     if(r.stage){const color=r.stage===2?'#cb8131':'#388b91';this.rect(p.x-12*p.s,p.y+38*p.s,24*p.s,5*p.s,color);if(r.stage===2)this.poly([[p.x-6*p.s,p.y+49*p.s],[p.x,p.y+60*p.s],[p.x+6*p.s,p.y+49*p.s]],'#e3b759');}
208:     if(this.debug){this.g.strokeColor=this.color('#00aab9');this.g.lineWidth=1;this.g.ellipse(p.x,p.y,m.radius*260*p.s,m.radius*104);this.g.stroke();this.ellipse(tip.x,tip.y+mout.height*p.s,3,3,'#ff8c40');}
```


## 5. 可确认：奖励与攻击信息的视觉权重不一致

截图2的＋4门处于土黄色闪光状态，箱体是程序拼出的方块，与细节较多的人物风格不一致。“45”耐久比“同袍＋6”奖励突出，玩家需要额外辨读。角色数量只在顶部“连弩·12人·赵云”这一行，没有贴队伍的兵力标识；密集接触时不利于快速看出实际变化。

代码中被击中的门统一以金黄色替代整个面板，不区分正负。这会在密集射击时削弱蓝/红的稳定语义。箭、箱和门并非同一套精度的正式资产。

最小修复：正负门主体保留稳定的正负颜色与符号；用窄亮边/短冲击表示命中，不整面变黄。奖励箱明确区分奖励图标/数量与耐久。队伍附近增加紧凑兵力标记与短损兵反馈，别再新加一条通栏HUD。调整UI不改射击、奖励和门结算算法。

不能直接认定：静态＋4不代表射击改值没有工作；本版第一关部分门上限就是4。要批评上限太低，应另作短段体验比较，不能写成确定的数字不更新bug。


### 源码：`assets/scripts/BattleView.ts`，L173–L186

```text
173:     if(t.kind==='mutableGate'||t.kind==='token'){
174:      const small=t.kind==='token',h=(small?37:82)*p.s,color=t.value<0?'#a34e37':'#287d86';
175:      for(const sign of [-1,1]){this.rect(p.x+sign*w/2-3*p.s,p.y,6*p.s,h+15*p.s,'#6f583d');this.rect(p.x+sign*w/2-8*p.s,p.y,16*p.s,5*p.s,'#d1af6c');}
176:      this.rect(p.x-w/2,p.y+h*.2,w,h*.8,flash?'#cfb67c':color);this.line(p.x-w/2-4,p.y+h+9,p.x+w/2+4,p.y+h+9,'#c6a66a',4*p.s);
177:      this.text(id+'-value',(t.value>=0?'+':'−')+Math.abs(t.value),p.x,p.y+h*.62,Math.max(22,(small?28:42)*p.s),'#fff7df',w);
178:      // This visible floor stripe is the same width/depth as the trigger rectangle.
179:      this.line(p.x-w/2,p.y,p.x+w/2,p.y,color,4*p.s);
180:     }else{
181:      const reward=t.reward!,equipment=reward.kind==='equipment',chain=reward.kind==='chain',ally=reward.kind==='fieldCompanion',c=equipment?'#a6772c':chain?'#267b80':ally?'#4a7293':'#655f43',h=73*p.s;
182:      this.rect(p.x-w/2,p.y,w,h,flash?'#eed699':'#ac8650');this.poly([[p.x-w/2,p.y+h],[p.x-w/2+10*p.s,p.y+h+12*p.s],[p.x+w/2+10*p.s,p.y+h+12*p.s],[p.x+w/2,p.y+h]],'#d0b789');
183:      for(const sign of [-1,1])this.rect(p.x+sign*w*.34-3*p.s,p.y,6*p.s,h,'#5c503b');this.rect(p.x-w*.4,p.y+13*p.s,w*.8,42*p.s,c);
184:      this.text(id+'-hp',String(Math.ceil(t.hp)),p.x,p.y+35*p.s,Math.max(24,34*p.s),'#fff6de',w);
185:      const label=equipment?(reward.stage===1?'连弩':'火矢'):chain?`连营 +1×${reward.count}`:ally?'赵云 +1':`同袍 +${reward.count}`;
186:      this.text(id+'-reward',label,p.x,p.y+h+35*p.s,Math.max(19,23*p.s),c,w+58);
```


### 源码：`assets/scripts/Game.ts`，L67–L85

```text
67:  private drawRunnerHud(){
68:   const a=this.layout,{L,R,T,B}=a;this.hudMode='runner';
69:   this.logicalPlate(L,T,R-L-53,48);this.logicalText('level','',L+8,T+3,R-L-69,21,13);this.logicalText('progress','',L+8,T+25,R-L-69,18,12,UI_THEME.gold);
70:   this.logicalButton('pause','Ⅱ',R-44,T,44,44,()=>this.pause());
71:   this.logicalPlate(L,T+55,R-L,28);this.logicalText('runner-equipment','',L+5,T+55,R-L-10,28,12,UI_THEME.gold);
72:   this.logicalText('runner-boss','',L,T+89,R-L,27,13,INK);
73:   const bar=this.make('runner-boss-bar',this.ui);bar.addComponent(Graphics);
74:   this.logicalText('feedback','',L,B-60,R-L,30,14,INK);this.logicalText('tutorial','',L,B-27,R-L,27,12,INK);
75:   this.updateRunnerHud(0);
76:  }
77:  private updateRunnerHud(dt:number){
78:   const j=this.journey!,r=j.runner!,a=this.layout,{L,R,T}=a;
79:   this.setText('level',j.level.title);this.setText('progress',r.config.objective.kind==='clearEnemies'?`剩余敌军 ${r.remaining} / ${r.planned}`:`距目的地 ${Math.ceil(r.distanceLeft)} m`);
80:   this.setText('runner-equipment',`${['基础弩','连弩','火矢'][r.stage]} · ${j.count} 人${j.companionActive?' · '+CAST[j.companion!].name:''}`);
81:   const boss=r.large;this.setText('runner-boss',boss?`${j.level.bossName}  ${Math.ceil(boss.hp)} / ${boss.maxHp}`:'');
82:   const bar=this.ui.getChildByName('runner-boss-bar')?.getComponent(Graphics);if(bar){bar.clear();if(boss){const box=a.rect(L,T+120,R-L,5);bar.fillColor=new Color().fromHEX('#afa081');bar.rect(box.x-box.w/2,box.y-box.h/2,box.w,box.h);bar.fill();bar.fillColor=new Color().fromHEX(RED);bar.rect(box.x-box.w/2,box.y-box.h/2,box.w*boss.hp/boss.maxHp,box.h);bar.fill();}}
83:   this.messageTime=Math.max(0,this.messageTime-dt);this.setText('feedback',(j.elapsed<r.messageUntil?r.message:'')||this.notices.advance(dt)||(this.messageTime>0?this.message:''));
84:   const near=r.targets.filter(t=>!t.resolved&&t.at-j.z>-.5&&t.at-j.z<3.5).sort((x,y)=>x.at-y.at)[0];
85:   this.setText('tutorial',j.elapsed<3?'左右移动瞄准 · 途中补给换装':near?.kind==='mutableGate'&&near.value<0?'整队避开红门，或持续射击打正':near?.kind==='token'?'穿过每一道小门，逐个加入同袍':near?.reward?'大数字是耐久 · 箱顶显示奖励':r.distanceLeft===0&&r.remaining>0?'还有敌军，转火清剿':'走位分配火力，留意队形两侧');
```


## 6. 范围与结论

- 代码可追踪到默认三关runnerVideoV2、可射击改值、独立兵员/装备奖励、连续＋1和成员独立发射等路径。本次阅读不等于逐项动态验收所有边界；原版未公开的精确公式仍不得宣称完整复刻。
- 48项相关测试通过是已有证据，未在本轮重跑。测试通过与当前截图中的画面错误可以同时存在；需要补的是页面状态/可见角色唯一性/首次与重复结算文案等少量精确用例，不能只继续增加同一自动路线的重复次数。
- 截图展示了手机实玩中的具体问题；它能推翻相应页面视觉“已完成”的判断，不能据此推断全部手机帧率/所有安全区已通过。系统临时通知与固定平台遮挡分别处理。
- 暂不重画全部角色、扩关、回退参考玩法、恢复音乐。下一轮优先修结果页双角色、整备层次、重复招募文案，再处理接触前沿与门/箱可读性。
- 开发方预览回执记载总包20,901,322字节，相对其采用的20MiB预算仅余70,198字节。此处引用该回执，不把项目预算泛化为当前所有微信小游戏限制。优先用层级、布局、现有组件调整解决问题，不堆新增大图。

## 建议最小核对集合

1. 从已通关存档重玩第二关，检查一个结果主角、无重复“新加入”提示、当前新模式成绩正确显示。
2. 进入整备→选武器/同袍→返回→再次整备：标题不压建筑、地图标签不互挡、场景不会重复堆叠。
3. 第二关连续＋1与敌人贴近的10—15秒片段：对齐实际成员位置、伤害事件和受击表现。
4. 负数门持续被射击时仍可辨正负；转0时清楚改变安全状态。不要把金黄闪光持续覆盖整面门。

只补这些定点核对，不要求默认十局长测。BGM继续关闭，现有数据和其他已完成优化保留。
