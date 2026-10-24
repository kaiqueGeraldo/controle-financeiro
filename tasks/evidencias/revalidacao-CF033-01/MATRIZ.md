# Contrato, writers e locks — confronto independente

Intervalo `8de766f..d059bc9`: quatro arquivos de produto; o segundo commit só
documenta. Os275 arquivos de `src/main` executados no saneamento final coincidem
por SHA256 com o candidato atual: [comparação](candidate-source-comparison.json).
Os testes novos desta revisão não alteram produto, contrato, token ou migração.

## Norma e recursos

[DEC-10](../CF-024/CONTRATO.md) exige efeito único/recuperação por intenção e
progresso de contas independentes, observado antes de soltar BUY. A
[SPEC001 §5.1 e §6](../../../docs/sdd/specs/001-onboarding.md) mantém o token do
inventário completo e a compatibilidade de CLOSE/ASSIGN. Fontes de IDs diferentes
podem compartilhar uma evidência; ausência de dependência é condição a provar,
não inferência por ID ou saldo. Não houve edição dessas normas.

D=`financial-dependencies:<owner>`, I=`financial-inventory:<owner>`; S/X são
advisory locks PostgreSQL **transacionais**, mantidos até commit/rollback.
`MANDATORY` rejeita guard fora da transação. Comandos públicos são transacionais.
Ordem efetiva: intenção (quando presente) → D → I → fontes → efeitos/recibo.
Conta precede investimento; transferências ordenam contas. Move usa chave A/UUID
antes de I/UUID, ordenação estável das duas fontes. Não há upgrade I:S→X no
comando atual: o modo é escolhido uma vez antes de qualquer lock da fonte.

| Writer / localização no candidato | Proteção e ordem | Razão da inclusão / risco | Resultado e evidência |
|---|---|---|---|
| InvestmentService.performOperation:130; BUY:135 | replay antes de D:S; predicado; I:S ou X; conta→posição; recibo no mesmo commit | Delta direto; progresso versus capacidade/certificado | Probe original, same-source, global-certificate; regressões CF024 |
| GoalService.addValue:135; setAllocation:235; moveAllocation:267 | D:S; predicado; I:S/X; fonte(s); pares/metas com @Version | Delta direto; reserva concorrente e perda de atualização | progress-set/deposit/move; DailyCapacity20; onboarding600; versões/uniqueness preservadas |
| FinancialInventoryGuard:21–50 | snapshot D:X→I:X; structure D:X→I:S; capacity D:S→consulta→I:S/X | Evitar phantom entre consulta e uso | Seis novos interleavings, provas de criação entregues e mutação phantom |
| SourceReservationService.requireCapacity:33 | Reler predicado após locks; SQL da fonte se false; projeção global se true | Delta direto; capacidade não pode usar leitura anterior à espera | Saldo400/reserva0 no conflito; remoção/rollback; provas de custo |
| InvestmentService.create:82 com goalId | D:X antes de inserir vínculo legado, I:S | Pode fazer ausência→presença de dependência | Criador espera gate até commit do BUY; BUY espera criador e relê commit/rollback |
| InvestmentService.deleteInvestment:320 | I:S; posição com lock; só zero/sem histórico/sem reserva | Remove dependência sem introduzir outra | Exclusão real no intervalo da escolha; commit permite BUY, rollback conserva bloqueio por desconhecimento |
| GoalService.create/delete/deleteHistory/zero/consumo | I:S; fontes nos efeitos monetários; goal/pair @Version | Podem alterar pares, progresso ou token | Create usa reconciled=true; zero/history/consumo preservam par zero; delete de meta com investimento vinculado não comita por FK V1; não cria dangling legado |
| OnboardingApplicationService.prepare:45 / complete:70 | intenção→D:X→I:X antes de sessão, captura, materialização e aplicação | Pode criar registros/resolver legado/substituir pares e certificar inventário | CertificationProbe5 e OnboardingReviewConcurrency8; rollback real e replay/recover |
| OnboardingOpenings + ReservationRegistry | Executados sob snapshot do serviço; gravações JDBC na mesma transação | CLOSE/ASSIGN devem certificar o estado aplicado | Lógica/arquivos de produto sem delta; probes preservados; nenhum token reduzido |
| Transaction/Card/Investment não-BUY/correções | intenção quando aplicável→I:S→fontes existentes | Mudam saldo/valor ou token durante autorização | Sem novo criador de dependência; compatíveis com I:S local e bloqueados por I:X global; controles de writers mistos CF024 |
| UserService.deleteAccount:69 | D:X→I:X antes do grafo/recibos | Remove inventário inteiro | Prova de exclusão em OnboardingReviewConcurrency; rollback/cache/recibos históricos preservados |

## Estabilidade da classificação e mudanças de dependência

O predicado considera qualquer registro de reserva, meta monetária não reconciliada
ou vínculo investimento/meta sem par. Sua consulta ocorre depois de adquirir D:S.
Criadores participantes precisam de D:X; o resultado false não vira true durante
o comando local. Na prova nova, a pausa acontece **depois da consulta real false,
antes do lock I**: o criador já espera em D, fechando precisamente essa janela.

Se um criador global chegou primeiro, o leitor só consulta depois de obter D:S.
No READ COMMITTED atual enxerga o commit; rollback não deixa dependência fictícia.
Excluir posição vazia pode fazer true→false sob I:S. Isso só reduz dependências:
um comando já classificado global conserva I:X conservadoramente, espera a
exclusão e relê no uso. Commit libera capacidade local, rollback conserva a
origem desconhecida. Exclusão entre classificação e I também foi exercitada.

Resolver uma pendência não significa necessariamente passar a local. CLOSE e
ASSIGN mantêm registros/evidências cujo token é global; continuam acionando o
predicado mesmo após resolução. Alterações de pares por OnboardingOpenings
ocorrem sob D:X/I:X. Writers usuais que apenas reduzem pares não apagam o par;
a exclusão de meta vinculada encontra a FK antes de qualquer commit. Não foi
encontrado criador participante que escape de D:X nos caminhos atuais.

## Revalidação, atomicidade e limitações

A consulta do predicado usa FlushMode.COMMIT; isso evita que metadados sujos do
próprio BUY alterem antecipadamente o inventário a ser certificado. Não desliga
o flush final. Inventário e certificado continuam lendo o estado persistido;
escritas, recibo, posição, saldo e cache após commit preservam a transação.
Recibo/fingerprint/recover não têm delta; replay ocorre antes de nova capacidade.
Ownership dos locks de fonte e filtros owner+ID do SQL local permanecem.

Não se observou ciclo nos interleavings exercitados. A ordem dos participantes
diretos não introduz I→D depois de I, nem inversão de fontes. Isso não prova
ausência universal de deadlocks. @Version pode abortar conflito de agregados,
e timeout de lock continua limitado a5s ou orçamento menor preexistente, sem retry
automático. Não certificamos SQL administrativo, convivência de versões antigas,
composição arbitrária de vários comandos em uma transação externa, nem isolamento
REPEATABLE READ/SERIALIZABLE de novos consumidores. Uma query COMMIT não vê
entidades novas ainda não flushadas de uma composição externa; os call sites
atuais examinados não fazem essa composição para criar e consumir dependência.

## Custo conferido

O controle executado mede8 SELECTs com1 ou1000 fontes sem pendências;17 com1000
fontes e1 ou50 UNBOUNDED. Consulta local lê uma fonte e SUM de seus pares; não há
SELECT Java por fonte. EXISTS/anti-join pode percorrer metas/investimentos para
provar ausência: roundtrips fixos não implicam O(1). SUM custa O(A_s), conforme
pares da fonte e índices V5. Projeção global carrega o inventário em lote; trabalho
depende de N linhas, P pendências, incidências E, ordenação e bytes de token.
E pode crescer como fontes×pendências;50×1000=50000 incidências sintéticas.
Não há evidência de N+1 nos caminhos exercitados; nenhum EXPLAIN ou SLA de produção.

As seções críticas duram até commit. Barreiras prolongam os períodos medidos;
tempos locais não estimam cauda sob carga. Certificados/legado mantêm exclusividade
por owner e sua contenção conservadora. O benefício é retomar progresso onde
independência foi provada; o custo é um gate e consulta adicionais, mais complexidade
de protocolo. Refatoração futura útil: catálogo verificável dos criadores de
dependências e seus testes de contrato ao adicionar writer; sem alterar produto aqui.
