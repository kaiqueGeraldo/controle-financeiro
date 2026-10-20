# Parecer independente — CF-030

**Não aprovada. CF-030 permanece em_revisao**, exclusivamente local/descartável,
por **RC030-01/P2, RC030-02/P2 e RC030-03/P3**. Nenhum código de produto corrigido.
Revisão em20/10/2026 do intervalo completo
`5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251..89760e64a73b6268d8cf34745cf41d6b00dcd781`,
na branch `codex/cf030-aplicacao-onboarding`. Branch e HEAD de entrada conferidos;
staging vazio; nenhuma alteração posterior de produto encontrada.

## Decisão por critério

| Critério | Decisão independente e alcance |
|---|---|
| Falha no último item reverte tudo e mantém recuperação | Sustentado: falha em previsão, recibo, depois de writes terminais e probe após todos os itens; SQL independente sem efeitos; retry idêntico funciona |
| Mesma identidade/conteúdo retorna original; divergência conflita | Sustentado: replay precede versão consumida, snapshot durável, alteração posterior de posição não recalcula recibo; identidade alheia não expõe resultado |
| Duas conexões deixam efeito único, totais corretos | Sustentado no protocolo exercitado: intenção/guard/users; disputa real de capacidade depois da revalidação, replay e owners distintos; contraprova causal |
| Evidências e testes não enfraquecidos | Sustentado: relatórios históricos auditados, observador corrigido sem mudar critério, novos testes financeiros vermelhos preservados |
| Efeitos financeiros completos exigidos pela SPEC | **Parcial:** E01/aberturas/reservas/proveniência/precisão sustentados; pagamento de encargos entre faturas incorreto (RC030-01) |
| Temporalidade e revalidação da configuração | **Parcial:** cinco controles de fuso efetivo passam; INITIALIZE_EMPTY persiste ano10000 (RC030-02) |
| Envelope v1/erros | **Parcial:** autenticação/schema/hash/replay sustentados; versão fora de int vira500 (RC030-03) |
| Migração V16 e exclusão | Sustentado localmente: cadeia vazia, upgrade V15 com dados, validate, rerun0, constraints e exclusão concorrente/rollback |
| Custos | SELECTs em lote e limites exercitados; não certifica SLA, heap máximo nem complexidade linear de todo perfil de evidências legadas |

As quatro marcações do executor na tarefa não bastam para aceitar efeitos novos
que divergem da norma. Os achados não reabrem aceites anteriores por associação;
delimitam a integração introduzida pela CF-030.

## Achados

1. **RC030-01/P2:** abertura com principal/encargos em faturas distintas; pagamento
   de10 deveria quitar encargos, mas reduz principal189→179 e superestima limite
   disponível em10. Caixa/dívida corretos não bastam para reconciliar composição.
2. **RC030-02/P2:** INITIALIZE_EMPTY ignora a validação de ciclo aplicada a CREATE;
   competência9999-12 com fecha31/vence30 comita `due_date=10000-01-30`.
3. **RC030-03/P3:** contractVersion4294967297 causa500 JsonNodeException em vez de
   rejeição400; nenhuma aplicação financeira foi observada nesse pedido.

[Achados, localizações, reprodução e condições objetivas de encerramento](ACHADOS.md).
Quatro assertions falham por três achados: RC030-02 tem prova na preparação e na
persistência. Não são quatro defeitos distintos.

## Garantias sustentadas

E01: patrimônio1451, dívida350 e reservas550, sem receita/aporte/compra fictícios;
previsão pendente não altera posição. Valores exatos relidos, prazo vencido e
proveniência desconhecida preservados. E23/E28/E34 conservam nominal400 uma vez;
E32 autoriza100 independente e total500. Fechar uma pendência conserva as demais.
ASSIGN deficitário é permitido pela norma, sem autorização de aumento adicional.

O guard exclusivo cobre o período da revalidação até o commit; writers financeiros
enumerados aderem antes dos locks de recursos. Probes com conexões independentes
posicionaram a disputa nessa janela. Writer GoalService com guard espera e recusa
excesso; sem guard, somente na cópia, deixa reserva1200 de fonte1000. Controle após
restauração passou. Replay concorrente é único; cancel/delete foram exercitados
com ambos os vencedores; outro owner progride. Não se promete ausência universal
de deadlocks nem cobertura dinâmica de todo par de writers.

Transação externa Spring engloba adaptadores MANDATORY, JPA/JDBC, recibo e
COMPLETED. Invalidação relevante é AFTER_COMMIT. Recuperação autenticada usa
persistência; cache não é autoridade. GET da CF029 conserva as issues do último
save, enquanto preparação/aplicação fazem revalidação nova.

## Execuções, limites e preservação

Seleção consolidada **195 casos distintos:191 passaram,4 falharam,0 erros/skips**.
As92 verificações iniciais e93 regressões finais estão verdes; os10 casos
financeiros/temporais adicionais contêm os4 vermelhos. Relatórios originais504/504,
quatro mutações e21/21 restaurados foram auditados, não somados aos resultados
novos nem usados como aceite automático.

Os primeiros5 probes deram erro de instrumentação MANDATORY, preservado e corrigido
só no observador. Código normativo/expected não foram adaptados ao resultado.
Não houve retry até passar, aumento de timeout, migração antiga editada ou ORM update.

[Matriz prévia](MATRIZ.md), [writers e proteção](WRITERS.md),
[execuções e contraprovas](EXECUCOES.md), [custo e reconciliação](CUSTO.md),
[resultados](results.json), [seleção sem sobreposição](final-selection.json),
[Git e preservação](GIT.md).

README raiz preservado, SHA256 inicial/final
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
4123 arquivos dos runtimes não rastreados .cf22/.cf22r/.cf22s conferidos intactos;
JDK reutilizado, sem clean/reset ou limpeza geral de target. Evidências anteriores
intactas; nova cópia isolada conservada. Nenhum push, merge, deploy ou banco real.

## Sucessoras e próximo passo

CF031/032 continuam propostas e não liberadas. CF031 depende do saneamento/aceite
CF030 **e** CF015; zoom nativo200% CF010/015 permanece pendente. CF032 conserva
CF031 e demais gates. CF017/P01/P02 mantêm adoção real pendente. Não foi
implementada entrevista frontend nem jornada CF032.

Próximo passo: saneamento restrito dos três achados, mantendo os probes/oráculos
e os critérios já sustentados; depois nova revisão do delta e das regressões
afetadas. Não publicar ou integrar este candidato como aprovado.
