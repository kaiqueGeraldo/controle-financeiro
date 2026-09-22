# Decisões de arquitetura

## ADR-001 — Evoluir o monólito existente

Decisão: manter Spring Boot/PostgreSQL e Next.js com BFF. Organizar gradualmente por domínio, sem migração para microsserviços ou introdução de Kafka nesta entrega.

Benefícios: transações locais simplificam dinheiro, implantação atual pode ser aproveitada, menor custo operacional. Custo: disciplina para não cruzar repositórios de qualquer módulo; o deploy permanece acoplado. Risco: apenas mover pastas oculta acoplamento sem corrigi-lo.

Direção: identity, accounts/transactions, cards, planning, goals, investments, habits, reporting e onboarding. Onboarding orquestra serviços de aplicação com regras de inicialização explícitas. Reporting lê projeções e não altera domínios. Extrair fronteiras por caso de uso e adicionar testes de dependência antes de grandes movimentações.

## ADR-002 — Posição inicial com origem explícita

Contrato detalhado pela CF-016 na [SPEC-004](specs/004-regras-financeiras.md), ainda para implementação: posição de abertura na data-base, sem criar receita, compra ou depósito histórico fictício. Metas monetárias representam destinação de recursos; investimento ligado a meta não acrescenta um segundo ativo ao patrimônio. O contrato distingue caixa realizado, consumo, dívida, custo, avaliação e estorno; decide seção atual datada no relatório anual e indisponibilidade histórica quando faltam dados.

Benefício: dashboard não inventa desempenho. Custo: schema e relatórios precisam distinguir abertura, fluxo realizado, compromisso e valorização. Migração: não reclassificar dados legados por texto da descrição sem revisão e reconciliação.

Valores monetários são validados e calculados no backend com BigDecimal; payloads de novos contratos usam strings decimais e limites de escala explícitos. Isso evita depender de ponto flutuante do navegador, mas requer adaptadores para APIs legadas que hoje usam number. Quantidade de ativos pode exigir escala maior que centavos.

## ADR-003 — Datas por significado

Data civil (`YYYY-MM-DD`) não possui fuso: pagamento, compra, prazo, dia do hábito. Competência é ano/mês. Instantes de auditoria devem ter offset/UTC; LocalDateTime legado não pode receber `Z` sem conhecer sua origem.

O frontend usa um utilitário único para calendário e comparação de prazo. No backend, adotar Clock injetável para “hoje” e fuso do usuário; até essa etapa, o fuso de produto proposto é America/Sao_Paulo. O relógio do navegador no lote inicial é uma solução limitada quando o usuário viaja; essa limitação deve permanecer documentada.

## ADR-004 — Consistência antes de otimização visual

Pagamento, venda, transferência e finalização de onboarding precisam de transação, validação de proprietário, concorrência e repetição segura no servidor. Trava de botão é apenas UX. Usar atualização otimista em ações reversíveis com reconciliação; preferir confirmação pelo servidor nas operações monetárias críticas.

Onboarding deve ter chave de idempotência, versão do rascunho e restrições únicas. O mesmo envio retorna a mesma conclusão; envio concorrente diferente retorna conflito sem duplicar saldo. Eventos de cache/notificação precisam ocorrer após commit. Não usar chamadas externas de cotação dentro da transação de finalização.

## ADR-005 — Desempenho orientado por evidência

Reorder atual: O(n) operações de repositório e até O(n) round trips; buscar IDs do usuário em lote e atualizar dentro de uma transação reduz consultas, sem remover a validação de posse. Ordenação do extrato em memória: O(n log n) sobre a página; totais não devem depender da página.

Medir queries de listas e evitar N+1 com projeções/fetch joins apropriados, sem paginar fetch join de coleções indiscriminadamente. Índices candidatos `(user_id, date)` e chaves de fatura precisam de EXPLAIN com dados sintéticos representativos. EXTRACT em predicados pode limitar uso de índice simples de data; comparar com intervalo `[início, próximo início)`.

Não adicionar cache distribuído agora. Definir invalidação e fonte de verdade antes de adicionar camadas de cache.
