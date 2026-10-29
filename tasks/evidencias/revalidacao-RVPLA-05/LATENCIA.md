# RVPLA-05/P2 — correção da cauda, prazo ainda pendente

O contrato original observa `close` do **processo inteiro de resume B** dentro
de20s. Inclui recuperação, checagens, comandos, validação, restore, fechamento
dos guardiões e confirmação externa de ausência dos Jobs. A morte do wrapper A,
do guardião ou do comando não encerra esse orçamento. O script inteiro também
compila a fixture e prepara/interrompe A; não deve ser comparado a20s.

## Amostra prefixada, sem seleção posterior

| Execução válida | Corte solicitado pelo original | Close após interrupção | Script inteiro | Resultado |
|---|---:|---:|---:|---|
| prazo01 |20.007,952ms|22.104,721ms|45.391,459ms|Falhou |
| prazo02 |20.010,987ms|22.247,103ms|45.429,477ms|Falhou |
| prazo03 |20.009,681ms|21.963,959ms|42.037,549ms|Falhou |

São 0/3 no gate, sem aumento do prazo, retry ou descarte. Close forçado não é
término natural nem margem natural: o original interveio antes de observar a
conclusão. Os três resultados relatados pelo saneamento,16,572/17,978/16,990s,
permanecem fatos históricos conferidos; não são garantia universal nem aprovam
esta amostra posterior. Mesmo Java21/Node24.18/libuv1.52.1, fixture e código,
pastas novas, sem outra aplicação de teste concorrente durante as três medidas.
Não há captura completa de carga/CPU/I/O do host durante a amostra; a causa da
variação frente à rodada anterior não foi isolada. Não se atribui automaticamente
ao ambiente nem se afirma uma nova regressão de código a partir do agregado.

Uma observação diagnóstica posterior, limitada a60s, terminou naturalmente em
**21.167,068ms**, margem de **−1.167,068ms** para20s. Foram cinco guardiões de
comando e15 consultas nativas,11.719,181ms nestas consultas (~55% do total).
As três medidas originais cortadas já acumularam11.074–12.057ms de consultas,
ainda sem todo o ciclo. São tempos de parede instrumentados, não CPU profiling,
percentis ou SLO da aplicação; não se subtraiu overhead para aprovar o prazo.

O timer auxiliar da fotografia20s não disparou por erro do observador (`d.resume`
não está no descriptor). **Não há fotografia nativa ao vivo nesse marco.**
O trace monotônico existente, consolidado em diagnostico-no-marco20.json, mostra:
último comando fechou19.578s; sua consulta externa `closed` só retornou20.370s;
restore ocorreu20.419s; checkpoint `failed`, environment/restorationVerified
true,20.427s; fechamento de B21.167s. Antes de20s, o último estado publicado
era failed-before-completion. Não houve complete; falta de JUnit sintético não
virou prova causal. Esse trace não substitui uma fotografia nativa não capturada.

## Causa localizada e condições preservadas

O perfil gerenciado reintroduziu Environment.Exit em cópia isolada, sem sleeps
artificiais. Marcadores mostram drain-end0 e finalização já alcançada, seguidos
de caudas de **2.255–2.282ms** por guardião de comando completo. O mesmo perfil
alcançou B, excedeu20s e restaurou o helper por SHA. A mutação direta separada
parou antes da barreira wrapper.json; não foi creditada como prova de B.

No perfil nativo posterior, os guardiões de comando completos terminaram em
**9,475–12,486ms** após `Finish`. Esse perfil também falhou no gate; seu driver
não gerou a métrica agregada após timeout/consulta a PID já encerrado. Os TSV e
eventos de exit existentes permitiram medir a cauda sem repetir o experimento.
Helper restaurado por SHA. Não se apresenta esse perfil como controle20s verde.

Um B completo usa cinco comandos e um guardião de worker. A cauda de~2,25s era
paga por cada guardião gerenciado que chegava à saída. Cinco caudas desse tamanho
representariam~11,25s só nos comandos; é estimativa por etapa, pois os negativos
cortados não completaram todos os comandos. Não se inventa total natural do
negativo. A remoção causal dessa cauda foi sustentada; a latência total permanece
acima do contrato nesta revisão.

`Finish` termina somente o próprio guardião de Job nomeado, sem estado durável.
Dispensa finalizers/handlers gerenciados, preservando código de saída e espera
de drain preexistente. Isso seria inadequado para processo com commit/persistência
pendente. O controller continua esperando close e consultando ausência do Job;
nenhum certificado é cacheado. O caminho compartilhado sem Job nomeado não mudou.
[TerminateProcess](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-terminateprocess)
confirma a diferença entre término do próprio processo e solicitação assíncrona
contra outro processo, incluindo a necessidade de concluir/cancelar I/O pendente.
O perfil local não identifica qual finalizer/handler interno causava a cauda.

**Parecer: RVPLA-05/P2 aberto**, categoria C de latência no contrato vigente.
Não foi demonstrada fuga de descendente como causa dessas falhas. Contenção
segura não satisfaz capacidade de concluir no prazo. Próximo saneamento deve
perfilar consultas/lançamentos restantes, mantendo os certificados, e revalidar
o original20s com amostra prefixada. Nenhuma correção ou mudança de orçamento
foi implementada aqui;40s de startup continua independente.
