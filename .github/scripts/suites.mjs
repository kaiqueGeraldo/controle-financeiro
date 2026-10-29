import fs from 'node:fs';
import path from 'node:path';

// Standalone historical browser investigations require their own fixtures,
// clocks, evidence directories and/or original candidate. They are retained in
// expanded verification, never reported as passed by the current smoke gate.
export const historicalBrowserHarnesses=[
  'Cf014HistoryDiagnosticTest','Cf014HistoryReviewTest','Cf019Rva03DiagnosticTest',
  'Rvr24ReviewBrowserTest','Rvr24VisualBrowserTest','Rv24CreationBrowserIntegrationTest',
  'Rf15RemediationBrowserTest','Rf15ResidualIndependentBrowserTest','Rf15ResidualBrowserTest',
  'Rf15IndependentBrowserTest','FrontendClosureBrowserTest','MilestoneRemediationBrowserTest',
  'IntegratedMilestoneBrowserReviewTest','UserIsolationBrowserIntegrationTest','HabitBrowserIntegrationTest',
];
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(directory,e.name)):[path.join(directory,e.name)]);}
// The supported contract is deliberately small: a dedicated class with one
// class-level @EnabledOnOs(OS.WINDOWS|LINUX). Method conditions cannot partition
// a Maven class selection safely, so new/unsupported forms fail closed.
function platformFor(text,name){
  const conditions=text.match(/@(?:[\w.]+\.)?(?:EnabledOnOs|DisabledOnOs)\b/g)??[];
  if(!conditions.length)return null;
  const declaration=text.match(new RegExp(`@EnabledOnOs\\(\\s*OS\\.(WINDOWS|LINUX)\\s*\\)\\s*(?:(?:public|final)\\s+)*class\\s+${name}\\b`));
  if(conditions.length!==1||!declaration)throw new Error(`Unsupported OS condition in ${name}; use a dedicated class-level @EnabledOnOs(OS.WINDOWS|LINUX)`);
  return declaration[1]==='WINDOWS'?'win32':'linux';
}
export function backendSelection(root,suite,targetPlatform,scope='all'){
  if(!['smoke','expanded'].includes(suite))throw new Error(`Unknown backend suite: ${suite}`);
  if(!['win32','linux'].includes(targetPlatform))throw new Error(`Unknown target JVM platform: ${targetPlatform}`);
  if(!['all','platform-only'].includes(scope))throw new Error(`Unknown backend scope: ${scope}`);
  const selected=[],deferred=[],routed=[];
  for(const file of files(path.join(root,'controle-financeiro-backend/src/test/java')).filter(f=>/Tests?\.java$/.test(f))){
    const text=fs.readFileSync(file,'utf8');if(/\babstract\s+class\b/.test(text))continue;
    const name=path.basename(file,'.java'),qualified=`${text.match(/package\s+([^;]+);/)[1]}.${name}`;
    const platform=platformFor(text,name);
    if(suite!=='expanded'&&historicalBrowserHarnesses.includes(name)){deferred.push({name:qualified,reason:'historical standalone browser harness; expanded only; not approved by smoke'});continue;}
    if(platform&&platform!==targetPlatform){routed.push({name:qualified,targetPlatform:platform,reason:'incompatible with target JVM; must execute on its own platform'});continue;}
    if(scope==='platform-only'&&!platform)continue;
    selected.push(qualified);
  }
  if(!selected.length)throw new Error('Empty mandatory backend selection');
  return {suite,targetPlatform,scope,selected:selected.sort(),deferred,routed};
}
