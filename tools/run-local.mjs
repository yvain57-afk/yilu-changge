// Keep subprocess caches and temporary artifacts under the one permitted project root.
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const [command,...args]=process.argv.slice(2);
if(!command)throw Error('command required');
const tmp=resolve('.cache/tmp');mkdirSync(tmp,{recursive:true});
const child=spawn(command,args,{stdio:'inherit',env:{...process.env,TMPDIR:tmp,TMP:tmp,TEMP:tmp,npm_config_cache:resolve('.cache/npm')}});
child.on('error',e=>{console.error(e);process.exitCode=1});
child.on('exit',(code,signal)=>{if(signal)process.kill(process.pid,signal);else process.exitCode=code??1});
