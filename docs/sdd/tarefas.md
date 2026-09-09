# Épicos originais — registro histórico

Este documento preserva o plano do diagnóstico inicial. A execução atual foi desdobrada em **36 tarefas individuais na pasta raiz [tasks](../../tasks/README.md)**, priorizando datas e frontend.

Consultar o [catálogo atual](../../tasks/CATALOGO.md) e a [rastreabilidade T/F → CF](../../tasks/RASTREABILIDADE.md). Os estados e a sequência abaixo são históricos; não devem ser usados para selecionar a próxima tarefa ou atualizados como uma segunda fonte de acompanhamento. O estado oficial está em cada arquivo CF.

Cada tarefa deve atualizar sua evidência antes de mudar de implementada para validada. As primeiras correções não encerram o projeto.

| Ordem | ID | Prioridade | Estado | Problemas | Dependências |
|---|---|---|---|---|---|
| 1 | T-001 Diagnóstico/SDD | P1 | validada no escopo inicial | F-008, F-014, F-015 | — |
| 2 | T-002 Calendário frontend | P1 | implementada; regressão e build aprovados, browser pendente | F-001–004 | SPEC-002 |
| 3 | T-003 Contratos/erros | P1 | pronta | F-005–007 | T-001 |
| 4 | T-004 Integridade e abertura | P1 | pronta | F-008–010 | T-001, decisões SPEC-001 |
| 5 | T-005 Migrações e teste backend | P1 | proposta | F-011–012, F-016 | Inventário do banco existente |
| 6 | T-006 Onboarding backend | P1 | proposta | F-008–009 | T-003–005 |
| 7 | T-007 Entrevista frontend | P1 | proposta | F-008 | T-006, SPEC-001 |
| 8 | T-008 Auditoria visual por tela | P1 | pronta | F-015 | Ambiente sintético funcional |
| 9 | T-009 Concorrência/consultas | P1/P2 | proposta | F-007, F-013 | T-004–005 |
| 10 | T-010 Datas backend | P1 | pronta | Investigação temporal | T-002, T-005 |
| 11 | T-011 Qualidade contínua | P1 | proposta | F-012, F-014, F-017 | Baseline de testes e lint |
| 12 | T-012 Homologação/deploy | P1 | proposta | Prontidão operacional | Gates abaixo |

## T-001 — Diagnóstico e especificações

Escopo: inventariar módulos, comparar estrutura da planilha, classificar evidências, fixar primeira versão e registrar decisões/trade-offs. Corrigir instruções de diretórios/versões no README.

Aceite: cada achado aponta fonte e critério de validação; decisões confirmadas do usuário estão incorporadas. Fora: alegar auditoria visual ou financeira completa a partir de leitura estática.

## T-002 — Datas civis e competências

Escopo: SPEC-002, utilitário central sem dependência nova, substituir pontos confirmados; regressão em UTC, São Paulo e UTC+14; adicionar execução no CI frontend.

Aceite: cenários da SPEC-002 passam; build/types verificam integração dos imports. Registrar separadamente falta de browser/backend. Fora: alterar instantes de auditoria ou regras de faturamento sem teste de domínio.

Evidência do lote A: 15 execuções de testes aprovadas, build e typecheck aprovados. As alterações não corrigem automaticamente todos os problemas visuais relatados. Conferência de telas continua em T-008.

## T-003 — Contratos e tratamento de falhas

Escopo: documentar contrato de cada service/DTO/controller; 401 versus 403; validação do Spring, desserialização, 204, erro em download, cancelamento, timeout BFF e reconciliação de mutações. Tipar catch como unknown e substituir any por DTOs onde o contrato já é conhecido. Revisar exports/contexto do Route Handler conforme Next 16.

Aceite: testes de contrato para JSON válido/inválido, campos faltantes, 400/401/403/404/409/503, 204 sem corpo, arquivo binário e AbortError. 403 não causa logout; 401 de API privada conduz à autenticação. Erro não gera toast de sucesso. Fora: troca geral da biblioteca de estado.

## T-004 — Regras financeiras e posições iniciais

Escopo: especificar e testar abertura/ajuste, fluxo pago/pendente, transferência, compra versus pagamento de fatura, dívida inicial, alocação de metas e custo/valor atual de investimento. Decidir se relatório anual usa snapshot histórico ou seção explicitamente atual com indisponibilidade de anos anteriores.

Aceite: fixtures reconciliam patrimônio, saldo disponível, dívida e reservas; saldo inicial não conta como receita; pendentes não entram em realizado; transferências não criam renda; meta vinculada não duplica ativo. Relatório de ano passado não apresenta posição atual como histórica.

Fora: reclassificar transações reais automaticamente pelo texto, usar double para cálculos monetários ou implementar ledger completo sem demonstrar necessidade. Entrega: especificação financeira, DTOs/modelo propostos e testes antes da alteração de schema.

## T-005 — Schema e execução reproduzível do backend

Escopo: obter inventário do schema/versão PostgreSQL, backup e restauração em banco isolado; escolher/adotar migração versionada; baseline compatível com banco existente, incluindo ShedLock; fixar Java 21 no ambiente de verificação; corrigir wrapper Windows se reproduzível fora do sandbox. Criar perfil de teste sem serviços externos reais.

Aceite: banco vazio sobe por migrações; cópia do schema legado migra sem perda; Hibernate validate passa; regressões usam PostgreSQL descartável. Nenhum comando de reset usa produção. Fora: ddl-auto update em produção e baseline-on-migrate indiscriminado.

## T-006 — Finalização idempotente do onboarding

Escopo: endpoints da SPEC-001, rascunho autenticado/versionado, validações de posse/alocação, criação atômica e idempotência; notificações após commit. Integrar inicialização da carteira padrão sem duplicá-la.

Aceite: retomar, falhar no último item, repetir após timeout, finalizar em duas abas e tentar referências de outro usuário; uma única posição correta persiste. Fora: sequência de chamadas de cadastro financeiro no navegador como garantia de atomicidade.

## T-007 — Entrevista inicial

Escopo: etapas condicionais, rascunho no servidor, acessibilidade, revisão final e dashboard pós-confirmação; complemento opt-in para usuários antigos. Definir limites de campos a partir dos contratos T-006.

Aceite: perfil vazio e completo concluem em celular/desktop; voltar/recarregar não perde dados; sem duplicar patrimônio; falha por campo mantém a etapa preenchida; concluído não reinicia. Fora: novos módulos de vida e importação histórica.

## T-008 — Correções visuais com evidência

Escopo: matriz em validacao-deploy.md, temas claro/escuro, privacidade, vazios, erro, carregamento, dados extensos e valores negativos. Para cada defeito criar F/T derivado com tela, viewport, captura anterior, alteração e captura posterior. Dividir componentes grandes somente em trechos necessários às correções.

Aceite: nenhuma ação essencial inacessível em 360px; modais roláveis sem perder botões; foco e teclado funcionam; datas, valores e status consistentes; requests 4xx/5xx deixam estado recuperável. Fora: redesign completo sem motivo funcional.

## T-009 — Concorrência, cache e consultas

Escopo: testar dois pagamentos/aportes/vendas simultâneos, duplo clique, alteração seguida de resposta antiga, cache após commit/rollback e isolamento por usuário. Contar SQL de listagens/reordenação e testar paginação com 1.000+ registros sintéticos.

Aceite: sem débito duplicado/saldo perdido; conflito claro com refetch; resultado antigo não substitui seleção atual; consultas de lista não crescem uma por item; totais independem da página. Registrar p95, dataset e plano SQL antes/depois; definir orçamento após baseline. Fora: otimização baseada só na quantidade de linhas de código.

## T-010 — Relógio e calendário do backend

Escopo: inventariar LocalDate.now/LocalDateTime.now/crons; Clock injetável, zona padrão explícita e semântica de timestamp; testes de fechamento em mês curto, ano bissexto, virada diária/anual e retries de cron.

Aceite: resultado financeiro não muda porque a JVM roda em UTC; crons não repetem efeito; DTOs civis preservam YYYY-MM-DD; migração de timestamp legado depende da origem conhecida. Fora: adicionar Z a LocalDateTime sem conversão comprovada.

## T-011 — CI e manutenção

Escopo: habilitar suites de backend antes de remover skipTests; lint/typecheck/build/test no frontend; baseline de lint triado por regra/arquivo; proteger contra novas violações e eliminar antigas em lotes; documentação executável, versões e variáveis corretas.

Aceite: PR com falha de regra financeira ou data falha no CI; configuração com nome de variável incorreto detectada; nenhum teste depende de credenciais reais. Fora: desligar regras globalmente ou atualizar todas as dependências para esconder erros.

## T-012 — Homologação e publicação

Escopo: aproveitar projetos Railway/Vercel existentes, ambiente de homologação separado, variáveis privadas, migrações, health/readiness, logs sem payload sensível, backups e rollback. Identificar projeto/ambiente antes de qualquer alteração remota.

Aceite: todos os P0/P1 essenciais validados, SPEC-001 concluída, matriz visual executada, build/test/CI aprovados, restauração ensaiada, URL HTTPS e fluxo completo de smoke test. Acompanhar primeira inicialização e operações sintéticas; registrar versão e resultado.

Fora: criar infraestrutura duplicada, ligar banco desconhecido em testes, alterar dados reais ou publicar antes de validar migração.

## Sequência de entrega

Lote A: T-001/002 e evidência de baseline. Lote B: contratos, integridade, schema e relógio. Lote C: onboarding ponta a ponta. Lote D: completar auditoria visual/concorrência e gates de CI. Lote E: homologação e publicação. T-008 pode avançar assim que houver backend sintético funcional, sem esperar onboarding completo.
