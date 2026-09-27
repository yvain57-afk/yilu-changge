import { Level } from './model';
// v0.3: three complete levels, guarded by contiguous progress and ready resources.
export const PLAYABLE_LEVELS = 3;
export const LEGACY_LEVELS: Level[] = [
  {
    "id": "trial-01",
    "title": "拉起队伍",
    "scene": "山道",
    "rankBefore": "布衣",
    "rankAfter": "头领",
    "duration": 42,
    "start": 8,
    "bossHP": 650,
    "bossName": "投矛头目",
    "bossDelay": 2.0,
    "bossAttacks": [
      {
        "kind": "aimed",
        "telegraphSeconds": 1.4,
        "halfWidth": 0.22,
        "loss": 6,
        "impactSeconds": 0.12,
        "recoverySeconds": 1.5
      }
    ],
    "rows": [
      {
        "id": 1,
        "at": 6,
        "left": {
          "kind": "add",
          "value": 12
        },
        "right": {
          "kind": "double",
          "value": 2
        }
      },
      {
        "id": 2,
        "at": 18,
        "left": {
          "kind": "double",
          "value": 2
        },
        "right": {
          "kind": "add",
          "value": 24
        }
      },
      {
        "id": 3,
        "at": 34,
        "left": {
          "kind": "add",
          "value": 12
        },
        "right": {
          "kind": "double",
          "value": 2
        }
      }
    ],
    "obstacles": [
      {
        "id": 1,
        "at": 11,
        "x": 0,
        "width": 0.2,
        "kind": "fighter",
        "hp": 12,
        "loss": 4
      },
      {
        "id": 2,
        "at": 14,
        "x": 0.5,
        "width": 0.2,
        "kind": "rock",
        "hp": 1,
        "loss": 6
      },
      {
        "id": 3,
        "at": 24,
        "x": -0.5,
        "width": 0.2,
        "kind": "fighter",
        "hp": 26,
        "loss": 6
      },
      {
        "id": 4,
        "at": 27,
        "x": 0.5,
        "width": 0.2,
        "kind": "fighter",
        "hp": 30,
        "loss": 6
      },
      {
        "id": 5,
        "at": 38,
        "x": 0,
        "width": 0.2,
        "kind": "fighter",
        "hp": 40,
        "loss": 8
      },
      {
        "id": 102,
        "at": 34,
        "x": 0.5,
        "width": 0.5,
        "kind": "wood",
        "hp": 80,
        "loss": 18,
        "rowId": 3,
        "side": "right"
      }
    ],
    "opening": "先打出自己的旗号。",
    "ending": "有队伍了。下一战，拿下一座营寨。"
  },
  {
    "id": "trial-02",
    "title": "拿下营寨",
    "scene": "营寨",
    "rankBefore": "头领",
    "rankAfter": "统领",
    "duration": 54,
    "start": 12,
    "bossHP": 1800,
    "bossName": "营寨弩将",
    "bossDelay": 2.0,
    "bossAttacks": [
      {
        "kind": "fixed",
        "x": -0.6,
        "telegraphSeconds": 1.25,
        "halfWidth": 0.33,
        "loss": 8,
        "impactSeconds": 0.12,
        "recoverySeconds": 1.25
      },
      {
        "kind": "fixed",
        "x": 0.6,
        "telegraphSeconds": 1.25,
        "halfWidth": 0.33,
        "loss": 8,
        "impactSeconds": 0.12,
        "recoverySeconds": 1.25
      },
      {
        "kind": "fixed",
        "x": 0,
        "telegraphSeconds": 1.25,
        "halfWidth": 0.33,
        "loss": 8,
        "impactSeconds": 0.12,
        "recoverySeconds": 1.25
      }
    ],
    "rows": [
      {
        "id": 1,
        "at": 5,
        "left": {
          "kind": "add",
          "value": 16
        },
        "right": {
          "kind": "double",
          "value": 2
        }
      },
      {
        "id": 2,
        "at": 17,
        "left": {
          "kind": "double",
          "value": 2
        },
        "right": {
          "kind": "add",
          "value": 20
        }
      },
      {
        "id": 3,
        "at": 31,
        "left": {
          "kind": "add",
          "value": 24
        },
        "right": {
          "kind": "double",
          "value": 2
        }
      },
      {
        "id": 4,
        "at": 45,
        "left": {
          "kind": "double",
          "value": 2
        },
        "right": {
          "kind": "add",
          "value": 32
        }
      }
    ],
    "obstacles": [
      {
        "id": 1,
        "at": 11,
        "x": 0,
        "width": 0.2,
        "kind": "fighter",
        "hp": 24,
        "loss": 5
      },
      {
        "id": 2,
        "at": 12,
        "x": -0.5,
        "width": 0.2,
        "kind": "rock",
        "hp": 1,
        "loss": 8
      },
      {
        "id": 3,
        "at": 25,
        "x": 0.5,
        "width": 0.2,
        "kind": "crossbowman",
        "hp": 72,
        "loss": 10,
        "attack": {
          "kind": "aimed",
          "startAt": 23,
          "telegraphSeconds": 1.25,
          "halfWidth": 0.22,
          "loss": 8,
          "impactSeconds": 0.12,
          "recoverySeconds": 0
        }
      },
      {
        "id": 4,
        "at": 35,
        "x": 0,
        "width": 0.2,
        "kind": "fighter",
        "hp": 100,
        "loss": 10
      },
      {
        "id": 5,
        "at": 38,
        "x": 0.5,
        "width": 0.2,
        "kind": "rock",
        "hp": 1,
        "loss": 12
      },
      {
        "id": 6,
        "at": 40,
        "x": -0.5,
        "width": 0.2,
        "kind": "crossbowman",
        "hp": 112,
        "loss": 12,
        "attack": {
          "kind": "aimed",
          "startAt": 38,
          "telegraphSeconds": 1.25,
          "halfWidth": 0.22,
          "loss": 10,
          "impactSeconds": 0.12,
          "recoverySeconds": 0
        }
      },
      {
        "id": 7,
        "at": 49,
        "x": 0.5,
        "width": 0.2,
        "kind": "fighter",
        "hp": 130,
        "loss": 12
      },
      {
        "id": 101,
        "at": 17,
        "x": -0.5,
        "width": 0.5,
        "kind": "wood",
        "hp": 64,
        "loss": 5,
        "rowId": 2,
        "side": "left"
      },
      {
        "id": 103,
        "at": 45,
        "x": -0.5,
        "width": 0.5,
        "kind": "wood",
        "hp": 180,
        "loss": 48,
        "rowId": 4,
        "side": "left"
      }
    ],
    "opening": "打穿营门，换上你的旗。",
    "ending": "营寨拿下了。下一战，城门。"
  },
  {
    "id": "trial-03",
    "title": "夺下首城",
    "scene": "城门",
    "rankBefore": "统领",
    "rankAfter": "城主",
    "duration": 66,
    "start": 16,
    "bossHP": 2600,
    "bossName": "守城主将",
    "bossDelay": 2.0,
    "bossAttacks": [
      {
        "kind": "aimed",
        "telegraphSeconds": 1.25,
        "halfWidth": 0.24,
        "loss": 10,
        "impactSeconds": 0.12,
        "recoverySeconds": 1.4
      },
      {
        "kind": "fixed",
        "x": -0.6,
        "telegraphSeconds": 1.15,
        "halfWidth": 0.33,
        "loss": 10,
        "impactSeconds": 0.12,
        "recoverySeconds": 0.4
      },
      {
        "kind": "fixed",
        "x": 0.6,
        "telegraphSeconds": 1.15,
        "halfWidth": 0.33,
        "loss": 10,
        "impactSeconds": 0.12,
        "recoverySeconds": 1.6
      }
    ],
    "rows": [
      {
        "id": 1,
        "at": 6,
        "left": {
          "kind": "add",
          "value": 18
        },
        "right": {
          "kind": "double",
          "value": 2
        }
      },
      {
        "id": 2,
        "at": 22,
        "left": {
          "kind": "double",
          "value": 2
        },
        "right": {
          "kind": "add",
          "value": 26
        }
      },
      {
        "id": 3,
        "at": 40,
        "left": {
          "kind": "add",
          "value": 36
        },
        "right": {
          "kind": "double",
          "value": 2
        }
      },
      {
        "id": 4,
        "at": 57,
        "left": {
          "kind": "double",
          "value": 2
        },
        "right": {
          "kind": "add",
          "value": 40
        }
      }
    ],
    "obstacles": [
      {
        "id": 1,
        "at": 12,
        "x": -0.5,
        "width": 0.2,
        "kind": "fighter",
        "hp": 28,
        "loss": 8
      },
      {
        "id": 2,
        "at": 16,
        "x": 0.5,
        "width": 0.2,
        "kind": "rock",
        "hp": 1,
        "loss": 10
      },
      {
        "id": 3,
        "at": 29,
        "x": 0.5,
        "width": 0.2,
        "kind": "crossbowman",
        "hp": 112,
        "loss": 12,
        "attack": {
          "kind": "aimed",
          "startAt": 27,
          "telegraphSeconds": 1.25,
          "halfWidth": 0.22,
          "loss": 12,
          "impactSeconds": 0.12,
          "recoverySeconds": 0
        }
      },
      {
        "id": 4,
        "at": 34,
        "x": 0,
        "width": 0.2,
        "kind": "fighter",
        "hp": 120,
        "loss": 14
      },
      {
        "id": 5,
        "at": 48,
        "x": -0.5,
        "width": 0.2,
        "kind": "crossbowman",
        "hp": 160,
        "loss": 12,
        "attack": {
          "kind": "aimed",
          "startAt": 46,
          "telegraphSeconds": 1.25,
          "halfWidth": 0.22,
          "loss": 12,
          "impactSeconds": 0.12,
          "recoverySeconds": 0
        }
      },
      {
        "id": 6,
        "at": 52,
        "x": 0.5,
        "width": 0.2,
        "kind": "crossbowman",
        "hp": 180,
        "loss": 14,
        "attack": {
          "kind": "aimed",
          "startAt": 50,
          "telegraphSeconds": 1.25,
          "halfWidth": 0.22,
          "loss": 12,
          "impactSeconds": 0.12,
          "recoverySeconds": 0
        }
      },
      {
        "id": 7,
        "at": 62,
        "x": 0.5,
        "width": 0.2,
        "kind": "fighter",
        "hp": 200,
        "loss": 16
      },
      {
        "id": 101,
        "at": 22,
        "x": -0.5,
        "width": 0.5,
        "kind": "wood",
        "hp": 100,
        "loss": 12,
        "rowId": 2,
        "side": "left"
      },
      {
        "id": 102,
        "at": 40,
        "x": 0.5,
        "width": 0.5,
        "kind": "wood",
        "hp": 120,
        "loss": 24,
        "rowId": 3,
        "side": "right"
      },
      {
        "id": 103,
        "at": 57,
        "x": -0.5,
        "width": 0.5,
        "kind": "wood",
        "hp": 240,
        "loss": 56,
        "rowId": 4,
        "side": "left"
      }
    ],
    "opening": "打败守将，拿下第一座城。",
    "ending": "首城已得。登基之路，刚刚开始。"
  }
];

// v04 presentation overlay; stable IDs, gate rules, HP and timing retained.
import { CAMPAIGN } from './campaignData';
LEGACY_LEVELS.forEach((l,i)=>{const c=CAMPAIGN.levels[i];l.title=c.title;l.scene=c.location;l.bossName=c.bossName;l.rankBefore=CAMPAIGN.rankLabels[i];l.rankAfter=CAMPAIGN.rankLabels[i+1];l.opening=c.opening.map(v=>v.speaker+'：'+v.line).join('\n');l.ending=c.ending;});
LEGACY_LEVELS[0].obstacles.unshift({id:901,at:3,x:0,width:.20,kind:'fighter',hp:14,loss:4});

// v05 fixed elite bindings. Original object positions / HP / gates are unchanged.
import { CAST, CastId } from './weapons';
const bosses:CastId[]=['xing_daorong','chen_ying','yang_ling'];
LEGACY_LEVELS.forEach((l,i)=>{l.bossId=bosses[i];l.bossName=CAST[bosses[i]].name;l.scene=CAST[bosses[i]].region;l.eliteIds=[[1,3],[1,4],[1,4]][i];});
const base0=LEGACY_LEVELS[0].bossAttacks[0],base1=LEGACY_LEVELS[1].bossAttacks[0],base2=LEGACY_LEVELS[2].bossAttacks[0];
LEGACY_LEVELS[0].bossAttacks=[{...base0,weaponId:'great_axe',profile:'axe_sweep',halfWidth:.28},{...base0,weaponId:'great_axe',profile:'axe_ground_wave',halfWidth:.20}];
LEGACY_LEVELS[1].bossAttacks=[{...base1,kind:'aimed',weaponId:'throwing_fork',profile:'single_fork',halfWidth:.18},{...base1,weaponId:'throwing_fork',profile:'staggered_fork',x:-.45,halfWidth:.18,recoverySeconds:.4},{...base1,weaponId:'throwing_fork',profile:'staggered_fork',x:.45,halfWidth:.18},{...base1,kind:'aimed',weaponId:'throwing_fork',profile:'close_fork_thrust',halfWidth:.20}];
LEGACY_LEVELS[2].bossAttacks=[{...base2,weaponId:'spear',profile:'step_thrust',halfWidth:.18},{...base2,weaponId:'spear',profile:'lance_wave',halfWidth:.16}];

import {HORDE_LEVELS} from './hordeConfig';
/** Old gameplay remains an explicit diagnostic fixture; shipping uses the horde profile. */
LEGACY_LEVELS.forEach(l=>l.profile='legacy-v051');
export const V06_LEVELS:Level[]=LEGACY_LEVELS.map(l=>{const horde=HORDE_LEVELS.find(h=>h.id===l.id)!;return {...l,profile:'horde-v06',horde,title:horde.title,start:horde.startArmy,duration:horde.runDuration,rows:[],obstacles:[],eliteIds:[]};});

// v0.7: manual aiming earns every reinforcement. Keep prior profiles for regression.
import {assaultPlan} from './assault';
export const V07_LEVELS:Level[]=V06_LEVELS.map((l,index)=>{
 const horde=JSON.parse(JSON.stringify(l.horde)) as typeof HORDE_LEVELS[number];
 horde.shootableSupplies=true;
 for(const f of horde.forks){f.routes.safe.exitReinforcements=0;f.routes.hard.exitReinforcements=0;}
 return {...l,profile:'assault-v07',horde,assault:assaultPlan(index,horde.forks.map(f=>f.commitAt))};
});

// v0.8 shipping profile: one road, individual shots, reward-led equipment.
import {RUNNER_LEVELS} from './runnerConfig';
export const LEVELS:Level[]=LEGACY_LEVELS.map((l,i)=>({...l,profile:'runnerVideoV2',runner:RUNNER_LEVELS[i],start:RUNNER_LEVELS[i].startCount,duration:RUNNER_LEVELS[i].routeEnd,bossHP:RUNNER_LEVELS[i].largeEnemy?.hp??0,rows:[],obstacles:[],eliteIds:[]}));
