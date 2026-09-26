import {Node,Sprite,SpriteFrame,Texture2D,Rect,Size,Vec2,UITransform,Layers,resources,Color,UIOpacity,isValid} from 'cc';
export type Fix2Frame={sheet:string;rect:readonly number[];logicalSize:readonly number[];anchor:readonly number[];sourceCell?:readonly number[];sourceCrop?:readonly number[];foot?:readonly number[];grip?:readonly number[];muzzle?:readonly number[];weapon?:string;phase?:string;muzzleSourceSample?:unknown;extraction?:string;insets?:readonly number[]};
export const FIX2_FRAMES:Record<string,Fix2Frame>=/* FIX2_FRAMES_BEGIN */{
  "bladeWindup": {
    "sheet": "battlefix2/blade",
    "rect": [
      4,
      4,
      153,
      194
    ],
    "logicalSize": [
      224,
      210.3867403314917
    ],
    "anchor": [
      0.5801217038539553,
      0.012779552715654952
    ],
    "sourceCell": [
      0,
      0,
      724,
      724
    ],
    "sourceCrop": [
      89,
      83,
      493,
      626
    ],
    "foot": [
      0.5179558011049724,
      1.0308823529411764
    ],
    "grip": [
      0.68646408839779,
      0.3735294117647059
    ],
    "weapon": "blade",
    "phase": "windup"
  },
  "bladeRelease": {
    "sheet": "battlefix2/blade",
    "rect": [
      166,
      4,
      145,
      164
    ],
    "logicalSize": [
      224,
      210.3867403314917
    ],
    "anchor": [
      0.5906183368869936,
      0.016981132075471698
    ],
    "sourceCell": [
      724,
      0,
      724,
      724
    ],
    "sourceCrop": [
      843,
      180,
      469,
      530
    ],
    "foot": [
      0.5469613259668509,
      1.0308823529411764
    ],
    "grip": [
      0.669889502762431,
      0.42205882352941176
    ],
    "muzzle": [
      0.5469613259668509,
      0.40294117647058825
    ],
    "muzzleSourceSample": {
      "pixel": [
        1120,
        274
      ],
      "rgba": [
        59,
        52,
        49,
        253
      ],
      "review": "Manually selected visible weapon metal/edge in source; screenshot visual verification still required"
    },
    "weapon": "blade",
    "phase": "release"
  },
  "bladeRecover": {
    "sheet": "battlefix2/blade",
    "rect": [
      328,
      4,
      154,
      160
    ],
    "logicalSize": [
      224,
      210.3867403314917
    ],
    "anchor": [
      0.6156941649899397,
      0.015503875968992248
    ],
    "sourceCell": [
      1448,
      0,
      724,
      724
    ],
    "sourceCrop": [
      1544,
      193,
      497,
      516
    ],
    "foot": [
      0.5552486187845304,
      1.0308823529411764
    ],
    "grip": [
      0.6671270718232044,
      0.5338235294117647
    ],
    "weapon": "blade",
    "phase": "recover"
  },
  "bladeWave": {
    "sheet": "battlefix2/waves",
    "rect": [
      4,
      4,
      167,
      142
    ],
    "logicalSize": [
      167,
      142
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      0,
      0,
      512,
      512
    ],
    "sourceCrop": [
      45,
      103,
      444,
      378
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "spearWave": {
    "sheet": "battlefix2/waves",
    "rect": [
      179,
      4,
      62,
      175
    ],
    "logicalSize": [
      62,
      175
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      512,
      0,
      512,
      512
    ],
    "sourceCrop": [
      687,
      32,
      165,
      466
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "axeWave": {
    "sheet": "battlefix2/waves",
    "rect": [
      354,
      4,
      138,
      155
    ],
    "logicalSize": [
      138,
      155
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      1024,
      0,
      512,
      512
    ],
    "sourceCrop": [
      1082,
      71,
      368,
      413
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "forkWave": {
    "sheet": "battlefix2/waves",
    "rect": [
      4,
      187,
      81,
      169
    ],
    "logicalSize": [
      81,
      169
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      0,
      512,
      512,
      512
    ],
    "sourceCrop": [
      155,
      541,
      215,
      451
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "muzzleFlash": {
    "sheet": "battlefix2/waves",
    "rect": [
      179,
      187,
      126,
      133
    ],
    "logicalSize": [
      126,
      133
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      512,
      512,
      512,
      512
    ],
    "sourceCrop": [
      599,
      558,
      335,
      354
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "hitFlash": {
    "sheet": "battlefix2/waves",
    "rect": [
      354,
      187,
      121,
      111
    ],
    "logicalSize": [
      121,
      111
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      1024,
      512,
      512,
      512
    ],
    "sourceCrop": [
      1115,
      591,
      323,
      297
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "wallStart": {
    "sheet": "battlefix2/environment",
    "rect": [
      120,
      4,
      39,
      96
    ],
    "logicalSize": [
      39,
      96
    ],
    "anchor": [
      0.5,
      0
    ],
    "sourceCell": [
      510,
      300,
      145,
      335
    ],
    "sourceCrop": [
      516,
      319,
      125,
      306
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "wallEnd": {
    "sheet": "battlefix2/environment",
    "rect": [
      236,
      4,
      36,
      96
    ],
    "logicalSize": [
      36,
      96
    ],
    "anchor": [
      0.5,
      0
    ],
    "sourceCell": [
      890,
      300,
      145,
      335
    ],
    "sourceCrop": [
      901,
      319,
      116,
      307
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "gateBlue": {
    "sheet": "battlefix2/environment",
    "rect": [
      352,
      4,
      108,
      70
    ],
    "logicalSize": [
      108,
      70
    ],
    "anchor": [
      0.5,
      0
    ],
    "sourceCell": [
      15,
      700,
      355,
      235
    ],
    "sourceCrop": [
      20,
      705,
      345,
      225
    ],
    "foot": [
      0.5,
      1
    ],
    "insets": [
      8,
      8,
      8,
      8
    ]
  },
  "gateRed": {
    "sheet": "battlefix2/environment",
    "rect": [
      4,
      201,
      108,
      69
    ],
    "logicalSize": [
      108,
      69
    ],
    "anchor": [
      0.5,
      0
    ],
    "sourceCell": [
      400,
      700,
      355,
      235
    ],
    "sourceCrop": [
      406,
      708,
      346,
      222
    ],
    "foot": [
      0.5,
      1
    ],
    "insets": [
      8,
      8,
      8,
      8
    ]
  },
  "gateNeutral": {
    "sheet": "battlefix2/environment",
    "rect": [
      120,
      201,
      108,
      69
    ],
    "logicalSize": [
      108,
      69
    ],
    "anchor": [
      0.5,
      0
    ],
    "sourceCell": [
      780,
      700,
      355,
      235
    ],
    "sourceCrop": [
      788,
      708,
      346,
      222
    ],
    "foot": [
      0.5,
      1
    ],
    "insets": [
      8,
      8,
      8,
      8
    ]
  },
  "wallShadow": {
    "sheet": "battlefix2/shadow",
    "rect": [
      4,
      4,
      120,
      50
    ],
    "logicalSize": [
      120,
      50
    ],
    "anchor": [
      0.5,
      0.5
    ],
    "sourceCell": [
      1330,
      0,
      444,
      443
    ],
    "sourceCrop": [
      1347,
      243,
      417,
      174
    ],
    "foot": [
      0.5,
      1
    ]
  },
  "spearWindup": {
    "sheet": "battlefix2/actions",
    "rect": [
      4,
      4,
      204,
      208
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.7142857142857143,
      0.13988095238095238
    ],
    "sourceCell": [
      0,
      0,
      362,
      380
    ],
    "sourceCrop": [
      13,
      40,
      329,
      336
    ],
    "foot": [
      0.6850828729281768,
      0.9088397790055248
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "spear",
    "phase": "windup"
  },
  "spearRelease": {
    "sheet": "battlefix2/actions",
    "rect": [
      216,
      4,
      126,
      230
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.5960591133004927,
      0.11290322580645161
    ],
    "sourceCell": [
      362,
      0,
      362,
      380
    ],
    "sourceCrop": [
      429,
      7,
      203,
      372
    ],
    "foot": [
      0.5193370165745856,
      0.930939226519337
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "grip": [
      0.5248618784530387,
      0.2845303867403315
    ],
    "muzzle": [
      0.5193370165745856,
      0.11602209944751381
    ],
    "muzzleSourceSample": {
      "pixel": [
        550,
        42
      ],
      "rgba": [
        144,
        134,
        138,
        252
      ],
      "review": "Manually selected visible weapon metal/edge in source; screenshot visual verification still required"
    },
    "weapon": "spear",
    "phase": "release"
  },
  "spearRecover": {
    "sheet": "battlefix2/actions",
    "rect": [
      428,
      4,
      201,
      225
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.4153846153846154,
      0.1322314049586777
    ],
    "sourceCell": [
      724,
      0,
      362,
      380
    ],
    "sourceCrop": [
      761,
      14,
      325,
      363
    ],
    "foot": [
      0.47513812154696133,
      0.9088397790055248
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "spear",
    "phase": "recover"
  },
  "xingWindup": {
    "sheet": "battlefix2/actions",
    "rect": [
      4,
      249,
      176,
      230
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.6091549295774648,
      0.08870967741935484
    ],
    "sourceCell": [
      0,
      370,
      362,
      390
    ],
    "sourceCrop": [
      32,
      370,
      284,
      372
    ],
    "foot": [
      0.5662983425414365,
      0.93646408839779
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "great_axe",
    "phase": "windup"
  },
  "xingRelease": {
    "sheet": "battlefix2/actions",
    "rect": [
      216,
      249,
      137,
      233
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.5765765765765766,
      0.08244680851063829
    ],
    "sourceCell": [
      362,
      370,
      362,
      390
    ],
    "sourceCrop": [
      418,
      372,
      222,
      376
    ],
    "foot": [
      0.5082872928176796,
      0.9585635359116023
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "grip": [
      0.5082872928176796,
      0.30662983425414364
    ],
    "muzzle": [
      0.5082872928176796,
      0.1712707182320442
    ],
    "muzzleSourceSample": {
      "pixel": [
        546,
        432
      ],
      "rgba": [
        91,
        86,
        88,
        252
      ],
      "review": "Manually selected visible weapon metal/edge in source; screenshot visual verification still required"
    },
    "weapon": "great_axe",
    "phase": "release"
  },
  "xingRecover": {
    "sheet": "battlefix2/actions",
    "rect": [
      428,
      249,
      190,
      214
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.5146579804560261,
      0.12138728323699421
    ],
    "sourceCell": [
      724,
      370,
      362,
      390
    ],
    "sourceCrop": [
      779,
      414,
      307,
      346
    ],
    "foot": [
      0.5883977900552486,
      0.9613259668508287
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "great_axe",
    "phase": "recover"
  },
  "chenWindup": {
    "sheet": "battlefix2/actions",
    "rect": [
      4,
      494,
      157,
      225
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.5866141732283464,
      0.06336088154269973
    ],
    "sourceCell": [
      0,
      745,
      362,
      385
    ],
    "sourceCrop": [
      62,
      755,
      254,
      363
    ],
    "foot": [
      0.5828729281767956,
      0.9668508287292817
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "throwing_fork",
    "phase": "windup"
  },
  "chenRelease": {
    "sheet": "battlefix2/actions",
    "rect": [
      216,
      494,
      128,
      237
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.5845410628019324,
      0.08616187989556136
    ],
    "sourceCell": [
      362,
      745,
      362,
      385
    ],
    "sourceCrop": [
      429,
      745,
      207,
      383
    ],
    "foot": [
      0.5193370165745856,
      0.9668508287292817
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "grip": [
      0.5193370165745856,
      0.16574585635359115
    ],
    "muzzle": [
      0.5193370165745856,
      0.08839779005524862
    ],
    "muzzleSourceSample": {
      "pixel": [
        550,
        777
      ],
      "rgba": [
        110,
        110,
        131,
        252
      ],
      "review": "Manually selected visible weapon metal/edge in source; screenshot visual verification still required"
    },
    "weapon": "throwing_fork",
    "phase": "release"
  },
  "chenRecover": {
    "sheet": "battlefix2/actions",
    "rect": [
      428,
      494,
      166,
      218
    ],
    "logicalSize": [
      224,
      224
    ],
    "anchor": [
      0.4664179104477612,
      0.07954545454545454
    ],
    "sourceCell": [
      724,
      745,
      362,
      385
    ],
    "sourceCrop": [
      808,
      766,
      268,
      352
    ],
    "foot": [
      0.5773480662983426,
      0.9530386740331491
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "throwing_fork",
    "phase": "recover"
  },
  "zhaoWindup": {
    "sheet": "battlefix2/zhao",
    "rect": [
      4,
      4,
      183,
      186
    ],
    "logicalSize": [
      224,
      210.3867403314917
    ],
    "anchor": [
      0.6976351351351351,
      0.10963455149501661
    ],
    "sourceCell": [
      0,
      0,
      724,
      724
    ],
    "sourceCrop": [
      39,
      91,
      592,
      602
    ],
    "foot": [
      0.6243093922651933,
      0.9220588235294118
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "spear",
    "phase": "windup"
  },
  "zhaoRelease": {
    "sheet": "battlefix2/zhao",
    "rect": [
      195,
      4,
      121,
      208
    ],
    "logicalSize": [
      224,
      210.3867403314917
    ],
    "anchor": [
      0.5615384615384615,
      0.07578008915304606
    ],
    "sourceCell": [
      724,
      0,
      724,
      724
    ],
    "sourceCrop": [
      867,
      22,
      390,
      673
    ],
    "foot": [
      0.5,
      0.9470588235294117
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "grip": [
      0.5096685082872928,
      0.2691176470588235
    ],
    "muzzle": [
      0.5,
      0.12058823529411765
    ],
    "muzzleSourceSample": {
      "pixel": [
        1086,
        82
      ],
      "rgba": [
        238,
        234,
        232,
        253
      ],
      "review": "Manually selected visible weapon metal/edge in source; screenshot visual verification still required"
    },
    "weapon": "spear",
    "phase": "release"
  },
  "zhaoRecover": {
    "sheet": "battlefix2/zhao",
    "rect": [
      386,
      4,
      168,
      200
    ],
    "logicalSize": [
      224,
      210.3867403314917
    ],
    "anchor": [
      0.43462246777163904,
      0.08837209302325581
    ],
    "sourceCell": [
      1448,
      0,
      724,
      724
    ],
    "sourceCrop": [
      1575,
      47,
      543,
      645
    ],
    "foot": [
      0.5013812154696132,
      0.9338235294117647
    ],
    "extraction": "Alpha>0 connected component from explicit source seed; retained RGBA untouched before production resize",
    "weapon": "spear",
    "phase": "recover"
  },
  "wallMiddle": {
    "sheet": "battlefix2/wall-middle",
    "rect": [
      4,
      4,
      32,
      320
    ],
    "logicalSize": [
      32,
      320
    ],
    "anchor": [
      0.5,
      0
    ],
    "sourceCell": [
      0,
      0,
      887,
      1774
    ],
    "sourceCrop": [
      357,
      0,
      176,
      1774
    ],
    "foot": [
      0.5,
      1
    ]
  }
}/* FIX2_FRAMES_END */;
export type Fix2DrawOptions={anchorX?:number;anchorY?:number;angle?:number;alpha?:number;tint?:string;flipX?:boolean;flipY?:boolean};
/** Separate FIX2 production art; frame/node pools never make gameplay or event decisions. */
export class BattleFix2Assets {
 private static frames:Record<string,SpriteFrame>={};private static loading:Promise<void>|null=null;
 static readonly requiredKeys=['bladeWindup','bladeRelease','bladeRecover','spearWindup','spearRelease','spearRecover','xingWindup','xingRelease','xingRecover','chenWindup','chenRelease','chenRecover','zhaoWindup','zhaoRelease','zhaoRecover','bladeWave','spearWave','axeWave','forkWave','muzzleFlash','gateBlue','gateRed','gateNeutral','wallMiddle','wallStart','wallEnd','wallShadow'];
 static get ready(){return this.requiredKeys.every(k=>!!FIX2_FRAMES[k]&&!!this.frames[k])&&Object.keys(FIX2_FRAMES).every(k=>!!this.frames[k]);}
 static frame(key:string):SpriteFrame|null{return this.frames[key]||null;}
 static meta(key:string):Fix2Frame|null{return FIX2_FRAMES[key]||null;}
 static get diagnostics(){return{ready:this.ready,loading:!!this.loading,frames:Object.keys(this.frames).length,expectedFrames:Object.keys(FIX2_FRAMES).length,requiredFrames:this.requiredKeys.length,missingRequired:this.requiredKeys.filter(k=>!FIX2_FRAMES[k]||!this.frames[k])};}
 static async load(){if(this.ready)return;if(this.loading)return this.loading;this.loading=this.loadMissing();try{await this.loading;}finally{this.loading=null;}}
 private static async loadMissing(){const keys=Object.keys(FIX2_FRAMES);const missing=this.requiredKeys.filter(k=>!FIX2_FRAMES[k]);if(missing.length)throw Error('FIX2 art manifest missing required keys: '+missing.join(','));const sheets=Array.from(new Set(keys.filter(k=>!this.frames[k]).map(k=>FIX2_FRAMES[k].sheet)));const results=await Promise.all(sheets.map(sheet=>new Promise<unknown>(resolve=>resources.load(sheet+'/texture',Texture2D,(error,texture)=>{if(error||!texture){resolve(error||Error('Missing FIX2 texture '+sheet));return;}keys.forEach(key=>{const d=FIX2_FRAMES[key];if(d.sheet!==sheet||this.frames[key])return;const [x,y,w,h]=d.rect,f=new SpriteFrame();f.texture=texture;f.rect=new Rect(x,y,w,h);f.originalSize=new Size(w,h);f.offset=new Vec2();if(d.insets){f.insetLeft=d.insets[0];f.insetRight=d.insets[1];f.insetTop=d.insets[2];f.insetBottom=d.insets[3];}this.frames[key]=f;});resolve(null);})))) ;const failed=results.find(r=>r);if(failed)throw failed;}
 /** Normalized source-cell sockets expressed relative to the same measured foot; parent may align rendered art to original projectile origin. */
 static socket(key:string,kind:'grip'|'muzzle',height:number):{x:number;y:number}|null{const d=this.meta(key),point=d&&d[kind];if(!d||!point||!d.foot)return null;return{x:(point[0]-d.foot[0])*height*d.logicalSize[0]/d.logicalSize[1],y:(d.foot[1]-point[1])*height};}
 private pool=new Map<string,Node>();
 begin(){this.pool.forEach(n=>{if(isValid(n))n.active=false;});}
 draw(parent:Node,id:string,key:string,x:number,y:number,w:number,h:number,o:Fix2DrawOptions={}):Node|null{const f=BattleFix2Assets.frame(key),d=BattleFix2Assets.meta(key);if(!f||!d)return null;let n=this.pool.get(id);if(!n||!isValid(n)){n=new Node(id);n.layer=Layers.Enum.UI_2D;n.addComponent(UITransform);n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;n.addComponent(UIOpacity);this.pool.set(id,n);}if(n.parent!==parent)parent.addChild(n);n.active=true;n.setSiblingIndex(parent.children.length-1);n.setPosition(x,y);n.setScale(o.flipX?-1:1,o.flipY?-1:1,1);n.angle=o.angle||0;const u=n.getComponent(UITransform)!;u.setAnchorPoint(o.anchorX===undefined?d.anchor[0]:o.anchorX,o.anchorY===undefined?d.anchor[1]:o.anchorY);u.setContentSize(w*d.rect[2]/d.logicalSize[0],h*d.rect[3]/d.logicalSize[1]);const s=n.getComponent(Sprite)!;s.type=Sprite.Type.SIMPLE;s.spriteFrame=f;s.color=new Color().fromHEX(o.tint||'#ffffff');n.getComponent(UIOpacity)!.opacity=o.alpha===undefined?255:o.alpha;return n;}
 drawHeight(parent:Node,id:string,key:string,x:number,y:number,height:number,o:Fix2DrawOptions={}):Node|null{const d=BattleFix2Assets.meta(key);return d?this.draw(parent,id,key,x,y,height*d.logicalSize[0]/d.logicalSize[1],height,o):null;}
 drawSlice(parent:Node,id:string,key:string,x:number,y:number,w:number,h:number,o:Fix2DrawOptions={}):Node|null{const n=this.draw(parent,id,key,x,y,w,h,o);if(n){n.getComponent(Sprite)!.type=Sprite.Type.SLICED;n.getComponent(UITransform)!.setContentSize(w,h);}return n;}
 end(){}hide(){this.begin();}destroy(){this.pool.forEach(n=>{if(isValid(n))n.destroy();});this.pool.clear();}
 get size(){return this.pool.size;}
 get bounds(){return Array.from(this.pool.entries()).filter(([,n])=>isValid(n)&&n.activeInHierarchy).map(([id,n])=>{const b=n.getComponent(UITransform)!.getBoundingBoxToWorld();return{id,left:b.x,right:b.x+b.width,bottom:b.y,top:b.y+b.height};});}
}
