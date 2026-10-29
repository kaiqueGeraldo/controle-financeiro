# Revisão das interfaces entre lotes

Escopo:33 arquivos do delta de produto/config/testes/CI, scripts operacionais
consumidores e workflows atuais, mais contratos/pareceres finais pertinentes.
Sem auditoria genérica do produto. Revisão estática e provas locais dirigidas;
nenhuma conclusão abaixo é execução remota ou nova suíte financeira.

| Interface produtor → consumidor | Conferência e interação | Conclusão / risco residual |
|---|---|---|
| application.yml/adoption → initializer → JPA/Flyway | Perfil selecionado antes de refresh; initializer via spring.factories; exige validate/Flywayfalse/initnever, recusa DDL alternativo e jobs sem writers. Spring resolved config é a entrada do guard; env/CLI não são ignorados | Contrato coerente com testes aceitos; normal continua Flyway/defaults abertos. Usar só writersfalse fora de adoption não impede migration. Override remoto update precisa tratamento próprio |
| Job de migration → validação API → readiness → GO | Migrations externas atéV16; JPA valida no boot. Writersfalse mantém readiness503 mesmo com DB válido; liveness independe DB | Readiness não abre flags e não é autorização de escrita. Processo restrito não deve ser promovido por healthcheck nem substituir drenagem da instância antiga |
| OperationsState → filtro/security/mail/scheduler | Filtro fecha também GET/OPTIONS/HEAD antes de controlador/autenticação; só GET exato dos probes atravessa. Security dispensa JWT nos mesmos GETs. Scheduler exige writers/jobs true; perfil test fecha jobs e fixture de concorrência reabre explicitamente | Defaults e nomes coincidem; cinco tarefas registradas somente no modo aberto aceito. Email confere writers antes de cliente externo. Não cancela fila/transação anterior ou consumidores externos |
| HealthController → pool/driver/BFF/provedor | Corpo mínimo/no-store; liveness O(1) sem DB; readiness um borrow / isValid de 1s, Hikari3s. Ensaios usaram connect/socket2s; esses parâmetros não estão embutidos no perfil como garantia de qualquer URL | Probes excessivos competem por pool; sem cache novo. Contrato local aceito reaproveitado; latência/pool/cadência operacional e health remoto ainda pendentes |
| BFF preview → destino upstream/config Git | Recusa VERCEL_ENV=preview antes de cookies/body/fetch; usa BACKEND_API_URL no módulo; nomes não mudaram. vercel.json local globalfalse; fluxos production conservam auth/ownership | Contratos BFF aceitos e fontes idênticas ao produtor. Flag depende do ambiente real; preview antigo/manual/API não revogado. Não confundir campo local com configuração salva no provedor |
| Major PG → inventário/snapshot/compare/clientes | Suporte explícito16/17, COMPLETE com major efetiva; catalog só comentário alterado; comparação preserva multiplicidade/constraints/bruto/null. Clientes da mesma major conferidos nos ensaios anteriores | Sem downgrade/upgrade intermajor implícito. Snapshot/restore O(N) I/O/armazenamento e ordenações O(NlogN); tamanho real desconhecido. Nenhuma query de negócio/N+1 nova |
| Runner → ProofStore → observation | Identidade inclui candidato, manifesto, observer/config/ferramentas; status1 requer XML/assertion/efeito causal; logs/recibos por tentativa; restauração por bytes declarados; evidência rehashada antes do reuso | Coerente com RVPLA-01. Checkpoint coletado é evidência de leitura, não resume portátil. As provas originais incompletas não são sucessos; não executar scripts históricos em runtime reaproveitado |
| Broker/Jobs → boundaries → restauração/complete | Jobs próprios por comando; worker selado por criação/membros; operação desconhecida bloqueia. Closed externo precisa ausência do Job, não apenas PID morto. Slots da mailbox não substituem arquivo aberto; agrupamento de checks mantém confirmação atual | Aceites RVPLA-03/04/05 e EPERM preservados. Não houve delta posterior nesses mecanismos. Windows/mesma sessão somente; branch POSIX com ownership recusa em vez de fingir recuperação certificada |
| spawnOwned compartilhado → ci.mjs | CI usa caminho sem ownership, Windows com Job anônimo, POSIX grupo detached. Branch durable Windows é condicionada; .ps1 não é chamada incondicionalmente no runner Linux | Provas anteriores do caminho compartilhado reaproveitadas por diff após762a085. Não usar counterproofs.mjs (Windows/cmd/CIM) diretamente em Linux; não faz parte do workflow atual |
| Processo adoption → porta real → close TCP | Porta0 no listener real, descoberta por log/mapa. Windows nativo consulta endpoints de PID/porta antes do retorno, deadline10s/5s sem renovação, até2s cleanup em erro; imagem e Linux usam ramo próprio | TCP aceito não é certificado de identidade durável contra PID reutilizado nem reserva de porta. Sem extrapolação de estados históricos. Teste Windows foi adicionado sem partição na seleçãoCI: **CPA-01 confirmado** |
| JFR → leitor incremental → análise | Objetos/eventos e separadores examinados; envelope não é JSON estrito completo. O parser só é importado pela análise diagnóstica, não pelo produto/coletorCI | **CPA-02 conhecido**; capturas atuais já têm conferência independente de fechamento/contagens/JSON Docker, inputs intactos. Não ampliar a garantia para nova entrada inválida |
| Verify/manifesto → upload/imagem | JAR hash é ligado ao gate backend e a sourceDigest; pré-requisitos front/backend/E2E antes de package; sourceFor recusa fontes alteradas/extras. Dockerfile.release recebe sóapi.jar e verifica hash/labels | p05 é anterior; novo candidato precisa artifactCI próprio. Workflow atual não cria/testa imagem de release; Dockerfile histórico recompila com skipTests e não representa esta cadeia |

## Workflows e scripts que executarão remotamente

- `ci.yml` e `cf034-remote-probes.yml` não mudaram no delta. Isso não os torna
  compatíveis automaticamente: `suites.mjs` enumera novas classes, inclusive o
  teste Windows. Seis novas classes elevam95→101 no smoke; expanded seleciona116.
- Permissão declarada `contents: read`; checkout `persist-credentials:false`,
  `clean:false`. Sem secret de produção referenciado ou chamada de deploy nos
  workflows. Variáveis efetivas e políticas do repositório exigem reconferência.
- Node 24/Temurin 21 por setup; Maven pelo wrapper; `npm ci` respeita lock. package.json
  não acrescenta install hooks nesse delta. Install/build e download do Chromium
  executam dependências reais, sem garantia de offline. Caches são npm/Maven,
  não resultados de testes/target. Nenhum runtime local p03/p05 é input de CI.
- Linux usa `sh ./mvnw`; Windows/cmd e PowerShell têm ramos explícitos no helper.
  Scripts de prova em tasks que fixam `C:/`, cmd, CIM, Jobs ou dependem p03/p05 são
  históricos/operacionaisWindows e não comandos portáveis a incluir em expanded.
- Coleta allowlist exclui XML properties/SQL/env/traces/perfis/brutos. Falha de
  sanitização não cria public nem fallback bruto; upload de diagnóstico só se collect
  success. Pacote só após gates verdes.13 contratos reexecutados nesta revisão sustentam
  essas fronteiras; não são atestado contra todo segredo desconhecido.
- Caminho externo CF034 é calculado antes das suítes. Upload diagnosis aponta
  `public/`; pacote usa `*.jar` e `public/package-manifest.json`. Nomes levam SHA,
  retenção 7dias; expanded só upload de diagnóstico, sem pacote próprio exposto.
  Não há XML/PlaywrightJSON completo publicado pelo workflow atual, limite conhecido.
- `always()` coleta falha/cancelamento; não é prova de cleanup completo. O runner
  recebe SIGINT/SIGTERM e encerra grupo; Testcontainers/fixtures têm lifecycle
  próprio. Não há cleanup geral `always()` do pipeline real nem concurrency block
  que garanta exclusividade externa. Probe sintético tem cleanup explícito por UUID;
  não generalizar para Ctrl+C, VM abrupta, daemon ou recursos alheiosLinux.
- Push só em main; PR para main e paths backend/frontend/.github/tasks/docs-sdd
  disparam required. Push somente da nova branch não dispara ci.yml; dispatch
  expanded exige input e `needs:required`. Probes sintéticos só no push da antiga
  codex/cf034-ci-local. Não prometer que a branch nova disparará esses probes.
- Não há integração de deploy dentro desses YAMLs. Webhooks/apps do repositório,
  Railway/Vercel e configurações remotas podem reagir fora deles; conferir antes
  do push, sem assumir o estado observado26/10 como atual.

Benefício da implementação operacional: fronteiras simples, ingresso O(1), nenhuma
coordenação distribuída nova. Custo: reinício/drenagem para mudar flags e disciplina
operacional de banco. Benefício de partiçãoCI por OS: preservar o teste Windows e
zero skips nos testes aplicáveis; custo: um job/artefato adicional e dependência explícita.
Não se recomenda reescrever queries, baixar prazos/afrouxar checks ou construir um
supervisorLinux novo como parte da correção pequena de CPA-01.
