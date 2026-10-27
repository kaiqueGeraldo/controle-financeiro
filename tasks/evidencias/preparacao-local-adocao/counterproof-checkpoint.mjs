import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file));
function atomic(file,value) {
  const tmp=file+'.'+crypto.randomUUID()+'.tmp';
  const fd=fs.openSync(tmp,'wx');
  try {fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  fs.renameSync(tmp,file);
}
function inside(root,file) {
  const resolved=path.resolve(root,file);
  if(!resolved.startsWith(path.resolve(root)+path.sep))throw Error('Path outside execution');
  return resolved;
}

/** Local sequential runner. Each attempt has its own evidence and backups.
 * A checkpoint is a receipt, never a generic exit-code success cache. */
export class ProofStore {
  constructor({directory,identity,sourceRoot,evidenceRoot,inputs}) {
    this.directory=path.resolve(directory);this.identity=identity;
    this.sourceRoot=path.resolve(sourceRoot);this.evidenceRoot=path.resolve(evidenceRoot);
    this.inputs=new Map(inputs.map(x=>[x.file,x.sha256]));
    fs.mkdirSync(this.directory,{recursive:true});
    const file=path.join(this.directory,'identity.json');
    if(fs.existsSync(file)) {
      if(JSON.stringify(read(file))!==JSON.stringify({version:2,identity}))throw Error('Incompatible checkpoint identity; use a new execution');
    } else atomic(file,{version:2,identity});
  }
  state(folder,value) {
    const record={...value,at:new Date().toISOString()};
    // Append-only history remains even when the current checkpoint changes.
    const fd=fs.openSync(path.join(folder,'events.jsonl'),'a');
    try {fs.writeSync(fd,JSON.stringify(record)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    atomic(path.join(folder,'checkpoint.json'),record);
    return record;
  }
  restored(record,folder) {
    for(const item of record.files) {
      if(this.inputs.get(item.file)!==item.before)throw Error('Backup is not a declared input');
      const file=inside(this.sourceRoot,item.file), current=hash(fs.readFileSync(file));
      if(current===item.before)continue;
      if(current!==item.after)throw Error('Unknown source change; restoration pending: '+item.file);
      const bytes=fs.readFileSync(inside(folder,item.backup));
      if(hash(bytes)!==item.before)throw Error('Invalid restoration backup: '+item.file);
      fs.writeFileSync(file,bytes);
      if(hash(fs.readFileSync(file))!==item.before)throw Error('Restoration hash mismatch');
    }
  }
  valid(record,folder) {
    if(record.state!=='complete'||record.identity!==hash(JSON.stringify(this.identity))
      ||record.proof?.causal!==true||record.proof?.assertionDetected!==true||!record.evidence?.length)return false;
    try {
      this.restored(record,folder);
      return record.evidence.every(x=>hash(fs.readFileSync(inside(this.evidenceRoot,x.file)))===x.sha256)
        && record.files.every(x=>hash(fs.readFileSync(inside(folder,x.backup)))===x.before);
    } catch {return false;}
  }
  run(experiment,observe,validate) {
    if(!/^[a-z0-9-]+$/.test(experiment.name))throw Error('Invalid proof name');
    const cases=path.join(this.directory,experiment.name);fs.mkdirSync(cases,{recursive:true});
    const attempts=fs.readdirSync(cases,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
    let reusable;
    for(const name of attempts) {
      const folder=path.join(cases,name), record=read(path.join(folder,'checkpoint.json'));
      if(record.identity!==hash(JSON.stringify(this.identity))||record.name!==experiment.name)throw Error('Incompatible attempt');
      if(record.active&&record.ownerPid) {
        let alive=true;try{process.kill(record.ownerPid,0);}catch(error){if(error.code==='ESRCH')alive=false;}
        if(alive)throw Error('Attempt owner is still running; do not restore or resume concurrently');
      }
      this.restored(record,folder); // No advance while restoration is unknown.
      if(name===attempts.at(-1)&&this.valid(record,folder)) {
        let proof;
        try {proof=validate(record.result,folder);}catch { /* Invalid receipts are unproved, never skipped. */ }
        if(proof?.causal===true&&proof?.assertionDetected===true
          &&JSON.stringify(proof.files.map(f=>path.relative(this.evidenceRoot,f)).sort())===JSON.stringify(record.evidence.map(x=>x.file).sort())) {
          reusable={reused:true,folder,record};
        }
      }
      if(!['failed','recovered-incomplete','complete'].includes(record.state))
        this.state(folder,{...record,state:'recovered-incomplete',active:false,reason:'Interrupted attempt restored; must observe again'});
    }
    if(reusable){this.verifyInputs();return reusable;}
    // Check the complete candidate before *each* experiment, including reuse paths.
    this.verifyInputs();
    const folder=path.join(cases,String(attempts.length+1).padStart(4,'0'));fs.mkdirSync(folder);
    let record=this.state(folder,{version:2,name:experiment.name,identity:hash(JSON.stringify(this.identity)),state:'running',active:true,ownerPid:process.pid,files:[]});
    let failure;
    try {
      const mutations=[];
      for(const [i,[file,change]]of experiment.edits.entries()) {
        const bytes=fs.readFileSync(inside(this.sourceRoot,file)),after=Buffer.from(change(bytes.toString('utf8')));
        if(hash(bytes)!==this.inputs.get(file))throw Error('Input differs before mutation: '+file);
        if(hash(bytes)===hash(after))throw Error('Mutation did not apply: '+experiment.name);
        const backup='original-'+i;fs.writeFileSync(path.join(folder,backup),bytes,{flag:'wx'});
        record=this.state(folder,{...record,files:[...record.files,{file,backup,before:hash(bytes),after:hash(after)}]});
        mutations.push([file,after]);
      }
      for(const [file,bytes]of mutations)fs.writeFileSync(inside(this.sourceRoot,file),bytes);
      record=this.state(folder,{...record,state:'mutated'});
      const result=observe(folder);
      record=this.state(folder,{...record,state:'observed',result});
      const proof=validate(result,folder);
      if(proof?.causal!==true||proof?.assertionDetected!==true||!proof.files?.length)throw Error('Missing causal proof');
      const evidence=proof.files.map(file=>{
        const relative=path.relative(this.evidenceRoot,file);
        return {file:relative,sha256:hash(fs.readFileSync(inside(this.evidenceRoot,relative)))};
      });
      record=this.state(folder,{...record,state:'restoration-pending',proof:{...proof,files:undefined},evidence});
    } catch(error) {failure=error;record=this.state(folder,{...record,state:'failed-before-completion',reason:error.message});}
    try {
      this.restored(record,folder);this.verifyInputs();
      record=this.state(folder,{...record,state:failure?'failed':'complete',active:false,restorationVerified:true});
    } catch(error) {
      this.state(folder,{...record,state:'restoration-pending',active:false,reason:error.message});throw error;
    }
    if(failure)throw failure;
    return {reused:false,folder,record};
  }
  verifyInputs() {
    for(const [file,expected]of this.inputs)if(hash(fs.readFileSync(inside(this.sourceRoot,file)))!==expected)throw Error('Candidate not restored: '+file);
  }
}
