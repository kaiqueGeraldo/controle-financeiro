# Saneamento restrito CF033-01

**Saneado localmente, aguardando revalidação independente dirigida.** O achado
CF033-01/P2 não está autoencerrado. CF-033 permanece concluída **como execução da
revisão independente**, com seu parecer histórico preservado. Aceite irrestrito
do candidato continua condicionado à revisão deste delta. CF034+ não iniciadas.

24/10/2026, mesma branch `codex/cf033-revisao-integrada`; entrada `8de766f` sobre
a base integrada `bfb6c61`. Nenhum trabalho posterior encontrado; README raiz
preexistente modificado foi preservado fora de staging/commits. Implementação e
testes em `b6ad74be1cc834fce3544df93bb06accf9ba0459`; evidências/estado entregues
em commit documental posterior, sem alterar o produto testado.

## Causa e correção

BUY adquiria o guard exclusivo de inventário de todo usuário mesmo quando sua
capacidade era exclusivamente local. INCOME em outra conta precisava do guard
compartilhado e esperava. PostgreSQL confirmou a cadeia; não houve perda financeira.

O delta mantém os row locks, a regra de capacidade e a transação existentes e
acrescenta um gate transacional para estabilizar dependências. Sem registros de
reservas, metas monetárias não reconciliadas ou vínculos legados sem par, BUY e
writers de aumento/move usam inventário compartilhado e capacidade por fonte.
A mesma fonte continua serializada. Havendo dependências, a projeção/certificação
aprovada mantém inventário exclusivo. Criação de vínculo legado e snapshots globais
participam do gate, impedindo que uma pendência apareça entre autorização e commit.

DEC-10 não foi alterada. O caso de fontes sem dependência global volta a progredir
antes da liberação do BUY. Contas diferentes com evidência dependente do inventário
inteiro continuam relacionadas; não se presume independência por ID. Não foi
necessária decisão para abandonar uma garantia. A revalidação deve examinar essa
reconciliação e os limites conservadores da classificação de dependências.

[Reconciliação, matriz de writers, alternativas, ordem e transação](CONTRATO-E-WRITERS.md).
[Reprodução causal, hash e diagnóstico das falhas intermediárias](REPRODUCAO.md).
[Custos, períodos observados e limitações](CUSTOS-E-LIMITES.md).

## Provas exigidas do delta

| Exigência | Prova e resultado |
|---|---|
| A — progresso independente | Probe original intacto: antes1 falha/0 erros, depois1 aprovado. INCOME25 em B comita enquanto BUY A ainda está retido. Novos set/deposit/move exigem conclusão antes de release; CF024 histórico passa |
| B — mesma capacidade | BUY600 em fonte1000 retém row lock; reserva600 em outra conexão espera e é rejeitada depois da releitura. Saldo400/reserva0. DailyReservationConcurrency conserva apenas600 na disputa600+600 |
| C — dependências entre fontes | Legado criado durante autorização espera o gate; autorização iniciada durante criação espera e enxerga a pendência comitada. UNBOUNDED/candidatas/exclusões/união e fonte incerta mantêm20 controles originais. BUY real com certificado CLOSED válido conserva X e bloqueia writer de outra conta |
| D — sobrealocação | Prova histórica intacta: remover a participação de setAllocation permite600+600=1200 sobre1000. Na cópia final a assertion novamente detecta1200; restaurado persiste somente600 |
| E — finanças/evidências | Certificação original5/5 (CLOSE/ASSIGN, histórico, token persistido, falha após escrita, rollback/retry mesma identidade). OnboardingReviewConcurrency8/8, CF02430/30, ownership/exclusão/recibos e consumidores financeiros na regressão229/229 |

Seleções finais: `restored-delta`43/43 e `final-regressions`229/229, com
sobreposição; **não somar como272 casos distintos**. Duas contraprovas finais,
cada uma1 falha de assertion/0 erros/0 skips. `final-restored-control`2/2 confirma
progresso e integridade depois das mutações. `package-verify` aprovado: Maven
verify/Java21/enforcer/JAR Spring Boot, sem clean; testes já executados nas seleções,
não repetidos durante empacotamento (`-DskipTests` explícito). Não é CI completo.

Resultados, comandos/filtros, início/fim, código de saída e restauração estão em
`*/execution.json`, logs e XMLs sanitizados. [Inventário dos resultados](results.json).
As rodadas anteriores38/38,227/229, o erro diagnóstico e contraprovas anteriores
estão preservadas; não são novas aprovações ou casos adicionais. Nenhuma falha foi
apagada, nenhum timeout foi aumentado, nenhum skip/only ou retry foi introduzido.
O teste de custo25 foi ajustado para27 por duas consultas fixas demonstradas,
com sua fonte anterior preservada; as assertions financeiras/progresso originais
permanecem intactas. O script de auditoria só ganhou formatação do relatório na
entrega documental, sem modificar os ensaios ou os resultados persistidos.

## Custos e alcance

Autorização sintética:8 SELECTs com1/1000 fontes sem dependências;17 com1000
fontes e1/50 pendências. SUM é por fonte com índices existentes, sem SELECT por
item. EXISTS pode visitar o inventário do owner; a contagem constante não prova
CPU O(1). Projeção global mantém expansão fonte×pendência, teto200000/32MiB e
custos de ordenação/hash. Não há SLA, garantia universal de deadlock ou certificação
de produção. Com evidências/legado, a serialização conservadora permanece.

Não houve delta HTTP/DTO/frontend, nova migração ou mudança de token. Aceites não
afetados foram reaproveitados, sem nova revisão geral ou testes frontend adicionais.
Permanecem: zoom nativo200% CF010/015, adoção real CF017/P01/P02, alcance específico
DEC-ONB-03 e limitações de carga/homologação/produção. Nenhum banco real, email real,
deploy, push, merge ou exclusão de branches.

## Preservação e encaminhamento

[Manifesto inicial](initial-preservation.json), [final](final-preservation.json),
[fontes finais](final-sources.json) e [JAR local](artifact.json).428 fontes backend
do runtime iguais ao workspace, mais CertificationProbe histórico copiado intacto.
Os7 originais selecionados conferem SHA256, inclusive probe CF033, teste CF024,
probe1200, achado/evidência histórica e README. `tasks/evidencias/CF-033/` não foi
editado. O HEAD desses manifestos é o commit de produto; o commit seguinte só
registra esta entrega e seus estados.

README raiz mantém inicialmente e ao final:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Nenhuma restauração automática foi necessária. Runtimes anteriores permanecem;
todas as execuções novas usaram exclusivamente
`../controle-financeiro-runtimes/CF-033/saneamento-20261024-01`.
Não se fez limpeza de target, reset, clean ou exclusão de runtime. As mutações
ficaram nessa cópia própria e foram restauradas por hash.

Próximo passo: **revalidação independente dirigida de `8de766f..HEAD` desta
entrega local**, produto em `b6ad74b`. Conferir A–E, a classificação das dependências
e o flush antes de aceitar CF033-01. Não reabrir a revisão geral ou iniciar CF034.
Até esse parecer, CF033-01 continua aberto para aceite e o candidato condicionado.
