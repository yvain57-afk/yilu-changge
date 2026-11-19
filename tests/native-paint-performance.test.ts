import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

/** Instrument the Cocos boundary: changed properties invalidate data, while a
 * forced Label update invalidates it even when the glyphs have not changed. */
function runtime(profile?:unknown){
 const stats={rasters:0,sizes:0,offsets:0,scaleWrites:0,meshAllocations:0,shadowTessellations:0};
 class Color{static WHITE=new Color(255,255,255,255);constructor(public r=0,public g=0,public b=0,public a=255){}set(r:number,g:number,b:number,a:number){Object.assign(this,{r,g,b,a});}fromHEX(s:string){let h=s.replace('#','');if(h.length===3)h=h.split('').map(v=>v+v).join('');this.set(parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255);}}
 class Rect{constructor(public x=0,public y=0,public width=0,public height=0){}}
 class Size{constructor(public width=0,public height=0){stats.sizes++;}}
 class Vec2{constructor(public x=0,public y=0){stats.offsets++;}}
 class UITransform{width=0;height=0;setAnchorPoint(){}setContentSize(w:number,h:number){this.width=w;this.height=h;}}
 class UIOpacity{opacity=255;}
 class SpriteFrame{isValid=true;texture:any;rect=new Rect();originalSize=new Size();offset=new Vec2();destroy(){this.isValid=false;}}
 class Node{
  isValid=true;active=true;angle=0;layer=0;parent:any;children:Node[]=[];components=new Map<any,any>();
  worldMatrix={m00:1,m04:0,m12:0,m01:0,m05:1,m13:0,m02:0,m06:0,m14:0};
  constructor(public name=''){}
  addChild(n:Node){this.children.push(n);n.parent=this;}
  addComponent(C:any){const c=new C();c.node=this;this.components.set(C,c);return c;}
  getComponent(C:any){return this.components.get(C);}
  setPosition(){}setSiblingIndex(){}setScale(){stats.scaleWrites++;}destroy(){this.isValid=false;}
 }
 class Sprite{
  static SizeMode={CUSTOM:1};static Type={SIMPLE:0};node!:Node;sizeMode=0;spriteFrame:any;renderData:any;_assembler:any;
  requestRenderData(){stats.meshAllocations++;const r:any={dataLength:0,floatStride:9,data:[],chunk:{vertexOffset:0,meshBuffer:{iData:new Uint16Array(32768),indexOffset:0},setIndexBuffer(v:any){this.indices=v;}},resize(vertices:number){this.data=Array.from({length:vertices},()=>({x:0,y:0}));this.chunk.vb=new Float32Array(vertices*9);},updateRenderData(){}};this.renderData=r;return r;}
  destroyRenderData(){this.renderData=null;}markForUpdateRenderData(){this._assembler.updateRenderData(this);}set _renderData(r:any){this.renderData=r;}
 }
 class Label{
  static HorizontalAlign={CENTER:1};static VerticalAlign={CENTER:1};static Overflow={NONE:0};dirty=true;node!:Node;
  constructor(){return new Proxy(this,{set(o:any,k,v){if(k!=='dirty'&&k!=='node'&&JSON.stringify(o[k])!==JSON.stringify(v))o.dirty=true;o[k]=v;return true;}});}
  updateRenderData(force=false){if(force||this.dirty){stats.rasters++;this.dirty=false;}}
 }
 class LabelOutline{enabled=false;color:any;width=0;}
 const cc={Node,Layers:{Enum:{UI_2D:1}},UITransform,Sprite,SpriteFrame,Texture2D:class {},Rect,Size,Vec2,Color,UIOpacity,Graphics:class {ellipse(){stats.shadowTessellations++;}fill(){}},Label,LabelOutline};
 function load(name:string,modules:Record<string,unknown>){const module={exports:{} as any};const code=ts.transpileModule(fs.readFileSync(`assets/scripts/formal/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,__YILU_TEXTURE_PROFILE__:profile,require:(key:string)=>modules[key]});return module.exports;}
 const {GroundMesh}=load('GroundMesh',{cc});
 const textureProfile=load('TextureProfile',{});
 const {NativePaint}=load('NativePaint',{cc,'./TextureProfile':textureProfile,'./GroundMesh':{GroundMesh},'./manifest':{MANIFEST:{frames:{},sheets:{}}}});
 return {stats,Node,Sprite,NativePaint,GroundMesh};
}

test('unchanged HUD glyphs remain cached while text, size and color changes update immediately',()=>{
 const {stats,Node,NativePaint}=runtime(),p=new NativePaint(new Node());
 const draw=(text='兵力 36',size=14,fill='#ffffff')=>{p.begin({W:402,H:874});p.font=`600 ${size}px sans-serif`;p.fillStyle=fill;p.fillText(text,100,100);p.end();};
 draw();const warmed=stats.rasters;
 for(let i=0;i<120;i++)draw();
 assert.equal(stats.rasters,warmed,'stationary HUD must not re-rasterize every frame');
 draw('兵力 35');draw('兵力 35',18);draw('兵力 35',18,'#ff0000');
 assert.equal(stats.rasters,warmed+3,'real glyph/style changes must still invalidate the label');
});

test('pooled sprites retain geometry without redundant allocations and clear tint modes on reuse',()=>{
 const {stats,Node,Sprite,NativePaint}=runtime(),root=new Node(),p=new NativePaint(root);
 NativePaint.textures.sheet={isValid:true,width:256,height:256};
 const draw=(mode='normal',width=32)=>{p.begin({W:402,H:874});p.globalAlpha=.4;p.scale(-1,1);p.drawImage({sheet:'sheet',visualMode:mode},0,0,width,32,10,10,64,64);p.end();};
 draw('grayscale');const warmed={...stats},sprite=root.children[0].getComponent(Sprite);
 for(let i=0;i<120;i++)draw();
 assert.equal(stats.sizes,warmed.sizes);assert.equal(stats.offsets,warmed.offsets);
 assert.equal(stats.scaleWrites-warmed.scaleWrites,120,'one final transform per draw; no reset-and-restore churn');
 assert.equal(sprite.grayscale,false);assert.equal(sprite.color.r,255);assert.equal(sprite.customMaterial,null);
 draw('normal',48);assert.equal(sprite.spriteFrame.rect.width,48);assert.equal(sprite.spriteFrame.originalSize.width,48);
});

test('ground mesh reuses capacity through tile seams and collapses unused vertices',()=>{
 const {stats,Node,Sprite,GroundMesh}=runtime(),node=new Node(),mesh=new GroundMesh(node),texture={width:256,height:256};
 const quad={x0:-2,x1:2,x2:-1,x3:1,y0:0,y1:3,u0:.1,u1:.9,u2:.2,u3:.8,v0:1,v1:0};
 const quads=Array.from({length:129},()=>({...quad}));mesh.draw(texture,quads);const sprite=node.getComponent(Sprite),data=sprite.renderData,warmed=stats.meshAllocations;
 for(let i=0;i<120;i++)mesh.draw(texture,i%2?quads:quads.slice(0,128));
 assert.equal(stats.meshAllocations,warmed);assert.equal(sprite.renderData,data);
 mesh.draw(texture,[quad]);
 assert.deepEqual(Array.from(data.data.slice(0,4),v=>[v.x,v.y]),[[-2,0],[2,0],[-1,3],[1,3]]);
 assert.ok(data.data.slice(4).every((v:any)=>v.x===0&&v.y===0),'removed quads must not leave stale ground behind');
 assert.ok(Math.abs(data.chunk.vb[3]-.1)<1e-6);assert.equal(data.chunk.vb[4],1);
 sprite._assembler={};mesh.draw(texture,[quad]);
 assert.equal(stats.meshAllocations,warmed+1,'menu transition must restore the custom mesh assembler');
});

 test('scaled texture pixels preserve source geometry, destination size and frame offsets',()=>{
 const {Node,Sprite,NativePaint}=runtime({sizes:{sheet:[1024,512]}}),root=new Node(),p=new NativePaint(root);
 NativePaint.textures.sheet={isValid:true,width:640,height:320};
 p.begin({W:402,H:874});p.drawImage('sheet',512,128,512,384,10,20,100,75);p.end();
 const sprite=root.children[0].getComponent(Sprite),r=sprite.spriteFrame.rect;
 assert.deepEqual([r.x,r.y,r.width,r.height],[320,80,320,240]);
 assert.equal(p.invalidRects.size,0);
 });


test('moving shadows retain tessellation and atlas frames survive changing depth order',()=>{
 const {stats,Node,NativePaint}=runtime(),p=new NativePaint(new Node());
 NativePaint.textures.sheet={isValid:true,width:256,height:256};
 const draw=(reverse:boolean)=>{p.begin({W:402,H:874});for(let i=0;i<30;i++){
  p.drawShadow(i*4,100,20+i);p.drawImage('sheet',((i+(reverse?1:0))%2)*32,0,32,32,i*3,20,20,20);
 }p.end();};
 draw(false);const warm={...stats};for(let i=0;i<120;i++)draw(!!(i%2));
 assert.equal(stats.shadowTessellations,warm.shadowTessellations);
 assert.equal(stats.sizes,warm.sizes);assert.equal(stats.offsets,warm.offsets);
});
