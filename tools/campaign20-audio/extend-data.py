from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[2]; path=root/'assets/scripts/formal/data.ts';s=path.read_text();d=json.loads((root/'docs/YILU-CAMPAIGN20-20260930/intake/campaign20.design.json').read_text())
if "'duanji'" in s or '"duanji"' in s: raise SystemExit('Campaign20 data already present; one-shot migration will not rewrite existing work.')
js=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':'))
ids=[w['id'] for w in d['new_weapons']]
s=s.replace("|'liannu';","|'liannu'|"+'|'.join(repr(i) for i in ids)+';')
config=[(.76,.15,.21,.22,'#E9C98E','shemao'),(1.16,.28,.14,.38,'#95CEE1','guandao'),(.84,.24,.12,.28,'#C1D3E8','spear'),(1.04,.26,.14,.34,'#A6C2B0','guandao'),(1.20,.46,.12,.32,'#E5C283','spear'),(1.38,.52,.12,.42,'#BDD9AC','spear')]
insert=[]
for w,v in zip(d['new_weapons'],config):
 insert.append(w['id']+':'+js(dict(label=w['label'],owner=w['owner'],cycle=v[0],wind=v[1],rel=v[2],rec=v[3],color=v[4],family=v[5])))
s=s.replace("\n};\nexport const PEOPLE",',\n '+',\n '.join(insert)+"\n};\nexport const PEOPLE",1)
s=s.replace("jiang:'姜维'};","jiang:'姜维',"+','.join(p['id']+':'+repr(p['label']) for p in d['new_people'])+'};')
tr=[t['id']+':'+js(dict(name=t['label'],slot=t['slot'],icon='c20_tr_'+t['id'],ch=t['label'][0],effect=t['effect'])) for t in d['new_treasures']]
s=s.replace("\n};\nexport type Chapter",',\n '+',\n '.join(tr)+"\n};\nexport type Chapter",1)
s=s.replace('length:number;bossHP:number','length:number;bossHP:number;gateGrowthCap?:number;firstClearXP?:number;mapPanel?:number;targetSeconds?:number[];keyMechanic?:string;bossPhases?:number')
# Keep all old chapter identity/rewards; consolidate runtime HP into Chapter from former PACING.
oldhp=[270,200,240,220,185,250,225,235,240,190]
for i,hp in enumerate(oldhp):
 pat=r"(\{id:'c%02d'.*?bossHP:)\d+"%(i+1);s=re.sub(pat,lambda m:m[1]+str(hp),s)
chap=[]
for c,hp in zip(d['chapters'][10:],[270,280,300,310,335,350,360,380,405,560]):
 x={k:c[k] for k in ['id','title','place','faction','boss','capture','visit','allies']};x.update(enemy=c['required_officers'],length=300+c['index']*7,bossHP=hp)
 if c['first_clear_weapon']:x['weapon']=c['first_clear_weapon']
 if c['first_clear_treasure']:x['treasure']=c['first_clear_treasure']
 chap.append(js(x))
s=s.replace("bossHP:190}\n];","bossHP:190},\n "+',\n '.join(chap)+'\n];')
# Design data is compiled into the runtime module; no runtime filesystem/JSON dependency.
meta=[]
for c in d['chapters']:
 meta.append(dict(gateGrowthCap=6+min(4,c['index']//4),firstClearXP=c['first_clear_xp'],mapPanel=c['map_panel'],targetSeconds=c['target_active_seconds'],keyMechanic=c['key_mechanic'],bossPhases=3 if c['index']==19 else 2 if c['index']%2 else 1))
extras='\nconst CHAPTER_META='+js(meta)+';\nCHAPTERS.forEach((c,i)=>Object.assign(c,CHAPTER_META[i]));\n'
profiles=[]
for p in d['difficulty_profiles']:
 profiles.append(dict(pair=p['pair'],ordinaryHPMultiplier=p['ordinary_hp_multiplier'],incomingDamageMultiplier=p['incoming_damage_multiplier'],waveInterval=p['nominal_wave_interval_seconds'],eliteBudget=p['elite_budget_fraction'],minimumTelegraph=p['minimum_major_telegraph_seconds'],simultaneousThreats=p['simultaneous_major_threats'],visibleEnemyCap=p['visible_enemy_design_cap']))
extras+='/** Static design values. No runtime scaling against the player. */\nexport const DIFFICULTY_PROFILES='+js(profiles)+';\nexport const difficultyFor=(chapter:number)=>DIFFICULTY_PROFILES[Math.max(0,Math.min(9,Math.floor(chapter/2)))];\n'
extras+='export const MILESTONES='+js([dict(id=m['id'],chapter=m['chapter'],title=m['title'],xpBonus=m['xp_bonus'],badge=m['unlock_badge'],primaryContent=m['primary_new_content'],special=m['special']) for m in d['milestones']])+';\nexport const milestoneFor=(chapter:number)=>MILESTONES.find(m=>m.chapter===chapter+1);\n'
extras+='export const MAP_PANELS='+js(d['map']['panels'])+';\n'
s=s.replace("export const RANKS",extras+'export const RANKS')
s=s.replace("marchSeconds:[65,66,64,54,52,56,56,54,54,50],bossHP:[270,200,240,220,185,250,225,235,240,190],officerHP:[0,0,0,165,95,170,180,190,195,115]","marchSeconds:[65,66,64,54,52,56,56,54,54,50,72,74,76,78,80,82,88,90,92,108],bossHP:CHAPTERS.map(c=>c.bossHP),officerHP:[0,0,0,165,95,170,180,190,195,115,140,150,160,170,180,190,200,210,220,230]")
s=s.replace("formation?:'pair'|'triple'|'stagger'|'guard'|'line';elite?:boolean","formation?:'pair'|'triple'|'stagger'|'guard'|'line';elite?:boolean;growthCap?:number;enemyKind?:'light'|'guard'|'shield'|'archer'|'cavalry'|'banner'|'mechanism';choiceId?:string;choiceRole?:'safe'|'challenge';rewardXP?:number")
s=s.replace('routeFor(chapter:number,weapons:string[],treasures:string[])','routeFor(chapter:number,weapons:string[],treasures:string[],startWeaponId?:string)')
s=s.replace("const l=CHAPTERS[chapter],pool=weapons.filter(w=>w!=='spear'),w=pool[Math.min(chapter,pool.length-1)]||'spear';","const l=CHAPTERS[chapter],owned=weapons.filter(w=>!!WEAPON_DATA[w]),start=owned.includes(startWeaponId||'')?startWeaponId!:'spear',pool=owned.filter(w=>w!==start),w=pool[Math.min(chapter,pool.length-1)]||start;")
s=s.replace("t+=chapter<3?3.8:3.5","t+=difficultyFor(chapter).waveInterval")
s=s.replace("gives:i?w:'spear'","gives:i===1?w:start")
s=s.replace("type:'gates',vals:[a,b]","type:'gates',vals:[a,b],growthCap:l.gateGrowthCap")
s=s.replace("type:'gates',vals:[1,-5],fixed:true","type:'gates',vals:[1,-5],fixed:true,growthCap:0")
# Explicit meaningful choices away from walls. Each side has a visible supply with guards at challenge side.
s=s.replace(" return route.sort",''' // Two paired supply decisions; challenge guards must be cleared before the larger supply.
 [23,39].forEach((t,i)=>{
  const side=i?-.55:.55,id=l.id+':choice:'+i;
  route.push({d:at(t),type:'crate',x:-side,kind:'grain',n:4,choiceId:id,choiceRole:'safe'});
  route.push({d:at(t),type:'crate',x:side,kind:'grain',n:9,choiceId:id,choiceRole:'challenge',rewardXP:2});
  route.push({d:at(t-2),type:'squad',x:side,n:3+Math.floor(chapter/4),formation:'guard',elite:true,enemyKind:chapter>=12?'shield':chapter>=4?'guard':'light',choiceId:id,choiceRole:'challenge'});
 });
 // Ordinary light troops remain the majority. The marked ranks introduce visible tactical threats.
 const kinds:RouteEvent['enemyKind'][]=chapter<2?['light']:chapter<4?['archer','shield']:chapter<6?['banner','shield']:chapter<8?['archer','guard']:chapter<10?['cavalry','banner']:chapter<14?['shield','cavalry','banner']:chapter<16?['archer','guard']:['mechanism','shield','archer','cavalry'];
 let waveIndex=0;for(const e of route){if(e.type==='squad'&&!e.enemyKind){e.enemyKind=waveIndex%3===2?kinds[Math.floor(waveIndex/3)%kinds.length]:'light';waveIndex++;}}
 return route.sort''')
# avoid pretending new scenario stories are historical facts
newprofiles=','.join(p['id']+':'+js(['',p['role'],'本作架空',p['ability_design']]) for p in d['new_people'])
s=s.replace("jiang:['伯约','麒麟儿','史载','继承北伐事业，多次出兵陇右。']","jiang:['伯约','麒麟儿','史载','继承北伐事业，多次出兵陇右。'],"+newprofiles)
styles={p['id']:dict(family='spear',label=p['role'],color='#D4D8C6',wide=.7) for p in d['new_people'] if p['relation']=='capture'}
for k,f,w in [('taishici','shemao',.65),('ganning','guandao',1.65),('zhanghe','spear',.6),('weiyan','guandao',1.25)]:styles[k].update(family=f,wide=w)
s=s.replace("\n};\nexport function personRole",',\n '+',\n '.join(k+':'+js(v) for k,v in styles.items())+"\n};\nexport function personRole")
roles={p['id']:({'capture':'随军：','visit':'支援：','allies':'盟约：'}[p['relation']]+p['ability_design']) for p in d['new_people']}
s=s.replace("export function personRole(id:string){","export const NEW_PERSON_ROLES:Record<string,string>="+js(roles)+";\nexport function personRole(id:string){\n if(NEW_PERSON_ROLES[id])return NEW_PERSON_ROLES[id];")
actors=dict(jiao='spear',dong='guding',yuan='yitian',hua='spear',lubu='huaji',diao='shuanggu',dian='shuangji',xu='guding',cao='yitian',liao='huaji',xiahou='guding',guo='liannu',xun='liannu',sunjian='guding',sunce='shemao',sunquan='yitian',lumeng='spear',zhou='liannu',luxun='guding',sunxiang='yanlinggong',zhao='qinggang',zhang='shemao',guan='guandao',huang='yanlinggong',liu='shuanggu',zhuge='liannu',sima='liannu',machao='spear',pang='liannu',jiang='shemao',taishici='duanji',ganning='tiesuodao',lusu='liannu',zhanghe='goulianqiang',caoren='dundao',xiahouyuan='yanlinggong',weiyan='guandao',zhangren='goulianqiang',dengai='spear',huangyueying='jiguannu',zhonghui='yitian',lukang='dundao')
s+='\n/** Explicit sourceActorId → weapon identity; no silent default for registered people. */\nexport const ACTOR_WEAPONS:Record<string,WeaponId>='+js(actors)+';\n'
path.write_text(s)
p=root/'assets/scripts/formal/WeaponSfx.ts';s=p.read_text().replace("liannu:'liannu'}","liannu:'liannu',"+','.join(i+':'+repr(i) for i in ids)+'}');p.write_text(s)
