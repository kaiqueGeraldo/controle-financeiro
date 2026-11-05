import {spawnSync} from 'node:child_process';

// Keep Node's existing Windows argument serialization (notably cmd /c).
// This adapter starts only AFTER its guardian assigned the command Job.
const spec=JSON.parse(Buffer.from(process.argv[2],'base64').toString('utf8'));
const result=spawnSync(spec.executable,spec.args,{cwd:spec.cwd,env:process.env,stdio:'inherit'});
if(result.error){process.stderr.write(result.error.message+'\n');process.exit(1);}
process.exit(result.status??1);
