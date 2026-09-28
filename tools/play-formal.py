"""Play the bundled Web build without npm or Cocos installation."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import webbrowser
root=Path(__file__).resolve().parents[1]/'build/web-mobile'
if not (root/'index.html').exists():raise SystemExit('Missing build/web-mobile/index.html; run npm run build:web first.')
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
url=f'http://127.0.0.1:{server.server_port}/'
print('一路长歌：三国 '+url+'\n关闭终端可停止服务。',flush=True)
webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:server.server_close()
