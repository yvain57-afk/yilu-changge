from http.server import BaseHTTPRequestHandler,HTTPServer
from pathlib import Path
import json,base64,hashlib,sys,re,datetime
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tools/project-reader'));from common import game_fingerprint
fp,rows=game_fingerprint(R);O=R/'evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001/web-auxiliary';O.mkdir(exist_ok=True)
class Handler(BaseHTTPRequestHandler):
 def do_OPTIONS(self):
  self.send_response(204);self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:43212');self.send_header('Access-Control-Allow-Headers','content-type');self.end_headers()
 def do_POST(self):
  n=int(self.headers.get('Content-Length','0'));assert n<20000000
  d=json.loads(self.rfile.read(n));name=d['name'];assert re.fullmatch('[a-zA-Z0-9_-]+',name);p=O/(name+'.png');assert not p.exists()
  if 'frames' in d:
   folder=R/'.cache/regression-recording'/name;folder.mkdir(parents=True,exist_ok=True)
   for i,frame in enumerate(d['frames']):(folder/('%05d.jpg'%i)).write_bytes(base64.b64decode(frame['data']))
   (folder/'timing.json').write_text(json.dumps({'timestamps':[f['metadata']['timestamp'] for f in d['frames']],'state':d['state'],'code_fingerprint':fp}))
   self.send_response(200);self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:43212');self.end_headers();self.wfile.write(b'ok');return
  p.write_bytes(base64.b64decode(d['png']));meta={'_bridge_media':True,'capture_type':'browser','scope':'actual Cocos WebGL DEBUG isolated fixture; not native or physical acceptance','produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':{'code_fingerprint':fp,'build_id':'FIX_ONLY-web-aux'},'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'state':d['state']};p.with_suffix('.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2));self.send_response(200);self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:43212');self.end_headers();self.wfile.write(b'ok')
HTTPServer(('127.0.0.1',43213),Handler).serve_forever()
