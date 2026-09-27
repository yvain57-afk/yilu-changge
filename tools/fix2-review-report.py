# -*- coding: utf-8 -*-
"""Compile FIX2 findings only from completed local evidence. Device/user approval stays pending."""
from pathlib import Path
import json, re, hashlib, shutil, datetime
R=Path(__file__).resolve().parents[1]; TASK='BATTLE-FIX2-20260925'; E=R/'evidence'/TASK; D=R/'docs'/TASK
load=lambda p:json.loads(p.read_text())
def save(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
comparison=load(E/'compare-latest.json'); layout=load(E/'layout-recheck-latest.json'); targeted=load(E/'targeted-latest.json'); readable=load(E/'cap-readability-latest.json'); weapons=load(E/'weapon-clips-latest.json'); natural=load(E/'natural-flow.json'); build=load(E/'BUILD_ID.json'); package=load(E/'wechat-package.json'); preserved=load(E/'PRESERVED_CONTRACTS.json')
for name,result in [('comparison',comparison),('layout',layout),('readable',readable),('weapons',weapons),('natural',natural)]:
    assert result['passed'], name+' not passed'
assert len(comparison['pages'])==12 and len(readable['results'])==36 and len(weapons['clips'])==10
assert len(targeted['checks'])==39 and len(targeted['failures'])==3
assert all(x['id']=='U04/R03' for x in targeted['failures']) and len(layout['checks'])==27
assert '# pass 84' in (E/'related-checks.log').read_text() and '# fail 0' in (E/'related-checks.log').read_text()
cap=load(D/'CAP_AND_PACING_REPORT.json')
for c in cap['comparisons']:
    for variant in ['A','B']:
        row=c[variant]; actual=[x for x in readable['results'] if x['runId']==row['runId']]
        assert len(actual)==3
        row['firstReadableAt']=next(x['firstReadableAt'] for x in actual if x['viewport']['width']==390)
        row['readabilityStatus']='matched browser fixture; actual viewport bounds and post-frame label readback verified'
        row['readabilityByViewport']=actual
        row['readableToContactSeconds']=max(0,row['contactAt']-row['firstReadableAt']) if row.get('contactAt') is not None else None
cap['status']='model_and_matched_browser_evidence_complete'
cap['browserReadability']={'file':'cap-readability-latest.json','dir':readable['dir'],'method':readable['method'],'notReactionTime':True,'superseded':'readability/2026-09-25T16-39-35-241Z used pre-frame viewport bounds and is invalidated; not used for final firstReadableAt'}
save(D/'CAP_AND_PACING_REPORT.json',cap); shutil.copy2(D/'CAP_AND_PACING_REPORT.json',E/'CAP_AND_PACING_REPORT.json');shutil.copy2(D/'PARAMETER_DIFF.json',E/'PARAMETER_DIFF.json')
ids=['normal-attack','gates-crates','wall-end','chain-contact']; groups=[]; (E/'comparison-metadata').mkdir(exist_ok=True)
for id in ids:
    before=load(E/'before'/f'{id}.json'); page=next(p for p in comparison['pages'] if p['name']=='390x844-'+id); afterpath=R/Path(page['png']).with_suffix('.json'); after=load(afterpath)
    group={'id':id,'before':f'before/{id}.png','after':str(Path(page['png']).relative_to(E.relative_to(R)))}
    for side,data,raw in [('before',before,f'before/{id}.json'),('after',after,str(afterpath.relative_to(E)))]:
        meta={'kind':'fixture','viewport':{'width':390,'height':844},'model':{k:data['model'][k] for k in ['level','elapsed','count','weapon','stage']},'rawState':raw,'scope':'Identical FIX1 capped state for visual isolation; normal gameplay uses window in natural recording','companion':data['model']['companion'],'tick':data['replay']['tick']}
        name=f'comparison-metadata/{id}-{side}.json';save(E/name,meta);group[side+'Metadata']=name
    groups.append(group)
save(E/'COMPARISON_GROUPS.json',groups)
refs={
'A01':['weapon-clips-latest.json','targeted-latest.json'],'A02':['weapon-clips-latest.json'],'A03':['weapon-clips-latest.json','related-checks.log'],'A04':['targeted-latest.json','weapon-clips-latest.json'],'A05':['targeted-latest.json','natural-flow.json'],'A06':['targeted-latest.json','related-checks.log'],
'U01':['targeted-latest.json','compare-latest.json'],'U02':['targeted-latest.json','layout-recheck-latest.json'],'U03':['layout-recheck-latest.json'],'U04':['layout-recheck-latest.json','natural-flow.json'],'U05':['layout-recheck-latest.json','compare-latest.json'],'U06':['layout-recheck-latest.json','compare-latest.json'],
'E01':['top-decoration-uncut.mp4','CLIPS.json','PRESERVED_CONTRACTS.json'],'E02':['full-natural-three-levels.mp4','natural-flow.json'],'E03':['compare-latest.json','layout-recheck-latest.json'],'E04':['targeted-latest.json','full-natural-three-levels.mp4'],
'G01':['CAP_AND_PACING_REPORT.json','related-checks.log'],'G02':['related-checks.log','CAP_AND_PACING_REPORT.json'],'G03':['targeted-latest.json','related-checks.log'],'G04':['related-checks.log'],'G05':['CAP_AND_PACING_REPORT.json','natural-flow.json'],'G06':['CAP_AND_PACING_REPORT.json','cap-readability-latest.json'],'G07':['CAP_AND_PACING_REPORT.json'],'G08':['natural-flow.json','PARAMETER_DIFF.json'],
'R01':['compare-latest.json','CAP_AND_PACING_REPORT.json'],'R02':['natural-flow.json','PRESERVED_CONTRACTS.json'],'R03':['compare-latest.json','layout-recheck-latest.json'],'R04':['targeted-latest.json'],'R05':[],'R06':['BUILD_ID.json','wechat-package.json','CLIPS.json']}
cases=load(D/'source-pack/config/review_cases.json')['cases']
for c in cases:
    c.pop('result',None);c['status']='待实测' if c['id']=='R05' else '部分完成' if c['id']=='R06' else '通过';c['evidence']=refs[c['id']]
    if c['id']=='R05':c['notes']='无实体手机证据；触控、微信胶囊、听感、切后台及持续性能待真机。'
    if c['id']=='R06':c['notes']='双端构建及本地运行通过。独立解包运行和归档哈希由打包工具实际通过后回填，不提前标绿。'
    if c['id']=='G04':c['notes']='真实存档不持久化半局 Journey/Runner，故不存在未结算门的存档迁移；未知字段/旧成绩兼容及已结算不补偿有相关检查。'
    if c['id']=='G07':c['notes']='固定正常瞄准、偏晚换向、强火力的少量配对模型输入；没有人工胜率或自动最优路线声明。'
    if c['id']=='U03':c['notes']='近景32px；远处按透视缩放，容器固定预留三位数及符号。真实碰撞宽度、地面触发条均不变。'
    if c['id']=='U04':c['notes']='旧3项遮挡失败保留；本轮三尺寸24枚实图与27项定向复核关闭。'
report={'taskId':TASK,'runtime':build['runtime'],'sourceAndBuildSha256':build['sourceAndBuildSha256'],'generatedAt':datetime.datetime.now().astimezone().isoformat(),'statusEnum':['通过','部分完成','未通过','待实测'],'functionalRegression':'通过','requiredArtResources':'通过','developerVisualReview':'通过','userAestheticApproval':'待用户核验','physicalDevice':'待实测','packaging':'pending','cases':cases,'sixGroups':[{'name':n,'status':'通过'} for n in ['武将动作与兵器光波','四类箱信息组','正负零值及连续门排版','顶部近景清理','增援门增长与有效窗口','木墙与原障碍规则']],'limits':['浏览器移动视口不等于实体手机。','同状态视觉对照显式固定旧 capped；自然局使用 window，不声称新收益下所有模型相同。','少量固定输入观察不是玩家胜率；未知原版公式仍是明确工程初值。','拥挤时队伍人数牌移至相邻空位，部分位置归属感仍弱于固定HUD；关键门值与武将已避免遮挡。'],'weaponCaptureTiming':'Diagnostic samples may differ from MediaRecorder by 1–2 frames. Continuous original frames confirm poses; Zhao fastest observed actor interval is 0.3s, other identities 0.2s.', 'failuresClosed':[{'file':'targeted/2026-09-25T16-34-58-687Z/report.json','issue':'人数牌遮两枚连续门','resolution':'layout-recheck-latest.json'},{'issue':'三位值越旗、近箱遮武将、木墙锯齿','resolution':'layout-recheck-latest.json + final 12 screenshots'}]}
verification={'task':TASK,'runtime':build['runtime'],'sourceAndBuildSha256':build['sourceAndBuildSha256'],'typecheck':'passed','relatedTests':{'passed':84,'failed':0},'originalTargeted':{'passed':39,'failed':3,'failuresResolvedBy':'layout-recheck-latest.json'},'layoutRecheck':{'passed':27,'failed':0},'sameStateComparisons':{'passed':12,'failed':0},'matchedReadability':{'passed':36,'failed':0},'weaponClips':{'passed':10,'maxOutletErrorDesignUnits':max(c['maxOutletError'] for c in weapons['clips'])},'natural':{'passed':True,'runs':[{'level':x['level'],'seconds':x['seconds'],'count':x['count']} for x in natural['runs']]},'packaging':'pending','physicalDevice':'not performed','userAestheticApproval':'not inferred','uploaded':False}
for base in [E,D]:save(base/'FIX2_REVIEW_RESULTS.json',report);save(base/'VERIFICATION.json',verification)
(D/'KNOWN_GAPS.md').write_text('''# 真实待核验项\n\n必需战斗资源已齐，原发现的门值越界、人数牌遮门、木墙锯齿、近箱遮武将及赵云靴底截断均修复并留有前后证据。\n\n- 尚无实体手机测试：触控、微信胶囊、安全区、声音听感、后台恢复及持续性能待真机。\n- 用户审美认可不能由代码断言或开发端截图检查代签。\n- 拥挤场景的队伍人数牌会移到相邻空位，少数位置与己方的关联仍偏弱；已不遮关键门值，也不遮主将/同袍。\n- 原版未确认的公式仍视为工程参数；少量固定输入和一次自然通关不能代表普遍胜率。\n\n当前仅本地 Web/微信构建，未上传或发布。旧失败样段、旧排版截图、无效可读性探针均保留，最终结果以对应 latest 与核验表为准。\n''')
shutil.copy2(D/'KNOWN_GAPS.md',E/'KNOWN_GAPS.md')
shutil.copy2(E/'BUILD_ID.json',D/'BUILD_ID.json')
print(json.dumps(verification,ensure_ascii=False))
