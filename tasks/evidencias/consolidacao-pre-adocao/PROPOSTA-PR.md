# Proposta de PR — não criada

Destino: `kaiqueGeraldo/controle-financeiro:main`.
Origem preparada: `codex/saneamento-cpa01-selecao-testes`.
**Rascunho documental: seleção CPA-01 aceita; R1/P2 saneado localmente, aguardando
revisão independente antes de publicar.** Nenhuma PR, CI ou publicação executada.

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

**CPA-01/R1/P2 saneado localmente, sem autoaprovação:** o nome required foi
preservado para um agregador com always e needs diretos Windows/Linux/expanded.
O worker Linux conserva execução e pacote atrás do sucesso Windows. O agregador
exige success de ambos e também de expanded no dispatch expanded; nos demais
modos, expanded skipped representa somente não aplicabilidade explícita.
Falha, cancelamento, skip obrigatório, ausência, resultado desconhecido ou JSON
inválido produzem exit1 com diagnóstico dos jobs. Não há continue-on-error.
32 contratosCI,7 probes independentes e82 cenários do avaliador real passaram;
6 mutações detectadas/restauradas por hash. Sem nova suíte financeira, startup ou
TCP; seleção100/115 e união101/116 conferidas contra o aceite independente.
Implementação `b45284e876277e4136b6487ed3e3d9a320bfaa62`, base `e837748a`.
O parecer C permanece até revisão independente; scheduling/cancelamento remoto e
proteções continuam não certificados. Não se promete execução após force-cancel
ou indisponibilidade de runner. Artifacts smoke anteriores à matriz expanded não
substituem aprovação do required final.

Startup local conserva 40s e seu alcance anterior, sem nova suíte de 17 contratos verde ou causa
histórica HQL demonstrada. TCP/reuso, RVPLA/audit e PG16/17 mantêm seus aceites. JAR p05
b296… pertence aos inputs 24844b59; main histórica c386… é outro pacote. Não houve
novo JAR nesta revisão. CI futura deve produzir manifesto/pacote do checkout
realmente testado; imagem/registry/deploy são etapas próprias.

Base remota reconferida: `fb986456a37a48afcafef204f165d15354294d26`.
Candidato de código: `193916a1778f1322f5368f66d30a83286766b147`, 53 commits acumulados,
mais os commits locais de provas/documentação da revalidação. O HEAD documental
final consta da entrega; R1 acrescenta o delta local a partir de `e837748a`, ainda
sem aceite independente. Check esperado: `required`, workflow `CI integrated gates`;
conferir no futuro os nomes/origem/SHA/evento e rulesets, sem migrar proteções aqui.

CF034 integral/matriz remota, zoom 200%, configuração de hospedagem, CF017/P01/P02,
adoção real e produção continuam com critérios próprios. CI verde não autoriza
uso ou deploy. Evidências em `tasks/evidencias/revalidacao-CPA-01/` e plano em
`tasks/evidencias/consolidacao-pre-adocao/PUBLICACAO-CI.md`.
Provas de R1 em `tasks/evidencias/saneamento-CPA-01-R1/`.
