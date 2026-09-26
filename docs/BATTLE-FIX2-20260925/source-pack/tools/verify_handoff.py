#!/usr/bin/env python3
"""Verify this specification package only. This does not validate game behavior."""
from pathlib import Path
import hashlib
import json
import sys

def main() -> int:
    root = Path(__file__).resolve().parents[1]
    try:
        manifest = json.loads((root / 'MANIFEST.json').read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        print(f'Manifest error: {exc}', file=sys.stderr)
        return 2
    errors = []
    for entry in manifest.get('files', []):
        p = (root / entry['path']).resolve()
        if not p.is_relative_to(root.resolve()):
            errors.append(f"Unsafe path: {entry['path']}")
            continue
        if not p.is_file():
            errors.append(f"Missing: {entry['path']}")
            continue
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        if digest != entry['sha256'] or p.stat().st_size != entry['bytes']:
            errors.append(f"Mismatch: {entry['path']}")
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f"Verified {len(manifest.get('files', []))} handoff files; no game tests executed.")
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
