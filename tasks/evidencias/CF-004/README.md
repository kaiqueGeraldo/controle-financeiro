# Evidência CF-004 — Contrato temporal

- Estado: concluida em 08/09/2026, limitada à definição e verificação do contrato.
- Executor: GPT-6 Astra, esforço herdado da sessão; nenhuma troca de modelo ou revisão independente foi acionada pelo Markdown.
- Base: main, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, com patch local de CF-001/002/003 e correções anteriores. [Snapshot inicial](base-inicial.json): 426 arquivos antes de editar, incluindo arquivos não rastreados. Não houve branch/reset/stash/commit/push.
- Dependência efetiva: CF-001 concluída e integrada nesta base local. CF-002/003 também constam concluídas; nenhuma tarefa seguinte foi executada.
- Dados: somente exemplos sintéticos, seed `cf004-v1`. Nenhum acesso a banco/conta remota, e-mail ou deploy.

## Entrega e resultado esperado

Contrato na [SPEC-002](../../../docs/sdd/specs/002-datas.md), [inventário de 22 grupos e 21 exemplos HTTP](../../../controle-financeiro-frontend/src/types/temporal-contract/inventory.md), [vetores literais](../../../controle-financeiro-frontend/src/types/temporal-contract/examples.json) e [verificador documental](../../../controle-financeiro-frontend/src/types/temporal-contract/validate.mjs). Os artefatos em src/types não são importados pelo runtime.

O resultado vem de SPEC-002 original, critérios/oracles da CF-001, ADR-003 e decisões explícitas CF-004. Código determina o inventário de fronteiras, não os valores esperados. DEC-01 define hoje por consumidor e página aberta; DEC-02 separa hora/auditoria e migração com proveniência; DEC-05 define ausência/validação/marcador neutro. A matriz SPEC-003 recebe apenas referências às decisões, preservando os 39 critérios e fixtures originais.

## Falha anterior e limites de interpretação

Esta é entrega de contrato, sem correção de runtime. Não há vermelho/verde novo de produto nem alegação de que a API atende aos exemplos. DateUtil substituindo entrada inválida, createdAt misto, histórico de investimento e entidades expostas foram inspecionados no código; não houve reprodução HTTP/banco nesta execução. Correções e mutações de produto continuam com CF-005/006/007/008/015.

Ocorrências de preparação: caminho com acento fornecido não existe, resolvido para `01-datas-integracao`; uma busca usou brace expansion incompatível com PowerShell e foi refeita; primeira tentativa de patch documental foi rejeitada por operações duplicadas no mesmo alvo e não alterou arquivo. Primeira execução do verificador chegou à checagem de links e falhou com ENOENT porque este README ainda não existia. São erros de preparação/completude de artefato, não regressões de produto. Nenhuma assertion foi removida para resolver essas ocorrências.

## Critério → evidência

| Aceite | Resultado esperado e entrega | Evidência |
|---|---|---|
| Cada data financeira/meta/hábito com contrato request/response | 22 grupos CT-01–22, 21 exemplos E01–21; inventário distingue campos em DTO, entidade, query/Map e efeitos automáticos. Formatos/fusos/nulabilidade/origem/persistência/consumo mapeados. | Scanner conferiu 37 declarações temporais de DTOs Java e 14 de types/index.ts; fronteiras indiretas revisadas manualmente. [contrato.txt](contrato.txt). |
| Civil invariável, offsets equivalentes, competência sem dia 31 | Literais da SPEC-002/CF-001, casos bissextos/invalidade, meia-noite, seis navegações, três offsets e escrita/edição independente de auditoria. | Verificador documental passou em três processos TZ; 15 execuções do helper existente passaram. [unitarios-existentes.txt](unitarios-existentes.txt). |
| Legado não recebe Z por suposição | Casos com origem desconhecida mantêm instante/data operacional indeterminados; só origem civil/offset comprovados autorizam normalização no plano de migração. | Mutação assume-utc rejeitada por assertion causal; plano separa os tipos e preserva originais. |
| Evidência/limitações sem enfraquecimento | Testes e fixtures preexistentes preservados; mutações documentais isoladas em memória e encerradas; nenhuma tolerância/retry/skip/only adicionados. | [mutacoes.txt](mutacoes.txt), [preservacao.json](preservacao.json), manifesto final. |

## Comandos e resultados

Raiz do repositório, salvo indicação. Runtime: Node 24.18.0, Windows/PowerShell locais, [runtime.json](runtime.json). Não há navegador, viewport, Java ou banco executados nesta tarefa. Fusos: America/Sao_Paulo, UTC e Pacific/Kiritimati.

| Comando | Resultado | Alcance/log |
|---|---|---|
| `$env:TZ='<fuso>'; node controle-financeiro-frontend/src/types/temporal-contract/validate.mjs` para cada um dos três fusos | exit 0 nos três processos | [contrato.txt](contrato.txt). 22 grupos, 21 exemplos, 37 campos Java/14 TS, 12 links locais; 12 combinações de browser + quatro de produto por execução. Verifica artefatos, não produto. |
| `node controle-financeiro-frontend/tests/oracles/validate.mjs` | exit 0 | [oracles-cf001.txt](oracles-cf001.txt): 39 critérios, 17 achados, 31 cenários, 51 links; verificador original não alterado. Valida consumidor da atualização de referências DEC na SPEC-003. |
| `node controle-financeiro-frontend/scripts/test.mjs` | exit 0, 5 testes × 3 fusos = 15 passes, zero skips | [unitarios-existentes.txt](unitarios-existentes.txt). Testes existentes de helper sem edição; aviso MODULE_TYPELESS_PACKAGE_JSON preservado. Não comprovam as novas regras de página aberta/DTOs. |
| `node controle-financeiro-frontend/src/types/temporal-contract/validate.mjs --mutation=<nome>` | **exit 1 em cada uma das cinco mutações** | [mutacoes.txt](mutacoes.txt). Assertions específicas abaixo; falha esperada de artefato adulterado. |
| `npm.cmd run typecheck`, diretório frontend | exit 0 | [typecheck.txt](typecheck.txt). |
| `node node_modules/eslint/bin/eslint.js src/types/temporal-contract/validate.mjs`, diretório frontend | exit 0, nenhum erro/aviso | [lint-verificador.txt](lint-verificador.txt). Lint restrito ao JavaScript novo. |
| `git diff --check` + conferência dos arquivos novos por linha | exit 0 / sem whitespace inválido | [fechamento.txt](fechamento.txt). Git diff não cobre os arquivos não rastreados; conferência adicional cobriu os entregáveis. |
| Comparação SHA-256 com base-inicial.json | 423 de 426 arquivos preexistentes idênticos; só três documentos autorizados mudaram; nenhum ausente/inesperado | [preservacao.json](preservacao.json). |

## Verificação adversarial

Cada execução usa JSON.parse do mesmo arquivo para obter uma cópia isolada em memória; a mutação muda só essa cópia e encerra o processo. Nenhuma mutação é importada pelo runtime. Os arquivos fonte/fixtures em disco permanecem intactos, com SHA-256 antes/depois no log; não houve cópia de runtime a restaurar. O [registro dos deltas](mutacoes.json) explicita cada alteração. O validador normal aprovado usa exatamente as mesmas assertions.

| Mutação | Falha detectada, exit 1 |
|---|---|
| civil-shift | Response do exemplo E01 muda de 07 para 08 sem mudar request: “Data explícita deve sobreviver ao round trip”. |
| assume-utc | Legado sem origem recebe UTC inventado: “Origem desconhecida não recebe UTC”. |
| month-overflow | Janeiro/31 +1 muda para março: “Competência muda exatamente um mês”. |
| rewrite-default | Meia-noite muda default de formulário já aberto: “Meia-noite não reescreve formulário default”. |
| rewrite-audit | Editar operação troca recordedAt: “Edição não reescreve auditoria”. |

Isso demonstra sensibilidade do **verificador documental**, não mutation testing dos componentes, Java ou serializadores. Não atribuir essa evidência às correções futuras.

## Revisão do executor e limitações

- Revisão crítica pelo executor confrontou campos diretos/indiretos, data operacional versus registro, nulabilidade, formatos legados e efeitos bancários. Scanner textual cobre o formato atual de records/interfaces; não é parser OpenAPI nem prova de payload real. Ele usa código só para exigir presença no inventário, nunca para gerar expected comportamental.
- Pontos de atenção para CF-005/006/008: createdAt misto/editável, DateUtil com fallback silencioso, investimento gravando dia atual no efeito bancário, histórico LocalDateTime misto, Habit.createdAt exigido no TS mas ausente do DTO, PUT de planejamento sem rota correspondente e entidades expostas com campos indiretos. São divergências de contrato observadas em inspeção, sem alegação de reprodução E2E nova. Não foram corrigidas fora desta tarefa.
- **Gate de schema:** time nullable/recordedAt separados ainda não existem. NOT NULL do legado impede representar hora desconhecida sem evolução; CF-006 deve registrar pendência dependente da CF-017 e não inserir meia-noite/hora atual para passar. CF-017 depende de inventário real/proveniência/backup, não de suposição sobre Railway.
- DEC-03 permanece CF-019 (ciclo/dias 29–31, CF-013 coordena cópia de vencimento); DEC-08 permanece CF-022 (semana/streak/efeito em meta). Admissibilidade de criar meta com prazo passado/presente permanece CF-020; status de meta já existente foi definido. Relatórios históricos seguem CF-016/021. Esses limites não impedem concluir o contrato documental, mas impedem aprovar os comportamentos dependentes sem decisão/implementação.
- Instantes de auditoria usam São Paulo para exibição; defaults e atraso visual de meta continuam locais por compatibilidade com SPEC-002/CF-001. Viajantes podem ver hoje diferente do dia automático de hábitos/servidor; limitação deliberada, descrita no contrato. Fuso por usuário não implementado.
- Sem integração/HTTP real/PostgreSQL, componente, E2E, inspeção visual, build, lint global ou CI remoto nesta tarefa. Nenhum screenshot/trace foi produzido. A evidência anterior de CF-003 não foi reapresentada como execução desta tarefa. Baseline de lint/audit/build de CF-003 não foi recontado nem corrigido.
- Nenhuma revisão independente executada; sugestão de revisor na tarefa não equivale a revisão. CF-015/033 mantêm os gates do produto. N+1/EXPLAIN/concorrência/crons não medidos: apenas trade-offs e responsabilidades registrados, sem claim de desempenho ou integridade implementada.

## Preservação, revisão exata e sequência

Os três documentos modificados são `docs/sdd/specs/002-datas.md`, referências DEC-01/02/05 de `docs/sdd/specs/003-criterios-oracles.md` e o arquivo CF-004. Código de produto, helpers, testes anteriores, package/lockfile, CI e demais tarefas ficaram byte a byte preservados. Artefatos novos estão em src/types/temporal-contract e tasks/evidencias/CF-004. [Manifesto da entrega](entrega-sha256.json) identifica a revisão exata, porque HEAD sozinho não contém o patch local; [status final](git-status-final.txt).

Para revalidar preservação, comparar cada path/sha256 de base-inicial.json com Get-FileHash, permitindo somente os três documentos acima; ausência ou diferença adicional é erro. Esse procedimento **não autoriza restaurar** arquivos. Hashes podem mudar legitimamente em tarefas futuras.

CF-004 libera **CF-005, CF-006, CF-008 e CF-016** para início nesta base, com ressalvas de rollout/schema documentadas. CF-010 já estava liberada por CF-003; CF-007 continua aguardando CF-005/006 e CF-009 aguarda CF-008. [Conferência das dependências](dependencias.json). Nenhuma tarefa seguinte foi iniciada ou teve estado alterado. Outro checkout precisa integrar o patch local completo antes de usar esta conclusão.
