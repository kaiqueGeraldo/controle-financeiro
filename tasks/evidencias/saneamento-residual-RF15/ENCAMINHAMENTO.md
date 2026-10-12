# Encaminhamento ao mesmo revisor — recorte residual

Revalidar somente os resíduos registrados no parecer cdf0060 e suas regressões diretas. Não solicitar auditoria integral. Branch codex/cf-028-contrato-onboarding; base cdf00606bf1ebc11d37ed0de405569632f9e8b8d. Intervalo completo: cdf0060..HEAD do commit documental deste encaminhamento, incluindo os commits de provas/evidências subsequentes às quatro correções abaixo.

| Commit | Causa |
|---|---|
| 25c3f43 | RF15-02: ocultação imediata no PrivacyBlur, componente causal |
| 92715f8 | RF15-04: composição de cartões ligada ao calendário compartilhado, componentes de eventos/timer/cleanup |
| 8777f60 | CF014: diálogos meta/hábito, descarte e identidade de botões para impedir submit indevido |
| 6b248d2 | CF014: detalhe persistente sob operação de investimento, loading/erro/retorno de foco |
| dfe62a7 | Provas novas de navegador/config e harness PostgreSQL descartável |
| 6824dfc | Evidências anteriores/posteriores, traces, logs e manifests |

Provas originais identificadas por original-hashes.json (160 arquivos), intactas conforme hash-check.json. Regressões novas, resultados intermediários e causas estão no README; recortes/capturas em MATRIZ.md e VISUAL.md. Traces de falha ficam nos subdiretórios browser/*/artifacts. Banco sintético confirmado nos persisted.txt de cada execução. Preservar o diagnóstico com pausa como investigação, não como prova de timing final.

EVIDENCE-SHA256.json registra bytes locais dos 267 artefatos antes do commit (exclui o próprio manifesto e SOURCE-SHA256.json). SOURCE-SHA256.json identifica os 18 arquivos de produto/teste alterados. Git pode normalizar finais de linha de texto; comparar esses manifests com bytes locais preservados, não confundir normalização de checkout com mudança de assertion. Whitespace emitido pelos logs foi conservado. Após a última execução, somente a mensagem descritiva de falha do harness novo e uma linha vazia foram ajustadas; nenhuma condição executável foi alterada.

## Reprodução técnica

PowerShell na raiz; Docker local, dependências já instaladas e Chromium do Playwright disponíveis. JAVA_HOME usado: controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1. Java21, Node24.18.0, PostgreSQL16 descartável, Next16.1.6. Escolher nome novo para evidência, evitando sobrescrever execuções entregues.

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15ResidualBrowserTest' '-Dreview.evidence=revisor-nova-execucao' '-Duser.timezone=UTC' test
```

Harness usa config residual, retries0 e um worker. Inclui originais independent/surfaces/accessibility e investimento da matriz. Exclui PAID real, metas hoje e formulário exploratório já cobertos pelo revisor, pois não são novas lacunas; exclusão explícita em config, sem modificar testes originais. Para recorte isolado, acrescentar -Dreview.grep com título do caso. A rodada final ampla está em after-final (17 verdes); investimento e imagem final da meta tiveram verificações delimitadas posteriores, não 19 cenários distintos.

No diretório controle-financeiro-frontend:

```powershell
npm.cmd run test:component -- rf15- common-ui-accessibility sidebar-accessibility auth-settings-accessibility dashboard-accounts-extract cards-planning-audit goals-investments-habits-annual-audit cf015-invoice-focus cf015-recovery-expanded cf015-payment-reconciliation precision-decimals precision-boundary rv24-original-contract rv24-residual
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Build após terminar o servidor da prova de navegador. Calendários usam relógios explícitos; oráculos de data/estado são literais independentes. Não aumentar timeout nem repetir pagamentos. Rede/SQL pertencem exclusivamente à fixture descartável.

## Decisões ainda exigidas

Conferir os critérios da MATRIZ: ausência de frame monetário privado; atraso atualizado por foco/visibilidade/timer sem mudar datas/competência; Escape somente na camada superior, descarte conforme estado e retorno de foco persistente. Manter aceites RF15-01/RF15-03, CF011, CF009/RV24 e históricos temporais/financeiros salvo regressão demonstrada.

Zoom200 permanece verificação não executada, dependente de capacidade suportada; RVA03 permanece investigação inconclusiva sem hipótese nova. Não inferir encerramento da investigação a partir das correções temporais. CF010/012/013/014/015 continuam em_revisao. Nenhum aceite independente concedido por este executor.

README raiz preservado fora de todos os commits: SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. Sem reescrita de histórico, push, deploy, banco real ou onboarding. Encaminhamento preparado em arquivo, sem mensagem externa automática.
