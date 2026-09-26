"""Independent FIX1 evidence/full snapshot delivery. Never edits prior packages or live builds."""
from pathlib import Path
import argparse, datetime, hashlib, html, json, os, re, shutil, subprocess, zipfile

ROOT = Path(__file__).resolve().parents[1]
TASK = 'BATTLE-REWORK-20260925-FIX1'
VERSION = '0.9.2-battle20260925.1'
RUNTIME = 'battle-rework-20260925-fix1'
EVIDENCE = ROOT / 'evidence' / TASK
DOCS = ROOT / 'docs' / TASK
DEST = ROOT / 'release' / TASK
FULL = DEST / 'YILU_BATTLE_REWORK_20260925_FIX1_FULL_DEV'
SMALL = DEST / 'YILU_BATTLE_REWORK_20260925_FIX1_GPT_EVIDENCE'
DIRS = ['assets', 'settings', 'art-source', 'music-source', 'references', 'tests', 'tools', 'docs',
        'build/web-mobile', 'build/wechatgame', f'evidence/{TASK}', 'evidence/BATTLE-REWORK-20260925']
FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.core.json', '.npmrc', '.gitignore',
         'README.md', 'PROGRESS.md', 'BLOCKED.md', '启动一路长歌.command']


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def allowed(path):
    name = path.name.lower()
    return (not any(x in path.parts for x in ['node_modules', '.cache', '__pycache__', '.git', 'downloads'])
            and name not in ['.ds_store', 'project.private.config.json']
            and not any(x in name for x in ['preview-qr', 'preview-result', '二维码', 'login', 'credential'])
            and path.suffix.lower() not in ['.zip', '.pem', '.key', '.p12', '.pfx']
            and not name.startswith('.env'))


def copy_file(source, destination):
    if source.is_symlink():
        raise RuntimeError(f'Symlink is not a share candidate: {source.relative_to(ROOT)}')
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def copy_tree(source, destination, predicate=lambda p: True):
    if not source.is_dir():
        raise RuntimeError(f'Required project directory missing: {source.relative_to(ROOT)}')
    for source_file in sorted(source.rglob('*')):
        rel = source_file.relative_to(source)
        if source_file.is_symlink():
            raise RuntimeError(f'Unexpected symlink: {source_file.relative_to(ROOT)}')
        if source_file.is_file() and allowed(source_file.relative_to(ROOT)) and predicate(source_file):
            copy_file(source_file, destination / rel)


def duration(path):
    if not shutil.which('ffprobe'):
        raise RuntimeError('ffprobe is required to verify the actual 30-second MP4, not its filename.')
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(path)],
                            check=True, capture_output=True, text=True)
    return float(json.loads(result.stdout)['format']['duration'])


def choose_clip(value):
    if value:
        clip = Path(value)
        if not clip.is_absolute():
            clip = ROOT / clip
        clip = clip.resolve()
        if not clip.is_relative_to(EVIDENCE.resolve()) or clip.suffix.lower() != '.mp4':
            raise RuntimeError('--clip must be an actual MP4 under the current FIX1 evidence directory.')
        candidates = [(clip, duration(clip))]
    else:
        candidates = [(p, duration(p)) for p in sorted(EVIDENCE.rglob('*.mp4'))]
        candidates = [(p, seconds) for p, seconds in candidates if 29 <= seconds <= 31]
    if len(candidates) != 1 or not 29 <= candidates[0][1] <= 31:
        raise RuntimeError('Need exactly one 29–31 second current MP4; select explicitly with --clip if several exist.')
    return candidates[0]


def listing(stage, skip=()):
    result = []
    for p in sorted(stage.rglob('*')):
        rel = p.relative_to(stage)
        if p.is_symlink():
            raise RuntimeError(f'Stage symlink: {rel}')
        if p.is_file() and p.name not in skip:
            if not allowed(rel):
                raise RuntimeError(f'Excluded/sensitive file appeared in stage: {rel}')
            # Fail closed without printing personal identity. Scan in chunks, retaining regex overlap.
            tail = b''
            with p.open('rb') as f:
                for chunk in iter(lambda: f.read(1024 * 1024), b''):
                    if re.search(rb'wx[0-9a-f]{16}', tail + chunk):
                        raise RuntimeError(f'Local AppID in staged candidate; explicitly sanitize staged file: {rel}')
                    tail = chunk[-32:]
            result.append({'path': rel.as_posix(), 'bytes': p.stat().st_size, 'sha256': sha(p)})
    return result


def prepare(args):
    if FULL.exists() or SMALL.exists():
        raise SystemExit('FIX1 stage already exists; preserve it. Verify/archive existing stage, do not silently replace it.')
    if json.loads((ROOT / 'package.json').read_text())['version'] != VERSION:
        raise RuntimeError('Project version is not FIX1; refuse to snapshot a different build.')
    for p in [DOCS / '00_START_WITH_CODEX.md', EVIDENCE / 'wechat-package.json',
              ROOT / 'build/web-mobile/index.html', ROOT / 'build/wechatgame/project.config.json']:
        if not p.is_file():
            raise RuntimeError(f'Required FIX1 delivery input missing: {p.relative_to(ROOT)}')
    if not any(p.is_file() for p in [EVIDENCE / 'VERIFICATION.json', DOCS / 'VERIFICATION.json']):
        raise RuntimeError('Current FIX1 VERIFICATION.json required in docs or evidence.')
    clip, seconds = choose_clip(args.clip)
    pngs = [p for p in EVIDENCE.rglob('*.png') if allowed(p.relative_to(ROOT))]
    if not pngs:
        raise RuntimeError('Current FIX1 actual PNG evidence is required in the small package.')
    FULL.mkdir(parents=True)
    SMALL.mkdir(parents=True)
    for directory in DIRS:
        copy_tree(ROOT / directory, FULL / directory)
    for name in FILES:
        if (ROOT / name).is_file():
            copy_file(ROOT / name, FULL / name)
    cfg_path = FULL / 'build/wechatgame/project.config.json'
    cfg = json.loads(cfg_path.read_text())
    cfg['appid'] = ''
    dump(cfg_path, cfg)
    copy_file(DOCS / '00_START_WITH_CODEX.md', FULL / '00_START_HERE.md')
    (FULL / 'EVIDENCE_SCOPE.md').write_text(f'''# FIX1 交付证据范围

版本 `{VERSION}` / `{RUNTIME}`。这是当前本地工作树快照，含未提交修改，不代表GitHub提交状态。
完整包保留全部源码、素材、docs、预构建Web与微信，以及当前FIX1和前一BATTLE-REWORK任务证据。
为避免重复附送大量历史录像，旧UI/v09/v081/v08/runner-video证据目录不包含在本包；原项目和旧交付包仍保留，可另取。docs里指向这些旧证据的链接属于历史记录。
共享副本的微信AppID为空；原本机配置未改。无账号登录材料、预览二维码、依赖、缓存和Git历史。
预构建试玩只需Node；解压后运行 `PORT=43210 node tools/serve.mjs`，打开 http://127.0.0.1:43210/play/ 。
源码重建另需npm依赖及Cocos Creator3.8.8。手机、官方预览、上传/发布状态以本轮真实回执为准，不由ZIP生成推定。
''')
    # Small package preserves current relative docs/evidence paths for machine follow-up.
    copy_tree(DOCS, SMALL / 'docs', lambda p: p.suffix.lower() in ['.md', '.json', '.html', '.png', '.jpg', '.jpeg'])
    copy_tree(EVIDENCE, SMALL / 'evidence', lambda p: p.suffix.lower() not in ['.log', '.webm', '.mp4'])
    clip_rel = clip.relative_to(EVIDENCE)
    copy_file(clip, SMALL / 'evidence' / clip_rel)
    media = {'runtime': RUNTIME, 'pngCount': len(pngs), 'actualPngPaths': ['evidence/' + p.relative_to(EVIDENCE).as_posix() for p in sorted(pngs)],
             'clip': {'path': 'evidence/' + clip_rel.as_posix(), 'seconds': seconds, 'bytes': clip.stat().st_size, 'sha256': sha(clip)},
             'scope': 'Actual local media included. Natural/fixture status and clip edits are defined by the FIX1 evidence receipts, not inferred here.'}
    dump(SMALL / 'MEDIA_CONTENTS.json', media)
    (SMALL / 'README.md').write_text(f'''# 给GPT核验：FIX1

版本 `{VERSION}` / `{RUNTIME}`。
本包内含实际PNG原图及约30秒MP4，不是只有路径列表。打开 `index.html` 查看；图片与视频精确路径、时长和SHA见 `MEDIA_CONTENTS.json`。
阅读 `docs/00_START_WITH_CODEX.md` 和本轮 docs/evidence 下的 `VERIFICATION.json`，以本轮证据区分功能、视觉、自然录像与设备结论。
完整源码、素材、两端预构建与前一战场任务证据位于 `{FULL.name}.zip`；更早UI/v09历史录像可从旧交付包另取。
''')
    photos = ''.join(f'<figure><img loading="lazy" src="{html.escape(p)}"><figcaption>{html.escape(p)}</figcaption></figure>' for p in media['actualPngPaths'])
    (SMALL / 'index.html').write_text(f'<!doctype html><meta charset="utf-8"><title>FIX1 实际证据</title><style>body{{background:#171f28;color:#eee;font:16px sans-serif;max-width:1200px;margin:auto;padding:24px}}video{{max-width:420px;width:100%}}section{{display:flex;flex-wrap:wrap}}figure{{margin:10px;max-width:360px}}img{{max-width:100%;height:auto}}figcaption{{word-break:break-all}}a{{color:#bde}}</style><h1>FIX1 实际证据</h1><p><a href="README.md">说明</a> · <a href="MEDIA_CONTENTS.json">媒体清单</a></p><video controls playsinline preload="metadata" src="{html.escape(media["clip"]["path"])}"></video><section>{photos}</section>')
    for stage in [FULL, SMALL]:
        dump(stage / 'PREPARED_SNAPSHOT.json', {'version': VERSION, 'runtime': RUNTIME, 'at': datetime.datetime.now().astimezone().isoformat(),
             'files': listing(stage, ('PREPARED_SNAPSHOT.json',))})
    print(json.dumps({'prepared': True, 'fullStage': str(FULL), 'smallStage': str(SMALL), 'pngs': len(pngs), 'clipSeconds': seconds,
                      'next': 'Run --verify-stage, then --archive. No browser/build/upload was started by --prepare.'}, ensure_ascii=False))


def verify_stage(args):
    if not (FULL / 'PREPARED_SNAPSHOT.json').is_file():
        raise RuntimeError('Run --prepare after current evidence is complete.')
    # Existing verifier has fixed old runtime/evidence; adapt only private scratch copies.
    scratch = ROOT / '.cache/package-battle-fix1-check'
    scratch.mkdir(parents=True, exist_ok=True)
    common = (ROOT / 'tools/browser-v03-common.mjs').read_text()
    if 'headless:false' not in common:
        raise RuntimeError('Browser helper changed; review temporary adapter before running.')
    if not args.visible:
        common = common.replace('headless:false', 'headless:true').replace('await p.bringToFront();', '')
    (scratch / 'browser-v03-common.mjs').write_text(common)
    source = (ROOT / 'tools/browser-battle-rework-package.mjs').read_text()
    if "version:'battle-rework-20260925'" not in source:
        raise RuntimeError('Existing verifier changed; review adapter contract.')
    source = source.replace('battle-rework-20260925', RUNTIME).replace('BATTLE-REWORK-20260925', TASK)
    source = source.replace('YILU_BATTLE_REWORK_20260925_FULL_DEV', FULL.name)
    verifier = scratch / 'browser-battle-fix-package.mjs'
    verifier.write_text(source)
    env = {**os.environ, 'PACKAGE_STAGE': str(FULL), 'PACKAGE_PORT': str(args.port)}
    subprocess.run(['node', str(verifier)], cwd=ROOT, env=env, check=True)
    report_path = FULL / 'PACKAGE_VERIFICATION.json'
    report = json.loads(report_path.read_text())
    if report.get('passed') is not True or report.get('home', {}).get('version') != RUNTIME:
        raise RuntimeError('Actual staged runtime verification did not pass FIX1.')
    report['preparedSnapshotSha256'] = sha(FULL / 'PREPARED_SNAPSHOT.json')
    report['verificationAdapter'] = 'Unmodified existing verifier semantics; scratch-only FIX1 runtime/path replacement; headless unless --visible'
    dump(report_path, report)
    dump(EVIDENCE / 'PACKAGE_VERIFICATION.json', report)
    print(json.dumps({'verifiedStage': str(FULL), 'runtime': RUNTIME, 'passed': True}, ensure_ascii=False))


def archive_one(stage):
    target = DEST / (stage.name + '.zip')
    if target.exists():
        raise RuntimeError(f'Archive exists; preserve delivered output: {target.name}')
    prepared = json.loads((stage / 'PREPARED_SNAPSHOT.json').read_text())
    for item in prepared['files']:
        p = stage / item['path']
        if not p.is_file() or sha(p) != item['sha256']:
            raise RuntimeError(f'Staged snapshot changed since preparation: {stage.name}/{item["path"]}')
    entries = listing(stage, ('MANIFEST.json',))
    manifest = {'version': VERSION, 'runtime': RUNTIME, 'stage': stage.name, 'generatedAt': datetime.datetime.now().astimezone().isoformat(),
                'snapshot': 'Current local working tree; no Git HEAD claim', 'fileCount': len(entries), 'totalBytes': sum(e['bytes'] for e in entries),
                'evidenceScope': 'FIX1 plus prior battle task only in full dev; older UI/v09 recordings remain in prior deliveries',
                'sanitized': {'AppID': 'blank only in shared WeChat config'}, 'files': entries}
    dump(stage / 'MANIFEST.json', manifest)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for entry in entries + [{'path': 'MANIFEST.json'}]:
            z.write(stage / entry['path'], stage.name + '/' + entry['path'])
    with zipfile.ZipFile(target) as z:
        if z.testzip() is not None:
            raise RuntimeError('ZIP CRC failed')
        for entry in entries:
            if hashlib.sha256(z.read(stage.name + '/' + entry['path'])).hexdigest() != entry['sha256']:
                raise RuntimeError('ZIP hash mismatch: ' + entry['path'])
    return {'archive': str(target), 'bytes': target.stat().st_size, 'files': len(entries) + 1, 'sha256': sha(target), 'crcAndAllHashes': True}


def archive(args):
    receipt = json.loads((FULL / 'PACKAGE_VERIFICATION.json').read_text())
    if (receipt.get('passed') is not True or receipt.get('home', {}).get('version') != RUNTIME
            or receipt.get('preparedSnapshotSha256') != sha(FULL / 'PREPARED_SNAPSHOT.json')):
        raise RuntimeError('Run actual --verify-stage on the prepared FIX1 snapshot first.')
    if json.loads((FULL / 'build/wechatgame/project.config.json').read_text())['appid'] != '':
        raise RuntimeError('Shared AppID must be blank')
    media = json.loads((SMALL / 'MEDIA_CONTENTS.json').read_text())
    clip = SMALL / media['clip']['path']
    if not media['actualPngPaths'] or any(not (SMALL / p).is_file() for p in media['actualPngPaths']):
        raise RuntimeError('Actual PNG evidence missing')
    if sha(clip) != media['clip']['sha256'] or not 29 <= duration(clip) <= 31:
        raise RuntimeError('Actual30-second MP4 mismatch')
    # Include actual snapshot verification in both packages, without rewriting prepared source artifacts.
    copy_file(FULL / 'PACKAGE_VERIFICATION.json', SMALL / 'PACKAGE_VERIFICATION.json')
    for stage in [FULL, SMALL]:
        if (DEST / (stage.name + '.zip')).exists():
            raise RuntimeError('One or more FIX1 archives already exist; preserve them.')
    results = [archive_one(SMALL), archive_one(FULL)]
    (DEST / 'SHA256SUMS.txt').write_text(''.join(f'{r["sha256"]}  {Path(r["archive"]).name}\n' for r in results))
    dump(DEST / 'ARCHIVE_VERIFICATION.json', {'runtime': RUNTIME, 'archives': results, 'actualMedia': media})
    print(json.dumps(results, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare', action='store_true')
    mode.add_argument('--verify-stage', action='store_true')
    mode.add_argument('--archive', action='store_true')
    parser.add_argument('--clip', help='Current evidence MP4 path; duration must be29–31 seconds')
    parser.add_argument('--port', type=int, default=43210)
    parser.add_argument('--visible', action='store_true', help='Show Chrome during stage verification; default headless')
    args = parser.parse_args()
    prepare(args) if args.prepare else verify_stage(args) if args.verify_stage else archive(args)
