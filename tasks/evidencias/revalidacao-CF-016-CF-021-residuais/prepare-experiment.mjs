import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const root=process.cwd();
const evidence=path.join(root,"tasks/evidencias/revalidacao-CF-016-CF-021-residuais");
const runtime=path.join(root,".r3");
if(fs.existsSync(runtime))throw new Error("Runtime already exists; do not overwrite evidence or another execution");
fs.mkdirSync(runtime,{recursive:true});
fs.writeFileSync(path.join(runtime,".gitignore"),"*\n");
const zip=path.join(runtime,"candidate.zip");
execFileSync("git",["archive","0099185c22b743de3dd66e30e326c8378770b101","--format=zip",`--output=${zip}`,"controle-financeiro-backend","controle-financeiro-frontend"],{cwd:root});
execFileSync("tar",["-xf",zip,"-C",runtime]);
const front=path.join(runtime,"controle-financeiro-frontend");
fs.symlinkSync(path.join(root,"controle-financeiro-frontend/node_modules"),path.join(front,"node_modules"),"junction");
execFileSync("git",["apply",`--directory=${path.relative(root,runtime).replaceAll('\\','/')}`,
  "tasks/evidencias/saneamento-CF-016-CF-021-residuais/rva03-instrumentacao-temporaria.patch"],{cwd:root});
function replace(file,from,to){const p=path.join(front,file);const s=fs.readFileSync(p,"utf8");if(!s.includes(from))throw new Error(`Missing anchor ${file}: ${from}`);fs.writeFileSync(p,s.replace(from,to));}
const lane="src/hooks/useRequestCoordinator.ts";
replace(lane,'    const requestScope = scopeRef.current;',`    const requestScope = scopeRef.current;
    console.debug("RVA03 lane", JSON.stringify({phase:"begin",lane,revision,scope:requestScope,time:performance.timeOrigin+performance.now()}));
    controller.signal.addEventListener("abort",()=>console.debug("RVA03 lane",JSON.stringify({phase:"abort",lane,revision,time:performance.timeOrigin+performance.now()})),{once:true});`);
replace(lane,'  const invalidate = useCallback((lane?: string) => {',`  const invalidate = useCallback((lane?: string) => {
    console.debug("RVA03 lane",JSON.stringify({phase:"invalidate",lane:lane??"all",scope:scopeRef.current,time:performance.timeOrigin+performance.now()}));`);
replace(lane,'      finish: () => {',`      finish: () => {
        console.debug("RVA03 lane",JSON.stringify({phase:"finish",lane,revision,current:isCurrent(),time:performance.timeOrigin+performance.now()}));`);
replace("src/services/api.ts",'  const body = await response.text();',`  console.debug("RVA03 body",JSON.stringify({phase:"begin",url:new URL(response.url).pathname,status:response.status,time:performance.timeOrigin+performance.now()}));
  const body = await response.text();
  console.debug("RVA03 body",JSON.stringify({phase:"consumed",url:new URL(response.url).pathname,time:performance.timeOrigin+performance.now()}));`);
// Timestamp every phase emitted by the temporary patch without logging payloads.
const spec="tests/e2e/milestone-remediation.integrated.spec.ts";
replace(spec,'import {expect,test,type Page} from "@playwright/test";',`import "./rva03-review-hooks";
import {expect,test,type Page} from "@playwright/test";`);
fs.copyFileSync(path.join(root,"controle-financeiro-frontend/tests/e2e/rva03-review-hooks.ts"),path.join(front,"tests/e2e/rva03-review-hooks.ts"));
replace("tests/e2e/playwright.milestone-remediation.config.ts",'export default defineConfig({...base,','export default defineConfig({...base, grepInvert: /SAN-RVA/,');
replace("next.config.ts",'const nextConfig: NextConfig = {',`const nextConfig: NextConfig = {\n  turbopack: {root:${JSON.stringify(root.replaceAll('\\','/'))}},`);
const files=["src/components/forms/payInvoiceModal.tsx","src/hooks/useCards.ts",lane,"src/services/api.ts",spec,"tests/e2e/playwright.milestone-remediation.config.ts","next.config.ts"];
let diff="";
for(const file of files){try{diff+=execFileSync("git",["diff","--no-index","--",path.join(root,"controle-financeiro-frontend",file),path.join(front,file)],{encoding:"utf8"});}
  catch(error){if(error.status!==1)throw error;diff+=error.stdout;}}
fs.writeFileSync(path.join(evidence,"instrumentacao-execucao.patch"),diff);
fs.writeFileSync(path.join(evidence,"runtime-execucao.txt"),runtime+"\nCandidate 0099185; one run of the original 17 journeys; no SAN-RVA, no retry or increased timeout.\n");
