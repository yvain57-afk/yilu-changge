# -*- coding: utf-8 -*-
from pathlib import Path
import json,hashlib,plistlib,subprocess
R=Path(__file__).resolve().parents[2];E=R/'evidence/YILU_UI_POLISH_R2';D=R/'deliverables/YILU_UI_POLISH_R2';D.mkdir(parents=True,exist_ok=True)
b=json.loads((E/'web-manifest.json').read_text());b.pop('source_files');fp=b['code_fingerprint'];n=json.loads((E/'native/bridge-build-manifest.json').read_text());n.pop('source_files',None)
def write(name,data): (D/name).write_text(json.dumps(data,ensure_ascii=False,indent=2) if not isinstance(data,str) else data)
base=json.loads((R/'docs/YILU_UI_POLISH_R2/REGRESSION_CASES.json').read_text());refs={'Q01':['interaction-checks-375.json','interaction-checks-360.json'],'Q02':['interaction-checks-360.json'],'Q03':['interaction-checks-375.json','interaction-checks-360.json'],'Q04':['page-matrix.json'],'Q05':['page-matrix.json','media/pair-U02-board.jpg','media/pair-U03-board.jpg','media/pair-U04-board.jpg'],'Q06':['interaction-checks-375.json','interaction-checks-360.json'],'Q07':['interaction-checks-375.json'],'Q08':['page-matrix.json','media/pair-U03-board.jpg'],'Q09':['page-states.json','page-flow.json'],'Q10':['page-states.json','page-flow.json'],'Q11':['page-matrix.json','page-flow.json'],'Q12':['interaction-checks-360.json','page-states.json','page-flow.json'],'Q13':['map-position.json','interaction-checks-375.json'],'Q14':['interaction-checks-375.json'],'Q15':['conservation.json','presentation-runtime.json','targeted-regression-summary.json'],'Q16':['old-video-tail/manifest.json','old-video-tail/contact.jpg'],'Q17':['normal-entry.json'],'Q18':['phone-status.json']}
for c in base['cases']:
 c['status']='passed_local_browser' if c['id']!='Q18' else 'blocked_device_and_gate'
 c['evidence_ids']=refs[c['id']]
 c['native_runtime']='not_run';c['physical_device']='not_run'
 if c['id']=='Q04':c['status']='passed_browser_cocos_coordinates_native_device_pending'
 if c['id']=='Q15':c['status']='passed_business_conservation_and_affected_rendering_assets_partial';c['scope_note']='Original dce4126 rendering/c11 evidence retained; latest map-only change reused per task. Missing actions are not marked complete.'
write('acceptance.json',{'_bridge_media':True,'project_id':'yilu-changge','task_id':base['task_id'],'baseline_snapshot_id':'s_20261001T152208_616b4696','build':b,'native_build':n,'overall_status':'menu_local_passed_assets_partial_device_pending','cases':base['cases'],'data':'passed scoped conservation','interaction':'passed actual browser touch/CDP, including normal entry','pixels':'actual Cocos captures inspected, not full physical visual acceptance','native_compile':'passed_unsigned_release_arm64','native_runtime':'not_run','physical_device':'blocked_CoreDeviceError_4016_and_FIX_ONLY_gate','installation_performed':False})
for f in ['interaction-checks-375.json','interaction-checks-360.json','map-position.json']:
 (D/f).write_bytes((E/f).read_bytes())
write('current-tests-receipt.json',{'build':b,'typecheck':'passed','test_invocations':361,'pass':361,'fail':0,'skip':0,'duplicate_imported_helper_invocations':12,'unique_test_cases':349,'source_logs':['evidence/YILU_UI_POLISH_R2/full-tests-final.log','evidence/YILU_UI_POLISH_R2/typecheck-final.log'],'not_device_acceptance':True})
report=f'''# YILU_UI_POLISH_R2 实际交付

本轮已在原工程接续13类真实页面，完成公共菜单裁切、文字排版、返回记忆、异常帧隔离及布局层次优化。**菜单本地验收通过；动作资产仍有明确缺口，原生运行与手机验收未通过，总任务不能标全完成。**

版本 **0.12.3 / 2026100201**；Web `{b['build_id']}`；原生 `{n['build_id']}`。
代码指纹 `{fp}`；分支 `codex/ios-polish-round2-20260929`，HEAD `79fbea0f8f135e6d9457cde672118b52baacb4b6`，dirty保留。任务基线快照 `s_20261001T152208_616b4696` / `c7fb089b…ec94`。没有提交、推送、合并、发布或覆盖手机。

## 真实变化与证据

- **滚动**：唯一可复用Cocos矩形Mask内容层，固定页头、页签和底栏在外；Sprite、Graphics、Label和点击交集一起裁切。长卡超过视口仍可逐段看完。1/8/半卡/到底/回顶、拖动反向松手均在375×667与360×640实际Cocos检查；详情按钮不足48px可见时不激活。
- **文字与返回**：菜单用实际Cocos Label字体测量，测量/换行/卡高共享，内容先clamp；语义padding让文字避开金边、图鉴徽章留在卡内。视图按页面/页签/筛选/详情ID保留滚动；奖励返回不重复演出、扣军功或结算。
- **异常**：旧源码图标/Label/viewport注入均留下半帧，保存基线复现；新实现三阶段均全层abort、清热区与遮罩，独立安全层可重试，存档不变。热身后真实页面开关20次节点池不增长。
- **整备**：压缩配装摘要，当前兵器置顶；永久Lv与本局阶位独立；四页签固定，选择与详情分开。两种小屏及隔离safe44/34都至少两项完整可选；完整编组仍能打开，信息未删。
- **图鉴/详情**：人物、姓名与关系徽章分区；已遇34/42、收服/支援/盟约独立统计，保留分页/筛选；42人物现有合格全身素材映射已接入并逐个实际打开。详情保留经历、能力、共鸣，满编替换/取消按原业务。
- **奖励/胜利**：主奖一次、其余两列，N来自唯一kind:id集合；第10关上下篇与第20关终局可打开。红幅实际承载胜利标题；结算移除底下战斗HUD，战果用轻量行。重游、下一出征目的地与全局进度分别说明；缺失归因显示未能给出具体原因，不编造。
- **其他页面**：营地复用合法品牌主视觉并标明与实际兵器栏的区别；地图五段/20城不变，标题与抽屉按实测文字计算高度，四尺寸展开城点坐标不变；失败/暂停/长确认/设置/加载/存档异常均实际可操作。降低动态兼容持久化，写失败回退；音乐保持关闭。

逐页真实数据绑定、操作与小屏状态见 `UI-PAGES.json` / `UI-PAGES.md`。入口 `http://127.0.0.1:43215/review.html`，正常游戏 `http://127.0.0.1:43215/`。隔离复核入口使用内存示范存档，正常入口另测浏览器独立存档；不会读取或清除手机玩家存档。

## 本次执行的检查

最终菜单版本128组真实Cocos页面/尺寸/边界状态，4尺寸375×667、360×640、402×874、430×932；其中safe44/34是逻辑隔离边界，不是设备实测。实际文字边界/热区检查无失败；最终13页已检查真实像素。两小屏各38操作检查、16追加资格/奖励/锁槽状态、42人物页面、6步正常入口保存/返回，以及28步连续页面操作均无页面错误。

类型检查通过；361次测试调用通过，包含12个被导入的旧辅助用例重复运行，独立用例349；不把数量当UI交付。32×1500tick旧任务入场业务/音效守恒一致，旧战斗/数据/store/音频资源未变。详见 `conservation.json`、`source-preservation.json` 与 Q01—Q18。

原生Release arm64已导出并编译，Info.plist回读0.12.3/2026100201，脚本/资源和指纹核对通过，**未签名、未安装、没有本次原生运行录像**。Cocos曾返回exit36却输出不完整场景，该次导出被拒收；最终以场景/脚本/资源和成功编译为准。Creator改写的121个旧dirty资源meta已按任务入场SHA与同UUID保护恢复，未缺失旧文件；构建保护脚本保留。原始二十关/规则/音效/存档均保留。

## 录像与版本边界

13组对照：真正的旧UI-FINAL构建c7fb089b与当前{fp[:12]}，冻结相同合法业务数据与scroll=0；截图均等待场景就绪后至少1.5秒让演出稳定，**不声称两构建精确同一动画毫秒**，原始状态/等待规则在sidecar。历史图不修改。

`media/page-operation-original-speed.mp4` 是当前指纹实际Cocos连续页面操作，原速、无音轨。包含真实触控及明示的隔离奖励/异常场景切换，不冒充一局自然进度或手机。`page-flow.json` wall_seconds是操作脚本起点，视频以录制起点计；二者没有严格同步偏移，不与模拟battle.t混用。

`media/c11-liannu-original-speed.mp4` 是本轮先前dce412675f0d…c2d构建实录。主将连弩二阶t=9.817s、三阶t=42.967s，自然第11关至结算t=108.1s；左右变向、密集门箱、Boss七状态及4种故障恢复；自然段后方向/故障样段单独标明。最终只更改地图文字/抽屉高度，战斗未再变，按任务要求沿用原片、保留原指纹，**没有重盖成当前cb指纹**。328组16兵器×5坐骑×4姿态及8个新增握持采样也保留原指纹。wall_seconds、模拟t、录像时间是不同的时钟。

旧139.92s录像已从128.260s直到139.8s抽出7张原帧并打包：128.26s收服，134s明确为injected regression HUD failure安全层，138/139.8s恢复；136s为暗色过渡帧。不将注入错误当自然崩溃，不推断两采样之间的精确起止。原SHA和采样时间见 `old-video-tail/manifest.json`。

## 明确未完成与阻塞

- **动作资产未齐**：已新增接入赤兔/的卢连弩两跑姿4身体帧和8手部层，独立兵器双接触点；全身映射42人已补齐。仍缺76个明确帧键，详见 `asset-gaps.json`：6个旧马连弩wind/rel/rec经过两轮10候选制作，因两握点跨度25–45%变化或后手不可见拒用；40个其余骑乘姿态键未产出合格资源；30个步态pass0/pass1过渡键未产出。70键尚未制作完成。对应攻击仍沿用旧表现，不能称动作完成或归为审美待定。源图/接触点/拒用原因可追溯到 `art-source/ui-polish-r2-20261002/`。
- **手机**：本轮一次只读回读遇CoreDeviceError4016，可信连接/CoreDevice服务不可用；无法确认当前手机版本。历史最后回读FIX_ONLY0.12.1/2026100102，仅作历史记录。本轮没有安装、签名、手机存档写入。FIX_ONLY主将连弩专项和原生安全区/触控/后台/性能仍待验；已提供偃月刀片继续保留，不代替连弩。准入未过不覆盖手机。
- **最终视觉**：当前菜单实际浏览器画面可核验；原生像素/手机流畅性、缺失骑乘/过渡动作未通过，不宣称总体验收全绿。视频无音轨，本轮未改变音效，不把无声视频当可听验收。

## 交付与使用

`index.html`展示实际前后图和两段视频；`一路长歌_UI_POLISH_R2_核验小包.zip`直接含这些媒体，不只是路径清单。`web-playable.zip`可解压本地HTTP运行；`ios-ui-polish-r2-unsigned.zip`为独立原生候选；`source-development.zip`包含当前源码/资源/本轮脚本与说明，排除签名、私人存档、缓存和依赖。

MCP项目专用缓存上限由4GiB调整为8GiB以保存本轮实际媒体，未改全局配置/登录/计费。最终快照和工具读取回执另见 `MCP-RESULT.json`。本次Codex连接读取与用户另开ChatGPT对最新快照的实际读取分列，后者不能自动标通过。
'''
write('REPORT.md',report)
write('README.md','''# 一页操作说明

1. 本机打开 http://127.0.0.1:43215/review.html ，可点开全部13类真实页面。正常游戏入口 http://127.0.0.1:43215/ 。复核页使用内存示范状态，与玩家存档分开。
2. 服务关闭后，在项目目录运行：`python3 -m http.server 43215 --directory build/ui-polish-r2-web --bind 127.0.0.1`。可玩ZIP解压后在解压目录同样启动HTTP服务；不要直接双击游戏index.html。
3. 整备先点选择条目；右侧详情只查看。向上滑列表，点详情再返回会恢复位置。图鉴可按关系筛选、翻页；奖励首奖独立、其余两列，上滑看更多。
4. 核验小包解压打开index.html：13组同业务状态前后图、实际原速菜单操作、第11关连弩原片、末段7帧都在包内。视频无音轨、不是手机录像。
5. 原生候选未签名，不能直接装到iPhone。先完成现有FIX_ONLY连弩专项手机准入；设备可信连接恢复后，按已有流程备份存档、签名覆盖并回读。当前不会覆盖手机。
6. GPT先调用一路长歌MCP的project_overview锁snapshot_id，再读取REPORT/acceptance与实际图片和录像帧。新菜单图用当前cb指纹；沿用的战斗片保留dce原指纹，不混为当前原生证据。

尚缺：76个骑乘/步态动作键（具体清单在asset-gaps.json）；原生运行与手机验收。不要把构建通过或素材图算手机通过。
''')
for path,title in [(R/'AI_HANDOFF.md','最新接续'),(R/'docs/ai-bridge/CURRENT.md','当前实际状态')]:
 old=path.read_text();prefix=f"## {title} · YILU_UI_POLISH_R2（2026-10-02）\n\n13类真实菜单布局/裁切/返回/异常隔离已实际接续。0.12.3/2026100201，指纹 `{fp}`；原生Release未签名未安装，手机本轮回读4016阻塞，历史FIX_ONLY0.12.1仅历史。菜单本地通过，76个动作帧键缺口、原生和手机仍待验，整体未完成。无提交/推送/发布，dirty/存档/音效/20关保留。入口 http://127.0.0.1:43215/review.html ，报告 `deliverables/YILU_UI_POLISH_R2/REPORT.md`。战斗片沿用dce4126原指纹；前后c7与cb菜单图、当前操作录像实际交付。MCP缓存本项目8GiB，最终快照见MCP-RESULT。\n\n以下为历史记录。\n\n"
 if not old.startswith(prefix):path.write_text(prefix+old)
print('report and gated acceptance generated')
