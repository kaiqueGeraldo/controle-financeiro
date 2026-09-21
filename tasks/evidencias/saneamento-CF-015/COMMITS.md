# Commits locais e instrução ao próximo revisor

| Commit | Conteúdo e origem |
|---|---|
| `eb40303` | HEAD conferido ao iniciar; testes/documentos da revisão já versionados. Não reescrito. |
| `ad7fd81` | Integra o candidato CF-010–014 que já estava no working tree. Manifesto e patch do staging preservados; exclui README raiz. Seis regressões ainda falhavam nesse estado. |
| `7a4f89c480b191f6752117b0ad2bac7297d76c06` | Saneamento R06: consulta por dono e validação da cópia, com testes PostgreSQL. |
| `042926878f7ec365f348fb54a7f79884efed2b68` | Dependência concreta R03: guarda PAID e lock por cartão, com regressão de fechamento repetido/concorrente. |
| `aade169e3757d6e9a9e72eac6ab17b84b760e01a` | Correções frontend de reconciliação, corridas, rascunhos, foco, geometria, acessibilidade/lint e testes integrados Java/Playwright. |
| Commit que contém este relatório | Evidências, hashes e atualizações das tarefas; nenhuma mudança de runtime. |

Intervalo **exato de código/testes do saneamento**:
`ad7fd81..aade169e3757d6e9a9e72eac6ab17b84b760e01a`.

Intervalo inclusivo do candidato preexistente a revalidar:
`eb40303..aade169e3757d6e9a9e72eac6ab17b84b760e01a`.

A documentação desta entrega complementa esses intervalos. O HEAD documental
final pode ser encontrado com `git log -1 -- tasks/evidencias/saneamento-CF-015/COMMITS.md`;
o código permanece exatamente no commit aade169. `codigo-validado.json` registra
blobs Git e SHA-256 dos arquivos, além da preservação do README e dos oráculos
originais. `artefatos.json` registra os demais artefatos, excluindo a si mesmo e
o manifesto de staging da documentação.

## Separação e validação

Não houve staging global. Candidato preexistente, R06, guarda de pagamento e
frontend/harness tiveram listas explícitas e conferência do diff staged antes
dos commits. README raiz permaneceu alheio. O último commit de implementação
agrupa hunks relacionados de providers/hook/modal: dividi-los por achado daria
estados intermediários sem a propagação completa de erro/foco. Essa é a unidade
coerente testada, não uma atribuição retroativa das mudanças preexistentes.

Os testes validaram o working tree conjunto e depois seus arquivos foram
versionados sem mudança de conteúdo. Não se afirma que cada commit intermediário
foi testado isoladamente. A matriz final foi executada antes do commit aade169;
`git diff --cached --check` e ausência de diferença não staged no código foram
conferidos antes de gravá-lo. Documentação posterior não muda runtime ou testes.

Ao encerrar: branch main, staging vazio e apenas README.md com a alteração
preexistente preservada. Nenhum push, deploy, alteração de histórico ou migração
real. A conferência pós-commit deve confirmar esse estado; não usar limpeza Git.

## Ordem objetiva de revalidação

1. R06: `PlanningService`, `CategoryRepository`, `CF015PlanningOwnershipTest` e
   `PlanningEditIntegrationTest`. Dois usuários, inexistente, recusa sem plano
   parcial e cópia legada; comparar logs red/green e verificar transações/queries.
2. R03: `CreditCardService`, `CreditCardRepository`, `CF015PaymentRecoveryTest`,
   `payInvoiceModal`, `useCards`, `financialReconciliation`, Finance/Dashboard/
   Planning providers. Reexecutar perda de resposta depois de commit, 503 de
   releitura, retry sem POST e observar saldo/fatura/planejamento por SQL.
3. R01/R02/R04/R07: coordenador existente e consumidores, regressões originais
   intactas, novas entregas fora de ordem e nota confirmada após reload. Cancelar
   a rede sozinho não basta; revisar os guards de identidade/versão.
4. R08/R10/R12: comparar capturas do parecer e saneamento, operar teclado em
   fatura/modal filho e confirmar valor extenso sem recorte. Executar zoom nativo
   200% em navegador interativo, que ficou pendente neste harness.
5. R09/R11 e limites: validar seletores/expected preservados, quatro avisos
   removidos e zero novo; manter CF-017/P01/P02, CF-019/024 e CF-026 nos seus gates.

Caminhos são relativos à raiz: `controle-financeiro-backend/src/`,
`controle-financeiro-frontend/src/`, `controle-financeiro-frontend/tests/` e
`tasks/evidencias/saneamento-CF-015/`. O parecer original permanece em
`tasks/evidencias/revisao-CF-015/`.

Recomendação: pronto para **nova revisão independente com as lacunas explícitas**.
Essa recomendação não aprova o marco frontend nem a publicação.
