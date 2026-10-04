from pathlib import Path
import zipfile,json,hashlib,os
R=Path(__file__).resolve().parents[2]
D=R/'deliverables/R3-COMBAT-PATCH-20261002'
P=D/'packages';P.mkdir(exist_ok=True)
E=R/'evidence/R3-COMBAT-PATCH-20261002'
web=json.loads((E/'web-manifest.json').read_text())
native=json.loads((E/'native/bridge-build-manifest.json').read_text())
assert web['code_fingerprint']==native['code_fingerprint']
assert json.loads((R/'build/r3-combat-web/assets/main/config.json').read_text())['scenes']
outputs=[]
for kind,root,stamp in [('WEB',R/'build/r3-combat-web',web),('IOS_UNSIGNED',R/'build/ios-r3-combat/proj/Release-iphoneos/CocosGame.app',native)]:
 out=P/('YILU_R3_0.12.4_2026100303_'+kind+'.zip')
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
  for p in sorted(root.rglob('*')):
   if p.is_file():
    assert p.suffix not in ('.mobileprovision','.p12','.pem'),str(p)
    name=p.relative_to(root).as_posix()
    if kind=='IOS_UNSIGNED':name='CocosGame.app/'+name
    z.write(p,name)
  z.writestr('BUILD-IDENTITY.json',json.dumps({k:v for k,v in stamp.items() if k!='source_files'},ensure_ascii=False,indent=2))
  if kind=='WEB':
   z.writestr('README-先读.md','实际 Cocos WebGL 本地可玩构建，0.12.4 / 2026100303。\nMac 解压后在该文件夹执行 python3 -m http.server 43218 --bind 127.0.0.1，再打开 http://127.0.0.1:43218/ 。请勿直接双击 index.html（浏览器禁止本地模块加载）。\n此包没有预置通关存档；不同 localhost 端口的浏览器存档各自独立。不是 iOS 原生或真机性能验收。\n')
   info=zipfile.ZipInfo('启动网页版.command');info.create_system=3;info.external_attr=(0o100755<<16);z.writestr(info,'#!/bin/zsh\ncd -- "${0:A:h}"\npython3 -m http.server 43218 --bind 127.0.0.1\n')
  else:z.writestr('README-先读.md','实际 iOS Release 未签名构建；须先使用合法开发签名才能安装，不能直接点击 ZIP 在 iPhone 安装。\n已签名设备候选保留在本地私有交付目录；未上传 TestFlight、未发布，设备覆盖安装/启动/性能仍待验。\n')
 with zipfile.ZipFile(out) as z:assert z.testzip() is None
 outputs.append({'kind':kind,'file':str(out.relative_to(R)),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'code_fingerprint':stamp['code_fingerprint'],'build_id':stamp['build_id'],'verification':'ZIP CRC and actual scene/manifest checked; runtime verification is separately reported'})
(D/'playable-package-manifest.json').write_text(json.dumps(outputs,ensure_ascii=False,indent=2));print(json.dumps(outputs,ensure_ascii=False))
