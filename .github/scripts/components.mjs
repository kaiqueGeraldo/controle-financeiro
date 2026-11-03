import assert from 'node:assert/strict';
import path from 'node:path';

export function requireComponentCoverage(report,audit,context,root){
 assert.equal(audit.version,1);assert.equal(audit.completed,true,'Incomplete component audit');
 assert.deepEqual(audit.context,context,'Components from another candidate or run');
 assert.equal(audit.errors.length,0,'Unhandled component errors');assert.equal(audit.reason,'passed','Component run not passed');
 const files=report.testResults.map(x=>path.relative(root,x.name).split(path.sep).join('/'));
 assert.ok(audit.expectedFiles.length,'Empty component selection');
 assert.deepEqual([...files].sort(),[...audit.expectedFiles].sort(),'Missing/unknown component file');
 assert.deepEqual(audit.collected.map(x=>x.file).sort(),[...audit.expectedFiles].sort(),'Component file not collected');
 const expected=audit.collected.flatMap(x=>x.cases.map(name=>JSON.stringify([x.file,name]))).sort();
 const actual=report.testResults.flatMap(x=>x.assertionResults.map(t=>{assert.equal(t.status,'passed','Failed/skipped component');return JSON.stringify([path.relative(root,x.name).split(path.sep).join('/'),t.fullName]);})).sort();
 assert.ok(expected.length,'Empty component cases');assert.deepEqual(actual,expected,'Missing/unknown component identity');
 assert.equal(report.numTotalTests,expected.length,'Wrong component total');assert.equal(report.numPassedTests,expected.length);
 assert.equal(report.numFailedTests,0);assert.equal(report.numPendingTests,0);assert.equal(report.numTodoTests,0);assert.equal(report.success,true);
 return {files:files.length,tests:actual.length,errors:0,identityCoverage:true};
}
