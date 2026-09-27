"""Create the complete, account-neutral v07 handoff without editor caches."""
from pathlib import Path
import argparse, datetime, hashlib, json, shutil, zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'release/v07'
STAGE = DEST / 'YILU_V07_FULL_DEV'
DIRS = ['assets', 'settings', 'art-source', 'music-source', 'references', 'tests', 'tools', 'docs', 'build/web-mobile', 'build/wechatgame', 'evidence/v07']
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
    handoff = ROOT / 'AGENT_HANDOFF.md'
    if not handoff.exists():
        handoff = Path((ROOT / '.cache/v07-handoff-path.txt').read_text())
    shutil.copy2(handoff, STAGE / 'AGENT_HANDOFF.md')
    (STAGE / '00_START_HERE.md').write_text('''# 一路长歌 v0.7 完整开发包

先读 [给 GPT 的反馈](docs/v07/GPT_REVIEW.md)，再读 [运行与开发说明](docs/v07/DEVELOPMENT_PACKAGE.md)。

这是当前本地源码与素材的完整快照，包含此前未提交工作和本轮优化。没有包含依赖缓存、登录状态或测试二维码。微信 AppID 留空，重新预览需填写已确认的本人小游戏 AppID。

## 快速试玩

安装 Node.js 18+ 后在本目录运行 `PORT=43190 node tools/serve.mjs`，打开 http://127.0.0.1:43190/play/?v=07 。不需要安装 Cocos 或 npm 依赖即可运行附带浏览器构建。

## 优先查看

- `docs/v07/GPT_REVIEW.md`：下一轮具体问题、证据、代码入口和用户反馈表。
- `docs/v07/reference/玩法拆解.md`：视频机制与时间点，区别观察和推测。
- `evidence/v07/three-levels-live-audio.mp4`：原速连续三关。
- `evidence/v07/mobile-360x640.png`：最终小屏画面。
- `evidence/v07/checks.json`、`phone-preview.json`：当前验证状态。
- `PACKAGE_VERIFICATION.json`：本交付副本的独立检查。
- `MANIFEST.json`：文件清单、大小与 SHA-256。

二维码单独交付给用户；手机运行、手感和性能仍待用户扫码验收。根 README 和旧版 docs 是历史资料，当前状态以上述入口为准。
''')
    print(json.dumps({'stage': str(STAGE), 'prepared': True}, ensure_ascii=False))

def archive():
    assert (STAGE / 'PACKAGE_VERIFICATION.json').is_file(), 'Verify the staged project first'
    entries = []
    for p in sorted(STAGE.rglob('*')):
        rel = p.relative_to(STAGE)
        if p.is_file() and allowed(rel) and p.name != 'MANIFEST.json':
            entries.append({'path': rel.as_posix(), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
    manifest = {'version': '0.7.0-rc1', 'generatedAt': datetime.datetime.now().astimezone().isoformat(), 'snapshot': 'current working tree including uncommitted work', 'includes': DIRS + FILES, 'excludes': ['Git history', 'dependencies and editor caches', 'personal editor profiles', 'login credentials', 'temporary preview QR', 'duplicate historical ZIP/WebM', 'full third-party video'], 'sanitized': {'build/wechatgame/project.config.json': 'appid blanked in shared package; local build unchanged'}, 'fileCount': len(entries), 'totalBytes': sum(x['bytes'] for x in entries), 'files': entries}
    (STAGE / 'MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    out = DEST / 'YILU_V07_FULL_DEV.zip'
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
