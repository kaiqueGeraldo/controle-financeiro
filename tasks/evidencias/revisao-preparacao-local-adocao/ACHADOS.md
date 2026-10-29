# Achados e condições de encerramento

## RVPLA-01 — P2: resume pode pular contraprova sem efeito causal

**Defeito confirmado de observador; não é defeito financeiro.**
`tasks/evidencias/preparacao-local-adocao/counterproofs.mjs:49,91,111,121`.
A validação causal pode lançar após Maven retornar1, mas finally grava esse
status. Resume filtra status===1 e pula o caso como concluído.

Reprodução: na execução nova, writer-passes-maintenance falhou esperando
liveness, antes de ADOPTION_BLOCKED_WRITE. O gerador interrompeu corretamente com
Missing causal effect, mas deixou status1 em results.json. O predicado original
de resume o seleciona para skip. [observador-resume.json](observador-resume.json)
vincula fonte/log/hashes e demonstra true para skip, false para efeito. Não foi
executado resume nem sobrescrita a prova interrompida.

Impacto: uma retomada posterior pode declarar o caso já detectado sem executar
a mutação pertinente. O testemunho final restaurado não substitui essa detecção.
As cinco provas históricas p04 têm seus efeitos próprios registrados e foram
conferidas; este achado não transforma automaticamente aquela execução em falsa.

Menor saneamento futuro: gravar estado explícito detected somente depois de
assertion+efeito+restauração verificados; resume exige esse estado e os vínculos
dos relatórios, distinguindo timeout/erro/inconclusivo. Fechar com contraprova que
simule falha pré-efeito e demonstre que não é pulada; manter também o caso válido
retomável e restauração por hash. **Não corrigido neste lote.**

## RVPLA-02 — Gate de startup: estouro confirmado, causa completa inconclusiva

Local: `controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java:275`.
Controle17/3 falhas nesta revisão; histórico Windows e Linux preservado.
Em pilhas novas, main trabalha em ANTLR/HQL/SimpleJpaQuery depois de conexão/JPA.
Probes isolados de queries/classloader não reproduziram o custo integral.
[STARTUP.md](STARTUP.md) contém timeline, recursos, efeitos do observador,
hipóteses discriminadas e próximo experimento.

Impacto: ainda não há inicialização previsível sob o controle adotado. Não se
atribui defeito a uma consulta específica, ao produto ou ao harness. Fechar com
causa/controle discriminante e aceite do critério de duração sustentado por
evidência, sem retry/aumento unilateral de prazo. Publicação/ativação da API
continua condicionada. Nenhuma mudança de startup foi aplicada.

## Configuração incompatível antes da futura ativação

Railway/API, painel Variables: DDL_AUTO=update confirmado; perfil/flags novas
ausentes entre os nove overrides e sem healthcheck no painel Settings. Código
`AdoptionSafetyInitializer.java:19–21` recusa update no perfil adoption; o
Dockerfile remoto atual, linha6, recompila outra fonte com skipTests.

Impacto futuro: ligar fonte antiga ou bootstrap sem a configuração conjunta
pode executar Flyway/Hibernate/jobs antes da janela aprovada. Não houve prova
de alteração passada em dados. Encerramento: candidato imutável aprovado,
changeset C01–C05/C09 lido após aplicação autorizada, com guards/SQL/health
observados no destino próprio. Atualizar somente validate não desliga Flyway.

Vercel:8 previews antigos READY, Branch Tracking habilitado e variável de backend
compartilhada nos três escopos. Local: `src/app/api/[...path]/route.ts:45` bloqueia
somente VERCEL_ENV=preview; sem essa variável o caminho normal permanece aberto,
assim como production/development. System envs estão habilitadas atualmente.
O arquivo `vercel.json:4` novo não foi publicado/aplicado e não revoga URLs
existentes. Encerramento remoto: C10–C12 com inventário/escopos/URLs verificados,
sem substituir isso por teste local ou exigir garantia universal do código.

## Lacunas de adoção real e decisões operacionais

No Backups no volume Railway é observação atual do provedor, não prova de dados
descartáveis ou inexistência de backup externo. Não há inventário/classificação
A–D, dump/restore/preflight do alvo, provenance temporal ou freeze de todos os
consumidores. Essas obrigações pertencem à adoção real e mantêm seus gates.

O processo fechado não passa readiness e não permite smoke funcional. Antes de
aplicar o changeset conjunto, decidir observação sem promoção e como restringir
ingresso durante abertura sintética de writers. Não trocar readiness por liveness
para certificar prontidão. Drenagem da fila assíncrona/trabalho em voo e grants
de runtime/migrador precisam ensaio operacional; não são defeitos novos inferidos
da ausência de garantia universal. Nenhum checkbox integral foi encerrado.
