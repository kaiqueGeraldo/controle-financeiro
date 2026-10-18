# Matriz de aceite — candidato 5e2fae5

Revisão limitada ao critério4. Fontes de expected: DEC-08/SPEC-002, política de
testes e condições da [revisão anterior](../revalidacao-CF022/MATRIZ.md).

| Parcela | Obrigação | Evidência independente atual | Decisão |
|---|---|---|---|
| 4/RJ: relógio no caminho real | Date-only antes de navegar; preservar data civil e clocks nativos | Diff/import real; teste Node antigo vermelho/nativo falso e candidato verde; reload/dois fusos/contexto limpo | Atendido |
| 4/RJ: pintura/interação/persistência | Quatro jornadas reais, ação recebida, período correto, meta0→1→0 e SQL após reload | browser/results.json, paint-clocks.json, screenshots, SQL terminal e orquestradorJava PASS; 12 observações, drift máximo15,648ms, zero animação negativa | Atendido com preparação explícita da compilação dev |
| 4/H24: ausência de herança de fixture | Volume→callback→callback→volume começa vazio por método e conserva o volume501 | Quatro casos PASS em LifecycleReviewTest; schemas/conexões distintos; resultados501/1/1/501 e locks1002/2/2/1002 | Atendido |
| 4/H24: worker e recursos reais | Commits do worker não contaminam próximo método; contextos/pools/schedulers encerrados | current_schema no findForUpdate/worker e conexão coincidem; quatro contextos inativos, pools fechados, executores terminados | Atendido no ciclo observado, sem alegar tolerância a encerramento forçado do host |
| 4/H24: sensibilidade à regressão | Retirar isolamento deve detectar501 herdados, sem mudança no cron | Mutante AFTER_CLASS:2 casos/1 falha expected0/actual501 no segundo setup | Atendido; falha causal esperada, não erro de ambiente |
| 4: consumidores/assertions | Nenhum assert, prazo, volume ou função neutralizado | Diff dos sete arquivos,27 originais PASS, browser consumidor do initializer PASS, helperCJS só usado por browser/teste | Atendido; nenhum helperTS/produto alterado |
| 4: rastreabilidade/preservação | Falhas mantidas, comandos reproduzíveis, fontes corretas | 90 hashes do manifesto do candidato;3792 arquivos antigos intactos;431 fontes de produto e sete de teste conferidas; falha de verificadorCRLF preservada e diagnosticada | Atendido |

## Critérios 1–3: aceites preservados

| Critério | Aceite reutilizado | Incidência desta revisão |
|---|---|---|
| 1. Mesmo dia sem duplicidade e reversão exata | revisão-CF-022-CF-023, tabela DEC08 e matriz independente revalidacao-CF022 | Nenhuma regressão; novas jornadas preservam efeitos0→1→0/SQL. Não reabre auditoria financeira |
| 2. TZ/semana/calendário | Mesmas referências; CF006/RD58 posterior integrado | Payload04/01/2027 e semana aberta com streak0 nos dois fusos;27 casos originais continuam verdes. Não transfere aceites de RVA03/CF014 |
| 3. Reexecução, locks, ofensiva e histórico | Revisão conjunta DEC08/ShedLock/rollback/mutações e revalidacao-CF022 | Callback real/retry e27 originais preservados;2→1006→2 é prova anterior conferida, não um novo SLA |

**Critério4 aceito; CF-022 concluida no seu escopo.** Nenhum critério foi removido
ou substituído por exceção. A incerteza histórica não é requisito retroativo de
medição. Os defeitos atuais de confiabilidade que motivavam a pendência foram
corrigidos com contraprovas sensíveis; contratos funcionais conservam provas próprias.

CF029 mantém prontidão exclusivamente local/descartável, dependente de CF017/023/028;
não surgiu bloqueio nessa capacidade e nenhuma sucessora foi executada. A conclusão
de CF022 não aprova release nem conclui outras tarefas automaticamente.
