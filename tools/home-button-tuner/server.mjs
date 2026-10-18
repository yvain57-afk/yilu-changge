import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
import homeEditorModule from '../../assets/scripts/formal/HomeEditor.ts';
const {HOME_EDITOR_LIMITS,HOME_EDITOR_VARIABLES,validateHomeEditorConfig}=homeEditorModule;

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const base=path.join(root,'build/music-shanhe-web'),preset=path.join(root,'assets/scripts/formal/HomeEditorConfig.ts');
const port=43228,token=crypto.randomBytes(24).toString('hex');
const bundlePath=path.join(base,'assets/main/index.js');
if(!fs.existsSync(bundlePath))throw Error('缺少现有游戏网页资源：build/music-shanhe-web。请先恢复或构建该资源，再启动调节面板。');
const modules=['FullMenu','HomeButtonConfig','HomeButtonLayout','HomeEditorConfig','HomeEditor','HomeEditorPreview'];
let overlayCache={key:'',code:''};
function settings(){
 const source=fs.readFileSync(preset,'utf8'),marker='export const HOME_EDITOR_CONFIG = ',start=source.indexOf(marker),json=source.slice(start+marker.length).trim();
 if(start<0||!json.endsWith(';'))throw Error('无法读取首页设置');
 const config=validateHomeEditorConfig(JSON.parse(json.slice(0,-1)));
 return{config,revision:crypto.createHash('sha256').update(source).digest('hex')};
}
function overlayBundle(){
 const baseCode=fs.readFileSync(bundlePath,'utf8'),sources=modules.map(name=>fs.readFileSync(path.join(root,'assets/scripts/formal',name+'.ts'),'utf8'));
 const key=crypto.createHash('sha256').update(baseCode+sources.join('\n')).digest('hex');
 if(key===overlayCache.key)return overlayCache.code;
 const marks=[...baseCode.matchAll(/^System\.register\("([^"\n]+)"/gm)];
 const index=marks.findIndex(m=>m[1]==='chunks:///_virtual/FullMenu.ts');
 if(index<0)throw Error('现有游戏资源模块结构不匹配，不能替换首页模块');
 const start=marks[index].index,end=marks[index+1]?.index??baseCode.length;
 const compiled=modules.map((name,i)=>ts.transpileModule(sources[i],{
  fileName:name+'.ts',moduleName:'chunks:///_virtual/'+name+'.ts',
  compilerOptions:{target:ts.ScriptTarget.ES2017,module:ts.ModuleKind.System},
  transformers:{before:[context=>source=>ts.visitNode(source,function visit(node){
   if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
    const id=node.moduleSpecifier.text;
    const target=id==='cc/env'?'./env':id.startsWith('.')?'./'+path.basename(id).replace(/\.ts$/,'')+'.ts':id;
    return ts.factory.updateImportDeclaration(node,node.modifiers,node.importClause,ts.factory.createStringLiteral(target),node.attributes);
   }
   return ts.visitEachChild(node,visit,context);
  })]},
 }).outputText).join('\n');
 overlayCache={key,code:baseCode.slice(0,start)+baseCode.slice(end)+'\n'+compiled};
 return overlayCache.code;
}
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.mp3':'audio/mpeg','.wav':'audio/wav','.ttf':'font/ttf'};
function send(res,status,value,type='application/json'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(value):value);}
const server=http.createServer(async(req,res)=>{
 try{
  const hosts=new Set(['127.0.0.1:'+port,'localhost:'+port]);
  if(!hosts.has(req.headers.host))return send(res,403,{error:'只允许本机访问'});
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(url.pathname==='/api/settings'){
   if(req.method==='GET')return send(res,200,{...settings(),defaults:{},limits:HOME_EDITOR_LIMITS,variables:HOME_EDITOR_VARIABLES,token});
   if(req.method!=='POST')return send(res,405,{error:'不支持此操作'});
   if(!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)||req.headers['x-yilu-tuner']!==token||!req.headers['content-type']?.startsWith('application/json'))return send(res,403,{error:'保存请求来源无效'});
   let body='',tooLarge=false;for await(const chunk of req){body+=chunk;if(body.length>4096){tooLarge=true;break;}}
   if(tooLarge)return send(res,413,{error:'保存内容过大'});
   let input,config;try{input=JSON.parse(body);config=validateHomeEditorConfig(input.config);}catch(e){return send(res,400,{error:e.message});}
   if(input.revision!==settings().revision)return send(res,409,{error:'项目设置已被其他操作修改。请刷新后重新调整，避免覆盖。'});
   const source='// 首页各内容的显示设置；只在本地面板点击“保存首页”时写入。\nexport const HOME_EDITOR_CONFIG = '+JSON.stringify(config,null,2)+';\n';
   const temp=preset+'.'+crypto.randomBytes(4).toString('hex')+'.tmp';
   try{fs.writeFileSync(temp,source,{flag:'wx'});fs.renameSync(temp,preset);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
   return send(res,200,settings());
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'不支持此操作'});
  if(url.pathname==='/game/assets/main/index.js')return send(res,200,overlayBundle(),'application/javascript');
  const game=url.pathname.startsWith('/game/'),dir=game?base:here;
  let uri=decodeURIComponent(game?url.pathname.slice(5):url.pathname);
  if(uri==='/'||uri==='')uri='/index.html';
  if(!game&&!['/index.html','/panel.js','/style.css'].includes(uri))return send(res,404,{error:'没有此页面'});
  const file=path.resolve(dir,'.'+uri);
  if(!file.startsWith(dir+path.sep))return send(res,403,{error:'路径无效'});
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,{error:'资源不存在'});
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Length':fs.statSync(file).size});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch(e){if(!res.headersSent)send(res,500,{error:e.message});else res.destroy();}
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('首页整体调节面板：http://127.0.0.1:'+port+'/\n复用现有 Cocos 网页资源，仅替换首页相关模块；不生成新构建。'));
