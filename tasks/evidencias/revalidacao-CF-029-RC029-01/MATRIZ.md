# Matriz anterior à execução — RC029-01

Candidato aa88eccb18b5e9eb7ae5794e6204191d823bb588, base eb70a4b,
branch codex/cf029-onboarding. HEAD exato, staging vazio, apenas README e runtimes
preexistentes fora do lote. README SHA256 informado confirmado na entrada.

| Obrigação / norma independente | Resultado exigido | Prova a confrontar / execução dirigida |
|---|---|---|
| SPEC001 §§2/3: reserva só para meta monetária; inconsistência persistível |NUMERIC retorna200, preserva valor/vínculo, issue no goal; MONETARY não recebe mismatch |Probe original intacto +12 combinações CREATE/alias/ID × reserva/ASSIGN × tipo |
| SPEC001 §5.1: ASSIGN também identifica meta monetária |Mesmo diagnóstico sem alterar registro protegido; CLOSE não exige fonte/meta fictícia |reservationAssign*; probe independente de índices mistos |
| FieldError §5 e encerramento RC029-01 |path aponta item/goal; code GOAL_TYPE_MISMATCH e mensagem sem dados financeiros |Comparações literais de paths/código, não expected calculado pelo validador |
| SPEC001 §§2/5: recuperar último save confirmado |GET conserva payload/versão/issues; novo save reavalia; inválido não sobrescreve |Mudança externa de tipo e remoção, SQL independente; derivação contratual no parecer |
| Isolamento CF023 e precisão FIN06, aceites anteriores |400 estrutural,404 uniforme alheio/ausente; dinheiro e tabelas intactos |18 dirigidos +probe original; snapshot de todas as tabelas e payload literal |
| Política de testes: sensibilidade |Remover chamada restaurará defeito; restaurar bytes recuperará comportamento |Cópia nova do candidato; original +6 NUMERIC/6 MONETARY, hashes e logs |
| Custo linear / ausência de N+1 |Uma query de metas para1/50; exatamente os IDs enviados; sem query de metas no GET |Observador Map/SqlParameterSource, inspeção do overload e delta sem novo SQL |
| Preservação dos aceites |Sem mudança em schema/locks/versão/exclusão/precisão |Diff de produto só DraftConsistency/DraftReferences; provas originais mantidas |

Decisões A/B/C/D serão registradas somente após os resultados. CF030 aplica e
revalida finanças; não exigir finalização/recibos/UI para encerrar este achado.

## Resultado

Todos os itens dirigidos atendidos:19/19 na seleção original+dirigida,3/3 probes
independentes. Retirada da regra:7 falhas causais/0 erros em13; restauração:13/13.
RC029-01 encerrado; issues persistidas/GET conformes; aceites anteriores preservados;
CF029 concluída localmente. Detalhes, limites e prontidão seletiva no README.md.
