# Próximo trabalho delimitado

1. **RVPLA-05/P2: concluir o contrato20s.** A cauda gerenciada foi removida, mas
   três probes originais falharam e o diagnóstico natural terminou21,167s.
   Perfilar o custo de consultas e lançamentos restantes:15 consultas somaram
   11,719s no diagnóstico. Conservar ownership, baseline/creationCount, mutex,
   identidade, ausência externa dos Jobs e ordem de restore/complete/avanço.
   Comparar opções pequenas (lançamento/consulta, eventualmente batching ou
   observador persistente delimitado) com seus custos de ciclo de vida/estado.
   Não cachear certificados nem deixar trabalho perigoso em segundo plano para
   cumprir o número. Prefixar amostra pequena, registrar todas as execuções e
   manter20s. Se propuser outro orçamento, tratar como decisão própria, sem
   retroaprovar esta revisão. Nenhuma correção foi iniciada aqui.
2. **Fixture/observadores:** para uma futura execução integral do probe antigo,
   adotar complemento com ciclo de vida explícito, como demonstrado, preservando
   o original30s e sua falha. Medir e classificar cada ponto antes da assertion.
   Corrigir erros dos observadores em lote próprio com suas versões/falhas
   preservadas; não usar isso para apagar o timeout real de B. Captura ao vivo
   no marco20s ficou ausente nesta rodada; o trace já identifica a fase.
3. **EPERM:** mecanismo causal encerrado neste alcance. Manter slots imutáveis,
   testes negativos e audit limitado. Não é necessário identificar retrospectivamente
   um detentor que não foi capturado para aceitar a correção demonstrada.
   Eventual nova ocorrência exige captura contemporânea de handles/Win32/identidade,
   sem retry silencioso ou atribuição histórica exclusiva por inferência.
4. **TCP/HQL:** continuam lotes próprios, sem investigação ampla nesta revisão.
   Bind/reuso nativo, startup HQL e estouros40s históricos não recebem aceite por
   associação com guardiões/mailbox. Linux em Docker não certifica supervisor Linux.

RVPLA-03/04 específicos e RVPLA-01/aceites locais anteriores permanecem no alcance
demonstrado. CF017/P01/P02 e CF034 integral continuam em_revisao; expanded,
zoom nativo200%, cancelamento/configuração e gates remotos/adoção/produção pendentes.
CF035/036 continuam propostas, não iniciadas. Cenários A–D preservados: vazio sem
baseline, V1–V16; legadoV1 compatível/preflight na mesma janela, baseline1 explícita
e V2–V16; versionado com info/validate/drift e só pendências, sem baseline; desconhecido
sem DDL, diagnóstico em clone. Inventário, backup/restore, freeze e coordenação
dos consumidores reais não foram executados nem liberados. Nenhuma ação remota
ou novo trabalho de implementação decorre deste parecer.
