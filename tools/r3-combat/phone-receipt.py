# coding: utf-8
from pathlib import Path
import json,datetime,hashlib,sys
R=Path(__file__).resolve().parents[2];P=Path('/Users/yvainair/Code/Codex/2026-10-03/yilu-r3-phone-private');s=json.loads((P/'install-session-current.json').read_text());private=Path(s['path']);D=R/'deliverables/R3-COMBAT-PATCH-20261002';E=R/'evidence/R3-COMBAT-PATCH-20261002/native'
a=json.loads((private/'apps-after.json').read_text())['result']['apps'][0];before=json.loads((P/'apps-before-current.json').read_text())['result']['apps'][0];save=json.loads((private/'save-verification.json').read_text());assert save['exact_same'];assert a['version']=='0.12.4' and a['bundleVersion']=='2026100303'
launchfile=private/('launch-unlocked.json' if (private/'launch-unlocked.json').exists() else 'launch.json');l=json.loads(launchfile.read_text());success=l.get('info',{}).get('outcome')=='success'
sys.path.insert(0,str(R/'tools/project-reader'));from common import game_fingerprint
fp=game_fingerprint()[0];assert fp==s['signing']['build']['code_fingerprint'];receipt={'produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bundle_id':s['bundle'],'device_type':'physical iPhone','before':{'version':before['version'],'build':before['bundleVersion']},'after':{'version':a['version'],'build':a['bundleVersion']},'build':s['signing']['build'],'signature_verified_and_matches_paired_phone':True,'installed':'passed','version_readback':'passed','save_protection':{'status':'passed','before_after_exact_equal':True,'files':save['before'],'scope':'Same-bundle overlay, before launching new app; no uninstall or clear data'},'launch':{'status':'passed' if success else 'blocked_locked','reason':None if success else 'iOS SBMainWorkspace denied launch because device is Locked','outcome':l.get('info',{}).get('outcome'),'pid':(l.get('result') or {}).get('processIdentifier')},'visual_touch_gameplay_background_audio_performance':'not_tested_in_this_install_task','game_code_unchanged':True,'private_backup_kept_locally':True,'no_camera_uninstall_publish':True}
(D/'PHONE-INSTALL.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));(E/'physical-install-2026100303.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
state='已由devicectl成功启动；这不是画面/触控/性能验收。' if success else '启动被iOS明确以Locked拒绝；请解锁后点《一路长歌》，或回复已解锁继续启动核验。'
(D/'PHONE-INSTALL.md').write_text('''# R3 手机覆盖安装回执（2026-10-03）

手机已由0.12.3 / 2026100201升级到 **0.12.4 / 2026100303**；devicectl只读回读确认，bundle仍为com.yvainair.yiluchangge。没有卸载、清档、发布或改动游戏源码。

安装前完整复制当前Documents到本机私有目录并计算每份文件SHA，安装后、启动前再次复制比对，两份文件与jsb.sqlite字节/SHA完全一致。备份保留在本机，不放入MCP或核验包。

原生buildId为ios-ae83f2b7d4a1408e，Release，游戏代码指纹cd613377a62aeddaff93ad9dbf39e72a272ab9305294bcf848694bde87beb0e1。签名strict校验、手机授权匹配、可执行文件SHA与原签名回执一致；本轮未重新构建或修改数值/素材/音频。签名到期2026-10-05 05:12:40 UTC，即北京时间13:12:40。

'''+state+'''

详细版本、存档hash和启动结果见PHONE-INSTALL.json及evidence/R3-COMBAT-PATCH-20261002/native/physical-install-2026100303.json。安装、启动、实际画面、触控、手动玩通、后台、性能与听验分别记账；本次没有获取真机运行截图或操作录像，不把浏览器20/20和静音录像算作手机验收。

R3仍有专用步态、33拒收资源与节奏/难度缺口。原REPORT.md、MCP-RESULT.json和s_20261003T034925_873e9c57保留交付时精确状态；它们的“未安装”是本次连接之前的历史状态，以本回执为安装事实更新，不重标旧录像。全部原始私有备份、安装/启动日志仍保留。
''')
p=R/'AI_HANDOFF.md';s0=p.read_text();s0=s0.replace('iOS Release与严格签名通过，实体连接disconnected，未覆盖手机；旧手机版仅历史记录。','iOS Release与严格签名通过；2026-10-03用户连接后已同bundle覆盖0.12.4/2026100303，实际设备版本回读及2份存档SHA完全一致。'+('启动成功，真实画面/触控/性能待验。' if success else '启动被Locked拒绝，待解锁；手机实际画面/触控/性能仍待验。')+' 最新安装事实见 PHONE-INSTALL.md / PHONE-INSTALL.json；此前未安装为历史。');p.write_text(s0)
p=D/'review.html';html=p.read_text();html=html.replace('最新0303原生构建和签名通过；实体安装、触控和性能仍待验，详见报告。','最新0303已覆盖安装并回读版本，存档SHA不变；'+('启动成功，' if success else '启动被手机Locked阻止，')+'触控和性能仍待验。<a href="/review/PHONE-INSTALL.md">手机安装回执</a>。');p.write_text(html)
print(json.dumps({'installed':True,'version':receipt['after'],'save_hashes_equal':True,'launch':receipt['launch'],'game_code_unchanged':True},ensure_ascii=False))
