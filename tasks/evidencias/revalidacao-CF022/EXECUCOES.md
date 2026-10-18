# Execuções e reprodutibilidade — 16/10/2026, America/Sao_Paulo

Logs Java usam UTC17/10; execução terminou23:30 de16/10 no fuso do usuário.
Entrada/intervalo conferidos por git status, branch, rev-parse, log e diff.
HEAD0bab205, basee1c6312, commits9cc4662/dcf0721/0bab205; nenhuma alteração posterior
na entrada. Diff144 caminhos somente em tasks: provas/documentação e procedimento
de integração. Produto e harness compartilhado intactos; staging inicial vazio.

## Comandos e resultados novos

Da raiz:

```powershell
node tasks/evidencias/revalidacao-CF022/prepare.cjs
& ./tasks/evidencias/revalidacao-CF022/run-scheduler.ps1
$env:PLAYWRIGHT_BROWSERS_PATH='0'
node tasks/evidencias/revalidacao-CF022/clock-probe.cjs
node tasks/evidencias/revalidacao-CF022/verify.cjs
```

prepare recusa runtime existente; clock recusa resultado existente; scheduler
recusa log existente. Para nova execução usar pasta nova com esses scripts, não
sobrescrever provas. A exportação git contém somente backend do candidato; probe
novo é acrescentado somente nela. Nenhum script da investigação antiga foi executado.

| Prova | Resultado | Limite |
|---|---|---|
| candidate-hashes.json |134/134 hashes conferidos | Bytes do candidato, não evidência de comportamento por si |
| scheduler.log e scheduler/* |1 teste,0 falhas/erros/skips; fresca/residual/isolada PASS | Três chamadas ao caso original, nove despachos; não nove testes independentes |
| clock.log |ERR_NETWORK_ACCESS_DENIED em localhost no sandbox | Falha ambiental antes da contraprova, preservada |
| clock-unsandboxed.log + clock-result.json |16 observações PASS em dois modos/dois fusos após liberar acesso local | Uma execução fora do sandbox; nenhuma assertion ou prazo foi alterado |
| verification.json |1668 arquivos preservados;8 snapshots/16 toggles conferidos; síntese dos experimentos | Não chama os oito percursos antigos de execuções novas |

A consulta inicial docker ps também encontrou permission denied no named pipe;
o teste descartável foi executado fora do sandbox autorizado pelo fluxo de revisão.
Não houve rejeição de aprovação automática nem fallback para banco externo.
JDK21.0.12.1, Node24.18.0, Playwright instalado no projeto, PostgreSQL16-alpine.
O navegador acessou exclusivamente página sintética127.0.0.1. Não houve usuário,
senha, cookie ou API real no probe mecânico. Scheduler usa container/schema novo
e doubles EmailService/MarketDataService de PostgresIntegrationTest.

Não houve erro de observador novo nem ajuste pós-vermelho de expected. As falhas
anteriores de tracingStarted, CRLF, auth e ENOBUFS continuam nos arquivos originais.
Nenhum sleep arbitrário, retry automático, timeout maior ou animação desativada.
As oito esperas por rAF por documento sincronizam observação de frames; o polling
PG250ms observa atividade, sem alterar o prazo do caso original.

## Evidências reutilizadas e limites

Confrontados README/PLANO/LINHA-DO-TEMPO/EXECUCOES/GIT/RJ/H24, probes, quatro
resultados scheduler, observaçõesPG, oito resultados browser, JSON/JSONL e SQL
terminal da investigação. Hashes de todas as134 entradas do manifesto conferem.
Inspecionadas imagens original SP semanal before e Date-only SP semanal marked:
primeira só mostra diário; segunda mostra semanal1/2/Feito Hoje. Não representam
inspeção visual de todas as imagens ou teste de acessibilidade/zoom.

Ocorrências originais conferidas nos achados, playwright.log semanal sem POST,
afetados-verify.log com TimeoutException linha268 e descrição/stack do worker
JDBC em afetados-threads.txt. Aceites DEC08, scheduler/locks/ownership e CF025
reutilizados com seu alcance; não houve auditoria geral nem reexecução de suítes.

Versionados: scripts completos, Java gerado, logs novos, amostrasPG, resultados,
plano/matriz/parecer e hashes. Em investigação-CF022 estão versionados scripts,
patch, snapshots de observador, logs sanitizados, imagens, JSON, SQL e manifesto.
Não é necessário executar .cf22 para ler/conferir essas evidências duráveis.

Locais/ignorados: .cf22, node_modules/Chromium, Maven/JDK, Docker/imagens e runtime
novo compilado. Raw/traces privados da investigação não têm reprodução pública
integral; não houve trace de sucesso exportado. Junction node_modules de .cf22
não é recursada pelo manifest de preservação; preservamos arquivos próprios,
sem alegar hash da árvore externa de dependências. Scripts indicam os caminhos
locais de JDK/cache: outra máquina precisa prover dependências equivalentes.

Para reproduzir jornadas integradas do candidato, seguir sua EXECUCOES em uma
exportação nova e preservar as etapas de reparo do observador/fixtureAPI. Não
reaplicar prepare sobre .cf22. Para o novo scheduler basta a exportação/scripts
desta revisão; o PostgreSQL anterior não é dependência. Capturas/JSON antigos
não substituem trace/calllog ausentes da ocorrência histórica.

## Preservação

1668 arquivos próprios do README, .cf22 e evidências históricas comparados por
SHA256 antes/depois sem divergência. README permanece modificado previamente,
hash6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA,
fora dos commits. .cf22 permanece não versionado. Nenhum clean/reset/remoção de
target; nenhum push/merge/deploy/banco real. Produto principal sem diff contra
0bab205. Todos os processos lançados pelos testes terminaram; containers possuem
o ciclo de vida Testcontainers/Ryuk, sem remoção manual de recursos alheios.

Finalização em 17/10 após retomada: HEAD ainda era 0bab205 e staging vazio;
nenhuma mudança externa nova foi encontrada. Verificador novamente confirmou
1668 arquivos sem divergência e produto sem diff. Primeiro staging encontrou
index.lock permission denied no sandbox; operação explícita foi permitida fora
dele, sem rejeição de aprovação automática. Commit de provas: `d6977a9`.
Parecer e atualização canônica ficam em commits locais separados, posteriores.
Não houve push. A checagem de whitespace de scripts/Java/JSON/Markdown passa;
a checagem integral aponta CRLF/espaços emitidos nos logs, preservados como bytes
por .gitattributes. README raiz, .cf22 e runtime ignorado não entraram no index.
