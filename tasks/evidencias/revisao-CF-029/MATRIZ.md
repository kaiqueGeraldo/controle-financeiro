# Matriz independente — definida antes dos testes, 19/10/2026

Candidato: dd554d188976144ccf00e00f9b20242196f70d90..5bac46ee65cfbf4dade0705b7a430a15731be832,
branch codex/cf029-onboarding. Staging inicialmente vazio; README modificado preexistente,
SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Runtimes .cf22/.cf22r/.cf22s preexistentes e preservados.

| Critério / norma | Implementação | Expected independente | Teste/evidência existente | Lacuna / execução de revisão |
|---|---|---|---|---|
| Save sem efeitos, SPEC-001 §§2/8 | DraftService, V15 | Somente sessão muda; nenhum saldo, movimento ou recibo | e01DraftLeavesAllFinancialTablesUntouchedAndExactAfterReload | Comparar todas as tabelas financeiras também em PAUSE/RESUME/DISCARD |
| Duas abas, §§2/5/6 | lock users + versão explícita | Um vencedor, um409, snapshot vencedor durável | bothFirstCreationAndExistingRevisionRaceHaveOneWinner | Reexecutar; adicionar SAVE×DISCARD/PAUSE/RESUME com transações independentes |
| Isolamento, CF-023 / §4 | Principal, DraftReferences, repositório | 401 sem autenticação;404 uniforme alheio/ausente; rollback | ownOnlyReferences, expiredMissingAndMalformedToken | Referência própria arquivada/mudada/deletada; campos de proprietário rejeitados |
| Persistência/retomada, §§2/5 | sessão text/Instant/bigint | GET não cria; PUT substitui snapshot; omissão não é null; tombstone mantém ID | firstGet, pausedDraft, invalidRequest | Releitura SQL independente e remoção de itens; ciclo completo sem efeitos |
| Parcial versus inválido, §§2/4 | DraftValidator/Consistency | Ausência de folhas gera issue; valor malformado400; inconsistência preservada |41 casos unitários declarados | Probes de fronteiras não cobertas e diagnóstico por campo |
| Precisão/temporal, FIN-06/NG-01/SPEC-002 | BigDecimal, strings, LocalDate | Limites12+2/12+8 exatos; civil intacto; agregado não é input | limites, datas, E01 | Reexecução e contraprova double; UTC/SP/+14 conforme risco |
| Referências/reservas, CF-028 | consultas em lote / registros protegidos | Propostas não viram evidência; ref obsoleta409; revalidar aplicação na CF030 | protectedConfirmation | Conservar fronteira; não exigir produtor financeiro nesta tarefa |
| Migração/exclusão, §8/CF017 | V15/UserService | cadeia vazia, upgrade14, reexecução0, validate; rollback preserva ambos owners | MigrationTest/SchemaInitializer, rollbackAndDeletion | Reexecução Flyway explícita, rollback após delete e save×delete |
| Evidências sensíveis, política de testes | testes e scripts | Mutantes versão/owner/precisão devem falhar causalmente |176 seleção;53 SP;53 +14;3 mutantes | Reexecutar em cópia própria; não somar seleções sobrepostas |

Resultados e decisão serão registrados no parecer. Matriz não declara aceite antecipado.
Validações de preparação/aplicação, totais SummaryAmount e evidência autoritativa são CF-030;
UI e jornada são CF-031/032. Pendências de zoom e adoção real permanecem separadas.

## Resultado da revisão

Baseline53 aprovada; disputas entre ações e exclusão comprovadas por conexões
independentes e pg_blocking_pids; ciclo financeiro intacto em todas as tabelas,
substituição integral/SQL, upgrade/reexecução Flyway e rollback confirmados.
Precisão/NG01/agregados de entradas preservados nos probes. Controle efetivo+14
aprovado12/12;3 mutantes detectados/restaurados. Ver EXECUCOES.md para sobreposições,
erro da fixture e limites. Validação semântica fica parcialmente não atendida:
RC029-01/P2, reserva para meta NUMERIC sem issue. CF029 permanece em_revisao;
nenhuma sucessora liberada, nenhuma correção de produto nesta revisão.
