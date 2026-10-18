#!/usr/bin/env python3
"""Export actual working-tree sources for review; never mutate game files.

Locally reconstructed from the user's file list on 2026-10-16.
The originally referenced exporter/design-contract files were not supplied.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from datetime import datetime, timezone, timedelta
import zipfile


CORE = [f'assets/scripts/formal/{name}.ts' for name in (
    'FullMenu', 'UIComponents', 'NativePaint', 'FormalGame', 'MenuLayout',
    'MenuLayers', 'UIFrames', 'store', 'data', 'RewardFlow',
    'WeaponPresentation', 'R2Art', 'CampaignMap')]
CORE += ['assets/scripts/Platform.ts', 'tests/ui-full-runtime.test.ts',
         'tests/r3-menu.test.ts']
ABSENT = {
    'assets/scripts/formal/UITheme.ts':
        '无独立文件；现有样式分布于 UIComponents.ts、UIFrames.ts、FullMenu.ts 和 FormalGame.ts。',
    'assets/scripts/formal/MapLayout.ts':
        '地图布局和 marchPath 实际位于 assets/scripts/formal/CampaignMap.ts。',
    'assets/scripts/formal/RewardPresentation.ts':
        'RewardPresentation 类型实际定义于 assets/scripts/formal/RewardFlow.ts；呈现逻辑见 FullMenu.ts / FormalGame.ts。',
}
UI_PATTERNS = ('ui-full-components.*', 'campaign20-map*', 'campaign20-icons.*',
               'campaign20-characters-*', 'campaign20-hero-weapons.*',
               'campaign20-mounts.*', 'gen_weapon_icons.*', 'gen_treasure_icons.*',
               'ios-details.*', 'ios-map.*', 'pr2-portraits.*',
               'r3-characters-*', 'r27-character-gaits.*', 'r2-*-crossbow.*')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path('.'))
    parser.add_argument('--include-ui-assets', action='store_true')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--screenshots', type=Path, nargs='*', default=[])
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    output = args.output.resolve()
    if output.exists():
        raise SystemExit(f'Refusing to overwrite: {output}')
    missing = [p for p in CORE if not (root / p).is_file()]
    if missing:
        raise SystemExit('Required sources missing: ' + ', '.join(missing))
    files = set(CORE)
    # Include all real script modules so dynamic loaders and current untracked
    # home-editor imports remain available to the reviewer.
    files.update(str(p.relative_to(root)) for p in (root / 'assets/scripts').rglob('*.ts'))
    for name in ('package.json', 'package-lock.json', 'tsconfig.json',
                 'tsconfig.core.json', 'tools/run-local.mjs',
                 'tools/test-targeted.mjs', 'docs/TESTING.md',
                 'export_current_ui_for_gemini.py'):
        if (root / name).is_file():
            files.add(name)
    for pattern in ('*menu*.test.ts', '*reward*.test.ts', '*ui-full*.test.ts',
                    '*home-button*.test.ts', '*weapon-presentation*.test.ts'):
        files.update(str(p.relative_to(root)) for p in (root / 'tests').glob(pattern))
    if args.include_ui_assets:
        files.update(str(p.relative_to(root)) for p in
                     (root / 'assets/resources/ui20260925').glob('*') if p.is_file())
        for pattern in UI_PATTERNS:
            files.update(str(p.relative_to(root)) for p in
                         (root / 'assets/resources/formal20260927').glob(pattern)
                         if p.is_file())
        manifest = 'art-source/ui-full-20261001/manifest.json'
        if (root / manifest).is_file():
            files.add(manifest)
    for name in list(files):
        if (root / (name + '.meta')).is_file():
            files.add(name + '.meta')
    payload = {}
    for name in sorted(files):
        path = root / name
        if path.is_symlink() or not path.resolve().is_relative_to(root):
            raise SystemExit(f'Unsafe source path: {name}')
        payload[name] = path.read_bytes()
    for i, screenshot in enumerate(args.screenshots, 1):
        if screenshot.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
            raise SystemExit('Only image files accepted as screenshots')
        payload[f'reference-screenshots/{i:02d}-{screenshot.name}'] = screenshot.read_bytes()
    def git(*cmd):
        return subprocess.check_output(['git', '-C', str(root), *cmd], text=True).strip()
    source_entries = [{'path': name, 'bytes': len(data), 'sha256': sha(data)}
                      for name, data in sorted(payload.items())]
    source_fingerprint = sha('\n'.join(
        f"{e['path']}\0{e['sha256']}" for e in source_entries
        if e['path'].startswith('assets/scripts/') and e['path'].endswith('.ts')
    ).encode())
    manifest = {
        'project_id': 'yilu-changge',
        'created_at': datetime.now(timezone(timedelta(hours=8))).isoformat(),
        'source': 'actual working tree, including uncommitted/untracked script files',
        'head': git('rev-parse', 'HEAD'), 'branch': git('branch', '--show-current'),
        'exported_scripts_sha256': source_fingerprint,
        'fingerprint_note': 'SHA-256 of sorted relative-path NUL file-sha256 lines for exported .ts scripts; not a bridge snapshot/build fingerprint.',
        'requested_nonexistent_files': {k: v for k, v in ABSENT.items() if not (root / k).exists()},
        'files': source_entries,
        'validation': 'All entries compared with captured bytes; project files rehashed against current working tree.',
    }
    mappings = '\n'.join(f'- `{k}`：{v}' for k, v in manifest['requested_nonexistent_files'].items())
    readme = f'''# 一路长歌：三国 · 当前真实 UI 源码审阅包

本包由本地 Codex 按用户贴出的源码清单导出，使用当前工作树真实文件，包含未提交的首页编辑功能。
HEAD：`{manifest['head']}`。不能只依据 HEAD 判断内容；逐文件字节数与 SHA-256 见 `SOURCE_MANIFEST.json`。

## 输入差异

原文提到的 export_current_ui_for_gemini.py、README.md、01_GEMINI_PROMPT.md、02_PAGE_BY_PAGE_SPEC.md、03_KNOWN_CODE_FINDINGS.md 配套原件未在本地找到，也未随本次消息附带。本包的脚本和本 README 是本次补写，不能冒充原设计契约。
请结合原对话已提供的设计契约审阅；本包不重建或臆造缺失文档。

{mappings}

## 阅读入口

1. FullMenu.ts、UIComponents.ts、NativePaint.ts、FormalGame.ts：真实界面与渲染。
2. MenuLayout.ts、MenuLayers.ts、UIFrames.ts、CampaignMap.ts：布局、安全区、分层与地图。
3. store.ts、data.ts、RewardFlow.ts、WeaponPresentation.ts、R2Art.ts、Platform.ts：数据、事务、奖励和平台。
4. tests/ui-full-runtime.test.ts、tests/r3-menu.test.ts：现有测试契约。
5. HomeButtonConfig.ts、HomeButtonLayout.ts、HomeEditor*.ts：现有首页编辑功能，增量改动应保留。

## 范围与状态

包含全部 assets/scripts 下的真实 TypeScript 文件和相关 UI 测试，以免遗漏真实导入依赖。
UI 素材选取现有首页/背景、组件图集、五幅地图、人物、兵器/宝物图标及其 metadata；不是完整可构建游戏资源包，战斗、音频及 Cocos 构建缓存没有全量打包。
没有新生成参考截图；reference-screenshots 仅在调用者明确提供时出现。
未修改游戏实现，未提交、发布或上传 Gemini；本轮只验证导出完整性，没有重新进行游戏测试或真机验收。
不能从本包推断手机当前安装版本。请输出针对这些真实文件的审计与增量 diff，不要虚构函数或为缺失文件伪造已有实现。
'''
    payload['README.md'] = readme.encode()
    payload['SOURCE_MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'x', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr(name, data)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        assert set(archive.namelist()) == set(payload)
        for name, data in payload.items():
            assert archive.read(name) == data, name
    for name in files:
        assert (root / name).read_bytes() == payload[name], f'Changed during export: {name}'
    print(json.dumps({'output': str(output), 'bytes': output.stat().st_size,
                      'entries': len(payload), 'source_files': len(source_entries),
                      'typescript_files': sum(n.endswith('.ts') for n in payload),
                      'missing_requested': list(manifest['requested_nonexistent_files']),
                      'sha256': sha(output.read_bytes()), 'verification': 'passed'},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
