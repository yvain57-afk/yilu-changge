#!/usr/bin/env python3
"""Local Cocos iOS export/build. No signing account mutation or upload.
3.8.8 ships Intel simulator defaults and a legacy, unaligned WebP archive.
Patch only generated Xcode output; repack WebP with the installed Apple libtool.
"""
import argparse, json, pathlib, plistlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
CREATOR = pathlib.Path('/Applications/CocosCreator/Creator/3.8.8/CocosCreator.app')
ENGINE = CREATOR / 'Contents/Resources/resources/3d/engine/native'
p = argparse.ArgumentParser()
p.add_argument('--device', action='store_true')
p.add_argument('--output-name', help='Independent local build output; never replaces FIX_ONLY by default')
p.add_argument('--evidence-dir', default='evidence/IOS-PLAYABLE-FIX-20260928')
p.add_argument('--version', default='0.11.0')
p.add_argument('--build-number', default='20260929')
p.add_argument('--skip-export', action='store_true')
p.add_argument('--prepare-only', action='store_true', help='Repair generated Xcode output without building; used before Archive')
p.add_argument('--release', action='store_true')
p.add_argument('--team', help='Existing local Apple development team; device install only, no upload')
a = p.parse_args()
name = a.output_name or ('ios-device' if a.device else 'ios-simulator')
if '/' in name or '..' in name: sys.exit('Invalid output name')
out = ROOT / 'build' / name
logs = ROOT / a.evidence_dir
logs.mkdir(parents=True, exist_ok=True)
cfg = json.loads((ROOT/'tools/build-ios.json').read_text())
cfg['outputName'] = name
cfg['debug'] = not a.release
cache = ROOT/'.cache/ios-playable'; cache.mkdir(parents=True, exist_ok=True)
config = cache/(name+'.json'); config.write_text(json.dumps(cfg,ensure_ascii=False,indent=2))
if not a.skip_export:
    # Capture the actual dirty game source before export, never today's HEAD at runtime.
    sys.path.insert(0, str(ROOT/'tools/project-reader'))
    from common import game_fingerprint, now, write_json
    import uuid
    code_fp, source_rows = game_fingerprint(ROOT)
    stamp={'build_id':'ios-'+uuid.uuid4().hex[:16], 'code_fingerprint':code_fp, 'produced_at':now(), 'target':'physical_device' if a.device else 'simulator', 'configuration':'Release' if a.release else 'Debug','app_version':a.version,'build_number':a.build_number}
    (ROOT/'assets/scripts/formal/BridgeBuild.ts').write_text('// Generated before Cocos export; not part of its own source fingerprint.\nexport const BRIDGE_BUILD='+json.dumps(stamp)+';\n')
    write_json(logs/'bridge-build-manifest.json', {**stamp,'source_files':source_rows})
    with (logs/(name+'-export.log')).open('w') as log:
        result = subprocess.run([str(CREATOR/'Contents/MacOS/CocosCreator'), '--project', str(ROOT), '--build', 'configPath='+str(config)], stdout=log, stderr=subprocess.STDOUT)
    if result.returncode not in (0,36): sys.exit('Creator export failed: '+str(result.returncode))
data = out/'data'
main_config = data/'assets/main/cc.config.json'
try:
    main_bundle = json.loads(main_config.read_text())
    resource_bundle = json.loads((data/'assets/resources/cc.config.json').read_text())
    launch_scene = json.loads((data/'src/settings.json').read_text())['launch']['launchScene']
    has_scene = launch_scene in main_bundle['scenes']
    has_scripts = any((data/'src/chunks').glob('*.js'))
    has_assets = bool(resource_bundle['uuids'])
except (OSError, KeyError, ValueError) as exc:
    sys.exit(f'Creator export incomplete: {exc}')
if not (has_scene and has_scripts and has_assets):
    sys.exit(f'Creator export incomplete: scene={has_scene}, scripts={has_scripts}, assets={has_assets}; see {logs/(name+"-export.log")}')
project = out/'proj/一路长歌.xcodeproj'
pbx = project/'project.pbxproj'
text = pbx.read_text()
if not a.device:
    text = text.replace('/external/ios/', '/external/ios-m1-simulator/')
    text = text.replace('"ARCHS[sdk=iphonesimulator*]" = x86_64;', '"ARCHS[sdk=iphonesimulator*]" = arm64;')
    text = text.replace('"VALID_ARCHS[sdk=iphonesimulator*]" = x86_64;', '"VALID_ARCHS[sdk=iphonesimulator*]" = arm64;')
    text = text.replace('"EXCLUDED_ARCHS[sdk=iphonesimulator*]" = arm64;', '"EXCLUDED_ARCHS[sdk=iphonesimulator*]" = "";')
lib = ENGINE/('external/ios/libs/libwebp.a' if a.device else 'external/ios-m1-simulator/libs/libwebp.a')
fixed = cache/(name+'-libwebp.a')
archive=lib
if a.device:
    archive=cache/'webp-device-thin.a'
    subprocess.run(['xcrun','lipo',str(lib),'-thin','arm64','-output',str(archive)],check=True)
subprocess.run(['xcrun','libtool','-static','-o',str(fixed),str(archive)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

text = text.replace(str(lib), json.dumps(str(fixed), ensure_ascii=False))
text = text.replace("'-Wl,-ld_classic' ", "")
# Idempotent repair of an earlier generated, unquoted Unicode path.
text = text.replace(','+str(fixed)+',', ','+json.dumps(str(fixed), ensure_ascii=False)+',')
# Cocos 3.8.8 reads the removed application status-bar orientation API.
# Compile a scoped copy; never modify the installed shared engine.
screen_source=ENGINE/'cocos/platform/ios/modules/Screen.mm'
screen_fixed=cache/'Screen-Scene.mm'
screen_text=screen_source.read_text().replace('switch ([[UIApplication sharedApplication] statusBarOrientation])', 'switch (UIApplication.sharedApplication.delegate.window.windowScene.interfaceOrientation)').replace('CC_ABORT();', 'orientation = Orientation::PORTRAIT; // Window attaches before first scene layout.')
screen_fixed.write_text(screen_text)
text=text.replace('path = '+str(screen_source)+';', 'path = '+json.dumps(str(screen_fixed),ensure_ascii=False)+';')
pbx.write_text(text)
# CMake keeps a configured plist even when --skip-export is used.
generated_plist = out/'proj/CMakeFiles/CocosGame.dir/Info.plist'
info = plistlib.loads(generated_plist.read_bytes())
info['CFBundleShortVersionString'] = a.version
info['CFBundleVersion'] = a.build_number
generated_plist.write_bytes(plistlib.dumps(info))
if a.prepare_only:
    print(json.dumps({'target':name,'project':str(project),'prepared':True,'built':False,'signed':False},ensure_ascii=False))
    sys.exit(0)
cmd = ['xcodebuild','-project',str(project),'-scheme','CocosGame','-configuration','Release' if a.release else 'Debug','-sdk','iphoneos' if a.device else 'iphonesimulator','-destination','generic/platform=iOS' if a.device else 'generic/platform=iOS Simulator','-derivedDataPath',str(cache/(name+'-derived')),'CODE_SIGNING_ALLOWED='+('YES' if a.team and a.device else 'NO'),'PRODUCT_BUNDLE_IDENTIFIER=com.yvainair.yiluchangge','TARGETED_DEVICE_FAMILY=1','IPHONEOS_DEPLOYMENT_TARGET=16.0','MARKETING_VERSION='+a.version,'CURRENT_PROJECT_VERSION='+a.build_number,'OTHER_CPLUSPLUSFLAGS=$(inherited) -Wno-invalid-specialization','build']
if a.team and a.device:cmd+=['-allowProvisioningUpdates','DEVELOPMENT_TEAM='+a.team,'CODE_SIGN_STYLE=Automatic','CODE_SIGN_IDENTITY=Apple Development']
with (logs/(name+'-build.log')).open('w') as log:
    result = subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT)
if result.returncode == 0:
    product = out/'proj'/('Release' if a.release else 'Debug')
    product = product.with_name(product.name + ('-iphoneos' if a.device else '-iphonesimulator'))/'CocosGame.app'
    info = plistlib.loads((product/'Info.plist').read_bytes())
    if (info.get('CFBundleShortVersionString'), info.get('CFBundleVersion')) != (a.version, a.build_number):
        sys.exit('Built app version does not match requested version/build; check native Info.plist.')
print(json.dumps({'target':name,'exit':result.returncode,'project':str(project),'signed':bool(a.team and a.device and result.returncode==0)},ensure_ascii=False))
sys.exit(result.returncode)
