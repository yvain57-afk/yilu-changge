// 静态服务：node tools/serve.mjs [端口]，根目录为预览目录（index.html 所在处）
import http from 'http'; import fs from 'fs'; import path from 'path'; import { PREVIEW } from './common.mjs';
const port = +(process.argv[2] || process.env.PORT || 8777);
const T = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp4':'video/mp4'};
http.createServer((q, r) => {
  const p = path.join(PREVIEW, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(PREVIEW)) { r.writeHead(403); r.end(); return; }
  fs.readFile(p.endsWith('/') ? p + 'index.html' : p, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'content-type': T[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store'}); r.end(d);
  });
}).listen(port, '127.0.0.1', () => console.log('preview on http://localhost:' + port + '/index.html'));
