# Achados da revisão integrada

Linhas referem-se ao candidato `46d9fad`. Caminhos começando em `service/` ou `domain/` são relativos a `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`; caminhos `frontend/` são relativos a `controle-financeiro-frontend/src/`. São localizações de diagnóstico, não edições feitas pela revisão. RV01–RV16/C01–C05 identificam métodos do teste independente; UI01–UI07 identificam jornadas/probes do navegador. Logs, payloads, SQL e capturas estão relacionados em [EXECUCOES](EXECUCOES.md).

**P1** bloqueia aceite do fluxo financeiro afetado; **P2** impede fechar o respectivo critério, sem implicar corrupção em todos os fluxos. Distingue-se defeito confirmado, funcionalidade incompleta, hipótese e lacuna normativa. Uma assertiva vermelha não é automaticamente prova de todas as consequências possíveis.

## RVI-01 — P1, confirmado: transferência consome reserva

**Local:** `service/TransactionService.java:448` (createTransfer, débito após locks em 483–486); capacidade de reserva em `service/GoalService.java:258`.

**Reprodução:** RV01: conta A=1000, reserva=300, transferir 800 para B=0. RV13: duas transações PostgreSQL independentes, ambas iniciadas antes de liberar barreira; alocação de 700 segura a fonte até commit, transferência de 800 disputa essa fonte.

**Esperado:** FIN-05 exige liberação/redução explícita da destinação antes de gasto voluntário; rejeitar a transferência e preservar saldos. **Observado:** RV01 deixa A=200; RV13 confirma os dois comandos e disponibilidade=-500. Os locks serializam os comandos, mas a regra não é verificada no writer de transferência.

**Impacto/dona:** CF-018/020; reserva deixa de proteger capacidade, mesmo sem lost update. **Encerrar quando:** transferências e demais gastos voluntários consultarem a mesma capacidade sob lock e RV01/RV13 passarem, preservando B17 para registro de liquidação bancária real.

## RVI-02 — P1, confirmado: PUT antigo realiza previsão sem preservar o original

**Local:** `service/TransactionService.java:112`, `:390`, `:416`.

**Reprodução:** RV02 cria previsão de receita 250 em 31/12/2026 e usa PUT com `isPaid=true`, data 02/01/2027. **Esperado:** previsão/data de vencimento preservadas e baixa ligada na data efetiva, FIN-02/B12. **Observado:** a linha original passa a ter 02/01/2027; o caminho não cria a relação de baixa. O endpoint explícito de settlements tem testes positivos, mas não elimina este contrato antigo.

**Impacto/dona:** CF-018, com reflexo CF-021; perda da distinção previsão/fato realizado e auditoria da transição. **Encerrar quando:** adaptar/rejeitar a realização pelo PUT ou delegá-la a baixa explícita, com teste pelos dois contratos e consulta SQL após commit.

## RVI-03 — P1, confirmado: escritor de investimento aceita conta arquivada

**Local:** `service/InvestmentService.java:125–134`; contraste com `service/TransactionService.java:90`.

**Reprodução:** RV03 arquiva conta de 1000 e compra uma unidade de investimento por 20. **Esperado:** B16, reativação antes de nova movimentação. **Observado:** compra aceita, saldo 980. Ownership/lock existem, verificação de arquivo não.

**Impacto/dona:** CF-020/018; política de arquivo depende do domínio usado. A inspeção de writers de metas/cartões sugere ampliar o inventário, mas não se declara runtime desses outros caminhos comprovado. **Encerrar quando:** todos os writers de nova movimentação aplicarem a regra da fonte, com rollback e teste cruzado; não bloquear indevidamente a consulta histórica.

## RVI-04 — P1, confirmado: arquivo exclui posição do subtotal da interface

**Local:** `frontend/contexts/financeContext.tsx:112–113`; consumidores de saldo em dashboard/contas; `AccountService.listAll` retorna contas ativas.

**Reprodução:** UI01 abre conta 1000 pela UI, lança despesa 120 pela UI, recarrega, arquiva via API (subprobe identificado) e abre dashboard. **Esperado:** FIN-01/B16 mantém 880 na posição. **Observado:** SQL ainda guarda 880 na conta arquivada, subtotal da UI passa a zero. Corrigir a soma no repositório não corrigiu o consumidor que soma a lista ativa.

**Impacto/dona:** CF-018/021; posição cai sem evento financeiro. **Encerrar quando:** separar lista de seleção ativa de projeção financeira completa e validar arquivo/reload em dashboard e contas com a mesma fonte autoritativa.

## RVI-05 — P1, confirmado: histórico desconhecido vira fluxo zero

**Local:** `service/AnnualSummaryService.java:40–58` e `:124` (comparação); `service/DashboardService.java:60`.

**Reprodução:** RV04, abertura somente em setembro/2026 e consulta anual de 2025. **Esperado:** FIN-08/B11, cobertura desconhecida e valor indisponível com motivo; um ano coberto sem eventos continua zero. **Observado:** `balance.totalIncome=0`, sem contrato de cobertura. Comparação só avalia denominador numérico e não comprova cobertura comparável.

**Impacto/dona:** CF-021; totais aparentemente exatos e possível comparação de períodos incompletos. Excluir origens desconhecidas ou incluir suas quantias com aviso genérico não resolve a certeza do agregado. **Encerrar quando:** cobertura/proveniência acompanharem fluxos e comparação em API, UI e XLSX, incluindo zero conhecido, antes da abertura e legado desconhecido.

## RVI-06 — P1, confirmado: ativo sem avaliação aparece como zero/perda total

**Local:** `frontend/components/screens/investments/investmentItem.tsx:54–59`; cálculos equivalentes no detalhe do investimento.

**Reprodução:** UI04 cria 10 unidades, custo 200, sem avaliação/cotação. **Esperado:** FIN-04/08/B05: avaliação e rentabilidade indisponíveis. **Observado:** resumo agregado informa indisponibilidade, mas cartão do ativo calcula `quantity * currentPrice` com null e mostra R$ 0,00, −100% e −R$ 200,00. Captura `browser/visual-360-investments.png` e equivalentes 768/1440.

**Impacto/dona:** CF-020/021; sinaliza perda econômica inexistente e contradiz a própria tela. **Encerrar quando:** cartões/detalhes consumirem valor/custo explícitos e propagarem ausência sem recomposição por média arredondada; teste de componente nesses consumidores e navegador.

## RVI-07 — P2, confirmado: venda final sem cotação mantém posição desconhecida

**Local:** `domain/investment/Investment.java:91` (resizeValuation); `service/InvestmentService.java:218`.

**Reprodução:** RV06, 10 unidades com custo 200 e sem avaliação, vender todas por 25/unidade. **Esperado:** quantidade/custo/posição remanescentes zero conhecido; cotação não é necessária para avaliar nenhuma unidade. **Observado:** quantidade=0 e `valuation_amount=null`.

**Impacto/dona:** CF-020/021; posição encerrada torna agregados incompletos. **Encerrar quando:** fechamento zerar posição e custo de forma coerente, preservando metadados históricos da operação e sem transformar cotação desconhecida de posição aberta em zero.

## RVI-08 — P2, confirmado: caixa do provento diverge de E27

**Local:** `service/InvestmentService.java:221` (processDividend) e `domain/transaction/TransactionRepository.java:94` (sumCashByPeriod).

**Reprodução:** RV08, provento bruto 10, taxa retida 1. **Esperado literal E27:** conta +9; receita gerencial 10; encargo 1; entrada de caixa 9 e saída 0. **Observado:** conta +9 e gerencial corretos, mas resumo de caixa registra entrada 10 e saída 1.

**Impacto/dona:** CF-020/021; saldo líquido reconcilia, classificação de movimentação bancária não. **Encerrar quando:** separar valor líquido movimentado e decomposição gerencial conforme E27, incluindo exportação e estorno; não mudar o oracle para aceitar a representação atual.

## RVI-09 — P2, confirmado: fronteira decimal e faixa agregada incompletas

**Local:** `domain/transaction/dto/SettleTransactionDTO.java:15`; `domain/account/Account.java` (credit/debit); `service/TransactionService.java:164`.

**Reprodução:** RV09 envia `amount:1e2` numérico ao endpoint novo de baixa; RV10 credita 0,01 em conta de 999999999999,99. **Esperado:** FIN-06: novo contrato usa string decimal sem expoente; agregado fora de 12 dígitos é rejeitado ou sinalizado explicitamente. **Observado:** baixa HTTP 200 com valor 100; crédito excedente aceito sem sinal de fora de faixa. O teste RV10 usa rejeição como saída prevista porque o response atual não tem sinalização alternativa.

**Impacto/dona:** CF-018/020/021; contrato e limites não são uniformes. **Encerrar quando:** definir/adotar adaptadores canônicos e validar produto/agregado em todos os writers, sem truncamento. C05 preservou centavos no máximo permitido através de HTTP/XLSX: conversão a number/double isoladamente não foi apresentada como perda monetária reproduzida.

## RVI-10 — P2, confirmado: ano anterior remove a seção atual escolhida pelo produto

**Local:** `service/AnnualSummaryService.java:78–80`, `:93–97`; `frontend/components/screens/annual-summary/annualInvestments.tsx`.

**Reprodução:** RV05, posição atual 500 e seleção 2025. **Esperado:** FIN-08/DEC-04 mantém seção atual separada e datada, independentemente do ano dos fluxos; histórico não comprovado permanece indisponível. **Observado:** seção devolve totais null e lista vazia porque ano selecionado é diferente do corrente. No ano corrente, breakdown não transporta data/origem individual da avaliação; data da consulta e aviso genérico não a substituem.

**Impacto/dona:** CF-021; informação atual desaparece e proveniência de avaliação fica incompleta. Trata-se de divergência da implementação/contrato HTTP perante decisão explícita, não ambiguidade a resolver por suposição. **Encerrar quando:** testar ano corrente/passado com mesmas posições atuais e datas individuais distintas, sem rotulá-las como fechamento histórico.

## RVI-11 — P1, confirmado: dois pagamentos legítimos iguais não são possíveis pela UI

**Local:** `frontend/components/forms/payInvoiceModal.tsx:144`; `service/CreditCardService.java:530–536`.

**Reprodução:** UI02 compra 300 em 3×100 e confirma dois pagamentos novos de 20, mesma conta/data. Requests em `ui02-payment-0.json`/`-1.json` não têm operationId. **Esperado:** duas intenções distintas produzem dois débitos de 20; retry da mesma intenção exige identificação/consulta. **Observado:** primeiro 200, segundo 400 (“Use um identificador…”), conta 980 em vez de 960. A UI classifica como pagamento recusado, sem meio de fornecer o identificador solicitado.

**Impacto/dona:** CF-019, protocolo completo CF-024; bloqueio atual não é justificável como mera evolução futura. **Encerrar quando:** distinguir nova intenção de retry, verificar conteúdo da chave e preservar resultado desconhecido/consulta e todos os quatro R03. Não declarar recibo durável comprovado só por detectar duplicata.

## RVI-12 — P2, confirmado: modal sugere valor original após pagamento parcial

**Local:** `frontend/components/screens/cards/invoiceDetails.tsx:115`, `:227`; consumidor do modal de pagamento.

**Reprodução:** UI02 paga 20 de fatura 100 e reabre o pagamento. **Esperado:** saldo pagável 80, separado do consumo original 100. **Observado:** input sugere 100, embora a API já exponha os valores de dívida/pagamento. **Impacto/dona:** CF-019; fluxo parcial apresenta valor incorreto e pode receber rejeição por excesso. **Encerrar quando:** UI consumir payable/outstanding/credit e manter total original só como informação histórica, incluindo antecipação e crédito.

## RVI-13 — P1, confirmado: GET de metas perde o checklist persistido

**Local:** `domain/goal/dto/GoalResponseDTO.java:9–23`; `service/GoalService.java:99`; `frontend/components/screens/goals/goalDetails.tsx:105`.

**Reprodução:** UI03 cria item 120, recarrega `/metas` e abre detalhe. **Esperado:** item persistido visível e comprável. **Observado:** GET `/goals` devolve DTO sem items; consumidor usa `goal.items || []`, lista vazia. Evidências `ui03-goals.json` e `ui03-checklist.png`; a criação altera o alvo da meta para 120, mas não entrega o item ao consumidor.

**Impacto/dona:** CF-020; impede a jornada antes da compra. **Encerrar quando:** fornecer/consultar o checklist com ownership e testar criar→listar→reload→comprar. Uma eventual correção por carregar itens sob demanda deve evitar N+1 na listagem geral.

## RVI-14 — P1, confirmado/incompleto: consumidor ainda trata reserva como dinheiro da meta

**Local:** `frontend/components/screens/goals/goalDetails.tsx:160–176`, `:364`; `frontend/components/forms/deleteGoalModal.tsx:29–36`, `:57–62`; `service/GoalService.java:364`.

**Reprodução:** UI03 reserva 300 em conta 1000. A tela diz “Saldo Livre na Meta”; opção GOAL_BALANCE monta compra sem fonte real. DELETE exige destino para “devolver” a reserva. **Esperado:** FIN-05/07, seleção de fonte/alocação e liberação sem crédito fictício. **Observado:** probes HTTP separados da UI recebem 400 para `{paidPrice:120}` sem fonte e DELETE com targetAccountId. As respostas estão identificadas como **HTTP only**, pois RVI-13 bloqueia compra no navegador.

Também reproduzido: o botão Excluir fica sob o backdrop do detalhe (`goalDetails.tsx:227–230`); `click(trial)` não consegue alcançá-lo sem forçar eventos. Captura `ui03-delete-overlay.png`. Não se forçou o clique nem se chamou isso de E2E aprovado.

**Impacto/dona:** CF-020; compra com reserva e exclusão de meta financiada não completam a jornada. **Encerrar quando:** consumidor usar fonte/alocação explícitas, exclusão liberar intenção sem targetAccountId e modal ser alcançável; retestar fluxo completo, reload e reembolso. Bloqueia estes critérios de CF-020, não as alocações de domínio já validadas.

## RVI-15 — P1, confirmado: reembolso em cartão perde vínculo ao apagar intenção

**Local:** `service/GoalService.java:550–561`, `:566–596`.

**Reprodução:** RV11 compra item 120 em cartão com clock em segundos, exclui item e meta e pede reembolso pelo item. **Esperado:** FIN-07 preserva vínculo auditável e restituição no cartão; apagar intenção não extingue fato. **Observado:** refundItem não encontra o item nem uma transação bancária correspondente; lança “Compra não encontrada”. A correção `d11359e` cobre a compra bancária, não este caminho de cartão.

**Impacto/dona:** CF-020/019; perda do caminho de reembolso após exclusão. **Encerrar quando:** vínculo persistente da compra de cartão sobreviver à intenção e reembolsar uma vez, também após pagamento parcial/total; provar ausência de crédito bancário fictício.

## RVI-16 — P1, confirmado: hora gerada internamente impede compra de checklist no cartão

**Local:** `service/GoalService.java:523`; parser temporal em DateUtil.

**Reprodução:** RV16 injeta clock `2027-01-15T12:00:00.123456Z` e compra item pelo cartão. **Esperado:** operação gerada pelo produto usar contrato temporal válido. **Observado:** `now.toLocalTime().toString()` inclui frações e o contrato só aceita HH:mm/HH:mm:ss; comando é recusado. O primeiro ensaio sem clock importado também encontrou essa falha; o probe final a isola com tempo determinístico e restaura o clock.

**Impacto/dona:** CF-020, integração temporal; caminho falha com precisão normal do relógio. **Encerrar quando:** origem/hora interna forem representadas conforme SPEC-002, testando relógio com e sem frações sem enfraquecer validação de input externo.

## RVI-17 — P1, confirmado: resgate de renda fixa usa quantidade monetária a preço 1

**Local:** `frontend/components/forms/operationModal.tsx:91–93`, `:109–113`.

**Reprodução:** UI06: custo 1000, avaliação 1100, quantidade 1000; selecionar Resgatar e informar 220. **Esperado B08:** custo baixado 200, ganho 20, custo restante 800/valor 880. **Observado:** UI envia SELL quantidade=220/preço=1/taxa=0; banco recebe 220, mas quantidade/custo restantes=780, avaliação=858, ganho=0. Requests e respostas em `ui06-request.json`/`ui06-observed.json`, com SQL após encerramento do navegador.

**Impacto/dona:** CF-020/021; perda da separação principal/rendimento e resultado patrimonial errado. **Encerrar quando:** representação de renda fixa converter valor resgatado em quantidade/preço coerentes ou oferecer comando monetário específico, sem corrigir só o número exibido. Manter oracle B08 e testar resgate final/taxas.

## RVI-18 — P1, confirmado e incompleto: ajuste manual aceita posição impossível e não audita motivo/data

**Local:** `service/InvestmentService.java:241–251`; `domain/investment/dto/UpdateBalanceDTO.java:8–12`; `frontend/components/forms/operationModal.tsx:154`.

**Reprodução:** RV15 cria ativo sem unidades e manda ajustar avaliação para 20; leitura do comando mostra gravação de valuationAmount sem adquirir unidades. **Esperado:** a mesma invariante de criação recusa custo/valor positivo sem posição; FIN-04/07 requer motivo/data da avaliação/ajuste. **Observado:** comando aceita; DTO só tem ID/saldo, motivo/data não podem ser enviados. UI ainda promete lançar diferença como “Rendimento”, embora o backend já tenha abandonado esse histórico fictício.

**Impacto/dona:** CF-020; estado impossível e auditoria incompleta. **Encerrar quando:** writer de ajuste respeitar a posição e a faixa monetária, registrar avaliação com data/origem/motivo e UI explicar seu efeito real; ganho/renda não podem ser inventados.

## RVI-19 — P2, incompleto: previsões e transferências sem fechamento da jornada

**Local:** `service/TransactionService.java:164`, `:448`; `frontend/components/forms/newTransactionModal.tsx` (formulário de criação).

**Reprodução:** RV12 cria transferência futura de 200 com taxa 2; endpoint genérico de baixa recusa operação gerenciada. PUT também bloqueia operação vinculada, não há outro comando de baixa de transferência no controller. UI01 inspeciona formulário: só receita/despesa, sem estado de previsão ou destino de transferência.

**Esperado:** FIN-02, realizar previsão preservando original, transferir atomicamente com taxa, disponível ao consumidor. **Observado:** criação/cancelamento futuro no domínio existem, realização está ausente; navegador não inicia previsão/transferência. RV12 é um probe da ausência do caminho, não prescrição de que o endpoint genérico deva ser a solução.

**Impacto/dona:** CF-018; bloqueia aceite completo e essas jornadas E2E. **Encerrar quando:** oferecer comando/consumidor para baixa atômica e UI para as operações, com todas as pernas, taxa, auditoria, ownership e reload.

## RVI-20 — P2, confirmado: filtro TRANSFER inclui consumo de cartão

**Local:** `service/DashboardService.java:73`; usado por `service/TransactionService.java:809` no XLSX.

**Reprodução:** RV14 cria compra de cartão 100 e transferência 200 e apura período com `type=TRANSFER`. **Esperado:** resultado gerencial do filtro zero, sem consumo alheio. **Observado:** `expense=100`; condição `type != INCOME` admite TRANSFER. **Impacto/dona:** CF-021; filtros do extrato e resultado da exportação não têm mesmo escopo. **Encerrar quando:** tipos permitidos e escopo de cada seção forem consistentes em summary/XLSX e confrontados com valores literais; manter testes por conta/usuário.

## RVI-21 — P2, funcionalidade incompleta: compensações e auditoria não entregues

**Local:** `service/InvestmentService.java:256` em diante (deleteTransaction/deleteInvestment); `service/TransactionService.java:211` em diante (reversão); DTOs de comando.

**Reprodução por inspeção de contratos e regressões de rejeição:** tentativa de retirar operação de investimento é bloqueada; não existe comando substituto com motivo/data e recálculo de cadeia. Despesa direta permite compensação integral pelo DELETE, mas não o caso normativo parcial 40 de 100, depois os 60 restantes, com datas/motivos explícitos. Ajuste manual: RVI-18.

**Esperado:** FIN-07, estorno parcial controlado e compensação rastreável, preservando fato original. **Observado:** bloqueio protege contra o defeito destrutivo D16-10, porém não entrega a alternativa exigida. **Impacto/dona:** CF-018/020; escopos de correção/reembolso incompletos, sem alegar corrupção causada pela rejeição. **Encerrar quando:** testes da cadeia completa, parcial/total, data efetiva, motivo, repetição e dependências posteriores passarem. CF-024 pode ampliar transporte/recibo, não substituir a operação de domínio ausente.

## RVI-22 — P2, confirmado visualmente: mensagem de indisponibilidade cortada em 360px

**Local:** `frontend/components/screens/investments/investmentsSummary.tsx:48–54`.

**Reprodução:** UI04 em 360×800, ativo sem avaliação. **Esperado:** mensagem completa sem corte. **Observado:** “Indisponível” + badge de motivo ficam em linha flex `w-min` dentro de card `overflow-hidden`; o badge é cortado à direita. Página não tem overflow horizontal, por isso a asserção de largura sozinha passa. Em 768/1440 há espaço suficiente no cenário capturado.

**Impacto/dona:** CF-021; usuário perde parte do motivo no novo estado financeiro. **Encerrar quando:** permitir quebra/empilhamento preservando legibilidade nos três tamanhos. Não amplia esta revisão para toda a auditoria visual CF-015 nem resolve zoom nativo 200%.

## NG-01 — P2, lacuna normativa: avaliação total versus preço derivado abaixo da escala

**Local normativo:** SPEC-004 FIN-04/06, especialmente linhas 240–245; implementação em `service/InvestmentService.java:102–107` e `domain/investment/Investment.java:91`.

**Reprodução RV07:** 200.000.000 unidades e avaliação total declarada 1,00; preço implícito exato 0,000000005. Backend arredonda esse preço derivado para oito casas (0,00000001), mantendo inicialmente o total 1,00; ao vender metade, recalcula a avaliação remanescente em 1,00. O probe espera 0,50 pela preservação proporcional do total informado.

**Observação e limite:** a mudança econômica indevida do valor de referência é reproduzida, mas FIN-06 define valor=quantidade×preço e escala máxima do preço, enquanto o contrato de abertura aceita total sem exigir representabilidade daquele preço. Não há decisão suficientemente explícita entre rejeitar a abertura irrepresentável, preservar referência exata/racional ou priorizar outro valor autoritativo. Por isso esta assertiva vermelha não é contada como defeito de implementação definitivamente adjudicado.

**Dona/encerramento:** CF-016 decide a representação para esta borda e publica oracle literal; CF-020 implementa sem normalização silenciosa. Não mudar E18–E30/B08 nem aprovar o código atual por conveniência.

## Hipóteses e observações de arquitetura (não bugs financeiros reproduzidos)

- **H-01, P2 — ordem de locks entre domínios.** `GoalService.moveAllocation:275` ordena A→I, mas `InvestmentService.performOperation:130–133` usa I→A. Ciclo de espera é possível entre movimentação de reserva e operação de investimento. Não houve probe específico de deadlock; PostgreSQL abortaria uma transação, não se demonstrou perda parcial. Padronizar ordem global e testar barreira cruzada antes de ampliar CF-024; risco de reduzir concorrência se o lock for demasiadamente amplo.
- **H-02, P2 — snapshot de exportação.** `TransactionService.exportToExcel:760` lê totais e páginas em chamadas separadas sem snapshot transacional estável. Ordenação temporal+ID é determinística em base parada, mas inserção concorrente pode deslocar paginação. Não foi reproduzida corrida de exportação. Avaliar leitura consistente/cursor versus transação longa, sem benchmark amplo CF-025.
- **Observação de custo:** SXSSF mantém 100 linhas e banco é consultado em lotes de 500, porém `ByteArrayOutputStream`/`byte[]` ainda consomem O(tamanho do XLSX); paginação OFFSET pode degradar com volume. Fetch de conta/categoria da página evita N+1 nesse caminho. `listAllWithSummary` agora usa agrupamento por cartão/competência, aproximadamente O(cartões+grupos), substituindo busca linear antiga; não reiterar o O(c²) histórico como defeito atual. Listagem anual é O(ativos) e precisa percorrer fontes para detectar ausência; uma projeção agregada pode ajudar volume, mas não é condição geral de aceite. Sem novo EXPLAIN dirigido às queries financeiras, benchmark ou medição de SQL por cardinalidade, não se afirmou ganho medido nem N+1 comprovado em todos os consumidores.

## Impedimentos de ambiente e harness

Docker no sandbox falhou por acesso ao pipe; execuções autorizadas subsequentes passaram. Build inicialmente falhou ao obter Geist/Geist Mono de Google Fonts; repetição autorizada passou. Estes eventos não são defeitos do produto. O verificador integral CF-016 depende de hashes de bytes anteriores; falhou após a parte aritmética por preservação de `pom.xml`, inclusive no replay arquivado após reconstruir somente bytes que coincidiam com hashes conhecidos. Não se removeu a assertiva para declarar verde.

Primeiras tentativas do navegador tiveram seleção de conta genérica, espera de evento com verbo errado e screenshot antes de concluir animação; foram tratados como erros do probe. R03 antigo tinha rótulo “Patrimônio Total” obsoleto; cópia local conserva as assertivas financeiras/de recuperação, alterando só o rótulo. Falhas de clique por overlay em UI03 e valores incorretos de UI02/UI06 persistiram com requests e resultados reais e estão acima, separados dessas falhas de autoria.
