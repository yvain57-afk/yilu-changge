import {open as baseOpen} from './browser-v03-common.mjs';
import {createRequire} from 'node:module';
export {freshSave,fixtureGame,startCapture,stopCapture} from './browser-v06-common.mjs';
export const {runnerSteer:steer}=createRequire(import.meta.url)('../.cache/v09-logic/v09-model-policy.js');
export const root='evidence/v09';
export const open=(name,width=390,height=844)=>baseOpen('v09-'+name,width,height,{version:'v09-rc1',audio:true,baseURL:'http://127.0.0.1:43196/'});
