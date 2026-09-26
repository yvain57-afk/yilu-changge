"""Independent FIX2 evidence/full snapshot delivery. Never edits prior packages or live builds."""
from pathlib import Path
import argparse, datetime, hashlib, html, json, os, re, shutil, struct, subprocess, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
TASK = 'BATTLE-FIX2-20260925'
VERSION = '0.9.3-battlefix2'
RUNTIME = 'battle-fix2-20260925'
EVIDENCE = ROOT / 'evidence' / TASK
DOCS = ROOT / 'docs' / TASK
DEST = ROOT / 'release' / TASK
FULL = DEST / 'YILU_BATTLE_FIX2_20260925_FULL_DEV'
SMALL = DEST / 'YILU_BATTLE_FIX2_20260925_GPT_EVIDENCE'
DIRS = ['assets', 'settings', 'art-source', 'music-source', 'references', 'tests', 'tools', 'docs',
        'build/web-mobile', 'build/wechatgame', f'evidence/{TASK}']
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
        raise RuntimeError('ffprobe is required to verify the actual 30–45-second MP4, not its filename.')
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
            raise RuntimeError('--clip must be an actual MP4 under the current FIX2 evidence directory.')
        candidates = [(clip, duration(clip))]
    else:
        candidates = [(p, duration(p)) for p in sorted(EVIDENCE.rglob('*.mp4'))]
        candidates = [(p, seconds) for p, seconds in candidates if 30 <= seconds <= 45]
    if len(candidates) != 1 or not 30 <= candidates[0][1] <= 45:
        raise RuntimeError('Need exactly one 30–45 second current MP4; select explicitly with --clip if several exist.')
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


GROUP_IDS = ['normal-attack', 'gates-crates', 'wall-end', 'chain-contact']
MEDIA_EXTENSIONS = {'.mp4', '.webm', '.mov', '.m4v'}


def evidence_path(value):
    path = EVIDENCE / value
    if path.is_symlink() or not path.resolve().is_relative_to(EVIDENCE.resolve()) or not path.is_file():
        raise RuntimeError(f'Current evidence file missing or outside task: {value}')
    return path


def png_info(path):
    with path.open('rb') as stream:
        header = stream.read(24)
    if len(header) != 24 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise RuntimeError(f'Not an actual PNG: {path.name}')
    width, height = struct.unpack('>II', header[16:24])
    if not width or not height:
        raise RuntimeError(f'Invalid PNG dimensions: {path.name}')
    return {'width': width, 'height': height, 'bytes': path.stat().st_size, 'sha256': sha(path)}


def comparison_groups(mapping):
    # Optional JSON: [{id, before:"before/x.png", after:"after/x.png",
    # beforeMetadata:"before/x.json", afterMetadata:"after/x.json"}], paths relative to current evidence.
    groups = json.loads(Path(mapping).read_text()) if mapping else [
        {'id': name, 'before': f'before/{name}.png', 'after': f'after/{name}.png'} for name in GROUP_IDS]
    if len(groups) != 4 or {g.get('id') for g in groups} != set(GROUP_IDS):
        raise RuntimeError('Exactly four named comparison groups are required: ' + ', '.join(GROUP_IDS))
    result = []
    for group in groups:
        item = {'id': group['id'], 'metadataComparison': 'Same viewport, level, time, squad count, weapon and stage only; full model equivalence is reported separately.'}
        states = []
        for side in ['before', 'after']:
            png = evidence_path(group[side])
            metadata = evidence_path(group.get(side + 'Metadata', str(Path(group[side]).with_suffix('.json'))))
            data = json.loads(metadata.read_text())
            model = data.get('model', {})
            if data.get('kind') not in ['fixture', 'natural'] or not isinstance(data.get('viewport'), dict):
                raise RuntimeError(f'{metadata.name}: kind fixture/natural and viewport required')
            keys = ['level', 'elapsed', 'count', 'weapon', 'stage']
            if any(key not in model for key in keys):
                raise RuntimeError(f'{metadata.name}: model level/elapsed/count/weapon/stage required')
            info = png_info(png)
            viewport = data['viewport']
            if not all(isinstance(viewport.get(k), (int, float)) and viewport[k] > 0 for k in ['width', 'height']):
                raise RuntimeError(f'{metadata.name}: viewport dimensions invalid')
            states.append({**{key: model[key] for key in keys}, 'viewport': viewport, 'kind': data['kind']})
            item[side] = {'path': 'evidence/' + png.relative_to(EVIDENCE).as_posix(), **info,
                          'metadata': 'evidence/' + metadata.relative_to(EVIDENCE).as_posix(), 'metadataSha256': sha(metadata), 'state': states[-1]}
        if states[0] != states[1]:
            raise RuntimeError(f'{group["id"]}: comparison states differ; rule A/B differences must have separate evidence')
        result.append(item)
    return result


def check_prepared(stage):
    prepared = json.loads((stage / 'PREPARED_SNAPSHOT.json').read_text())
    for item in prepared['files']:
        path = stage / item['path']
        if not path.is_file() or path.is_symlink() or sha(path) != item['sha256']:
            raise RuntimeError(f'Prepared file changed: {stage.name}/{item["path"]}')
    # Extra files are limited to verification outputs deliberately created after freeze.
    expected = {item['path'] for item in prepared['files']} | {'PREPARED_SNAPSHOT.json', 'PACKAGE_VERIFICATION.json', 'MANIFEST.json'}
    actual = {p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file()}
    if actual - expected:
        raise RuntimeError(f'Unexpected files after preparation: {sorted(actual - expected)[:5]}')


def fingerprint_check(root):
    subprocess.run(['node', str(root / 'tools/battle-fix2-fingerprint.mjs'), '--root', str(root), '--check'], check=True, cwd=ROOT)


def refresh_prepared_snapshot(stage):
    # Only root delivery receipts are excluded. Source-pack MANIFEST files remain frozen.
    files = [item for item in listing(stage) if item['path'] not in
             ['PREPARED_SNAPSHOT.json', 'PACKAGE_VERIFICATION.json', 'MANIFEST.json']]
    dump(stage / 'PREPARED_SNAPSHOT.json', {
        'version': VERSION, 'runtime': RUNTIME,
        'at': datetime.datetime.now().astimezone().isoformat(), 'files': files})


def finalize_verification_reports(report):
    """After real unpacked boot only: promote two report statuses, never executable bytes."""
    names = ['FIX2_REVIEW_RESULTS.json', 'VERIFICATION.json']
    scopes = {'workspace': [DOCS, EVIDENCE],
              'full': [FULL / 'docs' / TASK, FULL / 'evidence' / TASK],
              'small': [SMALL / 'docs', SMALL / 'evidence']}
    frozen = {stage.name: json.loads((stage / 'PREPARED_SNAPSHOT.json').read_text())
              for stage in [FULL, SMALL]}
    previous_hashes = {stage.name: sha(stage / 'PREPARED_SNAPSHOT.json') for stage in [FULL, SMALL]}
    build_id = json.loads((FULL / f'evidence/{TASK}/BUILD_ID.json').read_text())
    if report.get('passed') is not True or report.get('home', {}).get('version') != RUNTIME:
        raise RuntimeError('Report finalization requires a successful actual unpacked boot')
    if build_id.get('runtime') != RUNTIME or not build_id.get('sourceAndBuildSha256'):
        raise RuntimeError('Frozen source/build fingerprint is missing')
    fingerprint_check(ROOT)
    fingerprint_check(FULL)
    plans = []
    # Validate every report before any status changes. Existing duplicates are all updated;
    # absent duplicate copies are not invented, but all three delivery scopes are required.
    for scope, directories in scopes.items():
        for name in names:
            paths = [directory / name for directory in directories if (directory / name).is_file()]
            if not paths:
                raise RuntimeError(f'{scope} has no {name}; prepare complete reports before verification')
            for path in paths:
                if path.is_symlink():
                    raise RuntimeError('Report status update refuses symlink: ' + str(path))
                before = path.read_bytes()
                data = json.loads(before)
                linkage = {'path': f'evidence/{TASK}/PACKAGE_VERIFICATION.json' if scope == 'workspace' else 'PACKAGE_VERIFICATION.json',
                           'runtime': RUNTIME, 'sourceAndBuildSha256': build_id['sourceAndBuildSha256']}
                if name == 'FIX2_REVIEW_RESULTS.json':
                    cases = data.get('cases')
                    matching = [case for case in cases if isinstance(case, dict) and case.get('id') == 'R06'] if isinstance(cases, list) else []
                    if len(matching) != 1:
                        raise RuntimeError(f'{path}: exactly one cases[].id=R06 required')
                    matching[0]['status'] = '\u901a\u8fc7'
                    matching[0]['packageVerification'] = linkage
                else:
                    if data.get('packaging') not in ['pending', 'passed']:
                        raise RuntimeError(f'{path}: packaging must be pending or passed')
                    data['packaging'] = 'passed'
                    data['packageVerification'] = linkage
                after = (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
                plans.append({'path': path, 'scope': scope, 'before': before, 'after': after})
    for plan in plans:
        if plan['path'].read_bytes() != plan['before']:
            raise RuntimeError('Report changed during verification finalization: ' + str(plan['path']))
    for plan in plans:
        plan['path'].write_bytes(plan['after'])
    fingerprint_check(ROOT)
    fingerprint_check(FULL)
    # Refuse unrelated stage mutations before re-freezing. Only the named, planned reports
    # may differ; newly added files are prohibited except root verification sidecars.
    for stage in [FULL, SMALL]:
        permitted = {plan['path'].relative_to(stage).as_posix(): hashlib.sha256(plan['after']).hexdigest()
                     for plan in plans if plan['path'].is_relative_to(stage)}
        prepared = frozen[stage.name]
        expected = {item['path'] for item in prepared['files']}
        actual = {p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file()}
        if actual - expected - {'PREPARED_SNAPSHOT.json', 'PACKAGE_VERIFICATION.json', 'MANIFEST.json'}:
            raise RuntimeError('Unexpected staged addition during report finalization')
        for item in prepared['files']:
            path = stage / item['path']
            if not path.is_file() or path.is_symlink() or sha(path) != permitted.get(item['path'], item['sha256']):
                raise RuntimeError('Unauthorized staged mutation during report finalization: ' + item['path'])
        refresh_prepared_snapshot(stage)
    delta = {'allowedReportNames': names,
             'files': [{'scope': plan['scope'], 'path': plan['path'].relative_to(ROOT).as_posix(),
                        'beforeSha256': hashlib.sha256(plan['before']).hexdigest(),
                        'afterSha256': hashlib.sha256(plan['after']).hexdigest()} for plan in plans],
             'preVerificationPreparedHashes': previous_hashes,
             'postVerificationPreparedHashes': {stage.name: sha(stage / 'PREPARED_SNAPSHOT.json') for stage in [FULL, SMALL]},
             'runtime': RUNTIME, 'sourceAndBuildSha256': build_id['sourceAndBuildSha256'],
             'executableSourceAssetsBuildUnchanged': True,
             'actualRuntimeStartOccurredBeforeReportStatusUpdate': True,
             'note': 'One real unpacked startup occurred before status-only report updates. No second startup is claimed. Source/assets/build fingerprints and all other staged bytes remained unchanged.'}
    report['sourceAndBuildSha256'] = build_id['sourceAndBuildSha256']
    report['preparedSnapshotSha256'] = sha(FULL / 'PREPARED_SNAPSHOT.json')
    report['smallPreparedSnapshotSha256'] = sha(SMALL / 'PREPARED_SNAPSHOT.json')
    report['postVerificationDocumentationDelta'] = delta


def prepare(args):
    if FULL.exists() or SMALL.exists():
        raise SystemExit('FIX2 stage already exists; preserve it. Verify/archive existing stage, do not silently replace it.')
    if json.loads((ROOT / 'package.json').read_text())['version'] != VERSION:
        raise RuntimeError('Project version is not FIX2; refuse to snapshot a different build.')
    for p in [DOCS / '00_START_WITH_CODEX.md', EVIDENCE / 'wechat-package.json',
              ROOT / 'build/web-mobile/index.html', ROOT / 'build/wechatgame/project.config.json']:
        if not p.is_file():
            raise RuntimeError(f'Required FIX2 delivery input missing: {p.relative_to(ROOT)}')
    if not any(p.is_file() for p in [EVIDENCE / 'VERIFICATION.json', DOCS / 'VERIFICATION.json']):
        raise RuntimeError('Current FIX2 VERIFICATION.json required in docs or evidence.')
    fingerprint_check(ROOT)
    groups = comparison_groups(args.groups)
    clip, seconds = choose_clip(args.clip)
    natural = evidence_path(args.natural)
    extras = [evidence_path(value) for value in args.extra_media]
    for extra in extras:
        if extra.suffix.lower() != '.mp4' or duration(extra) <= 0:
            raise RuntimeError('Additional evidence must be a real MP4')
    if natural.suffix.lower() != '.mp4' or duration(natural) <= 45:
        raise RuntimeError('Full natural three-level MP4 must be a separate, longer recording')
    required_docs = ['CAP_AND_PACING_REPORT.json', 'PARAMETER_DIFF.json', 'KNOWN_GAPS.md', 'FIX2_REVIEW_RESULTS.json']
    for name in required_docs:
        if not any((base / name).is_file() for base in [DOCS, EVIDENCE]):
            raise RuntimeError(f'Required final FIX2 report missing: {name}')
    evidence_path('CLIPS.json')
    pngs = [p for p in EVIDENCE.rglob('*.png') if allowed(p.relative_to(ROOT))]
    if not pngs:
        raise RuntimeError('Current FIX2 actual PNG evidence is required in the small package.')
    FULL.mkdir(parents=True)
    SMALL.mkdir(parents=True)
    for directory in DIRS:
        # Keep source docs and all source assets; omit duplicate historical video media.
        copy_tree(ROOT / directory, FULL / directory, lambda p: (p.suffix.lower() not in MEDIA_EXTENSIONS
                  or directory in ['assets', 'art-source', 'music-source', 'build/web-mobile', 'build/wechatgame']
                  or p in [clip, natural, *extras]))
    for name in FILES:
        if (ROOT / name).is_file():
            copy_file(ROOT / name, FULL / name)
    cfg_path = FULL / 'build/wechatgame/project.config.json'
    cfg = json.loads(cfg_path.read_text())
    cfg['appid'] = ''
    dump(cfg_path, cfg)
    copy_file(DOCS / '00_START_WITH_CODEX.md', FULL / '00_START_HERE.md')
    (FULL / 'EVIDENCE_SCOPE.md').write_text(f'''# FIX2 交付证据范围

版本 `{VERSION}` / `{RUNTIME}`。这是当前本地工作树快照，含未提交修改，不代表GitHub提交状态。
完整包保留全部源码、素材、docs、预构建Web与微信，以及当前FIX2证据。历史视频不重复纳入；本轮展示片与完整自然录像各保留一份。
为避免重复附送大量历史录像，旧UI/v09/v081/v08/runner-video证据目录不包含在本包；原项目和旧交付包仍保留，可另取。docs里指向这些旧证据的链接属于历史记录。
共享副本的微信AppID为空；原本机配置未改。无账号登录材料、预览二维码、依赖、缓存和Git历史。
预构建试玩只需Node；解压后运行 `PORT=43210 node tools/serve.mjs`，打开 http://127.0.0.1:43210/play/ 。
源码重建另需npm依赖及Cocos Creator3.8.8。手机、官方预览、上传/发布状态以本轮真实回执为准，不由ZIP生成推定。
''')
    # Small package preserves current relative docs/evidence paths for machine follow-up.
    copy_tree(DOCS, SMALL / 'docs', lambda p: p.suffix.lower() in ['.md', '.json', '.html', '.png', '.jpg', '.jpeg', '.txt'])
    copy_tree(EVIDENCE, SMALL / 'evidence', lambda p: p.suffix.lower() not in MEDIA_EXTENSIONS | {'.log'})
    clip_rel = clip.relative_to(EVIDENCE)
    copy_file(clip, SMALL / 'evidence' / clip_rel)
    media = {'runtime': RUNTIME, 'comparisonGroups': groups, 'buildIdSha256': sha(EVIDENCE / 'BUILD_ID.json'), 'pngCount': len(pngs), 'actualPngPaths': ['evidence/' + p.relative_to(EVIDENCE).as_posix() for p in sorted(pngs)],
             'clip': {'path': 'evidence/' + clip_rel.as_posix(), 'seconds': seconds, 'bytes': clip.stat().st_size, 'sha256': sha(clip)},
             'scope': 'Actual local media included. Natural/fixture status and clip edits are defined by the FIX2 evidence receipts, not inferred here.'}
    media['extraClips'] = []
    for extra in extras:
        rel = extra.relative_to(EVIDENCE)
        copy_file(extra, SMALL / 'evidence' / rel)
        media['extraClips'].append({'path': 'evidence/' + rel.as_posix(), 'seconds': duration(extra), 'bytes': extra.stat().st_size, 'sha256': sha(extra)})
    dump(SMALL / 'MEDIA_CONTENTS.json', media)
    full_media = json.loads(json.dumps(media))
    full_media['actualPngPaths'] = [p.replace('evidence/', f'evidence/{TASK}/', 1) for p in media['actualPngPaths']]
    full_media['clip']['path'] = f'evidence/{TASK}/' + clip_rel.as_posix()
    for extra in full_media['extraClips']:
        extra['path'] = extra['path'].replace('evidence/', f'evidence/{TASK}/', 1)
    for group in full_media['comparisonGroups']:
        for side in ['before', 'after']:
            for key in ['path', 'metadata']:
                group[side][key] = group[side][key].replace('evidence/', f'evidence/{TASK}/', 1)
    full_media['fullNatural'] = {'path': f'evidence/{TASK}/' + natural.relative_to(EVIDENCE).as_posix(), 'seconds': duration(natural), 'sha256': sha(natural)}
    dump(FULL / 'MEDIA_CONTENTS.json', full_media)
    copy_file(EVIDENCE / 'BUILD_ID.json', SMALL / 'BUILD_ID.json')
    (SMALL / 'README.md').write_text(f'''# 给GPT核验：FIX2

版本 `{VERSION}` / `{RUNTIME}`。
本包内含实际PNG原图及30—45秒MP4，不是只有路径列表。打开 `index.html` 查看；图片与视频精确路径、时长和SHA见 `MEDIA_CONTENTS.json`。
阅读 `docs/00_START_WITH_CODEX.md` 和本轮 docs/evidence 下的 `VERIFICATION.json`，以本轮证据区分功能、视觉、自然录像与设备结论。
完整源码、素材、两端预构建与本轮完整自然录像位于 `{FULL.name}.zip`；更早UI/v09历史录像可从旧交付包另取。
''')
    photos = ''.join('<article><h2>' + html.escape(g['id']) + '</h2><section>' + ''.join('<figure><img loading="lazy" src="' + html.escape(g[side]['path']) + '"><figcaption>' + ('FIX1 同状态基线' if side == 'before' else 'FIX2 最终对照') + '</figcaption></figure>' for side in ['before', 'after']) + '</section></article>' for g in groups)
    extras_html = ''.join('<h2>' + html.escape(Path(v['path']).stem) + '</h2><video controls playsinline preload="metadata" src="' + html.escape(v['path']) + '"></video>' for v in media['extraClips'])
    (SMALL / 'index.html').write_text(f'<!doctype html><meta charset="utf-8"><title>FIX2 实际证据</title><style>body{{background:#171f28;color:#eee;font:16px sans-serif;max-width:1200px;margin:auto;padding:24px}}video{{max-width:420px;width:100%}}section{{display:flex;flex-wrap:wrap}}figure{{margin:10px;max-width:360px}}img{{max-width:100%;height:auto}}figcaption{{word-break:break-all}}a{{color:#bde}}</style><h1>FIX2 实际证据</h1><p><a href="README.md">说明</a> · <a href="MEDIA_CONTENTS.json">媒体清单</a></p><video controls playsinline preload="metadata" src="{html.escape(media["clip"]["path"])}"></video><p>下列四组为最终同状态对照。evidence 中另保留失败尝试与修复过程；以 VERIFICATION 和对应 report 的状态区分。</p>{photos}{extras_html}')
    for stage in [FULL, SMALL]:
        refresh_prepared_snapshot(stage)
    print(json.dumps({'prepared': True, 'fullStage': str(FULL), 'smallStage': str(SMALL), 'pngs': len(pngs), 'clipSeconds': seconds,
                      'next': 'Run --verify-stage, then --archive. No browser/build/upload was started by --prepare.'}, ensure_ascii=False))


def verify_stage(args):
    check_prepared(FULL)
    check_prepared(SMALL)
    fingerprint_check(FULL)
    # Build an actual transport ZIP, extract to a fresh directory and verify every byte.
    # Runtime verification serves only the extracted copy, never the live build or stage.
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    scratch = Path(tempfile.mkdtemp(prefix='package-battle-fix2-check-', dir=cache))
    transport = scratch / 'prepared.zip'
    entries = listing(FULL)
    with zipfile.ZipFile(transport, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for item in entries:
            archive.write(FULL / item['path'], FULL.name + '/' + item['path'])
    unpack_root = scratch / 'unpacked'
    with zipfile.ZipFile(transport) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('Prepared ZIP CRC failed')
        archive.extractall(unpack_root)  # Archive created above from sanitized fixed relative paths.
    unpacked = unpack_root / FULL.name
    for item in entries:
        if sha(unpacked / item['path']) != item['sha256']:
            raise RuntimeError('Unpacked hash mismatch: ' + item['path'])
    fingerprint_check(unpacked)
    common = (unpacked / 'tools/browser-v03-common.mjs').read_text()
    if 'headless:false' not in common:
        raise RuntimeError('Browser helper changed; review temporary adapter before running.')
    if not args.visible:
        common = common.replace('headless:false', 'headless:true').replace('await p.bringToFront();', '')
    (scratch / 'browser-v03-common.mjs').write_text(common)
    # Adapter preserves the existing boot/start/runtime assertions, removes its old fixed frame count.
    source = (unpacked / 'tools/browser-battle-rework-package.mjs').read_text()
    if "version:'battle-rework-20260925'" not in source or 'assert.equal(s.presentation.battleAssets.frames,230)' not in source:
        raise RuntimeError('Existing verifier changed; review adapter contract.')
    source = source.replace('battle-rework-20260925', RUNTIME).replace('BATTLE-REWORK-20260925', TASK)
    source = source.replace('YILU_BATTLE_REWORK_20260925_FULL_DEV', FULL.name)
    source = source.replace('assert.equal(s.presentation.battleAssets.frames,230)', 'assert.ok(s.presentation.battleAssets.frames>0)')
    verifier = scratch / 'browser-battle-fix2-package.mjs'
    verifier.write_text(source)
    env = {**os.environ, 'PACKAGE_STAGE': str(unpacked), 'PACKAGE_PORT': str(args.port)}
    subprocess.run(['node', str(verifier)], cwd=ROOT, env=env, check=True)
    report = json.loads((unpacked / 'PACKAGE_VERIFICATION.json').read_text())
    if report.get('passed') is not True or report.get('home', {}).get('version') != RUNTIME:
        raise RuntimeError('Actual unpacked runtime verification did not pass FIX2.')
    report.update({'preparedSnapshotSha256': sha(FULL / 'PREPARED_SNAPSHOT.json'),
                   'buildIdSha256': sha(FULL / f'evidence/{TASK}/BUILD_ID.json'),
                   'unpackedVerification': {'passed': True, 'transportSha256': sha(transport), 'fileCount': len(entries), 'allFileHashes': True, 'fingerprintMatched': True, 'root': str(unpacked)},
                   'verificationAdapter': 'Existing boot/start assertions on extracted package. No fixed legacy frame count; complete art bytes verified by BUILD_ID. Headless unless --visible.'})
    finalize_verification_reports(report)
    dump(FULL / 'PACKAGE_VERIFICATION.json', report)
    dump(SMALL / 'PACKAGE_VERIFICATION.json', report)
    dump(EVIDENCE / 'PACKAGE_VERIFICATION.json', report)
    print(json.dumps({'verifiedUnpacked': str(unpacked), 'runtime': RUNTIME, 'passed': True}, ensure_ascii=False))


def archive_one(stage):
    target = DEST / (stage.name + '.zip')
    if target.exists():
        raise RuntimeError(f'Archive exists; preserve delivered output: {target.name}')
    check_prepared(stage)
    entries = listing(stage, ('MANIFEST.json',))
    manifest = {'version': VERSION, 'runtime': RUNTIME, 'stage': stage.name, 'generatedAt': datetime.datetime.now().astimezone().isoformat(),
                'snapshot': 'Current local working tree; no Git HEAD claim', 'fileCount': len(entries), 'totalBytes': sum(e['bytes'] for e in entries),
                'evidenceScope': 'Current FIX2 evidence only; source docs retained; historical videos remain in prior deliveries',
                'sanitized': {'AppID': 'blank only in shared WeChat config'}, 'files': entries}
    dump(stage / 'MANIFEST.json', manifest)
    archive_entries = entries + [{'path': 'MANIFEST.json', 'sha256': sha(stage / 'MANIFEST.json')}]
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for entry in archive_entries:
            z.write(stage / entry['path'], stage.name + '/' + entry['path'])
    with zipfile.ZipFile(target) as z:
        if z.testzip() is not None:
            raise RuntimeError('ZIP CRC failed')
        for entry in archive_entries:
            if hashlib.sha256(z.read(stage.name + '/' + entry['path'])).hexdigest() != entry['sha256']:
                raise RuntimeError('ZIP hash mismatch: ' + entry['path'])
    return {'archive': str(target), 'bytes': target.stat().st_size, 'files': len(entries) + 1, 'sha256': sha(target), 'crcAndAllHashes': True}


def archive(args):
    receipt = json.loads((FULL / 'PACKAGE_VERIFICATION.json').read_text())
    if (receipt.get('passed') is not True or receipt.get('home', {}).get('version') != RUNTIME
            or receipt.get('preparedSnapshotSha256') != sha(FULL / 'PREPARED_SNAPSHOT.json')
            or receipt.get('smallPreparedSnapshotSha256') != sha(SMALL / 'PREPARED_SNAPSHOT.json')
            or receipt.get('postVerificationDocumentationDelta', {}).get('executableSourceAssetsBuildUnchanged') is not True
            or receipt.get('unpackedVerification', {}).get('passed') is not True
            or receipt.get('buildIdSha256') != sha(FULL / f'evidence/{TASK}/BUILD_ID.json')):
        raise RuntimeError('Run actual --verify-stage on the prepared FIX2 snapshot first.')
    check_prepared(FULL)
    check_prepared(SMALL)
    fingerprint_check(FULL)
    if json.loads((FULL / 'build/wechatgame/project.config.json').read_text())['appid'] != '':
        raise RuntimeError('Shared AppID must be blank')
    media = json.loads((SMALL / 'MEDIA_CONTENTS.json').read_text())
    clip = SMALL / media['clip']['path']
    if not media['actualPngPaths'] or any(not (SMALL / p).is_file() for p in media['actualPngPaths']):
        raise RuntimeError('Actual PNG evidence missing')
    if sha(clip) != media['clip']['sha256'] or not 30 <= duration(clip) <= 45:
        raise RuntimeError('Actual 30–45-second MP4 mismatch')
    if len(media.get('comparisonGroups', [])) != 4:
        raise RuntimeError('Four actual PNG comparison groups required')
    for group in media['comparisonGroups']:
        for side in ['before', 'after']:
            item = group[side]
            if png_info(SMALL / item['path'])['sha256'] != item['sha256'] or sha(SMALL / item['metadata']) != item['metadataSha256']:
                raise RuntimeError('Comparison PNG/metadata changed')
    # Include actual snapshot verification in both packages, without rewriting prepared source artifacts.
    copy_file(FULL / 'PACKAGE_VERIFICATION.json', SMALL / 'PACKAGE_VERIFICATION.json')
    for stage in [FULL, SMALL]:
        if (DEST / (stage.name + '.zip')).exists():
            raise RuntimeError('One or more FIX2 archives already exist; preserve them.')
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
    parser.add_argument('--clip', help='Current evidence MP4 path; duration must be 30–45 seconds')
    parser.add_argument('--groups', help='JSON with exactly four named before/after PNG + metadata mappings, relative to task evidence')
    parser.add_argument('--natural', default='full-natural-three-levels.mp4', help='Full natural three-level MP4 path relative to current evidence; full package only')
    parser.add_argument('--extra-media', action='append', default=[], help='Additional original-speed evidence MP4 relative to current evidence; included in both packages')
    parser.add_argument('--port', type=int, default=43210)
    parser.add_argument('--visible', action='store_true', help='Show Chrome during stage verification; default headless')
    args = parser.parse_args()
    prepare(args) if args.prepare else verify_stage(args) if args.verify_stage else archive(args)
