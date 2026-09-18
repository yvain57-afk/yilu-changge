"""Archive this project's deliverables only; do not copy dependencies, caches or profiles."""
from pathlib import Path
import hashlib, json, zipfile
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'release'
OUT.mkdir(exist_ok=True)
for platform in ['web-mobile','wechatgame']:
    result=json.loads((ROOT/f'evidence/build-{platform}-result.json').read_text())
    assert result['success'] is True and result['exitCode']==36, f'Latest {platform} build did not succeed'


def archive(name, files):
    target=OUT/name
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(set(files)):
            if p.is_file() and not p.is_symlink():
                z.write(p,p.relative_to(ROOT))
    with zipfile.ZipFile(target) as z:
        bad=z.testzip()
        if bad: raise RuntimeError(f'CRC failed: {bad}')
        names=z.namelist()
        if any(n.startswith('/') or '..' in Path(n).parts for n in names): raise RuntimeError('unsafe archive path')
    return {'file':name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'entries':len(names),'crc':'passed'}

source=[]
for d in ['assets','art-source','settings','docs','tests']:
    source.extend((ROOT/d).rglob('*'))
source.extend(p for p in (ROOT/'tools').iterdir() if p.is_file())
for f in ['package.json','package-lock.json','tsconfig.json','tsconfig.core.json','.gitignore','.npmrc','README.md','PROGRESS.md','BLOCKED.md']:
    source.append(ROOT/f)
# Evidence is a separate archive: include original passes and diagnostic failures, never browser profiles.
rows=[archive('yilu-changge-source.zip',source),archive('yilu-changge-browser.zip',(ROOT/'build/web-mobile').rglob('*')),archive('yilu-changge-wechat.zip',(ROOT/'build/wechatgame').rglob('*')),archive('yilu-changge-evidence.zip',(ROOT/'evidence').rglob('*'))]
wx=json.loads((ROOT/'build/wechatgame/project.config.json').read_text())
assert wx['appid']=='touristappid' and wx['compileType']=='game'
assert json.loads((ROOT/'evidence/browser-runs.json').read_text())['complete'] is True
assert json.loads((ROOT/'evidence/browser-edge.json').read_text())['passed'] is True
assert json.loads((ROOT/'evidence/browser-failure.json').read_text())['passed'] is True
manifest={'title':'一路长歌','version':'0.1.0','engine':'Cocos Creator 3.8.8','archives':rows,'wechat':{'appid':'touristappid','compileType':'game','build':'passed','devtools':'blocked: dedicated AppID required; tourist code 10','device':'not verified'},'experience':'user review pending','notes':'See BLOCKED.md, including initial editor temporary-cache path deviation.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'SHA256SUMS').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in rows))
print(json.dumps(manifest,ensure_ascii=False,indent=2))
