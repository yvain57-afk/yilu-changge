import {combatTuningFor} from './CombatTuning';
/** FORMAL-20260927. Values marked tuning are explicit initial values, not original-game formulas. */
export type WeaponId='spear'|'guandao'|'shemao'|'huaji'|'guding'|'shuangji'|'yitian'|'qinggang'|'shuanggu'|'liannu'|'duanji'|'tiesuodao'|'goulianqiang'|'dundao'|'yanlinggong'|'jiguannu';
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
 liannu:{label:'诸葛连弩',owner:'zhuge',cycle:.72,wind:.12,rel:.30,rec:.14,color:'#B6DFB6',family:'shemao'},
 duanji:{"label":"双短戟","owner":"taishici","cycle":0.76,"wind":0.15,"rel":0.21,"rec":0.22,"color":"#E9C98E","family":"shemao"},
 tiesuodao:{"label":"铁索刀","owner":"ganning","cycle":1.16,"wind":0.28,"rel":0.14,"rec":0.38,"color":"#95CEE1","family":"guandao"},
 goulianqiang:{"label":"钩镰枪","owner":"zhanghe","cycle":0.84,"wind":0.24,"rel":0.12,"rec":0.28,"color":"#C1D3E8","family":"spear"},
 dundao:{"label":"玄甲盾刀","owner":"caoren","cycle":1.04,"wind":0.26,"rel":0.14,"rec":0.34,"color":"#A6C2B0","family":"guandao"},
 yanlinggong:{"label":"雁翎弓","owner":"xiahouyuan","cycle":1.2,"wind":0.46,"rel":0.12,"rec":0.32,"color":"#E5C283","family":"spear"},
 jiguannu:{"label":"机关弩","owner":"huangyueying","cycle":1.38,"wind":0.52,"rel":0.12,"rec":0.42,"color":"#BDD9AC","family":"spear"}
};
export const PEOPLE:Record<string,string>={jiao:'张角',dong:'董卓',yuan:'袁绍',hua:'华佗',lubu:'吕布',diao:'貂蝉',dian:'典韦',xu:'许褚',cao:'曹操',liao:'张辽',xiahou:'夏侯惇',guo:'郭嘉',xun:'荀彧',sunjian:'孙坚',sunce:'孙策',sunquan:'孙权',lumeng:'吕蒙',zhou:'周瑜',luxun:'陆逊',sunxiang:'孙尚香',zhao:'赵云',zhang:'张飞',guan:'关羽',huang:'黄忠',liu:'刘备',zhuge:'诸葛亮',sima:'司马懿',machao:'马超',pang:'庞统',jiang:'姜维',taishici:'太史慈',ganning:'甘宁',lusu:'鲁肃',zhanghe:'张郃',caoren:'曹仁',xiahouyuan:'夏侯渊',weiyan:'魏延',zhangren:'张任',dengai:'邓艾',huangyueying:'黄月英',zhonghui:'钟会',lukang:'陆抗'};
export const TREASURES:Record<string,{name:string;slot:Slot;icon:string;ch:string;effect:string}>={
 taiping:{name:'太平要术',slot:'dian',icon:'g_tr_taiping',ch:'术',effect:'援兵门额外 +10%，至少 +1'},
 mengde:{name:'孟德新书',slot:'dian',icon:'g_tr_mengde',ch:'书',effect:'每 20 秒抵消下一次伏兵门一半减员'},
 qingnang:{name:'青囊书',slot:'dian',icon:'g_tr_qingnang',ch:'囊',effect:'医者支援救回比例增加 10 个百分点'},
 yuxi:{name:'传国玉玺',slot:'qi',icon:'g_tr_yuxi',ch:'玺',effect:'开局兵力 +20%，每局一次'},
 qixing:{name:'七星灯',slot:'qi',icon:'g_tr_qixing',ch:'灯',effect:'归零时保住 5 人，每局一次'},
 muniu:{name:'木牛流马',slot:'qi',icon:'g_tr_muniu',ch:'牛',effect:'粮车援兵 +50%'},
 chitu:{name:'赤兔马',slot:'ma',icon:'g_tr_chitu',ch:'赤',effect:'横移速度 ×1.25'},
 dilu:{name:'的卢',slot:'ma',icon:'g_tr_dilu',ch:'卢',effect:'敌将攻击带边缘自动闪避，冷却 15 秒'},
 huxinjing:{"name":"护心镜","slot":"qi","icon":"c20_tr_huxinjing","ch":"护","effect":"每12秒抵消下一次精英重击的至多3名战损；不作用于伏兵门。"},
 jinfanling:{"name":"锦帆令","slot":"dian","icon":"c20_tr_jinfanling","ch":"锦","effect":"粮车额外援兵+2；与木牛流马按先基础倍率、后固定加成结算。"},
 fengshitu:{"name":"锋矢图","slot":"dian","icon":"c20_tr_fengshitu","ch":"锋","effect":"主将穿透类攻击命中第二个及后续目标时伤害+15%；不增加命中次数。"},
 tiebifu:{"name":"铁壁符","slot":"qi","icon":"c20_tr_tiebifu","ch":"铁","effect":"骑兵冲撞造成的实际兵损降低25%；不降低地面机关或Boss横扫伤害。"},
 jingfan:{"name":"惊帆","slot":"ma","icon":"c20_tr_jingfan","ch":"惊","effect":"横移速度+15%，脱离真实攻击预警后返还本次攻击前最近战损中的至多1人，冷却10秒。"},
 pozhengu:{"name":"破阵鼓","slot":"qi","icon":"c20_tr_pozhengu","ch":"破","effect":"主将重击有效命中精英后令其护甲效果削弱20%，持续2秒，冷却8秒；不作用于无敌演出。"},
 xingjunyaolue:{"name":"行军要略","slot":"dian","icon":"c20_tr_xingjunyaolue","ch":"行","effect":"固定机关攻击的预警增加0.20秒，实际执行时间同步延后；不伪造提前可见数据。"},
 jueying:{"name":"绝影","slot":"ma","icon":"c20_tr_jueying","ch":"绝","effect":"机关与箭雨的实际兵损降低20%；不影响Boss近战，和其他减伤按乘法合并且封顶50%。"},
 yingbianbingshu:{"name":"应变兵书","slot":"dian","icon":"c20_tr_yingbianbingshu","ch":"应","effect":"完成真实闪避后，下一次穿透类主将攻击穿透数+1，冷却8秒，不触发无限穿透。"},
 jiuzhouyin:{"name":"九州印","slot":"qi","icon":"c20_tr_jiuzhouyin","ch":"九","effect":"开局兵力+8、每局首次Boss伤害降低20%；奖励在胜利后入库，只对后续重游生效。"}
};
export type Chapter={id:string;title:string;place:string;faction:string;boss:string;enemy:string[];capture:string[];visit:string[];allies:string[];weapon?:WeaponId;treasure?:string;length:number;bossHP:number;gateGrowthCap?:number;firstClearXP?:number;mapPanel?:number;targetSeconds?:number[];keyMechanic?:string;bossPhases?:number};
export const CHAPTERS:Chapter[]=[
 {id:'c01',title:'黄巾初阵',place:'广宗',faction:'群雄',boss:'jiao',enemy:[],capture:[],visit:[],allies:[],treasure:'taiping',length:210,bossHP:270},
 {id:'c02',title:'讨董联军',place:'虎牢',faction:'群雄',boss:'dong',enemy:[],capture:[],visit:['hua','sunjian'],allies:['yuan'],weapon:'guding',treasure:'yuxi',length:224,bossHP:200},
 {id:'c03',title:'白门收戟',place:'下邳',faction:'群雄',boss:'lubu',enemy:[],capture:['lubu'],visit:['diao'],allies:[],weapon:'huaji',treasure:'chitu',length:238,bossHP:240},
 {id:'c04',title:'帐前双戟',place:'宛城',faction:'魏',boss:'dian',enemy:['xu'],capture:['dian','xu'],visit:['xun'],allies:[],weapon:'shuangji',length:244,bossHP:220},
 {id:'c05',title:'魏武会盟',place:'官渡',faction:'魏',boss:'cao',enemy:['xiahou','liao'],capture:['liao','xiahou'],visit:['guo'],allies:['cao'],weapon:'yitian',treasure:'mengde',length:252,bossHP:250},
 {id:'c06',title:'江东破阵',place:'曲阿',faction:'吴',boss:'sunce',enemy:['lumeng'],capture:['lumeng'],visit:[],allies:['sunce'],weapon:'shemao',length:260,bossHP:250},
 {id:'c07',title:'赤壁风火',place:'赤壁',faction:'吴',boss:'zhou',enemy:['luxun'],capture:['sunxiang','luxun'],visit:['zhou'],allies:['sunquan'],weapon:'qinggang',treasure:'muniu',length:268,bossHP:290},
 {id:'c08',title:'长坂同袍',place:'长坂',faction:'蜀',boss:'zhang',enemy:['zhao'],capture:['zhao','zhang'],visit:[],allies:[],weapon:'guandao',treasure:'dilu',length:276,bossHP:235},
 {id:'c09',title:'荆襄归心',place:'荆州',faction:'蜀',boss:'guan',enemy:['huang'],capture:['guan','huang'],visit:[],allies:[],weapon:'shuanggu',treasure:'qingnang',length:284,bossHP:240},
 {id:'c10',title:'隆中长歌',place:'隆中',faction:'蜀',boss:'zhuge',enemy:['pang','machao'],capture:['machao','jiang'],visit:['zhuge','pang','sima'],allies:['liu'],weapon:'liannu',treasure:'qixing',length:292,bossHP:240},
 {"id":"c11","title":"神亭试锋","place":"神亭","faction":"吴","boss":"taishici","capture":["taishici"],"visit":[],"allies":[],"enemy":[],"length":370,"bossHP":290,"weapon":"duanji","treasure":"huxinjing"},
 {"id":"c12","title":"濡须破浪","place":"濡须","faction":"吴","boss":"ganning","capture":["ganning"],"visit":["lusu"],"allies":[],"enemy":[],"length":377,"bossHP":355,"weapon":"tiesuodao","treasure":"jinfanling"},
 {"id":"c13","title":"街亭列阵","place":"街亭","faction":"魏","boss":"zhanghe","capture":["zhanghe"],"visit":[],"allies":[],"enemy":[],"length":384,"bossHP":345,"weapon":"goulianqiang","treasure":"fengshitu"},
 {"id":"c14","title":"樊城破垒","place":"樊城","faction":"魏","boss":"caoren","capture":[],"visit":[],"allies":["caoren"],"enemy":[],"length":391,"bossHP":330,"weapon":"dundao","treasure":"tiebifu"},
 {"id":"c15","title":"阳平争先","place":"阳平","faction":"魏","boss":"xiahouyuan","capture":["xiahouyuan"],"visit":[],"allies":[],"enemy":[],"length":398,"bossHP":335,"weapon":"yanlinggong","treasure":"jingfan"},
 {"id":"c16","title":"定军破阵","place":"定军山","faction":"蜀","boss":"weiyan","capture":["weiyan"],"visit":[],"allies":[],"enemy":[],"length":405,"bossHP":350,"treasure":"pozhengu"},
 {"id":"c17","title":"雒城伏道","place":"雒城","faction":"蜀","boss":"zhangren","capture":["zhangren"],"visit":[],"allies":[],"enemy":[],"length":412,"bossHP":360,"treasure":"xingjunyaolue"},
 {"id":"c18","title":"剑阁奇门","place":"剑阁","faction":"蜀","boss":"dengai","capture":["dengai"],"visit":["huangyueying"],"allies":[],"enemy":[],"length":419,"bossHP":330,"weapon":"jiguannu","treasure":"jueying"},
 {"id":"c19","title":"天水决胜","place":"天水","faction":"魏","boss":"zhonghui","capture":[],"visit":[],"allies":["zhonghui"],"enemy":[],"length":426,"bossHP":370,"treasure":"yingbianbingshu"},
 {"id":"c20","title":"洛阳长歌","place":"洛阳","faction":"吴","boss":"lukang","capture":[],"visit":[],"allies":["lukang"],"enemy":[],"length":433,"bossHP":420,"treasure":"jiuzhouyin"}
];

const CHAPTER_META=[{"gateGrowthCap":6,"firstClearXP":30,"mapPanel":1,"targetSeconds":[90,115],"keyMechanic":"正负门与单线预警","bossPhases":1},{"gateGrowthCap":6,"firstClearXP":30,"mapPanel":1,"targetSeconds":[90,115],"keyMechanic":"第一场两段式考核","bossPhases":2},{"gateGrowthCap":6,"firstClearXP":30,"mapPanel":1,"targetSeconds":[90,115],"keyMechanic":"弓手点射","bossPhases":1},{"gateGrowthCap":6,"firstClearXP":30,"mapPanel":1,"targetSeconds":[90,115],"keyMechanic":"盾兵掩护弓手","bossPhases":2},{"gateGrowthCap":7,"firstClearXP":30,"mapPanel":2,"targetSeconds":[100,135],"keyMechanic":"旗手增益","bossPhases":1},{"gateGrowthCap":7,"firstClearXP":30,"mapPanel":2,"targetSeconds":[100,135],"keyMechanic":"左右夹击","bossPhases":2},{"gateGrowthCap":7,"firstClearXP":30,"mapPanel":2,"targetSeconds":[100,135],"keyMechanic":"火区与粮车护卫","bossPhases":1},{"gateGrowthCap":7,"firstClearXP":30,"mapPanel":2,"targetSeconds":[100,135],"keyMechanic":"敌将停步交锋","bossPhases":2},{"gateGrowthCap":8,"firstClearXP":30,"mapPanel":3,"targetSeconds":[100,135],"keyMechanic":"骑兵冲线","bossPhases":1},{"gateGrowthCap":8,"firstClearXP":30,"mapPanel":3,"targetSeconds":[100,135],"keyMechanic":"上篇综合战","bossPhases":2},{"gateGrowthCap":8,"firstClearXP":80,"mapPanel":3,"targetSeconds":[110,145],"keyMechanic":"双短戟快速二连","bossPhases":1},{"gateGrowthCap":8,"firstClearXP":80,"mapPanel":3,"targetSeconds":[110,145],"keyMechanic":"水寨交错冲线","bossPhases":2},{"gateGrowthCap":9,"firstClearXP":90,"mapPanel":4,"targetSeconds":[110,145],"keyMechanic":"钩镰阵与旗手","bossPhases":1},{"gateGrowthCap":9,"firstClearXP":90,"mapPanel":4,"targetSeconds":[110,145],"keyMechanic":"重甲守垒","bossPhases":2},{"gateGrowthCap":9,"firstClearXP":100,"mapPanel":4,"targetSeconds":[110,145],"keyMechanic":"高台射手与扇形箭雨","bossPhases":1},{"gateGrowthCap":9,"firstClearXP":100,"mapPanel":4,"targetSeconds":[110,145],"keyMechanic":"重刃压阵","bossPhases":2},{"gateGrowthCap":10,"firstClearXP":110,"mapPanel":5,"targetSeconds":[120,160],"keyMechanic":"机关伏道","bossPhases":1},{"gateGrowthCap":10,"firstClearXP":110,"mapPanel":5,"targetSeconds":[120,160],"keyMechanic":"机关轮替","bossPhases":2},{"gateGrowthCap":10,"firstClearXP":120,"mapPanel":5,"targetSeconds":[120,160],"keyMechanic":"军令轮换","bossPhases":1},{"gateGrowthCap":10,"firstClearXP":150,"mapPanel":5,"targetSeconds":[150,180],"keyMechanic":"三段终局","bossPhases":3}];
CHAPTERS.forEach((c,i)=>Object.assign(c,CHAPTER_META[i]));
/** Static design values. No runtime scaling against the player. */
export const DIFFICULTY_PROFILES=[{"pair":1,"ordinaryHPMultiplier":1,"incomingDamageMultiplier":1,"waveInterval":4.0,"eliteBudget":0,"minimumTelegraph":1.6,"simultaneousThreats":1,"visibleEnemyCap":24},{"pair":2,"ordinaryHPMultiplier":1.05,"incomingDamageMultiplier":1,"waveInterval":3.8,"eliteBudget":0.05,"minimumTelegraph":1.5,"simultaneousThreats":1,"visibleEnemyCap":28},{"pair":3,"ordinaryHPMultiplier":1.1,"incomingDamageMultiplier":1.05,"waveInterval":3.6,"eliteBudget":0.08,"minimumTelegraph":1.4,"simultaneousThreats":2,"visibleEnemyCap":32},{"pair":4,"ordinaryHPMultiplier":1.2,"incomingDamageMultiplier":1.1,"waveInterval":3.4,"eliteBudget":0.12,"minimumTelegraph":1.3,"simultaneousThreats":2,"visibleEnemyCap":36},{"pair":5,"ordinaryHPMultiplier":1.3,"incomingDamageMultiplier":1.2,"waveInterval":3.2,"eliteBudget":0.18,"minimumTelegraph":1.2,"simultaneousThreats":2,"visibleEnemyCap":40},{"pair":6,"ordinaryHPMultiplier":1.45,"incomingDamageMultiplier":1.3,"waveInterval":3.0,"eliteBudget":0.22,"minimumTelegraph":1.15,"simultaneousThreats":2,"visibleEnemyCap":44},{"pair":7,"ordinaryHPMultiplier":1.6,"incomingDamageMultiplier":1.35,"waveInterval":2.9,"eliteBudget":0.26,"minimumTelegraph":1.1,"simultaneousThreats":2,"visibleEnemyCap":48},{"pair":8,"ordinaryHPMultiplier":1.7,"incomingDamageMultiplier":1.45,"waveInterval":2.8,"eliteBudget":0.3,"minimumTelegraph":1.05,"simultaneousThreats":2,"visibleEnemyCap":52},{"pair":9,"ordinaryHPMultiplier":1.85,"incomingDamageMultiplier":1.55,"waveInterval":2.7,"eliteBudget":0.34,"minimumTelegraph":1,"simultaneousThreats":3,"visibleEnemyCap":60},{"pair":10,"ordinaryHPMultiplier":2,"incomingDamageMultiplier":1.65,"waveInterval":2.6,"eliteBudget":0.38,"minimumTelegraph":0.95,"simultaneousThreats":3,"visibleEnemyCap":64}];
export const difficultyFor=(chapter:number)=>{const old=DIFFICULTY_PROFILES[Math.max(0,Math.min(9,Math.floor(chapter/2)))],t=combatTuningFor(chapter);return {...old,waveInterval:t.waveInterval,minimumTelegraph:t.minimumTelegraph,simultaneousThreats:t.maxThreats,visibleEnemyCap:t.activeCap};};
export const MILESTONES=[{"id":"m01","chapter":2,"title":"初立军功","xpBonus":60,"badge":"badge_m01","primaryNewContent":"guding","special":"展示下一目标与下一关可用的新能力"},{"id":"m02","chapter":4,"title":"帐前立威","xpBonus":60,"badge":"badge_m02","primaryNewContent":"shuangji","special":"展示下一目标与下一关可用的新能力"},{"id":"m03","chapter":6,"title":"江东立足","xpBonus":60,"badge":"badge_m03","primaryNewContent":"shemao","special":"展示下一目标与下一关可用的新能力"},{"id":"m04","chapter":8,"title":"同袍成军","xpBonus":60,"badge":"badge_m04","primaryNewContent":"guandao","special":"展示下一目标与下一关可用的新能力"},{"id":"m05","chapter":10,"title":"半壁已定","xpBonus":60,"badge":"badge_m05","primaryNewContent":"liannu","special":"开启下篇第11关，原第10关奖励保留"},{"id":"m06","chapter":12,"title":"水陆扬名","xpBonus":60,"badge":"badge_m06","primaryNewContent":"tiesuodao","special":"展示下一目标与下一关可用的新能力"},{"id":"m07","chapter":14,"title":"破坚开道","xpBonus":60,"badge":"badge_m07","primaryNewContent":"dundao","special":"展示下一目标与下一关可用的新能力"},{"id":"m08","chapter":16,"title":"汉中立营","xpBonus":60,"badge":"badge_m08","primaryNewContent":"pozhengu","special":"展示下一目标与下一关可用的新能力"},{"id":"m09","chapter":18,"title":"奇门洞开","xpBonus":60,"badge":"badge_m09","primaryNewContent":"jiguannu","special":"展示下一目标与下一关可用的新能力"},{"id":"m10","chapter":20,"title":"九州长歌","xpBonus":60,"badge":"badge_m10","primaryNewContent":"jiuzhouyin","special":"完成二十关；开放不加新主线关卡的重游军令"}];
export const milestoneFor=(chapter:number)=>MILESTONES.find(m=>m.chapter===chapter+1);
export const MAP_PANELS=[{"id":1,"chapters":[1,2,3,4],"name":"群雄初起"},{"id":2,"chapters":[5,6,7,8],"name":"江河进军"},{"id":3,"chapters":[9,10,11,12],"name":"荆楚东行"},{"id":4,"chapters":[13,14,15,16],"name":"中原争雄"},{"id":5,"chapters":[17,18,19,20],"name":"西关归一"}];
export const RANKS=['乡勇','什长','屯长','军侯','司马','校尉','中郎将','将军','列侯','王'];
/** Route officers require individual defeat; Sun Shangxiang/Jiang Wei join after the commander is defeated. */
export const requiredOfficers=(chapter:number)=>[...CHAPTERS[chapter].enemy];
export const BOSS_PATTERNS:Record<string,{name:string;warn:number;speed:number;damage:number;style:string;sequence:string[];recovery?:number}>= {
 jiao:{name:'双符夹击',warn:1.6,speed:55,damage:8,style:'sides',sequence:['sides']},
 dong:{name:'锁扫与近卫',warn:1.6,speed:40,damage:10,style:'sweep',sequence:['sweep','thrust']},
 lubu:{name:'画戟追斩',warn:1.45,speed:40,damage:10,style:'double',sequence:['double','sweep']},
 dian:{name:'双戟错锋',warn:1.45,speed:42,damage:10,style:'short',sequence:['short','thrust']},
 cao:{name:'旗阵突刺',warn:1.4,speed:38,damage:10,style:'banner',sequence:['banner','thrust']},
 sunce:{name:'冲阵回斩',warn:1.4,speed:45,damage:10,style:'charge',sequence:['charge','sweep']},
 zhou:{name:'风火换阵',warn:1.6,speed:22,damage:6,style:'fire',sequence:['fire','arrows']},
 zhang:{name:'吼阵追刺',warn:1.3,speed:40,damage:10,style:'thrust',sequence:['thrust','sides']},
 guan:{name:'青龙横扫',warn:1.25,speed:36,damage:10,style:'sweep',sequence:['sweep','thrust']},
 zhuge:{name:'弩阵军令',warn:1.25,speed:48,damage:10,style:'arrows',sequence:['arrows','sequential']},
 taishici:{name:'短戟双段',warn:1.25,speed:45,damage:15,style:'short',sequence:['short','thrust']},
 ganning:{name:'铁索回环',warn:1.25,speed:36,damage:15,style:'sweep',sequence:['sweep','charge']},
 zhanghe:{name:'钩镰破线',warn:1.2,speed:42,damage:15,style:'thrust',sequence:['thrust','shield']},
 caoren:{name:'盾阵露锋',warn:1.2,speed:32,damage:15,style:'shield',sequence:['shield','thrust']},
 xiahouyuan:{name:'穿杨箭阵',warn:1.2,speed:54,damage:15,style:'arrows',sequence:['arrows','fan']},
 weiyan:{name:'重刃破阵',warn:1.2,speed:34,damage:15,style:'heavy',sequence:['heavy','overhead']},
 zhangren:{name:'守隘伏道',warn:1.15,speed:30,damage:15,style:'trap',sequence:['trap','arrows']},
 dengai:{name:'奇门穿阵',warn:1.15,speed:38,damage:15,style:'mechanism',sequence:['mechanism','thrust']},
 zhonghui:{name:'军令轮替',warn:1.1,speed:40,damage:15,style:'sequential',sequence:['sequential','shield','arrows']},
 lukang:{name:'破阵交锋决胜',warn:1.1,speed:40,damage:15,style:'formation',sequence:['formation','double','sequential']}
};
// Explicit project balancing values; not claimed as original-game formulas.
export const PACING={marchSeconds:[65,66,64,54,52,56,56,54,54,50,72,74,76,78,80,82,88,90,92,108],bossHP:CHAPTERS.map(c=>c.bossHP),officerHP:[0,0,0,165,95,170,180,190,195,115,140,150,160,170,180,190,200,210,220,230]};
export const marchSpeed=(chapter:number)=>(CHAPTERS[chapter].length+5)/PACING.marchSeconds[chapter];
export const TUNING={version:'campaign20-20260930',startTroops:30,tier:[1,1.35,1.75],overflow:4,weaponMaxLevel:5,weaponLevelDamage:.12,upgradeCost:(level:number)=>level*60,clearXP:30,replayXP:10,gateHitStep:1,gateHitWindow:30,gateSafetyLimit:9999};
export type RouteEvent={d:number;type:string;x?:number;kind?:string;gives?:string;vals?:number[];n?:number;len?:number;side?:number;person?:string;fixed?:boolean;formation?:'pair'|'triple'|'stagger'|'guard'|'line';elite?:boolean;growthCap?:number;enemyKind?:'light'|'guard'|'shield'|'archer'|'cavalry'|'banner'|'mechanism';choiceId?:string;choiceRole?:'safe'|'challenge';rewardXP?:number;waveId?:string};
/** Finite authored route, seeded per chapter; all crate contents must come from unlocked pools. */
export function routeFor(chapter:number,weapons:string[],treasures:string[],startWeaponId?:string):RouteEvent[]{
 const l=CHAPTERS[chapter],owned=weapons.filter(w=>!!WEAPON_DATA[w as WeaponId]),start=owned.includes(startWeaponId||'')?startWeaponId!:'spear',pool=owned.filter(w=>w!==start),w=pool[Math.min(chapter,pool.length-1)]||start;
 const layouts:Record<string,{name:string;walls:[number,number,number][];gates:[number,number,number][];arms:number[];weapons:number[];grain:[number,number][];squads:[number,number][];chain:number}>= {
  '群雄':{name:'旷野初阵',walls:[[83,23,chapter%2?-1:1]],gates:[[50,12,-8],[132,-12,6]],arms:[68,168],weapons:[30,115,149],grain:[[30,-.5]],squads:[[14,-.45],[92,.5]],chain:185},
  '魏':{name:'营垒折冲',walls:[[67,14,1],[108,16,-1]],gates:[[42,8,-10],[145,-12,10]],arms:[56,175],weapons:[25,92,133],grain:[[28,.5],[126,-.5]],squads:[[14,-.45],[82,.5],[129,-.5]],chain:188},
  '吴':{name:'水寨连桥',walls:[[60,12,-1],[101,10,1],[151,12,-1]],gates:[[45,-8,12],[125,10,-12]],arms:[80,168],weapons:[28,92,139],grain:[[30,.5],[144,-.5]],squads:[[15,.5],[76,-.5],[116,.5]],chain:177},
  '蜀':{name:'山道回折',walls:[[49,25,1],[128,24,-1]],gates:[[94,14,-12],[169,-10,12]],arms:[82,178],weapons:[28,112,159],grain:[[32,-.5],[119,.5]],squads:[[15,-.5],[77,.5],[155,-.5]],chain:184}
 };
 const q=layouts[l.faction],route:RouteEvent[]=[],speed=marchSpeed(chapter),duration=PACING.marchSeconds[chapter];
 const at=(seconds:number)=>seconds*speed;
 // World-distance positions are authored from marching time, not global timeScale.
 const tuning=combatTuningFor(chapter);
 for(let t=5,wave=0;t<duration-8;t+=tuning.waveInterval,wave++){
  // c16 follows the authored relief windows; walls narrow the budget instead of deleting waves.
  let count=Math.round(tuning.waveMin+(tuning.waveMax-tuning.waveMin)*(wave%3)/2);
  if(chapter===15)count=t<8?14:t<18?20:t<27?16:t<39?22:t<55?24:t<68?22:18;
  const side=(wave%3-1)*.42,form=l.faction==='魏'?(wave%3===0?'pair':'line'):l.faction==='吴'?(wave%2?'pair':'stagger'):l.faction==='蜀'?(wave%2?'guard':'triple'):(wave%3?'stagger':'triple');
  if(chapter>=16&&t<18)count=Math.round(12+(count-12)*(t-5)/13);
  const archers=chapter<2?0:Math.max(1,Math.round(count*(chapter>=16&&t<18?.10:tuning.archerShare))),special=chapter<3?0:chapter>=16?(wave%3===0?1:2):Math.min(2,Math.floor(count*.08));
  const specialKind:RouteEvent['enemyKind']=chapter>=16?(wave%3===0?'mechanism':wave%3===1?'shield':'cavalry'):chapter>=12?(wave%3===0?'banner':wave%3===1?'shield':'guard'):chapter>=8?(wave%3===0?'cavalry':wave%3===1?'banner':'guard'):chapter>=4?(wave%2?'shield':'banner'):'shield';
  route.push({d:at(t),type:'squad',x:side,n:count-archers-special,formation:form,enemyKind:'light',waveId:l.id+':normal:'+wave+':light'});
  if(archers)route.push({d:at(t+.5),type:'squad',x:-side,n:archers,formation:'pair',enemyKind:'archer',waveId:l.id+':normal:'+wave+':archer'});
  if(special)route.push({d:at(t+1.5),type:'squad',x:side,n:special,formation:'pair',enemyKind:specialKind,waveId:l.id+':normal:'+wave+':'+specialKind});
 }
 // Small guards frame a crate without consuming its final four-second shooting window.
 [10,31].forEach((t,i)=>route.push({d:at(t),type:'squad',x:i?-.48:.48,n:4,formation:'guard',elite:l.faction==='魏'}));
 // Last hostile ranks come before the +1 chain, leaving a readable reorganisation window.
 route.push({d:at(duration-8),type:'squad',x:0,n:8+Math.min(4,chapter),formation:'line',elite:true});
 [13,34,chapter<3?55:46].forEach((t,i)=>route.push({d:at(t),type:'crate',x:i?0:.45,kind:'weapon',gives:i===1?w:start}));
 [22,chapter<3?60:duration-2].forEach(t=>route.push({d:at(t),type:'crate',x:0,kind:'arms'}));
 [13,28].forEach((t,i)=>route.push({d:at(t),type:'crate',x:i?.5:-.5,kind:'grain'}));
 q.walls.slice(0,2).forEach(([,len,side],i)=>route.push({d:at(i?32:19),type:'wall',len:at(i?3:4),side}));
 q.gates.forEach(([,a,b],i)=>route.push({d:at(i?30:17),type:'gates',vals:[a,b],growthCap:l.gateGrowthCap}));
 for(let i=0;i<3;i++)route.push({d:at(duration-5+i*1.4),type:'gates',vals:[1,-5],fixed:true,growthCap:0});
 if(treasures.length)route.push({d:at(27),type:'crate',x:-.5,kind:'treasure',gives:treasures[(chapter+treasures.length-1)%treasures.length]});
 if(chapter===1)route.push({d:at(45),type:'cameo',x:1.1,person:'lubu'});
 if(chapter===8)['xing','chen','yang'].forEach((person,i)=>route.push({d:at(12+i*14),type:'cameo',x:i%2?-1.15:1.15,person}));
 requiredOfficers(chapter).forEach((person,i)=>route.push({d:at(40+i*6),type:'officer',x:i%2?.48:-.48,person,n:1}));

 // Two paired supply decisions; challenge guards must be cleared before the larger supply.
 [23,39].forEach((t,i)=>{
  const side=i?-.55:.55,id=l.id+':choice:'+i;
  route.push({d:at(t),type:'crate',x:-side,kind:'grain',n:4,choiceId:id,choiceRole:'safe'});
  route.push({d:at(t),type:'crate',x:side,kind:'grain',n:9,choiceId:id,choiceRole:'challenge',rewardXP:2});
  route.push({d:at(t-2),type:'squad',x:side,n:3+Math.floor(chapter/4),formation:'guard',elite:true,enemyKind:chapter>=12?'shield':chapter>=4?'guard':'light',choiceId:id,choiceRole:'challenge'});
 });
 // Ordinary light troops remain the majority. The marked ranks introduce visible tactical threats.
 let waveIndex=0;for(const e of route){if(e.type==='squad'&&!e.enemyKind){e.enemyKind=e.elite?'guard':'light';e.waveId=l.id+':authored:'+waveIndex++;}}
 return route.sort((a,b)=>a.d-b.d);
}

export const FACTIONS=[{name:'群雄',color:'#A8844A',start:0,end:3},{name:'魏',color:'#3B5C7A',start:3,end:5},{name:'吴',color:'#9A4A32',start:5,end:7},{name:'蜀',color:'#4E7A4A',start:7,end:10}];
/** Short narrative summaries, deliberately identified as history or Romance material. */
export const PERSON_PROFILES:Record<string,[string,string,string,string]>={
 jiao:['','天公将军','史载','太平道首领，发动黄巾起义。'],dong:['仲颖','西凉权臣','史载','入京掌权，后迁都长安。'],yuan:['本初','河北盟主','史载','据有河北，与曹操决战官渡。'],hua:['元化','神医','史载','以医术著称，后世尊为外科先驱。'],lubu:['奉先','飞将','演义','虎牢关前迎战诸侯，方天画戟名震天下。'],diao:['','闭月','演义','连环计中周旋于董卓与吕布之间。'],dian:['','古之恶来','史载','曹操帐前猛将，宛城力战护主。'],xu:['仲康','虎痴','史载','以勇力著称，任曹操宿卫。'],cao:['孟德','魏武','史载','官渡破袁绍，逐步统一北方。'],liao:['文远','合肥名将','史载','合肥迎击孙权，以少击众。'],xiahou:['元让','独眼将军','史载','随曹操征战，亦担负屯田与后方事务。'],guo:['奉孝','奇谋之士','史载','为曹操献策，参与平定北方的谋划。'],xun:['文若','王佐之才','史载','辅佐曹操，主持中枢事务。'],sunjian:['文台','江东猛虎','史载','讨董卓时进军洛阳。'],sunce:['伯符','小霸王','演义','以勇武创业，奠定江东基业。'],sunquan:['仲谋','江东之主','史载','继承江东基业，联合刘备抗曹。'],lumeng:['子明','白衣渡江','演义','以白衣渡江之计夺取荆州。'],zhou:['公瑾','江东都督','史载','与程普督军，在赤壁抗击曹操。'],luxun:['伯言','儒将','史载','夷陵统军，以火攻击败刘备。'],sunxiang:['','弓腰姬','演义题材','以尚武的孙夫人为原型；孙尚香为后世通行名。'],zhao:['子龙','常山赵子龙','演义','长坂单骑救主，护送幼主脱险。'],zhang:['翼德','万人敌','演义','当阳桥头喝退追兵。'],guan:['云长','美髯公','演义','过五关斩六将，千里寻兄。'],huang:['汉升','老将','史载','定军山战役中阵斩夏侯渊。'],liu:['玄德','昭烈','史载','辗转创业，后据益州建蜀汉。'],zhuge:['孔明','卧龙','演义','隆中论天下，借东风助赤壁火攻。'],sima:['仲达','鹰视之士','史载','与诸葛亮对垒，后掌握曹魏大权。'],machao:['孟起','锦马超','演义','潼关战曹操，勇武闻名。'],pang:['士元','凤雏','史载','辅佐刘备入蜀，攻雒城时战死。'],jiang:['伯约','麒麟儿','史载','继承北伐事业，多次出兵陇右。'],taishici:["","双短戟追击","本作架空","每1.5秒一组两次近程光刃；命中同一目标的第二击伤害为首击60%；清理破盾后的近身敌军。"],ganning:["","铁索横扫","本作架空","宽弧清扫轻兵，较低单体伤害；两条侧路出现轻兵时有价值。"],lusu:["","整军策应","本作架空","每12秒救回最近周期实际损失中的至多3人；无战损时不凭空生兵。"],zhanghe:["","钩镰破盾","本作架空","优先攻击自己所在侧路可见盾兵；破甲标记持续2秒、同目标不叠加。"],caoren:["","守垒盟约","本作架空","与盾刀形成共鸣；额外防护只在佩戴该兵器时触发，受总减伤上限约束。"],xiahouyuan:["","急射点杀","本作架空","瞄准当前侧路可见远程/旗手目标，实际箭矢命中才伤害，不能穿过不可通行遮挡凭空命中。"],weiyan:["","重刃破阵","本作架空","较慢重击，对护甲露出窗口的精英有额外收益，空挥不触发重击反馈。"],zhangren:["","守隘反击","本作架空","敌军进入近身预警区时释放一次窄幅反击；冷却4秒，不能持续打断Boss。"],dengai:["","侧路突进","本作架空","沿玩家选中的侧路对一条直线进攻；不自动横移主将，不越过玩家移动上限。"],huangyueying:["","机巧策应","本作架空","每12秒使下一次机关弩爆裂矢附带一次破盾标记；没有机关弩时提供一次普通策应矢。"],zhonghui:["","应变军令","本作架空","完成一次真实闪避后，下一次主将攻击对精英伤害+10%；冷却8秒，多盟约加成进入统一上限。"],lukang:["","九州协守","本作架空","每局首次大额战损抵消至多3人；仅作后续重游能力，不让终局获奖反向影响本场胜负。"]
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
 jiang:{family:'shemao',label:'回锋连刺',color:'#AFCDB9',wide:.8,snake:.5},
 taishici:{"family":"shemao","label":"双短戟追击","color":"#D4D8C6","wide":0.65},
 ganning:{"family":"guandao","label":"铁索横扫","color":"#D4D8C6","wide":1.65},
 zhanghe:{"family":"spear","label":"钩镰破盾","color":"#D4D8C6","wide":0.6},
 xiahouyuan:{"family":"spear","label":"急射点杀","color":"#D4D8C6","wide":0.7},
 weiyan:{"family":"guandao","label":"重刃破阵","color":"#D4D8C6","wide":1.25},
 zhangren:{"family":"spear","label":"守隘反击","color":"#D4D8C6","wide":0.7},
 dengai:{"family":"spear","label":"侧路突进","color":"#D4D8C6","wide":0.7}
};
export const NEW_PERSON_ROLES:Record<string,string>={"taishici":"随军：每1.5秒一组两次近程光刃；命中同一目标的第二击伤害为首击60%；清理破盾后的近身敌军。","ganning":"随军：宽弧清扫轻兵，较低单体伤害；两条侧路出现轻兵时有价值。","lusu":"支援：每12秒救回最近周期实际损失中的至多3人；无战损时不凭空生兵。","zhanghe":"随军：优先攻击自己所在侧路可见盾兵；破甲标记持续2秒、同目标不叠加。","caoren":"盟约：与盾刀形成共鸣；额外防护只在佩戴该兵器时触发，受总减伤上限约束。","xiahouyuan":"随军：瞄准当前侧路可见远程/旗手目标，实际箭矢命中才伤害，不能穿过不可通行遮挡凭空命中。","weiyan":"随军：较慢重击，对护甲露出窗口的精英有额外收益，空挥不触发重击反馈。","zhangren":"随军：敌军进入近身预警区时释放一次窄幅反击；冷却4秒，不能持续打断Boss。","dengai":"随军：沿玩家选中的侧路对一条直线进攻；不自动横移主将，不越过玩家移动上限。","huangyueying":"支援：每12秒使下一次机关弩爆裂矢附带一次破盾标记；没有机关弩时提供一次普通策应矢。","zhonghui":"盟约：完成一次真实闪避后，下一次主将攻击对精英伤害+10%；冷却8秒，多盟约加成进入统一上限。","lukang":"盟约：每局首次大额战损抵消至多3人；仅作后续重游能力，不让终局获奖反向影响本场胜负。"};
export function personRole(id:string){
 if(NEW_PERSON_ROLES[id])return NEW_PERSON_ROLES[id];
 if(id==='hua')return '支援：实际减员后救回30%，冷却12秒';
 if(id==='lubu')return '随军：画戟双路穿刺，本主共鸣扩散';
 if(id==='dian')return '随军：双铁戟左右齐出，各穿透2人';
 if(id==='zhang')return '随军：蛇矛曲线连刺';if(id==='zhao')return '随军：长枪直刺';
 if(COMPANION_STYLE[id])return '随军：'+COMPANION_STYLE[id].label+(Object.values(WEAPON_DATA).some(w=>w.owner===id)?'，可与本主兵器共鸣':'');
 if(CHAPTERS.some(c=>c.allies.includes(id)))return '盟约：本主兵器伤害×1.5，无需上阵';
 if(CHAPTERS.some(c=>c.visit.includes(id)))return ['diao','xun','sunjian'].includes(id)?'支援：每12秒鼓舞援兵+2':'支援：每12秒自动策应';return '敌将：只交锋，不编入己方';
}

/** Explicit sourceActorId → weapon identity; no silent default for registered people. */
export const ACTOR_WEAPONS:Record<string,WeaponId>={"jiao":"spear","dong":"spear","yuan":"spear","hua":"spear","lubu":"huaji","diao":"spear","dian":"shuangji","xu":"guandao","cao":"yitian","liao":"huaji","xiahou":"guandao","guo":"spear","xun":"spear","sunjian":"spear","sunce":"spear","sunquan":"spear","lumeng":"spear","zhou":"spear","luxun":"guandao","sunxiang":"guding","zhao":"qinggang","zhang":"shemao","guan":"guandao","huang":"spear","liu":"shuanggu","zhuge":"liannu","sima":"spear","machao":"spear","pang":"spear","jiang":"shemao","taishici":"duanji","ganning":"tiesuodao","lusu":"liannu","zhanghe":"goulianqiang","caoren":"dundao","xiahouyuan":"yanlinggong","weiyan":"guandao","zhangren":"goulianqiang","dengai":"spear","huangyueying":"jiguannu","zhonghui":"yitian","lukang":"dundao"};
