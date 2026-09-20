import {Node, Sprite, SpriteFrame, Texture2D, UITransform, Layers, resources, Rect, Vec2, Size} from 'cc';
import {HERO_FRAMES} from './HeroAtlas';
import {gaitKeys,keyPose} from './Presentation';
type Part=keyof typeof HERO_FRAMES;
export type Pose='idle'|'walk'|'shoot'|'promote';
/** One candidate rig. UV crops preserve original alpha; feet are the shared origin. */
export class HeroRig {
 static frames:Partial<Record<Part,SpriteFrame>>={};static ready=false;
 static load(){return new Promise<void>((resolve,reject)=>resources.load('v2/hero-a-rig/texture',Texture2D,(e,t)=>{if(e){reject(e);return;}for(const name of Object.keys(HERO_FRAMES) as Part[]){const [x,y,w,h]=HERO_FRAMES[name];const f=new SpriteFrame();f.texture=t;f.rect=new Rect(x,y,w,h);f.originalSize=new Size(w,h);f.offset=new Vec2(0,0);HeroRig.frames[name as Part]=f;}HeroRig.ready=true;resolve();}));}
 readonly node:Node;private parts:Record<string,Node>={};private upperL:Node;private upperR:Node;private foreL:Node;private foreR:Node;
 constructor(parent:Node){this.node=this.make('candidate-A',parent);this.part('flag',this.node,.27,.89,.21,.86,.5,0);this.part('legL',this.node,-.085,.33,.115,.33,.5,1);this.part('legR',this.node,.085,.33,.115,.33,.5,1);this.part('cloth',this.node,0,.28,.39,.46,.5,0);this.part('leader',this.node,0,.28,.39,.46,.5,0);this.upperL=this.part('upperL',this.node,-.16,.7,.13,.20,.5,1);this.foreL=this.part('foreL',this.upperL,0,-.17,.1,.19,.5,1);this.part('bow',this.foreL,0,-.16,.22,.65,.55,.5);this.part('arrow',this.foreL,.02,-.08,.035,.42,.5,.5);this.upperR=this.part('upperR',this.node,.16,.7,.13,.20,.5,1);this.foreR=this.part('foreR',this.upperR,0,-.17,.10,.19,.5,1);this.part('head',this.node,0,.73,.245,.245,.5,0);}
 private make(name:string,parent:Node){const n=new Node(name);n.layer=Layers.Enum.UI_2D;parent.addChild(n);n.addComponent(UITransform);return n;}
 private part(name:Part,parent:Node,x:number,y:number,w:number,h:number,ax:number,ay:number){const n=this.make(name,parent);n.setPosition(x*100,y*100);const u=n.getComponent(UITransform)!;u.setAnchorPoint(ax,ay);u.setContentSize(w*100,h*100);const s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.spriteFrame=HeroRig.frames[name]||null;this.parts[name]=n;return n;}
 render(x:number,y:number,height:number,time:number,pose:Pose,rank:boolean,shotAge=10){this.node.active=true;this.node.setPosition(x,y);this.node.setScale(height/100,height/100,1);const promoting=pose==='promote';const promoted=rank||(promoting&&time>=.7);this.parts.cloth.active=!promoted;this.parts.leader.active=promoted;this.parts.flag.active=rank||(promoting&&time>=.35);this.parts.flag.setPosition(32,14+(promoting?Math.min(0,(time-.85)*90):0));this.parts.flag.angle=promoting?Math.max(0,1.2-time)*-18:0;
  const walking=pose==='walk'||pose==='shoot';this.parts.legL.angle=walking?keyPose(gaitKeys,time/.76):0;this.parts.legR.angle=walking?keyPose(gaitKeys,time/.76+.5):0;
  this.parts.arrow.active=pose==='shoot'?(time%.25)<.17:shotAge<.17;
  const cycle=pose==='shoot'?(time%.25)/.25:Math.min(1,shotAge/.25);
  this.upperL.angle=-18;this.foreL.angle=18;
  this.upperR.angle=pose==='shoot'||shotAge<.25?keyPose([-38,-68,-82,-30],cycle):-8;this.foreR.angle=pose==='shoot'||shotAge<.25?keyPose([-35,-65,-30,-18],cycle):-12;
  if(promoted||(promoting&&time>=.35)){const reach=promoting?Math.min(1,Math.max(0,(time-.35)/.5)):1;this.upperR.angle=-8+28*reach;this.foreR.angle=-12-8*reach;}
 }
 /** Bounds in design pixels, including animated arms, bow and flag, read-only. */
 bounds(){const out={left:Infinity,right:-Infinity,bottom:Infinity,top:-Infinity};for(const key of Object.keys(this.parts)){const n=this.parts[key];if(!n.activeInHierarchy)continue;const r=n.getComponent(UITransform)!.getBoundingBoxToWorld();out.left=Math.min(out.left,r.x);out.right=Math.max(out.right,r.x+r.width);out.bottom=Math.min(out.bottom,r.y);out.top=Math.max(out.top,r.y+r.height);}return out;}
}
