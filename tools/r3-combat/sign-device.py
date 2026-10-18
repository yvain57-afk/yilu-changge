#!/usr/bin/env python3
"""Sign only this project product using an already-present, matching development identity."""
import pathlib,subprocess,plistlib,hashlib,shutil,json,datetime
R=pathlib.Path(__file__).resolve().parents[2];S=pathlib.Path('/Users/yvainair/Code/Codex/2026-10-03/yilu-r3-phone-private');S.mkdir(parents=True,exist_ok=True)
profile=pathlib.Path('/Users/yvainair/Code/Codex/2026-10-02/yilu-phone-private/signed-2026100201/CocosGame.app/embedded.mobileprovision')
p=plistlib.loads(subprocess.check_output(['security','cms','-D','-i',str(profile)],stderr=subprocess.DEVNULL));ident=hashlib.sha1(p['DeveloperCertificates'][0]).hexdigest().upper()
assert ident in subprocess.check_output(['security','find-identity','-v','-p','codesigning'],text=True)
assert p['Entitlements']['application-identifier'].endswith('.com.yvainair.yiluchangge')
assert p['ExpirationDate']>datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
source=R/'build/ios-r3-combat/proj/Release-iphoneos/CocosGame.app';source_info=plistlib.loads((source/'Info.plist').read_bytes())
app=S/('signed-'+source_info['CFBundleVersion'])/'CocosGame.app';assert not app.exists(),'retain previous signed product; choose a new scoped output'
shutil.copytree(R/'build/ios-r3-combat/proj/Release-iphoneos/CocosGame.app',app);shutil.copy2(profile,app/'embedded.mobileprovision');ent=S/'entitlements.plist';ent.write_bytes(plistlib.dumps(p['Entitlements']))
subprocess.run(['codesign','--force','--sign',ident,'--entitlements',str(ent),'--timestamp=none','--generate-entitlement-der',str(app)],check=True)
subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
m=json.loads((R/'evidence/R3-COMBAT-PATCH-20261002/native/bridge-build-manifest.json').read_text());info=plistlib.loads((app/'Info.plist').read_bytes());out={'produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':{k:m[k] for k in ['build_id','code_fingerprint','target','configuration','produced_at']},'version':info['CFBundleShortVersionString'],'build_number':info['CFBundleVersion'],'bundle_id':info['CFBundleIdentifier'],'profile_expiry_utc':p['ExpirationDate'].isoformat()+'Z','codesign':'passed','app_path':str(app),'executable_sha256':hashlib.sha256((app/'CocosGame').read_bytes()).hexdigest()};(R/'evidence/R3-COMBAT-PATCH-20261002/native/signing.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
