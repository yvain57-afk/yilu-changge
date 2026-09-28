// v0.6 package configuration, imported as data and attached to stable campaign IDs.
import type {HordeConfig} from './horde';
export const HORDE_LEVELS:HordeConfig[]=[
 {
  "id": "trial-01",
  "title": "乱军突围",
  "startArmy": 8,
  "runDuration": 42,
  "bossId": "xing_daorong",
  "bossHp": "reuse_current_local_v051_value_first",
  "speedMultiplier": 1.0,
  "warmup": {
   "id": "trial-01:warmup",
   "preplaced": true,
   "count": 6,
   "kind": "footman",
   "hp": 2,
   "depthFront": 2.7,
   "rowSpacing": 0.18,
   "formation": "scattered"
  },
  "commonWaves": [],
  "forks": [
   {
    "id": "trial-01:fork:1",
    "stage": 1,
    "previewAt": 2,
    "commitAt": 4,
    "endAt": 14,
    "insideGateAt": 6.8,
    "internalGate": {
     "left": {
      "kind": "add",
      "value": 12
     },
     "right": {
      "kind": "double",
      "value": 2
     }
    },
    "safeSide": "left",
    "hardSide": "right",
    "routes": {
     "safe": {
      "side": "left",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 8,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-01:fork:1:safe:wave:1",
        "offset": 0.45,
        "count": 9,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:1:safe:wave:2",
        "offset": 2.6,
        "count": 9,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:1:safe:wave:3",
        "offset": 4.75,
        "count": 9,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "right",
      "label": "强攻",
      "hint": "纵列兵阵",
      "exitReinforcements": 14,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-01:fork:1:hard:wave:1",
        "offset": 0.45,
        "count": 14,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:1:hard:wave:2",
        "offset": 2.6,
        "count": 14,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:1:hard:wave:3",
        "offset": 4.75,
        "count": 14,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       }
      ],
      "terrain": []
     }
    }
   },
   {
    "id": "trial-01:fork:2",
    "stage": 2,
    "previewAt": 15,
    "commitAt": 17,
    "endAt": 27,
    "insideGateAt": 19.8,
    "internalGate": {
     "left": {
      "kind": "double",
      "value": 2
     },
     "right": {
      "kind": "add",
      "value": 24
     }
    },
    "safeSide": "right",
    "hardSide": "left",
    "routes": {
     "safe": {
      "side": "right",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 10,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-01:fork:2:safe:wave:1",
        "offset": 0.45,
        "count": 13,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:2:safe:wave:2",
        "offset": 2.6,
        "count": 13,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:2:safe:wave:3",
        "offset": 4.75,
        "count": 13,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "left",
      "label": "强攻",
      "hint": "密集兵群",
      "exitReinforcements": 18,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-01:fork:2:hard:wave:1",
        "offset": 0.45,
        "count": 21,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:2:hard:wave:2",
        "offset": 2.6,
        "count": 21,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-01:fork:2:hard:wave:3",
        "offset": 4.75,
        "count": 21,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       }
      ],
      "terrain": []
     }
    }
   },
   {
    "id": "trial-01:fork:3",
    "stage": 3,
    "previewAt": 28,
    "commitAt": 30,
    "endAt": 40,
    "insideGateAt": 32.8,
    "internalGate": {
     "left": {
      "kind": "add",
      "value": 12
     },
     "right": {
      "kind": "double",
      "value": 2
     }
    },
    "safeSide": "left",
    "hardSide": "right",
    "routes": {
     "safe": {
      "side": "left",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 12,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-01:fork:3:safe:wave:1",
        "offset": 0.45,
        "count": 18,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-01:fork:3:safe:wave:2",
        "offset": 2.6,
        "count": 18,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-01:fork:3:safe:wave:3",
        "offset": 4.75,
        "count": 18,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "right",
      "label": "强攻",
      "hint": "纵列兵阵",
      "exitReinforcements": 22,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-01:fork:3:hard:wave:1",
        "offset": 0.45,
        "count": 27,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-01:fork:3:hard:wave:2",
        "offset": 2.6,
        "count": 27,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-01:fork:3:hard:wave:3",
        "offset": 4.75,
        "count": 27,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       }
      ],
      "terrain": []
     }
    }
   }
  ]
 },
 {
  "id": "trial-02",
  "title": "夺粮立营",
  "startArmy": 12,
  "runDuration": 54,
  "bossId": "chen_ying",
  "bossHp": "reuse_current_local_v051_value_first",
  "speedMultiplier": 1.08,
  "warmup": {
   "id": "trial-02:warmup",
   "preplaced": true,
   "count": 6,
   "kind": "footman",
   "hp": 2,
   "depthFront": 2.7,
   "rowSpacing": 0.18,
   "formation": "scattered"
  },
  "commonWaves": [
   {
    "id": "trial-02:common:1",
    "at": 17.4,
    "count": 6,
    "kind": "footman",
    "entry": "visible_outer_side",
    "spawnDepth": 3.3,
    "formation": "scattered",
    "noHostileRangedAttack": true
   },
   {
    "id": "trial-02:common:2",
    "at": 33.4,
    "count": 6,
    "kind": "footman",
    "entry": "visible_outer_side",
    "spawnDepth": 3.3,
    "formation": "scattered",
    "noHostileRangedAttack": true
   }
  ],
  "forks": [
   {
    "id": "trial-02:fork:1",
    "stage": 1,
    "previewAt": 3,
    "commitAt": 5,
    "endAt": 17,
    "insideGateAt": 7.8,
    "internalGate": {
     "left": {
      "kind": "add",
      "value": 16
     },
     "right": {
      "kind": "double",
      "value": 2
     }
    },
    "safeSide": "right",
    "hardSide": "left",
    "routes": {
     "safe": {
      "side": "right",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 8,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-02:fork:1:safe:wave:1",
        "offset": 0.45,
        "count": 10,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:1:safe:wave:2",
        "offset": 3.9,
        "count": 10,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:1:safe:wave:3",
        "offset": 7.35,
        "count": 10,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "left",
      "label": "强攻",
      "hint": "纵列兵阵",
      "exitReinforcements": 14,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-02:fork:1:hard:wave:1",
        "offset": 0.45,
        "count": 16,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:1:hard:wave:2",
        "offset": 3.9,
        "count": 16,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:1:hard:wave:3",
        "offset": 7.35,
        "count": 16,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       }
      ],
      "terrain": []
     }
    }
   },
   {
    "id": "trial-02:fork:2",
    "stage": 2,
    "previewAt": 19,
    "commitAt": 21,
    "endAt": 33,
    "insideGateAt": 23.8,
    "internalGate": {
     "left": {
      "kind": "double",
      "value": 2
     },
     "right": {
      "kind": "add",
      "value": 20
     }
    },
    "safeSide": "left",
    "hardSide": "right",
    "routes": {
     "safe": {
      "side": "left",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 10,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-02:fork:2:safe:wave:1",
        "offset": 0.45,
        "count": 14,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:2:safe:wave:2",
        "offset": 3.9,
        "count": 14,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:2:safe:wave:3",
        "offset": 7.35,
        "count": 14,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "right",
      "label": "强攻",
      "hint": "密集兵群",
      "exitReinforcements": 18,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-02:fork:2:hard:wave:1",
        "offset": 0.45,
        "count": 22,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-02:fork:2:hard:wave:2",
        "offset": 3.9,
        "count": 22,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": [
         {
          "kind": "runner",
          "count": 2
         }
        ]
       },
       {
        "id": "trial-02:fork:2:hard:wave:3",
        "offset": 7.35,
        "count": 22,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     }
    }
   },
   {
    "id": "trial-02:fork:3",
    "stage": 3,
    "previewAt": 35,
    "commitAt": 37,
    "endAt": 49,
    "insideGateAt": 39.8,
    "internalGate": {
     "left": {
      "kind": "add",
      "value": 24
     },
     "right": {
      "kind": "double",
      "value": 2
     }
    },
    "safeSide": "right",
    "hardSide": "left",
    "routes": {
     "safe": {
      "side": "right",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 12,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-02:fork:3:safe:wave:1",
        "offset": 0.45,
        "count": 18,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-02:fork:3:safe:wave:2",
        "offset": 3.9,
        "count": 18,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-02:fork:3:safe:wave:3",
        "offset": 7.35,
        "count": 18,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "left",
      "label": "强攻",
      "hint": "纵列兵阵",
      "exitReinforcements": 22,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-02:fork:3:hard:wave:1",
        "offset": 0.45,
        "count": 28,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-02:fork:3:hard:wave:2",
        "offset": 3.9,
        "count": 28,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": [
         {
          "kind": "runner",
          "count": 2
         }
        ]
       },
       {
        "id": "trial-02:fork:3:hard:wave:3",
        "offset": 7.35,
        "count": 28,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     }
    }
   }
  ]
 },
 {
  "id": "trial-03",
  "title": "白石解围",
  "startArmy": 16,
  "runDuration": 66,
  "bossId": "yang_ling",
  "bossHp": "reuse_current_local_v051_value_first",
  "speedMultiplier": 1.15,
  "warmup": {
   "id": "trial-03:warmup",
   "preplaced": true,
   "count": 6,
   "kind": "footman",
   "hp": 2,
   "depthFront": 2.7,
   "rowSpacing": 0.18,
   "formation": "scattered"
  },
  "commonWaves": [
   {
    "id": "trial-03:common:1",
    "at": 18.4,
    "count": 8,
    "kind": "footman",
    "entry": "visible_outer_side",
    "spawnDepth": 3.3,
    "formation": "scattered",
    "noHostileRangedAttack": true
   },
   {
    "id": "trial-03:common:2",
    "at": 37.4,
    "count": 8,
    "kind": "footman",
    "entry": "visible_outer_side",
    "spawnDepth": 3.3,
    "formation": "scattered",
    "noHostileRangedAttack": true
   },
   {
    "id": "trial-03:common:3",
    "at": 58.0,
    "count": 8,
    "kind": "footman",
    "entry": "visible_outer_side",
    "spawnDepth": 5.0,
    "formation": "scattered",
    "noHostileRangedAttack": true
   }
  ],
  "forks": [
   {
    "id": "trial-03:fork:1",
    "stage": 1,
    "previewAt": 4,
    "commitAt": 6,
    "endAt": 18,
    "insideGateAt": 8.8,
    "internalGate": {
     "left": {
      "kind": "add",
      "value": 18
     },
     "right": {
      "kind": "double",
      "value": 2
     }
    },
    "safeSide": "left",
    "hardSide": "right",
    "routes": {
     "safe": {
      "side": "left",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 8,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-03:fork:1:safe:wave:1",
        "offset": 0.45,
        "count": 10,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:1:safe:wave:2",
        "offset": 3.9,
        "count": 10,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:1:safe:wave:3",
        "offset": 7.35,
        "count": 10,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "right",
      "label": "强攻",
      "hint": "纵列兵阵",
      "exitReinforcements": 14,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-03:fork:1:hard:wave:1",
        "offset": 0.45,
        "count": 16,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:1:hard:wave:2",
        "offset": 3.9,
        "count": 16,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:1:hard:wave:3",
        "offset": 7.35,
        "count": 16,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1,
        "replacements": []
       }
      ],
      "terrain": []
     }
    }
   },
   {
    "id": "trial-03:fork:2",
    "stage": 2,
    "previewAt": 23,
    "commitAt": 25,
    "endAt": 37,
    "insideGateAt": 27.8,
    "internalGate": {
     "left": {
      "kind": "double",
      "value": 2
     },
     "right": {
      "kind": "add",
      "value": 26
     }
    },
    "safeSide": "right",
    "hardSide": "left",
    "routes": {
     "safe": {
      "side": "right",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 10,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-03:fork:2:safe:wave:1",
        "offset": 0.45,
        "count": 16,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:2:safe:wave:2",
        "offset": 3.9,
        "count": 16,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:2:safe:wave:3",
        "offset": 7.35,
        "count": 16,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "left",
      "label": "强攻",
      "hint": "密集兵群",
      "exitReinforcements": 18,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-03:fork:2:hard:wave:1",
        "offset": 0.45,
        "count": 24,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": []
       },
       {
        "id": "trial-03:fork:2:hard:wave:2",
        "offset": 3.9,
        "count": 24,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": [
         {
          "kind": "runner",
          "count": 2
         }
        ]
       },
       {
        "id": "trial-03:fork:2:hard:wave:3",
        "offset": 7.35,
        "count": 24,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.1,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     }
    }
   },
   {
    "id": "trial-03:fork:3",
    "stage": 3,
    "previewAt": 42,
    "commitAt": 44,
    "endAt": 56,
    "insideGateAt": 46.8,
    "internalGate": {
     "left": {
      "kind": "add",
      "value": 36
     },
     "right": {
      "kind": "double",
      "value": 2
     }
    },
    "safeSide": "left",
    "hardSide": "right",
    "routes": {
     "safe": {
      "side": "left",
      "label": "稳进",
      "hint": "疏散步兵",
      "exitReinforcements": 12,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-03:fork:3:safe:wave:1",
        "offset": 0.45,
        "count": 20,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-03:fork:3:safe:wave:2",
        "offset": 3.9,
        "count": 20,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-03:fork:3:safe:wave:3",
        "offset": 7.35,
        "count": 20,
        "kind": "footman",
        "formation": "scattered",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": [
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     },
     "hard": {
      "side": "right",
      "label": "强攻",
      "hint": "纵列兵阵",
      "exitReinforcements": 22,
      "exitCondition": "alive_and_crossed_end",
      "waves": [
       {
        "id": "trial-03:fork:3:hard:wave:1",
        "offset": 0.45,
        "count": 30,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": []
       },
       {
        "id": "trial-03:fork:3:hard:wave:2",
        "offset": 3.9,
        "count": 30,
        "kind": "footman",
        "formation": "columns",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": [
         {
          "kind": "runner",
          "count": 2
         }
        ]
       },
       {
        "id": "trial-03:fork:3:hard:wave:3",
        "offset": 7.35,
        "count": 30,
        "kind": "footman",
        "formation": "wide",
        "spawnDepth": 6.5,
        "rowSpacing": 0.28,
        "stageSpeedMultiplier": 1.2,
        "replacements": [
         {
          "kind": "runner",
          "count": 2
         },
         {
          "kind": "crossbowman",
          "count": 1
         }
        ]
       }
      ],
      "terrain": []
     }
    }
   }
  ]
 }
];
