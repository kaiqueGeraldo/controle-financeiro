# Diagnóstico inicial — F

Data: 07/09/2026. Checkout inicialmente sem alterações. Fontes: código, manifests, CI e estrutura da planilha. Ambientes remotos ainda não inspecionados.

## Base encontrada

- Next.js 16.1.6, React 19.2.3 e TypeScript; Spring Boot 4.0.2 e Java alvo 21, PostgreSQL no Compose.
- Backend com entidades agrupadas por domínio, mas controllers e services em pacotes globais. A declaração de monólito modular no README ainda não corresponde a fronteiras verificadas por testes.
- Contas, transações, cartões/faturas, planejamento, metas, investimentos, hábitos, resumo anual, autenticação e preferências já têm implementação.
- Há versionamento otimista em Account, Goal e Investment e consultas com fetch join no extrato. Preservar essas proteções; `@Transactional` sozinho não prova ausência de concorrência ou dupla contabilização.

## Problemas e riscos

Prioridade P0 bloqueia uso com dados reais por integridade/isolamento confirmado; P1 afeta fluxo essencial; P2 afeta manutenção/usabilidade. Prioridade pode mudar após reprodução.

| ID | Prioridade / estado inicial | Evidência | Impacto e comportamento esperado |
|---|---|---|---|
| F-001 | P1, confirmado por semântica do código | `investmentDetails.tsx` e `invoiceDetails.tsx`: `new Date(date).toLocaleDateString()` para datas civis | Em UTC-3, YYYY-MM-DD aparece no dia anterior. Preservar o dia recebido |
| F-002 | P1, confirmado por semântica do código | newTransactionModal, newCardTransactionModal, operationModal e payInvoiceModal usam `toISOString().split("T")[0]` | À noite em São Paulo, “hoje” vira amanhã. Gerar data civil local |
| F-003 | P1, confirmado por semântica do código | `StatusBadge` em goalItem compara deadline à hora atual | Meta de hoje fica atrasada durante o próprio prazo. Atraso começa no dia seguinte |
| F-004 | P1, confirmado por semântica do código | useCards, useExtract e planningContext usam setMonth mantendo dia do mês | Janeiro/31 + um mês pode virar março. Competência deve usar o primeiro dia do mês |
| F-005 | P1, confirmado no código; reprodução HTTP pendente | apiRequest trata 401 e 403 como sessão expirada | Uma proibição não deve remover uma sessão válida. Separar autenticação de autorização |
| F-006 | P1, confirmado no código; reprodução HTTP pendente | ResourceExceptionHandler tem captura genérica, sem handlers específicos para validação/desserialização | Dados inválidos podem virar 500 genérico. Mapear 400 com campos, 409 para conflito e 5xx apenas para falha de servidor |
| F-007 | P1, hipótese de corrida | useOptimisticMutation usa estado React como trava e captura erros sem propagá-los; refreshAll em useCards não cancela resposta antiga | Duplo clique, resposta fora de ordem ou callback posterior pode produzir estado incorreto. Reproduzir com rede controlada |
| F-008 | P1, lacuna confirmada | AuthService.register cria categorias/carteira; não existe sessão de onboarding; CreateGoalDTO/CreateInvestmentDTO não recebem posições iniciais | Entrevista deve ser retomável, validar referências e confirmar tudo uma única vez |
| F-009 | P1, confirmado no código; regra de negócio precisa especificação | AccountService.create registra saldo inicial positivo como INCOME; sumByTypeAndYear não filtra isPaid/origem; saldos negativos não geram ajuste equivalente | Separar posição inicial, previsão e receita realizada; reconciliar relatórios antes de importar posições |
| F-010 | P1, confirmado no código | AnnualSummaryService filtra transações pelo ano, mas busca metas/investimentos atuais sem data histórica | Explicitar “posição atual” ou reconstruir fechamento histórico. Não rotular posição de hoje como patrimônio de ano passado |
| F-011 | P1, lacuna confirmada | application.yml usa ddl-auto validate, local usa update; nenhuma migração versionada localizada | Um banco vazio não tem bootstrap reproduzível. Inventariar esquema existente e criar baseline seguro, incluindo ShedLock |
| F-012 | P1, confirmado | CI backend e Dockerfile usam skipTests; há só contextLoads; frontend sem script de teste | Build verde não certifica finanças, contratos ou isolamento. Criar regressões por risco e executar no CI |
| F-013 | P2, risco de desempenho | AccountService.reorder faz findById/save por item; listas de metas/hábitos carregam relacionamentos | Reorder tem O(n) idas ao banco; N+1 em listagens ainda deve ser medido. Usar consultas em lote e projeções após medir |
| F-014 | P2, confirmado | README cita Spring Boot 3, diretórios backend/frontend e Compose na raiz; CI frontend usa BACKEND_API_UR | Documentação/comando e nome de variável divergem do projeto real |
| F-015 | P1, investigação visual pendente | Relato do usuário em diversas telas; nenhum inventário visual executado neste diagnóstico | Registrar viewport, tema, estado, passos e captura por falha; não inferir correção visual apenas pelo código |
| F-016 | P1, bloqueio local confirmado | mvnw.cmd acessa `.Target[0]` quando Target é nulo no PowerShell local | Wrapper não inicia neste ambiente. Diferenciar falha de ferramenta de erro de compilação; usar distribuição Maven já instalada para diagnóstico |
| F-017 | P2, confirmado por execução | ESLint: 70 erros e 37 avisos em 54 arquivos | Dívida de tipagem, hooks e componentes. Tratar por regra/arquivo conforme lint-baseline.md; não confundir build aprovado com lint aprovado |
| F-018 | P1, confirmado por semântica do código | `useExtract` calcula `summary` apenas sobre `transactions`, que contém a página carregada (30 itens) | O rótulo “Saldo do Período” pode mudar ao carregar outra página e não representa o período/filtro completo. Exigir total agregado no contrato; tratar em CF-021, sem recalcular no componente. |

## Investigações adicionais delimitadas

- DTOs/serialização: entidades retornadas diretamente, paginação, campos opcionais versus obrigatórios, 204 e exportação binária.
- Integridade: pagamento simultâneo de fatura, duas operações no mesmo investimento, reserva de meta vinculada a investimento, exclusão/estorno e cache após commit.
- Datas: LocalDate versus LocalDateTime/Instant; crons e `LocalDate.now()` dependentes da JVM. Configurar Jackson não redefine o relógio da aplicação.
- Multiusuário: consultar/alterar ID de outro usuário em todos os domínios; nenhuma vulnerabilidade é declarada confirmada sem evidência.
- Operação: status do Railway desligado informado pelo usuário; não confundir indisponibilidade com bug de frontend. Backup, esquema, variáveis e região ainda precisam ser verificados.

## Reprodução sintética das datas

Fuso America/Sao_Paulo: `new Date('2026-09-07').toLocaleDateString('pt-BR')` mostra 06/09/2026. Às 23h30 locais, `toISOString()` já pertence ao próximo dia. Partindo de 31/01/2026, `setMonth(1)` avança para março. Esses cenários entram na regressão da especificação 002.

Após o lote A, F-001–004 têm patch implementado e regressões aprovadas em três fusos. F-014 teve README e variável de CI corrigidos. Os registros acima preservam a evidência original; ver tarefas.md e validacao-deploy.md para o estado de execução.
