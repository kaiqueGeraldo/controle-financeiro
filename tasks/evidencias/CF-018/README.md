# Evidência CF-018

- Estado real e data: implementação local encerrada em 28/09/2026; tarefa em
  `em_revisao`, sem revisão independente nesta execução.
- Modelo/esforço usados: a tarefa registra `gpt-5.6-sol` / `xhigh`; o
  identificador efetivo do runtime da sessão não é exposto como evidência
  verificável.
- Commit/base e identificação do diff local testado: base `0cc24b7`; produto e
  regressões em `4203f18`; a suíte final foi executada sobre conteúdo idêntico
  ao commit, antes apenas do registro documental.
- Runtime, sistema, navegador, viewport, timezone e seed: OpenJDK
  `21.0.12.1+1`, Maven Wrapper, Spring Boot 4.0.2, Testcontainers 2.0.3,
  PostgreSQL `16-alpine`, Docker 29.6.2, Windows/PowerShell,
  `America/Sao_Paulo`; dados exclusivamente sintéticos. Navegador e viewport
  não se aplicam ao escopo backend.
- Dependências integradas: base local CF-017 V1/V2 aprovada em `0cc24b7` e a
  parte de CF-008 necessária a contas/transações. O preflight real,
  backup/restore integral e adoção temporal em banco existente continuam
  pendentes e não foram usados como evidência.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Abertura positiva, zero e negativa | Abertura é posição patrimonial assinada, com origem/data, e nunca receita/despesa do período; conta arquivada permanece no patrimônio | `Cf018RegressionIntegrationTest` e queries reais dos cinco agregados | Positivo/zero/negativo conciliados; abertura excluída de receita/despesa; conta arquivada incluída no total |
| Previsão versus realizado | Intenção pendente não altera saldo/agregado; baixas parciais somam exatamente o valor realizado; baixa e estorno têm efeito único | Casos de pendência, duas baixas parciais, cancelamento e estorno no PostgreSQL | Estados `PENDING`, `PARTIALLY_SETTLED`, `FULFILLED`, `CANCELLED` e fatos `SETTLEMENT`/`REVERSAL` conciliados |
| Transferência | Duas pontas ligadas compartilham operação, a taxa é despesa separada e o patrimônio varia somente pela taxa; erro intermediário reverte tudo | Transferência paga/pendente, exclusão/estorno, taxa e trigger que falha na segunda ponta | Conservação comprovada; falha forçada deixou zero pontas, zero taxa e saldos originais |
| Edição e exclusão | Fato realizado não é reescrito/apagado: gera reversão e correção ligadas; previsão pode mudar enquanto não realizada | Correção no mesmo período e entre anos, exclusão pendente/realizada e item gerenciado | Histórico preservado e agregados/períodos reconciliados sem efeito duplicado |
| Propriedade | Conta, destino e categoria precisam pertencer ao usuário em toda mutação alterada | Dois usuários sintéticos em criação, atualização e transferência | Referências alheias rejeitadas sem efeito parcial ou vazamento de existência |
| Precisão e saldo negativo | Valores usam escala 2 e limites do schema; conta bancária pode ficar negativa, caixa físico não | Centavos, limite numérico, débito em `CHECKING` e `CASH` | Exatidão decimal preservada; negativo bancário aceito e caixa insuficiente rejeitado |
| Migração | Mudança aditiva em nova versão; V1/V2 imutáveis; banco vazio e upgrade preservam linhas; Hibernate valida o schema | `EmptyDatabaseMigrationIntegrationTest`, `LegacyDatabaseMigrationIntegrationTest` | V1→V2→V3 verde; legado preservado, origem desconhecida não inferida por texto e `validate` verde |

O escopo cobre D16-01, D16-02, D16-03, D16-09, D16-13, D16-14 e
D16-15, atribuídos à CF-018. Nenhum outro item D16 foi antecipado.

## Falha anterior

Antes da correção, o teste PostgreSQL `Cf018RegressionIntegrationTest` foi
criado com quatro oráculos independentes e executado contra a base
`0cc24b7`. Resultado: **4 testes, 4 falhas**.

- abertura de 1.000 era observada como receita de 1.000, quando o esperado era
  zero;
- previsão de receita de 250 entrava no realizado, quando o esperado era zero;
- ao arquivar conta com saldo 100, o patrimônio observado caía para zero;
- categoria de outro proprietário era aceita na transação.

Essas falhas reproduziram as causas: abertura fabricada como transação de
receita, agregação por tipo sem estado/origem, filtro indevido de arquivadas e
ausência de escopo de proprietário na referência de categoria.

## Correção e validação

Implementação:

- V3 aditiva registra abertura na conta e adiciona estado, origem e vínculos de
  operação aos fatos financeiros; V1/V2 não foram reescritas;
- agregados financeiros filtram somente fatos realizados e excluem abertura,
  usando uma query SQL por agregado, sem compensação no frontend;
- transferência trava contas em ordem estável de UUID, grava as duas pontas e
  taxa na mesma transação e mantém `@Version` nos agregados de conta;
- baixa parcial, reversão e correção são fatos ligados; correção mantém o fato
  anterior e seu conhecimento temporal, inclusive quando a origem legada é
  desconhecida;
- as buscas de conta/categoria dos caminhos alterados incluem o proprietário e
  a API não diferencia UUID inexistente de UUID alheio.

Comandos executados em `controle-financeiro-backend`:

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf018RegressionIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' test
git diff --check
```

Resultados finais:

- regressão CF-018: 23/23 verdes no checkpoint dirigido; a suíte final inclui
  o caso adicional de correção entre anos e executou 24/24 verdes;
- migrações: 8 testes, 0 falhas/erros;
- suíte backend completa: **136 testes, 0 falhas, 0 erros, 0 ignorados**,
  `BUILD SUCCESS`, em 02:07;
- `git diff --check`: código 0; apenas avisos de conversão LF/CRLF do Git no
  Windows;
- hash SHA-256 do `README.md` preexistente permaneceu
  `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`
  e o arquivo ficou fora do staging/commits.

Não houve teste E2E de navegador, alteração de frontend, banco real, push ou
deploy. O primeiro `test-compile` dentro do sandbox falhou ao fechar recursos do
compilador; a mesma compilação no ambiente autorizado passou, caracterizando
limitação do sandbox, não regressão.

## Verificação adversarial

- Um trigger sintético lança erro no `INSERT` da ponta de entrada. O rollback
  PostgreSQL foi verificado em transações, taxa e saldos, não apenas por
  exceção da aplicação.
- Duas transferências concorrentes de 700 sobre caixa com 1.000 resultaram em
  exatamente uma operação efetivada. Os locks pessimistas seguem ordem de UUID
  para reduzir deadlock; a versão otimista existente foi preservada.
- Duas baixas concorrentes de 200 sobre previsão de 300 resultaram em apenas
  uma baixa. A soma ativa é lida sob lock da previsão.
- Os cinco agregados são exercitados com combinação de `is_paid`, estado e
  origem; remover o filtro de realizado ou de abertura torna as expectativas
  vermelhas.
- Constraints da V3 rejeitam metadados incompletos de transferência, baixa,
  reversão e correção e impedem segunda reversão/correção do mesmo fato.
- Edição realizada cruzando o ano foi adicionada para detectar compensação no
  período errado.
- Durante a autoria, uma expectativa de exceção de categoria foi refinada de
  regra de negócio para `ResourceNotFoundException`: o resultado financeiro
  continuou idêntico e o contrato mais estrito evita revelar existência de
  recurso alheio. O teste legado também foi fortalecido para exigir que o fato
  original continue bruto e sem auditoria inventada, enquanto a nova correção
  é auditada. Essas mudanças corrigem os oráculos; não acomodam o defeito.

## Revisão e pendências

### Riscos e trade-offs

- O modelo ligado de fatos evita um ledger novo e reduz a migração, mas aumenta
  a responsabilidade atual de `TransactionService`; extração de casos de uso e
  fronteiras de módulo permanece adequada para CF-027.
- Cada comando financeiro usa número constante de queries e a listagem faz
  `JOIN FETCH`, sem N+1 introduzido. As agregações são O(n) no conjunto filtrado
  no banco e retornam uma linha; índices da V3 favorecem usuário/estado/origem,
  com custo adicional de escrita. Plano e volume real pertencem à CF-025.
- Compatibilidade com linhas legadas aceita origem nula como desconhecida. O
  predicado correspondente pode reduzir seletividade; não foi usado para
  inferir origem por descrição.
- `DashboardService` ainda converte alguns `Number` via `double` fora do núcleo
  alterado. Os limites 12+2 reduzem o risco, mas a remoção/revalidação dessa
  fronteira cabe à conciliação integral da CF-021; a exportação tocada nesta
  tarefa converte para decimal exato antes do limite inevitável da célula XLSX.
- Publicação de eventos continua no comportamento já existente. Recibos
  duráveis, retry global e invalidação pós-commit são responsabilidades de
  CF-024, sem retirar as garantias de atomicidade exigidas aqui.

### Pendências preservadas

- RV17-01: preflight ainda é insuficiente para autorizar baseline real;
- RV17-02: backup/restore integral e adoção temporal no banco existente ainda
  não foram comprovados;
- V3 não foi aplicada nem ensaiada em banco real; os índices regulares podem
  exigir janela operacional em volume real;
- não houve revisão independente da CF-018. A marcação `em_revisao` é somente
  encaminhamento, não autoaprovação.

Nenhuma nova tarefa fica formalmente liberada por esta própria execução:
CF-019 e CF-020 tornam-se candidatas a início local após a revisão/integração da
CF-018; CF-021 continua dependente também das duas. CF-023 não depende da
CF-018, mas sua prontidão deve ser decidida pela cadeia própria. CF-024 continua
dependente de CF-019, CF-020 e CF-023. CF-019 não foi iniciada aqui.
