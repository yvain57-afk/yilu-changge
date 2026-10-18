import {DEBUG} from 'cc/env';
import {HOME_BUTTON_CONFIG} from './HomeButtonConfig';
import {HOME_BUTTON_DEFAULTS,HomeButtonConfig,validateHomeButtonConfig,homeButtonLayout} from './HomeButtonLayout';

/** Development-only browser bridge; no progress writes, network calls or native controls. */
export function installHomeButtonPreview(menu:{homeButtonOverride:HomeButtonConfig|null},host:any){
  if(!DEBUG || typeof window==='undefined' || !['127.0.0.1','localhost'].includes(window.location.hostname) || new URLSearchParams(window.location.search).get('home-button-tuner')!=='1')return;
  const state=()=>{const s=host.size;return{config:{...(menu.homeButtonOverride||HOME_BUTTON_CONFIG)},defaults:{...HOME_BUTTON_DEFAULTS},rect:homeButtonLayout(s.W,s.H,s.top,s.bottom,!!host.store.data.pendingRewardPresentation,menu.homeButtonOverride||HOME_BUTTON_CONFIG),viewport:{W:s.W,H:s.H},screen:host.screen};};
  const current=(window as any).__YLCG_HOME_BUTTON__;
  if(current?.owner===menu)return;
  (window as any).__YLCG_HOME_BUTTON__={owner:menu,get:state,apply:(value:unknown)=>{menu.homeButtonOverride=validateHomeButtonConfig(value);if(host.screen==='home')host.drawMenu();return state();}};
}
