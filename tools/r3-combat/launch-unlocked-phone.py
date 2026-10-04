#!/usr/bin/env python3
"""Bounded launch/readback for the previously paired Yilu iPhone only."""
from pathlib import Path
import datetime, json, subprocess, tempfile, time

ROOT = Path(__file__).resolve().parents[2]
DEVICE = '00008140-000224EA1112801C'
BUNDLE = 'com.yvainair.yiluchangge'
EVIDENCE = ROOT / 'evidence/R3-COMBAT-PATCH-20261002/native'
receipt = {'produced_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'bundle_id': BUNDLE, 'scope': 'Connection check, one bounded launch, version/process readback; no reinstall, camera, or save changes'}

with tempfile.TemporaryDirectory(prefix='yilu-phone-launch-') as td:
    def call(name, args, timeout=20):
        output = Path(td) / (name + '.json')
        r = subprocess.run(['xcrun', 'devicectl', *args, '--quiet', '--timeout', str(timeout),
                            '--json-output', str(output)], capture_output=True, text=True, timeout=timeout + 5)
        data = json.loads(output.read_text()) if output.exists() else {}
        return r.returncode, data, (r.stderr or r.stdout)[-3000:]

    rc, listed, err = call('devices', ['list', 'devices'])
    selected = [x for x in listed.get('result', {}).get('devices', [])
                if x.get('hardwareProperties', {}).get('udid') == DEVICE]
    receipt['connection_probe'] = {'exit_code': rc, 'matched_devices': len(selected)}
    if selected:
        d = selected[0]
        receipt['connection_probe'].update(connection=d.get('connectionProperties'),
                                           state=d.get('deviceProperties', {}).get('bootState'))
    if rc == 0 and selected:
        rc, apps, err = call('apps', ['device', 'info', 'apps', '--device', DEVICE, '--bundle-id', BUNDLE])
        matching = apps.get('result', {}).get('apps', [])
        receipt['version_readback'] = {'exit_code': rc,
                                      'apps': [{k: a.get(k) for k in ('bundleIdentifier', 'version', 'bundleVersion')}
                                               for a in matching]}
        if rc == 0 and len(matching) == 1:
            rc, launch, err = call('launch', ['device', 'process', 'launch', '--device', DEVICE, BUNDLE])
            result = launch.get('result') or {}
            receipt['launch'] = {'exit_code': rc, 'outcome': launch.get('info', {}).get('outcome'),
                                 'result': {'processIdentifier': result.get('process', {}).get('processIdentifier'),
                                            'activatedWhenStarted': result.get('launchOptions', {}).get('activatedWhenStarted')},
                                 'error': err if rc else None}
            if rc == 0:
                time.sleep(3)
                rc, processes, err = call('processes', ['device', 'info', 'processes', '--device', DEVICE])
                alive = [p for p in processes.get('result', {}).get('runningProcesses', [])
                         if 'CocosGame.app/CocosGame' in str(p)]
                receipt['process_readback'] = {'exit_code': rc, 'game_process_count': len(alive),
                                              'pids': [p.get('processIdentifier') for p in alive]}
        else:
            receipt['connection_probe']['readback_error'] = err
    else:
        receipt['connection_probe']['error'] = err

# Retain only connection facts, never the device name/address or unrelated processes.
cp = receipt['connection_probe'].get('connection') or {}
receipt['connection_probe']['connection'] = {k: cp.get(k) for k in ('transportType', 'tunnelState', 'pairingState') if k in cp}
EVIDENCE.mkdir(parents=True, exist_ok=True)
(EVIDENCE / 'unlocked-launch-followup.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2))
print(json.dumps(receipt, ensure_ascii=False, indent=2))
