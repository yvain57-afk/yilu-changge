"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormalStore = exports.FORMAL_KEY = void 0;
const data_1 = require("./data");
exports.FORMAL_KEY = 'yilu-changge-formal-v2';
const fresh = () => ({ schemaVersion: 2, cleared: [], best: {}, claimed: [], weapons: ['spear'], weaponLevels: { spear: 1 }, captures: [], visits: [], allies: [], treasures: [], companions: [], support: null, slots: { dian: null, qi: null, ma: null }, xp: 0, seen: [] });
const uniq = (v) => Array.isArray(v) ? Array.from(new Set(v.filter((x) => typeof x === 'string'))) : [];
class FormalStore {
    constructor(storage) {
        this.storage = storage;
        this.data = fresh();
        this.notice = '';
        this.blocked = false;
        try {
            const raw = storage.getItem(exports.FORMAL_KEY);
            if (raw !== null) {
                const p = JSON.parse(raw);
                if (p.schemaVersion !== 2 || !Array.isArray(p.cleared) || !p.slots)
                    throw Error('invalid formal save');
                this.data = { ...fresh(), ...p };
                for (const k of ['cleared', 'claimed', 'weapons', 'captures', 'visits', 'allies', 'treasures', 'companions', 'seen'])
                    this.data[k] = uniq(p[k]);
                this.data.slots = { ...fresh().slots, ...p.slots };
                this.data.best = { ...p.best };
                this.data.weaponLevels = { ...p.weaponLevels };
                if (!Number.isFinite(this.data.xp) || this.data.xp < 0)
                    throw Error('invalid XP');
            }
            else {
                const legacy = {};
                for (const key of ['yilu-changge-v1', 'yilu-changge-prototype-v2', 'yilu-changge-growth-v05', 'yilu-changge-campaign-v04', 'yilu-changge-tactics-v06']) {
                    const value = storage.getItem(key);
                    if (value !== null)
                        legacy[key] = value;
                }
                if (Object.keys(legacy).length) {
                    if (!storage.getItem(exports.FORMAL_KEY + '-legacy-backup'))
                        storage.setItem(exports.FORMAL_KEY + '-legacy-backup', JSON.stringify(legacy));
                    this.data.legacy = legacy; /* Old records retain their identities and scores. No cross-mode reward fabrication. */
                }
            }
        }
        catch {
            this.blocked = true;
            this.notice = '记录读取失败：原记录保留，请重试读取。';
        }
    }
    get completed() { let n = 0; while (n < 10 && this.data.cleared.includes(data_1.CHAPTERS[n].id))
        n++; return n; }
    unlocked(i) { return Number.isInteger(i) && i >= 0 && i < 10 && i <= this.completed; }
    get companionLimit() { return this.completed >= 3 ? 2 : 1; }
    slotOpen(slot) { return this.completed >= ({ dian: 1, qi: 2, ma: 3 }[slot]); }
    loadout() { const d = this.data; return { tactic: d.mainTactic === 'zhenjun' ? 'zhenjun' : 'guanzhen', companions: d.companions.filter(x => d.captures.includes(x) && data_1.PEOPLE[x]).slice(0, this.companionLimit), support: this.completed >= 2 && d.visits.includes(d.support || '') ? d.support : null, allies: d.allies.filter(x => data_1.PEOPLE[x]), treasures: Object.fromEntries(['dian', 'qi', 'ma'].map(k => [k, this.slotOpen(k) && d.treasures.includes(d.slots[k] || '') && data_1.TREASURES[d.slots[k]]?.slot === k ? d.slots[k] : null])), weapons: d.weapons.filter(x => data_1.WEAPON_DATA[x]), treasurePool: d.treasures.filter(x => data_1.TREASURES[x]), weaponLevels: { ...d.weaponLevels } }; }
    save() { if (this.blocked)
        return false; try {
        this.storage.setItem(exports.FORMAL_KEY, JSON.stringify(this.data));
        this.notice = '';
        return true;
    }
    catch {
        this.notice = '保存失败，成长仍保留在本次会话；请重试保存。';
        return false;
    } }
    retry() { if (this.blocked) {
        const next = new FormalStore(this.storage);
        if (next.blocked) {
            this.notice = next.notice;
            return false;
        }
        this.data = next.data;
        this.blocked = false;
    } return this.save(); }
    equipTactic() { this.data.mainTactic = this.data.mainTactic === 'zhenjun' ? 'guanzhen' : 'zhenjun'; return this.save(); }
    equipCompanion(id) { if (!this.data.captures.includes(id))
        return false; const a = this.data.companions; if (a.includes(id))
        this.data.companions = a.filter(x => x !== id);
    else
        this.data.companions = [...a.slice(-(this.companionLimit - 1) || a.length), id].slice(-this.companionLimit); return this.save(); }
    equipSupport(id) { if (this.completed < 2 || !this.data.visits.includes(id))
        return false; this.data.support = this.data.support === id ? null : id; return this.save(); }
    equipTreasure(id) { const t = data_1.TREASURES[id]; if (!t || !this.slotOpen(t.slot) || !this.data.treasures.includes(id))
        return false; this.data.slots[t.slot] = this.data.slots[t.slot] === id ? null : id; return this.save(); }
    upgrade(id) { if (!this.data.weapons.includes(id))
        return false; const n = this.data.weaponLevels[id] || 1, cost = data_1.TUNING.upgradeCost(n); if (n >= data_1.TUNING.weaponMaxLevel || this.data.xp < cost)
        return false; this.data.xp -= cost; this.data.weaponLevels[id] = n + 1; return this.save(); }
    settle(run) {
        var _a, _b;
        if (this.blocked || this.data.claimed.includes('run:' + run.id))
            return false;
        const c = data_1.CHAPTERS[run.chapter];
        if (!c || !this.unlocked(run.chapter) || !Number.isFinite(run.troops) || run.troops < 0 || (run.won && run.troops < 1))
            return false;
        this.data.claimed.push('run:' + run.id);
        if (!run.won)
            return this.save();
        const first = !this.data.cleared.includes(c.id);
        this.data.best[c.id] = Math.max(this.data.best[c.id] || 0, Math.floor(run.troops));
        this.data.xp += first ? data_1.TUNING.clearXP : data_1.TUNING.replayXP;
        if (first) {
            this.data.cleared.push(c.id);
            this.data.captures = uniq([...this.data.captures, ...c.capture]);
            this.data.visits = uniq([...this.data.visits, ...c.visit]);
            this.data.allies = uniq([...this.data.allies, ...c.allies]);
            this.data.seen = uniq([...this.data.seen, c.boss, ...c.enemy, ...c.capture, ...c.visit, ...c.allies]);
            if (c.weapon) {
                this.data.weapons = uniq([...this.data.weapons, c.weapon]);
                (_a = this.data.weaponLevels)[_b = c.weapon] ?? (_a[_b] = 1);
            }
            if (c.treasure)
                this.data.treasures = uniq([...this.data.treasures, c.treasure]);
        }
        this.data.treasures = uniq([...this.data.treasures, ...run.treasures.filter(x => data_1.TREASURES[x] && this.data.treasures.includes(x))]);
        return this.save();
    }
}
exports.FormalStore = FormalStore;
