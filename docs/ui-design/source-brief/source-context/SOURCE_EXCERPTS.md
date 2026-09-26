# 当前源码核对摘录（非完整源码备份）

阅读提交：7ee7685e4bcb4fb7aa67284e7b56692826b86675。
下列摘录来自GitHub连接器实际返回的内容，保持原文。省略号未混入代码中；每个代码块只是一个独立摘录。
完整源码以固定提交为准：https://github.com/yvain57-afk/yilu-changge/tree/7ee7685e4bcb4fb7aa67284e7b56692826b86675
本包未克隆仓库；文本和代码已经由连接器读取，运行时下载原文件未成功，因此仅附下列核对摘录。

## Game.ts：分辨率策略

```typescript
view.setDesignResolutionSize(720,1280,ResolutionPolicy.FIXED_WIDTH);
```

## Game.ts：可见高度差

```typescript
const l=LEVELS[this.level],b=this.platform.book,edge=Math.max(0,(view.getVisibleSize().height-1280)/2);
```

## Game.ts：当前战斗HUD

```typescript
this.panel(0,543+edge,686,136);this.text('level',l.title+' · '+l.scene,-40,576+edge,24,INK,540,46);this.text('count','',-170,523+edge,37,INK,300,60);this.text('progress','',100,523+edge,23,MUTE,210,60);this.panel(0,450+edge,670,48);this.text('weapon-tier','',-235,450+edge,25,INK,170,48);this.text('awakening-status','',-45,450+edge,24,INK,155,48);this.text('companion-status','',165,450+edge,23,INK,285,48);this.button('pause','Ⅱ',555+edge,()=>this.pause(),291,78);this.text('feedback','',0,-590,26,INK,650,60);this.text('tutorial','',0,-548,22,INK,670,55);
```

## Game.ts：画面与手动命中区域

```typescript
private button(id:string,title:string,y:number,run:()=>void,x=0,w=510,primary=false){this.panel(x,y,w,74,primary?INK:PAPER);this.text(id,title,x,y,27,primary?PAPER:INK,w-20,68);this.hits.push({id,x,y,w,h:88,run});}
```

## Game.ts：过渡不能擅自变成普通下一关

```typescript
if(won&&!this.platform.campaign.data.completed[CAMPAIGN.levels[this.level].transitionId])this.button('transition',CAMPAIGN.transitions[this.level].primaryAction,-260,()=>this.openTransition(CAMPAIGN.levels[this.level].transitionId),0,530,true);
else if(won&&!last)this.button('next','下一关：'+LEVELS[this.level+1].title,-260,()=>this.begin(this.level+1),0,530,true);
else if(won)this.button('replay-map','重玩关卡',-260,()=>this.leave(),0,530,true);
```

## Platform.ts：BGM保持关闭

```typescript
// Product decision: BGM is not requested or allocated, even with an old music=true save.
this.music?.stop();
await Promise.all(['gather','hit','break','hurt','warn'].map(k=>new Promise<void>(resolve=>resources.load(`audio/${k}`,AudioClip,(e,a)=>{if(!e)this.clips[k]=a;resolve()}))));
```

## 同版报告的原文片段

来自docs/v051/GPT_REVIEW.md：

> 本文件用于下一轮 GPT 规划，不进入游戏 UI。

> 360/390 小屏显示紧凑的枪/刀与三阶状态；升阶光带从实际精锐击杀处汇入武器，三阶武器亮边、觉醒闪光与六秒环形计时。危险提示优先于成长、成长优先于聚兵；结算只展示这次真正新增的解锁。

> 当前包接近 20 MB 预览上限，后续增加资源前应先规划资源裁剪或分包，不能反复挤入新角色图。

本次用户真机截图是新增的UI缺陷证据。报告里的既有测试结果不证明刘海/胶囊避让已经完成。
