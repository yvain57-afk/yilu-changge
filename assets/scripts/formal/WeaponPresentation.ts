import {BATTLE_FEEL_RANGED_META} from './BattleFeelRangedArt';
import {BATTLE_FEEL_HANDS,BATTLE_FEEL_ACTOR_META} from './BattleFeelArt';
import {R3_HANDS} from './R3Art';
import {R2_HANDS} from './R2Art';
import {R27_HANDS,R27_PROPS} from './R27Art';
import {MANIFEST as M} from './manifest';
import {WEAPON_DATA} from './data';
type Point=[number,number];
export type HeldPart={key:string;socket:Point;grip:Point;height:number;rotation:number;cap?:string;behindBody?:boolean;twoGrip?:{supportGrip:Point;supportSocket:Point;supportCap?:string}};
export type WeaponPresentation={weaponId:string;bodyFrameKey:string;bodyContainsWeapon:boolean;heldWeaponParts:HeldPart[];icon:string;projectileVisual:'bolt'|'arrow'|'blade';refH:number;battleMetadata?:any;battle?:{view:'march-rear';pose:string;gait:number;mountId:string}};
const sockets:any={"r26_ride_jingfan_single": {"bodyContainsWeapon": false, "pose": "single", "sockets": {"right": {"source_px": [132, 201], "normalized": [0.3467048710601719, 0.34451901565995524], "occlusion_frame": "r26_ride_jingfan_single_right_fingers"}, "left": {"source_px": [234, 169], "normalized": [0.6389684813753582, 0.27293064876957496], "occlusion_frame": "r26_ride_jingfan_single_left_fingers"}}, "body_frame": "r26_ride_jingfan_single", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jingfan_crossbow": {"bodyContainsWeapon": false, "pose": "crossbow", "sockets": {"right": {"source_px": [550, 166], "normalized": [0.46537396121883656, 0.2209026128266033], "occlusion_frame": "r26_ride_jingfan_crossbow_right_fingers"}, "left": {"source_px": [611, 158], "normalized": [0.6343490304709142, 0.20190023752969122], "occlusion_frame": "r26_ride_jingfan_crossbow_left_fingers"}}, "body_frame": "r26_ride_jingfan_crossbow", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jingfan_bow": {"bodyContainsWeapon": false, "pose": "bow", "sockets": {"right": {"source_px": [895, 110], "normalized": [0.3341232227488152, 0.13501144164759726], "occlusion_frame": "r26_ride_jingfan_bow_right_fingers"}, "left": {"source_px": [1043, 140], "normalized": [0.6848341232227488, 0.2036613272311213], "occlusion_frame": "r26_ride_jingfan_bow_left_fingers"}}, "body_frame": "r26_ride_jingfan_bow", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jingfan_dual": {"bodyContainsWeapon": false, "pose": "dual", "sockets": {"right": {"source_px": [1263, 163], "normalized": [0.22254335260115607, 0.26174496644295303], "occlusion_frame": "r26_ride_jingfan_dual_right_fingers"}, "left": {"source_px": [1450, 158], "normalized": [0.7630057803468208, 0.2505592841163311], "occlusion_frame": "r26_ride_jingfan_dual_left_fingers"}}, "body_frame": "r26_ride_jingfan_dual", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jueying_single": {"bodyContainsWeapon": false, "pose": "single", "sockets": {"right": {"source_px": [132, 704], "normalized": [0.34844192634560905, 0.36771300448430494], "occlusion_frame": "r26_ride_jueying_single_right_fingers"}, "left": {"source_px": [232, 665], "normalized": [0.6317280453257791, 0.2802690582959641], "occlusion_frame": "r26_ride_jueying_single_left_fingers"}}, "body_frame": "r26_ride_jueying_single", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jueying_crossbow": {"bodyContainsWeapon": false, "pose": "crossbow", "sockets": {"right": {"source_px": [550, 662], "normalized": [0.46537396121883656, 0.23040380047505937], "occlusion_frame": "r26_ride_jueying_crossbow_right_fingers"}, "left": {"source_px": [609, 649], "normalized": [0.628808864265928, 0.1995249406175772], "occlusion_frame": "r26_ride_jueying_crossbow_left_fingers"}}, "body_frame": "r26_ride_jueying_crossbow", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jueying_bow": {"bodyContainsWeapon": false, "pose": "bow", "sockets": {"right": {"source_px": [895, 605], "normalized": [0.3341232227488152, 0.14187643020594964], "occlusion_frame": "r26_ride_jueying_bow_right_fingers"}, "left": {"source_px": [1040, 635], "normalized": [0.6777251184834123, 0.21052631578947367], "occlusion_frame": "r26_ride_jueying_bow_left_fingers"}}, "body_frame": "r26_ride_jueying_bow", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}, "r26_ride_jueying_dual": {"bodyContainsWeapon": false, "pose": "dual", "sockets": {"right": {"source_px": [1260, 659], "normalized": [0.2144927536231884, 0.27069351230425054], "occlusion_frame": "r26_ride_jueying_dual_right_fingers"}, "left": {"source_px": [1450, 650], "normalized": [0.7652173913043478, 0.2505592841163311], "occlusion_frame": "r26_ride_jueying_dual_left_fingers"}}, "body_frame": "r26_ride_jueying_dual", "occlusion": "Draw body, weapon(s) attached at specified fist center, then skin/gauntlet cap; never draw another body."}};
const base=['spear','guandao','shemao','huaji'];
const dual=['shuanggu','shuangji','duanji','dundao'];
const grips:Record<string,Point>={spear:[.26,.73],guandao:[.26,.78],shemao:[.30,.72],huaji:[.25,.75],guding:[.85,.78],yitian:[.5,.83],qinggang:[.48,.85],shuanggu:[.42,.73],shuangji:[.49,.70],liannu:[.65,.55],duanji:[.49,.68],tiesuodao:[.36,.74],goulianqiang:[.30,.78],dundao:[.69,.24],yanlinggong:[.53,.48],jiguannu:[.62,.58]};
const gait:Point[]=[[.947,.352],[.955,.44],[.953,.307],[.954,.357]];
const oldHands:Record<string,Point>={g_ride_chitu_run0:[.9429,.3874],g_ride_chitu_run1:[.9483,.389],g_ride_chitu_wind:[.9465,.084],g_ride_chitu_rel:[.9485,.0966],g_ride_dilu_run0:[.9502,.3924],g_ride_dilu_run1:[.952,.3996],g_ride_dilu_wind:[.9437,.0819],g_ride_dilu_rel:[.9309,.0799]};
function requireFrame(key:string){if(!M.frames[key])throw Error('render_resource:mapping_missing:'+key);return key;}
export function resolveWeaponPresentation(weaponId:string,pose='run',mountId:string|null=null,gaitIndex=0):WeaponPresentation{
 if(!Object.prototype.hasOwnProperty.call(WEAPON_DATA,weaponId))throw Error('unknown_weapon:'+weaponId);
 if(!['ready','run','wind','rel','rec','show','hurt','defeat'].includes(pose))throw Error('unknown_actor_pose:'+pose);
 const requestedPose=pose; if(['ready','hurt','defeat'].includes(pose))pose='rec';
 const icon=requireFrame((M.frames['c20_icon_'+weaponId]?'c20_icon_':'g_icon_')+weaponId),i=((gaitIndex%4)+4)%4;
 const projectileVisual=['liannu','jiguannu'].includes(weaponId)?'bolt':weaponId==='yanlinggong'?'arrow':'blade';
 let bodyFrameKey:string,bodyContainsWeapon=true;let hands:any={right:{normalized:gait[i]},left:{normalized:[.15,.43]}};
 if(mountId){
  const style3=dual.includes(weaponId)?'dual':projectileVisual==='arrow'?'bow':projectileVisual==='bolt'?'crossbow':'single';
  const body3='r3_body_ride_'+mountId+'_'+style3+'_'+(pose==='run'?'run1':pose==='show'?'rec':pose);
  const r3='r3_ride_'+mountId+'_liannu_'+(pose==='run'?'run1':pose==='show'?'rec':pose);
  if(M.frames[body3]&&(pose!=='run'||i%2===1)){bodyFrameKey=body3;bodyContainsWeapon=false;hands=R3_HANDS[body3].sockets;}
  else if(weaponId==='liannu'&&M.frames[r3]&&(pose!=='run'||i%2===1)){bodyFrameKey=r3;bodyContainsWeapon=true;}
  else {
  bodyContainsWeapon=false;
  if(['jingfan','jueying'].includes(mountId)){const style=dual.includes(weaponId)?'dual':projectileVisual==='bolt'?'crossbow':projectileVisual==='arrow'?'bow':'single';bodyFrameKey='r26_ride_'+mountId+'_'+style;hands=sockets[bodyFrameKey].sockets;}
  else if(['chitu','dilu'].includes(mountId)){const style=dual.includes(weaponId)?'dual':projectileVisual==='bolt'?'crossbow':projectileVisual==='arrow'?'bow':'';if(style){bodyFrameKey=style==='crossbow'&&pose==='run'?'r2_ride_'+mountId+'_crossbow_run'+i%2:'r27_ride_'+mountId+'_'+style;hands=(R2_HANDS[bodyFrameKey]||R27_HANDS[bodyFrameKey]).sockets;}else{bodyFrameKey='g_ride_'+mountId+'_'+(pose==='wind'?'wind':pose==='rel'?'rel':'run'+i%2);hands={right:{normalized:oldHands[bodyFrameKey],occlusion_frame:M.frames[bodyFrameKey+'_fingers']?bodyFrameKey+'_fingers':undefined},left:{normalized:[.34,.36]}};}}
  else throw Error('unknown_mount:'+mountId);
  }
 }else if(pose==='run'&&!base.includes(weaponId)){const style=dual.includes(weaponId)?'dual':projectileVisual==='bolt'?'crossbow':projectileVisual==='arrow'?'bow':'';bodyFrameKey=style?'r27_body_'+style+(i%2):'g_ios_gait'+i;bodyContainsWeapon=false;if(style)hands=R27_HANDS[bodyFrameKey].sockets;}
 else if(weaponId==='guandao'&&M.frames['r3_hero_guandao_'+(requestedPose==='run'?'run'+i:requestedPose==='hurt'?'hit':requestedPose)]){bodyFrameKey='r3_hero_guandao_'+(requestedPose==='run'?'run'+i:requestedPose==='hurt'?'hit':requestedPose);}
 else if(pose==='rec'&&M.frames['r3_hero_'+weaponId+'_rec']){bodyFrameKey='r3_hero_'+weaponId+'_rec';}
 else if(base.includes(weaponId)){bodyFrameKey=pose==='run'?'g_run_'+weaponId+i:pose==='show'?'g_brandish_'+weaponId:'g_'+weaponId+({wind:'Wind',rel:'Rel',rec:'Rec'} as any)[pose];}
 else {bodyFrameKey=(M.frames['c20_hero_'+weaponId+'_run']?'c20_hero_':'g_hero_')+weaponId+'_'+(pose==='show'?'rec':pose);}
 requireFrame(bodyFrameKey);
 const parts:HeldPart[]=[];
 if(!bodyContainsWeapon&&['bolt','arrow'].includes(projectileVisual)&&R27_PROPS['r27_held_'+weaponId]){
  const key='r27_held_'+weaponId,q=R27_PROPS[key];
  if(R3_HANDS[bodyFrameKey]&&projectileVisual==='arrow'){
   // The bow is rigid. String-hand release must never rescale its limb span.
   parts.push({key:requireFrame(key),socket:hands.left.normalized,grip:q.bowGrip||q.supportGrip,height:.40,rotation:pose==='wind'?-.08:pose==='rel'?.06:0,cap:hands.left.occlusion_frame});
  }else parts.push({key:requireFrame(key),socket:hands.right.normalized,grip:q.rearGrip,height:.34,rotation:0,cap:hands.right.occlusion_frame,twoGrip:{supportGrip:q.supportGrip,supportSocket:hands.left.normalized,supportCap:hands.left.occlusion_frame}});
 }else if(!bodyContainsWeapon){
  const hand=projectileVisual==='arrow'?'left':'right',key=dual.includes(weaponId)?weaponId==='dundao'?'r26_part_dundao_blade':weaponId==='duanji'?'r26_part_duanji':'g_part_'+weaponId:icon;
  const add=(key:string,hand:string,grip:Point,height:number,rotation:number)=>parts.push({key:requireFrame(key),socket:hands[hand].normalized,cap:hands[hand].occlusion_frame,grip,height,rotation});
  add(key,hand,grips[weaponId],base.includes(weaponId)?.56:.34,pose==='rel'?.55:pose==='wind'?-.2:.45);
  if(dual.includes(weaponId))add(weaponId==='dundao'?'r26_part_dundao_shield':key,'left',weaponId==='dundao'?[.5,.52]:grips[weaponId],.34,-.28);
 }
 const f=M.frames[bodyFrameKey],refH=f.bh||({guandao:260,shemao:253,huaji:268} as any)[weaponId]||f.r[3]*.85;
 return {weaponId,bodyFrameKey,bodyContainsWeapon,heldWeaponParts:parts,icon,projectileVisual,refH};
}
/** Battle uses rear-facing stride poses. Menu portraits deliberately retain the original resolver. */
export function resolveBattleWeaponPresentation(weaponId:string,pose='run',mountId:string|null=null,gaitIndex=0):WeaponPresentation{
 const original=resolveWeaponPresentation(weaponId,pose,null,gaitIndex);
 if(!mountId)return original;
 if(!['chitu','dilu','jingfan','jueying'].includes(mountId))throw Error('unknown_mount:'+mountId);
 if(['bolt','arrow'].includes(original.projectileVisual)){
  // Dedicated rear-view two-hand weapon poses; never rotate a side-view crossbow into a vertical staff.
  const semantic=pose==='run'?'run':pose==='show'?'wind':['ready','hurt','defeat'].includes(pose)?'rec':pose;
  const bodyFrameKey=requireFrame('feel_ride_'+mountId+'_'+weaponId+'_'+semantic);
  return{...original,bodyFrameKey,bodyContainsWeapon:true,heldWeaponParts:[],refH:M.frames[bodyFrameKey].bh,battleMetadata:BATTLE_FEEL_RANGED_META[bodyFrameKey],battle:{view:'march-rear',pose:semantic,gait:0,mountId}};
 }
 const i=((Math.floor(gaitIndex)%4)+4)%4,semantic=pose==='run'?'run'+i:pose==='show'?'wind':pose==='ready'?'rec':pose==='defeat'?'hurt':pose;
 const bodyFrameKey=requireFrame('feel_ride_'+mountId+'_'+semantic),hands=BATTLE_FEEL_HANDS[bodyFrameKey],parts:HeldPart[]=[];
 const add=(key:string,hand:'right'|'left',grip:Point,height:number,rotation:number)=>parts.push({key:requireFrame(key),socket:hands[hand],grip,height,rotation,behindBody:true});
 if(original.projectileVisual==='bolt'){
  const key='r27_held_'+weaponId,q=R27_PROPS[key];
  add(key,'right',q.rearGrip,.14,pose==='wind'?-1.35:pose==='rel'?-1.56:-1.45);
 }else if(original.projectileVisual==='arrow'){
  const key='r27_held_'+weaponId,q=R27_PROPS[key];
  add(key,'left',q.bowGrip||q.supportGrip,.28,-1.5);
 }else{
  const key=dual.includes(weaponId)?weaponId==='dundao'?'r26_part_dundao_blade':weaponId==='duanji'?'r26_part_duanji':'g_part_'+weaponId:original.icon;
  const diagonal=base.includes(weaponId)||['goulianqiang','tiesuodao'].includes(weaponId);
  const forward=diagonal?-.58:-.08,rotation=pose==='wind'?forward-.40:pose==='rel'?forward+.18:forward;
  add(key,'right',grips[weaponId],base.includes(weaponId)?.43:.27,rotation);
  if(dual.includes(weaponId))add(weaponId==='dundao'?'r26_part_dundao_shield':key,'left',weaponId==='dundao'?[.5,.52]:grips[weaponId],weaponId==='dundao'?.27:.25,-.22);
 }
 return{...original,bodyFrameKey,bodyContainsWeapon:false,heldWeaponParts:parts,refH:M.frames[bodyFrameKey].bh,battleMetadata:BATTLE_FEEL_ACTOR_META[bodyFrameKey],battle:{view:'march-rear',pose:semantic,gait:i,mountId}};
}
/** One body plus independent weapons. Shared by prepare and battle. */
export function drawWeaponPresentation(draw:any,v:WeaponPresentation,x:number,y:number,bodyH:number,unit:number,extra:any={}){
 const f=M.frames[v.bodyFrameKey],sc=bodyH/v.refH;
 const partDraw=(part:HeldPart)=>{
  const px=x+(part.socket[0]-f.a[0])*f.r[2]*sc,py=y+(part.socket[1]-(1-f.a[1]))*f.r[3]*sc;
  const fit=fitHeldPart(v,part,bodyH,unit);draw(part.key,px,py,fit.height,{grip:part.grip,rot:fit.rotation,role:'held_weapon',actorId:'player',alpha:extra.alpha});
  if(part.twoGrip?.supportCap){const cap=M.frames[part.twoGrip.supportCap],sx=x+(part.twoGrip.supportSocket[0]-f.a[0])*f.r[2]*sc,sy=y+(part.twoGrip.supportSocket[1]-(1-f.a[1]))*f.r[3]*sc;draw(part.twoGrip.supportCap,sx,sy,cap.r[3]*sc,{center:true,role:'hand_occlusion',actorId:'player'});}
  if(part.cap){const cap=M.frames[part.cap];draw(part.cap,px,py,cap.r[3]*sc,{center:true,role:'hand_occlusion',actorId:'player'});}
 };
 // From behind, the rider's gauntlets/cape naturally occlude forward-held weapons.
 for(const part of v.heldWeaponParts)if(part.behindBody)partDraw(part);
 const r=draw(v.bodyFrameKey,x,y,bodyH,{...extra,refH:v.refH,role:'hero_body',actorId:'player'});
 for(const part of v.heldWeaponParts)if(!part.behindBody)partDraw(part);
 return r;
}
/** Bounds include rotated held parts; no collision or attack coordinates are changed. */
export function presentationBounds(v:WeaponPresentation,bodyH:number,unit:number){
 const f=M.frames[v.bodyFrameKey],sc=bodyH/v.refH;let x0=-f.a[0]*f.r[2]*sc,x1=x0+f.r[2]*sc,y0=-(1-f.a[1])*f.r[3]*sc,y1=y0+f.r[3]*sc;
 for(const p of v.heldWeaponParts){const q=M.frames[p.key],fit=fitHeldPart(v,p,bodyH,unit),h=fit.height,w=h*q.r[2]/q.r[3],x=(p.socket[0]-f.a[0])*f.r[2]*sc,y=(p.socket[1]-(1-f.a[1]))*f.r[3]*sc,c=Math.cos(fit.rotation),s=Math.sin(fit.rotation);for(const a of [0,1])for(const b of [0,1]){const xx=(a-p.grip[0])*w,yy=(b-p.grip[1])*h,px=x+xx*c-yy*s,py=y+xx*s+yy*c;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);}}
 return{x:x0,y:y0,w:x1-x0,h:y1-y0};
}

/** Fit both actual hand sockets. Pose rotation cannot detach the support hand. */
export function fitHeldPart(v:WeaponPresentation,p:HeldPart,bodyH:number,unit:number){
 if(!p.twoGrip)return{height:p.height*unit,rotation:p.rotation};
 const f=M.frames[v.bodyFrameKey],q=M.frames[p.key],sc=bodyH/v.refH;
 const hx=(p.twoGrip.supportSocket[0]-p.socket[0])*f.r[2]*sc,hy=(p.twoGrip.supportSocket[1]-p.socket[1])*f.r[3]*sc;
 const gx=(p.twoGrip.supportGrip[0]-p.grip[0])*q.r[2],gy=(p.twoGrip.supportGrip[1]-p.grip[1])*q.r[3];
 const scale=Math.hypot(hx,hy)/Math.hypot(gx,gy);if(!(scale>0))throw Error('invalid_two_hand_fit');
 return{height:q.r[3]*scale,rotation:Math.atan2(hy,hx)-Math.atan2(gy,gx)};
}
