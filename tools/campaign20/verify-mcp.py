#!/usr/bin/env python3
"""Read the final game pixels and precomputed frames through the actual stdio MCP client."""
import sys,pathlib,json,asyncio,base64,hashlib,datetime
R=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tools/project-reader'))
from cli import clean_env,ENTRY
from reader import Reader
from mcp import Client,StdioServerParameters
E=R/'evidence/YILU-CAMPAIGN20-20260930';O=E/'mcp-returned-pixels';O.mkdir(exist_ok=True);fp=json.loads((E/'bridge-build-manifest.json').read_text())['code_fingerprint']
async def main():
 async with Client(StdioServerParameters(command=str(ENTRY),args=['_serve'],cwd=str(R),env=clean_env()),raise_exceptions=False) as client:
  overview=await client.call_tool('project_overview',{});assert not overview.is_error;sid=overview.structured_content['snapshot_id'];m=Reader().manifest(sid);assert m['code_fingerprint']==fp
  report=next(x for x in m['files'] if x['relative_path']=='deliverables/YILU-CAMPAIGN20-20260930/REPORT.md')
  report_result=await client.call_tool('read_checks',{'snapshot_id':sid,'report_id':report['id']});assert not report_result.is_error
  report_status=report_result.structured_content['data'][0]['status'];assert report_status=='ok',str(report_result.structured_content)
  targets=['evidence/YILU-CAMPAIGN20-20260930/fixtures-large/C20-map-10-after.png','evidence/YILU-CAMPAIGN20-20260930/fixtures-large/C20-reward-11-after.png','deliverables/YILU-CAMPAIGN20-20260930/media/normal-native-system-audio.mp4'];rows=[]
  for n,path in enumerate(targets):
   r=next(x for x in m['files'] if x['relative_path']==path);args={'snapshot_id':sid,'evidence_id':r['id'],'variant':'preview'}
   if r['category']=='video':args['frame_indices']=[0,6]
   result=await client.call_tool('read_media',args);assert not result.is_error and result.structured_content['status']=='ok',str(result.structured_content);blocks=[c for c in result.content if c.type=='image'];assert blocks
   returned=[]
   for i,c in enumerate(blocks):
    raw=base64.b64decode(c.data);p=O/f'{n}-{i}.png';p.write_bytes(raw);returned.append({'path':str(p.relative_to(R)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
   rows.append({'path':path,'evidence_id':r['id'],'response':result.structured_content,'returned':returned})
  out={'status':'passed','produced_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'transport':'official Python MCP SDK v2 stdio client','verification_snapshot_id':sid,'code_fingerprint':fp,'report_status':report_status,'report_sha256':report['source_sha256'],'actual_image_content':True,'chatgpt_actual_read':'not_run_for_this_snapshot','scope':'Local Codex-side protocol and actual pixel retrieval; not ChatGPT remote acceptance','reads':rows};(E/'mcp-current-pixels.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps({'snapshot_id':sid,'fp':fp,'report_status':report_status,'images_returned':sum(len(r['returned']) for r in rows)}))
asyncio.run(main())
