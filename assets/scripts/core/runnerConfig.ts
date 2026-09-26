// Explicit prototype defaults adapted from the user's v2 evidence pack. Not original game formulas.
import type {RunnerLevel,RunnerRules} from './runner';
export const RUNNER_RULES:RunnerRules={"schemaVersion":1,"profileId":"runnerVideoV2","status":"IMPLEMENTATION_DEFAULTS_NOT_ORIGINAL_GAME_VALUES","basedOn":"user last-war-video-study.zip/玩法拆解.md + supplied visual frames","simulation":{"stepSeconds":0.016666666666666666,"playerForwardSpeed":1,"horizonWorldUnits":8,"legacyMaxSquadCount":256,"squadCapacityPolicy":"legalPathGuard","maxVisibleSquad":48,"maxEnemies":64,"maxLargeEnemies":1,"maxProjectiles":512,"maxChainTokens":24},"input":{"continuousLateral":true,"routeLock":false,"latMoveLimit":0.91,"retainCurrentTouchTuning":true},"gates":{"operations":["signedAdd"],"mutableDamageThreshold":true,"zeroStyle":"safeBlue","contactPolicy":"sweptVisibleFeetUnion","oneShotPerGate":true,"rowMutex":false,"resurrectAfterZero":false,"impactBeforeContactIfEarlier":true,"defaultMaxPositive":64,"defaultGrowthStrategy":"window"},"formation":{"minColumns":1,"maxColumns":7,"maxHalfWidthWorld":0.51,"memberFootRadiusWorld":0.025,"newMemberCollisionStartsNextStep":true},"equipment":[{"id":"standard","stage":0,"intervalSeconds":0.25,"damagePerUnit":1,"speed":9,"range":8,"directPiercingTargets":1,"splashRadius":0,"visual":"基础箭/窄枪芒/单刀气"},{"id":"repeater","stage":1,"intervalSeconds":0.2,"damagePerUnit":1,"speed":9,"range":8,"directPiercingTargets":1,"splashRadius":0,"visual":"连发军械与密集弹幕，士兵装备简化换装"},{"id":"explosive","stage":2,"intervalSeconds":0.45,"damagePerUnit":2.5,"speed":7.5,"range":8,"directPiercingTargets":1,"splashRadius":0.16,"visual":"实体火矢/军械弹与局部爆裂","splashAffects":["enemy","largeEnemy"],"splashDoesNotAffect":["mutableGate","rewardCrate","chainCrate"]}],"growth":{"source":"rewardCrate","killXp":false,"eliteAutoUpgrade":false,"oldAwakening":false,"oldTacticBonus":false,"resetEquipmentEachRun":true},"chain":{"tokenValue":1,"tokenSpacing":0.5,"minimumAhead":1.4,"maximumPerGenerator":12,"tokenShootable":false},"unverifiedDefaults":{"crateReward":"grantOnceOnBreak","crateContactDamage":0,"normalEnemyContactLoss":1,"normalEnemyAttackInterval":0.8,"contactGraceSeconds":0.2,"largeStageWin":"distanceReachedAndBossDefeated","dividers":"forwardTargetAreaOnlyWithOpenManeuverBand"},"audio":{"bgmEnabled":false,"reuseCurrentSfx":true,"rateLimitHits":true},"preserve":["localWork","uiAgentUpdates","safeAreas","permanentUnlocks","campaignTransitions","squadVolleyVisuals","worldSceneryContinuity"],"disableInProfile":["fixedMultiplyGates","branchEasyHard","kill30_80Upgrade","automaticTier3Awakening","hardWeaponLock","forcedBossMeleeArena","fakePercentileRanking"]};
export const RUNNER_LEVELS:RunnerLevel[]=[
  {
    "id": "trial-01",
    "title": "乱军突围",
    "scene": "山道",
    "sourceAnchors": [
      "00:08–00:38",
      "01:34–02:08",
      "08:24–09:08"
    ],
    "startCount": 1,
    "startEquipment": "standard",
    "routeEnd": 36,
    "objective": {
      "kind": "clearEnemies",
      "plannedEnemyCount": 50
    },
    "objects": [
      {
        "id": "l1.g0.left",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 6,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": -2,
        "damagePerPoint": 2,
        "maxPositive": 8
      },
      {
        "id": "l1.g0.right",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 6,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": 2,
        "damagePerPoint": 3,
        "maxPositive": 8
      },
      {
        "id": "l1.r0",
        "kind": "rewardCrate",
        "at": 10,
        "x": 0,
        "halfWidth": 0.18,
        "hp": 12,
        "reward": {
          "kind": "troops",
          "count": 3
        }
      },
      {
        "id": "l1.w0",
        "kind": "rewardCrate",
        "at": 13,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 16,
        "reward": {
          "kind": "equipment",
          "stage": 1
        }
      },
      {
        "id": "l1.g1",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 16,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": -12,
        "damagePerPoint": 4,
        "maxPositive": 4
      },
      {
        "id": "l1.r1",
        "kind": "rewardCrate",
        "at": 18,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 45,
        "reward": {
          "kind": "troops",
          "count": 6
        }
      },
      {
        "id": "l1.g2",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 23,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": -40,
        "damagePerPoint": 8,
        "maxPositive": 4
      },
      {
        "id": "l1.w1",
        "kind": "rewardCrate",
        "at": 24,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 85,
        "reward": {
          "kind": "equipment",
          "stage": 2
        }
      },
      {
        "id": "l1.r2",
        "kind": "rewardCrate",
        "at": 29,
        "x": 0,
        "halfWidth": 0.18,
        "hp": 120,
        "reward": {
          "kind": "troops",
          "count": 8
        }
      },
      {
        "id": "l1.g3",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 32,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": -70,
        "damagePerPoint": 12,
        "maxPositive": 4
      },
      {
        "id": "l1.r3",
        "kind": "rewardCrate",
        "at": 33,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 120,
        "reward": {
          "kind": "troops",
          "count": 5
        }
      }
    ],
    "enemyWaves": [
      {
        "id": "l1.e0",
        "spawnAt": 4,
        "count": 4,
        "formation": "scattered",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 3,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l1.e1",
        "spawnAt": 10,
        "count": 6,
        "formation": "column",
        "centerX": -0.3,
        "spawnAhead": 7.8,
        "hpEach": 3,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l1.e2",
        "spawnAt": 16,
        "count": 8,
        "formation": "wide",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 3,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l1.e3",
        "spawnAt": 21,
        "count": 10,
        "formation": "twoColumns",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l1.e4",
        "spawnAt": 26,
        "count": 12,
        "formation": "cluster",
        "centerX": 0.3,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l1.e5",
        "spawnAt": 30,
        "count": 9,
        "formation": "wide",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l1.named",
        "spawnAt": 30,
        "count": 1,
        "formation": "single",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 65,
        "approachSpeed": 0.3,
        "enemyKind": "namedCommander",
        "existingCastId": "xing_daorong"
      }
    ],
    "exitTransitionRole": "rally"
  },
  {
    "id": "trial-02",
    "title": "夺粮立营",
    "scene": "营寨",
    "sourceAnchors": [
      "00:52–01:23",
      "07:46–08:20",
      "09:12–09:44"
    ],
    "startCount": 1,
    "startEquipment": "standard",
    "routeEnd": 44,
    "objective": {
      "kind": "clearEnemies",
      "plannedEnemyCount": 120
    },
    "objects": [
      {
        "id": "l2.g0.left",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 5,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": -4,
        "damagePerPoint": 2,
        "maxPositive": 8
      },
      {
        "id": "l2.g0.right",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 5,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": 2,
        "damagePerPoint": 3,
        "maxPositive": 8
      },
      {
        "id": "l2.r0",
        "kind": "rewardCrate",
        "at": 9,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 16,
        "reward": {
          "kind": "troops",
          "count": 4
        }
      },
      {
        "id": "l2.w0",
        "kind": "rewardCrate",
        "at": 12,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 26,
        "reward": {
          "kind": "equipment",
          "stage": 1
        }
      },
      {
        "id": "l2.c0",
        "kind": "chainCrate",
        "at": 16,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 38,
        "reward": {
          "kind": "chain",
          "count": 6,
          "value": 1,
          "spacing": 0.5
        }
      },
      {
        "id": "l2.r1",
        "kind": "rewardCrate",
        "at": 19,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 80,
        "reward": {
          "kind": "troops",
          "count": 6
        }
      },
      {
        "id": "l2.w1",
        "kind": "rewardCrate",
        "at": 24,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 120,
        "reward": {
          "kind": "equipment",
          "stage": 2
        }
      },
      {
        "id": "l2.g1",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 25,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": -35,
        "damagePerPoint": 8,
        "maxPositive": 12
      },
      {
        "id": "l2.c1",
        "kind": "chainCrate",
        "at": 29,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 140,
        "reward": {
          "kind": "chain",
          "count": 8,
          "value": 1,
          "spacing": 0.5
        }
      },
      {
        "id": "l2.r2",
        "kind": "rewardCrate",
        "at": 32,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 220,
        "reward": {
          "kind": "troops",
          "count": 10
        }
      },
      {
        "id": "l2.g2",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 36,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": -90,
        "damagePerPoint": 15,
        "maxPositive": 12
      },
      {
        "id": "l2.r3",
        "kind": "rewardCrate",
        "at": 39,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 250,
        "reward": {
          "kind": "troops",
          "count": 6
        }
      }
    ],
    "dividers": [
      {
        "id": "l2.divider",
        "fromProgress": 9,
        "toProgress": 34,
        "halfWidth": 0.045,
        "aheadMin": 1.5,
        "aheadMax": 7.5,
        "openAtPlayer": true,
        "blocksProjectiles": true
      }
    ],
    "enemyWaves": [
      {
        "id": "l2.e0",
        "spawnAt": 4,
        "count": 8,
        "formation": "scattered",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 3,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l2.e1",
        "spawnAt": 10,
        "count": 12,
        "formation": "column",
        "centerX": -0.4,
        "spawnAhead": 7.8,
        "hpEach": 3,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l2.e2",
        "spawnAt": 16,
        "count": 18,
        "formation": "twoColumns",
        "centerX": -0.25,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l2.e3",
        "spawnAt": 22,
        "count": 22,
        "formation": "cluster",
        "centerX": -0.3,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l2.e4",
        "spawnAt": 29,
        "count": 26,
        "formation": "wide",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.45,
        "enemyKind": "grunt"
      },
      {
        "id": "l2.e5",
        "spawnAt": 34,
        "count": 33,
        "formation": "twoColumns",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 5,
        "approachSpeed": 0.45,
        "enemyKind": "grunt"
      },
      {
        "id": "l2.named",
        "spawnAt": 35,
        "count": 1,
        "formation": "single",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 160,
        "approachSpeed": 0.3,
        "enemyKind": "namedCommander",
        "existingCastId": "chen_ying"
      }
    ],
    "exitTransitionRole": "establish"
  },
  {
    "id": "trial-03",
    "title": "白石解围",
    "scene": "城门",
    "sourceAnchors": [
      "05:00–05:35",
      "09:48–11:23",
      "11:28–11:57"
    ],
    "startCount": 3,
    "startEquipment": "standard",
    "routeEnd": 56,
    "objective": {
      "kind": "distanceAndLargeEnemy",
      "bossId": "yang_ling",
      "bossHp": 1600
    },
    "objects": [
      {
        "id": "l3.g0.left",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 6,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": 2,
        "damagePerPoint": 5,
        "maxPositive": 8
      },
      {
        "id": "l3.g0.right",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 6,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": -6,
        "damagePerPoint": 3,
        "maxPositive": 8
      },
      {
        "id": "l3.r0",
        "kind": "rewardCrate",
        "at": 10,
        "x": 0,
        "halfWidth": 0.18,
        "hp": 35,
        "reward": {
          "kind": "troops",
          "count": 4
        }
      },
      {
        "id": "l3.w0",
        "kind": "rewardCrate",
        "at": 13,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 45,
        "reward": {
          "kind": "equipment",
          "stage": 1
        }
      },
      {
        "id": "l3.g1",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 17,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": -20,
        "damagePerPoint": 6,
        "maxPositive": 8
      },
      {
        "id": "l3.r1",
        "kind": "rewardCrate",
        "at": 20,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 100,
        "reward": {
          "kind": "troops",
          "count": 8
        }
      },
      {
        "id": "l3.r2",
        "kind": "rewardCrate",
        "at": 25,
        "x": -0.6,
        "halfWidth": 0.15,
        "hp": 180,
        "reward": {
          "kind": "troops",
          "count": 12
        }
      },
      {
        "id": "l3.ally0",
        "kind": "rewardCrate",
        "at": 30,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 240,
        "reward": {
          "kind": "fieldCompanion",
          "id": "zhao_yun_guest",
          "count": 1
        }
      },
      {
        "id": "l3.w1",
        "kind": "rewardCrate",
        "at": 25,
        "x": 0,
        "halfWidth": 0.15,
        "hp": 180,
        "reward": {
          "kind": "equipment",
          "stage": 2
        }
      },
      {
        "id": "l3.g2",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 25,
        "x": 0.6,
        "halfWidth": 0.2,
        "value": -100,
        "damagePerPoint": 14,
        "maxPositive": 8
      },
      {
        "id": "l3.c0",
        "kind": "chainCrate",
        "at": 32,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 200,
        "reward": {
          "kind": "chain",
          "count": 10,
          "value": 1,
          "spacing": 0.5
        }
      },
      {
        "id": "l3.r3",
        "kind": "rewardCrate",
        "at": 35,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 350,
        "reward": {
          "kind": "troops",
          "count": 14
        }
      },
      {
        "id": "l3.g3",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 39,
        "x": -0.48,
        "halfWidth": 0.4,
        "value": -180,
        "damagePerPoint": 24,
        "maxPositive": 8
      },
      {
        "id": "l3.w2",
        "kind": "rewardCrate",
        "at": 42,
        "x": 0.48,
        "halfWidth": 0.18,
        "hp": 500,
        "reward": {
          "kind": "equipment",
          "stage": 2
        }
      },
      {
        "id": "l3.r4",
        "kind": "rewardCrate",
        "at": 48,
        "x": -0.48,
        "halfWidth": 0.18,
        "hp": 620,
        "reward": {
          "kind": "troops",
          "count": 16
        }
      },
      {
        "id": "l3.g4",
        "kind": "mutableGate",
        "growthStrategy": "window",
        "at": 48,
        "x": 0.48,
        "halfWidth": 0.4,
        "value": -280,
        "damagePerPoint": 40,
        "maxPositive": 8
      }
    ],
    "enemyWaves": [
      {
        "id": "l3.e0",
        "spawnAt": 3,
        "count": 8,
        "formation": "scattered",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 3,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l3.e1",
        "spawnAt": 9,
        "count": 12,
        "formation": "column",
        "centerX": 0.3,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l3.e2",
        "spawnAt": 15,
        "count": 18,
        "formation": "wide",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 4,
        "approachSpeed": 0.35,
        "enemyKind": "grunt"
      },
      {
        "id": "l3.e3",
        "spawnAt": 21,
        "count": 22,
        "formation": "twoColumns",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 5,
        "approachSpeed": 0.45,
        "enemyKind": "grunt"
      },
      {
        "id": "l3.e4",
        "spawnAt": 28,
        "count": 26,
        "formation": "cluster",
        "centerX": 0.25,
        "spawnAhead": 7.8,
        "hpEach": 5,
        "approachSpeed": 0.45,
        "enemyKind": "grunt"
      },
      {
        "id": "l3.e5",
        "spawnAt": 35,
        "count": 24,
        "formation": "twoColumns",
        "centerX": 0,
        "spawnAhead": 7.8,
        "hpEach": 6,
        "approachSpeed": 0.45,
        "enemyKind": "grunt"
      }
    ],
    "largeEnemy": {
      "spawnAt": 34,
      "enterAhead": 7.5,
      "minimumCombatAhead": 4.5,
      "hp": 1600,
      "countInOrdinaryCounter": false,
      "finishOnlyAtRouteEnd": true,
      "attackProfile": "reuseVisibleForwardWeaponAttackNoForcedDuel"
    },
    "exitTransitionRole": "garrison"
  }
];

// FIX2 guard proof: current legal mutable gates are passed before forward motion
// stops. 12 s bounds range + deepest 48-agent row + swept/expiry margins.
export const RUNNER_GATE_WINDOW_BOUND_SECONDS=Math.ceil(Math.max(...RUNNER_RULES.equipment.map(e=>e.range))+2.75+.15+Math.max(...RUNNER_RULES.equipment.map(e=>e.speed))/60+.05);
export const RUNNER_CAPACITY_PROOF=RUNNER_LEVELS.map(level=>{
 const gates=level.objects.filter(o=>o.kind==='mutableGate'),minimumInterval=Math.min(...RUNNER_RULES.equipment.map(e=>e.intervalSeconds));
 if(gates.some(g=>g.at+2.9>=level.routeEnd))throw Error('Mutable gate can survive route stop; re-audit finite growth window');
 const scheduled=Math.ceil(RUNNER_GATE_WINDOW_BOUND_SECONDS/minimumInterval)+1;
 const contactReplacements=Math.ceil(RUNNER_GATE_WINDOW_BOUND_SECONDS/.2)+1;
 const slotShotBound=scheduled+contactReplacements+level.objects.length;
 const damagePerCountBound=slotShotBound*Math.max(...RUNNER_RULES.equipment.map(e=>e.damagePerUnit))*1.5;
 const seed=level.startCount+gates.reduce((n,g)=>n+Math.max(0,g.value??0),0)+level.objects.reduce((n,o)=>n+(o.reward?.count??0),0);
 const countBound=gates.reduce((n,g)=>Math.ceil(n*(1+damagePerCountBound/(g.damagePerPoint??2))),seed);
 return{level:level.id,seed,slotShotBound,damagePerCountBound,countBound};
});
export const RUNNER_NUMERIC_LIMIT=Math.pow(2,Math.ceil(Math.log2(Math.max(...RUNNER_CAPACITY_PROOF.map(p=>p.countBound))*2)));
if(!Number.isSafeInteger(RUNNER_NUMERIC_LIMIT*4))throw Error('Runner guard exceeds exact arithmetic budget; re-audit legal paths');
(RUNNER_RULES.simulation as {maxSquadCount:number}).maxSquadCount=RUNNER_NUMERIC_LIMIT;
