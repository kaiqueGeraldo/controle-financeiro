# Proposta de PR — não criada

Destino: `kaiqueGeraldo/controle-financeiro:main`.
Origem preparada: `codex/saneamento-cpa01-selecao-testes`.
**Rascunho documental: CPA-01/R1 encerrado pela revisão independente local;
parecer A — candidato apto a publicação controlada e CI remota.** Nenhuma PR,
CI remota ou publicação executada nesta revisão. Execução futura exige autorização.

## Título proposto

Preparar adoção segura: PG16/17, manutenção, saúde e CI por plataforma

## Descrição proposta para o estado examinado

O lote separa migrations do bootstrap da API no perfil adoption, controla ingresso
funcional e agendadores por flags, acrescenta probes mínimos e bloqueia operações
no BFF de previews. Também prepara suporte operacional PG16/17 e um harness que
exige provas causais, restauração e quiescência antes do resume. Migrations V1–V16,
regras financeiras e os aceites locais anteriores foram preservados.

O saneamento CPA-01 passa a selecionar testes pela plataforma da JVM. Linux mantém
100 classes smoke e 115 expanded; um job Windows obrigatório executa o contrato TCP,
com relatório exigido e zero skips. A união preserva 101/116 identidades, incluindo
os 15 históricos. A condição JUnit foi movida para a classe dedicada sem alterar
corpo, assertions ou budget de 3s. Os argumentos Maven Windows são passados como
literais por PowerShell.

Revalidação independente: 23 contratos em Windows/Linux, sete probes independentes,
TCP Windows real 1/1 e três casos comuns em JVM Linux real aprovados. A seleção
antiga reproduziu skip/rejeição; duas mutações de cobertura foram detectadas e
restauradas por hash. Linux local usou Node 22, diferente do 24 previsto em Actions.
Isso não é suíte Linux integral, CI remota ou supervisor Linux certificado.

**CPA-01/R1/P2 encerrado no alcance local por revisão independente:** o nome required foi
preservado para um agregador com always e needs diretos Windows/Linux/expanded.
O worker Linux conserva execução e pacote atrás do sucesso Windows. O agregador
exige success de ambos e também de expanded no dispatch expanded; nos demais
modos, expanded skipped representa somente não aplicabilidade explícita.
Falha, cancelamento, skip obrigatório, ausência, resultado desconhecido ou JSON
inválido produzem exit1 com diagnóstico dos jobs. Não há continue-on-error.
32 contratosCI e7 probes originais passaram nesta revisão;6 controles independentes
incluem500 combinações no módulo real, CLI/exit e YAML parseado. Sete mutações
detectadas e restauradas por hash, inclusive expanded interpretado como smoke.
As provas recebidas32/7/82/6 foram conferidas; contagens se sobrepõem.
Sem nova suíte financeira, startup ou TCP; seleção100/115 e união101/116 conferidas
contra o aceite independente. Implementação `b45284e876277e4136b6487ed3e3d9a320bfaa62`,
candidato revisado `81b20bca7c95c452fa04899f583a1b0b5007853e`, base `e837748a`.
Parecer A para publicação controlada e CI remota; scheduling/cancelamento remoto e
proteções ainda exigem validação. Não se promete execução após force-cancel
ou indisponibilidade de runner. Artifacts smoke anteriores à matriz expanded não
substituem aprovação do required final.

Startup local conserva 40s e seu alcance anterior, sem nova suíte de 17 contratos verde ou causa
histórica HQL demonstrada. TCP/reuso, RVPLA/audit e PG16/17 mantêm seus aceites. JAR p05
b296… pertence aos inputs 24844b59; main histórica c386… é outro pacote. Não houve
novo JAR nesta revisão. CI futura deve produzir manifesto/pacote do checkout
realmente testado; imagem/registry/deploy são etapas próprias.

Referência origin/main local: `fb986456a37a48afcafef204f165d15354294d26`, sem fetch
ou consulta remota nesta revisão. Candidato `81b20bca` tem58 commits exclusivos
locais; somam-se as provas/documentação/recibos desta revisão. HEAD documental
final consta da entrega; reconferir main/ancestralidade e congelar o SHA de envio
na futura etapa autorizada. Check esperado: `required`, workflow `CI integrated gates`;
conferir no futuro os nomes/origem/SHA/evento e rulesets, sem migrar proteções aqui.

CF034 integral/matriz remota, zoom 200%, configuração de hospedagem, CF017/P01/P02,
adoção real e produção continuam com critérios próprios. CI verde não autoriza
uso ou deploy. Evidências em `tasks/evidencias/revalidacao-CPA-01/` e plano em
`tasks/evidencias/consolidacao-pre-adocao/PUBLICACAO-CI.md`.
Provas de implementação R1 em `tasks/evidencias/saneamento-CPA-01-R1/` e aceite
independente em `tasks/evidencias/revalidacao-CPA-01-R1/`.
