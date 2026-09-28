/** FORMAL-20260927. Values marked tuning are explicit initial values, not original-game formulas. */
export type WeaponId='spear'|'guandao'|'shemao'|'huaji'|'guding'|'shuangji'|'yitian'|'qinggang'|'shuanggu'|'liannu';
export type Slot='dian'|'qi'|'ma';
export const WEAPON_DATA:Record<WeaponId,{label:string;owner:string|null;cycle:number;wind:number;rel:number;rec:number;color:string;family:string}>={
 spear:{label:'长枪',owner:null,cycle:.62,wind:.14,rel:.10,rec:.22,color:'#DDE6F0',family:'spear'},
 guandao:{label:'偃月刀',owner:'guan',cycle:1.08,wind:.36,rel:.12,rec:.34,color:'#9FE0B8',family:'guandao'},
 shemao:{label:'蛇矛',owner:'zhang',cycle:.56,wind:.10,rel:.20,rec:.16,color:'#F0D38A',family:'shemao'},
 huaji:{label:'方天画戟',owner:'lubu',cycle:.86,wind:.22,rel:.14,rec:.26,color:'#F2A57A',family:'huaji'},
 guding:{label:'古锭刀',owner:'sunxiang',cycle:.88,wind:.24,rel:.12,rec:.30,color:'#F4AF64',family:'guandao'},
 shuangji:{label:'双铁戟',owner:'dian',cycle:.86,wind:.22,rel:.14,rec:.26,color:'#D9B997',family:'huaji'},
 yitian:{label:'倚天剑',owner:'cao',cycle:.72,wind:.18,rel:.12,rec:.24,color:'#BECFFF',family:'spear'},
 qinggang:{label:'青釭剑',owner:'zhao',cycle:.62,wind:.14,rel:.10,rec:.22,color:'#AEEAF2',family:'spear'},
 shuanggu:{label:'双股剑',owner:'liu',cycle:.68,wind:.14,rel:.20,rec:.18,color:'#D7E6AE',family:'shemao'},
 liannu:{label:'诸葛连弩',owner:'zhuge',cycle:.72,wind:.12,rel:.30,rec:.14,color:'#B6DFB6',family:'shemao'}
};
export const PEOPLE:Record<string,string>={jiao:'张角',dong:'董卓',yuan:'袁绍',hua:'华佗',lubu:'吕布',diao:'貂蝉',dian:'典韦',xu:'许褚',cao:'曹操',liao:'张辽',xiahou:'夏侯惇',guo:'郭嘉',xun:'荀彧',sunjian:'孙坚',sunce:'孙策',sunquan:'孙权',lumeng:'吕蒙',zhou:'周瑜',luxun:'陆逊',sunxiang:'孙尚香',zhao:'赵云',zhang:'张飞',guan:'关羽',huang:'黄忠',liu:'刘备',zhuge:'诸葛亮',sima:'司马懿',machao:'马超',pang:'庞统',jiang:'姜维'};
export const TREASURES:Record<string,{name:string;slot:Slot;icon:string;ch:string;effect:string}>={
 taiping:{name:'太平要术',slot:'dian',icon:'g_tr_taiping',ch:'术',effect:'援兵门额外 +10%，至少 +1'},
 mengde:{name:'孟德新书',slot:'dian',icon:'g_tr_mengde',ch:'书',effect:'每 20 秒抵消下一次伏兵门一半减员'},
 qingnang:{name:'青囊书',slot:'dian',icon:'g_tr_qingnang',ch:'囊',effect:'医者支援救回比例增加 10 个百分点'},
 yuxi:{name:'传国玉玺',slot:'qi',icon:'g_tr_yuxi',ch:'玺',effect:'开局兵力 +20%，每局一次'},
 qixing:{name:'七星灯',slot:'qi',icon:'g_tr_qixing',ch:'灯',effect:'归零时保住 5 人，每局一次'},
 muniu:{name:'木牛流马',slot:'qi',icon:'g_tr_muniu',ch:'牛',effect:'粮车援兵 +50%'},
 chitu:{name:'赤兔马',slot:'ma',icon:'g_tr_chitu',ch:'赤',effect:'横移速度 ×1.25'},
 dilu:{name:'的卢',slot:'ma',icon:'g_tr_dilu',ch:'卢',effect:'敌将攻击带边缘自动闪避，冷却 15 秒'}
};
export type Chapter={id:string;title:string;place:string;faction:string;boss:string;enemy:string[];capture:string[];visit:string[];allies:string[];weapon?:WeaponId;treasure?:string;length:number;bossHP:number};
export const CHAPTERS:Chapter[]=[
 {id:'c01',title:'黄巾初阵',place:'广宗',faction:'群雄',boss:'jiao',enemy:[],capture:[],visit:[],allies:[],treasure:'taiping',length:210,bossHP:70},
 {id:'c02',title:'讨董联军',place:'虎牢',faction:'群雄',boss:'dong',enemy:[],capture:[],visit:['hua','sunjian'],allies:['yuan'],weapon:'guding',treasure:'yuxi',length:224,bossHP:80},
 {id:'c03',title:'白门收戟',place:'下邳',faction:'群雄',boss:'lubu',enemy:[],capture:['lubu'],visit:['diao'],allies:[],weapon:'huaji',treasure:'chitu',length:238,bossHP:100},
 {id:'c04',title:'帐前双戟',place:'宛城',faction:'魏',boss:'dian',enemy:['xu'],capture:['dian','xu'],visit:['xun'],allies:[],weapon:'shuangji',length:244,bossHP:105},
 {id:'c05',title:'魏武会盟',place:'官渡',faction:'魏',boss:'cao',enemy:['xiahou','liao'],capture:['liao','xiahou'],visit:['guo'],allies:['cao'],weapon:'yitian',treasure:'mengde',length:252,bossHP:110},
 {id:'c06',title:'江东破阵',place:'曲阿',faction:'吴',boss:'sunce',enemy:['lumeng'],capture:['lumeng'],visit:[],allies:['sunce'],weapon:'shemao',length:260,bossHP:115},
 {id:'c07',title:'赤壁风火',place:'赤壁',faction:'吴',boss:'zhou',enemy:['luxun'],capture:['sunxiang','luxun'],visit:['zhou'],allies:['sunquan'],weapon:'qinggang',treasure:'muniu',length:268,bossHP:120},
 {id:'c08',title:'长坂同袍',place:'长坂',faction:'蜀',boss:'zhang',enemy:['zhao'],capture:['zhao','zhang'],visit:[],allies:[],weapon:'guandao',treasure:'dilu',length:276,bossHP:125},
 {id:'c09',title:'荆襄归心',place:'荆州',faction:'蜀',boss:'guan',enemy:['huang'],capture:['guan','huang'],visit:[],allies:[],weapon:'shuanggu',treasure:'qingnang',length:284,bossHP:130},
 {id:'c10',title:'隆中长歌',place:'隆中',faction:'蜀',boss:'zhuge',enemy:['pang','machao'],capture:['machao','jiang'],visit:['zhuge','pang','sima'],allies:['liu'],weapon:'liannu',treasure:'qixing',length:292,bossHP:135}
];
export const RANKS=['乡勇','什长','屯长','军侯','司马','校尉','中郎将','将军','列侯','王'];
/** Route officers require individual defeat; Sun Shangxiang/Jiang Wei join after the commander is defeated. */
export const requiredOfficers=(chapter:number)=>[...CHAPTERS[chapter].enemy];
export const BOSS_PATTERNS:Record<string,{name:string;warn:number;speed:number;damage:number;style:string}>={
 jiao:{name:'双符夹击',warn:1.4,speed:55,damage:8,style:'sides'},
 lubu:{name:'画戟追斩',warn:1.2,speed:40,damage:10,style:'double'},
 zhou:{name:'风火换阵',warn:1.6,speed:22,damage:6,style:'fire'}
};
// Explicit project balancing values; not claimed as original-game formulas.
export const PACING={marchSeconds:[65,66,64,54,52,56,56,54,54,50],bossHP:[270,200,240,220,185,250,225,235,240,190],officerHP:[0,0,0,165,95,170,180,190,195,115]};
export const marchSpeed=(chapter:number)=>(CHAPTERS[chapter].length+5)/PACING.marchSeconds[chapter];
export const TUNING={version:'ios-playable-20260928',startTroops:30,tier:[1,1.35,1.75],overflow:4,weaponMaxLevel:5,weaponLevelDamage:.12,upgradeCost:(level:number)=>level*60,clearXP:30,replayXP:10,gateHitStep:1,gateHitWindow:30,gateSafetyLimit:9999};
export type RouteEvent={d:number;type:string;x?:number;kind?:string;gives?:string;vals?:number[];n?:number;len?:number;side?:number;person?:string;fixed?:boolean};
/** Finite authored route, seeded per chapter; all crate contents must come from unlocked pools. */
export function routeFor(chapter:number,weapons:string[],treasures:string[]):RouteEvent[]{
 const l=CHAPTERS[chapter],pool=weapons.filter(w=>w!=='spear'),w=pool[Math.min(chapter,pool.length-1)]||'spear';
 const layouts:Record<string,{name:string;walls:[number,number,number][];gates:[number,number,number][];arms:number[];weapons:number[];grain:[number,number][];squads:[number,number][];chain:number}>= {
  '群雄':{name:'旷野初阵',walls:[[83,23,chapter%2?-1:1]],gates:[[50,12,-8],[132,-12,6]],arms:[68,168],weapons:[30,115,149],grain:[[30,-.5]],squads:[[14,-.45],[92,.5]],chain:185},
  '魏':{name:'营垒折冲',walls:[[67,14,1],[108,16,-1]],gates:[[42,8,-10],[145,-12,10]],arms:[56,175],weapons:[25,92,133],grain:[[28,.5],[126,-.5]],squads:[[14,-.45],[82,.5],[129,-.5]],chain:188},
  '吴':{name:'水寨连桥',walls:[[60,12,-1],[101,10,1],[151,12,-1]],gates:[[45,-8,12],[125,10,-12]],arms:[80,168],weapons:[28,92,139],grain:[[30,.5],[144,-.5]],squads:[[15,.5],[76,-.5],[116,.5]],chain:177},
  '蜀':{name:'山道回折',walls:[[49,25,1],[128,24,-1]],gates:[[94,14,-12],[169,-10,12]],arms:[82,178],weapons:[28,112,159],grain:[[32,-.5],[119,.5]],squads:[[15,-.5],[77,.5],[155,-.5]],chain:184}
 };
 const q=layouts[l.faction],route:RouteEvent[]=[],speed=marchSpeed(chapter),duration=PACING.marchSeconds[chapter];
 const at=(seconds:number)=>seconds*speed;
 // World-distance positions are authored from marching time, not global timeScale.
 for(let t=5;t<duration-3;t+=4.8)route.push({d:at(t),type:'squad',x:(Math.floor(t)%3-1)*.45,n:5+chapter});
 [13,34,chapter<3?55:46].forEach((t,i)=>route.push({d:at(t),type:'crate',x:i?0:.45,kind:'weapon',gives:i?w:'spear'}));
 [22,chapter<3?60:duration-2].forEach(t=>route.push({d:at(t),type:'crate',x:0,kind:'arms'}));
 [13,28].forEach((t,i)=>route.push({d:at(t),type:'crate',x:i?.5:-.5,kind:'grain'}));
 q.walls.slice(0,2).forEach(([,len,side],i)=>route.push({d:at(i?32:19),type:'wall',len:at(i?3:4),side}));
 q.gates.forEach(([,a,b],i)=>route.push({d:at(i?30:17),type:'gates',vals:[a,b]}));
 for(let i=0;i<3;i++)route.push({d:at(duration-5+i*1.4),type:'gates',vals:[1,-5],fixed:true});
 if(treasures.length)route.push({d:at(27),type:'crate',x:-.5,kind:'treasure',gives:treasures[(chapter+treasures.length-1)%treasures.length]});
 if(chapter===1)route.push({d:at(45),type:'cameo',x:1.1,person:'lubu'});
 if(chapter===8)['xing','chen','yang'].forEach((person,i)=>route.push({d:at(12+i*14),type:'cameo',x:i%2?-1.15:1.15,person}));
 requiredOfficers(chapter).forEach((person,i)=>route.push({d:at(40+i*6),type:'officer',x:i%2?.48:-.48,person,n:1}));

 return route.sort((a,b)=>a.d-b.d);
}

export const FACTIONS=[{name:'群雄',color:'#A8844A',start:0,end:3},{name:'魏',color:'#3B5C7A',start:3,end:5},{name:'吴',color:'#9A4A32',start:5,end:7},{name:'蜀',color:'#4E7A4A',start:7,end:10}];
/** Short narrative summaries, deliberately identified as history or Romance material. */
export const PERSON_PROFILES:Record<string,[string,string,string,string]>={
 jiao:['','天公将军','史载','太平道首领，发动黄巾起义。'],dong:['仲颖','西凉权臣','史载','入京掌权，后迁都长安。'],yuan:['本初','河北盟主','史载','据有河北，与曹操决战官渡。'],hua:['元化','神医','史载','以医术著称，后世尊为外科先驱。'],lubu:['奉先','飞将','演义','虎牢关前迎战诸侯，方天画戟名震天下。'],diao:['','闭月','演义','连环计中周旋于董卓与吕布之间。'],dian:['','古之恶来','史载','曹操帐前猛将，宛城力战护主。'],xu:['仲康','虎痴','史载','以勇力著称，任曹操宿卫。'],cao:['孟德','魏武','史载','官渡破袁绍，逐步统一北方。'],liao:['文远','合肥名将','史载','合肥迎击孙权，以少击众。'],xiahou:['元让','独眼将军','史载','随曹操征战，亦担负屯田与后方事务。'],guo:['奉孝','奇谋之士','史载','为曹操献策，参与平定北方的谋划。'],xun:['文若','王佐之才','史载','辅佐曹操，主持中枢事务。'],sunjian:['文台','江东猛虎','史载','讨董卓时进军洛阳。'],sunce:['伯符','小霸王','演义','以勇武创业，奠定江东基业。'],sunquan:['仲谋','江东之主','史载','继承江东基业，联合刘备抗曹。'],lumeng:['子明','白衣渡江','演义','以白衣渡江之计夺取荆州。'],zhou:['公瑾','江东都督','史载','与程普督军，在赤壁抗击曹操。'],luxun:['伯言','儒将','史载','夷陵统军，以火攻击败刘备。'],sunxiang:['','弓腰姬','演义题材','以尚武的孙夫人为原型；孙尚香为后世通行名。'],zhao:['子龙','常山赵子龙','演义','长坂单骑救主，护送幼主脱险。'],zhang:['翼德','万人敌','演义','当阳桥头喝退追兵。'],guan:['云长','美髯公','演义','过五关斩六将，千里寻兄。'],huang:['汉升','老将','史载','定军山战役中阵斩夏侯渊。'],liu:['玄德','昭烈','史载','辗转创业，后据益州建蜀汉。'],zhuge:['孔明','卧龙','演义','隆中论天下，借东风助赤壁火攻。'],sima:['仲达','鹰视之士','史载','与诸葛亮对垒，后掌握曹魏大权。'],machao:['孟起','锦马超','演义','潼关战曹操，勇武闻名。'],pang:['士元','凤雏','史载','辅佐刘备入蜀，攻雒城时战死。'],jiang:['伯约','麒麟儿','史载','继承北伐事业，多次出兵陇右。']
};
/** Existing companion attacks, presented by their actual weapon family. Explicit tuning, not historical formulas. */
export const COMPANION_STYLE:Record<string,{family:string;label:string;color:string;wide:number;snake?:number}>={
 xu:{family:'guandao',label:'重刀横扫',color:'#D9B997',wide:1.4},
 liao:{family:'huaji',label:'月牙戟突进',color:'#A8C7DD',wide:1.2},
 xiahou:{family:'guandao',label:'斩阵刀弧',color:'#BBD0DF',wide:1.25},
 lumeng:{family:'spear',label:'白衣快刺',color:'#E7DDD0',wide:.7},
 luxun:{family:'guandao',label:'风火扇弧',color:'#EFAB6D',wide:1.25},
 sunxiang:{family:'spear',label:'弓腰劲矢',color:'#F3BB91',wide:.45},
 guan:{family:'guandao',label:'青龙横斩',color:'#9FE0B8',wide:1.5},
 huang:{family:'spear',label:'老将穿杨',color:'#F0D38A',wide:.45},
 machao:{family:'spear',label:'银枪突刺',color:'#DDE6F0',wide:.7},
 jiang:{family:'shemao',label:'回锋连刺',color:'#AFCDB9',wide:.8,snake:.5}
};
export function personRole(id:string){
 if(id==='hua')return '支援：实际减员后救回30%，冷却12秒';
 if(id==='lubu')return '随军：画戟双路穿刺，本主共鸣扩散';
 if(id==='dian')return '随军：双铁戟左右齐出，各穿透2人';
 if(id==='zhang')return '随军：蛇矛曲线连刺';if(id==='zhao')return '随军：长枪直刺';
 if(COMPANION_STYLE[id])return '随军：'+COMPANION_STYLE[id].label+'，可与本主兵器共鸣';
 if(CHAPTERS.some(c=>c.allies.includes(id)))return '盟约：本主兵器伤害×1.5，无需上阵';
 if(CHAPTERS.some(c=>c.visit.includes(id)))return ['diao','xun','sunjian'].includes(id)?'支援：每12秒鼓舞援兵+2':'支援：每12秒自动策应';return '敌将：只交锋，不编入己方';
}
