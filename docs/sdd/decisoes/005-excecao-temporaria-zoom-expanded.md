# DEC-ZOOM-05 — Exceção temporária para continuidade delimitada da expanded

Data: 03/11/2026, America/Sao_Paulo. Autoridade: autorização explícita do usuário no pedido desta execução, inclusive para avançar sem concluir agora os dois cenários nativos de zoom 200%. Base conferida: 64b0cb4c00e9d5905a9b87814143a33df415db97, branch codex/saneamento-pr3-expanded, sem alterações iniciais na worktree.

## Contexto e decisão

O usuário considerou desproporcional manter toda a integração bloqueada por esta verificação. Retirar exclusivamente os dois casos abaixo do conjunto bloqueante desta etapa, por seleção anterior à execução. Preservar testes, preparações/controles comuns, resultados antigos e protocolo/pacote assistido. Não executar os casos para aceitar skips.

| Arquivo em controle-financeiro-frontend/tests/e2e | Projeto | Título exato |
|---|---|---|
| cf015.native-zoom.integrated.spec.ts | review-sao-paulo | R10: zoom nativo 200% com ações, rolagem e foco |
| rf15-native-chrome.integrated.spec.ts | review-sao-paulo | RF15: zoom nativo Chrome 200% com ações, rolagem e foco |

Ambos são casos Playwright independentes do wrapper Java Rf15RemediationBrowserTest#browserBffSpringPostgresAndReload, pelo config playwright.rf15.config.ts. Nenhuma classe Java inteira é dispensada. Outro projeto, título ou arquivo não equivale a estas identidades. Controles normais do mesmo config e eventuais controles independentes nos mesmos arquivos continuam obrigatórios.

## Estado e risco residual

AC-UI-001, primeiro aceite de CF010 e marco CF015: **pendente, com exceção temporária autorizada para a continuidade delimitada**. CF010/CF015 permanecem em_revisao, sem conclusão integral. Não foi demonstrado o funcionamento integral dessas jornadas a 200%, incluindo possíveis recortes, foco, overlays ou ações inacessíveis. Esta é uma limitação de verificação, sem afirmação de que o produto funciona ou falha a 200% e sem defeito confirmado por associação.

## Alcance, limites e retomada

Autoriza registrar a decisão, ajustar seleção/gates, verificar contratos e executar localmente a expanded restante com fontes e recursos sintéticos isolados. Permite preparar material para posterior publicação/CI e avaliação de integração, sempre após revisão independente e autorização da etapa correspondente. A implementação desta exceção não recebe autoaprovação.

Não autoriza aceite visual integral de AC-UI-001/CF010/CF015, dispensa de outros testes, skips genéricos, adoção real CF-017/P01/P02, deploy ou produção. Nesta execução: sem push, atualização de PR, CI remota, merge, alteração de hospedagem/proteção ou acesso a banco real. Expanded continua obrigatória no dispatch expanded; o job inteiro skipped reprova o required.

Sem prazo de expiração inventado. Retomar quando houver capacidade adequada ou decisão específica sobre aceite visual/release. Usar protocolo e pacote preservados em tasks/evidencias/saneamento-zoom-assistido/RETOMADA.md, revalidando candidato/ambiente e critérios N01–N12; o pacote histórico não prova o candidato futuro. Problema real de zoom recebe tratamento pela gravidade, independentemente desta exceção.

O benefício é permitir verificar os demais controles sem aguardar capacidade nativa; o custo é manter risco visual explícito e dois conjuntos de aceite distintos. Não há ampliação automática da exceção diante de nova falha.

## Referências

DEC-ONB-03 e DEC-CI-04 mantêm seus alcances. RR3-01 permanece encerrado no contrato aceito pelo parecer tasks/evidencias/revalidacao-RR3-01-atribuicao-v2/PARECER.md. RESULTADO.md e RETOMADA.md do saneamento de zoom e INTEGRACAO-PR3.md do acervo principal permanecem históricos. Evidência corrente: tasks/evidencias/excecao-zoom-expanded/.
