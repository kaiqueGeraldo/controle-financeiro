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
export function backendSelection(root,suite){
  const selected=[],deferred=[];
  for(const file of files(path.join(root,'controle-financeiro-backend/src/test/java')).filter(f=>/Tests?\.java$/.test(f))){
    const text=fs.readFileSync(file,'utf8');if(/\babstract\s+class\b/.test(text))continue;
    const name=path.basename(file,'.java'),qualified=`${text.match(/package\s+([^;]+);/)[1]}.${name}`;
    if(suite!=='expanded'&&historicalBrowserHarnesses.includes(name)){deferred.push({name:qualified,reason:'historical standalone browser harness; expanded only; not approved by smoke'});continue;}
    selected.push(qualified);
  }
  if(!selected.length)throw new Error('Empty mandatory backend selection');
  return {suite,selected:selected.sort(),deferred};
}
