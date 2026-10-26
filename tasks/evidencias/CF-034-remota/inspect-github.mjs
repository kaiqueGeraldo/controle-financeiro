import {writeJson} from '../../../.github/scripts/source.mjs';
import path from 'node:path';

// Public, read-only API calls. No authentication values are retrieved or logged.
const base='https://api.github.com/repos/kaiqueGeraldo/controle-financeiro';
const paths=['/branches/main','/rules/branches/main','/actions/workflows','/actions/runs?per_page=5','/actions/permissions','/environments'];
function summarize(endpoint,body){
  if(endpoint==='/branches/main')return {sha:body?.commit?.sha,protected:body?.protected,protection:body?.protection};
  if(endpoint==='/rules/branches/main')return body;
  if(endpoint==='/actions/workflows')return body?.workflows?.map(({id,name,path,state})=>({id,name,path,state}));
  if(endpoint.startsWith('/actions/runs'))return body?.workflow_runs?.map(({id,name,event,head_sha,status,conclusion,html_url})=>({id,name,event,head_sha,status,conclusion,html_url}));
  if(endpoint==='/environments')return body?.environments?.map(({name,protection_rules,deployment_branch_policy})=>({name,protection_rules,deployment_branch_policy}));
  return body;
}
const results=await Promise.all(paths.map(async endpoint=>{
  try{
    const response=await fetch(base+endpoint,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'CF034-read-only-preflight'},signal:AbortSignal.timeout(20000)});
    const body=await response.json();
    return {endpoint,status:response.status,summary:summarize(endpoint,body)};
  }catch(error){return {endpoint,status:'unavailable',error:error.message};}
}));
writeJson(path.join(import.meta.dirname,'github-inspection.json'),{at:new Date().toISOString(),access:'unauthenticated public API; permission failures do not prove absence of settings',results});
for(const result of results)console.log(JSON.stringify(result));
