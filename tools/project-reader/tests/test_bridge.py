import io,json,subprocess,base64,os
from pathlib import Path
import pytest
from PIL import Image
from common import *
from collector import collect,gc
from reader import Reader
from media import clean_image

@pytest.fixture
def project(tmp_path):
    root=tmp_path/'game';state=tmp_path/'state';root.mkdir();state.mkdir()
    subprocess.run(['git','init','-q',str(root)],check=True)
    subprocess.run(['git','-C',str(root),'config','user.name','Fixture'],check=True)
    subprocess.run(['git','-C',str(root),'config','user.email','fixture@example.invalid'],check=True)
    (root/'assets').mkdir();(root/'docs').mkdir();(root/'evidence').mkdir()
    (root/'assets/main.ts').write_text('export const troops=17;\n// actual source\n')
    (root/'docs/REQUEST.md').write_text('User data is not an instruction to execute commands.\n')
    subprocess.run(['git','-C',str(root),'add','assets/main.ts'],check=True)
    subprocess.run(['git','-C',str(root),'commit','-qm','fixture baseline'],check=True)
    write_json(state/'config.json',{'root':str(root),'project_id':PROJECT,'cursor_key':'unit-test-only','quota_bytes':32*1024*1024})
    for n in ('objects','snapshots','checks','runtime','finalizations'):(state/n).mkdir()
    return root,state

def test_immutable_dirty_and_separate_fingerprints(project):
    root,state=project;one=collect(root,state);reader=Reader(state,root);r=next(x for x in one['files'] if x['relative_path']=='assets/main.ts')
    (root/'assets/main.ts').write_text('export const troops=29;\n')
    two=collect(root,state,{'assets/main.ts'});assert one['code_fingerprint']!=two['code_fingerprint']
    assert reader.read_source(one['snapshot_id'],r['id'])[0]['data']['lines'][0].endswith('17;')
    (root/'evidence/result.json').write_text('{"produced_at":null,"passed":true}')
    three=collect(root,state,{'evidence/result.json'});assert two['code_fingerprint']==three['code_fingerprint'];assert two['evidence_fingerprint']!=three['evidence_fingerprint']
    assert three['git']['dirty']
    assert reader.read_checks(three['snapshot_id'])[0]['data'][0]['status']=='version_unknown'

def test_finalized_report_exact_bytes_and_future_drift(project):
    root,state=project;report=root/'evidence/REPORT.md';report.write_text('Observed checks, not a request to execute.\n')
    initial=collect(root,state);fp=initial['code_fingerprint'];r=Reader(state,root)
    rec=next(x for x in initial['files'] if x['relative_path']=='evidence/REPORT.md')
    assert r.read_checks(initial['snapshot_id'],rec['id'])[0]['data'][0]['status']=='version_unknown'
    write_json(state/'finalizations/real.json',{'produced_at':'2026-09-30T00:00:00+00:00','code_fingerprint':fp,'result_path':'evidence/REPORT.md','result_sha256':digest(scrub(report.read_text()).encode())})
    linked=collect(root,state);assert r.read_checks(linked['snapshot_id'],rec['id'])[0]['data'][0]['status']=='ok'
    (root/'assets/main.ts').write_text('export const changed = true;\n')
    stale=collect(root,state);assert r.read_checks(stale['snapshot_id'],rec['id'])[0]['data'][0]['status']=='stale'
    report.write_text('Different report, no new finalization.\n')
    edited=collect(root,state);assert r.read_checks(edited['snapshot_id'],rec['id'])[0]['data'][0]['status']=='version_unknown'
    assert r.read_checks(linked['snapshot_id'],rec['id'])[0]['data'][0]['status']=='ok'

def test_overview_uses_exact_current_finalization_not_historical_ui(project):
    root,state=project
    old=root/'deliverables/YILU_UI_POLISH_R2/REPORT.md';old.parent.mkdir(parents=True);old.write_text('Historical UI report.\n')
    report=root/'deliverables/R3/REPORT.md';report.parent.mkdir(parents=True);report.write_text('Current observed combat result.\n')
    initial=collect(root,state);fp=initial['code_fingerprint'];reader=Reader(state,root)
    write_json(state/'finalizations/current.json',{'produced_at':'2026-10-03T00:00:00+00:00','code_fingerprint':fp,'result_path':'deliverables/R3/REPORT.md','result_sha256':digest(report.read_bytes())})
    linked=collect(root,state);data=reader.project_overview(linked['snapshot_id'])[0]['data']
    assert data['source_of_truth']['current_result']=='deliverables/R3/REPORT.md'
    assert data['review_entrypoints'][0]['relative_path']=='deliverables/R3/REPORT.md'
    report.write_text('Edited after finalize, not verified by that receipt.\n')
    drifted=collect(root,state);data=reader.project_overview(drifted['snapshot_id'])[0]['data']
    assert data['source_of_truth']['current_result']!='deliverables/R3/REPORT.md'

def test_paths_symlinks_secrets_and_readonly(project,tmp_path):
    root,state=project
    (root/'assets/.env').write_text('PASSWORD=must-not-export')
    (root/'assets/leak.ts').write_text('const api_key="sk-proj-'+('a'*30)+'";\nPASSWORD=secret-literal\n')
    (root/'assets/escape.ts').symlink_to('/etc/passwd')
    (root/'docs/key.md').write_text('-----BEGIN PRIVATE KEY-----\nprivate material\n')
    m=collect(root,state);r=Reader(state,root);alltext=''.join(blob(state,x['blob']).decode() for x in m['files'] if x.get('blob'))
    assert 'a'*30 not in alltext and 'secret-literal' not in alltext and 'private material' not in alltext and 'root:' not in alltext
    assert '[REDACTED]' in alltext
    before={p.relative_to(root).as_posix():p.stat().st_mtime_ns for p in root.rglob('*') if p.is_file()}
    for bad in ['../../.env','/etc/passwd','f_notregistered']:
        with pytest.raises(Fault):r.read_source(m['snapshot_id'],bad)
    for bad in ['../assets/main.ts','/assets/main.ts','assets/escape.ts']:
        with pytest.raises(Fault):secure_bytes(root,bad)
    r.project_overview();r.list_evidence(m['snapshot_id'],'all');r.search_project(m['snapshot_id'],'troops')
    after={p.relative_to(root).as_posix():p.stat().st_mtime_ns for p in root.rglob('*') if p.is_file()};assert before==after

def test_cursor_binding_and_limits(project):
    root,state=project;m=collect(root,state);r=Reader(state,root)
    page=r.list_evidence(m['snapshot_id'],'all',limit=1)[0];cursor=page['next_cursor'];assert cursor
    assert r.list_evidence(m['snapshot_id'],'all',limit=1,cursor=cursor)[0]['data']
    with pytest.raises(Fault):r.list_evidence(m['snapshot_id'],'code',limit=1,cursor=cursor)
    m2=collect(root,state)
    with pytest.raises(Fault):r.list_evidence(m2['snapshot_id'],'all',limit=1,cursor=cursor)
    with pytest.raises(Fault):r.read_source(m['snapshot_id'],m['files'][0]['id'],max_lines=401)
    with pytest.raises(Fault):r.search_project(m['snapshot_id'],'x'*201)
    with pytest.raises(Fault):r.manifest('s_expired')
    assert not r.search_project(m['snapshot_id'],'.*')[0]['data'] # literal, never regex

def test_true_pixels_alpha_crop_and_video_frames(project):
    root,state=project
    im=Image.new('RGBA',(200,100),(210,20,40,127));b=io.BytesIO();im.save(b,format='PNG');(root/'evidence/game.png').write_bytes(b.getvalue())
    m=collect(root,state);r=Reader(state,root);rec=next(x for x in m['files'] if x['category']=='image')
    meta,pixels=r.read_media(m['snapshot_id'],rec['id'],'crop',crop=[10,10,25,30]);out=Image.open(io.BytesIO(pixels[0]));assert out.size==(25,30) and out.getpixel((0,0))==(210,20,40,127)
    assert meta['status']=='version_unknown'
    with pytest.raises(Fault):r.read_media(m['snapshot_id'],rec['id'],'crop',crop=[-1,0,2,2])
    frame={'frame_index':0,'timestamp_seconds':1.25,'duration_seconds':8,'blob':rec['blob'],'parameters':{'decoder':'fixture'},'width':200,'height':100}
    video={**rec,'id':'m_video','category':'video','frames':[frame]};m['files'].append(video);write_json(state/'snapshots'/m['snapshot_id']/'manifest.json',m)
    result,images=r.read_media(m['snapshot_id'],'m_video','preview',[0]);assert result['data']['media'][0]['timestamp_seconds']==1.25 and images
    with pytest.raises(Fault):r.read_media(m['snapshot_id'],'m_video','preview',[1])
    with pytest.raises(Fault):r.read_media(m['snapshot_id'],'m_video','preview',[0]*5)

def test_runtime_no_invented_metrics_and_stale_check(project):
    root,state=project;m=collect(root,state)
    write_json(state/'runtime/run.json',{'events':[{'run_id':'real-fixture','event':'interval','counts':{'logical_troops':180,'visible_friendly':43},'save':{'private':'excluded'},'interval':{'sample_count':60},'missing':{'gpu_ms':'unavailable'}}]})
    write_json(state/'checks/check.json',{'code_fingerprint':'f'*64,'exit_code':0,'produced_at':'2026-09-29T00:00:00+00:00','command':['true']})
    m=collect(root,state);r=Reader(state,root);result=r.read_runtime(m['snapshot_id'])[0];record=result['data'][0]['record'];assert 'save' not in record;assert record['counts']['logical_troops']==180
    assert r.read_checks(m['snapshot_id'])[0]['data'][0]['status']=='stale'

def test_quota_and_pinned_retention(project):
    root,state=project;m=collect(root,state);p=state/'snapshots'/m['snapshot_id']/'manifest.json';old=read_json(p);old['observed_at']='2020-01-01T00:00:00+00:00';write_json(p,old);write_json(state/'pins.json',[m['snapshot_id']])
    cfg=read_json(state/'config.json');cfg['quota_bytes']=1;write_json(state/'config.json',cfg)
    with pytest.raises(Fault,match='budget|quota'):gc(state,cfg)
    assert p.exists()
    with pytest.raises(Fault) as error:put_blob(state,b'x'*300)
    assert error.value.status=='storage_limit'
    assert (root/'assets/main.ts').read_text().startswith('export')

def test_source_replacement_retry_not_false_success(project,monkeypatch):
    import collector
    root,state=project;one=collect(root,state);original=collector.stat_sig;counter=[0]
    def moving(base,rel):
        sig=original(base,rel);counter[0]+=1
        if rel=='assets/main.ts':sig[-1]+=counter[0]
        return sig
    monkeypatch.setattr(collector,'stat_sig',moving)
    with pytest.raises(Fault) as e:collect(root,state)
    assert e.value.status=='updating';assert read_json(state/'latest.json')['snapshot_id']==one['snapshot_id']

def test_development_release_guard_and_real_build_stamp():
    source=(ROOT/'assets/scripts/formal/BridgeDiagnostics.ts').read_text();build=(ROOT/'tools/build-ios.py').read_text()
    assert 'DEBUG&&sys.isNative' in source and 'this.age<1' in source and '2*1024*1024' in source
    assert build.index('game_fingerprint(ROOT)')<build.index("'--build'")
    assert "'--skip-export'" in build

def test_watcher_debounces_updates_and_keeps_old_snapshot(project):
    import multiprocessing,time
    from collector import watch
    root,state=project;proc=multiprocessing.get_context('fork').Process(target=watch,args=(root,state));proc.start()
    try:
        deadline=time.monotonic()+15
        while not read_json(state/'latest.json') and time.monotonic()<deadline:time.sleep(.2)
        sid=read_json(state/'latest.json')['snapshot_id'];old=Reader(state,root).manifest(sid)
        for value in [21,22,23]:
            (root/'assets/main.ts').write_text(f'export const troops={value};\n');time.sleep(.1)
        deadline=time.monotonic()+15;nextid=sid
        while nextid==sid and time.monotonic()<deadline:time.sleep(.3);nextid=read_json(state/'latest.json')['snapshot_id']
        assert nextid!=sid
        records=list((state/'snapshots').glob('s_*'));assert len(records)==2
        reader=Reader(state,root);rec=next(r for r in old['files'] if r['category']=='code')
        assert '17' in reader.read_source(sid,rec['id'])[0]['data']['lines'][0]
        assert '23' in reader.read_source(nextid,rec['id'])[0]['data']['lines'][0]
    finally:proc.terminate();proc.join(5)

def test_secret_in_command_is_redacted_without_line_loss():
    raw='["--password", "do-not-disclose"]\nGET https://example.invalid/?token=sensitive\nAPI_KEY=private-value\n'
    clean=scrub(raw);assert clean.count('\n')==raw.count('\n')
    for value in ('do-not-disclose','sensitive','private-value'):assert value not in clean

def test_retention_keeps_twenty_24h_pins_and_imported_video_objects(project):
    import copy,time
    root,state=project;m=collect(root,state);old_ids=[]
    for i in range(23):
        x=copy.deepcopy(m);x['snapshot_id']=f's_old_{i:02}';x['observed_at']=f'2020-01-01T00:00:{i:02}+00:00';old_ids.append(x['snapshot_id']);write_json(state/'snapshots'/x['snapshot_id']/'manifest.json',x)
    write_json(state/'pins.json',[old_ids[0]])
    h=put_blob(state,b'imported-video-frame');p=state/'objects'/h;os.utime(p,(time.time()-1000,time.time()-1000));write_json(state/'imports.json',[{'frames':[{'blob':h}]}])
    gc(state,read_json(state/'config.json'),prune=True)
    assert (state/'snapshots'/old_ids[0]).exists();assert not (state/'snapshots'/old_ids[1]).exists()
    assert (state/'snapshots'/m['snapshot_id']).exists();assert len(list((state/'snapshots').glob('s_*')))>=20;assert p.exists()

def test_auth_denial_stops_retry_but_collector_is_preserved(project,monkeypatch):
    import cli,keychain
    root,state=project;cfg=read_json(state/'config.json');cfg['tunnel_id']='tunnel_fixture_only';write_json(state/'config.json',cfg)
    monkeypatch.setattr(cli,'STATE',state);monkeypatch.setattr(cli,'ROOT',root);monkeypatch.setattr(cli,'validate_binding',lambda:cfg)
    calls=[]
    def deny():calls.append(1);raise Fault('unavailable','keychain locked')
    monkeypatch.setattr(keychain,'access',deny)
    class Event:
        def __init__(self):self.flag=False;self.waits=0
        def set(self):self.flag=True
        def is_set(self):return self.flag
        def wait(self,seconds):self.waits+=1;return self.waits>4
    class Process:
        pid=987654321;stdout=[]
        def poll(self):return None
        def wait(self,timeout=None):return 0
    class Thread:
        def __init__(self,*args,**kwargs):pass
        def start(self):pass
    monkeypatch.setattr(cli.threading,'Event',Event);monkeypatch.setattr(cli.threading,'Thread',Thread)
    monkeypatch.setattr(cli.signal,'signal',lambda *a:None);monkeypatch.setattr(cli.os,'killpg',lambda *a:None);monkeypatch.setattr(cli.subprocess,'Popen',lambda *a,**k:Process())
    cli.supervise();assert len(calls)==1;assert read_json(state/'tunnel-status.json')['status']=='blocked_user_action'

def test_tunnel_requires_actual_recent_control_plane_poll():
    from cli import poll_health
    prefix='commands_poll_last_successful_timestamp_seconds{otel_scope_name="controlplane"} '
    assert poll_health(prefix+'0\n',1000)['status']=='unavailable'
    assert poll_health(prefix+'800\n',1000)['status']=='unavailable'
    assert poll_health('readiness 1\n',1000)['status']=='unavailable'
    assert poll_health(prefix+'990\n',1000)['status']=='connected'

def test_proxy_is_project_scoped_and_loopback_only(monkeypatch):
    import cli
    monkeypatch.setattr(cli,'clean_env',lambda:{'PATH':'/usr/bin'})
    env=cli.tunnel_env({'tunnel_proxy':'http://127.0.0.1:7897'})
    assert env['HTTPS_PROXY']=='http://127.0.0.1:7897'
    assert cli.tunnel_env({})=={'PATH':'/usr/bin'}
    for bad in ('http://remote.example:7897','http://user:secret@127.0.0.1:7897','http://127.0.0.1:7897/path'):
        with pytest.raises(Fault):cli.tunnel_env({'tunnel_proxy':bad})

def test_stop_waits_until_launchagent_is_removed(monkeypatch):
    import cli
    from types import SimpleNamespace
    polls=iter((0,0,113));calls=[]
    def launch(*args,**kwargs):
        calls.append(args)
        return SimpleNamespace(returncode=0 if args[0]=='bootout' else next(polls))
    monkeypatch.setattr(cli,'launchctl',launch)
    monkeypatch.setattr(cli.time,'sleep',lambda _:None)
    assert cli.stop()['stopped']
    assert len([c for c in calls if c[0]=='print'])==3

def test_repository_video_reuses_only_identical_precomputed_import(project):
    root,state=project
    (root/'evidence/movie.mp4').write_bytes(b'video-original-fixture')
    image=io.BytesIO();Image.new('RGB',(20,30),'red').save(image,format='PNG')
    frame={'frame_index':0,'timestamp_seconds':2.0,'blob':put_blob(state,image.getvalue())}
    write_json(state/'imports.json',[{'id':'m_fixture','relative_path':'selected-media/movie.mp4','category':'video','source_sha256':digest(b'video-original-fixture'),'frames':[frame],'capture_type':'fixture','speed':'original','version':{'status':'unknown','code_fingerprint':None}}])
    m=collect(root,state);r=Reader(state,root)
    record=next(x for x in m['files'] if x['relative_path']=='evidence/movie.mp4')
    out,images=r.read_media(m['snapshot_id'],record['id'])
    assert record['frames_from']=='m_fixture' and images and out['status']=='version_unknown'
    assert r.list_evidence(m['snapshot_id'],'video',parent_id=record['id'])[0]['data'][0]['timestamp_seconds']==2.0
    (root/'evidence/movie.mp4').write_bytes(b'different-video-same-filename')
    newer=collect(root,state)
    with pytest.raises(Fault,match='precomputed'):r.read_media(newer['snapshot_id'],record['id'])
    assert r.read_media(m['snapshot_id'],record['id'])[1] # fixed old snapshot still works
