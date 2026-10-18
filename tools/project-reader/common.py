"""Project binding, bounded file access and sanitization. No model/network APIs."""
from __future__ import annotations
import os, re, json, hashlib, stat, tempfile
from pathlib import Path, PurePosixPath
from datetime import datetime, timezone

PROJECT = 'yilu-changge'
ROOT = Path(__file__).resolve().parents[2]
STATE = Path.home() / 'Library/Application Support/YiluProjectReader' / PROJECT
SCHEMA = '1.0'
TEXT_EXT = {'.ts','.js','.mjs','.cjs','.py','.md','.json','.jsonl','.txt','.log','.yaml','.yml','.toml','.plist','.scene','.prefab','.meta','.h','.mm','.cpp','.html','.css','.xml'}
IMAGE_EXT = {'.png','.jpg','.jpeg','.webp'}
VIDEO_EXT = {'.mp4','.mov'}
TOP = {'AGENTS.md','AI_HANDOFF.md','README.md','PROGRESS.md','BLOCKED.md','package.json','package-lock.json','tsconfig.json','project.json'}
PREFIXES = ('assets/','native/engine/','settings/','tools/','tests/','docs/','evidence/','deliverables/','art-source/')
DENY_PART = re.compile(r'(?i)(^\.env|^\.|credential|private.?key|secret|password|token|provision|backup|device-save|keychain|browser|cookie|sqlite|\.p12$|\.pem$|\.cer$|\.mobileprovision$|\.db$)')
SKIP_DIRS = {'node_modules','__pycache__','.venv','.git','build','library','temp','profiles'}
GENERATED = {'assets/scripts/formal/BridgeBuild.ts','assets/scripts/formal/BridgeBuild.ts.meta'}

class Fault(Exception):
    def __init__(self, status, reason): self.status, self.reason = status, reason; super().__init__(reason)

def now(): return datetime.now(timezone.utc).isoformat()
def digest(data): return hashlib.sha256(data).hexdigest()
def encoded(obj): return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',',':')).encode()
def fingerprint(items): return digest(encoded(sorted(items)))
def atomic(path, data):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.write-', dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as f: f.write(data); f.flush(); os.fsync(f.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
def write_json(path, obj): atomic(path, encoded(obj))
def read_json(path, default=None):
    try: return json.loads(Path(path).read_bytes())
    except FileNotFoundError: return default

def relative(value):
    if not isinstance(value,str) or not value or '\\' in value or '\x00' in value: raise Fault('forbidden','invalid relative path')
    p = PurePosixPath(value)
    if p.is_absolute() or any(s in ('..','.') for s in value.split('/')): raise Fault('forbidden','path traversal or absolute path')
    return p.as_posix()

def allowed(rel):
    relative(rel)
    if any(DENY_PART.search(s) for s in rel.split('/')): return False
    if rel.startswith(('tools/project-reader/.','evidence/ai-bridge/baseline-','evidence/ai-bridge/tunnel-')): return False
    return (rel in TOP or rel.startswith(PREFIXES)) and Path(rel).suffix.lower() in TEXT_EXT | IMAGE_EXT | VIDEO_EXT | {'.ttf','.woff','.mp3','.wav','.ogg'}

def code_path(rel):
    return rel not in GENERATED and (rel.startswith(('assets/','native/engine/','settings/')) or rel in {'package.json','package-lock.json','tsconfig.json','project.json'} or rel.startswith('tools/build-'))

def secure_bytes(base, rel, limit=16*1024*1024):
    """Open every component without symlink following; reject replacement/read races."""
    parts=relative(rel).split('/'); fd=os.open(base,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
    try:
        for part in parts[:-1]:
            nextfd=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=nextfd
        f=os.open(parts[-1],os.O_RDONLY|os.O_NOFOLLOW,dir_fd=fd)
        try:
            a=os.fstat(f)
            if not stat.S_ISREG(a.st_mode): raise Fault('forbidden','not a regular file')
            if a.st_size>limit: raise Fault('too_large','input exceeds bounded read')
            chunks=[];total=0
            while True:
                b=os.read(f,min(1024*1024,limit+1-total))
                if not b: break
                chunks.append(b);total+=len(b)
                if total>limit: raise Fault('too_large','input grew beyond limit')
            z=os.fstat(f);current=os.stat(parts[-1],dir_fd=fd,follow_symlinks=False)
            sig=lambda s:(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns)
            if sig(a)!=sig(z) or sig(z)!=sig(current): raise Fault('updating','file changed while reading')
            return b''.join(chunks)
        finally: os.close(f)
    except OSError as e: raise Fault('forbidden','file unavailable or link rejected') from e
    finally: os.close(fd)

SECRET = re.compile(r'(?i)(?:sk-(?:proj-|admin-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+[A-Za-z0-9._-]{12,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)')
ASSIGN = re.compile(r'''(?i)(["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|control_plane_api_key)["']?\s*[:=]\s*)(["'])([^\n"']{6,})(["'])''')
def scrub(text):
    if '\x00' in text: raise Fault('forbidden','binary content in text')
    if re.search(r'-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----',text): raise Fault('forbidden','private key material')
    text=SECRET.sub('[REDACTED]',text)
    text=ASSIGN.sub(lambda m:m[1]+m[2]+'[REDACTED]'+m[4],text)
    text=re.sub(r'''(?i)(["']--(?:password|token|api-key|secret)["']\s*,\s*["'])[^"'\n]+''',r'\1[REDACTED]',text)
    text=re.sub(r'(?i)(--(?:password|token|api-key|secret)(?:=|\s+))[^\s"\']+',r'\1[REDACTED]',text)
    text=re.sub(r'(?i)([?&](?:token|api_key|key|password|signature)=)[^&\s"\']+',r'\1[REDACTED]',text)
    text=re.sub(r'(?im)((?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|PASSWORD|CONTROL_PLANE_API_KEY)\s*=\s*)(?!["\'\s])[^\s;]+',r'\1[REDACTED]',text)
    text=re.sub(r'(?i)(https?://)[^\s/@:]+:[^\s/@]+@',r'\1[REDACTED]@',text)
    text=text.replace(str(ROOT),'$PROJECT').replace(str(Path.home()),'$HOME')
    return text

def validate_binding(state=STATE, root=ROOT):
    if state.is_symlink() or state.resolve()!=state:raise Fault('forbidden','private state path contains a symlink')
    cfg=read_json(state/'config.json')
    if not cfg: raise Fault('unavailable','run yilu-bridge install first')
    if cfg['project_id']!=PROJECT or cfg['root']!=str(root) or root.is_symlink() or str(root.resolve())!=cfg['root']:
        raise Fault('forbidden','project moved; use install --rebind at the intended root')
    return cfg

def files(root):
    for base, dirs, names in os.walk(root,followlinks=False):
        rel=Path(base).relative_to(root)
        dirs[:]=[d for d in dirs if d not in SKIP_DIRS and not d.startswith('.') and not (Path(base)/d).is_symlink() and not ((Path(base)/d)/'.git').exists() and (str(rel)!='.' or d in {p.split('/')[0] for p in PREFIXES})]
        for name in names:
            r=(rel/name).as_posix()
            if allowed(r): yield r

def game_fingerprint(root=ROOT):
    rows=[]
    for rel in files(root):
        if code_path(rel): rows.append((rel,digest(secure_bytes(root,rel,256*1024*1024))))
    return fingerprint(rows),rows

def tool_fingerprint(root=ROOT):
    base=root/'tools/project-reader';rows=[]
    for p in base.rglob('*'):
        rel=p.relative_to(base)
        if any(part.startswith('.') or part=='__pycache__' for part in rel.parts) or p.is_symlink() or not p.is_file():continue
        if p.suffix in {'.py','.toml','.lock','.cjs'} or p.name=='yilu-bridge':rows.append((rel.as_posix(),digest(p.read_bytes())))
    return fingerprint(rows)

def process_alive(pid):
    if not isinstance(pid,int) or pid<=1:return False
    try:os.kill(pid,0);return True
    except OSError:return False

_usage={}
def put_blob(state,data):
    h=digest(data);p=state/'objects'/h
    if not p.exists():
        cfg=read_json(state/'config.json',{});limit=cfg.get('quota_bytes',2*1024**3)
        # Bound content growth before writing. Reserve metadata/log headroom; refresh usage each batch.
        import time
        usage,at=_usage.get(str(state),(0,0))
        if time.monotonic()-at>15:
            usage=sum(q.stat().st_size for q in state.rglob('*') if q.is_file() and not q.is_symlink());at=time.monotonic()
        if usage+len(data)+min(16*1024*1024,limit//10)>limit:raise Fault('storage_limit','private state quota reached before content write')
        atomic(p,data);p.chmod(0o400);_usage[str(state)]=(usage+len(data),at)
    return h

def blob(state,h):
    if not re.fullmatch('[a-f0-9]{64}',h): raise Fault('forbidden','invalid object id')
    b=secure_bytes(state/'objects',h,32*1024*1024)
    if digest(b)!=h: raise Fault('unavailable','immutable object integrity failed')
    return b
