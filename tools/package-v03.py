"""Portable prebuilt local web player. No dependencies or personal caches included."""
from pathlib import Path
import zipfile, hashlib, json
root=Path(__file__).resolve().parent.parent
out=root/'release'/'v03';out.mkdir(parents=True,exist_ok=True)
sets={'yilu-v03-playable-mac.zip':[root/'build'/'web-mobile',root/'tools'/'serve.mjs',root/'tools'/'launch.mjs',root/'启动一路长歌.command',root/'package.json',root/'docs'/'v03'/'PLAYTEST.md',root/'docs'/'v03'/'play.html'], 'yilu-v03-wechat-tourist.zip':[root/'build'/'wechatgame']}
receipts=[]
for name,items in sets.items():
 target=out/name
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
  for item in items:
   paths=sorted(item.rglob('*')) if item.is_dir() else [item]
   for p in paths:
    if p.is_file():z.write(p,Path('yilu-v03')/p.relative_to(root))
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
 receipts.append({'file':str(target.relative_to(root)),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(out/'SHA256.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2))
print(json.dumps(receipts,ensure_ascii=False,indent=2))
