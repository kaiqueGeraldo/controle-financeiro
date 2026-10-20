# Matriz independente — CF-030

Registrada antes da execução de testes desta revisão, em 20/10/2026.
Candidato: `89760e64a73b6268d8cf34745cf41d6b00dcd781`, base `5b8c4e0`.
Norma: SPEC-001 aprovada em CF-028 e suas referências FIN/NG/temporais;
aceite CF-029/RC029-01 preservado. Resultados finais serão registrados no parecer.

| Critério / regra | Estado inicial e resultado esperado independente | Código / garantia a conferir | Evidência entregue / lacuna dirigida |
|---|---|---|---|
| Preparação, versão e ownership — §§2/5/6 | Draft próprio salvo; preparar congela edição; referências alheias/ausentes 404; mudança posterior exige nova revisão | ApplicationService + DraftReferences + users lock + preparation única | Application/Boundary/Lifecycle; verificar janela após revalidação |
| Save/GET CF-029 | Issues do último save permanecem no GET; aplicação reavalia dados atuais | DraftService.get/save; validate no prepare/complete | Aceite RC029-01; reexecutar controles afetados |
| Atomicidade — critério 1 da tarefa | E01 e falha no último item/recibo/pós-escrita: nenhum efeito persistido e PREPARED recuperável | @Transactional externo + Openings/Intents MANDATORY; eventos AFTER_COMMIT | Application/Atomicity/Lifecycle; observar SQL independente e retry idêntico |
| Idempotência — critério 2 | Mesma chave/corpo após commit retorna mesmos IDs/valores/instante; corpo diferente conflita | Advisory da intenção + PK recibo + fingerprint + replay antes da versão | Application/Precision; concorrência determinística e recuperação |
| Concorrência — critério 3 | Dois confirmadores: um efeito; save/discard/cancel/writer/delete serializam ou abortam sem parcial; outros owners independentes | Guard exclusivo/shared + locks existentes + PK/uniques | Latches de largada não provam ponto de disputa; adicionar interleaving após revalidação |
| Cancelamento — §6 | Antes: sem finanças; repetido: mesma versão; após commit: conflito; corrida não esconde commit | Application.cancel e mesma chave de lock | Lifecycle/Application; forçar ambos os vencedores |
| Efeitos — FIN01–05 / E01 | 1300 contas + 501 ativos − 350 dívida = 1451; reservas 550, previsão80 sem realizado | Openings + projeção; commit conjunto; SQL por domínio | E01 entregue; recalcular e reler sem usar resultado de projeção como oracle |
| Legado — §5.1 / E23/28/32/34 | Origem incerta bloqueia união; nominal uma vez; nova fonte não prova independência; resolver uma não resolve outra | Projection/Registry/EvidencePolicy e registros protegidos | Reservations; explorar combinações, ASSIGN/CLOSE e leitores cotidianos |
| Declaração atual — §5.1 | ASSIGN pode revelar déficit real; não autoriza aumento adicional. CLOSE preserva trilha e outras pendências | confirmations/reservationParts/newAllocations/Openings.declarations | Não confundir déficit declarado permitido com bug de capacidade |
| Precisão — FIN06/NG01 | Entrada1.005 recusada; PRICE1×1.005=1.01; TOTAL1/3 preservado; soma2×máximo exata ampla | BigDecimal, SummaryAmount, JSON, numeric, snapshot imutável | Precision/Canonical; entrada→persistência→replay/GET, consumidores de UNKNOWN |
| Temporal — SPEC002/DEC03 | Datas civis/pré-existentes vencidas mantidas; instant UTC micros; calendário nominal sem arrasto de fevereiro | Clock, CardCycle, Openings, Inventory UTC | Boundary/Precision; controle de JVM UTC+14 nos caminhos sensíveis |
| Migração — V16 | Cadeia vazia e V15 com dados; upgrade preserva draft/finanças; rerun0; validate sem ddl update; exclusão sem órfãos | Flyway, constraints/índices, entidades, UserService | V16Migration/Lifecycle; reexecutar PostgreSQL descartável |
| Custos — §6 | Consultas em lote sem SELECT linear secundário; escritas por item; limites operacionais sem truncamento | Inventory + Projection + Openings | Capacity; verificar medições e complexidade das combinações não medidas |
| Evidências — critério 4 | Contagem504 não soma sobreposições; mutações falham causalmente; fontes restauradas | Scripts/logs/manifests | Auditar execuções e executar contraprova em cópia isolada |

CF-031: UI/BFF/validação visual; gate CF-015 continua obrigatório.
CF-032: jornada de navegador integrada. Não executadas aqui. CF-017/P01/P02:
adoção real não certificada por PostgreSQL descartável.
