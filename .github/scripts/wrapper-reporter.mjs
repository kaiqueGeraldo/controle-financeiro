import fs from 'node:fs';
import path from 'node:path';

// Private, append-only lifecycle events. The public collector projects and sanitizes.
export default class WrapperReporter {
  constructor() {
    this.directory=process.env.CF_WRAPPER_DIAGNOSTICS;
    this.phase=process.env.CF_WRAPPER_PHASE;
    this.wrapper=process.env.CF_WRAPPER_NAME;
    this.invocationId=process.env.CF_WRAPPER_INVOCATION;
    if(!this.directory||!['list','run'].includes(this.phase)||!this.wrapper||!this.invocationId)throw new Error('Missing wrapper reporter context');
    this.file=path.join(this.directory,'events-'+this.phase+'.jsonl');
    fs.writeFileSync(this.file,'',{flag:'wx'});
    this.sequence=0;this.emit('reporter-loaded',{});
  }
  emit(kind,data) {fs.appendFileSync(this.file,JSON.stringify({version:1,wrapper:this.wrapper,invocationId:this.invocationId,phase:this.phase,sequence:++this.sequence,at:new Date().toISOString(),kind,...data})+'\n');}
  identity(test) {return {id:test.id,project:test.parent.project()?.name??'',file:path.relative(this.root,test.location.file).split(path.sep).join('/'),titles:test.titlePath(),line:test.location.line,column:test.location.column,repeatEachIndex:test.repeatEachIndex??0};}
  error(error) {return error?{message:error.message??String(error.value??'Unspecified error'),stack:error.stack??null,location:error.location??null}:null;}
  onBegin(config,suite) {this.root=config.rootDir;this.emit('begin',{expected:suite.allTests().map(t=>this.identity(t))});}
  onTestBegin(test,result) {this.emit('test-start',{test:this.identity(test),workerIndex:result.workerIndex,retry:result.retry,startTime:result.startTime.toISOString()});}
  onStepEnd(test,result,step) {if(step.error)this.emit('step-error',{test:this.identity(test),workerIndex:result.workerIndex,retry:result.retry,step:{title:step.title,category:step.category,durationMs:step.duration,location:step.location??null},error:this.error(step.error)});}
  onTestEnd(test,result) {this.emit('test-end',{test:this.identity(test),workerIndex:result.workerIndex,retry:result.retry,status:result.status,expectedStatus:test.expectedStatus,durationMs:result.duration,errors:result.errors.map(e=>this.error(e))});}
  onError(error) {this.emit('global-error',{error:this.error(error)});}
  onEnd(result) {this.emit('end',{status:result.status,durationMs:result.duration});}
}

