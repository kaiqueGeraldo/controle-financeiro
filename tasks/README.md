# Plano de execução do monorepo

Prioridade: corrigir divergências de horário, calendário e apresentação no frontend; depois consolidar integridade financeira, onboarding e publicação. Criado em 07/09/2026 a partir do [SDD](../docs/sdd/README.md).

Estas são tarefas versionadas no repositório, abrangendo frontend e backend. Cada arquivo pode orientar uma tarefa no Codex. Criar os arquivos não inicia agentes, não muda o modelo desta conversa nem agenda execuções.

## Situação vigente — revisão independente de prontidão, 26/10/2026

[Parecer e plano CF-034/CF-017](evidencias/revisao-prontidao-CF034-CF017/README.md),
base integrada `fb986456a37a48afcafef204f165d15354294d26`. PR #1 integrada;
CI main 40337346702/1 confirmada: required aprovado, expanded pulado. Contagens
e JAR da main conferidos independentemente contra artifacts/API/Git: 820 inputs,
SHA-256 c3860ec0…, sem nova execução de suítes ou CI. Aceite local preservado;
CF-034 integral continua em_revisao por critérios/dependências ainda não demonstrados.

Railway API/PG offline e autodeploy desativado confirmados na UI; Vercel mantém
produção READY em 272001f e configuração main=false. Hibernate externo update,
Flyway no bootstrap, jobs ativos por configuração, healthcheck ausente e previews
compartilhando destino exigem preparo antes de ligar a API. A ferramenta de
preflight/restore aceita PG16, enquanto a imagem do alvo é PG17: preparar e revisar
suporte17 em descartável antes de usar o procedimento no ambiente real.

CF-017/P01/P02 continuam em_revisao, sem acesso ao banco ou prova real de backup/
restore. Plano condicionado A–D preparado; CF-035/036 permanecem propostas,
não iniciadas. Zoom nativo 200% permanece explícito, sem nova tentativa ou dispensa.
Somente documentação/provas e commits locais desta revisão; README raiz preservado.

## Situação anterior — CI remoto obrigatório aprovado, 26/10/2026

Etapa operacional autorizada sobre4d20fb0, com revisão Railway/Vercel.
[PR #1](https://github.com/kaiqueGeraldo/controle-financeiro/pull/1) aberta,
candidato c926aaa/checkout e2ce3ad, run40327234898 aprovado:13 contratos,
18 temporais,620 componentes,891 testes backend/PostgreSQL, wrapper Java e seis
jornadas E2E, sem falhas/skips. Expanded pulado por condição, sem aprovação.
[Pacote novo, hashes, falhas e limites](evidencias/CF-034-remota/RESULTADOS.md).
JAR baixado e vinculado a820 inputs do merge testado; não é o JAR histórico a5ad7a6.

Aceite local preservado; CF034 integral em_revisao. Main272001f sem integração;
Railway API/PG offline, Vercel produção Ready em272001f. URLs conferidas e JDBC
privado; variável DDL_AUTO=update diverge do contrato validate e precisa de revisão
antes de release. Nenhuma configuração ou banco real alterado, deploy ou sucessora.
[Separação preparada dos autodeploys de main](evidencias/CF-034-remota/SEPARACAO-MAIN-PROPOSTA.md)
aguarda decisão explícita antes da integração. A branch CF034 permanece sem deploy.

## Situação anterior — aceite independente local CF034, 25/10/2026

[Revalidação independente de RCI034-01/R1](evidencias/revalidacao-RCI034-01-R1/README.md),
candidato `ea00a06`, intervalo `418a648..ea00a06`: **R1 encerrado e recorte local
da CF034 aprovado sob DEC-CI-04**. JSON escapado perde a senha; aspa incompleta
bloqueia a coleta. Oito casos originais, coletores reais, 27 casos complementares,
limites e contraprova causal com restauração sustentam o aceite; 12 testes Node
passaram. Aceite Windows/processos de RCI034-L01 e demais aceites históricos
não afetados preservados, sem repetir cancelamento integral ou suítes financeiras.
CF034 permanece **em_revisao integral**: Ctrl+C nativo, Actions/Linux, containers
após aborto, CI/matriz ampliada/artifacts remotos, zoom nativo 200%/CF010/015,
adoção CF017/P01/P02 e gates das sucessoras continuam pendentes. JAR histórico
continua a5ad7a6; não houve pacote novo, publicação, deploy ou banco real.
Próximo passo: preparar etapa separada de publicação revisada e execução remota
controlada, sujeita à autorização específica; nenhuma sucessora iniciada.
README raiz e runtimes preservados; revisão registrada somente em commits locais.

## Situação anterior — saneamento residual CF034, 25/10/2026

[RCI034-01/R1 saneado localmente](evidencias/saneamento-RCI034-01-R1/README.md),
entrada418a648: JSON escapado com prefixo é visitado; atribuição com aspa
incompleta bloqueia coleta. Probes originais antes/depois,12 controles Node,
coletores reais, mutação/restauração e regressões ordinárias registrados.
CF034 em_revisao; residual aguarda revalidação independente, sem autoencerramento.
Aceite RCI034-L01 Windows/processos preservado, sem mudança de Job Object/UUID.
Ctrl+C, Actions/Linux, containers, remoto/matriz ampliada, zoom e adoção continuam
pendentes. JAR permanece a5ad7a6; sem pacote novo, publicação ou sucessoras.

## Situação anterior — revalidação dirigida CF034, 25/10/2026

[Parecer independente do saneamento](evidencias/revalidacao-CF-034-saneamento/README.md),
candidato `91ee02d`, intervalo `8d58207..91ee02d`: **recorte local ainda não aceito**.
RCI034-01 protege os formatos originais, mas permanece aberto por RCI034-01/R1/P2:
senha em JSON escapado de mensagem com prefixo e atribuição textual com aspa
incompleta ainda chegam ao material publicável. Nenhuma correção nesta revisão.
RCI034-L01 tem aceite delimitado a processos Windows: UUID e morte abrupta
encerram filho/descendente, preservam processo sintético alheio e bloqueiam avanço.
Ctrl+C nativo, Actions/Linux e descarte de containers após cancelamento não
recebem certificação. Oito testes e contraprovas dirigidas sustentam regressões;
aceites anteriores não afetados preservados, sem repetir suítes financeiras.
JAR continua atribuído a a5ad7a6, sem pacote novo nem atribuição aos scripts atuais.
CF034 permanece em_revisao; próximo passo é saneamento separado do residual e
revalidação das fronteiras de publicação. Remoto/matriz ampliada, zoom nativo200%,
CF010/015 em_revisao, adoção CF017/P01/P02 e gates das sucessoras permanecem.
README raiz e runtimes históricos preservados; commits somente locais.

## Situação anterior — revisão e saneamento CF034, 25/10/2026

Saneamento posterior exclusivamente local de RCI034-01/RCI034-L01, entrada8d58207:
[correções, provas e limites](evidencias/saneamento-CF-034/README.md).
Política compartilhada de sanitização/coleta bloqueada em falha e cancelamento
Windows por UUID/Job Object, com contraprovas/restauração e regressões dirigidas.
CF034 continua em_revisao; aguardando revalidação independente, sem autoencerramento
dos achados. Cadeia histórica do JAR a5ad7a6 preservada, sem pacote novo. Actions/
Linux, matriz ampliada, artifacts/imagem remotos, zoom e adoção mantêm pendências.
Sem publicação, merge, CI remota, banco ou deploy; DEC-CI-04 inalterada.

CF034 permanece **em_revisao**, sem aceite local completo da DEC-CI-04.
[Parecer independente](evidencias/revisao-CF-034/README.md), candidato64603a3:
RCI034-01/P2 confirma sanitização insuficiente de JSON/Bearer/cookie; RCI034-L01
delimita a lacuna de encerramento por cancelamento local, sem inferir falha remota.
Comandos/gates ordinários, seis jornadas reais e rastreabilidade do JAR da11
preservam sustentação:810 inputs, fonte a5ad7a6, inputs relevantes equivalentes
a64603a3 documental. Não é pacote compilado do HEAD nem reprodução binária.
Sem correções de implementação; probes e parecer em commits exclusivamente locais.
Próximo passo: saneamento separado da coleta e contrato/prova de cancelamento,
seguido de revalidação dirigida; publicação/CI remota exigem etapa autorizada própria.
CF010/015 em_revisao por zoom200%, adoção CF017/P01/P02, desempenho em produção,
DEC-ONB-03 e sucessoras conservam seus limites. README raiz e runtimes preservados.

## Situação anterior — CF034 em revisão local, 24/10/2026

[DEC-CI-04](../docs/sdd/decisoes/004-liberacao-local-CF-034.md) aprova PROP-CF034-01/A.
CF034 em_revisao exclusivamente no recorte local de CI, candidato a5ad7a6.
[Entrega, matriz e contraprovas](evidencias/CF-034/README.md): lint/tipagem,
18 temporais, 620 componentes, 889 backend/PostgreSQL e seis jornadas reais
aprovados; JAR local rastreável e falhas preservadas. CI remota, matriz ampliada,
imagem/pacote publicado e revisão independente pendentes; aceite integral não dado.
Dependência de aceite integral CF015 preservada. CF010/015 em_revisao por zoom
nativo200% não validado; sem nova investigação, dispensa ou defeito presumido.
Publicação autorizada apenas da análise `0f787eb`/`79ce089` e decisão documental;
implementação da CF034 permanece local. Adoção real CF017/P01/P02, uso e sucessoras
mantêm gates; sem deploy manual, banco real ou notificações reais.

## Situação anterior — lote CF033 integrado; análise de zoom/gate, 24/10/2026

Lote aprovado até `e1a01b6` publicado na branch CF033 e integrado por fast-forward
na main remota, hash `e1a01b62e0766c92120c3cefc2bc4b4fc316ce58`.
Nova branch local `codex/cf015-zoom-gate-cf034`, da mesma base; novos commits
somente locais. [Provas, matriz e proposta pendente](evidencias/CF015-zoom-gate-CF034/README.md).

Zoom nativo 200% continua sem evidência: vínculo inicial Chrome aceito, mas a
observação foi interrompida por impossibilidade de confirmar URL com segurança,
antes de captura/input. Sem aprovação ou defeito de zoom; CF010/015 em_revisao.
CF034 permanece proposta/não iniciada, com a dependência CF015 preservada.
PROP-CF034-01 propõe liberação futura restrita de infraestrutura/testes locais
de CI, ainda sem decisão do usuário; DEC-ONB-03 não é autorização geral.
README raiz, runtimes, adoção real CF017/P01/P02 e limites de produção preservados;
sem produto/deploy manual/banco real. `verify -DskipTests` histórico é pacote,
não nova suíte ou êxito de CI. Próximo passo: decisão sobre o recorte proposto;
zoom só retoma com capacidade de URL/captura/input nativos comprovada.

## Situação anterior — CF033-01 encerrado por revalidação independente, 24/10/2026

CF033-01/P2 encerrado no candidato d059bc9, intervalo8de766f..d059bc9. DEC-10 e
capacidade preservadas: progresso antes de liberar BUY, transições local/global
com criação/remoção/commit/rollback, proteção de certificados e reservas600/1000.
49 controles e24 finais, sobreposição8; três mutações distintas detectadas por
assertions e restauração SHA256. [Parecer independente A–E](evidencias/revalidacao-CF033-01/README.md).

CF033 permanece concluída como revisão; candidato aceito neste saneamento local,
sem aprovação irrestrita de publicação/uso/produção. Sem novo achado confirmado.
Produto, README raiz e runtimes históricos preservados; commits exclusivamente
locais. Zoom200%, adoção real CF017/P01/P02, produção e alcance da DEC-ONB-03
continuam. CF034 permanece proposta/não iniciada; suas dependências CF026/032/033
estão sustentadas nos respectivos recortes, CF015 ainda em_revisao por zoom.
Próximo passo: decisão separada sobre publicação do lote local e prova de zoom
para o parecer CF015; nenhuma sucessora autorizada por esta revisão.

## Situação anterior — CF033-01 saneado localmente, aguardando revalidação, 24/10/2026

CF033 conserva conclusão como revisão independente executada; CF033-01/P2 está
saneado localmente, **sem autoencerramento ou aceite irrestrito do candidato**.
Mesma branch `codex/cf033-revisao-integrada`, entrada8de766f; gate transacional de
dependências preserva progresso sem legado e proteção global quando o inventário
certificado relaciona as fontes. DEC-10 não foi alterada. [Entrega e limites](evidencias/saneamento-CF033-01/README.md).

Probe original vermelho→verde sem modificar assertion/timeout;43 controles do
delta e229 regressões aprovados, com sobreposição. Duas contraprovas finais
detectaram bloqueio antigo e reservas1200/1000; restauração por hash/controles2/2.
Falhas intermediárias preservadas, Maven verify/JAR local aprovado sem clean.
README raiz/runtimes e provas históricas preservados; somente commits locais.
Zoom200%, adoção CF017/P01/P02, DEC-ONB-03 e produção conservam limites; CF034+
não iniciadas. Próximo passo: revalidação independente dirigida do delta.

## Situação anterior — CF033 revisada com ressalva de concorrência, 24/10/2026

CF032 publicada/integrada por fast-forward; main remota conferida em
`bfb6c61d6b68e1da112eabf420634bb5b5e9127b`. CF033 executada na branch própria
`codex/cf033-revisao-integrada`, **concluida como revisão independente com ressalva**,
sem aprovação irrestrita do candidato. CF033-01/P2 aberto: guard exclusivo de BUY
bloqueia writer em outra conta do mesmo owner; contrato histórico DEC-10 exigia
progresso independente. PIDs/advisory locks e progresso de outro owner confirmados,
sem perda financeira demonstrada. CF032 conserva seu aceite local e limites.
[Parecer, matriz e próximo saneamento delimitado](evidencias/CF-033/README.md).

7 provas backend novas aprovadas,3 jornadas reais, quatro contraprovas causais
detectadas/restauradas. Seleção74:73 aprovações/1 timeout investigado; probe causal
1 assertion falha/zero erros, preservado vermelho. Build/lint novo/tipagem aprovados;
falhas de fixtures/observador preservadas, sem somar reruns. Produto/README/runtimes
preservados; commits CF033 locais. Zoom nativo200%, adoção real CF017/P01/P02,
limitações de produção e alcance DEC-ONB-03 continuam. CF034+ não iniciadas; sem
deploy ou banco real. Próximo passo: decisão/saneamento restrito de CF033-01.

## Situação anterior — CF032 aceita independentemente no escopo local, 23/10/2026

CF032 **concluida no escopo local** sobre864a3c7. CF032-01/02/03/04 encerrados;
critérios2/3 atendidos,1/4 preservados. CLOSE/ASSIGN certificam inventário gravado,
mantêm histórico e atomicidade; concorrência e replay dirigidos aprovados.
[Parecer independente, provas e limites](evidencias/revalidacao-CF-032/README.md).

95 controles backend,5 probes novos,54 componentes,14 jornadas pretendidas eRV6
aprovados; falhas intermediárias e R2 histórico preservados, sem somar sobreposições.
Contraprova nova do produtor detectada/restaurada; quatro anteriores reconferidas;
lint/tipagem/build aprovados. README raiz e runtimes preservados, sem produto/push/
merge/deploy/banco real. CF033/034 permanecem propostas, não iniciadas. Zoom nativo
200%, adoção CF017/P01/P02, desempenho e alcance DEC-ONB-03 continuam pendentes/
condicionados. Próximo passo: integração autorizada e conferência da base futura.

## Situação anterior — CF032 saneada localmente, aguardando revalidação, 23/10/2026

CF032 **em_revisao**. Os quatro achados foram saneados localmente com provas
originais preservadas: capacidade/evidências no backend, limite autoritativo na UI,
nome quando ticker falta e segundos no XLSX. Critérios 1/4 sustentados; 2/3 seguem
pendentes de aceite independente. [Entrega e limites](evidencias/saneamento-CF-032/README.md).

Seleção integrada 13/13 mais S5 dirigido aprovado; 95 controles backend incluindo
replay e capacidade após declaração, 54 componentes (19 novos incluídos), quatro mutações causais
detectadas e restauração por hash. Reconciliação financeira, isolamento/replay,
nova sessão e leitura real de XLSX preservados; subconjuntos não são somados como
casos novos. Commits locais por achado; README raiz e históricos preservados.
Sem CF033/034, publicação, merge, deploy ou banco real. DEC-ONB-03, zoom nativo 200%,
adoção CF017/P01/P02 e desempenho mantêm os gates. Próximo passo: revalidação
independente dos achados e dos critérios 2/3, sem autoencerramento.

## Situação anterior — CF032 revisada independentemente, 23/10/2026

CF032 permanece **em_revisao**. Critérios1/4 sustentados e2/3 pendentes;
CF032-01/02/03 confirmados P2, CF032-04 confirmado P3: XLSX armazena texto12:34,
enquanto entrada/API/SQL preservam12:34:56. Seleção dos investimentos conserva
UUIDs distintos; defeito demonstrado é identificação visual/acessível.
[Parecer, matriz e saneamento delimitado](evidencias/revisao-CF-032/README.md).

Nova execução dirigida8 cenários:4 aprovados/4 falhas originais;3 probes adicionais,
9 controles de reservas, reconciliação Decimal/OOXML, lint/tipos/build e temporais.
Sem somar reruns/subconjuntos ao histórico13/9/4. Produto, README raiz e runtimes
históricos preservados. Próximo passo: saneamento delimitado e revalidação;
CF033/034 não iniciadas, sem push/merge/deploy/banco real. DEC-ONB-03, zoom nativo200%
CF010/015, adoção CF017/P01/P02 e aceites anteriores mantêm seus alcances.

## Situação anterior — CF032 validada localmente com pendências, 22/10/2026

CF032 **em_revisao**, sem sucesso integral ou autoaceite. Matriz real navegador→
Next BFF→Spring→PostgreSQL: 13 cenários distintos, 9 passaram/4 falharam. Uso diário,
reload/nova sessão, contas a receber, hábito/prazo, isolamento e pagamento com
resposta perdida/efeito único comprovados; relatórios/exports monetários conciliam.
Três P2 (capacidade de fonte incerta, limite UI, identificação sem ticker) e
precisão horária P3/pendente conservam regressões vermelhas. [Entrega e próximos
passos delimitados](evidencias/CF-032/README.md).

40 controles PostgreSQL, 6 unitários em 3 fusos e quatro contraprovas causais com
restauração por hash; lint/tipos/build aprovados. Contagens sobrepostas não somadas.
Nenhuma fonte de produto alterada. Commits exclusivamente locais na branch própria,
README raiz e provas anteriores preservados. Revisão independente e saneamento
delimitado seguintes; sem CF033+, push/merge/deploy/banco real. Aceites CF029/030/031,
DEC-ONB-03, zoom CF010/015 e adoção CF017/P01/P02 permanecem nos seus alcances.

## Situação anterior — CF031 aceita independentemente no escopo local, 22/10/2026

CF031 **concluida** no alcance da DEC-ONB-03. RC031-02 encerrado após revalidação
da identidade própria; RC031-01 e demais aceites preservados. [Parecer e provas](evidencias/revalidacao-CF-031-identidade/README.md).
160 dirigidos,9 probes intactos,7 anteriores e4 controles adicionais aprovados;
contraprova causal detectada/restaurada149/149; lint/tipos/build e datas aprovados.
Prova real anterior reutilizada pelo delta limitado, sem nova rodada E2E alegada.
Carregamento/sessão permanece historicamente inconclusivo e não bloqueante por si.
Zoom nativo200% CF010/015 e adoção real CF017/P01/P02 conservam pendências/gates.
CF032 proposta, não executada: dependências funcionais satisfeitas nesta branch;
integração/conferência da base de execução ainda necessária, sem liberação automática.
Commits locais de provas, parecer e estados; sem alteração de produto, push ou deploy.

## Situação anterior — residual de identidade CF031 saneado localmente, 22/10/2026

CF031 permanece **em_revisao**. RC031-01 encerrado; residual RC031-02/P2 corrigido
localmente, aguardando revalidação independente. Validação e consumo usam o mesmo
id/tempId próprio; duplicatas e fontes distintas conferidas nos consumidores.
[Entrega, provas e limites](evidencias/saneamento-CF-031-identidade/README.md).
Probes independentes intactos: 7/9 antes, 9/9 depois; 160 dirigidos aprovados,
contraprova detectada com seis falhas e controle 149/149 restaurado por hash;
lint/tipos/build e regressões pertinentes aprovados, sem somar subconjuntos.
Reprodução em memória, sem ataque remoto/JSON bruto ou corrupção de banco
demonstrados. Sem mudança de recuperação/protocolo nem nova rodada real E2E.
Loading/sessão historicamente inconclusivos, não bloqueantes por si, preservados.
CF032 sem liberação; DEC-ONB-03, zoom CF010/015 e adoção CF017/P01/P02 conservam
gates. Mesma branch, commits locais, README raiz/runtimes/provas preservados;
sem push, merge, deploy ou banco real. Próximo passo: revalidação independente.

## Situação anterior — CF031 revalidada com residual, 22/10/2026

CF031 permanece **em_revisao**. RC031-01 encerrado independentemente; RC031-02
mantido/P2 por identidade herdada alternativa em referências, apesar dos dois
probes originais corrigidos. Reprodução de parser em memória, sem inferir ataque
por JSON bruto. [Parecer e provas](evidencias/revalidacao-CF-031-RC031/README.md).
138 dirigidos,7 probes originais,12 jornadas/SQL e duas contraprovas aprovados;
probes adicionais7/9 expõem o residual. Recuperação/efeito único sustentados.
T01/T02 historicamente inconclusivas, não bloqueantes por si; reabertura delimitada.
CF032 proposta, sem prontidão pelo aceite faltante da CF031; demais dependências
concluídas preservadas. Zoom CF010/015 e adoção CF017/P01/P02 mantêm gates.
Commits locais de provas/parecer/estado; sem produto, push, merge ou deploy.

## Situação anterior — saneamento CF031 aguardando revalidação, 22/10/2026

CF031 permanece **em_revisao**: RC031-01/02 corrigidos e validados localmente,
sem encerramento independente. Probes originais7/7 após4/7,138 dirigidos,
12 jornadas reais/SQL e duas contraprovas detectadas/restauradas127/127;
lint/tipos/build aprovados. [Entrega e limites](evidencias/saneamento-CF-031-RC031/README.md).
T01/T02 investigadas separadamente, origem histórica inconclusiva; falhas11/12
anteriores preservadas, sem correção de sessão presumida por nova passagem verde.
CF032 não liberada; zoom CF010/015 e adoção real CF017/P01/P02 conservam gates.
Mesma branch e commits locais, sem push, merge, deploy ou banco real.

## Situação anterior — CF031 não aprovada independentemente, 22/10/2026

CF031 permanece **em_revisao** por RC031-01/02 P2: caixa livre incoerente aceito
na recuperação do recibo e validação incompleta de reservas. Produto preservado.
[Parecer, matriz e saneamento delimitado](evidencias/revisao-CF-031/README.md).
75 dirigidos/6 temporais verdes, cinco contraprovas restauradas, lint/tipos/build
aprovados. Duas rodadas reais11/12 com falhas preservadas; seleção mobile4/4 e
quatro checkpoints SQL aprovados, sem transformar reexecução em12/12 integral.
CF032 proposta/não liberada: demais dependências concluídas preservadas, aceite
CF031 faltante. Zoom CF010/015 e adoção real CF017/P01/P02 permanecem separados.
Sem correção de produto, push, merge, deploy ou banco real.

## Situação anterior — CF031 implementada, em revisão local, 21/10/2026

CF030 aprovada e DEC-ONB-03 publicadas/integradas por fast-forward em main,
hash remoto `6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`. CF031 implementada na
branch `codex/cf031-onboarding-frontend`, com commits exclusivamente locais e
estado **em_revisao**, sem autoaceite. Rascunho, entrevista, revisão,
confirmação e recuperação por recibo entregues;75 testes dirigidos,12 jornadas
reais/SQL e cinco contraprovas. Suíte ampla438/441; três falhas também na base.
[Evidências, falhas e limites](evidencias/CF-031/README.md).
CF010/015 seguem em_revisao por zoom nativo200%; reavaliar incluindo onboarding
antes do uso. CF032 não liberada; adoção real CF017/P01/P02 e deploy mantêm
gates próprios. Aceites e pareceres históricos abaixo preservados.

## Situação anterior — CF030 aceita independentemente, 21/10/2026

Atualização posterior autorizada em21/10: [DEC-ONB-03](../docs/sdd/decisoes/003-liberacao-local-CF-031.md)
libera CF-031 exclusivamente para implementação/revisão locais após integração
do lote aprovado CF030. CF010/015 continuam em_revisao por zoom nativo200%, sem
aceite ou defeito presumido. Reavaliar incluindo onboarding antes do uso.
CF032 não liberada; adoção real CF017/P01/P02 e deploy conservam gates próprios.
O snapshot de aceite CF030 abaixo permanece histórico, inclusive o gate anterior.

**CF030 concluida no escopo local/descartável; RC030-01/02/03 encerrados** no
candidato c13aecd após revalidação independente.156 casos distintos aprovados,
quatro contraprovas causais detectadas e controle restaurado76/76. Observador
adaptado e binding civil de Invoice aceitos; datas históricas já deslocadas não
são reparadas automaticamente. Nenhuma correção de produto na revalidação.
[Parecer e limites](evidencias/revalidacao-CF-030-RC030/README.md).
CF029 e demais aceites preservados. CF031/032 continuam propostas e não liberadas;
CF015/zoom permanece exigido, assim como os gates de adoção real CF017/P01/P02.
Próximo passo: resolver CF015 antes de liberar CF031. Sem push/merge/deploy.

## Situação anterior — saneamento RC030 aguardando revalidação, 20/10/2026

**CF030 permanece em_revisao; RC030-01/02/03 corrigidos e validados localmente,
aguardando aceite independente.** Mesma branch, base251d6c7 e novos commits locais
por achado. Encargos entre faturas, datas civis de INITIALIZE_EMPTY/binding e
versão contratual400 saneados;134 casos distintos verdes, quatro contraprovas
detectadas e controle restaurado54/54. Provas originais e falhas preservadas;
um observador de rejeição antecipada foi ajustado com causa demonstrada.
[Entrega e encaminhamento delimitado](evidencias/saneamento-CF-030-RC030/README.md).
Demais aceites sustentados e CF029 preservados. CF031/032 não liberadas; gate
CF015/zoom e adoção real CF017/P01/P02 permanecem. Sem push, merge ou banco real.

## Situação anterior — revisão independente CF-030, 20/10/2026

**CF-030 não aprovada; permanece em_revisao por RC030-01/02 P2 e RC030-03 P3.**
Candidato `89760e6`, base `5b8c4e0`; nenhuma correção de produto nesta revisão.
Atomicidade, idempotência, revalidação/guard dos writers, E01, precisão e migração
sustentados no escopo exercitado. Pendentes: prioridade de encargos, vencimento
calculado fora do contrato em cartão existente e tratamento400 de versão inválida.
195 casos distintos:191 passaram/4 assertions falharam por3 achados; contraprova
de writer real detectada e controle restaurado aprovado.
[Parecer independente e saneamento delimitado](evidencias/revisao-CF-030/README.md).
CF029 e aceites anteriores preservados. CF031/032 não iniciadas/liberadas;
CF015/zoom e adoção real CF017/P01/P02 conservam seus gates.

## Situação anterior — CF-030 em revisão local, 20/10/2026

**CF-030 implementada e validada localmente; em_revisao, sem aceite independente.**
Lote aprovado CF029 publicado e integrado por fast-forward; main remota conferida
em `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`. Branch própria
`codex/cf030-aplicacao-onboarding`, novos commits exclusivamente locais.
Prepare/confirmação/cancelamento/recuperação, aberturas e reservas atômicas com V16;
504 testes verdes, quatro mutações detectadas e controle restaurado21/21.
[Entrega, falhas preservadas, limites e roteiro de revisão](evidencias/CF-030/README.md).
CF029/RC029-01 e aceites anteriores preservados. CF031/032 não iniciadas/liberadas;
CF031 conserva aceite CF030 e gate CF015. Zoom CF010/015 e adoção real CF017/P01/P02
continuam pendentes. Nenhum deploy manual, ativação de writer ou banco real.

## Situação anterior — aceite independente CF-029, 19/10/2026

**RC029-01 encerrado; CF-029 concluída exclusivamente local/descartável.**
Diagnóstico de incompatibilidade e contrato de issues persistidas/GET aceitos;
demais aceites preservados. [Parecer, provas e limites](evidencias/revalidacao-CF-029-RC029-01/README.md).
CF-030 tecnicamente pronta nesse escopo, não iniciada. Publicação/integração do
lote aprovado ficam para etapa autorizada antes de nova branch. CF-031 depende
de CF-030 e CF-015; CF-032 conserva CF-031 e seus gates. Zoom CF-010/015 e adoção
real CF-017/P01/P02 permanecem pendentes separadamente. Sem alteração de produto,
push, merge, deploy ou banco real nesta revisão.

## Situação anterior — saneamento local RC029-01, 19/10/2026

**CF-029 permanece em_revisao:** RC029-01/P2 implementado localmente e aguardando
revalidação independente dirigida. Reserva incompatível permanece no rascunho com
issue por campo, usando referências em lote; sem aplicação financeira.
[Provas, limites e encaminhamento](evidencias/saneamento-CF-029-RC029-01/README.md).
Demais resultados sustentados pela revisão preservados. CF030/031/032 não
liberadas/iniciadas; aceites anteriores, zoom CF010/015 e adoção real
CF017/P01/P02 preservados. Commits locais, sem publicação ou banco real.

## Situação anterior — revisão independente CF-029, 19/10/2026

**CF-029 permanece em_revisao por RC029-01/P2:** reserva para meta numérica salva
sem issue de incompatibilidade. Persistência, isolamento e concorrência nos caminhos
testados, V15 e exclusão sustentados; nenhum efeito financeiro indevido demonstrado.
[Parecer, provas e saneamento delimitado](evidencias/revisao-CF-029/README.md).
Próximo passo: corrigir o diagnóstico semântico do rascunho e revalidar o lote.
CF030/031/032 não liberadas. Aceites anteriores, zoom CF010/015 e adoção real
CF017/P01/P02 preservados. Commits exclusivamente locais, sem produto alterado.

## Situação anterior — CF-029 em revisão local, 19/10/2026

Lote aprovado CF-022 publicado e integrado por fast-forward em main, hash remoto
conferido `dd554d188976144ccf00e00f9b20242196f70d90`. CF-029 implementada na branch
`codex/cf029-onboarding`, **em_revisao**, com novos commits exclusivamente locais.
[Matriz, testes, contraprovas e limites](evidencias/CF-029/README.md).
Sem aceite independente, prepare/finalização/UI ou liberação de sucessoras.
CF-030 depende do aceite CF-029; CF-031 conserva CF-015/030 e demais dependências;
CF-032 conserva CF-031 e seus gates. Zoom200% e adoção real permanecem separados.

## Situação anterior — CF-022 concluída, 18/10/2026

**CF-022 concluída após aceite independente do critério 4**, preservados os
critérios 1–3. Date-only e isolamento de fixtures aceitos por contraprovas, 31 casos
Java e quatro jornadas reais/reload/SQL. Timeouts históricos RJ-022-01/H24-01
continuam inconclusivos não bloqueantes, com gatilhos de reabertura.
[Parecer e próximo passo](evidencias/revalidacao-saneamento-CF022/README.md).
CF-029 conserva prontidão exclusivamente local/descartável; não iniciada.
Publicação/integração do lote aprovado ficam para etapa posterior, antes de nova
branch para CF-029. Aceites RVA-03/CF-019/013/011/012/014 e pendências de zoom200%/adoção real
preservados; nenhuma liberação de produção.

## Situação anterior — saneamento CF-022, 17/10/2026

**CF-022 permanece em_revisao. Critério4 implementado localmente, aguardando
revalidação independente.** Date-only no harness de hábitos e schema/contexto por
método saneados; regressões, quatro jornadas reais/reload/SQL,27 casos originais e
contraprova2→1006→2 registrados com falhas/limites.
[Candidato e encaminhamento preciso](evidencias/saneamento-CF022/README.md).
Critérios1–3 e aceites anteriores preservados; timeouts históricos inconclusivos.
CF029 conserva prontidão somente local/descartável, sem execução; zoom200% e adoção
real continuam separados. Nenhuma publicação ou integração deste lote à main.

## Situação anterior — revisão CF-022, 16/10/2026

**CF-022 permanece em_revisao**, exclusivamente pelo saneamento do relógio do
harness de hábitos e isolamento das fixtures do scheduler (critério4). Critérios
funcionais1–3 sustentados; nenhuma correção de produto indicada. RJ-022-01/H24-01
mantêm causalidade histórica inconclusiva, sem exigir reprodução retroativa para
fechamento. [Parecer independente, contraprovas e próximo lote restrito](evidencias/revalidacao-CF022/README.md).
CF029 conserva prontidão exclusivamente local/descartável; não executada. Aceites
RVA03/CF019/013/011/012/014 e pendências zoom200%/adoção real preservados.

## Situação anterior — RVA-03, 16/10/2026

**CF-019 e CF-013 concluídas.** Revisão independente do candidato18c7150 aprova
o mecanismo causal e a correção Date-only do harness. RVA-03 encerrada no recorte
demonstrado, com atribuição histórica sustentada sem medição retroativa inventada.
**CF-015 continua em_revisao por zoom nativo200%**, sem aceite global/publicação.
CF011/012/014 preservadas; CF017/P01/P02 mantêm adoção real. CF029 conserva
prontidão anterior somente local/descartável; nenhuma implementação iniciada.
[Parecer, matriz integral, provas e próximo trabalho delimitado](evidencias/revalidacao-CF019-RVA03/README.md).

## Situação anterior CF-010–CF-015 — histórico, 14/10/2026

**CF014 concluída** após revisão independente do histórico invisível: causa no
harness demonstrada, correção Date-only aceita, pintura/interação/reload e banco
inalterado comprovados. Critérios acumulados satisfeitos; CF011/012 e RF15-01–04
preservados. **CF015 em_revisao** por zoom nativo200% e RVA-03, sem aceite global.
Falha do observador preservada e corrigida separadamente; controles finais3/3.
[Parecer, matriz vigente e próximo trabalho restrito](evidencias/revalidacao-CF014-historico-invisivel/README.md).

## Situação anterior — ciclo visual e candidato de harness, 14/10/2026

Diagnóstico posterior do executor, base8096b22: [histórico invisível CF014](evidencias/investigacao-CF014-historico-invisivel/README.md)
atribuído ao relógio do harness por contraprova causal e fixture persistida;
ajuste somente de teste. Aguarda revisão independente, sem concluir CF014/015
ou alterar os aceites abaixo.

Encerrado independentemente o **P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02)** em0f9beb1. CF014 continua em_revisao pela investigação específica de histórico invisível; CF015 conserva essa pendência, zoom nativo e RVA-03. CF011/012 e RF15-01–04 preservados. Nenhuma nova tarefa integralmente concluída. Seleção ampla219/219; os dois timeouts anteriores continuam inconclusivos quanto à causa, sem novo bloqueio por associação. [Parecer, provas e próximo passo restrito](evidencias/revalidacao-RVR24-02-ciclo-visual/README.md).

## Situação anterior CF-010–CF-015 — 13/10/2026

Candidato posterior do executor: [saneamento exclusivo do P2 de ciclo visual CF014, vínculo RVR24-02](evidencias/saneamento-RVR24-02-ciclo-visual/README.md), base cbbf58d. Aguardando revalidação dirigida, sem alterar os aceites/estados independentes abaixo.

Revalidação independente de a991114: RF15-02/04 e resíduos originais CF014 encerrados; **CF012 concluída**, CF011 preservada. CF010 segue por zoom nativo; CF013 por RVA-03 inconclusivo; CF014 por P2 confirmado de resposta tardia A→B e ocorrência visual inconclusiva; CF015 conserva essas pendências específicas. [Parecer, critérios completos e próximo trabalho delimitado](evidencias/revalidacao-residual-RF15/README.md). Sem alteração de produto ou aceite global por associação.

## Situação anterior CF-010–CF-015 — 12/10/2026

Revalidação independente do candidato db2d77d: RF15-01/03 encerrados; RF15-02/04 parcialmente saneados, com exposição visual na transição e atraso desatualizado na aba aberta. Resíduos de Escape/foco CF014 confirmados. CF010/012/013/014/015 permanecem em revisão; CF011 conserva conclusão. [Parecer atual e saneamento restante delimitado](evidencias/revalidacao-RF15/README.md). Zoom é verificação faltante; RVA-03 investigação inconclusiva, sem veto por associação.

## Situação anterior CF-010–CF-015 — 11/10/2026

CF-011 concluída após fechamento independente de recuperação, preferências e download. CF-010/012/013/014/015 seguem em revisão por defeitos e lacunas específicos. [Parecer completo e próximo saneamento delimitado](evidencias/fechamento-CF-010-CF-015/README.md). Aceites anteriores CF-005–009, RV24-01/02, CF-025–027 e CF-028 documental preservados.

Saneamento RF15-01–04 preparado localmente, sem alteração dos estados acima. [Candidato do executor e pendências delimitadas](evidencias/saneamento-RF15/README.md); aceites dependem do mesmo revisor.

## Por onde começar

1. Executar CF-001 para fixar critérios e casos independentes do código.
2. Preparar CF-002 e CF-003; esses ambientes usam somente dados sintéticos e não dependem de reativar produção.
3. Seguir CF-004 a CF-014 respeitando dependências e concluir a revisão CF-015. Esse é o primeiro marco: datas e frontend.
4. Seguir o catálogo para integridade, onboarding e liberação. Trabalho de especificação financeira pode avançar antes, mas não deve retirar prioridade dos defeitos relatados.

O [catálogo](CATALOGO.md) lista as 36 tarefas, dependências e modelos. O estado oficial está em cada arquivo individual; o catálogo não duplica status.

A [rastreabilidade](RASTREABILIDADE.md) relaciona todos os achados F e os 12 épicos anteriores às tarefas executáveis.

## Organização

```text
tasks/
  README.md
  CATALOGO.md
  EXECUCAO.md
  MODELOS.md
  POLITICA-DE-TESTES.md
  00-fundacao/           CF-001 a CF-003
  01-datas-integracao/   CF-004 a CF-009
  02-frontend/           CF-010 a CF-015
  03-integridade/        CF-016 a CF-027
  04-onboarding/         CF-028 a CF-032
  05-release/            CF-033 a CF-036
  templates/
  evidencias/
```

## Regras comuns

- Ler [execução](EXECUCAO.md), [política de testes](POLITICA-DE-TESTES.md) e o arquivo da tarefa antes de trabalhar. A regra expressa do usuário é: testes devem avaliar o código, não ser moldados para passar.
- Preservar o patch inicial já existente. CF-005 amplia e valida as correções de calendário; não recomeça o trabalho nem presume validação visual concluída.
- Cada correção pertence à tarefa que a implementa, junto com testes e evidências. CF-015 e CF-033 são revisões adicionais, não substitutos dos testes durante implementação.
- Não prometer ausência absoluta de bugs. O aceite exige comportamento especificado, falhas conhecidas tratadas, testes capazes de detectar regressão e riscos residuais registrados.
- Caminhos de escopo são relativos à raiz. Alterar arquivo compartilhado fora do escopo só com justificativa, atualização da tarefa e nova validação dos consumidores.
- A pasta tasks é a fonte de execução. docs/sdd guarda regras, decisões e evidências históricas. [Mapa dos antigos épicos](../docs/sdd/tarefas.md) mantém a rastreabilidade.

## Prontidão

Atualização CF-028 de10/10/2026, base `a7bc256`:
[aceite independente final](evidencias/revalidacao-CF-028-totais/README.md).
**CF-028 concluída exclusivamente como especificação; R28-01/02 encerrados.**
Próximo trabalho planejado: fechamento dirigido CF-010–015, não iniciado nesta
revisão. Nenhuma liberação automática de CF-029–034 ou implementação de onboarding.
As notas datadas anteriores abaixo permanecem históricas no recorte CF-028.

Parecer vigente de 09/10/2026 sobre `0c068d9`, intervalo `18cd6df..0c068d9`:
[revalidação independente RD58](evidencias/revalidacao-RD58/README.md).
RD58-01/02 aprovados; **CF-005 e CF-006 concluídas** após confronto de critérios
e obrigações originais com os aceites acumulados. CF-007/008 preservam conclusão
local da [revisão dirigida anterior](evidencias/revisao-dirigida-CF-005-CF-008/README.md).
P01/P02/CF-017 mantêm adoção real separada. CF-025–027, RV24-01 e CF-009 já
possuem aceites posteriores às notas históricas. Liberação de CF-028 somente
para especificação preservada; nenhum fechamento geral de CF-010–015.

Atualização dirigida de08/10/2026: [revalidação independente RVR24-01/P2](evidencias/revalidacao-RVR24-01-propriedades/README.md),
candidato `b5e8550`, encerra o resíduo e conclui RV24-01/CF-009 após confronto
individual dos critérios. Aceites e investigações dos demais recortes preservados.
CF-028 conserva a liberação anterior **somente para especificação**, sem execução
ou autorização de publicação. O registro datado de03/10 abaixo permanece histórico;
os arquivos individuais continuam sendo a fonte canônica de estado.

Parecer corrente do recorte em 03/10/2026: [revisão independente CF-025/026/027 e RV24](evidencias/revisao-CF-025-CF-027-RV24/README.md), base `06c1a51`, com [matriz de critérios/estados](evidencias/revisao-CF-025-CF-027-RV24/MATRIZ.md). CF-025/026/027 concluídas; RV24-01/CF-009 em revisão por RVR24-01, RVR24-02 encerrado. CF-028 pronta **somente para especificação**, sem implementação nem liberação automática das sucessoras. Demais aceites e investigações preservados; snapshots abaixo permanecem históricos.

Consultar o [snapshot documental de 01/10/2026, CF-001–026](evidencias/consolidacao-CF-001-CF-026/README.md)
e sua [reconciliação CF-001–027 de 03/10/2026](evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md),
com os pareceres referenciados. A revisão inicial de CF-001–009 é histórica:
P03/P04/P05 foram revalidados posteriormente; P01/P02 conservam gates de adoção.
Os arquivos individuais continuam sendo a fonte canônica de estado.

Estados: `proposta`, `pronta`, `em_execucao`, `em_revisao`, `concluida`, `bloqueada`. Todas as tarefas começam propostas ou prontas; escrever esta lista não significa executar seu conteúdo. `concluida` exige os critérios próprios e o aceite aplicável com evidência verificável; `em_revisao` não significa concluída. `bloqueada` exige impedimento concreto ao trabalho da própria tarefa.

Para iniciar um recorte dependente, exigir conjuntamente: implementação integrada
na base usada; aceite exigido ou liberação independente explícita da capacidade
consumida; ausência de bloqueante concreto nesse recorte; referência ao parecer,
base, consumidor e limitações. Seguir o [procedimento de execução](EXECUCAO.md).
Liberação parcial não exige concluir a origem, não aprova produção e não dispensa
testes dos caminhos alterados. Mudança posterior que afete a garantia consumida
exige reconferência. Gates de adoção real não impedem automaticamente trabalho
em ambiente descartável; nenhuma destas regras permite ignorar dependências.

Se uma investigação não reproduzir um defeito, registrar cenários executados e manter a incerteza. Não inserir alteração especulativa para justificar o fechamento. Defeitos novos recebem ID e tarefa derivada pelo [template](templates/TAREFA.md).


Saneamento residual RF15 do executor (12/10/2026): [evidências e matriz](evidencias/saneamento-residual-RF15/README.md). CF010/012/013/014/015 permanecem em_revisao; CF011 concluída. Sem aprovação do marco, onboarding ou tarefas posteriores.
