"""Prepare, then archive a verified account-neutral UI-20260925 local working-tree snapshot."""
from pathlib import Path
import argparse, datetime, hashlib, json, re, shutil, zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'release/UI-20260925'
STAGE = DEST / 'YILU_UI_20260925_FULL_DEV'
DIRS = ['assets', 'settings', 'art-source', 'music-source', 'references', 'tests', 'tools', 'docs', 'build/web-mobile', 'build/wechatgame', 'evidence/UI-20260925', 'evidence/v09', 'evidence/v081', 'evidence/v08', 'evidence/runner-video-v2']
FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.core.json', '.npmrc', '.gitignore', 'README.md', 'PROGRESS.md', 'BLOCKED.md', '启动一路长歌.command']


def allowed(p):
    name = p.name.lower()
    return not any(x in p.parts for x in ['node_modules', '.cache', '__pycache__', '.git', 'downloads']) and name not in ['.ds_store', 'project.private.config.json'] and not any(s in name for s in ['preview-qr', 'preview-result', '二维码', 'login', 'credential']) and p.suffix.lower() not in ['.zip', '.webm', '.pem', '.key'] and not name.startswith('.env')


def prepare():
    if STAGE.exists():
        raise SystemExit('Staging already exists; preserve it. Verify existing stage and use --archive, or choose a new delivery directory in source.')
    if json.loads((ROOT / 'package.json').read_text())['version'] != '0.9.1-ui20260925':
        raise SystemExit('Unexpected project version; review snapshot before packaging.')
    for path in ['docs/UI-20260925/00_START_WITH_CODEX.md','docs/UI-20260925/REVIEW_RESULTS.json','evidence/UI-20260925/VERIFICATION.json','evidence/UI-20260925/wechat-package.json','evidence/UI-20260925/final-three-levels.mp4']:
        if not (ROOT / path).is_file():
            raise SystemExit(f'Missing current delivery evidence: {path}')
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
    cfgpath.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n')
    shutil.copy2(ROOT / 'docs/UI-20260925/00_START_WITH_CODEX.md', STAGE / '00_START_HERE.md')
    print(json.dumps({'stage': str(STAGE), 'prepared': True, 'verification': 'pending independent staged-project checks'}, ensure_ascii=False))


def archive():
    assert (STAGE / 'PACKAGE_VERIFICATION.json').is_file(), 'Verify the staged project and record real results first'
    entries = []
    # Catch accidental identity inclusion instead of silently corrupting source or evidence.
    for p in sorted(STAGE.rglob('*')):
        rel = p.relative_to(STAGE)
        if p.is_symlink():
            raise RuntimeError(f'Unexpected staging symlink: {rel}')
        if p.is_file() and allowed(rel) and p.name != 'MANIFEST.json':
            content = p.read_bytes()
            if re.search(rb'wx[0-9a-f]{16}', content):
                raise RuntimeError(f'Local AppID in share candidate; sanitize this staged file explicitly: {rel}')
            entries.append({'path': rel.as_posix(), 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()})
    manifest = {'version': '0.9.1-ui20260925', 'runtime': 'ui-20260925', 'generatedAt': datetime.datetime.now().astimezone().isoformat(), 'snapshot': 'current local working tree including uncommitted work; not a GitHub HEAD claim', 'includes': DIRS + FILES, 'excludes': ['Git history', 'dependencies and editor caches', 'personal editor profiles', 'login credentials', 'preview QR', 'duplicate ZIP/WebM', 'full third-party video'], 'sanitized': {'build/wechatgame/project.config.json': 'AppID blanked in shared stage only; local build unchanged'}, 'fileCount': len(entries), 'totalBytes': sum(x['bytes'] for x in entries), 'files': entries}
    (STAGE / 'MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    out = DEST / 'YILU_UI_20260925_FULL_DEV.zip'
    if out.exists():
        raise SystemExit('Archive already exists; do not silently overwrite a delivered version.')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for entry in entries + [{'path': 'MANIFEST.json'}]:
            z.write(STAGE / entry['path'], STAGE.name + '/' + entry['path'])
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
