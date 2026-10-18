from pathlib import Path
import json,hashlib,shutil,datetime,zipfile,html,sys
R=Path(__file__).resolve().parents[2];T='YILU-REGRESSION-FIRST-UI-FULL-20261001';E=R/'evidence'/T;D=R/'deliverables'/T;I=R/'docs/YILU-BUGFIX-UI-FULL-20261001/intake'
D.mkdir(parents=True,exist_ok=True)
for s in ['FIX-ONLY','UI-FINAL','media','checks']:(D/s).mkdir(exist_ok=True)
load=lambda p:json.loads(p.read_text()); put=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)); sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=load(E/'entry-code.json');b=load(E/'source-final.json');old=dict(a['files']);new=dict(b['files']);changed=[p for p,h in old.items() if new.get(p)!=h];added=[p for p in new if p not in old];assert len(changed)==5,changed
scope={'task':T,'baseline_code_fingerprint':a['code_fingerprint'],'code_fingerprint':b['code_fingerprint'],'phase_A_changed_preexisting_files':[{'path':p,'before':old[p],'after':new.get(p)} for p in changed],'phase_A_added_files':[{'path':p,'sha256':new[p]} for p in added],'phase_B_runtime_changes':[],'preexisting_game_files_unchanged':len(old)-len(changed),'gameplay_and_save_and_audio_preservation':'All pre-existing game files except listed five are byte-identical to entry; battle model equality separately tested','conservation':load(E/'conservation-final.json'),'no_git_commit_push_release':True};put(D/'SOURCE-SCOPE.json',scope)
for p in (E/'web-auxiliary').glob('final-*'):shutil.copy2(p,D/'media'/p.name)
for n in ['all-tests-final.log','typecheck-final.log','matrix.log','native-pool-final.json','conservation-final.json','archived02-reproduction.json','install-readback.json','device-launch-status.json','signing.json','metadata-recovery.json','simulator-runtime-status.json']:shutil.copy2(E/n,D/'checks'/n)
shutil.copy2(E/'FIX_ONLY-clean-import/bridge-build-manifest.json',D/'FIX-ONLY/bridge-build-manifest.json')
shots=load(I/'SCREENSHOT_MANIFEST.json')[:6]
for s in shots:shutil.copy2(I/s['path'],D/'media'/s['filename'])
put(D/'media/before-provenance.json',shots)
assets={'runtime_integrated':{'frame_map':load(R/'art-source/regression-20261001/frame-map.json'),'source_provenance':load(R/'art-source/regression-20261001/provenance.json'),'validation':load(R/'art-source/regression-20261001/asset-validation.json'),'limits':'27 frames integrated; not all riding combinations visually accepted; no new mount gait claim'},'phase_B_offline_only':{'manifest':load(R/'art-source/ui-full-20261001/manifest.json'),'provenance':load(R/'art-source/ui-full-20261001/generation-provenance.json'),'runtime_integrated':False},'blocked_assets':'12 new characters true alternating-leg gait: four image-generation attempts rejected for weapon drift and same lead leg; see art-source/regression-20261001/README.md'};put(D/'ASSET-MANIFEST.json',assets)
acc=load(I/'ACCEPTANCE_TEMPLATE.json');acc.pop('notice',None);acc['executed_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();acc['gate_A'].update(status='blocked_device_and_asset',build_id='ios-5128f4ea68bc4081',code_fingerprint=b['code_fingerprint'],device_build='0.12.1 / 2026100102',receipt='checks/install-readback.json',passed_bug_ids=[],blocking_bug_ids=['B10','B11','B12'],note='Core code checks passed and installed; no bug has complete required physical-device scenario acceptance.');acc['gate_B']['status']='blocked_gate_A'
acc['test_runs']=[{'name':'full_game_tests','passed':330,'failed':0,'skipped':0,'evidence':'checks/all-tests-final.log'},{'name':'typecheck','status':'passed','evidence':'checks/typecheck-final.log'},{'name':'render_matrix','cases':5760,'scope':'recording mock renderer, not native pixels','evidence':'checks/matrix.log'},{'name':'data_audio_conservation','status':'passed','cases':32,'ticks_per_case':1500,'evidence':'checks/conservation-final.json'},{'name':'NativePaint_pool','status':'passed','scope':'real renderer source with mocked Cocos transport','evidence':'checks/native-pool-final.json'}]
acc['videos']=[];acc['known_failures']=['No final physical native running screenshot or continuous recording: phone locked','No simulator verification: installed iOS runtime unavailable','Browser screencast captured 422 in-memory frames but persistence failed when browser disconnected; no delivered video and no video pass','Twelve character gait resources rejected; all weapon/mount hand contacts not fully visually verified']
acc['blocked_actions']=['Gate A physical c11 liannu2→3, direction changes, dense obstacles and boss transition','Physical touch, background recovery and low-interference performance','Gate B integration of all thirteen noncombat UI pages']
for p in acc['ui_pages']:p['status']='blocked_gate_A';p['note']='Offline components prepared; no new runtime page integration'
acc['bug_results']=[]
notes={'B00':'Installed old 2026093002 identified; current 2026100102 read back; launch blocked','B01':'Explicit icon/resource failure classification and complete pooled sprite rebind; Web HUD visible; background/device pending','B02':'One player body; brandish changes same-body highlight; 5760 mock draw scenarios','B03':'Abort hides whole failed frame; pauses logic/audio/input; RNG restored; explicit retry actual Web click verified','B04':'Separate held and pickup roles; unique eventId; icon capped26px; expiry unchanged','B05':'Projectile visual uses launch weaponId; crossbow bolts separated from unchanged snake-family collision model','B06':'reposition maps to 换阵; current actual Web boss screenshot; native transition pending','B07':'Separate body/weapon fit, buttons and identity rows; actual 375×667 and402×874 screenshots','B08':'Near foreground wall opacity only; collision/data unchanged; dense device scenario pending','B09':'Permanent Lv bonus and initial tier I explicitly separated, gameplay unchanged','B10':'Weaponless new mount base, hand caps and parts integrated; 16×all poses mapped; not all contact combinations visually accepted','B11':'Existing legal hero alternating gait reused for new weapons; twelve character gaits still blocked_asset','B12':'No current phone FPS/thermal/background measurement; no performance pass'}
for x in load(I/'BUG_REGISTER.json')['bugs']:
 x.update(status=('blocked_asset' if x['id']=='B11' else 'partial_pending_device'),result=notes[x['id']],fixed_build='2026100102',root_cause_confirmed_on_user_build=False);acc['bug_results'].append(x)
acc['actual_media']=[]
for p in sorted((D/'media').glob('final-*.json')):
 q=load(p);acc['actual_media'].append({'path':'media/'+p.with_suffix('.png').name,'sha256':q['source_sha256'],'capture_type':'browser','code_fingerprint':q['build']['code_fingerprint'],'run_id':q['state'].get('runId'),'scope':q['scope']})
put(D/'acceptance.json',acc)
(D/'UI-FINAL/NOT-BUILT.md').write_text('本阶段尚未接入或构建。任务书 Gate A 要求当前修复包真机定向运行通过；手机锁定且动作素材尚有缺口。离线组件共13类32帧，不等于13类页面完成。原始组件在 art-source/ui-full-20261001/。\n')
(D/'FIX-ONLY/README.md').write_text('旧皮肤修复版 0.12.1 / 2026100102；已同bundle覆盖安装并回读。原生CocosGame-unsigned.zip是完整未签名Release .app，需本机开发签名，不是可直接点装IPA。已签名副本保留本机私有目录，不外发profile/设备信息。Web辅助包解压后用 python3 -m http.server 43212 --bind 127.0.0.1 启动，打开 http://127.0.0.1:43212/；不作为原生验收。\n')
(D/'INSTALL-REPORT.md').write_text('''# iPhone 覆盖安装核对

- 入场实装：0.12.0 / 2026093002；不是上轮最终08。
- 本轮包：0.12.1 / 2026100102，com.yvainair.yiluchangge。
- Release 构建、严格 codesign 校验、覆盖安装、设备版本回读：通过。
- 安装前即时备份与安装后启动前的 jsb.sqlite SHA-256 相同：`07252fd8ec060a1867aeeb270572dd70ea0cf56b875aaa9d72d0660b865c673f`。没有卸载或覆盖玩家档。
- 启动：失败。iOS 返回 FBSOpenApplicationErrorDomain 7 / Locked。不是游戏运行通过。
- 启动后的字段迁移、手指操作、后台恢复、FPS/发热/耗电/音频体验：not_run。
- 原始Documents备份、设备标识和签名profile只保留本机私有目录，不在核验包。
- 当前沿用既有免费开发签名，profile有效期至2026-10-05 05:12:40 UTC；之后需重新签名安装。

下一步：解锁并保持iPhone连接；继续当前包定向验证，不再重复无关全库测试。技术门槛通过后才能接入新UI。
''')
report='''# 本轮结果：旧皮肤修复包已安装，总任务尚未验收完成

任务：YILU-REGRESSION-FIRST-UI-FULL-20261001。没有把新UI接入正式构建，没有提交、推送或发布。

## 当前版本与实际限制

FIX_ONLY 为 **0.12.1 / 2026100102**，build_id `ios-5128f4ea68bc4081`，代码指纹 `FP`。工作区保留原 dirty，分支仍为 codex/ios-polish-round2-20260929，HEAD 79fbea0。设备已回读新版；安装前后即时存档字节相同。启动被手机锁定拒绝，因此真机关键操作/性能/后台/启动后存档验证均未通过。

任务书 §3 明确：“设备被锁或不可用……不得把新UI接入发布包或覆盖用户版本来绕过Gate A”。因此 Gate A 标 blocked_device_and_asset；Gate B 的13类页面均 blocked_gate_A。不是等用户逐页审批，也不是以等待审美验收代替开发。

## 根因与修复

手机旧实装2026093002的归档JavaScript，在第11关连弩二阶第7 tick复现 `ReferenceError: Cannot access 'e' before initialization`，8次begin只有7次end。复现使用归档包加惰性绘制器，不是手机当时日志；六张原图没有运行指纹，不能断言它们全由同一异常造成。

- B01/B03：完整帧失败立即abort清空活动节点，停止逻辑/位移/音效，finally恢复随机状态，独立安全UI提供重载/回营。资源错误分映射缺失、未就绪、已释放、非法矩形、过期节点；不吞错冒充零错误。真实Web故障注入与按钮恢复已截图，手机场景仍待验。
- B02：亮兵仅高亮原身体，移除偏移的第二套身体；提交带actor/role。5760绘制组合只有一个玩家身体。
- B04/B05：统一WeaponPresentation解析；手持部件与拾取图标分开，飞入带唯一eventId、最大26px和原有到期清理。连弩使用发射时兵器身份画弩矢，保留攻击族、子攻击、命中/伤害与音效。
- B06：Boss reposition显示“换阵”，敌将栏实际Web截图可见；手机连续切换仍待验。
- B07/B09：旧皮肤整备独立预览框、兵器整体fit、姓名/按钮分区；永久Lv.3的实际+24%与本局Ⅰ阶明确分开。375×667、402×874运行截图已查看。
- B08：靠近玩家的前景墙段降低不透明度；碰撞与门值保留。手机箱门密集段仍需连续运行检查。
- B10：新坐骑无兵器基础身体、明确手部socket、遮挡手指与双持独立部件已接入，共27帧。所有映射矩阵通过不等于每个握持接触点视觉通过；部分弩支撑手、弓弦端点、双持遮挡仍待完整运行逐组合核验。
- B11：新兵器复用已有真实四相蓝披风身体并保留独立持械。十二名新人物的服装专属交替步态仍未完成：四次image_gen产物出现同脚一直在前、兵器变形/缺失，已拒用。记录在art-source/regression-20261001/README.md，未把假帧导入。
- B12：本次真机性能未测；模拟器iOS runtime当前缺失。不能引用上轮低帧率日志作为本轮通过或提升证据。

## 检查及边界

全库330/330通过，0跳过；typecheck通过；5760组合是绘制记录器矩阵；NativePaint测试为真实源码+mock Cocos节点传输，覆盖重绑、稀疏尾部、10次abort/recover不增长、销毁与5类错误。32组×1500tick相同合法输入，对入场dirty业务状态、伤害/战损/奖励及音效事件逐tick完全相等。全部原有游戏文件中仅5个发生变化，其余逐字节保持，详见SOURCE-SCOPE.json。

过程中四项既有断言失败已处理：烘焙坐骑帧改为无兵器身体+部件；蛇形攻击族保留但连弩视觉改短矢；旧c20身体前缀改r26且保留相机边界验证；整备高度实际回归已压回原布局范围。未删测试或放宽游戏数值。

构建时出现Cocos导入器把280个.meta写成通配符的故障。只按入场哈希恢复确定损坏文件，损坏副本和缓存移到本机专用备份，使用项目局部TMPDIR重新导入；最终原生Release成功、源码与导出指纹一致。没有把失败导出安装到手机。

## 证据与交付

media/包含六张用户原图以及六张最终指纹绑定的实际Cocos WebGL截图和状态JSON。原图与最终图平台/时刻不同，不能称同状态原生前后对照。较早候选截图留在evidence，不换贴最终指纹。index.html逐张可看。

**连续原速录像未交付**：真机因锁屏无法录制；辅助Web尝试采到422内存帧，但写出时浏览器连接中断，未得到可播放文件，不能当录像通过。也没有当前原生运行画面。原生模拟器因runtime不可用未执行。

FIX-ONLY/提供完整原生未签名.app压缩包、辅助可玩Web构建及版本清单；手机已安装签名修复包。UI-FINAL/只有明确未构建说明，绝不冒充新UI版本。

阶段B离线资源已完成13类32图块、RGBA图集、九宫格参数/三背景QA；运行页面0/13接入。这些是准备材料，不是效果图交付代替正式页面。

## 继续执行条件

1. iPhone解锁并保持连接，针对同包完成第11关连弩2→3、左右变向、密集门箱、Boss切换、安全恢复、后台、存档字段与性能实测及连续录像。
2. 关闭上述B10/B11具体素材/握持组合缺口；未关闭总验收保持未完成。
3. Gate A真正通过后，连续接入U01–U13及所有真实数据/状态分支，另出UI-FINAL构建和运行证据。不会逐页请求审批。

MCP最终快照见MCP-RESULT.json；本地收集、隧道状态与ChatGPT实际读取分开。没有让ChatGPT本次实际读取成功的证据。
'''.replace('FP',b['code_fingerprint']);(D/'REPORT.md').write_text(report)
cards=[]
for p in sorted((D/'media').glob('*.png')):cards.append(f'<figure><img src="media/{html.escape(p.name)}"><figcaption>{html.escape(p.name)} · 实际Cocos WebGL辅助证据，非原生</figcaption></figure>')
for s in shots:cards.append(f'<figure><img src="media/{s["filename"]}"><figcaption>{s["id"]} 用户原图 · 实装指纹/帧时间未知</figcaption></figure>')
(D/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>一路长歌 FIX_ONLY 核验</title><style>body{font:16px system-ui;background:#10202b;color:#eee;max-width:1200px;margin:30px auto;padding:20px}a{color:#efd18b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}img{width:100%;height:500px;object-fit:contain}figure{margin:0;padding:12px;background:#233441}figcaption{overflow-wrap:anywhere}</style><h1>旧皮肤修复版已安装 · 总任务未完成</h1><p>0.12.1 / 2026100102；手机锁定，Gate A未通过；UI-FINAL尚未接入。新UI离线素材不是新页面。</p><p><a href="REPORT.md">完整结果</a> · <a href="INSTALL-REPORT.md">安装与存档</a> · <a href="acceptance.json">逐项状态</a> · <a href="FIX-ONLY/CocosGame-unsigned.zip">原生未签名构建</a> · <a href="FIX-ONLY/Web-auxiliary.zip">辅助Web可玩包</a></p><p>以下六张修复后画面均绑定本轮指纹。用户原图不具备运行指纹，两组不是同状态原生对照。当前无合格的连续运行录像。</p><div class="grid">'+''.join(cards)+'</div>')
for source,out in [(R/'build/ios-device/proj/Release-iphoneos/CocosGame.app',D/'FIX-ONLY/CocosGame-unsigned.zip'),(R/'build/regression-web',D/'FIX-ONLY/Web-auxiliary.zip')]:
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as z:
  for p in source.rglob('*'):
   if p.is_file() and p.name!='embedded.mobileprovision':z.write(p,p.relative_to(source.parent if source.suffix=='.app' else source))
put(D/'FIX-ONLY/packages.json',[{'path':p.name,'sha256':sha(p),'bytes':p.stat().st_size} for p in (D/'FIX-ONLY').glob('*.zip')])
print(json.dumps({'delivery':str(D),'changed_preexisting':changed,'new_game_files':len(added),'status':'blocked_device_and_asset'},ensure_ascii=False))
