# Saneamento CF-015 — candidato para revalidação

Execução de 14 a 21/09/2026. Estado das tarefas: **em_revisao**. Não é aprovação
independente do marco nem autorização de publicação. CF-016 não foi iniciada.

## Base e preservação

Base inicial `eb40303`, branch `main`, staging vazio. O candidato CF-010–014
estava no working tree e foi integrado separadamente em `ad7fd81`, sem atribuir
sua implementação a este saneamento. Esse candidato reproduziu seis falhas de
componente; não se alega aprovação de commits intermediários.

O patch inicial versionado contém somente os hunks do candidato. A captura
completa original, que também continha o diff do README alheio, foi preservada
em backup local fora do commit; hashes e localização estão em
[preservacao-patch-inicial.json](preservacao-patch-inicial.json). O README não foi
incluído nem como arquivo nem como hunk de patch nos commits deste saneamento.

[base-inicial.json](base-inicial.json), [diff inicial](working-tree-inicial.patch)
e [staging do candidato](candidato-preexistente-staged.patch) permitem conferir
a separação. O README da raiz permanece fora dos commits, com o SHA-256 inicial
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
O [parecer original](../revisao-CF-015/README.md) e seus artefatos foram preservados.

## Resultado por achado

“Corrigido e verificado” abaixo é a conclusão do implementador no escopo dos
cenários indicados. O fechamento dos achados cabe à nova revisão independente.

| Achado / responsável | Critério, causa e correção | Reprodução e verificação | Resultado / limite |
|---|---|---|---|
| R06 — CF-013/008 | Categoria própria permitida; alheia/inexistente 404 sem gravação parcial. POST buscava apenas ID; cópia propagava vínculo legado. POST/PUT consultam ID+dono antes da escrita; cópia valida o fetch join antes do destino. | `backend-red.log`, `backend-propriedade-ampliado-red.log`; `CF015PlanningOwnershipTest` mantém a regressão original e acrescenta criação legítima, UUID ausente, PUT recusado e cópia própria/alheia. Suíte `backend-final.log`: 104 aprovados, incluindo os cinco testes de propriedade e cinco de edição. | Corrigido e verificado para os writers investigados. Nenhum backfill de vínculos legados ou banco real. Exige revisão de segurança. |
| R03 — CF-013 | Confirmar pagamento não confirma releitura. Erros eram absorvidos; modal fechava. Estado ready/confirmed/unknown, trava síncrona de envio e recovery somente de leitura. Fatura/cartões/contas/dashboard/planejamento são aguardados e expõem erro. Backend também recusará fechamento já PAID sob lock por cartão antes de debitar. | `componentes-inicial.log`; `backend-pagamento-red.log` reproduz duplicação/conflito; green PostgreSQL e suíte completa. Componentes reais de modal/hook/providers testam 503, perda de resposta, rejeição, duplo clique e retry sem POST. E2E real em dois fusos confirma saldo 900, um débito 100, PAID, planejamento e reload por HTTP e SQL. | Corrigido e verificado no fechamento/reconciliação cobertos. Idempotência durável por operação e adiantamentos continuam dependência explícita CF-024; resultado desconhecido não é certificado por inferência do saldo. |
| R01 — CF-014/009 | A→B→A não pode receber resposta de B. Cache retornava antes de invalidar request. Invalidação também ocorre no cache hit; guard de geração permanece além do abort. | Regressão original vermelha/verde; cenários com sucesso/erro tardio, sessão, unmount, nota e retorno ao ano. Suites em São Paulo, UTC e Kiritimati. | Corrigido e verificado. |
| R02 — CF-012/009 | 6M→1Y→6M preserva seleção/série 1300, sem aceitar 900 antigo. Mesma causa de R01; mesma primitiva de coordenação. | `cf015-chart-race.test.tsx` preservado, casos ampliados de erro/sessão/unmount e matriz de fusos. | Corrigido e verificado. |
| R05 — CF-013 | 503 não é lista/fatura vazia. A tela ignorava o erro do hook e detalhe usava zero. Erro/retry explícitos, fatura indisponível e pagamento desabilitado. | Testes tela+hook reais para 503 inicial, troca de mês e recuperação. Reintrodução dos arquivos originais em cópia isolada falha em `R05-original.log`; restauração por hashes em `regression-capability.json`. Releitura 503 também exercitada no E2E real. | Corrigido e verificado. |
| R04 — CF-014 | Texto digitado após envio não pode aparecer salvo. Ausência de identidade/versão e refetch apagavam rascunho. Versão enviada, dirty, editor estável durante refresh/erro e cache invalidado na escrita. | Regressão original; `R04-refetch-original.log`; falha/edição posterior/troca de ano. E2E retém resposta de POST real, verifica texto enviado por GET, força falha, salva versão posterior e confirma reload/SQL. | Corrigido e verificado. Rascunho não confirmado continua local; não foi criado autosave. |
| R07 — CF-011 | Refetch do mesmo usuário conserva rascunho. Efeito dependia da referência do objeto. Inicializa por abertura/identidade. | `cf015-profile-draft.test.tsx` preservado; teste ampliado de cancelar/reabrir/trocar identidade. | Corrigido e verificado. |
| R08 — CF-013/010 | Foco entra, Tab/Shift+Tab ficam no topo, Escape fecha só filho, foco retorna a controle operável. Diálogo próprio não implementava isso. Hook compartilhado e portal. | Regressão original + modal filho em componente; navegador com fatura longa nas três larguras e pagamento real cujo acionador passa a disabled. | Corrigido e verificado no Chromium e componentes. Sem certificação com leitor de tela físico. |
| R10 — CF-010/012/013 | Sidebar/grades ativavam juntas em 768px, recortando totais/ações. Breakpoint fixo em 1280px, grades adaptáveis, quebra de cabeçalhos/valores. Valores extensos revelaram recorte adicional do extrato recente/eixo, corrigido com quebra de linha e rótulo compacto; tooltip mantém valor integral. | Capturas antes/depois em 360/768/1440, claro/escuro, nomes longos, R$ 123.456.789,12 e 12 compras. Geometria observa valor e contêiner, além da largura do documento. Ver `VISUAL.md`. | Corrigido e verificado nas capturas inspecionadas. Zoom nativo 200% pendente; não equivale ao viewport de 180px. |
| R12 — CF-012 | Ação mobile precisa de nome acessível. Plus não tinha nome. `aria-label="Novo lançamento"`. | Baseline navegador falha; teste original preserva exigência de nome e passa. Roteiro abre o modal pelo nome. | Corrigido e verificado. |
| R11 — CF-010 | Quatro bindings não usados no double de animação introduziam avisos. Filtro sem bindings descartados. | Comparação no mesmo escopo: 31 erros/30 avisos → 31 erros/26 avisos; zero diagnóstico novo. `lint-comparacao.json`. | Corrigido e verificado; lint global continua reprovado pela dívida CF-026. |
| R09 — CF-010/007 | Seletores semânticos já corrigidos na revisão. | Arquivo temporal/expected originais preservados; jornada integrada e SQL/Excel reexecutados. | Correção anterior preservada e revalidada. |

## Evidências e engenharia

- [Decisões, custo, concorrência e riscos](DECISOES.md).
- [Comandos, resultados e tentativas](EXECUCOES.md).
- [Inspeção visual e limites](VISUAL.md).
- [Commits e intervalo exato para revisão](COMMITS.md).
- [Comparação de lint](lint-comparacao.json) e [capacidade das regressões](regression-capability.json).

São 131 testes de componente, seis unitários e 104 testes Java aprovados no
estado final das respectivas camadas; TypeScript e build de produção aprovados.
A matriz integrada compreende 16 testes Playwright e uma verificação Java de
persistência SQL/exportação. Resultados e versão exata encontram-se em EXECUCOES
e COMMITS; logs vermelhos e tentativas intermediárias não foram apagados.

## Lacunas e gates

Prontidão para nova revisão: candidato organizado, regressões e evidências
reproduzíveis. Recomenda-se revalidação independente com prioridade R06 e R03,
seguida de corridas/rascunhos e geometria/foco. Não basta ler este relatório.

Aprovação do marco frontend: **não concedida por esta execução**. O revisor deve
confirmar os encerramentos e decidir explicitamente sobre a pendência de zoom
nativo e os limites registrados. Leitor de tela físico, todos os navegadores,
matriz cartesiana de privacidade/temas/dados e carga concorrente ampla não foram
certificados.

Prontidão para publicação: **não demonstrada**. P01/P02 conservam adoção temporal
pendente em CF-017; origem legada, migração, backup/restore e rollout não são
certificados por schema sintético. CF-019/024 conserva idempotência mais ampla;
F-018/CF-021 e dívida geral CF-026 permanecem fora do lote. Nenhuma migração real,
push, deploy ou avanço para CF-016 foi executado.
