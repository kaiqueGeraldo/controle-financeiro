# Sequência finita e reprodução

Java21 foi indicado explicitamente em JAVA_HOME, com seu bin no PATH; Node24.18.0/libuv1.52.1. Todos os destinos eram novos sob `../controle-financeiro-runtimes/preparacao-adocao/rvpla05-`. Escrita/processos nesse diretório externo usaram a autorização correspondente. Não foram emitidos kills por nome, clean/reset ou limpeza geral de target. Em reprodução futura, escolha outros nomes novos; não sobrescreva estes resultados.

```powershell
node tasks/evidencias/saneamento-RVPLA-05/preservar.mjs inicial
node tasks/evidencias/saneamento-RVPLA-05/comparar.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-before-01
node tasks/evidencias/saneamento-RVPLA-05/profile-guard.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-guard-profile-01
node tasks/evidencias/saneamento-RVPLA-05/profile-guard.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-guard-profile-02 ps-markers
node tasks/evidencias/saneamento-RVPLA-05/mailbox-experiment.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-eperm-01
# Observador Get-Acl corrigido; primeira falha mantida
node tasks/evidencias/saneamento-RVPLA-05/mailbox-experiment.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-eperm-02
node tasks/evidencias/saneamento-RVPLA-05/audit-reader.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-audit-reader-before-01
node tasks/evidencias/saneamento-RVPLA-05/profile-guard.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-guard-selfexit-01 ps-markers self-exit
```

A ordem exata dos dois diagnósticos independentes está nos timestamps dos resultados e nesta conversa; eles não usaram mudança de implementação no repositório até a causa de latência ser localizada. A primeira versão do experimento EPERM não gravou um resultado de sucesso: parou no observador e fechou o handle em finally. Arquivos da execução falha mantidos. Depois da alteração proporcional de `owned-process.ps1`:

```powershell
node tasks/evidencias/saneamento-RVPLA-05/prazo.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-latency-mutation-01 mutation
node tasks/evidencias/saneamento-RVPLA-05/regressoes.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-shared-01 shared
```

Commit local762a085. Após a correção separada do canal:

```powershell
node tasks/evidencias/saneamento-RVPLA-05/audit-reader.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-audit-reader-after-01
node tasks/evidencias/saneamento-RVPLA-05/audit-causal.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-audit-causal-01
```

`audit-causal` executa o mesmo oracle esperado no módulo antigo e após restauração, salva stdout/stderr de ambos e confere SHA. Commit locald254822. Conjunto de prazo prefixado, executado sequencialmente uma vez cada:

```powershell
node tasks/evidencias/saneamento-RVPLA-05/prazo.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-after-01
node tasks/evidencias/saneamento-RVPLA-05/prazo.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-after-02
node tasks/evidencias/saneamento-RVPLA-05/prazo.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-after-03
node tasks/evidencias/saneamento-RVPLA-05/linhas-do-tempo.mjs
node tasks/evidencias/saneamento-RVPLA-05/regressoes.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-regressions-01
```

`regressoes` executa43 controles e os grupos broker/before-child/handoff/inspection; para no probe completo de abandono por autodesligamento da fixture alheia. Log/resultado negativo preservado. Os dois grupos ainda não executados foram concluídos separadamente, **sem repetir os anteriores**:

```powershell
node ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-regressions-01/tools/tasks/evidencias/saneamento-RVPLA-03/edge-probes.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-regressions-01/edge
node ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-regressions-01/tools/tasks/evidencias/revalidacao-RVPLA-04/canal.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-regressions-01
node tasks/evidencias/saneamento-RVPLA-05/real.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-real-01
```

O driver real exporta834 inputs do commitd254822, executa somente o preflight causal PG17, resume, audit e controle de identidade. Maven deve produzir1 failure de assertion da mutação,0 errors/skips; o observador deve certificar o efeito e restauração. Resume/audit não abrem nova tentativa nem invocam Maven. Não roda package/startup/suíte financeira. O resultado final conserva SHA idêntico do checkpoint. Não é novo build do JAR anterior.

```powershell
node tasks/evidencias/saneamento-RVPLA-05/recursos.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-final-01
node tasks/evidencias/saneamento-RVPLA-05/coletar.mjs
node tasks/evidencias/saneamento-RVPLA-05/auditar.mjs
```

Auditoria de coleta só lê fontes/hashes e confere sintaxe; não reexecuta testes. Staging explícito desta pasta, excluindo README raiz e runtimes; `auditar.mjs --staged` confere os1.559 blobs. Evidências/estados em commit local separado; `preservar.mjs final` registra a fotografia antes desse commit, evitando autorreferência ao próprio hash. HEAD/intervalo completos estão na entrega. Sem push/merge/CI remota/deploy.

O `git diff --cached --check` integral também apontou espaços finais/CR nos logs e XML brutos coletados. Esses bytes foram preservados para manter os hashes das provas; não se editaram saídas de teste para limpar o diagnóstico de formatação. A conferência de whitespace de fontes/documentos foi feita separadamente com exclusão apenas de `tasks/evidencias/saneamento-RVPLA-05/execucao/**`; os1.559 artefatos continuam cobertos pela conferência byte a byte do staging. Nenhuma regra de teste, assertion ou prazo foi desabilitado.
