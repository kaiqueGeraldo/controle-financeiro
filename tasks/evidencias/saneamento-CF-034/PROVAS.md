# Comandos, provas e falhas preservadas

Base inicial:8d58207; staging vazio, somente README raiz preexistente. Sem AGENTS.md nos ancestrais/repo consultados; aplicadas instruções AGENTS fornecidas pelo usuário. Git remotes/upstreams/worktree conferidos sem fetch: uma worktree, branch codex/cf034-ci-local sem upstream; origin permanece o destino histórico. Nenhuma referência remota alterada.

Antes de qualquer correção, baseline.mjs calculou SHA256 dos três probes originais e conferiu os3.165 arquivos contra o inventário independente (zero mudanças). Executou cópias dos probes originais em s01, mudando somente URLs dos imports e destino das novas saídas, para não sobrescrever a revisão. Assertions, sentinelas, comandos, limites12s/1,5s foram preservados. Fonte original e SHA estão em baseline-inputs.json; cópias e seus hashes/saídas estão em s01/*.execution.json.

```text
node tasks/evidencias/saneamento-CF-034/baseline.mjs ../controle-financeiro-runtimes/CF-034/s01
node --test .github/scripts/ci.test.mjs .github/scripts/sanitize.test.mjs
node tasks/evidencias/saneamento-CF-034/proofs.mjs ../controle-financeiro-runtimes/CF-034/s08
node tasks/evidencias/saneamento-CF-034/supplement.mjs ../controle-financeiro-runtimes/CF-034/s07
node tasks/evidencias/saneamento-CF-034/finalize.mjs
```

Usar diretórios novos ao reproduzir; os exemplos existentes devem ser preservados. TEMP/TMP foram apontados para s02/temp nas execuções autorizadas. Os probes principais usam npm com cache próprio/offline e lockfile sem dependências. O suplemento usa também fixture sem dependências e npm ci sem audit/fund; nessas execuções não foi configurado cache/offline no wrapper do suplemento, nem foi necessário baixar dependências. Nenhum Maven, banco, Docker, browser ou serviço de produto foi iniciado. Versões/inputs reais constam de execution-trace.json. Não há nova compilação, empacotamento ou E2E de produto alegados.

| Prova | Resultado / interpretação |
|---|---|
| Sanitização original antes | Plain/JWT retirados; JSON/Bearer/cookie sobrevivem, diagnóstico mantido; defeito confirmado somente com sentinelas |
| Mesmos bytes depois | Três formatos retirados de public/backend.log; bruto SHA b59b7f23… permanece; representação SHA2e3418db… distinta |
| Controles Node |8/8, zero skips/fail/cancel/todo:4 originais do runner e4 novos sanitização/coleta, sem somar cenários internos |
| Mutação sanitizador | Algoritmo original em cópia restabelece exatamente as três passagens; restauração SHA e coleta corrigida aprovadas |
| Filho não zero | CLI real:23→runner1, só install/lint; sem build/backend/E2E/pacote |
| Relatório obrigatório ausente | Componentes exit0 sem JSON→runner1; gate posterior bloqueado; fixtures TAP são sintéticas, não testes de datas |
| JAR adulterado | Um byte em cópia do JAR histórico→runner1 Package changed, sem artifact; bytes restaurados por SHA; original intocado |
| Cancelamento ativo | Filho/grandchild prontos, ppid relacionado; handles abertos antes do pedido; ambos sinalizados antes de20s, sem natural marker; runner130/cancelled, sem próximo gate, porta reaproveitável e processo alheio preservado |
| Inicialização/repetição/terminal | Pedido logo após control.json; repetido sem novo efeito. Exit17 e argumentos especiais preservados. Suplemento coordena término normal/handle de descendente; exit0 observado antes de pedir cancelamento tardio, que é no-op |
| Mutação Job Object | Apenas flag KILL_ON_JOB_CLOSE removida na cópia: dois handles dão WAIT_TIMEOUT258/STILL_ACTIVE259; terminações naturais após20s preservadas. Restauração SHA e controle repetem término efetivo, sem natural timeout |
| Pai abruptamente morto | Probe original antes observa sobrevivência; depois não observa avanço do heartbeat. A assertion original que exigia o defeito torna-se vermelha como esperado; novo controle exige ausência de sobrevivência. Sem result.json nos dois casos, pois pai foi morto |
| Chunks/console | Subprocesso emite JSON/header em chunks distintos e falha23: sentinelas somente no bruto local; console não contém valores; coleta completa redige e preserva diagnostic=keep |
| Coleta durável | Saída real em sucesso/falha diagnóstica sanitizada; JSON sensível inválido reprova sem liberar coleção final ou ecoar o bruto |
| Workflows | js-yaml parseia ambos jobs; contents:read, needs, uploads public e condição de coleta conferidos. Leitura estática não comprova semântica do Actions |

Falhas intermediárias preservadas:

1. Testes iniciais em temporário do sandbox:3/4 sanitização, EPERM ao renomear pasta. Mesmas assertions passaram no runtime externo autorizado. Nenhum fallback/copiar bruto foi introduzido. O temporário do sistema dessa tentativa não foi apagado; todos os runtimes planejados ficaram em CF-034.
2. Primeiro supervisor experimental bloqueou antes de iniciar filho: Console.In.ReadToEndAsync do .NET Framework sincronizado bloqueava o chamador. Passou a usar worker Task.Run. Somente supervisor46388, pai41280, criação13:24:38UTC/caminho confirmado foi encerrado; nenhum processo geral foi alvo. Controle normal123/exit0 passou depois. A saída da sessão anterior foi exit4294967295, não gate aprovado.
3. s03: fixture interpretou --max-warnings=0 como papel, não lançou parent/grand; deadline de readiness reprovou. Corrigido argumento explícito parent, mantendo prazo/assertions e preservando s03/proofs-s03.json. Sua ausência de result final não é aprovação. s04 é rodada nova, não retry de regra financeira.
4. s05: teste suplementar tentava observar descendente sem coordenar sua prontidão antes de process.exit do pai. s06 adicionou IPC, mas ainda pressupunha supervisor ativo quando ele já concluíra normalmente: esperava130 e recebeu0. Ambos logs/runtimes preservados. s07 abre handle antes de liberar o término normal e só depois repete cancelamento: o contrato de término normal exige preservar exit0. Isso separa estado terminal do cancelamento ativo; não substitui nem relaxa os controles ativos130 e5s da rodada dirigida. Nenhuma assertion dos probes independentes foi alterada.
5. s08 reconfere scripts finais após registro de ownership/estado terminal. Rodadas s04 e s08 não são somadas; s03/s05/s06 não são chamadas verdes.

Os logs dos comandos acima e dessas falhas estão preservados em s02; cópias duráveis dos logs finais e falhos disponíveis em logs/. Os processos sintéticos tinham encerramento natural de segurança; aprovação de cancelamento depende dos handles/prontidão e ausência do marcador natural, nunca de esperar o prazo natural. O mutante é explicitamente falho, mesmo com experimento exit0 por detectar a falha esperada.

Próximo passo: outra execução deve confrontar 8d58207..HEAD, originais/SHA, deltas de coleta/runner, contraprovas e restaurações. Não tomar a conclusão do executor como aceite. Preservar o parecer independente anterior; só revalidação pode encerrar os achados no alcance que comprovar.
