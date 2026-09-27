import {Node,Sprite,SpriteFrame,Texture2D,Rect,Size,UITransform} from 'cc';
type Quad={x0:number;x1:number;y0:number;y1:number;u0:number;u1:number;v:number};
/** Native UI textured mesh, following Cocos 3.8.8 Simple sprite assembler.
 * One retained mesh per texture instead of hundreds of mutable SpriteFrames. */
export class GroundMesh {
 private assembler:any;private sprite:Sprite;private frame:SpriteFrame;private quads:Quad[]=[];private capacity=0;
 constructor(node:Node){this.sprite=node.addComponent(Sprite);this.sprite.sizeMode=Sprite.SizeMode.CUSTOM;this.frame=new SpriteFrame();const self=this;
 const assembler:any={
 createData(s:any){const r=s.requestRenderData();r.dataLength=self.capacity*4;r.resize(self.capacity*4,self.capacity*6);const idx=new Uint16Array(self.capacity*6);for(let i=0;i<self.capacity;i++)idx.set([i*4,i*4+1,i*4+2,i*4+1,i*4+3,i*4+2],i*6);r.chunk.setIndexBuffer(idx);return r;},
 updateRenderData(s:any){const r=s.renderData;if(!r||!s.spriteFrame)return;const vb=r.chunk.vb,stride=r.floatStride;for(let i=0;i<self.capacity;i++){const q=self.quads[i]||{x0:0,x1:0,y0:0,y1:0,u0:0,u1:0,v:0};const pts=[[q.x0,q.y0,q.u0,q.v],[q.x1,q.y0,q.u1,q.v],[q.x0,q.y1,q.u0,q.v],[q.x1,q.y1,q.u1,q.v]];for(let j=0;j<4;j++){const n=i*4+j,d=r.data[n],p=pts[j],o=n*stride;d.x=p[0];d.y=p[1];vb[o+3]=p[2];vb[o+4]=p[3];vb[o+5]=vb[o+6]=vb[o+7]=vb[o+8]=1;}}r.vertDirty=true;r.updateRenderData(s,s.spriteFrame);},
 fillBuffers(s:any){const r=s.renderData;if(!r)return;const chunk=r.chunk,vb=chunk.vb,m=s.node.worldMatrix,stride=r.floatStride;for(let i=0;i<r.dataLength;i++){const d=r.data[i],o=i*stride;vb[o]=m.m00*d.x+m.m04*d.y+m.m12;vb[o+1]=m.m01*d.x+m.m05*d.y+m.m13;vb[o+2]=m.m02*d.x+m.m06*d.y+m.m14;}const mb=chunk.meshBuffer,ib=mb.iData,offset=mb.indexOffset,v=chunk.vertexOffset;for(let i=0;i<self.capacity;i++){const j=v+i*4,o=offset+i*6;ib[o]=j;ib[o+1]=j+1;ib[o+2]=j+2;ib[o+3]=j+1;ib[o+4]=j+3;ib[o+5]=j+2;}mb.indexOffset+=self.capacity*6;r.vertDirty=false;},
 updateColor(){}
 };this.assembler=assembler;(this.sprite as any)._assembler=assembler;
 }
 draw(texture:Texture2D,quads:Quad[]){const s=this.sprite as any;if(this.frame.texture!==texture){this.frame.texture=texture;this.frame.rect=new Rect(0,0,texture.width,texture.height);this.frame.originalSize=new Size(texture.width,texture.height);this.frame.packable=false;s.spriteFrame=this.frame;}
 this.quads=quads;const capacity=Math.ceil(quads.length/128)*128;// Sprite.onEnable resets its assembler after menus/transitions. Reinstall our mesh before allocating data.
 if(this.capacity!==capacity||s._assembler!==this.assembler||!s.renderData){this.capacity=capacity;s.destroyRenderData();s._assembler=this.assembler;s._renderData=this.assembler.createData(s);}s.markForUpdateRenderData();}
 destroy(){this.frame.destroy();}
}
