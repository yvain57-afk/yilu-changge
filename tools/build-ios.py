#!/usr/bin/env python3
"""Local Cocos iOS export/build. No signing account mutation or upload.
3.8.8 ships Intel simulator defaults and a legacy, unaligned WebP archive.
Patch only generated Xcode output; repack WebP with the installed Apple libtool.
"""
import argparse, json, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
CREATOR = pathlib.Path('/Applications/CocosCreator/Creator/3.8.8/CocosCreator.app')
ENGINE = CREATOR / 'Contents/Resources/resources/3d/engine/native'
p = argparse.ArgumentParser()
p.add_argument('--device', action='store_true')
p.add_argument('--skip-export', action='store_true')
p.add_argument('--release', action='store_true')
p.add_argument('--team', help='Existing local Apple development team; device install only, no upload')
a = p.parse_args()
name = 'ios-device' if a.device else 'ios-simulator'
out = ROOT / 'build' / name
logs = ROOT / 'evidence/IOS-PLAYABLE-FIX-20260928'
logs.mkdir(parents=True, exist_ok=True)
cfg = json.loads((ROOT/'tools/build-ios.json').read_text())
cfg['outputName'] = name
cfg['debug'] = not a.release
cache = ROOT/'.cache/ios-playable'; cache.mkdir(parents=True, exist_ok=True)
config = cache/(name+'.json'); config.write_text(json.dumps(cfg,ensure_ascii=False,indent=2))
if not a.skip_export:
    with (logs/(name+'-export.log')).open('w') as log:
        result = subprocess.run([str(CREATOR/'Contents/MacOS/CocosCreator'), '--project', str(ROOT), '--build', 'configPath='+str(config)], stdout=log, stderr=subprocess.STDOUT)
    if result.returncode not in (0,36): sys.exit('Creator export failed: '+str(result.returncode))
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
cmd = ['xcodebuild','-project',str(project),'-scheme','CocosGame','-configuration','Release' if a.release else 'Debug','-sdk','iphoneos' if a.device else 'iphonesimulator','-destination','generic/platform=iOS' if a.device else 'generic/platform=iOS Simulator','-derivedDataPath',str(cache/(name+'-derived')),'CODE_SIGNING_ALLOWED='+('YES' if a.team and a.device else 'NO'),'PRODUCT_BUNDLE_IDENTIFIER=com.yvainair.yiluchangge','TARGETED_DEVICE_FAMILY=1','IPHONEOS_DEPLOYMENT_TARGET=16.0','MARKETING_VERSION=0.10.0','CURRENT_PROJECT_VERSION=20260928','OTHER_CPLUSPLUSFLAGS=$(inherited) -Wno-invalid-specialization','build']
if a.team and a.device:cmd+=['-allowProvisioningUpdates','DEVELOPMENT_TEAM='+a.team,'CODE_SIGN_STYLE=Automatic','CODE_SIGN_IDENTITY=Apple Development']
with (logs/(name+'-build.log')).open('w') as log:
    result = subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT)
print(json.dumps({'target':name,'exit':result.returncode,'project':str(project),'signed':bool(a.team and a.device and result.returncode==0)},ensure_ascii=False))
sys.exit(result.returncode)
