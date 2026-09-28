# Evidência CF-020 — posições e destinações

- Estado em 28/09/2026: implementação backend `em_revisao`, sem revisão independente ou publicação.
- Base: `59d98fa3f49b3f761ca3c963775ff4a0d34b0a11`; commits locais do código `3746e8e` e `d11359e`. O gate final validou exatamente o conteúdo do segundo commit, antes de editar apenas esta evidência e o estado da tarefa.
- Ambiente: Windows/PowerShell, JDK Temurin 21.0.12.1, Maven Wrapper, Spring Boot 4.0.2, Testcontainers 2.0.3 e PostgreSQL 16 descartável. O JDK usado ficou em `controle-financeiro-backend/target/` (ignorado); nenhuma credencial, dado real, notificação, navegador, push, deploy ou banco de produção foi usado.
- Dependências CF-016/017/018 estavam integradas na base local. CF-017/018 continuam `em_revisao`; CF-019 também estava integrada e `em_revisao`. O `README.md` preexistente ficou fora dos três stages/commits; SHA-256 antes da execução: `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

## Critérios e oráculos independentes

Os valores abaixo vêm da SPEC-004 FIN-04/05/06/07, não de getters ou fórmulas da implementação. `Cf020InvestmentGoalIntegrationTest` executa serviço, ORM, constraints e PostgreSQL; `Cf020GoalAllocationTest` reproduziu o defeito inicial.

| Critério | Resultado esperado | Prova |
|---|---|---|
| Fonte compartilhada | Conta 1000.00 + reserva 300.00 mantém saldo/patrimônio 1000.00 e deixa livre 700.00; outra meta pode reservar 700.00, 0.01 adicional falha. | Integração com duas metas e agregados sem despesa. Duas threads tentando reservar 600.00 na mesma conta aceitam só uma. |
| Fonte investimento | Valor conhecido 500.00 com reserva 200.00 continua sendo ativo de 500.00; abertura não cria transação passada. Queda para 150.00 preserva reserva nominal e mostra déficit 50.00. | Integração de abertura, alocação, cotação reduzida e listagem de disponibilidade. |
| Custo versus avaliação | Compra de 10 × 20.00 + taxa 2.00 deixa custo 202.00/caixa 798.00. Com avaliação 250.00, venda de 4 × 25.00 − taxa 1.00 dá caixa +99.00, custo baixado 80.80, resultado 18.20 e posição 6/custo 121.20/valor 150.00. | Integração da operação e histórico persistido. Provento 10.00/taxa 1.00 aumenta caixa 9.00 sem mudar quantidade/custo. |
| Resgate parcial de renda fixa | Custo 1000.00/valor 1100.00; resgatar 200 unidades a 1.10 credita 220.00, baixa custo 200.00, realiza 20.00 e mantém custo 800.00/valor 880.00. | Teste de integração específico. |
| Centavos e cotação | 1 × 1.005 arredonda bruto uma vez a 1.01. Custo 1.00/3 unidades fecha em baixas 0.33, 0.34 e 0.33, residual zero. Ausência de cotação não vira zero ou custo confirmado. | Integração com preços fracionários, venda final e avaliação nula. |
| Checklist e estorno | Conta 1000.00/reserva 300.00; compra real 120.00 → conta 880.00/reserva 180.00/livre 700.00. Excluir item/meta não credita; reembolso posterior volta a conta a 1000.00 e despesa líquida a zero, preserva origem/ID e segunda tentativa não credita. | Integração da exclusão, busca da compra pelo vínculo persistido, estorno com `reversal_of_id` e repetição recusada. |
| Histórico e migração | Excluir histórico de destinação libera apenas a reserva; V5 mantém preço legado em campo separado e deixa custo/avaliação sem prova como desconhecidos. | Testes de serviço e migrações sobre schema vazio e fixture V1 legada. |

## Falha anterior e cadeia causal

O primeiro `Cf020GoalAllocationTest` executado contra o serviço anterior falhou em dado financeiro: **esperado saldo da conta 1000.00, observado 700.00** depois de “alocar” 300.00. `GoalService.addValue` debitava a conta, tratando a meta como custódia e permitindo dupla contagem. A correção introduziu `goal_allocations` por fonte, sem transação bancária no ato da destinação, e travou a fonte antes de conferir capacidade. A prova vermelha foi do comportamento, não de import, compilação ou banco.

As primeiras tentativas de Maven falharam por ambiente: JDK antigo disponível era só JRE e o sandbox não acessava o cache Maven. Instalou-se JDK 21 isolado em `target/` e os testes foram executados com acesso autorizado ao cache. Essas falhas não contam como prova de regressão. A primeira suíte ampliada depois do código apresentou 5 falhas e 2 erros: expectativas de contagem V4 anteriores à V5, FK legada com nome gerado, uma fixture de teste sem filtro por usuário e uma expectativa temporal que tratava ajuste de avaliação como rendimento fictício. Corrigiram-se fixture, migração e os testes de contrato conforme a SPEC-004; não se alterou uma assertion para aceitar saldo incorreto.

## Implementação e validação

- V5 acrescenta custo total, avaliação com data/origem, capacidade de alocação por conta/investimento, vínculo auditável da compra de meta e índices/constraints. Legado incerto fica identificável para reconciliação; não fabrica custo, cotação, aporte ou caixa.
- Compra capitaliza taxa; venda baixa custo proporcional e o residual final; provento registra bruto e taxa separadamente. Preço da execução não vira automaticamente avaliação de toda a posição. Cotação ausente conserva o último valor confirmado; abertura de investimento e progresso numérico inicial não inventam transações.
- Reserva é intenção sobre ativo existente, com dono validado, soma por fonte, lock pessimista na fonte e `@Version` na meta/alocação/posição. Ajuste absoluto, liberação e mudança atômica entre fontes ficam expostos no controller. Compra de checklist pode consumir reserva da conta real no mesmo caso de uso. Exclusão de intenção não altera caixa. Reembolso bancário explícito pode ocorrer após remover item/meta, usando `goal_item_id`; o original permanece e a repetição é recusada.

Comandos executados no diretório `controle-financeiro-backend`, com `JAVA_HOME` apontando para o JDK 21 acima:

```powershell
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf020InvestmentGoalIntegrationTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' test
```

Gate direcionado final: **19 testes, 0 falhas, 0 erros**. Suíte backend final: **162 testes, 0 falhas, 0 erros, 0 ignorados**, `BUILD SUCCESS`, 01:53 min, terminada às 10:59 em 28/09/2026. `git diff --cached --check` passou em cada stage; avisos de conversão LF/CRLF do Windows não são erros de diff. Não houve E2E, teste visual ou contrato HTTP novo; o aceite demonstrado é de domínio, ORM e migração sintética.

## Trade-offs, riscos e pendências de revisão

- A consulta de listagem lê todas as alocações do usuário com fontes em uma busca, agrega em memória em **O(A)** tempo/memória e evita uma query por meta/fonte. Escritas consultam soma indexada da fonte sob lock; isso serializa concorrentes na mesma fonte, mas pode aumentar contenção em conta popular. Medição de planos, carga e N+1 fora deste fluxo pertence à CF-025; concorrência financeira ampla e recibo durável à CF-024.
- `currentValue` da meta monetária é um agregado persistido das destinações novas, atualizado na mesma transação. Legado com progresso monetário sem origem comprovada fica `allocation_reconciled=false` e bloqueia nova destinação até conciliação. Não há reconciliação automática de dados reais.
- O frontend existente ainda usa texto de “retirar/devolver saldo da meta” e pode enviar `targetAccountId` na exclusão. O backend rejeita essa requisição para impedir crédito fictício. A tela de checklist ainda oferece “saldo da meta” sem escolher fonte real. Compatibilização de UI/BFF, contrato de payload e E2E precisam de revisão antes de disponibilizar os novos fluxos a usuários; esta execução respeitou o escopo backend da CF-020.
- O endpoint legado `updateBalance` registra avaliação na data atual com origem `USER_ADJUSTMENT_UNSPECIFIED`; já não cria rendimento fictício, mas ainda não exige motivo/data informados nem distingue correção de posição de variação de mercado como FIN-04 completo pede. Cancelamento de operação de investimento é bloqueado até existir compensação rastreável; a rotina de correção de cadeia de custo e taxa de compra não foi implementada. Reembolso de compra em cartão **após excluir o item/meta** também não dispõe de vínculo recuperável neste fluxo (antes da exclusão usa CF-019). Esses pontos exigem decisão/implementação na revisão da CF-020; não foram declarados cobertos.
- `InvestmentRepository.sumTotalValueByUserId` ainda agrega avaliações desconhecidas como zero para consumidores de dashboard, e receitas/despesas de compra/venda exigem conciliação de relatório em CF-021. O método de posição individual preserva `null` como desconhecido; não se certificou agregado patrimonial ou período anual aqui.
- Nenhuma migração foi aplicada em banco real; preflight, backup/rollback e reconciliação seguem os gates CF-017. Não há revisão independente desta implementação. Um `GoalService` grande e DTOs antigos mantidos por compatibilidade pedem separação de domínio na CF-027; não houve refatoração ampla nesta tarefa.

CF-020 fica `em_revisao`, com as lacunas acima explícitas. A base local já permite **iniciar CF-021** para conciliar relatórios, sujeito à revisão de CF-018/019/020; isso não libera publicação. CF-024 ainda depende de CF-023; CF-028 também de CF-023; CF-027 aguarda CF-022/024; CF-030 aguarda CF-024/029. Nenhuma delas foi executada aqui.
