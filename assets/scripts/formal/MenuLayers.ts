import {Node,Layers,UITransform,Mask,Label,UIOpacity} from 'cc';
import {NativePaint} from './NativePaint';
import {UIRect} from './UIComponents';

/** Menu-only stencil. Battle's paint, textures and coordinate path are not changed. */
export class MenuLayers {
 readonly fixed:NativePaint;readonly content:NativePaint;readonly overlay:NativePaint;
 private fixedRoot:Node;private viewportRoot:Node;private coordinateRoot:Node;private overlayRoot:Node;
 private measureRoot:Node;private measureLabel:Label;private textWidths=new Map<string,number>();
 viewport:UIRect={x:0,y:0,w:1,h:1};private size={W:1,H:1};private open=false;
 constructor(parent:Node){
  const make=(name:string,root=parent)=>{const n=new Node(name);n.layer=Layers.Enum.UI_2D;root.addChild(n);n.addComponent(UITransform);return n;};
  this.fixedRoot=make('MenuFixed');this.viewportRoot=make('MenuViewport');
  const mask=this.viewportRoot.addComponent(Mask);mask.type=Mask.Type.GRAPHICS_RECT;
  this.coordinateRoot=make('MenuScreenCoordinates',this.viewportRoot);this.overlayRoot=make('MenuModal');
  this.fixed=new NativePaint(this.fixedRoot);this.content=new NativePaint(this.coordinateRoot);this.overlay=new NativePaint(this.overlayRoot);
  this.measureRoot=make('MenuTextMeasure');this.measureRoot.addComponent(UIOpacity).opacity=0;this.measureLabel=this.measureRoot.addComponent(Label);
  this.measureLabel.fontFamily='Arial';this.measureLabel.isBold=true;this.measureLabel.overflow=Label.Overflow.NONE;
  this.viewportRoot.active=false;
 }
 /** Match NativePaint's 2x glyph rasterization, measured by Cocos' real font renderer. */
 measure(text:string,size:number){if(!text)return 0;const key=size+':'+text,cached=this.textWidths.get(key);if(cached!==undefined)return cached;
  const l=this.measureLabel;l.fontSize=size*2;l.lineHeight=size*3;l.string=text;l.updateRenderData(true);
  const width=this.measureRoot.getComponent(UITransform)!.width/2;if(!Number.isFinite(width)||width<=0)throw Error('menu_font_measure_failed');
  if(this.textWidths.size>=1024)this.textWidths.clear();this.textWidths.set(key,width);return width;
 }
 begin(size:{W:number;H:number}){this.size=size;this.open=true;this.viewportRoot.active=false;for(const p of this.paints)p.begin(size);}
 setViewport(r:UIRect){
  if(!this.open)throw Error('menu viewport outside frame');this.viewport={...r};
  const u=this.viewportRoot.getComponent(UITransform)!;u.setAnchorPoint(.5,.5);u.setContentSize(r.w,r.h);
  // NativePaint emits screen -> centered Cocos coordinates once. Offset its parent by the
  // inverse stencil-center translation, preserving those coordinates beneath the mask.
  const x=r.x+r.w/2-this.size.W/2,y=this.size.H/2-r.y-r.h/2;
  this.viewportRoot.setPosition(x,y);this.coordinateRoot.setPosition(-x,-y);this.viewportRoot.active=true;
 }
 private get paints(){return[this.fixed,this.content,this.overlay];}
 commit(){for(const p of this.paints)p.end();this.open=false;}
 abort(){for(const p of this.paints)p.abortFrame();this.viewportRoot.active=false;this.open=false;}
 get diagnostics(){return{viewport:this.viewport,maskActive:this.viewportRoot.active,layers:this.paints.map(p=>({active:p.activeNodes,created:p.createdNodes,committed:p.lastFrameCommitted,generation:p.generation,aborted:p.abortedFrames,submissions:p.submissions.length,resourceErrors:p.resourceErrors})),clipRoots:1};}
 destroy(){this.abort();for(const p of this.paints)p.destroy();this.textWidths.clear();this.measureRoot.destroy();this.fixedRoot.destroy();this.viewportRoot.destroy();this.overlayRoot.destroy();}
}
