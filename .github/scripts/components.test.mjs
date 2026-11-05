import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {requireComponentCoverage} from './components.mjs';

const root=path.resolve('synthetic-component-root'),context={candidate:'A',digest:'source-A',runId:'new'};
function fixture(){return {report:{success:true,numTotalTests:3,numPassedTests:3,numFailedTests:0,numPendingTests:0,numTodoTests:0,testResults:[{name:path.join(root,'a.test.tsx'),assertionResults:[{fullName:'first',status:'passed'},{fullName:'second',status:'passed'}]},{name:path.join(root,'b.test.tsx'),assertionResults:[{fullName:'group third',status:'passed'}]}]},audit:{version:1,completed:true,context,errors:[],reason:'passed',expectedFiles:['a.test.tsx','b.test.tsx'],collected:[{file:'a.test.tsx',cases:['first','second']},{file:'b.test.tsx',cases:['group third']}]}};}
test('every selected component file and collected identity must have its actual passed result',()=>{const {report,audit}=fixture();assert.deepEqual(requireComponentCoverage(report,audit,context,root),{files:2,tests:3,errors:0,identityCoverage:true});});
test('JSON success cannot approve a lost worker, missing file, missing case or unknown identity',()=>{
 for(const change of [x=>x.audit.errors.push({message:'worker failed to start'}),x=>x.report.testResults.pop(),x=>x.audit.expectedFiles.push('lost.test.tsx'),x=>x.audit.collected.pop(),x=>x.report.testResults[0].assertionResults.pop(),x=>x.report.testResults[0].assertionResults[0].fullName='unknown']){const x=fixture();change(x);assert.throws(()=>requireComponentCoverage(x.report,x.audit,context,root));}
});
test('skip, incomplete/empty audit, old candidate and failed collection still reject',()=>{
 for(const change of [x=>x.report.testResults[0].assertionResults[0].status='skipped',x=>x.audit.completed=false,x=>x.audit.expectedFiles=[],x=>x.audit.context={...context,runId:'old'},x=>x.audit.reason='failed']){const x=fixture();change(x);assert.throws(()=>requireComponentCoverage(x.report,x.audit,context,root));}
});
