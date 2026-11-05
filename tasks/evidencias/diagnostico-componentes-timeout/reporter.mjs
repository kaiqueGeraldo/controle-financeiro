import fs from 'node:fs';
export default class DiagnosticReporter {
 onInit(ctx){
  fs.writeFileSync('/work/diag/results/'+process.env.CF_DIAG_RUN+'-config.json',JSON.stringify({node:process.version,pid:process.pid,CI:!!process.env.CI,root:ctx.config.root,pool:ctx.config.pool,maxWorkers:ctx.config.maxWorkers,minWorkers:ctx.config.minWorkers,fileParallelism:ctx.config.fileParallelism,isolate:ctx.config.isolate,testTimeout:ctx.config.testTimeout,hookTimeout:ctx.config.hookTimeout,sequence:ctx.config.sequence},null,2)+'\n');
 }
}
