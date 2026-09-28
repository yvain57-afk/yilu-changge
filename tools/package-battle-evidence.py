from pathlib import Path
import json,hashlib,shutil,zipfile
root=Path(__file__).resolve().parents[1];e=root/'evidence/BATTLE-REWORK-20260925';d=root/'docs/BATTLE-REWORK-20260925';out=root/'release/BATTLE-REWORK-20260925';stage=out/'BATTLE_REWORK_GPT_EVIDENCE';stage.mkdir(parents=True,exist_ok=True)
for n in ['BATTLE_VISUAL_DIFF.md','ASSET_WORKLIST.json','BATTLE_ASSET_BUDGET.json','REVIEW_RESULTS.json','KNOWN_GAPS.md','PRODUCTION_ATTEMPTS.json','FINAL_REVIEW.md','TARGETED_REVIEW.md']:
 shutil.copy2(d/n,stage/n)
for n in ['battle-showcase.mp4','CLIPS.json','BUILD_ID.json','VERIFICATION.json','natural-flow.json','MEDIA_MANIFEST.json','PRESERVED_CONTRACTS.json','DELIVERABLE_READBACK.json','asset-loader-regression.json','targeted-checks.json','ARCHIVE_VERIFICATION.json']:
 shutil.copy2(e/n,stage/n)
shutil.copytree(e/'comparison',stage/'comparison',dirs_exist_ok=True)
selected=[f'{v}-{s}' for v in ['troops','equipment','chain','fieldCompanion'] for s in ['intact','hit','broken']]+['gate-negative','gate-zero','gate-positive','gate-cap','chain-rest-missed','zero-members','density-256','short375-battle']
(stage/'targeted').mkdir(exist_ok=True)
for name in selected:
 for ext in ['png','json']:shutil.copy2(e/'targeted'/f'{name}.{ext}',stage/'targeted'/f'{name}.{ext}')
media=json.loads((e/'MEDIA_MANIFEST.json').read_text());full=next(x for x in media if x['path'].endswith('final-three-levels.mp4'));full['fullPackage']='YILU_BATTLE_REWORK_20260925_FULL_DEV.zip';full['zipMember']='YILU_BATTLE_REWORK_20260925_FULL_DEV/'+full['path'];full['seconds']=164.247333;full['speed']=1;full['continuousNatural']=True;(stage/'FULL_FLOW_INDEX.json').write_text(json.dumps(full,ensure_ascii=False,indent=2)+'\n')
source=json.loads((e/'BUILD_ID.json').read_text())['gameSource']['sha256']
(stage/'README.md').write_text(f'''# 给GPT核验：一路长歌战斗返工

版本 `0.9.2-battle20260925` / `battle-rework-20260925`。源码指纹 `{source}`。

**本包已经包含真实PNG和MP4，不是路径清单。** 打开 `index.html` 看三组前后图和30秒原速战斗视频；四箱完整/受击/破裂、正负门、密度及短屏原图在 `targeted/`。

- 可操作游戏：本机 http://127.0.0.1:43198/play/ 。其他电脑解压完整开发包后双击 `启动一路长歌.command`，需要Node18+，预构建不需要npm安装或Cocos。
- 三组对照：390×844，第二关，刀+邢道荣，12秒10人/22秒14人/28.85秒13人。明确模型重放夹具，所有模型摘要与基线一致；不是自然实玩。
- `battle-showcase.mp4`：同一最终自然三关的5段×6秒原速摘录，保留现场SFX，没有加速/后期补画/BGM。每段起止见 `CLIPS.json`。
- 最终自然三关1次通过，结尾38/17/67人，暂停、过渡、会盟与存档刷新通过；完整164.247秒MP4及原始WebM位于完整包，路径和SHA见 `FULL_FLOW_INDEX.json`。
- 71项相关测试、22项定向检查、资源失败重试与包体检查通过。微信本地18,472,446字节/余2,499,074字节，未上传发布。
- **未全绿**：V11通知暂遮远端标签、连续门密集态拥挤；V14实体手机未验。核心战场素材齐备，但不能据此冒称完全还原或真机通过。看 `KNOWN_GAPS.md` 和14项 `REVIEW_RESULTS.json`。

请重点核验真实战场与两张参考的材质、体积、方向、人物动作、门箱可读性，区分功能通过、视觉差距与设备证据。不要把图集源图或夹具当自然录像。
''')
html=(d/'index.html').read_text().replace("const base='/evidence/BATTLE-REWORK-20260925/comparison/'", "const base='./comparison/'").replace("'./source-pack/references/'+(s==='gates-crates'?'02_user_gates.png':'01_user_battle.png')", "'./comparison/'+(s==='gates-crates'?'reference-gates.png':'reference-battle.png')").replace('/evidence/BATTLE-REWORK-20260925/battle-showcase.mp4','./battle-showcase.mp4').replace('<video controls playsinline preload="metadata" src="/evidence/BATTLE-REWORK-20260925/final-three-levels.mp4"></video>','<p>完整连续录像位于完整开发包；<a href="./FULL_FLOW_INDEX.json">精确路径、时长与校验值</a>。</p>').replace('href="/play/?v=battle-rework-20260925"','href="http://127.0.0.1:43198/play/?v=battle-rework-20260925"')
(stage/'index.html').write_text(html)
entries=[{'path':p.relative_to(stage).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(stage.rglob('*')) if p.is_file() and p.name!='MANIFEST.json'];(stage/'MANIFEST.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
archive=out/'BATTLE_REWORK_GPT_EVIDENCE.zip'
if archive.exists():raise SystemExit('Evidence ZIP already exists; preserve it.')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(stage.rglob('*')):
  if p.is_file():z.write(p,stage.name+'/'+p.relative_to(stage).as_posix())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for x in entries:assert hashlib.sha256(z.read(stage.name+'/'+x['path'])).hexdigest()==x['sha256']
print(json.dumps({'file':str(archive),'bytes':archive.stat().st_size,'files':len(entries)+1,'pngs':len(list(stage.rglob('*.png'))),'actualMP4':True,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},ensure_ascii=False))
