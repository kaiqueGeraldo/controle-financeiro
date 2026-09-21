# Revalidação independente R03/RV01 — CF-015

21/09/2026. Revisão dirigida do intervalo `f550b9e..e4079a9`.
Base de produto examinada: `e4079a9585ec04477c35e71100dbdb3f56541479`.
Nenhuma implementação de produto ou nova tarefa foi iniciada nesta revisão.

## Conclusões separadas

| Tema | Parecer |
|---|---|
| R03/RV01 | **Encerrado no escopo demonstrado.** Reconciliação substituída rejeita; não autoriza fechar o pagamento como reconciliado. Recuperação aguarda novo lote de leituras e não reenvia o POST. |
| Zoom nativo 200% | **Pendente, sem aprovação.** A limitação descrita em ZOOM.md não foi convertida em evidência de zoom nem em defeito de produto. Não bloqueou a análise de R03. |
| CF-015 | **Permanece em_revisao**, com R03/RV01 encerrado e pendência de verificação nativa de zoom no aceite CF-010/AC-UI-001. Encerramentos e limites dos demais achados da revisão anterior preservados. Não é aprovação integral do marco nem da publicação. |
| Possibilidade de iniciar CF-016 | **Sim, no seu escopo de especificação, pelas dependências reais.** CF-016 depende de CF-001 e CF-004, ambas concluídas e integradas. Não depende formalmente de CF-015, CF-017 ou CF-024. O guia permite antecipar especificação financeira. Esta revisão não inicia CF-016 nem modifica seu estado proposta. |

A recomendação anterior de aguardar o saneamento do P1 não constitui uma nova
dependência permanente: o defeito foi resolvido. O zoom pendente é um gate de
aceite da interface, sem dependência técnica com a especificação de abertura,
fluxo realizado, dívida e reservas. A exceção do [guia](../../README.md) permite
antecipar esse trabalho sem retirar prioridade de defeitos relatados. Isso não
autoriza implementar onboarding nem contornar validações financeiras futuras.

Referências: [CF-016](../../03-integridade/CF-016-regras-financeiras.md),
[CF-001](../../00-fundacao/CF-001-criterios-e-oracles.md),
[CF-004](../../01-datas-integracao/CF-004-contrato-temporal.md),
[saneamento RV01](../saneamento-CF-015-RV01/README.md),
[limitação de zoom](../saneamento-CF-015-RV01/ZOOM.md),
[parecer anterior](../revalidacao-CF-015/README.md).

## Contrato, código e força das regressões

O defeito era absorver a rejeição de `completeReads` quando outra chamada
invalidava a geração. O coordenador próprio do modal continuava atual e recebia
sucesso falso. A correção em `useCards.ts:218–230` mantém erro original do lote
atual e rejeita lote substituído com `ReconciliationCancelledError`. Também
verifica geração depois de todas as leituras terem sucesso: abortar a rede
sozinho não protegeria esse ramo.

O modal mantém `confirmed` e o marcador por usuário/fatura quando a atualização
é cancelada/substituída; distingue isso de POST recusado e resultado desconhecido.
`reconcile()` chama `onSuccess`, que na tela ativa é `refreshAll`, sem chamar
`cardService.payInvoice`. Somente o lote confirmado e ainda atual permite limpar
o marcador e fechar. Sucesso de outro lote não é transferido implicitamente.

Chamadores afetados foram inspecionados: evento `refreshCards`, retry de cartões
e dashboard, nova compra, edição/exclusão e callback de pagamento. O callback
sem Promise de nova compra passou a consumir rejeição de leitura; o de pagamento
continua retornando a Promise ao modal. Não houve alteração de contrato financeiro,
query ou backend de produto. A expectativa alterada em `async-state.test.tsx`
exige agora rejeição tipada da seleção abandonada; assertions de seleção/estado
e abort permanecem, portanto não houve relaxamento do resultado esperado.

| Verificação | Evidência independente |
|---|---|
| Teste original intacto | Blob `bd65cf47cd29f42c81acdc788622f4763d6f509f` idêntico em f550b9e, e4079a9 e working tree. [Manifesto](probe.json). |
| Detecta o defeito original | Cópia isolada com `useCards.ts` de f550b9e: teste falha por `onClose` chamado uma vez. [Log](original-hook.log). |
| Detecta falso sucesso após invalidação | Remover só o guard posterior a `completeReads`: dois testes falham porque sessão/desmontagem resolvem undefined, em vez de rejeitar. [Log](missing-success-guard.log). |
| Candidato e caminhos compartilhados | 41/41 componentes: sobreposição, resposta antiga, lote substituto bem-sucedido/falho, sessão/desmontagem, erro original, consumidores financeiros reais e recuperação. [Log](componentes.log). |
| Recuperação não repete pagamento | Quatro ordens de resposta verificam um POST, nova leitura, marcador retido até sucesso e limpeza posterior. E2E verifica contador de POST, reload e persistência. [Execuções](EXECUCOES.md). |

O [probe](probe.mjs) restaura o arquivo em finally; [hashes](probe.json)
confirmam restauração da cópia e ausência de mudança no produto compartilhado.
Os dez hashes do manifesto do executor conferem. Cinco testes aparecem skipped
no probe do guard por filtro `-t`; nenhum skip foi adicionado aos testes.

Trade-off aceito: uma atualização de fundo bem-sucedida ainda exige recuperação
explícita do modal, custando mais leituras. Mantém o vínculo com seleção/sessão
correta, sem introduzir estado global de sucesso. Agregação O(n) nas leituras do
lote, teste de geração O(1). Não há nova query, índice ou N+1 introduzido neste
diff. Não se promete snapshot transacional entre fontes ou carga certificada.

## Limites e preservação

Não foi reexecutada toda a auditoria: sem suíte Java completa, build, lint global
ou nova matriz de fusos/visual. TypeScript e testes dirigidos foram executados.
O harness integrado existente acopla notas, temporal e capturas responsivas aos
oráculos SQL; foi usado em um só fuso para preservar esses oráculos. Capturas
geradas não constituem nova auditoria visual e não certificam zoom.

CF-017/P01/P02 mantém adoção temporal, proveniência, migração, backup/restore e
rollout pendentes. CF-024 mantém idempotência durável/recibo e concorrência ampla;
o fechamento de R03 não encerra essas tarefas nem certifica publicação.

README raiz preexistente preservado, SHA-256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Staging inicial vazio; única alteração inicial era esse README. Commits examinados:
8ec920c (produto/componentes), cd0bbd0 (E2E/harness), e4079a9 (documentação).
Relatórios anteriores não foram sobrescritos. Não houve push, deploy, banco real
ou início de tarefa posterior. [Comandos e resultados](EXECUCOES.md).
