# Achados e classificação

## RCI034-01 — P2 — defeito confirmado de sanitização

- **Localização:** `.github/scripts/publish-evidence.mjs:5`, usado nas linhas
  8–11; mesma expressão em `.github/scripts/ci.mjs:26` e
  `tasks/evidencias/CF-034/collect.mjs:13`. Upload elegível em
  `.github/workflows/ci.yml:46–55` e 90–99.
- **Reprodução:** `node tasks/evidencias/revisao-CF-034/review.mjs probes
  ../controle-financeiro-runtimes/CF-034/<novo>`; usar diretório inexistente.
  O probe cria apenas sentinelas, chama o coletor real e examina `public/backend.log`.
  [Execução preservada](probes.json), runtime rv01/sanitization.
- **Esperado:** segredo removido de cada representação suportada de password,
  authorization e cookie; diagnóstico comum e causa da falha preservados.
- **Observado:** `password=SENTINEL_PLAIN` e JWT são removidos, mas
  `{"password":"SENTINEL_JSON"}`, `SENTINEL_BEARER` após o prefixo Authorization
  e `Cookie: session=SENTINEL_COOKIE` sobrevivem. A regex não aceita aspas no
  nome JSON e consome somente a palavra Bearer, não o token subsequente.
  Cookie não tem regra. `diagnostic=keep` e status failed são preservados.
- **Critério violado:** CF034 trabalho 3/aceite 4; PROP-CF034-01/A.3 e DEC-CI-04,
  diagnóstico sanitizado, sem credenciais em evidências/artifacts. Allowlist de
  nomes não torna seguro o conteúdo arbitrário dos logs nela admitidos.
- **Impacto:** logs de erro podem publicar credenciais nessas formas, inclusive
  durante falha (`always()`). Não foi demonstrado vazamento real nem introdução
  de secret de produção. P2 é o risco concreto no mecanismo local de coleta,
  não alegação de incidente remoto. Impede o aceite local da coleta.
- **Encerramento objetivo:** coletor e variantes usados no fluxo removem essas
  sentinelas, valores sensíveis em formatos definidos e segredos divididos entre
  chunks quando aplicável; saída estruturada continua parseável, preserva
  diagnóstico e registra limites. Contraprova vermelha atual e controle corrigido
  devem usar as mesmas entradas. Revalidar conjunto realmente enviado ao upload.
  Não basta proibir traces mantendo logs sem cobertura dos formatos declarados.

## RCI034-L01 — prioridade P2 — lacuna local de cancelamento, cenário delimitado

- **Localização:** `.github/scripts/ci.mjs:41–52,112–120` (spawn/encerramento);
  wrapper Java `FinancialJourneyPostgresE2E.java:92–108` possui finally próprio,
  que não constitui garantia de execução se o processo ancestral for encerrado.
- **Reprodução:** `node tasks/evidencias/revisao-CF-034/cancellation.mjs
  ../controle-financeiro-runtimes/CF-034/<novo>`.
  Runner real executa npm/lint sintético. Após o subprocesso confirmar PID e
  heartbeat, o probe termina **somente o runner pai** via `child.kill('SIGTERM')`
  no Windows. Filho possui término automático em 12s, sem rede/banco.
- **Esperado para uma garantia de cancelamento:** procedimento suportado encerra
  a árvore pertencente à execução e documenta evidência incompleta; nenhum
  processo remanescente é confundido com cleanup concluído.
- **Observado:** pai terminou; heartbeat do filho avançou por mais de 1,5s e
  não houve result.json. Filho terminou pelo seu próprio limite, confirmado
  ausente ao final. Não houve artifact aprovado. [Prova](cancellation.json).
- **Critério/impacto:** PROP-CF034-01/A.3 e aceite 2 da CF034 exigem finalização
  delimitada. A implementação não oferece um protocolo local demonstrado para
  interromper toda a árvore; afirmar cleanup inclusive em cancelamento excede
  a evidência. Processos externos podem sobreviver ao encerramento do pai.
- **Classificação precisa:** o cenário foi reproduzido, mas SIGTERM em Windows
  termina o alvo abruptamente. Não é prova de falha do Ctrl+C em console, nem
  do cancelamento Actions/Linux, nem de um banco efetivamente abandonado.
  Não se exige sobrevivência de finally a kill irrecuperável. Por isso fica
  como lacuna de contrato/prova local, não defeito financeiro ou remoto confirmado.
- **Encerramento objetivo:** delimitar cancelamento suportado e demonstrá-lo
  com subprocesso/recursos próprios; checar término e coleta incompleta. Se
  aborto abrupto exige supervisor/limpeza explícita, documentar e provar o
  procedimento seguro por identidade da execução, sem matar processos alheios.

## Limites sem novo defeito confirmado

**Recibos anteriores:** `.github/scripts/ci.mjs:86,103–111` compara status/source
e hash do JAR, sem run ID, caminho/hash de relatório original ou suite nos recibos.
O probe copia inputs, recibos e JAR da 11 para rv01 e chama `package`: exit0,
status passed, stage package, steps/commands vazios. Isso é comportamento
deliberado já declarado no controle restored-package, e não prova de testes novos.
A rodada `all` 11 tem sequência completa e cadeia independente conferida; não
foi encontrado reuso acidental nela. Um manifesto package isolado não certifica
uma rodada nova nem consegue reconstruir sozinho a origem dos recibos. Recomenda-se
vincular recibos a run ID/suite/relatórios e rotular reempacotamento explicitamente,
antes de introduzir retomada ou consumo automatizado por status apenas.

**Matriz ampliada:** 15 harnesses históricos possuem pré-condições próprias e
não receberam execução/aceite por constarem em suites.mjs. Essa pendência prevista
não invalida automaticamente o smoke autorizado. Seu preparo precisa de etapa
própria; não chamar workflow_dispatch expanded de matriz já operacional.

**Remoto:** eventos, permissões efetivas, Actions/Linux, cancelamento de job,
uploads e checks obrigatórios ausentes são pendências remotas previstas.
**Histórico:** 57 representações antigas continuam não reconstruídas, sem efeito
bloqueante automático sobre a cadeia nova. **Produção/zoom:** limites mantidos,
sem hipóteses convertidas em defeitos.
