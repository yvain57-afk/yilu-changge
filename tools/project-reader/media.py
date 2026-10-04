"""Local, explicit media ingestion. Decoder subprocesses never run in remote tools."""
import io, subprocess, tempfile, shutil
from PIL import Image, ImageOps
from common import *

Image.MAX_IMAGE_PIXELS=32_000_000
def clean_image(raw,original=False,crop=None,long_edge=1600):
    with Image.open(io.BytesIO(raw)) as im:
        im=ImageOps.exif_transpose(im);im.load()
        original_size=list(im.size)
        if crop:
            if len(crop)!=4 or any(type(v)!=int for v in crop):raise Fault('forbidden','crop must be integer x,y,width,height')
            x,y,w,h=crop
            if min(x,y)<0 or min(w,h)<1 or x+w>im.width or y+h>im.height:raise Fault('forbidden','crop outside image')
            im=im.crop((x,y,x+w,y+h))
        if not original:im.thumbnail((long_edge,long_edge))
        im=im.convert('RGBA' if 'A' in im.getbands() or 'transparency' in im.info else 'RGB')
        # Reconstruct pixels to remove EXIF, ICC, comments and other metadata.
        clean=Image.frombytes(im.mode,im.size,im.tobytes());out=io.BytesIO();clean.save(out,format='PNG')
        data=out.getvalue()
        if len(data)>24*1024*1024:raise Fault('too_large','decoded image exceeds 24 MiB')
        return data,{'width':im.width,'height':im.height,'source_dimensions':original_size,'mime_type':'image/png','alpha':im.mode=='RGBA','exif_removed':True}

def probe(path):
    r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate:format=duration','-of','json',str(path)],capture_output=True,timeout=30)
    if r.returncode:raise Fault('unavailable','FFprobe could not read selected video')
    d=json.loads(r.stdout);s=d['streams'][0];return {'duration_seconds':float(d['format']['duration']),'width':s['width'],'height':s['height'],'frame_rate':s['r_frame_rate']}

def import_media(path,capture_type='unknown',speed='unknown',code_fp=None,state=STATE,game_only=False):
    validate_binding(state)
    if not game_only:raise Fault('forbidden','confirm --game-only: select only game images; pixel privacy is not guaranteed by text scanning')
    path=Path(path).absolute()
    if path.is_symlink() or path.resolve()!=path:raise Fault('forbidden','selected path contains symlink')
    ext=path.suffix.lower()
    if ext not in IMAGE_EXT|VIDEO_EXT:raise Fault('forbidden','only images and MP4/MOV supported')
    if code_fp and not re.fullmatch('[a-f0-9]{64}',code_fp):raise Fault('forbidden','invalid code fingerprint')
    from collector import stream_hash,stat_sig
    h=stream_hash(path.parent,path.name,stat_sig(path.parent,path.name));eid='m_'+h[:24]
    existing=read_json(state/'imports.json',[])
    if any(r['id']==eid for r in existing):return next(r for r in existing if r['id']==eid)
    rec={'id':eid,'relative_path':'selected-media/'+path.name,'category':'video' if ext in VIDEO_EXT else 'image','source_sha256':h,'observed_at':now(),'produced_at':None,'capture_type':capture_type,'speed':speed,'version':{'status':'linked' if code_fp else 'unknown','code_fingerprint':code_fp,'basis':'user_assigned' if code_fp else None},'source_role':'user_selected_media','readable':True}
    if ext in IMAGE_EXT:
        raw,meta=clean_image(secure_bytes(path.parent,path.name,32*1024*1024),original=True);rec.update(blob=put_blob(state,raw),**meta)
    else:
        rec.update(**probe(path),frames=[])
        # Source reference is private local configuration, never included in public manifests.
        sources=read_json(state/'media-sources.json',{});sources[eid]={'path':str(path),'source_sha256':h};write_json(state/'media-sources.json',sources)
    existing.append(rec);write_json(state/'imports.json',existing)
    if ext in VIDEO_EXT:return export_frames(eid,0,rec['duration_seconds'],min(12,max(1,int(rec['duration_seconds'])+1)),state)
    return rec

def export_frames(eid,start,end,count,state=STATE):
    validate_binding(state)
    if not 1<=count<=30:raise Fault('too_large','frame count must be 1..30')
    records=read_json(state/'imports.json',[]);rec=next((r for r in records if r['id']==eid and r['category']=='video'),None)
    if not rec:raise Fault('not_found','import video first')
    if not 0<=start<=end<=rec['duration_seconds']:raise Fault('forbidden','invalid time range')
    source=read_json(state/'media-sources.json',{}).get(eid)
    if not source:raise Fault('unavailable','local video source missing')
    path=Path(source['path'])
    from collector import stream_hash,stat_sig
    if path.is_symlink() or path.resolve()!=path or stream_hash(path.parent,path.name,stat_sig(path.parent,path.name))!=source['source_sha256']:raise Fault('stale','original video changed; import changed file separately')
    times=[round(start+(end-start)*i/max(count,1),3) for i in range(count)]
    for t in times:
        if any(f['timestamp_seconds']==t and f['parameters']['long_edge']==1600 for f in rec['frames']):continue
        result=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(path),'-frames:v','1','-vf',"scale='min(1600,iw)':'min(1600,ih)':force_original_aspect_ratio=decrease",'-f','image2pipe','-vcodec','png','-'],capture_output=True,timeout=40)
        if result.returncode or not result.stdout:raise Fault('unavailable','FFmpeg frame extraction failed')
        raw,meta=clean_image(result.stdout);rec['frames'].append({'frame_index':len(rec['frames']),'video_id':eid,'timestamp_seconds':t,'duration_seconds':rec['duration_seconds'],'blob':put_blob(state,raw),'parameters':{'decoder':'ffmpeg','long_edge':1600,'seek':'input timestamp, first decoded frame'},**meta})
    write_json(state/'imports.json',records)
    return rec
