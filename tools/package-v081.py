"""Create the complete, account-neutral v081 handoff without editor caches."""
from pathlib import Path
import argparse, datetime, hashlib, json, shutil, zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'release/v081'
STAGE = DEST / 'YILU_V081_FULL_DEV'
DIRS = ['assets', 'settings', 'art-source', 'music-source', 'references', 'tests', 'tools', 'docs', 'build/web-mobile', 'build/wechatgame', 'evidence/v081', 'evidence/v08', 'evidence/runner-video-v2']
FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.core.json', '.npmrc', '.gitignore', 'README.md', 'PROGRESS.md', 'BLOCKED.md', '启动一路长歌.command']

def allowed(p):
    return not any(x in p.parts for x in ['node_modules', '.cache', '__pycache__', '.git', 'downloads']) and p.name not in ['.DS_Store', 'project.private.config.json'] and not p.name.startswith(('preview-qr', 'preview-result')) and p.suffix.lower() not in ['.zip', '.webm', '.pem', '.key'] and not p.name.startswith('.env')

def prepare():
    if STAGE.exists():
        raise SystemExit('Staging already exists; do not overwrite another handoff. Use --archive after verification.')
    STAGE.mkdir(parents=True)
    for name in DIRS:
        for src in sorted((ROOT / name).rglob('*')):
            rel = src.relative_to(ROOT)
            if src.is_symlink():
                raise RuntimeError(f'Unexpected symlink: {rel}')
            if src.is_file() and allowed(rel):
                dst = STAGE / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
    for name in FILES:
        shutil.copy2(ROOT / name, STAGE / name)
    cfgpath = STAGE / 'build/wechatgame/project.config.json'
    cfg = json.loads(cfgpath.read_text())
    cfg['appid'] = ''
    cfgpath.write_text(json.dumps(cfg, ensure_ascii=False, indent=2))
    (STAGE / '00_START_HERE.md').write_text("""# 一路长歌 v0.8.1 截图评审修订版

先读 `docs/v081/GPT_REVIEW.md` 和用户原评审 `docs/v081/YILU_V08_SCREENSHOT_REVIEW.md`。
当前事实以 `evidence/v081/summary.json` 为准；v08及runner-video-v2目录是历史证据，不是本轮运行结果。

## 直接试玩
安装Node.js 18+，在本目录执行 `PORT=43194 node tools/serve.mjs`，打开 http://127.0.0.1:43194/play/?v=081 。附带Web构建无需安装项目依赖或Cocos。

## 开发
`npm ci` 后执行 `npm run typecheck` 和 `npx tsx --test tests/runner-v08.test.ts tests/progression.test.ts tests/ui-v06.test.ts tests/combat-v05.test.ts`。
重建需Cocos Creator 3.8.8；脚本采用本机macOS安装路径。`YILU_EVIDENCE_DIR=evidence/v081 npm run build:web`。
微信分享配置AppID留空；预览需使用自己已确认的游戏测试项目身份。二维码和登录资料不在共享包内。

## 证据
本轮56项相关回归，页面/安全区定点检查、三关模型验证、一次最终第二关实际触摸重玩，以及独立接触/门颜色夹具。没有重录整套三关，不把夹具称为自然实玩。
查看 `evidence/v081/level2-contact-and-chain.mp4` 与 `contact-fixture.mp4`，并阅读范围说明。
""")
    print(json.dumps({'stage': str(STAGE), 'prepared': True}, ensure_ascii=False))

def archive():
    assert (STAGE / 'PACKAGE_VERIFICATION.json').is_file(), 'Verify the staged project first'
    entries = []
    for p in sorted(STAGE.rglob('*')):
        rel = p.relative_to(STAGE)
        if p.is_file() and allowed(rel) and p.name != 'MANIFEST.json':
            entries.append({'path': rel.as_posix(), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
    manifest = {'version': '0.8.1-rc1', 'generatedAt': datetime.datetime.now().astimezone().isoformat(), 'snapshot': 'current working tree including uncommitted work', 'includes': DIRS + FILES, 'excludes': ['Git history', 'dependencies and editor caches', 'personal editor profiles', 'login credentials', 'temporary preview QR', 'duplicate historical ZIP/WebM', 'full third-party video'], 'sanitized': {'build/wechatgame/project.config.json': 'appid blanked in shared package; local build unchanged'}, 'fileCount': len(entries), 'totalBytes': sum(x['bytes'] for x in entries), 'files': entries}
    (STAGE / 'MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    out = DEST / 'YILU_V081_FULL_DEV.zip'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for entry in entries + [{'path': 'MANIFEST.json'}]:
            p = STAGE / entry['path']
            z.write(p, STAGE.name + '/' + entry['path'])
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(entries) + 1
        for entry in entries:
            assert hashlib.sha256(z.read(STAGE.name + '/' + entry['path'])).hexdigest() == entry['sha256'], entry['path']
    sha = hashlib.sha256(out.read_bytes()).hexdigest()
    (DEST / 'SHA256SUMS.txt').write_text(f'{sha}  {out.name}\n')
    print(json.dumps({'archive': str(out), 'bytes': out.stat().st_size, 'files': len(entries)+1, 'sha256': sha, 'crcAndAllHashes': True}, ensure_ascii=False))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', action='store_true')
    args = parser.parse_args()
    archive() if args.archive else prepare()
