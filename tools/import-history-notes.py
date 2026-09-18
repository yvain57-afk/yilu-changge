#!/usr/bin/env python3
"""Import the verified original-study-note snapshot without modifying its source."""
import argparse
import hashlib
import json
import re
import stat
import zipfile
from collections import Counter
from pathlib import Path, PurePosixPath
from urllib.parse import quote

EXPECTED_SHA256 = '5bb984cba673c230bebf12e9f9fcad1df7be7452f6bc6fa8a1746e2ff8f04ae2'
PROJECT = Path(__file__).resolve().parents[1]
DEST = PROJECT / 'references/chinese-history'
ROOT = '刘勃讲中国史学习稿/'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def decoded_name(info):
    if info.flag_bits & 0x800:
        return info.filename
    try:
        return info.filename.encode('cp437').decode('utf8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return info.filename


def link(path):
    return quote(str(path), safe='/')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path, help='Read-only source ZIP')
    args = parser.parse_args()
    archive = args.archive.read_bytes()
    if sha(archive) != EXPECTED_SHA256:
        raise ValueError('Source archive differs from the verified snapshot')
    files = {}
    with zipfile.ZipFile(args.archive) as source:
        bad = source.testzip()
        if bad:
            raise ValueError(f'ZIP CRC failure: {bad}')
        for info in source.infolist():
            name = decoded_name(info)
            if name == ROOT + 'manifest.jsonl':
                target = 'catalog.jsonl'
            elif name.startswith(ROOT + 'vault/') and name.endswith('.md'):
                target = 'notes/' + name[len(ROOT + 'vault/'):]
            else:
                continue
            path = PurePosixPath(target)
            if path.is_absolute() or '..' in path.parts or stat.S_ISLNK(info.external_attr >> 16):
                raise ValueError(f'Unsafe member: {name}')
            if target in files:
                raise ValueError(f'Duplicate member: {target}')
            files[target] = source.read(info)
    records = [json.loads(line) for line in files['catalog.jsonl'].decode('utf8').splitlines()]
    notes = {p: data for p, data in files.items() if p.startswith('notes/')}
    if len(records) != 334 or len(notes) != 388:
        raise ValueError('Unexpected catalog/note count')
    by_id = {}
    for path, data in notes.items():
        text = data.decode('utf8')
        if not path.startswith('notes/01-'):
            continue
        match = re.search(r'^stable_id:\s*(L\d+)\s*$', text, re.M)
        if not match or match[1] in by_id:
            raise ValueError(f'Missing or duplicate lesson identity: {path}')
        if '不是课程原文' not in text:
            raise ValueError(f'Missing original-study-note declaration: {path}')
        by_id[match[1]] = path
    missing = []
    for record in records:
        path = by_id.get(record['stable_id'])
        if path:
            if record['status'] != 'reviewed' or sha(files[path]) != record['content_sha256']:
                raise ValueError(f'Source manifest/hash mismatch: {record["stable_id"]}')
        else:
            if record['status'] != 'discovered':
                raise ValueError(f'Unexpected absent manuscript: {record["stable_id"]}')
            missing.append({'stable_id': record['stable_id'], 'title': record['title']})
    if len(by_id) != 326 or len(missing) != 8:
        raise ValueError('Unexpected available/missing lesson count')
    categories = Counter(p.split('/')[1] for p in notes)
    index = ['# 课程学习稿目录', '',
             '326 篇逐讲原创学习稿可读；目录共 334 条，8 条缺稿。编号沿用来源 stable_id，非臆造的新课号。', '',
             '[阅读说明](README.md) · [给 GPT 的阅读指南](GPT_GUIDE.md)', '']
    for category in sorted(categories):
        if category.startswith('01-'):
            continue
        index += ['## ' + category, '']
        for path in sorted(p for p in notes if p.split('/')[1] == category):
            index.append(f'- [{Path(path).stem}]({link(path)})')
        index.append('')
    for period in dict.fromkeys(r['period'] for r in records):
        index += ['## 逐讲：' + period, '', '| 编号 | 标题与文稿 | 状态 |', '|---|---|---|']
        for record in (r for r in records if r['period'] == period):
            path = by_id.get(record['stable_id'])
            title = record['title'].replace('|', '\\|')
            cell = f'[{title}]({link(path)})' if path else title
            index.append(f'| {record["stable_id"]} | {cell} | {"可读" if path else "仅目录，缺稿"} |')
        index.append('')
    files['INDEX.md'] = ('\n'.join(index).rstrip() + '\n').encode()
    receipt = {
        'source_archive': args.archive.name,
        'source_sha256': EXPECTED_SHA256,
        'source_bytes': len(archive),
        'import_date': '2026-09-18',
        'catalog_records': len(records),
        'lesson_manuscripts': len(by_id),
        'markdown_documents': len(notes),
        'categories': dict(sorted(categories.items())),
        'missing_manuscripts': missing,
        'validation': {'zip_crc': 'pass', 'lesson_source_hashes_matched': len(by_id)},
        'files': [{'path': p, 'bytes': len(data), 'sha256': sha(data)} for p, data in sorted(files.items())],
    }
    files['import-manifest.json'] = (json.dumps(receipt, ensure_ascii=False, indent=2) + '\n').encode()
    # Resolve/check every destination before writing any file; never overwrite changed work.
    for path, data in files.items():
        target = DEST / path
        if not target.resolve().is_relative_to(PROJECT):
            raise ValueError(f'Destination leaves project: {path}')
        if target.exists() and target.read_bytes() != data:
            raise ValueError(f'Refusing to overwrite changed file: {path}')
    for path, data in files.items():
        target = DEST / path
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        if target.read_bytes() != data:
            raise ValueError(f'Readback mismatch: {path}')
    print(json.dumps({
        'zip_crc': 'pass', 'markdown_documents': len(notes),
        'catalog_records': len(records), 'lesson_hashes_matched': len(by_id),
        'missing_manuscripts': len(missing), 'files_verified': len(files),
        'destination': str(DEST),
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
