/* UI-01 design source. Window logical units, top-left origin. No game model code. */
const THEME={ink:'#19363d',deep:'#112b32',paper:'#f4ecd9',gold:'#d8b879',red:'#a94030',muted:'#bfc9be',line:'#657c75',gain:'#226659'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function shape(x,y,w,h,fill=THEME.ink,id='',extra=''){return `<path ${id?`id="${id}"`:''} d="M${x+5} ${y}H${x+w-5}L${x+w} ${y+5}V${y+h-5}L${x+w-5} ${y+h}H${x+5}L${x} ${y+h-5}V${y+5}Z" fill="${fill}" ${extra}/>`;}
function text(t,x,y,size=14,color=THEME.paper,weight=500,anchor='start',extra=''){return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(t)}</text>`;}
function icon(name,x,y,s=20,color=THEME.gold){const p={flag:'M5 2v21M5 3h15l-4 6 4 5H5',spear:'M4 22 20 3M17 3l4-2-1 5M10 16l-3-3',blade:'M5 23l5-7M8 17C20 15 22 7 21 2C18 9 12 10 8 12l-2 4M5 14l6 6',axe:'M5 23 18 3M9 4c5 0 8 5 8 9l6-5C20 4 14 0 9 4Z',gear:'M8 3h8l1 4 4 2v6l-4 2-1 4H8l-1-4-4-2V9l4-2Z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',replay:'M5 6a9 9 0 1 1-2 11M2 2v7h7',arrow:'M3 12h18M15 6l6 6-6 6',pause:'M8 5v14M16 5v14',check:'M4 12l5 5L20 6',star:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z'}[name]||'M12 3v18M3 12h18';return `<g transform="translate(${x} ${y}) scale(${s/24})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"> <path d="${p}"/></g>`;}
function uiDesign(f,state='home',options={}){
 const W=f.width,H=f.height,short=H<700,S=f.safeArea,M=f.capsule,pad=16,T=Math.max(S.top,M?M.bottom:S.top)+8,B=S.bottom-16,R=W-16;const spec={fixture:f.id,state,width:W,height:H,top:T,bottom:B,critical:[],hits:[],labels:[],worldProtected:[]};
 const rect=(id,x,y,w,h,kind='critical')=>spec[kind].push({id,x,y,width:w,height:h});
 const tx=(id,t,x,y,size=14,color=THEME.paper,weight=500,anchor='start')=>{const width=Math.max(size,String(t).split('').reduce((n,c)=>n+(/[\x00-\xff]/.test(c)?size*.57:size),0)),left=anchor==='middle'?x-width/2:anchor==='end'?x-width:x;rect(id,left,y-size,width,size+3);return text(t,x,y,size,color,weight,anchor,`data-critical="${id}"`);};
 const btn=(id,label,x,y,w,h=52,primary=false)=>{rect(id,x,y,w,h,'hits');return `<g data-action="${id}" role="button" aria-label="${esc(label)}" tabindex="0">${shape(x,y,w,h,primary?THEME.red:THEME.ink)}${primary?`<path d="M${x+12} ${y+h-3}H${x+w-12}" stroke="#cc7860"/>`:''}${tx(id+'-label',label,x+w/2,y+h/2+6,primary?19:14,THEME.paper,600,'middle')}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/></g>`;};
 const srcState=state==='home'?'home':state==='run'?'run':state==='boss'?'boss':'awaken',key=`${srcState}-${W}x${Math.round(H)}`,bg=DATA.images[key];
 let parts=`<image id="FullBleedWorld" data-world-key="${key}" x="0" y="0" width="${W}" height="${H}" href="${bg}"/>`;
 const cap=DATA.captures.find(c=>c.state===srcState&&c.width===W&&c.height===Math.round(H));
 if(state!=='home'){spec.worldProtected=cap.bounds.filter(b=>/^(battle|friend|companion|boss)/.test(b.id)).map(b=>({id:b.id,x:b.left,y:b.top,width:b.right-b.left,height:b.bottom-b.top}));}
 parts+='<g id="SafeUIRoot">';
 if(state==='home'){
  parts+=`<defs><linearGradient id="homeShade" x2="0" y2="1"><stop stop-color="#112b32" stop-opacity=".92"/><stop offset=".27" stop-color="#112b32" stop-opacity=".83"/><stop offset=".42" stop-color="#112b32" stop-opacity=".10"/><stop offset=".57" stop-color="#112b32" stop-opacity=".10"/><stop offset=".73" stop-color="#112b32" stop-opacity=".96"/><stop offset="1" stop-color="#112b32"/></linearGradient></defs><rect id="HomeTone" width="${W}" height="${H}" fill="url(#homeShade)"/>`;
  const titleY=T+(short?66:71),secY=B-44,primaryY=secY-16-56,missionY=primaryY-68;
  parts+=`<path d="M${W/2-42} ${T+11}h-17M${W/2+42} ${T+11}h17" stroke="${THEME.gold}" opacity=".6"/>`+tx('chapter','荆州立足',short?pad:W/2,T+16,12,THEME.gold,600,short?'start':'middle');
  parts+=tx('wordmark','一路长歌',short?pad:W/2,titleY,short?36:44,THEME.paper,700,short?'start':'middle').replace('data-critical="wordmark"','font-family="Songti SC, STSong, serif" letter-spacing="3" data-critical="wordmark"');
  parts+=tx('subtitle','三  国',short?pad:W/2,titleY+40,18,THEME.gold,600,short?'start':'middle');
  const mode=options.homeMode||'resume',modes={new:['无名小卒','乱军突围','出征'],resume:['领队','夺粮立营','继续征程'],pending:['领队','整军待发','继续整军'],completed:['白石驻将','白石已定','返回驻地']},m=modes[mode];
  parts+=`<path d="M${pad} ${missionY}h24" stroke="${THEME.gold}" stroke-width="2"/>`+tx('identity',m[0]+' · '+(mode==='pending'?'战后整备':'当前征程'),pad,missionY+14,12,THEME.muted);
  parts+=tx('objective',m[1],pad,missionY+49,23,THEME.paper,600)+tx('chapter-counter',mode==='completed'?'三战告捷':mode==='new'?'第一战':'第二战',R,missionY+45,12,THEME.gold,500,'end');
  parts+=btn('start',m[2],pad,primaryY,W-32,56,true)+icon('arrow',R-34,primaryY+17,22,THEME.paper);
  const actions=mode==='new'?[['chapters','重玩关卡','replay'],['settings','设置','gear']]:[['loadout','整备队伍','flag'],['chapters','重玩关卡','replay'],['settings','设置','gear']];const sw=(W-32-8*(actions.length-1))/actions.length;
  actions.forEach(([id,label,ic],i)=>{const x=pad+i*(sw+8);rect(id,x,secY,sw,44,'hits');parts+=`<g data-action="${id}" role="button" aria-label="${label}" tabindex="0"><rect x="${x}" y="${secY}" width="${sw}" height="44" rx="3" fill="#ffffff" fill-opacity=".055"/>${icon(ic,x+9,secY+13,18,THEME.muted)}${tx(id+'-text',label,x+33,secY+27,12,THEME.paper)}<rect x="${x}" y="${secY}" width="${sw}" height="44" fill="transparent"/></g>`;});
  if(options.message==='save'){parts+=shape(pad,missionY-43,W-32,30,'#f4ecd9')+tx('save-failure','本机暂时无法保存，本次仍可继续。',W/2,missionY-23,13,THEME.red,600,'middle');}
 }else{
  const count=options.count??(state==='run'?24:state==='boss'?48:256),flank=short&&state==='run',cw=102,stageX=pad+cw+12,stageW=R-44-12-stageX;
  parts+=`<path d="M16 ${T}H${16+cw}V${T+43}L${16+cw-8} ${T+48}H16Z" fill="${THEME.ink}"/><path d="M16 ${T+2}v39" stroke="${THEME.gold}" stroke-width="3"/>`;
  parts+=tx('troop-label','兵力',26,T+18,12,THEME.muted)+tx('troop-count',count,16+cw-10,T+40,30,THEME.paper,700,'end');
  const sx=flank?pad:stageX,sy=flank?T+54:T,sw=flank?cw:stageW;
  parts+=shape(sx,sy,sw,44,THEME.ink,'JourneyOrBoss');
  if(state==='run'){parts+=tx('stage-name','夺粮立营',sx+8,sy+16,13,THEME.paper,600)+tx('progress','行路 10%',sx+8,sy+37,12,THEME.muted);parts+=`<path d="M${sx+8} ${sy+43}h${sw-16}" stroke="#48615c" stroke-width="2"/><path d="M${sx+8} ${sy+43}h${(sw-16)*.1}" stroke="${THEME.gold}" stroke-width="2"/>`;}
  else{parts+=tx('boss-name','陈应',sx+8,sy+17,14,THEME.paper,650)+tx('boss-hp','1361 / 1800',sx+sw-8,sy+33,12,THEME.muted,500,'end');parts+=`<path d="M${sx+8} ${sy+43}h${sw-16}" stroke="#647069" stroke-width="3"/><path d="M${sx+8} ${sy+43}h${(sw-16)*1361/1800}" stroke="#de8b69" stroke-width="3"/>`;}
  rect('pause',R-44,T,44,44,'hits');parts+=`<g data-action="pause" aria-label="暂停" role="button" tabindex="0">${shape(R-44,T,44,44,THEME.ink)}${icon('pause',R-34,T+10,24,THEME.paper)}<rect x="${R-44}" y="${T}" width="44" height="44" fill="transparent"/></g>`;
  const rowY=flank?T+54:T+54,weaponX=flank?R-114:pad,weaponW=flank?114:84;
  parts+=shape(weaponX,rowY,weaponW,24,THEME.ink)+icon(state==='run'?'spear':'blade',weaponX+6,rowY+3,18)+tx('weapon',state==='run'?'长枪 Ⅰ':'长刀 Ⅲ',weaponX+29,rowY+17,12);
  const remaining=options.awakeRemaining??4.2,awake=state==='awaken'&&remaining>0;if(awake){const ax=pad+92,aw=100;parts+=shape(ax,rowY,aw,24,'#785324')+`<circle cx="${ax+13}" cy="${rowY+12}" r="7" fill="none" stroke="#d8b879" stroke-width="2" stroke-dasharray="${(remaining/6*44).toFixed(1)} 44" transform="rotate(-90 ${ax+13} ${rowY+12})"/>`+tx('auto-awaken','觉醒 '+remaining.toFixed(1)+'秒',ax+25,rowY+17,12,THEME.paper,600);}
  const companion=options.companion||(awake?'zhao':'xing'),names={xing:'邢道荣随军',zhao:'赵云同行助阵',standby:'邢道荣 · 待命',none:''},cx=flank?R-128:awake?pad+200:R-152,cy=flank?rowY+32:rowY,cw2=R-cx;
  if(companion!=='none'){parts+=shape(cx,cy,cw2,24,THEME.ink)+icon('flag',cx+5,cy+4,16,companion==='standby'?THEME.muted:THEME.gold)+tx('companion',names[companion],cx+25,cy+17,12,companion==='standby'?THEME.muted:THEME.paper);}
  // World labels retain actor anchors. Only their display rectangles can move.
  if(state==='run'){
   const obstacles=cap.obstacles;const placed=[];
   for(const o of obstacles){const b=cap.bounds.find(b=>b.id==='ob'+o.id);if(!b)continue;const rock=o.kind==='rock',w=rock?118:82,h=rock?28:26;let x=rock?Math.max(pad,b.left-w-10):b.right+10,y=Math.max(T+84,rock?b.bottom+8:b.top+3);if(flank)y=Math.max(T+(rock?114:142),y);if(x+w>R)x=R-w;
    const label=`${rock?'山石 · ':''}碰撞 −${o.loss}`;parts+=`<path d="M${x+w/2} ${y+h/2}L${(b.left+b.right)/2} ${b.bottom}" stroke="${THEME.ink}" stroke-opacity=".8" stroke-width="1"/>`+shape(x,y,w,h,rock?'#553f36':THEME.ink)+tx('loss-'+o.id,label,x+w/2,y+h/2+4,12,THEME.paper,600,'middle');rect('loss-'+o.id,x,y,w,h,'labels');placed.push({x,y,w,h});
    if(!rock){let ex=Math.min(R-58,b.right+10),ey=Math.max(T+84,b.top-32);if(flank)ey=T+114;parts+=shape(ex,ey,58,22,THEME.ink)+`<path d="M${ex+9} ${ey+4}l6 6-6 6-6-6Z" fill="${THEME.gold}"/>`+tx('elite-'+o.id,'精锐',ex+20,ey+15,12,THEME.paper)+`<path d="M${ex+5} ${ey+20}h48" stroke="#d78063" stroke-width="3"/>`;rect('elite-'+o.id,ex,ey,58,22,'labels');}
   }
  }
  const msg=options.message||(awake?'danger':state==='run'?'gather':'none');
  if(msg!=='none'){
   const texts={danger:'飞叉将至 · 命中 −12',gather:'兵力 +12',growth:'长刀升至 Ⅲ 阶',long:'碰撞山石 · 损失 12 人',save:'本机暂时无法保存，本次仍可继续。'};const label=texts[msg],w=msg==='gather'?116:W-64,y=state==='run'?B-64:B-32;
   parts+=shape((W-w)/2,y,w,32,msg==='danger'||msg==='long'?'#73382d':msg==='gather'?THEME.gain:THEME.ink)+tx('battle-notice',label,W/2,y+21,14,THEME.paper,600,'middle');
  }
  if(state==='run'){parts+=tx('tutorial','左右移动 · 主将近战，弓兵自动齐射',W/2,B-11,12,THEME.ink,600,'middle');}
 }
 parts+='</g>';
 if(options.platform!==false){parts+='<g id="PlatformOcclusion" pointer-events="none">';if(S.top>=50){parts+=`<rect x="${W/2-61}" y="14" width="122" height="35" rx="18" fill="#080c0d"/>`;}else if(S.top>0){parts+=`<rect width="${W}" height="${S.top}" fill="#000" opacity=".04"/>`;}
  if(M){parts+=`<rect x="${M.left}" y="${M.top}" width="${M.right-M.left}" height="${M.bottom-M.top}" rx="${(M.bottom-M.top)/2}" fill="#163039" fill-opacity=".5" stroke="#fff" stroke-opacity=".22"/><g fill="white"><circle cx="${M.left+16}" cy="${(M.top+M.bottom)/2}" r="2"/><circle cx="${M.left+24}" cy="${(M.top+M.bottom)/2}" r="2.6"/><circle cx="${M.left+32}" cy="${(M.top+M.bottom)/2}" r="2"/></g><path d="M${M.right-37} ${M.top+8}v${M.bottom-M.top-16}" stroke="white" opacity=".35"/><circle cx="${M.right-19}" cy="${(M.top+M.bottom)/2}" r="7" fill="none" stroke="white" stroke-width="1.8"/>`;}
  if(H-S.bottom>0)parts+=`<rect x="${W/2-56}" y="${H-10}" width="112" height="4" rx="2" fill="${state==='home'?'#c9d2c7':'#172d34'}"/>`;parts+='</g>';
 }
 if(options.debug){parts+=`<g id="LayoutGuides" pointer-events="none"><rect x="${S.left}" y="${S.top}" width="${S.right-S.left}" height="${S.bottom-S.top}" fill="none" stroke="#ff35c5" stroke-dasharray="4 4"/>${spec.hits.map(h=>`<rect x="${h.x}" y="${h.y}" width="${h.width}" height="${h.height}" fill="#26e6ea" opacity=".15" stroke="#26e6ea"/>`).join('')}</g>`;}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:PingFang SC,Microsoft YaHei,system-ui,sans-serif;font-variant-numeric:tabular-nums" data-state="${state}"><title>一路长歌 UI-01 ${state} · 合成设计稿</title>${parts}</svg>`;
 return{svg,spec};
}
