from pathlib import Path
import argparse,plistlib,subprocess,datetime,json,hashlib
parser=argparse.ArgumentParser();parser.add_argument('--device',required=True);args=parser.parse_args()
R=Path.cwd();E=R/'.cache/iphone-quick/ui-phone-20261017';app=R/'build/ios-music-shanhe/proj/Release-iphoneos/CocosGame.app'
info=plistlib.loads((app/'Info.plist').read_bytes());assert info['CFBundleIdentifier']=='com.yvainair.yiluchangge';assert(info['CFBundleShortVersionString'],info['CFBundleVersion'])==('0.12.9','2026101701')
r=subprocess.run(['codesign','--verify','--deep','--strict',str(app)],capture_output=True,text=True);(E/'codesign.log').write_text(r.stdout+r.stderr);assert r.returncode==0
p=plistlib.loads(subprocess.check_output(['security','cms','-D','-i',str(app/'embedded.mobileprovision')],stderr=subprocess.DEVNULL));assert p['ExpirationDate']>datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None);assert args.device in p.get('ProvisionedDevices',[]);signed_ent=plistlib.loads(subprocess.check_output(['codesign','-d','--entitlements',':-',str(app)],stderr=subprocess.DEVNULL));assert signed_ent['application-identifier']=='325CW4AZ5L.com.yvainair.yiluchangge';import fnmatch;assert fnmatch.fnmatchcase(signed_ent['application-identifier'],p['Entitlements']['application-identifier'])
m=json.loads((E/'bridge-build-manifest.json').read_text());fp=m['code_fingerprint'];hits=[str(f.relative_to(app)) for f in app.rglob('*.js') if fp in f.read_text(errors='ignore')];assert hits,'fresh code fingerprint must exist in packaged JavaScript'
for row in m['source_files']:
 rel,expected=row;
 if rel and expected:assert hashlib.sha256((R/rel).read_bytes()).hexdigest()==expected,rel
out={'produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':{k:m[k] for k in ['build_id','code_fingerprint','target','configuration','produced_at']},'version':info['CFBundleShortVersionString'],'build_number':info['CFBundleVersion'],'bundle_id':info['CFBundleIdentifier'],'profile_expiry_utc':p['ExpirationDate'].isoformat()+'Z','profile_contains_phone':True,'codesign':'passed','app_path':str(app),'embedded_fingerprint_files':hits,'executable_sha256':hashlib.sha256((app/'CocosGame').read_bytes()).hexdigest()}
(E/'signing.json').write_text(json.dumps(out,indent=2));print(json.dumps({k:v for k,v in out.items() if k not in ['app_path','executable_sha256']},ensure_ascii=False))
