import fs from 'node:fs';import vm from 'node:vm';
const root='docs/ui-design',ctx=vm.createContext({DATA:{}});vm.runInContext(fs.readFileSync(root+'/source/design.js','utf8'),ctx);
const svg=vm.runInContext(`(()=>{let s='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1550" viewBox="0 0 1080 1550" style="font-family:PingFang SC,system-ui,sans-serif"><rect width="1080" height="1550" fill="#e9e7dd"/>';
s+=text('轻量三国军阵',40,60,30,THEME.ink,700)+text('UI-01 / 共用组件 · 逻辑像素 1:1',40,92,15,THEME.ink)+text('交互与数值沿用现有游戏；色块与文字分离，控件与热区同源。',40,120,14,'#596d67');
const title=(t,x,y)=>text(t,x,y,18,THEME.ink,650),note=(t,x,y)=>text(t,x,y,12,'#596d67');
s+=title('01  出征按钮',40,170)+note('高度 56 / 横向拉伸 / 热区等于外框',40,194);
for(let i=0;i<3;i++){const x=40+i*145;s+=shape(x,214,132,56,[THEME.red,'#863225','#9eaaa2'][i])+text('继续征程',x+66,248,17,THEME.paper,600,'middle')+note(['默认','按下：色深 + 内容下移 1','禁用：不可点'][i],x,294);}
s+=title('02  紧凑二级入口',560,170)+note('可见区及热区至少 44 × 44；标签必须保留',560,194);
for(let i=0;i<3;i++){const x=560+i*146;s+=shape(x,214,134,44,THEME.ink)+icon(['flag','replay','gear'][i],x+12,227,18)+text(['整备队伍','重玩关卡','设置'][i],x+40,242,13,THEME.paper)+note(['解锁后显示','打开关卡；不删档','音效 / 震动'][i],x,285);}
s+=title('03  武器与自动状态',40,358)+note('24 高 / 文字 12 / 无点击、无技能释放热区',40,382);
for(let i=0;i<3;i++){const x=40+i*143;s+=shape(x,405,132,24,i===2?'#785324':THEME.ink)+icon(i===0?'spear':i===1?'blade':'star',x+7,408,18)+text(['长枪 Ⅰ','长刀 Ⅲ','觉醒 4.2秒'][i],x+32,422,12,THEME.paper,600);}
s+=note('升阶短提示绑定原事件；觉醒细环随剩余秒数走完并淡出。',40,461);
s+=title('04  随军与待命',560,358)+note('24 高 / 姓名不截断为省略号 / 待命不表现为出战',560,382);
for(let i=0;i<2;i++){const x=560+i*212;s+=shape(x,405,198,24,THEME.ink)+icon('flag',x+6,409,16,i?THEME.muted:THEME.gold)+text(i?'邢道荣 · 待命':'赵云同行助阵',x+30,422,12,i?THEME.muted:THEME.paper);}
s+=note('无队友收起；同名 Boss 按现有本场待命状态呈现。',560,461);
s+=title('05  世界标签',40,528)+note('对象位置不动；标签有边界、独立锚点与细引线',40,552);
s+=shape(40,575,58,22,THEME.ink)+icon('star',44,578,14)+text('精锐',60,590,12,THEME.paper)+ '<path d="M45 595h48" stroke="#d78063" stroke-width="3"/>';
s+=shape(118,575,118,28,'#553f36')+text('山石 · 碰撞 −8',177,593,12,THEME.paper,600,'middle')+shape(254,575,82,26,THEME.ink)+text('碰撞 −5',295,593,12,THEME.paper,600,'middle');
s+=note('文字 12；损失数字至少 12；高密度标签间留 6。',40,640)+note('血条 3 高、最小 48 宽；精锐为图标 + 文字。',40,663);
s+=title('06  事件提示',560,528)+note('只改变呈现；优先级与寿命仍读 BattleNotice',560,552);
s+=shape(560,575,122,32,THEME.gain)+text('兵力 +12',621,596,14,THEME.paper,600,'middle');s+=shape(700,575,328,32,'#73382d')+text('飞叉将至 · 命中 −12',864,596,14,THEME.paper,600,'middle');
s+=shape(560,627,196,32,THEME.ink)+text('长刀升至 Ⅲ 阶',658,648,14,THEME.gold,600,'middle');s+=note('危险 > 成长 > 聚兵；不新建常驻告警或主动技能。',560,691);
s+=title('07  暂停小面板',40,752)+note('墨青标题 + 暖纸内容；不恢复满屏双金线',40,776);
s+=shape(40,800,420,310,'#f4ecd9')+shape(40,800,420,48,THEME.ink)+text('暂歇片刻',60,831,19,THEME.paper,600);
for(let i=0;i<4;i++){const y=864+i*56;s+=shape(56,y,388,44,i===0?THEME.red:THEME.ink)+text(['继续征程','重新开始','设置','返回关卡'][i],250,y+29,15,THEME.paper,600,'middle');}s+=note('4项独立44高热区；回调沿用原有行为。',40,1120);
s+=title('08  整备选择卡',560,752)+note('仅列已解锁项目；已选 / 可选 / 本场待命',560,776);
for(let i=0;i<3;i++){const y=800+i*78;s+=shape(560,y,448,62,THEME.ink)+icon(i===0?'check':'flag',575,y+18,22,i===0?THEME.gold:THEME.muted)+text(['邢道荣','陈应','赵云'][i],612,y+27,16,THEME.paper,600)+text(['已选随军','可出战','同行助阵'][i],612,y+48,12,THEME.muted);if(i===0)s+='<path d="M562 '+(y+5)+'v52" stroke="#d8b879" stroke-width="3"/>';}
s+=note('热区为整卡 448 × 62；小屏用可用宽度，最少高 56。',560,1072);
s+=title('09  结果与新增解锁',40,1150)+note('胜利 / 再胜 / 失败分别沿用既有数据与下一步',40,1174);
s+=shape(40,1194,420,205,'#f4ecd9')+text('晋升领队',60,1231,26,THEME.ink,700)+text('剩余兵力 88 · 进度已保存',60,1265,14,THEME.ink)+shape(56,1282,388,30,THEME.ink)+text('获得：长刀 · 邢道荣随军',72,1303,13,THEME.gold)+shape(56,1330,388,48,THEME.red)+text('整军待发',250,1361,17,THEME.paper,600,'middle');
s+=title('10  关间整军',560,1150)+note('保留拖旗入阵；未完成不能被“下一关”替代',560,1174);
s+=shape(560,1194,448,205,'#f4ecd9')+text('整军待发',580,1231,25,THEME.ink,650)+text('把军旗拖入阵中，弟兄随你出征',580,1265,14,THEME.ink)+shape(580,1290,60,60,THEME.ink)+icon('flag',596,1305,29)+ '<path d="M656 1320h138" stroke="#687f76" stroke-dasharray="5 5"/>'+icon('arrow',768,1309,22,THEME.ink)+ '<rect x="814" y="1288" width="174" height="64" rx="4" fill="none" stroke="#82988a" stroke-dasharray="5 5"/>'+text('军阵',900,1327,17,THEME.ink,500,'middle')+text('先锋 12 人 · 其余弟兄留守',580,1380,12,THEME.ink);
s+=note('所有界面：保存失败沿用原提示；素材加载失败保留原重试入口。',40,1470)+note('本页是组件规范，不是新增游戏系统；动态文字不烘焙入纹理。',40,1495);return s+'</svg>';})()`,ctx);
fs.writeFileSync(root+'/COMPONENTS.svg',svg);fs.mkdirSync(root+'/runtime-ui',{recursive:true});
const atlas=vm.runInContext(`'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="64">'+shape(0,0,80,56,THEME.red)+shape(88,0,80,56,THEME.ink)+shape(176,0,80,56,THEME.paper)+'</svg>'`,ctx);fs.writeFileSync(root+'/runtime-ui/ui-chrome.svg',atlas);
fs.writeFileSync(root+'/runtime-ui/atlas.json',JSON.stringify({optional:true,newRuntimeTextureBudgetKiB:128,atlas:{width:256,height:64},sprites:[{name:'primary',rect:[0,0,80,56]},{name:'ink',rect:[88,0,80,56]},{name:'paper',rect:[176,0,80,56]}].map(x=>({...x,insets:{left:12,right:12,top:8,bottom:8},transparentCorners:5})),text:'separate Label; never baked',alternative:'Use Cocos Graphics for these 5px chamfers; no new runtime bitmap required.'},null,2));
console.log('components and optional nine-slice source ready');
