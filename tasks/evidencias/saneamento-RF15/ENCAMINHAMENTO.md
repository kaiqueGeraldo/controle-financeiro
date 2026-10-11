# Encaminhamento ao mesmo revisor de CF-010–015

Solicita-se revalidação dirigida, **sem aceite concedido pelo executor**. Base independente: `bc5532cffc15f161685c03dae199675b0829c047`, precedida por22b0e89/46189a2. Branch `codex/cf-028-contrato-onboarding`. Intervalo completo: `bc5532c..HEAD` desta entrega, incluindo o commit documental que contém este arquivo. Produto/testes até `82936a2`; commits posteriores deste lote são documentação/evidências. O hash documental final é informado na entrega do executor.

| Commit local | Conteúdo / achado |
|---|---|
|572e8e5|RF15-02: contas arquivadas, wrapper acessível, sinal negativo legível|
|07b2178|RF15-04: fechamento persistido no DTO, datas civis da API e saldo/atraso|
|d85e0f1|RF15-03: detalhe/acionador do extrato, foco/Escape/cancelamento; também protege valores auxiliares RF15-02|
|2b3e4d6|RF15-01: nome mobile e retorno do foco na criação de hábito|
|8e739b9|Provas novas, harness PostgreSQL descartável, observação RVA e complemento de matriz|
|82936a2|RF15-02: preserva layout flex normal sem perder ocultação acessível privada|
|56ae14a|Capturas, logs brutos, manifests e scripts de reprodução; separado da documentação|

## Conjunto para revisar

1. [README](README.md) e [plano prévio](PLANO.md): associação original dos quatro IDs, causas, consumidores, contratos e trade-offs. Não foram criados IDs RF15 adicionais.
2. Originais intactos: frontend-closure-targeted (C privacidade/C detalhe), frontend-closure-final (D competência/datas/reload), frontend-closure-payment (sequência20→120), demais probes e pareceres. [187 hashes anteriores](provas-originais-sha256.txt) e [conferência](provas-preservadas.json). As falhas anteriores estão em before-targeted, before-dates e browser/before-mobile; os verdes originais em browser/after-stable-visual.
3. Candidato causal: rf15-causal11 casos, idêntico na cópia isolada da base (8 falham) e candidato (11 passam em cada um dos três fusos); rf15-privacy-detail; Rf15InvoiceDatesTest5 + Cf019CardIntegrationTest15 verdes. O [manifesto da árvore testada](arvore-testada-sha256.txt) cobre fontes/testes alterados. Não houve mutação na árvore principal nem necessidade de reset/restauração.
4. [Execuções](EXECUCOES.md): gate amplo112 verdes/3 vermelhos, com conflito normativo explícito nas provas antigas de datas; recorte final22/22, browser final3/3, lint/typecheck/build0. Não apresentar o gate amplo como verde.
5. [Matriz complementar](MATRIZ.md) e [capturas inspecionadas](VISUAL.md): contas/privacidade em dois temas, detalhe768/360, três fusos, PAID real, metas hoje/concluída, formulários/histórico longos. Evidência final do wrapper/detalhe: browser/final-accessible-layout; detalhe hábito: browser/final-detail-habit; investimento/metas: browser/after-stable-visual.
6. [Zoom](ZOOM.md) e [RVA-03](RVA-03.md) separados: limitação de ferramenta versus investigação causal inconclusiva. Não requerem repetir toda a auditoria para avaliar as quatro correções.

## Critérios de encerramento por tarefa

| Tarefa | Decisão ainda exigida do revisor |
|---|---|
|CF-010|Revalidar impacto localizado no hook/wrapper; manter zoom nativo200 pendente até aplicação e observação reais de conteúdo, ações, teclado, foco e scroll.|
|CF-011|Continua concluída. Provas de preferências/autenticação/recuperação diretamente relacionadas passaram; nenhuma regressão concreta demonstrada.|
|CF-012|Confirmar RF15-02/03, árvore acessível sem valor privado, reload, valor negativo/extenso, Escape/camada/retorno. Provas fornecidas pelo executor não são aceite.|
|CF-013|Confirmar RF15-04, contrato civil/competência, saldo pagável, PAID real e fusos. Decidir atualização normativa das três provas antigas conflitantes sem apagar a falha histórica. RVA-03 continua inconclusivo no alcance documentado.|
|CF-014|Confirmar RF15-01. Avaliar as células agora executadas e delimitar saneamento dos detalhes customizados de meta/hábito e retorno de foco de investimento; não concluir por testes exploratórios verdes que registram resíduos. Comprimento inválido de hábito/500 é ocorrência separada.|
|CF-015|Consolidar somente após decisão independente das tarefas acima; marco continua em_revisao. Preservar aceites CF-005–009/RV24-01, recuperação e precisão no seu alcance, sem reabrir blocos por associação.|

O README da raiz permanece alteração preexistente exclusiva do usuário, fora de todos os commits, SHA2566235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. O staging será entregue vazio. Nenhum checkout/reset/merge/rebase/clean, push, deploy, banco real ou implementação de onboarding foi realizado.
