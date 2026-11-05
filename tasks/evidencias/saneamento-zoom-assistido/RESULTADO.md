# Diagnóstico e saneamento local do zoom assistido

03/11/2026, America/Sao_Paulo. Worktree: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source. Branch: codex/saneamento-pr3-expanded. Base conferida: **02bd83f4262db9292de1f7b402b1fae5cbb6847a**.

**Preparações CF015 e RF15 validadas; protocolo validado por 19 testes sintéticos; cenários nativos completos continuam parciais.** Não houve nova intervenção manual, declaração humana, zoom aplicado por automação ou execução integral de nenhum cenário nativo neste lote.

Commits de implementação: fda5167487c03aa791dd1d35ffbc671a0eb89f57 (preparação) e 117d3c6982958d2276aa5ee94973adb97be6a71d (protocolo/testes). O commit seguinte contém apenas evidências/roteiros/preservação nesta pasta. SHA final e intervalo exato constam na entrega e no recibo privado git-final.json, evitando autorreferência.

## A. Cadastro e preparação

A falha histórica CF015/atendida-02 foi uma espera de URL final de 15s, denominada pelo helper registerSyntheticUser. Seu trace antigo conserva somente etapas: sem rede/DOM do contexto próprio para atribuição causal. **A causa histórica continua delimitada como inconclusiva.** Uma execução posterior verde, isoladamente, não a explica.

A reprodução fria nova em zoom-assistido-20261103-02 conservou helper, identidade por dono, clocks e 15s. Demonstrou:

- PostgreSQL começou com zero usuários e zero na namespace; terminou com um usuário e uma conta inicial. Não houve identidade duplicada ou fixture previamente contaminada.
- Campos válidos, sem erro de validação; POST /api/auth/register 200, POST /api/auth/login 200 e leitura autenticada /api/auth/user 200. O 401 anterior ao cadastro é esperado.
- Cookie token HttpOnly presente. Sessão/credenciais funcionaram; nenhum token nem arquivo privado de credenciais foi versionado.
- O destino / não completou a navegação antes do oracle de 15s; a captura mostra **Compiling…**. A falha não comprova rejeição do cadastro nem defeito de produto.

**Causa demonstrada na reprodução: prontidão insuficiente do ambiente Next dev.** O ready original por /auth não assegurava compilação das rotas privadas. Não foi medido quanto da latência do primeiro POST pertence a cada componente; não se atribui todo atraso ao banco, BCrypt ou uma única compilação.

A correção é uma etapa explícita de inicialização em contexto bootstrap isolado. Ela compila as cinco rotas antes de iniciar o cenário. O cadastro UI original do cenário permanece obrigatório, com sua própria identidade e seus 15s. Nenhum sucesso financeiro é simulado; não há bypass de cadastro do spec.

Na contraprova 03, a rota / levou 15.407 ms na inicialização separada; o preparo completo levou 49.542 ms. Depois, o cadastro UI original e a preparação CF015 passaram. São medidas de preparação local, não desempenho normativo do produto.

A conferência 05 ampliou a preparação para **os dois casos**, inclusive fatura da entidade correta e presença da 12ª compra antes do zoom. Dois diagnósticos passaram, zero retries. PostgreSQL: zero usuários inicialmente; ao final 3 usuários (um bootstrap, dois donos dos specs), 5 contas, 2 cartões e 24 compras. A namespace dos cenários contém exatamente 2 usuários. As imagens de fatura foram inspecionadas somente como dados/preparação a 100%; não certificam rolagem, foco ou leitura a 200%.

CF015 conservou o relógio real do navegador e a fatura de novembro/2026. RF15 conservou Date fixado em 15/01/2027 e sua fatura de janeiro/2027. Não houve transferência de clock entre os cenários.

## Tentativas e primeiras falhas preservadas

| Runtime sob controle-financeiro-runtimes/preparacao-adocao | Resultado e classificação |
|---|---|
| zoom-assistido-20261103-01 | Observador tentou iniciar tracing já iniciado pelo runner. Falhou antes do cadastro; banco permaneceu vazio. Erro próprio do observador, corrigido por usar o tracing do runner e fechar explicitamente o contexto. |
| zoom-assistido-20261103-02 | Reprodução fria: URL 15s falhou; cadastro/login/leitura autenticada 200 e compilação pendente. Primeira ocorrência útil preservada com rede, DOM, captura e SQL. |
| zoom-assistido-20261103-03 | Contraprova com compilação pronta: preparação CF015 passou, sem zoom. |
| zoom-assistido-20261103-04 | Verificação adicional interrompida por declaração duplicada no observador gerado. Nenhum cenário executado. Erro próprio preservado; nomes corrigidos e listagem obrigatória acrescentada antes de iniciar serviços. |
| zoom-assistido-20261103-05 | Listagem prévia exata de 2 diagnósticos; preparações e faturas CF015/RF15 passaram. Não são passes dos cenários nativos completos. |
| zoom-assistido-20261103-06 | Pacote assistido físico novo, compilado, frio e com os 2 títulos originais listados. Nenhuma invocação nativa iniciada. |

Também ficaram preservadas falhas de implementação detectadas antes de execução: montagem de comando/sintaxe, criação da pasta de suporte na estrutura sintética e a corrida de cancelamento. Esta última produziu 13/14 testes antes da correção e 14/14 depois. Não são defeitos do produto. Nenhum vermelho anterior foi apagado ou compensado por repetição sem hipótese nova.

## B. Confirmação e prazos

Nas três falhas históricas de 60s — CF015/01, RF15/01 e RF15/02 — faltou o conteúdo exato 200% no arquivo local após o poll de razão DPR2. O primeiro procedimento dependia da coordenação das imagens pelo chat; elas chegaram tarde para esse sinal. O painel da segunda invocação não emitiu confirmação; sua causa final não está demonstrada. O CF015/02 sequer chegou ao zoom, pela pré-condição anterior.

**Os 60s mediam coordenação humana, não resposta da aplicação, upload ou desempenho de cadastro.** O contrato foi substituído apenas na cópia assistida por pausa/retomada explícita, identificada e consumível uma vez. O helper de terminal preparado anteriormente foi examinado e preservado; sozinho não provava vínculo com documento/sessão atuais.

O novo mecanismo usa apenas arquivos locais, watcher e lock. Vincula execução/cenário/candidato/pacote/página/documento/URL/título/browser/usuário/sessão/cartão/challenge/momento. A retomada exige revalidar a aplicação. Sinal antigo, alvo trocado, sessão expirada, cancelamento ou execução encerrada não podem aprovar.

A licença de recursos da pausa é de até 5 minutos por caso. Apenas o tempo efetivo de espera humana é excluído do orçamento total original do spec. As assertions funcionais de 15s, o oracle geométrico, os clocks e o envelope de 15 minutos do harness permanecem. A inicialização de compilação tem contrato próprio, anterior ao cenário. [Contrato detalhado](PROTOCOLO.md).

Verificação final: **14 testes de protocolo + 5 testes do adaptador com Chromium real e serviço sintético local = 19 passes**. Cobrem ausência, execução/cenário/pacote/página errados, sinal antigo, cancelamento, consumo único/concorrente, upload posterior, falha após retomada, sessão expirada, troca de documento/entidade, expiração durante revalidação e interrupção pré-retomada.

As confirmações desses testes são marcadas synthetic-test. Não medem nem certificam zoom nativo. **A operação real do novo terminal por uma pessoa e o fluxo nativo completo ainda não foram executados.** Não foi canalizada declaração artificial para um terminal humano.

A validação estrutural da cópia assistida passou: dois specs e configuração válidos para leitura/transpilação; o bloco funcional desde const after até observations.json é byte a byte o original. Não houve alteração de produto, query, migration, dependência, runtime instalado, resultado esperado ou critério visual.

## C–F. Estados separados e critérios

| Estado | Conclusão |
|---|---|
| A — Cadastro/preparação | Validados os dois preparos e suas faturas. Correção de prontidão sustentada por reprodução/contraprova; causa histórica não inventada. |
| B — Protocolo assistido | Implementado e validado sinteticamente/com navegador; operação humana real e continuidade dos cenários pendentes. |
| C — Zoom nativo comprovado | RF15 histórico 100%→200% preservado e imagens reinspecionadas. Nenhuma nova prova nativa. CF015 histórico continua insuficiente. |
| D — CF015 completo | **Parcial**, sem novo ensaio nativo. N04–N11 após retomada não executados. |
| E — RF15 completo | **Parcial**, sem novo ensaio nativo. Percentual histórico 200% não aprova ações/overlays/foco. N04–N11 não executados. |
| F — Revisão/expanded | Candidato delimitado disponível para revisão e retomada assistida. Expanded integral não pronta/não executada; PR#3 sem liberação de merge. |

Confronto com a [matriz original N01–N12](../validacao-zoom-nativo/MATRIZ.md):

| Critério | CF015 | RF15 |
|---|---|---|
| N01 — cadastro/dados/entidade | Preparação e fatura conferidas a 100% | Preparação e fatura conferidas a 100% |
| N02 — página/baseline | /cartoes, Carteira, outer 1440×1000, inner 1424×905, DPR1, scale1; sem nova captura do indicador nativo 100% | Mesmas métricas; menu 100% histórico preservado |
| N03 — percentual nativo/declaração atual | Sem comprovação suficiente do percentual e sem declaração atual | Menu 100%/200% histórico comprovado; sem declaração atual |
| N04 — geometria final após confirmação | Não executado | Não executado |
| N05 — conteúdo/ações/recortes das 5 rotas a 200% | Não executado | Não executado |
| N06–N07 — transação e retorno de foco a 200% | Não executado | Não executado |
| N08–N09 — fatura longa/rolagem/entidade a 200% | Não executado; conferência a 100% não substitui | Não executado; conferência a 100% não substitui |
| N10–N11 — pagamento aninhado, botão/teclado/Escape/foco a 200% | Não executado | Não executado |
| N12 — recursos próprios | Contextos/processos/contêineres encerrados | Contextos/processos/contêineres encerrados |

Navegadores observados na preparação 05: Chromium 153.0.8010.12 e Chrome 155.0.8059.84; Playwright 1.63.0, Node 24.18.0, JDK 21 do driver, PostgreSQL 16.15 descartável, Flyway real. Resolução/escala do monitor da futura rodada ainda devem ser registradas; DPR1 não prova escala do Windows.

AC-UI-001 continua aberto; CF010/aceite1 e CF015 permanecem em_revisao. Mesmo dois passes futuros não cobrem automaticamente 360×800, temas, tokens longos e consumidores/onboarding. RR3-01 permanece aceito somente no contrato anterior de atribuição/pintura; não foi reaberto ou ampliado.

## Preservação e recursos

Conferência inicial/final aprovada: **1.124 arquivos iniciais intactos**, incluindo os 1.112 anteriores e os 12 da validação de zoom. Conferidos também 1.087 do candidato, 97 protegidos, 36 registros vigentes, 7 originais arquivados e manifest 1053 (1.051 idênticos + 2 deltas autorizados com originais). Os 75 artefatos históricos e as 8 capturas humanas conservaram os hashes.

SHA-256 dos READMEs, inicial=final:

- Principal: 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
- Worktree: E7D3458FBD8AC227520BE27996CE23C73E8C3BE2086D8CFBD51AD59568F4CEE0.

A diferença entre os READMEs já existia e está documentada na etapa anterior. Não houve restauração automática. Principal conserva c16e6545488c8f13efda4dab9efa8aa896fcddaa, branch codex/saneamento-cpa01-selecao-testes e somente M README.md preexistente. Publicação limpa conserva 1c4173f2e9a8bd459a9f2ecd4acf2d803245be88. Nenhuma worktree movida, limpeza geral de target, git clean ou reset destrutivo.

Inventário final: zero processos Java/Node próprios, zero contêineres próprios ativos e nenhum listener 3107. Serviços de produto de terceiros não foram encerrados. Runtimes, primeiras falhas, capturas e traces ficam privados; o Git contém scripts, síntese sanitizada e referências/hashes em [RESULTADOS.json](RESULTADOS.json).

## Retomada específica e encaminhamento

O pacote 06, candidato 117d3c6982958d2276aa5ee94973adb97be6a71d, está compilado, frio e lista exatamente os dois títulos originais. Pode iniciar **um** cenário quando houver operador disponível; o segundo precisa de runtime novo. Não há página/janela ativa ou confirmação reutilizável neste momento.

Para retomar no chat, informar disponibilidade para **CF015 com o pacote 06**. Isso não é confirmação de zoom. O agente inicia o caso, confere a página/preparação atuais e abre o terminal; só então o operador captura 100%, ajusta 200% no menu correto e digita a frase vinculada à execução. As imagens chegam depois, sem cronômetro de upload. [Procedimento completo](RETOMADA.md).

Após confirmação válida, executar os passos originais completos e revisar cada evidência. Se houver falha, preservar/classificar/parar; sem correção de produto em meio à prova. Depois dos dois cenários completos, submeter à avaliação independente antes de qualquer aceite global. [Encaminhamento delimitado](ENCAMINHAMENTO.md).

Sem autoaprovação, push, atualização de PR, CI remota, merge, expanded integral, hospedagem, deploy ou acesso a banco real.
