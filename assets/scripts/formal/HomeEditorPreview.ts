import {DEBUG} from 'cc/env';
import {HOME_EDITOR_CONFIG} from './HomeEditorConfig';
import {HomeEditorConfig,HomeEditorItem,validateHomeEditorConfig} from './HomeEditor';

export function installHomeEditorPreview(menu:{homeEditorOverride:HomeEditorConfig|null;homeEditorItems:HomeEditorItem[]},host:any){
 if(!DEBUG||typeof window==='undefined'||!['127.0.0.1','localhost'].includes(window.location.hostname)||new URLSearchParams(window.location.search).get('home-button-tuner')!=='1'||!host.reviewFixture?.startsWith('UI:'))return;
 const state=()=>({config:validateHomeEditorConfig(menu.homeEditorOverride||HOME_EDITOR_CONFIG),items:menu.homeEditorItems.map(i=>({...i,rect:{...i.rect},base:{...i.base}})),viewport:{W:host.size.W,H:host.size.H},screen:host.screen});
 if((window as any).__YLCG_HOME_EDITOR__?.owner===menu)return;
 (window as any).__YLCG_HOME_EDITOR__={owner:menu,get:state,apply:(value:unknown)=>{const next=validateHomeEditorConfig(value);menu.homeEditorOverride=next;if(host.screen==='home')host.drawMenu();return state();}};
}
