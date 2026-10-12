# Matriz CF-001–CF-026

> Atualização vigente em 12/10/2026: RF15-01/03 encerrados; RF15-02/04 e resíduos CF014 permanecem abertos. CF011 concluída, CF010/012/013/014/015 em revisão com critérios específicos na [matriz de revalidação](../revalidacao-RF15/MATRIZ.md). Notas e linhas abaixo são snapshots históricos.

> Situação vigente em 11/10/2026: CF-011 concluída; CF-010/012/013/014/015 em revisão por RF15-01–04 e lacunas delimitadas. [Matriz atual por critério](../fechamento-CF-010-CF-015/MATRIZ.md). O conteúdo datado abaixo permanece snapshot histórico; RV24-01/02, RD58 e demais aceites posteriores não são reabertos.

Snapshot documental de 01/10/2026 (America/Sao_Paulo), base `c7f7ffc`.
Os links individuais são canônicos; este snapshot não deve ser mantido como catálogo paralelo.
Somente CF-026 muda de estado. Todos os outros estados são mantidos pelas razões abaixo.

A = implementação/artefato presente; B = validação do executor; C = revisão independente;
D = conclusão do próprio escopo; E = capacidade liberada para dependente; F = aprovação
integrada/publicação. **F não foi concedida a nenhuma tarefa por esta consolidação.**
A/B não implicam C/D; E não implica D/F. Resultados citados são históricos nas bases indicadas.
Para tarefas concluídas, a condição de encerramento já atendida é o conjunto de critérios
com aceite indicado; reabertura exige evidência concreta. Para as abertas, a condição consta
em “pendências e encerramento”. Responsáveis são papéis/tarefas, sem atribuir pessoas inexistentes.

As dependências listadas preservam exatamente o grafo canônico. Integração foi conferida
no HEAD; os aceites de recortes conservam sua base e exigem reconferência se houver mudança.
[Pendências únicas](PENDENCIAS.md) e [decisão de continuidade](README.md) completam a matriz.

## CF-001

- **Canônico / recomendado:** [CF-001](../../00-fundacao/CF-001-criterios-e-oracles.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-001–009](../revisao-CF-001-CF-009/README.md), working tree sobre `169d7be`, integrado até `8dad1c1` (manifesto do conjunto, não aceite de cada commit intermediário).
- **A/B/C/D e critérios comprovados:** Fundação documental presente e validada pelo executor; revisão independente confirma critérios/oráculos e referências. D: escopo de especificação concluído. F-001–017 ligados a critérios; cenários/fixtures independentes, bordas e revisão crítica dos testes existentes.
- **Pendências, responsáveis e encerramento:** Nenhuma pendência própria demonstrada. Não reabrir sem regressão/critério faltante concreto.
- **Dependências / E:** nenhuma. Contrato/oráculos consumíveis por CF-004/016; não certificam runtime.
- **Restrições / F:** Aprovação documental não equivale a produto ou release. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-002

- **Canônico / recomendado:** [CF-002](../../00-fundacao/CF-002-ambiente-backend.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-001–009](../revisao-CF-001-CF-009/README.md), working tree sobre `169d7be`, integrado até `8dad1c1` (manifesto do conjunto, não aceite de cada commit intermediário).
- **A/B/C/D e critérios comprovados:** Harness integrado e autotestado; revisão independente revalida PostgreSQL/JDK 21 e fortalece R16. D: concluída. Persistência/rollback, isolamento A/B, doubles externos e recusa de configuração insegura.
- **Pendências, responsáveis e encerramento:** Nenhuma pendência própria demonstrada; indisponibilidade futura de Docker exige diagnóstico de ambiente, não reabertura automática.
- **Dependências / E:** nenhuma. Infraestrutura descartável para CF-006/007/008/017/023.
- **Restrições / F:** Não autoriza banco real; harness não certifica migração remota. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-003

- **Canônico / recomendado:** [CF-003](../../00-fundacao/CF-003-harness-frontend.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-001–009](../revisao-CF-001-CF-009/README.md), working tree sobre `169d7be`, integrado até `8dad1c1` (manifesto do conjunto, não aceite de cada commit intermediário).
- **A/B/C/D e critérios comprovados:** Harness/comandos presentes; executor demonstrou falha causal; revisão confirma separação smoke/integrado R01. D: concluída. Relógio/fuso/seed, exit não zero, camadas separadas e ausência de sucesso HTTP simulado no integrado.
- **Pendências, responsáveis e encerramento:** Nenhum critério próprio pendente. Audit de dependências/lint historicamente relatados não são prova nova nem reabertura do harness.
- **Dependências / E:** nenhuma. Harness consumível por CF-005/007/008/009/010.
- **Restrições / F:** Não aprova capturas, todas as jornadas ou publicação; dívida lint permanece CF-026. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-004

- **Canônico / recomendado:** [CF-004](../../01-datas-integracao/CF-004-contrato-temporal.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-001–009](../revisao-CF-001-CF-009/README.md), working tree sobre `169d7be`, integrado até `8dad1c1` (manifesto do conjunto, não aceite de cada commit intermediário); [revisão CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35`.
- **A/B/C/D e critérios comprovados:** Contrato integrado, exemplos autotestados e revisão documental independente; D16-T01 posteriormente validado. D: concluída como contrato. Civil/instante/competência, origem desconhecida e hora opcional; inventário ampliado validado em CF-017.
- **Pendências, responsáveis e encerramento:** Nenhuma pendência própria de contrato identificada. Implementação/adoção P01/P02 não confundida com especificação.
- **Dependências / E:** CF-001. Contrato permite trabalho CF-005/006/008/016; base local temporal validada para consumidores pela revisão CF-017.
- **Restrições / F:** Não certifica proveniência histórica, writers remotos ou backfill. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-005

- **Canônico / recomendado:** [CF-005](../../01-datas-integracao/CF-005-datas-frontend.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [revisão CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35`.
- **A/B/C/D e critérios comprovados:** Consumidores e saneamento presentes; executor validou P05; revisão independente revalidou diaProduto/virada/foco e preservou mutações. D: sem aceite integral posterior. Payload/data civil, competência, prazo e P05 revalidados nos cenários; defeito original P05 não continua aberto.
- **Pendências, responsáveis e encerramento:** P01/P02: adoção real permanece aberta; falta parecer final por critério sobre suficiência do recorte local de CF-005 (dono CF-005, coordenação CF-015/017). Encerrar somente com esse confronto, sem presumir bug temporal atual.
- **Dependências / E:** CF-003, CF-004. Contrato temporal sintético revalidado; base usada nas liberações CF-022/023, sem autorização genérica de sucessoras.
- **Restrições / F:** Concluir P05 não aprova rollout nem todo o marco frontend. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-006

- **Canônico / recomendado:** [CF-006](../../01-datas-integracao/CF-006-datas-backend.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [revisão CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`.
- **A/B/C/D e critérios comprovados:** Clock/writers/DTOs integrados e autotestados; revisão temporal e base Flyway aprovadas localmente; DEC-08 posteriormente revisada. D: integral pendente. Calendário do produto, civil/horário, tokens e metadados sintéticos; P01/P02 não fabricam proveniência.
- **Pendências, responsáveis e encerramento:** P01/P02 sob CF-017: schema/proveniência/coordenação de writers e adoção reais; CF-006 deve confrontar todos os critérios/consumidores no parecer de encerramento, aproveitando aceites existentes.
- **Dependências / E:** CF-002, CF-004. Recorte de calendário/migrações para CF-022 explicitamente liberado em revalidação do marco/residual; já consumido.
- **Restrições / F:** Sem liberação de writers em banco existente antes da adoção comprovada. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-007

- **Canônico / recomendado:** [CF-007](../../01-datas-integracao/CF-007-e2e-temporal.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [revisão CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35`.
- **A/B/C/D e critérios comprovados:** Jornadas integradas implementadas/executadas; revisão revalidou P03/P04/P05 nos cenários SP/UTC+14. D: falta encerramento integral explícito. UI→BFF→Spring→PG/reload/Excel; PUT de planejamento e relógio do harness corrigidos; diaProduto distinto do navegador.
- **Pendências, responsáveis e encerramento:** Não exigir novamente correção de P04/P05. Dono CF-007/CF-015: confrontar evidência temporal final com critérios; adoção P01/P02 conserva gate CF-017. Encerrar apenas após aceite delimitado, sem alegar migração real.
- **Dependências / E:** CF-002, CF-003, CF-005, CF-006. Jornadas são evidência local da CF-015; pendência remota não invalida cenários sintéticos já comprovados.
- **Restrições / F:** Jornada temporal não é aprovação financeira integrada/produção. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-008

- **Canônico / recomendado:** [CF-008](../../01-datas-integracao/CF-008-erros-e-contratos.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [revisão CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Contratos presentes/autotestados; P03 e R06 revalidados; revisão CF-017 libera contratos necessários à CF-018. D: integral não concedido. 401/403/400/409, 204/binário/abort, PUT e ownership de planejamento nos recortes; D16-T01 validado.
- **Pendências, responsáveis e encerramento:** P01/P02 sob CF-017 e parecer de fechamento dos contratos por CF-008. RV24-01 é falha posterior de consumo de requiresReconciliation (dono derivada/CF-009), não encerrada pela correção HTTP; preservar integração.
- **Dependências / E:** CF-002, CF-003, CF-004. CF-018: HTTP/temporal em PG descartável (revisão CF-017); CF-023: recorte liberado pela revisão residual.
- **Restrições / F:** Sem adoção real ou aprovação de todos os consumidores por contrato HTTP verde. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-009

- **Canônico / recomendado:** [CF-009](../../01-datas-integracao/CF-009-estado-assincrono.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação RV01](../revalidacao-CF-015-RV01/README.md), `f550b9e..e4079a9`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Coordenação integrada/autotestada; R01/R02 e R03/RV01 encerrados independentemente; sessão ampliada revalidada CF-023. D: aberto. Seleção/cache hit, geração/sessão, rollback por entidade, propagação de falha da reconciliação e troca A→B→A nos casos revisados.
- **Pendências, responsáveis e encerramento:** RV24-01 confirma reenvio inseguro de criação; dono derivada/CF-009 com CF-018/020. Fechar por correção causal, único efeito PG após resposta perdida e revisão do contrato consumidor. RVA-03 continua CF-019, sem reabrir R03/RV01 por associação.
- **Dependências / E:** CF-003, CF-008. CF-026 pode manter lint/tipagem conforme liberação residual e confronto atual; preservando erros/estado/sessão e testes de consumidores.
- **Restrições / F:** Não há aceite integral de mutações/jornada enquanto RV24-01 estiver aberto. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-010

- **Canônico / recomendado:** [CF-010](../../02-frontend/CF-010-componentes-comuns.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [revalidação RV01](../revalidacao-CF-015-RV01/README.md), `f550b9e..e4079a9`.
- **A/B/C/D e critérios comprovados:** Componentes corrigidos, executor validou capturas; revisão aceitou foco R08, lint R11 e recortes R10. D: aceite incompleto. Trap/retorno/Escape/aninhado no Chromium e geometria nas larguras examinadas; R09 preservado.
- **Pendências, responsáveis e encerramento:** R10/AC-UI-001: zoom nativo 200% não verificado. Dono CF-010, aceite CF-015. Executar roteiro nativo e inspecionar alcance das ações/scroll/foco; não substituir por viewport nem declarar defeito sem prova.
- **Dependências / E:** CF-003. Componentes com recortes revisados não precisam ser integralmente concluídos para a manutenção CF-026 liberada via CF-015.
- **Restrições / F:** Zoom permanece gate do marco; sem certificação universal de browser/leitor de tela. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-011

- **Canônico / recomendado:** [CF-011](../../02-frontend/CF-011-auth-configuracoes.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Implementação/autotestes presentes; R07 revalidado; CF-023 adiciona aceite dirigido de sessão. D: não há aceite integral desta tarefa. Rascunho/refetch/identidade/cancelar-reabrir; preferências e auth nos cenários registrados; sessão real de duas abas na CF-023.
- **Pendências, responsáveis e encerramento:** Lacuna de aceite integrado próprio: fechar roteiro de recuperação com provedor falso e cruzar preferências/erros/reload/teclado com evidências existentes (dono CF-011/CF-015). RV24-02 permanece derivada de exclusão; CF-023 não certifica esse fluxo.
- **Dependências / E:** CF-008, CF-010. Aceite CF-023 de sessão é reutilizável apenas no seu recorte; não encerra configurações nem zoom.
- **Restrições / F:** Sem aprovação de exclusão completa ou de toda autenticação por fechamento de R07. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-012

- **Canônico / recomendado:** [CF-012](../../02-frontend/CF-012-dashboard-contas-extrato.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`.
- **A/B/C/D e critérios comprovados:** Correções implementadas/autotestadas e recortes revisados; CF-021 aceita agregado global. D: pendência visual própria. R02/R12 e recortes R10 corrigidos; erros/retry; F-018 satisfeito pelo total global/filtros aceitos na CF-021.
- **Pendências, responsáveis e encerramento:** CF-012/CF-015: comprovar matriz autenticada de moeda/privacidade, lista/detalhe e geometria ainda não certificada; reutilizar capturas válidas e executar somente lacunas. Zoom permanece compartilhado CF-010.
- **Dependências / E:** CF-005, CF-008, CF-010. Agregados CF-021 aceitos não exigem nova correção de F-018; lint local segue liberação CF-026.
- **Restrições / F:** Aceite financeiro de agregado não certifica privacidade/visual integral. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-013

- **Canônico / recomendado:** [CF-013](../../02-frontend/CF-013-cartoes-planejamento.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação RV01](../revalidacao-CF-015-RV01/README.md), `f550b9e..e4079a9`; [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md), `e927aea..0099185`.
- **A/B/C/D e critérios comprovados:** Implementação/autotestes e revisões dirigidas presentes. D: cenário integrado com ressalva e sem conclusão integral. R03/RV01, R05/R06/R08 encerrados; pagamento com reload/SQL e recuperação sem novo POST nos cenários aprovados.
- **Pendências, responsáveis e encerramento:** RVA-03 (CF-019, coordenação CF-024) impede certificar interação120 sem ressalva; CF-013/015 devem concluir matriz de estados/lista longa/mobile e zoom compartilhado, confrontando provas existentes. R03/RV01 não é reaberto automaticamente.
- **Dependências / E:** CF-005, CF-008, CF-010. Recibo/backend de CF-019 pode ser consumido localmente em CF-024; lint CF-026 não depende de fechar toda interação.
- **Restrições / F:** Sem aceite irrestrito da jornada de pagamento ou zoom nativo. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-014

- **Canônico / recomendado:** [CF-014](../../02-frontend/CF-014-metas-investimentos-habitos-resumo.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-015](../revisao-CF-015/README.md), `1ced2f0` + candidato local CF-010–014; [revalidação](../revalidacao-CF-015/README.md), `eb40303..681102b`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Consumidores implementados/autotestados; R01/R04 revalidados, CF-020/021 aceitam regras próprias. D: matriz da tarefa não integralmente certificada. Nota via GET/reload/SQL, proteção de rascunho/ano, diaProduto e apresentação de desconhecido nos recortes.
- **Pendências, responsáveis e encerramento:** CF-014/015: consolidar aceites por módulo e completar lacunas da matriz. RJ-022-01/H24-01 são da CF-022; RV24-01 inclui risco de operationModal ainda a verificar dinamicamente. Não fechar consumidores por aceite backend.
- **Dependências / E:** CF-005, CF-008, CF-010. Regras financeiras e backend hábitos aprovados nos limites respectivos; manutenção local CF-026 preserva esses contratos.
- **Restrições / F:** Sem certificação integral de todos os módulos, criação desconhecida ou jornada semanal. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-015

- **Canônico / recomendado:** [CF-015](../../02-frontend/CF-015-revisao-marco-frontend.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação RV01](../revalidacao-CF-015-RV01/README.md), `f550b9e..e4079a9`; [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md), `e927aea..0099185`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Revisão do marco executada e revalidações presentes; evidências de executor e revisor separadas. D: marco não aprovado. R01–R12 nos encerramentos delimitados, com R10 parcial; R03/RV01 confirmado independentemente.
- **Pendências, responsáveis e encerramento:** CF-010/015: zoom nativo 200% e aceites residuais CF-011–014; integrar achados posteriores RV24-01/RVA-03/RJ-022-01 sem atribuir retroativamente novos testes à revisão antiga. Encerrar com parecer do marco que confronte esses gates e seus limites.
- **Dependências / E:** CF-007, CF-009, CF-011, CF-012, CF-013, CF-014. Liberação residual explícita para CF-026; especificação CF-016 teve liberação independente pelas dependências CF-001/004.
- **Restrições / F:** Não aprova frontend integral, onboarding ou publicação. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-016

- **Canônico / recomendado:** [CF-016](../../03-integridade/CF-016-regras-financeiras.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação do marco](../revalidacao-CF-016-CF-021/README.md), candidato `3d64e7a`, revisão registrada em `e927aea`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`.
- **A/B/C/D e critérios comprovados:** Especificação/oráculos integrados e autotestados; revalidação aceita NG-01 decidido. D: escopo normativo concluído. Abertura≠renda, realizado/pendente, destinação≠patrimônio, taxas/estornos/precisão e total proporcional.
- **Pendências, responsáveis e encerramento:** Nenhuma pendência normativa própria. Verificador histórico estrito vermelho em pom.xml é preservado como limite de evidência; não atualizar hashes para fabricar aceite retrospectivo.
- **Dependências / E:** CF-001, CF-004. Contrato normativo consumível por CF-017–021 e demais dependentes dentro de suas condições.
- **Restrições / F:** Não certifica runtime; origem histórica desconhecida não é resolvida por especificação. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-017

- **Canônico / recomendado:** [CF-017](../../03-integridade/CF-017-migracoes.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-017](../revisao-CF-017/README.md), `2269b22..d3fcb35`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Migrações integradas/autotestadas e revisadas localmente: V1/V2, V1–V11, V12 e V13 nas revisões respectivas. D: adoção integral pendente. Vazio/legado sintético, reaplicação/checksum/falha/rollback/validate; V12→V13 local revalidado CF-024.
- **Pendências, responsáveis e encerramento:** RV17-01/02 e P01/P02: dono CF-017/derivada, operação do ambiente alvo para inventário/backup/restore/proveniência/writers. Fechar preflight integral e reconciliação por linha/schema, com evidência real autorizada antes de adoção.
- **Dependências / E:** CF-002, CF-016. CF-018 liberada pela revisão CF-017; CF-022/023 pela residual; versões posteriores aprovadas somente nos upgrades examinados.
- **Restrições / F:** Bloqueia baseline/adoção real e compatibilidade Railway; não impede banco vazio descartável. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-018

- **Canônico / recomendado:** [CF-018](../../03-integridade/CF-018-contas-transacoes.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Produto/autotestes integrados; aceite independente por critério consolidado. D: escopo próprio concluído. Abertura, reserva/arquivo, baixa/transferência/estorno, rollback e mutações; RVI-01/02/03/09/19 e H-01.
- **Pendências, responsáveis e encerramento:** Nenhuma pendência própria restante identificada pelo aceite. RV24-01 afeta consumidor sem chave, sob derivada/CF-009; não reabre automaticamente invariantes backend aceitas.
- **Dependências / E:** CF-008, CF-016, CF-017. CF-008 HTTP/temporal e CF-017 Flyway liberadas no recorte local; CF-024 já consumiu fontes/atomicidade.
- **Restrições / F:** Adoção real CF-017; criação end-to-end RV24-01 não está aprovada. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-019

- **Canônico / recomendado:** [CF-019](../../03-integridade/CF-019-cartoes-faturas.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md), `e927aea..0099185`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Núcleo implementado/autotestado e aprovado independentemente; D: interação120 ainda sem aceite irrestrito. DEC-03, parcelas/ciclo/limite, débito único/intenção/fingerprint/recibo, cron/retry/rollback nos cenários.
- **Pendências, responsáveis e encerramento:** RVA-03: CF-019, coordenação CF-024. Classificar causa no runtime original e comprovar pagamento único com saída de loading ou recuperação sem reenvio; verde posterior não basta.
- **Dependências / E:** CF-006, CF-016, CF-017, CF-018. Backend de pagamento/recibo explicitamente liberado para CF-024 pela revisão conjunta; não exige encerrar RVA-03.
- **Restrições / F:** Ressalva da jornada integrada; banco real/zoom/release continuam gates separados. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-020

- **Canônico / recomendado:** [CF-020](../../03-integridade/CF-020-investimentos-metas.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md), `e927aea..0099185`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Produto/autotestes presentes; correções e critérios consolidados independentemente. D: concluída no escopo próprio. Reserva/capacidade, custo/taxas/venda, avaliação, exclusão/reembolso; RVA-01/02 encerrados preservando histórico null.
- **Pendências, responsáveis e encerramento:** Nenhum defeito próprio restante identificado; RV24-01 em operação de investimento é risco consumidor a verificar na derivada, não prova nova contra custo/avaliação. RVA-03 conserva dono CF-019.
- **Dependências / E:** CF-016, CF-017, CF-018. CF-017 local aprovada; capacidade/custo/compensações fornecidos a CF-024.
- **Restrições / F:** Sem garantia de proveniência real ou de reenvio seguro de todos os clientes. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-021

- **Canônico / recomendado:** [CF-021](../../03-integridade/CF-021-relatorios.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md), `e927aea..0099185`; [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Agregados/consumidores implementados e autotestados; aceite independente por critério. D: próprio escopo concluído. Total global/filtros, posição atual datada, cobertura/caixa/XLSX, H-02 snapshot, RVA-02 e F-018.
- **Pendências, responsáveis e encerramento:** Nenhum critério próprio restante demonstrado. Performance/carga CF-025 e adoção CF-017 são gates próprios; RVA-03 afeta jornada, não prova defeito de agregado.
- **Dependências / E:** CF-018, CF-019, CF-020. Recorte financeiro de CF-019 aceito, RVA-01/02 fechados; agregados/export liberados para CF-025 no parecer CF-024.
- **Restrições / F:** Sem histórico inventado, volume ilimitado seguro ou publicação por aprovação de XLSX. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-022

- **Canônico / recomendado:** [CF-022](../../03-integridade/CF-022-habitos-crons.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`; [entrega CF-025](../CF-025/README.md), base `846c64c`, produto/testes `65ec14e`, documentação `04cad8d`.
- **A/B/C/D e critérios comprovados:** Backend integrado/autotestado e revisão DEC-08 aprovada. Mudança LAZY posterior CF-025 apenas autotestada. D: integral pendente. Calendário/efeito reversível, watermark, locks/retry/rollback, scheduler real, V12 e GoalHistory.
- **Pendências, responsáveis e encerramento:** RJ-022-01 e H24-01, dono CF-022: classificar browser semanal sem POST e timeout de scheduler separadamente, com DOM/rede e locks/fixtures; contraprova causal se houver correção. CF-025 não encerra nenhum deles.
- **Dependências / E:** CF-006, CF-017. Base local liberada pelo parecer residual; backend aprovado permite medir CF-025, explicitamente na revisão CF-024.
- **Restrições / F:** Sem aceite irrestrito da jornada semanal/job ampliado, carga ou legado sem identidade. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-023

- **Canônico / recomendado:** [CF-023](../../03-integridade/CF-023-isolamento-autenticacao.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [parecer CF-022/023](../revisao-CF-022-CF-023/README.md) e [aceite por critério](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), base `9ff1aec`, integrado em `9fa4fae`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Produto e validação executor integrados; revisão independente aceita critérios. D: concluída no recorte entregue. UUID assinado, 401/404, ownership/SQL, reorders/DTO/export/recibos, sessão entre abas e contraprovas.
- **Pendências, responsáveis e encerramento:** Nenhuma pendência própria restante demonstrada. JWT stateless e BroadcastChannel sem fallback são limites assumidos; RV24-02 tem tarefa própria, pois exclusão completa não foi certificada.
- **Dependências / E:** CF-002, CF-008, CF-017. CF-008/017 recortes locais liberados; isolamento aceito fornece dependência CF-024.
- **Restrições / F:** Não certifica pentest, todos os browsers ou exclusão completa de usuário. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-024

- **Canônico / recomendado:** [CF-024](../../03-integridade/CF-024-concorrencia-cache.md): `concluida` (manter).
- **Últimos pareceres aplicáveis e bases:** [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** Backend/DEC-10 integrados/autotestados e revisados independentemente. D: concluída no recorte delimitado pelo parecer. Disputas/rollback reais, 409, protocolo opcional e snapshot V13, ownership, invalidação normal AFTER_COMMIT e mutações.
- **Pendências, responsáveis e encerramento:** RV24-01/02 ficam abertos nos donos; L24-02 impede inferir recuperação durável de cache. Não exigir correção desses fluxos para apagar limites da conclusão backend; evolução precisa escopo e provas próprios.
- **Dependências / E:** CF-018, CF-019, CF-020, CF-023. CF-019 fornece pagamento aprovado apesar de RVA-03; revisão conjunta liberou execução. CF-024 fornece garantias delimitadas para CF-025.
- **Restrições / F:** Sem aprovação de clientes sem chave, exclusão completa, todos os writers/cache distribuído ou publicação. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-025

- **Canônico / recomendado:** [CF-025](../../03-integridade/CF-025-consultas-desempenho.md): `em_revisao` (manter).
- **Últimos pareceres aplicáveis e bases:** [entrega CF-025](../CF-025/README.md), base `846c64c`, produto/testes `65ec14e`, documentação `04cad8d`.
- **A/B/C/D e critérios comprovados:** A: alteração LAZY integrada. B: medições 3/30/120, 7 testes dirigidos e gate 396 do executor. C: revisão independente ainda não realizada. D: não concluída. Executor evidencia SELECTs reorder 121→1 com 120 UPDATEs e preservação de posse/dias/logs/locks; ainda sujeito ao revisor.
- **Pendências, responsáveis e encerramento:** Dono CF-025/revisor independente: confrontar diff, medição causal, consumidores LAZY, paginação/ownership/locks e limites de volume, executar gates pertinentes e emitir aceite. Não tratar 396 verdes como revisão independente.
- **Dependências / E:** CF-021, CF-022, CF-024. Prontidão local concedida na revisão CF-024; backend CF-022 aceito apesar de RJ-022-01/H24-01. Revisão CF-025 pode iniciar.
- **Restrições / F:** Sem SLA/carga/heap ou volume cartão/investimento certificados; CF-033 ainda exige seu aceite e CF-027/032. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).

## CF-026

- **Canônico / recomendado:** [CF-026](../../03-integridade/CF-026-lint-tipagem-frontend.md): `bloqueada → pronta` (inicial → atualizado; recomendado `pronta`).
- **Últimos pareceres aplicáveis e bases:** [preparação CF-026](../CF-026/README.md), `04cad8d`, registrada em `c7f7ffc`; confronto documental atual nesse HEAD; [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md), `e927aea..0099185`; [revisão CF-024](../revisao-CF-024/README.md), produto `dbf828e`, base examinada `f225657`, fechamento `846c64c`.
- **A/B/C/D e critérios comprovados:** A: nenhuma correção de lint nesta tarefa. B: diagnóstico23/21 e typecheck na preparação. C: liberação independente de recorte, sem revisão de correções inexistentes. D: não concluída. Baseline rastreável; nenhum dos quatro critérios finais aprovado. Decisão documental atual supera bloqueio de c7f7ffc.
- **Pendências, responsáveis e encerramento:** Dono CF-026: executar futuramente lotes com contratos/efeitos preservados, consumidores/cleanup, typecheck/build/lint e revisão proporcional. Sem casts cegos/ignores/exclusões; escalar defeitos funcionais.
- **Dependências / E:** CF-009, CF-015. E: liberação em 0099185 confrontada com revisões posteriores; pronta somente para lint/tipagem local. Não requer concluir CF-009/015.
- **Restrições / F:** F: nenhuma publicação; CF-032/034 seguem sem esta dependência concluída. Não executada nesta consolidação. Gates integrados/release preservados conforme [PENDENCIAS](PENDENCIAS.md).
