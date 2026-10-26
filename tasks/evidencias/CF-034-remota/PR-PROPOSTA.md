# PR preparada

Destino: https://github.com/kaiqueGeraldo/controle-financeiro
Base `main`, origem `codex/cf034-ci-local`, sem auto-merge.

Título: CF-034: publicar gates aprovados e validar CI remota sem deploy

Corpo:

O lote aprovado até 4d20fb0 consolida os gates de frontend, PostgreSQL descartável,
E2E e pacote rastreável. O aceite local independente da DEC-CI-04 e RCI034-01/R1
permanece preservado; esta PR valida separadamente Actions/Linux, artifacts,
contraprovas e cancelamento.

A preparação operacional acrescenta proveniência e probes sintéticos e impede
deploy Vercel somente da branch codex/cf034-ci-local. Railway acompanha apenas
main e seus ambientes de PR estão desativados. Nenhum secret, banco real ou
infraestrutura de produção foi alterado.

A integração na main está pendente da separação explícita dos gatilhos de
produção: Railway Wait for CI desligado e Vercel main com autoassign sem
Deployment Checks. Não habilitar auto-merge nem integrar antes dos gates e dessa
decisão. CF-034 integral continua em_revisao. Zoom200%, Ctrl+C nativo, matriz
ampliada histórica, adoção CF017/P01/P02 e produção mantêm seus limites.

12 contratos Node locais aprovados, sem skips; contraprovas sintéticas
detectadas/restauradas; YAML e escopo Vercel conferidos. Matriz, inspeções e
resultados por SHA/run/artifact em tasks/evidencias/CF-034-remota/.
