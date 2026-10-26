import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const root=path.resolve('../controle-financeiro-runtimes/CF-034/11');
const read=p=>JSON.parse(fs.readFileSync(p));
const trace=read('tasks/evidencias/CF-034/package-trace.json');
const front=path.join(root,'checkout/controle-financeiro-frontend');
const yaml=require(require.resolve('js-yaml',{paths:[front]}));
const workflow=yaml.load(fs.readFileSync('.github/workflows/ci.yml','utf8'));
assert.deepEqual(Object.keys(workflow.jobs),['required','expanded']);
assert.equal(workflow.jobs.expanded.needs,'required');
const versions={};for(const [name,version] of Object.entries(trace.resolvedFrontend)){versions[name]=read(path.join(front,'node_modules',name,'package.json')).version;assert.equal(versions[name],version);}
function jarTool(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory()){const found=jarTool(f);if(found)return found;}else if(e.name==='jar.exe')return f;}}
const jar=jarTool('controle-financeiro-backend/target/temurin21');assert(jar);
const libs=execFileSync(jar,['tf',path.join(root,'evidence-01/api-0.0.1.jar')],{encoding:'utf8'}).split(/\r?\n/).filter(p=>/^BOOT-INF\/lib\/[^/]+\.jar$/.test(p));
assert.deepEqual(libs,trace.embeddedLibraries);
const browser=path.join(root,'evidence-01/browser');
const env=read(path.join(browser,'environment.json'));assert.equal(env.ddl,'validate');assert.equal(env.migrations.length,16);assert(env.database.database.startsWith('cf_test_'));assert(env.database.schema.startsWith('cf032_'));
const checks=[];
for(const [name,accounts,debt,worth] of [['A-applied','1300.00','350.00','1451.00'],['B-final','1286.90','270.00','1518.57'],['G-reloaded','1100.00','150.00',null]]){
 const state=read(path.join(browser,name+'-sql.json'));assert.equal(state.accountTotal,accounts);assert.equal(state.debt,debt);if(worth)assert.equal(state.netWorth,worth);if(name==='G-reloaded'){assert.equal(state.payments.length,1);assert.equal(state.transactions.filter(t=>t.origin==='INVOICE_PAYMENT').length,1);}checks.push({name,accounts,debt,worth,paymentCount:name==='G-reloaded'?state.payments.length:undefined});
}
const result={at:new Date().toISOString(),yamlParser:'js-yaml from preserved frontend dependencies',events:workflow.on,jobs:Object.keys(workflow.jobs),permissions:workflow.permissions,expandedNeeds:workflow.jobs.expanded.needs,dependencyVersions:versions,embeddedLibraryCount:libs.length,libraryInventoryMatches:true,environment:{database:env.database,ddl:env.ddl,migrationVersions:env.migrations.map(m=>m.version),externalDoubles:env.externalDoubles},sqlChecks:checks};
fs.writeFileSync('tasks/evidencias/revisao-CF-034/supplement.json',JSON.stringify(result,null,2)+'\n');
console.log('YAML, dependency inventories, migration environment and SQL checkpoints verified.');
