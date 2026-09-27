"""Package current source/build and real audit media. Does not include credentials or work caches."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib,difflib,re
root=Path.cwd();release=root/'release/FORMAL-20260927';release.mkdir(parents=True,exist_ok=True);ev=root/'evidence/FORMAL-20260927'
# Compare to the exact dirty intake, not HEAD (which also contains unrelated earlier work).
changes=[]
with ZipFile(ev/'intake/before-source.zip') as z:
 for name in ['assets/scripts/Game.ts','assets/scripts/Platform.ts','package.json','tsconfig.json','tools/v09-assets.mjs','AI_HANDOFF.md','PROGRESS.md','BLOCKED.md']:
  before=z.read(name).decode() if name in z.namelist() else ''
  after=(root/name).read_text();changes.extend(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='intake/'+name,tofile='current/'+name))
(ev/'INTAKE_DELTA.patch').write_text(''.join(changes))
small={p for p in ev.iterdir() if p.is_file() and p.suffix in ['.json','.md','.patch','.html'] and not p.name.startswith('harness-')}
small|={ev/n for n in ['battle-short.mp4','final-ui-control.mp4','video-ten-contact.jpg','final-prepare-360x640.png','natural-ten-reloaded.png','formal-tests.log','typecheck.log','all-tests.log','baseline-failures.log','video-decode.log']}
small|={p for p in (ev/'comparison').iterdir() if p.is_file()}
review=small|{ev/'natural-ten.mp4',ev/'natural-three.mp4'}
review|={p for p in ev.glob('natural-*-result.png')}
review|={p for p in ev.glob('prepare-*x*.png')}|{p for p in ev.glob('battle-*x*.png')}
source=set()
for tree in ['assets','art-source','settings','tests']:
 source|={p for p in (root/tree).rglob('*') if p.is_file() and not any(x in p.parts for x in ['__pycache__','.DS_Store'])}
for tree in ['tools','docs/FORMAL-20260927']:
 source|={p for p in (root/tree).rglob('*') if p.is_file() and p.suffix in ['.mjs','.js','.ts','.py','.json','.sh','.md','.html'] and not any(x in p.parts for x in ['downloads','node_modules','__pycache__','.cache'])}
for name in ['package.json','package-lock.json','tsconfig.json','tsconfig.core.json','AGENTS.md','CLAUDE.md','AI_HANDOFF.md','PROGRESS.md','BLOCKED.md','handoff-manifest.json','PLAY_FORMAL.command','.gitignore']:
 source.add(root/name)
for tree in ['build/web-mobile','build/wechatgame','docs/BATTLE-PREVIEW-20260926','docs/UI-REDESIGN-20260926']:
 for p in (root/tree).rglob('*'):
  if not p.is_file() or p.name in ['project.private.config.json','.DS_Store'] or p.suffix in ['.webm','.mp4','.zip','.log']:continue
  if 'deliver' in p.parts or 'baseline-20260927-approved' in p.parts:continue
  source.add(p)
source|=small
# Keep the original handoff complete, including frozen approved media.
source|={p for p in (root/'docs/BATTLE-PREVIEW-20260926').rglob('*') if p.is_file() and p.name!='.DS_Store'}
# Large matrix originals are included in the evidence ZIP; the developer ZIP retains reports and four key pairs.
source={p for p in source if not (p.parent==ev/'comparison' and re.match(r'\d+x\d+-',p.name))}
light={p for p in small if not (p.parent==ev/'comparison' and re.match(r'\d+x\d+-',p.name)) and p.name not in ['all-tests.log','baseline-failures.log']}

# Local game AppID in public project.config.json is retained for the user's existing test project;
# private developer settings, credentials, login data, .env, QR tokens and caches are not packaged.
for p in list(source|review):
 if p.suffix in ['.md','.ts','.mjs','.js','.py','.json','.sh'] and p.stat().st_size<3000000:
  text=p.read_text(errors='ignore')
  if re.search(r'(?<![\w])(?:sk-proj-[A-Za-z0-9_-]{25,}|ghp_[A-Za-z0-9]{25,}|gho_[A-Za-z0-9]{25,})',text):raise ValueError('Credential-like literal in '+str(p.relative_to(root)))
manifest=[]
for name,files,prefix in [('一路长歌_FORMAL_完整开发包.zip',source,'YILU_FORMAL'),('一路长歌_FORMAL_核验包.zip',review,'YILU_REVIEW'),('一路长歌_FORMAL_核验小包.zip',light,'YILU_REVIEW_SMALL')]:
 path=release/name;rows=[]
 with ZipFile(path,'w',ZIP_DEFLATED,compresslevel=5) as z:
  for p in sorted(files):
   if not p.exists():raise ValueError('Missing '+str(p))
   rel=str(p.relative_to(root)) if prefix=='YILU_FORMAL' else str(p.relative_to(ev));
   if prefix=='YILU_REVIEW_SMALL' and p.name=='index.html':
    page=p.read_text();a=page.index('<h2>完整自然十关');b=page.index('<h2>最后修补',a);page=page[:a]+'<h2>完整十关</h2><p>为控制小包体积，完整十关MP4在独立完整核验包中。此包包含逐关数据、原速第四关短片及最后修补短片。</p>'+page[b:];z.writestr(prefix+'/'+rel,page)
   else:z.write(p,prefix+'/'+rel)
   rows.append({'path':rel,'bytes':len(page.encode()) if prefix=='YILU_REVIEW_SMALL' and p.name=='index.html' else p.stat().st_size,'sha256':hashlib.sha256(page.encode() if prefix=='YILU_REVIEW_SMALL' and p.name=='index.html' else p.read_bytes()).hexdigest()})
  z.writestr(prefix+'/PACKAGE_MANIFEST.json',json.dumps(rows,ensure_ascii=False,indent=2))
  if prefix=='YILU_FORMAL':z.write(root/'docs/FORMAL-20260927/README.md',prefix+'/README_FORMAL.md')
 with ZipFile(path) as z:
  if z.testzip():raise ValueError('ZIP integrity failed')
 manifest.append({'file':name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'files':len(rows)})
(release/'交付清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps(manifest,ensure_ascii=False,indent=2))
