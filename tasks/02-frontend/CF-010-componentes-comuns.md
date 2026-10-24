# CF-010 — Corrigir modais, layout e acessibilidade compartilhados

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-003](../00-fundacao/CF-003-harness-frontend.md)
- Origem: T-008; F-015

## Análise de capacidade — 24/10/2026

[CF015-zoom-gate-CF034](../evidencias/CF015-zoom-gate-CF034/README.md), base
integrada `e1a01b6`: a ferramenta aceitou vínculo inicial Chrome, mas interrompeu
a observação por não confirmar URL com segurança. Nenhuma captura/input/zoom
ou ensaio de produto; AC-UI-001/aceite1 continua sem prova nativa200%.
Estado em_revisao e demais aceites preservados. Matriz futura inclui onboarding
conforme DEC-ONB-03. Proposta de continuidade CF034 pendente, sem mudar gate.

## Parecer independente vigente — 13/10/2026

Decisão posterior de21/10/2026: [DEC-ONB-03](../../docs/sdd/decisoes/003-liberacao-local-CF-031.md)
mantém esta tarefa em_revisao pelo zoom nativo200% e registra seu procedimento,
evidência, limitação e responsáveis. Autoriza somente desenvolvimento/revisão
locais CF-031; reavaliar zoom com as novas telas antes da liberação para uso.

Estado `em_revisao`: RF15-02 encerrado; foco/scroll compartilhados e privacidade liberados nos recortes comprovados. Resta zoom nativo 200% no critério de reflow/alcance de ações. O P2 de ciclo visual de operação pertence ao consumidor CF014. Não bloqueia genericamente CF012.

[Parecer, critérios completos, provas e encaminhamento restrito](../evidencias/revalidacao-residual-RF15/README.md). Supera os estados correntes das notas anteriores; preserva seu alcance histórico. Produto não alterado nesta revisão.

## Revalidação independente anterior — 12/10/2026

Estado `em_revisao`: zoom nativo200 continua sem prova suportada; RF15-02 conserva exposição visual transitória no componente PrivacyBlur. Hook compartilhado e consumidores examinados aprovados no recorte, sem imputar ao hook os detalhes customizados CF014.

[Parecer, matriz, achados, testes contestados e evidências](../evidencias/revalidacao-RF15/README.md). Supera o estado corrente descrito nas notas anteriores, preservando seu alcance histórico. Sem correção de produto nesta revisão.

## Parecer dirigido anterior — 11/10/2026

Estado `em_revisao`: componentes comuns, temas, larguras360/768/1440 e diálogo aninhado revalidados no recorte. Falta zoom nativo200, cuja tentativa falhou antes de qualquer input. RF15-01/03 pertencem aos consumidores CF-014/012; não se atribui falha ao componente comum sem prova.

[Parecer, matriz por critério, achados, execuções e imagens inspecionadas](../evidencias/fechamento-CF-010-CF-015/README.md). Esta nota supera descrições correntes anteriores; relatórios datados conservam seu alcance histórico. Nenhuma correção de produto nesta revisão.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categoria 4: verificar zoom nativo 200% com ações essenciais alcançáveis, scroll e foco, registrando inspeção. Geometria/foco nos recortes já aceitos continuam válidos; viewport estreito não substitui zoom. O aceite permanece CF-015.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Problema e resultado esperado

Problemas de overflow, foco e botões podem se repetir em todas as telas por componentes compartilhados. Auditar esses elementos antes de corrigir telas individualmente.

## Escopo e referências

- `controle-financeiro-frontend/src/components/ui/`
- `controle-financeiro-frontend/src/components/sidebar/`
- `controle-financeiro-frontend/src/layouts/`
- `controle-financeiro-frontend/src/app/globals.css`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Reproduzir modal longo, modal aninhado quando existente, sidebar móvel, erro em formulário e teclado.
2. Corrigir scroll, foco inicial/retorno, fechamento, tamanhos e contraste com menor alteração compartilhada possível.
3. Definir fixtures de tema/privacidade/texto longo e capturas inspecionadas para as próximas tarefas.

## Aceite e testes adversariais

- [ ] Em 360px, zoom 200% e teclado, ações essenciais seguem alcançáveis; texto não sobrepõe valores/botões.
- [x] Modal aberto mantém foco coerente; fechar devolve foco; área rolável não esconde confirmação.
- [x] Comparar antes/depois em claro/escuro; snapshots não mascaram a geometria corrigida.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Redesign de identidade visual ou alteração de contrato de todos os formulários sem necessidade.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Concluída em 13/09/2026 sobre `main`, preservando o patch local preexistente em
`README.md`. A dependência CF-003 estava concluída e integrada na base testada.
Foram corrigidos diálogo, foco, rolagem, erro de formulário e controles móveis
nos componentes compartilhados, com regressão causal, inspeção visual clara/escura
e validação em viewport efetiva de zoom 200%. [Evidência, comandos e limitações](../evidencias/CF-010/README.md).

Limitações: não há consumidor de `SideModal` para modal aninhado real; as
capturas usam backend sentinela indisponível e viewport CSS equivalente a 200%,
não configuração nativa de zoom. A revisão independente segue em CF-015.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R10 confirma sobreposição/recorte no tablet; R08 mostra consumidor com foco inadequado; R11 acrescenta quatro avisos de lint. R09 corrigiu seis seletores do harness sem alterar expected.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

R08: modal comum e detalhe de fatura compartilham foco, Tab/Shift+Tab, Escape no topo e retorno em diálogos aninhados. R10 ajusta geometria e sidebar; R11 remove os quatro avisos do double. R09 foi preservado.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

R08/R11 revalidados; recortes de R10 corrigidos nos tamanhos examinados. Zoom nativo 200% segue pendência explícita do aceite AC-UI-001. Estado em_revisao mantido; viewport reduzido não certifica zoom.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).

## Tentativa dirigida de zoom — 21/09/2026

R10: zoom nativo 200% ainda sem comprovação. Chrome for Testing isolado abriu
com viewport 1424×905 a 100%, mas o controle nativo recusou o identificador da
janela após nova seleção. Nenhum ajuste de produto para contornar ferramenta;
viewport reduzido não conta como zoom. Manter aceite aberto e estado em_revisao:
[tentativa e roteiro manual](../evidencias/saneamento-CF-015-RV01/ZOOM.md).


## Candidato de saneamento RF15 — 11/10/2026

Infraestrutura de diálogo respeita Escape consumido pelo controle e continua limitando resposta à camada superior. Consumidores afetados reexercitados. Zoom nativo 200% permanece pendente por limitação técnica documentada, sem equivalência por viewport/CSS. Estado em_revisao.

[Relatório do executor, matriz, provas e encaminhamento](../evidencias/saneamento-RF15/README.md).

## Saneamento residual do executor — 12/10/2026

Resíduos do parecer cdf0060 tratados localmente: RF15-02 (ocultação imediata), RF15-04 (reatividade do dia local) e detalhes/retorno de foco CF014. Provas originais preservadas; RF15-01/RF15-03 mantêm aceites anteriores. Este registro não concede aprovação: CF010/012/013/014/015 continuam em_revisao e CF011 concluída. Zoom nativo pendente e RVA-03 inconclusivo, sem novos experimentos por ausência de condição técnica/hipótese nova.

[Relatório, matriz residual, capturas e encaminhamento](../evidencias/saneamento-residual-RF15/README.md).
