"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TUNING = exports.RANKS = exports.CHAPTERS = exports.TREASURES = exports.PEOPLE = exports.WEAPON_DATA = void 0;
exports.routeFor = routeFor;
exports.WEAPON_DATA = {
    spear: { label: '长枪', owner: null, cycle: .62, wind: .14, rel: .10, rec: .22, color: '#DDE6F0', family: 'spear' },
    guandao: { label: '偃月刀', owner: 'guan', cycle: 1.08, wind: .36, rel: .12, rec: .34, color: '#9FE0B8', family: 'guandao' },
    shemao: { label: '蛇矛', owner: 'zhang', cycle: .56, wind: .10, rel: .20, rec: .16, color: '#F0D38A', family: 'shemao' },
    huaji: { label: '方天画戟', owner: 'lubu', cycle: .86, wind: .22, rel: .14, rec: .26, color: '#F2A57A', family: 'huaji' },
    guding: { label: '古锭刀', owner: 'sunxiang', cycle: .88, wind: .24, rel: .12, rec: .30, color: '#F4AF64', family: 'guandao' },
    shuangji: { label: '双铁戟', owner: 'dian', cycle: .86, wind: .22, rel: .14, rec: .26, color: '#D9B997', family: 'huaji' },
    yitian: { label: '倚天剑', owner: 'cao', cycle: .72, wind: .18, rel: .12, rec: .24, color: '#BECFFF', family: 'spear' },
    qinggang: { label: '青釭剑', owner: 'zhao', cycle: .62, wind: .14, rel: .10, rec: .22, color: '#AEEAF2', family: 'spear' },
    shuanggu: { label: '双股剑', owner: 'liu', cycle: .68, wind: .14, rel: .20, rec: .18, color: '#D7E6AE', family: 'shemao' },
    liannu: { label: '诸葛连弩', owner: 'zhuge', cycle: .72, wind: .12, rel: .30, rec: .14, color: '#B6DFB6', family: 'shemao' }
};
exports.PEOPLE = { jiao: '张角', dong: '董卓', yuan: '袁绍', hua: '华佗', lubu: '吕布', diao: '貂蝉', dian: '典韦', xu: '许褚', cao: '曹操', liao: '张辽', xiahou: '夏侯惇', guo: '郭嘉', xun: '荀彧', sunjian: '孙坚', sunce: '孙策', sunquan: '孙权', lumeng: '吕蒙', zhou: '周瑜', luxun: '陆逊', sunxiang: '孙尚香', zhao: '赵云', zhang: '张飞', guan: '关羽', huang: '黄忠', liu: '刘备', zhuge: '诸葛亮', sima: '司马懿', machao: '马超', pang: '庞统', jiang: '姜维' };
exports.TREASURES = {
    taiping: { name: '太平要术', slot: 'dian', icon: 'g_tr_taiping', ch: '术', effect: '援兵门额外 +10%，至少 +1' },
    mengde: { name: '孟德新书', slot: 'dian', icon: 'g_tr_mengde', ch: '书', effect: '每 20 秒抵消下一次伏兵门一半减员' },
    qingnang: { name: '青囊书', slot: 'dian', icon: 'g_tr_qingnang', ch: '囊', effect: '医者支援救回比例增加 10 个百分点' },
    yuxi: { name: '传国玉玺', slot: 'qi', icon: 'g_tr_yuxi', ch: '玺', effect: '开局兵力 +20%，每局一次' },
    qixing: { name: '七星灯', slot: 'qi', icon: 'g_tr_qixing', ch: '灯', effect: '归零时保住 5 人，每局一次' },
    muniu: { name: '木牛流马', slot: 'qi', icon: 'g_tr_muniu', ch: '牛', effect: '粮车援兵 +50%' },
    chitu: { name: '赤兔马', slot: 'ma', icon: 'g_tr_chitu', ch: '赤', effect: '横移速度 ×1.25' },
    dilu: { name: '的卢', slot: 'ma', icon: 'g_tr_dilu', ch: '卢', effect: '敌将攻击带边缘自动闪避，冷却 15 秒' }
};
exports.CHAPTERS = [
    { id: 'c01', title: '黄巾初阵', place: '广宗', faction: '群雄', boss: 'jiao', enemy: [], capture: [], visit: [], allies: [], treasure: 'taiping', length: 210, bossHP: 70 },
    { id: 'c02', title: '讨董联军', place: '虎牢', faction: '群雄', boss: 'dong', enemy: [], capture: [], visit: ['hua', 'sunjian'], allies: ['yuan'], weapon: 'guding', treasure: 'yuxi', length: 224, bossHP: 80 },
    { id: 'c03', title: '白门收戟', place: '下邳', faction: '群雄', boss: 'lubu', enemy: [], capture: ['lubu'], visit: ['diao'], allies: [], weapon: 'huaji', treasure: 'chitu', length: 238, bossHP: 100 },
    { id: 'c04', title: '帐前双戟', place: '宛城', faction: '魏', boss: 'dian', enemy: ['xu'], capture: ['dian', 'xu'], visit: ['xun'], allies: [], weapon: 'shuangji', length: 244, bossHP: 105 },
    { id: 'c05', title: '魏武会盟', place: '官渡', faction: '魏', boss: 'cao', enemy: ['xiahou', 'liao'], capture: ['liao', 'xiahou'], visit: ['guo'], allies: ['cao'], weapon: 'yitian', treasure: 'mengde', length: 252, bossHP: 110 },
    { id: 'c06', title: '江东破阵', place: '曲阿', faction: '吴', boss: 'sunce', enemy: ['lumeng'], capture: ['lumeng'], visit: [], allies: ['sunce'], weapon: 'shemao', length: 260, bossHP: 115 },
    { id: 'c07', title: '赤壁风火', place: '赤壁', faction: '吴', boss: 'zhou', enemy: ['luxun'], capture: ['sunxiang', 'luxun'], visit: ['zhou'], allies: ['sunquan'], weapon: 'qinggang', treasure: 'muniu', length: 268, bossHP: 120 },
    { id: 'c08', title: '长坂同袍', place: '长坂', faction: '蜀', boss: 'zhang', enemy: ['zhao'], capture: ['zhao', 'zhang'], visit: [], allies: [], weapon: 'guandao', treasure: 'dilu', length: 276, bossHP: 125 },
    { id: 'c09', title: '荆襄归心', place: '荆州', faction: '蜀', boss: 'guan', enemy: ['huang'], capture: ['guan', 'huang'], visit: [], allies: [], weapon: 'shuanggu', treasure: 'qingnang', length: 284, bossHP: 130 },
    { id: 'c10', title: '隆中长歌', place: '隆中', faction: '蜀', boss: 'zhuge', enemy: ['pang', 'machao'], capture: ['machao', 'jiang'], visit: ['zhuge', 'pang', 'sima'], allies: ['liu'], weapon: 'liannu', treasure: 'qixing', length: 292, bossHP: 135 }
];
exports.RANKS = ['乡勇', '什长', '屯长', '军侯', '司马', '校尉', '中郎将', '将军', '列侯', '王'];
exports.TUNING = { version: 'formal-20260927.1', startTroops: 30, tier: [1, 1.35, 1.75], overflow: 4, weaponMaxLevel: 5, weaponLevelDamage: .12, upgradeCost: (level) => level * 60, clearXP: 30, replayXP: 10, gateHitStep: 1, gateHitWindow: 30, gateSafetyLimit: 9999 };
/** Finite authored route, seeded per chapter; all crate contents must come from unlocked pools. */
function routeFor(chapter, weapons, treasures) {
    const l = exports.CHAPTERS[chapter], pool = weapons.filter(w => w !== 'spear'), w = pool[Math.min(chapter, pool.length - 1)] || 'spear';
    const route = [{ d: 14, type: 'squad', x: -.45, n: 5 + chapter }, { d: 30, type: 'crate', x: .45, kind: 'weapon', gives: 'spear' }, { d: 30, type: 'crate', x: -.5, kind: 'grain' },
        { d: 50, type: 'gates', vals: [12, -8] }, { d: 68, type: 'crate', x: 0, kind: 'arms' }, { d: 83, type: 'wall', len: 23, side: chapter % 2 ? -1 : 1 },
        { d: 92, type: 'squad', x: chapter % 2 ? .5 : -.5, n: 6 + chapter }, { d: 115, type: 'crate', x: 0, kind: 'weapon', gives: w },
        { d: 132, type: 'gates', vals: [-12, 6] }, { d: 149, type: 'crate', x: 0, kind: 'weapon', gives: w }, { d: 168, type: 'crate', x: 0, kind: 'arms' },
        { d: 185, type: 'gates', vals: [1, -5], fixed: true }, { d: 190, type: 'gates', vals: [1, -5], fixed: true }, { d: 195, type: 'gates', vals: [1, -5], fixed: true }];
    if (treasures.length)
        route.push({ d: 122, type: 'crate', x: -.5, kind: 'treasure', gives: treasures[(chapter + treasures.length - 1) % treasures.length] });
    if (chapter === 1)
        route.push({ d: 162, type: 'cameo', x: 1.1, person: 'lubu' });
    if (chapter === 8)
        ['xing', 'chen', 'yang'].forEach((person, i) => route.push({ d: 213 + i * 17, type: 'cameo', x: i % 2 ? -1.15 : 1.15, person }));
    if (chapter > 1)
        route.push({ d: 207, type: 'crate', x: 0, kind: 'weapon', gives: w });
    l.enemy.forEach((person, i) => route.push({ d: 155 + i * 40, type: 'officer', x: i % 2 ? .48 : -.48, person, n: 1 }));
    for (let d = 217; d < l.length - 8; d += 20)
        route.push({ d, type: 'squad', x: d % 3 ? .4 : -.4, n: 5 + chapter });
    return route.sort((a, b) => a.d - b.d);
}
