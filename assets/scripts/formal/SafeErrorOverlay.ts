import {Node,Layers,UITransform,Label,Graphics,Color} from 'cc';
/** Texture-independent recovery surface. Never shares the failed world's retained pool. */
export class SafeErrorOverlay {
 private root:Node;private background:Graphics;private labels:Label[]=[];
 constructor(parent:Node){this.root=new Node('SafeErrorOverlay');this.root.layer=Layers.Enum.UI_2D;parent.addChild(this.root);this.root.addComponent(UITransform);this.background=this.root.addComponent(Graphics);this.root.active=false;}
 hide(){this.root.active=false;}
 show(size:{W:number;H:number;k:number},message:string,busy=false){
  this.root.active=true;this.root.setScale(size.k,size.k,1);const {W,H}=size,g=this.background;g.clear();g.fillColor=new Color(12,24,36,255);g.rect(-W/2,-H/2,W,H);g.fill();
  const rows=[['画面异常，战斗已暂停',H*.32,21],['进度已保留，恢复前不会继续战斗',H*.32+36,14],[message.slice(0,66),H*.32+73,12],[busy?'正在检查资源…':'重新载入并恢复',H*.56+24,17],['返回营地',H*.56+88,17]] as const;
  while(this.labels.length<rows.length){const n=new Node('safe-text');n.layer=Layers.Enum.UI_2D;this.root.addChild(n);n.addComponent(UITransform);const l=n.addComponent(Label);l.fontFamily='Arial';l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;l.overflow=Label.Overflow.CLAMP;l.enableWrapText=true;this.labels.push(l);}
  for(const y of [H*.56,H*.56+64]){g.fillColor=new Color(38,65,86,255);g.roundRect(-W/2+24,H/2-y-48,W-48,48,6);g.fill();}
  rows.forEach(([text,y,font],i)=>{const l=this.labels[i];l.string=text;l.fontSize=font;l.lineHeight=font+4;l.color=new Color(244,234,208,255);l.node.getComponent(UITransform)!.setContentSize(W-40,46);l.node.setPosition(0,H/2-y);});
 }
 destroy(){this.root.destroy();}
}
