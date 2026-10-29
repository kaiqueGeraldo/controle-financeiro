# CF-034 — Consolidar gates de CI reproduzíveis

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-015](../02-frontend/CF-015-revisao-marco-frontend.md), [CF-026](../03-integridade/CF-026-lint-tipagem-frontend.md), [CF-032](../04-onboarding/CF-032-e2e-financeiro.md), [CF-033](../05-release/CF-033-revisao-adversarial.md)
- Origem: T-011; F-012, F-014, F-017

## Revalidação independente CPA-01/R1 — 28/10/2026

Parecer de81b20bca (registro de execução privado): **R1/P2 encerrado
localmente; consolidação apta a publicação controlada e CI remota (parecer A)**.
32 contratos,7 probes originais,6 controles com500 combinações e7 mutações
detectadas/restauradas; cobertura e bloqueio do pacote preservados. Sem implementação
ou ação remota. CF034 integral permanece em_revisao; zoom, matriz/runner/required
remotos, cancelamento e demais gates mantêm seus critérios. Nenhum checkbox marcado.
Os registros seguintes são históricos e não revogam este aceite local posterior.

## Histórico da revalidação CPA-01 de193916a1 — 28/10/2026

Parecer e matriz (registro de execução privado), candidato193916a1:
seleção original encerrada e união101/116 preservada, Linux100/115+Windows1,
15 históricos. TCPWindows real e comunsLinux dirigidos aprovados, sem Actions ou
suíteLinux integral. **R1/P2 aberto**: needs bloqueia pacote após falhaWindows,
mas propaga skipped ao required; falta agregação que reprove explicitamente as
dependências não verdes. Parecer C mantido por R1, sem correção nesta revisão.
CF034 integral em_revisao, demais gates e aceites locais preservados.

## Consolidação pré-adoção — 28/10/2026

Revisão integrada, achado e plano de publicação/CI (registro de execução privado),
entrada56eb80b5/mainfb986456: **parecer C — CPA-01/P2 confirmado**. O seletor atual
inclui AdoptionNativeSocketsTest nos jobs Ubuntu; a condição Windows gera skip,
que requireCounts rejeita. Saneamento mínimo proposto com seleção por ambiente,
prova Windows obrigatória e zero skips aplicáveis, sem implementação nesta revisão.
DEC-CI-04 e aceites locais de produto/startup40s/TCP/RVPLA/audit preservados.
CF034 integral em_revisao: matriz/runner remotos, zoom200%, cancelamento e gates
de adoção/produção continuam próprios. Proposta de PR e cadeia de pacote novo
preparadas, sem push, PR, CI remota, alteração de hospedagem ou deploy.

## Revisão independente de startup HQL — 28/10/2026

Parecer do candidato ed42309f (registro de execução privado):
**startup aceito no recorte local; histórico E inconclusivo e não bloqueante para
preparação seguinte**.40s e testes obrigatórios mantidos; quatro observações novas
e provas anteriores dos demais modos discriminadas, sem transformar falhas antigas
em suíte17 verde. Nova falha bloqueia seu gate e reabre o recorte afetado.
TCP/RVPLA/EPERM e DEC-CI-04 preservados; consolidação/revisão do intervalo acumulado
e plano de validação remota/matriz podem ser preparados, sem executá-los agora.
CF034 integral em_revisao; expanded, zoom200%, limites de cancelamento, configuração,
CF017/adoção/produção continuam próprios. Sem novo startup/produto/pacote/CI remota,
push ou deploy. Notas anteriores são históricas quanto ao bloqueio geral startup.

## Revalidação independente TCP/reuso nativo — 28/10/2026

Parecer A–F e matriz (registro de execução privado),
candidato `b7a2c206`: TCP/reuso aceito no Windows nativo/JAR/PG16/17, originais
3/3 por invocação; contraprova antiga BindException, inspeção falha bloqueante e
controle restaurado aprovado. Mesma porta/bind único e alheios preservados.
Certificação em 10s/5s; limpeza do inspetor em erro até 2s adicionais, sem sucesso
tardio. RVPLA-01/03/04/05 e EPERM preservados por caminhos intocados. HQL
separado/inconclusivo, 40s mantidos; próximo experimento somente delimitado.
CF034 integral em_revisao, expanded/zoom 200%, cancelamento/configuração e gates
CF017/adoção/produção pendentes. JAR anterior intacto; nenhuma implementação,
CI remota, publicação ou deploy nesta revisão.

## Investigação TCP/reuso nativo — 28/10/2026

Provas, contraprovas e estados (registro de execução privado),
base3b245d9d/correçãob8b645d0: pós-condição TCP do close Windows saneada localmente,
originais PG16/17 verdes e contraprovas detectadas/restauradas. Aguardando revisão
independente, sem autoencerramento. Runner/RVPLA-01/03/04/05 e EPERM preservados;
HQL inconclusivo/40s mantidos e falhas pré-bind novas preservadas. CF034 integral
em_revisao; expanded,zoom200%,cancelamento/configuração e gates reais continuam
pendentes. JAR anterior intacto, sem CI remota, publicação, adoção ou deploy.

## Revalidação independente residual RVPLA-05 — 28/10/2026

Parecer do candidato d8bd180a (registro de execução privado):
RVPLA-05/P2 encerrado no original Windows/mesma sessão,3/3 no20s em15,084/12,635/
12,287s, margem mínima4,916s. Redução15→9 consultas/5→3 comandos/21→13 lançamentos
diretos sustentada, mantendo confirmação externa e aceites RVPLA-03/04/EPERM.
Negativos, regressões e audit PG17 limitado passaram no alcance; TCP/HQL continuam
inconclusivos e40s intactos. CF034 integral em_revisao; expanded/zoom200%,cancelamento/
configuração e gates CF017/adoção/produção não liberados. JAR anterior preservado,
sem pacote novo, implementação, CI remota ou publicação nesta revisão.

## Saneamento residual RVPLA-05 — 28/10/2026

Evidências e limites (registro de execução privado),
baseacaa6ed9, implementaçãoe88ee50a: custo residual de consultas/lançamentos
reduzido,3/3 no original20s (10,213/11,560/12,226s), margem mínima7,774s.
Contenção, identidade e ausência externa dos Jobs mantidas; nenhum cache/broker
permanente ou mudança do canal. Saneado localmente, **em revisão independente**.
RVPLA-03/04 e EPERM mantêm seus aceites; complemento alheio, controles dirigidos
e audit PG17 limitado passaram. TCP/HQL inconclusivos e40s intactos. CF034
integral em_revisao, expanded/zoom200%, configuração, CF017/adoção/produção
continuam próprios. JAR anterior preservado, sem pacote novo ou CI remota.

## Revalidação independente RVPLA-05 — 27/10/2026

Parecer do candidato019a6ce3 (registro de execução privado):
RVPLA-05/P2 aberto,0/3 no probe original20s; saída rápida não aprovou duração
integral. RVPLA-03/04 específicos preservados; fixture histórica expirava30s,
complemento controlado sensível e grupo completo original não aprovado. EPERM
causal e audit PG17 limitado aceitos, sem atribuição integral do handle histórico.
TCP/reuso/HQL inconclusivos e40s mantidos. Aceites DEC-CI-04/JAR anterior preservados;
CF034 integral em_revisao, expanded/zoom200%, cancelamento/configuração e gates
CF017/adoção/produção não liberados. Sem implementação, CI remota ou publicação.

## Saneamento local RVPLA-05 e audit — 27/10/2026

Delta local e limites (registro de execução privado), base9c27881,
implementação762a085/d254822: três probes originais20s passaram em16,572/17,978/
16,990s; encerramento gerenciado dos guardiões era o custo dominante demonstrado.
Contenção/quiescência mantidas. Corrida EPERM de mailbox demonstrada/corrigida;
audit PG17 limitado passou, autoria do handle histórico permanece desconhecida.
Revisão independente dirigida pendente, sem autoaprovação. Falha da fixture
alheia no grupo completo RVPLA-03 preservada e não promovida a sucesso.
Aceites específicos RVPLA-03/04 e DEC-CI-04 mantidos no alcance próprio; TCP/HQL
inconclusivos,40s intactos. CF034 integral em_revisao; expanded, zoom200%,
configuração e adoção/produção continuam pendentes. JAR anterior sem novo build.

## Revalidação independente RVPLA-04 — 27/10/2026

Parecer do candidato badecb55 (registro de execução privado):
RVPLA-04 encerrado no handoff Windows/mesma sessão; contenção específica RVPLA-03
preservada. Gate legado20s falhou por latência (RVPLA-05/P2), mantendo o runner
sem aceite funcional integral. Preflight PG17 e resume passaram; audit falhou
por EPERM, causa inconclusiva, sem repetição. TCP/reuso/HQL continuam separados,
inconclusivos, 40s mantidos. Aceites DEC-CI-04 e pacote/JAR anterior preservados;
CF034 integral em_revisao, expanded/zoom200%, cancelamento/configuração e gates
CF017/adoção/produção não liberados. Sem implementação, CI remota ou publicação.

## Revalidação independente RVPLA-03 — 27/10/2026

Parecer do candidato0b4c6598 (registro de execução privado):
RVPLA-03 encerrado no abandono Windows/sessão atual; RVPLA-04 novo revela falsa
quiescência durante inspeção de handoff. Reuso nativo e startup HQL inconclusivos,
40s mantidos. Pacote/JAR anterior e aceites DEC-CI-04 preservados; CF034 integral
em_revisao, expanded/zoom/cancelamento/configuração/adoção reais não liberados.
Sem CI remota, correção de implementação, publicação, deploy ou sucessora.

## Revalidação independente do saneamento — 27/10/2026

Parecer do candidatoaa068d1 (registro de execução privado):
RVPLA-01 encerrado; correção da corrida de porta aceita no recorte. RVPLA-03/P2
confirma wrapper tardio após interrupção; startup segue inconclusivo/não aprovado.
Mesmo JAR p05/inputs24844b5, sem build atribuído ao HEAD. Aceite DEC-CI-04 e
provas anteriores mantidos, CF034 integral em_revisao; expanded, zoom200%,
cancelamento e gates CF017/configuração/adoção/produção preservados. Nenhuma
CI remota, publicação, correção de produto/harness ou sucessora executada.

## Revisão independente da preparação local — 26/10/2026

Parecer, matriz e achados (registro de execução privado),
candidato6f70a87: bytes/831inputs/22recursos e imagem do JAR p05 conferidos,
sem atribuir seu build ao HEAD documental. Controles locais aprovados no recorte;
controle original de startup17/3 falhas mantém o gate aberto. RVPLA-01 confirma
que resume de contraprovas pode pular timeout sem efeito; não corrigido aqui.

Aceite DEC-CI-04 e resultados remotos anteriores preservados; nenhuma CI nova,
publicação, deploy ou configuração alterada. CF034 integral em_revisao;
expanded, zoom, cancelamento e gates CF017/035/036 não foram dispensados.

## Preparação local de adoção/pacote — 26/10/2026

Lote autorizado a partir46b85ee, em_revisao na branch
`codex/preparacao-local-adocao`: resultados e limites (registro de execução privado).
Acrescenta controles operacionais e ensaios locais em pacote próprio. Não atribui
seus resultados ao JAR c3860ec0 da main, não executa Actions/expanded/deploy e não
encerra critério integral. Aceite DEC-CI-04 e evidências remotas anteriores mantidos.
Entrega em_revisao, sujeita a revisão independente e gates preservados. Os17
contratos da imagem passaram numa rodada; estouros de40s em processos Windows e
Linux posteriores mantêm o gate de startup aberto, sem aumento de timeout/retry.

## Revisão independente da validação remota — 26/10/2026

Parecer, matriz por critério e plano de adoção (registro de execução privado),
base `fb986456a37a48afcafef204f165d15354294d26`. Main/PR integrada conferidas
pela API; ddd5a41 é pai do merge e tem árvore igual. Run main 40337346702/1:
required success, expanded skipped; lint/tipos/build, 13 contratos, 18 execuções
temporais, 620 componentes, 891 backend/95 classes, wrapper 1 e seis jornadas
conferidos sem somar sobreposições. Cinco ZIPs confrontados com digests atuais;
JAR c3860ec0… e 820 inputs verificados contra Git, sem nova suíte/recompilação.

Aceite local DEC-CI-04 preservado; critérios integrais mantidos abertos. Expanded
não certifica sete casos CF032, incluindo três combinações temporais, nem os 15
harnesses diferidos. Cancelamento Linux comprova cleanup explícito de recursos
sintéticos próprios antes do descarte da VM; não certifica Ctrl+C ou controle
alheio Linux. Imagem de release e dependência integral CF015/zoom200% pendentes.

API/PG offline, autodeploy Railway desativado e produção Vercel anterior preservada.
DDL externo update, Flyway no startup, jobs, saúde e previews exigem preparo;
ferramenta CF017 major16 incompatível com imagem alvo17. CF017/P01/P02 permanecem
em_revisao. Nenhum checkbox integral alterado, sucessora iniciada ou mutação remota.
Branch de revisão derivada da main integrada; somente documentos/provas locais.

## Histórico — publicação controlada e validação remota — 26/10/2026

Etapa operacional autorizada, entrada4d20fb0; revisão Railway/Vercel incluída por
pedido expresso. Matriz e evidências (registro de execução privado).
[PR #1](https://github.com/kaiqueGeraldo/controle-financeiro/pull/1) criada após
aprovação explícita. Candidato c926aaa, checkout e2ce3ad, run40327234898 aprovado:
13 contratos,18 temporais em3 fusos,620 componentes,891 casos backend/PostgreSQL
em95 classes, wrapper Java e6 jornadas E2E; zero falhas/erros/skips no smoke.
Expanded pulado por condição, não executado nem aprovado.

JAR novo baixado: SHA256
4ae18379f6d21c709a76c6e7ac0c1c1ff81201574037ddab1352464c04c35554;
cadeia de820 inputs e manifesto (registro de execução privado).
Contraprovas de falha/upload/coleta e cancelamento/cleanup Linux preservadas;
limite de observação anterior ao descarte da VM. Falhas reais e correções dirigidas
de paths, diagnóstico, fuso e schema do pool documentadas, sem relaxar assertions,
timeouts, retries ou seleção anterior. Nenhuma regra de produto alterada.

Main272001f sem integração. Railway API/PG offline, main com autodeploy e Wait for
CI off; Vercel produção Ready272001f, sem Deployment Checks. URL do backend,
alias do frontend e JDBC privado conferidos; DDL_AUTO=update diverge do contrato
validate e deve ser revisto antes de release. Nenhuma configuração de produção
ou banco real alterado. Separação dos gatilhos preparada, não aplicada (registro de execução privado).

Aceite local DEC-CI-04/RCI034-01/R1 preservado; estado integral **em_revisao**.
Nenhum checkbox integral, garantia de produção, zoom/Ctrl+C nativo, adoção
CF017/P01/P02 ou sucessora liberados. Commits documentais posteriores exigem seus
checks aplicáveis; não recebem automaticamente a proveniência deste JAR.

## Liberação exclusivamente local — 24/10/2026

Revalidação independente de25/10, candidato `ea00a06`, intervalo `418a648..ea00a06`:
parecer, matriz, provas e limites (registro de execução privado).
**RCI034-01/R1 encerrado; recorte local aprovado sob DEC-CI-04.** JSON escapado
com prefixo é sanitizado; aspa incompleta bloqueia ambos os coletores sem fallback.
Provas originais, contraprova causal/restauração, fronteiras de limites e arquivos
publicáveis efetivos sustentam o aceite. RCI034-L01 Windows/processos preservado,
assim como gates ordinários, isolamento/E2E smoke e proveniência históricos não
afetados. Não se atribuem testes financeiros ou compilação novos ao JAR a5ad7a6.
Estado integral **em_revisao**: Ctrl+C nativo, Actions/Linux, containers após aborto,
CI remota/matriz ampliada/artifacts, zoom nativo200%/CF010/015, adoção CF017/P01/P02
e limites de produção continuam pendentes. Nenhum checkbox integral concluído.
Próximo passo é preparar publicação revisada/execução remota controlada em etapa
separada, sujeita à autorização específica. Sem publicação, deploy, banco real,
pacote novo ou sucessoras nesta revisão; implementação e históricos preservados.

Saneamento residual RCI034-01/R1, entrada418a648:
correção delimitada e provas (registro de execução privado).
JSON escapado com prefixo tratado; aspa incompleta de atribuição bloqueia coleta.
Estado em_revisao; R1 saneado localmente aguardando revalidação, sem autoaceite.
RCI034-L01 conserva aceite Windows/processos; Job Object/UUID não foram alterados
nem reabertos. Limites Ctrl+C/Actions/Linux/containers e demais gates preservados.
Nenhum pacote novo; JAR histórico continua a5ad7a6. Sem publicação/CI remota/deploy,
banco real, aceite integral ou liberação de sucessoras.

Revalidação independente dirigida de25/10, candidato `91ee02d`:
parecer, matriz e provas (registro de execução privado).
**Sem aceite local completo; estado em_revisao preservado.** RCI034-01 parcialmente
saneado, mas residual RCI034-01/R1/P2 publica senha em mensagem JSON escapada com
prefixo e sufixo de atribuição textual com aspa incompleta. RCI034-L01 sustentado
no mecanismo Windows/processos: UUID e morte abrupta encerram filho/descendente;
próximo gate bloqueado, diagnóstico preservado e controle sintético alheio intacto.
Não encerrar irrestritamente recursos externos: Ctrl+C nativo, Actions/Linux e
containers após cancelamento continuam sem prova. Gates ordinários e aceites
anteriores não afetados preservados; oito testes e contraprovas dirigidas,
sem novas suítes financeiras ou pacote. JAR histórico continua a5ad7a6.
Próximo passo é saneamento separado de RCI034-01/R1 e revalidação da publicação;
nenhuma implementação corrigida, publicação/CI remota/deploy/banco real executados.
Nenhum checkbox integral, dependência ou gate das sucessoras foi liberado.

Saneamento dirigido posterior,25/10, entrada8d58207:
entrega e provas (registro de execução privado).
RCI034-01 e RCI034-L01 corrigidos/comprovados no alcance descrito pelo executor,
aguardando revalidação independente, **sem autoencerramento/aceite local completo**.
Sanitização estruturada/textual compartilhada, coleta obrigatória e cancelamento
Windows com UUID/Job Object. Brutos/históricos preservados; nenhum pacote novo.
Prova sintética de processo/porta não certifica cancelamento do daemon Docker,
Ctrl+C nativo ou Actions/Linux. Critérios e DEC-CI-04 preservados, estado em_revisao;
nenhum checkbox integral ou gate de publicação/zoom/adoção foi liberado.

Revisão independente de25/10, candidato64603a3:
parecer A–G e matriz (registro de execução privado).
**Recorte local ainda não aceito; estado em_revisao mantido.** RCI034-01/P2:
coleta permite senha JSON, Bearer opaco e cookie em log publicável. RCI034-L01:
cancelamento local precisa de contrato/prova delimitados; aborto do pai Windows
não comprova cleanup da árvore nem permite inferir comportamento Actions.
Gates/falhas ordinárias, isolamento/E2E smoke e cadeia independente do JAR da11
estão sustentados nos limites do parecer; fonte a5ad7a6 e810 inputs equivalentes
a64603a3 relevante, sem atribuir nova compilação ao HEAD documental.
Nenhum checkbox integral aprovado. Sanear/revalidar esses pontos antes de decidir
publicação e execução remota controlada em etapa separada; sem sucessoras.

[DEC-CI-04](../../docs/sdd/decisoes/004-liberacao-local-CF-034.md) aprova expressamente
PROP-CF034-01/A: infraestrutura e provas locais de CI, sem aceite integral ou uso.
Entrega local em_revisao nesse recorte; CF015 continua em_revisao por zoom nativo200%.
Scripts compartilhados `.github/scripts/` e adaptadores/testes do harness são
extensão delimitada para evitar comandos divergentes entre local e CI.
Implementação local deve terminar em_revisao e passar por revisão independente.
Resultados de runner remoto e pacote publicado não são inferidos de execução local.
CF010/015, CF017/P01/P02 e sucessoras conservam os gates; DEC-ONB-03 não foi ampliada.

## Análise anterior da dependência — 24/10/2026 (sem execução)

Matriz e PROP-CF034-01 pendente (registro de execução privado),
base `e1a01b6` integrada/publicada. CF026/032/033 conservam aceites locais; CF015
continua em_revisao por zoom nativo200%, sem liberação específica desta aresta.
Limitação atual de controle da URL impede captura/input de zoom; não prova
defeito. Estado proposta, dependência e checkboxes preservados. Nenhuma execução
ou implementação CF034 nesta análise. O recorte futuro de CI local aguarda
decisão explícita, sem autoaplicar DEC-ONB-03 ou liberar uso/deploy/banco real.

A inspeção atualiza a premissa histórica abaixo: workflow backend já chama
`verify` sem skipTests; Dockerfile ainda empacota com skipTests. Configuração
lida não comprova execução de suíte/CI ou vínculo entre pacote e revisão testada.

## Problema e resultado esperado

CI atual compila backend com testes ignorados. As suítes precisam impedir regressões no código integrado, com artefatos úteis e execução isolada.

## Escopo e referências

- `.github/workflows/`
- `controle-financeiro-backend/Dockerfile`
- `controle-financeiro-backend/pom.xml`
- `controle-financeiro-frontend/package.json`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Adicionar/ajustar gates progressivos de lint/typecheck/test/build, PostgreSQL e E2E com cache de dependências, nunca de resultado inválido.
2. Remover skipTests do gate backend quando suíte isolada estiver pronta; documentar relação entre imagem e revisão já validada.
3. Configurar triggers para mudanças compartilhadas de testes/config; publicar logs/traces sanitizados e separar smoke crítico de matriz ampliada.

## Aceite e testes adversariais

- [ ] Regressão real numa regra/data faz pipeline falhar e bloqueia avanço; validar configuração numa execução real quando acesso disponível.
- [ ] Checkout limpo roda sem segredos de produção e finaliza processos/banco; teste flaky não fica verde só por retry.
- [ ] Build e pacote publicados correspondem à revisão testada; resultado remoto não executado é declarado pendente.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Remover testes para acelerar pipeline, desabilitar lint ou mudar configurações externas sem identificar projeto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Entrega local executada em 24/10/2026, candidato a5ad7a6, sob DEC-CI-04.
Relatório e matriz (registro de execução privado): lint/tipagem, 18 testes
temporais, 620 componentes, 889 testes backend/PostgreSQL, wrapper E2E e seis
jornadas reais aprovados, sem skips/retry. Verify e JAR vinculados a 810 inputs;
contraprovas de lint, data e adulteração de pacote falham e restauram por SHA.
Falhas intermediárias preservadas. README/runtimes históricos mantidos.

Implementação somente local, aguardando revisão independente. Runner remoto,
matriz ampliada, upload/pacote remoto e imagem Dockerfile histórica ainda pendentes;
nenhum checkbox integral autoaprovado. Zoom CF010/015, adoção CF017/P01/P02 e
sucessoras mantêm condições. Usar o [template](../templates/EVIDENCIA.md) nas
revisões seguintes; evidências anteriores não são testes do pacote desta rodada.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

