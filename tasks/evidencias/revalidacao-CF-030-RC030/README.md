# Parecer independente — revalidação RC030

**CF-030 aprovada e concluida no escopo local/descartável em 21/10/2026.**
RC030-01/P2, RC030-02/P2 e RC030-03/P3 encerrados no candidato
`c13aecd032ca8a08276226e55a37864aa18b4873`, base
`251d6c70492e4ad57dc9ca1313dce17afab62464`, branch
`codex/cf030-aplicacao-onboarding`. Nenhuma correção de produto nesta revalidação.

## Decisões separadas

| Item | Parecer e prova |
|---|---|
| A. RC030-01 | **Encerrado.** Encargos conhecidos do conjunto elegível precedem principal mais antigo; pagamentos parciais, quitação, excesso, UNKNOWN, alocações, limite, rollback e replay coerentes na persistência. Contraprova retorna principal179 em vez de189 |
| B. RC030-02 e binding | **Encerrado e ajuste aceito.** INITIALIZE_EMPTY/CREATE validam ciclos derivados, futuras e configuração autoritativa; data inválida rejeitada sem aplicação. LocalDate direto preserva DATE nas três propriedades, releitura/query/DTO e três fusos. Binding antigo falha em6 de21 controles, sem erros |
| C. RC030-03 | **Encerrado.** Faixa validada antes de intValue; inválidos400 com campo/código adequados em prepare/complete. Versão do draft conserva erros próprios; falha interna real continua500 sanitizado. Mutação restaura500 indevido |
| D. Observador adaptado | **Aceito explicitamente no conjunto de provas.** Rejeição antecipada específica com ausência de efeitos substitui pré-condição incompatível de sucesso. Ramo concluído mantém assertion original. Mutação civil falha nos dois probes, inclusive ano10000 no adaptado; nova prova HTTP estrita complementa |
| E. CF-030 integral local | **Aprovada.** Três impedimentos encerrados, sem novos achados confirmados; critérios anteriormente sustentados preservados e regressões afetadas verdes. Não constitui liberação de sucessoras ou adoção real |

## Validação e alcance

**156 casos distintos aprovados:76 dirigidos e80 regressões, zero falhas/erros/skips.**
Incluem22 provas independentes novas. Quatro contraprovas isoladas detectadas:
pagamento antigo (1 falha), aceitação civil (2), binding antigo (6 em21) e versão
antiga (1), todas sem erros. Controle restaurado **76/76**;413 arquivos da cópia
conferidos sem diferenças. Os134 casos e54/54 entregues foram auditados, não somados
às execuções novas. A fixture civil própria teve21 erros iniciais, corrigidos e
preservados com justificativa; nenhum critério normativo foi relaxado.

Atomicidade, ownership, guard/ordem de locks, recibo, replay/recuperação e estado
permanecem sustentados. E01, reservas legadas e V16 são aceites reaproveitados
onde o delta não altera o mecanismo; Flyway completo/validate executados nos
schemas novos. Sem nova auditoria geral ou certificação de todos os interleavings.

O planner e a agregação custam O(N) sobre linhas carregadas. A consulta ordena no
banco e o fluxo mantém escritas/eventos por fatura; não há garantia O(N) para o
custo total, benchmark de produção ou alegação de SQL total constante. A ausência
de SELECT por componente no planner foi conferida no código e no JOIN FETCH.

O binding novo preserva o literal DATE existente. **Não repara datas antigas já
gravadas deslocadas**: a interpretação passa a refletir o valor real armazenado,
e qualquer saneamento histórico exigiria proveniência. Não requer mudança de
schema para este aceite; não autoriza migração/backfill ou uso em banco real.

## Rastreabilidade

- [Matriz anterior às execuções](MATRIZ.md).
- [Análise dos achados, observador, binding e complexidade](ANALISE.md).
- [Execuções, falhas preservadas e comandos](EXECUCOES.md).
- [Resultados de todas as execuções](results.json), [casos únicos](cases.json),
  [auditoria histórica](historical-audit.json), [restauração](final-restoration.json).
- [Git e preservação](GIT.md).

README raiz preservado com SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
4123 arquivos dos runtimes e169 evidências anteriores intactos. O original do
observador coincide com o blob Git da base. Sem clean/reset, limpeza geral de
target, push, merge, deploy ou banco real.

## Estado e encaminhamento

CF029 segue concluída. CF031/032 continuam propostas, não executadas/liberadas.
CF031 ainda exige CF015, que está em_revisao; pendência de zoom CF010/015 e adoção
real CF017/P01/P02 preservadas. Aceites anteriores e relatórios históricos não
foram reescritos: este parecer registra o encerramento dos achados neste candidato.

Próximo passo: resolver o gate remanescente da CF015 antes de liberar CF031.
Publicação/integração dos commits depende de autorização separada; nenhuma foi feita.
