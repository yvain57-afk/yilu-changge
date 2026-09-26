import {open as baseOpen} from './browser-v03-common.mjs';
import {createRequire} from 'node:module';
export {freshSave,fixtureGame,startCapture,stopCapture} from './browser-v06-common.mjs';
export const {runnerSteer:steer}=createRequire(import.meta.url)('../.cache/v08-logic/tools/v08-policy.js');
export const root='evidence/v08';
export const open=(name,width=390,height=844)=>baseOpen('v08-'+name,width,height,{version:'v08-rc1',audio:true,baseURL:'http://127.0.0.1:43192/'});
