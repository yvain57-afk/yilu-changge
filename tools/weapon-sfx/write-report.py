from pathlib import Path
import json,hashlib,datetime
R=Path(__file__).resolve().parents[2];D=R/'deliverables/YILU-WEAPON-SFX-20260930';E=R/'evidence/YILU-WEAPON-SFX-20260930';m=json.loads((D/'asset-manifest.json').read_text());b=json.loads((E/'bridge-build-manifest.json').read_text());dev=json.loads((E/'device/bridge-build-manifest.json').read_text());ev=json.loads((D/'native-listening-evidence.json').read_text());timeline=json.loads((D/'audition-timeline.json').read_text())
report=f'''# YILU-WEAPON-SFX-20260930 实际交付

十种兵器的音效资源、正式事件接线、模拟器系统录音和两种原生构建已完成。**真机扬声器／耳机听验、本机后台实际切换和最终听感尚未验收。** 本轮不修改视觉、数值、攻击节奏、关卡或正式存档；无提交、推送、合并、付费 API 或发布。

## 版本和可复核入口

- 工程 `/Users/yvainair/Code/游戏-左右滑古代史`，分支 `codex/ios-polish-round2-20260929`，HEAD `79fbea0f8f135e6d9457cde672118b52baacb4b6`，dirty 保留。
- 任务基线 `s_20260930T023645_461571fe`、`cea5390c9f9fb2b13dbb85e689bb6fe39cea29d4cd5509ca1b4d2b20a64804b0`；四个任务核心文件入场哈希一致。
- 当前代码及两种构建前指纹 `{b['code_fingerprint']}`。
- 模拟器 Debug：`{b['build_id']}`；设备 Release：`{dev['build_id']}`。应用版本 `0.11.1 / 20260930`。
- 本报告的版本绑定与 SHA-256 在 `acceptance.json`；MCP 应先读该 JSON，再核对本文件哈希。最终快照收据见 `FINAL-SNAPSHOT.json`，不要拿 HEAD 代替 dirty 代码指纹。
- 单独保存入场状态 `evidence/YILU-WEAPON-SFX-20260930/baseline.json`、`dirty-before.txt` 和本轮三文件差异 `task-only.patch`。

## 实际接入

| 项目 | 实际结果 |
|---|---|
| 资源 | 10×3 主将发招 + 3×3 部曲武装 + 4×3 材质接触 = 51 个 WAV；44.1kHz、单声道、16bit PCM，每个有 Cocos meta |
| 材质 | 软组织／布甲短闷击、精兵及将领短金属接触、箱／门木质；未知为 dry generic 并计数。按实体类别显式映射，未宣称自动识别画面材质 |
| 来源 | Still North Media 的兵器、弓弦、弩机录音；Kenney Impact Sounds 材质拟音，均 CC0。取不同真实动作片段，剪切、滤波、渐变、归一和录音叠层；没有以正弦／随机噪声替代全库 |
| 变体 | 每组 3 个，独立循环轮换，不调用战斗 RNG、不连续重播同变体 |
| 发招／命中 | wave、真实箭簇发射、gateHit、有效 impact、实际战损／敌将预警发事件；空挥不发接触声。投射物生成时固定 weaponId，旧弹道不随换兵器改变归属 |
| 聚合 | 同次发招同时弹道合并；实际间隔子攻击保留；同攻击同材质 100ms 接触聚合。日志含 event/run/attack/projectile/tick/source/weapon/arms/material/heavy |
| 正式消费 | FormalGame 统一交给 Platform；旧 totals.damage→hit/break 叠加路径撤下，重击震动保留。奖励提示保留；受伤和危险由事件触发 |
| 生命周期 | 设置关／pause／hide／销毁停止声道清队列；重开丢弃旧事件；140ms 过期请求不补播。音乐仍关闭 |

普通声限保留原值：每类 1、总 3 声道、音量系数和 ≤0.65、≤12 次/秒、间隔 ≥25ms。新增两次/秒危险预留（非危险最多 10 次/秒）；危险/受伤 > 主将发招与关键重击 > 随军 > 部曲/普通群体接触。必要时停低优先声道，绝不无限叠加。音量系数和不是数字峰值证明。

普通实录：峰值 {ev['normal']['counters']['peakVoices']} 声部、系数和 {ev['normal']['counters']['peakVolume']:.2f}，聚合 {ev['normal']['counters']['merged']}、抢占 {ev['normal']['counters']['preempted']}；密集实录：峰值 {ev['dense']['counters']['peakVoices']}、系数和 {ev['dense']['counters']['peakVolume']:.2f}，聚合 {ev['dense']['counters']['merged']}、抢占 {ev['dense']['counters']['preempted']}。忙碌、预算、限流和过期抑制完整计数见 `native-listening-evidence.json`，不声称每一次低优先请求都播放。

新增 WAV 共 {m['total_bytes']:,} 字节；PCM16 解码 {m['pcm16_bytes']:,} 字节，若引擎用 float32 约 {m['float32_bytes']:,} 字节（不含 AudioSource／引擎管理开销，非进程内存实测）。包内新增媒体约 1.10MB；整体安装包同时受平台构建影响，未把整个 app 大小差值冒称纯音效增量。

## 验证结果

- `npm run typecheck` 通过。
- 一次全库 `npm test`：279/279，通过，0 跳过，其中音效专测 15/15（已含生命周期及真实随军身份回归）。检查 JSON 带相同最终 code_fingerprint。
- 十种映射、变体轮换、实际发招/命中时间、换武器旧弹道归属、刺穿/范围合并、三种部曲、真实子攻击、预警抢占、12/s 与25ms、生命周期与加载失败重试均覆盖。
- 用本轮前 dirty battle.ts 作基线，第一／七／十关各跑 4200 tick：状态快照和伤害账本逐项一致；不将模型比较冒称原生十关再通关。
- 模拟器 Debug 与 iPhone Release 构建成功；两份 app 中分别按 SHA-256 命中全部 51 个最终 WAV，缺失为 0。模拟器实际加载 56 个 AudioClip（51 新 + 5 旧兼容提示），加载失败 0。
- 两段正式 Cocos 场景 DEBUG 隔离夹具约58秒，正常/密集，原速。仅夹具更换内存武器、目标与军队数，实际战斗事件/音频管线照常；不代表自然通关或手指触控。
- 两段均实际播放十兵器、bow/fire/repeater、wood/soft/metal。暂停区间原始音频峰值为 0，恢复后继续；最终待播与播放声道为空。无渲染异常记录。
- 原始系统音频峰值普通 {ev['normal']['audio_peak_dBFS']:.2f}dBFS、密集 {ev['dense']['audio_peak_dBFS']:.2f}dBFS，无数字削波。音频来自游戏 PID CoreAudio tap；视频来自 simctl，同宿主时钟对齐，约60ms同步不确定性。未把资源试听轨贴上去。
- 先尝试 ScreenCaptureKit 的 Device Hub 过滤，得到静音；改用游戏进程 tap 后得到非零真实音频。早期静音探针只作为失败记录保留。

## 可听交付与时间表

打开 `index.html` 可听试听、看两段实录及截图。`resource-audition.wav` 是最终资源对比，每件三个变体依次播放，**不是游戏内录音**。为了保留瞬态不削波，统一按 EBU R128 固定增益到 -34 LUFS（实测 -34.06 到 -33.92）；只在试听中调增益，游戏文件未被替换。可调播放器音量。

|试听起点|兵器|
|---|---|
'''
for r in timeline['rows']:report+=f"|{r['start_seconds']:02d}s–{r['end_seconds']:02d}s|{r['label']} `{r['weapon_id']}`|\n"
report+='''
`normal-native-system-audio.mp4` 与 `dense-native-system-audio.mp4` 为真实系统音轨实录；精确武器／暂停位置见 `native-listening-evidence.json`。普通段约 24.36–26.40 秒暂停，密集段约24.59–26.62秒暂停；时间来源为250ms状态采样。

## 文件和运行方式

- 正式资源：`assets/resources/audio/weapons/`；配置与调度：`assets/scripts/formal/WeaponSfx.ts`。
- 接线：`assets/scripts/formal/battle.ts`、`FormalGame.ts`、`assets/scripts/Platform.ts`。
- 来源、作者、原始文件hash、选取时间、编辑参数及最终hash：`art-source/weapon-sfx-20260930/asset-manifest.json`（交付目录也有副本）。原始素材与许可页完整保留。
- 构建：`builds/iOS-simulator-Debug.zip`、`builds/iOS-device-Release-unsigned.zip`。**设备 Release 未签名，不可直接装 iPhone**；本轮没有替换手机上的现有版本。
- 常规模拟器入口：安装 Debug app 后启动 `com.yvainair.yiluchangge`，不带参数即正常菜单。`--yilu-review=SFX:normal` / `SFX:dense` 仅 Debug 验证，使用独立内存存档。
- 构建复现：`python3 tools/build-ios.py --evidence-dir evidence/YILU-WEAPON-SFX-20260930/rebuild --version 0.11.1 --build-number 20260930`；设备另加 `--device --release`。不要把无签名构建当设备验收。

## 明确待验／未完成

1. 真机尚未安装本轮构建，未作扬声器、耳机、静音开关、音量和后台恢复听验。当前能看到已配对 iPhone，但本轮没有使用签名身份；需使用现有开发签名并在解锁设备上安装，不能把配对或构建成功当听验。
2. 十兵器的最终主观辨识度、轻重比例与手机上的整体响度待听验。素材本身已完成并接入，不是缺素材。火箭尾部是实录羽翎摩擦层形成的轻微粗糙尾音，并非火焰现场录音，其燃烧感是否足够列为具体听验项。
3. 原生实录覆盖主将、两名随军、部曲、暂停/恢复；真正切后台、静音开关、蓝牙路由变化尚未做原生设备检查，现有自动测试只证明生命周期代码路径。
4. MCP 本地新媒体和检查可读；ChatGPT 对**这个新快照**的再次调用尚未确认。read_media 仅给视频帧，不能声称 GPT 已听到音轨；应通过本地播放器听验。
5. 用户列出的遮挡、门牌、边界和高兵力重叠仅登记 `VISUAL-BACKLOG.md`，本轮没有修视觉。
'''
(D/'REPORT.md').write_text(report)
receipt={'task':'YILU-WEAPON-SFX-20260930','project_id':'yilu-changge','produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'code_fingerprint':b['code_fingerprint'],'baseline_snapshot_id':'s_20260930T023645_461571fe','builds':[{'build_id':b['build_id'],'target':'simulator','passed':True},{'build_id':dev['build_id'],'target':'physical_device','build_passed':True,'signed':False,'installed':False}],'report':{'path':str((D/'REPORT.md').relative_to(R)),'sha256':hashlib.sha256((D/'REPORT.md').read_bytes()).hexdigest()},'status':{'files_generated':'passed','cocos_import_and_packaging':'passed 51/51 both builds','formal_event_wiring':'passed','native_system_audio_recording':'passed normal+dense','physical_device_listening':'not_run','final_subjective_listening':'pending','visual_changes':'out_of_scope_logged','chatgpt_new_snapshot_read':'not_confirmed'},'checks':[json.loads((E/f'check-{x}.json').read_text()) for x in ['typecheck','tests','lifecycle']],'media':ev,'audio_resources':{'count':51,'bytes':m['total_bytes'],'manifest_sha256':hashlib.sha256((D/'asset-manifest.json').read_bytes()).hexdigest()}}
(D/'acceptance.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>一路长歌 · 十兵器音效核验</title><style>body{max-width:1000px;margin:auto;padding:28px;background:#111d2a;color:#eae3d5;font:17px/1.65 system-ui}a{color:#e7c586}h1,h2{color:#e7c586}audio{width:100%}video{width:min(100%,390px)}.cols{display:flex;gap:24px;flex-wrap:wrap}table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #43505d}button{font:inherit;background:#283c4f;color:#f4d99b;border:1px solid #667c85;border-radius:6px;padding:3px 12px;cursor:pointer}.note{background:#263443;padding:15px}</style><h1>一路长歌 · 十兵器音效核验</h1><p>0.11.1 / 20260930 · 已接入真实 Cocos 游戏 · 保留现有玩法和视觉</p><p class="note">已完成资源、事件、构建、模拟器系统录音。真机听验和最终听感仍待验。下面的试听与原生实录分开标注。</p><p><a href="REPORT.md">完整报告</a> · <a href="acceptance.json">版本与验收</a> · <a href="asset-manifest.json">素材来源/哈希</a> · <a href="VISUAL-BACKLOG.md">仅登记的视觉问题</a></p><h2>最终资源等响度对比</h2><p>三个实录变体／兵器，-34 LUFS，可调播放器音量。这是资源试听，不是游戏内录音。</p><audio id="aud" controls src="resource-audition.wav"></audio><table><tr><th>兵器</th><th>时间</th><th>播放</th></tr>'''
for r in timeline['rows']:html+=f'''<tr><td>{r['label']}</td><td>{r['start_seconds']}–{r['end_seconds']} 秒</td><td><button onclick="aud.currentTime={r['start_seconds']};aud.play()">试听</button></td></tr>'''
html+='''</table><h2>原生战斗实录 · 原速／真实系统声音</h2><p>Debug 隔离内存样段，实际事件与音频管线；非自然通关、非手指操作。未添加试听配音。</p><div class="cols"><div><h3>普通战斗</h3><video controls preload="metadata" src="normal-native-system-audio.mp4"></video></div><div><h3>密集战斗</h3><video controls preload="metadata" src="dense-native-system-audio.mp4"></video></div></div><h2>构建与待验</h2><p><a href="builds/iOS-simulator-Debug.zip">模拟器可运行构建</a> · <a href="builds/iOS-device-Release-unsigned.zip">iPhone Release 构建（未签名）</a></p><p>手机当前版本没有被替换。真机扬声器／耳机、静音与后台恢复尚未验证。火箭轻燃烧感、各兵器辨识度与整体响度需要实际听验。</p></html>'''
(D/'index.html').write_text(html)
