import fs from 'node:fs';import path from 'node:path';
const runtime=path.resolve(process.argv[2]),out=import.meta.dirname,a=JSON.parse(fs.readFileSync(path.join(runtime,'audit-initial.json')));
const reasons={
'.gitignore':'Permitir somente os novos tipos de evidência residual; sem mudar seleção, skips ou produto.',
'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security/UserIsolationBrowserIntegrationTest.java':'Preparação compilada e passagem do certificado; marcos/SQL/limites conservados.',
'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security/browser.cjs':'HTTPS/readiness com certificado local e metadados de cookie; assertions da jornada conservadas.',
'controle-financeiro-frontend/tests/e2e/milestone-review.integrated.spec.ts':'Oracles de cobertura e reserva, identidade por ID e interações específicas sem fallback HTTP.',
'tasks/evidencias/saneamento-PR3-expanded/consolidar.mjs':'Descobrir principal pelo Git common-dir depois da realocação.',
'tasks/evidencias/saneamento-PR3-expanded/executar.mjs':'Descobrir principal pelo Git common-dir depois da realocação.',
'tasks/evidencias/saneamento-PR3-expanded/preservar.mjs':'Descobrir principal pelo Git common-dir depois da realocação.'};
const text=['# Conferência dos sete registros alterados','',
'Autorização primária lida no pedido do usuário que originou o saneamento: attachment 28254f9a-a85d-4755-9804-8b62155fa08e/Texto colado.txt, SHA256 e6c5dae6024c9b90a14cdbb5c13d94c19fca6f51fa1ca4e16e1e0505fbae8030. A seção 2 autoriza atualizar referências operacionais e corrigir observadores, fixtures e harness das pendências delimitadas; as seções 5/8/12/16 delimitam caminhos, observadores, CF023 e evidências. Essa autorização histórica não autoriza implementar correções nesta revisão.','',
'As sete mudanças pertencem a esse escopo. A preservação exigida não é interpretada como proibição de editar o fonte objeto do saneamento autorizado: os originais foram arquivados e verificados. Arquivar os bytes não aprova a semântica; os aceites financeiros, de identidade e de sessão dependem das provas descritas no parecer.','',
'| Registro | Antes SHA256 | Depois SHA256 | Razão/alcance |','|---|---|---|---|'];
for(const c of a.changes)text.push('| '+c.file+' | '+c.before+' | '+c.after+' | '+reasons[c.file]+' |');
text.push('','Todos os originais existem em authorized-sources-before, no runtime pr3-expanded-residual-20261029-01, sob o mesmo caminho relativo. auditar.mjs compara os sete hashes anteriores com o manifest de 36, com os bytes arquivados e com a versão Git da base (considerando apenas a variante LF/CRLF efetivamente comprovada pelo hash). Não restaura o fonte atual. Os caminhos absolutos de cada arquivo arquivado constam em PRESERVACAO.json.','',
'Os três scripts da revisão independente anterior alterados por localização não pertencem a esses sete registros do manifest de 36. A análise do diff confirma alteração única de caminho em cada script; os outros arquivos da revisão anterior não mudaram. O snapshot de 21 arquivos anterior às edições funcionais permanece íntegro. Manifests e resultados antigos foram mantidos; a aceitação parcial da geometria nesta revisão não reescreve o relatório do implementador.','',
'97 históricos intactos; 36 registros =29 intactos+7 alterações declaradas. Não somar os dois conjuntos como se fossem disjuntos.');
fs.writeFileSync(path.join(out,'REGISTROS-36.md'),text.join('\n')+'\n');
fs.writeFileSync(path.join(out,'PRESERVACAO.json'),JSON.stringify({reviewDate:'2026-11-01',initial:a,authorization:{attachment:'28254f9a-a85d-4755-9804-8b62155fa08e/Texto colado.txt',sha256:'e6c5dae6024c9b90a14cdbb5c13d94c19fca6f51fa1ca4e16e1e0505fbae8030',readFromUserMessageInThread:'01a187e1-8b19-75a0-b04a-f075eab7fb1e',sections:[2,5,8,12,16]},reasons},null,2)+'\n');
console.log('Seven originals and authorization recorded; historical manifests unchanged.');
