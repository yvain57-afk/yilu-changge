"""Only local collector runs Git. Published objects are sanitized immutable copies."""
from __future__ import annotations
import os, time, json, subprocess, uuid, shutil, fcntl
from pathlib import Path
from collections import Counter
from common import *

def git(root,*args):
    env={'PATH':os.environ.get('PATH','/usr/bin:/bin'),'HOME':str(root), 'GIT_CONFIG_NOSYSTEM':'1','GIT_CONFIG_GLOBAL':'/dev/null','GIT_OPTIONAL_LOCKS':'0','GIT_TERMINAL_PROMPT':'0','LC_ALL':'C.UTF-8'}
    cmd=['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-c','core.quotePath=false','-c','diff.external=','-c','core.pager=cat','-C',str(root),*args]
    r=subprocess.run(cmd,capture_output=True,timeout=20,env=env)
    if r.returncode: raise Fault('unavailable','read-only Git probe failed')
    if len(r.stdout)>16*1024*1024: raise Fault('too_large','Git metadata exceeds 16 MiB')
    return scrub(r.stdout.decode('utf-8','replace'))

def git_state(root):
    return {'branch':git(root,'branch','--show-current').strip(),'head':git(root,'rev-parse','HEAD').strip(),'status':git(root,'status','--porcelain=v1','-uall')}

def category(rel):
    ext=Path(rel).suffix.lower()
    if ext in IMAGE_EXT:return 'image'
    if ext in VIDEO_EXT:return 'video'
    if 'feedback' in rel.lower():return 'feedback'
    if rel.startswith('evidence/') and ext in {'.jsonl','.json'} and any(x in rel.lower() for x in ('runtime','diagnostic','natural/results')):return 'runtime'
    if rel.startswith(('evidence/','deliverables/')) and ext not in IMAGE_EXT|VIDEO_EXT:return 'checks'
    if rel.startswith(('docs/','art-source/')) or rel in {'AGENTS.md','AI_HANDOFF.md','README.md','PROGRESS.md','BLOCKED.md'}:return 'requirements'
    return 'code'

def provenance(rel,raw=None):
    meta={'produced_at':None,'version':{'status':'unknown','code_fingerprint':None,'basis':None},'capture_type':'unknown','source_role':'developer_statement' if category(rel)=='requirements' else 'source_data'}
    if 'baseline-20260927-approved' in rel:meta.update(capture_type='approved_reference',source_role='user_approved_reference')
    if raw and Path(rel).suffix in {'.json','.jsonl'}:
        try:
            d=json.loads(raw) if not rel.endswith('.jsonl') else json.loads(raw.splitlines()[0])
            if isinstance(d,dict):
                meta['produced_at']=d.get('produced_at') or d.get('started_at')
                stamp=d.get('build') or d
                fp=stamp.get('code_fingerprint') if isinstance(stamp,dict) else None
                if fp and len(fp)==64:meta['version']={'status':'linked','code_fingerprint':fp,'basis':'embedded_record'}
                if d.get('capture_type'):meta['capture_type']=d['capture_type']
        except (ValueError,IndexError,TypeError):pass
    return meta

def stat_sig(root,rel):
    s=(root/rel).lstat()
    if not stat.S_ISREG(s.st_mode):raise Fault('forbidden','nonregular source')
    return [s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns]

def collect(root=ROOT,state=STATE,changed=None):
    cfg=validate_binding(state,root)
    state.mkdir(parents=True,exist_ok=True)
    with (state/'collector.lock').open('a') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:raise Fault('updating','collector already active')
        gc(state,cfg,prune=True)
        for attempt in range(3):
            try:return _collect(root,state,cfg,changed)
            except Fault as e:
                write_json(state/'health.json',{'status':e.status,'reason':e.reason,'heartbeat':now(),'latest':read_json(state/'latest.json')})
                if e.status!='updating' or attempt==2:raise
                time.sleep(.4)

def _collect(root,state,cfg,changed):
    start=now();before=git_state(root);cache=read_json(state/'scan-cache.json',{})
    # Watcher supplies exact affected paths. Manual refresh deliberately re-enumerates to recover missed events.
    paths=set(files(root)) if changed is None or not cache else set(cache)|{p for p in changed if allowed(p)}
    paths={p for p in paths if (root/p).exists()}
    records=[];newcache={};excluded=Counter();code=[];evidence=[];signatures={}
    for rel in sorted(paths):
        try:
            sig=stat_sig(root,rel);signatures[rel]=sig
            old=cache.get(rel)
            if old and old['sig']==sig and (not old['record'].get('blob') or (state/'objects'/old['record']['blob']).exists()):
                rec=old['record']; rawhash=rec['source_sha256']
            else:
                ext=Path(rel).suffix.lower();cat=category(rel)
                rec={'id':'f_'+digest(rel.encode())[:24],'relative_path':rel,'category':cat,'size':sig[2],'observed_at':now(),**provenance(rel)}
                if ext in VIDEO_EXT:
                    # Hash streaming videos without copying them into each snapshot.
                    rawhash=stream_hash(root,rel,sig);rec.update(readable=False,reason='import-media creates bounded video frames')
                else:
                    raw=secure_bytes(root,rel,256*1024*1024 if code_path(rel) else 32*1024*1024);rawhash=digest(raw)
                    if ext in TEXT_EXT:
                        if len(raw)>8*1024*1024:raise Fault('too_large','text input above 8 MiB')
                        if ext=='.jsonl':raw=raw[:raw.rfind(b'\n')+1]
                        clean=scrub(raw.decode('utf-8')).encode();rec.update(blob=put_blob(state,clean),lines=len(clean.splitlines()),readable=True,**provenance(rel,clean.decode()))
                    elif ext in IMAGE_EXT:
                        from media import clean_image
                        edge=1600 if 'IOS-POLISH-ROUND2' in rel or rel.startswith('evidence/ai-bridge/') or 'baseline-20260927-approved' in rel else 960
                        clean,meta=clean_image(raw,long_edge=edge);original=meta['source_dimensions']==[meta['width'],meta['height']]
                        rec.update(blob=put_blob(state,clean),readable=True,original_available=original,preview_long_edge_limit=edge,**meta)
                        side=Path(rel).with_suffix('.json').as_posix()
                        if (root/side).is_file() and allowed(side):
                            try:
                                side_raw=secure_bytes(root,side,2*1024*1024).decode();side_meta=json.loads(side_raw)
                                if side_meta.get('_bridge_media') is True:
                                    rec.update(**provenance(side,side_raw));rec['version']['basis']='capture sidecar with embedded runtime build';rec['run_id']=side_meta.get('run_id');rec['capture_manifest']=side
                            except (Fault,ValueError):pass
                    else:rec.update(readable=False,reason='build asset fingerprint only')
                rec['source_sha256']=rawhash
            newcache[rel]={'sig':sig,'record':rec};records.append(rec)
            (code if code_path(rel) else evidence).append((rel,rawhash))
        except (Fault,UnicodeDecodeError,OSError) as e:
            if isinstance(e,Fault) and e.status in ('updating','storage_limit'):raise
            excluded[e.reason if isinstance(e,Fault) else 'unreadable text or file']+=1
    # Include only explicit local imports; never walk Downloads/photos.
    for rec in read_json(state/'imports.json',[]):
        records.append(rec);evidence.append((rec['id'],rec['source_sha256']))
    # The repository path and explicit import may name identical video bytes.
    # Join by full content hash, never filename, and leave the scan cache untouched.
    imported_videos={r['source_sha256']:r for r in records if r['category']=='video' and r.get('frames')}
    for i,rec in enumerate(records):
        imported=imported_videos.get(rec.get('source_sha256')) if rec['category']=='video' else None
        if imported and not rec.get('frames'):
            records[i]={**rec,**{k:imported[k] for k in ('frames','duration_seconds','capture_type','speed','version') if k in imported},
                        'readable':True,'reason':'precomputed frames matched by full source SHA-256','frames_from':imported['id']}
    finalizations=[]
    for kind in ('checks','runtime','finalizations'):
        for p in sorted((state/kind).glob('*.json')) if (state/kind).exists() else []:
            raw=scrub(secure_bytes(state,p.relative_to(state).as_posix(),8*1024*1024).decode()).encode();rel='local/'+kind+'/'+p.name
            records.append({'id':'f_'+digest(rel.encode())[:24],'relative_path':rel,'category':'runtime' if kind=='runtime' else 'checks','blob':put_blob(state,raw),'source_sha256':digest(raw),'readable':True,'lines':len(raw.splitlines()),'observed_at':now(),**provenance(rel,raw.decode())});evidence.append((rel,digest(raw)))
            if kind=='finalizations':
                try:finalizations.append(json.loads(raw))
                except ValueError:pass
    # Bind the exact sanitized report bytes recorded by explicit local finalize.
    # Never infer a version from a filename, current HEAD, or unchanged report text.
    # Replace records rather than mutating the scan cache, so later edits unbind.
    for receipt in sorted((x for x in finalizations if isinstance(x,dict)),key=lambda x:str(x.get('produced_at',''))):
        fp=receipt.get('code_fingerprint');report_hash=receipt.get('result_sha256')
        if not isinstance(fp,str) or len(fp)!=64 or not isinstance(report_hash,str) or len(report_hash)!=64:continue
        for i,rec in enumerate(records):
            if rec['relative_path']==receipt.get('result_path') and rec.get('blob')==report_hash:
                records[i]={**rec,'produced_at':receipt.get('produced_at'),'version':{'status':'linked','code_fingerprint':fp,'basis':'explicit local finalize receipt matched sanitized report SHA-256; no tests rerun'}}
    write_json(state/'scan-cache.json',newcache) # Private cache is reusable even when consistency requires a retry.
    after=git_state(root)
    if before!=after or any(stat_sig(root,p)!=sig for p,sig in signatures.items()):raise Fault('updating','worktree changed during collection')
    if changed is None and set(files(root))!=paths:raise Fault('updating','file set changed during collection')
    codefp=fingerprint(code);evfp=fingerprint(evidence)
    for rec in records:
        if code_path(rec['relative_path']):
            rec['version']={'status':'linked','code_fingerprint':codefp,'basis':'captured worktree source/asset, not a runtime capture'}
            if rec['category']=='image':rec['capture_type']='source_asset'
    # File-limited patches avoid exporting diffs from denied tracked files.
    diffs=[]
    for flag,name in [([], 'unstaged'),(['--cached'],'staged')]:
        names=git(root,'diff',*flag,'--name-only','--no-ext-diff','--no-textconv').splitlines()
        names=[p for p in names if allowed(p) and Path(p).suffix in TEXT_EXT]
        for offset in range(0,len(names),50):
            patch=git(root,'diff',*flag,'--no-ext-diff','--no-textconv','--no-color','--',*names[offset:offset+50]);diffs.append({'kind':name,'blob':put_blob(state,patch.encode())})
    if after!=git_state(root):raise Fault('updating','Git changed during patch collection')
    for p,sig in signatures.items():
        if stat_sig(root,p)!=sig:raise Fault('updating','source changed during patch collection')
    sid='s_'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')+'_'+uuid.uuid4().hex[:8]
    manifest={'schema_version':SCHEMA,'project_id':PROJECT,'snapshot_id':sid,'started_at':start,'observed_at':now(),'index_version':1,'status':'ok','git':{'branch':after['branch'],'head':after['head'],'dirty':bool(after['status']),'status_blob':put_blob(state,after['status'].encode()),'recent_commits_blob':put_blob(state,git(root,'log','-8','--format=%h %aI %s','--no-decorate').encode())},'code_fingerprint':codefp,'evidence_fingerprint':evfp,'code_files':code,'evidence_files':evidence,'files':records,'changes':diffs,'exclusions':dict(excluded),'completeness':{'source':'bounded allowlist','video':'metadata only until explicit import','unknown_versions':sum(r['version']['status']=='unknown' for r in records),'consistency':'bounded stable file and Git checks, not an OS atomic snapshot'},'platform':'iOS native / Cocos 3.8.8','build_entry':'tools/build-ios.py'}
    manifest['tool_fingerprint']=tool_fingerprint(root)
    if after!=git_state(root) or any(stat_sig(root,p)!=sig for p,sig in signatures.items()):raise Fault('updating','source or Git changed before publication')
    gc(state,cfg,extra=len(encoded(manifest)),pending=manifest)
    target=state/'snapshots'/sid;tmp=state/'snapshots'/('.pending-'+sid);tmp.mkdir(parents=True)
    write_json(tmp/'manifest.json',manifest);os.rename(tmp,target)
    write_json(state/'latest.json',{'snapshot_id':sid});write_json(state/'scan-cache.json',newcache)
    write_json(state/'health.json',{'status':'ok','heartbeat':now(),'last_success':manifest['observed_at'],'latest':sid})
    return manifest

def stream_hash(root,rel,sig):
    # Video input remains project-local and bounded to 4 GiB; secure no-follow fd path.
    if sig[2]>4*1024**3:raise Fault('too_large','video exceeds 4 GiB')
    parts=relative(rel).split('/');fd=os.open(root,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
    try:
        for p in parts[:-1]:n=os.open(p,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=n
        n=os.open(parts[-1],os.O_RDONLY|os.O_NOFOLLOW,dir_fd=fd)
        with os.fdopen(n,'rb') as f:
            h=hashlib.sha256()
            for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
        if stat_sig(root,rel)!=sig:raise Fault('updating','video changed')
        return h.hexdigest()
    finally:os.close(fd)

def object_refs(records):
    return {r['blob'] for r in records if r.get('blob')}|{f['blob'] for r in records for f in r.get('frames',[])}

def gc(state,cfg,extra=0,pending=None,prune=False):
    entries=[]
    for p in (state/'snapshots').glob('s_*'):
        m=read_json(p/'manifest.json');entries.append((m['observed_at'],p,m))
    entries.sort(reverse=True,key=lambda t:t[0]);pins=set(read_json(state/'pins.json',[]));protected=[]
    for i,(date,p,m) in enumerate(entries):
        age=(datetime.now(timezone.utc)-datetime.fromisoformat(date)).total_seconds()
        if i<20 or age<86400 or p.name in pins:protected.append(m)
        else:shutil.rmtree(p) # Only this registered tool's generated snapshot directory.
    if pending:protected.append(pending)
    live=object_refs([r for m in protected for r in m['files']])
    live|={r['blob'] for m in protected for r in m['changes']}
    live|={m['git'][k] for m in protected for k in ('status_blob','recent_commits_blob')}
    live|=object_refs(read_json(state/'imports.json',[]))
    live|=object_refs([v['record'] for v in read_json(state/'scan-cache.json',{}).values()])
    # Fresh objects may belong to the in-progress transaction: retain for this collection.
    total=sum(p.stat().st_size for p in state.rglob('*') if p.is_file() and not p.is_symlink())
    if prune or total+extra>cfg.get('quota_bytes',2*1024**3):
        for p in (state/'objects').glob('*'):
            if p.name not in live and time.time()-p.stat().st_mtime>120:p.chmod(0o600);p.unlink()
        total=sum(p.stat().st_size for p in state.rglob('*') if p.is_file() and not p.is_symlink())
        if total+extra>cfg.get('quota_bytes',2*1024**3):raise Fault('storage_limit','2 GiB budget reached; no safe retained snapshot eviction')

def watch(root=ROOT,state=STATE):
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    import threading
    validate_binding(state,root);pending=set();guard=threading.Lock();first=[0.];last=[0.]
    class Handler(FileSystemEventHandler):
        def on_any_event(self,event):
            if event.event_type not in ('created','modified','deleted','moved'):return
            for raw in [event.src_path,getattr(event,'dest_path','')]:
                if not raw:continue
                try:
                    local=Path(raw).relative_to(state).as_posix()
                    if local=='imports.json' or local.startswith(('checks/','runtime/','finalizations/')):
                        with guard:pending.add('@local');first[0]=first[0] or time.monotonic();last[0]=time.monotonic()
                    continue
                except ValueError:pass
                try:rel=Path(raw).relative_to(root).as_posix()
                except ValueError:continue
                if event.is_directory or rel.startswith('.git/'):
                    if rel.startswith(('.git/index','.git/HEAD','.git/refs')):
                        with guard:pending.add('@git');first[0]=first[0] or time.monotonic();last[0]=time.monotonic()
                    elif event.is_directory and any(rel==p.rstrip('/') or rel.startswith(p) for p in PREFIXES) and not any(part.startswith('.') for part in rel.split('/')):
                        with guard:pending.add('@tree');first[0]=first[0] or time.monotonic();last[0]=time.monotonic()
                    continue
                if not allowed(rel):continue
                with guard:pending.add(rel);first[0]=first[0] or time.monotonic();last[0]=time.monotonic()
    observer=Observer();observer.schedule(Handler(),str(root),recursive=True);observer.schedule(Handler(),str(state),recursive=True);observer.start()
    try:
        collect(root,state)
        while True:
            time.sleep(1)
            with guard:
                age=time.monotonic()-first[0];quiet=time.monotonic()-last[0]
                log_only=bool(pending) and all(p.endswith('.jsonl') for p in pending)
                ready=bool(pending) and (quiet>=(15 if log_only else 5) or age>=30)
                changes=set(pending) if ready else None
                if ready:pending.clear();first[0]=0
            if changes:
                try:collect(root,state,None if changes & {'@git','@tree'} else changes)
                except Fault:pass
            h=read_json(state/'health.json',{});h.update(heartbeat=now(),watcher_pid=os.getpid(),pending=bool(pending));write_json(state/'health.json',h)
    finally:observer.stop();observer.join()
