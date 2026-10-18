# -*- coding: utf-8 -*-
from pathlib import Path
import zipfile,json,hashlib,shutil,plistlib
R=Path(__file__).resolve().parents[2];D=R/'deliverables/YILU_UI_POLISH_R2';E=R/'evidence/YILU_UI_POLISH_R2'
def archive(dest,rows):
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
  for p,name in rows:
   if p.is_symlink():raise RuntimeError('symlink excluded '+str(p))
   z.write(p,name)
 with zipfile.ZipFile(dest) as z:assert z.testzip() is None
 return {'file':dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'members':len(rows)}
def tree(root,prefix=''):
 return [(p,prefix+p.relative_to(root).as_posix()) for p in root.rglob('*') if p.is_file() and not any(x in ['__pycache__','.DS_Store'] for x in p.parts)]
items=[]
items.append(archive(D/'web-playable.zip',tree(R/'build/ui-polish-r2-web')))
app=R/'build/ios-ui-polish-r2/proj/Release-iphoneos/CocosGame.app'
items.append(archive(D/'ios-ui-polish-r2-unsigned.zip',tree(app,'CocosGame.app/')))
source=[]
for folder in ['assets','native/engine','settings','tools/ui-polish-r2','art-source/ui-polish-r2-20261002','docs/YILU_UI_POLISH_R2','tools/project-reader','docs/BATTLE-PREVIEW-20260926']:
 for p,name in tree(R/folder,folder+'/'):
  if p.suffix not in ['.mobileprovision','.p12','.cer','.sqlite','.db'] and not any(x.startswith('.') for x in p.relative_to(R/folder).parts):source.append((p,name))
for f in ['package.json','package-lock.json','tsconfig.json','project.json','AI_HANDOFF.md','AGENTS.md','tools/build-ios.py','tools/build-ios.json','tools/run-local.mjs']:
 p=R/f
 if p.exists():source.append((p,f))
items.append(archive(D/'source-development.zip',source))
# Media and executable pages included, binaries distributed in separate candidates.
proof=[(p,p.relative_to(D).as_posix()) for p in D.rglob('*') if p.is_file() and p.suffix!='.zip' and p.name not in ['package-inspection.json','MCP-RESULT.json','GPT核验入口.md']]
items.append(archive(D/'一路长歌_UI_POLISH_R2_核验小包.zip',proof))
info=plistlib.loads((app/'Info.plist').read_bytes());m=json.loads((E/'native/bridge-build-manifest.json').read_text());m.pop('source_files',None)
result={'build':m,'packages':items,'native':{'version':info['CFBundleShortVersionString'],'build':info['CFBundleVersion'],'signed':False,'installed':False,'arm64':True,'app_bytes':sum(p.stat().st_size for p in app.rglob('*') if p.is_file())},'private_save_and_signing':'excluded','actual_media':'13 pairs raw+boards, 2 playable videos, original tail7frames, current four-size images; not a path-only manifest'}
(D/'package-inspection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2))
