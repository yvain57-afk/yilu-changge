import { Color, Graphics, Layers, Node, UITransform } from 'cc';

type Panel = {node:Node;layers:Graphics[];signature:string};
const panels=new WeakMap<Node,Map<string,Panel>>();
const color=(hex:string)=>new Color().fromHEX(hex);
/** Independent filled silhouettes avoid relying on mixed Graphics fill/stroke path retention. */
function rounded(g:Graphics,w:number,h:number,r:number,fill:string,y=0){g.clear();g.fillColor=color(fill);g.roundRect(-w/2,y-h/2,w,h,Math.max(0,Math.min(r,w/2,h/2)));g.fill();}
function light(hex:string){const s=hex.replace('#',''),r=parseInt(s.slice(0,2),16),g=parseInt(s.slice(2,4),16),b=parseInt(s.slice(4,6),16);return r*.299+g*.587+b*.114>145;}
/** x/y/w/h are the same parent-local rectangle used by the button/card hit area. */
export function ornamentPanel(parent:Node,id:string,x:number,y:number,w:number,h:number,fill='#1E2F46',radius=12):Node {
 let pool=panels.get(parent);if(!pool){pool=new Map();panels.set(parent,pool);}let p=pool.get(id);
 if(!p||!p.node.isValid||p.node.parent!==parent){const node=new Node(id);node.layer=Layers.Enum.UI_2D;node.addComponent(UITransform).setAnchorPoint(.5,.5);parent.addChild(node);const layers:Graphics[]=[];for(const name of ['metal-dark-edge','metal-light','inner-shadow','panel-face','corner-marks']){const child=new Node(name);child.layer=Layers.Enum.UI_2D;child.addComponent(UITransform).setAnchorPoint(.5,.5);node.addChild(child);layers.push(child.addComponent(Graphics));}p={node,layers,signature:''};pool.set(id,p);}
 const node=p.node;node.active=true;node.setPosition(x,y);node.getComponent(UITransform)!.setContentSize(w,h);const signature=`${w}:${h}:${fill}:${radius}`;
 if(p.signature!==signature){const [outer,gold,inset,face,ornament]=p.layers,cream=light(fill);rounded(outer,w,h,radius,cream?'#6E542E':'#0A1726');rounded(gold,Math.max(1,w-2),Math.max(1,h-2),radius-1,'#D4B06A');rounded(inset,Math.max(1,w-7),Math.max(1,h-7),radius-3,cream?'#B18D51':'#887044');rounded(face,Math.max(1,w-10),Math.max(1,h-10),radius-4,fill);
  // Small corner studs are real filled paths on their own layer, not faint strokes hidden behind a fill.
  ornament.clear();ornament.fillColor=color(cream?'#9D783D':'#D4B06A');if(w>=70&&h>=36){for(const side of [-1,1]){const cx=side*(w/2-10),cy=h/2-10;ornament.moveTo(cx,cy+2);ornament.lineTo(cx+2,cy);ornament.lineTo(cx,cy-2);ornament.lineTo(cx-2,cy);ornament.close();}ornament.fill();}p.signature=signature;
 }
 return node;
}
/** Cache is keyed by parent and node id; removing/destroying a page permits garbage collection. */
export class OrnamentPanel {
 draw(parent:Node,id:string,x:number,y:number,w:number,h:number,fill='#1E2F46',radius=12){return ornamentPanel(parent,id,x,y,w,h,fill,radius);}
}
