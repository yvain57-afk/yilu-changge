from pathlib import Path
import json, itertools
OUT=Path('/mnt/data/yilu-first-three-v02')
def gate(i,at,left,right,guard=None):
    v={'id':f'g{i}','at':at,'left':{'kind':'add','value':left} if isinstance(left,int) else {'kind':'double','value':2},'right':{'kind':'add','value':right} if isinstance(right,int) else {'kind':'double','value':2}}
    if guard: v['guard']={'side':guard[0],'hp':guard[1],'contactLoss':guard[2],'coverage':'entire_selected_half','kind':'barricade'}
    return v
def obj(i,at,x,kind,hp,loss,attackLoss=None):
    v={'id':f'o{i}','at':at,'x':x,'halfWidth':.20,'kind':kind,'contactLoss':loss}
    if kind!='rock':v['hp']=hp
    if attackLoss is not None:v['attack']={'kind':'aimed','startAt':at-2,'telegraphSeconds':1.25,'halfWidth':.22,'loss':attackLoss,'maxStrikes':1}
    return v
levels=[
{'id':'trial-01','title':'拉起队伍','scene':'山道','rankBefore':'布衣','rankAfter':'头领','startCount':8,'runSeconds':42,'targetTotalSeconds':[55,65],
 'opening':'先打出自己的旗号。','victory':'有队伍了。下一战，拿下一座营寨。',
 'gates':[gate(1,6,12,'x2'),gate(2,18,'x2',24),gate(3,34,12,'x2',('right',80,18))],
 'objects':[obj(1,11,0,'fighter',12,4),obj(2,14,.5,'rock',0,6),obj(3,24,-.5,'fighter',26,6),obj(4,27,.5,'fighter',30,6),obj(5,38,0,'fighter',40,8)],
 'boss':{'id':'spear-chief','name':'投矛头目','hp':650,'x':0,'hurtHalfWidth':.42,'firstAttackDelay':2.0,'attackSequence':[{'kind':'aimed','telegraphSeconds':1.4,'halfWidth':.22,'loss':6,'impactSeconds':.12,'recoverySeconds':1.5}]},
 'referenceBestGatePath':['left','right','right']},
{'id':'trial-02','title':'拿下营寨','scene':'营寨','rankBefore':'头领','rankAfter':'统领','startCount':12,'runSeconds':54,'targetTotalSeconds':[68,82],
 'opening':'打穿营门，换上你的旗。','victory':'营寨拿下了。下一战，城门。',
 'gates':[gate(1,5,16,'x2'),gate(2,17,'x2',20,('left',64,10)),gate(3,31,24,'x2'),gate(4,45,'x2',32,('left',180,48))],
 'objects':[obj(1,11,0,'fighter',24,5),obj(2,12,-.5,'rock',0,8),obj(3,25,.5,'crossbowman',72,10,8),obj(4,35,0,'fighter',100,10),obj(5,38,.5,'rock',0,12),obj(6,40,-.5,'crossbowman',112,12,10),obj(7,49,.5,'fighter',130,12)],
 'boss':{'id':'crossbow-chief','name':'营寨弩将','hp':1800,'x':0,'hurtHalfWidth':.42,'firstAttackDelay':2.0,'attackSequence':[{'kind':'fixed','x':x,'telegraphSeconds':1.25,'halfWidth':.33,'loss':8,'impactSeconds':.12,'recoverySeconds':1.25} for x in [-.6,.6,0]]},
 'referenceBestGatePath':['left','left','right','left']},
{'id':'trial-03','title':'夺下首城','scene':'城门','rankBefore':'统领','rankAfter':'城主','startCount':16,'runSeconds':66,'targetTotalSeconds':[82,98],
 'opening':'打败守将，拿下第一座城。','victory':'首城已得。登基之路，刚刚开始。',
 'gates':[gate(1,6,18,'x2'),gate(2,22,'x2',26,('left',100,12)),gate(3,40,36,'x2',('right',120,24)),gate(4,57,'x2',40,('left',240,56))],
 'objects':[obj(1,12,-.5,'fighter',28,8),obj(2,16,.5,'rock',0,10),obj(3,29,.5,'crossbowman',112,12,12),obj(4,34,0,'fighter',120,14),obj(5,48,-.5,'crossbowman',160,12,12),obj(6,52,.5,'crossbowman',180,14,12),obj(7,62,.5,'fighter',200,16)],
 'boss':{'id':'city-general','name':'守城主将','hp':2600,'x':0,'hurtHalfWidth':.42,'firstAttackDelay':2.0,'attackSequence':[{'kind':'aimed','telegraphSeconds':1.25,'halfWidth':.24,'loss':10,'impactSeconds':.12,'recoverySeconds':1.4},{'kind':'fixed','x':-.6,'telegraphSeconds':1.15,'halfWidth':.33,'loss':10,'impactSeconds':.12,'recoverySeconds':.4},{'kind':'fixed','x':.6,'telegraphSeconds':1.15,'halfWidth':.33,'loss':10,'impactSeconds':.12,'recoverySeconds':1.6}]},
 'referenceBestGatePath':['left','left','right','left']}
]
spec={'schema':'yilu-first-three-design-draft/0.2','status':'planning_reference_not_runtime_config_not_playtested','baselineCommit':'4f498ea39f19bc56082a889c3ee74947c69c68c6','notes':['All numeric values are initial tuning proposals, not proven balance.','at is forward world distance measured in travel seconds; it is not an enemy spawn time.','Renderer reveals objects/guards no earlier than the forward horizon; hostile shots may not occur before source and telegraph are visible.','New guarded gate transaction resolves unresolved blocker loss BEFORE immutable gate operation, once per row.','Normal mode has three stages only; beating stage 3 does not unlock an unimplemented coronation stage.'],
'global':{'engine':'Cocos Creator 3.8.8','designResolution':[720,1280],'step':1/60,'maxAcceptedDelta':.25,'xRange':[-.91,.91],'xSpeed':2.7,'visibleAheadSeconds':7,'startX':0,'gateSplitX':0,'xExactlyZeroChooses':'right','gateCoverage':{'left':[-1,0],'right':[0,1]},'countCap':256,'visibleCountCapIncludingHero':48,'shotIntervalSeconds':.25,'damagePerSoldierPerVolley':.2,'projectileSpeed':9,'volleyDamageFrozenAtEmission':True,'gateGuardBeforeBuff':True,'zeroCountFailsBeforeGateBuff':True,'contactUses':'marked_team_center_not_decorative_formation_edges','noTimeLimit':True,'noKillIncome':True,'bossMovement':False,'bossInvulnerability':False,'saveNamespaceProposal':'yilu-changge-prototype-v2','rankAffects':'cosmetics_and_next_level_fixed_start_count_only'},'levels':levels}
(OUT/'LEVELS_V02_DRAFT.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')

def apply(n,g,side,clear=True):
    guard=g.get('guard')
    loss=0
    if guard and guard['side']==side and not clear:
        loss=min(n,guard['contactLoss']);n-=loss
        if n==0:return (0,loss,0)
    op=g[side];after=min(256,n+op['value'] if op['kind']=='add' else n*2)
    return after,loss,after-n
checks=[]
for level in levels:
    for g in level['gates']:
        assert 0<g['at']<level['runSeconds']
        for side in ['left','right']:
            assert g[side]['kind'] in ('add','double')
            assert g[side]['value']>0
    for o in level['objects']:
        assert 0<o['at']<level['runSeconds']
        if 'attack' in o:
            assert o['attack']['telegraphSeconds']>=1
            assert o['attack']['startAt']>=o['at']-7
    n=level['startCount'];trace=[]
    for g,side in zip(level['gates'],level['referenceBestGatePath']):
        pre=n;n,_,_=apply(n,g,side,True)
        trace.append({'id':g['id'],'before':pre,'side':side,'after':n})
    safe=level['startCount'];safePath=[]
    for g in level['gates']:
        options=[s for s in ('left','right') if not g.get('guard') or g['guard']['side']!=s]
        s=max(options,key=lambda s:apply(safe,g,s,True)[0])
        safe=apply(safe,g,s,True)[0];safePath.append(s)
    alwaysDouble=level['startCount']
    for g in level['gates']:
        s='left' if g['left']['kind']=='double' else 'right'
        alwaysDouble=apply(alwaysDouble,g,s,True)[0]
    checks.append({'id':level['id'],'ideal_gate_only_trace':trace,'ideal_gate_only_end':n,'avoid_all_guard_sides_gate_only_end':safe,'avoid_guard_path':safePath,'always_double_with_guards_cleared_gate_only_end':alwaysDouble,'boss_ideal_continuous_dps':n*.8,'boss_hp_over_ideal_dps_seconds_not_actual_fight_duration':round(level['boss']['hp']/(n*.8),3)})
assert checks[0]['ideal_gate_only_end']==88
assert checks[1]['ideal_gate_only_end']==224
assert checks[2]['ideal_gate_only_end']==256
assert apply(44,levels[0]['gates'][2],'right',False)[0]==52
assert apply(44,levels[0]['gates'][2],'left',True)[0]==56
assert apply(112,levels[1]['gates'][3],'left',False)[0]==128
assert apply(112,levels[1]['gates'][3],'right',True)[0]==144
assert apply(136,levels[2]['gates'][3],'left',False)[0]==160
assert apply(136,levels[2]['gates'][3],'right',True)[0]==176
# Static coverage check for boss 2: no x can dodge every fixed lane by standing still.
b2=levels[1]['boss']['attackSequence']
assert all(any(abs(x-a['x']) <= a['halfWidth'] for a in b2) for x in [-.91+i*1.82/1000 for i in range(1001)])
assert all(any(abs(x-a['x']) > a['halfWidth'] for x in [-.91,0,.91]) for a in b2)
report={'status':'passed_static_schema_and_arithmetic_checks_only','not_tested':['Cocos execution','projectile travel and interruption','visual readability','complete route survival','input timing','new boss behavior','balance','device performance'],'levels':checks}
(OUT/'ARITHMETIC_CHECK.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
