# Achados CF-032 — produto preservado

Base de produto 331d3344c24dc60f5e1940989b9a35c0d5da1aa6, sem correção nesta tarefa.
Regressões independentes C/E2/K/L permanecem vermelhas; não foram marcadas como
expected failure, removidas ou adaptadas ao valor observado. Nenhum aceite anterior
foi reaberto em bloco. São evidências novas de consumidores integrados.

## CF032-01 — P2 — fonte incerta aceita nova reserva por outra meta

- Critério: SPEC-001 §5/5.1, DEC-ONB-02; cenário E2, uso legado/capacidade.
- Caminho: `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/GoalService.java:251`,
  `ensureCapacity:350` e a capacidade do aporte em 164. A decisão considera somente
  soma materializada de goal_allocations, ignorando pendências de origem incerta.
- Reprodução: owner sintético com conta 1000, abertura/proveniência UNKNOWN,
  meta legada allocation_reconciled=false e uma reserva UNBOUNDED/nominal UNKNOWN.
  Criar outra meta monetária própria, solicitar destinação 0.01 da mesma fonte.
- Esperado: 400 sem reserva nova; saldo conhecido não comprova capacidade livre.
  Obtido: 204, nova goal_allocation 0.01 e progresso 0.01 persistidos. Conta 1000 e
  pendência original conservadas. Não se alegou débito de caixa nem reserva
  duplicada de montante conhecido: a violação é autorizar aumento sem capacidade.
- Provas: `run-06/E2-response.json`, `E2-before-sql.json`,
  `E2-after-attempt-sql.json` e captura; reprodução mantida em run-08 e matriz UTC.
- Saneamento delimitado: decisão de elegibilidade/capacidade por fonte deve incluir
  a união de pendências/evidências, também em setAllocation/deposit/move e demais
  writers voluntários realmente afetados. Compartilhar regra de domínio sob os
  locks vigentes, sem importar tela/sessão da entrevista nem reconstruir origem.
  Provar 400/rollback com outra meta, duas pendências, fonte independente comprovada,
  conta/investimento, resolução parcial e concorrência de confirmação.
- Trade-off: compartilhar projeção consistente evita regras divergentes, mas custa
  leitura por fonte/owner e disciplina transacional. Consultas em lote/índices de
  incidência evitam N+1; não executar o planner completo de todas as metas por item.

## CF032-02 — P2 — limite disponível da UI exclui parcelas futuras

- Critério: FIN-03/SPEC-001 E01; cenário K, reconciliação UI/API/SQL.
- Caminhos: `controle-financeiro-frontend/src/hooks/useCards.ts:270/275` e
  `src/components/screens/cards/creditCardItem.tsx:131` calculam limite menos fatura
  corrente, embora API informe committedLimit/availableLimit próprios.
- E01: dívida 350=200+3×50, principal 344=194+150, limite 1000, disponível 656;
  encargos 6 não consomem limite. Após fechamento 20, ciclo ativo novembro tem 50.
- Obtido: API 344/656 corretos; resumo e cartão mostram 950=1000−50, inclusive
  após reload. Não é erro de competência do backend nem regra do banco externo.
- Provas: `run-08/K-api-versus-ui.json`, `K-card-sql.json`,
  `K-available-limit.png`; relatório final Playwright marca falha. No run-08,
  K-result auxiliar antecedeu assertions assíncronas não aguardadas e registrou
  passed indevido; não é fonte de aceite. Run-09 aguarda ambas e confirma falha.
- Saneamento: transportar/validar committedLimit e availableLimit no consumidor,
  usar esses campos no resumo/cartão/barra, propagar UNKNOWN quando composição
  for desconhecida. Cobrir futuras, encargos, crédito, limite negativo/reduzido,
  zero e agregados; crédito não aumenta o limite. Preservar datas/ciclo aceitos.
- Trade-off: consumir a métrica autoritativa elimina cálculo divergente; exige
  tratar incompletude e compatibilidade do DTO, sem defaults 0 silenciosos.

## CF032-03 — P2 — posições válidas sem ticker perdem identificação cotidiana

- Critério: SPEC-001 Investment CREATE exige nome, permite identifier ausente;
  jornada diária com dados resultantes do onboarding. Cenário L.
- Caminhos: `src/components/screens/investments/investmentItem.tsx:67/87` mostra
  apenas ticker e gera rótulo com null; `src/components/forms/operationModal.tsx:312`
  e descrições operacionais também usam ticker sem fallback de identidade.
- E01 original: API/SQL conservam nomes Ação sintética e Renda fixa sintética,
  ambos ticker=null, valores 1 e 500 e custo desconhecido da renda fixa.
- Obtido: nomes ausentes na lista; dois botões com mesmo nome acessível
  `Ver detalhes do investimento null`. Não se demonstrou operação no ativo errado;
  a identidade visível/acessível necessária para escolher a posição foi perdida.
  A exportação da operação API também contém descrição Aporte:null.
- Provas: `run-08/L-api-versus-ui.json`, `L-positions-sql.json`,
  `L-optional-identifier.png`. A falha B do run-07 está preservada: seletor pelo
  nome não encontrou a posição. B posterior é cenário distinto com identifier
  explicitamente declarado CF032STOCK; L conserva a entrada/expectativa originais.
- Saneamento: apresentar nome da posição quando identifier não existir, manter
  identidades acessíveis distintas e propagar o mesmo rótulo ao detalhe/operação/
  descrição sem usar texto como chave. Cobrir duas posições do mesmo tipo sem ticker,
  renda fixa MONETARY, privacidade e reload, sem forçar unidade/custo/identifier.
- Trade-off: fallback de apresentação é pequeno, mas precisa ser coerente entre
  consumidores; não mudar IDs, proveniência ou regras financeiras para corrigir UI.

## CF032-04 — P3 / precisão pendente — XLSX perde segundos informados

- Critério: SPEC-002 horário canônico HH:mm:ss, distinção de apresentação compacta
  e detalhe; pedido CF032 exige conferir precisão exportada, sem arredondar expected
  para fazer o teste passar. Cenário C.
- Caminho: `TransactionService.java:1102` usa HH:mm no arquivo; 1128 escreve o texto.
- Entrada 12:34:56, data 22/10/2026. API/SQL preservam os segundos; arquivo baixado e
  lido por POI contém 12:34. Dados monetários/datas/status/origens/totais conciliam.
- Provas: `run-08/C-october.xlsx`, `.analysis.json`, `C-final-sql.json`,
  `C-exported-sql.json`, `C-result.json`. A assertion de segundos continua vermelha;
  soft apenas permite examinar as colunas monetárias independentes no mesmo arquivo.
- Não foi localizada exceção aprovada que limite a precisão do XLSX a minutos.
  A SPEC-002 autoriza HH:mm na UI compacta, não especifica expressamente uma exceção
  de exportação. Por isso não se declarou conformidade integral nem se decidiu
  silenciosamente uma nova política. Saneamento deve preservar hora canônica no
  arquivo ou obter decisão explícita e versionada sobre a perda de precisão.
- Avaliar compatibilidade de leitores existentes ao mudar formato/coluna. Instante
  de auditoria não é exportado nesse formato, portanto não há round trip de recordedAt
  alegado; ele foi conferido separadamente no recibo/API/SQL, inclusive G.

## Encaminhamento

Entrega de validação pronta para revisão independente com pendências explícitas,
sem aprovação da CF032. Priorizar os três P2 e decidir/corrigir a precisão C;
reexecutar os probes originais intactos e consumidores afetados no saneamento.
Zoom CF010/015, adoção CF017/P01/P02 e publicação permanecem fora deste aceite.
Não adicionar índices/cache, ledger, Kafka ou microsserviços por associação aos
achados. Medição de carga/EXPLAIN não foi executada nem substituída por estes testes.
