from pathlib import Path
import sys,json,asyncio,base64,hashlib,io
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tools/project-reader'))
from common import now,tool_fingerprint,game_fingerprint
from cli import clean_env
from mcp import Client,StdioServerParameters
from PIL import Image
D=R/'deliverables/R3-COMBAT-PATCH-20261002';E=R/'evidence/R3-COMBAT-PATCH-20261002';FP=json.loads((D/'MCP-MEDIA.json').read_text())['code_fingerprint']
async def run():
 rows=json.loads((D/'MCP-MEDIA.json').read_text())['media'];records=[]
 async with Client(StdioServerParameters(command=str(R/'tools/project-reader/yilu-bridge'),args=['_serve'],cwd=str(R),env=clean_env()),raise_exceptions=False) as c:
  ov=await c.call_tool('project_overview',{});assert not ov.is_error;sid=ov.structured_content['snapshot_id'];assert ov.structured_content['data']['code_fingerprint']==FP
  for name,indices in [('after-home-402x874.png',None),('natural-mounted-checkpoint-60.png',None),('natural-mounted-original-speed.mp4',[2,5,8])]:
   row=next(x for x in rows if Path(x['file']).name==name);args={'snapshot_id':sid,'evidence_id':row['id'],'variant':'preview'}
   if indices:args['frame_indices']=indices
   out=await c.call_tool('read_media',args);assert not out.is_error;value=out.structured_content;assert value['status']=='ok';assert value['data']['version']['code_fingerprint']==FP
   blocks=[b for b in out.content if b.type=='image'];assert len(blocks)==(len(indices) if indices else 1)
   pixels=[]
   for i,b in enumerate(blocks):
    raw=base64.b64decode(b.data);Image.open(io.BytesIO(raw)).verify();h=hashlib.sha256(raw).hexdigest();assert h==value['data']['media'][i]['returned_pixels_sha256'];path=E/'mcp-pixels'/f'{Path(name).stem}-{i}.png';path.parent.mkdir(exist_ok=True);path.write_bytes(raw);pixels.append({'path':str(path.relative_to(R)),'sha256':h,'dimensions':list(Image.open(io.BytesIO(raw)).size),**value['data']['media'][i]})
   records.append({'evidence_id':row['id'],'file':row['file'],'capture_type':value['data']['capture_type'],'version':value['data']['version'],'pixels':pixels,'status':value['status']})
 value={'produced_at':now(),'snapshot_id':sid,'code_fingerprint':FP,'tool_fingerprint':tool_fingerprint(),'source_stable':game_fingerprint()[0]==FP,'transport':'official Python SDK v2 stdio Client; actual read_media image blocks decoded and SHA verified','records':records,'chatgpt_actual_read':'not_executed_for_R3; this is local protocol proof, not a ChatGPT cloud invocation'}
 (E/'mcp-current-pixels-check.json').write_text(json.dumps(value,ensure_ascii=False,indent=2));print(json.dumps({'snapshot_id':sid,'images':len(records),'pixel_blocks':sum(len(x['pixels']) for x in records),'source_stable':value['source_stable']},ensure_ascii=False))
asyncio.run(run())
