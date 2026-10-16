# Parecer independente CF019/RVA03 — 16/10/2026

**Mecanismo e correção do harness aprovados. RVA-03 encerrada com ressalva
histórica explícita. CF-019 e CF-013 concluídas; CF-015 permanece em_revisao
pela verificação separada de zoom nativo200%.** Nenhuma correção de produto.

## Base e preservação

Entrada e candidato18c7150, branch `codex/cf019-rva03-investigacao`;
intervalo8a83c357880ad20d4adff119a60100dae20cb868..18c7150, commits ae965aa,
ad1d6f8,18c7150. HEAD não havia avançado. Staging vazio; único delta preexistente
README raiz, hash6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Refs locais registradas em git-initial.json; não se afirma nova consulta remota.

Aplicadas instruções AGENTS fornecidas na conversa, guias de execução/testes e
skill Tech Lead & Arquiteto. Nenhum AGENTS adicional encontrado nas buscas.
Contraprova em exportação isolada `.rv3`, dependências instaladas compartilhadas
por junction, banco novo Testcontainers sem fallback. Produto da cópia confrontado
com o candidato, admitindo apenas conversão CRLF do Git; nenhum produto editado.
README e artefatos históricos conferidos por hash, sem restauração/limpeza.

## Decisões separadas

| Item | Parecer |
|---|---|
| A. Relógio e correção | **Aprovados**: Clock completo acumula origem entre navegações; startTime da saída fica no futuro da timeline. Date-only preserva o dia exigido e os relógios nativos, sem enfraquecer testes. |
| B. Investigação RVA03 | **Encerrada no cenário pós-pagamento120 demonstrado**. Original compatível por sequência/configuração/blobs/recibo/SQL/imagem; atribuição retrospectiva sustentada, sem afirmar React/WAAPI medidos no original. |
| C. CF019 | **concluida**: critérios financeiros previamente aceitos + ressalva integrada RVA03 encerrada. Não certifica banco real ou todos os cenários financeiros. |
| D. CF013 | **concluida**: quatro critérios confrontados; recuperação R03/RV01 preservada, RVA03 era o único resíduo próprio após RF15-04. |
| E. CF015 | **em_revisao**: recebe esses aceites; falta zoom nativo200% CF010/015. Nenhum aceite global por associação. |

[Matriz integral e dependências](MATRIZ.md), [mecanismo/equivalência/limites](MECANISMO.md),
[comandos, falhas e inventário](EXECUCOES.md).

## Prova independente

Uma matriz válida, quatro casos sem retry. Mesmos produto/fixture/sequência/data/
viewport/fuso/animações. Modos diferem no clock;120 tem exposição controlada25s
antes de navegar. Observações suplementares ocorrem após guardar a prova terminal.

| Caso | performance−timeline final | React | DOM pagamento em15s | Financeiro após reload |
|---|---:|---|---:|---|
| Antigo20 |12796,544ms|fechado/sem loading|0, fechamento atrasado|980/100 |
| Antigo120 |24884,138ms|fechado/sem loading|1, spinner/disabled|880/0 |
| Date-only20 |11,102ms|fechado/sem loading|0|980/100 |
| Date-only120 |6,702ms|fechado/sem loading|0|880/0 |

Antigo120: saída com currentTime−11218,138ms, enquanto spinner CSS tem tempo
positivo14116,165ms; não é congelamento global de pintura. Clique real→umPOST→
200/recibo→reads→React comprometido fechado→DOM retido→imagem do spinner.
SQL independente confirma quatro card_payments e quatro débitos para os quatro
usuários, operationId/recibo/bankTransactionId correlacionados. Sem replay nem
novo pagamento para recuperar a interface. Os controles Date-only permitem
fechar/reabrir detalhes antes e depois do reload; capturas finais aguardam conteúdo,
fim do skeleton, opacity1 e dois frames. Imagens efetivamente inspecionadas.

O verde4/4 é êxito de coleta/invariantes, **não quatro fechamentos aprovados**:
a falha visual antiga120 é exigida pelo verificador. A rodada anterior run-01
teve falha de isolamento CSS antes do POST, foi interrompida e preservada com
zero recibos. Scanner0→322 arquivos demonstra sua causa; não é RVA03 nem
repetição até passar. Detalhes e limitações em EXECUCOES.

Quatro probes e duas jornadas do executor foram confrontados em fontes, JSON,
SQL e logs. As duas jornadas originais sem Fiber/dwell continuam evidência
histórica válida de ad1d6f8/produto8a83c35: pagamento, exclusão, reembolso, reload,
recusa de segundo reembolso e POST único. Não foram reexecutadas desnecessariamente.
As capturas históricas com animations disabled não provam saída animada; a prova
causal e visual nova não usa essa opção.

## Limites e próximo passo

Não há medição retrospectiva de React/WAAPI, runtime histórico integral executado,
estimativa de frequência ou prova de ausência absoluta de bugs. As capturas
precoces originais de reload continuam precoces; nova prova não as reclassifica.
Preservados CF011/012/014, R03/RV01/RV24 e demais aceites; não encerrados outros
timeouts, falhas de pintura ou scheduler por associação. Sem nova auditoria ampla.

Próximo trabalho do marco: **verificar zoom nativo200%**, ainda necessário para
aceite/publicação. CF029 mantém prontidão anterior somente local/descartável,
conforme dependências da matriz; não executada aqui. CF017/P01/P02 conservam
adoção real. Nenhum push, merge, deploy, exclusão de branch, pagamento real,
onboarding ou tarefa posterior executados.
