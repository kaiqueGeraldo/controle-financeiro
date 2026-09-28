# Evidência CF-019 — cartões e faturas

- Data/base: 28/09/2026, `a2a7761bc57e95c0757f304cb9c0e7f0a65008d6`.
- Revisão exata validada: código, migração, testes e especificação do commit
  `fb43e62`; documentação de evidência/estado é o segundo commit da tarefa.
- Ambiente: Windows/PowerShell, JDK 21.0.12.1, Maven Wrapper, Spring Boot 4.0.2,
  Testcontainers 2.0.3 e PostgreSQL 16 descartável. Dados e emails sintéticos;
  nenhum teste em Railway, envio real, navegador, push ou deploy.
- A alteração preexistente em `README.md` ficou fora do escopo e dos commits;
  SHA-256 observado: `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
- Dependências CF-006/017/018 estão integradas na base local, mas continuam
  `em_revisao`. Adoção do esquema em banco real aguarda preflight/conciliação
  dessas tarefas.

## Oráculos anteriores ao código

SPEC-004 FIN-03/06/07 e a decisão explícita do usuário para DEC-03 definem:
fechamento nominal 29–31 limitado ao último dia válido; compra no fechamento
entra no ciclo seguinte; competência é o mês do fechamento; vencimento é o
primeiro dia nominal válido estritamente posterior. Essa é uma política gerencial,
sem regra de dia útil ou garantia do emissor. Exemplos normativos em
`docs/sdd/specs/004-regras-financeiras.md`.

| Critério | Exemplo independente | Prova |
|---|---|---|
| Parcelas/centavos | 100.00/3 = 33.33, 33.33, 33.34; 0.01/2 rejeitado | `Cf019CardIntegrationTest`, linhas persistidas no PostgreSQL |
| Fronteira/mês curto | Fechamento 31: 2024-02-28 ainda fevereiro, 2024-02-29 vai a março; vencimento 31 em fevereiro não bissexto = dia 28 | Integração + `ScheduledCalendarClockTest` com instantes em São Paulo |
| Pagamento | Compra 200, baixa 80 → dívida 120, estado `ROLLED`; baixa 120 → zero e conta −200, sem nova despesa | Serviço, listener e agregados reais |
| Antecipação e rolagem | 50 antecipados de 200 deixam 150; fatura seguinte carrega 120 de fatura encerrada com saldo, sem duplicar compra | Integração e planejamento persistido |
| Estorno e crédito | Compra 120, paga 100, estorna 120 → dívida 0 e crédito no cartão 100; compra 60 usa crédito e deixa 40 | Histórico de compra preservado, `card_refunds`, limite e conta |
| Estorno parcial parcelado | Compra 90 em 30/30/30, estorno 40 → abatimentos 0/10/30, dívida 50, limite disponível 950 | PostgreSQL e resumo agregado |
| Abertura | Limite 1000, fatura corrente 200 incluindo parcela corrente, futuras 50×3 → dívida/comprometido 350, disponível 650; após pagar 200 → 150/850 | Lote `OPENING`, sem compras ou parcelas pagas fictícias |
| Repetição, concorrência, falha | Dois pagamentos simultâneos de 100 sobre 200 com mesma impressão de operação → um único débito; trigger falha após débito e exige rollback integral; cron falha no update e retry fecha uma vez | PostgreSQL com threads e trigger sintético; email mockado |
| Migração | V4 aditiva preserva origem desconhecida e datas de ciclo antigas ausentes; não fabrica pagamento, estorno ou abertura | Migração vazia e de fixture V1, `hibernate validate` |

## Falha anterior e causa

O primeiro conjunto de três cenários PostgreSQL foi executado contra a lógica
anterior. Para 100.00/3, o sistema gravava 33.34/33.33/33.33, contrariando o
resto na última parcela. No pagamento parcial, 80.00 de 200.00 marcava a fatura
`PAID` apesar de 120.00 de obrigação; no adiantamento de 50.00, a obrigação
original permanecia 200.00. A execução inicial também encontrou fixture sem
categoria reservada e, antes da V4, colunas inexistentes; esses erros de preparo
**não** foram tratados como detecção causal. O teste de fechamento posterior
expôs acesso lazy após sair da transação, corrigido ao capturar dados do aviso
dentro dela. A suíte ampliada expôs testes de calendário baseados na antiga
competência de vencimento; seus valores foram reescritos conforme a decisão
DEC-03 documentada, com datas literais independentes da implementação.

## Implementação e verificações

- V4 guarda datas do ciclo para fatos novos, saldo pago/estornado, origem,
  crédito, lotes de abertura, pagamentos, alocações, estornos e chaves de
  repetição. Linhas legadas permanecem `LEGACY_UNKNOWN`, sem fechar faturas de
  data desconhecida nem atribuir pagamento fictício.
- Compra e pagamento serializam por cartão, com unicidade de fatura e IDs de
  operação. Alocação do principal, lançamento bancário e planejamento participam
  da mesma transação. Pagamento de fatura tem origem `INVOICE_PAYMENT` para
  não entrar novamente em despesa; a conta ainda é debitada.
- Estorno abate parcelas não pagas da última para a primeira, registra crédito
  separado para a parte já paga, conserva a compra e ajusta gasto líquido
  anual pela data do estorno.
- Listagem de cartões agrega dívidas em lote, incluindo parcelas futuras;
  faturas pagas legadas não ressurgem como dívida só porque V4 não fabricou
  alocações. Os campos novos expõem comprometido, disponível, crédito, saldo
  pagável e transporte.
- Atualizações compartilhadas de relatório anual, agregados de transação,
  controller e chamada de metas foram necessárias para preservar esses efeitos
  nos consumidores; especificações 002/004 foram atualizadas pela decisão DEC-03.

Comandos de reprodução, no diretório `controle-financeiro-backend`:

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf019CardIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf019CardIntegrationTest,CF015PaymentRecoveryTest,ScheduledCalendarClockTest,InvoiceBankOperationListenerTemporalTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' test
```

Nos checkpoints: integração CF-019 **13/13**, gate relacionado **28/28** e
suíte backend **149/149**. O gate final, já com a V4, validação legada,
exposição de saldo incerto e estorno parcial parcelado, passou com **150 testes,
0 falhas, 0 erros e 0 ignorados** (`BUILD SUCCESS`, 01:09 min, 08:48 em
28/09/2026). Não houve relaxamento de assertivas ou tolerâncias.
`git diff --check` não apontou erro; apenas avisos de conversão LF/CRLF no
Windows. O primeiro `test-compile` no sandbox falhou ao fechar recursos do
compilador; o mesmo compilador foi executado com acesso autorizado e passou.

## Trade-offs e limites

- O lock por cartão serializa operações monetárias concorrentes desse cartão.
  Compra em N parcelas custa O(N) gravações; pagamento percorre as obrigações
  elegíveis em ordem estável e grava até O(N) alocações. A listagem usa agregação
  em lote, mas o cron ainda varre faturas abertas e faz consultas por fatura
  vencida; medir plano SQL e carga em CF-025.
- Sem `operationId`, a impressão `(fatura, conta, data, valor, antecipação)`
  bloqueia retries, mas também bloqueia um segundo pagamento legítimo idêntico.
  Clientes que precisem repetir valores devem enviar IDs distintos. Protocolo
  HTTP/recibo durável completo permanece CF-024.
- Valor negativo legado pode representar ajuste, pagamento ou estorno; não foi
  classificado por descrição. O pagamento de fatura com esse ajuste é bloqueado
  para conciliação, e relatórios históricos ainda têm semântica incerta.
  `PAID` legado é usado como estado conhecido, sem reconstruir suas alocações.
- Faturas antigas sem `closing_date` não são fechadas automaticamente. Regras
  reais de emissor, juros, encargos e dia útil requerem contrato explícito.
  Campos nulos de ciclo legado e reconciliação são limitações visíveis.
  A API informa `remainingAmount = null` nos lançamentos legados de proveniência
  desconhecida para não declarar saldo por parcela sem comprovante de baixa.
- O email é disparado após commit e pode falhar sem desfazer o fechamento;
  entrega exatamente uma vez exige outbox/recibo futuro. O teste só verifica
  ausência de envio em rollback e ausência de duplicação no retry local.
- Não houve validação E2E BFF/frontend/reload, revisão independente, carga
  concorrente em produção nem migração real. Onboarding HTTP completo é de
  CF-028–032; aqui há representação e método de domínio testados.

## Estado e dependências seguintes

Implementação pronta para revisão independente, sem certificar implantação.
CF-019 satisfaz sua parte das dependências de CF-021, CF-024, CF-027, CF-028
e CF-030, mas nenhuma fica integralmente liberada por esta execução: CF-021
aguarda CF-020; CF-024 aguarda CF-020/023; CF-027 aguarda CF-020/022/024;
CF-028 aguarda CF-020/023; CF-030 aguarda CF-020/024/029. CF-020 já tinha
base local CF-016/017/018 integrada e pode ser planejada separadamente,
respeitando os estados `em_revisao` das dependências.
