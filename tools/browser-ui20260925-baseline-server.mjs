import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('.cache/UI-20260925-baseline/isolated-web/web-mobile'),port=43205;
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.wasm':'application/wasm','.mp3':'audio/mpeg','.ogg':'audio/ogg','.bin':'application/octet-stream'};
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),p=resolve(root,'.'+pathname);if(p!==root&&!p.startsWith(root+'/'))throw Error('outside root');const info=await stat(p),file=info.isDirectory()?resolve(p,'index.html'):p;res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(JSON.stringify({root,url:`http://127.0.0.1:${port}/`,purpose:'immutable UI-20260925 before build'})));
