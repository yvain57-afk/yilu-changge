import {HOME_BUTTON_CONFIG} from './HomeButtonConfig';
import {homeLayout} from './MenuLayout';

export interface HomeButtonConfig {offsetX:number;offsetY:number;widthPercent:number;height:number;fontSize:number;}
export const HOME_BUTTON_DEFAULTS:HomeButtonConfig = {offsetX:0,offsetY:0,widthPercent:100,height:52,fontSize:15};
export const HOME_BUTTON_LIMITS = {
  offsetX:[-160,160], offsetY:[-160,80], widthPercent:[45,100], height:[48,96], fontSize:[12,24],
} as const;
export function validateHomeButtonConfig(value:unknown):HomeButtonConfig {
  if(!value || typeof value!=='object' || Array.isArray(value))throw Error('按钮设置格式不正确');
  const input=value as Record<string,unknown>,keys=Object.keys(HOME_BUTTON_LIMITS) as (keyof HomeButtonConfig)[];
  if(Object.keys(input).length!==keys.length || Object.keys(input).some(k=>!keys.includes(k as keyof HomeButtonConfig)))throw Error('按钮设置包含未知或缺失项目');
  const result={} as HomeButtonConfig;
  for(const key of keys){const n=input[key],range=HOME_BUTTON_LIMITS[key];if(typeof n!=='number'||!Number.isFinite(n)||n<range[0]||n>range[1])throw Error('按钮设置超出范围：'+key);result[key]=Math.round(n*10)/10;}
  return result;
}
/** Drawn face and pointer target must share this rectangle on every screen size. */
export function homeButtonLayout(W:number,H:number,top:number,bottom:number,reward=false,config:HomeButtonConfig=HOME_BUTTON_CONFIG){
  const layout=homeLayout(W,H,top,bottom,reward),w=Math.min(W-32,Math.max(144,(W-32)*config.widthPercent/100)),h=config.height;
  const x=Math.max(16,Math.min(W-16-w,(W-w)/2+config.offsetX));
  const y=Math.max(top,Math.min(layout.navY-h-8,layout.actionY+config.offsetY));
  // Gold button has 14px upper/lower insets. Keep the label inside its drawable content.
  const fontSize=Math.min(config.fontSize,Math.floor((h-28)/1.2));
  return{x,y,w,h,fontSize};
}
