# Sequência finita da rodada residual

Início27/10 e fechamento28/10/2026, America/Sao_Paulo; recibos guardam UTC. Java21 explícito em JAVA_HOME e no PATH, Node24.18/libuv1.52.1, Docker desktop-linux. Destinos abaixo eram novos sob `../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-`. Para reproduzir, escolher **outros nomes novos**. Escritas/processos na pasta irmã usaram a autorização correspondente; não houve rejeição de aprovação automática nem execução em banco real.

```powershell
node tasks/evidencias/saneamento-RVPLA-05-residual/preservar.mjs inicial
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-before-01
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-profile-01 profile
node tasks/evidencias/saneamento-RVPLA-05-residual/analisar.mjs antes ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-before-01 ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-profile-01
```

ambiente.json foi capturado entre a linha de base e o perfil. Somente depois da decomposição/reconciliação foi escrito PLANO.md e alterada a função de ambiente. Profile é negativo instrumentado, restaurado por SHA. Seguiram-se smoke, contraprova e testes dirigidos, sem repetir até passar:

```powershell
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-smoke-01
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-cost-mutation-01 old-checks
node tasks/evidencias/saneamento-RVPLA-05-residual/checagens.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-checks-01
node tasks/evidencias/saneamento-RVPLA-05-residual/confirmacao.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-confirmation-01
```

A rodada de checagens executou quatro bloqueios e duas mutações isoladas. A falha pré-efeito Docker foi reexecutada em nova geração para comprovar ausência de skip, não para apagar falha de prazo. A confirmação executou geração normal, nova negada com replies antigos, cache sintético incorreto (mesmo oracle vermelho), restauração e reuse legítimo com SHA do checkpoint estável.

Conjunto final de exatamente três execuções, prefixado em PLANO.md antes da rodada, sequencial e sem testes de aplicação concorrentes iniciados pelo executor:

```powershell
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-after-01
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-after-02
node tasks/evidencias/saneamento-RVPLA-05-residual/medir.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-after-03
```

O observador recebeu apenas metadados de ambiente adicionais antes desta rodada; o preload trace permaneceu com mesmo SHA. O helper de implementação e suas dependências têm hashes idênticos nas três execuções. Nenhuma preparação obrigatória de B foi movida para fora dos marcos. O grupo dirigido à última fence foi adicionado após análise do diff: executou **somente dois cenários novos**, sem repetir os seis anteriores:

```powershell
node tasks/evidencias/saneamento-RVPLA-05-residual/checagens.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-fence-01 fence
node tasks/evidencias/saneamento-RVPLA-05-residual/analisar.mjs depois ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-smoke-01 ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-cost-mutation-01 ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-after-01 ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-after-02 ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-after-03
node tasks/evidencias/saneamento-RVPLA-05-residual/regressoes.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-regressions-01
```

Regressões:43 controles, broker4, antes-do-filho1, handoff antigo/corrigido, inspeções2, identidade5, canal2 e complemento alheio aceito. Contadores não somam testes únicos. Adaptações dos drivers guardadas por hash: allowlists de runtime e endereço do slot ativo já aceito; assertions/budgets/lifetime preservados. O original completo com fixture30s não foi reexecutado. Não foi necessário corrigir observador para reclassificar uma falha do candidato nesta rodada.

Commit local e88ee50a de implementação/testes. Em seguida, uma exportação e uma execução PG17 limitada:

```powershell
node tasks/evidencias/saneamento-RVPLA-05-residual/real.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-real-01
node tasks/evidencias/saneamento-RVPLA-05-residual/recursos.mjs ../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-final-01
node tasks/evidencias/saneamento-RVPLA-05-residual/coletar.mjs
```

real.mjs deriva do driver anterior com apenas destino/allowlist adaptados; operando original rvpla04- do controle de identidade foi conservado, sem repetir o erro histórico de plumbing. Executa preflight causal PG17 (1 failure de assertion esperado,0 errors/skips), resume, audit e identidade; não package/startup/suíte financeira. Fonte exportada no e88ee50a,834 inputs restaurados; checkpoint idêntico e uma tentativa. Recursos finais apenas lidos, sem kill. Coleta preserva originais, decodificação/sanitização e nomes compactados; inventário completo dos novos runtimes não apaga históricos.

Depois de registrar estados e preservação final:

```powershell
node tasks/evidencias/saneamento-RVPLA-05-residual/preservar.mjs final
node tasks/evidencias/saneamento-RVPLA-05-residual/auditar.mjs
node tasks/evidencias/saneamento-RVPLA-05-residual/auditar.mjs --staged
```

Staging explícito: esta pasta e quatro notas canônicas de estado; README raiz/runtimes/secrets fora dos commits. Whitespace conferido em fontes/documentos, excluindo somente execucao/** de logs/XML brutos; os bytes dos1.531 artefatos são conferidos no staging por SHA. Não se editam espaços/CR de logs para produzir um diff limpo. A fotografia final antecede o commit documental para evitar autorreferência; hashes completos/intervalo na entrega. Sem push, merge, CI remota ou deploy.
