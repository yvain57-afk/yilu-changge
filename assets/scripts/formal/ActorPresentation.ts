import {MANIFEST as M} from './manifest';
import {R3_ACTOR_META} from './R3Art';
import {CHAPTERS} from './data';
/** Roles are resolved separately; an ally can never select a Boss or card portrait. */
export type ActorRole='ally'|'boss'|'officer';
export type ActorPose='ready'|'run'|'wind'|'rel'|'rec'|'hurt'|'defeated'|'yield';
const captured=Array.from(new Set(CHAPTERS.flatMap(chapter=>chapter.capture)));
const bosses=Array.from(new Set(CHAPTERS.map(chapter=>chapter.boss)));
const has=(key:string)=>!!M.frames[key];
const choose=(keys:string[])=>{const k=keys.find(has);if(!k)throw Error('actor_role_mapping_missing:'+keys.join('|'));return k;};
export function resolveActorPresentation(role:ActorRole,actorId:string,pose:ActorPose,gait=0){
 let sourceKey:string,quality='source_semantics_pending';
 if(role==='ally'){
  if(!captured.includes(actorId))throw Error('actor_not_capturable:'+actorId);
  const prefix='r3_ally_'+actorId+'_';
  const four=['run0','pass0','run1','pass1'],phase=pose==='run'?four[((gait%4)+4)%4]:pose;
  if(actorId==='ganning'&&['rec','ready'].includes(pose)){sourceKey=prefix+'run0';quality='missing_'+pose+'_held_blade_owned_run_provisional';}
  else if(actorId==='ganning'&&pose==='run'&&['pass0','pass1'].includes(phase)){sourceKey=prefix+(phase==='pass0'?'run0':'run1');quality='passing_rejected_missing_held_blade';}
  else if(has(prefix+phase)){sourceKey=prefix+phase;quality='new_role_scoped_source';}
  else if(pose==='run'&&has(prefix+'run0')){sourceKey=prefix+'run0';quality='new_role_scoped_two_phase_pending';}
  else {
   const old='g_'+actorId;
   // Missing wind/recovery use this same actor's controlled run only, explicitly
   // reported as incomplete. No cross-actor, front portrait, hurt or defeat fallback.
   const own=pose==='run'?'Run'+(gait%2):pose==='rel'?'Thrust':pose==='wind'?'Wind':pose==='hurt'?'Hit':'Rec';
   sourceKey=choose([old+own,old+'Run0']);
   quality=has(old+own)?'legacy_owned_source':'missing_'+pose+'_owned_run_provisional';
  }
 }else{
  if(role==='boss'&&!bosses.includes(actorId))throw Error('unknown_boss_actor:'+actorId);
  const suffix=pose==='ready'||pose==='run'?'idle':pose==='wind'?'wind':pose==='rel'?'strike':pose==='rec'?'rec':pose==='hurt'?'hit':'spent';
  const lubu:Record<string,string>={idle:'g_lubuIdle',wind:'g_lubuWind',strike:'g_lubuStrike',rec:'g_lubuRec',hit:'g_lubuHit',spent:'g_lubuSpent'};
  const old=actorId==='lubu'?lubu[suffix]:'g_boss_'+actorId+'_'+suffix;
  const front='c20_front_'+actorId+'_'+(pose==='wind'?'wind':pose==='rel'?'rel':pose==='rec'?'rec':'run');
  const r3='r3_boss_'+actorId+'_'+(pose==='ready'||pose==='run'?'idle':pose);
  sourceKey=choose(has(r3)?[r3]:pose==='yield'?[actorId==='lubu'?'g_lubuYield':'g_end_'+actorId+'_2',old,front]:pose==='hurt'||pose==='defeated'?[old,'g_end_'+actorId+'_0',front]:[front,old,'g_front_'+actorId+(pose==='wind'?'Wind':pose==='rel'?'Strike':pose==='rec'?'Rec':'Run0')]);
  quality='enemy_role_source';
 }
 const key='r3_'+role+'_'+actorId+'_'+pose+'_'+(pose==='run'?((gait%4)+4)%4:0);
 // Additive names reference existing texture rects; source UUIDs are never overwritten.
 if(!M.frames[key])M.frames[key]={...M.frames[sourceKey]};
 const f=M.frames[sourceKey],metadata=R3_ACTOR_META[sourceKey]||{actorId,role,camera:role==='ally'?'rear_3/4':'front_3/4',semanticPose:pose,canonicalScale:1,feetAnchor:[f.a[0],1-f.a[1]],pelvisAnchor:[.5,.64],bodyHeight:f.bh||152,bodyBox:[.28,.16,.44,.8],source:sourceKey,qualityStatus:quality,metadataBasis:'legacy_anatomical_reference_pending',runtimeVerified:false};
 return{actorId,role,pose,frameKey:key,sourceFrameKey:sourceKey,refH:metadata.bodyHeight,metadata,quality};
}
export function actorPoseDiagnostic(actor:any,x:number,y:number,worldDepth:number,bodyH:number,projectedScale:number){
 const f=M.frames[actor.frameKey],m=actor.metadata,scale=bodyH/actor.refH,b=m.bodyBox;
 return{actorId:actor.actorId,role:actor.role,pose:actor.pose,frameKey:actor.frameKey,sourceFrameKey:actor.sourceFrameKey,quality:actor.quality,canonicalScale:m.canonicalScale,worldDepth,projectedScale,bodyScale:scale,bodyBox:{x:x+(b[0]-f.a[0])*f.r[2]*scale,y:y+(b[1]-(1-f.a[1]))*f.r[3]*scale,w:b[2]*f.r[2]*scale,h:b[3]*f.r[3]*scale},footAnchor:{x,y},pelvisAnchor:{x:x+(m.pelvisAnchor[0]-f.a[0])*f.r[2]*scale,y:y+(m.pelvisAnchor[1]-(1-f.a[1]))*f.r[3]*scale},sourceSha:m.sourceSha||null,metadataBasis:m.metadataBasis||'reviewed_source_model',untrimmedSize:m.untrimmedSize||[f.r[2],f.r[3]]};
}
