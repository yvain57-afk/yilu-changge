"""Local operator commands. None are MCP tools."""
from __future__ import annotations
import argparse, subprocess, sys, os, secrets, getpass, plistlib, signal, time, shlex, threading, zipfile, asyncio, base64
from common import *
LABEL='local.yilu.project-reader'
ENTRY=ROOT/'tools/project-reader/yilu-bridge'
PLIST=Path.home()/'Library/LaunchAgents'/f'{LABEL}.plist'

def install(rebind=False):
    STATE.mkdir(parents=True,exist_ok=True);STATE.chmod(0o700)
    cfg=read_json(STATE/'config.json')
    if cfg and cfg['root']!=str(ROOT) and not rebind:raise Fault('forbidden','explicit install --rebind required for moved checkout')
    cfg=cfg or {'project_id':PROJECT,'cursor_key':secrets.token_hex(32),'quota_bytes':2*1024**3,'media_limit_bytes':8*1024*1024}
    cfg.update(root=str(ROOT),installed_at=now());write_json(STATE/'config.json',cfg)
    for name in ('snapshots','objects','checks','runtime','finalizations','bin','tunnel-profile'):(STATE/name).mkdir(exist_ok=True)
    # A single user agent supervises just this collector and optional official tunnel.
    data={'Label':LABEL,'ProgramArguments':[str(ENTRY),'_supervise'],'WorkingDirectory':str(ROOT),'RunAtLoad':True,'KeepAlive':{'SuccessfulExit':False},'ThrottleInterval':30,'EnvironmentVariables':{'PATH':'/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'},'StandardOutPath':str(STATE/'agent.out.log'),'StandardErrorPath':str(STATE/'agent.err.log')}
    atomic(PLIST,plistlib.dumps(data));return {'installed':True,'root':str(ROOT),'state':str(STATE),'launch_agent':str(PLIST),'account':'blocked_user_action until auth'}

def launchctl(*args,check=False):return subprocess.run(['launchctl',*args],capture_output=True,text=True,check=check)
def start():
    validate_binding();domain=f'gui/{os.getuid()}'
    r=launchctl('bootstrap',domain,str(PLIST))
    if r.returncode and launchctl('print',domain+'/'+LABEL).returncode:raise Fault('unavailable','LaunchAgent bootstrap failed; run install then start in logged-in macOS session')
    return {'started':True,'account':read_json(STATE/'tunnel-status.json',{'status':'blocked_user_action'})}
def stop():
    target=f'gui/{os.getuid()}/{LABEL}'
    launchctl('bootout',target)
    # bootout can return before removal; immediate bootstrap otherwise sees the dying job.
    deadline=time.monotonic()+8
    while launchctl('print',target).returncode==0:
        if time.monotonic()>=deadline:raise Fault('unavailable','LaunchAgent still stopping; start only after it exits')
        time.sleep(.1)
    return {'stopped':True,'note':'Future reads stop; previously returned chat content is not deleted.'}

def clean_env():return {k:v for k,v in os.environ.items() if not any(x in k.upper() for x in ('KEY','TOKEN','SECRET','PASSWORD'))}
def tunnel_env(cfg):
    env=clean_env()
    proxy=cfg.get('tunnel_proxy')
    if proxy:
        # Explicit project-only use of an existing local proxy; never export credentials.
        from urllib.parse import urlsplit
        u=urlsplit(proxy)
        if u.scheme!='http' or u.hostname not in ('127.0.0.1','localhost') or not u.port or u.username or u.password or u.path or u.query or u.fragment:
            raise Fault('forbidden','tunnel_proxy must be an explicit local HTTP proxy endpoint')
        env.update(HTTP_PROXY=proxy,HTTPS_PROXY=proxy,NO_PROXY='127.0.0.1,localhost')
    return env

def poll_health(metrics,checked_seconds):
    match=re.search(r'^commands_poll_last_successful_timestamp_seconds(?:\{[^\n]*\})?\s+([0-9.eE+-]+)\s*$',metrics,re.M)
    stamp=float(match.group(1)) if match else 0
    age=checked_seconds-stamp if stamp else None
    return {'status':'connected' if age is not None and 0<=age<90 else 'unavailable',
            'last_successful_poll':stamp or None,'poll_age_seconds':age,
            'reason':None if age is not None and 0<=age<90 else 'No recent successful control-plane poll; local readyz alone does not prove connectivity'}

def supervise():
    validate_binding();children=[];stopping=threading.Event();auth_blocked=threading.Event()
    def halt(*_):stopping.set()
    signal.signal(signal.SIGTERM,halt);signal.signal(signal.SIGINT,halt)
    def run_child(cmd,env,logname):
        p=subprocess.Popen(cmd,cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True,text=True);children.append(p)
        def drain():
            for line in p.stdout:
                if logname=='tunnel.log' and any(code in line.lower() for code in ('invalid_api_key','permission_denied','unauthorized','"status":401','"status":403')):auth_blocked.set()
                path=STATE/logname
                if path.exists() and path.stat().st_size>1024*1024:os.replace(path,path.with_suffix('.previous.log'))
                try:line=scrub(line)
                except Fault:line='[blocked sensitive output]\n'
                with path.open('a') as f:f.write(line[:12000])
        threading.Thread(target=drain,daemon=True).start();return p
    collector=run_child([str(ENTRY),'_watch'],clean_env(),'collector.log');tunnel=None;tries=0;next_try=0
    try:
        while not stopping.wait(2):
            if collector.poll() is not None:
                if stopping.wait(15):break
                collector=run_child([str(ENTRY),'_watch'],clean_env(),'collector.log')
            cfg=read_json(STATE/'config.json',{})
            if not cfg.get('tunnel_id'):
                write_json(STATE/'tunnel-status.json',{'status':'blocked_user_action','reason':'No project tunnel and runtime key configured','checked_at':now()});continue
            if auth_blocked.is_set():
                if tunnel is not None and tunnel.poll() is None:
                    try:os.killpg(tunnel.pid,signal.SIGTERM)
                    except ProcessLookupError:pass
                write_json(STATE/'tunnel-status.json',{'status':'blocked_user_action','reason':'Authentication/Keychain permission rejected; fix authorization then stop/start. No automatic auth retry.','checked_at':now()});continue
            if tunnel is not None and tunnel.poll() is None:continue
            if tries>=6:
                write_json(STATE/'tunnel-status.json',{'status':'unavailable','reason':'Six failed reconnect attempts; inspect doctor, then stop/start','checked_at':now()});continue
            if time.monotonic()<next_try:continue
            from keychain import access
            try:key=access()
            except Fault:auth_blocked.set();continue
            if not key:
                auth_blocked.set()
                write_json(STATE/'tunnel-status.json',{'status':'blocked_user_action','reason':'Runtime key missing in project Keychain entry','checked_at':now()});continue
            env=tunnel_env(cfg);env['CONTROL_PLANE_API_KEY']=key
            tunnel=run_child([str(STATE/'bin/tunnel-client'),'--profile-dir',str(STATE/'tunnel-profile'),'run','--profile','yilu'],env,'tunnel.log');tries+=1;next_try=time.monotonic()+min(300,10*2**tries)
            write_json(STATE/'tunnel-status.json',{'status':'connecting','pid':tunnel.pid,'checked_at':now(),'attempt':tries})
    finally:
        for p in children:
            if p.poll() is None:
                try:os.killpg(p.pid,signal.SIGTERM)
                except ProcessLookupError:pass
        for p in children:
            try:p.wait(timeout=5)
            except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL)

def auth(tunnel_id):
    cfg=validate_binding()
    if not re.fullmatch(r'tunnel_[A-Za-z0-9_-]{8,100}',tunnel_id):raise Fault('forbidden','copy the tunnel_ ID from your Platform organization')
    if not sys.stdin.isatty():raise Fault('forbidden','run auth in an interactive local Terminal; never paste credentials into chat')
    key=getpass.getpass('仅用于官方隧道的运行密钥（隐藏输入，保存到本机 Keychain）：')
    if len(key)<16:raise Fault('forbidden','key too short')
    from keychain import access
    access(key);key=''
    binary=STATE/'bin/tunnel-client'
    # Official client writes profile without literal secret; environment reference only.
    cmd=[str(binary),'--profile-dir',str(STATE/'tunnel-profile'),'init','--force','--sample','sample_mcp_stdio_local','--profile','yilu','--tunnel-id',tunnel_id,'--mcp-command',shlex.join([str(ENTRY),'_serve']),'--control-plane-api-key-ref','env:CONTROL_PLANE_API_KEY','--health-listen-addr','127.0.0.1:43927']
    r=subprocess.run(cmd,capture_output=True,text=True,env=clean_env())
    if r.returncode:raise Fault('unavailable','official tunnel profile initialization failed; key remains in dedicated Keychain entry')
    cfg['tunnel_id']=tunnel_id;write_json(STATE/'config.json',cfg);return {'configured':True,'next':'yilu-bridge stop && yilu-bridge start; then enable own ChatGPT connection'}

def status():
    cfg=validate_binding();h=read_json(STATE/'health.json',{});age=None
    if h.get('heartbeat'):age=(datetime.now(timezone.utc)-datetime.fromisoformat(h['heartbeat'])).total_seconds()
    tunnel=read_json(STATE/'tunnel-status.json',{'status':'blocked_user_action'})
    if cfg.get('tunnel_id'):
        import urllib.request
        try:
            opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open('http://127.0.0.1:43927/readyz',timeout=2) as r:
                body=r.read(8192).decode()
            with opener.open('http://127.0.0.1:43927/metrics',timeout=2) as r:
                metrics=r.read(512*1024).decode()
            tunnel={**poll_health(metrics,time.time()),'readiness':scrub(body),'checked_at':now()}
        except Exception:tunnel={**tunnel,'status':'unavailable','reason':'official local readiness not reachable'}
    acceptance=read_json(STATE/'local-acceptance.json',{'status':'not_run'})
    if acceptance.get('tool_fingerprint')!=tool_fingerprint():acceptance={**acceptance,'status':'stale','reason':'reader source changed since last protocol check'}
    return {'project_id':PROJECT,'root':str(ROOT),'platform':'iOS native','build':'tools/build-ios.py','collector':{**h,'heartbeat_age_seconds':age,'live':age is not None and age<45 and process_alive(h.get('watcher_pid'))},'latest':read_json(STATE/'latest.json'),'local_mcp':acceptance,'tunnel':tunnel,'account_binding':'user must verify own Platform org + ChatGPT workspace; readiness alone is insufficient','chatgpt_actual_read':read_json(STATE/'chatgpt-acceptance.json',{'status':'blocked_user_action','images':'not_tested'})}

async def wire_check():
    from mcp import Client,StdioServerParameters
    params=StdioServerParameters(command=str(ENTRY),args=['_serve'],cwd=str(ROOT),env=clean_env())
    async with Client(params,raise_exceptions=False) as client:
        toolset=await client.list_tools();names=[t.name for t in toolset.tools]
        expected=['project_overview','list_evidence','search_project','read_source','read_changes','read_checks','read_runtime','read_media']
        assert sorted(names)==sorted(expected)
        for t in toolset.tools:assert t.annotations.read_only_hint and not t.annotations.destructive_hint and not t.annotations.open_world_hint
        result=await client.call_tool('project_overview',{});assert not result.is_error
        data=result.structured_content;sid=data['snapshot_id']
        # A real game screenshot, never a path/Markdown-only fake image response.
        from reader import Reader
        m=Reader().manifest(sid);images=[r for r in m['files'] if r['category']=='image' and r.get('blob')]
        preferred=next((r for r in images if r['relative_path']=='evidence/ai-bridge/native/native-short-scene.png'),None) or next((r for r in images if 'R2-march-180-after.png' in r['relative_path']),images[0] if images else None)
        pixels=None
        if preferred:
            im=await client.call_tool('read_media',{'snapshot_id':sid,'evidence_id':preferred['id'],'variant':'preview'})
            block=next(c for c in im.content if c.type=='image');raw=base64.b64decode(block.data)
            from PIL import Image
            import io
            loaded=Image.open(io.BytesIO(raw));loaded.verify();atomic(ROOT/'evidence/ai-bridge/stdio-game-image.png',raw)
            pixels={'evidence_id':preferred['id'],'relative_path':preferred['relative_path'],'mime':block.mime_type,'bytes':len(raw),'sha256':digest(raw),'dimensions':list(Image.open(io.BytesIO(raw)).size)}
        formal=next(r for r in m['files'] if r['relative_path']=='assets/scripts/formal/FormalGame.ts')
        calls=[('list_evidence',{'category':'runtime','limit':3}),('search_project',{'query':'BridgeDiagnostics','category':'code','limit':3}),('read_source',{'file_id':formal['id'],'start_line':1,'max_lines':12}),('read_changes',{}),('read_checks',{}),('read_runtime',{})]
        responses={}
        for name,args in calls:
            out=await client.call_tool(name,{'snapshot_id':sid,**args});assert not out.is_error,(name,out.content)
            responses[name]={'status':out.structured_content['status'],'count':len(out.structured_content['data']),'truncated':out.structured_content['truncated']}
            if name=='read_source':responses[name].update(sources=out.structured_content['sources'],sample=out.structured_content['data'])
        videos=[r for r in m['files'] if r['category']=='video' and r.get('frames')]
        video_pixels=None
        if videos:
            out=await client.call_tool('read_media',{'snapshot_id':sid,'evidence_id':videos[0]['id'],'variant':'preview','frame_indices':[0,1]});assert not out.is_error
            blocks=[c for c in out.content if c.type=='image'];assert len(blocks)==2
            for i,c in enumerate(blocks):atomic(ROOT/f'evidence/ai-bridge/stdio-video-frame-{i}.png',base64.b64decode(c.data))
            video_pixels={'evidence_id':videos[0]['id'],'frames':out.structured_content['data']['media']}
        channel=next((r for r in images if r['relative_path']=='evidence/ai-bridge/channel-check.png'),None)
        if channel:
            out=await client.call_tool('read_media',{'snapshot_id':sid,'evidence_id':channel['id'],'variant':'preview'});assert not out.is_error and any(c.type=='image' for c in out.content)
        denied=await client.call_tool('read_source',{'snapshot_id':sid,'file_id':'../../.env'});assert denied.is_error
        value={'status':'passed','produced_at':now(),'tool_fingerprint':tool_fingerprint(),'transport':'official Python SDK v2 stdio client','snapshot_id':sid,'tools':names,'responses':responses,'real_game_pixels':pixels,'video_pixels':video_pixels,'channel_test_image_id':channel['id'] if channel else None,'chatgpt_actual_read':'not_claimed'}
        write_json(STATE/'local-acceptance.json',value);write_json(ROOT/'evidence/ai-bridge/stdio-acceptance.json',value);return value

def capture_check(name,argv,timeout):
    validate_binding()
    if not argv:raise Fault('forbidden','explicit argv after -- required')
    if argv[0]=='--':argv=argv[1:]
    if not argv:raise Fault('forbidden','empty command')
    before,rows=game_fingerprint();tool_before=tool_fingerprint();started=now();rid='check_'+secrets.token_hex(8);path=STATE/'checks'/f'{rid}.json'
    log=STATE/(rid+'.log');expired=False
    with log.open('wb') as f:
        p=subprocess.Popen(argv,cwd=ROOT,env=clean_env(),stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
        start_time=time.monotonic()
        while p.poll() is None:
            if time.monotonic()-start_time>timeout or log.stat().st_size>16*1024*1024:
                expired=True;os.killpg(p.pid,signal.SIGTERM)
                try:p.wait(5)
                except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
                break
            time.sleep(.2)
    after,_=game_fingerprint();raw=log.read_bytes()
    try:output=scrub(raw.decode('utf-8','replace'))
    except Fault:output='[sensitive output blocked]'
    log.unlink() # Created by this command, sanitized evidence kept in JSON.
    rec={'id':rid,'name':name,'command':[scrub(v) for v in argv],'started_at':started,'produced_at':now(),'exit_code':p.returncode,'timed_out_or_output_limit':expired,'code_fingerprint':before,'end_code_fingerprint':after,'source_stable':before==after,'target':'local Mac / requested command','output':output,'status':'passed' if p.returncode==0 and before==after and not expired else 'failed' if p.returncode else 'stale'}
    rec.update(tool_fingerprint=tool_before,end_tool_fingerprint=tool_fingerprint())
    if rec['tool_fingerprint']!=rec['end_tool_fingerprint']:rec['status']='stale'
    write_json(path,rec);return {k:v for k,v in rec.items() if k!='output'}

def import_runtime(simulator=None,path=None,device=None):
    validate_binding()
    if device:
        if not re.fullmatch('[A-Fa-f0-9-]{20,40}',device):raise Fault('forbidden','invalid explicitly selected device UDID')
        dest=STATE/'device-export.jsonl'
        r=subprocess.run(['xcrun','devicectl','device','copy','from','--device',device,'--domain-type','appDataContainer','--domain-identifier','com.yvainair.yiluchangge','--source','Documents/yilu-bridge-events.jsonl','--destination',str(dest)],capture_output=True,text=True,timeout=30)
        if r.returncode:raise Fault('unavailable','selected iPhone export failed; unlock/connect device with an installed Debug build')
        path=dest
    elif simulator:
        if not re.fullmatch('[A-Fa-f0-9-]{36}',simulator):raise Fault('forbidden','invalid simulator UDID')
        r=subprocess.run(['xcrun','simctl','get_app_container',simulator,'com.yvainair.yiluchangge','data'],capture_output=True,text=True,timeout=15)
        if r.returncode:raise Fault('unavailable','confirmed game simulator container unavailable')
        path=Path(r.stdout.strip())/'Documents/yilu-bridge-events.jsonl'
    else:path=Path(path).absolute()
    raw=secure_bytes(path.parent,path.name,5*1024*1024);raw=raw[:raw.rfind(b'\n')+1];events=[]
    for line in raw.splitlines():
        try:
            e=json.loads(scrub(line.decode()));keys={'event','run_id','produced_at','build','screen','chapter','platform','device_class','build_type','viewport','safe_area','counts','interval','scope','message','frame_metrics','missing'}
            events.append({k:v for k,v in e.items() if k in keys})
        except (ValueError,Fault):continue
    if not events:raise Fault('empty','no complete diagnostic events')
    fp=events[0].get('build',{}).get('code_fingerprint');rid='runtime_'+digest(encoded([events[0].get('run_id'),events[0].get('build',{}).get('build_id')]))[:24]
    rec={'id':rid,'produced_at':events[-1].get('produced_at'),'code_fingerprint':fp,'events':events,'import_source':'explicit selected iPhone game container export' if device else 'confirmed game simulator container' if simulator else 'explicit user selected file'}
    write_json(STATE/'runtime'/f'{rid}.json',rec);return {'id':rid,'events':len(events),'code_fingerprint':fp}

def export_review(snapshot_id,dest):
    from reader import Reader
    reader=Reader();m=reader.manifest(snapshot_id,True);out=Path(dest).absolute()
    if out.exists():raise Fault('forbidden','review output already exists; choose a new filename')
    total=0;included=[];skipped=[]
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('snapshot.json',encoded(m));total+=len(encoded(m))
        def priority(r):
            rel=r['relative_path']
            return (0 if rel.startswith(('docs/ai-bridge/','evidence/ai-bridge/','local/')) else 1 if rel.startswith('assets/scripts/formal/') else 2,rel)
        for r in sorted(m['files'],key=priority):
            if not r.get('blob'):continue
            # Bounded fallback: current bridge docs/checks plus formal code and recent game images.
            rel=r['relative_path']
            if not (rel.startswith(('docs/ai-bridge/','local/','assets/scripts/formal/')) or 'IOS-POLISH-ROUND2' in rel or 'evidence/ai-bridge/' in rel):continue
            b=blob(STATE,r['blob'])
            if r['category']=='image':
                from media import clean_image
                b,_=clean_image(b)
            if total+len(b)>64*1024*1024:skipped.append(r['id']);continue
            z.writestr('objects/'+r['id']+('.png' if r['category']=='image' else '.txt'),b);total+=len(b);included.append(r['id'])
        z.writestr('EXPORT.json',encoded({'snapshot_id':m['snapshot_id'],'included':included,'omitted_by_size':skipped,'limit_bytes':64*1024*1024,'scope':'selected formal source and latest evidence; manual fallback, not MCP/ChatGPT acceptance'}))
    return {'path':str(out),'bytes_uncompressed':total,'objects':len(included),'omitted':len(skipped)}

def main():
    p=argparse.ArgumentParser(description='一路长歌：本地只读 MCP 运维（不调用模型 API）');sub=p.add_subparsers(dest='cmd',required=True)
    for name in ('start','stop','status','doctor','refresh','_watch','_serve','_supervise'):sub.add_parser(name)
    q=sub.add_parser('install');q.add_argument('--rebind',action='store_true')
    q=sub.add_parser('auth');q.add_argument('--tunnel-id',required=True)
    for name in ('pin','unpin'):q=sub.add_parser(name);q.add_argument('snapshot_id')
    q=sub.add_parser('import-media');q.add_argument('path');q.add_argument('--game-only',action='store_true');q.add_argument('--capture-type',choices=['unknown','approved_reference','reference_video','natural_play','fixture','simulator','physical_device'],default='unknown');q.add_argument('--speed',choices=['unknown','original','accelerated'],default='unknown');q.add_argument('--code-fingerprint')
    q=sub.add_parser('export-frames');q.add_argument('evidence_id');q.add_argument('--start',type=float,required=True);q.add_argument('--end',type=float,required=True);q.add_argument('--count',type=int,default=12)
    q=sub.add_parser('capture-check');q.add_argument('--name',required=True);q.add_argument('--timeout',type=int,default=300);q.add_argument('argv',nargs=argparse.REMAINDER)
    q=sub.add_parser('import-runtime');g=q.add_mutually_exclusive_group(required=True);g.add_argument('--simulator');g.add_argument('--device');g.add_argument('--path')
    q=sub.add_parser('finalize');q.add_argument('--task',required=True);q.add_argument('--result',required=True,help='Project relative existing result markdown')
    q=sub.add_parser('export-review');q.add_argument('--snapshot-id');q.add_argument('--out',required=True)
    q=sub.add_parser('uninstall');q.add_argument('--clear-cache',action='store_true');q.add_argument('--remove-key',action='store_true')
    a=p.parse_args();cmd=a.cmd
    if cmd=='install':result=install(a.rebind)
    elif cmd=='start':result=start()
    elif cmd=='stop':result=stop()
    elif cmd=='status':result=status()
    elif cmd=='auth':result=auth(a.tunnel_id)
    elif cmd=='doctor':result={'local_mcp':asyncio.run(wire_check()),'status':status()}
    elif cmd in ('refresh','_watch'):
        from collector import collect,watch
        result=watch() if cmd=='_watch' else {k:v for k,v in collect().items() if k not in ('files','code_files','evidence_files','changes')}
    elif cmd=='_serve':
        # Replace process with isolated env before importing MCP (key isn't retained in inherited os.environ).
        os.execve(str(ROOT/'tools/project-reader/.venv/bin/python'),[str(ROOT/'tools/project-reader/.venv/bin/python'),str(ROOT/'tools/project-reader/server.py')],clean_env())
    elif cmd=='_supervise':return supervise()
    elif cmd in ('pin','unpin'):
        from reader import Reader
        Reader().manifest(a.snapshot_id);pins=set(read_json(STATE/'pins.json',[]));pins.add(a.snapshot_id) if cmd=='pin' else pins.discard(a.snapshot_id);write_json(STATE/'pins.json',sorted(pins));result={'pins':sorted(pins)}
    elif cmd=='import-media':
        from media import import_media
        r=import_media(a.path,a.capture_type,a.speed,a.code_fingerprint,game_only=a.game_only);result={k:v for k,v in r.items() if k not in ('blob','frames')}
    elif cmd=='export-frames':
        from media import export_frames
        r=export_frames(a.evidence_id,a.start,a.end,a.count);result={'id':r['id'],'frames':len(r['frames'])}
    elif cmd=='capture-check':result=capture_check(a.name,a.argv,a.timeout)
    elif cmd=='import-runtime':result=import_runtime(a.simulator,a.path,a.device)
    elif cmd=='finalize':
        validate_binding();rel=relative(a.result)
        if not allowed(rel):raise Fault('forbidden','result outside allowed project documents')
        raw=scrub(secure_bytes(ROOT,rel).decode());fp,_=game_fingerprint();stamp=now();rec={'task':a.task,'produced_at':stamp,'code_fingerprint':fp,'result_path':rel,'result_sha256':digest(raw.encode()),'meaning':'records facts in existing result; no tests executed'}
        write_json(STATE/'finalizations'/('final_'+secrets.token_hex(8)+'.json'),rec)
        from collector import collect
        m=collect();result={'finalized':rec,'snapshot_id':m['snapshot_id']}
    elif cmd=='export-review':result=export_review(a.snapshot_id,a.out)
    elif cmd=='uninstall':
        stop()
        if PLIST.exists():PLIST.unlink()
        if a.remove_key:
            from keychain import access
            access(delete=True)
        if a.clear_cache:
            validate_binding();import shutil
            for name in ('objects','snapshots','scan-cache.json','imports.json','media-sources.json','latest.json','pins.json','local-acceptance.json'):
                target=STATE/name
                if target.is_symlink():raise Fault('forbidden','unexpected symlink in private cache')
                if target.is_dir():shutil.rmtree(target)
                elif target.exists():target.unlink()
        result={'uninstalled':True,'game_files_removed':False,'account_revocation':'Remove own ChatGPT connection and revoke project tunnel/runtime key in Platform'}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if cmd=='capture-check' and result['status']!='passed':sys.exit(1)

if __name__=='__main__':
    try:main()
    except Fault as e:print(json.dumps({'status':e.status,'reason':e.reason},ensure_ascii=False),file=sys.stderr);sys.exit(2)
