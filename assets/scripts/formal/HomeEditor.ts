export const HOME_ELEMENT_IDS = ['hero','title','progress','settings','chapter','weaponIcon','weapon','growth','start','chapters','collection','reward'] as const;
export type HomeElementId = typeof HOME_ELEMENT_IDS[number];
export type HomeElementKind = 'image'|'text'|'button';
export interface HomeElementStyle {offsetX?:number;offsetY?:number;widthPercent?:number;heightPercent?:number;fontSize?:number;text?:string;}
export type HomeEditorConfig = Partial<Record<HomeElementId,HomeElementStyle>>;
export interface HomeEditorItem {id:HomeElementId;label:string;kind:HomeElementKind;base:{x:number;y:number;w:number;h:number};rect:{x:number;y:number;w:number;h:number};fontSize:number;defaultFontSize:number;template:string;text:string;}
export const HOME_EDITOR_LIMITS = {offsetX:[-300,300],offsetY:[-400,400],widthPercent:[30,200],heightPercent:[30,200],fontSize:[8,48]} as const;
export const HOME_EDITOR_VARIABLES = ['通关数','关数','地点','关名','兵器','等级','成长提示','出征文案','关卡提示'] as const;
export function validateHomeEditorConfig(value:unknown):HomeEditorConfig {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('首页设置格式不正确');
 const result:HomeEditorConfig={};
 for(const [id,style]of Object.entries(value)){
  if(!HOME_ELEMENT_IDS.includes(id as HomeElementId)||!style||typeof style!=='object'||Array.isArray(style))throw Error('未知的首页内容：'+id);
  const clean:HomeElementStyle={};
  for(const [key,v]of Object.entries(style)){
   if(key==='text'){
    if(typeof v!=='string'||v.length>160)throw Error('文案最多 160 个字符');
    if((v.match(/\{[^{}]+\}/g)||[]).some(m=>!HOME_EDITOR_VARIABLES.includes(m.slice(1,-1) as typeof HOME_EDITOR_VARIABLES[number])))throw Error('文案变量无效，请保留面板列出的变量名称');
    if(id==='hero'||id==='weaponIcon')throw Error('图片没有文字内容');
    clean.text=v;continue;
   }
   if(!Object.prototype.hasOwnProperty.call(HOME_EDITOR_LIMITS,key))throw Error('未知设置：'+key);
   const range=HOME_EDITOR_LIMITS[key as keyof typeof HOME_EDITOR_LIMITS];
   if(typeof v!=='number'||!Number.isFinite(v)||v<range[0]||v>range[1])throw Error('设置超出范围：'+key);
   (clean as Record<string,unknown>)[key]=Math.round(v*10)/10;
  }
  if(Object.keys(clean).length)result[id as HomeElementId]=clean;
 }
 return result;
}
export function homeEditorItem(id:HomeElementId,label:string,kind:HomeElementKind,base:{x:number;y:number;w:number;h:number},defaultFontSize:number,template:string,variables:Record<string,string|number>,config:HomeEditorConfig,W:number,H:number):HomeEditorItem {
 const style=config[id]||{},w=Math.min(W,Math.max(kind==='button'?44:24,base.w*(style.widthPercent??100)/100)),h=Math.min(H,Math.max(kind==='button'?44:8,base.h*(style.heightPercent??100)/100));
 const rect={x:Math.max(0,Math.min(W-w,base.x+(style.offsetX??0))),y:Math.max(0,Math.min(H-h,base.y+(style.offsetY??0))),w,h};
 const requested=style.fontSize??defaultFontSize,fontSize=kind==='button'?Math.min(requested,Math.max(8,Math.floor((h-28)/1.2))):requested;
 const selectedTemplate=style.text??template,text=selectedTemplate.replace(/\{([^{}]+)\}/g,(_,key)=>String(variables[key]??'{'+key+'}'));
 return{id,label,kind,base:{...base},rect,fontSize,defaultFontSize,template:selectedTemplate,text};
}
