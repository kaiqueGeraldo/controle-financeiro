# Parecer independente — revalidação CF033-01

24/10/2026. **CF033-01/P2 encerrado por aceite independente no alcance local do
candidato `d059bc92fa8267a8eb4d984373b0ee06bd566889`.** Não foram confirmados
achados residuais P0/P1/P2/P3 neste delta. CF033 permanece concluída como revisão
executada; o candidato recebe aceite deste saneamento, sem aprovação irrestrita
de publicação/uso/produção. Nenhuma correção de produto nesta revisão.

Branch `codex/cf033-revisao-integrada`, base `8de766f`, intervalo examinado
`8de766f..d059bc9`: b6ad74b implementação/testes, d059bc9 provas/estados.
Mesmo produto nos275 hashes de produção do manifesto final histórico e no novo
runtime. Plano prévio, confronto independente e todas as execuções:
[PLANO](PLANO.md), [MATRIZ](MATRIZ.md), [EXECUCOES](EXECUCOES.md).

## Decisão A — DEC-10 e progresso independente

**Atendida.** BUY na fonte A deixa INCOME na B concluir antes da liberação de A,
sem dependência global. Outro owner também comita antes da liberação. O probe
original foi preservado (hash C91456…12D4), reapresentado verde, e ficou vermelho
por assertion ao restaurar BUY→snapshot na cópia. Não houve substituição por
“termina depois”. [Locks/saldos](baseline/progress-locks.json) e
[contraprova](mutant-progress/reports/com.controlefinanceiro.api.domain.onboarding.Cf033ProgressIndependenceProbeTest.txt).
Set/deposit/move também permitem conta independente antes de seus commits.

IDs distintos não bastam para declarar independência: uma evidência do inventário
relaciona fontes. O cenário CLOSED mantém proteção global mesmo sem reserva ativa;
a outra conta espera legitimamente. DEC-10 e tokens não foram editados.

## Decisão B — capacidade e sobrealocação

**Atendida no alcance exercitado.** BUY600 em saldo1000 faz a reserva concorrente600
esperar a fonte e rejeitar após releitura: saldo400, reserva0. Onboarding600 versus
writer600 termina com reserva600, sem1200. Ao retirar o guard do writer real, o
teste falha com SQL persistido1200 versus esperado600, zero erros ambientais.
[Mesma fonte](baseline/same-source.json), [contraprova1200](mutant-capacity/reports/com.controlefinanceiro.api.domain.onboarding.OnboardingReviewConcurrencyTest.txt),
[controle restaurado](restored-consumers/reports/com.controlefinanceiro.api.domain.onboarding.OnboardingReviewConcurrencyTest.txt).
Writers mistos e falha ao gravar recibo também preservam saldo/posição/rollback.

## Decisão C — transição local/global

**Atendida nos interleavings dirigidos, sem snapshot obsoleto observado.**

| Interleaving real | Observação e resultado |
|---|---|
| Classificação false já lida; BUY ainda não adquiriu I; cria-se vínculo legado | Criador espera D:X; BUY comita800; depois cria-se dependência e novo BUY rejeita |
| Criação global já em andamento; BUY inicia | BUY espera D:S; commit da criação mantém1000 e rejeita por origem desconhecida; rollback permite800 |
| Classificação true já lida; dependência removida antes de I | Exclusão de posição vazia comita durante pausa; BUY relê ausência e comita800 |
| Exclusão mantém I:S; BUY classifica true e espera I:X | Commit da exclusão permite800; rollback conserva dependência e saldo1000 |
| BUY local já escreveu; criação tenta entrar | Criador espera até liberar BUY, como no controle entregue reexecutado |
| Certificado global já autoriza BUY; writer de outra fonte inicia | Writer espera I:X; saldos finais800/25, certificado não perde proteção |

Provas novas finais em [gap-creation](restored-consumers/gap-creation.json),
[gap-removal](restored-consumers/gap-removal.json),
[creation-commit](restored-consumers/creation-commit.json),
[creation-rollback](restored-consumers/creation-rollback.json),
[removal-commit](restored-consumers/removal-commit.json) e
[removal-rollback](restored-consumers/removal-rollback.json).
O observador chama a consulta real e pausa seu primeiro resultado; não mocka sua
resposta. Sem gate D, o criador comita um vínculo antes da liberação, registrado
em [commit concorrente](mutant-phantom-proof/unexpected-completion-63.json), e a assertion de proteção
falha. Isso prova a janela de phantom do mutante; não se alega sobrealocação
financeira por esse mutante específico. Todas as fontes foram restauradas por hash.

Resolução CLOSE/ASSIGN não elimina necessariamente a dependência: o registro e
sua evidência permanecem globais. Aplicação/materialização usa D:X/I:X e a
certificação do estado aplicado foi reconferida pelos cinco probes intactos.

## Decisão D — writers e garantias financeiras

**Preservadas no delta examinado.** Guard vem antes das fontes e dentro da
transação efetiva; criadores pertinentes coordenam por D:X. Releituras depois
da espera usam READ COMMITTED atual. Não há upgrade S→X do inventário nos comandos
atuais; as ordens de múltiplas fontes foram mantidas. Pares/metas conservam
@Version e constraints. Nenhum caminho participante de criação de dependência
foi encontrado fora do protocolo na análise delimitada da matriz.

Recibo e fingerprint permanecem no mesmo commit; replay anterior à autorização
não reavalia financeiramente operação já confirmada. Ownership/recover, falha no
recibo, rollback de aplicação e confirmação concorrente têm controles executados;
provas históricas pertinentes reaproveitadas com base/hashes identificados.
COMMIT na query evita flush antecipado do próprio BUY; o flush final permanece.
Não houve estreitamento de token, alteração silenciosa de contrato ou expectativa.

Custos observados:8 SELECTs locais com1/1000 fontes;17 globais com1/50 pendências
e1000 fontes. Sem N+1 observado; EXISTS/SUM/projeção continuam dependentes de volume,
e o inventário global continua serializando por owner. Trade-offs e Big-O na matriz.

## Decisão E — achado, candidato e encaminhamento

**Encerrar CF033-01.** A condição de reconciliar progresso e proteção financeira
foi satisfeita por protocolo condicionado à dependência comprovada, sem alterar
DEC-10 ou o probe histórico. Nenhum residual confirmado a transferir para outra
tarefa. A ressalva de bloqueio indevido do candidato antigo foi saneada no intervalo
examinado; a prova vermelha permanece como histórico. CF032 conserva aceite local.

49 controles positivos iniciais,24 finais restaurados/consumidores, com8 sobrepostos;
três mutações distintas detectadas por assertions pertinentes. As43/229 históricas
têm12 em comum; não foram somadas nem reexecutadas integralmente. Maven verify/JAR
histórico conferido foi com `-DskipTests`, sem execução de CI remoto.

Limites: interleavings finitos, writers atuais participantes, READ COMMITTED,
sem garantia universal de corrida/deadlock, carga/latência de produção, SQL externo,
rollout misto ou composição arbitrária de comandos em outra transação. Sem nova
auditoria frontend/E2E. Zoom nativo200% CF010/015 e adoção real CF017/P01/P02
permanecem pendentes; DEC-ONB-03 continua específica para CF031 local.

CF034 **permanece proposta e não iniciada**. Suas dependências reais são
CF015/026/032/033:026 e032 aceitas nos seus recortes;033 revisão concluída e este
achado encerrado;015 ainda em_revisao por zoom200%. Não há prontidão integral nem
dispensa automática para CF034 por DEC-ONB-03. Nenhum gate ou arquivo CF034 alterado.

Próximo passo concreto: revisão do lote local de revalidação e decisão separada
sobre sua publicação Git; concluir a prova nativa de zoom e parecer CF015 antes
de alegar satisfação integral das dependências CF034. Esta execução não publica,
não faz merge/deploy, não adota banco real nem inicia sucessoras.

Probes e provas registrados no commit local `6409e4a`; parecer/matriz e estados
em commit local separado que contém este documento. Nenhum commit inclui o README
raiz, runtime externo ou produto. SHA256 inicial/final do README:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Conferência de627 arquivos preservados sem divergência e restauração de430 fontes
da cópia documentadas nos manifestos. Staging será esvaziado pelo commit explícito
destes pareceres; o README preexistente conserva sua alteração fora dos commits.
